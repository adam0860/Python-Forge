import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-iterators',
  title: 'The Iterator Protocol',
  summary: 'What a `for` loop really does: `iter()`, `next()` and `StopIteration`; the difference between iterables and iterators; writing your own iterator classes; one-shot exhaustion; and why lazy iteration lets Python handle huge data.',
  minutes: 18,
  objectives: [
    'Explain the difference between an iterable and an iterator, and how `iter()` and `next()` connect them',
    'Describe exactly how a `for` loop works using `iter`, `next` and `StopIteration`',
    'Write a class that is an iterator (`__iter__` + `__next__`) and one that is a re-usable iterable',
    'Predict what happens when a one-shot iterator (`map`, `zip`, `enumerate`, a file) is consumed twice',
    'Use `next(it, default)`, the two-argument `iter(callable, sentinel)` and generator expressions for lazy processing',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What a for loop really does',
      blocks: [
        {
          type: 'p',
          text: 'Every `for x in something:` loop, list comprehension, `sum(...)`, `list(...)` and unpacking in Python runs on one small protocol. An **[[iterable]]** is anything you can ask for an iterator: calling `iter(obj)` returns an **[[iterator]]**. An iterator is an object whose `next(it)` hands back the next value, and raises **`StopIteration`** when the values run out. A `for` loop is just a `while True` around `next()` that quietly catches `StopIteration` to end the loop.',
        },
        {
          type: 'code',
          title: 'for_by_hand.py',
          runnable: true,
          code: `nums = [10, 20, 30]
it = iter(nums)
print(type(it).__name__, iter(it) is it, iter(nums) is nums)
print(next(it), next(it), next(it))
try:
    next(it)
except StopIteration:
    print("done")
print(next(it, "empty"))

it = iter(nums)
seen = []
while True:
    try:
        x = next(it)
    except StopIteration:
        break
    seen.append(x)
print(seen, list(it))`,
          output: `list_iterator True False
10 20 30
done
empty
[10, 20, 30] []`,
          annotations: [
            { lines: 2, text: '`iter(nums)` asks the list for an iterator. The list is the *iterable*; the thing returned is a separate small object that remembers "where we are".' },
            { lines: 3, text: 'The iterator is of type `list_iterator`. Calling `iter()` on an iterator returns **itself** (`True`), which is what lets iterators be used in `for` loops; calling it on a list gives a *new* object each time (`False`).' },
            { lines: 4, text: '`next(it)` returns the values one by one: 10, then 20, then 30.' },
            { lines: '5-8', text: 'When nothing is left, `next` raises `StopIteration`. It is not an error condition — it is the protocol’s way of saying "finished".' },
            { lines: 9, text: '`next(it, default)` returns the default instead of raising. Handy for "give me the first item, or this fallback".' },
            { lines: '11-19', text: 'This `while` loop is what `for x in nums:` does behind the scenes: get the iterator, call `next` repeatedly, stop when `StopIteration` appears.' },
            { lines: 19, text: 'The iterator is now **exhausted**, so `list(it)` is empty. Iterators do not rewind.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'A book and a bookmark',
          text: 'An **iterable** is a book: you can read it as often as you like. An **iterator** is a bookmark: it knows which page you are on and can only move forward. `iter(book)` hands you a fresh bookmark each time; a bookmark `iter`-ed again is simply itself. A `for` loop is "take a bookmark, keep turning the page until the book ends".',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'The exact desugaring',
          text: '`for x in obj: body` behaves like: `it = iter(obj)`, then loop: `try: x = next(it)` / `except StopIteration: break` / run `body`. The built-in `iter(obj)` calls `obj.__iter__()`; `next(it)` calls `it.__next__()`. If a class has no `__iter__` but does have `__getitem__`, Python falls back to calling it with 0, 1, 2… until `IndexError` — the old sequence protocol you saw in the dunder lesson.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ iterators are *pointer-like positions*: you compare `it != end` and dereference with `*it`. Python’s iterators are *producers*: there is no separate end marker, you simply ask for the next value until the object says `StopIteration`. A Python `for` loop is the equivalent of C++’s range-based `for (auto x : container)`, but it works with anything that follows the protocol — including objects that compute values on the fly.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'When Python runs `for item in obj:`, what does it do first?',
      options: [
        { text: 'It calls `iter(obj)` to get an iterator, then calls `next` on that iterator repeatedly', correct: true, why: 'Exactly: `iter(obj)` once, then `next(...)` until `StopIteration`.' },
        { text: 'It calls `len(obj)` and loops that many times with an index', why: 'Python loops don’t use indexes. Many iterables (generators, files) have no `len` at all.' },
        { text: 'It copies all of `obj`’s values into a list and loops over the list', why: 'No copy is made. Values are produced one at a time, which is why you can loop over endless or huge sources.' },
        { text: 'It calls `obj.next()` directly', why: 'The call goes through the built-in `iter()` first; and the method is spelled `__next__`, which lives on the *iterator*, not necessarily on `obj`.' },
      ],
      explanation: 'A `for` loop calls `iter(obj)` exactly once to obtain an iterator, and then calls `next` on it until `StopIteration`. The object you loop over (the iterable) and the object that does the stepping (the iterator) are often different things.',
    },
    {
      kind: 'concept',
      title: 'Writing iterators: iterator classes vs iterable classes',
      blocks: [
        {
          type: 'p',
          text: 'To write an **iterator**, define `__next__` (return the next value or raise `StopIteration`) and `__iter__` (return `self`). To write a re-usable **iterable**, define only `__iter__` and make it return a *fresh* iterator each time. The difference decides whether a second loop sees the data again or finds nothing.',
        },
        {
          type: 'code',
          title: 'iterator_vs_iterable.py',
          runnable: true,
          code: `class Countdown:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        return self
    def __next__(self):
        if self.n <= 0:
            raise StopIteration
        self.n -= 1
        return self.n + 1

class Range3:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        return Countdown(self.n)

c = Countdown(3)
print(list(c), list(c))
r = Range3(3)
print(list(r), list(r), sum(r))
for x in r:
    if x == 2:
        break
print(x)`,
          output: `[3, 2, 1] []
[3, 2, 1] [3, 2, 1] 6
2`,
          annotations: [
            { lines: '1-10', text: '`Countdown` is an **iterator**: it holds its own state (`self.n`), returns itself from `__iter__`, and produces one value per `__next__` call.' },
            { lines: '7-8', text: 'Raising `StopIteration` is how an iterator announces the end. A `for` loop catches it for you.' },
            { lines: '9-10', text: 'State changes happen *as* values are handed out. After the last value, `self.n` is 0 forever, so the iterator can never run again.' },
            { lines: '12-16', text: '`Range3` is an **iterable**, not an iterator: it stores only the configuration and returns a brand-new `Countdown` from `__iter__`.' },
            { lines: 19, text: 'The first `list(c)` consumes the iterator completely; the second finds nothing — exactly like an exhausted file or generator.' },
            { lines: 21, text: 'Each loop over `r` gets a fresh `Countdown`, so the data can be traversed repeatedly (twice by `list`, then again by `sum`).' },
            { lines: '22-25', text: '`break` simply stops asking for more values. The iterator is abandoned in mid-way, and `x` still holds the last value it received.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Rule of thumb: containers are iterables, cursors are iterators',
          text: 'Lists, tuples, dicts, sets, strings and `range` objects are **iterables** — loop as often as you like. Things that represent a position in a stream — `zip`, `map`, `enumerate`, open files, generators — are **iterators**: one pass only. If you need several passes over something that may be an iterator, convert it once with `list(...)` (and accept the memory cost).',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why keep iterator and iterable separate?',
          text: 'Two loops over the same list must not interfere with each other (think of nested loops over the same data). If a list were its own iterator, the inner loop would eat the outer loop’s position. Handing out a *new* iterator for every `iter()` call keeps each loop’s position private — the key design choice of the protocol.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where you meet this in AI and game code',
          text: 'PyTorch’s `DataLoader` is an iterable that returns a fresh iterator each epoch, producing one batch at a time; a replay buffer sampler or an environment’s step stream follows the same protocol. Knowing that a loop is "one pass over a stream" helps you spot the classic bug of consuming the data once and then wondering why the second epoch is empty.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A Python `list` is itself an iterator, so you can call `next(my_list)` on it.',
      answer: false,
      explanation: 'False. A list is an **iterable**: `iter(my_list)` returns a separate `list_iterator`. `next(my_list)` raises `TypeError: \'list\' object is not an iterator`. That separation is why you can loop over the same list as many times as you want.',
    },
    {
      kind: 'concept',
      title: 'One-shot iterators, sentinels and lazy pipelines',
      blocks: [
        {
          type: 'p',
          text: 'Many built-ins return iterators rather than lists: `map`, `filter`, `zip`, `enumerate`, `reversed`, `open(...)` and generator expressions. They are **lazy**: nothing is computed until a value is requested, and each value can be consumed only once. That makes them cheap — `range(10**12)` or a pipeline over a 50 GB log file uses almost no memory — but easy to misuse by iterating twice.',
        },
        {
          type: 'code',
          title: 'lazy_and_exhausted.py',
          runnable: true,
          code: `squares = map(lambda n: n * n, [1, 2, 3])
print(type(squares).__name__)
print(next(squares), list(squares), list(squares))

pairs = zip("ab", [1, 2, 3])
print(list(pairs), list(pairs))

e = enumerate("xy", start=1)
print(next(e), next(e))

lines = iter(["a", "b", "STOP", "c"])
print(list(iter(lambda: next(lines), "STOP")))
print(next(lines))

total = sum(n * n for n in range(1_000_000))
big = (n * n for n in range(10**12))
print(total, type(big).__name__, next(big), next(big), next(big))`,
          output: `map
1 [4, 9] []
[('a', 1), ('b', 2)] []
(1, 'x') (2, 'y')
['a', 'b']
c
333332833333500000 generator 0 1 4`,
          annotations: [
            { lines: '1-2', text: '`map` does not compute anything yet; it returns a lazy `map` iterator that applies the function as values are requested.' },
            { lines: 3, text: '`next` takes the first square (1); `list` takes the remaining two (4, 9); the final `list(squares)` finds the iterator empty. Arguments are evaluated left to right, so each call sees what the previous one left.' },
            { lines: '5-6', text: '`zip` stops at the shortest input and is one-shot, too: the second `list(pairs)` is empty.' },
            { lines: '8-9', text: '`enumerate` is an iterator of `(index, value)` pairs; `start=1` shifts the counting.' },
            { lines: 12, text: '**Two-argument `iter(callable, sentinel)`** calls the function repeatedly until it returns the sentinel. Here it stops at `"STOP"` without including it. A classic use: `iter(lambda: f.read(4096), b"")` reads a file in chunks.' },
            { lines: 13, text: 'The shared iterator `lines` remembers its position: the sentinel `"STOP"` was consumed, so the next value is `"c"`.' },
            { lines: 15, text: 'A **generator expression** (comprehension syntax in parentheses) feeds values straight into `sum` without ever building the million-element list.' },
            { lines: '16-17', text: 'Creating `big` is instant: the squares of a trillion numbers are not computed, they would be produced on demand. We take just three values — 0, 1, 4 — and discard the rest.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The "empty second pass" bug',
          text: 'The most common iterator bug: `data = map(parse, lines)`, then `total = sum(data)`, then `average = total / len(list(data))` — `data` is already empty, so the length is 0. Fixes: build a list once (`data = list(map(...))`), re-create the iterator each time (call the function or `iter(iterable)` again), or compute everything in a single pass. Also remember `any`/`next`/`break` leave iterators half-consumed.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Iterate directly; avoid index loops and premature lists',
          text: 'Write `for item in items`, `for i, item in enumerate(items)` and `for a, b in zip(xs, ys)` instead of `range(len(...))`. Feed generator expressions straight into `sum`, `max`, `any` or `"".join(...)` rather than building a temporary list first (`sum(n * n for n in nums)` rather than `sum([n * n for n in nums])`).',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Quick checks',
          text: '"Is X iterable? an iterator?" — it is an iterator if `iter(x) is x`; it is iterable if `iter(x)` works. "What does `list(it)` return after a loop consumed `it`?" — an empty list. "How do you read the first item with a default?" — `next(iter(items), default)`.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Who consumes iterables: unpacking, zip(*…), dict(), in',
      blocks: [
        {
          type: 'p',
          text: 'The protocol is the common currency of the whole language. Anything that wants "a series of values" asks for an iterator: **unpacking** (`a, *rest = x`), the `*` operator in calls, `list()`, `tuple()`, `set()`, `dict()`, `sorted()`, `sum()`, `max()`, `"".join(...)`, `in` tests and comprehensions. Learn the protocol once and every one of them works with your own classes, too.',
        },
        {
          type: 'code',
          title: 'consumers.py',
          runnable: true,
          code: `it = iter("abcd")
first, *rest = it
print(first, rest)
print(list(it))

pairs = zip(*[(1, "a"), (2, "b"), (3, "c")])
print(list(pairs))

d = dict(zip("abc", range(3)))
print(d, "b" in d, sorted(reversed("hello")))

class Old:
    def __getitem__(self, i):
        if i > 2:
            raise IndexError
        return i * 10

print(list(Old()), 20 in Old(), hasattr(Old(), "__iter__"))`,
          output: `a ['b', 'c', 'd']
[]
[(1, 2, 3), ('a', 'b', 'c')]
{'a': 0, 'b': 1, 'c': 2} True ['e', 'h', 'l', 'l', 'o']
[0, 10, 20] True False`,
          annotations: [
            { lines: 2, text: 'Star-unpacking drains the iterator: `first` gets one value, `rest` collects *all the others* into a list.' },
            { lines: 4, text: 'The iterator is exhausted by the unpacking, so `list(it)` is empty.' },
            { lines: '6-7', text: '`zip(*pairs)` is the classic "transpose": the `*` unpacks the list into three separate arguments, and `zip` regroups them column by column. (Remember that `zip` itself is a one-shot iterator.)' },
            { lines: 9, text: '`dict(...)` accepts any iterable of key/value pairs — here the output of `zip`.' },
            { lines: 10, text: '`in` works on a dictionary (checks keys), and `sorted(reversed("hello"))` chains two lazy iterators into a list: the letters of "hello" in order.' },
            { lines: '12-16', text: 'No `__iter__` here — only the older `__getitem__` protocol: Python calls it with 0, 1, 2… until `IndexError`.' },
            { lines: 18, text: '`list()` and `in` both work on the old-style class, even though `hasattr(Old(), "__iter__")` is `False`. New code should define `__iter__` instead.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Prefer the most general function signature',
          text: 'If your function only loops once over its input, accept *any iterable*: iterate with `for`, don’t call `len()` or index. Then lists, tuples, sets, generators and files all work. If you need to loop twice, say so in the documentation — or convert the input to a list at the top of the function.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the class so that `list(Three())` is `[1, 2, 3]`.',
      template: `class Three:
    def __init__(self):
        self.i = 0
    def ___(self):
        return self
    def ___(self):
        if self.i == 3:
            raise ___
        self.i += 1
        return self.i`,
      templateIsCode: true,
      blanks: [{ answers: ['__iter__'] }, { answers: ['__next__'] }, { answers: ['StopIteration'] }],
      wordBank: ['__iter__', '__next__', 'StopIteration', '__getitem__', 'IndexError', '__len__'],
      explanation: 'An iterator needs `__iter__` (returning itself) so it can be used in a `for` loop, and `__next__` to produce each value. Raising `StopIteration` signals the end; `IndexError` is for the older `__getitem__` protocol.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Remember that `next` and `list` share one iterator.',
      code: `it = iter([1, 2, 3, 4])
first = next(it)
rest = list(it)
print(first, rest, list(it))`,
      answer: '1 [2, 3, 4] []',
      hint: 'After `list(it)` the iterator has nothing left.',
      explanation: '`next(it)` takes 1. `list(it)` drains the remaining `[2, 3, 4]` from the *same* iterator. The final `list(it)` therefore finds nothing: `[]`. Iterators never rewind.',
    },
    {
      kind: 'error',
      prompt: 'The second `print` raises `ValueError: max() iterable argument is empty`. Tap a line that has to change.',
      lines: [
        'squares = map(lambda n: n * n, [1, 2, 3])',
        'print(sum(squares))',
        'print(max(squares))',
      ],
      linesAreCode: true,
      errorLines: [1, 3],
      explanation: '`map` returns a one-shot iterator. `sum(squares)` consumed it, so `max(squares)` sees nothing. Either make a list once (`squares = list(map(...))`, line 1) or restructure so that each pass gets its own fresh iterator (line 3).',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`it = iter(range(10))`\n`next(it); next(it)`\n`print(sum(it))`',
      answer: '44',
      hint: 'Two values were already consumed before `sum` ran.',
      explanation: 'The two `next` calls consume 0 and 1. `sum(it)` adds the rest: 2 + 3 + … + 9 = 44.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write an **iterator class** `FibIter(limit)` that produces the Fibonacci numbers (starting 0, 1, 1, 2, 3, …) that are **strictly less than** `limit`. It must be a real iterator: `iter(obj) is obj`, one value per `__next__`, `StopIteration` when finished — and it must stay finished.',
      starter: `# define class FibIter here
`,
      solution: `class FibIter:
    def __init__(self, limit):
        self.limit = limit
        self.a, self.b = 0, 1

    def __iter__(self):
        return self

    def __next__(self):
        if self.a >= self.limit:
            raise StopIteration
        value = self.a
        self.a, self.b = self.b, self.a + self.b
        return value
`,
      tests: `assert list(FibIter(30)) == [0, 1, 1, 2, 3, 5, 8, 13, 21]
assert list(FibIter(1)) == [0]
assert list(FibIter(0)) == []
assert sum(FibIter(100)) == 232
f = FibIter(10)
assert iter(f) is f
assert next(f) == 0
assert list(f) == [1, 1, 2, 3, 5, 8]
assert list(f) == []
for _ in range(2):
    try:
        next(f)
        assert False, "should stay exhausted"
    except StopIteration:
        pass
a, b = FibIter(5), FibIter(5)
next(a)
assert next(b) == 0 and next(a) == 1
assert [x for x in FibIter(10) if x % 2 == 0] == [0, 2, 8]`,
      checks: ['`__iter__` returns `self` and `__next__` produces one value at a time', 'Raises `StopIteration` at the limit and keeps raising it', 'Each `FibIter` object keeps its own independent state'],
      hint: 'Keep two attributes `a` and `b` for the current and next Fibonacci numbers. In `__next__`: if `self.a >= self.limit` raise `StopIteration`; otherwise remember `self.a`, advance with `self.a, self.b = self.b, self.a + self.b`, and return the remembered value.',
      explanation: 'The state lives in the instance, so every call to `__next__` continues where the last one stopped. The `limit` check comes *before* the advance, so once the iterator is past the limit it stays past it. Only the values asked for are ever computed — an endless Fibonacci source would work the same way.',
    },
    {
      kind: 'code',
      prompt: 'Write a re-usable **iterable** `Chunked(data, size)`: looping over it yields consecutive slices of `data` with at most `size` items (the last chunk may be shorter). `size` must be positive (`ValueError` otherwise). Looping twice must work — each loop gets a fresh iterator — so `__iter__` must return a new helper iterator object each time.',
      starter: `# define Chunked (and a helper iterator class) here
`,
      solution: `class Chunked:
    def __init__(self, data, size):
        if size <= 0:
            raise ValueError("size must be positive")
        self.data = data
        self.size = size

    def __iter__(self):
        return _ChunkIterator(self.data, self.size)


class _ChunkIterator:
    def __init__(self, data, size):
        self.data = data
        self.size = size
        self.pos = 0

    def __iter__(self):
        return self

    def __next__(self):
        if self.pos >= len(self.data):
            raise StopIteration
        chunk = self.data[self.pos:self.pos + self.size]
        self.pos += self.size
        return chunk
`,
      tests: `c = Chunked([1, 2, 3, 4, 5], 2)
assert list(c) == [[1, 2], [3, 4], [5]]
assert list(c) == [[1, 2], [3, 4], [5]]
assert list(Chunked([], 3)) == []
assert list(Chunked("abcde", 2)) == ["ab", "cd", "e"]
assert list(Chunked([1, 2, 3], 3)) == [[1, 2, 3]]
assert list(Chunked([1, 2, 3], 10)) == [[1, 2, 3]]
assert iter(c) is not iter(c)
it = iter(c)
assert next(it) == [1, 2]
assert iter(it) is it
assert next(iter(c)) == [1, 2]
assert [len(x) for x in Chunked(range(7), 3)] == [3, 3, 1]
for bad in (0, -1):
    try:
        Chunked([1], bad)
        assert False, "should raise ValueError"
    except ValueError:
        pass
nested = [(a, b) for a in Chunked([1, 2, 3], 2) for b in Chunked([1, 2, 3], 2)]
assert len(nested) == 4`,
      checks: ['`Chunked` is a re-usable iterable: `__iter__` returns a new iterator each time', 'The helper iterator tracks its own position and raises `StopIteration` at the end', 'Nested loops over the same `Chunked` do not interfere'],
      hint: 'Make two classes. `Chunked.__iter__` returns `_ChunkIterator(self.data, self.size)`. The helper keeps `self.pos`, returns `self.data[self.pos:self.pos + self.size]` from `__next__`, and raises `StopIteration` once `pos >= len(data)`.',
      explanation: 'Splitting "the thing you loop over" (`Chunked`) from "the cursor that walks it" (`_ChunkIterator`) is the iterable/iterator pattern in full. Because each `for` gets its own cursor, nested loops over the same `Chunked` do not interfere — the last test checks exactly that. Batching like this is how data loaders deliver mini-batches.',
    },
    {
      kind: 'code',
      prompt: 'Write a function `take(iterable, n)` that returns a **list** of the first `n` items (fewer if the source is shorter). It must consume **exactly** `n` items from an iterator you pass in — no extra look-ahead — so that a later `next(it)` continues right after.',
      starter: `def take(iterable, n):
    ...
`,
      solution: `def take(iterable, n):
    it = iter(iterable)
    out = []
    for _ in range(n):
        try:
            out.append(next(it))
        except StopIteration:
            break
    return out
`,
      tests: `it = iter(range(10))
assert take(it, 3) == [0, 1, 2]
assert next(it) == 3
assert take(it, 0) == []
assert next(it) == 4
assert take([1, 2], 5) == [1, 2]
assert take([], 3) == []
data = [7, 8, 9]
assert take(data, 2) == [7, 8]
assert take(data, 2) == [7, 8]
assert take("hello", 3) == ["h", "e", "l"]
assert take(iter(range(5)), 5) == [0, 1, 2, 3, 4]`,
      checks: ['Returns a list of at most `n` items and works for lists, strings and iterators', 'Consumes exactly `n` items from an iterator (a later `next` continues after them)', 'Stops quietly when the source is shorter than `n`'],
      hint: 'Call `it = iter(iterable)` once, then loop `n` times calling `next(it)` inside a `try`/`except StopIteration: break`. Don’t read an extra item to "check" whether there is more.',
      explanation: 'Calling `iter()` on an iterator returns the same iterator, so the caller’s position advances exactly as much as `take` consumed. Because `take` loops only `n` times it never over-reads — so it also works on endless sources. The standard library’s `itertools.islice` does this job in one call (next lessons).',
    },
  ],
  takeaways: [
    'An **iterable** produces an **iterator** with `iter()`; an iterator returns values with `next()` and raises `StopIteration` at the end. A `for` loop is `iter()` once plus `next()` until `StopIteration`.',
    'Iterators are one-shot and remember their position; iterables (lists, dicts, `range`, strings) can be looped repeatedly because each loop gets a fresh iterator. `iter(x) is x` identifies an iterator.',
    'To write an iterator class: `__next__` plus `__iter__` returning `self`. To write a re-usable iterable: `__iter__` returns a new iterator each time.',
    '`map`, `filter`, `zip`, `enumerate`, `reversed`, files and generator expressions are lazy iterators: cheap on memory, but a second pass sees nothing. Convert with `list()` once if you need several passes.',
    '`next(it, default)` avoids exceptions; `iter(callable, sentinel)` turns "call until a marker appears" into an iterator; generator expressions feed values straight into `sum`, `max`, `any` and `join`.',
  ],
  reading: [
    { title: 'Iterators (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html#iterators', source: 'tutorial', note: 'The official explanation of the protocol with a short `__iter__`/`__next__` example.' },
    { title: 'Iterator Types (Built-in Types reference)', url: 'https://docs.python.org/3/library/stdtypes.html#iterator-types', source: 'docs', note: 'The precise rules for `__iter__` and `__next__` and the contract of an iterator.' },
    { title: 'Python "for" Loops (Definite Iteration)', url: 'https://realpython.com/python-for-loop/', source: 'article', note: 'Real Python walks through iterables, iterators and what a `for` loop really does.' },
  ],
};
