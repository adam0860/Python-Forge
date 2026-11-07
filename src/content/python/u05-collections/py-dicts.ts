import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-dicts',
  title: 'Dictionaries',
  summary: 'Look anything up by name: create, read, update and delete key–value pairs, loop over them, use dictionaries as counters, lookup tables and nested records, and see why lookups are so fast.',
  minutes: 20,
  objectives: [
    'Create dictionaries and read, add, update and delete entries; use `in` and `get` to avoid `KeyError`',
    'Loop over `keys()`, `values()` and `items()`, and use `update`, `pop` and the `|` merge operator',
    'Explain which objects can be keys (hashable ones) and nest dictionaries to model records',
    'Apply the counting, grouping and lookup-table patterns, and recognize `Counter` and `defaultdict`',
    'Describe in plain language how a hash table gives constant-time lookups and why dicts keep insertion order',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Key → value: a dictionary',
      blocks: [
        {
          type: 'p',
          text: 'A list finds things by *position*. A [[dictionary]] finds them by *name*. It stores **key → value** pairs, written with curly braces and colons, and answers "what is the value for this key?" almost instantly, however many entries it holds.',
        },
        {
          type: 'code',
          title: 'first_dict.py',
          runnable: true,
          code: `hero = {"name": "Ada", "hp": 100, "class": "mage"}
print(hero["name"], hero["hp"])
hero["hp"] = 85
hero["mana"] = 40
print(hero)
print("class" in hero, "armor" in hero)
print(len(hero))
print(hero.get("armor"))
print(hero.get("armor", 0))
del hero["class"]
print(hero)`,
          output: `Ada 100
{'name': 'Ada', 'hp': 85, 'class': 'mage', 'mana': 40}
True False
4
None
0
{'name': 'Ada', 'hp': 85, 'mana': 40}`,
          annotations: [
            { lines: 1, text: 'Each entry is `key: value`. Here the keys are strings and the values are a string, an int and a string.' },
            { lines: 2, text: 'Square brackets with a **key** (not a position) read a value.' },
            { lines: 3, text: 'Assigning to an existing key replaces its value.' },
            { lines: 4, text: 'Assigning to a *new* key adds an entry. Unlike lists, a dict grows just by assignment.' },
            { lines: 6, text: '`in` checks the **keys**, not the values.' },
            { lines: 8, text: '`get(key)` returns `None` if the key is missing instead of raising an error.' },
            { lines: 9, text: '`get(key, default)` returns your fallback value. This is the safe way to read something that might not be there.' },
            { lines: 10, text: '`del` removes an entry.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> inv = {"sword": 1}
>>> inv["bow"]
Traceback (most recent call last):
  File "<python-input-2>", line 1, in <module>
    inv["bow"]
    ~~~^^^^^^^
KeyError: 'bow'`,
          annotations: [
            { lines: 7, text: 'Reading a missing key raises `KeyError`, naming the key that wasn’t found. Use `in` or `get` when the key may be absent.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Closer to unordered_map — but ordered',
          text: 'A dict is Python’s `std::unordered_map`, with two big differences: it needs no type parameters (keys and values can be any mix of types), and since Python 3.7 it **remembers insertion order**, which `std::unordered_map` does not. Printing or looping gives the entries in the order you added them.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What happens when this runs?\n\n```\nhero = {"hp": 100}\nprint(hero["mana"])\n```',
      options: [
        { text: 'It prints `None`', why: 'That is what `hero.get("mana")` would do. Square-bracket lookup doesn’t fall back to `None`.' },
        { text: 'It prints `0`', why: 'Python never invents a default value for you. You have to ask for one with `get(key, 0)`.' },
        { text: 'It raises a `KeyError`', correct: true, why: 'Right: `"mana"` is not a key, so `hero["mana"]` raises `KeyError: \'mana\'`.' },
        { text: 'It adds `"mana"` to the dictionary', why: 'Only *assignment* (`hero["mana"] = 0`) adds a key; reading never changes the dictionary.' },
      ],
      explanation: 'Reading with `d[key]` is strict: a missing key raises `KeyError`. That surfaces typos immediately instead of silently producing a wrong value. When absence is normal, use `d.get(key, default)` or test `key in d` first.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `d = {"a": 1}
d["b"] = d.get("b", 10) + 1
d["a"] += 5
print(d, len(d))`,
      answer: "{'a': 6, 'b': 11} 2",
      hint: 'The first update creates `"b"` from the fallback 10; the second changes an existing value in place.',
      explanation: '`d.get("b", 10)` finds no `"b"`, so it returns 10, and `d["b"]` becomes 11. `d["a"] += 5` reads 1, adds 5 and stores 6. Entries keep insertion order (`a` then `b`), and there are 2 of them.',
    },
    {
      kind: 'concept',
      title: 'Looping, updating and merging',
      blocks: [
        {
          type: 'p',
          text: 'Looping directly over a dictionary gives its **keys**. For the values, or for both at once, use the three *view* methods `keys()`, `values()` and `items()` — `items()` yields `(key, value)` tuples, which unpack perfectly (last lesson).',
        },
        {
          type: 'code',
          title: 'dict_loops.py',
          runnable: true,
          code: `stats = {"hp": 85, "mana": 40, "gold": 120}
for key in stats:
    print(key)
print(*stats.values())
for key, value in stats.items():
    print(f"{key:>5} = {value}")
print(list(stats.keys()))
stats.update({"gold": 150, "xp": 7})
print(stats)
print(stats.pop("mana"))
print(stats.pop("armor", "none"))
defaults = {"hp": 100, "mana": 50}
overrides = {"mana": 80}
print(defaults | overrides)`,
          output: `hp
mana
gold
85 40 120
   hp = 85
 mana = 40
 gold = 120
['hp', 'mana', 'gold']
{'hp': 85, 'mana': 40, 'gold': 150, 'xp': 7}
40
none
{'hp': 100, 'mana': 80}`,
          annotations: [
            { lines: 2, text: 'Plain iteration yields keys, in insertion order.' },
            { lines: 4, text: '`values()` gives just the values. `print(*...)` spreads them out as separate arguments.' },
            { lines: 5, text: '`items()` gives `(key, value)` pairs, unpacked straight into two loop variables — the standard way to walk a dict.' },
            { lines: 8, text: '`update` merges another dict in: existing keys are overwritten (`gold`), new keys are added (`xp`).' },
            { lines: 10, text: '`pop(key)` removes the entry and returns its value.' },
            { lines: 11, text: '`pop(key, default)` returns the default instead of raising `KeyError` when the key is missing.' },
            { lines: 14, text: 'The `|` operator (Python 3.9+) builds a **new** merged dict; on a conflict, the right-hand side wins. That is the idiom for "defaults, overridden by user settings".' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t resize a dict while looping over it',
          text: 'Adding or deleting keys during a `for` loop raises `RuntimeError: dictionary changed size during iteration` — a loud version of the list-skipping bug from the Lists lesson. Loop over a copy (`list(stats)`) or build a new dict.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Ordered by design, since 3.7',
          text: 'Python 3.6’s CPython happened to preserve insertion order as a side-effect of a new, more compact dict layout by Raymond Hettinger. The language made it an official guarantee in 3.7 because so much code had come to rely on it. Older tutorials that say "dictionaries are unordered" are describing Python 3.5 and earlier.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the loop so it prints each item and its count, such as `potion 3`.',
      template: `inventory = {"potion": 3, "arrow": 20}
for ___, ___ in inventory.___():
    print(item, count)`,
      templateIsCode: true,
      blanks: [{ answers: ['item'] }, { answers: ['count'] }, { answers: ['items'] }],
      wordBank: ['item', 'count', 'items', 'keys', 'values', 'key'],
      explanation: '`inventory.items()` yields `(key, value)` pairs, which unpack into two loop variables. The `print` line uses the names `item` and `count`, so those are the names to bind. `keys()` or `values()` would give only one thing per iteration, and unpacking two names from it would fail.',
    },
    {
      kind: 'truefalse',
      prompt: 'Writing `for x in scores:` where `scores` is a dictionary loops over its values.',
      answer: false,
      explanation: 'False. Iterating over a dictionary yields its **keys**. Use `scores.values()` for the values or `scores.items()` for `(key, value)` pairs.',
    },
    {
      kind: 'concept',
      title: 'What can be a key? Nesting and records',
      blocks: [
        {
          type: 'p',
          text: 'Values can be anything — numbers, lists, even other dictionaries. Keys are pickier: they must be [[hashable]], which in practice means **immutable**: strings, numbers, booleans and tuples (of hashable things). Lists, dicts and sets can’t be keys, because they could change after being stored and the dictionary would never find them again.',
        },
        {
          type: 'code',
          title: 'nested.py',
          runnable: true,
          code: `level = {
    "name": "Crypt",
    "enemies": {"skeleton": 5, "ghost": 2},
    "spawn": (4, 7),
}
print(level["enemies"]["ghost"])
level["enemies"]["ghost"] += 1
print(level["enemies"])

tiles = {(0, 0): "wall", (1, 0): "floor"}
print(tiles[(1, 0)], tiles.get((9, 9), "void"))`,
          output: `2
{'skeleton': 5, 'ghost': 3}
floor void`,
          annotations: [
            { lines: 3, text: 'A dict as a value: a *nested* dictionary, a record inside a record.' },
            { lines: 6, text: 'Chain the lookups — `level["enemies"]` is the inner dict, and `["ghost"]` reads from it.' },
            { lines: 10, text: 'A tuple as a key: a sparse map from `(x, y)` coordinates to tile types. Only the tiles you set take memory, unlike a full 2D list.' },
            { lines: 11, text: 'Missing coordinates fall back to `"void"` through `get`.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> {[1, 2]: "wall"}
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    {[1, 2]: "wall"}
TypeError: cannot use 'list' as a dict key (unhashable type: 'list')`,
          annotations: [
            { lines: 5, text: '"Unhashable" is Python’s word for "mutable, so unsafe as a key". Convert to a tuple — `{(1, 2): "wall"}` — and it works.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'JSON is a dictionary',
          text: 'Nested dicts and lists are exactly the shape of JSON, the format that stores game saves, config files and web API responses. `json.load` hands you plain dicts and lists, and `json.dump` writes them back — you’ll use that in the files lesson.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these can be used as a dictionary key?',
      options: [
        { text: '`[1, 2]`', why: 'A list is mutable and therefore unhashable: `TypeError`.' },
        { text: '`{"a": 1}`', why: 'A dict is mutable and unhashable.' },
        { text: '`(1, 2)`', correct: true, why: 'A tuple of immutable items is hashable, so it works — ideal for coordinates.' },
        { text: '`{1, 2}`', why: 'A set is mutable and unhashable (the immutable `frozenset` can be a key).' },
      ],
      explanation: 'Keys need a hash value that never changes, so only immutable objects qualify. A tuple of numbers is fine; a tuple that *contains a list* is not, because hashing it would hash the list.',
    },
    {
      kind: 'error',
      prompt: 'This counts how many times each letter appears but crashes with `KeyError: \'a\'`. Tap the line that fails.',
      lines: ['counts = {}', 'for letter in ["a", "b", "a"]:', '    counts[letter] += 1', 'print(counts)'],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`counts[letter] += 1` first *reads* `counts[letter]`, which doesn’t exist the first time a letter appears, so it raises `KeyError`. Supply a default: `counts[letter] = counts.get(letter, 0) + 1`. (Or use `collections.Counter`, shown next.)',
    },
    {
      kind: 'concept',
      title: 'Three patterns: counting, grouping and lookup tables',
      blocks: [
        {
          type: 'p',
          text: 'A huge share of real-world dictionary use is one of three patterns. Counting uses `get` with a default; grouping uses `setdefault`, which returns the existing value for a key or inserts and returns a default; and a lookup table replaces a long `if`/`elif` chain.',
        },
        {
          type: 'code',
          title: 'patterns.py',
          runnable: true,
          code: `text = "the cat and the hat and the bat"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
print(counts)
ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)
print(ranked[:2])

words = ["apple", "avocado", "banana", "blueberry", "cherry"]
by_letter = {}
for w in words:
    by_letter.setdefault(w[0], []).append(w)
print(by_letter)

damage = {"sword": 12, "bow": 8, "staff": 15}
print(damage.get("bow", 1), damage.get("club", 1))`,
          output: `{'the': 3, 'cat': 1, 'and': 2, 'hat': 1, 'bat': 1}
[('the', 3), ('and', 2)]
{'a': ['apple', 'avocado'], 'b': ['banana', 'blueberry'], 'c': ['cherry']}
8 1`,
          annotations: [
            { lines: 4, text: '**Counting**: read the current count (0 if unseen), add one, store it back.' },
            { lines: 6, text: '`counts.items()` gives `(word, count)` pairs; sorting by the count (`kv[1]`), largest first, ranks the words. Ties keep insertion order because the sort is stable.' },
            { lines: 12, text: '**Grouping**: `setdefault(letter, [])` makes sure the key has a list, then we append to it — one line instead of an `if key in d` check.' },
            { lines: 16, text: '**Lookup table**: one dict replaces `if weapon == "sword": … elif weapon == "bow": …`, and `get` supplies the default for unknown items.' },
          ],
        },
        {
          type: 'p',
          text: 'Counting and grouping are so common that the standard library packages them as ready-made tools:',
        },
        {
          type: 'code',
          title: 'collections_tools.py',
          runnable: true,
          code: `from collections import Counter, defaultdict

print(Counter("mississippi").most_common(2))

groups = defaultdict(list)
for w in ["apple", "avocado", "banana"]:
    groups[w[0]].append(w)
print(dict(groups))`,
          output: `[('i', 4), ('s', 4)]
{'a': ['apple', 'avocado'], 'b': ['banana']}`,
          annotations: [
            { lines: 3, text: '`Counter` counts any iterable for you. `most_common(2)` returns the top two as `(item, count)` pairs; `i` and `s` tie at 4, and ties keep first-seen order.' },
            { lines: 5, text: '`defaultdict(list)` creates a fresh empty list the first time a missing key is *read*, so `groups[w[0]].append(w)` just works.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Learn the manual way first, then use the tools',
          text: 'Write the `get`/`setdefault` versions until they are second nature — they teach you what `Counter` and `defaultdict` do. In production code, prefer the tools: they are shorter, faster and signal intent. You’ll meet the `collections` module properly in Unit 9.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nd = {"a": 1, "b": 2, "c": 3}\nd["a"] = d["b"] + d["c"]\ndel d["b"]\nprint(sum(d.values()) + len(d))\n```',
      answer: '10',
      hint: 'After the assignment `a` is 5. Then `b` disappears, leaving `a` and `c`.',
      explanation: '`d["a"]` becomes 2 + 3 = 5. After `del d["b"]` the dictionary is `{"a": 5, "c": 3}`: its values sum to 8, and it has 2 entries. Total: $8 + 2 = 10$.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'Under the hood: why lookups are fast',
      blocks: [
        {
          type: 'p',
          text: 'To find `"ghost"` in a list of a million names Python must compare item after item — up to a million comparisons. A dictionary finds it in about **one** step. The trick is a **hash table**: Python runs the key through a *hash function* that turns it into a number, and uses that number to jump straight to the slot where the entry lives. Equal keys always produce the same hash, so the same slot is found every time.',
        },
        {
          type: 'code',
          title: 'speed.py',
          runnable: true,
          outputVaries: true,
          code: `import time

n = 5000
as_list = list(range(n))
as_dict = dict.fromkeys(as_list)

t0 = time.perf_counter()
for _ in range(1000):
    (n - 1) in as_list
t_list = time.perf_counter() - t0

t0 = time.perf_counter()
for _ in range(1000):
    (n - 1) in as_dict
t_dict = time.perf_counter() - t0

print(f"list: {t_list * 1000:.1f} ms, dict: {t_dict * 1000:.2f} ms")`,
          output: 'list: 62.3 ms, dict: 0.14 ms',
          annotations: [
            { lines: 5, text: '`dict.fromkeys(items)` builds a dict with those keys (values are `None`).' },
            { lines: '8-10', text: 'The worst case for a list: the item we look for is at the very end, so every one of the 5,000 comparisons happens.' },
            { lines: '13-15', text: 'The dict goes straight to the slot, whether it holds 5,000 keys or 5 million.' },
          ],
        },
        {
          type: 'p',
          text: 'The timings differ on every machine — that’s why the output above is a sample — but the gap, which grows with the size of the collection, is always dramatic. Lookup, insert and delete in a dict are **O(1) on average**; the same operations in a list are O(n).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Dictionaries power Python itself',
          text: 'When you write `player.hp`, Python looks `"hp"` up in a dictionary stored on the object. Each module’s global variables live in a dict you can see with `globals()`. Keyword arguments (`f(x=1)`) arrive as a dict. Understanding dictionaries is understanding how Python works internally, which is why they are so heavily optimized.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why must keys be hashable?',
          text: 'The slot an entry sits in depends on its key’s hash. If a key could change after being stored, its hash would change too, and the dictionary would look in the wrong place and never find the entry again. Requiring immutability makes that impossible.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Build a dictionary `counts` that maps each item in `loot` to how many times it appears. For this data it should be `{"gem": 3, "gold": 2, "ring": 1}`. Use a loop and `get` (not `Counter`).',
      starter: `loot = ["gem", "gold", "gem", "ring", "gold", "gem"]
counts = {}

# count each item
`,
      solution: `loot = ["gem", "gold", "gem", "ring", "gold", "gem"]
counts = {}

for item in loot:
    counts[item] = counts.get(item, 0) + 1
`,
      tests: `assert counts == {"gem": 3, "gold": 2, "ring": 1}, f"counts is {counts}"`,
      checks: ['`counts` is `{"gem": 3, "gold": 2, "ring": 1}`'],
      hint: 'Inside the loop: `counts[item] = counts.get(item, 0) + 1`.',
      explanation: 'The first time `item` is seen, `counts.get(item, 0)` returns 0 and the entry is created with 1. Later sightings read the current count and add one. This `get`-with-default idiom is the manual form of what `collections.Counter` does for you.',
    },
    {
      kind: 'code',
      prompt: 'A shop has a `prices` dictionary. Compute `total`, the cost of everything in `cart`. Items that aren’t in `prices` (like `"scroll"`) cost 0. Expected: `130`.',
      starter: `prices = {"sword": 100, "shield": 80, "potion": 15}
cart = ["potion", "sword", "scroll", "potion"]
total = 0

# add up the price of each cart item
`,
      solution: `prices = {"sword": 100, "shield": 80, "potion": 15}
cart = ["potion", "sword", "scroll", "potion"]
total = 0

for item in cart:
    total += prices.get(item, 0)
`,
      tests: `assert total == 130, f"total is {total}"`,
      checks: ['`total` is 130', 'The unknown `"scroll"` does not crash the program'],
      hint: '`prices.get(item, 0)` returns the price, or 0 when the item is unknown.',
      explanation: 'Looping over the cart and adding `prices.get(item, 0)` gives 15 + 100 + 0 + 15 = 130. Plain `prices[item]` would raise `KeyError` on `"scroll"`; `get` with a default of 0 handles it gracefully.',
    },
    {
      kind: 'code',
      prompt: 'Group the words by their **length**: build `by_len` mapping each length to the list of words of that length, in original order. For this data: `{2: ["ox"], 3: ["cat", "bee", "emu"], 5: ["horse"], 4: ["bear"]}`.',
      starter: `words = ["ox", "cat", "bee", "horse", "emu", "bear"]
by_len = {}

# group the words by len(word)
`,
      solution: `words = ["ox", "cat", "bee", "horse", "emu", "bear"]
by_len = {}

for word in words:
    by_len.setdefault(len(word), []).append(word)
`,
      tests: `assert by_len == {2: ["ox"], 3: ["cat", "bee", "emu"], 5: ["horse"], 4: ["bear"]}, f"by_len is {by_len}"`,
      checks: ['Keys are the word lengths', 'Each value is a list in original order'],
      hint: 'The key is `len(word)`; use `setdefault(len(word), [])` and append the word to the list it returns.',
      explanation: '`by_len.setdefault(len(word), [])` returns the list for that length, creating an empty one the first time, and `.append(word)` adds to it. Numbers are valid keys, and the lists keep the words in the order they were seen. A `defaultdict(list)` would make it `by_len[len(word)].append(word)`.',
    },
  ],
  takeaways: [
    'A dict maps hashable keys to values: `d[key]` reads (raising `KeyError` if missing), `d[key] = v` adds or replaces, `del d[key]` removes, `key in d` tests keys, and `d.get(key, default)` reads safely.',
    'Iterating a dict gives keys; `values()` and `items()` give values and `(key, value)` pairs. Entries keep insertion order (guaranteed since Python 3.7).',
    '`update` and the `|` operator (3.9+) merge dicts; `pop(key, default)` removes and returns.',
    'Keys must be hashable — in practice immutable: strings, numbers, tuples. Values can be anything, including nested dicts and lists.',
    'Patterns: count with `get(k, 0) + 1`, group with `setdefault(k, [])`, replace `if`/`elif` chains with a lookup table; `Counter` and `defaultdict` package the first two.',
    'Dict lookups are O(1) on average thanks to hashing, versus O(n) for scanning a list.',
  ],
  reading: [
    { title: 'Dictionaries (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/datastructures.html#dictionaries', source: 'docs', note: 'The official introduction, with `dict()` construction and looping techniques.' },
    { title: 'Mapping Types — dict', url: 'https://docs.python.org/3/library/stdtypes.html#mapping-types-dict', source: 'docs', note: 'Every dict method and operator, including `|` and `|=`.' },
    { title: 'collections: Counter and defaultdict', url: 'https://docs.python.org/3/library/collections.html', source: 'docs', note: 'The ready-made counting and grouping tools.' },
    { title: 'Hash table', url: 'https://en.wikipedia.org/wiki/Hash_table', source: 'wikipedia', note: 'The data structure that makes dictionary lookups fast.' },
  ],
};
