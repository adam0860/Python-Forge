import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-multiprocessing',
  title: 'Multiprocessing',
  summary: 'Using several CPU cores with separate processes: `ProcessPoolExecutor` and `multiprocessing.Pool`, why data is copied (pickling), the `__main__` guard, queues and shared values, splitting work map-reduce style, and how PyTorch and RL libraries use processes.',
  minutes: 20,
  objectives: [
    'Explain why separate processes can use several cores in standard CPython and what they cost',
    'Run CPU-bound work with `ProcessPoolExecutor` or `multiprocessing.Pool` using the required `if __name__ == "__main__":` guard',
    'Explain pickling: what is copied between processes, what can’t be sent, and why globals are not shared',
    'Pass results through `mp.Queue` and share counters with `mp.Value` and a lock',
    'Split a problem into chunks, process the chunks independently and merge the partial results',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Processes: separate memory, separate GIL',
      blocks: [
        {
          type: 'p',
          text: 'Threads share one interpreter and one GIL, so they can’t speed up pure-Python computation. A **[[process]]** is different: it is a whole separate running Python with its **own memory and its own GIL**. Several processes can run on different cores at the same instant — real **[[parallelism]]**. The standard library offers the same ideas at two levels: `multiprocessing` (`Process`, `Pool`, `Queue`, `Value`) and the friendlier `concurrent.futures.ProcessPoolExecutor`, which has the same `submit`/`map`/`Future` interface as the thread pool from the previous lesson. For **[[cpu-bound]]** work you can often switch from threads to processes by changing one class name.',
        },
        {
          type: 'code',
          title: 'process_pool.py',
          desktopOnly: true,
          code: `import time
from concurrent.futures import ProcessPoolExecutor

def count_primes(limit):
    count = 0
    for n in range(2, limit):
        if all(n % d for d in range(2, int(n ** 0.5) + 1)):
            count += 1
    return count

if __name__ == "__main__":
    limits = [120_000] * 2
    start = time.perf_counter()
    serial = [count_primes(n) for n in limits]
    t_serial = time.perf_counter() - start

    start = time.perf_counter()
    with ProcessPoolExecutor(max_workers=2) as pool:
        parallel = list(pool.map(count_primes, limits))
    t_parallel = time.perf_counter() - start

    print(serial == parallel, serial[0])
    print(f"speedup: {t_serial / t_parallel:.1f}x")`,
          output: `True 11301
speedup: 2.1x`,
          annotations: [
            { lines: '4-9', text: 'A CPU-bound function: counting the primes below `limit` with pure-Python loops. It must be defined at the **top level** of the module so worker processes can find it by name.' },
            { lines: 11, text: 'The **`__main__` guard** is mandatory with processes. Workers re-import your file; without the guard each worker would start its own pool, recursively.' },
            { lines: '12-15', text: 'Baseline: run the two jobs one after the other in this process and time them.' },
            { lines: '17-20', text: 'The same two jobs in two worker processes. `pool.map` pickles the arguments, sends them to the workers, and returns the results in order. Starting processes costs time, which is why the jobs must be big enough to be worth it.' },
            { lines: 22, text: 'Identical results (11301 primes below 120000) — only the speed differs.' },
            { lines: 23, text: 'Sample output from a 2-core machine: about 2 times faster, close to the ideal because the jobs are independent. With more cores and more jobs you can approach that many times — within Amdahl’s limits. Yours will vary.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'What you pay for parallelism',
          text: 'A process costs tens of milliseconds to start and megabytes of memory, and everything passed to it or returned from it must be **copied** (pickled and unpickled). So processes pay off for **big, independent, CPU-heavy jobs** with small inputs and outputs, and lose against plain code for tiny tasks. Always compare against the serial version, as above.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'In C++ you would normally use threads for this; separate processes are the heavier option used for isolation. Python flips the default because of the GIL. `multiprocessing` hides the operating-system details (`fork`/`CreateProcess`, pipes, shared memory) behind one portable API, much like Boost.Process plus Boost.Interprocess would.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The __main__ guard is not optional',
          text: 'On Windows and macOS (and by default on Linux since Python 3.14) new processes are **spawned**: a fresh interpreter imports your script to find the target function. Code at the top level of the script would run again in every worker. Put the code that creates pools and processes under `if __name__ == "__main__":`, and keep module-level code free of side effects.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why can a pool of **processes** speed up pure-Python number crunching on several cores, when a pool of threads cannot?',
      options: [
        { text: 'Each process has its own interpreter and its own GIL, so they run truly in parallel', correct: true, why: 'The GIL is per interpreter. Several processes means several interpreters, each able to run Python bytecode at the same instant on a different core.' },
        { text: 'Processes are scheduled with higher priority by the operating system', why: 'Priority has nothing to do with it. The limiting factor for threads is the single GIL inside one interpreter.' },
        { text: 'Processes share memory directly, so they need no copying', why: 'It is the other way around: processes do **not** share memory, so data must be copied between them. That is one of their costs.' },
        { text: 'Processes don’t really run in parallel; Python only makes them look faster', why: 'They genuinely run in parallel on separate cores. The speedup in the example is real.' },
      ],
      explanation: 'The GIL belongs to one interpreter. Separate processes are separate interpreters, each with its own GIL and memory, so they can occupy different cores simultaneously — at the price of copying data between them.',
    },
    {
      kind: 'concept',
      title: 'No shared memory: pickling and copies',
      blocks: [
        {
          type: 'p',
          text: 'Because processes have separate memory, nothing is shared unless you say so. Arguments and results travel between processes as bytes: Python **pickles** (serializes) the object, sends the bytes, and the other side **unpickles** a *copy*. Three consequences follow. **1.** Changes a worker makes to its copy are invisible to the parent. **2.** Only picklable objects can be sent: numbers, strings, lists, dicts, instances of top-level classes — but **not** lambdas, local functions, generators, open files or locks. **3.** Functions are pickled **by name**, so the worker must be able to import them: that is why worker functions live at module top level. The `pickle` module works the same inside a single process, so you can explore the rules here.',
        },
        {
          type: 'code',
          title: 'pickling_rules.py',
          runnable: true,
          code: `import pickle
from collections import Counter
from fractions import Fraction

print(pickle.loads(pickle.dumps(len)) is len)
c = pickle.loads(pickle.dumps(Counter("aab")))
print(c["a"], type(c).__name__, Fraction(1, 3) == pickle.loads(pickle.dumps(Fraction(1, 3))))

orig = {"hp": [1, 2]}
clone = pickle.loads(pickle.dumps(orig))
clone["hp"].append(3)
print(orig, clone)

try:
    pickle.dumps(lambda x: x)
except (pickle.PicklingError, AttributeError):
    print("lambdas can't be pickled")`,
          output: `True
2 Counter True
{'hp': [1, 2]} {'hp': [1, 2, 3]}
lambdas can't be pickled`,
          annotations: [
            { lines: 5, text: 'A function is pickled as its **name** (module plus function name). Unpickling looks the name up and returns the very same function object — which is why it has to be importable.' },
            { lines: '6-7', text: 'Data objects are pickled **by value**: the receiving side gets an equal but separate object (`Counter` and `Fraction` both survive the round trip).' },
            { lines: '9-12', text: 'A round trip makes a deep copy: appending to `clone` leaves `orig` untouched. This is exactly what happens to every argument you send to a worker process.' },
            { lines: '14-17', text: 'A lambda has no importable name, so pickling fails — and with it any attempt to send a lambda to a worker. The same is true of functions defined inside other functions.' },
          ],
        },
        {
          type: 'p',
          text: 'Global variables show the effect most clearly. A child process that changes a global changes only *its own copy*. When processes really must share a number, use shared memory objects such as `multiprocessing.Value`, together with its lock for read–modify–write steps (the same race conditions apply as with threads).',
        },
        {
          type: 'code',
          title: 'not_shared.py',
          desktopOnly: true,
          code: `import multiprocessing as mp

counter = 0

def bump():
    global counter
    counter += 1

def bump_shared(value):
    with value.get_lock():
        value.value += 1

if __name__ == "__main__":
    p = mp.Process(target=bump)
    p.start()
    p.join()
    print(counter)

    shared = mp.Value("i", 0)
    procs = [mp.Process(target=bump_shared, args=(shared,)) for _ in range(4)]
    for p in procs:
        p.start()
    for p in procs:
        p.join()
    print(shared.value)`,
          output: `0
4`,
          annotations: [
            { lines: '3-7', text: 'A module-level counter and a function that increments it.' },
            { lines: '9-11', text: 'Updating a shared value is read–modify–write, so it needs the lock: `with value.get_lock():` — the same discipline as with threads.' },
            { lines: '14-17', text: 'The child process runs `bump()` — but on its **own copy** of `counter`. After the join the parent still sees `0`.' },
            { lines: 19, text: '`mp.Value("i", 0)` allocates a C integer in **shared memory** (`"i"` = signed int) with a built-in lock. Every process that receives it sees the same number.' },
            { lines: '20-25', text: 'Four processes each add one: the shared value ends at exactly 4.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Design for copies',
          text: 'Make workers **pure functions**: input in, result out, no hidden globals. Send small descriptions of the work (a range of indexes, a file name, a seed) rather than big objects, and let each worker load its own data. For large NumPy arrays use `multiprocessing.shared_memory` to avoid copying; PyTorch provides `torch.multiprocessing`, which shares tensors between processes without copying.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Start methods',
          text: 'Processes can start in three ways. **spawn** launches a fresh interpreter and imports your module (Windows, macOS; safest). **fork** clones the running process (fast, Linux; but dangerous with threads and GPU/CUDA state). **forkserver** forks from a clean helper process — the default on Linux since Python 3.14. Choose explicitly with `mp.set_start_method("spawn")` (once, under the guard) if behavior must be identical everywhere.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a worker process increments a global variable `counter`, the parent process sees the new value after the worker finishes.',
      answer: false,
      explanation: 'False. Each process has its own copy of every variable, so the worker changes only its own `counter`. To share state use `multiprocessing.Value`/`Array`, shared memory, or send results back through a queue or the pool’s return values.',
    },
    {
      kind: 'concept',
      title: 'Passing results between processes',
      blocks: [
        {
          type: 'p',
          text: 'Processes communicate by **message passing**. `multiprocessing.Queue` works like the thread queue but moves pickled items between processes, and `Pipe` connects two processes directly. The most common pattern, though, needs no explicit messaging at all: **split** the data into chunks, **map** a pure function over the chunks in a pool (each chunk in its own process), and **reduce** (merge) the partial results. Counting words, summing, rendering image tiles, simulating independent episodes — they all fit.',
        },
        {
          type: 'code',
          title: 'process_queue.py',
          desktopOnly: true,
          code: `import multiprocessing as mp

def worker(q, n):
    q.put((n, n * n))

if __name__ == "__main__":
    q = mp.Queue()
    procs = [mp.Process(target=worker, args=(q, n)) for n in range(4)]
    for p in procs:
        p.start()
    results = sorted(q.get() for _ in procs)
    for p in procs:
        p.join()
    print(results)`,
          output: `[(0, 0), (1, 1), (2, 4), (3, 9)]`,
          annotations: [
            { lines: '3-4', text: 'Each worker puts its answer on a shared queue. The tuple is pickled and sent through an operating-system pipe.' },
            { lines: 7, text: '`mp.Queue` is the process-safe queue; the plain `queue.Queue` only works inside one process.' },
            { lines: '8-10', text: 'Start four processes, each with the queue and its own number.' },
            { lines: 11, text: 'Read the results **before** joining. A process that has put data into a queue won’t exit until that data has been consumed, so joining first can deadlock. We sort because arrival order varies.' },
            { lines: '12-14', text: 'Now that all results are collected, wait for the processes to exit.' },
          ],
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Split, map, reduce — and pool controls',
      blocks: [
        {
          type: 'p',
          text: 'The splitting and merging logic is ordinary Python, and it is where most of the design work lies, so you can write and test it right here. Below, `chunks` cuts a list into nearly equal contiguous pieces, `count_words` is the "map" step, and adding `Counter`s is the "reduce" step. In a real program the second step would run in a pool; the answer must be identical to the sequential one.',
        },
        {
          type: 'code',
          title: 'map_reduce.py',
          runnable: true,
          code: `from collections import Counter

def chunks(items, n):
    size, extra = divmod(len(items), n)
    out, start = [], 0
    for i in range(n):
        end = start + size + (1 if i < extra else 0)
        out.append(items[start:end])
        start = end
    return out

def count_words(lines):
    return Counter(w for line in lines for w in line.split())

lines = ["a b a", "b c", "a", "c c b", "a b"]
parts = chunks(lines, 2)
partials = [count_words(p) for p in parts]
total = sum(partials, Counter())
print([len(p) for p in parts], sorted(total.items()))`,
          output: `[3, 2] [('a', 4), ('b', 4), ('c', 3)]`,
          annotations: [
            { lines: '3-10', text: '**Split**: five lines into two chunks of 3 and 2. `divmod` gives the base size and the remainder; the first `extra` chunks get one more item so sizes differ by at most one.' },
            { lines: '12-13', text: '**Map**: a pure function that counts words in one chunk. It takes plain data and returns a `Counter`, so it is easy to send to a process.' },
            { lines: '16-17', text: 'Each chunk is processed independently. A pool would run these calls in parallel; here they run one by one.' },
            { lines: 18, text: '**Reduce**: adding `Counter`s merges the counts. The start value `Counter()` is needed because `sum` starts from `0`.' },
            { lines: 19, text: 'Chunk sizes `[3, 2]`, and the merged counts equal what a single pass over all five lines would give.' },
          ],
        },
        {
          type: 'p',
          text: 'Pools have a few more controls. `Pool.map(func, items, chunksize=k)` hands each worker `k` items at a time to cut communication overhead; `imap_unordered` yields results as soon as any worker finishes; an **initializer** runs once per worker, ideal for loading a big model or data file only once per process instead of once per task.',
        },
        {
          type: 'code',
          title: 'pool_features.py',
          desktopOnly: true,
          code: `import multiprocessing as mp

def init(seed):
    global SEED
    SEED = seed

def work(x):
    return x * SEED

if __name__ == "__main__":
    with mp.Pool(2, initializer=init, initargs=(10,)) as pool:
        print(pool.map(work, range(5), chunksize=2))
        print(sorted(pool.imap_unordered(work, range(5))))
    print(mp.get_start_method() in ("fork", "spawn", "forkserver"))`,
          output: `[0, 10, 20, 30, 40]
[0, 10, 20, 30, 40]
True`,
          annotations: [
            { lines: '3-5', text: 'The **initializer** runs once in every worker when it starts. It stores a setting in a worker-global variable (a legitimate use of globals: each process has its own).' },
            { lines: '7-8', text: 'The task function can then use that per-worker state without it being re-sent with every task.' },
            { lines: 11, text: '`Pool(2, ...)` starts two workers; used as a context manager it shuts them down at the end.' },
            { lines: 12, text: '`chunksize=2` sends tasks in groups of two to reduce overhead; `map` returns results in input order.' },
            { lines: 13, text: '`imap_unordered` yields in completion order, so we sort to compare.' },
            { lines: 14, text: 'Reports which start method is in use on this platform.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Processes in AI and game projects',
          text: 'PyTorch’s `DataLoader(num_workers=4)` runs worker **processes** that load and augment data while the GPU trains. Reinforcement-learning libraries (Gymnasium’s `AsyncVectorEnv`, Stable-Baselines3’s `SubprocVecEnv`, RLGym setups) run many game instances in separate processes to collect experience in parallel — each environment is a separate program with its own state, exactly the "no shared memory" model of this lesson. Game engines you drive from Python are usually separate processes too.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"Why do processes beat threads for CPU-bound Python?" (own GIL); "Why must the pool code be inside `if __name__ == "__main__":`?" (spawned workers re-import the script); "What can’t be pickled?" (lambdas, local functions, generators, locks, open files); "Is a global modified in a child visible in the parent?" (no); "What goes wrong if you join before reading the queue?" (possible deadlock).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the program so it is safe to run on Windows and uses a process pool to square the numbers.',
      template: `from concurrent.futures import ProcessPoolExecutor

def work(n):
    return n * n

if __name__ == "___":
    with ProcessPoolExecutor() as pool:
        print(list(pool.___(work, [1, 2, 3])))`,
      templateIsCode: true,
      blanks: [{ answers: ['__main__'] }, { answers: ['map'] }],
      wordBank: ['__main__', 'map', 'main', 'submit'],
      explanation: 'The guard `if __name__ == "__main__":` keeps the pool-creating code from running again when worker processes re-import the file, and `pool.map(work, items)` applies the function to every item, returning the results in order.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Sending data to another process sends a copy, as pickling does.',
      code: `import pickle

a = [[1], [2]]
b = pickle.loads(pickle.dumps(a))
b[0].append(9)
print(a, b[0] is a[0])`,
      answer: '[[1], [2]] False',
      hint: 'A pickle round trip rebuilds every inner list too.',
      explanation: 'Unpickling creates new list objects all the way down, so `b` is a deep copy: the `9` goes only into `b`’s inner list and `b[0] is a[0]` is `False`. Worker processes receive exactly such copies of their arguments.',
    },
    {
      kind: 'error',
      prompt: 'On Windows this program keeps crashing with "An attempt has been made to start a new process before the current process has finished its bootstrapping phase". Tap a faulty line.',
      lines: [
        'import multiprocessing as mp',
        'def work(n):',
        '    return n * n',
        'pool = mp.Pool(2)',
        'print(pool.map(work, [1, 2, 3]))',
      ],
      linesAreCode: true,
      errorLines: [4, 5],
      explanation: 'The pool is created at the top level, so every spawned worker re-imports the script and tries to create its own pool. Wrap the pool code in `if __name__ == "__main__":` (ideally with `with mp.Pool(2) as pool:` so the workers are shut down properly).',
    },
    {
      kind: 'numeric',
      prompt: 'Ten items are split into 4 chunks as evenly as possible, with the **first** chunks receiving the extra items. How many items does the largest chunk contain?',
      answer: '3',
      hint: '`divmod(10, 4)` is `(2, 2)`: a base of 2 items each, and 2 extra items to hand out.',
      explanation: 'Ten items over four chunks is 2 each with 2 left over. The first two chunks get one extra item each, so the sizes are 3, 3, 2, 2 and the largest chunk has 3 items.',
      label: 'Items:',
    },
    {
      kind: 'code',
      prompt: 'Write `chunks(items, n)` that splits the list `items` into exactly `n` contiguous chunks whose sizes differ by at most one (the first chunks get the extra items), keeping the original order. If `items` is shorter than `n`, some chunks are empty. Raise `ValueError` if `n < 1`.',
      starter: `def chunks(items, n):
    ...
`,
      solution: `def chunks(items, n):
    if n < 1:
        raise ValueError("n must be at least 1")
    size, extra = divmod(len(items), n)
    out = []
    start = 0
    for i in range(n):
        end = start + size + (1 if i < extra else 0)
        out.append(items[start:end])
        start = end
    return out
`,
      tests: `assert chunks(list(range(10)), 3) == [[0, 1, 2, 3], [4, 5, 6], [7, 8, 9]]
assert chunks(list(range(10)), 4) == [[0, 1, 2], [3, 4, 5], [6, 7], [8, 9]]
assert chunks([1, 2], 3) == [[1], [2], []]
assert chunks([], 2) == [[], []]
assert chunks([1, 2, 3], 1) == [[1, 2, 3]]

data = list(range(23))
for n in (1, 2, 5, 7, 23, 30):
    parts = chunks(data, n)
    assert len(parts) == n
    assert [x for part in parts for x in part] == data
    sizes = [len(p) for p in parts]
    assert max(sizes) - min(sizes) <= 1
    assert sizes == sorted(sizes, reverse=True)

for bad in (0, -1):
    try:
        chunks([1], bad)
        assert False, "must raise ValueError"
    except ValueError:
        pass`,
      checks: ['Returns exactly \`n\` chunks that together contain every item in order', 'Chunk sizes differ by at most one, larger chunks first', 'Handles short or empty lists; \`ValueError\` for \`n < 1\`'],
      hint: 'Use `size, extra = divmod(len(items), n)`. Chunk `i` has `size + 1` items if `i < extra`, otherwise `size`. Walk through the list with a running `start` index.',
      explanation: '`divmod` gives the base chunk size and how many chunks need one extra item. Because the sizes are balanced, no worker waits long for the slowest chunk — an important property when the chunks are processed in parallel.',
    },
    {
      kind: 'code',
      prompt: 'The helper `chunks(items, n)` is provided. Write `word_count(lines, workers=2)`: split `lines` into `workers` chunks, count the words of each chunk separately (the "map" step) and merge the partial counts into one plain `dict` mapping each word to its total (the "reduce" step). Words are separated by whitespace and case matters. The result must equal the count over all lines at once.',
      starter: `from collections import Counter

def chunks(items, n):
    size, extra = divmod(len(items), n)
    out, start = [], 0
    for i in range(n):
        end = start + size + (1 if i < extra else 0)
        out.append(items[start:end])
        start = end
    return out

def word_count(lines, workers=2):
    ...
`,
      solution: `from collections import Counter


def chunks(items, n):
    size, extra = divmod(len(items), n)
    out, start = [], 0
    for i in range(n):
        end = start + size + (1 if i < extra else 0)
        out.append(items[start:end])
        start = end
    return out


def word_count(lines, workers=2):
    partials = []
    for part in chunks(lines, workers):
        partials.append(Counter(w for line in part for w in line.split()))
    total = Counter()
    for partial in partials:
        total += partial
    return dict(total)
`,
      tests: `lines = ["a b a", "b c", "a", "c c b", "a b"]
expected = {"a": 4, "b": 4, "c": 3}
assert word_count(lines) == expected
assert word_count(lines, workers=1) == expected
assert word_count(lines, workers=3) == expected
assert word_count(lines, workers=8) == expected
assert word_count([]) == {}
assert word_count(["Go go GO"], workers=2) == {"Go": 1, "go": 1, "GO": 1}
assert isinstance(word_count(lines), dict) and type(word_count(lines)) is dict

big = [("w%d " % (i % 7)) * 3 for i in range(100)]
seq = {}
for line in big:
    for w in line.split():
        seq[w] = seq.get(w, 0) + 1
assert word_count(big, workers=4) == seq`,
      checks: ['Splits the lines with \`chunks\` and counts each chunk separately', 'Merges the partial counts (map, then reduce) into a plain \`dict\`', 'Result equals a single pass for any number of workers, including more workers than lines'],
      hint: 'For each chunk build a `Counter` of its words. Add all partial counters together (`total += partial`) and return `dict(total)`.',
      explanation: 'Because counting is associative — the counts of the pieces add up to the count of the whole — the parts can be computed independently and merged in any order. Problems with this "split, map, reduce" shape are the ones that parallelize best.',
    },
    {
      kind: 'code',
      prompt: 'Before sending an object to a worker process you may want to check that it can be pickled. Write `is_picklable(obj)` that returns `True` if `pickle.dumps(obj)` succeeds and `False` if it fails (pickling errors can be `PicklingError`, `AttributeError` or `TypeError`).',
      starter: `import pickle

def is_picklable(obj):
    ...
`,
      solution: `import pickle


def is_picklable(obj):
    try:
        pickle.dumps(obj)
    except (pickle.PicklingError, AttributeError, TypeError):
        return False
    return True
`,
      tests: `from collections import Counter

def make_local():
    def local(x):
        return x
    return local

assert is_picklable(5) is True
assert is_picklable("text") is True
assert is_picklable([1, (2, 3), {"a": 4.5}]) is True
assert is_picklable(len) is True
assert is_picklable(Counter("aab")) is True
assert is_picklable(sorted) is True

assert is_picklable(lambda x: x) is False
assert is_picklable(make_local()) is False
assert is_picklable((x for x in range(3))) is False
assert is_picklable([1, lambda: 0]) is False`,
      checks: ['Returns \`True\` for numbers, strings, containers, builtins and \`Counter\`', 'Returns \`False\` for lambdas, local functions and generators (also nested inside containers)', 'Catches \`PicklingError\`, \`AttributeError\` and \`TypeError\`'],
      hint: 'Wrap `pickle.dumps(obj)` in `try`/`except (pickle.PicklingError, AttributeError, TypeError)` and return `False` in the handler, `True` otherwise.',
      explanation: 'Different unpicklable things fail with different exception types (a lambda gives `PicklingError` or `AttributeError` depending on version, a generator gives `TypeError`), so all three are caught. A container is unpicklable as soon as one element is — which is why a lambda hidden inside a list still fails.',
    },
  ],
  takeaways: [
    'Separate **processes** have their own interpreter, memory and GIL, so they run truly in parallel on several cores — the standard way to speed up CPU-bound Python. They cost startup time and memory, and need big, independent jobs.',
    'Use `concurrent.futures.ProcessPoolExecutor` (same API as the thread pool) or `multiprocessing.Pool`, and always guard the entry point with `if __name__ == "__main__":`. Worker functions must be importable top-level functions.',
    'Data between processes is **pickled and copied**. Changes to copies and globals are invisible to the parent; lambdas, local functions, generators and locks can’t be sent. Design workers as pure functions with small inputs.',
    'For genuinely shared state use `mp.Value`/`Array`/`shared_memory` with locks; for messages use `mp.Queue`. Read from a queue before joining the producer.',
    'The classic pattern is **split, map, reduce**: chunk the data evenly, process chunks independently, merge the partial results. PyTorch `DataLoader` workers and RL vectorized environments work this way.',
  ],
  reading: [
    { title: 'multiprocessing — Process-based parallelism', url: 'https://docs.python.org/3/library/multiprocessing.html', source: 'docs', note: 'Process, Pool, Queue, Value, shared memory, start methods and the programming guidelines.' },
    { title: 'concurrent.futures — ProcessPoolExecutor', url: 'https://docs.python.org/3/library/concurrent.futures.html#processpoolexecutor', source: 'docs', note: 'The high-level interface and its restrictions (pickling, `__main__` guard).' },
    { title: 'pickle — What can be pickled and unpickled?', url: 'https://docs.python.org/3/library/pickle.html#what-can-be-pickled-and-unpickled', source: 'docs', note: 'The official list of picklable objects, and why unpickling untrusted data is unsafe.' },
    { title: 'Speed Up Your Python Program With Concurrency', url: 'https://realpython.com/python-concurrency/', source: 'article', note: 'Compares threading, asyncio and multiprocessing on the same I/O-bound and CPU-bound tasks.' },
  ],
};
