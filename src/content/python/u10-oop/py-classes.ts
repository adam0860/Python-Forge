import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-classes',
  title: 'Classes and Objects',
  summary: 'What a class is, how `__init__` and `self` work, the difference between instance and class attributes (and the shared-mutable trap), identity versus equality, and how Python really stores objects — with game-style classes for players, enemies and vectors.',
  minutes: 20,
  objectives: [
    'Define a class with `__init__` and methods, create instances, and explain what `self` is',
    'Distinguish instance attributes from class attributes and avoid the shared mutable class attribute bug',
    'Use `isinstance`, `type`, `__dict__` and `__repr__` to inspect and display objects',
    'Explain identity (`is`) versus equality (`==`) for custom objects and what aliasing means',
    'Decide when a class is the right tool and write small classes (stack, inventory, player) that keep their own state',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Bundling data and behavior',
      blocks: [
        {
          type: 'p',
          text: 'So far your programs kept data in dictionaries and lists and behavior in separate functions. A **[[class]]** bundles the two: it describes what an object *knows* (its **[[attribute|attributes]]**) and what it *can do* (its methods). `class Player:` defines the blueprint; calling `Player("Ada")` builds an **[[instance]]** — one concrete player with its own name, health and items.',
        },
        {
          type: 'code',
          title: 'player_class.py',
          runnable: true,
          code: `class Player:
    def __init__(self, name, hp=100):
        self.name = name
        self.hp = hp
        self.items = []

    def take_damage(self, amount):
        self.hp = max(0, self.hp - amount)
        return self.hp

    def is_alive(self):
        return self.hp > 0

ada = Player("Ada")
ben = Player("Ben", hp=60)
print(ada.name, ada.hp, ben.name, ben.hp)
print(ada.take_damage(30), ada.is_alive())
print(ben.take_damage(100), ben.is_alive())
print(ada.hp, ben.hp)
print(type(ada).__name__, isinstance(ada, Player), isinstance(5, Player))
print(Player.take_damage(ada, 10), ada.hp)
print(ada.__dict__)
print(type(ada.take_damage).__name__, ada.take_damage.__self__ is ada)`,
          output: `Ada 100 Ben 60
70 True
0 False
70 0
Player True False
60 60
{'name': 'Ada', 'hp': 60, 'items': []}
method True`,
          annotations: [
            { lines: 1, text: '`class` starts the definition. Class names use `PascalCase` (`Player`, `EnemySpawner`) — the one place Python capitalizes names.' },
            { lines: 2, text: '`__init__` is the **initializer**: Python calls it automatically on every new instance, passing the arguments you wrote in `Player(...)`. It sets up the object’s starting state.' },
            { lines: '3-5', text: '`self.name = name` creates an **instance attribute**. [[self|`self`]] is the object being initialized; the first parameter of every instance method receives it automatically.' },
            { lines: '7-9', text: 'A **method** is a function defined inside a class. It reads and changes the instance’s own data through `self`.' },
            { lines: '14-15', text: 'Calling the class like a function creates an instance: `Player("Ada")` allocates the object and runs `__init__("Ada")` on it. Keyword arguments work as usual.' },
            { lines: 17, text: '`ada.take_damage(30)` — Python passes `ada` as `self` for you. The method returns the new health, `70`.' },
            { lines: 19, text: 'The two players have **separate state**: hurting Ben did not touch Ada, whose health is still 70.' },
            { lines: 20, text: '`type(x)` gives the class of an object, and `isinstance(x, Class)` is the standard "is it one of these?" test. (The number `5` is not a `Player`.)' },
            { lines: 21, text: 'There is no magic: `ada.take_damage(10)` is just shorthand for `Player.take_damage(ada, 10)`. The instance simply becomes the first argument.' },
            { lines: 22, text: 'An instance’s attributes are stored in a plain dictionary, `__dict__` — you can look at it, which is great for debugging.' },
            { lines: 23, text: '`ada.take_damage` is a **bound method**: the function with `ada` already attached as `self`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why classes?',
          text: 'A `player` dictionary plus a dozen loose functions (`damage(player, n)`, `heal(player, n)`) works until you have players, enemies, NPCs and items, each with their own data and rules. A class keeps a thing’s data and the functions that are *allowed* to change it together in one place, gives each thing its own independent state, and lets you create as many as you like. It also gives your program a vocabulary — `player.take_damage(5)` reads like the problem you are solving.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'The mapping is direct: `__init__` ≈ constructor, `self` ≈ `this` — but **explicit**: it must appear as the first parameter of every method, and you always write `self.hp` (never just `hp`). There are no member declarations: attributes come into existence when assigned, usually in `__init__`. And nothing is `private` by force; Python relies on naming conventions (next lesson).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Everything is an object — including classes',
          text: 'When you write `class Player:`, Python builds a *class object* named `Player` (its type is `type`). Functions defined inside it are stored in the class once, **not** copied into every instance. When you call `ada.take_damage(30)`, Python looks for `take_damage` on the instance (`ada.__dict__`), doesn’t find it, finds it on the class, and binds `ada` to its first parameter. The same lookup chain — instance, then class, then parent classes — resolves every attribute access.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Inside a method, what is `self`?',
      options: [
        { text: 'The class itself', why: 'The class is referred to by its name (`Player`). `self` is one particular object.' },
        { text: 'The instance the method was called on', correct: true, why: 'Right: `ada.heal(10)` runs `Player.heal(ada, 10)`, so `self` is `ada`.' },
        { text: 'A keyword that Python reserves for methods', why: '`self` is only a convention — an ordinary parameter name. (Keep it anyway; every Python programmer expects it.)' },
        { text: 'The method’s return value', why: '`self` is a parameter, an input, not an output.' },
      ],
      explanation: '`self` is an ordinary parameter that receives the instance. Python passes it automatically when you call `instance.method()`. That is also why a method defined without any parameter fails when called on an instance.',
    },
    {
      kind: 'concept',
      title: 'Instance attributes versus class attributes',
      blocks: [
        {
          type: 'p',
          text: 'Attributes assigned through `self` belong to **one instance**. A variable assigned directly in the class body is a **class attribute**: one value, shared by all instances — handy for constants and counters. Reading `obj.count` looks in the instance first and then in the class. *Assigning* `obj.count = …`, however, always creates or changes an *instance* attribute, which then hides the class one.',
        },
        {
          type: 'code',
          title: 'class_vs_instance.py',
          runnable: true,
          code: `class Enemy:
    count = 0
    drops = []
    def __init__(self, name):
        self.name = name
        Enemy.count += 1
        self.hp = 10

a, b = Enemy("orc"), Enemy("elf")
print(Enemy.count, a.count, b.count)
a.count = 99
print(Enemy.count, a.count, b.count)
a.drops.append("gold")
print(b.drops, a.drops is b.drops)
print("count" in a.__dict__, "count" in b.__dict__, "drops" in a.__dict__)`,
          output: `2 2 2
2 99 2
['gold'] True
True False False`,
          annotations: [
            { lines: 2, text: '`count` is a **class attribute**, stored once on the class. Every instance sees the same value, which makes it a natural way to count how many enemies exist.' },
            { lines: 3, text: 'Dangerous: a **mutable** class attribute (a list) is shared by every instance, too. This is almost never what you want.' },
            { lines: 6, text: 'To change the shared value, go through the class name: `Enemy.count += 1`. (`self.count += 1` would create an instance attribute instead.)' },
            { lines: 10, text: 'Reading through an instance finds the class attribute: all three expressions show 2.' },
            { lines: 11, text: 'Assignment through an instance does **not** change the class attribute. It creates a new *instance* attribute `count` on `a` only.' },
            { lines: 12, text: 'Now `a.count` is 99 (the instance attribute shadows the class one), while `Enemy.count` and `b.count` still show 2.' },
            { lines: '13-14', text: 'Appending to `a.drops` mutated the one shared list, so `b.drops` shows gold, too. `a.drops is b.drops` is `True`: same object.' },
            { lines: 15, text: '`__dict__` proves it: only `a` has its own `count`; neither instance owns `drops` — they all reach the class’s.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Give each instance its own mutable data',
          text: 'Mutable containers (lists, dicts, sets) must be created in `__init__` (`self.items = []`) so every instance gets a fresh one. A list in the class body, or a mutable default argument like `def __init__(self, items=[])`, is shared between all instances — the same aliasing bug you met with default arguments in the Functions unit.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'A favorite interview question',
          text: '"What is the difference between a class attribute and an instance attribute?" A good answer covers: where each is stored (class `__dict__` vs instance `__dict__`), the lookup order (instance, then class), that assignment through an instance creates an instance attribute that shadows the class one, and the shared-mutable-state trap.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Look carefully at where `items` lives.',
      code: `class Bag:
    items = []
    def add(self, x):
        self.items.append(x)

a, b = Bag(), Bag()
a.add(1)
b.add(2)
print(a.items, len(b.items))`,
      answer: '[1, 2] 2',
      hint: 'Is there one list or two?',
      explanation: '`items` is a class attribute, so there is only **one** list, shared by `a` and `b`. `self.items.append(x)` mutates that shared list; it never creates an instance attribute. Both appends land in the same list, which is why `a.items` shows `[1, 2]`. Fix: assign `self.items = []` in `__init__`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the class so that `Coin(5).double()` returns `10`.',
      template: `class Coin:
    def ___(self, value):
        ___.value = value

    def double(___):
        return self.value * 2`,
      templateIsCode: true,
      blanks: [{ answers: ['__init__'] }, { answers: ['self'] }, { answers: ['self'] }],
      wordBank: ['__init__', 'self', 'init', 'this'],
      explanation: '`__init__` is the special method run when an instance is created, and it stores the argument as `self.value`. Every instance method — here `double` — must list `self` as its first parameter so Python can pass the instance in. (`this` is C++/Java, and plain `init` has no special meaning.)',
    },
    {
      kind: 'concept',
      title: 'Identity, equality, aliasing and __repr__',
      blocks: [
        {
          type: 'p',
          text: 'Two variables can refer to the **same** object (an *alias*) or to two **different** objects that merely look alike. `is` tests identity (same object); `==` tests equality, and for your own classes it defaults to identity until you define what "equal" means (the Special Methods lesson shows how). The default text for an object, `<__main__.Vec object at 0x…>`, is useless — define `__repr__` to make debugging output readable.',
        },
        {
          type: 'code',
          title: 'identity_and_repr.py',
          runnable: true,
          code: `class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y
    def __repr__(self):
        return f"Vec({self.x}, {self.y})"
    def add(self, other):
        return Vec(self.x + other.x, self.y + other.y)
a = Vec(1, 2)
b = Vec(1, 2)
print(a, [a, b], a == b, a is b, a is a)
print(a.add(b).add(Vec(1, 1)))
c = a
c.x = 99
print(a, a is c)`,
          output: `Vec(1, 2) [Vec(1, 2), Vec(1, 2)] False False True
Vec(3, 5)
Vec(99, 2) True`,
          annotations: [
            { lines: 3, text: 'Tuple unpacking assigns both attributes in one line.' },
            { lines: '4-5', text: '`__repr__` returns the text used when the object is printed, shown in a list, or inspected. A good `__repr__` looks like the code that would create the object.' },
            { lines: '6-7', text: 'Methods can build and return **new** objects. `add` leaves both vectors unchanged — an immutable-style design, which avoids a whole family of bugs.' },
            { lines: 10, text: '`a` and `b` hold the same numbers, but they are two separate objects: `a == b` is `False` (default equality is identity) and `a is b` is `False`.' },
            { lines: 11, text: 'Calls chain naturally because `add` returns a `Vec`: `(1,2) + (1,2) + (1,1)` is `(3,5)`.' },
            { lines: '12-14', text: '`c = a` copies the **reference**, not the object. Changing `c.x` changed `a`, because they are the same object. This is aliasing, the same behavior as lists.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Do you need a class at all?',
          text: 'Not everything should be a class. A function that takes input and returns output is simpler. A dictionary or a tuple is fine for a quick record. Reach for a class when you have **state that changes** together with **behavior that belongs to it**, or when you need many independent copies of the same kind of thing. Python programmers value plain functions and data over elaborate class hierarchies.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Naming conventions',
          text: 'Classes: `PascalCase`. Methods and attributes: `snake_case`. A leading underscore (`_cache`) means "internal, don’t touch from outside". Always define `__repr__` (with `__str__` only if you want a friendlier user-facing text); it takes two minutes and saves hours of debugging.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where classes show up in game and AI code',
          text: 'Entities (`Player`, `Enemy`, `Projectile`), game state (`Board`, `World`), systems (`Renderer`, `AudioMixer`), and — in the second course — environments (`MyGameEnv`), neural-network layers and replay buffers are all classes. Frameworks such as PyTorch and Gymnasium *expect* you to subclass their classes, which is why this unit comes before them.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Python creates a separate copy of each method for every instance, so 1,000 enemies means 1,000 copies of `take_damage`.',
      answer: false,
      explanation: 'False. Methods are stored **once** on the class. Each instance stores only its own data in `__dict__`; the lookup falls back to the class for the shared methods. That is why creating many small objects is cheap.',
    },
    {
      kind: 'error',
      prompt: 'Calling `Counter().increment()` crashes with `AttributeError: \'Counter\' object has no attribute \'count\'`. Tap the line with the bug.',
      lines: [
        'class Counter:',
        '    def __init__(self):',
        '        count = 0',
        '    def increment(self):',
        '        self.count += 1',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`count = 0` creates an ordinary **local variable** that vanishes when `__init__` ends. To make it an attribute, write `self.count = 0`. Without `self.`, `increment` later finds no `count` on the instance.',
    },
    {
      kind: 'concept',
      title: 'Classes are objects too',
      blocks: [
        {
          type: 'p',
          text: 'A class is not a special compile-time construct as in C++; it is a **runtime object** you can store in a variable, put in a dictionary, or pass to a function. That is how factories work (`{"orc": Orc, "elf": Elf}[kind]()`) and why engines can load "whatever class the config file names". Instances are just as open: you can attach attributes to them at any time, and the most common beginner error — forgetting `self` — fails in a very characteristic way.',
        },
        {
          type: 'code',
          title: 'classes_are_objects.py',
          runnable: true,
          code: `class Tmp:
    pass

t = Tmp()
t.anything = 5
print(t.anything, t.__dict__)
print(type(t).__name__, type(Tmp).__name__, type(type(t)).__name__)

class NoSelf:
    def hello():
        return "hi"

try:
    NoSelf().hello()
except TypeError as e:
    print(e)

Alias = Tmp
print(Alias().__class__ is Tmp, Alias is Tmp)
print(Tmp.__mro__[-1].__name__)

def make(kind):
    return {"tmp": Tmp}[kind]()
print(type(make("tmp")).__name__)`,
          output: `5 {'anything': 5}
Tmp type type
NoSelf.hello() takes 0 positional arguments but 1 was given
True True
object
Tmp`,
          annotations: [
            { lines: 2, text: '`pass` is a placeholder for an empty body. An empty class is legal and useful as a quick bag of attributes.' },
            { lines: 5, text: 'Attributes can be added to an instance at any moment — no declaration needed. This flexibility is also why typos create silent new attributes.' },
            { lines: 7, text: 'The class of `t` is `Tmp`; the class of `Tmp` itself is `type`, and so is the type of that. Classes are instances of `type`.' },
            { lines: '9-11', text: 'This method forgot `self`. It looks fine until it is called.' },
            { lines: '13-16', text: '`NoSelf().hello()` passes the instance automatically, but `hello` accepts zero arguments, so Python reports "takes 0 positional arguments but 1 was given". If you see this message with a *count that is one too low*, you forgot `self`.' },
            { lines: '18-19', text: '`Alias = Tmp` just gives the class object a second name; instances still report the same class.' },
            { lines: 20, text: 'Every class ultimately inherits from `object`; `__mro__` lists the lookup chain, ending at `object`.' },
            { lines: '22-24', text: 'Because classes are values, a function can pick one by key and call it — the heart of the factory pattern.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Python 3 classes all derive from object',
          text: 'You will see old code written `class Player(object):`. In Python 3 that is identical to `class Player:` — every class inherits from `object` automatically. The explicit form is a Python 2 leftover you can safely drop.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class Enemy:`\n`    count = 0`\n`    def __init__(self):`\n`        Enemy.count += 1`\n`a = Enemy(); b = Enemy(); c = Enemy()`\n`del b`\n`print(Enemy.count)`',
      answer: '3',
      hint: 'Does deleting a *name* run any code in the class?',
      explanation: 'Three instances were created, so `__init__` ran three times and `count` is 3. `del b` only removes the *name* `b`; nothing decrements the counter. (Making the count follow object lifetimes needs a `__del__` method or weak references — rarely worth it.)',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Stack` with these methods: `push(item)` adds an item on top; `pop()` removes and returns the top item, raising `IndexError("pop from empty stack")` when empty; `peek()` returns the top item **without** removing it (same error when empty); `is_empty()` returns a bool; `size()` returns the number of items. Every stack must have its own independent storage.',
      starter: `# define class Stack here
`,
      solution: `class Stack:
    def __init__(self):
        self.items = []

    def push(self, item):
        self.items.append(item)

    def pop(self):
        if not self.items:
            raise IndexError("pop from empty stack")
        return self.items.pop()

    def peek(self):
        if not self.items:
            raise IndexError("pop from empty stack")
        return self.items[-1]

    def is_empty(self):
        return not self.items

    def size(self):
        return len(self.items)
`,
      tests: `s = Stack()
assert s.is_empty() is True
assert s.size() == 0
s.push(1)
s.push("two")
assert s.peek() == "two"
assert s.size() == 2
assert s.is_empty() is False
assert s.pop() == "two"
assert s.pop() == 1
assert s.is_empty()
for action in (s.pop, s.peek):
    try:
        action()
        assert False, "should raise IndexError"
    except IndexError as e:
        assert str(e) == "pop from empty stack"
a, b = Stack(), Stack()
a.push(1)
assert b.size() == 0 and a.size() == 1`,
      checks: ['Items come off in last-in, first-out order', '`pop` and `peek` raise `IndexError("pop from empty stack")` when empty', 'Two stacks never share their items'],
      hint: 'Create the list in `__init__` with `self.items = []` (not as a class attribute). `push` appends, `pop` uses `self.items.pop()`, `peek` reads `self.items[-1]`.',
      explanation: 'The list is created in `__init__`, so each stack has its own — the last test would fail if it were a class attribute. Checking for emptiness yourself lets you raise a clear message instead of the generic "pop from empty list". Stacks power undo systems, expression parsers and the call stack itself.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Inventory` that stores item counts. `add(item, qty=1)` adds to the count. `remove(item, qty=1)` subtracts, raising `ValueError` if the inventory holds fewer than `qty` of that item (including an item it has never held); an item whose count reaches 0 disappears. `count(item)` returns the current count (0 if absent). `total()` returns the total number of items. `names()` returns a sorted list of the item names held.',
      starter: `# define class Inventory here
`,
      solution: `class Inventory:
    def __init__(self):
        self._counts = {}

    def add(self, item, qty=1):
        self._counts[item] = self._counts.get(item, 0) + qty

    def remove(self, item, qty=1):
        have = self._counts.get(item, 0)
        if have < qty:
            raise ValueError(f"not enough {item}: have {have}, need {qty}")
        if have == qty:
            del self._counts[item]
        else:
            self._counts[item] = have - qty

    def count(self, item):
        return self._counts.get(item, 0)

    def total(self):
        return sum(self._counts.values())

    def names(self):
        return sorted(self._counts)
`,
      tests: `inv = Inventory()
assert inv.count("potion") == 0
assert inv.total() == 0 and inv.names() == []
inv.add("potion")
inv.add("potion", 2)
inv.add("arrow", 10)
assert inv.count("potion") == 3
assert inv.total() == 13
assert inv.names() == ["arrow", "potion"]
inv.remove("arrow", 4)
assert inv.count("arrow") == 6
inv.remove("potion", 3)
assert inv.count("potion") == 0
assert inv.names() == ["arrow"]
for item, qty in [("arrow", 7), ("sword", 1)]:
    try:
        inv.remove(item, qty)
        assert False, "should raise ValueError"
    except ValueError:
        pass
assert inv.count("arrow") == 6
other = Inventory()
assert other.total() == 0`,
      checks: ['`add` accumulates counts; `count` is 0 for unknown items', '`remove` raises `ValueError` when there are not enough, without changing anything', 'Items that reach 0 are no longer listed by `names()`'],
      hint: 'Keep a dictionary `self._counts` created in `__init__`. Use `.get(item, 0)` to read counts safely, and delete the key when a removal brings it to exactly 0.',
      explanation: 'The dictionary is an *implementation detail* hidden behind the methods (the leading underscore says so), so you could later change the storage without touching callers. `remove` checks the rule *before* changing anything, so a failed removal leaves the inventory intact.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Player` with `__init__(self, name, max_hp=100)` (starting at full health) and methods: `take_damage(amount)` lowers `hp` but never below 0; `heal(amount)` raises `hp` but never above `max_hp`; both return the new `hp` and raise `ValueError` for a negative amount; `is_alive()`; and `status()` returning text like `"Ada: 70/100"`.',
      starter: `# define class Player here
`,
      solution: `class Player:
    def __init__(self, name, max_hp=100):
        self.name = name
        self.max_hp = max_hp
        self.hp = max_hp

    def take_damage(self, amount):
        if amount < 0:
            raise ValueError("amount must be >= 0")
        self.hp = max(0, self.hp - amount)
        return self.hp

    def heal(self, amount):
        if amount < 0:
            raise ValueError("amount must be >= 0")
        self.hp = min(self.max_hp, self.hp + amount)
        return self.hp

    def is_alive(self):
        return self.hp > 0

    def status(self):
        return f"{self.name}: {self.hp}/{self.max_hp}"
`,
      tests: `p = Player("Ada")
assert p.hp == 100 and p.max_hp == 100 and p.name == "Ada"
assert p.take_damage(30) == 70
assert p.status() == "Ada: 70/100"
assert p.heal(50) == 100
assert p.take_damage(200) == 0
assert p.is_alive() is False
assert p.heal(10) == 10
assert p.is_alive() is True
q = Player("Bo", max_hp=50)
assert q.hp == 50 and q.status() == "Bo: 50/50"
assert p.hp == 10
for call in (lambda: p.take_damage(-1), lambda: p.heal(-5)):
    try:
        call()
        assert False, "should raise ValueError"
    except ValueError:
        pass
assert p.hp == 10`,
      checks: ['Health is clamped to the range `0..max_hp`', 'Negative amounts raise `ValueError` and change nothing', '`status()` formats as `name: hp/max_hp`'],
      hint: 'Clamp with `max(0, …)` when taking damage and `min(self.max_hp, …)` when healing. Validate with `if amount < 0: raise ValueError(...)` *before* changing `self.hp`.',
      explanation: 'Putting the rules (clamping, validation) inside the class means every caller gets them for free — the rest of the game cannot accidentally set health to −50. This "keep the invariant inside the object" idea is the core benefit of classes, and the next lesson shows how to protect attributes even more strictly.',
    },
  ],
  takeaways: [
    'A class bundles data (attributes) and behavior (methods). `__init__` sets up each new instance; `self` is the instance, passed automatically: `ada.heal(10)` is `Player.heal(ada, 10)`.',
    'Instance attributes (`self.hp`) belong to one object, stored in its `__dict__`; class attributes are shared. Assigning through an instance creates an instance attribute that shadows the class one.',
    'Never put mutable defaults (lists, dicts) in the class body or in default arguments — create them in `__init__` so each instance gets its own.',
    '`is` tests identity, `==` defaults to identity for your own classes, and `b = a` makes an alias. Define `__repr__` for readable output.',
    'Use a class when state and its behavior belong together or you need many independent copies; plain functions and dicts are often simpler. Put rules inside the class so every caller gets them.',
  ],
  reading: [
    { title: 'Classes (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html', source: 'tutorial', note: 'The official tour of classes, instances, class vs instance variables, and inheritance.' },
    { title: 'Data model — Customizing class creation and objects', url: 'https://docs.python.org/3/reference/datamodel.html', source: 'docs', note: 'The precise reference for objects, `__init__`, attributes and special methods.' },
    { title: 'Python Classes: The Power of Object-Oriented Programming', url: 'https://realpython.com/python-classes/', source: 'article', note: 'A long, example-driven Real Python guide that complements this lesson.' },
  ],
};
