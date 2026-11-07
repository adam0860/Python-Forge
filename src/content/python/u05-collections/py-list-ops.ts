import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-list-ops',
  title: 'List Methods, Slicing and Sorting',
  summary: 'Add and remove items, cut lists with slices, search and summarize them, and sort anything — including the difference between `sort()` and `sorted()` and why Python’s sort is stable.',
  minutes: 19,
  objectives: [
    'Add items with `append`, `extend` and `insert`, and remove them with `pop`, `remove` and `del`',
    'Slice lists with `[start:stop:step]`, assign to and delete slices, and copy with `[:]`',
    'Search and summarize with `index`, `count`, `min`, `max` and `sum`, and avoid `ValueError` by checking with `in` first',
    'Sort with `sorted()` and `.sort()`, use `reverse=` and `key=`, and explain why a stable sort matters',
    'Use a list as a stack, and explain why removing from the front is slow',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Adding and removing items',
      blocks: [
        {
          type: 'p',
          text: 'Lists come with a toolbox of [[method|methods]]. The ones that grow and shrink a list all work **in place** — they change the list you call them on:',
        },
        {
          type: 'code',
          title: 'grow_shrink.py',
          runnable: true,
          code: `loot = ["gold", "gem"]
loot.append("scroll")
loot.extend(["ring", "key"])
loot.insert(1, "map")
print(loot)
last = loot.pop()
first = loot.pop(0)
print(last, first)
loot.remove("gem")
print(loot)
del loot[0]
print(loot)`,
          output: `['gold', 'map', 'gem', 'scroll', 'ring', 'key']
key gold
['map', 'scroll', 'ring']
['scroll', 'ring']`,
          annotations: [
            { lines: 2, text: '`append(x)` adds a single item at the end.' },
            { lines: 3, text: '`extend(iterable)` adds *each* item of another collection at the end.' },
            { lines: 4, text: '`insert(i, x)` places `x` *before* index `i`, shifting later items to the right.' },
            { lines: 6, text: '`pop()` removes **and returns** the last item.' },
            { lines: 7, text: '`pop(i)` removes and returns the item at index `i`.' },
            { lines: 9, text: '`remove(x)` deletes the first item *equal to* `x` (found by value, not position).' },
            { lines: 11, text: '`del loot[0]` is a statement that deletes by index and returns nothing.' },
          ],
        },
        {
          type: 'p',
          text: 'The pair that confuses everyone is `append` versus `extend`. `append` adds *one* item — even if that item is itself a list. `extend` (and its operator form `+=`) adds the items *inside* the collection you give it:',
        },
        {
          type: 'code',
          title: 'append_vs_extend.py',
          runnable: true,
          code: `a = [1, 2]
a.append([3, 4])
b = [1, 2]
b.extend([3, 4])
c = [1, 2]
c += [3, 4]
print(a)
print(b)
print(c)`,
          output: `[1, 2, [3, 4]]
[1, 2, 3, 4]
[1, 2, 3, 4]`,
          annotations: [
            { lines: 2, text: 'One new item — the list `[3, 4]` — so `a` ends up with a list *inside* it.' },
            { lines: 6, text: '`c += [3, 4]` extends `c` in place. (`c = c + [3, 4]` would build a new list instead.)' },
          ],
        },
        {
          type: 'table',
          headers: ['Method', 'What it does', 'Returns'],
          rows: [
            ['`append(x)`', 'Add one item at the end', '`None`'],
            ['`extend(items)`', 'Add every item of `items` at the end', '`None`'],
            ['`insert(i, x)`', 'Insert `x` before index `i`', '`None`'],
            ['`pop()` / `pop(i)`', 'Remove the last item / the item at `i`', 'the removed item'],
            ['`remove(x)`', 'Remove the first item equal to `x`', '`None`'],
            ['`clear()`', 'Remove every item', '`None`'],
          ],
          caption: 'Only `pop` gives you something back. The rest change the list and return `None`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You have `loot = ["gold"]` and `more = ["gem", "ring"]`. Which line leaves `loot` equal to `["gold", "gem", "ring"]`?',
      options: [
        { text: '`loot.append(more)`', why: 'That adds `more` as a single item: `["gold", ["gem", "ring"]]`.' },
        { text: '`loot.extend(more)`', correct: true, why: 'Yes — `extend` adds each item of `more` separately.' },
        { text: '`loot = loot.extend(more)`', why: '`extend` changes `loot` in place and returns `None`, so this sets `loot` to `None`.' },
        { text: '`loot.add(more)`', why: 'Lists have no `add` method; that name belongs to sets.' },
      ],
      explanation: '`extend` loops over `more` and appends each item, so `loot` becomes `["gold", "gem", "ring"]`. `loot += more` does the same. Remember that in-place methods return `None`, so never assign their result back to the list.',
    },
    {
      kind: 'concept',
      title: 'Slicing lists',
      blocks: [
        {
          type: 'p',
          text: 'Slicing works on lists exactly as on strings: `items[start:stop:step]` takes positions from `start` up to — but not including — `stop`. Every part is optional. Because lists are mutable, slices can also be **assigned to** and **deleted**.',
        },
        {
          type: 'code',
          title: 'slices.py',
          runnable: true,
          code: `letters = ["a", "b", "c", "d", "e", "f"]
print(letters[1:4])
print(letters[:2], letters[4:])
print(letters[::2])
print(letters[::-1])
copy = letters[:]
letters[1:3] = ["X", "Y", "Z"]
print(letters)
del letters[-2:]
print(letters)
print(copy)`,
          output: `['b', 'c', 'd']
['a', 'b'] ['e', 'f']
['a', 'c', 'e']
['f', 'e', 'd', 'c', 'b', 'a']
['a', 'X', 'Y', 'Z', 'd', 'e', 'f']
['a', 'X', 'Y', 'Z', 'd']
['a', 'b', 'c', 'd', 'e', 'f']`,
          annotations: [
            { lines: 2, text: 'Indices 1, 2 and 3 — the stop (4) is excluded, so the length is `stop - start`.' },
            { lines: 3, text: 'A missing start means "from the beginning"; a missing stop means "to the end".' },
            { lines: 5, text: 'A step of −1 reverses. (For reversing in place, `letters.reverse()` also exists.)' },
            { lines: 6, text: '`[:]` slices everything, producing a shallow copy — the same as `.copy()`.' },
            { lines: 7, text: 'Assigning to a slice replaces those positions with *any* number of new items. Two slots (`b`, `c`) became three (`X`, `Y`, `Z`), so the list grew.' },
            { lines: 9, text: '`del letters[-2:]` deletes the last two items.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is the stop excluded?',
          text: 'Half-open ranges make slices fit together without gaps or overlaps: `items[:3] + items[3:]` is always the whole list, and `len(items[a:b])` is `b - a`. The same rule governs `range`, so once it clicks for one it clicks for all.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'A slice never raises `IndexError`: out-of-range bounds are clipped, so `letters[2:100]` is just the items from index 2 to the end. Plain indexing (`letters[100]`) is the strict one.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Fill in a slice so that each comment is true for `nums = [0, 1, 2, 3, 4, 5, 6, 7]`.',
      template: `nums = [0, 1, 2, 3, 4, 5, 6, 7]
print(nums[___])    # [2, 3, 4]
print(nums[___])    # [5, 6, 7]
print(nums[___])    # [0, 2, 4, 6]
print(nums[___])    # [7, 6, 5]`,
      templateIsCode: true,
      blanks: [{ answers: ['2:5'] }, { answers: ['5:', '-3:'] }, { answers: ['::2'] }, { answers: ['7:4:-1', '-1:4:-1'] }],
      wordBank: ['2:5', '5:', '::2', '7:4:-1', '2:4', '::-2'],
      explanation: '`nums[2:5]` takes indices 2, 3, 4. `nums[5:]` starts at index 5 and runs to the end (`nums[-3:]` is the same). `nums[::2]` takes every second item from the start. For a backwards slice, the step is negative and the start must be *after* the stop: `nums[7:4:-1]` visits 7, 6, 5 and stops before 4.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of the three slices.',
      code: `s = list(range(10))
print(s[2:8:3], s[-3:], s[::-4])`,
      answer: '[2, 5] [7, 8, 9] [9, 5, 1]',
      hint: '`range(10)` gives 0–9, so the value of each item equals its index. For the last slice, start from the end and step back by 4.',
      explanation: '`s[2:8:3]` visits indices 2 and 5 (the next, 8, is the excluded stop), giving `[2, 5]`. `s[-3:]` is the last three items, `[7, 8, 9]`. With a step of −4 the slice starts at the end: indices 9, 5 and 1 — `[9, 5, 1]`.',
    },
    {
      kind: 'concept',
      title: 'Searching and summarizing',
      blocks: [
        {
          type: 'p',
          text: 'Questions you ask of a list all the time — where is it, how many, what’s the biggest, what’s the total — have one-word answers:',
        },
        {
          type: 'code',
          title: 'searching.py',
          runnable: true,
          code: `potions = [5, 12, 5, 30, 5]
print(potions.index(12))
print(potions.count(5))
print(min(potions), max(potions), sum(potions))
print(sum(potions) / len(potions))
if 99 in potions:
    print(potions.index(99))
else:
    print("no 99")`,
          output: `1
3
5 30 57
11.4
no 99`,
          annotations: [
            { lines: 2, text: '`index(x)` returns the position of the *first* match.' },
            { lines: 3, text: '`count(x)` counts how many items equal `x`.' },
            { lines: 4, text: '`min`, `max` and `sum` are built-in functions that accept any collection of numbers (`min` and `max` also work on strings).' },
            { lines: 5, text: 'The average is the sum divided by the count — `len` is the count.' },
            { lines: 6, text: 'Check with `in` *before* calling `index` or `remove`, because they raise an error when the value is missing.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> potions.index(99)
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    potions.index(99)
    ~~~~~~~~~~~~~^^^^
ValueError: list.index(x): x not in list`,
          annotations: [
            { lines: 6, text: 'Python 3.14 words this as `list.index(x): x not in list`. `remove` fails the same way, and `pop()` on an empty list raises `IndexError`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'No -1 sentinel',
          text: 'In C++ and JavaScript a failed search often returns `-1`. Python’s `list.index` raises an exception instead (strings have a separate `find` method that does return `-1`). Errors that can’t be ignored by accident are a deliberate design choice — in Unit 8 you’ll learn how to catch them.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If the value is missing, `items.index(x)` returns `-1`.',
      answer: false,
      explanation: 'False. `list.index` raises `ValueError` when the value is absent. Only the *string* method `str.find` returns `-1`. Guard with `if x in items:` first, or catch the exception (Unit 8).',
    },
    {
      kind: 'concept',
      title: 'Sorting: sorted() and .sort()',
      blocks: [
        {
          type: 'p',
          text: 'There are two ways to sort, and the difference is the [[in-place]] rule again. `sorted(items)` is a function that returns a **new** sorted list and leaves the original alone. `items.sort()` sorts the list **in place** and returns `None`.',
        },
        {
          type: 'code',
          title: 'sorting.py',
          runnable: true,
          code: `scores = [42, 7, 19, 88, 7]
print(sorted(scores))
print(sorted(scores, reverse=True))
print(scores)
result = scores.sort()
print(result, scores)

words = ["banana", "Cherry", "apple", "fig"]
print(sorted(words))
print(sorted(words, key=str.lower))
print(sorted(words, key=len))`,
          output: `[7, 7, 19, 42, 88]
[88, 42, 19, 7, 7]
[42, 7, 19, 88, 7]
None [7, 7, 19, 42, 88]
['Cherry', 'apple', 'banana', 'fig']
['apple', 'banana', 'Cherry', 'fig']
['fig', 'apple', 'banana', 'Cherry']`,
          annotations: [
            { lines: 2, text: '`sorted` works on any iterable and always returns a list.' },
            { lines: 3, text: '`reverse=True` sorts from largest to smallest.' },
            { lines: 4, text: '`scores` is unchanged by `sorted`.' },
            { lines: 5, text: '`.sort()` rearranged `scores` itself and returned `None` — which is why `result` prints as `None`.' },
            { lines: 9, text: 'Text sorts by Unicode code point, so every capital letter comes before every lowercase letter: `"Cherry"` lands first.' },
            { lines: 10, text: '`key=` is a function applied to each item to get the value to sort by. `str.lower` sorts case-insensitively.' },
            { lines: 11, text: '`key=len` sorts by length. `banana` and `Cherry` tie at 6, and they stay in their original order — that is *stability*.' },
          ],
        },
        {
          type: 'p',
          text: 'Python’s sort is a [[stable-sort|stable sort]]: items that compare equal keep their original relative order. That lets you build multi-level orderings, like a leaderboard sorted by score and, within equal scores, by earlier entry. When your items are tuples, you can pick the sort key with a tiny inline function called a **lambda** (Unit 6 explains them fully — for now read `lambda e: e[1]` as "given an entry `e`, use its item at index 1"):',
        },
        {
          type: 'code',
          title: 'leaderboard.py',
          runnable: true,
          code: `board = [("Cai", 90), ("Ada", 75), ("Ben", 90), ("Dee", 75)]
print(sorted(board))
print(sorted(board, key=lambda entry: entry[1], reverse=True))`,
          output: `[('Ada', 75), ('Ben', 90), ('Cai', 90), ('Dee', 75)]
[('Cai', 90), ('Ben', 90), ('Ada', 75), ('Dee', 75)]`,
          annotations: [
            { lines: 2, text: 'Tuples compare item by item: first the name, and only if the names tie, the score. So this sorts alphabetically.' },
            { lines: 3, text: 'Sorting by score, highest first. Cai and Ben tie on 90 and keep their original order (Cai before Ben); the 75s also keep theirs — `reverse=True` preserves stability.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Timsort',
          text: 'CPython sorts with **Timsort**, written by Tim Peters in 2002 for Python and later adopted by Java and Android. It spots runs that are already in order and merges them, so it takes O(n log n) in the worst case but close to O(n) on data that is nearly sorted — a common situation in games, where a list of objects barely changes order from one frame to the next.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Careful with what `sort()` returns!',
      code: `nums = [3, 1, 2]
print(nums.sort())
print(nums)`,
      answer: 'None\n[1, 2, 3]',
      hint: '`print(nums.sort())` prints the *return value* of the method, after it has done its sorting.',
      explanation: '`nums.sort()` sorts the list in place and returns `None`, so the first `print` shows `None`. The second `print` shows the list after sorting: `[1, 2, 3]`.',
    },
    {
      kind: 'error',
      prompt: 'The program should print the highest score, but it crashes with `TypeError: \'NoneType\' object is not subscriptable`. Tap the buggy line.',
      lines: ['scores = [30, 10, 20]', 'scores.sort()', 'top = scores.sort(reverse=True)', 'print(top[0])'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 stores the return value of `sort`, which is `None`; line 4 then tries `None[0]`. Sort first, then read from the list itself: `scores.sort(reverse=True)` followed by `scores[0]` — or in one line, `top = sorted(scores, reverse=True)[0]`, or simply `top = max(scores)`.',
    },
    {
      kind: 'concept',
      title: 'Lists as stacks — and the cost of the front',
      blocks: [
        {
          type: 'p',
          text: 'A **stack** is a last-in, first-out pile: you add to the top and take from the top. A list is a natural stack because `append` and `pop()` both work at the *end*, which is the fast end. Undo history, backtracking in a maze, and nested menus are all stacks.',
        },
        {
          type: 'code',
          title: 'undo_stack.py',
          runnable: true,
          code: `history = []
for action in ["move", "jump", "attack"]:
    history.append(action)
print("Actions:", history)

while history:
    undone = history.pop()
    print("Undo", undone)
print("Left:", history)`,
          output: `Actions: ['move', 'jump', 'attack']
Undo attack
Undo jump
Undo move
Left: []`,
          annotations: [
            { lines: 3, text: '"Push" onto the stack with `append`.' },
            { lines: 6, text: 'A non-empty list is truthy, so `while history:` loops until the stack is empty.' },
            { lines: 7, text: '"Pop" takes the most recent action first — last in, first out.' },
          ],
        },
        {
          type: 'p',
          text: 'The opposite shape — a **queue**, first-in first-out, like a line of enemies waiting to spawn — would need `pop(0)`. That works, but removing from the front shifts every remaining item left, so each `pop(0)` costs time proportional to the length. For a real queue, use `collections.deque`, which is fast at both ends (Unit 9).',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Interview favorite',
          text: 'Expect to be asked "what is the time complexity of `list.append`, `list.insert(0, x)` and `x in list`?" The answers — O(1) amortized, O(n), O(n) — follow directly from the fact that a list is an array of pointers. Knowing *why* is what earns the credit.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Given the scores below, store the **three highest scores in descending order** in a list called `top3`. Do not change `scores` itself.',
      starter: `scores = [55, 92, 17, 80, 63, 92, 41]

# top3 = ...
`,
      solution: `scores = [55, 92, 17, 80, 63, 92, 41]

top3 = sorted(scores, reverse=True)[:3]
`,
      tests: `assert top3 == [92, 92, 80], f"top3 is {top3}"
assert scores == [55, 92, 17, 80, 63, 92, 41], "scores must not be modified"`,
      checks: ['`top3` is `[92, 92, 80]`', '`scores` is unchanged'],
      hint: '`sorted(..., reverse=True)` gives a new list, largest first. Then slice off the first three items.',
      explanation: '`sorted(scores, reverse=True)` builds a new list from largest to smallest, leaving `scores` alone, and `[:3]` keeps the first three. Using `scores.sort()` would have rearranged the original list, which the second test forbids.',
    },
    {
      kind: 'code',
      prompt: 'Simulate an undo stack. Starting from the empty `actions` list:\n\n1. Push `"move"`, `"jump"` and `"attack"` in that order.\n2. Undo (pop) twice, appending each undone action to the `undone` list.\n\nAfterwards `actions` should be `["move"]` and `undone` should be `["attack", "jump"]`.',
      starter: `actions = []
undone = []

# push three actions, then undo twice
`,
      solution: `actions = []
undone = []

for name in ["move", "jump", "attack"]:
    actions.append(name)
for _ in range(2):
    undone.append(actions.pop())
`,
      tests: `assert actions == ["move"], f"actions is {actions}"
assert undone == ["attack", "jump"], f"undone is {undone}"`,
      checks: ['`actions` ends as `["move"]`', '`undone` is `["attack", "jump"]`'],
      hint: '`actions.pop()` removes and returns the most recent action — pass it straight to `undone.append(...)`.',
      explanation: 'After the pushes, `actions` is `["move", "jump", "attack"]`. Each `pop()` removes from the end — `"attack"` first, then `"jump"` — and `undone.append(...)` records it, giving `["attack", "jump"]` and leaving `["move"]`.',
    },
    {
      kind: 'code',
      prompt: 'Build a list `unique` that contains each item of `drops` **once**, in the order each item first appears. Use a loop and `in`.',
      starter: `drops = ["gem", "gold", "gem", "ring", "gold", "gem", "key"]
unique = []

# loop over drops and keep only first appearances
`,
      solution: `drops = ["gem", "gold", "gem", "ring", "gold", "gem", "key"]
unique = []

for item in drops:
    if item not in unique:
        unique.append(item)
`,
      tests: `assert unique == ["gem", "gold", "ring", "key"], f"unique is {unique}"
assert drops == ["gem", "gold", "gem", "ring", "gold", "gem", "key"], "do not modify drops"`,
      checks: ['`unique` is `["gem", "gold", "ring", "key"]`', 'First-appearance order is preserved'],
      hint: 'For each `item`, append it to `unique` only if `item not in unique` yet.',
      explanation: 'The `not in` test asks whether the item has been seen already, so each value is appended only the first time it shows up and order is preserved. This is O(n²) because `in` scans the list every time; once you know sets (two lessons from now), you can do it in O(n) — and `list(dict.fromkeys(drops))` does the whole thing in one line.',
    },
  ],
  takeaways: [
    '`append`, `extend`, `insert`, `remove`, `sort`, `reverse` and `clear` change a list in place and return `None`; `pop` returns the removed item. Never write `items = items.append(x)`.',
    '`append` adds one item (even a list); `extend` and `+=` add each item of another collection.',
    'Slices `[start:stop:step]` exclude the stop, never raise `IndexError`, and on lists can be assigned to or deleted. `[:]` is a shallow copy.',
    '`index` and `remove` raise `ValueError` for missing values: check with `in` first. `count`, `min`, `max` and `sum` summarize.',
    '`sorted()` returns a new list, `.sort()` sorts in place; `key=` chooses what to sort by, `reverse=True` flips the order, and the sort is stable.',
    'A list is an excellent stack (`append`/`pop` at the end) but a poor queue — `insert(0, x)` and `pop(0)` are O(n).',
  ],
  reading: [
    { title: 'More on Lists (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/datastructures.html#more-on-lists', source: 'docs', note: 'Every list method with short examples, including using lists as stacks and queues.' },
    { title: 'Sorting Techniques (HOWTO)', url: 'https://docs.python.org/3/howto/sorting.html', source: 'docs', note: 'The definitive guide to `sorted`, `key=`, stability and multi-level sorts.' },
    { title: 'Timsort', url: 'https://en.wikipedia.org/wiki/Timsort', source: 'wikipedia', note: 'How Python’s hybrid sort exploits existing order.' },
  ],
};
