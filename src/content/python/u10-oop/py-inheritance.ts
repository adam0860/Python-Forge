import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-inheritance',
  title: 'Inheritance and Polymorphism',
  summary: 'Specializing classes with inheritance, `super()`, overriding and polymorphism; the method resolution order and multiple inheritance; mixins; and the judgment to know when composition (or duck typing) is the better design.',
  minutes: 20,
  objectives: [
    'Create subclasses that reuse, extend and override a parent class, calling the parent with `super()`',
    'Use `isinstance` and `issubclass` correctly and explain why `type(x) is C` is stricter',
    'Write polymorphic code that treats different classes uniformly through a shared method',
    'Read a class’s method resolution order and predict `super()` behavior with multiple inheritance and mixins',
    'Apply the "is-a" test and recognize designs where inheritance causes trouble',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Subclasses, overriding and super()',
      blocks: [
        {
          type: 'p',
          text: '**[[inheritance|Inheritance]]** lets a new class start from an existing one: `class Orc(Enemy):` creates an `Orc` that automatically has everything `Enemy` has. The child can **add** attributes and methods, and **override** methods by redefining them. Inside an override, `super()` gives access to the parent’s version so you can extend it instead of rewriting it. Note that nothing is automatic about *initialization*: if a subclass defines its own `__init__`, it must call `super().__init__(...)` for the parent’s setup to run.',
        },
        {
          type: 'code',
          title: 'enemies.py',
          runnable: true,
          code: `class Enemy:
    def __init__(self, name, hp):
        self.name = name
        self.hp = hp

    def attack(self):
        return 1

    def describe(self):
        return f"{self.name} ({self.hp} hp) hits for {self.attack()}"

class Orc(Enemy):
    def __init__(self, name):
        super().__init__(name, hp=30)
        self.rage = 0

    def attack(self):
        return 5 + self.rage

class Slime(Enemy):
    pass

class Boss(Orc):
    def attack(self):
        return super().attack() * 2

o = Orc("Grum")
s = Slime("Goo", 5)
b = Boss("Big")
print(o.describe())
print(s.describe())
print(b.describe())
print(isinstance(b, Orc), isinstance(b, Enemy), isinstance(o, Boss), type(b) is Orc)
print(issubclass(Boss, Enemy), issubclass(Enemy, Boss), issubclass(Orc, Orc))
print([c.__name__ for c in Boss.__mro__])
print(b.__dict__)
print(Slime.__init__ is Enemy.__init__, Orc.describe is Enemy.describe)`,
          output: `Grum (30 hp) hits for 5
Goo (5 hp) hits for 1
Big (30 hp) hits for 10
True True False False
True False True
['Boss', 'Orc', 'Enemy', 'object']
{'name': 'Big', 'hp': 30, 'rage': 0}
True True`,
          annotations: [
            { lines: 12, text: '`Orc(Enemy)`: the parent class goes in parentheses. `Orc` inherits `describe` and `attack` without writing them.' },
            { lines: '13-15', text: 'The subclass `__init__` has a different signature (no `hp` — orcs always have 30). It calls `super().__init__(...)` so `Enemy` still sets `name` and `hp`, then adds its own `rage` attribute.' },
            { lines: '17-18', text: 'Overriding: `Orc.attack` replaces the parent’s version for orcs.' },
            { lines: '20-21', text: '`pass` makes `Slime` an exact copy of `Enemy` in behavior — a subclass can exist just to be a distinct *type*. It inherits `__init__` too, which is why `Slime("Goo", 5)` takes `hp`.' },
            { lines: '23-25', text: '`Boss` extends instead of replacing: `super().attack()` runs `Orc.attack` (5), then doubles it. Chains of `super()` calls walk up the hierarchy one level at a time.' },
            { lines: '30-32', text: '`describe` is written once in `Enemy`, but it calls `self.attack()`, which looks up the method on the *actual* object. Each enemy therefore reports its own attack value: 5, 1, 10.' },
            { lines: 33, text: '`isinstance(b, Orc)` is True because a `Boss` *is an* `Orc`, and also an `Enemy`. A parent is not an instance of its child (`isinstance(o, Boss)` is False). `type(b) is Orc` is False: `type` reports the exact class only.' },
            { lines: 34, text: '`issubclass(A, B)` asks the same question about classes. Every class counts as a subclass of itself.' },
            { lines: 35, text: '`__mro__` is the **method resolution order**: the chain Python searches for attributes, from the most specific class up to `object`.' },
            { lines: 36, text: 'The instance holds data from *both* initializers — `rage` from `Orc.__init__` and `name`/`hp` from `Enemy.__init__`. Data is not inherited separately; it is simply whatever the `__init__` chain assigns.' },
            { lines: 37, text: 'Inherited methods are not copied: `Slime.__init__` and `Enemy.__init__` are literally the same function object, as are `Orc.describe` and `Enemy.describe`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Forgetting super().__init__()',
          text: 'If a subclass defines `__init__` and never calls the parent’s, the parent’s attributes are never created, and later code fails with `AttributeError: ... has no attribute \'hp\'`. Unlike C++, Python does not call base constructors for you when you write your own `__init__`. Call `super().__init__(...)` first (usually) in every subclass initializer.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'Every Python method behaves like a C++ `virtual` function: lookup happens on the real object at run time, so overriding "just works" without `virtual` or `override` keywords (and no object slicing). Python also supports multiple inheritance directly, with a well-defined resolution order instead of manual disambiguation. There are no `public`/`protected` inheritance modes and no abstract-ness unless you ask for it (the last lesson of this unit).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How a method call finds its code',
          text: 'For `b.attack()`, Python searches `b.__dict__`, then each class in `type(b).__mro__` in order — `Boss`, `Orc`, `Enemy`, `object` — and uses the first class that defines the name. `super()` means "continue this search *after* the current class in the MRO". That is why `Boss.attack` can reach `Orc.attack`, and why `super()` needs no class name in Python 3.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `super().__init__(name, hp=30)` do inside `Orc.__init__`?',
      options: [
        { text: 'Runs the parent class’s initializer on this same object, so `name` and `hp` get set', correct: true, why: 'Yes — it continues the lookup after `Orc` in the MRO and calls `Enemy.__init__` with this object as `self`.' },
        { text: 'Creates a second, separate `Enemy` object stored inside the orc', why: 'No new object is created. `self` is still the one orc being initialized; `super()` only changes where the method is looked up.' },
        { text: 'Does nothing unless the parent class is named explicitly', why: 'Python 3’s zero-argument `super()` works without naming the class.' },
        { text: 'Creates the instance — it is the same as `Orc(...)`', why: 'The instance already exists by the time `__init__` runs. `__init__` initializes; it does not allocate.' },
      ],
      explanation: '`super()` is a proxy that looks up methods starting *after the current class* in the MRO. `super().__init__(...)` therefore runs the parent initializer on the very same object.',
    },
    {
      kind: 'concept',
      title: 'Polymorphism: one call, many behaviors',
      blocks: [
        {
          type: 'p',
          text: '**[[polymorphism|Polymorphism]]** means code can call the same method on different kinds of objects and each responds in its own way. A game loop calls `entity.update()` on players, enemies and projectiles without caring which is which; a renderer calls `shape.area()` on circles and squares. The caller depends on the *shared method*, not the concrete class. A base class can document the contract by providing a method that raises `NotImplementedError` — a loud failure if a subclass forgets to override it.',
        },
        {
          type: 'code',
          title: 'shapes.py',
          runnable: true,
          code: `class Shape:
    def area(self):
        raise NotImplementedError("subclasses must implement area()")

    def __repr__(self):
        return f"{type(self).__name__}(area={self.area():.2f})"

class Square(Shape):
    def __init__(self, side):
        self.side = side
    def area(self):
        return self.side ** 2

class Circle(Shape):
    def __init__(self, r):
        self.r = r
    def area(self):
        return 3.14159 * self.r ** 2

class Blob(Shape):
    pass

shapes = [Square(2), Circle(1), Square(3)]
print(shapes)
print(sum(s.area() for s in shapes))
try:
    Blob().area()
except NotImplementedError as e:
    print(e)
print(max(shapes, key=lambda s: s.area()))`,
          output: `[Square(area=4.00), Circle(area=3.14), Square(area=9.00)]
16.14159
subclasses must implement area()
Square(area=9.00)`,
          annotations: [
            { lines: '2-3', text: 'The base class declares the **contract**: every shape has an `area()`. The default raises `NotImplementedError` so a subclass that forgets it fails immediately and clearly.' },
            { lines: '5-6', text: 'One `__repr__` in the base class serves every subclass: `type(self).__name__` gives the real class name, and `self.area()` dispatches to the subclass.' },
            { lines: '8-18', text: 'Each subclass supplies its own `area`. They may take different constructor arguments — only the shared *interface* matters.' },
            { lines: 23, text: 'A list can hold objects of different classes.' },
            { lines: 25, text: 'The loop-free `sum(...)` treats every shape uniformly. Adding a `Triangle` class later requires **no change** to this line.' },
            { lines: '26-29', text: '`Blob` inherits `area` unchanged, so calling it raises our clear error instead of returning garbage.' },
            { lines: 30, text: '`max` with a `key` function also works on any mix of shapes.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why polymorphism matters',
          text: 'Without it, code fills up with `if kind == "orc": … elif kind == "slime": …` chains that must all be edited whenever a new kind appears. With it, a new kind is one new class, and existing code keeps working. This "open for extension, closed for modification" idea is the practical payoff of object-oriented design — and in game engines it is how thousands of different entities share one update loop.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Python doesn’t even require a shared base class',
          text: 'Because Python checks behavior at run time (**[[duck-typing|duck typing]]**), `sum(s.area() for s in shapes)` works for *any* object with an `area()` method — inheritance from `Shape` is optional. Use a base class when you want shared code or a documented contract; skip it when objects merely happen to respond to the same calls. The last lesson in this unit (protocols and ABCs) covers how to make those contracts explicit.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Which `who()` does `show()` call?',
      code: `class A:
    def who(self):
        return "A"
    def show(self):
        return self.who()

class B(A):
    def who(self):
        return "B"

print(A().show(), B().show())`,
      answer: 'A B',
      hint: '`self` is the real object, not the class where `show` was written.',
      explanation: '`show` is defined only in `A`, but `self.who()` looks the method up on the **actual object**. For a `B` instance the search starts at `B`, finds its `who`, and returns `"B"`. This run-time lookup is what makes overriding work for methods called from inherited code — the "template method" pattern.',
    },
    {
      kind: 'concept',
      title: 'Multiple inheritance, the MRO and mixins',
      blocks: [
        {
          type: 'p',
          text: 'A class may list several parents: `class Duck(Flying, Swimming):`. When both define `move`, **order matters**: Python searches parents left to right, but follows the **C3 linearization** rule so every class appears once and a class always comes before its own parents. `ClassName.__mro__` shows the result, and `super()` follows exactly that chain — which is why cooperative `super()` calls in a diamond reach each class once.',
        },
        {
          type: 'code',
          title: 'mro_demo.py',
          runnable: true,
          code: `class Flying:
    def move(self):
        return "fly"

class Swimming:
    def move(self):
        return "swim"

class Duck(Flying, Swimming):
    pass

class Fish(Swimming, Flying):
    pass

print(Duck().move(), Fish().move())
print([c.__name__ for c in Duck.__mro__])

class Base:
    def hello(self):
        return ["Base"]

class Left(Base):
    def hello(self):
        return ["Left"] + super().hello()

class Right(Base):
    def hello(self):
        return ["Right"] + super().hello()

class Both(Left, Right):
    def hello(self):
        return ["Both"] + super().hello()

print(Both().hello())
print([c.__name__ for c in Both.__mro__])`,
          output: `fly swim
['Duck', 'Flying', 'Swimming', 'object']
['Both', 'Left', 'Right', 'Base']
['Both', 'Left', 'Right', 'Base', 'object']`,
          annotations: [
            { lines: '9-13', text: 'Same two parents, opposite order. The first parent listed wins a name clash.' },
            { lines: 15, text: '`Duck` flies because `Flying` comes first; `Fish` swims because `Swimming` does.' },
            { lines: 16, text: 'The MRO is simply the search order: the class, its parents left to right, and finally `object`.' },
            { lines: '18-32', text: 'A **diamond**: `Both` inherits from `Left` and `Right`, which both inherit from `Base`. Every `hello` calls `super().hello()` to cooperate.' },
            { lines: 34, text: 'The result visits each class exactly once. Note that `Left`’s `super()` went to **`Right`**, not `Base` — `super()` means "next in the MRO of the *instance’s* class", not "my parent".' },
            { lines: 35, text: 'The linearization that produced it: `Base` is placed after both of its children.' },
          ],
        },
        {
          type: 'code',
          title: 'mixin.py',
          runnable: true,
          code: `class JsonMixin:
    def to_dict(self):
        return dict(vars(self))

class Point(JsonMixin):
    def __init__(self, x, y):
        self.x, self.y = x, y

print(Point(1, 2).to_dict())

class Base:
    pass
class Left(Base):
    pass
try:
    class Bad(Base, Left):
        pass
except TypeError as e:
    print(type(e).__name__)`,
          output: `{'x': 1, 'y': 2}
TypeError`,
          annotations: [
            { lines: '1-3', text: 'A **mixin** is a small class that adds one capability (here, converting to a dictionary) and is meant to be combined with others, never used alone. By convention its name ends in `Mixin`.' },
            { lines: 5, text: 'Listing the mixin as a parent gives `Point` the `to_dict` method for free.' },
            { lines: '16-17', text: 'Listing a parent *before* its own child (`Base, Left`) contradicts itself, so no consistent order exists and Python raises `TypeError` when the class is created.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keep multiple inheritance boring',
          text: 'The safe uses are mixins (small, single-purpose, without their own `__init__` state) and framework hooks. Put the mixins *before* the main base: `class Hero(SaveMixin, Entity)`. If you find yourself drawing a tangled hierarchy, step back: composition is almost certainly simpler.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'MRO questions',
          text: 'Expect: "Given these classes, what does `D().method()` print?" — write the `__mro__` first, then follow it. Remember (1) the class itself comes first, (2) parents are searched left to right but no class appears before any of its subclasses, (3) `super()` goes to the *next class in the instance’s MRO*, which may be a sibling, not the literal parent.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If `b` is a `Boss` and `Boss` inherits from `Orc`, then both `isinstance(b, Orc)` and `type(b) is Orc` are `True`.',
      answer: false,
      explanation: 'False. `isinstance` accepts subclasses, so `isinstance(b, Orc)` is `True`. But `type(b)` is exactly `Boss`, so `type(b) is Orc` is `False`. Prefer `isinstance` unless you really need the exact class.',
    },
    {
      kind: 'concept',
      title: 'Is it really an "is-a"? When not to inherit',
      blocks: [
        {
          type: 'p',
          text: 'Inheritance makes a promise: *anywhere the parent is expected, a child must work correctly* (the **Liskov substitution principle**). It is a strong coupling — changes to the parent ripple into every child. Test a design with the sentence "a **Child** is a **Parent**" *and* "it can be used wherever a Parent can". Mathematics famously says a square is a rectangle, but code disagrees:',
        },
        {
          type: 'code',
          title: 'square_rectangle.py',
          runnable: true,
          code: `class Rect:
    def __init__(self, w, h):
        self.w, self.h = w, h
    def set_width(self, w):
        self.w = w
    def area(self):
        return self.w * self.h

class Square(Rect):
    def __init__(self, s):
        super().__init__(s, s)
    def set_width(self, w):
        self.w = self.h = w

def stretch(r):
    r.set_width(10)
    return r.area()

print(stretch(Rect(2, 3)), stretch(Square(3)))`,
          output: `30 100`,
          annotations: [
            { lines: '4-5', text: 'A rectangle’s contract: setting the width changes *only* the width.' },
            { lines: '9-13', text: 'A square must stay square, so its `set_width` has to change the height too — it quietly breaks the parent’s contract.' },
            { lines: '15-17', text: '`stretch` was written for rectangles and expects `area` to become `10 × h`.' },
            { lines: 19, text: 'For a rectangle that holds: 30. For the "substitutable" square it is 100 — wrong. Code that worked for the parent misbehaves with the child, so `Square` is not a valid subtype of this mutable `Rect`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Favor composition; inherit for true specialization',
          text: 'Good inheritance: `Orc` and `Slime` are kinds of `Enemy`, each a real specialization that works wherever an `Enemy` does. Warning signs: you inherit only to reuse code; the child must *disable* or contradict parent methods; the hierarchy is deeper than three levels; a parent changes and children break. In those cases hold the other object as an attribute and delegate. Game engines moved the same way — modern entity-component systems build entities from components rather than deep class trees.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Inheritance fell from fashion',
          text: 'Early object-oriented tutorials (1990s C++ and Java) taught deep hierarchies as the way to organize everything. Experience showed they are brittle; the influential 1994 *Design Patterns* book already advised "favor object composition over class inheritance". Python’s culture of duck typing, protocols and plain functions grew up with that lesson.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the subclass so that `Wizard("Ada")` sets up `name` and `hp` through its parent and then adds mana.',
      template: `class Player:
    def __init__(self, name):
        self.name = name
        self.hp = 100

class Wizard(___):
    def __init__(self, name):
        ___().__init__(name)
        self.mana = 50`,
      templateIsCode: true,
      blanks: [{ answers: ['Player'] }, { answers: ['super'] }],
      wordBank: ['Player', 'super', 'self', 'Wizard'],
      explanation: 'The parent class goes in the parentheses of the `class` line, and `super().__init__(name)` runs the parent’s initializer on the same object. Without it, `Wizard` objects would have `mana` but no `name` or `hp`.',
    },
    {
      kind: 'error',
      prompt: 'Printing `Hero("Ada").hp` raises `AttributeError: \'Hero\' object has no attribute \'hp\'`. Tap a line that has to change.',
      lines: [
        'class Player:',
        '    def __init__(self, name):',
        '        self.name = name',
        '        self.hp = 100',
        'class Hero(Player):',
        '    def __init__(self, name):',
        '        self.title = "Sir"',
      ],
      linesAreCode: true,
      errorLines: [6, 7],
      explanation: '`Hero` defines its own `__init__` but never calls `super().__init__(name)`, so `Player.__init__` never runs and `name` and `hp` are never set. The fix is to add `super().__init__(name)` as the first statement of `Hero.__init__` (lines 6–7).',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class A: pass`\n`class B(A): pass`\n`class C(B): pass`\n`print(len(C.__mro__))`',
      answer: '4',
      hint: 'Do not forget the class that sits at the top of every hierarchy.',
      explanation: 'The MRO of `C` is `C, B, A, object`: four classes. Every class ultimately inherits from `object`.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a base class `Character` with `__init__(self, name, hp=100)`, a method `attack_power()` that raises `NotImplementedError`, and `describe()` returning `"NAME attacks for POWER"`. Then write subclasses: `Warrior(name, strength)` with 150 hp whose power is `strength * 2`, and `Mage(name, mana)` with 70 hp whose power is `mana // 2`. Both must call `super().__init__`.',
      starter: `# define Character, Warrior and Mage here
`,
      solution: `class Character:
    def __init__(self, name, hp=100):
        self.name = name
        self.hp = hp

    def attack_power(self):
        raise NotImplementedError

    def describe(self):
        return f"{self.name} attacks for {self.attack_power()}"


class Warrior(Character):
    def __init__(self, name, strength):
        super().__init__(name, hp=150)
        self.strength = strength

    def attack_power(self):
        return self.strength * 2


class Mage(Character):
    def __init__(self, name, mana):
        super().__init__(name, hp=70)
        self.mana = mana

    def attack_power(self):
        return self.mana // 2
`,
      tests: `w = Warrior("Gor", 10)
m = Mage("Lia", 25)
assert w.hp == 150 and w.name == "Gor"
assert m.hp == 70 and m.name == "Lia"
assert w.attack_power() == 20
assert m.attack_power() == 12
assert w.describe() == "Gor attacks for 20"
assert m.describe() == "Lia attacks for 12"
c = Character("Plain")
assert c.hp == 100
try:
    c.describe()
    assert False, "should raise NotImplementedError"
except NotImplementedError:
    pass
party = [w, m]
assert sum(p.attack_power() for p in party) == 32
assert all(isinstance(p, Character) for p in party)`,
      checks: ['Subclasses call `super().__init__` with their own `hp`', '`describe` is written once and uses each class’s `attack_power`', 'The base class method raises `NotImplementedError`'],
      hint: 'Use `super().__init__(name, hp=150)` in `Warrior.__init__` and then store `self.strength`. `describe` only needs `self.name` and `self.attack_power()` — put it in `Character`.',
      explanation: '`describe` is inherited by both subclasses yet reports different numbers, because `self.attack_power()` dispatches on the real object — polymorphism at work. The base-class `NotImplementedError` makes a forgotten override fail loudly.',
    },
    {
      kind: 'code',
      prompt: 'Write a chain of weapon classes. `Weapon(name, base_damage)` has `damage()` returning `base_damage`. `FireSword(Weapon)` takes `(name, base_damage, fire)` and its `damage()` returns the parent’s damage **plus** `fire` (use `super()`). `Legendary(FireSword)` has the same constructor and its `damage()` returns **double** what `FireSword` would give. Don’t duplicate the arithmetic.',
      starter: `# define Weapon, FireSword and Legendary here
`,
      solution: `class Weapon:
    def __init__(self, name, base_damage):
        self.name = name
        self.base_damage = base_damage

    def damage(self):
        return self.base_damage


class FireSword(Weapon):
    def __init__(self, name, base_damage, fire):
        super().__init__(name, base_damage)
        self.fire = fire

    def damage(self):
        return super().damage() + self.fire


class Legendary(FireSword):
    def damage(self):
        return super().damage() * 2
`,
      tests: `w = Weapon("stick", 3)
f = FireSword("torch", 5, 4)
l = Legendary("Sol", 10, 6)
assert w.damage() == 3
assert f.damage() == 9
assert l.damage() == 32
assert l.name == "Sol" and l.fire == 6 and l.base_damage == 10
assert isinstance(l, Weapon) and isinstance(l, FireSword)
assert [type(x).__name__ for x in (w, f, l)] == ["Weapon", "FireSword", "Legendary"]
assert Legendary.__mro__[1] is FireSword
f.fire = 0
assert f.damage() == 5`,
      checks: ['Each `damage()` builds on the parent’s with `super()`', '`Legendary` needs no `__init__` — it inherits `FireSword`’s', 'All three classes work through the same `damage()` call'],
      hint: 'In `FireSword.damage`, return `super().damage() + self.fire`. `Legendary` only needs a `damage` method: `return super().damage() * 2`. It does not need its own `__init__`.',
      explanation: 'Each level adds one rule on top of the level above, so changing the base calculation updates all three automatically. `Legendary` inherits `__init__` unchanged because it needs no extra data — a subclass only writes the methods that differ.',
    },
    {
      kind: 'code',
      prompt: 'Write a mixin class `ReprMixin` that supplies a `__repr__` listing the instance’s attributes in the order they were assigned, in the form `ClassName(name=\'Rex\', age=3)` (values shown with `!r`). Use the *actual* class name of the object, so subclasses show their own names. An object with no attributes should show `ClassName()`.',
      starter: `# define ReprMixin here
`,
      solution: `class ReprMixin:
    def __repr__(self):
        fields = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
        return f"{type(self).__name__}({fields})"
`,
      tests: `class Pet(ReprMixin):
    def __init__(self, name, age):
        self.name = name
        self.age = age

class Cat(Pet):
    pass

class Empty(ReprMixin):
    pass

assert repr(Pet("Rex", 3)) == "Pet(name='Rex', age=3)"
assert repr(Cat("Tom", 2)) == "Cat(name='Tom', age=2)"
assert repr(Empty()) == "Empty()"
assert str([Pet("A", 1)]) == "[Pet(name='A', age=1)]"
p = Pet("Z", 9)
p.extra = [1]
assert repr(p) == "Pet(name='Z', age=9, extra=[1])"`,
      checks: ['Uses `type(self).__name__` so subclasses report their own class', 'Uses `vars(self)` in insertion order with `!r` for values', 'Works with no attributes at all'],
      hint: 'Build the field text with `", ".join(f"{k}={v!r}" for k, v in vars(self).items())`, then wrap it as `f"{type(self).__name__}({fields})"`.',
      explanation: 'A mixin adds one reusable behavior to any class that lists it as a parent, without being an "is-a" relationship. Because it reads `vars(self)` and `type(self)`, it works for every class and subclass — the same idea that `@dataclass` automates, as you will see soon.',
    },
  ],
  takeaways: [
    'A subclass inherits attributes and methods from its parent, can add new ones, and can override methods. If it defines `__init__`, it must call `super().__init__(...)` itself.',
    'Method calls are looked up on the actual object (its MRO), so inherited code like `describe()` automatically uses overridden methods — polymorphism lets one loop handle many different classes.',
    '`isinstance(x, C)` accepts subclasses; `type(x) is C` does not. `issubclass` compares classes. Prefer `isinstance`.',
    '`ClassName.__mro__` shows the search order (C3 linearization). `super()` means "next class in the instance’s MRO", which with multiple inheritance may be a sibling. Mixins add single capabilities.',
    'Inherit only for true "is-a" specializations that stay substitutable. When in doubt, use composition and delegation — it is simpler and more flexible.',
  ],
  reading: [
    { title: 'Inheritance (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html#inheritance', source: 'tutorial', note: 'The official introduction to subclassing, overriding, `isinstance` and multiple inheritance.' },
    { title: 'The Python 2.3 Method Resolution Order', url: 'https://docs.python.org/3/howto/mro.html', source: 'docs', note: 'Michele Simionato’s explanation of the C3 algorithm, still the definitive read on the MRO.' },
    { title: 'Super considered super!', url: 'https://rhettinger.wordpress.com/2011/05/26/super-considered-super/', source: 'article', note: 'Raymond Hettinger on how `super()` really works and why it enables cooperative multiple inheritance.' },
  ],
};
