import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-recursion',
  title: 'Recursion',
  summary: 'Functions that call themselves: base cases and recursive cases, tracing the call stack, recursive data like nested lists and folders, the cost of naive Fibonacci and memoization, Python’s recursion limit, and flood fill on a grid.',
  minutes: 21,
  objectives: [
    'Write a recursive function with a base case and a recursive case, and trace its calls on the stack',
    'Use recursion for naturally nested data: flattening lists, summing folder sizes',
    'Explain why naive recursive Fibonacci is exponential and fix it with `functools.cache`',
    'Explain Python’s recursion limit, `RecursionError`, and how to rewrite recursion as a loop',
    'Apply recursion to grid problems such as flood fill, and to divide-and-conquer such as binary search',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A function that calls itself',
      blocks: [
        {
          type: 'p',
          text: '**Recursion** means a function solves a problem by calling *itself* on a smaller piece of it. Every recursive function has two parts: a **base case** that gives the answer directly without recursing, and a **recursive case** that reduces the problem and trusts the function to handle the smaller version. Without a base case the calls never stop.',
        },
        {
          type: 'code',
          title: 'recursion_basics.py',
          runnable: true,
          code: `def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))
print([factorial(i) for i in range(6)])

def countdown(n):
    if n == 0:
        print("Liftoff!")
        return
    print(n)
    countdown(n - 1)

countdown(3)`,
          output: `120
[1, 1, 2, 6, 24, 120]
3
2
1
Liftoff!`,
          annotations: [
            { lines: '2-3', text: 'The **base case**: 1! is 1, so we stop here and return directly.' },
            { lines: 4, text: 'The **recursive case**: $n! = n \\times (n-1)!$. We call `factorial` with a *smaller* argument and multiply the answer by `n`. We trust the smaller call to work.' },
            { lines: '10-12', text: 'A base case doesn’t have to return a value — `countdown` just prints and stops.' },
            { lines: 14, text: 'Each call moves one step toward the base case (`n - 1`). If it didn’t, the recursion would never end.' },
          ],
        },
        {
          type: 'math',
          tex: 'n! = \\begin{cases} 1 & n \\le 1 \\\\ n \\cdot (n-1)! & n > 1 \\end{cases}',
          caption: 'The mathematical definition is already recursive — and so is the code.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does it work?',
          text: 'Think of proof by induction: if you can answer the smallest case, and you can answer any case *given* the answer to the next smaller one, you can answer them all. The recursion unwinds exactly like that — `factorial(5)` waits for `factorial(4)`, which waits for `factorial(3)`, down to the base case, and then the answers flow back up.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What goes wrong with this function when you call `f(3)`?\n\n```\ndef f(n):\n    return n * f(n - 1)\n```',
      options: [
        { text: 'It returns 6', why: 'That would need a base case at 1. This function never stops multiplying.' },
        { text: 'It returns 0', why: 'Nothing ever returns a value to start unwinding the multiplication.' },
        { text: 'It recurses until Python raises `RecursionError`', correct: true, why: 'Right: `f(3)`, `f(2)`, `f(1)`, `f(0)`, `f(-1)`… with no base case, the calls pile up until the stack limit is hit.' },
        { text: 'It raises `SyntaxError` because a function cannot call itself', why: 'A function can call itself — the name is looked up when the call happens, by which time it exists.' },
      ],
      explanation: 'Without a base case the recursion has no way to stop. Adding `if n <= 1: return 1` before the last line fixes it. Always ask two questions of a recursive function: *what is the base case?* and *does every call move toward it?*',
    },
    {
      kind: 'concept',
      title: 'Seeing the call stack',
      blocks: [
        {
          type: 'p',
          text: 'Each recursive call gets its own frame on the call stack, with its own copy of `n` and any local variables. The calls go **down** until the base case, then return **up**, each one finishing its own work with the answer from the one below. Printing with indentation makes that visible:',
        },
        {
          type: 'code',
          title: 'trace_sum.py',
          runnable: true,
          code: `def trace_sum(n, depth=0):
    pad = "  " * depth
    print(f"{pad}sum_to({n})")
    if n == 0:
        result = 0
    else:
        result = n + trace_sum(n - 1, depth + 1)
    print(f"{pad}-> {result}")
    return result

trace_sum(3)`,
          output: `sum_to(3)
  sum_to(2)
    sum_to(1)
      sum_to(0)
      -> 0
    -> 1
  -> 3
-> 6`,
          annotations: [
            { lines: 3, text: 'On the way **down**, each call announces itself, indented one level deeper.' },
            { lines: 7, text: 'This line makes the recursive call and *waits* for its result. The current frame is paused here while the deeper ones run.' },
            { lines: 8, text: 'On the way **up**, each call prints its result. `sum_to(0)` returns 0, `sum_to(1)` adds 1, `sum_to(2)` adds 2, and `sum_to(3)` adds 3: the total is 6.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'How to think about recursion',
          text: 'Don’t try to follow every call in your head. Instead, **assume the recursive call works** on the smaller problem, and ask only: "given that answer, how do I produce mine?" Then check the base case separately. That is how experienced programmers write recursive code without tracing the whole stack.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Remember that the text is built on the way *back up* from the base case.',
      code: `def f(n):
    if n == 0:
        return "x"
    return f(n - 1) + str(n)

print(f(3))`,
      answer: 'x123',
      hint: 'Find `f(0)` first and work upward: `f(1)`, `f(2)`, `f(3)`.',
      explanation: '`f(0)` is `"x"`. `f(1)` is `f(0) + "1"` = `"x1"`, `f(2)` is `"x1" + "2"` = `"x12"`, and `f(3)` is `"x12" + "3"` = `"x123"`. The string is assembled during the unwinding, so the deepest call contributes first.',
    },
    {
      kind: 'concept',
      title: 'Recursion shines on recursive data',
      blocks: [
        {
          type: 'p',
          text: 'Some data is itself defined in terms of smaller copies of itself: a list that may contain lists, a folder that may contain folders, a skill tree, a scene graph. Recursion matches these shapes exactly — a loop would need an explicit stack to do the same job.',
        },
        {
          type: 'code',
          title: 'recursive_data.py',
          runnable: true,
          code: `def total(items):
    if not items:
        return 0
    return items[0] + total(items[1:])

def flatten(data):
    flat = []
    for item in data:
        if isinstance(item, list):
            flat.extend(flatten(item))
        else:
            flat.append(item)
    return flat

print(total([4, 8, 15]))
print(flatten([1, [2, [3, 4]], 5, [[6]]]))

def size(folder):
    return sum(size(v) if isinstance(v, dict) else v for v in folder.values())

disk = {"a.txt": 10, "saves": {"s1": 5, "s2": 7, "old": {"x": 1}}, "b.txt": 20}
print(size(disk))`,
          output: `27
[1, 2, 3, 4, 5, 6]
43`,
          annotations: [
            { lines: '2-3', text: 'Base case: the sum of an empty list is 0.' },
            { lines: 4, text: 'Recursive case: the first item plus the sum of *the rest*. (Slicing copies the list each time, so this is a teaching example, not an efficient one.)' },
            { lines: 9, text: '`isinstance(item, list)` asks whether an item is itself a list. If so, flatten it recursively; if not, it is a plain value.' },
            { lines: 19, text: 'A folder is a dict whose values are either file sizes or sub-folders. A sub-folder is measured by the same function, so the nesting depth doesn’t matter.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Game and tool code runs into recursive structures constantly: scene graphs (an object’s children have children), skill and dialogue trees, JSON and config files with nested sections, and file-system walks when building an asset pipeline.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'isinstance, not type()',
          text: '`isinstance(x, list)` also accepts subclasses of `list`, so it is the recommended way to check an object’s type. Comparing `type(x) == list` rejects them. You will meet this again in the inheritance lesson.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Arrange the lines to define a recursive `total(items)` that adds up a list of numbers (the sum of an empty list is 0).',
      lines: ['def total(items):', '    if not items:', '        return 0', '    return items[0] + total(items[1:])'],
      linesAreCode: true,
      explanation: 'The base case comes first — an empty list sums to 0 — so the recursion has a place to stop. The last line handles the recursive case: the first item plus the total of everything after it. Putting the recursive line first would recurse forever on the empty list.',
    },
    {
      kind: 'truefalse',
      prompt: 'Python automatically optimizes recursive calls in the last position (“tail calls”), so very deep recursion is safe.',
      answer: false,
      explanation: 'False. CPython does not do tail-call optimization, by deliberate choice: it would erase frames from tracebacks, which Guido van Rossum considered too costly to debugging. Every call uses a frame, so deep recursion hits the recursion limit. For deep or long-running work, use a loop.',
    },
    {
      kind: 'concept',
      title: 'Cost: naive Fibonacci and memoization',
      blocks: [
        {
          type: 'p',
          text: 'Recursion can look elegant and still be disastrous. The Fibonacci numbers are defined by $F(n) = F(n-1) + F(n-2)$, which translates directly into code — but each call spawns **two** more, and they recompute the same values over and over.',
        },
        {
          type: 'code',
          title: 'fib.py',
          runnable: true,
          code: `from functools import cache

calls = 0
def fib_slow(n):
    global calls
    calls += 1
    if n < 2:
        return n
    return fib_slow(n - 1) + fib_slow(n - 2)

print(fib_slow(20), calls)

@cache
def fib_fast(n):
    if n < 2:
        return n
    return fib_fast(n - 1) + fib_fast(n - 2)

print(fib_fast(80))
print(fib_fast.cache_info().misses)`,
          output: `6765 21891
23416728348467685
81`,
          annotations: [
            { lines: 6, text: 'We count every call. (Mutating a module-level counter with `global` is fine for an experiment like this.)' },
            { lines: 11, text: '`fib_slow(20)` makes **21,891 calls** to compute one number. The count roughly multiplies by 1.6 each time `n` grows by 1, so `fib_slow(40)` would make over 300 million.' },
            { lines: 13, text: '`@cache` is a *decorator* (Unit 12): it wraps the function so each distinct argument is computed only once and then remembered. This technique is called **memoization**.' },
            { lines: 19, text: 'With caching, `fib_fast(80)` instantly gives a 17-digit result.' },
            { lines: 20, text: 'Only 81 real computations (n = 0…80) were needed — each value computed exactly once.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is the naive version so slow?',
          text: '`fib_slow(5)` calls `fib_slow(4)` and `fib_slow(3)`; but `fib_slow(4)` *also* calls `fib_slow(3)`, and the duplicated work cascades. The number of calls grows exponentially, in proportion to about $1.618^n$. Memoization turns an exponential algorithm into a linear one by never solving the same subproblem twice. That is the core idea of *dynamic programming*.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'A classic interview question',
          text: 'Interviewers love Fibonacci because the progression — naive recursion, add a cache, then write an iterative version with two variables — shows that you understand cost. Be ready to state the complexities: exponential, O(n) with memoization, O(n) time and O(1) space iteratively.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does the plain recursive `fib_slow(30)` take so long?',
      options: [
        { text: 'Python is too slow for recursion', why: 'Python calls are not that slow; the problem is the *number* of calls, not their speed.' },
        { text: 'It recomputes the same smaller Fibonacci numbers an exponential number of times', correct: true, why: 'Right: `fib_slow(n)` makes two calls and their subtrees overlap heavily, so the total work grows exponentially.' },
        { text: 'The numbers get too big for Python integers', why: 'Python integers have unlimited size; `fib(30)` is only 832,040.' },
        { text: 'The `global calls` counter slows each call', why: 'The counter adds a tiny constant cost per call; the exponential number of calls is the real problem.' },
      ],
      explanation: 'The slow version solves the same subproblems repeatedly: `fib(28)` is computed in both the `fib(30)` and the `fib(29)` branches, and so on down. Caching each answer (memoization) removes the duplication, and a simple loop avoids recursion altogether.',
    },
    {
      kind: 'numeric',
      prompt: 'Using the code above, `fib_slow(n)` counts one call for itself plus all the calls it makes. How many calls (including the first) does `fib_slow(5)` make?\n\nHint: `calls(0) = calls(1) = 1`, and otherwise `calls(n) = 1 + calls(n-1) + calls(n-2)`.',
      answer: '15',
      hint: 'Build up: calls(2) = 3, calls(3) = 1 + 3 + 1 = 5, calls(4) = 1 + 5 + 3 = 9, calls(5) = 1 + 9 + 5.',
      explanation: 'calls(0) = calls(1) = 1; calls(2) = 1 + 1 + 1 = 3; calls(3) = 1 + 3 + 1 = 5; calls(4) = 1 + 5 + 3 = 9; calls(5) = 1 + 9 + 5 = 15. In general the count is $2F(n+1) - 1$, which is where the 21,891 for `n = 20` came from.',
      label: 'Calls:',
    },
    {
      kind: 'concept',
      title: 'Limits: RecursionError and loops',
      blocks: [
        {
          type: 'p',
          text: 'Every call needs a frame, and frames use memory, so CPython limits the depth of the call stack (1,000 by default). Past that it raises `RecursionError` instead of crashing the interpreter. You can inspect the limit with `sys.getrecursionlimit()`.',
        },
        {
          type: 'code',
          title: 'limits.py',
          runnable: true,
          code: `import sys
print(sys.getrecursionlimit())

def forever(n):
    return forever(n + 1)

try:
    forever(0)
except RecursionError as e:
    print("RecursionError:", e)

def sum_to_loop(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total

print(sum_to_loop(100_000))`,
          output: `1000
RecursionError: maximum recursion depth exceeded
5000050000`,
          annotations: [
            { lines: 2, text: 'The default limit is 1,000 frames. (`sys.setrecursionlimit` can raise it, but a very high value risks a real crash of the interpreter.)' },
            { lines: '7-10', text: '`try`/`except` catches an error instead of letting it end the program; Unit 8 explains it fully. Here it lets us show the error message.' },
            { lines: '12-16', text: 'The loop version needs no stack at all. `sum_to_loop(100_000)` would be impossible recursively with the default limit.' },
          ],
        },
        {
          type: 'table',
          headers: ['Prefer recursion when…', 'Prefer a loop when…'],
          rows: [
            ['The data is nested or tree-shaped', 'The problem is a flat count, sum or scan'],
            ['The depth is small (tens or hundreds)', 'The depth could reach thousands or more'],
            ['The recursive version is much clearer', 'Performance matters in a hot path'],
            ['You are exploring options (backtracking)', 'A simple accumulator variable will do'],
          ],
          caption: 'Any recursion can be rewritten as a loop with an explicit stack (a list). Use recursion when it makes the code clearer, and keep the depth modest.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Stack overflow in C++, an exception in Python',
          text: 'Run out of stack in C++ and the program typically crashes (undefined behavior, a segfault). Python checks the depth and raises a clean, catchable `RecursionError`. The limit is a safety net, not a performance target.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This countdown should print 5, 3, 1 and then stop, but it crashes with `RecursionError`. Tap the line that causes the problem.',
      lines: ['def countdown(n):', '    if n == 0:', '        return', '    print(n)', '    countdown(n - 2)', '', 'countdown(5)'],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'Stepping by 2 from 5 goes 5, 3, 1, -1, -3… and *skips* the base case `n == 0`, so the recursion never ends. Either step by 1, or make the base case `if n <= 0:`. When a recursion runs away, check that every call really moves toward the base case — and that the base case is wide enough to catch it.',
    },
    {
      kind: 'concept',
      title: 'Divide and conquer, and flood fill',
      blocks: [
        {
          type: 'p',
          text: 'Two famous patterns use recursion. **Divide and conquer** splits a problem into smaller copies (binary search, merge sort, Towers of Hanoi). **Exploring a space** — a maze, a grid, a game tree — tries each option and recurses on what remains. Both reduce a big job to the same job on something smaller.',
        },
        {
          type: 'code',
          title: 'hanoi.py',
          runnable: true,
          code: `def hanoi(n, source, target, spare, moves):
    if n == 0:
        return
    hanoi(n - 1, source, spare, target, moves)
    moves.append((source, target))
    hanoi(n - 1, spare, target, source, moves)

moves = []
hanoi(3, "A", "C", "B", moves)
print(len(moves))
print(moves[:3])`,
          output: `7
[('A', 'C'), ('A', 'B'), ('C', 'B')]`,
          annotations: [
            { lines: 4, text: 'To move `n` disks: first move the top `n-1` disks out of the way (to the spare peg)…' },
            { lines: 5, text: '…then move the biggest disk to the target…' },
            { lines: 6, text: '…then move the `n-1` disks on top of it. Each step is the *same problem* with one disk fewer.' },
            { lines: 10, text: 'Moving $n$ disks takes $2^n - 1$ moves: 7 for 3 disks. Recursion expresses the strategy in three lines.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Flood fill: the paint bucket, and more',
          text: 'The paint-bucket tool, "which tiles are connected to this room?", minesweeper’s auto-reveal of empty cells and detecting enclosed regions in a tile map are all **flood fill**: from a start cell, recurse into each neighbor that is open and not yet visited, using a `seen` set so no cell is processed twice. You will write it in the third exercise below. (For huge grids, game engines use an explicit queue to avoid the recursion limit.)',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Recursion plus a `seen` set',
          text: 'When a recursive search can revisit the same state (graphs, grids), carry a `seen` set along. Create it with `seen=None` and `if seen is None: seen = set()` — the same mutable-default pattern from the Parameters lesson.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a **recursive** function `reverse_text(s)` that returns the string `s` reversed. For example `reverse_text("abc")` is `"cba"`. Don’t use slicing with a step or `reversed`.',
      starter: `# define reverse_text here
`,
      solution: `def reverse_text(s):
    if len(s) <= 1:
        return s
    return reverse_text(s[1:]) + s[0]
`,
      tests: `assert reverse_text("") == ""
assert reverse_text("a") == "a"
assert reverse_text("abc") == "cba"
assert reverse_text("dragon") == "nogard"
assert reverse_text("level") == "level"`,
      checks: ['The base case handles empty and one-character strings', 'The function calls itself on a shorter string'],
      hint: 'Base case: a string of length 0 or 1 is its own reverse. Otherwise, reverse everything after the first character and put the first character at the end.',
      explanation: '`reverse_text("abc")` is `reverse_text("bc") + "a"`, which is `(reverse_text("c") + "b") + "a"` = `"cba"`. Each call handles a shorter string until the base case, and the characters are re-attached on the way back up.',
    },
    {
      kind: 'code',
      prompt: 'Write a recursive `binary_search(items, target, lo=0, hi=None)` for a **sorted** list. It should return the index of `target`, or `-1` if it is absent. Each call should look at the middle and recurse into the correct half.',
      starter: `# define binary_search here
`,
      solution: `def binary_search(items, target, lo=0, hi=None):
    if hi is None:
        hi = len(items) - 1
    if lo > hi:
        return -1
    mid = (lo + hi) // 2
    if items[mid] == target:
        return mid
    if items[mid] < target:
        return binary_search(items, target, mid + 1, hi)
    return binary_search(items, target, lo, mid - 1)
`,
      tests: `data = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
for i, value in enumerate(data):
    assert binary_search(data, value) == i, f"failed to find {value}"
assert binary_search(data, 7) == -1
assert binary_search(data, 100) == -1
assert binary_search(data, -1) == -1
assert binary_search([], 3) == -1
assert binary_search([4], 4) == 0`,
      checks: ['Finds every present value at the right index', 'Returns -1 for absent values and for an empty list', 'Recurses on one half each time'],
      hint: 'Track the range `lo..hi`. If `lo > hi` the range is empty → `-1`. Compare with `items[mid]`: equal → return `mid`; smaller → search `mid + 1..hi`; larger → search `lo..mid - 1`.',
      explanation: 'Each call discards half of the remaining range, so a list of a million items needs about 20 comparisons instead of a million. The base cases are "range empty" (not found) and "middle equals target" (found). Using indices `lo` and `hi` rather than slicing avoids copying the list on every call.',
    },
    {
      kind: 'code',
      prompt: 'Write `region_size(grid, r, c, seen=None)` that returns how many open cells (`"."`) are **connected** to the cell at row `r`, column `c` — moving up, down, left and right, and never through a wall `"#"`. A wall or out-of-bounds start gives 0. Use recursion (flood fill) with a `seen` set.',
      starter: `# define region_size here
`,
      solution: `def region_size(grid, r, c, seen=None):
    if seen is None:
        seen = set()
    if r < 0 or r >= len(grid) or c < 0 or c >= len(grid[0]):
        return 0
    if grid[r][c] == "#" or (r, c) in seen:
        return 0
    seen.add((r, c))
    size = 1
    for dr, dc in [(1, 0), (-1, 0), (0, 1), (0, -1)]:
        size += region_size(grid, r + dr, c + dc, seen)
    return size
`,
      tests: `grid = [
    "..#..",
    "..#..",
    "###..",
    ".....",
]
assert region_size(grid, 0, 0) == 4, region_size(grid, 0, 0)
assert region_size(grid, 0, 3) == 11, region_size(grid, 0, 3)
assert region_size(grid, 3, 0) == 11
assert region_size(grid, 2, 0) == 0
assert region_size(grid, -1, 0) == 0 and region_size(grid, 0, 9) == 0`,
      checks: ['The left room has 4 cells and the connected right/bottom area has 11', 'Walls and out-of-bounds cells count as 0', 'No cell is counted twice'],
      hint: 'Base cases: out of bounds, a wall, or already in `seen` → 0. Otherwise add `(r, c)` to `seen` and return 1 plus the sizes from the four neighbors.',
      explanation: 'The base cases reject anything that isn’t a fresh open cell. For a new cell we mark it seen *before* recursing (otherwise two neighbors could keep bouncing back and forth), count it as 1, and add whatever the four neighbors find. The `seen` set is shared by every call, so each cell is counted exactly once.',
    },
  ],
  takeaways: [
    'A recursive function has a **base case** that returns directly and a **recursive case** that calls itself on a smaller problem; every call must move toward the base case.',
    'Each call has its own frame on the stack: calls go down to the base case, then results flow back up. Trust the smaller call — don’t trace everything.',
    'Recursion fits nested data (lists in lists, folders in folders, trees) and divide-and-conquer (binary search, Hanoi, flood fill).',
    'Naive recursion can be exponential (Fibonacci); memoization with `functools.cache` — or a loop — fixes it by solving each subproblem once.',
    'CPython has no tail-call optimization and limits depth (default 1,000): deep recursion raises `RecursionError`, so use a loop or an explicit stack when depth can grow large.',
  ],
  reading: [
    { title: 'Recursion (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Recursion_(computer_science)', source: 'wikipedia', note: 'Definitions, examples and the relationship between recursion and iteration.' },
    { title: 'functools.cache', url: 'https://docs.python.org/3/library/functools.html#functools.cache', source: 'docs', note: 'The memoizing decorator used above (Python 3.9+), and `lru_cache` for bounded caches.' },
    { title: 'sys.getrecursionlimit', url: 'https://docs.python.org/3/library/sys.html#sys.getrecursionlimit', source: 'docs', note: 'How the limit works and why raising it is risky.' },
    { title: 'Flood fill', url: 'https://en.wikipedia.org/wiki/Flood_fill', source: 'wikipedia', note: 'The algorithm behind the paint bucket, with recursive and queue-based versions.' },
  ],
};
