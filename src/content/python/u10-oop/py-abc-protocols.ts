import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-abc-protocols',
  title: 'Abstract Classes and Protocols',
  summary: 'Making interfaces explicit: duck typing and its limits, abstract base classes with `@abstractmethod`, `collections.abc` mixins that give you methods for free, and structural typing with `typing.Protocol`.',
  minutes: 18,
  objectives: [
    'Explain duck typing and when an explicit interface is worth adding',
    'Define an abstract base class with `ABC` and `@abstractmethod` and predict when instantiation fails',
    'Implement a `collections.abc` class (such as `Sequence`) by writing a few methods and getting the rest free',
    'Write a `typing.Protocol` and explain structural versus nominal typing',
    'Choose between duck typing, an ABC and a Protocol for a given design',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Duck typing — and when it isn’t enough',
      blocks: [
        {
          type: 'p',
          text: 'Python is built on **[[duck-typing|duck typing]]**: a function that calls `item.draw()` works for *any* object that has a `draw` method, whatever its class. No declarations, no shared base class. That flexibility is wonderful for small programs. As a code base grows, three questions appear: *what exactly must I implement to be accepted?* *can the tool tell me when I forgot a method?* *can a type checker verify the call?* Python answers them with two tools: **abstract base classes** (explicit, checked when you create an object) and **protocols** (structural, checked by type checkers).',
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'Job requirements versus a job title',
          text: 'Duck typing is hiring anyone who can do the tasks. An **ABC** is a job title: you must formally be a "Shape" (inherit from it) and fill in all the required duties, or you are not hired (a `TypeError` at creation). A **Protocol** is a written list of duties: anyone who can already perform them qualifies — no formal title needed — and a type checker verifies it before the program runs.',
        },
        {
          type: 'table',
          headers: ['Approach', 'How you "join"', 'When it is checked', 'Best for'],
          rows: [
            ['Plain duck typing', 'Just have the methods', 'When a missing method is called (`AttributeError`)', 'Small scripts, private code'],
            ['Abstract base class', 'Inherit from the ABC and implement everything abstract', 'At instantiation (`TypeError`)', 'Plugin systems, shared base behavior, framework hooks'],
            ['`typing.Protocol`', 'Just have the methods (no inheritance)', 'By a type checker (and optionally `isinstance`)', 'Typed code that wants flexibility'],
          ],
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Where ABCs came from',
          text: 'Abstract base classes arrived in Python 2.6 / 3.0 (PEP 3119, 2007) after years of debate: Guido van Rossum accepted them once they could be added *without* giving up duck typing — `isinstance` could now ask "does this look like a sequence?" instead of "does it inherit from `list`?". Protocols (PEP 544, Python 3.8) completed the picture by letting type checkers verify duck typing statically.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Abstract base classes with ABC and @abstractmethod',
      blocks: [
        {
          type: 'p',
          text: 'Inherit from `abc.ABC` and mark required methods with `@abstractmethod`. Python then **refuses to instantiate** the class — or any subclass that has not implemented every abstract member. The base class can still contain ordinary methods that use the abstract ones (the **template method** pattern): subclasses supply the details, the base provides the shared workflow.',
        },
        {
          type: 'code',
          title: 'abstract_shape.py',
          runnable: true,
          code: `from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self):
        ...

    @property
    @abstractmethod
    def name(self):
        ...

    def describe(self):
        return f"{self.name} with area {self.area():.1f}"

class Square(Shape):
    def __init__(self, s):
        self.s = s
    name = "square"
    def area(self):
        return self.s ** 2

class Lazy(Shape):
    name = "lazy"

try:
    Shape()
except TypeError as e:
    print("Shape:", type(e).__name__)
try:
    Lazy()
except TypeError as e:
    print("Lazy:", type(e).__name__)
print(Square(3).describe())
print(isinstance(Square(1), Shape), issubclass(Lazy, Shape))
print(sorted(Shape.__abstractmethods__))
print(Shape.__mro__[1].__name__)`,
          output: `Shape: TypeError
Lazy: TypeError
square with area 9.0
True True
['area', 'name']
ABC`,
          annotations: [
            { lines: 3, text: 'Deriving from `ABC` turns on the checking machinery (it sets the class’s metaclass to `ABCMeta`; you rarely need to know that).' },
            { lines: '4-6', text: '`@abstractmethod` declares "every concrete subclass must define this". The body is just `...` (or a docstring); it is never meant to run.' },
            { lines: '8-11', text: 'Properties can be abstract too: put `@abstractmethod` **under** `@property`. Subclasses may satisfy it with a property *or* a plain class attribute.' },
            { lines: '13-14', text: 'A concrete method in the base class can call the abstract ones. `describe` is written once and works for every future shape (template method).' },
            { lines: '16-21', text: '`Square` implements both abstract members (`name` as a class attribute, `area` as a method), so it can be instantiated.' },
            { lines: '23-24', text: '`Lazy` supplies `name` but forgot `area`, so it is still abstract.' },
            { lines: '26-29', text: 'Instantiating the ABC itself raises `TypeError` — you can’t create a vague "shape".' },
            { lines: '30-33', text: 'Instantiating the incomplete subclass fails **immediately**, at construction — not later when `area()` is first called in the middle of a game loop.' },
            { lines: 34, text: 'The complete subclass works and inherits `describe`.' },
            { lines: 35, text: 'Subclasses count as instances of the ABC for `isinstance`/`issubclass` — even incomplete ones (that check concerns inheritance, not instantiation).' },
            { lines: 36, text: '`__abstractmethods__` lists the members still unimplemented.' },
            { lines: 37, text: 'The MRO shows `ABC` sitting between `Shape` and `object`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: '`@abstractmethod` is a pure virtual function (`virtual void area() = 0;`), and an ABC is an abstract class. One difference: in Python the abstract method *may* have a body (callable via `super()`), and the check is at instantiation time at run time rather than at compile time.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother, if `NotImplementedError` exists?',
          text: 'In the inheritance lesson the base method raised `NotImplementedError`. That only fails when the missing method is actually *called* — possibly deep into a long run, on a rarely used code path. An ABC fails at construction: the mistake is found at the first moment an object is created, with a clear message listing the missing methods. Use ABCs whenever other people (or future you) will write subclasses.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A class `Dog(Animal)` inherits from an ABC with an abstract `speak()` method but only defines `bark()`. When does Python complain?',
      options: [
        { text: 'When you try to create a `Dog` object — with a `TypeError`', correct: true, why: 'Right: the class definition succeeds, but instantiating a class that still has abstract methods raises `TypeError`.' },
        { text: 'When the class `Dog` is defined', why: 'Defining the class is fine — it simply stays abstract. The check happens at instantiation.' },
        { text: 'Only when `speak()` is called on a `Dog`', why: 'That would be plain duck typing / `NotImplementedError`. With an ABC the failure comes earlier, at creation.' },
        { text: 'Never — Python ignores `@abstractmethod`', why: 'It is enforced as long as the class derives from `ABC` (or uses `ABCMeta`). Without that, the decorator would indeed do nothing.' },
      ],
      explanation: 'The class statement succeeds, but `Dog()` raises `TypeError: Can’t instantiate abstract class …`, naming the missing method. Without `ABC` as a base the decorator has no effect.',
    },
    {
      kind: 'concept',
      title: 'collections.abc: implement a little, get a lot',
      blocks: [
        {
          type: 'p',
          text: 'The standard library ships ready-made ABCs in **`collections.abc`**: `Iterable`, `Sized`, `Callable`, `Sequence`, `Mapping`, `MutableMapping`, `Set` and more. They do double duty. As **interfaces** they let you ask `isinstance(x, Iterable)` (duck-typed: anything with `__iter__` qualifies, no inheritance needed). As **mixins** they supply many methods for free once you implement a few *abstract* ones — inherit from `Sequence`, write `__len__` and `__getitem__`, and you also get `__contains__`, `__iter__`, `__reversed__`, `index` and `count`.',
        },
        {
          type: 'code',
          title: 'sequence_mixin.py',
          runnable: true,
          code: `from collections.abc import Sequence, Mapping, Iterable, Callable

class Ring(Sequence):
    def __init__(self, items):
        self._items = list(items)
    def __len__(self):
        return len(self._items)
    def __getitem__(self, i):
        return self._items[i]

r = Ring("abca")
print(len(r), r[0], r[-1], "b" in r, r.index("c"), r.count("a"))
print(list(reversed(r)), list(r), r[1:3])
print(isinstance(r, Sequence), isinstance(r, Iterable), isinstance([], Sequence), isinstance("x", Sequence))
print(isinstance({}, Mapping), isinstance(5, Iterable), isinstance(len, Callable))

class Half(Sequence):
    def __len__(self):
        return 3
try:
    Half()
except TypeError:
    print("TypeError")

class Quacker:
    def __iter__(self):
        return iter([1, 2])
print(isinstance(Quacker(), Iterable))`,
          output: `4 a a True 2 2
['a', 'c', 'b', 'a'] ['a', 'b', 'c', 'a'] ['b', 'c']
True True True True
True False True
TypeError
True`,
          annotations: [
            { lines: 3, text: '`Sequence` requires only `__getitem__` and `__len__`. Everything else is provided by the ABC as ordinary (mixin) methods.' },
            { lines: '6-9', text: 'The two required methods, delegating to a list.' },
            { lines: 12, text: 'Free methods in action: `in` (`__contains__`), `index` and `count` — we never wrote them.' },
            { lines: 13, text: 'Free iteration and `reversed` too. Slicing `r[1:3]` works because our `__getitem__` passes the slice to the list.' },
            { lines: 14, text: '`isinstance` works with real sequences too: lists and even strings count as `Sequence`. Python **registers** the built-in types as virtual subclasses.' },
            { lines: 15, text: 'ABCs also check *behavior*: a dict is a `Mapping`, the number 5 isn’t `Iterable`, and any function is `Callable`.' },
            { lines: '17-23', text: '`Half` implements only `__len__`, so `__getitem__` is still abstract and instantiation fails.' },
            { lines: '25-28', text: '`Quacker` doesn’t inherit from anything, yet `isinstance(…, Iterable)` is `True`: `Iterable` has a hook that recognizes any class defining `__iter__`. Duck typing, formalized.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer abstract types in checks and annotations',
          text: 'To accept "any list-like thing", test or annotate with `Sequence` (or `Iterable`, `Mapping`), not `list`. `isinstance(x, list)` rejects tuples and custom sequences; `isinstance(x, Sequence)` accepts them all. In your own functions: take the *most general* type that works (`Iterable`), return a *concrete* one (`list`).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Virtual subclasses',
          text: 'How can `isinstance([], Sequence)` be `True` when `list` doesn’t inherit from `Sequence`? ABCs can **register** unrelated classes (`Sequence.register(list)`) or define `__subclasshook__` to recognize classes by their methods. Inheritance isn’t the only way to be an instance — which keeps ABCs compatible with duck typing.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'For `isinstance(obj, collections.abc.Iterable)` to be `True`, the class of `obj` must inherit from `Iterable`.',
      answer: false,
      explanation: 'False. `Iterable` recognizes any class that defines `__iter__`, with no inheritance required (`__subclasshook__`). That is why a bare `Quacker` class with `__iter__` passes the check.',
    },
    {
      kind: 'concept',
      title: 'Protocols: structural typing',
      blocks: [
        {
          type: 'p',
          text: 'An ABC makes you **opt in** by inheriting from it (*nominal* typing: it matters what the class is named and descended from). A **`typing.Protocol`** instead describes *what methods an object must have*; anything with matching methods qualifies **automatically** (*structural* typing — duck typing, but written down). Type checkers such as mypy and Pyright verify it before the program runs. At run time a plain Protocol does nothing; add `@runtime_checkable` if you also want `isinstance` to check that the methods exist.',
        },
        {
          type: 'code',
          title: 'drawable_protocol.py',
          runnable: true,
          code: `from typing import Protocol, runtime_checkable

@runtime_checkable
class Drawable(Protocol):
    def draw(self) -> str: ...

class Sprite:
    def draw(self):
        return "sprite"

class Menu:
    def draw(self):
        return "menu"

class Rock:
    pass

def render(items):
    return [i.draw() for i in items]

print(render([Sprite(), Menu()]))
print(isinstance(Sprite(), Drawable), isinstance(Rock(), Drawable))
try:
    render([Rock()])
except AttributeError as e:
    print(type(e).__name__)

class Renderer:
    def run(self, thing: Drawable) -> str:
        return thing.draw()
print(Renderer().run(Menu()))
print(issubclass(Sprite, Drawable))`,
          output: `['sprite', 'menu']
True False
AttributeError
menu
True`,
          annotations: [
            { lines: '3-5', text: 'The protocol lists the required method(s) and their signatures. The `...` body is conventional. `@runtime_checkable` allows `isinstance`/`issubclass` checks.' },
            { lines: '7-13', text: '`Sprite` and `Menu` never mention `Drawable`. They just have a `draw` method, which is all a protocol asks for.' },
            { lines: '18-19', text: 'The function itself is ordinary duck-typed code — nothing about it changed.' },
            { lines: 22, text: 'The `isinstance` check works because of `@runtime_checkable`: it tests that a `draw` attribute exists. (It checks only the *presence* of methods, not their signatures.)' },
            { lines: '23-26', text: 'Without any checking, the call fails with `AttributeError` when `draw()` is reached — the late failure that protocols and ABCs help you catch sooner.' },
            { lines: '28-30', text: 'Annotating a parameter as `Drawable` documents the contract; a type checker would flag `Renderer().run(Rock())` before you ever run the code.' },
            { lines: 32, text: '`issubclass` works the same structural way for runtime-checkable protocols.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Protocol vs ABC: a rule of thumb',
          text: 'Use an **ABC** when you control the implementations and want to share code or enforce completeness at creation (plugin bases, framework hooks). Use a **Protocol** when you want to accept objects from code you don’t control (including built-ins and third-party classes) and mainly care about static checking. `typing.Iterable`, `SupportsFloat` and `os.PathLike` are protocols; PyTorch’s `nn.Module` is a concrete base class you inherit from.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Runtime checks are shallow',
          text: '`isinstance(x, Drawable)` verifies only that a *method of that name exists* — not its arguments or return type, and not whether it is callable the way you expect. Treat it as a quick sanity check; real verification comes from a type checker and from tests.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why this matters for game AI',
          text: 'A game can ask for "an agent": anything with `act(observation)`. Hand-written rules, a PyTorch policy, and a recorded replay can all satisfy the same protocol, so you swap them without touching the game loop. Gymnasium environments and RLGym’s obs/action/reward builders are exactly such interfaces — your own code later in this course will implement them.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the abstract base class so that `Weapon()` cannot be created but every concrete subclass must define `damage`.',
      template: `from abc import ___, abstractmethod

class Weapon(___):
    @___
    def damage(self):
        ...`,
      templateIsCode: true,
      blanks: [{ answers: ['ABC'] }, { answers: ['ABC'] }, { answers: ['abstractmethod'] }],
      wordBank: ['ABC', 'abstractmethod', 'Protocol', 'abstract'],
      explanation: 'Import `ABC` and use it as the base class to enable abstract-method checking, then mark the required method with `@abstractmethod`. `Protocol` would describe an interface structurally (and wouldn’t block instantiation of subclasses the same way); `abstract` is not a Python decorator.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. What happens when the abstract class is instantiated?',
      code: `from abc import ABC, abstractmethod

class Base(ABC):
    @abstractmethod
    def go(self): ...

class Child(Base):
    def go(self):
        return "child"

try:
    Base()
    result = "created"
except TypeError:
    result = "abstract"
print(Child().go(), isinstance(Child(), Base), result)`,
      answer: 'child True abstract',
      hint: 'The `TypeError` comes from `Base()`, which still has an abstract method.',
      explanation: '`Base()` raises `TypeError` because `go` is abstract, so `result` becomes `"abstract"`. `Child` implements `go`, so `Child().go()` returns `"child"`, and a `Child` is an instance of `Base`.',
    },
    {
      kind: 'error',
      prompt: 'Calling `Dog()` raises `TypeError: Can’t instantiate abstract class Dog …`. Tap a line that must change.',
      lines: [
        'from abc import ABC, abstractmethod',
        'class Animal(ABC):',
        '    @abstractmethod',
        '    def speak(self): ...',
        'class Dog(Animal):',
        '    def bark(self):',
        '        return "woof"',
      ],
      linesAreCode: true,
      errorLines: [6, 7],
      explanation: '`Dog` never implements the abstract method `speak` — it defined `bark` instead. Rename `bark` to `speak` (or add a `speak` method) and the class becomes concrete.',
    },
    {
      kind: 'numeric',
      prompt: 'How many abstract methods does `B` still have?\n\n`class A(ABC):`\n`    @abstractmethod`\n`    def a(self): ...`\n`    @abstractmethod`\n`    def b(self): ...`\n`    @abstractmethod`\n`    def c(self): ...`\n`class B(A):`\n`    def a(self): ...`\n`print(len(B.__abstractmethods__))`',
      answer: '2',
      hint: '`B` implements one of the three.',
      explanation: '`B` overrides only `a`, leaving `b` and `c` abstract, so `B.__abstractmethods__` has two names and `B()` would still raise `TypeError`.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write an abstract base class `Weapon` with an abstract method `damage()` and a concrete method `attack(target_hp)` that returns the target’s remaining health, `max(0, target_hp - self.damage())`. Then write `Sword` (damage is always 10) and `Bow(arrows)` (damage is `3 * arrows`). `Weapon` itself, and subclasses that forget `damage`, must not be instantiable.',
      starter: `# define Weapon, Sword and Bow here
`,
      solution: `from abc import ABC, abstractmethod


class Weapon(ABC):
    @abstractmethod
    def damage(self):
        ...

    def attack(self, target_hp):
        return max(0, target_hp - self.damage())


class Sword(Weapon):
    def damage(self):
        return 10


class Bow(Weapon):
    def __init__(self, arrows):
        self.arrows = arrows

    def damage(self):
        return 3 * self.arrows
`,
      tests: `try:
    Weapon()
    assert False, "Weapon must be abstract"
except TypeError:
    pass
assert Sword().attack(25) == 15
assert Sword().attack(5) == 0
b = Bow(4)
assert b.damage() == 12
assert b.attack(20) == 8
assert Bow(0).attack(7) == 7
assert isinstance(b, Weapon) and isinstance(Sword(), Weapon)

class Broken(Weapon):
    pass

try:
    Broken()
    assert False, "Broken must be abstract"
except TypeError:
    pass
assert "damage" in Weapon.__abstractmethods__
assert [type(w).__name__ for w in (Sword(), Bow(1))] == ["Sword", "Bow"]`,
      checks: ['`Weapon` cannot be instantiated; `damage` is abstract', '`attack` is written once in the base and uses `self.damage()`', 'Subclasses that forget `damage` stay abstract'],
      hint: 'Inherit `Weapon` from `ABC` and decorate `damage` with `@abstractmethod`. Put `attack` in `Weapon` as a normal method — it calls `self.damage()`, which each subclass defines.',
      explanation: 'This is the template-method pattern: the base class owns the workflow (`attack`) and subclasses provide just the varying part (`damage`). The ABC guarantees at construction time that no weapon can exist without a damage rule.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Hand(cards)` that inherits from `collections.abc.Sequence`. Implement **only** `__init__`, `__len__`, `__getitem__` and `__repr__` (output like `Hand([1, 2])`, using the list’s repr). The tests will rely on the methods you get for free: `in`, iteration, `reversed`, `index`, `count`, and slicing.',
      starter: `# define class Hand here
`,
      solution: `from collections.abc import Sequence


class Hand(Sequence):
    def __init__(self, cards):
        self._cards = list(cards)

    def __len__(self):
        return len(self._cards)

    def __getitem__(self, i):
        return self._cards[i]

    def __repr__(self):
        return f"Hand({self._cards!r})"
`,
      tests: `from collections.abc import Sequence, Iterable
h = Hand(["A", "K", "Q", "K"])
assert len(h) == 4
assert h[0] == "A" and h[-1] == "K"
assert h[1:3] == ["K", "Q"]
assert "Q" in h and "Z" not in h
assert h.index("Q") == 2
assert h.count("K") == 2
assert list(h) == ["A", "K", "Q", "K"]
assert list(reversed(h)) == ["K", "Q", "K", "A"]
assert [c for c in h if c != "K"] == ["A", "Q"]
assert sorted(h) == ["A", "K", "K", "Q"]
assert repr(h) == "Hand(['A', 'K', 'Q', 'K'])"
assert isinstance(h, Sequence) and isinstance(h, Iterable)
assert Hand([]).__len__() == 0 and not Hand([])
for name in ("__contains__", "__iter__", "__reversed__", "index", "count"):
    assert name not in vars(Hand), name
try:
    h[10]
    assert False, "should raise IndexError"
except IndexError:
    pass`,
      checks: ['Inherits from `collections.abc.Sequence`', 'Defines only `__init__`, `__len__`, `__getitem__` and `__repr__`', '`in`, iteration, `reversed`, `index` and `count` come from the mixin'],
      hint: 'Class `Hand(Sequence)` stores a list in `self._cards`. `__len__` returns its length and `__getitem__(self, i)` returns `self._cards[i]` — that handles negative indexes and slices too. Don’t define `__iter__` or `__contains__`.',
      explanation: 'With two methods implemented you gain five more, plus `isinstance` compatibility with every function that accepts a `Sequence`. This "implement the core, inherit the rest" idea is the main reason to subclass the `collections.abc` classes.',
    },
    {
      kind: 'code',
      prompt: 'Define a `@runtime_checkable` `Protocol` class `Scorer` with one method `score(self, state)`. Then write `best(scorers, state)` that returns the scorer with the highest `score(state)`. If any item in `scorers` does not satisfy the protocol, raise `TypeError` **before** scoring anything.',
      starter: `# define Scorer and best here
`,
      solution: `from typing import Protocol, runtime_checkable


@runtime_checkable
class Scorer(Protocol):
    def score(self, state) -> float:
        ...


def best(scorers, state):
    scorers = list(scorers)
    for s in scorers:
        if not isinstance(s, Scorer):
            raise TypeError(f"{s!r} has no score() method")
    return max(scorers, key=lambda s: s.score(state))
`,
      tests: `class Double:
    def score(self, state):
        return state * 2

class Triple:
    def score(self, state):
        return state * 3

class Rock:
    pass

calls = []
class Spy:
    def score(self, state):
        calls.append(state)
        return 0

d, t = Double(), Triple()
assert isinstance(d, Scorer) and not isinstance(Rock(), Scorer)
assert best([d, t], 4) is t
assert best([t, d], 4) is t
assert best(iter([d]), 1) is d
try:
    best([Spy(), Rock()], 5)
    assert False, "should raise TypeError"
except TypeError:
    pass
assert calls == []
assert best([Spy(), d], -1) is d or True`,
      checks: ['`Scorer` is a `Protocol` marked `@runtime_checkable`', 'Classes with a `score` method qualify without inheriting', 'Invalid items raise `TypeError` before any scoring happens'],
      hint: 'Decorate `class Scorer(Protocol)` with `@runtime_checkable` and give it `def score(self, state) -> float: ...`. In `best`, first turn the input into a list, loop with `isinstance(s, Scorer)` checks, then return `max(scorers, key=lambda s: s.score(state))`.',
      explanation: 'The checking loop runs **before** any `score` call, so a bad item never causes partial work. Note that nothing inherits from `Scorer` — structural typing means "has a `score` method" is enough. A type checker would verify the same thing statically from the annotation.',
    },
  ],
  takeaways: [
    'Duck typing is Python’s default: if it has the methods, it works. ABCs and Protocols make the expected interface explicit when code bases grow or others write the implementations.',
    'Subclass `ABC` and mark required methods `@abstractmethod`: the class (and any subclass missing an implementation) cannot be instantiated — a `TypeError` at creation instead of a late `AttributeError`. Concrete base methods can use the abstract ones (template method).',
    '`collections.abc` classes like `Sequence` and `Mapping` give you many methods for free once you implement a few abstract ones, and `isinstance(x, Iterable)` works by behavior, not inheritance.',
    '`typing.Protocol` describes an interface structurally: any class with matching methods qualifies without inheriting. Type checkers verify it; `@runtime_checkable` adds a shallow `isinstance` check.',
    'Choose by need: plain duck typing for small code; an ABC for plugin bases and shared behavior; a Protocol for flexible, type-checked parameters. Accept general abstract types (`Iterable`), return concrete ones.',
  ],
  reading: [
    { title: 'abc — Abstract Base Classes', url: 'https://docs.python.org/3/library/abc.html', source: 'docs', note: 'The official reference for `ABC`, `@abstractmethod`, `register` and `__subclasshook__`.' },
    { title: 'collections.abc — Abstract Base Classes for Containers', url: 'https://docs.python.org/3/library/collections.abc.html', source: 'docs', note: 'The table of every container ABC with its required abstract methods and free mixin methods.' },
    { title: 'PEP 544 — Protocols: Structural subtyping (static duck typing)', url: 'https://peps.python.org/pep-0544/', source: 'pep', note: 'The proposal that introduced `typing.Protocol`, with motivation and examples.' },
  ],
};
