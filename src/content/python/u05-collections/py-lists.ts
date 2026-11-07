import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-lists',
  title: 'Lists',
  summary: 'Python’s workhorse collection: create, index and change lists, loop over them safely, and understand the one idea that trips up every beginner — two names can point at the same list.',
  minutes: 18,
  objectives: [
    'Create lists and read items by positive and negative index, including with `len`',
    'Change a list with item assignment and `append`, test membership with `in`, and combine lists with `+` and `*`',
    'Explain that a list is a mutable object, that `b = a` makes an alias rather than a copy, and make a real copy with `.copy()`',
    'Avoid the classic bugs: modifying a list while looping over it, and `[[0] * 3] * 3`',
    'Build and update nested lists such as game grids',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A list is an ordered, changeable collection',
      blocks: [
        {
          type: 'p',
          text: 'So far each variable has held one value. Real programs hold *many*: the items in an inventory, the enemies in a level, the scores of a leaderboard. Python’s answer is the [[list]] — an ordered collection written with square brackets and commas.',
        },
        {
          type: 'code',
          title: 'first_lists.py',
          runnable: true,
          code: `party = ["Ada", "Ben", "Cai"]
print(party)
print(len(party))
print(party[0], party[-1])
mixed = [42, "sword", 3.5, True, [1, 2]]
print(mixed)
print(type(party))
empty = []
print(empty, len(empty))`,
          output: `['Ada', 'Ben', 'Cai']
3
Ada Cai
[42, 'sword', 3.5, True, [1, 2]]
<class 'list'>
[] 0`,
          annotations: [
            { lines: 1, text: 'Square brackets, items separated by commas. The order you write is the order you keep.' },
            { lines: 3, text: '`len` counts the items: 3.' },
            { lines: 4, text: 'Lists are [[sequence|sequences]], so indexing works exactly like it did for strings: `0` is the first item and `-1` the last.' },
            { lines: 5, text: 'A list can hold any mix of objects — even another list. Nothing forces every item to have the same type.' },
            { lines: 8, text: '`[]` is the empty list. It is falsy, which makes `if items:` a handy "is there anything in it?" test.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Not a std::vector<int>',
          text: 'A Python list is closest to a `std::vector<PyObject*>`: a growable array of *references* to objects of any type. There are no template parameters and no fixed element type. If you want a packed array of raw numbers — like `std::vector<float>` — you will meet `array` and NumPy later.',
        },
        {
          type: 'deepdive',
          title: 'How a list is stored (and what that costs)',
          blocks: [
            {
              type: 'p',
              text: 'CPython stores a list as a **dynamic array of pointers**. Reading `items[i]` jumps straight to slot `i`, so it takes the same time for a list of ten or ten million. When the array fills up, Python allocates a bigger one — a little extra room each time — so `append` is cheap *on average* (amortized constant time). Inserting or deleting at the *front* has to shift every other pointer, which takes time proportional to the length.',
            },
            {
              type: 'table',
              headers: ['Operation', 'Cost', 'Why'],
              rows: [
                ['`items[i]`, `items[i] = x`', 'O(1)', 'Jump straight to the slot'],
                ['`items.append(x)`, `items.pop()`', 'O(1) amortized', 'Work happens at the end'],
                ['`items.insert(0, x)`, `items.pop(0)`', 'O(n)', 'Everything else shifts over'],
                ['`x in items`', 'O(n)', 'Compares item by item until a match'],
              ],
              caption: 'When you need fast removal from the front, the standard library has `collections.deque`. When you need fast membership tests, use a set (later this unit).',
            },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does this print?\n\n```\ninventory = ["sword", "shield", "potion", "map"]\nprint(inventory[-2])\n```',
      options: [
        { text: '`shield`', why: '`-2` counts back from the end, not forward from the start. `shield` is at index 1 or −3.' },
        { text: '`potion`', correct: true, why: 'Right: `-1` is `map`, so `-2` is `potion`.' },
        { text: '`map`', why: '`map` is index `-1`, the very last item.' },
        { text: 'An `IndexError`', why: 'The list has four items, so valid indices run from −4 to 3. `-2` is fine.' },
      ],
      explanation: 'A negative index `-k` means `len(inventory) - k`. With 4 items, `-2` is index 2 — `potion`. Valid indices run from `-len` to `len - 1`; anything outside raises `IndexError`.',
    },
    {
      kind: 'concept',
      title: 'Changing a list',
      blocks: [
        {
          type: 'p',
          text: 'Unlike a string, a list is [[mutable]]: you can change it after creating it. Assign to an index to replace an item, `append` to add one at the end, and use `in` to ask whether a value is present. The operators `+` and `*` build **new** lists.',
        },
        {
          type: 'code',
          title: 'changing.py',
          runnable: true,
          code: `party = ["Ada", "Ben", "Cai"]
party[1] = "Bea"
party.append("Dev")
print(party)
print("Cai" in party, "Zed" in party)
print(party + ["Eli"])
print(["-"] * 5)
print(party)`,
          output: `['Ada', 'Bea', 'Cai', 'Dev']
True False
['Ada', 'Bea', 'Cai', 'Dev', 'Eli']
['-', '-', '-', '-', '-']
['Ada', 'Bea', 'Cai', 'Dev']`,
          annotations: [
            { lines: 2, text: 'Item assignment replaces slot 1 *in place*. The list object stays the same; its contents change.' },
            { lines: 3, text: '`append` adds one item at the end and returns `None` — it changes the list rather than producing a new one.' },
            { lines: 5, text: '`in` scans the list for an equal value and gives a `bool`. (`not in` is the opposite.)' },
            { lines: 6, text: '`+` builds a brand-new list from two lists; `party` itself is untouched, as the last `print` shows.' },
            { lines: 7, text: '`*` repeats a list, handy for creating `[0] * 10` — ten zeros.' },
          ],
        },
        {
          type: 'p',
          text: 'Reaching past the end is the one mistake you will make again and again — it is the same off-by-one error you met with strings:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> party = ["Ada", "Bea", "Cai", "Dev"]
>>> party[4]
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    party[4]
    ~~~~~^^^
IndexError: list index out of range`,
          annotations: [
            { lines: 7, text: 'A list of four items has indices 0–3. Index 4 does not exist. Assigning to a missing index (`party[4] = "Eli"`) fails the same way — use `append` to *grow* a list.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does append return None?',
          text: 'It is a Python convention: methods that change an object in place return `None`, so you can’t accidentally treat the result as a new list. The classic bug is `party = party.append("Dev")`, which sets `party` to `None` and throws the list away. Methods that *build* something new (like `+`) return it.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that the final two lines print `potion` and `3`.',
      template: `inventory = ["sword", "shield"]
inventory.___("potion")      # add to the end
inventory[___] = "buckler"   # replace the shield
print(inventory[___])        # potion
print(len(inventory))        # 3`,
      templateIsCode: true,
      blanks: [{ answers: ['append'] }, { answers: ['1'] }, { answers: ['-1', '2'] }],
      wordBank: ['append', 'add', '1', '0', '-1', 'insert'],
      explanation: '`append("potion")` adds to the end, giving three items: sword, shield, potion. The shield sits at index 1, so `inventory[1] = "buckler"` replaces it. The last item is `inventory[-1]` (or `inventory[2]`), which is `potion`. Python lists have no `add` method — that belongs to sets.',
    },
    {
      kind: 'concept',
      title: 'Names point at lists — they don’t contain them',
      blocks: [
        {
          type: 'p',
          text: 'Here is the idea that explains a whole family of confusing bugs. A variable is a **name tied to an object**. When you write `b = a`, Python does not copy the list; it ties a *second name* to the *same* list. That second name is an [[alias]].',
        },
        {
          type: 'code',
          title: 'alias_vs_copy.py',
          runnable: true,
          code: `a = [1, 2, 3]
b = a            # a second name for the SAME list
b.append(4)
print(a)
print(a is b)

c = a.copy()     # a new list with the same items
c.append(5)
print(a, c)
print(a is c)`,
          output: `[1, 2, 3, 4]
True
[1, 2, 3, 4] [1, 2, 3, 4, 5]
False`,
          annotations: [
            { lines: 2, text: 'No copy is made. `a` and `b` are two labels on one object.' },
            { lines: 3, text: 'Appending through `b` changes the one shared list, so printing `a` shows the new item.' },
            { lines: 5, text: '`is` asks "are these the very same object?" — here, yes. (`==` asks whether the contents are equal.)' },
            { lines: 7, text: '`.copy()` makes a new list holding the same items. Changing `c` leaves `a` alone. `a[:]` and `list(a)` do the same thing.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Passing a list to a function',
          text: 'The same rule applies when you pass a list to a function (Unit 6): the function receives another name for *your* list, so if it calls `append`, your list changes too. That is often exactly what you want — and sometimes a nasty surprise. Rule of thumb: if you plan to modify a list you didn’t create, make a copy first.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A copy is shallow',
          text: '`.copy()` copies the *outer* list only. If the list contains other lists, the copy and the original still share those inner lists. For fully independent nested data use `copy.deepcopy` (Unit 9). Lists of numbers or strings are safe, because those items can’t be changed.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'After `scores = [10, 20]` and `backup = scores`, appending `30` to `backup` leaves `scores` as `[10, 20]`.',
      answer: false,
      explanation: 'False. `backup = scores` makes an alias, not a copy, so there is only one list. After `backup.append(30)`, `scores` is `[10, 20, 30]`. To keep a snapshot, write `backup = scores.copy()`.',
    },
    {
      kind: 'error',
      prompt: 'Every new player should start with their *own* copy of the default items, but after `player1` picks up a sword, `player2` has one too! Tap a line that causes the bug.',
      lines: ['default_items = ["potion", "torch"]', 'player1 = default_items', 'player2 = default_items', 'player1.append("sword")', 'print(player2)'],
      linesAreCode: true,
      errorLines: [2, 3],
      explanation: 'Lines 2 and 3 make `player1` and `player2` aliases of the *same* list as `default_items`, so `player1.append("sword")` changes all three names. Each player needs a real copy: `player1 = default_items.copy()` and `player2 = default_items.copy()`. Defaults that get shared and mutated by accident are a classic source of "ghost" bugs in game code.',
    },
    {
      kind: 'concept',
      title: 'Looping over a list',
      blocks: [
        {
          type: 'p',
          text: 'Everything from the loops unit works on lists. A `for` loop hands you each item in order; `enumerate` adds the index when you need it.',
        },
        {
          type: 'code',
          title: 'looping.py',
          runnable: true,
          code: `loot = ["gold", "gem", "scroll"]
for item in loot:
    print("Found", item)

for slot, item in enumerate(loot, start=1):
    print(f"Slot {slot}: {item}")

nums = [2, 4, 6, 8]
for n in nums:
    if n % 2 == 0:
        nums.remove(n)
print(nums)`,
          output: `Found gold
Found gem
Found scroll
Slot 1: gold
Slot 2: gem
Slot 3: scroll
[4, 8]`,
          annotations: [
            { lines: 5, text: '`enumerate(loot, start=1)` yields `(1, "gold")`, `(2, "gem")`… — slot numbers that start at 1 for display.' },
            { lines: '8-11', text: 'The trap! We try to remove every even number while looping, yet `4` and `8` survive.' },
          ],
        },
        {
          type: 'p',
          text: 'Why did `[4, 8]` survive? The loop walks the list by **position**. It looks at index 0 (`2`) and removes it, so the list shrinks to `[4, 6, 8]` and everything slides left. The loop then moves on to index 1 — which is now `6`. The `4` that slid into index 0 is skipped entirely.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Never resize a list you are looping over',
          text: 'Either loop over a **copy** (`for n in nums.copy():`), or — better — build a *new* list of the items you want to keep. Unit 5’s last lesson turns that into a one-liner with a list comprehension: `nums = [n for n in nums if n % 2 != 0]`.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Trace which position the loop visits next after each `remove`.',
      code: `names = ["a", "b", "b", "c"]
for n in names:
    if n == "b":
        names.remove(n)
print(names)`,
      answer: "['a', 'b', 'c']",
      hint: 'After the first `remove`, the second `b` slides into the index the loop just finished with.',
      explanation: 'The loop visits index 0 (`a`, kept) and index 1 (`b`, removed). The list becomes `["a", "b", "c"]`; the second `b` has slid into index 1, but the loop now moves to index 2 (`c`). The second `b` is never examined, so one `b` survives. Looping over a copy, or building a new list, fixes it.',
    },
    {
      kind: 'concept',
      title: 'Lists of lists: grids and a famous trap',
      blocks: [
        {
          type: 'p',
          text: 'A list can contain lists, which is how Python represents a table or a 2D game board: the outer list holds the **rows** and each row holds the **cells**. You index twice — row first, then column.',
        },
        {
          type: 'code',
          title: 'grids.py',
          runnable: true,
          code: `board = [
    [".", ".", "."],
    [".", "X", "."],
    [".", ".", "."],
]
print(board[1][1])
board[0][2] = "O"
for row in board:
    print(" ".join(row))

good = []
for _ in range(2):
    good.append([0] * 3)
bad = [[0] * 3] * 2
good[0][0] = 9
bad[0][0] = 9
print(good)
print(bad)`,
          output: `X
. . O
. X .
. . .
[[9, 0, 0], [0, 0, 0]]
[[9, 0, 0], [9, 0, 0]]`,
          annotations: [
            { lines: 6, text: '`board[1]` is the middle row; `[1]` on that picks the middle cell: `"X"`.' },
            { lines: 7, text: 'Row 0, column 2 — the top-right corner. Python reads this as `(board[0])[2] = "O"`.' },
            { lines: 9, text: '`" ".join(row)` glues a row’s strings together with spaces, which is far tidier than printing cell by cell.' },
            { lines: '11-13', text: 'The safe way: each pass through the loop builds a *new* row `[0] * 3`.' },
            { lines: 14, text: 'The trap: `[[0] * 3] * 2` builds the row once and repeats a *reference* to it, so both "rows" are the same list.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '`[[0] * 3] * 2` shares its rows',
          text: '`*` repeats references, not objects. That is harmless for numbers and strings (they can’t change) but disastrous for lists. Writing one cell in `bad` changes every row. Always build grids with a loop (or, in the next lessons, a comprehension).',
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Tile maps, chess boards, inventories with rows and columns, and image pixels all start as lists of lists. When grids get big and you need speed, NumPy’s 2D arrays replace them — but the `grid[row][col]` thinking carries over directly.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\ndata = [1, [2, 3], "ab", [4, 5, 6]]\nprint(len(data) + len(data[3]))\n```',
      answer: '7',
      hint: '`len(data)` counts the *top-level* items only. `data[3]` is the last inner list.',
      explanation: '`data` has four top-level items (the nested lists count as one item each), so `len(data)` is 4. `data[3]` is `[4, 5, 6]`, whose length is 3. The total is $4 + 3 = 7$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Starting from the list below, change it so that:\n\n1. `"shield"` is replaced by `"buckler"`\n2. `"map"` is appended to the end\n3. `last` holds the final item of the list',
      starter: `inventory = ["sword", "shield", "potion"]

# 1. replace the shield
# 2. append "map"
# 3. last = the final item
`,
      solution: `inventory = ["sword", "shield", "potion"]

inventory[1] = "buckler"
inventory.append("map")
last = inventory[-1]
`,
      tests: `assert inventory == ["sword", "buckler", "potion", "map"], f"inventory is {inventory}"
assert last == "map", f"last is {last!r}"`,
      checks: ['The shield becomes a buckler', '`"map"` is appended at the end', '`last` is `"map"`'],
      hint: 'Item assignment is `inventory[1] = ...`; the final item is `inventory[-1]`.',
      explanation: '`inventory[1] = "buckler"` replaces the item at index 1 in place, `inventory.append("map")` adds to the end, and `inventory[-1]` reads the last item — which is `"map"` only *after* the append, so the order of the steps matters.',
    },
    {
      kind: 'code',
      prompt: 'Build a 3 × 3 **identity grid** in a variable called `grid`: 1 on the diagonal, 0 everywhere else, as three *separate* row lists.\n\n```\n[[1, 0, 0],\n [0, 1, 0],\n [0, 0, 1]]\n```\n\nUse loops — and avoid the `[[0] * 3] * 3` trap.',
      starter: `grid = []

# build one row at a time
`,
      solution: `grid = []

for r in range(3):
    row = [0] * 3
    row[r] = 1
    grid.append(row)
`,
      tests: `assert grid == [[1, 0, 0], [0, 1, 0], [0, 0, 1]], f"grid is {grid}"
assert grid[0] is not grid[1] and grid[1] is not grid[2], "the rows must be separate lists"`,
      checks: ['`grid` equals the identity matrix', 'Each row is its own list'],
      hint: 'For each `r`, create a fresh `row = [0] * 3`, set `row[r] = 1`, then append it to `grid`.',
      explanation: 'On pass `r`, a fresh row of three zeros is created (so rows never share), the diagonal cell `row[r]` becomes 1, and the row is appended. Because `row = [0] * 3` runs inside the loop, every row is a different object. Identity matrices come up constantly in graphics and in the linear algebra behind AI.',
    },
  ],
  takeaways: [
    'A list is an ordered, mutable collection of any objects: `[1, "two", [3]]`. Indexing and `len` work as for strings, and negative indices count from the end.',
    'Change lists in place with `items[i] = x` and `append`; `+` and `*` build new lists. In-place methods return `None`.',
    '`b = a` creates an alias, not a copy. Use `.copy()` (or `a[:]`) for an independent shallow copy; nested lists are still shared.',
    'Don’t add or remove items while looping over the same list — loop over a copy or build a new list.',
    'Build grids with a loop; `[[0] * 3] * 3` repeats one row three times.',
  ],
  reading: [
    { title: 'The Python Tutorial: Lists', url: 'https://docs.python.org/3/tutorial/introduction.html#lists', source: 'docs', note: 'The official first look at lists, indexing and slicing.' },
    { title: 'Built-in Types: Lists', url: 'https://docs.python.org/3/library/stdtypes.html#lists', source: 'docs', note: 'The complete reference for every list operation and method.' },
    { title: 'Facts and myths about Python names and values', url: 'https://nedbatchelder.com/text/names.html', source: 'article', note: 'Ned Batchelder’s classic explanation of aliasing — read it once and these bugs stop surprising you.' },
    { title: 'Programming FAQ: How do I create a multidimensional list?', url: 'https://docs.python.org/3/faq/programming.html#how-do-i-create-a-multidimensional-list', source: 'docs', note: 'The official explanation of the `[[0] * 3] * 3` trap.' },
  ],
};
