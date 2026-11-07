import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-itertools',
  title: 'itertools: Building Blocks for Iteration',
  summary: 'The standard library’s toolbox of fast, lazy iterator builders: endless counters and cycles, slicing, chaining, combinatorics (`product`, `permutations`, `combinations`), grouping, running totals and sliding windows.',
  minutes: 18,
  objectives: [
    'Use `count`, `cycle`, `repeat`, `islice`, `chain` and `zip_longest` to build and cut streams',
    'Generate grids, hyperparameter searches and combinations with `product`, `permutations` and `combinations`',
    'Group consecutive items with `groupby` (and know why the input must be sorted)',
    'Use `accumulate`, `takewhile`, `dropwhile`, `pairwise`, `batched` and friends for compact pipelines',
    'Explain why `itertools` functions are lazy, one-shot and memory-efficient, and when plain code is clearer',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Endless streams, slicing and chaining',
      blocks: [
        {
          type: 'p',
          text: 'The `itertools` module is a collection of small, fast **iterator builders** written in C. They are the vocabulary of lazy pipelines: each takes iterables and returns an iterator, so they chain together with constant memory. This first group makes and combines streams. **`count`**, **`cycle`** and **`repeat`** are *endless*; **`islice`** slices any iterator (like `data[start:stop:step]` but for streams that can’t be indexed); **`chain`** joins several iterables into one; **`zip_longest`** zips to the *longest* input instead of the shortest.',
        },
        {
          type: 'code',
          title: 'streams.py',
          runnable: true,
          code: `from itertools import count, cycle, repeat, islice, chain, zip_longest

print(list(islice(count(10, 5), 4)))
print(list(islice(cycle("AB"), 5)))
print(list(repeat("x", 3)))
print(list(islice(range(100), 2, 10, 3)))
print(list(chain([1, 2], (3,), "ab")))
print(list(chain.from_iterable([[1, 2], [3], []])))
print(list(zip_longest("abc", [1, 2], fillvalue="-")))
print(list(zip("abc", count(1))))

turns = cycle(["Ada", "Ben", "Cy"])
print([next(turns) for _ in range(7)])`,
          output: `[10, 15, 20, 25]
['A', 'B', 'A', 'B', 'A']
['x', 'x', 'x']
[2, 5, 8]
[1, 2, 3, 'a', 'b']
[1, 2, 3]
[('a', 1), ('b', 2), ('c', '-')]
[('a', 1), ('b', 2), ('c', 3)]
['Ada', 'Ben', 'Cy', 'Ada', 'Ben', 'Cy', 'Ada']`,
          annotations: [
            { lines: 3, text: '`count(start, step)` counts forever. It is endless, so `islice(..., 4)` limits it to four values.' },
            { lines: 4, text: '`cycle` repeats a sequence forever: A, B, A, B, A. (It stores a copy of the first pass, so it uses memory proportional to the input.)' },
            { lines: 5, text: '`repeat(x, times)` produces the same value several times (forever if `times` is omitted) — often used as a constant argument to `map` or `zip`.' },
            { lines: 6, text: '`islice(iterable, start, stop, step)` works on anything iterable — here elements 2, 5, 8. Unlike `list[a:b]` it never copies, and it consumes the source up to `stop`.' },
            { lines: 7, text: '`chain` joins different iterables (a list, a tuple and a string) into one lazy stream.' },
            { lines: 8, text: '`chain.from_iterable` takes one iterable *of* iterables — the usual way to **flatten one level** of nesting.' },
            { lines: 9, text: '`zip_longest` pads the shorter input with `fillvalue` instead of stopping early like `zip`.' },
            { lines: 10, text: 'Endless iterators plus `zip` are a neat idiom: `zip(items, count(1))` numbers the items starting from 1 (like `enumerate`) and stops with the shorter input.' },
            { lines: '12-13', text: 'Round-robin turn order for a game: `cycle(players)` gives the next player with `next(turns)`, forever.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a whole module for this?',
          text: 'Writing each helper as your own generator is easy but slow and repetitive. `itertools` functions run at C speed, are thoroughly tested, and — more importantly — give programmers a shared vocabulary: "that’s a `chain.from_iterable`" tells every reader exactly what happens. The module’s documentation includes a recipes section that shows how to combine them into dozens of further tools.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Endless iterators and consuming functions',
          text: 'Never pass `count()` or `cycle(...)` to `list`, `sum`, `sorted`, `max` or a plain `for` loop without a stopping condition (`islice`, `takewhile`, `break`, a finite `zip` partner). The program will hang or run out of memory.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'The nearest C++ equivalent is the C++20 `<ranges>` library (`std::views::iota`, `take`, `join`, `cartesian_product` in C++23). Python has had this style of lazy composition since version 2.3 — and it works on any iterable, not just containers with iterator pairs.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You have a generator `events()` that never ends and you want only its first 100 values. Which tool fits?',
      options: [
        { text: '`itertools.islice(events(), 100)`', correct: true, why: 'Right: `islice` slices any iterator lazily and stops after 100 values without reading further.' },
        { text: '`events()[:100]`', why: 'Generators can’t be indexed or sliced; this raises `TypeError`.' },
        { text: '`list(events())[:100]`', why: 'This first tries to collect the endless stream into a list, so it never finishes.' },
        { text: '`itertools.cycle(events())`', why: '`cycle` repeats a finite stream forever; it doesn’t limit anything (and would hang on an endless one while saving values).' },
      ],
      explanation: '`islice(iterable, stop)` is the iterator version of slicing. It consumes only what it needs, which makes it the standard way to limit an endless stream.',
    },
    {
      kind: 'concept',
      title: 'Combinatorics: product, permutations, combinations',
      blocks: [
        {
          type: 'p',
          text: 'Four functions enumerate arrangements without nested loops: **`product`** (all pairs/tuples: the Cartesian product — "nested loops in one call"), **`permutations`** (ordered selections), **`combinations`** (unordered selections, no repeats) and **`combinations_with_replacement`**. They are lazy generators, so the count can be astronomical without any memory cost — as long as you don’t collect everything.',
        },
        {
          type: 'code',
          title: 'combinatorics.py',
          runnable: true,
          code: `from itertools import product, permutations, combinations, combinations_with_replacement

print(list(product("ab", [0, 1])))
print(len(list(product(range(3), repeat=2))))
print(list(permutations("abc", 2)))
print(list(combinations("abcd", 2)))
print(list(combinations_with_replacement("ab", 2)))
print(sum(1 for _ in permutations(range(5))), sum(1 for _ in combinations(range(10), 3)))

grid = [(dx, dy) for dx, dy in product((-1, 0, 1), repeat=2) if (dx, dy) != (0, 0)]
print(len(grid), grid[:3])

space = {"lr": [0.1, 0.01], "batch": [32, 64]}
for combo in product(*space.values()):
    print(dict(zip(space, combo)))`,
          output: `[('a', 0), ('a', 1), ('b', 0), ('b', 1)]
9
[('a', 'b'), ('a', 'c'), ('b', 'a'), ('b', 'c'), ('c', 'a'), ('c', 'b')]
[('a', 'b'), ('a', 'c'), ('a', 'd'), ('b', 'c'), ('b', 'd'), ('c', 'd')]
[('a', 'a'), ('a', 'b'), ('b', 'b')]
120 120
8 [(-1, -1), (-1, 0), (-1, 1)]
{'lr': 0.1, 'batch': 32}
{'lr': 0.1, 'batch': 64}
{'lr': 0.01, 'batch': 32}
{'lr': 0.01, 'batch': 64}`,
          annotations: [
            { lines: 3, text: '`product(a, b)` pairs every item of `a` with every item of `b` — the same as two nested `for` loops, with the last iterable varying fastest.' },
            { lines: 4, text: '`repeat=2` means "the product of this iterable with itself": 3 × 3 = 9 pairs, handy for grid coordinates.' },
            { lines: 5, text: '`permutations(x, r)`: ordered arrangements of `r` items without reusing an element. `("a","b")` and `("b","a")` are different.' },
            { lines: 6, text: '`combinations(x, r)`: *unordered* selections — `("a","b")` appears but `("b","a")` doesn’t, so choosing 2 from 4 gives 6 groups.' },
            { lines: 7, text: '`combinations_with_replacement` lets an element be chosen more than once.' },
            { lines: 8, text: 'The counts are 5! = 120 permutations and "10 choose 3" = 120 combinations. Counting through a generator never stores the tuples.' },
            { lines: '10-11', text: 'The 8 neighbor offsets of a grid cell: all `(dx, dy)` pairs from `{-1, 0, 1}` except `(0, 0)`. This is a standard line in tile-map and board-game code.' },
            { lines: '13-15', text: 'A **hyperparameter grid search** in three lines: `product(*lists)` takes one value from each list and `zip` labels them. Every machine-learning tuning tool does essentially this.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Combinatorial explosion',
          text: 'Permutations grow factorially: 10 items have 3.6 million orderings, 20 items have more than 2 × 10¹⁸. Combinations and products explode too. Because these are lazy it’s safe to *loop* over a few and stop early, but never `list(...)` a big one — and think twice before brute-forcing anything larger than a few million cases.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Game and AI uses',
          text: 'Neighbor offsets on tile maps, all pairs of units for collision or targeting checks (`combinations(units, 2)`), every possible card hand, exhaustive search over small action spaces, and grid search over learning rates and batch sizes in training experiments.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`list(combinations("abc", 2))` contains both `("a", "b")` and `("b", "a")`.',
      answer: false,
      explanation: 'False. `combinations` produces unordered selections, so each group appears once, in the order of the input: `("a","b")`, `("a","c")`, `("b","c")`. Use `permutations` if the order matters.',
    },
    {
      kind: 'concept',
      title: 'Grouping, running totals and sliding windows',
      blocks: [
        {
          type: 'p',
          text: 'The third group transforms and cuts streams. **`groupby(iterable, key)`** groups *consecutive* items with the same key — so you usually `sorted` first, using the same key. **`accumulate`** gives running totals (or running anything: pass a function). **`takewhile`/`dropwhile`** keep or skip a prefix; **`filterfalse`** is the opposite of `filter`; **`starmap`** unpacks tuples into function arguments; **`pairwise`** and **`batched`** (3.12+) make overlapping pairs and fixed-size chunks; **`compress`** filters by a selector list.',
        },
        {
          type: 'code',
          title: 'transform_and_group.py',
          runnable: true,
          code: `from itertools import groupby, accumulate, takewhile, dropwhile, filterfalse, starmap, pairwise, batched, compress
import operator

words = ["ant", "bee", "bat", "cow", "cat", "ape"]
for letter, group in groupby(sorted(words), key=lambda w: w[0]):
    print(letter, list(group))
print([(k, len(list(g))) for k, g in groupby("aaabccdd")])

print(list(accumulate([1, 2, 3, 4])))
print(list(accumulate([1, 2, 3, 4], operator.mul)))
print(list(accumulate([3, 1, 4, 1, 5], max)))
print(list(takewhile(lambda n: n < 4, [1, 3, 5, 2])))
print(list(dropwhile(lambda n: n < 4, [1, 3, 5, 2])))
print(list(filterfalse(str.isdigit, "a1b2c3")))
print(list(starmap(pow, [(2, 3), (3, 2)])))
print(list(pairwise([1, 4, 9, 16])))
print(list(batched("abcdefg", 3)))
print(list(compress("ABCDEF", [1, 0, 1, 0, 1, 1])))`,
          output: `a ['ant', 'ape']
b ['bat', 'bee']
c ['cat', 'cow']
[('a', 3), ('b', 1), ('c', 2), ('d', 2)]
[1, 3, 6, 10]
[1, 2, 6, 24]
[3, 3, 4, 4, 5]
[1, 3]
[5, 2]
['a', 'b', 'c']
[8, 9]
[(1, 4), (4, 9), (9, 16)]
[('a', 'b', 'c'), ('d', 'e', 'f'), ('g',)]
['A', 'C', 'E', 'F']`,
          annotations: [
            { lines: '5-6', text: '`groupby` yields `(key, group)` pairs, where each `group` is itself a lazy iterator. Sorting first puts equal keys next to each other; `key=` picks the first letter.' },
            { lines: 7, text: 'Without sorting, `groupby` finds *runs*: "aaabccdd" becomes a×3, b×1, c×2, d×2 — which is exactly run-length encoding.' },
            { lines: 9, text: '`accumulate` defaults to a running sum: 1, 1+2, 1+2+3, …' },
            { lines: 10, text: 'Give it any two-argument function: with `operator.mul` the running product is 1, 2, 6, 24.' },
            { lines: 11, text: '`accumulate(values, max)` is a running maximum — the "best score so far" curve in an AI training log.' },
            { lines: 12, text: '`takewhile` yields items **while** the condition holds and stops at the first failure: it ignores the later 2.' },
            { lines: 13, text: '`dropwhile` skips items while the condition holds, then yields everything that follows — including the later 2.' },
            { lines: 14, text: '`filterfalse` keeps the items for which the predicate is *false*: the non-digits.' },
            { lines: 15, text: '`starmap(f, tuples)` calls `f(*t)` for each tuple: `pow(2, 3)` and `pow(3, 2)`.' },
            { lines: 16, text: '`pairwise` yields overlapping neighbors — differences, slopes or distances between consecutive points: (1,4), (4,9), (9,16).' },
            { lines: 17, text: '`batched(iterable, n)` yields tuples of up to `n` items; the last one may be shorter. This is the standard way to split data into mini-batches.' },
            { lines: 18, text: '`compress(data, selectors)` keeps the items whose selector is truthy.' },
          ],
        },
        {
          type: 'code',
          title: 'groupby_pitfalls.py',
          runnable: true,
          code: `from itertools import groupby, tee
data = [1, 1, 2, 1, 1]
print([(k, len(list(g))) for k, g in groupby(data)])
print([(k, len(list(g))) for k, g in groupby(sorted(data))])
a, b = tee(iter([1, 2, 3]))
print(list(a), list(b))
it = iter(range(3))
x, y = tee(it)
print(next(x), next(x), next(y))`,
          output: `[(1, 2), (2, 1), (1, 2)]
[(1, 4), (2, 1)]
[1, 2, 3] [1, 2, 3]
0 1 0`,
          annotations: [
            { lines: 3, text: 'Unsorted data gives **three** groups: the ones before the 2 and the ones after it are different runs.' },
            { lines: 4, text: 'Sorted first, all the 1s are adjacent and form one group of four.' },
            { lines: '5-6', text: '`tee(iterator, n=2)` splits one iterator into independent copies, so you can loop over the same stream twice. It buffers the values that one copy has seen and the other has not.' },
            { lines: '7-9', text: 'The copies advance independently: `x` is two steps ahead of `y`. Use `tee` sparingly — if the copies drift far apart, the buffer holds all that data (just use `list(...)` if you need to loop twice).' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'groupby needs sorted input — and its groups are lazy',
          text: 'Two classic traps: (1) `groupby` only merges *adjacent* equal keys, so unsorted input gives repeated keys; sort with the same `key` first (or use a `dict`/`defaultdict` to group in one pass without sorting). (2) Each `group` is invalidated when you advance to the next key — convert it to a list (`list(group)`) *before* moving on.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Know when to stop chaining',
          text: 'A five-stage `itertools` expression can be elegant — or a puzzle. If a reader has to think hard, split it into named steps, a small generator function, or an ordinary loop. Use the tools where they clearly make the code shorter *and* clearer, such as `chain.from_iterable`, `islice`, `batched` and `product`.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Putting it together: a lazy data pipeline',
      blocks: [
        {
          type: 'p',
          text: 'The real power shows when tools are *combined*. Here is the skeleton of a training-data loader: several files ("shards") are flattened into one stream of samples, repeated for several epochs, and cut into batches — without ever holding more than one batch in memory. Every stage is a lazy iterator, so the same code works for 9 samples or 9 billion.',
        },
        {
          type: 'code',
          title: 'data_pipeline.py',
          runnable: true,
          code: `from itertools import chain, islice, batched, repeat

shards = [["a1", "a2", "a3"], ["b1", "b2"], ["c1", "c2", "c3", "c4"]]
stream = chain.from_iterable(shards)
print(list(batched(stream, 4)))

endless = chain.from_iterable(repeat(["x", "y", "z"]))
print(list(islice(batched(endless, 2), 4)))

def pipeline(shards, batch_size, epochs):
    stream = chain.from_iterable(chain.from_iterable(repeat(shards, epochs)))
    return batched(stream, batch_size)

print(sum(1 for _ in pipeline(shards, 4, 3)))`,
          output: `[('a1', 'a2', 'a3', 'b1'), ('b2', 'c1', 'c2', 'c3'), ('c4',)]
[('x', 'y'), ('z', 'x'), ('y', 'z'), ('x', 'y')]
7`,
          annotations: [
            { lines: 4, text: '`chain.from_iterable(shards)` flattens the three lists into one stream of nine samples, lazily.' },
            { lines: 5, text: '`batched(stream, 4)` regroups the stream into batches of four. Batches **ignore shard boundaries**: the second batch mixes `b2` with `c1…c3`. The last batch is shorter.' },
            { lines: 7, text: '`repeat(data)` yields the same list forever; `chain.from_iterable` joins those endless repeats into an endless stream: x, y, z, x, y, z, …' },
            { lines: 8, text: '`islice(..., 4)` takes just four batches from the endless stream. Only the values needed are ever produced.' },
            { lines: '10-12', text: 'A reusable pipeline. `repeat(shards, epochs)` repeats the whole dataset `epochs` times; two levels of `chain.from_iterable` flatten *epochs → shards → samples* before batching.' },
            { lines: 14, text: '3 epochs × 9 samples = 27 samples, in batches of 4: six full batches and one with 3 samples — 7 in total. Nothing has been loaded into memory at once.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'The same shape in PyTorch',
          text: 'PyTorch’s `DataLoader` is conceptually this pipeline: a dataset (shards), a sampler (order, with optional reshuffling each epoch), a batcher (`batched`), and an outer loop over epochs. Understanding the iterator building blocks makes its behavior — including why iterating a loader twice gives two epochs — easy to reason about.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Debug pipelines stage by stage',
          text: 'Check each stage on a tiny input using `list(islice(stage, 5))`. A lazy pipeline has no intermediate results to inspect, so peeking at the first few values of each stage is the quickest way to find the broken link. Remember that peeking consumes values, so rebuild the pipeline before the real run.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that `first_four` is `[1, 2, 3, 4]`, taken from an endless counter.',
      template: `from itertools import islice, count
first_four = list(___(count(1), ___))`,
      templateIsCode: true,
      blanks: [{ answers: ['islice'] }, { answers: ['4'] }],
      explanation: '`count(1)` produces 1, 2, 3, … forever, and `islice(iterable, 4)` stops after four values. Without the `islice`, `list(count(1))` would never finish.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Look at what `accumulate` passes to the function.',
      code: `from itertools import accumulate
print(list(accumulate([1, 2, 3, 4], lambda a, b: a * 10 + b)))`,
      answer: '[1, 12, 123, 1234]',
      hint: '`accumulate` starts with the first element, then applies `func(previous_result, next_item)`.',
      explanation: 'The first output is the first element, 1. Then `1 * 10 + 2 = 12`, `12 * 10 + 3 = 123`, `123 * 10 + 4 = 1234`. Each result becomes the first argument of the next call.',
    },
    {
      kind: 'error',
      prompt: 'The code should print `{\'a\': 2, \'b\': 2}`, but it prints `{\'b\': 1, \'a\': 1}`. Tap a line that has to change.',
      lines: [
        'from itertools import groupby',
        'data = ["b", "a", "b", "a"]',
        'counts = {k: len(list(g)) for k, g in groupby(data)}',
        'print(counts)',
      ],
      linesAreCode: true,
      errorLines: [2, 3],
      explanation: '`groupby` only groups *adjacent* equal items, and `b, a, b, a` has no neighbors that match, so each item is its own group of 1 (later keys overwrite earlier ones in the dict). Sort the data first — `groupby(sorted(data))` — or count with `collections.Counter(data)` which needs no sorting.',
    },
    {
      kind: 'numeric',
      prompt: 'How many items does `list(combinations(range(6), 2))` contain?',
      answer: '15',
      hint: 'Unordered pairs from 6 items: "6 choose 2".',
      explanation: 'There are 6 × 5 / 2 = 15 unordered pairs. (`permutations(range(6), 2)` would give 30, since order matters there.) Counting arrangements like this is quick mental sanity-checking before you launch a large search.',
      label: 'Length:',
    },
    {
      kind: 'code',
      prompt: 'Write `grid_neighbors(x, y, width, height)` that returns the **sorted list** of in-bounds positions among the 8 cells around `(x, y)` on a `width × height` grid (coordinates start at 0). Use `itertools.product` to generate the offsets.',
      starter: `from itertools import product

def grid_neighbors(x, y, width, height):
    ...
`,
      solution: `from itertools import product


def grid_neighbors(x, y, width, height):
    result = []
    for dx, dy in product((-1, 0, 1), repeat=2):
        if (dx, dy) == (0, 0):
            continue
        nx, ny = x + dx, y + dy
        if 0 <= nx < width and 0 <= ny < height:
            result.append((nx, ny))
    return sorted(result)
`,
      tests: `assert grid_neighbors(0, 0, 3, 3) == [(0, 1), (1, 0), (1, 1)]
assert grid_neighbors(1, 1, 3, 3) == [(0, 0), (0, 1), (0, 2), (1, 0), (1, 2), (2, 0), (2, 1), (2, 2)]
assert grid_neighbors(2, 0, 3, 3) == [(1, 0), (1, 1), (2, 1)]
assert grid_neighbors(1, 0, 3, 3) == [(0, 0), (0, 1), (1, 1), (2, 0), (2, 1)]
assert grid_neighbors(0, 0, 1, 1) == []
assert len(grid_neighbors(5, 5, 20, 20)) == 8
assert (5, 5) not in grid_neighbors(5, 5, 20, 20)
assert grid_neighbors(3, 3, 4, 4) == [(2, 2), (2, 3), (3, 2)]`,
      checks: ['Uses `product((-1, 0, 1), repeat=2)` for the offsets and skips `(0, 0)`', 'Keeps only positions inside `0 <= x < width` and `0 <= y < height`', 'Returns a sorted list of tuples'],
      hint: 'Loop `for dx, dy in product((-1, 0, 1), repeat=2)`, skip `(0, 0)`, compute `nx, ny = x + dx, y + dy`, keep it if it is inside the grid, and `return sorted(result)` at the end.',
      explanation: '`product` replaces two nested loops and makes the "all offsets except zero" idea read directly. The bounds check is what handles corners and edges — a classic source of off-by-one bugs in tile-map code, which is why it deserves its own tested function.',
    },
    {
      kind: 'code',
      prompt: 'Write `run_length_encode(text)` using `itertools.groupby` that returns the text with each run of identical characters replaced by the character and its count: `"aaabcc"` becomes `"a3b1c2"`. The empty string encodes to `""`.',
      starter: `from itertools import groupby

def run_length_encode(text):
    ...
`,
      solution: `from itertools import groupby


def run_length_encode(text):
    return "".join(f"{ch}{len(list(group))}" for ch, group in groupby(text))
`,
      tests: `assert run_length_encode("aaabcc") == "a3b1c2"
assert run_length_encode("") == ""
assert run_length_encode("x") == "x1"
assert run_length_encode("aabbaa") == "a2b2a2"
assert run_length_encode("abc") == "a1b1c1"
assert run_length_encode("z" * 12) == "z12"
assert run_length_encode("  !!") == " 2!2"`,
      checks: ['Uses `groupby` on the characters (no sorting: runs only)', 'Measures each run with `len(list(group))`', 'Joins the pieces into one string'],
      hint: '`groupby(text)` yields `(char, group)` for each run. Build `f"{ch}{len(list(group))}"` for each and `"".join(...)` them.',
      explanation: 'Here *not* sorting is the point: `groupby` finds runs of equal neighbors, which is exactly what run-length encoding needs (`"aabbaa"` has three runs). The `group` is a one-shot iterator, so `len(list(group))` counts it while it is still valid.',
    },
    {
      kind: 'code',
      prompt: 'Write `hyper_grid(space)` that takes a dictionary mapping parameter names to lists of values and returns a **list of dictionaries**, one per combination, keeping the dictionary’s key order. `{"lr": [1, 2], "bs": [8]}` gives `[{"lr": 1, "bs": 8}, {"lr": 2, "bs": 8}]`. An empty space gives one empty configuration: `[{}]`.',
      starter: `from itertools import product

def hyper_grid(space):
    ...
`,
      solution: `from itertools import product


def hyper_grid(space):
    names = list(space)
    return [dict(zip(names, values)) for values in product(*space.values())]
`,
      tests: `assert hyper_grid({"lr": [1, 2], "bs": [8]}) == [{"lr": 1, "bs": 8}, {"lr": 2, "bs": 8}]
assert hyper_grid({}) == [{}]
g = hyper_grid({"a": range(3), "b": "xy"})
assert len(g) == 6
assert g[0] == {"a": 0, "b": "x"} and g[-1] == {"a": 2, "b": "y"}
assert [list(d) for d in g][0] == ["a", "b"]
assert hyper_grid({"k": []}) == []
assert hyper_grid({"only": [True, False]}) == [{"only": True}, {"only": False}]
space = {"x": [1, 2], "y": [3, 4]}
assert hyper_grid(space) == [{"x": 1, "y": 3}, {"x": 1, "y": 4}, {"x": 2, "y": 3}, {"x": 2, "y": 4}]
assert space == {"x": [1, 2], "y": [3, 4]}`,
      checks: ['Uses `product(*space.values())` for the combinations', 'Labels each tuple with the parameter names via `zip`', 'Keeps key order, returns `[{}]` for an empty space and does not modify the input'],
      hint: 'Take `names = list(space)`, then for every `values` in `product(*space.values())` build `dict(zip(names, values))`.',
      explanation: '`product(*lists)` unpacks the value lists as separate arguments and gives one tuple per combination; `zip(names, values)` pairs them with their labels. An empty space works naturally because `product()` with no arguments yields exactly one empty tuple. Grid search over training settings is built exactly this way.',
    },
  ],
  takeaways: [
    '`itertools` provides fast, lazy building blocks: `count`/`cycle`/`repeat` (endless), `islice` (slice any iterator), `chain`/`chain.from_iterable` (join/flatten), `zip_longest` (pad instead of truncate).',
    '`product`, `permutations`, `combinations` and `combinations_with_replacement` enumerate arrangements lazily — great for grids, searches and pair checks, but beware combinatorial explosion.',
    '`groupby` merges only **adjacent** equal keys (sort first, or use a `dict`/`Counter`) and its groups are lazy — consume each before moving on.',
    '`accumulate`, `takewhile`, `dropwhile`, `filterfalse`, `starmap`, `pairwise`, `batched` and `compress` turn many hand-written loops into one-liners; `tee` copies an iterator but buffers the gap.',
    'All of them return one-shot lazy iterators. Limit endless ones, convert to a list when you need reuse, and prefer a plain loop when a chain becomes hard to read.',
  ],
  reading: [
    { title: 'itertools — Functions creating iterators for efficient looping', url: 'https://docs.python.org/3/library/itertools.html', source: 'docs', note: 'The full reference — including the "Itertools Recipes" section, a free course in iterator design.' },
    { title: 'Functional Programming HOWTO', url: 'https://docs.python.org/3/howto/functional.html', source: 'docs', note: 'Explains iterators, generators and itertools as tools for a functional style.' },
    { title: 'Python’s itertools: Practical Examples', url: 'https://realpython.com/python-itertools/', source: 'article', note: 'Real Python’s tour of the module with worked examples, including combinatorics and grouping.' },
  ],
};
