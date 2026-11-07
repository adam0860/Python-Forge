import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-sets',
  title: 'Sets',
  summary: 'Collections of unique items with lightning-fast membership tests — and set algebra (union, intersection, difference) for questions like "which abilities do these two classes share?"',
  minutes: 17,
  objectives: [
    'Create sets (and remember that `{}` is an empty *dict*), add and remove items, and explain why sets have no order or indexing',
    'Remove duplicates with `set(...)` and know when order is lost',
    'Combine sets with `|`, `&`, `-` and `^` and test relationships with `<=` and `isdisjoint`',
    'Use sets for visited-tracking, fast membership and "seen before?" logic',
    'Choose between list, tuple, dict and set for a given job',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A set is a bag of unique things',
      blocks: [
        {
          type: 'p',
          text: 'A [[set]] holds **unique** items and doesn’t care about order. Add the same value twice and it still appears once. It is written with curly braces — but without colons, so Python can tell it from a dictionary.',
        },
        {
          type: 'code',
          title: 'sets.py',
          runnable: true,
          code: `tags = {"fire", "magic", "fire", "ranged"}
print(len(tags))
print(sorted(tags))
tags.add("magic")
tags.add("boss")
tags.discard("ranged")
tags.discard("water")
print(sorted(tags))
print("fire" in tags)
empty_set = set()
empty_dict = {}
print(type(empty_set).__name__, type(empty_dict).__name__)
print(sorted(set([3, 1, 3, 2, 1])))`,
          output: `3
['fire', 'magic', 'ranged']
['boss', 'fire', 'magic']
True
set dict
[1, 2, 3]`,
          annotations: [
            { lines: 1, text: '`"fire"` is listed twice but stored once, so the set has 3 items.' },
            { lines: 3, text: 'We print `sorted(tags)` — a list — because a set has no defined order and the order Python shows can differ between runs.' },
            { lines: 4, text: '`add` inserts an item. Adding one that is already present changes nothing and raises no error.' },
            { lines: 6, text: '`discard` removes an item *if present*. (`remove` is the strict version: it raises `KeyError` when the item is missing.)' },
            { lines: 9, text: '`in` on a set is very fast: it hashes the item and jumps to its slot, just like a dict lookup.' },
            { lines: 10, text: 'An **empty** set must be written `set()`, because `{}` already means an empty dictionary.' },
            { lines: 13, text: 'Passing any iterable to `set(...)` removes its duplicates. The classic "dedupe" move.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> tags = {"fire", "magic"}
>>> tags[0]
Traceback (most recent call last):
  File "<python-input-2>", line 1, in <module>
    tags[0]
    ~~~~^^^
TypeError: 'set' object is not subscriptable`,
          annotations: [
            { lines: 7, text: 'No order means no position, so no indexing or slicing. You ask a set whether it *contains* something; you don’t ask what is "first".' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Items must be hashable',
          text: 'Like dictionary keys, set members must be [[hashable]]: strings, numbers and tuples are fine; lists, dicts and other sets are not (`{[1, 2]}` raises `TypeError: cannot use \'list\' as a set element (unhashable type: \'list\')`). A set *of tuples* is a great way to store coordinates. If you need a set that can itself be a member of another set, use an immutable `frozenset`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is the type of `x` after `x = {}`?',
      options: [
        { text: '`set`', why: 'A very common guess! But curly braces with nothing inside have always meant an empty dictionary, which was in the language before sets had literal syntax.' },
        { text: '`dict`', correct: true, why: 'Right. `{}` is an empty dict. Write `set()` for an empty set.' },
        { text: '`list`', why: 'Lists use square brackets: `[]`.' },
        { text: '`tuple`', why: 'The empty tuple is `()`.' },
      ],
      explanation: 'Dictionaries claimed `{}` first, so an empty set has to be spelled `set()`. Non-empty sets use braces: `{1, 2, 3}`. A frequent bug is writing `seen = {}` and then calling `seen.add(...)`, which fails because dicts have no `add`.',
    },
    {
      kind: 'truefalse',
      prompt: 'The set `{[1, 2], [3, 4]}` is a valid set of two lists.',
      answer: false,
      explanation: 'False. Set members must be hashable, and lists are mutable, so this raises `TypeError: cannot use \'list\' as a set element (unhashable type: \'list\')`. Use tuples instead: `{(1, 2), (3, 4)}`.',
    },
    {
      kind: 'concept',
      title: 'Set algebra',
      blocks: [
        {
          type: 'p',
          text: 'Sets come from mathematics, and so do their operations. Two class spell lists make a good example:',
        },
        {
          type: 'code',
          title: 'algebra.py',
          runnable: true,
          code: `mage = {"fireball", "heal", "teleport", "shield"}
cleric = {"heal", "shield", "bless"}
print(sorted(mage | cleric))
print(sorted(mage & cleric))
print(sorted(mage - cleric))
print(sorted(mage ^ cleric))
print({"heal"} <= mage, mage.isdisjoint({"bless"}))`,
          output: `['bless', 'fireball', 'heal', 'shield', 'teleport']
['heal', 'shield']
['fireball', 'teleport']
['bless', 'fireball', 'teleport']
True True`,
          annotations: [
            { lines: 3, text: '**Union** `|`: everything in either set.' },
            { lines: 4, text: '**Intersection** `&`: only what is in both — the shared spells.' },
            { lines: 5, text: '**Difference** `-`: in `mage` but not in `cleric`. Unlike the others, order matters: `cleric - mage` would be `{"bless"}`.' },
            { lines: 6, text: '**Symmetric difference** `^`: in exactly one of the two sets.' },
            { lines: 7, text: '`<=` asks "is the left a subset of the right?"; `isdisjoint` asks "do they have nothing in common?".' },
          ],
        },
        {
          type: 'table',
          headers: ['Operator', 'Method', 'Meaning'],
          rows: [
            ['`a | b`', '`a.union(b)`', 'Items in `a` or `b` (or both)'],
            ['`a & b`', '`a.intersection(b)`', 'Items in both'],
            ['`a - b`', '`a.difference(b)`', 'Items in `a` that are not in `b`'],
            ['`a ^ b`', '`a.symmetric_difference(b)`', 'Items in exactly one of them'],
            ['`a <= b`, `a >= b`', '`a.issubset(b)`, `a.issuperset(b)`', 'Every item of `a` is in `b` / the reverse'],
            ['—', '`a.isdisjoint(b)`', 'No items in common'],
          ],
          caption: 'The operators need two sets; the methods accept any iterable, e.g. `a.union([1, 2])`. `a + b` is not defined for sets.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother, when loops can do this?',
          text: 'Two nested loops that check every item of `mage` against every item of `cleric` take time proportional to the product of their sizes. `mage & cleric` hashes each item once, so it takes time proportional to their *sum*. On big collections — all the items two players own, all the tiles two paths touch — that is the difference between instant and painful.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Choose the operator that makes each comment true.',
      template: `a = {1, 2, 3}
b = {3, 4}
print(sorted(a ___ b))   # [1, 2, 3, 4]   everything in either
print(sorted(a ___ b))   # [3]            in both
print(sorted(a ___ b))   # [1, 2]         in a but not in b
print(sorted(a ___ b))   # [1, 2, 4]      in exactly one`,
      templateIsCode: true,
      blanks: [{ answers: ['|'] }, { answers: ['&'] }, { answers: ['-'] }, { answers: ['^'] }],
      wordBank: ['|', '&', '-', '^', '+'],
      explanation: '`|` is union, `&` intersection, `-` difference (items of `a` not in `b`) and `^` symmetric difference (items in exactly one set). `+` is the tempting wrong answer: sets don’t define it, and `a + b` raises `TypeError`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. (`sorted` makes the order predictable.)',
      code: `a = {1, 2, 3, 4}
b = {3, 4, 5}
print(sorted(a & b), sorted(a - b), sorted(a ^ b))`,
      answer: '[3, 4] [1, 2] [1, 2, 5]',
      hint: '`a & b` keeps the shared items; `a - b` drops from `a` anything that is in `b`; `a ^ b` keeps what is in only one of them.',
      explanation: 'The intersection is `{3, 4}`. The difference `a - b` removes 3 and 4 from `a`, leaving `{1, 2}`. The symmetric difference keeps what is in exactly one set: 1 and 2 from `a`, 5 from `b` — `[1, 2, 5]`.',
    },
    {
      kind: 'concept',
      title: 'Sets in practice: seen-before, dedupe and fast tests',
      blocks: [
        {
          type: 'p',
          text: 'Most uses of sets boil down to one question: *have I seen this before?* That covers de-duplication, visited tiles in a pathfinder, banned-word filters and permission checks.',
        },
        {
          type: 'code',
          title: 'practical_sets.py',
          runnable: true,
          code: `drops = ["gem", "gold", "gem", "ring", "gold"]
print(list(dict.fromkeys(drops)))
print(len(set(drops)))

visited = set()
path = [(0, 0), (1, 0), (1, 1), (1, 0), (0, 0)]
for pos in path:
    if pos in visited:
        print("been to", pos)
    else:
        visited.add(pos)
print(len(visited))

banned = {"cheat", "hack"}
chat = "no hack here".split()
print(any(word in banned for word in chat))`,
          output: `['gem', 'gold', 'ring']
3
been to (1, 0)
been to (0, 0)
3
True`,
          annotations: [
            { lines: 2, text: '`set(drops)` would drop the duplicates but lose the order. `dict.fromkeys` keeps the keys in first-seen order, because dicts are ordered — the order-preserving dedupe idiom.' },
            { lines: 5, text: 'An empty set to collect visited positions.' },
            { lines: 8, text: 'A tuple of coordinates is hashable, so it can live in a set. `in` is quick however many tiles have been visited.' },
            { lines: 11, text: 'Record the position the first time we see it.' },
            { lines: 16, text: 'A set of banned words answers "is this word banned?" in constant time, so filtering a long chat log stays fast.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Pathfinding and procedural generation',
          text: 'Breadth-first search, A* and flood fill all keep a `visited` set of grid positions so they never revisit a tile; with a list instead of a set, big maps grind to a halt. Roguelike map generators also use sets to track which rooms or tiles have been carved.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Convert a list to a set for repeated lookups',
          text: 'If you test `x in some_list` inside a loop, convert the list once with `allowed = set(some_list)` and test against the set. The conversion costs one pass; every later lookup is O(1) instead of O(n).',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This should count the distinct tiles visited, but it crashes with `AttributeError: \'dict\' object has no attribute \'add\'`. Tap the line that **causes** the problem.',
      lines: ['seen = {}', 'for tile in [(0, 0), (1, 0), (0, 0)]:', '    seen.add(tile)', 'print(len(seen))'],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'Line 3 is where Python complains, but the mistake is on line 1: `{}` creates an empty **dict**, not a set. Dictionaries have no `add` method. Write `seen = set()`; the loop then works and the program prints `2`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nprint(len(set("mississippi")))\n```',
      answer: '4',
      hint: 'Iterating a string gives its characters. How many *different* letters does "mississippi" use?',
      explanation: 'A set keeps one copy of each character: `m`, `i`, `s` and `p` — four distinct letters, so the length is 4. `set(text)` is a quick way to find the distinct characters of any string.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'Choosing the right collection',
      blocks: [
        {
          type: 'p',
          text: 'You now know all four built-in collections. Choosing between them is mostly asking three questions: *Do I need order or positions? Will it change? Do I look things up by value or by key?*',
        },
        {
          type: 'table',
          headers: ['Property', 'list', 'tuple', 'dict', 'set'],
          rows: [
            ['Literal', '`[1, 2]`', '`(1, 2)`', '`{"a": 1}`', '`{1, 2}`'],
            ['Ordered', 'yes', 'yes', 'insertion order', 'no'],
            ['Changeable', 'yes', 'no', 'yes', 'yes'],
            ['Duplicates', 'allowed', 'allowed', 'keys unique', 'not allowed'],
            ['Find by', 'position', 'position', 'key (fast)', 'value (fast `in`)'],
            ['Typical use', 'a sequence that grows', 'a fixed record', 'a lookup table', '"seen before?" and set algebra'],
          ],
          caption: 'If in doubt, start with a list — and switch when a question like "is this in there?" starts showing up in a loop.',
        },
        {
          type: 'code',
          title: 'two_sum.py',
          runnable: true,
          code: `nums = [8, 3, 11, 5, 9]
target = 14
seen = set()
found = None
for n in nums:
    if target - n in seen:
        found = (target - n, n)
        break
    seen.add(n)
print(found)`,
          output: '(3, 11)',
          annotations: [
            { lines: 6, text: 'If the number we *need* to complete the pair was already seen, we are done. This is one fast lookup per item.' },
            { lines: 9, text: 'Otherwise remember this number for later.' },
          ],
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'The two-sum question',
          text: 'This is one of the most-asked coding-interview problems: "find two numbers that add up to a target". The nested-loop answer is O(n²); the set (or dict) answer above is O(n). Saying *why* a set makes the second approach fast — O(1) membership through hashing — is exactly what interviewers listen for.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'A set is a dictionary without values',
          text: 'CPython stores a set as a hash table that keeps only keys. That is why sets are fast at `in`, why members must be hashable, and why their order is arbitrary: where an item sits depends on its hash, not on when it was added. For strings, the hash changes from one run of Python to the next (a security feature), so even the printed order of a set of strings can differ between runs.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Two players have unlocked these achievements. Using set operations, create:\n\n- `common` — achievements both have\n- `only_ada` — achievements only Ada has\n- `total` — how many *different* achievements exist between them',
      starter: `ada = {"first_blood", "explorer", "sharpshooter"}
ben = {"explorer", "tank", "first_blood", "medic"}

# common = ...
# only_ada = ...
# total = ...
`,
      solution: `ada = {"first_blood", "explorer", "sharpshooter"}
ben = {"explorer", "tank", "first_blood", "medic"}

common = ada & ben
only_ada = ada - ben
total = len(ada | ben)
`,
      tests: `assert common == {"first_blood", "explorer"}, f"common is {common}"
assert only_ada == {"sharpshooter"}, f"only_ada is {only_ada}"
assert total == 5, f"total is {total}"`,
      checks: ['`common` is the intersection', '`only_ada` is the difference `ada - ben`', '`total` counts the union'],
      hint: 'Intersection `&`, difference `-`, union `|` — and `len(...)` of a set counts its items.',
      explanation: '`ada & ben` keeps what both have; `ada - ben` keeps what only Ada has; `len(ada | ben)` counts every distinct achievement, with shared ones counted once: 2 shared + 1 only Ada + 2 only Ben = 5.',
    },
    {
      kind: 'code',
      prompt: 'Find the **duplicate** ids: build a set `duplicates` containing every value that appears more than once in `ids`. Use a `seen` set while looping. Expected: `{4, 8}`.',
      starter: `ids = [4, 8, 15, 8, 16, 4, 23, 42]
seen = set()
duplicates = set()

# loop over ids; an id already in seen is a duplicate
`,
      solution: `ids = [4, 8, 15, 8, 16, 4, 23, 42]
seen = set()
duplicates = set()

for i in ids:
    if i in seen:
        duplicates.add(i)
    else:
        seen.add(i)
`,
      tests: `assert duplicates == {4, 8}, f"duplicates is {duplicates}"`,
      checks: ['`duplicates` is `{4, 8}`', 'Uses the `seen` set to detect repeats'],
      hint: 'If `i in seen`, add it to `duplicates`; otherwise add it to `seen`.',
      explanation: 'The first sighting of an id goes into `seen`. If the id is *already* in `seen`, it has appeared before, so it goes into `duplicates` (a set, so an id seen three times is still listed once). One pass, with O(1) work per item.',
    },
    {
      kind: 'code',
      prompt: 'A character stands at `pos = (2, 2)` on a grid. `walls` is a set of blocked tiles. Build the list `open_moves` of neighboring tiles the character can step to, checking directions in this order: up, right, down, left (where up is `(0, -1)`). Skip walls.\n\nExpected: `[(2, 3), (1, 2)]`.',
      starter: `pos = (2, 2)
walls = {(2, 1), (3, 2)}
directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]   # up, right, down, left
open_moves = []

# try each direction; keep the tiles that are not walls
`,
      solution: `pos = (2, 2)
walls = {(2, 1), (3, 2)}
directions = [(0, -1), (1, 0), (0, 1), (-1, 0)]   # up, right, down, left
open_moves = []

x, y = pos
for dx, dy in directions:
    target = (x + dx, y + dy)
    if target not in walls:
        open_moves.append(target)
`,
      tests: `assert open_moves == [(2, 3), (1, 2)], f"open_moves is {open_moves}"`,
      checks: ['`open_moves` is `[(2, 3), (1, 2)]`', 'Uses `not in walls`'],
      hint: 'Unpack `x, y = pos`, then for each `(dx, dy)` build `target = (x + dx, y + dy)` and append it if it is not in `walls`.',
      explanation: 'Up is `(2, 1)` — a wall. Right is `(3, 2)` — a wall. Down is `(2, 3)` and left is `(1, 2)`, both free. The tuple `(x + dx, y + dy)` is hashable, so `target not in walls` is a fast set lookup. This direction-list loop is the core of grid movement, flood fill and pathfinding.',
    },
  ],
  takeaways: [
    'A set stores unique, hashable items with no order and no indexing. `{}` is an empty dict — write `set()` for an empty set.',
    '`add`, `discard` (safe) and `remove` (raises `KeyError`) change a set; `set(iterable)` removes duplicates.',
    'Set algebra: `|` union, `&` intersection, `-` difference, `^` symmetric difference, `<=` subset, `isdisjoint`. Order matters only for `-`.',
    '`x in a_set` is O(1) on average, versus O(n) for a list — convert a list to a set before repeated lookups.',
    'Sets of tuples are ideal for visited tiles and walls; `dict.fromkeys(items)` de-duplicates while preserving order.',
  ],
  reading: [
    { title: 'Sets (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/datastructures.html#sets', source: 'docs', note: 'The official introduction, with the operators on short examples.' },
    { title: 'Set Types — set, frozenset', url: 'https://docs.python.org/3/library/stdtypes.html#set-types-set-frozenset', source: 'docs', note: 'Every set method and operator, plus `frozenset`.' },
    { title: 'Set (mathematics)', url: 'https://en.wikipedia.org/wiki/Set_(mathematics)', source: 'wikipedia', note: 'The mathematics that union, intersection and difference come from.' },
  ],
};
