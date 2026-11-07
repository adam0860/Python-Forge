import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-object-model',
  title: 'Everything Is an Object: Identity, Mutability and Copying',
  summary: 'What variables really are in Python: names bound to objects. Identity vs equality, mutable vs immutable objects, how arguments and `+=` behave, shallow vs deep copies, and the classic aliasing bugs.',
  minutes: 20,
  objectives: [
    'Describe a Python variable as a name bound to an object, and use `is`, `==` and `id()` correctly',
    'Predict what happens when a function mutates or rebinds a parameter',
    'Explain why `+=` mutates a list in place but rebinds a tuple or string',
    'Choose between assignment, shallow copy and `copy.deepcopy` and avoid aliasing bugs such as `[[0] * 3] * 3`',
    'Know the pitfalls of `is` (values, `nan`, custom `__eq__`) and the one place it belongs: `is None`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Names, objects and identity',
      blocks: [
        {
          type: 'p',
          text: 'In C++ a variable is a **box**: `int x = 5;` reserves memory named `x` and puts 5 in it; `y = x` copies the contents. Python works differently. Every value is an **[[object]]** living somewhere in memory, and a variable is just a **name bound to** an object — a label on it ([[name-binding|name binding]]). `b = a` does not copy anything: it attaches a second label to the same object. Each object has three things: an **[[identity]]** (who it is, never changes), a **type** (what it is, fixed) and a **value** (its contents, which may change if the type is mutable).',
        },
        {
          type: 'code',
          title: 'identity.py',
          runnable: true,
          code: `a = [1, 2]
b = a
c = [1, 2]
print(a is b, a == c, a is c)
b.append(3)
print(a, c)
print(id(a) == id(b), type(a).__name__)`,
          output: `True True False
[1, 2, 3] [1, 2]
True list`,
          annotations: [
            { lines: 1, text: 'A new list object is created, and the name `a` is bound to it.' },
            { lines: 2, text: '`b = a` creates **no new object**. `b` is a second name for the same list — an [[alias]].' },
            { lines: 3, text: 'A *different* list that happens to have the same contents.' },
            { lines: 4, text: '`is` compares identity (are these the same object?); `==` compares value. `a is b` is True, `a == c` is True (same contents), `a is c` is False (two objects).' },
            { lines: '5-6', text: 'Appending through `b` changes the one shared list, so `a` shows it too; `c` is untouched.' },
            { lines: 7, text: '`id()` returns the identity number. Equal ids mean the same object. Every object also knows its `type`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why Python works this way',
          text: 'Names-and-objects makes the language uniform: integers, functions, classes, modules and lists are all objects, passed around cheaply by reference, and assignment is the same cheap operation for all of them. It also explains many "surprises" at once — mutation visible through two names, parameters that change the caller’s data, copies that are not copies. Once you think in labels on objects, they stop being surprising.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'Every Python name behaves like a C++ **pointer or reference** to a heap object, without the syntax: `b = a` copies the *reference* (like `T* b = a;`), never the object. There is no value semantics for class instances, no copy constructor invoked by assignment, and no "object slicing". To duplicate an object you must ask explicitly (`copy`, `list(x)`, `x.copy()`).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What id() is',
          text: 'In CPython `id(obj)` is the object’s memory address, and `is` compares those addresses. The language only promises that the id is unique **among objects alive at the same time** — after an object is freed, a new one may reuse its id. Other implementations (PyPy, MicroPython) number objects differently.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After `a = [1, 2, 3]` and `b = a`, which statement is true?',
      options: [
        { text: '`a` and `b` are two names for the same list object', correct: true, why: 'Assignment binds another name to the existing object; nothing is copied.' },
        { text: '`b` is a new list containing a copy of the elements of `a`', why: 'That is what `list(a)` or `a.copy()` would give you. Plain assignment never copies.' },
        { text: '`b` holds the number that identifies `a`, not the list itself', why: '`id(a)` gives the identity number, but `b` is bound to the list object itself and behaves exactly like `a`.' },
        { text: 'Python copies the list lazily, only when one of them is changed', why: 'Python has no copy-on-write for lists. Both names stay attached to the same list, so changes through either name are visible through the other.' },
      ],
      explanation: '`b = a` binds the name `b` to the same object that `a` refers to. Mutating the list through either name changes the single shared object. To get an independent list you must copy it.',
    },
    {
      kind: 'concept',
      title: 'Mutability, arguments and +=',
      blocks: [
        {
          type: 'p',
          text: 'Objects of **[[mutable]]** types (lists, dicts, sets, most class instances) can change their contents in place; **[[immutable]]** ones (ints, floats, strings, tuples, frozensets, `None`) never can — "changing" them means creating a new object and rebinding the name. This decides what function arguments do. Python passes **references to objects** ("pass by assignment"): a parameter is a new local name bound to the caller’s object. *Mutating* the object is visible to the caller; *rebinding* the parameter name only changes the local name.',
        },
        {
          type: 'code',
          title: 'arguments_and_mutability.py',
          runnable: true,
          code: `def grow(items):
    items.append(1)

def rebind(items):
    items = [99]

data = []
grow(data)
rebind(data)
print(data)

t = (1, [2])
t[1].append(3)
print(t)
try:
    t[0] = 5
except TypeError:
    print("tuple is immutable")`,
          output: `[1]
(1, [2, 3])
tuple is immutable`,
          annotations: [
            { lines: '1-2', text: '`items` is bound to the caller’s list. `append` mutates *that* object, so the caller sees the change.' },
            { lines: '4-5', text: '`items = [99]` rebinds the **local name** to a brand-new list. The caller’s list is untouched; the new list is thrown away at return.' },
            { lines: '7-10', text: '`data` only contains what `grow` added: `[1]`. `rebind` had no effect on it.' },
            { lines: '12-14', text: 'A tuple is immutable, but it holds *references*. The list inside is still mutable, so the tuple’s "value" appears to change: `(1, [2, 3])`.' },
            { lines: '15-18', text: 'What a tuple forbids is **rebinding its slots**: assigning to `t[0]` raises `TypeError`.' },
          ],
        },
        {
          type: 'p',
          text: 'The augmented assignment `+=` shows the difference clearly. For a **list**, `x += y` calls the in-place method `__iadd__`: it extends the *same object*, so every alias sees it. Tuples and strings have no in-place version, so `x += y` falls back to `x = x + y`, which builds a **new** object and rebinds `x`; other aliases keep the old value.',
        },
        {
          type: 'code',
          title: 'augmented_assignment.py',
          runnable: true,
          code: `l1 = [1]
l2 = l1
l1 += [2]
print(l2)

t1 = (1,)
t2 = t1
t1 += (2,)
print(t2, t1)

s1 = "a"
s2 = s1
s1 += "b"
print(s2, s1)

l3 = [1]
l4 = l3
l3 = l3 + [2]
print(l4, l3)`,
          output: `[1, 2]
(1,) (1, 2)
a ab
[1] [1, 2]`,
          annotations: [
            { lines: 3, text: 'List `+=` mutates in place. `l1` and `l2` are the same list, so `l2` shows `[1, 2]`.' },
            { lines: 8, text: 'Tuples can’t be changed, so `+=` builds a new tuple and rebinds `t1`. `t2` still holds the old one.' },
            { lines: 13, text: 'Strings behave like tuples: a new string, and the old one is untouched.' },
            { lines: 18, text: 'Plain `l3 + [2]` always creates a **new** list, then rebinds `l3`. `l4` keeps the old list. Same operator character, very different effect from `+=`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Mutable default arguments',
          text: 'Default values are evaluated **once**, when the `def` runs, and stored on the function. `def f(x=[]): x.append(1); return x` returns the *same list* on every call: `f()` then `f()` gives `[1, 1]` for both results. Use `None` as the default and create the list inside: `if x is None: x = []`.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Mutate or return — not both',
          text: 'Python’s own convention: methods that mutate in place (`list.sort`, `append`, `reverse`) return `None`; functions that build new values (`sorted`, `+`, slicing) return them. Follow it in your own code so callers can tell from the signature whether their data will change.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a function executes `items = [99]` on its parameter `items`, the list that the caller passed in is replaced by `[99]`.',
      answer: false,
      explanation: 'False. That statement *rebinds* the local name `items` to a new list; the caller’s object and the caller’s name are untouched. To change the caller’s list you must mutate it: `items[:] = [99]` or `items.append(...)`.',
    },
    {
      kind: 'concept',
      title: 'Shallow and deep copies',
      blocks: [
        {
          type: 'p',
          text: 'To get an independent object you copy it explicitly. A **shallow copy** (`copy.copy(x)`, `list(x)`, `x[:]`, `x.copy()`) creates a new *outer* container but fills it with the **same inner objects**. A **[[deep-copy|deep copy]]** (`copy.deepcopy(x)`) recursively duplicates everything, so nothing mutable is shared. Shallow copies are fine for flat structures of immutables; with nested mutable data they leave hidden aliases.',
        },
        {
          type: 'code',
          title: 'copying.py',
          runnable: true,
          code: `import copy

nested = [[1, 2], [3]]
shallow = copy.copy(nested)
deep = copy.deepcopy(nested)
nested[0].append(9)
print(shallow, deep)
print(shallow[0] is nested[0], deep[0] is nested[0], shallow is nested)`,
          output: `[[1, 2, 9], [3]] [[1, 2], [3]]
True False False`,
          annotations: [
            { lines: 4, text: '`copy.copy` makes a new outer list but reuses the *same inner lists* — it copies references, one level deep.' },
            { lines: 5, text: '`copy.deepcopy` copies the outer list **and** every inner list (it even handles self-referencing structures).' },
            { lines: 6, text: 'Mutating an inner list of the original...' },
            { lines: 7, text: '...shows through the shallow copy, but not the deep copy.' },
            { lines: 8, text: 'The identity checks confirm it: the shallow copy shares its first row with the original (`True`), the deep copy does not (`False`), and both outer lists are new objects (`False`).' },
          ],
        },
        {
          type: 'p',
          text: 'The most famous aliasing bug comes from **sequence repetition**. `[row] * n` repeats the *reference* `n` times; it does not copy the row. Building a grid this way gives you `n` names for one row. A comprehension evaluates the inner expression afresh for every row.',
        },
        {
          type: 'code',
          title: 'grid_pitfall.py',
          runnable: true,
          code: `bad = [[0] * 3] * 2
bad[0][0] = 1
print(bad, bad[0] is bad[1])

good = [[0] * 3 for _ in range(2)]
good[0][0] = 1
print(good)`,
          output: `[[1, 0, 0], [1, 0, 0]] True
[[1, 0, 0], [0, 0, 0]]`,
          annotations: [
            { lines: 1, text: '`[0] * 3` is fine (integers are immutable), but the outer `* 2` repeats the **same inner list** twice.' },
            { lines: 2, text: 'Setting one cell of the first row...' },
            { lines: 3, text: '...appears in both rows because they are the same object — `bad[0] is bad[1]` confirms it.' },
            { lines: 5, text: 'A comprehension runs `[0] * 3` once per row, creating two separate lists. This is the correct way to build a grid (the same applies to lists of dicts, sets or any other mutable objects).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Which copy do I need?',
          text: 'Flat list of numbers/strings → `list(x)` or `x.copy()` is enough. Nested containers you will modify → `copy.deepcopy`. Big NumPy arrays or tensors → use their own `copy()`/`clone()` (a deep copy of a big array is slow, and NumPy and PyTorch let slices share memory deliberately — you will see this in the AI/ML course).',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Aliasing in game code',
          text: 'A classic bug: spawning enemies from a template dict (`enemy = TEMPLATE`) and modifying `enemy["hp"]` changes the template for everybody. Likewise a default inventory list shared by every new player. Copy the template (`dict(TEMPLATE)` for flat data, `deepcopy` for nested), or build the object freshly from a function or a dataclass with `field(default_factory=list)`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that it prints `True False`: the shallow copy shares its first row with the original, the deep copy does not.',
      template: `import copy
a = [[1], [2]]
shallow = copy.___(a)
deep = copy.___(a)
print(shallow[0] is a[0], deep[0] is a[0])`,
      templateIsCode: true,
      blanks: [{ answers: ['copy'] }, { answers: ['deepcopy'] }],
      wordBank: ['copy', 'deepcopy', 'clone', 'duplicate'],
      explanation: '`copy.copy` is shallow: the new outer list holds the same inner lists, so `shallow[0] is a[0]` is `True`. `copy.deepcopy` duplicates the inner lists as well, so `deep[0] is a[0]` is `False`.',
    },
    {
      kind: 'concept',
      title: 'is vs ==, and the pitfalls of identity',
      blocks: [
        {
          type: 'p',
          text: '`==` asks "do these have equal **values**?" and calls the type’s `__eq__`; `is` asks "are these the **same object**?" and cannot be overridden. They answer different questions, and mixing them up is a classic bug. Use `==` for values. The one idiomatic use of `is` is comparing with a **singleton** — `None` (also `True` and `False`, though you usually just write `if flag:`): `if x is None`.',
        },
        {
          type: 'code',
          title: 'is_vs_equals.py',
          runnable: true,
          code: `nan = float("nan")
print(nan == nan, nan is nan, [nan] == [nan])

class P:
    def __init__(self, x):
        self.x = x

    def __eq__(self, other):
        return isinstance(other, P) and self.x == other.x

p, q = P(1), P(1)
print(p == q, p is q, p != q)
print(None is None, 0 == False, type(None).__name__)`,
          output: `False True True
True False False
True True NoneType`,
          annotations: [
            { lines: 1, text: '`nan` ("not a number") is a float that is, by IEEE 754 definition, not equal to anything — not even itself.' },
            { lines: 2, text: '`nan == nan` is False, but `nan is nan` is True (same object). Containers compare elements with `is` first, then `==`, so `[nan] == [nan]` is True. The two operators can disagree!' },
            { lines: '4-9', text: 'A class that defines `__eq__`: two points are equal when their `x` values match.' },
            { lines: 12, text: '`p == q` is True because `__eq__` says so, but `p is q` is False — two separate objects. `!=` is derived from `__eq__`.' },
            { lines: 13, text: '`None` is a singleton, so `is None` is reliable. `0 == False` is True because `bool` is a subclass of `int` — one reason not to use `==` with booleans.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never use is to compare numbers or strings',
          text: 'CPython caches small integers (-5 to 256) and *interns* many strings, so `a is b` can be True for equal values — sometimes. Whether it happens depends on the implementation, on how the value was created and on the Python version. `x is 1000` may be True in one file and False in another. Python 3.8+ even warns about `is` with a literal. Use `==` for values and keep `is` for `None`.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does this print?" with two aliases and a mutation (both change); "Why does `[[0]*3]*3` misbehave?" (one row, three references); "Difference between `copy.copy` and `copy.deepcopy`?"; "Does `+=` mutate?" (lists yes, tuples/strings no); "Why does a default argument `[]` keep its contents between calls?" (evaluated once at definition).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Think about which objects are shared.',
      code: `import copy

a = [[1, 2], [3]]
b = copy.copy(a)
c = copy.deepcopy(a)
a[0].append(9)
a.append([4])
print(b, c)`,
      answer: '[[1, 2, 9], [3]] [[1, 2], [3]]',
      hint: '`b` has its own outer list but shares the inner lists with `a`; `c` shares nothing.',
      explanation: '`a.append([4])` only affects the outer list of `a`, which neither copy shares. But `a[0].append(9)` changes an inner list: `b` shares it (so `b` shows the 9) while `c` has its own inner lists (so `c` is unchanged).',
    },
    {
      kind: 'error',
      prompt: 'This should build a 2x3 grid and change one cell, printing `[[1, 0, 0], [0, 0, 0]]`, but it prints `[[1, 0, 0], [1, 0, 0]]`. Tap the faulty line.',
      lines: [
        'rows = 2',
        'grid = [[0] * 3] * rows',
        'grid[0][0] = 1',
        'print(grid)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The outer `* rows` repeats a *reference* to a single inner list, so every row is the same object. Build the rows separately: `grid = [[0] * 3 for _ in range(rows)]`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`a = [1, 2]`\n`b = a`\n`b += [3]`\n`c = a`\n`c = c + [4]`\n`print(len(a))`',
      answer: '3',
      hint: '`b += [3]` mutates the shared list; `c = c + [4]` creates a new list and rebinds `c`.',
      explanation: '`b += [3]` extends the list in place; `a` and `b` are the same object, so `a` is `[1, 2, 3]`. Then `c + [4]` builds a *new* list and rebinds `c`, leaving `a` alone. `len(a)` is 3.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `make_grid(rows, cols, fill=0)` that returns a list of `rows` lists, each containing `cols` copies of `fill`. Every row must be a **separate list** so that changing one cell never affects other rows.',
      starter: `def make_grid(rows, cols, fill=0):
    ...
`,
      solution: `def make_grid(rows, cols, fill=0):
    return [[fill] * cols for _ in range(rows)]
`,
      tests: `g = make_grid(2, 3)
assert g == [[0, 0, 0], [0, 0, 0]]
g[0][0] = 1
assert g == [[1, 0, 0], [0, 0, 0]]
assert g[0] is not g[1]

h = make_grid(3, 2, fill=".")
assert h == [[".", "."], [".", "."], [".", "."]]
h[2][1] = "#"
assert h[0] == [".", "."] and h[1] == [".", "."] and h[2] == [".", "#"]

assert make_grid(0, 5) == []
assert make_grid(2, 0) == [[], []]
assert make_grid(2, 0)[0] is not make_grid(2, 0)[1]`,
      checks: ['Returns `rows` lists of length `cols` filled with `fill`', 'Rows are distinct objects (no aliasing)', 'Handles zero rows or columns'],
      hint: 'Use a list comprehension that builds a new inner list on every iteration: `[[fill] * cols for _ in range(rows)]`.',
      explanation: 'The inner `[fill] * cols` is safe for immutable fills such as numbers and strings; the comprehension executes it once per row, so each row is its own list. Writing `[[fill] * cols] * rows` would repeat one row `rows` times.',
    },
    {
      kind: 'code',
      prompt: 'Write `shared_rows(a, b)` that returns the list of indices `i` (in increasing order) for which `a[i]` and `b[i]` are **the very same object** (not merely equal). Compare only up to the length of the shorter list.',
      starter: `def shared_rows(a, b):
    ...
`,
      solution: `def shared_rows(a, b):
    return [i for i, (x, y) in enumerate(zip(a, b)) if x is y]
`,
      tests: `import copy

a = [[1], [2], [3]]
assert shared_rows(a, copy.copy(a)) == [0, 1, 2]
assert shared_rows(a, copy.deepcopy(a)) == []
assert shared_rows(a, a) == [0, 1, 2]

b = [a[0], [2], a[2]]
assert b == a
assert shared_rows(a, b) == [0, 2]

assert shared_rows(a, [a[1]]) == []
assert shared_rows([], []) == []
assert shared_rows(a, a[:2]) == [0, 1]`,
      checks: ['Uses `is`, not `==`', 'Returns indices in increasing order', 'Stops at the shorter list'],
      hint: 'Pair the rows with `zip(a, b)` (it stops at the shorter one), number them with `enumerate`, and keep the index when `x is y`.',
      explanation: '`is` tests identity, so equal-but-separate rows (`[2]` vs `[2]`) are not reported, while rows shared by a shallow copy are. This is the exact check you can use to find hidden aliasing between a "copy" and its original.',
    },
    {
      kind: 'code',
      prompt: 'Write `clone(value)`, a small recursive deep copy. Dicts and lists must be rebuilt (with cloned contents), tuples rebuilt as tuples (with cloned contents), and every other value returned as is. The result must be equal to the input but share **no list or dict** with it. Do not import `copy`.',
      starter: `def clone(value):
    ...
`,
      solution: `def clone(value):
    if isinstance(value, dict):
        return {k: clone(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clone(v) for v in value]
    if isinstance(value, tuple):
        return tuple(clone(v) for v in value)
    return value
`,
      tests: `data = {"name": "orc", "loot": [1, [2, 3]], "pos": (1, [4]), "stats": {"hp": 10, "tags": ["a"]}}
copy_ = clone(data)
assert copy_ == data
assert copy_ is not data
assert copy_["loot"] is not data["loot"]
assert copy_["loot"][1] is not data["loot"][1]
assert copy_["pos"][1] is not data["pos"][1]
assert copy_["stats"] is not data["stats"] and copy_["stats"]["tags"] is not data["stats"]["tags"]
assert isinstance(copy_["pos"], tuple)

data["loot"][1].append(99)
data["stats"]["tags"].append("b")
assert copy_["loot"] == [1, [2, 3]]
assert copy_["stats"]["tags"] == ["a"]

assert clone(5) == 5 and clone("x") == "x" and clone(None) is None
assert clone([]) == [] and clone({}) == {} and clone(()) == ()`,
      checks: ['Rebuilds dicts, lists and tuples recursively', 'Returns other values unchanged', 'No shared lists/dicts between input and result'],
      hint: 'Check `isinstance(value, dict)`, `list`, `tuple` in turn and recurse on the contents; for anything else, return `value` itself — ints, strings and `None` are immutable, so sharing them is safe.',
      explanation: 'Recursion mirrors the structure of the data: containers are rebuilt, leaves are shared. Sharing immutable leaves is safe because they can never change. `copy.deepcopy` does the same with extra care for cycles, custom classes and memoization of already-copied objects.',
    },
  ],
  takeaways: [
    'A Python variable is a **name bound to an object**. `b = a` adds a name; it never copies. Every object has an identity, a type and a value.',
    '`is` compares identity, `==` compares value. Use `==` for values and `is` only for singletons (`x is None`). Never use `is` on numbers or strings.',
    'Mutating an object is visible through every name; rebinding a name affects only that name. Parameters are fresh names for the caller’s objects.',
    '`+=` mutates lists in place (so aliases see it) but rebinds tuples and strings. Default argument values are created once — use `None` plus an `if`.',
    'Copy explicitly: shallow (`copy.copy`, `list(x)`) shares inner objects, `copy.deepcopy` shares nothing. Build grids with comprehensions, never with `[row] * n`.',
  ],
  reading: [
    { title: 'Data model — Objects, values and types', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types', source: 'docs', note: 'The official definition of identity, type, value and mutability.' },
    { title: 'copy — Shallow and deep copy operations', url: 'https://docs.python.org/3/library/copy.html', source: 'docs', note: 'Exactly what shallow and deep copies do, and how classes customize copying.' },
    { title: 'Facts and myths about Python names and values', url: 'https://nedbatchelder.com/text/names.html', source: 'article', note: 'Ned Batchelder’s classic talk write-up on the name/object model — worth reading twice.' },
    { title: 'Programming FAQ — Python’s calling conventions', url: 'https://docs.python.org/3/faq/programming.html', source: 'docs', note: 'Official answers on argument passing, mutable defaults and common pitfalls.' },
  ],
};
