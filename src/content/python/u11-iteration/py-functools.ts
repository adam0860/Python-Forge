import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-functools',
  title: 'functools and Functional Tools',
  summary: 'Functions as values: `partial`, `reduce`, the `operator` module’s getters, `lru_cache`/`cache` memoization, `singledispatch`, `cmp_to_key`, and when map/filter/reduce beat — or lose to — comprehensions.',
  minutes: 18,
  objectives: [
    'Fix some arguments of a function with `functools.partial` and fold a sequence with `reduce`',
    'Replace small lambdas with `operator.itemgetter`, `attrgetter` and `methodcaller` as sort keys',
    'Speed up pure functions with `lru_cache`/`cache` and explain its requirements (hashable arguments, pure results)',
    'Use `singledispatch` for type-based dispatch and `cmp_to_key` for old-style comparison functions',
    'Compose functions and decide when a comprehension is clearer than `map`, `filter` and `reduce`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Functions as values: partial and reduce',
      blocks: [
        {
          type: 'p',
          text: 'In Python functions are ordinary objects: you can pass them around, store them in lists, and build new functions from old ones. A function that takes or returns functions is a **[[higher-order-function|higher-order function]]**. The `functools` module collects the most useful ones. **`partial(func, *args, **kwargs)`** performs **[[partial-application|partial application]]**: it returns a new callable with some arguments already filled in. **`reduce(func, iterable, initial)`** *folds* a sequence into a single value by repeatedly combining an accumulator with the next item.',
        },
        {
          type: 'code',
          title: 'partial_reduce.py',
          runnable: true,
          code: `from functools import partial, reduce
import operator

power = partial(pow, 2)
print(power(5), power(10))
int_from_bin = partial(int, base=2)
print(int_from_bin("1011"), int_from_bin.func is int, int_from_bin.keywords)

print(reduce(operator.add, [1, 2, 3, 4]), reduce(operator.mul, [1, 2, 3, 4], 10))
print(reduce(lambda acc, ch: acc * 2 + int(ch), "1011", 0))
print(reduce(max, [3, 9, 2]))
try:
    reduce(operator.add, [])
except TypeError:
    print("TypeError")`,
          output: `32 1024
11 True {'base': 2}
10 240
11
9
TypeError`,
          annotations: [
            { lines: 4, text: '`partial(pow, 2)` fixes the *first* argument of `pow(base, exp)`. The result is a function of one argument: `power(5)` is `pow(2, 5)`, i.e. 32.' },
            { lines: 6, text: 'Keyword arguments can be fixed too: `int_from_bin("1011")` calls `int("1011", base=2)`. This is a clean way to create specialized helpers from general functions.' },
            { lines: 7, text: 'A `partial` object is transparent: `.func`, `.args` and `.keywords` expose what it wraps, which helps in debugging.' },
            { lines: 9, text: '`reduce(func, items)` combines the first two items, then that result with the third, and so on: `((1+2)+3)+4 = 10`. The optional third argument is the **starting value** (`10 * 1 * 2 * 3 * 4 = 240`).' },
            { lines: 10, text: '`reduce` is not only for arithmetic. Here the accumulator builds a binary number: `1011` in base 2 is 11. Each step doubles the accumulator and adds the next digit.' },
            { lines: 11, text: 'Any two-argument function works, even `max` (the largest value in the list).' },
            { lines: '12-15', text: '`reduce` on an empty sequence with no initial value has nothing to start from, so it raises `TypeError`. Always pass an initial value when the sequence may be empty.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why partial instead of a lambda?',
          text: '`partial(int, base=2)` and `lambda s: int(s, base=2)` do the same thing. `partial` is a bit faster, prints a useful repr, can be pickled (sent to worker processes — important for the multiprocessing lesson), and says what it does. Use `lambda` when you need to rearrange arguments or add logic.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer built-ins to reduce',
          text: 'Guido van Rossum once proposed removing `reduce` from the language; it was moved into `functools` in Python 3. Most folds have a clearer built-in: `sum`, `max`, `min`, `any`, `all`, `math.prod`, `"".join`. Reach for `reduce` only when none of them fits — and give it an initial value.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Functional roots',
          text: '`lambda`, `map`, `filter` and `reduce` entered Python in 1994 at the request of Lisp programmers. Python never became a pure functional language, but it kept the useful parts: first-class functions, closures, comprehensions and lazy iterators. Modern Python style prefers comprehensions to `map`/`filter` for readability.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `partial(pow, 2)(5)` return?',
      options: [
        { text: '32', correct: true, why: '`partial(pow, 2)` fixes the first argument, so the call is `pow(2, 5)` = 2⁵ = 32.' },
        { text: '25', why: 'That would be `pow(5, 2)`. The fixed argument goes *first*; later arguments are appended after it.' },
        { text: '10', why: 'Neither addition nor multiplication is involved — `pow` raises to a power.' },
        { text: 'A `TypeError`, because `pow` needs two arguments', why: '`partial` supplies the first one (2), and the call supplies the second (5). Together they satisfy `pow`.' },
      ],
      explanation: '`partial(func, a)` returns a callable that calls `func(a, *later_args)`. With `pow` that is `pow(2, 5)` = 32. To fix the *second* argument of a positional function use a keyword (if it has one) or a `lambda`.',
    },
    {
      kind: 'concept',
      title: 'The operator module: getters instead of tiny lambdas',
      blocks: [
        {
          type: 'p',
          text: 'The `operator` module exposes Python’s operators as functions (`operator.add`, `operator.mul`, …) and provides three factories that replace the most common little lambdas: **`itemgetter`** (`x[i]`), **`attrgetter`** (`x.name`) and **`methodcaller`** (`x.method()`). They are faster than lambdas, and they accept several names to build *tuples* — perfect for multi-key sorting.',
        },
        {
          type: 'code',
          title: 'operator_getters.py',
          runnable: true,
          code: `from operator import itemgetter, attrgetter, methodcaller

players = [("Ada", 30), ("Bo", 25), ("Cy", 30)]
print(sorted(players, key=itemgetter(1, 0)))

class P:
    def __init__(self, n, hp):
        self.n = n
        self.hp = hp
    def __repr__(self):
        return f"P({self.n})"

ps = [P("x", 5), P("y", 2)]
print(sorted(ps, key=attrgetter("hp")), max(ps, key=attrgetter("hp")))
print(list(map(methodcaller("upper"), ["a", "b"])))`,
          output: `[('Bo', 25), ('Ada', 30), ('Cy', 30)]
[P(y), P(x)] P(x)
['A', 'B']`,
          annotations: [
            { lines: 4, text: '`itemgetter(1, 0)` builds a function returning `(item[1], item[0])`. Sorting by it orders by score first, then name — a two-key sort in one expression.' },
            { lines: 14, text: '`attrgetter("hp")` replaces `lambda p: p.hp`. It works as the `key` of `sorted`, `min`, `max`, `groupby` and more.' },
            { lines: 15, text: '`methodcaller("upper")` is `lambda s: s.upper()`. Handy with `map` when the method needs no arguments (or fixed ones: `methodcaller("split", ",")`).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Sorting with several keys',
          text: 'To sort by a tuple of keys, return a tuple from the key function: `key=lambda p: (-p.score, p.name)` sorts by score *descending* then name ascending (negate numbers to reverse one key). `attrgetter("a", "b")` and `itemgetter(...)` do the same for plain ascending keys. Python’s sort is *stable*, so you can also sort twice — first by the minor key, then by the major key.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Caching with lru_cache and cache',
      blocks: [
        {
          type: 'p',
          text: 'A **pure function** — same arguments, same result, no side effects — never needs to compute the same answer twice. **[[memoization|Memoization]]** stores results in a dictionary keyed by the arguments. `functools.lru_cache(maxsize=N)` does it for you with a **least-recently-used** eviction policy; `functools.cache` is the unbounded shortcut (Python 3.9+). Each call with *already seen* arguments is a dictionary lookup instead of a computation. The classic demonstration is recursive Fibonacci, which drops from exponential time to linear.',
        },
        {
          type: 'code',
          title: 'caching.py',
          runnable: true,
          code: `from functools import lru_cache, cache

calls = 0

@lru_cache(maxsize=None)
def fib(n):
    global calls
    calls += 1
    return n if n < 2 else fib(n - 1) + fib(n - 2)

print(fib(30), calls)
print(fib(30), calls)
print(fib.cache_info())
fib.cache_clear()
print(fib.cache_info().currsize)

@cache
def add(a, b):
    return a + b
print(add(1, 2), add(1, 2), add.cache_info().hits)
try:
    add([1], 2)
except TypeError:
    print("unhashable argument")`,
          output: `832040 31
832040 31
CacheInfo(hits=29, misses=31, maxsize=None, currsize=31)
0
3 3 1
unhashable argument`,
          annotations: [
            { lines: 5, text: '`@lru_cache(maxsize=None)` wraps `fib` so results are remembered. (The `@` syntax is a *decorator* — the next unit explains how it works.)' },
            { lines: '7-8', text: '`calls` counts how many times the real function body ran. (`global` lets the function change the module-level counter.)' },
            { lines: 11, text: 'Without caching, `fib(30)` makes about 2.7 million recursive calls. With the cache the body ran only 31 times — once for each value from 0 to 30 — and the answer is 832040.' },
            { lines: 12, text: 'The second call is a pure lookup: the counter stays at 31.' },
            { lines: 13, text: '`cache_info()` reports hits, misses, the limit and the current size. 31 distinct arguments (misses), 29 hits (including the repeated top-level call).' },
            { lines: '14-15', text: '`cache_clear()` empties the cache — necessary when the underlying data changes.' },
            { lines: '17-20', text: '`@cache` is `lru_cache(maxsize=None)`: simplest form, unbounded. The second `add(1, 2)` is one hit.' },
            { lines: '21-24', text: 'Arguments become dictionary keys, so they must be **hashable**: a list argument raises `TypeError`. Pass a tuple instead.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Only cache pure functions',
          text: 'If a function reads a file, the clock, a random number or a global that changes, a cached result will silently be wrong. Also, the cache holds **references** to its arguments and results forever (unbounded `cache`) — big objects stay alive, a memory leak in long-running programs. Use a `maxsize` for functions with many different inputs. Caching a *method* keeps every `self` alive too (use it with care, or cache a module-level function).',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where memoization pays off in games and AI',
          text: 'Pathfinding distance tables, dynamic programming (grid paths, edit distance, knapsack), evaluating repeated board positions in minimax (a *transposition table* is exactly a cache), expensive tokenization or feature extraction of the same text, loading a texture or model once and reusing it.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'In C++ you would hand-write a `std::unordered_map<Args, Result>` next to the function and check it first. Python’s decorator does the bookkeeping for you, and — thanks to first-class functions — the same one-liner works on any function without changing its body.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'You can safely apply `@lru_cache` to `def total(values): return sum(values)` and call it with a list such as `total([1, 2, 3])`.',
      answer: false,
      explanation: 'False. `lru_cache` builds a dictionary key from the arguments, so they must be hashable. A list is not: `total([1, 2, 3])` raises `TypeError: unhashable type: \'list\'`. Pass a tuple (`total((1, 2, 3))`) instead.',
    },
    {
      kind: 'concept',
      title: 'singledispatch, cmp_to_key and function composition',
      blocks: [
        {
          type: 'p',
          text: '**`singledispatch`** turns a function into a family of implementations chosen by the *type of the first argument* — polymorphism for functions rather than methods, useful when you can’t add methods to the classes involved (built-ins, third-party types). **`cmp_to_key`** adapts an old-style comparison function (returns negative, zero or positive) to the `key=` parameter. And because functions are values, you can compose them with a few lines of `reduce`.',
        },
        {
          type: 'code',
          title: 'dispatch_and_compose.py',
          runnable: true,
          code: `from functools import singledispatch, cmp_to_key

@singledispatch
def describe(x):
    return f"object {x!r}"

@describe.register
def _(x: int):
    return f"int {x}"

@describe.register(list)
def _(x):
    return f"list of {len(x)}"

print(describe(5), describe([1, 2]), describe("s"), describe(2.5))

def by_len_then_alpha(a, b):
    if len(a) != len(b):
        return len(a) - len(b)
    return (a > b) - (a < b)

print(sorted(["pear", "fig", "apple", "kiwi"], key=cmp_to_key(by_len_then_alpha)))`,
          output: `int 5 list of 2 object 's' object 2.5
['fig', 'kiwi', 'pear', 'apple']`,
          annotations: [
            { lines: '3-5', text: 'The plain function is the **default** implementation, used for any type without a specific one.' },
            { lines: '7-9', text: '`@describe.register` reads the type from the annotation (`x: int`) and registers this version for integers.' },
            { lines: '11-13', text: 'Or pass the type explicitly: `register(list)`. The function name `_` is a convention for "unused name".' },
            { lines: 15, text: 'Each call picks the implementation matching the argument’s class. Strings and floats have no registration, so they fall back to the default.' },
            { lines: '17-20', text: 'A *comparison function* returns a negative number, zero or a positive number. `(a > b) - (a < b)` is the idiom that gives −1, 0 or 1 for any comparable values.' },
            { lines: 22, text: '`cmp_to_key` converts it into a key function so `sorted` can use it: length first, then alphabetical order.' },
          ],
        },
        {
          type: 'code',
          title: 'compose.py',
          runnable: true,
          code: `from functools import reduce

def compose(*funcs):
    return reduce(lambda f, g: lambda x: g(f(x)), funcs)

inc = lambda x: x + 1
double = lambda x: x * 2
pipeline = compose(inc, double, str)
print(pipeline(4), type(pipeline(4)).__name__)
nums = [1, 2, 3, 4, 5, 6]
print(list(map(double, filter(lambda n: n % 2, nums))), [double(n) for n in nums if n % 2])`,
          output: `10 str
[2, 6, 10] [2, 6, 10]`,
          annotations: [
            { lines: 4, text: '`reduce` folds a list of functions into **one** function. Each step returns a new function that applies `f` and then `g` — a closure (explained in the next unit).' },
            { lines: 8, text: 'Applied to 4: `inc` gives 5, `double` gives 10, `str` gives the *text* "10". Composition flows left to right here.' },
            { lines: 9, text: 'The result is the string `"10"`, as its `str` type shows.' },
            { lines: 11, text: '`map` + `filter` and a list comprehension give the same answer — doubles of the odd numbers. Which reads better? For most people, the comprehension.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Comprehensions first, map/filter second',
          text: '`[double(n) for n in nums if n % 2]` reads as one sentence; `map(double, filter(lambda ...))` forces you to read inside-out and needs a `lambda`. Prefer comprehensions and generator expressions. Use `map(func, items)` when `func` is an existing named function and no filtering is needed (`map(str, nums)`, `map(int, text.split())`).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Why functions can be passed around',
          text: 'A `def` creates a function **object** and binds it to a name, exactly like `x = 5` binds an int. Functions have attributes (`__name__`, `__doc__`), can be stored in lists and dictionaries, passed as arguments and returned. A *dictionary of functions* (`{"add": add, "sub": sub}[op](a, b)`) is Python’s idiomatic `switch` — used for command tables, state machines and game input handlers.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that `square` caches its results (keeping at most 128 entries).',
      template: `from functools import ___

@___(maxsize=128)
def square(n):
    return n * n`,
      templateIsCode: true,
      blanks: [{ answers: ['lru_cache'] }, { answers: ['lru_cache'] }],
      explanation: '`lru_cache(maxsize=128)` remembers up to 128 distinct results and evicts the least recently used one when full. You import it once and apply it with `@` above the function. (`@cache` takes no arguments and is unbounded.)',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Follow the accumulator step by step.',
      code: `from functools import reduce
print(reduce(lambda a, b: a + [b * 2], [1, 2, 3], []))`,
      answer: '[2, 4, 6]',
      hint: 'The initial value is an empty list that grows at each step.',
      explanation: 'The accumulator starts as `[]`. Step by step: `[] + [2]` → `[2]`, then `[2] + [4]` → `[2, 4]`, then `[2, 4] + [6]` → `[2, 4, 6]`. (A comprehension `[b * 2 for b in [1, 2, 3]]` does the same more clearly.)',
    },
    {
      kind: 'error',
      prompt: 'Calling `total([1, 2, 3])` raises `TypeError: unhashable type: \'list\'`. Tap a line that has to change.',
      lines: [
        'from functools import lru_cache',
        '@lru_cache(maxsize=None)',
        'def total(values):',
        '    return sum(values)',
        'print(total([1, 2, 3]))',
      ],
      linesAreCode: true,
      errorLines: [2, 5],
      explanation: '`lru_cache` uses the arguments as dictionary keys, and lists aren’t hashable. Either pass an immutable tuple (`total((1, 2, 3))`, line 5) or remove the cache (line 2) if the arguments can’t be made hashable.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`from functools import partial`\n`def volume(l, w, h):`\n`    return l * w * h`\n`f = partial(volume, 2, h=5)`\n`print(f(3))`',
      answer: '30',
      hint: 'The call becomes `volume(2, 3, h=5)`.',
      explanation: '`partial` fixes `l=2` positionally and `h=5` by keyword. The later call supplies `w=3`, so the real call is `volume(2, 3, h=5)` = 2 × 3 × 5 = 30.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `count_paths(rows, cols)` that returns the number of different routes from the top-left to the bottom-right cell of a `rows × cols` grid when you may move only right or down. A single row or column has exactly one route. Use recursion **and `functools.cache`** so that large grids such as 60 × 60 compute instantly.',
      starter: `from functools import cache

def count_paths(rows, cols):
    ...
`,
      solution: `from functools import cache


@cache
def count_paths(rows, cols):
    if rows == 1 or cols == 1:
        return 1
    return count_paths(rows - 1, cols) + count_paths(rows, cols - 1)
`,
      tests: `assert count_paths(1, 1) == 1
assert count_paths(1, 7) == 1
assert count_paths(5, 1) == 1
assert count_paths(2, 2) == 2
assert count_paths(3, 3) == 6
assert count_paths(3, 7) == 28
assert count_paths(18, 18) == 2333606220
assert count_paths(60, 60) > 10**30
info = count_paths.cache_info()
assert info.hits > 0
assert info.currsize > 0
count_paths.cache_clear()
assert count_paths.cache_info().currsize == 0`,
      checks: ['Base case: one row or one column has exactly 1 route', 'Recursive case adds the routes from the cell above and the cell to the left', '`@cache` makes 60 × 60 instantaneous'],
      hint: 'If `rows == 1 or cols == 1` return 1; otherwise `count_paths(rows - 1, cols) + count_paths(rows, cols - 1)`. Put `@cache` above the `def`.',
      explanation: 'Without the cache the recursion revisits the same sub-grids an exponential number of times (60 × 60 would never finish). With `@cache` each `(rows, cols)` pair is computed once: only 3,600 calls. This "recursion + memoization" pattern is the heart of dynamic programming.',
    },
    {
      kind: 'code',
      prompt: 'Write `rank(items, *attrs, reverse=False)` that returns a **new sorted list** of objects ordered by one or more attribute names, using `operator.attrgetter`. `rank(players, "level", "name")` sorts by `level`, then `name`. `reverse=True` reverses the whole order. The original list must not change.',
      starter: `from operator import attrgetter

def rank(items, *attrs, reverse=False):
    ...
`,
      solution: `from operator import attrgetter


def rank(items, *attrs, reverse=False):
    return sorted(items, key=attrgetter(*attrs), reverse=reverse)
`,
      tests: `from types import SimpleNamespace as NS
a = NS(name="Ada", level=3)
b = NS(name="Bo", level=1)
c = NS(name="Cy", level=3)
d = NS(name="Di", level=2)
items = [a, b, c, d]
assert rank(items, "level") == [b, d, a, c]
assert rank(items, "level", "name") == [b, d, a, c]
assert rank(items, "name") == [a, b, c, d]
assert rank(items, "level", "name", reverse=True) == [c, a, d, b]
assert items == [a, b, c, d]
assert rank([], "level") == []
assert rank(items, "name", reverse=True) == [d, c, b, a]
assert rank([c, a], "level", "name") == [a, c]
assert rank([c, a], "level") == [c, a]`,
      checks: ['Uses `attrgetter(*attrs)` as the sort key', 'Supports several attributes (ties are broken left to right)', 'Returns a new list: the input list is unchanged'],
      hint: '`sorted(items, key=attrgetter(*attrs), reverse=reverse)` does everything — `attrgetter` with several names returns a tuple of attributes.',
      explanation: '`attrgetter("level", "name")` returns a tuple, which Python compares element by element — exactly a multi-key sort. `sorted` returns a new list and keeps the original unchanged, and because the sort is stable, equal items keep their relative order (the last test relies on it).',
    },
    {
      kind: 'code',
      prompt: 'Write `compose(*funcs)` that returns a function applying the given functions **left to right**: `compose(f, g)(x)` is `g(f(x))`. Use `functools.reduce`. `compose()` with no functions returns a function that gives back its argument unchanged.',
      starter: `from functools import reduce

def compose(*funcs):
    ...
`,
      solution: `from functools import reduce


def compose(*funcs):
    def run(x):
        return reduce(lambda acc, f: f(acc), funcs, x)
    return run
`,
      tests: `assert compose(lambda x: x + 1, lambda x: x * 2)(3) == 8
assert compose(lambda x: x * 2, lambda x: x + 1)(3) == 7
assert compose()(5) == 5
assert compose(str.strip, str.upper)("  hi ") == "HI"
assert compose(len)("abc") == 3
assert compose(len, str)("abcd") == "4"
inc = lambda x: x + 1
c = compose(inc, inc, inc)
assert c(0) == 3 and c(10) == 13
assert compose(abs, float)(-2) == 2.0
assert callable(compose())`,
      checks: ['Functions are applied in the order given', 'Uses `reduce` over the functions with the argument as initial value', 'An empty composition is the identity function'],
      hint: 'Inside `compose`, define `run(x)` that does `reduce(lambda acc, f: f(acc), funcs, x)`: start with `x` as the accumulator and apply each function to it. Return `run`.',
      explanation: 'Starting `reduce` with the argument `x` as the accumulator means "feed the value through each function in turn", which also gives the identity function for free when `funcs` is empty. The returned `run` is a **closure**: it remembers `funcs` after `compose` has finished — the topic of the next unit.',
    },
  ],
  takeaways: [
    'Functions are objects. `functools.partial` fixes some arguments of a function; `reduce` folds a sequence into one value (give it an initial value; prefer `sum`, `max`, `math.prod` or `join` when they fit).',
    '`operator.itemgetter`, `attrgetter` and `methodcaller` replace tiny lambdas as `key=` functions and make multi-key sorting concise; sorting is stable, so ties keep their order.',
    '`lru_cache(maxsize=N)` and `cache` memoize **pure** functions with hashable arguments — turning exponential recursion linear. Watch memory growth and stale results; `cache_info()` and `cache_clear()` help.',
    '`singledispatch` chooses an implementation by the first argument’s type; `cmp_to_key` adapts old comparison functions; `reduce` can compose functions into a pipeline.',
    'Prefer comprehensions and generator expressions to `map`/`filter` with lambdas; use `map(existing_function, items)` when no lambda is needed.',
  ],
  reading: [
    { title: 'functools — Higher-order functions and operations on callable objects', url: 'https://docs.python.org/3/library/functools.html', source: 'docs', note: 'The full reference for `partial`, `reduce`, `lru_cache`, `singledispatch`, `cmp_to_key`, `wraps` and more.' },
    { title: 'operator — Standard operators as functions', url: 'https://docs.python.org/3/library/operator.html', source: 'docs', note: 'Lists every operator function and the `itemgetter`/`attrgetter`/`methodcaller` factories.' },
    { title: 'Functional Programming HOWTO', url: 'https://docs.python.org/3/howto/functional.html', source: 'docs', note: 'Andrew Kuchling’s guide to iterators, generators, comprehensions and the functional toolkit in Python.' },
  ],
};
