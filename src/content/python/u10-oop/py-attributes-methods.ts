import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-attributes-methods',
  title: 'Attributes, Methods and Encapsulation',
  summary: 'Instance, class and static methods and when each fits; the underscore conventions and name mangling that replace `private`; reading and writing attributes by name with `getattr`/`setattr`; composition ("has-a") and `__slots__`.',
  minutes: 20,
  objectives: [
    'Choose between instance methods, `@classmethod` and `@staticmethod`, and write alternative constructors',
    'Explain Python’s privacy conventions: `_internal`, `__mangled` and why nothing is truly private',
    'Read, write, test and delete attributes dynamically with `getattr`, `setattr`, `hasattr`, `delattr` and `vars`',
    'Build objects out of other objects (composition) and return `self` to chain calls',
    'Describe what `__slots__` and `__getattr__` do and when they are worth using',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Three kinds of methods',
      blocks: [
        {
          type: 'p',
          text: 'Methods come in three flavors, distinguished by what they receive as their first argument. An **instance method** gets the object (`self`). A **`@classmethod`** gets the *class* (`cls`) — perfect for **alternative constructors** such as `Item.from_string(...)` and for changing class-level settings. A **`@staticmethod`** gets *nothing* extra: it is an ordinary function that lives in the class’s namespace because it belongs to the topic.',
        },
        {
          type: 'code',
          title: 'method_kinds.py',
          runnable: true,
          code: `class Item:
    tax = 0.1

    def __init__(self, name, price):
        self.name = name
        self.price = price

    def total(self):
        return round(self.price * (1 + self.tax), 2)

    @classmethod
    def from_string(cls, text):
        name, price = text.split(":")
        return cls(name, float(price))

    @classmethod
    def set_tax(cls, rate):
        cls.tax = rate

    @staticmethod
    def is_valid_price(p):
        return p >= 0

class Gem(Item):
    tax = 0.25

sword = Item("sword", 100)
potion = Item.from_string("potion:20")
print(sword.total(), potion.name, potion.price)
gem = Gem.from_string("ruby:40")
print(type(gem).__name__, gem.total())
print(Item.is_valid_price(-1), sword.is_valid_price(5))
Item.set_tax(0.2)
print(sword.total(), gem.total(), Item.tax, Gem.tax)
print(type(Item.from_string).__name__, type(Item.is_valid_price).__name__, type(Item.total).__name__)
print(Item.from_string.__self__ is Item)`,
          output: `110.0 potion 20.0
Gem 50.0
False True
120.0 50.0 0.2 0.25
method function function
True`,
          annotations: [
            { lines: 8, text: 'An ordinary **instance method**: it needs a particular item’s `name`, `price` and the class-level `tax`.' },
            { lines: '11-14', text: '`@classmethod` receives the class as `cls`. Because it builds the object with `cls(...)` rather than the hard-coded name `Item(...)`, it works for subclasses too.' },
            { lines: '16-18', text: 'A class method can change **class-level** state. `cls.tax = rate` updates the shared attribute.' },
            { lines: '20-22', text: '`@staticmethod` takes no `self` or `cls`. It uses nothing from the class or an instance — it is a plain function grouped with the class for tidiness.' },
            { lines: '24-25', text: 'A tiny preview of **inheritance** (next lessons): `Gem` is an `Item` with its own `tax`. Everything else is inherited.' },
            { lines: 28, text: 'The alternative constructor builds an `Item` from `"potion:20"`. The tax is 10%, so the sword (100) totals 110.0.' },
            { lines: '30-31', text: '`Gem.from_string(...)` passes `Gem` as `cls`, so it returns a **`Gem`**, not an `Item`, and uses the Gem tax of 25%: 40 × 1.25 = 50.0. A hard-coded `Item(...)` would have broken this.' },
            { lines: 32, text: 'Static methods can be called through the class or an instance; either way nothing is passed implicitly.' },
            { lines: 33, text: '`Item.set_tax(0.2)` changes `Item.tax`; `Gem` has its own `tax` and keeps 0.25, so the sword now costs 120.0 and the gem is unchanged at 50.0.' },
            { lines: 35, text: 'Looking at the types: accessing a classmethod gives a **bound** method (already holding the class); a staticmethod and a function accessed through the *class* are plain functions.' },
            { lines: 36, text: 'The bound class method remembers its class in `__self__`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Python has no constructor overloading — use classmethods',
          text: 'C++ lets you write several constructors with different parameters. Python has one `__init__`, so alternative ways to build an object become named class methods: `Color.from_hex("#ff8800")`, `Vec.from_polar(r, angle)`, `Board.from_file(path)`. They are self-documenting and subclass-friendly. The standard library does this everywhere: `dict.fromkeys`, `datetime.fromisoformat`, `int.from_bytes`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Which one do I use?',
          text: 'Needs the instance’s data → instance method. Needs the class (to construct, or to touch class-level state) → `@classmethod`. Needs neither → ask whether it should be a module-level function instead; use `@staticmethod` only when keeping it inside the class genuinely helps readers find it.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You want `Player.from_json(text)` to build a `Player` from a JSON string, and it should still return the right type when called on a subclass such as `Wizard`. What is the best definition?',
      options: [
        { text: 'A `@classmethod` that ends with `return cls(...)`', correct: true, why: 'Right: `cls` is whichever class the method was called on, so `Wizard.from_json(...)` builds a `Wizard`.' },
        { text: 'A `@staticmethod` that ends with `return Player(...)`', why: 'It works for `Player`, but the class name is hard-coded, so `Wizard.from_json(...)` would still return a plain `Player`.' },
        { text: 'An ordinary instance method that takes `self` and `text`', why: 'You would need an existing player to call it on — a chicken-and-egg problem for a constructor.' },
        { text: 'A second `__init__` that takes the text', why: 'A class gets exactly one `__init__`; defining another simply replaces the first.' },
      ],
      explanation: 'Alternative constructors are the textbook use of `@classmethod`. Using `cls(...)` instead of the class name keeps them correct for subclasses.',
    },
    {
      kind: 'concept',
      title: 'Privacy by convention: _internal and __mangled',
      blocks: [
        {
          type: 'p',
          text: 'Python has **no `private` keyword**. Instead there are conventions. A single leading underscore (`_balance`) says "this is an internal detail — use at your own risk". A *double* leading underscore (`__pin`) triggers **name mangling**: inside the class body Python silently renames it to `_ClassName__pin`. That is meant to avoid accidental name clashes in subclasses, not to keep secrets.',
        },
        {
          type: 'code',
          title: 'privacy.py',
          runnable: true,
          code: `class Account:
    def __init__(self, owner, balance):
        self.owner = owner
        self._balance = balance
        self.__pin = 1234

    def check(self, pin):
        return pin == self.__pin

a = Account("Ada", 50)
print(a._balance)
print(sorted(a.__dict__))
try:
    a.__pin
except AttributeError as e:
    print(e)
print(a._Account__pin, a.check(1234), a.check(1))`,
          output: `50
['_Account__pin', '_balance', 'owner']
'Account' object has no attribute '__pin'
1234 True False`,
          annotations: [
            { lines: 4, text: '`_balance`: a single underscore. Python treats it exactly like any other attribute; the underscore is only a signal to humans and tools that it is internal.' },
            { lines: 5, text: '`__pin` (two underscores, no trailing underscores) is **mangled** at compile time to `_Account__pin`.' },
            { lines: '7-8', text: 'Inside the class, `self.__pin` is rewritten the same way, so the method finds it.' },
            { lines: 11, text: 'Outside code *can* read `_balance`; nothing stops it. The convention is "you were warned".' },
            { lines: 12, text: 'The instance dictionary shows the truth: the mangled name `_Account__pin` is stored, not `__pin`.' },
            { lines: '13-16', text: 'Plain `a.__pin` fails because no attribute has that name — but this is obfuscation, not security.' },
            { lines: 17, text: 'Anyone can still reach it as `a._Account__pin`. Python’s stance: "we are all consenting adults here."' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'No private, no protected',
          text: 'In C++, `private` is enforced by the compiler. In Python, `_x` is the rough equivalent of `protected`/internal and is enforced only by politeness; `__x` is for avoiding collisions in class hierarchies. If you truly need to guard a value (validate on assignment), use a **property** — the subject of a later lesson — rather than hoping callers behave. And never rely on privacy for security: secrets belong outside the object.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does Python work this way?',
          text: 'Python’s designers favored flexibility and trust: debuggers, test code and serialization libraries can inspect everything, and you can fix a library’s bug by reaching into its internals when you must. The underscore convention is enforced socially — linters flag access to `_names` from outside, and anything beginning with an underscore is understood to be free to change without notice, so it is not part of a library’s public API.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If an attribute is named `_balance` (single leading underscore), Python raises an `AttributeError` when code outside the class reads `account._balance`.',
      answer: false,
      explanation: 'False. A single underscore is only a convention: the attribute is perfectly accessible. Only name mangling (`__name`) changes the stored name — and even that can be bypassed with `obj._Class__name`.',
    },
    {
      kind: 'concept',
      title: 'Attributes by name: getattr, setattr and friends',
      blocks: [
        {
          type: 'p',
          text: 'Since attributes are just entries in a dictionary, Python lets you work with them *by name held in a string*: `getattr(obj, "hp")` is `obj.hp`, `setattr(obj, "hp", 5)` is `obj.hp = 5`. This is how serializers, config loaders, save systems and game-modding hooks work generically. `hasattr` tests for existence, `delattr` removes, and `vars(obj)` returns the instance’s `__dict__`.',
        },
        {
          type: 'code',
          title: 'dynamic_access.py',
          runnable: true,
          code: `class Stats:
    def __init__(self):
        self.hp = 10
        self.mp = 5

s = Stats()
print(getattr(s, "hp"), getattr(s, "xp", 0), hasattr(s, "mp"), hasattr(s, "xp"))
setattr(s, "xp", 7)
print(vars(s))
delattr(s, "mp")
print(sorted(vars(s)))
for name in ("hp", "xp"):
    setattr(s, name, getattr(s, name) + 1)
print(s.hp, s.xp)
data = {"hp": 99, "mp": 1}
for k, v in data.items():
    setattr(s, k, v)
print(sorted(vars(s).items()))`,
          output: `10 0 True False
{'hp': 10, 'mp': 5, 'xp': 7}
['hp', 'xp']
11 8
[('hp', 99), ('mp', 1), ('xp', 8)]`,
          annotations: [
            { lines: 7, text: '`getattr(obj, name, default)` returns the default instead of raising `AttributeError` when the attribute is missing — here `xp` does not exist yet, so we get 0. `hasattr` answers yes/no.' },
            { lines: '8-9', text: '`setattr(s, "xp", 7)` creates the attribute dynamically. `vars(s)` shows the instance dictionary.' },
            { lines: '10-11', text: '`delattr` removes an attribute (like `del s.mp`).' },
            { lines: '12-13', text: 'The attribute name can come from a variable, so one loop can update many attributes.' },
            { lines: '15-17', text: 'Loading settings from a dictionary (parsed JSON, a save file, a config) onto an object is the most common real use of `setattr`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Be careful with names you did not choose',
          text: '`setattr(obj, name, value)` with a name taken from user input or a file can overwrite things you did not mean to expose — even a method name. Validate against an allow-list of expected names (as in the Config exercise below) before applying external data to an object.',
        },
        {
          type: 'code',
          title: 'getattr_hook.py',
          runnable: true,
          code: `class Lazy:
    def __getattr__(self, name):
        return f"<{name}?>"

lz = Lazy()
lz.real = 1
print(lz.real, lz.missing)`,
          output: `1 <missing?>`,
          annotations: [
            { lines: '2-3', text: '`__getattr__` is a hook Python calls **only when normal lookup fails**. It powers proxies, lazy attributes and "dynamic" objects.' },
            { lines: 6, text: 'A normal assignment creates a real attribute.' },
            { lines: 7, text: '`lz.real` is found normally (the hook is not called); `lz.missing` is not found, so the hook supplies a value.' },
          ],
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Which class does each `bump()` change?',
      code: `class A:
    n = 0
    @classmethod
    def bump(cls):
        cls.n += 1

class B(A):
    pass

B.bump(); B.bump(); A.bump()
print(A.n, B.n)`,
      answer: '1 2',
      hint: '`cls.n += 1` reads `cls.n` and then *assigns* `cls.n` — on which class?',
      explanation: '`B.bump()` passes `B` as `cls`. The first call reads the inherited `n` (0) and **assigns** `B.n = 1`, creating a separate attribute on `B`; the second makes it 2. `A.bump()` then changes only `A.n` to 1. So `A.n` is 1 and `B.n` is 2. This is the same shadowing rule as for instances — assignment goes to the object you named.',
    },
    {
      kind: 'concept',
      title: 'Objects made of objects (composition) and __slots__',
      blocks: [
        {
          type: 'p',
          text: 'Real programs build objects from other objects: a `Hero` **has an** `Inventory`; a `Car` has an `Engine`. This is **[[composition]]**, and it is usually simpler and more flexible than inheritance (which models "is a"). Methods that end with `return self` allow *chaining*: `hero.pick_up("key").pick_up("map")`. A second tool, **`__slots__`**, trades flexibility for memory: it fixes the set of attributes an instance may have and removes the per-instance dictionary.',
        },
        {
          type: 'code',
          title: 'composition.py',
          runnable: true,
          code: `class Inventory:
    def __init__(self):
        self.items = {}
    def add(self, n, q=1):
        self.items[n] = self.items.get(n, 0) + q

class Hero:
    def __init__(self, name):
        self.name = name
        self.inventory = Inventory()
    def pick_up(self, item):
        self.inventory.add(item)
        return self

h = Hero("Ada").pick_up("key").pick_up("key").pick_up("map")
print(h.inventory.items)`,
          output: `{'key': 2, 'map': 1}`,
          annotations: [
            { lines: 10, text: 'The `Hero` **owns** an `Inventory`, created fresh in `__init__` so every hero has their own. The hero delegates inventory work to it instead of re-implementing it.' },
            { lines: '11-13', text: '`return self` lets calls be chained. The pick-up method does its work and hands the hero back.' },
            { lines: 15, text: 'Each call returns the same hero, so the three calls form one expression. Chaining is a style choice — popular in builders, but never required.' },
          ],
        },
        {
          type: 'code',
          title: 'slots.py',
          runnable: true,
          code: `class Slim:
    __slots__ = ("x", "y")
    def __init__(self, x, y):
        self.x, self.y = x, y

p = Slim(1, 2)
try:
    p.z = 3
except AttributeError as e:
    print(type(e).__name__)
print(hasattr(p, "__dict__"))`,
          output: `AttributeError
False`,
          annotations: [
            { lines: 2, text: '`__slots__` lists the only attribute names instances may have. Python then stores them in a compact fixed layout instead of a dictionary.' },
            { lines: '7-10', text: 'Assigning a name not in `__slots__` fails, which also catches typos like `p.zz = 3`.' },
            { lines: 11, text: 'There is no `__dict__` any more. This saves memory — useful when you create hundreds of thousands of small objects, such as particles or grid cells.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer "has-a" over "is-a" by default',
          text: 'A frequent beginner mistake is `class Player(Inventory)` just to reuse `add`. A player *isn’t* an inventory; it *has* one. Composition keeps each class small and replaceable (swap the `Inventory` for a `LimitedInventory` without touching `Hero`) and avoids tangled hierarchies. Inheritance, covered next, is best for true specializations.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Where `__slots__` really helps',
          text: 'Each ordinary instance carries a dictionary (hundreds of bytes). For millions of tiny objects `__slots__` can cut memory dramatically and speed up attribute access slightly. The cost: no dynamic attributes, and care is needed with inheritance and weak references. Measure before using it — for ordinary classes it is a premature optimization.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the alternative constructor so that `Temp.zero()` returns a new `Temp(0)` — and works for subclasses too.',
      template: `class Temp:
    def __init__(self, degrees):
        self.degrees = degrees

    @___
    def zero(___):
        return ___(0)`,
      templateIsCode: true,
      blanks: [{ answers: ['classmethod'] }, { answers: ['cls'] }, { answers: ['cls'] }],
      wordBank: ['classmethod', 'staticmethod', 'cls', 'self'],
      explanation: 'A `@classmethod` receives the class as its first parameter (`cls`), and `cls(0)` constructs an instance of whichever class it was called on. A `@staticmethod` would have no class to build from, and `self` does not exist yet — no instance has been made.',
    },
    {
      kind: 'order',
      prompt: 'Put these lines in order to define a class `Point` with a class method `from_pair` that turns a pair like `(3, 4)` into a point.',
      lines: [
        'class Point:',
        '    @classmethod',
        '    def from_pair(cls, pair):',
        '        x, y = pair',
        '        return cls(x, y)',
      ],
      linesAreCode: true,
      distractors: ['    @staticmethod'],
      explanation: 'The class header comes first, then the decorator directly above the `def`, then the body: unpack the pair and build the object with `cls`. `@staticmethod` is a distractor — it would pass no `cls`, so `cls(x, y)` would fail.',
    },
    {
      kind: 'error',
      prompt: 'Calling `Counter.bump()` raises `NameError: name \'self\' is not defined`. Tap a line that has to change.',
      lines: [
        'class Counter:',
        '    total = 0',
        '    @staticmethod',
        '    def bump():',
        '        self.total += 1',
      ],
      linesAreCode: true,
      errorLines: [3, 4, 5],
      explanation: 'A static method receives nothing automatically, so `self` does not exist inside it. Since `bump` changes *class-level* state, it should be a `@classmethod` (line 3) taking `cls` (line 4) and updating `cls.total` (line 5) — all three lines change together.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class P: pass`\n`p = P()`\n`for name in ("a", "b", "c"):`\n`    setattr(p, name, 1)`\n`delattr(p, "b")`\n`print(len(vars(p)))`',
      answer: '2',
      hint: 'Count how many attributes exist after the loop and after the delete.',
      explanation: 'The loop creates three attributes (`a`, `b`, `c`); `delattr` removes `b`, leaving `a` and `c`. `vars(p)` is the instance dictionary, so its length is 2.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Temperature` that stores degrees Celsius. `__init__(self, celsius)` stores `self.celsius`. Add a **class method** `from_fahrenheit(cls, f)` that converts (`(f - 32) * 5 / 9`) and builds an instance with `cls`; an instance method `fahrenheit()` returning `celsius * 9 / 5 + 32`; and a **static method** `is_valid_celsius(c)` returning `True` when `c >= -273.15`.',
      starter: `# define class Temperature here
`,
      solution: `class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f):
        return cls((f - 32) * 5 / 9)

    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32

    @staticmethod
    def is_valid_celsius(c):
        return c >= -273.15
`,
      tests: `assert Temperature.from_fahrenheit(212).celsius == 100
assert Temperature(100).fahrenheit() == 212
assert round(Temperature(37).fahrenheit(), 1) == 98.6
assert Temperature.is_valid_celsius(-273.15) is True
assert Temperature.is_valid_celsius(-300) is False
assert Temperature(5).is_valid_celsius(0) is True

class Kelvinish(Temperature):
    pass

k = Kelvinish.from_fahrenheit(32)
assert isinstance(k, Kelvinish)
assert k.celsius == 0`,
      checks: ['`from_fahrenheit` is a classmethod that builds the instance with `cls`', '`fahrenheit()` converts back', '`is_valid_celsius` is a static method, usable via the class'],
      hint: 'Decorate the constructor-like function with `@classmethod`, take `cls` as the first parameter and `return cls(...)`. The validity check needs no instance data, so make it a `@staticmethod`.',
      explanation: 'Using `cls(...)` rather than `Temperature(...)` makes `from_fahrenheit` return the subclass when called on one — the last test checks exactly that. The static method needs neither instance nor class, so it takes only the value.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Config`. `__init__(self, **defaults)` stores every keyword argument as an attribute. `update(self, **changes)` sets the given attributes, but if **any** name is not an existing setting it raises `AttributeError("unknown setting: NAME")` and changes **nothing**. `as_dict()` returns a **copy** of all settings as a dictionary.',
      starter: `# define class Config here
`,
      solution: `class Config:
    def __init__(self, **defaults):
        for name, value in defaults.items():
            setattr(self, name, value)

    def update(self, **changes):
        for name in changes:
            if name not in vars(self):
                raise AttributeError(f"unknown setting: {name}")
        for name, value in changes.items():
            setattr(self, name, value)

    def as_dict(self):
        return dict(vars(self))
`,
      tests: `c = Config(volume=5, fullscreen=False)
assert c.volume == 5 and c.fullscreen is False
c.update(volume=8)
assert c.volume == 8
try:
    c.update(volume=1, mute=True)
    assert False, "should raise AttributeError"
except AttributeError as e:
    assert str(e) == "unknown setting: mute"
assert c.volume == 8
assert c.as_dict() == {"volume": 8, "fullscreen": False}
d = c.as_dict()
d["volume"] = 0
assert c.volume == 8
assert Config().as_dict() == {}
try:
    c.update(update=1)
    assert False, "should raise AttributeError"
except AttributeError:
    pass`,
      checks: ['Keyword arguments become attributes via `setattr`', 'An unknown name raises `AttributeError` before anything changes', '`as_dict()` returns a copy, not the live `__dict__`'],
      hint: 'Loop over `defaults.items()` with `setattr`. In `update`, check *all* names first (`name not in vars(self)`), and only then apply the changes. Return `dict(vars(self))` for the copy.',
      explanation: 'Validating first and applying second makes the update all-or-nothing. Checking `vars(self)` (the instance dictionary) rather than `hasattr` matters: `hasattr(self, "update")` would be `True` because `update` is a method, letting callers overwrite it. Copying in `as_dict` stops callers from mutating the object’s internals by accident.',
    },
    {
      kind: 'code',
      prompt: 'Use composition. Write a class `Wallet` with `__init__(self, coins=0)`, `add(n)` (adds, returns the new total) and `spend(n)` (subtracts and returns the new total; raises `ValueError("not enough coins")` if `n` exceeds the balance, changing nothing). Then write `Shopper` with `__init__(self, name, coins=0)` that **owns its own `Wallet`** as `self.wallet`, plus `earn(n)` and `buy(price)` which delegate to the wallet and return the new total.',
      starter: `# define Wallet and Shopper here
`,
      solution: `class Wallet:
    def __init__(self, coins=0):
        self.coins = coins

    def add(self, n):
        self.coins += n
        return self.coins

    def spend(self, n):
        if n > self.coins:
            raise ValueError("not enough coins")
        self.coins -= n
        return self.coins


class Shopper:
    def __init__(self, name, coins=0):
        self.name = name
        self.wallet = Wallet(coins)

    def earn(self, n):
        return self.wallet.add(n)

    def buy(self, price):
        return self.wallet.spend(price)
`,
      tests: `s = Shopper("Ada", 10)
assert isinstance(s.wallet, Wallet)
assert s.earn(5) == 15
assert s.buy(6) == 9
assert s.wallet.coins == 9
try:
    s.buy(100)
    assert False, "should raise ValueError"
except ValueError as e:
    assert str(e) == "not enough coins"
assert s.wallet.coins == 9
t = Shopper("Bo")
assert t.wallet.coins == 0
assert s.wallet is not t.wallet
t.earn(3)
assert s.wallet.coins == 9 and t.wallet.coins == 3`,
      checks: ['Each `Shopper` creates its own `Wallet` in `__init__`', '`earn` and `buy` delegate to the wallet and return the new balance', 'A failed purchase raises `ValueError` and leaves the balance unchanged'],
      hint: 'In `Shopper.__init__`, set `self.wallet = Wallet(coins)`. `earn` is `return self.wallet.add(n)`; `buy` is `return self.wallet.spend(price)`. Do the balance check in `Wallet.spend` *before* subtracting.',
      explanation: 'The shopper does not know *how* coins are stored; it asks its wallet. That separation means you could later swap in a wallet with a spending limit without touching `Shopper`. Creating the wallet inside `__init__` gives each shopper an independent one — exactly the instance-attribute rule from the previous lesson.',
    },
  ],
  takeaways: [
    'Instance methods receive `self`; `@classmethod` receives `cls` and is the Pythonic way to write alternative constructors (use `cls(...)` so subclasses work); `@staticmethod` receives nothing and is just a function grouped with the class.',
    'Python has no `private`. `_name` means "internal, don’t rely on it"; `__name` is mangled to `_Class__name` to avoid clashes in subclasses — neither is security.',
    '`getattr`, `setattr`, `hasattr`, `delattr` and `vars` work with attributes by name — the basis of generic loaders and serializers. Validate names that come from outside.',
    'Prefer composition ("has-a") over inheritance for reuse; create each owned object in `__init__` so instances stay independent. Returning `self` enables method chaining.',
    '`__slots__` fixes the attribute set and saves memory for huge numbers of small objects; `__getattr__` is a fallback hook called only when normal lookup fails.',
  ],
  reading: [
    { title: 'Built-in functions: classmethod, staticmethod, getattr, setattr', url: 'https://docs.python.org/3/library/functions.html', source: 'docs', note: 'The precise definitions of the decorators and attribute-access builtins used in this lesson.' },
    { title: 'Private Variables (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html#private-variables', source: 'tutorial', note: 'The official explanation of the underscore convention and name mangling.' },
    { title: 'Python’s Instance, Class, and Static Methods Demystified', url: 'https://realpython.com/instance-class-and-static-methods-demystified/', source: 'article', note: 'A clear comparison of the three method kinds with practical guidance.' },
  ],
};
