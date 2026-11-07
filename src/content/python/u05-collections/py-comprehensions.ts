import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-comprehensions',
  title: 'Comprehensions',
  summary: 'Build lists, dictionaries and sets from a loop in one readable line — with filters, nested loops and generator expressions — and learn when a plain loop is the better choice.',
  minutes: 19,
  objectives: [
    'Rewrite a loop-and-append as a list comprehension, and read one aloud',
    'Add a filter (`if` at the end) and a conditional value (`a if cond else b` at the front), and know the difference',
    'Write nested comprehensions for flattening and for grids, avoiding the shared-row trap',
    'Build dictionaries and sets with comprehensions',
    'Use generator expressions with `sum`, `max`, `any` and `all`, and explain why they save memory',
    'Judge when a comprehension is clear and when a loop is clearer',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A loop that builds a list, in one line',
      blocks: [
        {
          type: 'p',
          text: 'You have written this shape many times: make an empty list, loop, `append` something each time. A [[comprehension]] says the same thing as one expression: *"a list of this, for each of those."*',
        },
        {
          type: 'compare',
          left: {
            title: 'Loop and append',
            tone: 'neutral',
            code: 'squares = []\nfor n in range(1, 6):\n    squares.append(n * n)',
          },
          right: {
            title: 'List comprehension',
            tone: 'good',
            code: 'squares = [n * n for n in range(1, 6)]',
          },
        },
        {
          type: 'code',
          title: 'comprehension.py',
          runnable: true,
          code: `squares = [n * n for n in range(1, 6)]
print(squares)
names = ["ada", "ben", "cai"]
print([name.title() for name in names])
print([len(name) for name in names])
print([c for c in "hello"])`,
          output: `[1, 4, 9, 16, 25]
['Ada', 'Ben', 'Cai']
[3, 3, 3]
['h', 'e', 'l', 'l', 'o']`,
          annotations: [
            { lines: 1, text: 'Read it right to left: "for each `n` in 1 to 5, take `n * n`, and collect the results in a list." The expression comes first, the loop second.' },
            { lines: 4, text: 'Any expression works at the front — here a method call that transforms each name.' },
            { lines: 6, text: 'Any iterable can follow `in`, including a string. (`list("hello")` is shorter if you want no transformation at all.)' },
          ],
        },
        {
          type: 'p',
          text: 'The notation is borrowed from mathematics’ *set-builder notation*, which describes a collection by a rule, and Python took it from the functional language Haskell in version 2.0 (PEP 202, year 2000):',
        },
        {
          type: 'math',
          tex: '\\{\\, n^2 \\mid n \\in \\{1,\\dots,5\\} \\,\\}',
          caption: '"The set of n² such that n is in 1 through 5" — nearly word for word `[n * n for n in range(1, 6)]`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother?',
          text: 'A comprehension states *what the list is*, not the mechanics of building it — no empty list to create, no `append` to remember. It is also faster than the equivalent loop, because CPython runs it with a specialized bytecode path. Once it clicks, you will read them faster than loops.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `print([len(w) for w in ["ox", "cat", "horse"]])`,
      answer: '[2, 3, 5]',
      hint: 'The expression at the front is evaluated once per word.',
      explanation: 'For each word in the list, the comprehension evaluates `len(w)`: 2 for `"ox"`, 3 for `"cat"` and 5 for `"horse"`, and collects the results in a new list: `[2, 3, 5]`.',
    },
    {
      kind: 'mcq',
      prompt: 'Which comprehension builds the same list as this loop?\n\n```\nout = []\nfor n in range(10):\n    if n % 3 == 0:\n        out.append(n * n)\n```',
      options: [
        { text: '`[n * n for n in range(10) if n % 3 == 0]`', correct: true, why: 'Yes: the expression `n * n` first, then the loop, then the filter at the end.' },
        { text: '`[n * n if n % 3 == 0 for n in range(10)]`', why: 'A `SyntaxError`: an `if` in front of the loop needs an `else`, and it would not filter anyway.' },
        { text: '`[n % 3 == 0 for n in range(10)]`', why: 'This builds a list of ten booleans (`True`, `False`…), not the squares.' },
        { text: '`[n for n in range(10) if n % 3 == 0] ** 2`', why: 'You cannot raise a list to a power — that is a `TypeError`.' },
      ],
      explanation: 'A comprehension has up to three parts in a fixed order: **what to collect**, **the loop** and **an optional filter**. The loop body of the original (`out.append(n * n)`) becomes the front expression, and the loop’s `if` moves to the end.',
    },
    {
      kind: 'concept',
      title: 'Filters, conditional values and nested loops',
      blocks: [
        {
          type: 'p',
          text: 'Two different `if`s can appear in a comprehension, and they do different jobs. An `if` **at the end** is a *filter*: it decides which items are kept. An `if … else` **at the front** is a *conditional expression*: it decides which *value* each item turns into — every item is kept.',
        },
        {
          type: 'code',
          title: 'filters.py',
          runnable: true,
          code: `scores = [12, 45, 33, 51, 28, 47]
high = [s for s in scores if s >= 40]
print(high)
labels = ["pass" if s >= 30 else "fail" for s in scores]
print(labels)
pairs = [(x, y) for x in range(3) for y in range(x)]
print(pairs)
flat = [n for row in [[1, 2], [3], [4, 5]] for n in row]
print(flat)
grid = [[0] * 3 for _ in range(2)]
grid[0][0] = 9
print(grid)`,
          output: `[45, 51, 47]
['fail', 'pass', 'pass', 'pass', 'fail', 'pass']
[(1, 0), (2, 0), (2, 1)]
[1, 2, 3, 4, 5]
[[9, 0, 0], [0, 0, 0]]`,
          annotations: [
            { lines: 2, text: '**Filter**: only scores of 40 or more are kept, so the result is shorter than the input.' },
            { lines: 4, text: '**Conditional value**: `a if cond else b` is an expression, so it can sit at the front. Every score yields a label; the list stays the same length.' },
            { lines: 6, text: '**Two loops**: the first `for` is the outer loop and the second the inner loop — the same order as the nested loops you would write by hand. The inner `range(x)` depends on `x`.' },
            { lines: 8, text: 'The classic **flatten**: loop over rows, then over each row’s items. Read it like nested loops written on one line.' },
            { lines: 10, text: 'The grid fix: `[0] * 3` is evaluated *anew for every row*, so each row is a separate list. The `[[0] * 3] * 2` trap from the Lists lesson is gone — and `_` marks a loop variable we don’t use.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Filter at the end, value at the front',
          text: 'A filter can’t have an `else` — `[n for n in nums if n > 0 else 0]` is a `SyntaxError`. If you want to *replace* items rather than drop them, move the conditional to the front: `[n if n > 0 else 0 for n in nums]`.',
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Comprehensions are everywhere in game and tools code: `[e for e in enemies if e.alive]` to prune a list each frame, `[(x, y) for y in range(h) for x in range(w)]` to enumerate every cell of a map, `[load(p) for p in sprite_paths]` to load a batch of assets.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the keywords so that `positives` keeps only the items above 0, and `labels` marks each number as big (above 5) or small.',
      template: `nums = [3, -1, 7, 0, 5]
positives = [n for n in nums ___ n > 0]
labels = ["big" ___ n > 5 ___ "small" for n in nums]`,
      templateIsCode: true,
      blanks: [{ answers: ['if'] }, { answers: ['if'] }, { answers: ['else'] }],
      explanation: 'The filter in `positives` is a plain `if` at the end. The `labels` expression is a conditional expression at the front: `"big" if n > 5 else "small"`. It needs both `if` and `else` because every item must produce *some* value.',
    },
    {
      kind: 'error',
      prompt: 'This program fails with a `SyntaxError` before anything runs. Tap the line with the mistake.',
      lines: ['nums = [1, 2, 3, 4]', 'evens_or_zero = [n if n % 2 == 0 else 0 for n in nums]', 'odds = [n for n in nums if n % 2 == 1 else 0]', 'print(evens_or_zero, odds)'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 puts an `else` after a *filter* `if` at the end of the comprehension — filters have no `else`. Line 2 is fine: its `if … else` is a conditional expression at the front. For line 3, drop the `else 0`: `[n for n in nums if n % 2 == 1]` keeps the odds, or move the conditional forward to replace the evens instead of dropping them.',
    },
    {
      kind: 'concept',
      title: 'Dictionary and set comprehensions',
      blocks: [
        {
          type: 'p',
          text: 'Swap the square brackets for curly braces and you build a different collection. Use `key: value` at the front for a **dictionary**, or a single expression for a **set**.',
        },
        {
          type: 'code',
          title: 'dict_set_comps.py',
          runnable: true,
          code: `names = ["Ada", "Ben", "Cai"]
lengths = {name: len(name) for name in names}
print(lengths)
squares = {n: n * n for n in range(1, 5)}
print(squares)
inverted = {v: k for k, v in squares.items()}
print(inverted)
initials = {name[0] for name in names + ["Amy"]}
print(sorted(initials))
hp = dict(zip(names, [100, 80, 90]))
print({k: v for k, v in hp.items() if v >= 90})`,
          output: `{'Ada': 3, 'Ben': 3, 'Cai': 3}
{1: 1, 2: 4, 3: 9, 4: 16}
{1: 1, 4: 2, 9: 3, 16: 4}
['A', 'B', 'C']
{'Ada': 100, 'Cai': 90}`,
          annotations: [
            { lines: 2, text: '`key: value` at the front makes a **dict comprehension**: a map from each name to its length.' },
            { lines: 6, text: 'Inverting a dictionary: loop over `items()`, unpack each pair, and swap them. This only works if the values are unique and hashable.' },
            { lines: 8, text: 'No colon, curly braces: a **set comprehension**. Three names plus `"Amy"`, but only three distinct initials — duplicates vanish.' },
            { lines: 10, text: '`dict(zip(keys, values))` builds a dictionary from two parallel lists.' },
            { lines: 11, text: 'Dict comprehensions take the same filters as list ones: keep only entries with `v >= 90`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Spot the type from the brackets',
          text: '`[ … for … ]` builds a list, `{ … for … }` a set, `{ k: v for … }` a dict. There is no tuple comprehension: `( … for … )` makes a *generator expression*, which is the next topic.',
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Building lookup tables is a perfect job for a dict comprehension: `{item.id: item for item in items}` turns a list of game objects into a fast "find by id" map, and `{name: load(name) for name in asset_names}` preloads named assets.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'After `squares = [x * x for x in range(3)]`, the loop variable `x` is still defined and equals 2.',
      answer: false,
      explanation: 'False. In Python 3 a comprehension has its own scope for its loop variable, so `x` does not leak into the surrounding code (unlike a normal `for` loop, where `x` would remain 2). If `x` had no other definition, using it afterwards would raise `NameError`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this dictionary comprehension.',
      code: `words = ["apple", "bat", "cherry", "ax"]
print({w: len(w) for w in words if len(w) > 2})`,
      answer: "{'apple': 5, 'bat': 3, 'cherry': 6}",
      hint: '`"ax"` has length 2, so the filter rejects it. Keys keep the order of the original list.',
      explanation: 'The filter `len(w) > 2` drops `"ax"`. The other three words become keys with their lengths as values, in the order they appear: `{\'apple\': 5, \'bat\': 3, \'cherry\': 6}`.',
    },
    {
      kind: 'concept',
      title: 'Generator expressions: the lazy comprehension',
      blocks: [
        {
          type: 'p',
          text: 'Put the same syntax in **parentheses** and you get a *generator expression*. It doesn’t build a collection at all. It produces items **one at a time, on demand**, so it uses almost no memory — perfect when you only want to feed values to something like `sum` or `max`.',
        },
        {
          type: 'code',
          title: 'generators.py',
          runnable: true,
          code: `nums = [3, 8, 2, 9]
print(sum(n * n for n in nums))
print(max(len(w) for w in ["sword", "bow", "staff"]))
print(any(n > 8 for n in nums), all(n > 1 for n in nums))
gen = (n * 2 for n in nums)
print(type(gen).__name__)
print(next(gen), next(gen))
print(list(gen))`,
          output: `158
5
True True
generator
6 16
[4, 18]`,
          annotations: [
            { lines: 2, text: 'When a generator expression is the *only* argument, its own parentheses can double as the call’s — no extra brackets needed. No temporary list is built.' },
            { lines: 4, text: 'You met this with `any` and `all` in the Loops unit; they stop at the first deciding item, so a generator stops producing early too.' },
            { lines: 5, text: 'Nothing has been computed yet. `gen` is a recipe waiting to be asked for values.' },
            { lines: 7, text: '`next` pulls one value at a time: `6`, then `16`.' },
            { lines: 8, text: 'The generator remembers where it was, so `list(gen)` collects only what is left: `[4, 18]`. A generator can be used **once** — after that it is empty.' },
          ],
        },
        {
          type: 'code',
          title: 'memory.py',
          runnable: true,
          code: `import sys

big_list = [n for n in range(100_000)]
big_gen = (n for n in range(100_000))
print(sys.getsizeof(big_list) > 100_000, sys.getsizeof(big_gen) < 1000)`,
          output: 'True True',
          annotations: [
            { lines: '3-4', text: 'Same items, very different cost: the list stores all 100,000 references (hundreds of kilobytes); the generator is a tiny object of a couple of hundred bytes, however long the sequence.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Lazy vs eager',
          text: 'A list comprehension is **eager**: it does all the work immediately and holds all the results. A generator expression is **lazy**: work happens only when a value is requested. If you will use every item more than once, or need `len` or indexing, build a list. If you just need to *consume* the items once — sum them, search them, write them to a file — a generator saves memory and may save time. Unit 11 explores generators in depth, including writing your own with `yield`.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nprint(sum(n for n in range(1, 11) if n % 2 == 0))\n```',
      answer: '30',
      hint: 'The filter keeps the even numbers from 1 to 10.',
      explanation: 'The even numbers in `range(1, 11)` are 2, 4, 6, 8 and 10, and $2 + 4 + 6 + 8 + 10 = 30$. The generator feeds them straight into `sum` without building a list.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'When a plain loop is the better choice',
      blocks: [
        {
          type: 'p',
          text: 'A comprehension should make code **easier** to read. Once it needs several `for`s, several `if`s and clever tricks, it stops being a one-liner and becomes a puzzle. The rule of thumb: if you can’t read it aloud in one breath, write a loop (or a helper function, Unit 6).',
        },
        {
          type: 'compare',
          left: {
            title: 'Too clever',
            tone: 'bad',
            code: 'result = [x * y for x in range(10) if x % 2\n          for y in range(10) if y % 3 == 0 if x != y]',
          },
          right: {
            title: 'Clear',
            tone: 'good',
            code: 'result = []\nfor x in range(10):\n    if x % 2 == 0:\n        continue\n    for y in range(0, 10, 3):\n        if x != y:\n            result.append(x * y)',
          },
        },
        {
          type: 'list',
          items: [
            '**Don’t use a comprehension for side effects.** `[print(x) for x in items]` builds a throwaway list of `None`s. Use a plain `for` loop when you are *doing* things rather than *building* a collection.',
            '**Keep it to one `for` and one `if`** where you can; two `for`s (flatten, grids) are fine when they read naturally.',
            '**Don’t cram in a lot of logic.** If the front expression needs a long calculation, move it into a named function and call it: `[score(p) for p in players]`.',
          ],
        },
        {
          type: 'code',
          title: 'scope.py',
          runnable: true,
          code: `x = "outer"
squares = [x * 2 for x in range(3)]
print(x, squares)`,
          output: `outer [0, 2, 4]`,
          annotations: [
            { lines: 2, text: 'Inside the comprehension, `x` is a separate variable that counts 0, 1, 2. It does not overwrite the outer `x`.' },
            { lines: 3, text: 'After the comprehension, the outer `x` is exactly as it was.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'PEP 709: faster comprehensions',
          text: 'Before Python 3.12, every list, dict and set comprehension was compiled as a hidden one-off function that was created and called each time. PEP 709 *inlined* them, making comprehensions up to roughly twice as fast, while keeping the separate scope for the loop variable. That is one reason a comprehension usually beats the equivalent loop with `append`.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Using a **list comprehension**, build `odd_squares`: the squares of the odd numbers from 1 to 9 inclusive. Expected: `[1, 9, 25, 49, 81]`.',
      starter: `# odd_squares = [ ... ]
`,
      solution: `odd_squares = [n * n for n in range(1, 10) if n % 2 == 1]
`,
      tests: `assert odd_squares == [1, 9, 25, 49, 81], f"odd_squares is {odd_squares}"`,
      checks: ['`odd_squares` is `[1, 9, 25, 49, 81]`', 'Written as one list comprehension'],
      hint: 'The expression is `n * n`, the loop is over `range(1, 10)` (the stop is excluded), and the filter keeps `n % 2 == 1`.',
      explanation: 'Front expression `n * n`, loop `for n in range(1, 10)`, filter `if n % 2 == 1`. `range(1, 10)` covers 1 to 9; the filter keeps 1, 3, 5, 7, 9, which square to 1, 9, 25, 49, 81. You could also loop over `range(1, 10, 2)` and skip the filter.',
    },
    {
      kind: 'code',
      prompt: '`players` is a list of `(name, hp)` tuples. Build a **dictionary comprehension** `strong` that maps each name to its hp, but only for players with at least 70 hp. Expected: `{"Ben": 95, "Cai": 70}`.',
      starter: `players = [("Ada", 40), ("Ben", 95), ("Cai", 70)]

# strong = { ... }
`,
      solution: `players = [("Ada", 40), ("Ben", 95), ("Cai", 70)]

strong = {name: hp for name, hp in players if hp >= 70}
`,
      tests: `assert strong == {"Ben": 95, "Cai": 70}, f"strong is {strong}"`,
      checks: ['`strong` is `{"Ben": 95, "Cai": 70}`'],
      hint: 'Unpack each tuple in the loop part: `for name, hp in players`, then filter with `if hp >= 70`.',
      explanation: 'The loop part `for name, hp in players` unpacks every `(name, hp)` tuple, the filter `if hp >= 70` drops Ada, and `name: hp` at the front turns each survivor into a dictionary entry.',
    },
    {
      kind: 'code',
      prompt: 'Starting from `grid`, build two things with comprehensions:\n\n- `flat` — a single list of all the numbers, row by row: `[1, 2, 3, 4, 5, 6]`\n- `transposed` — rows and columns swapped: `[[1, 4], [2, 5], [3, 6]]`',
      starter: `grid = [[1, 2, 3],
        [4, 5, 6]]

# flat = ...
# transposed = ...
`,
      solution: `grid = [[1, 2, 3],
        [4, 5, 6]]

flat = [n for row in grid for n in row]
transposed = [[row[c] for row in grid] for c in range(3)]
`,
      tests: `assert flat == [1, 2, 3, 4, 5, 6], f"flat is {flat}"
assert transposed == [[1, 4], [2, 5], [3, 6]], f"transposed is {transposed}"
assert grid == [[1, 2, 3], [4, 5, 6]], "do not modify grid"`,
      checks: ['`flat` is `[1, 2, 3, 4, 5, 6]`', '`transposed` swaps rows and columns', '`grid` is unchanged'],
      hint: 'Flatten: `[n for row in grid for n in row]`. Transpose: for each column index `c`, build a row `[row[c] for row in grid]` — a comprehension inside a comprehension.',
      explanation: 'For `flat`, the outer loop takes each row and the inner loop each number in it. For `transposed`, the *outer* comprehension loops over column indices `c`, and for each `c` the *inner* comprehension collects `row[c]` from every row — the c-th column becomes the c-th row. Transposing is the same operation as turning a matrix on its side; NumPy does it with `.T`.',
    },
  ],
  takeaways: [
    'A list comprehension `[expr for item in iterable]` builds a list in one expression: what to collect, the loop, then an optional filter.',
    'A trailing `if` filters items; a leading `a if cond else b` chooses each item’s value. A filter can’t have an `else`.',
    'Several `for` clauses nest in reading order; `[[0] * 3 for _ in range(h)]` safely builds a grid of separate rows.',
    '`{k: v for …}` builds a dict and `{x for …}` a set. Parentheses make a lazy generator expression that holds almost no memory, which suits `sum`, `max`, `any` and `all`.',
    'A comprehension’s loop variable doesn’t leak; don’t use comprehensions for side effects; and when it stops reading clearly, write a loop.',
  ],
  reading: [
    { title: 'List Comprehensions (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions', source: 'docs', note: 'The official walkthrough, including nested comprehensions and a matrix transpose.' },
    { title: 'PEP 202 — List Comprehensions', url: 'https://peps.python.org/pep-0202/', source: 'pep', note: 'The 2000-era proposal that introduced the syntax.' },
    { title: 'PEP 289 — Generator Expressions', url: 'https://peps.python.org/pep-0289/', source: 'pep', note: 'Why the parenthesized form is lazy.' },
    { title: 'PEP 709 — Inlined comprehensions', url: 'https://peps.python.org/pep-0709/', source: 'pep', note: 'The Python 3.12 change that made comprehensions faster.' },
  ],
};
