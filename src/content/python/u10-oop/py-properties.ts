import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-properties',
  title: 'Properties and Validation',
  summary: 'Turn attribute access into method calls with `@property`: validated setters, read-only and computed attributes, `cached_property`, how to upgrade a plain attribute without breaking callers, and the classic recursion trap.',
  minutes: 18,
  objectives: [
    'Write a getter and setter with `@property` and `@name.setter` to validate or clamp values',
    'Create read-only and computed attributes and explain why they beat getter/setter methods in Python',
    'Use `functools.cached_property` for expensive values and recognize its staleness trade-off',
    'Refactor a public attribute into a property without changing any calling code',
    'Avoid the infinite-recursion bug caused by a property that reads its own name',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Getters, setters and why Python uses properties',
      blocks: [
        {
          type: 'p',
          text: 'In Java or C++ you write `getHp()` and `setHp()` from day one, "just in case" you later need validation. Python takes the opposite approach: start with a plain attribute (`player.hp = 50`), and if you ever need logic behind it, convert it to a **[[property]]** — callers keep writing `player.hp = 50`, but now a method runs. A property looks like an attribute from outside and behaves like a method inside. It is created with the `@property` decorator (Unit 12 explains how decorators work; for now, read `@property` as "turn this method into an attribute").',
        },
        {
          type: 'code',
          title: 'player_properties.py',
          runnable: true,
          code: `class Player:
    def __init__(self, name, max_hp=100):
        self.name = name
        self.max_hp = max_hp
        self._hp = max_hp

    @property
    def hp(self):
        return self._hp

    @hp.setter
    def hp(self, value):
        if not isinstance(value, (int, float)) or isinstance(value, bool):
            raise TypeError("hp must be a number")
        self._hp = max(0, min(self.max_hp, value))

    @property
    def is_alive(self):
        return self._hp > 0

p = Player("Ada")
p.hp -= 30
print(p.hp, p.is_alive)
p.hp = 500
print(p.hp)
p.hp = -9
print(p.hp, p.is_alive)
try:
    p.is_alive = True
except AttributeError as e:
    print(type(e).__name__)
try:
    p.hp = "full"
except TypeError as e:
    print(e)
print(type(Player.hp).__name__, Player.hp.fget.__name__)
print(p.__dict__)`,
          output: `70 True
100
0 False
AttributeError
hp must be a number
property hp
{'name': 'Ada', 'max_hp': 100, '_hp': 0}`,
          annotations: [
            { lines: 5, text: 'The real value lives in `_hp` (the underscore marks it as internal). The public name `hp` is the property that guards it.' },
            { lines: '7-9', text: '`@property` turns this method into the **getter**: reading `p.hp` now calls it — with no parentheses.' },
            { lines: '11-15', text: '`@hp.setter` attaches the **setter** to the same name. Assigning `p.hp = value` calls it. Here it validates the type and **clamps** the value into `0..max_hp`.' },
            { lines: '17-19', text: 'A property with no setter is **read-only**, and it can be *computed* from other data — `is_alive` is never stored and can never go out of date.' },
            { lines: 22, text: '`p.hp -= 30` reads through the getter (100), subtracts, and writes through the setter (70). Callers use plain attribute syntax.' },
            { lines: '24-27', text: 'The setter clamps: 500 becomes 100 and −9 becomes 0 — the player is now dead. The rule lives in one place.' },
            { lines: '28-31', text: 'Assigning to a read-only property raises `AttributeError`.' },
            { lines: '32-35', text: 'Rejecting wrong types early gives a clear error where the mistake happened, instead of a confusing one much later.' },
            { lines: 36, text: '`hp` is a `property` object stored on the **class**; `fget` is the getter function it wraps.' },
            { lines: 37, text: 'The instance dictionary holds `_hp`, not `hp`: the property is a class-level gateway to private-ish storage.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not write get_hp() / set_hp() everywhere?',
          text: 'In Python you don’t have to guess the future. A plain attribute and a property are used with identical syntax, so you can **start simple** and add validation later without touching a single caller. In C++ or Java, changing a public field into accessor methods breaks every caller — which is why those languages demand getters up front. Python’s uniform access principle removes that cost, so `get_`/`set_` methods in Python code are a code smell.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'Think of a property as a getter/setter pair that callers can’t tell from a public data member. The nearest C++ feature is none (properties exist in C#, Swift, Kotlin). Python makes the pattern a first-class decorator, which is why it’s used in everything from PyTorch’s `tensor.shape`-style attributes to Qt bindings.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which decorator attaches a **setter** to an existing property called `hp`?',
      options: [
        { text: '`@hp.setter`', correct: true, why: 'Right: after `@property def hp`, the name `hp` is a property object, and its `.setter` method returns a copy with the setter added.' },
        { text: '`@property.setter`', why: '`property` is the class itself; you must use the specific property object (`hp`) so Python knows which getter to extend.' },
        { text: '`@setter`', why: 'There is no standalone `setter` decorator in Python.' },
        { text: '`@hp.write`', why: 'The method is called `setter` (`getter` and `deleter` exist too); `write` is not a thing.' },
      ],
      explanation: '`@property` creates a property object bound to the name; `@name.setter` (and `@name.deleter`) return an updated copy with that extra function. Reusing the **same name** for the setter method is essential, or you replace the property instead of extending it.',
    },
    {
      kind: 'concept',
      title: 'Computed attributes, setters that propagate, cached_property',
      blocks: [
        {
          type: 'p',
          text: 'Properties shine for **derived values**: `diameter` from `radius`, `area` from width and height. A setter can propagate in the other direction (setting `diameter` updates `radius`). For a value that is *expensive* to compute, `functools.cached_property` runs the method once, then stores the result in the instance dictionary so later reads skip the computation. The price: the cached value does **not** update when the inputs change.',
        },
        {
          type: 'code',
          title: 'circle_properties.py',
          runnable: true,
          code: `from functools import cached_property

class Circle:
    def __init__(self, radius):
        self.radius = radius

    @property
    def diameter(self):
        return self.radius * 2

    @diameter.setter
    def diameter(self, d):
        self.radius = d / 2

    @cached_property
    def area(self):
        print("computing")
        return round(3.14159 * self.radius ** 2, 2)

c = Circle(2)
print(c.diameter)
c.diameter = 10
print(c.radius, c.diameter)
print(c.area)
print(c.area)
c.radius = 1
print(c.area)
del c.area
print(c.area)`,
          output: `4
5.0 10.0
computing
78.54
78.54
78.54
computing
3.14`,
          annotations: [
            { lines: '7-9', text: '`diameter` is **computed on demand**, so it can never disagree with `radius`. Storing both would invite the two values to drift apart.' },
            { lines: '11-13', text: 'The setter works backwards: assigning a diameter updates the one real piece of state, `radius`.' },
            { lines: '15-18', text: '`@cached_property` runs the body the first time, then saves the result as a normal attribute named `area` in the instance dictionary.' },
            { lines: 23, text: 'After `diameter = 10` the radius became 5.0 — the setter converted it.' },
            { lines: '24-25', text: 'The first read prints "computing" and returns 78.54; the second read returns the stored value **without** computing.' },
            { lines: '26-27', text: 'Danger: the radius changed to 1, yet `area` still shows the old 78.54. The cache doesn’t know its inputs changed.' },
            { lines: '28-29', text: '`del c.area` clears the cached value, so the next read recomputes (3.14). Use it only for values that don’t change, or clear the cache when they do.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Cached values go stale',
          text: '`cached_property` is best for data that is fixed after construction (parsed file contents, a loaded model summary, a sorted copy of immutable input). If the inputs can change, either use a plain `@property` (recompute each time — fine if cheap) or invalidate the cache explicitly. A stale cache is one of the nastiest bugs because the program keeps running with wrong numbers.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keep properties cheap and boring',
          text: 'Callers assume `obj.x` is fast and has no side effects — like reading a variable. A property that hits the network, writes a file or takes a second to compute surprises people. If the work is heavy, make it an explicit method (`load_map()`) or cache it. Save properties for validation, derived values and read-only views.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If `__init__` contains `self.celsius = celsius` and `celsius` is a property with a validating setter, the validation also runs when the object is created.',
      answer: true,
      explanation: 'True. `self.celsius = celsius` is an ordinary attribute assignment, and because `celsius` is a property on the class, Python calls the setter — even inside `__init__`. That is usually what you want: invalid objects can’t be constructed. (Assigning to `self._celsius` directly would skip validation.)',
    },
    {
      kind: 'concept',
      title: 'Upgrading an attribute safely and the recursion trap',
      blocks: [
        {
          type: 'p',
          text: 'Here is the standard evolution. Version 1 of `Temp` had a plain `self.celsius`. Later you need to reject impossible values. Replace the attribute with a property of the **same public name**, keep the data in `_celsius`, and have `__init__` assign through the property. No caller changes. The one classic mistake: using the property’s own name inside its getter or setter, which calls itself forever.',
        },
        {
          type: 'code',
          title: 'upgrade_and_recursion.py',
          runnable: true,
          code: `class Temp:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

t = Temp(20)
t.celsius = 25
print(t.celsius)
try:
    Temp(-300)
except ValueError as e:
    print(e)

class Broken:
    @property
    def x(self):
        return self.x

try:
    Broken().x
except RecursionError:
    print("RecursionError")`,
          output: `25
below absolute zero
RecursionError`,
          annotations: [
            { lines: 3, text: 'This line looks like a plain assignment, but because `celsius` is now a property it runs the **setter** — so the very first value is validated too.' },
            { lines: '5-7', text: 'The getter returns the *different* name `_celsius`. The attribute and the property must not share a stored name.' },
            { lines: '9-13', text: 'The setter validates, then stores in `_celsius`. Assigning `self.celsius = value` here would call this same setter again — forever.' },
            { lines: '15-17', text: 'Callers still write `t.celsius = 25` and `t.celsius`. The class changed; its public interface didn’t.' },
            { lines: '18-21', text: 'Invalid starting values are now rejected at construction.' },
            { lines: '23-26', text: 'The bug: the getter `x` returns `self.x`, which is… the getter `x`. Each access calls the method again.' },
            { lines: '28-31', text: 'Python eventually gives up with `RecursionError` (maximum recursion depth exceeded). The fix is always the same: store the real value under a **different** name such as `_x`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'A property is a descriptor',
          text: '`property` is implemented with Python’s **descriptor protocol**: an object stored on the *class* with `__get__`/`__set__` methods that Python calls whenever an instance attribute of that name is read or written. Data descriptors like `property` take priority over the instance dictionary, which is why `p.hp` runs the getter instead of looking in `p.__dict__`. Methods, `classmethod`, `staticmethod`, `cached_property` and `__slots__` all use the same mechanism — Unit 14 builds your own.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Properties vs. plain attributes vs. methods',
          text: 'Plain attribute: no rules, just data. Property: attribute-like access with rules, derived values or read-only protection. Method: an action, anything with arguments, side effects or noticeable cost. A good test: would you be surprised if `obj.thing` took 200 ms or changed something? Then it should be a method.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Protecting internal collections (and the deleter)',
      blocks: [
        {
          type: 'p',
          text: 'A subtle leak: if a property simply returns an internal **list**, callers can mutate it (`party.members.append(...)`), bypassing every rule your class enforces. Returning a *copy* or an immutable view (a tuple) keeps control inside the class. A **deleter** (`@name.deleter`) defines what `del obj.name` does — rarely needed, but it completes the trio of getter, setter and deleter.',
        },
        {
          type: 'code',
          title: 'party_members.py',
          runnable: true,
          code: `class Party:
    def __init__(self):
        self._members = []

    def add(self, name):
        self._members.append(name)

    @property
    def members(self):
        return tuple(self._members)

    @property
    def size(self):
        return len(self._members)

    @members.deleter
    def members(self):
        self._members.clear()

p = Party()
p.add("Ada")
p.add("Bo")
print(p.members, p.size)
try:
    p.members.append("Eve")
except AttributeError as e:
    print(type(e).__name__)
m = p.members
p.add("Cy")
print(m, p.members)
del p.members
print(p.size)`,
          output: `('Ada', 'Bo') 2
AttributeError
('Ada', 'Bo') ('Ada', 'Bo', 'Cy')
0`,
          annotations: [
            { lines: 3, text: 'The real list is private to the class. All changes go through `add`, which is where rules (duplicates? maximum size?) would be enforced.' },
            { lines: '8-10', text: 'The property hands out a **tuple copy**. Callers can read and loop over it, but they cannot change the party behind the class’s back.' },
            { lines: '16-18', text: '`@members.deleter` defines the behavior of `del p.members` — here it empties the party.' },
            { lines: '24-27', text: 'Tuples have no `append`, so the attempt to mutate fails loudly instead of silently corrupting state.' },
            { lines: '28-30', text: 'The tuple `m` is a **snapshot**: it still shows two members after Cy joins, while a fresh `p.members` shows three.' },
            { lines: '31-32', text: '`del p.members` ran the deleter, so the size is 0.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Copy cost vs. safety',
          text: 'Copying on every access costs time for big collections. If callers only need to *look*, return an iterator, a tuple, or a `types.MappingProxyType` read-only view of a dict; if a million items are involved, document the data as read-only and return the original. Always think about who can mutate what — aliasing bugs are the most common source of "spooky action at a distance" in object-oriented code.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the class so reading `box.area` works with no parentheses, but assigning to it is an error.',
      template: `class Box:
    def __init__(self, w, h):
        self.w = w
        self.h = h

    @___
    def area(___):
        return self.w * self.h`,
      templateIsCode: true,
      blanks: [{ answers: ['property'] }, { answers: ['self'] }],
      wordBank: ['property', 'staticmethod', 'self', 'cls'],
      explanation: '`@property` makes `area` readable like an attribute. Because no setter is defined, assignment raises `AttributeError`. Like every instance method it takes `self`; `cls` and `@staticmethod` would not give access to the instance’s `w` and `h`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Count how many times the getter and setter run for `+=`.',
      code: `class Box:
    def __init__(self):
        self._n = 0
        self.log = []
    @property
    def n(self):
        self.log.append("get")
        return self._n
    @n.setter
    def n(self, v):
        self.log.append("set")
        self._n = v

b = Box()
b.n += 5
print(b.n, b.log)`,
      answer: "5 ['get', 'set', 'get']",
      hint: '`b.n += 5` means read, add, write. And `print(b.n, …)` reads again before printing the log.',
      explanation: '`b.n += 5` is `b.n = b.n + 5`: one **get**, then one **set**. Then the `print` evaluates `b.n` (a third call, **get**) *before* it evaluates `b.log`, and both are printed together, so the log already contains the final entry. Properties run code on every access, which is why they should be cheap.',
    },
    {
      kind: 'error',
      prompt: 'Setting `player.hp = 10` crashes with `RecursionError: maximum recursion depth exceeded`. Tap the faulty line.',
      lines: [
        'class Player:',
        '    @property',
        '    def hp(self):',
        '        return self._hp',
        '    @hp.setter',
        '    def hp(self, value):',
        '        self.hp = max(0, value)',
      ],
      linesAreCode: true,
      errorLines: [7],
      explanation: 'Inside the setter, `self.hp = …` is an assignment to the property itself, which calls the setter again — endlessly. The setter must store the value under a different name: `self._hp = max(0, value)`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class Counter:`\n`    def __init__(self):`\n`        self.reads = 0`\n`    @property`\n`    def value(self):`\n`        self.reads += 1`\n`        return 10`\n`c = Counter()`\n`c.value`\n`c.value`\n`total = c.value + c.value`\n`print(c.reads)`',
      answer: '4',
      hint: 'Every single mention of `c.value` runs the getter — even when the result is thrown away.',
      explanation: 'The getter runs on each attribute access. There are four mentions of `c.value` (two bare statements and two operands in the sum), so `reads` is 4. A property that counts, logs or changes things shows how surprising side effects can be.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Rectangle(width, height)` whose `width` and `height` are **properties** that raise `ValueError` for values `<= 0` (also during `__init__`) and leave the old value unchanged on failure. Add **read-only** computed properties `area` and `perimeter`.',
      starter: `# define class Rectangle here
`,
      solution: `class Rectangle:
    def __init__(self, width, height):
        self.width = width
        self.height = height

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, value):
        if value <= 0:
            raise ValueError("width must be positive")
        self._width = value

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, value):
        if value <= 0:
            raise ValueError("height must be positive")
        self._height = value

    @property
    def area(self):
        return self.width * self.height

    @property
    def perimeter(self):
        return 2 * (self.width + self.height)
`,
      tests: `r = Rectangle(3, 4)
assert r.width == 3 and r.height == 4
assert r.area == 12
assert r.perimeter == 14
r.width = 5
assert r.area == 20
for bad in (lambda: Rectangle(0, 1), lambda: Rectangle(1, -2)):
    try:
        bad()
        assert False, "should raise ValueError"
    except ValueError:
        pass
try:
    r.width = -1
    assert False, "should raise ValueError"
except ValueError:
    pass
assert r.width == 5
try:
    r.area = 99
    assert False, "should raise AttributeError"
except AttributeError:
    pass
r.height = 1
assert r.area == 5 and r.perimeter == 12
assert "area" not in vars(r)`,
      checks: ['`width` and `height` validate in their setters, including from `__init__`', 'A rejected assignment leaves the old value in place', '`area` and `perimeter` are read-only computed properties'],
      hint: 'Store the data in `self._width` / `self._height`; the setters check `value <= 0` and raise *before* assigning. `__init__` should assign via `self.width = ...` so validation runs. `area` and `perimeter` need only `@property`.',
      explanation: 'Because `__init__` assigns through the properties, an invalid rectangle can never exist. `area` is derived rather than stored, so it is always consistent with the sides — no code can change `width` and forget to update a stored area.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Stat(max_value, value=None)` for a health-bar–style value. `value` is a property that **clamps** into `0..max_value` (it starts at `max_value` when not given). `max_value` is a property that must be positive (`ValueError` otherwise) and, when lowered, **re-clamps** the current value. Add read-only properties `fraction` (`value / max_value`), `is_full` and `is_empty`.',
      starter: `# define class Stat here
`,
      solution: `class Stat:
    def __init__(self, max_value, value=None):
        self.max_value = max_value
        self.value = max_value if value is None else value

    @property
    def max_value(self):
        return self._max

    @max_value.setter
    def max_value(self, m):
        if m <= 0:
            raise ValueError("max_value must be positive")
        self._max = m
        if hasattr(self, "_value"):
            self._value = min(self._value, m)

    @property
    def value(self):
        return self._value

    @value.setter
    def value(self, v):
        self._value = max(0, min(self._max, v))

    @property
    def fraction(self):
        return self._value / self._max

    @property
    def is_full(self):
        return self._value == self._max

    @property
    def is_empty(self):
        return self._value == 0
`,
      tests: `s = Stat(50)
assert s.value == 50 and s.is_full and not s.is_empty
s.value -= 20
assert s.value == 30
assert s.fraction == 0.6
s.value = 999
assert s.value == 50
s.value = -5
assert s.value == 0 and s.is_empty and not s.is_full
s.value = 40
s.max_value = 20
assert s.max_value == 20 and s.value == 20
try:
    Stat(0)
    assert False, "should raise ValueError"
except ValueError:
    pass
try:
    s.max_value = -1
    assert False, "should raise ValueError"
except ValueError:
    pass
assert s.max_value == 20
assert Stat(10, value=3).value == 3
assert Stat(10, value=30).value == 10
try:
    s.fraction = 1
    assert False, "should raise AttributeError"
except AttributeError:
    pass`,
      checks: ['`value` is always clamped into `0..max_value`', 'Lowering `max_value` re-clamps `value`; non-positive maximums raise `ValueError`', '`fraction`, `is_full` and `is_empty` are read-only and always consistent'],
      hint: 'Keep two private attributes, `_max` and `_value`. In the `max_value` setter, after storing `_max`, clamp `_value` only if it already exists (`hasattr(self, "_value")`) — during `__init__` it doesn’t yet.',
      explanation: 'Two related properties must stay consistent: lowering the maximum has to pull the value down with it. Doing that inside the setter means no other code can forget. This clamped-stat pattern is everywhere in games — health, mana, stamina, ammo.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Stats(values)` that stores `self.values` (a list copy) and `self.computations = 0`. Add a `functools.cached_property` called `mean` that counts how many times it really computes (incrementing `self.computations`) and returns the average of `values`.',
      starter: `# define class Stats here
`,
      solution: `from functools import cached_property


class Stats:
    def __init__(self, values):
        self.values = list(values)
        self.computations = 0

    @cached_property
    def mean(self):
        self.computations += 1
        return sum(self.values) / len(self.values)
`,
      tests: `s = Stats([1, 2, 3])
assert s.computations == 0
assert s.mean == 2
assert s.computations == 1
assert s.mean == 2
assert s.computations == 1
s.values.append(10)
assert s.mean == 2
assert s.computations == 1
del s.mean
assert s.mean == 4
assert s.computations == 2
t = Stats([5])
assert t.mean == 5 and t.computations == 1
assert s.computations == 2`,
      checks: ['The body runs only once per instance until the cache is cleared', 'The cached value goes stale when `values` changes — and `del s.mean` resets it', 'Each instance has its own cache and counter'],
      hint: 'Import `cached_property` from `functools`, decorate `mean` with it, and increment `self.computations` inside the method body before returning `sum(self.values) / len(self.values)`.',
      explanation: 'The counter proves the cache works: the second read does no computing. The stale value after `append` shows the trade-off — `cached_property` trusts that its inputs never change — and `del` is the supported way to invalidate it.',
    },
  ],
  takeaways: [
    'A property looks like an attribute but runs a method: `@property` defines the getter, `@name.setter` the setter. Store the real value under a different name (`_hp`) or you get infinite recursion.',
    'Start with plain attributes and upgrade to a property only when you need validation or derived values — callers won’t change. That is why Python code has no `get_`/`set_` methods.',
    'A property without a setter is read-only; computed properties (`area`, `is_alive`) can never get out of sync because nothing is stored.',
    'Assignments in `__init__` go through the property, so validation protects construction too. Setters that clamp or reject keep invariants in one place.',
    '`functools.cached_property` computes once and stores the result — great for fixed data, but stale if inputs change (clear it with `del`). Keep properties fast and side-effect free; use methods for real work.',
  ],
  reading: [
    { title: 'Built-in Functions: property', url: 'https://docs.python.org/3/library/functions.html#property', source: 'docs', note: 'The official reference for `property`, including getter/setter/deleter decorators.' },
    { title: 'functools.cached_property', url: 'https://docs.python.org/3/library/functools.html#functools.cached_property', source: 'docs', note: 'Details and caveats of cached properties, including thread-safety notes.' },
    { title: 'Descriptor HowTo Guide', url: 'https://docs.python.org/3/howto/descriptor.html', source: 'docs', note: 'Raymond Hettinger’s deep dive — it even shows how `property` is implemented in pure Python.' },
  ],
};
