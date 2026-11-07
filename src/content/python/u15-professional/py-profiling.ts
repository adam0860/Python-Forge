import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-profiling',
  title: 'Profiling and Optimization',
  summary: 'Making Python programs faster the right way: measure with `timeit`, find hotspots with `cProfile`, then apply the big wins (better algorithms and data structures, caching, generators, NumPy vectorization), and check memory with `tracemalloc`.',
  minutes: 20,
  objectives: [
    'Explain why you must measure before optimizing and use Amdahl’s law to predict the gain of a speedup',
    'Time small snippets with `timeit` and entire programs with `cProfile`, and read the report',
    'Apply high-impact optimizations: sets and dicts, `deque`, `lru_cache`, generators and vectorization',
    'Measure memory use with `tracemalloc` and understand why generators save memory',
    'Know the options when pure Python is too slow: NumPy, compiled extensions, processes and newer interpreters',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Measure first, optimize second',
      blocks: [
        {
          type: 'p',
          text: 'Programmers are famously bad at guessing which part of a program is slow. The rule is: **make it correct, make it clear, and only then — if it is too slow — make it fast, guided by measurement.** A program’s run time is usually concentrated in a tiny part, the **[[hotspot]]**; speeding up anything else is wasted effort and often makes the code harder to read. Measuring needs a stopwatch you can trust: `time.perf_counter()` for a quick span, and `timeit` for small snippets, because `timeit` repeats the code many times and disables the garbage collector to reduce noise. Always compare *alternatives* — a measurement of one version tells you very little.',
        },
        {
          type: 'code',
          title: 'timeit_demo.py',
          runnable: true,
          code: `import timeit

items = list(range(5000))
as_set = set(items)

t_list = timeit.timeit("4999 in items", globals={"items": items}, number=2000)
t_set = timeit.timeit("4999 in items", globals={"items": as_set}, number=2000)
print(t_set < t_list, t_list / t_set > 10)`,
          output: `True True`,
          annotations: [
            { lines: '3-4', text: 'The same 5000 numbers stored in a list and in a set.' },
            { lines: '6-7', text: '`timeit.timeit(statement, globals=..., number=N)` runs the statement `N` times and returns the **total seconds**. Both lines time the identical expression `4999 in items` — only the container differs. The number is the worst case for a list (the last element).' },
            { lines: 8, text: 'Exact seconds differ on every computer, so the program prints only robust conclusions: the set is faster, by more than a factor of 10. (Typically it is hundreds of times faster: a list scans 5000 items, a set jumps straight to the right bucket.)' },
          ],
        },
        {
          type: 'p',
          text: 'How much will a speedup help overall? That is **[[amdahls-law]]** again, this time applied to a single function. If a part that takes a fraction `f` of the total run time becomes `s` times faster, the whole program speeds up by:',
        },
        {
          type: 'math',
          tex: 'S = \\frac{1}{(1 - f) + \\frac{f}{s}}',
          caption: 'Overall speedup S when a part taking fraction f of the time is made s times faster. Even with s = infinity, S can never exceed 1/(1 - f).',
        },
        {
          type: 'p',
          text: 'Example: doubling the speed of a function that takes 10% of the time gives `1 / (0.9 + 0.05)`, only about **1.05 times** faster overall. Making a function that takes 80% of the time four times faster gives `1 / (0.2 + 0.2) = 2.5` times. This is why profiling comes first: it tells you the `f` of every candidate.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'The root of all evil?',
          text: 'Donald Knuth wrote that "premature optimization is the root of all evil" — about 97% of the time you should forget small efficiencies, and spend your effort on the critical 3%. Clear code is easier to fix, test and speed up later. In games the budget is explicit: at 60 frames per second each frame has about 16.7 ms for *everything*, so you profile the frame, find the few functions that eat the budget, and fix those.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Benchmark like a scientist',
          text: 'Use `timeit.repeat(...)` and take the **minimum**: slower runs are caused by other programs, never by your code being "sometimes faster". Time realistic data sizes, run on a quiet machine, and change one thing at a time. A micro-benchmark that wins by 5% is noise; look for factors of 2 and more.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Your program feels slow. What is the best first step?',
      options: [
        { text: 'Profile it to find which functions use most of the time', correct: true, why: 'A profile shows the real hotspots with data. You then work on the top entry, measure again, and stop when it is fast enough.' },
        { text: 'Rewrite the whole program in a faster language', why: 'That is the most expensive possible fix, and may not even help if the time is spent waiting for I/O or in one bad algorithm. Measure first.' },
        { text: 'Replace every for-loop by a list comprehension', why: 'Comprehensions are somewhat faster than loops that append, but rarely by enough to matter, and changing code at random is not optimization.' },
        { text: 'Buy a faster computer', why: 'Hardware may help but does not fix a quadratic algorithm; and without measurement you do not know if CPU is even the bottleneck.' },
      ],
      explanation: 'Profile first: find the hotspot, fix that, measure again. Anything else is guessing.',
    },
    {
      kind: 'concept',
      title: 'cProfile: where does the time go?',
      blocks: [
        {
          type: 'p',
          text: 'A **[[profiler]]** watches a whole run and records, for every function, how often it was called and how long it took. Python ships one, **`cProfile`**. From the command line, `python -m cProfile -s tottime script.py` runs your program and prints a table sorted by time. The columns that matter: **ncalls** (number of calls), **tottime** (time inside the function itself, not counting the functions it called) and **cumtime** (including everything it called). Look at the top rows by `tottime` for hotspots and by `cumtime` for slow *paths*. Here is a real profile of a prime-counting program (times are from one run).',
        },
        {
          type: 'code',
          title: 'slow.py and its profile',
          lang: 'text',
          code: `def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    return True

def count_primes(limit):
    return sum(1 for n in range(limit) if is_prime(n))

print(count_primes(50_000))

$ python -m cProfile -s tottime slow.py
5133
         55140 function calls in 0.051 seconds

   Ordered by: internal time

   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
    50000    0.042    0.000    0.042    0.000 slow.py:1(is_prime)
     5134    0.009    0.000    0.050    0.000 slow.py:10(<genexpr>)
        1    0.001    0.001    0.051    0.051 {built-in method builtins.sum}
        1    0.000    0.000    0.051    0.051 slow.py:9(count_primes)`,
          annotations: [
            { lines: 14, text: 'Run the program under the profiler, sorted by `tottime` (time spent inside each function itself).' },
            { lines: 16, text: 'Overall: 55,140 function calls in 0.051 s. Profiling adds some overhead, so compare proportions, not absolute seconds.' },
            { lines: 20, text: 'The columns: calls, own time, own time per call, cumulative time (including callees), and where the function lives.' },
            { lines: 21, text: 'The **hotspot**: `is_prime` was called 50,000 times and spent 0.042 of 0.051 seconds there (over 80%). Speeding up `is_prime` — for example by skipping even numbers or using a sieve — is where all the gain is.' },
            { lines: '22-24', text: 'The generator expression, `sum` and `count_primes` have large *cumulative* times only because they call `is_prime`; their own time is small. That is the difference between `tottime` and `cumtime`.' },
          ],
        },
        {
          type: 'p',
          text: 'The profiler is also a library, so you can profile just one section and inspect the numbers in code with `pstats`. This example profiles a tiny function and prints deterministic call counts (the timings would vary):',
        },
        {
          type: 'code',
          title: 'cprofile_api.py',
          runnable: true,
          code: `import cProfile
import pstats

def square(x):
    return x * x

def slow_sum(n):
    total = 0
    for i in range(n):
        total += square(i)
    return total

prof = cProfile.Profile()
prof.enable()
slow_sum(1000)
prof.disable()
stats = pstats.Stats(prof)
calls = {func[2]: data[1] for func, data in stats.stats.items()}
print(calls["square"], calls["slow_sum"])`,
          output: `1000 1`,
          annotations: [
            { lines: '14-16', text: 'Profile only the code between `enable()` and `disable()`.' },
            { lines: 17, text: '`pstats.Stats` holds the results; `stats.print_stats(10)` would print the top ten rows as a table.' },
            { lines: 18, text: '`stats.stats` maps `(file, line, name)` to `(primitive calls, total calls, tottime, cumtime, callers)`. We take the call count for each function name.' },
            { lines: 19, text: '`square` was called 1000 times, `slow_sum` once — the profiler counts exactly, even though the times vary.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Tools beyond cProfile',
          text: 'Visualize a profile with **snakeviz** (`pip install snakeviz`, then `snakeviz out.prof`) as a clickable icicle chart. **line_profiler** times every individual line of a function. **py-spy** attaches to an already-running process without changing it. **scalene** also tracks memory and GPU use. For PyTorch, `torch.profiler` shows which operations and GPU kernels dominate a training step.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ programmers use `perf`, VTune or Valgrind’s callgrind, and optimize cache behavior and instructions. In Python the dominant costs are different: interpreter overhead per bytecode, object allocation, and — above all — **algorithms and data structures**. A better algorithm in Python beats a micro-tuned bad one in C++.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you make a function that takes 10% of a program’s run time twice as fast, the whole program becomes about twice as fast.',
      answer: false,
      explanation: 'False. Only 10% of the time is affected: new time = 0.9 + 0.05 = 0.95 of the old, a speedup of about 1.05. Amdahl’s law: the gain is limited by the fraction of time that you improve.',
    },
    {
      kind: 'concept',
      title: 'The big wins: algorithms, data structures and caching',
      blocks: [
        {
          type: 'p',
          text: 'Once the profiler has named the hotspot, the biggest improvement almost always comes from **doing less work**, not from doing the same work faster. Use the right **data structure** (a set or dict gives constant-time lookup where a list needs a full scan), pick a better **algorithm** (sorting once then binary-searching beats searching repeatedly), and avoid recomputing the same result. That last one is **[[memoization]]**: `functools.cache` / `functools.lru_cache` remember the result for each argument, so a repeated call is a dictionary lookup. The classic demonstration is the Fibonacci function, whose naive recursion recomputes the same values exponentially often.',
        },
        {
          type: 'code',
          title: 'cache_demo.py',
          runnable: true,
          code: `from functools import lru_cache

calls = 0
def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

fib(20)
naive = calls

calls = 0
@lru_cache(maxsize=None)
def fib2(n):
    global calls
    calls += 1
    return n if n < 2 else fib2(n - 1) + fib2(n - 2)

fib2(20)
print(naive, calls, fib2.cache_info().hits)`,
          output: `21891 21 18`,
          annotations: [
            { lines: '4-7', text: 'Plain recursive Fibonacci with a global counter of calls.' },
            { lines: '9-10', text: 'Computing `fib(20)` takes **21,891** calls: `fib(18)` alone is recomputed thousands of times.' },
            { lines: '13-17', text: 'The same function with `@lru_cache(maxsize=None)`: the first call for each argument runs the body and stores the answer; later calls return the stored value without running the body.' },
            { lines: 20, text: 'Only **21** real calls (one per value 0 to 20) and 18 cache hits instead of 21,891 calls — from exponential to linear work with one line. `cache_info()` reports hits and misses.' },
          ],
        },
        {
          type: 'table',
          headers: ['Situation', 'Slow', 'Faster'],
          rows: [
            ['Is `x` among many items?', '`x in some_list` scans the list: O(n)', '`x in some_set` or a dict: O(1) on average'],
            ['Queue with removals from the front', '`list.pop(0)` shifts every element: O(n)', '`collections.deque.popleft()`: O(1)'],
            ['Same pure function called repeatedly with the same arguments', 'Recompute every time', '`@functools.cache` / `lru_cache`'],
            ['Building one big string', 'Repeated `s += piece` may copy again and again', '`"".join(pieces)`'],
            ['Counting things', 'A hand-written dictionary loop', '`collections.Counter`'],
            ['A large sequence used once', 'Build a full list first', 'A generator expression: constant memory'],
            ['Math on millions of numbers', 'A Python `for` loop', 'NumPy / PyTorch array operations (vectorization)'],
          ],
          caption: 'The optimizations that pay off most often. Profile first to see whether they apply.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Use the built-ins',
          text: '`sum`, `min`, `max`, `sorted`, `any`, `all`, `str.join`, `dict`, `set` and the `itertools` functions are implemented in C and are much faster than the equivalent hand-written Python loops. If a standard-library function does the job, use it — it is both faster and clearer.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Cache only pure functions',
          text: 'Memoization is correct only when the result depends *only* on the arguments (a **pure** function) and the arguments are hashable. Caching a function that reads a file, the clock or a random generator returns stale answers. An unbounded cache also holds on to memory; use `maxsize=128` or similar for functions with many distinct arguments.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so each Fibonacci value is computed only once.',
      template: `from functools import ___

@___(maxsize=None)
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)`,
      templateIsCode: true,
      blanks: [{ answers: ['lru_cache'] }, { answers: ['lru_cache'] }],
      wordBank: ['lru_cache', 'cache', 'wraps', 'partial'],
      explanation: '`functools.lru_cache` is a decorator that stores results by argument (`maxsize=None` means unbounded). The decorator is imported once and then applied with `@lru_cache(maxsize=None)`.',
    },
    {
      kind: 'concept',
      title: 'Memory, vectorization and going beyond pure Python',
      blocks: [
        {
          type: 'p',
          text: 'Speed and memory are linked: huge lists mean allocating millions of objects, and a Python `int` or `float` object costs about 24–32 bytes. Use `tracemalloc` to see where memory goes. The example compares summing squares from a **list** (all 100,000 numbers exist at the same time) with a **generator** (one number at a time), measuring the peak memory of each.',
        },
        {
          type: 'code',
          title: 'memory_demo.py',
          runnable: true,
          code: `import tracemalloc

def peak(make):
    tracemalloc.start()
    total = sum(make())
    top = tracemalloc.get_traced_memory()[1]
    tracemalloc.stop()
    return total, top

t1, p1 = peak(lambda: [i * i for i in range(100_000)])
t2, p2 = peak(lambda: (i * i for i in range(100_000)))
print(t1 == t2, p1 > 10 * p2)`,
          output: `True True`,
          annotations: [
            { lines: '3-8', text: '`tracemalloc` tracks every allocation made by Python. `get_traced_memory()` returns `(current, peak)`; we keep the **peak** bytes during the call.' },
            { lines: 10, text: 'A list comprehension builds the whole list before `sum` starts — the peak is a few megabytes.' },
            { lines: 11, text: 'A generator expression produces each square when `sum` asks for it, so memory stays tiny and constant.' },
            { lines: 12, text: 'The totals are identical, and the list needed more than ten times the memory (typically hundreds of times).' },
          ],
        },
        {
          type: 'p',
          text: 'For numeric work the biggest single speedup in the Python world is **[[vectorization]]**: instead of looping over numbers in Python, hand the whole array to NumPy (or PyTorch), whose compiled loops run 10 to 100 times faster. This is why almost all AI code is written as array operations and why the NumPy lessons of the next course matter so much. The example uses NumPy, which the app loads on demand.',
        },
        {
          type: 'code',
          title: 'vectorize_demo.py',
          runnable: true,
          packages: ['numpy'],
          code: `import time
import numpy as np

data = list(range(200_000))
arr = np.arange(200_000, dtype=np.int64)

start = time.perf_counter()
total_loop = 0
for x in data:
    total_loop += x * x
t_loop = time.perf_counter() - start

start = time.perf_counter()
total_vec = int((arr * arr).sum())
t_vec = time.perf_counter() - start

print(total_loop == total_vec, t_loop / t_vec > 5)`,
          output: `True True`,
          annotations: [
            { lines: '4-5', text: 'The same 200,000 numbers as a Python list and as a NumPy array of 64-bit integers.' },
            { lines: '7-11', text: 'A Python loop: each iteration is interpreted bytecode working on Python objects.' },
            { lines: '13-15', text: 'The vectorized version: `arr * arr` and `.sum()` each run one tight compiled loop over the array.' },
            { lines: 17, text: 'Same answer, and the vectorized version was more than five times faster (typically 20–100 times). The check uses a ratio, not exact times, because seconds differ between computers.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'When pure Python is still too slow',
          text: 'In rough order of effort: **1.** better algorithm and data structures; **2.** NumPy/PyTorch vectorization; **3.** `multiprocessing` for independent CPU-bound jobs (previous lessons); **4.** **Numba** (compiles numeric Python functions with one decorator) or **Cython** (Python-like code compiled to C); **5.** write the hotspot in C, C++ or Rust and call it from Python (pybind11, PyO3, `ctypes`) — this is how NumPy and PyTorch themselves are built; **6.** another interpreter such as **PyPy** (a JIT compiler for plain Python). Recent CPython versions also include an experimental JIT and an optional free-threaded build without the GIL, but the first four steps remain the practical ones today.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Optimizing game and AI code',
          text: 'Profile one **frame** or one **training step**, not the whole program. Common hotspots: Python loops over entities (vectorize with NumPy, or batch them into tensors), repeated allocation inside the game loop (reuse buffers), data loading starving the GPU (more `DataLoader` workers), and tiny GPU operations launched one at a time (batch them). In reinforcement learning, the environment step is often slower than the neural network — profile before buying a GPU.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What do you do before optimizing?" (measure/profile); "`tottime` vs `cumtime`?" (own time vs including callees); "Why is `x in set` faster than `x in list`?" (hashing vs linear scan); "What does `lru_cache` require?" (pure function, hashable arguments); "Why are generators memory-friendly?" (one item at a time); "What is vectorization?" (whole-array operations in compiled code).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. `sq` is memoized with `lru_cache`.',
      code: `from functools import lru_cache
calls = 0
@lru_cache(maxsize=None)
def sq(x):
    global calls
    calls += 1
    return x * x
print(sq(3) + sq(3) + sq(4), calls)`,
      answer: '34 2',
      hint: 'The body only runs for argument values that are not in the cache yet.',
      explanation: 'The sum is `9 + 9 + 16 = 34`. The body ran for `3` the first time and for `4`, but the second `sq(3)` came from the cache, so `calls` is 2.',
    },
    {
      kind: 'error',
      prompt: 'This program removes duplicate words but takes minutes on a million words, because the time grows with the *square* of the word count. Tap the faulty line.',
      lines: [
        'seen = []',
        'for word in words:',
        '    if word in seen:',
        '        continue',
        '    seen.append(word)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`word in seen` on a *list* scans the list from the start, so each lookup costs O(n) and the loop is O(n²). Make `seen` a set (`seen = set()`, `seen.add(word)`): lookups become O(1) on average and the loop O(n).',
    },
    {
      kind: 'numeric',
      prompt: 'The profiler shows that `update_ai()` takes **80%** of a game’s frame time. You make it **4 times faster**. By what factor is the whole frame faster? (Use `S = 1 / ((1 - f) + f / s)`.)',
      answer: '2.5',
      hint: 'With f = 0.8 and s = 4: the new time is 0.2 + 0.8/4 of the old time.',
      explanation: 'New time = (1 - 0.8) + 0.8 / 4 = 0.2 + 0.2 = 0.4 of the old, so the speedup is 1 / 0.4 = 2.5. Even an infinitely fast `update_ai()` could give at most 1 / 0.2 = 5 — the other 20% sets the limit.',
      label: 'Speedup:',
    },
    {
      kind: 'code',
      prompt: 'Write `best_time(func, repeat=5, timer=time.perf_counter)`. It calls `func()` (no arguments) `repeat` times; each run is timed by calling `timer()` once just before and once just after. Return the **smallest** elapsed time. Raise `ValueError` if `repeat < 1`. (The `timer` parameter lets tests pass a fake clock.)',
      starter: `import time

def best_time(func, repeat=5, timer=time.perf_counter):
    ...
`,
      solution: `import time


def best_time(func, repeat=5, timer=time.perf_counter):
    if repeat < 1:
        raise ValueError("repeat must be at least 1")
    best = None
    for _ in range(repeat):
        start = timer()
        func()
        elapsed = timer() - start
        if best is None or elapsed < best:
            best = elapsed
    return best
`,
      tests: `ticks = iter([0, 3, 3, 4, 4, 9])
runs = []
result = best_time(lambda: runs.append(1), repeat=3, timer=lambda: next(ticks))
assert result == 1
assert len(runs) == 3

ticks = iter([10, 12])
assert best_time(lambda: None, repeat=1, timer=lambda: next(ticks)) == 2

ticks = iter([0, 5, 5, 6])
assert best_time(lambda: None, repeat=2, timer=lambda: next(ticks)) == 1

for bad in (0, -3):
    try:
        best_time(lambda: None, repeat=bad)
        assert False, "must raise ValueError"
    except ValueError:
        pass

assert isinstance(best_time(lambda: sum(range(1000))), float)
assert best_time(lambda: sum(range(1000)), repeat=3) >= 0`,
      checks: ['Calls \`func()\` exactly \`repeat\` times, timing each run with two \`timer()\` calls', 'Returns the minimum elapsed time, not the average or the last', 'Raises \`ValueError\` when \`repeat < 1\`; works with the default timer'],
      hint: 'In a loop: `start = timer()`, `func()`, `elapsed = timer() - start`; keep the smallest value seen so far (start with `best = None`).',
      explanation: 'Taking the minimum filters out noise: other programs and the operating system can only make a run slower, never faster, so the fastest run is the closest to the true cost. This is what `timeit.repeat` plus `min` does.',
    },
    {
      kind: 'code',
      prompt: 'Write a decorator `counted(func)` that counts calls (a tiny profiler). The wrapped function must behave like `func` (arguments and return value, name preserved with `functools.wraps`), and have an attribute `calls` holding the number of calls so far and a function attribute `reset()` that sets it back to 0.',
      starter: `from functools import wraps

def counted(func):
    ...
`,
      solution: `from functools import wraps


def counted(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)

    def reset():
        wrapper.calls = 0

    wrapper.calls = 0
    wrapper.reset = reset
    return wrapper
`,
      tests: `@counted
def add(a, b=0):
    "adds"
    return a + b

assert add.calls == 0
assert add(1, 2) == 3
assert add(5, b=1) == 6
assert add.calls == 2
add.reset()
assert add.calls == 0
add(1)
assert add.calls == 1
assert add.__name__ == "add"
assert add.__doc__ == "adds"

@counted
def boom():
    raise KeyError("x")

try:
    boom()
except KeyError:
    pass
assert boom.calls == 1

@counted
def other():
    return "o"

other()
assert other.calls == 1 and add.calls == 1`,
      checks: ['The wrapper passes arguments through and returns the original result', '\`calls\` counts every call (even ones that raise), and \`reset()\` sets it to 0', 'Uses \`functools.wraps\` so the name and docstring are preserved; each decorated function has its own counter'],
      hint: 'Define `wrapper(*args, **kwargs)` that does `wrapper.calls += 1` and returns `func(*args, **kwargs)`. Set `wrapper.calls = 0` and `wrapper.reset = ...` before returning `wrapper`, and decorate `wrapper` with `@wraps(func)`.',
      explanation: 'Functions are objects, so the wrapper can carry its own counter as an attribute. Counting calls is the core of what a profiler records (`ncalls`); with a timer around the call you could add `tottime` as well.',
    },
    {
      kind: 'code',
      prompt: 'Fix the quadratic duplicate removal. Write `dedupe(items)` returning a list of the unique items in their **original order** (keep the first occurrence). Items are hashable. It must run in linear time — the tests count equality comparisons to catch list scans.',
      starter: `def dedupe(items):
    ...
`,
      solution: `def dedupe(items):
    seen = set()
    out = []
    for item in items:
        if item not in seen:
            seen.add(item)
            out.append(item)
    return out
`,
      tests: `assert dedupe([]) == []
assert dedupe([1, 2, 1, 3, 2, 1]) == [1, 2, 3]
assert dedupe("mississippi") == ["m", "i", "s", "p"]
assert dedupe([(1, 2), (1, 2), (2, 1)]) == [(1, 2), (2, 1)]
assert type(dedupe([1])) is list

counter = [0]

class Tok:
    def __init__(self, v):
        self.v = v
    def __hash__(self):
        return hash(self.v)
    def __eq__(self, other):
        counter[0] += 1
        return self.v == other.v

toks = [Tok(i) for i in range(300)] * 3
out = dedupe(toks)
assert [t.v for t in out] == list(range(300))
assert counter[0] < 5000, counter[0]`,
      checks: ['Returns the unique items as a list, keeping the first occurrence and the original order', 'Uses a set for membership tests, so the work is linear', 'Does not mutate the input; handles empty input'],
      hint: 'Keep a `set` of items already seen plus an output list. For each item: if it is not in the set, add it to both.',
      explanation: 'A set lookup hashes the item and goes straight to its bucket, so each test is O(1) instead of scanning a list. The output list preserves order, because sets do not. In Python 3.7+ `list(dict.fromkeys(items))` is a one-line equivalent.',
    },
  ],
  takeaways: [
    'Measure before optimizing: correctness and clarity first. Use `time.perf_counter` and `timeit` (take the minimum of repeats) for snippets, and `cProfile` (`python -m cProfile -s tottime script.py`) for whole programs.',
    'Read profile output with `ncalls`, `tottime` (own time) and `cumtime` (with callees). The **hotspot** is where the gain is; Amdahl’s law `1 / ((1 - f) + f/s)` predicts how much a speedup will help overall.',
    'The biggest wins come from doing less work: sets and dicts instead of list scans, `deque` for queues, `lru_cache` for repeated pure calls, built-in functions and generators instead of hand-written loops and big lists.',
    'Check memory with `tracemalloc`. For numeric code, **vectorize** with NumPy or PyTorch instead of looping in Python — typically 10 to 100 times faster.',
    'If pure Python is still too slow: processes for independent jobs, Numba or Cython, a compiled extension (C, C++, Rust), or PyPy — in that order of effort. In games and AI, profile a single frame or training step.',
  ],
  reading: [
    { title: 'The Python Profilers (cProfile and profile)', url: 'https://docs.python.org/3/library/profile.html', source: 'docs', note: 'Reference for cProfile and pstats: command line, sorting and report columns.' },
    { title: 'timeit — Measure execution time of small code snippets', url: 'https://docs.python.org/3/library/timeit.html', source: 'docs', note: 'Command-line and Python interfaces, and notes on why `timeit` is more reliable than a stopwatch.' },
    { title: 'tracemalloc — Trace memory allocations', url: 'https://docs.python.org/3/library/tracemalloc.html', source: 'docs', note: 'Peak memory, snapshots and finding the lines that allocate most.' },
    { title: 'functools — cache and lru_cache', url: 'https://docs.python.org/3/library/functools.html#functools.lru_cache', source: 'docs', note: 'Memoization decorators, `cache_info` and `cache_clear`.' },
    { title: 'Python Speed — Performance Tips', url: 'https://wiki.python.org/moin/PythonSpeed/PerformanceTips', source: 'article', note: 'The classic community wiki page of micro-level tips; read it after profiling, not before.' },
  ],
};
