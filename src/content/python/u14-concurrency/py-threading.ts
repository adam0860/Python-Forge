import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-threading',
  title: 'Threads and concurrent.futures',
  summary: 'Running work in threads: `threading.Thread`, `start`/`join`, protecting shared data with `Lock`, passing work with `queue.Queue`, and the high-level `ThreadPoolExecutor` with futures, `as_completed` and exception handling.',
  minutes: 20,
  objectives: [
    'Start and join threads and explain why their output order is unpredictable',
    'Protect shared data with `threading.Lock` used as a context manager, and recognize a deadlock',
    'Build a producer/consumer pipeline with `queue.Queue` and a sentinel',
    'Use `ThreadPoolExecutor`, `submit`, `map` and `as_completed`, and handle exceptions raised in workers',
    'Explain what a `Future` is and write an executor-compatible class',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Threads: start, join and shared memory',
      blocks: [
        {
          type: 'p',
          text: 'A **[[thread]]** is a separate path of execution inside your program. All threads of a program share the same memory, which makes it easy to hand them data — and easy to corrupt it. You create one with `threading.Thread(target=function, args=(...))`, call **`start()`** to begin running it, and **`join()`** to wait until it has finished. After `start()` the thread runs *concurrently* with the rest of your code, and the operating system decides the order: **never assume which thread runs first or finishes first.** Collect results and sort or combine them after `join()`.',
        },
        {
          type: 'code',
          title: 'basic_threads.py',
          desktopOnly: true,
          code: `import threading

results = []

def worker(name, n):
    results.append(f"{name}:{n * n}")

threads = []
for i in range(3):
    t = threading.Thread(target=worker, args=(f"t{i}", i + 2))
    threads.append(t)
    t.start()

for t in threads:
    t.join()

print(sorted(results))
print(threading.current_thread().name, threading.active_count())`,
          output: `['t0:4', 't1:9', 't2:16']
MainThread 1`,
          annotations: [
            { lines: '5-6', text: 'The function each thread will run. It appends to a shared list — `list.append` happens to be atomic in CPython, so this particular line is safe.' },
            { lines: '9-12', text: '`Thread(target=..., args=(...))` creates the thread (not yet running). `start()` launches it. We keep the thread objects to wait for them later.' },
            { lines: '14-15', text: '`join()` blocks until that thread is finished. Without it the main program could print before the workers are done.' },
            { lines: 17, text: 'The workers may have appended in any order, so we sort for a predictable output.' },
            { lines: 18, text: 'After all joins only the main thread remains: name `MainThread`, count 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why threads?',
          text: 'Threads let a program keep working while something slow happens elsewhere: a game keeps rendering while a level loads, a server handles many clients, a training script prepares the next batch while the GPU is busy. In CPython they pay off for **I/O-bound** work (the GIL is released while waiting) and for libraries that release the GIL; for pure-Python number crunching use processes (next lesson).',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: '`threading.Thread` corresponds to `std::thread`: `start()` is the constructor’s launch, `join()` is `join()` (a Python thread that is never joined is fine, but a program waits for all non-daemon threads at exit, much like std::thread’s terminate-if-joinable trap — except Python waits instead of aborting). Python has no `detach`; a thread flagged `daemon=True` is killed abruptly when the main program ends.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Exceptions in threads stay in the thread',
          text: 'If a thread’s function raises, the traceback is printed (by `threading.excepthook`) and *only that thread* stops. The main thread keeps running and never learns about it unless you pass the error back (a queue, a shared result) — one reason to prefer `ThreadPoolExecutor`, whose futures re-raise exceptions in the caller.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In the example above, what does `t.join()` do?',
      options: [
        { text: 'It makes the calling thread wait until thread `t` has finished', correct: true, why: '`join()` blocks the caller until the thread’s function returns (or raises), so results are complete afterwards.' },
        { text: 'It starts the thread `t`', why: 'Starting is the job of `start()`. A thread that has only been created does nothing.' },
        { text: 'It merges the thread’s variables into the main thread', why: 'Threads already share memory; there is nothing to merge. `join` only waits.' },
        { text: 'It forces the thread to stop immediately', why: 'Python has no way to kill a thread from outside. `join` waits for it to finish by itself.' },
      ],
      explanation: '`start()` launches a thread; `join()` waits for it to finish. There is no `kill`: threads stop when their function returns, so long-running workers need a flag (`threading.Event`) or a sentinel to know when to quit.',
    },
    {
      kind: 'concept',
      title: 'Locks: protecting shared data',
      blocks: [
        {
          type: 'p',
          text: 'Remember the lost-update race from the previous lesson? With real threads it happens for real. The cure is a **[[lock]]**: `threading.Lock()` has two states, and only one thread can hold it at a time; others calling `acquire()` wait. The pattern is always **`with lock:`** around the critical section, so the lock is released even if an exception occurs. In the example, each thread reads the counter, pauses a moment (as a real scheduler might), and writes back: unprotected, updates are lost; protected, the total is exact.',
        },
        {
          type: 'code',
          title: 'lock_fixes_race.py',
          desktopOnly: true,
          code: `import threading
import time

unsafe = {"n": 0}
safe = {"n": 0}
lock = threading.Lock()

def add_unsafe():
    for _ in range(50):
        local = unsafe["n"]
        time.sleep(0.0001)
        unsafe["n"] = local + 1

def add_safe():
    for _ in range(50):
        with lock:
            local = safe["n"]
            time.sleep(0.0001)
            safe["n"] = local + 1

def run(target):
    threads = [threading.Thread(target=target) for _ in range(4)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

run(add_unsafe)
run(add_safe)
print(unsafe["n"] < 200, safe["n"])`,
          output: `True 200`,
          annotations: [
            { lines: 6, text: 'One `Lock` object, shared by all threads that touch `safe`.' },
            { lines: '8-12', text: 'The unprotected version: read, wait (the `sleep` forces a thread switch, as could happen at any time), write. Four threads × 50 increments should give 200.' },
            { lines: '14-19', text: 'The protected version: the whole read–modify–write sits inside `with lock:`, so only one thread executes it at a time.' },
            { lines: '21-26', text: 'A helper that runs four threads of the given function and waits for all of them.' },
            { lines: 30, text: 'The unprotected total is **less than** 200 (updates were lost; the exact number varies from run to run), while the locked total is exactly 200.' },
          ],
        },
        {
          type: 'p',
          text: 'Locks introduce their own bug: the **[[deadlock]]**. If thread A holds lock 1 and waits for lock 2 while thread B holds lock 2 and waits for lock 1, both wait forever. A plain `Lock` is also not re-entrant: a thread that tries to acquire a lock it already holds waits for itself. Rules that prevent most deadlocks: keep critical sections *short*, never call unknown code (callbacks) while holding a lock, and if you need several locks, always acquire them in the **same order**. `threading.RLock` allows the same thread to acquire a lock repeatedly.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Prefer not sharing',
          text: 'The best lock is no lock. Give each thread its own data and combine the results after `join()` (as in the first example, or by summing per-thread counts), or pass data through a `queue.Queue`, which does its own locking. Fewer shared variables means fewer races, fewer deadlocks and easier reasoning.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Always use with',
          text: 'Write `with lock:` — never bare `lock.acquire()` followed by `lock.release()`. If anything raises between them the lock stays locked forever and every other thread freezes. The context-manager form (previous unit) makes the release automatic.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a function running in a thread raises an exception, the main thread is interrupted and receives that exception.',
      answer: false,
      explanation: 'False. The traceback is printed and only the failing thread ends. The main thread carries on unaware. To propagate errors, pass them back through a queue or use `concurrent.futures`, where `future.result()` re-raises the worker’s exception in the caller.',
    },
    {
      kind: 'concept',
      title: 'Queues: passing work between threads',
      blocks: [
        {
          type: 'p',
          text: 'The most robust way for threads to cooperate is **message passing**. `queue.Queue` is a thread-safe FIFO: producers `put()` items, consumers `get()` them (blocking while it is empty), and the queue does all the locking. A classic design is a pool of worker threads reading from a task queue and writing to a result queue. To tell workers to quit, send a **sentinel** — a special value such as `None` — one per worker. `task_done()` and `join()` on the queue let you wait until all submitted work has been processed.',
        },
        {
          type: 'code',
          title: 'worker_pool.py',
          desktopOnly: true,
          code: `import queue
import threading

tasks = queue.Queue()
results = queue.Queue()
STOP = None

def worker():
    while True:
        item = tasks.get()
        if item is STOP:
            break
        results.put(item * item)

workers = [threading.Thread(target=worker) for _ in range(3)]
for w in workers:
    w.start()
for n in range(6):
    tasks.put(n)
for _ in workers:
    tasks.put(STOP)
for w in workers:
    w.join()

print(sorted(results.get() for _ in range(results.qsize())))`,
          output: `[0, 1, 4, 9, 16, 25]`,
          annotations: [
            { lines: '4-5', text: 'Two thread-safe queues: one for work to do, one for finished results.' },
            { lines: 6, text: '`None` will act as the "no more work" sentinel.' },
            { lines: '8-13', text: 'Each worker loops forever: `get()` blocks until an item is available, a sentinel ends the loop, anything else is processed and the answer is put on the result queue.' },
            { lines: '15-17', text: 'Start three workers. They begin waiting for tasks immediately.' },
            { lines: '18-19', text: 'The main thread acts as the producer and queues six tasks. Whichever idle worker is free takes the next one.' },
            { lines: '20-21', text: 'One sentinel per worker, so every worker is told to stop (each consumes exactly one).' },
            { lines: '22-23', text: 'Wait for all workers to exit; afterwards every result is in the queue.' },
            { lines: 25, text: 'Which worker handled which number — and in what order — varies, so we sort the results.' },
          ],
        },
        {
          type: 'p',
          text: 'The `Queue` API itself needs no threads, so you can try it right here. `put` adds, `get` removes the oldest item, `get_nowait()` raises `queue.Empty` instead of waiting, and `qsize()`/`empty()` report the current state (only a snapshot when other threads are active).',
        },
        {
          type: 'code',
          title: 'queue_basics.py',
          runnable: true,
          code: `import queue

q = queue.Queue()
for item in ("a", "b", None):
    q.put(item)

got = []
while True:
    item = q.get()
    if item is None:
        break
    got.append(item)
print(got, q.empty())

try:
    q.get_nowait()
except queue.Empty:
    print("empty")`,
          output: `['a', 'b'] True
empty`,
          annotations: [
            { lines: '4-5', text: 'Items come out in the order they went in (first in, first out). The final `None` is the sentinel.' },
            { lines: '7-12', text: 'The consumer loop used by every worker: take an item, stop at the sentinel, otherwise process it. `get()` would *block forever* if the queue were empty and no sentinel arrived, so the sentinel convention matters.' },
            { lines: 13, text: 'The sentinel was consumed too, so the queue is now empty.' },
            { lines: '15-18', text: '`get_nowait()` never waits: on an empty queue it raises `queue.Empty`. `get(timeout=1)` waits at most one second.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Pipelines in games and AI',
          text: 'A loader thread reads and decodes assets into a queue while the game loop takes finished ones; a data pipeline has threads reading files, one group transforming and a final stage batching. Bounded queues (`Queue(maxsize=10)`) add **back-pressure**: when a consumer falls behind, producers block instead of filling all memory.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the thread-safe increment so the lock is always released, even if an exception occurs.',
      template: `import threading
lock = threading.Lock()
count = 0

def add():
    global count
    ___ lock:
        count ___ 1`,
      templateIsCode: true,
      blanks: [{ answers: ['with'] }, { answers: ['+='] }],
      wordBank: ['with', '+=', '-=', 'while', 'if'],
      explanation: '`with lock:` acquires the lock on entry and releases it on exit however the block ends. The critical section — the whole read–modify–write `count += 1` — sits inside it.',
    },
    {
      kind: 'concept',
      title: 'Executors and futures: the easy way',
      blocks: [
        {
          type: 'p',
          text: 'Managing threads and queues by hand is repetitive. The standard library’s **`concurrent.futures`** gives you a ready-made pool: **`ThreadPoolExecutor(max_workers=n)`**. You **`submit(function, *args)`** work and immediately get a **[[future]]** — a placeholder for the eventual result. `future.result()` waits for the value, or **re-raises** the exception the work raised. `executor.map(func, items)` is the shortcut for "apply to every item, give me results in order". Used as a context manager (`with ... as pool`), it waits for all work and shuts the threads down when the block ends. `as_completed(futures)` yields futures in the order they *finish*.',
        },
        {
          type: 'code',
          title: 'thread_pool.py',
          desktopOnly: true,
          code: `import time
from concurrent.futures import ThreadPoolExecutor, as_completed

def fetch(name, delay):
    time.sleep(delay)
    if name == "bad":
        raise ValueError("server error")
    return f"{name} done"

jobs = [("a", 0.3), ("b", 0.1), ("bad", 0.2)]
start = time.perf_counter()
with ThreadPoolExecutor(max_workers=3) as pool:
    futures = {pool.submit(fetch, n, d): n for n, d in jobs}
    for fut in as_completed(futures):
        name = futures[fut]
        try:
            print(name, "->", fut.result())
        except ValueError as exc:
            print(name, "failed:", exc)
elapsed = time.perf_counter() - start
print("overlapped:", elapsed < 0.5)`,
          output: `b -> b done
bad failed: server error
a -> a done
overlapped: True`,
          annotations: [
            { lines: '4-8', text: 'A pretend network request: wait, maybe fail, return a result. The `sleep` stands in for waiting on a server.' },
            { lines: 10, text: 'Three jobs with different delays; the middle one will fail.' },
            { lines: 12, text: 'The `with` block creates a pool of 3 threads and guarantees they are cleaned up afterwards.' },
            { lines: 13, text: '`submit` starts a job and returns a `Future` at once. We keep a dictionary from each future to its job name.' },
            { lines: 14, text: '`as_completed` hands back futures as they *finish*: b (0.1 s), then bad (0.2 s), then a (0.3 s).' },
            { lines: '16-19', text: '`result()` returns the value or raises the worker’s exception here, in the calling thread, where ordinary `try`/`except` handles it. A failure of one job does not affect the others.' },
            { lines: 21, text: 'The three waits overlapped: the total is about 0.3 s, not 0.6 s. (The sample output is from a real run.)' },
          ],
        },
        {
          type: 'p',
          text: 'A `Future` is also an ordinary object you can use without any threads, which makes the idea easy to explore: it starts *pending*, and someone calls `set_result` or `set_exception` exactly once. `result()` returns or raises accordingly, and `add_done_callback` runs a function when it completes — immediately, if it already has.',
        },
        {
          type: 'code',
          title: 'future_basics.py',
          runnable: true,
          code: `from concurrent.futures import Future

f = Future()
print(f.done())
f.set_result(42)
print(f.done(), f.result())

g = Future()
g.set_exception(ValueError("boom"))
print(type(g.exception()).__name__)
try:
    g.result()
except ValueError as e:
    print("re-raised:", e)`,
          output: `False
True 42
ValueError
re-raised: boom`,
          annotations: [
            { lines: '3-4', text: 'A new future is *pending*: no result yet, `done()` is False.' },
            { lines: '5-6', text: 'Once the producer calls `set_result(42)` the future is done and `result()` returns the value (a consumer calling `result()` earlier would have waited).' },
            { lines: '8-9', text: 'A future can also complete with an **exception** instead of a value.' },
            { lines: 10, text: '`exception()` returns the stored exception object without raising it.' },
            { lines: '11-14', text: '`result()` re-raises it in whoever asks. This is how errors travel from a worker thread back to the caller.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Choosing the pool size',
          text: 'For I/O-bound work, use as many threads as you have simultaneous waits that make sense — often 8 to 64 for network calls, but respect servers’ rate limits. For CPU-bound work threads don’t help in standard Python (use `ProcessPoolExecutor`, next lesson, with about one worker per core). The same `submit`/`map`/`Future` API works for both, so you can switch by changing one class name.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does `join()` do?" (waits for a thread); "Why use `with lock:`?" (guaranteed release); "How do you stop a worker thread?" (a sentinel or an `Event`; you can’t kill it); "How does an exception travel from a pool worker?" (stored in the future; `result()` re-raises it); "Which is thread-safe, `list` or `queue.Queue`?" (the queue does its own locking for the operations you need).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A done-callback runs as soon as the future completes.',
      code: `from concurrent.futures import Future

log = []
f = Future()
f.add_done_callback(lambda fut: log.append(fut.result() * 2))
log.append("before")
f.set_result(21)
log.append("after")
print(log)`,
      answer: "['before', 42, 'after']",
      hint: 'The callback runs in the thread that calls `set_result`, right inside that call.',
      explanation: 'Registering the callback only stores it. `set_result(21)` completes the future and runs the callbacks *immediately*, in the calling thread — so 42 is appended between "before" and "after". With a thread pool the callback would run in the worker thread.',
    },
    {
      kind: 'error',
      prompt: 'Calling `add()` hangs forever: the program is deadlocked. Tap the faulty line.',
      lines: [
        'import threading',
        'lock = threading.Lock()',
        'count = 0',
        'def add():',
        '    global count',
        '    with lock:',
        '        lock.acquire()',
        '        count += 1',
        'add()',
      ],
      linesAreCode: true,
      errorLines: [7],
      explanation: '`with lock:` has already acquired the lock, and a plain `Lock` is not re-entrant, so `lock.acquire()` waits for the lock that the same thread holds: a self-deadlock. Remove line 7 (the `with` already acquires it) — or use an `RLock` if re-entry is genuinely needed.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`import queue`\n`q = queue.Queue()`\n`for n in range(5):`\n`    q.put(n)`\n`q.get()`\n`q.get()`\n`print(q.qsize())`',
      answer: '3',
      hint: 'Five items go in, two come out.',
      explanation: 'The queue received 0 to 4 (five items); two `get()` calls removed 0 and 1 (first in, first out), leaving 2, 3, 4: `qsize()` is 3.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a thread-safe counter class `SafeCounter`. It stores its value, protected by a `threading.Lock` kept in `self._lock`. `increment(by=1)` adds `by` to the value and returns the new value; the read-only property `value` returns the current value. **Both** must use `with self._lock:`.',
      starter: `import threading

class SafeCounter:
    ...
`,
      solution: `import threading


class SafeCounter:
    def __init__(self):
        self._value = 0
        self._lock = threading.Lock()

    def increment(self, by=1):
        with self._lock:
            self._value += by
            return self._value

    @property
    def value(self):
        with self._lock:
            return self._value
`,
      tests: `class RecLock:
    def __init__(self):
        self.enters = 0
        self.exits = 0

    def __enter__(self):
        self.enters += 1
        return self

    def __exit__(self, *exc):
        self.exits += 1
        return False

c = SafeCounter()
assert c.value == 0
assert c.increment() == 1
assert c.increment(5) == 6
assert c.value == 6
assert hasattr(c._lock, "acquire") and hasattr(c._lock, "release")

rec = RecLock()
c._lock = rec
c.increment()
assert (rec.enters, rec.exits) == (1, 1)
assert c.value == 7
assert (rec.enters, rec.exits) == (2, 2)

try:
    c.increment("x")
    assert False, "adding a string must fail"
except TypeError:
    pass
assert (rec.enters, rec.exits) == (3, 3)
assert c.value == 7

d = SafeCounter()
assert d.value == 0 and c.value == 7
c._lock = None
try:
    c.value = 5
    assert False, "value must be read-only"
except AttributeError:
    pass`,
      checks: ['Keeps the count and a \`threading.Lock\` in \`self._lock\`', '\`increment\` and \`value\` both use \`with self._lock:\`', 'The lock is released even when the update raises; \`value\` is read-only'],
      hint: 'Create `self._value = 0` and `self._lock = threading.Lock()`. In `increment`, put `self._value += by` and the `return` inside `with self._lock:`. Make `value` a `@property` that also reads under the lock.',
      explanation: 'Using the lock as a context manager guarantees it is released even if `+=` raises (the test’s failing `increment("x")` proves it: enters and exits stay equal). Reading under the lock too avoids seeing a half-finished update on platforms or future Python versions without a GIL.',
    },
    {
      kind: 'code',
      prompt: 'Write the consumer side of a pipeline: `drain(q, stop)` reads items from the `queue.Queue` `q` **until** it receives the sentinel `stop` (compared with `is`), and returns the list of items received before it. Call `q.task_done()` once for every item taken from the queue, including the sentinel. Items after the sentinel stay in the queue.',
      starter: `import queue

def drain(q, stop):
    ...
`,
      solution: `import queue


def drain(q, stop):
    items = []
    while True:
        item = q.get()
        q.task_done()
        if item is stop:
            return items
        items.append(item)
`,
      tests: `import queue

STOP = object()
q = queue.Queue()
for x in (1, 2, 3, STOP, 99):
    q.put(x)
assert drain(q, STOP) == [1, 2, 3]
assert q.qsize() == 1 and q.unfinished_tasks == 1
assert q.get() == 99

q2 = queue.Queue()
q2.put(None)
assert drain(q2, None) == []
assert q2.unfinished_tasks == 0

q3 = queue.Queue()
for x in ("a", "b", None):
    q3.put(x)
assert drain(q3, None) == ["a", "b"]
assert q3.unfinished_tasks == 0 and q3.empty()

q4 = queue.Queue()
for x in (0, "", [], "stop"):
    q4.put(x)
assert drain(q4, "stop") == [0, "", []]`,
      checks: ['Loops on \`q.get()\` and stops at the sentinel (\`is\`)', 'Calls \`q.task_done()\` for every item taken, including the sentinel', 'Leaves items after the sentinel in the queue; falsy items are kept'],
      hint: 'Loop forever: `item = q.get()`, `q.task_done()`, then `if item is stop: return items`, otherwise append the item. Compare with `is`, not truthiness, so items like `0` or `""` are not mistaken for the end.',
      explanation: 'Every consumed item must be acknowledged with `task_done()`, otherwise `q.join()` in the producer would wait forever. Comparing with `is stop` (not truthiness) matters because legitimate items such as `0` are falsy. This loop is the body of every worker thread you will write.',
    },
    {
      kind: 'code',
      prompt: 'Write `SerialExecutor`, a class with the same interface as `ThreadPoolExecutor` but running every call immediately in the current thread (useful for tests and debugging). `submit(fn, *args, **kwargs)` returns a **completed** `concurrent.futures.Future` holding the result or the exception raised. `map(fn, *iterables)` returns an iterator of the results in order. It must work as a context manager, and after leaving the `with` block `submit` must raise `RuntimeError("executor is shut down")`.',
      starter: `from concurrent.futures import Future

class SerialExecutor:
    ...
`,
      solution: `from concurrent.futures import Future


class SerialExecutor:
    def __init__(self):
        self._closed = False

    def submit(self, fn, /, *args, **kwargs):
        if self._closed:
            raise RuntimeError("executor is shut down")
        future = Future()
        try:
            future.set_result(fn(*args, **kwargs))
        except Exception as exc:
            future.set_exception(exc)
        return future

    def map(self, fn, *iterables):
        futures = [self.submit(fn, *args) for args in zip(*iterables)]
        return (f.result() for f in futures)

    def shutdown(self):
        self._closed = True

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        self.shutdown()
        return False
`,
      tests: `with SerialExecutor() as ex:
    f = ex.submit(pow, 2, 5)
    assert f.done() and f.result() == 32

    bad = ex.submit(int, "x")
    assert bad.done() and isinstance(bad.exception(), ValueError)
    try:
        bad.result()
        assert False, "result() must re-raise"
    except ValueError:
        pass

    assert list(ex.map(str.upper, ["a", "b"])) == ["A", "B"]
    assert list(ex.map(pow, [2, 3], [3, 2])) == [8, 9]
    kw = ex.submit(sorted, [3, 1, 2], reverse=True)
    assert kw.result() == [3, 2, 1]

try:
    ex.submit(len, "x")
    assert False, "must raise after shutdown"
except RuntimeError as e:
    assert str(e) == "executor is shut down"

ex2 = SerialExecutor()
assert ex2.submit(len, "abc").result() == 3
ex2.shutdown()
try:
    ex2.submit(len, "x")
    assert False
except RuntimeError:
    pass`,
      checks: ['\`submit\` returns a finished \`Future\` with the result or the exception', '\`map\` yields results in order; the class is a context manager', 'After shutdown \`submit\` raises \`RuntimeError("executor is shut down")\`'],
      hint: 'In `submit`, create `Future()`, run `fn(*args, **kwargs)` inside `try`, call `set_result` on success and `set_exception(exc)` on `Exception`. `map` can submit each tuple from `zip(*iterables)` and yield `f.result()`. `__exit__` should call `shutdown()`.',
      explanation: 'A future is just a result-or-exception container, and the executor is what fills it. Because `SerialExecutor` has the same methods as `ThreadPoolExecutor`, code written against that interface runs unchanged — deterministically and without threads — which is exactly why this trick is popular in unit tests.',
    },
  ],
  takeaways: [
    '`threading.Thread(target=...).start()` runs a function concurrently and `join()` waits for it. Output order is unpredictable, so collect results and combine them after the joins; exceptions in a thread stay in that thread.',
    'Shared mutable data needs protection: `with lock:` around the whole critical section. Locks can deadlock (a plain `Lock` can’t be re-acquired by its owner; keep a consistent order for several locks). Better still, share nothing.',
    '`queue.Queue` is the thread-safe way to pass work and results; stop workers with a sentinel and track completion with `task_done()`/`join()`.',
    '`ThreadPoolExecutor` + `Future`: `submit`, `map` and `as_completed` handle the plumbing, and `future.result()` re-raises worker exceptions in the caller. Threads suit I/O-bound work; for CPU-bound work use processes.',
    'Test concurrent logic deterministically where you can: fake locks, queues used in a single thread, and executors that run work serially.',
  ],
  reading: [
    { title: 'threading — Thread-based parallelism', url: 'https://docs.python.org/3/library/threading.html', source: 'docs', note: 'Reference for Thread, Lock, RLock, Event, Condition and thread-local data.' },
    { title: 'queue — A synchronized queue class', url: 'https://docs.python.org/3/library/queue.html', source: 'docs', note: 'Queue, LifoQueue, PriorityQueue and the task_done/join protocol.' },
    { title: 'concurrent.futures — Launching parallel tasks', url: 'https://docs.python.org/3/library/concurrent.futures.html', source: 'docs', note: 'ThreadPoolExecutor, ProcessPoolExecutor, Future, as_completed and wait.' },
    { title: 'Python Threading Tutorial (Real Python)', url: 'https://realpython.com/intro-to-python-threading/', source: 'article', note: 'A walkthrough from the first thread to race conditions, locks, deadlocks and queues.' },
  ],
};
