import type { CheatSheet } from '../types';

export const pythonCheatSheets: CheatSheet[] = [
  {
    id: 'py-basics',
    title: 'Python Basics',
    course: 'python',
    icon: '🐍',
    description: 'Printing, variables, numbers, operators and conversions — the essentials on one page.',
    sections: [
      {
        title: 'Running Python',
        items: [
          { label: 'Run a script', code: 'python game.py        # or: py game.py on Windows', lang: 'shell' },
          { label: 'Start the REPL', code: 'python                # exit with: exit', lang: 'shell' },
          { label: 'Which version / which Python?', code: 'python --version\npy list\npython -c "import sys; print(sys.executable)"', lang: 'shell' },
          { label: 'New project environment', code: 'python -m venv .venv\n.venv\\Scripts\\Activate.ps1\npython -m pip install requests', lang: 'shell' },
        ],
      },
      {
        title: 'Output and comments',
        items: [
          { label: 'Print values', code: 'print("HP:", 75)          # HP: 75' },
          { label: 'Separator and ending', code: 'print(1, 2, 3, sep=", ")  # 1, 2, 3\nprint("Loading", end="")  # no newline' },
          { label: 'Comments', code: '# a full-line comment\nx = 5  # an inline comment (two spaces before #)' },
          { label: 'Escapes', code: '"line 1\\nline 2"   "tab\\there"   "C:\\\\path"   r"C:\\raw\\path"' },
        ],
      },
      {
        title: 'Variables and names',
        items: [
          { label: 'Assign / update', code: 'score = 0\nscore += 10     # also -= *= /= //= %= **=' },
          { label: 'Multiple assignment and swap', code: 'x, y = 3, 7\nx, y = y, x' },
          { label: 'Naming (PEP 8)', text: '`snake_case` variables and functions · `CapWords` classes · `UPPER_CASE` constants · never reuse built-in names like `list`, `str`, `max`' },
          { label: 'No value yet', code: 'best_time = None\nif best_time is None: ...' },
        ],
      },
      {
        title: 'Numbers and operators',
        items: [
          { label: 'Arithmetic', code: '7 + 2  # 9      7 - 2  # 5      7 * 2  # 14\n7 / 2  # 3.5    7 // 2 # 3      7 % 2  # 1\n7 ** 2 # 49' },
          { label: 'Floor division and modulo with negatives', code: '-7 // 2  # -4   (rounds down)\n-7 % 2   #  1   (sign of the divisor)\ndivmod(754, 60)  # (12, 34)' },
          { label: 'Precedence (high → low)', text: '`( )` → `**` (right to left) → unary `-` → `* / // %` → `+ -`' },
          { label: 'Useful built-ins', code: 'abs(-3)  round(3.14159, 2)  min(4, 9)  max(4, 9)  sum([1, 2, 3])' },
          { label: 'math module', code: 'import math\nmath.sqrt(16)  math.floor(2.7)  math.ceil(2.1)\nmath.hypot(3, 4)  math.dist((0, 0), (3, 4))  math.pi' },
          { label: 'Comparing floats', code: 'math.isclose(0.1 + 0.2, 0.3)   # True  (== would be False)' },
          { label: 'Readable numbers', code: '1_000_000    1.5e3    2e-3' },
        ],
      },
      {
        title: 'Input and conversion',
        items: [
          { label: 'Read a line (always a str!)', code: 'name = input("Name: ")' },
          { label: 'Read a number', code: 'level = int(input("Level: "))\nprice = float(input("Price: "))' },
          { label: 'Conversions', code: 'int("42")   float("2.5")   str(99)   int(7.9)  # 7 (truncates)' },
          { label: 'Truthiness', text: '`bool(x)` is `False` for `0`, `0.0`, `""`, `None` and empty collections; `True` for everything else (even `"False"`).' },
          { label: 'Bad input', text: '`int("ten")` and `int("3.7")` raise `ValueError`. Check with `text.isdigit()` or use `try`/`except`.' },
        ],
      },
    ],
  },
  {
    id: 'py-strings',
    title: 'Strings and f-strings',
    course: 'python',
    icon: '🔤',
    description: 'Indexing, slicing, the everyday string methods and the f-string format specs.',
    sections: [
      {
        title: 'Indexing and slicing',
        items: [
          { label: 'Index (from 0)', code: 's = "PYTHON"\ns[0]   # \'P\'\ns[-1]  # \'N\'' },
          { label: 'Slice [start:stop:step]', code: 's[1:4]   # \'YTH\'  (stop excluded)\ns[:3]    # \'PYT\'\ns[-2:]   # \'ON\'\ns[::-1]  # \'NOHTYP\'' },
          { label: 'Length, join, repeat', code: 'len(s)   "a" + "b"   "ab" * 3' },
          { label: 'Immutability', text: 'Strings never change. Methods return new strings: write `s = s.upper()` to keep the result.' },
        ],
      },
      {
        title: 'Everyday methods',
        items: [
          { label: 'Clean up', code: '"  Hi  ".strip()   "Ada".lower()   "ada".upper()   "ada lovelace".title()' },
          { label: 'Search', code: '"th" in "python"         # True\n"python".find("th")       # 2  (-1 if missing)\n"img.png".endswith(".png")\n"banana".count("a")       # 3' },
          { label: 'Replace', code: '"a-b-c".replace("-", "_")   # \'a_b_c\'' },
          { label: 'Split and join', code: '"sword shield".split()        # [\'sword\', \'shield\']\n", ".join(["a", "b", "c"])     # \'a, b, c\'' },
        ],
      },
      {
        title: 'f-strings',
        items: [
          { label: 'Insert values', code: 'f"{name} has {hp}/{max_hp} HP"' },
          { label: 'Decimals and percent', code: 'f"{3.14159:.2f}"   # 3.14\nf"{0.625:.1%}"     # 62.5%' },
          { label: 'Thousands, padding', code: 'f"{1234567:,}"     # 1,234,567\nf"{42:05d}"        # 00042' },
          { label: 'Alignment', code: 'f"[{name:<8}]"  f"[{name:>8}]"  f"[{name:^8}]"' },
          { label: 'Debug print', code: 'f"{hp=}"           # hp=75' },
        ],
      },
    ],
  },
  {
    id: 'py-control-flow',
    title: 'Decisions and Loops',
    course: 'python',
    icon: '🔀',
    description: 'Comparisons, if/elif/else, match, while and for loops, loop control and the loop patterns you will reuse forever.',
    sections: [
      {
        title: 'Conditions',
        items: [
          { label: 'Comparisons', code: 'x == y   x != y   x < y   x <= y   x > y   x >= y\n0 < hp <= 100      # chained' },
          { label: 'Logic', code: 'a and b    a or b    not a     # short-circuit, return one of the operands' },
          { label: 'Identity and membership', code: 'x is None      x is not None\n"sword" in items      key in a_dict' },
          { label: 'Falsy values', text: '`False`, `None`, `0`, `0.0`, `""`, `[]`, `()`, `{}`, `set()`. Everything else is truthy — so `if items:` means "not empty".' },
        ],
      },
      {
        title: 'if, elif, else, match',
        items: [
          { label: 'Branching', code: 'if hp <= 0:\n    state = "dead"\nelif hp < 25:\n    state = "critical"\nelse:\n    state = "ok"' },
          { label: 'One-line choice', code: 'label = "alive" if hp > 0 else "dead"' },
          { label: 'match (Python 3.10+)', code: 'match command:\n    case "go" | "run":\n        ...\n    case "quit":\n        ...\n    case _:\n        ...    # default' },
        ],
      },
      {
        title: 'Loops',
        items: [
          { label: 'for over anything iterable', code: 'for item in items:\n    ...\nfor ch in "text":\n    ...' },
          { label: 'range(start, stop, step)', code: 'range(5)         # 0 1 2 3 4\nrange(2, 8)      # 2 3 4 5 6 7\nrange(10, 0, -2) # 10 8 6 4 2' },
          { label: 'Index and item', code: 'for i, item in enumerate(items, start=1):\n    ...' },
          { label: 'while', code: 'while hp > 0:\n    hp -= damage()' },
          { label: 'Control', code: 'break      # leave the loop\ncontinue   # skip to the next iteration\nfor ... else:   # else runs only if the loop was never broken' },
        ],
      },
      {
        title: 'Patterns',
        items: [
          { label: 'Accumulate / count / best so far', code: 'total += x\nif test: count += 1\nif x > best: best = x' },
          { label: 'Shortcuts', code: 'sum(xs)   max(xs)   min(xs)   any(...)   all(...)   "".join(parts)' },
          { label: 'Nested loop over a grid', code: 'for y, row in enumerate(level):\n    for x, tile in enumerate(row):\n        ...' },
          { label: 'All pairs, once each', code: 'for i in range(len(xs)):\n    for j in range(i + 1, len(xs)):\n        ...' },
          { label: 'Cost', text: 'One loop over n items: about n steps. Nested loops over n: about n² steps.' },
        ],
      },
    ],
  },
  {
    id: 'py-collections',
    title: 'Lists, Tuples, Dicts and Sets',
    course: 'python',
    icon: '📦',
    description: 'The four built-in collections: how to create them, change them, loop over them and choose between them.',
    sections: [
      {
        title: 'Which collection?',
        items: [
          { label: 'list  [ ]', text: 'Ordered, changeable, duplicates allowed. The default choice for a sequence that grows.' },
          { label: 'tuple  ( )', text: 'Ordered, **immutable**. A fixed record such as `(x, y)`; hashable, so usable as a dict key.' },
          { label: 'dict  { k: v }', text: 'Maps hashable keys to values; keeps insertion order; fast lookup by key.' },
          { label: 'set  { x }', text: 'Unique hashable items, no order; fast `in`; set algebra. Empty set is `set()`, not `{}`.' },
        ],
      },
      {
        title: 'Lists',
        items: [
          { label: 'Create, read, change', code: 'xs = [10, 20, 30]\nxs[0]   xs[-1]   len(xs)\nxs[1] = 99' },
          { label: 'Add', code: 'xs.append(x)        # one item at the end\nxs.extend(more)     # each item of more (or xs += more)\nxs.insert(i, x)     # before index i' },
          { label: 'Remove', code: 'xs.pop()            # last item (returns it)\nxs.pop(i)           # item at i\nxs.remove(x)        # first equal to x (ValueError if absent)\ndel xs[i]    xs.clear()' },
          { label: 'Search and summarize', code: 'x in xs   xs.index(x)   xs.count(x)\nmin(xs)   max(xs)   sum(xs)' },
          { label: 'Slices', code: 'xs[1:4]   xs[:2]   xs[-3:]   xs[::2]   xs[::-1]\nxs[1:3] = [7, 8, 9]   del xs[-2:]' },
          { label: 'Sort', code: 'sorted(xs, key=len, reverse=True)   # new list\nxs.sort()                           # in place, returns None' },
          { label: 'Copy', code: 'ys = xs.copy()   # or xs[:] or list(xs)  — shallow\nb = a            # NOT a copy: an alias' },
          { label: 'Grid', code: 'grid = [[0] * w for _ in range(h)]    # never [[0] * w] * h' },
        ],
      },
      {
        title: 'Tuples and unpacking',
        items: [
          { label: 'Create', code: 'p = (3, 4)    q = 3, 4    one = (5,)    empty = ()' },
          { label: 'Unpack', code: 'x, y = p\na, b = b, a             # swap\nfirst, *rest = items\n*init, last = items' },
          { label: 'Loop with unpacking', code: 'for name, score in zip(names, scores): ...\nfor i, (name, score) in enumerate(pairs): ...' },
        ],
      },
      {
        title: 'Dictionaries',
        items: [
          { label: 'Create, read, change', code: 'd = {"hp": 100, "mana": 40}\nd["hp"]   d["xp"] = 7   del d["mana"]' },
          { label: 'Safe reads', code: '"hp" in d   d.get("armor")   d.get("armor", 0)' },
          { label: 'Loop', code: 'for k in d: ...\nfor v in d.values(): ...\nfor k, v in d.items(): ...' },
          { label: 'Merge and remove', code: 'd.update(other)   merged = d | other   # 3.9+\nd.pop("hp")   d.pop("armor", None)' },
          { label: 'Count and group', code: 'counts[w] = counts.get(w, 0) + 1\ngroups.setdefault(key, []).append(item)\nfrom collections import Counter, defaultdict' },
        ],
      },
      {
        title: 'Sets',
        items: [
          { label: 'Create and change', code: 's = {"a", "b"}   t = set(items)\ns.add(x)   s.discard(x)   s.remove(x)  # KeyError if absent' },
          { label: 'Algebra', code: 'a | b   # union\na & b   # intersection\na - b   # difference\na ^ b   # in exactly one\na <= b  # subset      a.isdisjoint(b)' },
          { label: 'Dedupe', code: 'set(items)                 # loses order\nlist(dict.fromkeys(items)) # keeps first-seen order' },
        ],
      },
      {
        title: 'Comprehensions',
        items: [
          { label: 'List', code: '[n * n for n in nums]\n[n for n in nums if n > 0]            # filter\n["hi" if n else "lo" for n in nums]     # choose a value' },
          { label: 'Dict and set', code: '{name: len(name) for name in names}\n{w[0] for w in words}' },
          { label: 'Nested', code: '[n for row in grid for n in row]        # flatten\n[[row[c] for row in grid] for c in range(w)]  # transpose' },
          { label: 'Generator expression', code: 'sum(n * n for n in nums)   any(n > 8 for n in nums)   # lazy, no list' },
        ],
      },
    ],
  },
];
