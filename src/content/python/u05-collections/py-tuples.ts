import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-tuples',
  title: 'Tuples and Unpacking',
  summary: 'Fixed groups of values that can’t change — and unpacking, the Python habit of splitting a group into named pieces in one line, swapping variables, looping over pairs and zipping lists together.',
  minutes: 17,
  objectives: [
    'Create tuples (including the one-item `(x,)` form) and explain how they differ from lists',
    'Unpack tuples and other sequences into several names, including swaps, `*rest` and nested patterns',
    'Loop over pairs with unpacking, `enumerate` and `zip`',
    'Explain why a tuple is hashable and a list is not, and when to choose each',
    'Recognize a `namedtuple` as a readable record',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A tuple is a list that can’t change',
      blocks: [
        {
          type: 'p',
          text: 'A [[tuple]] is an ordered collection like a list, except that it is **immutable**: once created, you can’t replace, add or remove items. It is written with commas — the parentheses are usually optional — and it is the natural choice for a *fixed group of related values*: a position, an RGB color, a (name, score) pair.',
        },
        {
          type: 'code',
          title: 'tuples.py',
          runnable: true,
          code: `point = (3, 4)
single = (5,)
not_a_tuple = (5)
rgb = 255, 128, 0
print(point, type(point))
print(single, type(single))
print(not_a_tuple, type(not_a_tuple))
print(rgb, rgb[1], len(rgb))
print(point + (0,))
print(point * 2)`,
          output: `(3, 4) <class 'tuple'>
(5,) <class 'tuple'>
5 <class 'int'>
(255, 128, 0) 128 3
(3, 4, 0)
(3, 4, 3, 4)`,
          annotations: [
            { lines: 2, text: 'A tuple with **one** item needs a trailing comma. The comma, not the parentheses, makes the tuple.' },
            { lines: 3, text: 'Without the comma, `(5)` is just the number 5 in grouping parentheses — an `int`.' },
            { lines: 4, text: 'Parentheses are optional: `255, 128, 0` is already a tuple. This is called *tuple packing*.' },
            { lines: 8, text: 'Indexing, `len`, slicing, `in`, `count` and `index` all work exactly as they do on a list.' },
            { lines: '9-10', text: '`+` and `*` build **new** tuples; the originals are unchanged.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> point = (3, 4)
>>> point[0] = 10
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    point[0] = 10
    ~~~~~^^^
TypeError: 'tuple' object does not support item assignment`,
          annotations: [
            { lines: 7, text: 'Item assignment is simply not supported. To "change" a tuple you build a new one: `point = (10, point[1])`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Immutable means the *references* are fixed',
          text: 'A tuple can’t be pointed at different objects, but if one of its items is a mutable object such as a list, *that list* can still change: `bag = ("coins", ["gold"])` then `bag[1].append("gem")` works and `bag` becomes `("coins", ["gold", "gem"])`. The tuple itself never changed — it still holds the same two objects.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which expression creates a tuple containing exactly one item, the number 7?',
      options: [
        { text: '`(7)`', why: 'Just the integer 7 in parentheses. Parentheses alone never make a tuple.' },
        { text: '`(7,)`', correct: true, why: 'Yes — the trailing comma makes it a tuple. `7,` works too.' },
        { text: '`[7]`', why: 'That is a list with one item.' },
        { text: '`tuple(7)`', why: '`tuple` expects an iterable, and an int is not one: this raises a `TypeError`. `tuple([7])` would work.' },
      ],
      explanation: 'It is the comma that creates a tuple. `(7,)` is a one-item tuple; `(7)` is an int; `()` is the empty tuple. The odd-looking trailing comma is the only way to write a tuple with a single item.',
    },
    {
      kind: 'truefalse',
      prompt: 'Because tuples are immutable, no object inside a tuple can ever change.',
      answer: false,
      explanation: 'False. The tuple always holds the *same objects*, but if one of them is mutable (like a list), that object can still be modified. `("coins", ["gold"])` can grow to `("coins", ["gold", "gem"])` through its inner list.',
    },
    {
      kind: 'concept',
      title: 'Unpacking: one line, many names',
      blocks: [
        {
          type: 'p',
          text: 'The most useful thing about tuples is how easily they come apart. [[unpacking|Unpacking]] assigns each item of a sequence to its own name in one statement — the number of names must match the number of items:',
        },
        {
          type: 'code',
          title: 'unpack.py',
          runnable: true,
          code: `point = (3, 4)
x, y = point
print(x, y)

a, b = 1, 2
a, b = b, a
print(a, b)

name, (hp, mp) = "Mage", (40, 90)
print(name, hp, mp)`,
          output: `3 4
2 1
Mage 40 90`,
          annotations: [
            { lines: 2, text: '`x` gets the first item and `y` the second. This reads far better than `point[0]` and `point[1]`.' },
            { lines: 5, text: '`1, 2` is a packed tuple on the right, unpacked into `a` and `b` on the left.' },
            { lines: 6, text: 'The famous Python swap. The right-hand side `(b, a)` is built first — `(2, 1)` — and only then assigned, so no temporary variable is needed.' },
            { lines: 9, text: 'Patterns can nest: `(hp, mp)` unpacks the inner tuple while `name` takes the string.' },
          ],
        },
        {
          type: 'p',
          text: 'It works on any sequence — lists, strings, ranges — but the counts must agree. Too many or too few values is a `ValueError`:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> x, y = (1, 2, 3)
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    x, y = (1, 2, 3)
    ^^^^
ValueError: too many values to unpack (expected 2, got 3)`,
          annotations: [
            { lines: 5, text: 'The carets point at the names on the left — the pattern that did not fit. With too few values, the message says "not enough values to unpack".' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Like structured bindings',
          text: 'C++17’s `auto [x, y] = point;` is the closest relative. Python has had this since the 1990s, uses it everywhere — loops, function returns, swaps — and doesn’t need a special declaration syntax.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Before tuple unpacking, swapping two variables needed a temporary. Put these lines in the right order to swap `a` and `b` the long way (one line is not needed).',
      lines: ['temp = a', 'a = b', 'b = temp'],
      distractors: ['a = temp'],
      linesAreCode: true,
      explanation: 'Save `a` in `temp` first, because the next line overwrites it. Then copy `b` into `a`, then put the saved original into `b`. Doing `a = b` first would lose the original `a` forever. Python’s `a, b = b, a` does all of this in one statement.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The whole right-hand side is evaluated before any name is assigned.',
      code: `a, b, c = 1, 2, 3
a, b, c = c, a, b
print(a, b, c)`,
      answer: '3 1 2',
      hint: 'The right side becomes the tuple `(c, a, b)` using the *old* values, i.e. `(3, 1, 2)`.',
      explanation: 'On the second line Python first builds the tuple `(c, a, b)` = `(3, 1, 2)` from the current values, and only then assigns: `a` becomes 3, `b` becomes 1, `c` becomes 2. The values rotate. Because the right-hand side is evaluated first, no value is overwritten before it is read.',
    },
    {
      kind: 'concept',
      title: 'Star-unpacking, loops and zip',
      blocks: [
        {
          type: 'p',
          text: 'When you don’t know how many items there are, put a `*` in front of one name. It soaks up all the leftovers into a **list**. Unpacking also happens automatically in `for` loops — each item of the list is unpacked as the loop variable is assigned — and `zip` pairs up several lists item by item:',
        },
        {
          type: 'code',
          title: 'star_zip.py',
          runnable: true,
          code: `first, *rest = ["Ada", "Ben", "Cai", "Dev"]
print(first, rest)
*init, last = [1, 2, 3, 4]
print(init, last)
head, *_, tail = range(6)
print(head, tail)

points = [(0, 0), (3, 4), (6, 8)]
for x, y in points:
    print(x, y, "->", (x**2 + y**2) ** 0.5)

names = ["Ada", "Ben", "Cai"]
scores = [90, 75, 82]
for name, score in zip(names, scores):
    print(f"{name}: {score}")
for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(i, name, score)
print(list(zip(names, scores)))`,
          output: `Ada ['Ben', 'Cai', 'Dev']
[1, 2, 3] 4
0 5
0 0 -> 0.0
3 4 -> 5.0
6 8 -> 10.0
Ada: 90
Ben: 75
Cai: 82
1 Ada 90
2 Ben 75
3 Cai 82
[('Ada', 90), ('Ben', 75), ('Cai', 82)]`,
          annotations: [
            { lines: 1, text: '`first` takes the first item; `*rest` collects everything else into a new list (empty if there is nothing left).' },
            { lines: 3, text: 'The starred name can go anywhere — here it collects everything *before* the last item.' },
            { lines: 5, text: '`*_` is a convention for "I don’t care about the middle". `_` is just a name that signals "ignored".' },
            { lines: 9, text: 'Each `(x, y)` tuple from the list is unpacked into `x` and `y` as the loop runs. This is the Pythagorean theorem for distance from the origin.' },
            { lines: 14, text: '`zip(names, scores)` produces `("Ada", 90)`, `("Ben", 75)`… pairing items at the same position. It stops at the shortest list.' },
            { lines: 16, text: 'Nested patterns work in loops too: `enumerate` supplies `i`, and the `(name, score)` tuple is unpacked in turn.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Don’t loop over indices when you can unpack',
          text: '`for i in range(len(names)): print(names[i], scores[i])` works, but `for name, score in zip(names, scores):` is shorter, can’t go out of range, and names what it uses. Reach for `zip` whenever two lists share positions.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does zip return something you must wrap in list()?',
          text: '`zip` is *lazy*: it produces pairs one at a time, as the loop asks for them, instead of building them all up front. That saves memory with huge inputs. Unit 11 explains iterators in depth; for now, wrap it in `list(...)` when you want to see everything at once.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete each unpacking so that the comments are true.',
      template: `first, ___ = [1, 2, 3, 4]       # first is 1, the rest is [2, 3, 4]
*___, last = [1, 2, 3, 4]      # init is [1, 2, 3], last is 4`,
      templateIsCode: true,
      blanks: [{ answers: ['*rest'] }, { answers: ['init'] }],
      wordBank: ['*rest', 'rest', 'init', '*init'],
      explanation: 'The star marks the name that collects leftovers, and the second blank already has its `*` written in the template, so you supply only the name: `first, *rest = …` and `*init, last = …`. The starred name always receives a list, which is why `rest` is `[2, 3, 4]` rather than a tuple.',
    },
    {
      kind: 'error',
      prompt: 'The player moves 5 units to the right, but the program crashes with a `TypeError`. Tap the line that fails.',
      lines: ['position = (10, 20)', 'position[0] = position[0] + 5', 'print(position)'],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Line 2 tries to assign to an item of a tuple, which is not allowed. Build a new tuple instead: `position = (position[0] + 5, position[1])`, or unpack first — `x, y = position` then `position = (x + 5, y)`. If positions change constantly, a list (or a small object, Unit 10) might be a better fit than a tuple.',
    },
    {
      kind: 'concept',
      title: 'Why tuples exist: records, keys and namedtuples',
      blocks: [
        {
          type: 'p',
          text: 'If a list can do everything a tuple can, why bother? Three reasons:',
        },
        {
          type: 'list',
          ordered: true,
          items: [
            '**They say what they mean.** A list is "many things of the same kind that may grow or shrink"; a tuple is "a fixed record where each position has its own meaning" — `(x, y)`, `(name, hp, mp)`. Choosing the right one documents your intent.',
            '**They are protected from accidental changes**, so you can safely share a tuple (a level’s spawn point, a color constant) without anyone altering it.',
            '**They are [[hashable]]** (when their contents are), so they can be dictionary keys and set members. A list can’t — it might change after being stored, which would break the lookup.',
          ],
        },
        {
          type: 'code',
          title: 'tuple_keys.py',
          runnable: true,
          code: `walls = {(1, 1), (2, 1), (3, 1)}
print((2, 1) in walls, (5, 5) in walls)

from collections import namedtuple
Point = namedtuple("Point", ["x", "y"])
p = Point(3, 4)
print(p.x, p.y, p)
x, y = p
print(x + y)`,
          output: `True False
3 4 Point(x=3, y=4)
7`,
          annotations: [
            { lines: 1, text: 'A [[set]] of coordinate tuples — a fast way to record which tiles are walls. (Sets arrive in two lessons.)' },
            { lines: 2, text: 'Membership in a set is a quick lookup. A list of walls would scan item by item.' },
            { lines: 5, text: '`namedtuple` builds a tuple type whose items also have names.' },
            { lines: 7, text: '`p.x` is far more readable than `p[0]`, yet `p` is still a real tuple: it unpacks, indexes and is immutable.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Game code is full of small immutable records: grid coordinates `(col, row)`, colors `(r, g, b)`, screen sizes `(width, height)`, "enemy type + spawn time" pairs. When the record gets more fields or needs behavior, step up to a `dataclass` or a class (Unit 10).',
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'CPython allocates a tuple as one block of exactly the right size, with no spare room for growth, so a tuple takes less memory than a list with the same items and is a little faster to create. You won’t notice it in small programs, but it is why constants like `RED = (255, 0, 0)` are tuples.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\na, *b, c = [1, 2, 3, 4, 5, 6]\nprint(len(b) + c)\n```',
      answer: '10',
      hint: '`a` takes the first item, `c` the last, and `b` collects everything in between.',
      explanation: '`a` is 1 and `c` is 6, so `b` is `[2, 3, 4, 5]` with length 4. The total is $4 + 6 = 10$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: '`party` is a list of `(name, hp)` tuples. Use a loop with unpacking to set `strongest` to the **name** of the character with the highest hp.',
      starter: `party = [("Ada", 40), ("Ben", 95), ("Cai", 70)]
strongest = None

# loop with unpacking, track the best hp so far
`,
      solution: `party = [("Ada", 40), ("Ben", 95), ("Cai", 70)]
strongest = None
best_hp = -1

for name, hp in party:
    if hp > best_hp:
        best_hp = hp
        strongest = name
`,
      tests: `assert strongest == "Ben", f"strongest is {strongest!r}"`,
      checks: ['`strongest` is the name `"Ben"`', 'Uses `for name, hp in party`'],
      hint: 'Keep a `best_hp` variable (start it low, like `-1`) and update both `best_hp` and `strongest` whenever you see a higher hp.',
      explanation: 'This is the "best so far" pattern from the loops unit, with unpacking making each `(name, hp)` pair easy to read. Each time `hp` beats `best_hp`, remember both the new best and whose it is. (A one-liner exists — `max(party, key=lambda c: c[1])[0]` — which you’ll understand after Unit 6.)',
    },
    {
      kind: 'code',
      prompt: 'Two rounds of scores are stored in parallel lists. Build `totals`, a list of `(name, total)` tuples where `total` is the sum of the two rounds. For this data it should be `[("Ada", 15), ("Ben", 35), ("Cai", 55)]`. Use `zip`.',
      starter: `names = ["Ada", "Ben", "Cai"]
round1 = [10, 20, 30]
round2 = [5, 15, 25]
totals = []

# zip the three lists together
`,
      solution: `names = ["Ada", "Ben", "Cai"]
round1 = [10, 20, 30]
round2 = [5, 15, 25]
totals = []

for name, a, b in zip(names, round1, round2):
    totals.append((name, a + b))
`,
      tests: `assert totals == [("Ada", 15), ("Ben", 35), ("Cai", 55)], f"totals is {totals}"
assert all(isinstance(t, tuple) for t in totals), "each entry must be a tuple"`,
      checks: ['`totals` is `[("Ada", 15), ("Ben", 35), ("Cai", 55)]`', 'Each entry is a tuple'],
      hint: '`zip` accepts three lists: `for name, a, b in zip(names, round1, round2):`. Append `(name, a + b)` — note the double parentheses with `append`.',
      explanation: '`zip` lines the three lists up by position and unpacks each triple into `name`, `a` and `b`. Appending `(name, a + b)` adds one tuple per player; the outer parentheses belong to `append`, the inner ones make the tuple.',
    },
  ],
  takeaways: [
    'A tuple is an ordered, immutable sequence: `(3, 4)` or `3, 4`. A one-item tuple needs a trailing comma: `(5,)`.',
    'Immutability applies to the tuple’s own slots; a mutable object inside (like a list) can still change.',
    'Unpacking `x, y = point` splits a sequence into names; the counts must match. `a, b = b, a` swaps without a temporary; `first, *rest = items` collects the leftovers into a list.',
    'Loops unpack automatically: `for name, score in zip(names, scores):`; `enumerate` and `zip` can be nested in one pattern.',
    'Use tuples for fixed records and as dictionary keys or set members (they are hashable if their contents are); use `namedtuple` when fields deserve names.',
  ],
  reading: [
    { title: 'Tuples and Sequences (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences', source: 'docs', note: 'Packing and unpacking from the official tutorial.' },
    { title: 'PEP 3132 — Extended Iterable Unpacking', url: 'https://peps.python.org/pep-3132/', source: 'pep', note: 'The proposal that introduced `first, *rest = items`.' },
    { title: 'collections.namedtuple', url: 'https://docs.python.org/3/library/collections.html#collections.namedtuple', source: 'docs', note: 'Reference for named tuples and their extra helper methods.' },
    { title: 'zip() in the Built-in Functions reference', url: 'https://docs.python.org/3/library/functions.html#zip', source: 'docs', note: 'Including `strict=True` for catching length mismatches.' },
  ],
};
