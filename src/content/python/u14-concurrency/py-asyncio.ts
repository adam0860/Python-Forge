import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-asyncio',
  title: 'async and await with asyncio',
  summary: 'Single-threaded concurrency for waiting-heavy programs: coroutines, `await`, how an event loop switches between tasks, `gather`, tasks, timeouts, `TaskGroup`, the blocking-call trap, and `async with` / `async for`.',
  minutes: 20,
  objectives: [
    'Explain what `async def`, `await` and a coroutine object are, and why calling an async function does not run it',
    'Describe how an event loop interleaves tasks cooperatively in one thread, and build a tiny one yourself',
    'Run many waits concurrently with `asyncio.gather`, `create_task`, `TaskGroup` and `timeout`',
    'Recognize why one blocking call freezes every task, and how `asyncio.to_thread` avoids it',
    'Use `async with`, `async for` and async generators, and choose between asyncio, threads and processes',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Coroutines: functions that can pause',
      blocks: [
        {
          type: 'p',
          text: 'Threads and processes let the operating system juggle tasks. **`asyncio`** takes a different route: your own code says *where* it can pause. A function declared with `async def` is a **[[coroutine]]** function. Calling it does **not** run the body — it returns a coroutine object, a paused computation. Inside an `async def`, the keyword `await` means "pause me here until this **[[awaitable]]** has its result, and let something else run meanwhile". Something has to drive the coroutine forward: normally the event loop, but you can do it by hand with `send(None)`, which is exactly what the loop does under the hood.',
        },
        {
          type: 'code',
          title: 'coroutine_object.py',
          runnable: true,
          code: `async def greet(name):
    return f"hi {name}"

coro = greet("Ada")
print(type(coro).__name__)
try:
    coro.send(None)
except StopIteration as stop:
    print(stop.value)`,
          output: `coroutine
hi Ada`,
          annotations: [
            { lines: '1-2', text: '`async def` defines a coroutine function. Its body is ordinary code, but it is allowed to use `await`.' },
            { lines: 4, text: 'Calling it only **creates** a coroutine object. Nothing in the body has executed yet — no `return` happened.' },
            { lines: 5, text: 'The type is `coroutine`: a paused function waiting to be driven.' },
            { lines: '6-9', text: '`send(None)` starts the body. It runs to the first real pause or to the end. When a coroutine finishes it raises `StopIteration`, and its return value is stored in `stop.value`. An event loop does this for you for every task.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Forgetting await',
          text: 'Writing `greet("Ada")` instead of `await greet("Ada")` creates a coroutine and throws it away; Python warns **"coroutine ... was never awaited"** and the work silently never happens. It is the most common asyncio bug. If a value you expected turns out to be a coroutine object, you forgot an `await`.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Coroutines are generators in disguise',
          text: 'Before `async`/`await` existed, coroutines were written as generators using `yield`. Under the hood a coroutine still is a resumable frame like a generator: `await x` behaves like `yield from x`, and the event loop calls `send` on it. This is why the scheduler you will build in a moment is only a dozen lines long.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Given `async def fetch(): return 42`, what does the bare expression `fetch()` (without `await`) evaluate to?',
      options: [
        { text: 'A coroutine object; the body has not run yet', correct: true, why: 'Calling an `async def` function only builds the coroutine. The body runs when it is awaited or scheduled on an event loop.' },
        { text: 'The integer 42', why: 'That is what `await fetch()` produces. A plain call runs none of the body, so there is no 42 yet.' },
        { text: 'A thread that is already computing the answer', why: 'asyncio does not create threads for coroutines. The object is just a paused computation in the current thread.' },
        { text: '`None`, because `fetch` has no `print`', why: 'Not `None`: the call returns a coroutine object immediately, regardless of what the body would eventually return.' },
      ],
      explanation: 'An `async def` call returns a coroutine object — a paused function. Its result only appears when something awaits it or an event loop runs it.',
    },
    {
      kind: 'concept',
      title: 'The event loop: cooperative multitasking in one thread',
      blocks: [
        {
          type: 'p',
          text: 'The **[[event-loop]]** keeps a queue of ready coroutines. It takes one, runs it until it reaches an `await` that has to wait (for a timer, a network reply, a file…), then parks it and runs the next ready one. When the waited-for thing is ready, the parked coroutine goes back in the queue. Everything happens in **one thread**, and switches occur only at `await` — this is **[[cooperative-multitasking]]**. Nothing can interrupt a coroutine in the middle of a line, which removes most race conditions of threads; the price is that a coroutine that never awaits hogs the loop.',
        },
        {
          type: 'p',
          text: 'To see that there is no magic, here is a complete toy scheduler. `pause()` is a tiny awaitable that suspends the current coroutine once; `run` repeatedly takes the next coroutine, advances it one step, and puts it back at the end of the queue unless it has finished.',
        },
        {
          type: 'code',
          title: 'mini_loop.py',
          runnable: true,
          code: `from collections import deque
from types import coroutine

@coroutine
def pause():
    yield

async def worker(name, steps, log):
    for i in range(steps):
        log.append(f"{name}{i}")
        await pause()

def run(coros):
    ready = deque(coros)
    while ready:
        task = ready.popleft()
        try:
            task.send(None)
        except StopIteration:
            continue
        ready.append(task)

log = []
run([worker("A", 3, log), worker("B", 2, log)])
print(log)`,
          output: `['A0', 'B0', 'A1', 'B1', 'A2']`,
          annotations: [
            { lines: '4-6', text: '`pause()` is a generator-based awaitable. Its single `yield` hands control back to whoever called `send`: the scheduler.' },
            { lines: '8-11', text: 'A coroutine that does a little work, then politely pauses with `await pause()`, three times for A and twice for B.' },
            { lines: '13-21', text: 'The whole event loop: pop a task, advance it one step with `send(None)`. If it raised `StopIteration` it is done and is dropped; otherwise it goes to the back of the queue so the others get a turn.' },
            { lines: '24', text: 'Two coroutines are created and handed to the scheduler. Neither has started yet.' },
            { lines: 25, text: 'The log shows the interleaving: A and B alternate, then A finishes alone. Real `asyncio` loops do the same, except that tasks wait on timers and sockets instead of `pause()`.' },
          ],
        },
        {
          type: 'p',
          text: 'The real thing is `asyncio.run(main())`, which creates a loop, runs `main()` as the first task and closes the loop at the end. Its payoff is waiting: while one task waits for the network, the loop runs the others, so three one-second waits take about one second, not three. (The in-app Python can’t run a real event loop, so this program is marked as desktop-only — run it with Python on your PC.)',
        },
        {
          type: 'code',
          title: 'gather_demo.py',
          desktopOnly: true,
          code: `import asyncio
import time

async def fetch(name, delay):
    await asyncio.sleep(delay)
    return f"{name} done"

async def main():
    start = time.perf_counter()
    results = await asyncio.gather(fetch("a", 0.2), fetch("b", 0.2), fetch("c", 0.2))
    elapsed = time.perf_counter() - start
    print(results)
    print(f"{elapsed:.1f}s")

asyncio.run(main())`,
          output: `['a done', 'b done', 'c done']
0.2s`,
          annotations: [
            { lines: '4-6', text: 'A stand-in for a network request: `await asyncio.sleep(delay)` pauses this coroutine and lets the loop run others. (Never use `time.sleep` here — see the next step.)' },
            { lines: 10, text: '`asyncio.gather` wraps each coroutine in a task, runs them all concurrently and returns their results **in the order given**. Three 0.2 s waits overlap.' },
            { lines: '12-13', text: 'The results arrive together, and the elapsed time is about 0.2 s — the longest single wait — not 0.6 s.' },
            { lines: 15, text: '`asyncio.run` is the entry point: it starts the event loop, runs `main()` until it finishes, and tidies up. Call it once, from ordinary (non-async) code.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why asyncio exists',
          text: 'Programs that wait a lot — web servers with thousands of open connections, chat and game servers, bots, scrapers, anything calling remote APIs — spend nearly all their time idle. A thread per connection costs memory and switching time; a coroutine costs a few hundred bytes. asyncio lets one thread serve thousands of waiting tasks. It does **not** speed up computation: for **[[cpu-bound]]** work use processes.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because `asyncio` runs tasks concurrently, a long pure-Python calculation inside one coroutine will not delay the other tasks.',
      answer: false,
      explanation: 'False. There is only one thread and tasks switch only at `await`. A coroutine busy computing never gives control back, so every other task waits until it finishes. Offload heavy computation to a process pool (or a thread for blocking calls).',
    },
    {
      kind: 'concept',
      title: 'Tasks, timeouts and the blocking trap',
      blocks: [
        {
          type: 'p',
          text: '`await coro()` runs a coroutine to completion before continuing — sequential. To start something in the background, wrap it in an **[[async-task]]** with `asyncio.create_task(coro)`: the loop begins running it at the next opportunity and you `await` the task later for its result. `asyncio.gather` does this for several coroutines at once. Python 3.11 added the safer **`asyncio.TaskGroup`**: all tasks started inside an `async with` block are awaited when it exits, and if one fails, the others are cancelled. `asyncio.timeout(seconds)` cancels whatever is inside after the deadline and raises `TimeoutError`.',
        },
        {
          type: 'code',
          title: 'tasks_and_timeouts.py',
          desktopOnly: true,
          code: `import asyncio
import time

async def slow(name):
    await asyncio.sleep(1)
    return name

async def main():
    task = asyncio.create_task(slow("bg"))
    print("task started:", not task.done())
    print(await task)
    try:
        async with asyncio.timeout(0.1):
            await slow("x")
    except TimeoutError:
        print("timed out")
    async with asyncio.TaskGroup() as tg:
        t1 = tg.create_task(asyncio.sleep(0.05, "one"))
        t2 = tg.create_task(asyncio.sleep(0.05, "two"))
    print(t1.result(), t2.result())
    start = time.perf_counter()
    await asyncio.to_thread(time.sleep, 0.2)
    print(f"{time.perf_counter() - start:.1f}s in a thread")

asyncio.run(main())`,
          output: `task started: True
bg
timed out
one two
0.2s in a thread`,
          annotations: [
            { lines: 9, text: '`create_task` schedules `slow("bg")` to run in the background and returns a `Task` immediately.' },
            { lines: '10-11', text: 'The task has not finished yet (`done()` is false). `await task` pauses `main` until it does and then yields the return value.' },
            { lines: '12-16', text: '`asyncio.timeout(0.1)` cancels the one-second `slow("x")` after 0.1 s; the cancellation surfaces as `TimeoutError`, caught here.' },
            { lines: '17-20', text: '`TaskGroup`: both tasks start inside the block and are guaranteed to be finished (or cancelled on error) when the block exits, so `result()` is safe afterwards.' },
            { lines: '21-23', text: '`asyncio.to_thread(func, *args)` runs a **blocking** function in a worker thread and awaits it, so the event loop stays free. Use it for blocking libraries (file access, `requests`, a slow database driver).' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'One blocking call freezes everything',
          text: 'Calling `time.sleep(1)` — or any blocking function such as `requests.get`, or a long loop — **inside** a coroutine stops the whole event loop for that second: no other task can run, no timer fires. Inside coroutines use the async versions (`await asyncio.sleep`, `aiohttp`/`httpx.AsyncClient`) or push the blocking call to a thread with `asyncio.to_thread`. Debug mode (`asyncio.run(main(), debug=True)`) logs coroutines that hog the loop.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Choosing the tool',
          text: 'Lots of **waiting** on many connections, and the libraries you use are async-aware → **asyncio**. Waiting, but with ordinary blocking libraries → **threads**. Heavy **computation** → **processes**. Mixed programs combine them: an asyncio server that sends CPU-bound jobs to a `ProcessPoolExecutor` via `loop.run_in_executor`.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++20 has coroutines too (`co_await`), but the language only gives the mechanism; you bring your own scheduler and task types (or use Asio, libuv-style libraries). Python ships the event loop, tasks, timers, streams and subprocess handling in the standard library, so asyncio code looks like synchronous code with `await` sprinkled in.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the program: declare the coroutine function and wait for its result.',
      template: `import asyncio

___ def double(x):
    await asyncio.sleep(0)
    return x * 2

async def main():
    print(___ double(21))

asyncio.run(main())`,
      templateIsCode: true,
      blanks: [{ answers: ['async'] }, { answers: ['await'] }],
      wordBank: ['async', 'await', 'yield', 'def'],
      explanation: '`async def` declares a coroutine function, and `await double(21)` runs the coroutine and gives its return value (42). Without `await` it would print a coroutine object and warn that it was never awaited.',
    },
    {
      kind: 'concept',
      title: 'async with, async for and async generators',
      blocks: [
        {
          type: 'p',
          text: 'Setting up and tearing down resources and iterating over data may themselves involve waiting (opening a connection, receiving the next message). asyncio therefore has async twins of the earlier tools. **`async with`** uses `__aenter__`/`__aexit__` coroutines (an async **[[context-manager]]**); **`async for`** loops over an async iterator, awaiting each next item; and an **async generator** is an `async def` containing `yield`. Async comprehensions (`[x async for x in ...]`) work too. They may only appear inside `async def`. The example below drives everything by hand with a small `drive` helper, so it runs without an event loop because none of it truly waits.',
        },
        {
          type: 'code',
          title: 'async_protocols.py',
          runnable: true,
          code: `def drive(coro):
    try:
        coro.send(None)
    except StopIteration as stop:
        return stop.value
    coro.close()
    raise RuntimeError("coroutine suspended")

class Resource:
    def __init__(self, log):
        self.log = log
    async def __aenter__(self):
        self.log.append("open")
        return self
    async def __aexit__(self, exc_type, exc, tb):
        self.log.append("close")
        return False

async def countdown(n):
    while n > 0:
        yield n
        n -= 1

async def main():
    log = []
    async with Resource(log) as r:
        async for i in countdown(3):
            r.log.append(i)
    squares = [i * i async for i in countdown(4)]
    return log, squares

print(drive(main()))`,
          output: `(['open', 3, 2, 1, 'close'], [16, 9, 4, 1])`,
          annotations: [
            { lines: '1-7', text: '`drive` runs a coroutine that never truly suspends: one `send(None)` either finishes (returning the value) or the coroutine wanted to wait, which this helper treats as an error.' },
            { lines: '12-17', text: 'An **async context manager**: `__aenter__` and `__aexit__` are coroutines, so setting up and closing could `await` (connect, flush, disconnect). Returning `False` lets exceptions propagate.' },
            { lines: '19-22', text: 'An **async generator**: `async def` plus `yield`. Consumers get its items with `async for`, and the generator could `await` between items.' },
            { lines: '26-28', text: '`async with` opens and closes the resource around the block; `async for` pulls items one at a time, awaiting each.' },
            { lines: 29, text: 'An **async comprehension**, allowed only inside `async def`.' },
            { lines: 32, text: 'Output: the resource opened first and closed last, with 3, 2, 1 between, plus the squares 16, 9, 4, 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where you will meet asyncio',
          text: 'Web frameworks such as **FastAPI** (serving a trained model behind an HTTP endpoint), Discord and chat bots, WebSocket servers for multiplayer or live dashboards, async database drivers and HTTP clients (`httpx`, `aiohttp`). In game and AI projects it appears when a Python process must talk to many sockets at once, stream telemetry, or serve inference requests while other work continues.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does calling an async function return?" (a coroutine object); "How does asyncio switch tasks?" (only at `await`, cooperatively, in one thread); "Why is `time.sleep` bad in a coroutine?" (it blocks the whole loop); "`gather` vs `create_task`?" (gather runs several and collects results; `create_task` starts one in the background); "When is asyncio the wrong tool?" (CPU-bound work).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this cooperative scheduler (the same design as the lesson’s).',
      code: `from collections import deque
from types import coroutine

@coroutine
def pause():
    yield

async def worker(name, steps, log):
    for i in range(steps):
        log.append(f"{name}{i}")
        await pause()

def run(coros):
    ready = deque(coros)
    while ready:
        task = ready.popleft()
        try:
            task.send(None)
        except StopIteration:
            continue
        ready.append(task)

log = []
run([worker("X", 2, log), worker("Y", 1, log)])
print(log)`,
      answer: "['X0', 'Y0', 'X1']",
      hint: 'Each worker logs once, then pauses, so the tasks alternate until one runs out of steps.',
      explanation: 'X logs X0 and pauses; Y logs Y0 and pauses; X resumes and logs X1 and pauses; Y resumes and finishes; X resumes and finishes. Only three entries are logged, in alternating order.',
    },
    {
      kind: 'error',
      prompt: 'The author wanted the three downloads to overlap and take about one second in total, but the program takes three. Tap the faulty line.',
      lines: [
        'import asyncio',
        'import time',
        'async def download(n):',
        '    time.sleep(1)',
        '    return n',
        'async def main():',
        '    print(await asyncio.gather(download(1), download(2), download(3)))',
        'asyncio.run(main())',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: '`time.sleep(1)` is a blocking call: it freezes the whole event loop, so the three coroutines run one after the other (3 s). Use `await asyncio.sleep(1)` (or `await asyncio.to_thread(time.sleep, 1)` for a real blocking function) so that other tasks can run during the wait.',
    },
    {
      kind: 'numeric',
      prompt: 'Three coroutines that `await asyncio.sleep()` for 1, 2 and 3 seconds are started together with `asyncio.gather`. About how many seconds does the whole `gather` take?',
      answer: '3',
      hint: 'The waits overlap; gather finishes when the slowest task finishes.',
      explanation: 'The sleeps overlap, so the total is the longest wait — 3 seconds — not the sum of 6. (If one of them used a blocking `time.sleep` instead, it would be 6.)',
      label: 'Seconds:',
    },
    {
      kind: 'code',
      prompt: 'Write `drive(coro)`: advance the coroutine once with `coro.send(None)`. If it finishes, return its result. If instead it suspends (its first step does not finish), close it and raise `RuntimeError`. Exceptions raised inside the coroutine must pass through unchanged.',
      starter: `def drive(coro):
    ...
`,
      solution: `def drive(coro):
    try:
        coro.send(None)
    except StopIteration as stop:
        return stop.value
    coro.close()
    raise RuntimeError("coroutine suspended")
`,
      tests: `from types import coroutine

@coroutine
def pause():
    yield

async def const():
    return 7

async def add(a, b):
    x = await const()
    return a + b + x

async def sleepy():
    await pause()
    return 1

async def boom():
    raise ValueError("bad")

assert drive(const()) == 7
assert drive(add(1, 2)) == 10

try:
    drive(sleepy())
    assert False, "must raise RuntimeError"
except RuntimeError:
    pass

try:
    drive(boom())
    assert False, "must raise ValueError"
except ValueError as e:
    assert str(e) == "bad"`,
      checks: ['Returns the coroutine’s return value (\`StopIteration.value\`) when it finishes in one step', 'Raises \`RuntimeError\` if the coroutine suspends, after closing it', 'Lets exceptions from inside the coroutine propagate'],
      hint: 'Call `coro.send(None)` inside `try`. A finished coroutine raises `StopIteration` and the result is `stop.value`. If no exception happened, the coroutine paused.',
      explanation: 'This is the heart of every event loop: `send(None)` advances a coroutine to its next suspension point or to its end, and `StopIteration.value` carries the final result. A real loop does this in a cycle for many tasks.',
    },
    {
      kind: 'code',
      prompt: 'Write `run_all(coros)`, a round-robin scheduler: keep a queue of the coroutine objects, repeatedly take the first one and advance it with `send(None)`; if it suspended, put it at the back, if it finished, record its return value. Return the list of results **in the original input order** (not completion order).',
      starter: `from collections import deque

def run_all(coros):
    ...
`,
      solution: `from collections import deque


def run_all(coros):
    results = [None] * len(coros)
    ready = deque(enumerate(coros))
    while ready:
        i, task = ready.popleft()
        try:
            task.send(None)
        except StopIteration as stop:
            results[i] = stop.value
        else:
            ready.append((i, task))
    return results
`,
      tests: `from types import coroutine

@coroutine
def pause():
    yield

log = []

async def worker(name, steps, value):
    for i in range(steps):
        log.append(f"{name}{i}")
        await pause()
    return value

res = run_all([worker("A", 3, "a"), worker("B", 1, "b"), worker("C", 2, "c")])
assert res == ["a", "b", "c"]
assert log == ["A0", "B0", "C0", "A1", "C1", "A2"]

assert run_all([]) == []

async def instant(v):
    return v

assert run_all([instant(1), instant(2), instant(3)]) == [1, 2, 3]

log.clear()
res = run_all([worker("S", 3, 30), worker("Q", 0, 0)])
assert res == [30, 0]
assert log == ["S0", "S1", "S2"]`,
      checks: ['Advances tasks round-robin: one step each, unfinished tasks go to the back', 'Stores each finished task’s return value at its original index', 'Handles an empty list and coroutines that finish immediately'],
      hint: 'Keep `(index, coroutine)` pairs in a `deque`. On `StopIteration`, save `stop.value` into `results[index]`; in the `else` branch of the `try`, append the pair to the back of the queue.',
      explanation: 'Remembering each task’s index lets finished results go back to their input position even though tasks finish at different times — the same bookkeeping `asyncio.gather` performs when it returns results in argument order.',
    },
    {
      kind: 'code',
      prompt: 'Write the async generator `amap(func, aiterable)`: it consumes an async iterable with `async for` and yields `func(item)` for every item, lazily and in order.',
      starter: `async def amap(func, aiterable):
    ...
`,
      solution: `async def amap(func, aiterable):
    async for item in aiterable:
        yield func(item)
`,
      tests: `import inspect

def drive(coro):
    try:
        coro.send(None)
    except StopIteration as stop:
        return stop.value
    coro.close()
    raise RuntimeError("coroutine suspended")

async def agen(n):
    for i in range(n):
        yield i

async def collect(it):
    return [x async for x in it]

assert inspect.isasyncgen(amap(str, agen(1)))
assert drive(collect(amap(lambda x: x * 10, agen(4)))) == [0, 10, 20, 30]
assert drive(collect(amap(str, agen(0)))) == []
assert drive(collect(amap(len, amap(str, agen(12))))) == [1] * 10 + [2, 2]

seen = []
async def spy(n):
    for i in range(n):
        seen.append(i)
        yield i

async def first_only():
    async for x in amap(lambda v: v + 1, spy(5)):
        return x

assert drive(first_only()) == 1
assert seen == [0]`,
      checks: ['Is an async generator (contains \`yield\`) that loops with \`async for\`', 'Yields \`func(item)\` in order, and works on empty input', 'Is lazy: it only pulls the next item when asked, and amap objects can be chained'],
      hint: 'Loop `async for item in aiterable:` and `yield func(item)` inside it. The function must be declared `async def` and contain `yield`.',
      explanation: 'An async generator is the asynchronous twin of a generator. Because it pulls from the source only when the consumer asks for the next item, it stays lazy, and several of them can be chained into a pipeline — handy for streaming data such as messages or log lines.',
    },
  ],
  takeaways: [
    'Calling an `async def` function returns a **coroutine object**; nothing runs until it is awaited or scheduled. Forgetting `await` is the classic bug.',
    'The **event loop** runs many coroutines in **one thread**, switching only at `await` (cooperative multitasking). It excels at programs that mostly wait — network servers, bots, API clients — and does nothing for CPU-bound work.',
    'Start work with `asyncio.run(main())`; run things concurrently with `asyncio.gather`, `create_task` or the safer `TaskGroup`; bound waits with `asyncio.timeout`.',
    'One blocking call (`time.sleep`, `requests.get`, a long loop) freezes every task. Use async libraries, or `await asyncio.to_thread(...)` for blocking functions and process pools for heavy computation.',
    '`async with`, `async for` and async generators are the async versions of context managers, loops and generators. Choose: asyncio for many waits with async libraries, threads for waits with blocking libraries, processes for computation.',
  ],
  reading: [
    { title: 'asyncio — Asynchronous I/O', url: 'https://docs.python.org/3/library/asyncio.html', source: 'docs', note: 'Reference for the event loop, tasks, TaskGroup, timeouts, streams, queues and synchronization primitives.' },
    { title: 'Coroutines and Tasks', url: 'https://docs.python.org/3/library/asyncio-task.html', source: 'docs', note: 'The core API: async/await, create_task, gather, TaskGroup, timeout, to_thread.' },
    { title: 'Async IO in Python: A Complete Walkthrough', url: 'https://realpython.com/async-io-python/', source: 'article', note: 'A long, example-driven tour including chained coroutines and producer/consumer queues.' },
    { title: 'PEP 492 — Coroutines with async and await syntax', url: 'https://peps.python.org/pep-0492/', source: 'pep', note: 'The proposal that introduced `async def`, `await`, `async with` and `async for`.' },
  ],
};
