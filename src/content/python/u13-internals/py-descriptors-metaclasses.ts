import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-descriptors-metaclasses',
  title: 'Descriptors and Metaclasses',
  summary: 'The machinery behind `property`, bound methods, `dataclass` fields and class registries: descriptors (`__get__`, `__set__`, `__set_name__`), the attribute lookup order, classes as objects, `type(...)`, metaclasses, and the simpler `__init_subclass__` hook.',
  minutes: 20,
  objectives: [
    'Write a descriptor with `__get__`, `__set__` and `__set_name__` to reuse validation across attributes',
    'Explain why functions become bound methods, and state the attribute lookup order (data descriptor, instance dict, non-data descriptor)',
    'Build a cached (lazy) attribute with a non-data descriptor',
    'Explain that classes are objects created by `type`, and write a simple metaclass',
    'Choose `__init_subclass__` or a class decorator over a metaclass when you only need a registry or a check',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Descriptors: attributes that run code',
      blocks: [
        {
          type: 'p',
          text: 'In the Properties lesson you used `@property` to run code when an attribute is read or written. A property is one example of a more general mechanism: the **[[descriptor]]** protocol. An object stored as a *class attribute* becomes a descriptor if its class defines **`__get__(self, obj, objtype)`**, and optionally **`__set__(self, obj, value)`** and `__delete__`. When you read or assign that attribute **through an instance**, Python calls these methods instead of doing a plain dictionary lookup. A third hook, **`__set_name__(self, owner, name)`**, is called once when the class is created and tells the descriptor which attribute name it was assigned to.',
        },
        {
          type: 'code',
          title: 'positive_descriptor.py',
          runnable: true,
          code: `class Positive:
    def __set_name__(self, owner, name):
        self.name = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.name)

    def __set__(self, obj, value):
        if value <= 0:
            raise ValueError(f"{self.name[1:]} must be positive")
        setattr(obj, self.name, value)

class Item:
    price = Positive()
    qty = Positive()

    def __init__(self, price, qty):
        self.price = price
        self.qty = qty

it = Item(5, 2)
print(it.price, it.qty)
try:
    Item(-1, 1)
except ValueError as e:
    print(e)
it.price = 7
print(it.price, type(Item.price).__name__, it.__dict__)`,
          output: `5 2
price must be positive
7 Positive {'_price': 7, '_qty': 2}`,
          annotations: [
            { lines: '2-3', text: '`__set_name__` runs when `class Item` is created, once per descriptor: for `price` it receives `"price"`. The descriptor remembers a private name (`_price`) to store each instance’s value under.' },
            { lines: '5-8', text: '`__get__` runs on `it.price`. When the attribute is accessed on the **class** (`Item.price`), `obj` is `None` and the convention is to return the descriptor itself. Otherwise return the stored value.' },
            { lines: '10-13', text: '`__set__` runs on every assignment `it.price = ...`. Because it defines `__set__`, this is a **data descriptor**: it controls writing too, so the validation can’t be bypassed.' },
            { lines: '16-17', text: 'There is **one** `Positive` object per class attribute, shared by all instances, so it can’t keep per-instance data itself. It stores values on the instance, under `_price` and `_qty`.' },
            { lines: '20-21', text: 'Inside `__init__` the assignments go through `__set__`, so invalid values are rejected from the very beginning.' },
            { lines: '25-28', text: 'A negative price triggers the descriptor’s check: `price must be positive`.' },
            { lines: '29-30', text: 'The instance dictionary holds the hidden `_price` and `_qty`; `Item.price` on the class returns the descriptor object itself.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why descriptors?',
          text: 'With `@property` you write the validation once *per attribute*. A descriptor class lets you write it **once and reuse it** for many attributes and many classes (`price = Positive()`, `qty = Positive()`, `hp = Positive()`). It is the mechanism ORMs (Django, SQLAlchemy fields), `dataclasses` and attrs-style libraries use to attach behavior to attributes declaratively.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'property is a descriptor',
          text: '`property` is simply a built-in descriptor class implemented in C: `@property` creates an object with `__get__` (and `__set__` if you add a setter). `classmethod` and `staticmethod` are descriptors too, and so is every function — which is how methods get their `self`. You can see them in the class dictionary: `type(Temp.__dict__["c"])` shows `property`.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ has no direct equivalent. The nearest ideas are getter/setter member functions, proxy objects with overloaded `operator=`, and (for per-member behavior shared across classes) wrapper templates such as `Validated<int>`. A Python descriptor is a reusable "smart member" that the language wires up for you at the point of `obj.attr`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In `class Item: price = Positive()`, how many `Positive` objects exist for `price` after you create 1000 `Item` instances?',
      options: [
        { text: 'One — it is a class attribute shared by all instances', correct: true, why: 'The descriptor object is created once, when the class body runs. That is why per-instance values must be stored on the instance (or `obj`), not on the descriptor.' },
        { text: '1000 — each instance gets its own descriptor', why: 'Instances do not copy class attributes. The single descriptor is consulted for every instance, receiving the instance as `obj`.' },
        { text: '1001 — one per instance plus one for the class', why: 'There is only the single object stored in the class dictionary.' },
        { text: 'None — descriptors are created on demand when the attribute is read', why: 'The descriptor is created by the class body when the class is defined; `__get__` and `__set__` are just called later.' },
      ],
      explanation: 'The class body runs once, creating one `Positive` object per class attribute. Every instance shares it, so a descriptor must keep per-instance data on the instance (`obj`), not on `self`.',
    },
    {
      kind: 'concept',
      title: 'Functions are descriptors, and the lookup order',
      blocks: [
        {
          type: 'p',
          text: 'Here is a mystery you can now solve. A method is defined with `self` as its first parameter, but you call it without passing one. The reason: every **function** is a **non-data descriptor** — it has `__get__` but no `__set__`. When you access `d.speak` through an instance, `function.__get__(d, Dog)` returns a **bound method** that remembers `d` and supplies it as `self`. Accessed on the class, you get the plain function.',
        },
        {
          type: 'code',
          title: 'methods_and_lookup.py',
          runnable: true,
          code: `class Dog:
    def speak(self):
        return "woof"

d = Dog()
print(type(Dog.speak).__name__, type(d.speak).__name__)
m = d.speak
print(m.__self__ is d, m.__func__ is Dog.speak)
print(Dog.speak.__get__(d)())

class NonData:
    def __get__(self, obj, owner):
        return "from descriptor"

class Data(NonData):
    def __set__(self, obj, value):
        pass

class A:
    n = NonData()
    d = Data()

a = A()
a.__dict__["n"] = "instance"
a.__dict__["d"] = "instance"
print(a.n, a.d)`,
          output: `function method
True True
woof
instance from descriptor`,
          annotations: [
            { lines: 6, text: 'On the class, `speak` is an ordinary function. Through an instance, the descriptor protocol produces a **bound method**.' },
            { lines: '7-8', text: 'The bound method stores the instance (`__self__`) and the underlying function (`__func__`) and passes the instance as the first argument when called.' },
            { lines: 9, text: '`Dog.speak.__get__(d)` does by hand what `d.speak` does automatically; calling the result runs the method.' },
            { lines: '11-13', text: 'A **non-data** descriptor defines only `__get__`.' },
            { lines: '15-17', text: 'Adding `__set__` makes it a **data** descriptor.' },
            { lines: '24-25', text: 'We put values with the same names straight into the instance dictionary, bypassing normal assignment.' },
            { lines: 26, text: 'Result: `a.n` returns the **instance** value (the instance wins over a non-data descriptor), but `a.d` still calls the **descriptor** (a data descriptor wins over the instance dictionary).' },
          ],
        },
        {
          type: 'p',
          text: 'That experiment is the whole **attribute lookup order** for `obj.name`: (1) a **data descriptor** found on the class (or its bases) wins; (2) otherwise a value in the **instance `__dict__`**; (3) otherwise a **non-data descriptor** or plain attribute found on the class; (4) otherwise `__getattr__` if defined, else `AttributeError`. The order explains a classic pattern: a **cached attribute** is a non-data descriptor that computes a value once and stores it in the instance dictionary, where it shadows the descriptor from then on.',
        },
        {
          type: 'code',
          title: 'lazy_attribute.py',
          runnable: true,
          code: `class Lazy:
    def __init__(self, func):
        self.func = func
        self.name = func.__name__

    def __set_name__(self, owner, name):
        self.name = name

    def __get__(self, obj, owner=None):
        if obj is None:
            return self
        value = self.func(obj)
        obj.__dict__[self.name] = value
        return value

calls = []

class Level:
    @Lazy
    def tiles(self):
        calls.append("computed")
        return [1, 2, 3]

lv = Level()
print(lv.tiles, lv.tiles, calls)`,
          output: `[1, 2, 3] [1, 2, 3] ['computed']`,
          annotations: [
            { lines: '1-4', text: '`Lazy` is a **decorator class** (previous unit): `@Lazy` calls `Lazy(tiles_function)`, so `__init__` receives the function.' },
            { lines: '9-14', text: 'It defines only `__get__` — a non-data descriptor. On the first access it calls the function, then stores the result in the instance dictionary under the same name.' },
            { lines: '13-14', text: 'Writing into `obj.__dict__` is the key trick: on later accesses Python finds the instance value first, so `__get__` never runs again (see the lookup order).' },
            { lines: '19-22', text: 'An expensive computation, such as loading or generating level data, written as an ordinary method.' },
            { lines: 25, text: 'The list is available twice but computed **once**: `calls` contains one entry. The standard library packages this idea as `functools.cached_property`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Use the standard tools first',
          text: 'Before writing a descriptor, check whether `@property`, `functools.cached_property`, `dataclasses.field` or `__slots__` already does the job. Reach for a custom descriptor when the *same* get/set logic must be reused across several attributes or classes — validation, unit conversion, lazy loading, database fields.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Descriptors in AI libraries',
          text: 'PyTorch’s `nn.Module` uses `__setattr__` and `__getattr__` (a related hook) to notice when you assign an `nn.Parameter` or sub-module, so that `model.parameters()` can find every weight automatically. ORMs and data-validation libraries (Django models, SQLAlchemy, Pydantic) use descriptors and metaclasses so that `class Player: hp = IntegerField()` turns plain-looking class attributes into managed fields.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A descriptor that defines only `__get__` takes priority over an attribute with the same name stored in the instance’s `__dict__`.',
      answer: false,
      explanation: 'False. Only a **data** descriptor (one that also defines `__set__` or `__delete__`) beats the instance dictionary. A descriptor with just `__get__` is a non-data descriptor, and an instance value shadows it — which is exactly how cached attributes work.',
    },
    {
      kind: 'concept',
      title: 'Classes are objects: type and metaclasses',
      blocks: [
        {
          type: 'p',
          text: 'In Python even **classes are objects**. A class is created at run time when the `class` statement executes, and it is an instance of its **[[metaclass]]** — by default `type`. `type` has a second, little-known job: `type(name, bases, namespace)` builds a class directly, which is exactly what the `class` statement does after running its body. A custom metaclass is a subclass of `type` that takes part in that creation: its `__new__` or `__init__` sees every class created with `metaclass=...` (and every subclass of such classes), and its `__call__` controls what happens when you *call the class* to make an instance.',
        },
        {
          type: 'code',
          title: 'type_and_metaclass.py',
          runnable: true,
          code: `Point = type("Point", (), {"x": 0, "hello": lambda self: "hi"})
p = Point()
print(Point.__name__, p.x, p.hello(), type(Point).__name__, type(type).__name__)

class RegistryMeta(type):
    registry = {}

    def __new__(mcls, name, bases, ns):
        cls = super().__new__(mcls, name, bases, ns)
        if bases:
            mcls.registry[name] = cls
        return cls

class Plugin(metaclass=RegistryMeta):
    pass

class Alpha(Plugin):
    pass

class Beta(Plugin):
    pass

print(sorted(RegistryMeta.registry), type(Alpha).__name__)`,
          output: `Point 0 hi type type
['Alpha', 'Beta'] RegistryMeta`,
          annotations: [
            { lines: 1, text: '`type(name, bases, namespace)` creates a class on the fly — the name, a tuple of base classes and a dictionary of attributes. No `class` statement needed.' },
            { lines: 3, text: 'Classes are instances of `type` (`type(Point)` is `type`), and `type` is an instance of itself. The chain ends there.' },
            { lines: '5-12', text: 'A metaclass subclasses `type`. Its `__new__` runs each time a class statement using it executes, receiving the class name, bases and the namespace dictionary the body produced.' },
            { lines: 9, text: '`super().__new__(...)` actually builds the class, as `type` always does.' },
            { lines: '10-11', text: 'Register every class that has base classes, skipping the root `Plugin` itself (its `bases` tuple is empty).' },
            { lines: 14, text: 'The `metaclass=` keyword chooses the metaclass. Subclasses inherit it automatically.' },
            { lines: '17-21', text: 'Defining `Alpha` and `Beta` runs `RegistryMeta.__new__` — no explicit registration anywhere.' },
            { lines: 23, text: 'Both plugins registered themselves, and `type(Alpha)` is `RegistryMeta`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does this exist?',
          text: 'Frameworks need to react to the *definition* of classes: collect fields into a schema, register plugins, enforce that subclasses implement something. `abc.ABC` uses a metaclass (`ABCMeta`) to forbid instantiating classes with abstract methods, and `enum.Enum` uses one (`EnumType`) to turn class attributes into members. You use metaclasses all the time; you rarely need to write one.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Metaclasses are a last resort',
          text: 'Python core developers have long joked that metaclasses are "deeper magic than 99% of users should ever worry about". They are hard to read and debug, and two classes with *different* custom metaclasses can’t be combined without a conflict. If a simpler tool does the job, use it: a **class decorator**, `__init_subclass__` (next step), or a plain factory function.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'The order of events',
          text: 'When Python runs `class A(Base, metaclass=Meta): body`: (1) it picks the metaclass (explicit, else the most derived metaclass of the bases, else `type`), (2) it calls `Meta.__prepare__` to get the namespace, (3) runs the body in that namespace, (4) calls `Meta(name, bases, namespace)`, which runs `__new__` then `__init__`, and (5) binds the result to the name `A`. Instances are created later by `Meta.__call__`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete this descriptor so that reading `obj.name` returns the stored string in upper case, and the descriptor object itself is returned when accessed on the class.',
      template: `class Upper:
    def __get__(self, obj, objtype=None):
        if obj is None:
            return ___
        return obj.__dict__["name"].upper()

    def ___(self, obj, value):
        obj.__dict__["name"] = value`,
      templateIsCode: true,
      blanks: [{ answers: ['self'] }, { answers: ['__set__'] }],
      wordBank: ['self', '__set__', '__get__', 'obj', 'None'],
      explanation: 'When there is no instance (`obj is None`, i.e. access on the class), the convention is to return the descriptor itself (`self`). Writing is handled by `__set__`, whose presence also makes this a *data* descriptor that takes priority over the instance dictionary.',
    },
    {
      kind: 'concept',
      title: 'Simpler tools: __init_subclass__, class decorators and __call__',
      blocks: [
        {
          type: 'p',
          text: 'Most jobs that used to need a metaclass are now handled by **`__init_subclass__`**, a hook (PEP 487) that Python calls on a base class every time a subclass is defined — no metaclass required. Extra keyword arguments in the class statement (`class A(Base, name="x")`) are passed to it. Use a metaclass only for what the hook can’t do, such as controlling the namespace or customizing how the class is **called**, like the classic Singleton below.',
        },
        {
          type: 'code',
          title: 'init_subclass_and_singleton.py',
          runnable: true,
          code: `class Base:
    registry = []

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        Base.registry.append(cls.__name__)

class X(Base):
    pass

class Y(Base):
    pass

print(Base.registry)

class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class Config(metaclass=Singleton):
    pass

print(Config() is Config())`,
          output: `['X', 'Y']
True`,
          annotations: [
            { lines: '4-6', text: '`__init_subclass__` is called on the *base* class for every new subclass (`cls` is the new subclass). Always call `super().__init_subclass__(**kwargs)` so cooperating bases work.' },
            { lines: '8-12', text: 'Merely defining `X` and `Y` registers them. No metaclass, no decorator, and the code reads like an ordinary method.' },
            { lines: 14, text: 'Both subclasses registered: the same result as the metaclass registry in the previous step, with far less machinery.' },
            { lines: '16-22', text: 'A metaclass `__call__` runs when you **call the class** (`Config()`). Here it creates the instance the first time and returns the stored one afterwards.' },
            { lines: 27, text: 'Both calls return the very same object. (Many Python programmers prefer a module-level instance to a Singleton class — the module itself is already a singleton.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Ladder of simplicity',
          text: 'Need to change one attribute? Use `@property`. Reuse the same attribute logic? A **descriptor**. React to subclass definition? **`__init_subclass__`**. Modify one finished class? A **class decorator**. Control class creation itself or class calls? Only then, a **metaclass**. Always take the lowest rung that solves the problem.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'A plugin system for a game',
          text: 'A `Behavior` base class with `__init_subclass__(cls, name=None)` can register every AI behavior (`class Flee(Behavior, name="flee")`) in a dictionary, so level files can say `"behavior": "flee"` and the engine looks the class up by name. Modders add new behaviors by writing a subclass — no central list to edit.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What methods make an object a data descriptor?" (`__get__` plus `__set__` or `__delete__`); "What is the lookup order for `obj.attr`?" (data descriptor, instance dict, non-data descriptor/class attribute, `__getattr__`); "What is the type of a class?" (`type`, or its metaclass); "How do you register subclasses without a metaclass?" (`__init_subclass__`).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. `Lazy` defines only `__get__`. What does the assignment `a.x = 7` do?',
      code: `log = []

class Lazy:
    def __get__(self, obj, owner=None):
        log.append("get")
        return 42

class A:
    x = Lazy()

a = A()
log.append(a.x)
a.x = 7
log.append(a.x)
print(log)`,
      answer: "['get', 42, 7]",
      hint: 'With no `__set__`, assignment stores the value in the instance dictionary. Which wins afterwards?',
      explanation: 'The first read calls `__get__` (logging "get") and returns 42. `a.x = 7` is a plain assignment — `Lazy` has no `__set__`, so the value goes into `a.__dict__`. The second read finds the instance value first (a non-data descriptor loses to the instance dictionary), so `__get__` is not called again and 7 is logged.',
    },
    {
      kind: 'error',
      prompt: 'Defining the class `A` raises a `TypeError`. Tap the faulty line.',
      lines: [
        'class Meta(type):',
        '    def __new__(cls, name, bases, ns):',
        '        return super().__new__(name, bases, ns)',
        'class A(metaclass=Meta):',
        '    pass',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`__new__` is a static method that needs the class as its first argument, and `super().__new__` isn’t bound to it automatically: write `super().__new__(cls, name, bases, ns)`. Without `cls`, `type.__new__` receives the *name string* where it expects a metaclass.',
    },
    {
      kind: 'numeric',
      prompt: 'How many classes does `registry` contain at the end?\n\n`registry = []`\n`class Base:`\n`    def __init_subclass__(cls, **kw):`\n`        super().__init_subclass__(**kw)`\n`        registry.append(cls)`\n`class A(Base): pass`\n`class B(A): pass`\n`class C(Base): pass`\n`print(len(registry))`',
      answer: '3',
      hint: '`__init_subclass__` is inherited: it runs for *indirect* subclasses too.',
      explanation: 'The hook fires for every class that inherits from `Base`, directly or indirectly: `A`, then `B` (a subclass of `A`, which inherits the hook), then `C`. `Base` itself isn’t registered because it isn’t its own subclass. So 3.',
      label: 'Length:',
    },
    {
      kind: 'code',
      prompt: 'Write a **data descriptor** class `Typed(expected_type)`. Assigning a value that is not an instance of `expected_type` must raise `TypeError("<attribute> must be <type name>")`, for example `TypeError("hp must be int")`. Use `__set_name__` so that the descriptor knows its attribute name, store each instance’s value on the instance, and return the descriptor itself when accessed on the class.',
      starter: `class Typed:
    ...
`,
      solution: `class Typed:
    def __init__(self, expected_type):
        self.expected_type = expected_type

    def __set_name__(self, owner, name):
        self.public = name
        self.private = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        if not isinstance(value, self.expected_type):
            raise TypeError(f"{self.public} must be {self.expected_type.__name__}")
        setattr(obj, self.private, value)
`,
      tests: `class Player:
    hp = Typed(int)
    name = Typed(str)

    def __init__(self, name, hp):
        self.name = name
        self.hp = hp

p = Player("ann", 10)
assert (p.name, p.hp) == ("ann", 10)
q = Player("bob", 5)
assert p.hp == 10 and q.hp == 5
p.hp = 12
assert p.hp == 12 and q.hp == 5

for attr, bad, msg in (("hp", "x", "hp must be int"), ("name", 3, "name must be str")):
    try:
        setattr(p, attr, bad)
        assert False, "must raise TypeError"
    except TypeError as e:
        assert str(e) == msg
assert p.hp == 12 and p.name == "ann"

try:
    Player(1, 2)
    assert False, "must raise TypeError"
except TypeError as e:
    assert str(e) == "name must be str"

assert isinstance(Player.hp, Typed)`,
      checks: ['Defines \`__set_name__\`, \`__get__\` and \`__set__\`', 'Raises \`TypeError("<name> must be <type>")\` for wrong types and keeps the old value', 'Per-instance storage; the class-level access returns the descriptor'],
      hint: 'In `__set_name__` save the public name and a private name such as `"_" + name`. In `__set__` check `isinstance(value, self.expected_type)` before `setattr(obj, self.private, value)`. In `__get__` return `self` if `obj is None`.',
      explanation: 'One class now validates any attribute of any class: `hp = Typed(int)`, `name = Typed(str)`. The values live on each instance under hidden names, so instances never interfere; failed assignments raise before touching the stored value, which is why `p.hp` is still 12 after the failed attempt.',
    },
    {
      kind: 'code',
      prompt: 'Write a data descriptor `Clamped(low, high)` that forces every assigned value into the range `low..high` (values below `low` become `low`, values above `high` become `high`). Each instance keeps its own value, and the descriptor must work for several attributes in the same class.',
      starter: `class Clamped:
    ...
`,
      solution: `class Clamped:
    def __init__(self, low, high):
        self.low = low
        self.high = high

    def __set_name__(self, owner, name):
        self.private = "_" + name

    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private)

    def __set__(self, obj, value):
        setattr(obj, self.private, max(self.low, min(self.high, value)))
`,
      tests: `class Unit:
    hp = Clamped(0, 100)
    mana = Clamped(0, 10)

    def __init__(self, hp, mana):
        self.hp = hp
        self.mana = mana

u = Unit(150, -3)
assert (u.hp, u.mana) == (100, 0)
u.hp = 40
u.mana = 7.5
assert (u.hp, u.mana) == (40, 7.5)
u.hp -= 100
assert u.hp == 0
u.mana += 99
assert u.mana == 10

v = Unit(50, 5)
assert (v.hp, v.mana) == (50, 5)
assert (u.hp, u.mana) == (0, 10)
assert isinstance(Unit.hp, Clamped) and Unit.hp is not Unit.mana`,
      checks: ['Clamps assigned values into \`low..high\`', 'Separate values per instance and per attribute (uses \`__set_name__\`)', 'Works with \`+=\` and \`-=\` (they read, then assign)'],
      hint: 'Store the clamped value with `setattr(obj, self.private, max(self.low, min(self.high, value)))`, where `self.private` is `"_" + name` from `__set_name__`. Return `self` from `__get__` when `obj is None`.',
      explanation: 'Augmented assignment `u.hp -= 100` is read (`__get__`), subtract, write (`__set__`) — so it is clamped like any assignment. `max(low, min(high, value))` is the standard clamp idiom, very common in game code for health, volume and positions.',
    },
    {
      kind: 'code',
      prompt: 'Write a base class `Command` that registers its subclasses in the class-level dictionary `Command.registry` using **`__init_subclass__`**. The key is the optional class keyword `name` (`class Attack(Command, name="hit")`) or, if absent, the lower-cased class name. The value is the subclass. Subclasses of subclasses must register as well.',
      starter: `class Command:
    registry = {}
`,
      solution: `class Command:
    registry = {}

    def __init_subclass__(cls, name=None, **kwargs):
        super().__init_subclass__(**kwargs)
        Command.registry[name or cls.__name__.lower()] = cls
`,
      tests: `class Attack(Command, name="hit"):
    pass

class Defend(Command):
    pass

class Heal(Command, name="heal"):
    pass

assert Command.registry == {"hit": Attack, "defend": Defend, "heal": Heal}
assert Command.registry["hit"] is Attack

class Fireball(Attack):
    pass

assert Command.registry["fireball"] is Fireball
assert "command" not in Command.registry
assert len(Command.registry) == 4`,
      checks: ['Uses \`__init_subclass__(cls, name=None, **kwargs)\`', 'Key is \`name\` if given, else \`cls.__name__.lower()\`; value is the class', 'Calls \`super().__init_subclass__(**kwargs)\`; indirect subclasses register too'],
      hint: 'Define `__init_subclass__(cls, name=None, **kwargs)`. Call `super().__init_subclass__(**kwargs)`, then store `cls` in `Command.registry` under `name or cls.__name__.lower()`.',
      explanation: 'Python calls `__init_subclass__` on the parent for each new subclass and passes class keyword arguments to it. Because the hook is inherited, `Fireball(Attack)` registers too. This replaces what used to need a metaclass — a plugin registry in five lines.',
    },
  ],
  takeaways: [
    'A **descriptor** is a class attribute whose class defines `__get__` (and optionally `__set__`/`__delete__`). `__set_name__` tells it its attribute name. One descriptor object is shared by all instances, so store per-instance data on the instance.',
    '`property`, `classmethod`, `staticmethod` and **functions** are descriptors. A function’s `__get__` produces the bound method that supplies `self`.',
    'Lookup order for `obj.name`: data descriptor, then instance `__dict__`, then non-data descriptor or class attribute, then `__getattr__`. Cached attributes rely on a non-data descriptor storing into the instance dictionary.',
    'Classes are objects: `type(name, bases, namespace)` creates one, and a class is an instance of its **metaclass** (`type` by default). `ABC` and `Enum` use metaclasses.',
    'Prefer the simplest tool: property, descriptor, `__init_subclass__`, class decorator, and only then a metaclass (for example to control calling the class).',
  ],
  reading: [
    { title: 'Descriptor HowTo Guide', url: 'https://docs.python.org/3/howto/descriptor.html', source: 'docs', note: 'The definitive guide by Raymond Hettinger, including how property, methods and `__slots__` are built from descriptors.' },
    { title: 'Data model — Customizing class creation', url: 'https://docs.python.org/3/reference/datamodel.html#customizing-class-creation', source: 'docs', note: 'Exact rules for metaclasses, `__prepare__`, `__init_subclass__` and `__set_name__`.' },
    { title: 'PEP 487 — Simpler customisation of class creation', url: 'https://peps.python.org/pep-0487/', source: 'pep', note: 'Why `__init_subclass__` and `__set_name__` were added, replacing most metaclass use.' },
    { title: 'Python Metaclasses', url: 'https://realpython.com/python-metaclasses/', source: 'article', note: 'A gentle, example-driven tutorial on `type`, metaclasses and when to avoid them.' },
  ],
};
