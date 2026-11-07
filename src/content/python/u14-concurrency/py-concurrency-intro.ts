import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-concurrency-intro',
  title: 'Concurrency, Parallelism and the GIL',
  summary: 'Doing more than one thing at a time: concurrency vs parallelism, I/O-bound vs CPU-bound work, race conditions (simulated safely), what the Global Interpreter Lock really does, free-threaded Python, and how Amdahl’s law limits speedups.',
  minutes: 20,
  objectives: [
    'Distinguish concurrency from parallelism and I/O-bound from CPU-bound work',
    'Explain with a deterministic simulation how interleaving causes a lost-update race condition',
    'Describe what the GIL protects, what it doesn’t, and which workloads threads speed up',
    'Choose between threads, processes, asyncio and vectorized libraries for a given problem',
    'Use Amdahl’s law to estimate the best-case speedup from adding workers',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Concurrency, parallelism, and the two kinds of slow',
      blocks: [
        {
          type: 'p',
          text: 'Programs are often slow for one of two very different reasons, and the fix depends on which. A program is **[[io-bound]]** when it mostly *waits*: for a web server, a file, a database, a player’s input. It is **[[cpu-bound]]** when it mostly *computes*: simulating physics, processing images, running a neural network. Two ideas help. **[[concurrency|Concurrency]]** is structuring a program as several tasks that make progress in overlapping time — one cook juggling three dishes, starting the soup, chopping while it simmers. **[[parallelism|Parallelism]]** is literally running at the same instant on several CPU cores — three cooks, one dish each.',
        },
        {
          type: 'table',
          caption: 'Which kind of work benefits from what',
          headers: ['Kind of work', 'Example in a game or AI project', 'What helps'],
          rows: [
            ['I/O-bound (waiting)', 'Downloading assets, calling a model API, reading save files', 'Concurrency: threads or asyncio overlap the waits'],
            ['CPU-bound (computing)', 'Pathfinding for 1000 agents, data preprocessing, simulation steps', 'Parallelism: several processes, or compiled libraries such as NumPy and PyTorch'],
            ['Many tiny numeric operations', 'Matrix math, image filters, neural-network layers', 'Vectorization and the GPU, not Python-level concurrency'],
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother?',
          text: 'Waiting wastes the computer: while one download is in flight the CPU could be doing useful work, and while one core computes, three others sit idle. A responsive game keeps rendering while it loads the next level; a training pipeline keeps the GPU busy while the next batch is prepared. Concurrency is how programs stay responsive, and parallelism is how they use modern multi-core hardware.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'In C++ threads run truly in parallel on all cores, and the programmer is responsible for synchronizing access to shared data (mutexes, atomics). Python offers the same building blocks (`threading`, `multiprocessing`, `asyncio`), but the standard interpreter adds a twist, the **GIL**, that stops plain Python threads from using several cores for computation. Choosing the right tool is half the battle, which is why this unit starts with concepts.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Running the examples',
          text: 'This unit’s thread, process and asyncio examples need a full Python on your computer, so they are marked **Run on your PC** and show sample output (the in-app Python runs inside a sandbox that can’t start threads or processes). Everything marked with a Run button, and all the exercises, work right here in the app.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A script downloads 200 small files one after another and spends almost all its time waiting for the network. What kind of problem is it, and what helps?',
      options: [
        { text: 'I/O-bound: overlapping the waits with threads or asyncio helps a lot', correct: true, why: 'While one download waits for the network, the program can start others. The CPU is not the bottleneck, so concurrency pays off.' },
        { text: 'CPU-bound: it needs more processor cores', why: 'The processor is idle most of the time here. Adding cores would not shorten the waiting.' },
        { text: 'Memory-bound: it needs to store the files in a list first', why: 'Nothing in the description suggests a memory shortage; the time is spent waiting on the network.' },
        { text: 'Neither: nothing can make waiting faster', why: 'You can’t speed up a single network wait, but you can overlap many waits, which cuts the total time dramatically.' },
      ],
      explanation: 'Waiting on the network is I/O-bound work. Because the CPU is idle during each wait, running the downloads concurrently (threads or `asyncio`) overlaps the waits and shortens the total time.',
    },
    {
      kind: 'concept',
      title: 'Race conditions: lost updates (simulated)',
      blocks: [
        {
          type: 'p',
          text: 'Whenever tasks share data and can be interrupted, **order of execution matters**. The classic bug is the **[[race-condition|race condition]]**: two tasks read the same value, both update their private copy, and both write back, so one update vanishes. You saw in the last unit that `counter += 1` is three steps (load, add, store). Real threads are switched at unpredictable moments, which makes races hard to reproduce, so here we **simulate** the switching with generators: every `yield` is a point where the "scheduler" may switch tasks. The result is the same bug, but completely deterministic.',
        },
        {
          type: 'code',
          title: 'lost_update.py',
          runnable: true,
          code: `def increment(shared, name, log):
    local = shared["n"]
    yield
    shared["n"] = local + 1
    log.append(name)


def run(*tasks):
    tasks = list(tasks)
    while tasks:
        for task in tasks[:]:
            try:
                next(task)
            except StopIteration:
                tasks.remove(task)


shared = {"n": 0}
log = []
run(increment(shared, "A", log), increment(shared, "B", log))
print(shared["n"], log)

shared = {"n": 0}
log = []
run(increment(shared, "A", log))
run(increment(shared, "B", log))
print(shared["n"], log)`,
          output: `1 ['A', 'B']
2 ['A', 'B']`,
          annotations: [
            { lines: '1-5', text: 'A task that adds one to a shared counter in separate steps: **read** the value into a local variable, then (after the `yield`, where a switch may happen) **write** `local + 1` back.' },
            { lines: 3, text: 'The `yield` marks a possible context switch. Real threads can switch between any two bytecode instructions; this makes the danger visible.' },
            { lines: '8-15', text: 'A tiny round-robin "scheduler": it advances each task one step at a time until all are finished. This is the essence of an event loop.' },
            { lines: '18-21', text: 'Run A and B **interleaved**. Both read `0`, both write `1`. Two increments, yet the counter is 1 — a lost update.' },
            { lines: '23-27', text: 'Run them one after the other (no interleaving) and the answer is correct: 2. The bug exists only because the steps overlapped.' },
          ],
        },
        {
          type: 'p',
          text: 'The fix is to make the read–modify–write a **critical section** that only one task may be inside at a time, using a **[[lock]]** (`threading.Lock`), or to avoid sharing: give each task its own data and combine the results afterwards, or send data between tasks through a thread-safe `queue.Queue`. You will practise all three in the next lessons.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Races are timing bugs',
          text: 'A race may appear once in a million runs, only on a faster machine, or only under load, so "it worked when I tested it" proves nothing. Treat any data shared between threads as dangerous until protected, prefer designs that share nothing, and never "fix" a race with `time.sleep`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Deterministic simulation is a testing tool',
          text: 'Exactly what you just did — replacing real threads by generators or fake clocks that you step by hand — is how professionals test concurrent logic: the interleaving is chosen by the test, so the bug reproduces every time. Tools like `asyncio` (a real event loop) use the same idea of cooperative switching at `await` points.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because of the GIL, two threads in pure Python code can never cause a race condition.',
      answer: false,
      explanation: 'False. The GIL protects the interpreter’s own data structures, but a thread can be switched out between any two bytecode instructions, so multi-step operations such as `counter += 1` (load, add, store) can still interleave and lose updates. Shared data needs locks, queues or a design that shares nothing.',
    },
    {
      kind: 'concept',
      title: 'The GIL, and what threads can and can’t do',
      blocks: [
        {
          type: 'p',
          text: 'The **[[gil|Global Interpreter Lock]]** is a mutex inside CPython: only the thread holding it may execute Python bytecode, so in a standard build **only one thread runs Python code at any moment**. It exists because CPython’s memory management ([[reference-counting|reference counting]]) is not thread-safe, and one big lock is a simple, fast solution for single-threaded code and C extensions. Its effect depends on the kind of work. For **CPU-bound pure-Python code**, threads give no speedup (and add switching overhead). For **I/O-bound code**, threads help a lot, because a thread *releases* the GIL while it waits for the network, disk or `time.sleep`. Many C libraries — NumPy, PyTorch, image codecs — also release the GIL during heavy computation.',
        },
        {
          type: 'code',
          title: 'gil_effect.py',
          desktopOnly: true,
          code: `import threading
import time

def cpu_job():
    total = 0
    for i in range(1_500_000):
        total += i * i
    return total

def io_job():
    time.sleep(0.25)

def serial(job, k=4):
    for _ in range(k):
        job()

def threaded(job, k=4):
    threads = [threading.Thread(target=job) for _ in range(k)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

def timed(fn, job):
    start = time.perf_counter()
    fn(job)
    return time.perf_counter() - start

cpu_ratio = timed(threaded, cpu_job) / timed(serial, cpu_job)
io_ratio = timed(threaded, io_job) / timed(serial, io_job)
print(f"CPU-bound: threads take {cpu_ratio:.1f}x the serial time")
print(f"I/O-bound: threads take {io_ratio:.1f}x the serial time")`,
          output: `CPU-bound: threads take 1.1x the serial time
I/O-bound: threads take 0.3x the serial time`,
          annotations: [
            { lines: '4-8', text: 'A CPU-bound job: pure-Python arithmetic. It holds the GIL the whole time it runs.' },
            { lines: '10-11', text: 'An I/O-bound job, simulated with `sleep`. Sleeping (like waiting for a network reply) releases the GIL.' },
            { lines: '13-15', text: 'Run a job `k` times, one after another.' },
            { lines: '17-22', text: 'Run the job in `k` threads: create them, `start()` them all, then `join()` (wait for) each one.' },
            { lines: '24-27', text: 'A small stopwatch around any of these runners.' },
            { lines: 29, text: 'CPU-bound: four threads take about as long as running serially (here 1.1 times — slightly *worse* because of switching). No speedup.' },
            { lines: 30, text: 'I/O-bound: the four 0.25 s waits overlap, so the total is about a quarter of the serial time. Sample output; yours will vary.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Free-threaded Python',
          text: 'Python 3.13 introduced an optional **free-threaded build** (`python3.13t`) without the GIL, and from Python 3.14 it is officially supported (PEP 779), although the standard build still has the GIL by default. In a free-threaded build CPU-bound threads *can* run in parallel — but your own data is no longer protected by the GIL’s accidental serialization, so correct locking matters even more, and some packages don’t support it yet. Check with `sys._is_gil_enabled()`. For now, the portable ways to use several cores are **processes** and compiled libraries.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'A 30-year-old design choice',
          text: 'The GIL dates from the early 1990s, when most computers had one CPU and a simple lock made the interpreter and its C extensions easy to write and fast. Attempts to remove it ("free threading") repeatedly cost single-thread speed, until a long redesign (PEP 703, accepted in 2023) found a way to make it optional. It is a good example of the trade-offs in language design: simplicity and speed now vs. parallelism later.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does the GIL do?" (one thread runs Python bytecode at a time); "Do threads speed up CPU-bound pure-Python code?" (no); "Do they speed up I/O-bound code?" (yes — the GIL is released while waiting); "How do you use multiple cores in standard CPython?" (multiple processes, or libraries that release the GIL).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Amdahl’s law gives the best speedup when a fraction `p` of a program can be parallelized over `n` workers. Complete the function.',
      template: `def amdahl(p, n):
    return 1 / ((1 - ___) + ___ / n)`,
      templateIsCode: true,
      blanks: [{ answers: ['p'] }, { answers: ['p'] }],
      wordBank: ['p', 'n', '1', 'speedup'],
      explanation: 'The serial part `1 - p` never gets faster, and the parallel part `p` is divided among `n` workers, so the new running time is `(1 - p) + p / n` of the original, and the speedup is its reciprocal.',
    },
    {
      kind: 'concept',
      title: 'Choosing a tool, and the limit on speedups',
      blocks: [
        {
          type: 'p',
          text: 'Putting it together gives a decision guide. **Waiting on many I/O operations** → threads (`concurrent.futures.ThreadPoolExecutor`, simple) or `asyncio` (thousands of connections, one thread). **Heavy pure-Python computation** → processes (`multiprocessing`, `ProcessPoolExecutor`). **Numeric work** → vectorize with NumPy/PyTorch, which run in compiled code (and release the GIL), and use the GPU. **Reducing the work itself** — a better algorithm or data structure — is always the first thing to try, because it needs no concurrency at all.',
        },
        {
          type: 'p',
          text: 'Even when you can parallelize, there is a hard limit. If a fraction `p` of the work can be spread across `n` workers and the rest (`1 - p`) is stuck being serial, the speedup is **Amdahl’s law**:',
        },
        {
          type: 'math',
          tex: 'S(n) = \\frac{1}{(1 - p) + \\frac{p}{n}}',
          caption: 'The best-case speedup with n workers when a fraction p of the work is parallelizable. As n grows, S approaches 1/(1 - p).',
        },
        {
          type: 'code',
          title: 'amdahl.py',
          runnable: true,
          code: `def amdahl(p, n):
    return 1 / ((1 - p) + p / n)

for n in (1, 2, 4, 8, 1000):
    print(n, round(amdahl(0.9, n), 2))`,
          output: `1 1.0
2 1.82
4 3.08
8 4.71
1000 9.91`,
          annotations: [
            { lines: '1-2', text: 'The formula as a function: `p` is the parallelizable fraction (here 90%), `n` the number of workers.' },
            { lines: '4-5', text: 'Even though 90% of the work is parallel, 8 workers give only 4.7 times, and 1000 workers barely reach 10 times: the 10% serial part dominates. The ceiling is `1 / (1 - 0.9) = 10`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Measure, then parallelize the right part',
          text: 'Amdahl’s law says: speed up the serial part first. If loading data takes 40% of your run and training 60%, parallelizing training alone can never beat 2.5 times faster. Profile to find what dominates (Unit 15), fix algorithms before adding workers, and remember that processes cost memory and startup time, and that real programs also pay for communication between workers.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'In games and AI',
          text: 'PyTorch’s `DataLoader(num_workers=4)` uses **processes** to prepare batches while the GPU trains (overlapping I/O and CPU work); reinforcement-learning libraries run many environments in parallel processes to collect experience faster; game servers use `asyncio` to serve thousands of mostly-idle connections in one thread. Each choice follows the guide above.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Three tasks each read the counter before any of them writes.',
      code: `def inc(shared):
    local = shared["n"]
    yield
    shared["n"] = local + 1

def run(*tasks):
    tasks = list(tasks)
    while tasks:
        for task in tasks[:]:
            try:
                next(task)
            except StopIteration:
                tasks.remove(task)

shared = {"n": 0}
run(inc(shared), inc(shared), inc(shared))
print(shared["n"])`,
      answer: '1',
      hint: 'In the first round every task reads 0 and stops at the `yield`. Only then do they write.',
      explanation: 'The scheduler advances each task to its `yield` first, so all three read 0. In the second round each writes `0 + 1`. Three increments, one visible result: 1. Run sequentially the answer would be 3.',
    },
    {
      kind: 'error',
      prompt: '`amdahl(0.9, 4)` should return about 3.08, but this version returns a value far below 1. Tap the faulty line.',
      lines: [
        'def amdahl(p, n):',
        '    serial = 1 - p',
        '    parallel = p * n',
        '    return 1 / (serial + parallel)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The parallel part is *divided* among the workers: `parallel = p / n`. Multiplying makes it grow with more workers, so the "speedup" collapses (0.28 for `p=0.9, n=4`). The serial part stays `1 - p`.',
    },
    {
      kind: 'numeric',
      prompt: 'A program is 75% parallelizable (`p = 0.75`). By Amdahl’s law, what speedup do you get with 3 workers? Use S = 1 / ((1 - p) + p / n).',
      answer: '2',
      hint: '`(1 - 0.75) + 0.75 / 3 = 0.25 + 0.25`.',
      explanation: 'The serial part is 0.25 and the parallel part shrinks to 0.75 / 3 = 0.25, so the new running time is 0.5 of the original and the speedup is 1 / 0.5 = 2. Even infinitely many workers could never beat 1 / 0.25 = 4.',
      label: 'Speedup:',
    },
    {
      kind: 'code',
      prompt: 'Write `amdahl(p, n)` returning the best-case speedup `1 / ((1 - p) + p / n)`. Raise `ValueError` if `p` is not between 0 and 1 (inclusive) or if `n` is less than 1.',
      starter: `def amdahl(p, n):
    ...
`,
      solution: `def amdahl(p, n):
    if not 0 <= p <= 1:
        raise ValueError("p must be between 0 and 1")
    if n < 1:
        raise ValueError("n must be at least 1")
    return 1 / ((1 - p) + p / n)
`,
      tests: `assert amdahl(0.9, 1) == 1.0
assert round(amdahl(0.9, 4), 2) == 3.08
assert round(amdahl(0.5, 2), 4) == 1.3333
assert amdahl(1, 8) == 8
assert amdahl(0, 100) == 1
assert round(amdahl(0.75, 3), 6) == 2.0

for bad in ((-0.1, 2), (1.1, 2), (0.5, 0), (0.5, -3)):
    try:
        amdahl(*bad)
        assert False, f"{bad} should raise ValueError"
    except ValueError:
        pass`,
      checks: ['Returns \`1 / ((1 - p) + p / n)\`', 'Rejects \`p\` outside 0..1 with \`ValueError\`', 'Rejects \`n < 1\` with \`ValueError\`'],
      hint: 'Validate first: `if not 0 <= p <= 1: raise ValueError(...)` and `if n < 1: raise ValueError(...)`. Then return the formula.',
      explanation: 'The boundary cases match intuition: with `p = 0` nothing can be parallelized (speedup 1 regardless of workers), and with `p = 1` the speedup equals the number of workers. Validating the arguments up front gives a clear error instead of nonsense results.',
    },
    {
      kind: 'code',
      prompt: 'Write `round_robin(*gens)`, a miniature scheduler. It receives generators and advances them in turns, one `next()` per generator per round, in the order given. Collect every yielded value in a list. A generator that finishes is dropped. Return the list.',
      starter: `def round_robin(*gens):
    ...
`,
      solution: `def round_robin(*gens):
    active = list(gens)
    out = []
    while active:
        for gen in active[:]:
            try:
                out.append(next(gen))
            except StopIteration:
                active.remove(gen)
    return out
`,
      tests: `def counter(name, k):
    for i in range(1, k + 1):
        yield f"{name}{i}"

assert round_robin(counter("A", 3), counter("B", 1)) == ["A1", "B1", "A2", "A3"]
assert round_robin(counter("A", 2), counter("B", 2), counter("C", 2)) == ["A1", "B1", "C1", "A2", "B2", "C2"]
assert round_robin() == []
assert round_robin(counter("A", 0)) == []
assert round_robin(counter("X", 2)) == ["X1", "X2"]
assert round_robin(counter("A", 1), counter("B", 3)) == ["A1", "B1", "B2", "B3"]`,
      checks: ['Advances each active generator once per round, in order', 'Collects yielded values and drops finished generators', 'Works with zero generators or empty generators'],
      hint: 'Keep a list `active` of generators. While it is not empty, loop over a *copy* (`active[:]`), call `next(gen)` and append the value; on `StopIteration` remove the generator from `active`.',
      explanation: 'This is the core of every cooperative scheduler, including `asyncio`’s event loop: each task runs until it yields control, then the next one gets a turn. Iterating over a copy (`active[:]`) lets you remove finished generators safely while looping.',
    },
    {
      kind: 'code',
      prompt: 'The function `amdahl(p, n)` is provided. Write `workers_needed(p, target)`: the smallest whole number of workers `n >= 1` for which the speedup is at least `target`. Return `1` if `target <= 1`, and `None` if the target can never be reached (when `p < 1` and `target >= 1 / (1 - p)`).',
      starter: `def amdahl(p, n):
    return 1 / ((1 - p) + p / n)

def workers_needed(p, target):
    ...
`,
      solution: `def amdahl(p, n):
    return 1 / ((1 - p) + p / n)


def workers_needed(p, target):
    if target <= 1:
        return 1
    if p < 1 and target >= 1 / (1 - p):
        return None
    n = 1
    while amdahl(p, n) < target - 1e-9:
        n += 1
    return n
`,
      tests: `assert workers_needed(0.9, 3) == 4
assert workers_needed(0.9, 5) == 9
assert workers_needed(0.5, 1.5) == 3
assert workers_needed(0.5, 2) is None
assert workers_needed(0.9, 11) is None
assert workers_needed(1, 4) == 4
assert workers_needed(1, 2.5) == 3
assert workers_needed(0.3, 1) == 1
assert workers_needed(0, 1.5) is None
assert workers_needed(0.9, 0.5) == 1`,
      checks: ['Returns 1 when the target is 1 or less', 'Returns \`None\` when the target is at or above the Amdahl limit', 'Otherwise returns the smallest \`n\` whose speedup reaches the target'],
      hint: 'Handle the two special cases first. Then count `n` upward from 1 until `amdahl(p, n)` reaches the target. A tiny tolerance (`- 1e-9`) avoids floating-point surprises.',
      explanation: 'The ceiling `1 / (1 - p)` is the speedup with infinitely many workers, so a target at or above it is unreachable. For reachable targets the speedup grows with `n`, so the first `n` that reaches it is the answer. Notice the diminishing returns: 4 workers give 3.08 times, but getting to 5 times needs 9.',
    },
  ],
  takeaways: [
    '**Concurrency** is overlapping tasks (one cook juggling), **parallelism** is running at the same instant on several cores. I/O-bound work (waiting) benefits from concurrency; CPU-bound work (computing) needs parallelism or compiled libraries.',
    'Shared data plus interruption causes **race conditions** such as lost updates (`counter += 1` is load, add, store). Fix them with locks, queues or by sharing nothing — and test them with deterministic simulations.',
    'The **GIL** lets one thread run Python bytecode at a time: threads don’t speed up CPU-bound pure Python but do speed up I/O-bound work, since waiting releases the GIL. It doesn’t make your multi-step operations atomic.',
    'To use many cores in standard CPython use processes or libraries that release the GIL (NumPy, PyTorch). Free-threaded builds (optional since 3.13, supported in 3.14) remove the GIL but make correct locking more important.',
    '**Amdahl’s law**: with parallel fraction `p`, speedup is `1 / ((1 - p) + p / n)` and can never exceed `1 / (1 - p)`. Shrink the serial part and fix algorithms first.',
  ],
  reading: [
    { title: 'Python Glossary — global interpreter lock', url: 'https://docs.python.org/3/glossary.html#term-global-interpreter-lock', source: 'docs', note: 'The official definition of the GIL and when it is released.' },
    { title: 'PEP 703 — Making the Global Interpreter Lock Optional in CPython', url: 'https://peps.python.org/pep-0703/', source: 'pep', note: 'The accepted proposal behind free-threaded Python, with the history of earlier attempts.' },
    { title: 'Python support for free threading', url: 'https://docs.python.org/3/howto/free-threading-python.html', source: 'docs', note: 'How to install and use the free-threaded build and what to watch for.' },
    { title: 'Concurrency vs. parallelism — Rob Pike, "Concurrency is not parallelism"', url: 'https://go.dev/blog/waza-talk', source: 'article', note: 'The classic short talk that separates the two ideas (examples are in Go, the ideas are universal).' },
    { title: 'Amdahl’s law', url: 'https://en.wikipedia.org/wiki/Amdahl%27s_law', source: 'wikipedia', note: 'The derivation, the graph of diminishing returns, and its sibling Gustafson’s law.' },
  ],
};
