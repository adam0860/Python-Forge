import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-dataclasses',
  title: 'Dataclasses',
  summary: 'Let `@dataclass` write `__init__`, `__repr__` and `__eq__` for you: defaults and `field(default_factory=…)`, `order` and `frozen`, `__post_init__` validation, `replace`/`asdict`, and how dataclasses compare with plain classes, tuples and dicts.',
  minutes: 18,
  objectives: [
    'Declare a dataclass with typed fields, defaults and `field(default_factory=…)`',
    'Explain what `@dataclass` generates and what `eq`, `order` and `frozen` change (including hashability)',
    'Validate and derive fields with `__post_init__` and `field(init=False)`',
    'Use `replace`, `asdict`, `astuple` and `fields` to copy and inspect dataclass instances',
    'Choose between a dataclass, a plain class, a tuple/NamedTuple and a dict for a given job',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Classes that mostly hold data',
      blocks: [
        {
          type: 'p',
          text: 'Many classes exist just to **carry data**: a `Player` with a name and health, a `Vec`, a config record. Writing `__init__`, `__repr__` and `__eq__` for each one is the same boilerplate every time. The **[[dataclass]]** decorator (from the `dataclasses` module) reads the *annotated fields* in the class body and generates those methods for you. You describe the data; Python writes the plumbing.',
        },
        {
          type: 'code',
          title: 'player_dataclass.py',
          runnable: true,
          code: `import inspect
from dataclasses import dataclass, field

@dataclass
class Player:
    name: str
    hp: int = 100
    items: list = field(default_factory=list)

a = Player("Ada")
b = Player("Ada")
c = Player("Bo", 50, ["key"])
print(a)
print(a == b, a is b, a == c)
a.items.append("map")
print(a.items, b.items)
print(inspect.signature(Player))`,
          output: `Player(name='Ada', hp=100, items=[])
True False False
['map'] []
(name: str, hp: int = 100, items: list = <factory>) -> None`,
          annotations: [
            { lines: 4, text: '`@dataclass` inspects the class body once, when the class is created, and adds methods to it.' },
            { lines: '6-8', text: 'Each **annotated** name (`name: str`) is a field. A value after `=` is a default. Fields without defaults must come first, like parameters of a function.' },
            { lines: 8, text: 'Mutable defaults need `field(default_factory=list)`: the factory (`list`) is *called for each new object*, so every player gets its own list.' },
            { lines: '10-12', text: 'The generated `__init__(self, name, hp=100, items=...)` accepts the fields positionally or by keyword.' },
            { lines: 13, text: 'The generated `__repr__` prints `ClassName(field=value, ...)` — exactly the debug output you would write by hand.' },
            { lines: 14, text: 'The generated `__eq__` compares all fields as a tuple. `a == b` is `True` (same values) while `a is b` is `False`; `a == c` is `False`.' },
            { lines: '15-16', text: 'Each player has its own list: the `default_factory` created two separate lists.' },
            { lines: 17, text: 'The generated constructor signature, as the `inspect` module reports it. `<factory>` marks a default that is produced by a function.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why dataclasses exist',
          text: 'Before Python 3.7 you wrote this by hand (error-prone: add a field and forget to update `__eq__`) or used libraries like `attrs`. `@dataclass` (PEP 557) put the common 90% into the standard library. The result: a short, readable declaration of what the object *is*, and `__init__`, `__repr__` and `__eq__` that always match the fields.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'It is like a C++ `struct` that automatically gets a constructor, `operator==` and a stream `operator<<`. (C++20’s `= default` comparisons are the closest feature.) The type annotations are *not enforced* at run time: `Player(5)` happily stores the number 5 in `name`. They document intent and let editors and type checkers catch the mistake.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Annotations are required, types are not enforced',
          text: 'Only names with an annotation become fields — `count = 0` in the class body is just a class attribute. Any annotation works (`int`, `list[str]`, `"Player"`, even `object`), and `dataclasses` never checks values. If you need real runtime validation, use `__post_init__` (below) or a library such as Pydantic, which you will meet in the AI course.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which three methods does a plain `@dataclass` generate by default?',
      options: [
        { text: '`__init__`, `__repr__` and `__eq__`', correct: true, why: 'Right — these are the defaults (`init=True`, `repr=True`, `eq=True`).' },
        { text: '`__init__`, `__str__` and `__hash__`', why: 'No `__str__` is generated (the default `object.__str__` uses `__repr__`), and `__hash__` is actually removed for a normal mutable dataclass.' },
        { text: '`__init__`, `__lt__` and `__len__`', why: 'Ordering methods only appear with `order=True`, and `__len__` is never generated.' },
        { text: '`__new__`, `__del__` and `__call__`', why: 'None of these are generated; they deal with allocation, destruction and calling.' },
      ],
      explanation: '`@dataclass` writes `__init__`, `__repr__` and `__eq__` by default. `order=True` adds `<`, `<=`, `>`, `>=`; `frozen=True` adds immutability (and, with `eq`, a `__hash__`).',
    },
    {
      kind: 'concept',
      title: 'Mutable-default errors, order=True and frozen=True',
      blocks: [
        {
          type: 'p',
          text: 'Remember the shared-mutable-default bug from earlier lessons? Dataclasses refuse to let you make it: a `list`, `dict` or `set` default raises `ValueError` at class-creation time. Two options change the generated behavior: **`order=True`** adds `<`, `<=`, `>`, `>=` comparing the fields in declaration order (as tuples), and **`frozen=True`** makes instances **immutable** — assignment raises `FrozenInstanceError`. Frozen dataclasses with `eq=True` also get a `__hash__`, so they work as dictionary keys and set members.',
        },
        {
          type: 'code',
          title: 'order_and_frozen.py',
          runnable: true,
          code: `from dataclasses import dataclass, FrozenInstanceError

try:
    @dataclass
    class Bad:
        tags: list = []
except ValueError as e:
    print(type(e).__name__)

@dataclass(order=True, frozen=True)
class Version:
    major: int
    minor: int = 0

v1, v2 = Version(1, 2), Version(1, 10)
print(v1 < v2, sorted([v2, v1]), max(v1, v2))
try:
    v1.major = 5
except FrozenInstanceError as e:
    print(type(e).__name__)
print(hash(v1) == hash(Version(1, 2)), len({v1, Version(1, 2)}))`,
          output: `ValueError
True [Version(major=1, minor=2), Version(major=1, minor=10)] Version(major=1, minor=10)
FrozenInstanceError
True 1`,
          annotations: [
            { lines: '4-6', text: 'A mutable default (`[]`) would be shared by every instance, so the decorator rejects it when the class is defined.' },
            { lines: '7-8', text: 'The error is raised right away (`ValueError`) — at definition time, not later when two objects mysteriously share state.' },
            { lines: 10, text: 'Options go in the decorator’s parentheses. `order=True` compares field by field, in order: major first, then minor. `frozen=True` forbids changing attributes after creation.' },
            { lines: 16, text: 'Because `order=True` generated the comparison methods, `<`, `sorted` and `max` all work. (1, 2) < (1, 10) since 2 < 10.' },
            { lines: '17-20', text: 'Assigning to a frozen field raises `FrozenInstanceError` (a subclass of `AttributeError`).' },
            { lines: 21, text: 'Frozen + `eq` gives a generated `__hash__` based on the fields, so equal values hash equally and collapse in a set.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Non-frozen dataclasses are not hashable',
          text: 'With `eq=True` (the default) and no `frozen=True`, Python sets `__hash__` to `None`: instances can’t go in a set or be dict keys, because mutable data would make the hash change. Use `frozen=True` (or `unsafe_hash=True` if you know what you are doing) when you need hashing — for example grid positions or cache keys.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer frozen for value-like data',
          text: 'Positions, colors, versions, money and configuration are *values*: two with the same numbers are interchangeable. Make them frozen: no aliasing surprises, safe as dictionary keys, and safe to share between threads. Use mutable dataclasses for things with identity and changing state, such as a `Player`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A regular `@dataclass` (no arguments) can be used directly as a dictionary key or set member, because it generates `__hash__` from its fields.',
      answer: false,
      explanation: 'False. With the default `eq=True` and `frozen=False`, `__hash__` is set to `None`, so instances are unhashable. Add `frozen=True` to get a hash based on the fields.',
    },
    {
      kind: 'concept',
      title: 'field(), __post_init__ and validation',
      blocks: [
        {
          type: 'p',
          text: '`field(...)` fine-tunes one field: `default_factory` (fresh mutable default), `repr=False` (hide from the printout), `compare=False` (ignore in `==`), `init=False` (not a constructor parameter — you assign it yourself). **`__post_init__`** is called right after the generated `__init__` finishes: the place to validate, normalize or compute fields that depend on others. Since `replace()` rebuilds the object through `__init__`, it re-runs `__post_init__` too.',
        },
        {
          type: 'code',
          title: 'enemy_post_init.py',
          runnable: true,
          code: `from dataclasses import dataclass, field, replace, asdict, astuple, fields

@dataclass
class Enemy:
    name: str
    hp: int
    max_hp: int = field(init=False)
    tags: list = field(default_factory=list, repr=False)
    seen: int = field(default=0, compare=False)

    def __post_init__(self):
        if self.hp <= 0:
            raise ValueError("hp must be positive")
        self.max_hp = self.hp
        self.name = self.name.title()

e = Enemy("grum the orc", 30)
print(e)
print(e.max_hp, e.tags)
f = Enemy("grum the orc", 30)
f.seen = 9
print(e == f)
try:
    Enemy("x", 0)
except ValueError as err:
    print(err)

g = replace(e, hp=5)
print(g, g.max_hp)
print(asdict(e))
print(astuple(e))
print([fld.name for fld in fields(e)])`,
          output: `Enemy(name='Grum The Orc', hp=30, max_hp=30, seen=0)
30 []
True
hp must be positive
Enemy(name='Grum The Orc', hp=5, max_hp=5, seen=0) 5
{'name': 'Grum The Orc', 'hp': 30, 'max_hp': 30, 'tags': [], 'seen': 0}
('Grum The Orc', 30, 30, [], 0)
['name', 'hp', 'max_hp', 'tags', 'seen']`,
          annotations: [
            { lines: 7, text: '`init=False`: `max_hp` is not a constructor argument; it is a field that `__post_init__` fills in. It still appears in `repr` and comparisons.' },
            { lines: 8, text: '`repr=False` keeps the (often long) tag list out of the printout.' },
            { lines: 9, text: '`compare=False` excludes `seen` from `==` — a bookkeeping counter shouldn’t make otherwise identical enemies "different".' },
            { lines: '11-15', text: '`__post_init__` runs after the generated `__init__`. It validates (`hp` must be positive), derives `max_hp`, and normalizes the name.' },
            { lines: 18, text: 'The repr shows the normalized name, no `tags` (hidden), but `max_hp` and `seen`.' },
            { lines: '20-22', text: 'After `f.seen = 9` the two enemies still compare equal: `seen` is excluded from `==`.' },
            { lines: '23-26', text: 'Invalid data is rejected at construction, with your own message.' },
            { lines: '28-29', text: '`replace(e, hp=5)` makes a modified **copy** by calling `__init__` again — so `__post_init__` re-ran and `max_hp` became 5, too.' },
            { lines: '30-32', text: '`asdict` and `astuple` convert an instance (recursively) into plain dicts and tuples — ideal for JSON or saving. `fields()` lists the field definitions for generic code.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Which kind of validation belongs where',
          text: 'Cheap, always-true rules (positive hp, non-empty name) go in `__post_init__`. For rules that must also hold on *later* assignment, combine a dataclass with a property for that field, or make the dataclass `frozen=True` so values can never change after being validated once.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What the decorator really does',
          text: '`@dataclass` runs once at class-creation time. It builds the source text of `__init__`, `__repr__`, `__eq__` (and more) as strings, `exec`s them, and attaches the resulting functions to your class. There is no runtime magic afterwards: the instance is an ordinary object with an ordinary `__dict__`. That is why dataclasses cost nothing extra to use, and why the `@dataclass(slots=True)` option can drop the dict entirely.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Immutable values and choosing the right tool',
      blocks: [
        {
          type: 'p',
          text: 'Frozen dataclasses fit naturally with a style where you never edit a value — you build a **new** one. `dataclasses.replace(obj, field=new)` does the copy-with-changes for you. Use that for positions, game-state snapshots and anything you want to hash.',
        },
        {
          type: 'code',
          title: 'frozen_pos.py',
          runnable: true,
          code: `from dataclasses import dataclass, replace

@dataclass(frozen=True)
class Pos:
    x: int
    y: int
    def moved(self, dx, dy):
        return replace(self, x=self.x + dx, y=self.y + dy)

p = Pos(1, 2)
q = p.moved(3, 4)
print(p, q, p == Pos(1, 2))
visited = {p, q, Pos(1, 2)}
print(len(visited))`,
          output: `Pos(x=1, y=2) Pos(x=4, y=6) True
2`,
          annotations: [
            { lines: '7-8', text: 'A "mutation" method returns a **new** `Pos` built with `replace`; the original is untouched (it couldn’t be changed anyway).' },
            { lines: 12, text: '`p` is unchanged by `moved`, and equal positions compare equal.' },
            { lines: '13-14', text: 'Frozen dataclasses are hashable, so positions work in a `set` of visited cells — a classic pathfinding and game-AI pattern.' },
          ],
        },
        {
          type: 'table',
          headers: ['Tool', 'Best for', 'Trade-off'],
          rows: [
            ['Plain class', 'Objects with behavior and rules', 'You write `__init__`, `__repr__` and `__eq__` yourself'],
            ['`@dataclass`', 'Records with named fields (mutable or frozen)', 'No runtime type checking'],
            ['`NamedTuple`', 'Small immutable records that must behave like tuples', 'Fixed length; unpackable and indexable by position'],
            ['`dict`', 'Data whose keys are not known up front (JSON, config)', 'No field names checked; typos create new keys'],
            ['`TypedDict`', 'Dict-shaped data with known keys, for type checkers', 'Plain dict at run time'],
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'A good default',
          text: 'Reaching for a dataclass whenever you would have written a class with only an `__init__` is the modern Python habit. Switch to a plain class when most of the code is behavior and the state needs careful invariants, to a `dict` for truly dynamic data, and to `NamedTuple` when tuple unpacking and positional access matter.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'In the AI and game chapters',
          text: 'Training configuration (`learning_rate`, `batch_size`, `gamma`) is a perfect frozen dataclass; so are RL transitions `(state, action, reward, next_state, done)` and game events. One definition documents the fields, prevents accidental edits, and prints cleanly in logs.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the dataclass so that each `Item` gets its own list of tags.',
      template: `from dataclasses import dataclass, field

@dataclass
class Item:
    name: ___
    tags: list = field(___=list)`,
      templateIsCode: true,
      blanks: [{ answers: ['str'] }, { answers: ['default_factory'] }],
      wordBank: ['str', 'default_factory', 'default', 'factory'],
      explanation: 'Fields are declared with annotations (`name: str`). A mutable default must use `field(default_factory=list)` so a *new* list is created per instance; `field(default=[])` would be rejected, and `factory=` is not a real keyword.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this dataclass comparison.',
      code: `from dataclasses import dataclass

@dataclass
class P:
    x: int
    y: int = 0

p = P(1)
q = P(1, 0)
print(p == q, p is q, p)`,
      answer: 'True False P(x=1, y=0)',
      hint: 'Dataclass equality compares field values; `is` compares identity.',
      explanation: '`P(1)` fills in the default `y=0`, so `p` and `q` hold the same field values; the generated `__eq__` says `True`, while `is` correctly says they are two different objects. The generated `__repr__` prints `P(x=1, y=0)`.',
    },
    {
      kind: 'error',
      prompt: 'Defining this class raises a `TypeError` as soon as the module loads. Tap the faulty line.',
      lines: [
        'from dataclasses import dataclass',
        '@dataclass',
        'class Bad:',
        '    name: str = "x"',
        '    hp: int',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'A field without a default (`hp`) cannot follow a field that has one (`name`), exactly like function parameters: the generated `__init__(self, name="x", hp)` would be a syntax error. Move `hp` above `name`, give it a default, or use `kw_only=True`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`@dataclass(frozen=True)`\n`class F:`\n`    x: int`\n`s = {F(1), F(1), F(2), F(2), F(3)}`\n`print(len(s))`',
      answer: '3',
      hint: 'Equal frozen dataclass instances hash equally.',
      explanation: 'A frozen dataclass has `__eq__` and `__hash__` based on its fields, so `F(1)` twice is one set element, and `F(2)` twice is another. The set contains `F(1)`, `F(2)` and `F(3)`: three elements.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a **frozen, ordered** dataclass `Card` with fields `rank: int` and `suit: str` (in that order). Add a method `label()` returning rank and suit joined, such as `"10C"`. Cards must be sortable by rank then suit, hashable, and immutable.',
      starter: `# define dataclass Card here
`,
      solution: `from dataclasses import dataclass


@dataclass(order=True, frozen=True)
class Card:
    rank: int
    suit: str

    def label(self):
        return f"{self.rank}{self.suit}"
`,
      tests: `a = Card(2, "H")
assert repr(a) == "Card(rank=2, suit='H')"
assert a.label() == "2H"
assert Card(10, "C").label() == "10C"
assert a == Card(2, "H")
assert a < Card(10, "C")
assert sorted([Card(10, "C"), Card(2, "S"), Card(2, "H")]) == [Card(2, "H"), Card(2, "S"), Card(10, "C")]
assert max(Card(3, "A"), Card(3, "B")) == Card(3, "B")
assert len({Card(1, "a"), Card(1, "a"), Card(2, "a")}) == 2
try:
    a.rank = 5
    assert False, "should be frozen"
except AttributeError:
    pass
assert a.rank == 2`,
      checks: ['Fields declared in order `rank`, `suit`', '`order=True` makes sorting work (rank first, then suit)', '`frozen=True` makes instances immutable and hashable'],
      hint: 'Put the options in the decorator: `@dataclass(order=True, frozen=True)`. Declare `rank: int` before `suit: str` so comparison looks at rank first.',
      explanation: 'Two options replaced about a dozen hand-written methods. Field order matters for `order=True`: comparison works like comparing tuples `(rank, suit)`. A frozen dataclass is also hashable, so cards can sit in sets and dictionary keys.',
    },
    {
      kind: 'code',
      prompt: 'Write a mutable dataclass `Quest` with fields `title: str`, `reward: int`, `steps: list` (a fresh empty list per quest) and `done: bool` that is **not** an `__init__` parameter and starts `False`. In `__post_init__`, raise `ValueError` if `reward < 0` and strip whitespace from `title`. Add a method `complete()` that sets `done` to `True`.',
      starter: `# define dataclass Quest here
`,
      solution: `from dataclasses import dataclass, field


@dataclass
class Quest:
    title: str
    reward: int
    steps: list = field(default_factory=list)
    done: bool = field(default=False, init=False)

    def __post_init__(self):
        if self.reward < 0:
            raise ValueError("reward must be >= 0")
        self.title = self.title.strip()

    def complete(self):
        self.done = True
`,
      tests: `from dataclasses import asdict, replace
q = Quest("  Find key  ", 10)
assert q.title == "Find key"
assert q.reward == 10 and q.steps == [] and q.done is False
q.steps.append("search cellar")
assert Quest("x", 1).steps == []
q.complete()
assert q.done is True
assert repr(q) == "Quest(title='Find key', reward=10, steps=['search cellar'], done=True)"
assert asdict(q) == {"title": "Find key", "reward": 10, "steps": ["search cellar"], "done": True}
r = replace(q, reward=99)
assert r.reward == 99 and r.title == "Find key"
try:
    Quest("bad", -1)
    assert False, "should raise ValueError"
except ValueError:
    pass
try:
    Quest("a", 1, [], True)
    assert False, "done must not be an init parameter"
except TypeError:
    pass`,
      checks: ['`steps` uses `default_factory=list`', '`done` is `field(default=False, init=False)`', '`__post_init__` validates `reward` and strips `title`'],
      hint: 'Use `field(default_factory=list)` for steps and `field(default=False, init=False)` for `done`. Inside `__post_init__`, check `self.reward < 0` and assign `self.title = self.title.strip()`.',
      explanation: '`init=False` keeps `done` out of the constructor while still giving it a default and showing it in the `repr`. `__post_init__` is the right spot for validation and normalization because it runs after every construction — including via `replace`.',
    },
    {
      kind: 'code',
      prompt: 'Write a **frozen** dataclass `Vec2` with `x: float = 0` and `y: float = 0`. Add `__add__` (returns a new `Vec2`, and `NotImplemented` for other types) and a method `scaled(k)` returning a new scaled `Vec2`. The original must never change.',
      starter: `# define dataclass Vec2 here
`,
      solution: `from dataclasses import dataclass


@dataclass(frozen=True)
class Vec2:
    x: float = 0
    y: float = 0

    def __add__(self, other):
        if not isinstance(other, Vec2):
            return NotImplemented
        return Vec2(self.x + other.x, self.y + other.y)

    def scaled(self, k):
        return Vec2(self.x * k, self.y * k)
`,
      tests: `assert Vec2() == Vec2(0, 0)
a = Vec2(1, 2)
b = Vec2(3, 4)
assert a + b == Vec2(4, 6)
assert a.scaled(3) == Vec2(3, 6)
assert a == Vec2(1, 2) and b == Vec2(3, 4)
assert repr(a) == "Vec2(x=1, y=2)"
assert Vec2(y=5) == Vec2(0, 5)
assert len({a, Vec2(1, 2), b}) == 2
try:
    a.x = 9
    assert False, "should be frozen"
except AttributeError:
    pass
try:
    a + 1
    assert False, "should raise TypeError"
except TypeError:
    pass
assert sum([a, a, b], Vec2()) == Vec2(5, 8)`,
      checks: ['Fields have defaults of `0` and the class is frozen', '`+` and `scaled` return new objects and leave the originals untouched', 'Unsupported operands raise `TypeError` (via `NotImplemented`)'],
      hint: 'Declare `@dataclass(frozen=True)` with `x: float = 0` and `y: float = 0`. In `__add__`, return `NotImplemented` unless `other` is a `Vec2`; otherwise return `Vec2(self.x + other.x, self.y + other.y)`.',
      explanation: 'The dataclass supplies `__init__`, `__repr__`, `__eq__` and `__hash__`; you only write the behavior that is truly yours. Frozen instances can’t be edited, so operations return new vectors — the same style as the hand-written `Vec` earlier in this unit, with far less boilerplate.',
    },
  ],
  takeaways: [
    '`@dataclass` generates `__init__`, `__repr__` and `__eq__` from the class’s annotated fields. Annotations are documentation — they are not checked at run time.',
    'Mutable defaults need `field(default_factory=list)`; plain `[]`/`{}` defaults raise `ValueError`. Fields without defaults must precede those with defaults.',
    '`order=True` adds comparisons (field by field); `frozen=True` makes instances immutable and, with `eq`, hashable. A normal mutable dataclass is unhashable.',
    '`field(init=False/repr=False/compare=False)` tunes individual fields; `__post_init__` validates and derives values after construction; `replace`, `asdict`, `astuple` and `fields` copy and inspect.',
    'Use dataclasses for records, frozen ones for values like positions and configs; use plain classes for behavior-heavy objects, dicts for dynamic data and `NamedTuple` for tuple-like records.',
  ],
  reading: [
    { title: 'dataclasses — Data Classes', url: 'https://docs.python.org/3/library/dataclasses.html', source: 'docs', note: 'The complete reference: every decorator option, `field()` parameter and helper function.' },
    { title: 'PEP 557 — Data Classes', url: 'https://peps.python.org/pep-0557/', source: 'pep', note: 'The proposal that added dataclasses, with the rationale and the comparison with `attrs` and `namedtuple`.' },
    { title: 'Data Classes in Python 3.7+ (Guide)', url: 'https://realpython.com/python-data-classes/', source: 'article', note: 'A practical walkthrough with many examples, including inheritance and optimization.' },
  ],
};
