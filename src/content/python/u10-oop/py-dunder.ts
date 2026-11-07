import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-dunder',
  title: 'Special (Dunder) Methods',
  summary: 'How Python’s data model lets your classes behave like built-in types: `__repr__`/`__str__`, equality and hashing, operator overloading, ordering, container behavior (`len`, indexing, `in`, iteration) and callable objects.',
  minutes: 20,
  objectives: [
    'Explain how `len(x)`, `x + y`, `x == y`, `for … in x` and `print(x)` map to special methods',
    'Implement `__repr__`, `__str__`, `__eq__` and `__hash__` correctly and know how they interact',
    'Overload arithmetic operators and return `NotImplemented` for unsupported operand types',
    'Make a class sortable with `__lt__` and `functools.total_ordering`',
    'Build container-like and callable classes using `__len__`, `__getitem__`, `__contains__`, `__iter__` and `__call__`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The data model: syntax calls methods',
      blocks: [
        {
          type: 'p',
          text: 'Most Python syntax is shorthand for **[[dunder-method|special methods]]** — methods with double underscores on both sides ("**d**ouble **under**score", so *dunder*). `len(x)` calls `x.__len__()`, `x + y` calls `x.__add__(y)`, `x == y` calls `x.__eq__(y)`, `x[i]` calls `x.__getitem__(i)`, `for item in x` calls `x.__iter__()`. Python’s built-ins ask your object to cooperate, and if it defines the right methods, it plugs into the whole language. This is how a `Vec` can use `+`, a `Deck` can be sorted, and a PyTorch tensor can be indexed like a list.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'You almost never call them directly',
          text: 'Write `len(deck)`, not `deck.__len__()`. Special methods are *hooks for Python to call*. The exception is calling the parent’s version through `super()`. The built-in function (`len`, `repr`, `abs`, `bool`…) also adds checks — for instance `len` insists the result is a non-negative integer.',
        },
        {
          type: 'table',
          headers: ['You write', 'Python calls', 'Typical purpose'],
          rows: [
            ['`repr(x)`, shown in lists/debugger', '`x.__repr__()`', 'Unambiguous developer text'],
            ['`str(x)`, `print(x)`, f-strings', '`x.__str__()`', 'Friendly user-facing text'],
            ['`x == y`', '`x.__eq__(y)`', 'Equality of value'],
            ['`hash(x)`, set/dict keys', '`x.__hash__()`', 'Fast lookup identity'],
            ['`x + y`, `x - y`, `x * y`', '`__add__`, `__sub__`, `__mul__`', 'Arithmetic'],
            ['`x < y`, sorting', '`x.__lt__(y)`', 'Ordering'],
            ['`len(x)`, `bool(x)`', '`__len__`, `__bool__`', 'Size, truthiness'],
            ['`x[i]`, `x[i] = v`, `i in x`', '`__getitem__`, `__setitem__`, `__contains__`', 'Container behavior'],
            ['`for a in x`', '`x.__iter__()`', 'Iteration'],
            ['`x(args)`', '`x.__call__(args)`', 'Callable objects'],
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Operator overloading, minus the syntax',
          text: 'This is Python’s `operator+` and `operator==`, `operator[]`, `operator()` and `operator bool`. Instead of special `operator` syntax, you define methods with fixed names. Python adds some safety: `__eq__`/`__hash__` are tied together, and an operator can *decline* by returning `NotImplemented` so Python tries the other operand.',
        },
      ],
    },
    {
      kind: 'concept',
      title: '__repr__, __str__, __eq__ and __hash__',
      blocks: [
        {
          type: 'p',
          text: '`__repr__` should be **unambiguous** and ideally look like the code that rebuilds the object; `__str__` is the **readable** version and falls back to `__repr__` if absent. Defining `__eq__` changes what `==` means from "same object" to "same value". Because equal objects must have equal hashes, Python sets `__hash__ = None` (unhashable) whenever you define `__eq__` without `__hash__`. Define both if instances should work as dictionary keys or set members.',
        },
        {
          type: 'code',
          title: 'vec_equality.py',
          runnable: true,
          code: `class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Vec({self.x}, {self.y})"

    def __str__(self):
        return f"<{self.x}, {self.y}>"

    def __eq__(self, other):
        if not isinstance(other, Vec):
            return NotImplemented
        return (self.x, self.y) == (other.x, other.y)

    def __hash__(self):
        return hash((self.x, self.y))

a, b = Vec(1, 2), Vec(1, 2)
print(a == b, a is b, a != Vec(0, 0), a == (1, 2))
print(repr(a), str(a), f"{a}", [a])
print(len({a, b, Vec(3, 4)}))
seen = {a: "start"}
print(seen[Vec(1, 2)])

class NoHash:
    def __init__(self, v):
        self.v = v
    def __eq__(self, other):
        return self.v == other.v
try:
    {NoHash(1)}
except TypeError as e:
    print(type(e).__name__)`,
          output: `True False True False
Vec(1, 2) <1, 2> <1, 2> [Vec(1, 2)]
2
start
TypeError`,
          annotations: [
            { lines: '5-6', text: '`__repr__` mirrors the constructor call. It is what you see in a list, in the debugger and in error messages.' },
            { lines: '8-9', text: '`__str__` is for people: used by `print` and f-strings. Containers still use `__repr__` for their elements.' },
            { lines: '11-14', text: '`__eq__` compares *values*. Returning `NotImplemented` (not `False`!) for foreign types lets Python try the other operand’s `__eq__` before falling back to identity.' },
            { lines: '16-17', text: '`__hash__` must agree with `__eq__`: equal vectors need equal hashes. Hashing the same tuple of fields guarantees that. Only hash *immutable* data — a hash must not change while the object sits in a set.' },
            { lines: 20, text: '`a == b` is now `True` although `a is b` is still `False`. `!=` works automatically (it inverts `__eq__`). `a == (1, 2)` is `False`: both sides declined, so Python falls back to identity.' },
            { lines: 21, text: 'In a list the element shows its `__repr__`; `print` and f-strings use `__str__`.' },
            { lines: 22, text: 'The set holds only two vectors: `a` and `b` are equal with equal hashes, so they collapse into one entry.' },
            { lines: '23-24', text: 'Equal keys find each other in a dictionary: a *new* `Vec(1, 2)` retrieves the value stored under `a`.' },
            { lines: '26-34', text: 'A class that defines `__eq__` but no `__hash__` becomes **unhashable**; putting it in a set raises `TypeError`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'repr first, str only if you need it',
          text: 'If you implement only one, make it `__repr__` — `print`, f-strings and the debugger all fall back to it. A good habit is `f"{type(self).__name__}(...)"` so subclasses print correctly. Add `__str__` when the user-facing text should differ, such as a score board line or a formatted clock.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Hash and equality must agree',
          text: 'If `a == b` then `hash(a) == hash(b)` must hold. Violating it silently corrupts sets and dictionaries (lookups fail or duplicates appear). And never use a **mutable** field in `__hash__`: mutating an object after inserting it into a set can make it unfindable. If objects must change, don’t make them hashable — or hash only an immutable id.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In `a + b`, Python calls `a.__add__(b)`, which returns `NotImplemented` because `b` is an `int`. What happens next?',
      options: [
        { text: 'Python tries `b.__radd__(a)`, and raises `TypeError` if that also declines', correct: true, why: 'Yes: `NotImplemented` means "I don’t know how" and triggers the reflected method on the right operand; if that declines too, `TypeError` results.' },
        { text: 'The expression evaluates to the special value `NotImplemented`', why: 'The interpreter never hands `NotImplemented` back to your code from an operator; it uses it as a signal.' },
        { text: 'Python raises `NotImplementedError` immediately', why: '`NotImplementedError` is a different thing, raised deliberately by abstract methods. Operators should *return* the `NotImplemented` constant, not raise.' },
        { text: 'Python converts `b` to the type of `a` and retries', why: 'Python never converts operands automatically.' },
      ],
      explanation: 'Returning `NotImplemented` politely declines and gives the other operand a chance (`__radd__`, `__rmul__`…). If nobody handles it you get the familiar "unsupported operand type(s)" `TypeError`.',
    },
    {
      kind: 'concept',
      title: 'Operator overloading: arithmetic, unary, truthiness',
      blocks: [
        {
          type: 'p',
          text: 'Arithmetic operators map to `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__floordiv__`, `__mod__`, `__pow__` and friends; unary ones to `__neg__`, `__abs__`. The **reflected** variants (`__radd__`, `__rmul__`) handle the case where *your* object is on the right: `2 * vec` first tries `int.__mul__(2, vec)`, which declines, then `vec.__rmul__(2)`. `__bool__` defines truthiness (falling back to `__len__`, and otherwise always `True`).',
        },
        {
          type: 'code',
          title: 'vec_operators.py',
          runnable: true,
          code: `import math

class Vec:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):
        return f"Vec({self.x}, {self.y})"

    def __add__(self, other):
        if not isinstance(other, Vec):
            return NotImplemented
        return Vec(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        if not isinstance(k, (int, float)):
            return NotImplemented
        return Vec(self.x * k, self.y * k)

    __rmul__ = __mul__

    def __neg__(self):
        return Vec(-self.x, -self.y)

    def __abs__(self):
        return math.hypot(self.x, self.y)

    def __bool__(self):
        return self.x != 0 or self.y != 0

a, b = Vec(3, 4), Vec(1, 1)
print(a + b, a * 2, 2 * a, -a)
print(abs(a), bool(Vec(0, 0)), bool(a))
try:
    a + 1
except TypeError as e:
    print(e)
try:
    a * a
except TypeError as e:
    print(e)
print(sum([a, b, b], Vec(0, 0)))`,
          output: `Vec(4, 5) Vec(6, 8) Vec(6, 8) Vec(-3, -4)
5.0 False True
unsupported operand type(s) for +: 'Vec' and 'int'
unsupported operand type(s) for *: 'Vec' and 'Vec'
Vec(5, 6)`,
          annotations: [
            { lines: '10-13', text: '`+` builds and returns a **new** vector (operators normally don’t modify their operands). The `isinstance` guard returns `NotImplemented` for anything that is not a `Vec`.' },
            { lines: '15-18', text: 'Multiplication here means scaling by a number. A vector times a vector is declined, because the meaning (dot? cross? element-wise?) is ambiguous.' },
            { lines: 20, text: '`2 * a` would fail without this: `int` doesn’t know about vectors, so Python tries `a.__rmul__(2)`. Reusing `__mul__` works because scaling is commutative.' },
            { lines: '22-23', text: 'Unary minus (`-a`) calls `__neg__`.' },
            { lines: '25-26', text: '`abs(a)` calls `__abs__` — for a vector, its length (3-4-5 triangle).' },
            { lines: '28-29', text: '`__bool__` makes the zero vector falsy, so `if vec:` reads naturally.' },
            { lines: 32, text: 'All four operators produce what you would expect, including `2 * a` thanks to `__rmul__`.' },
            { lines: '34-37', text: 'Both declined: Python raises the standard `TypeError`, with a helpful message you didn’t have to write.' },
            { lines: 42, text: '`sum` works too — it starts from the `start` value you provide (a zero vector, since `0 + Vec` isn’t defined) and uses `+` repeatedly.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Overload only when the meaning is obvious',
          text: 'Operators should do what readers expect: `+` for adding vectors or concatenating, `*` for scaling. If a reader would have to look up what `a @ b` or `a | b` means for your class, a named method (`a.dot(b)`) is clearer. Libraries earn their operators through convention: `pathlib` uses `/` for joining paths, NumPy uses `@` for matrix multiplication, PyTorch overloads everything for tensors.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'In-place operators',
          text: '`x += y` first looks for `__iadd__`; if the class has none, Python falls back to `x = x + y` (using `__add__`). Mutable containers like `list` define `__iadd__` to modify in place — which is why `a += [1]` changes every alias of `a`, while `a = a + [1]` does not. Immutable-style classes like our `Vec` simply omit it.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a class defines `__eq__` but not `__hash__`, its instances can still be used as dictionary keys and set members.',
      answer: false,
      explanation: 'False. Defining `__eq__` without `__hash__` makes Python set `__hash__` to `None`, so instances become unhashable and `{obj}` raises `TypeError`. Add a matching `__hash__` (built from immutable fields) to restore it.',
    },
    {
      kind: 'concept',
      title: 'Ordering and total_ordering',
      blocks: [
        {
          type: 'p',
          text: 'Sorting needs only `__lt__` (less-than) — `sorted` and `list.sort` use nothing else. But `<=`, `>`, `>=` would each need their own method. The decorator `functools.total_ordering` writes the rest for you from `__eq__` and any **one** ordering method. The comparison must be a consistent order, so base it on one clear key, like a tuple.',
        },
        {
          type: 'code',
          title: 'version_ordering.py',
          runnable: true,
          code: `from functools import total_ordering

@total_ordering
class Version:
    def __init__(self, text):
        self.parts = tuple(int(p) for p in text.split("."))

    def __repr__(self):
        return f"Version({'.'.join(map(str, self.parts))!r})"

    def __eq__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts == other.parts

    def __lt__(self, other):
        if not isinstance(other, Version):
            return NotImplemented
        return self.parts < other.parts

v1, v2, v3 = Version("1.2.10"), Version("1.10.0"), Version("1.2.9")
print(v1 < v2, v1 > v3, v3 <= v1, v1 >= v1, v1 != v2)
print(sorted([v1, v2, v3]))
print(max(v1, v2, v3))
print("1.2.10" < "1.2.9", v1 > v3)`,
          output: `True True True True True
[Version('1.2.9'), Version('1.2.10'), Version('1.10.0')]
Version('1.10.0')
True True`,
          annotations: [
            { lines: 3, text: '`@total_ordering` generates `__le__`, `__gt__` and `__ge__` from the two methods we define.' },
            { lines: 6, text: 'Converting each part to an `int` is the whole point: `"10"` must be larger than `"9"`.' },
            { lines: 9, text: 'Nested quotes inside an f-string are fine in modern Python. `!r` shows the text with quotes.' },
            { lines: '11-14', text: '`__eq__` compares the same key as the ordering — mixing different keys would give inconsistent results.' },
            { lines: '16-19', text: '`__lt__` compares tuples, which compare element by element. `(1, 2, 10) < (1, 10, 0)` is true because 2 < 10.' },
            { lines: 22, text: 'All six comparison operators now work, even though we wrote only two methods.' },
            { lines: '23-24', text: '`sorted` and `max` work out of the box on any mix of versions.' },
            { lines: 25, text: 'Compare with plain strings: `"1.2.10" < "1.2.9"` is `True` (text order) — exactly the bug the class prevents. The version objects correctly say 1.2.10 is newer.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why return NotImplemented instead of raising?',
          text: 'Comparing a `Version` with a string should not crash inside your method: returning `NotImplemented` lets Python try the other side (for `==`, it falls back to identity and answers `False`; for `<`, it ends in a clear `TypeError`). Raising yourself would block the other operand from ever taking part.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Which special method wins when both exist?',
      code: `class Bag:
    def __init__(self, *items):
        self.items = list(items)
    def __len__(self):
        return len(self.items)
    def __bool__(self):
        return False

b = Bag(1, 2, 3)
print(len(b), bool(b), "yes" if b else "no")`,
      answer: '3 False no',
      hint: 'Truthiness asks `__bool__` first; `len` always asks `__len__`.',
      explanation: '`len(b)` calls `__len__`, so it is 3. Truthiness (`bool(b)` and the `if b` test) uses `__bool__` when it exists and consults `__len__` only when it doesn’t. Here `__bool__` returns `False`, so `bool(b)` is `False` and the conditional picks `"no"` even though the bag holds three items.',
    },
    {
      kind: 'concept',
      title: 'Containers, iteration and callable objects',
      blocks: [
        {
          type: 'p',
          text: 'Implement `__len__` and `__getitem__` and your class behaves like a **sequence**: indexing, slicing (the slice arrives as an argument), `reversed`, and — via the fallback protocol — iteration and `in` all work. `__setitem__` adds assignment; `__contains__` customizes `in` for speed; `__iter__` returns something to loop over (often written as a generator). Finally, `__call__` makes an *instance* callable like a function that remembers state.',
        },
        {
          type: 'code',
          title: 'deck_container.py',
          runnable: true,
          code: `class Deck:
    def __init__(self, cards):
        self._cards = list(cards)

    def __len__(self):
        return len(self._cards)

    def __getitem__(self, i):
        return self._cards[i]

    def __setitem__(self, i, value):
        self._cards[i] = value

    def __contains__(self, card):
        return card in self._cards

    def __repr__(self):
        return f"Deck({self._cards})"

d = Deck(["A", "K", "Q", "J"])
print(len(d), d[0], d[-1], d[1:3], "Q" in d, "Z" in d)
d[0] = "10"
print(d)
print(list(d))
print([c for c in d if c != "K"])
print(list(reversed(d)))
print(sorted(d))
print(max(d), min(d))`,
          output: `4 A J ['K', 'Q'] True False
Deck(['10', 'K', 'Q', 'J'])
['10', 'K', 'Q', 'J']
['10', 'Q', 'J']
['J', 'Q', 'K', '10']
['10', 'J', 'K', 'Q']
Q 10`,
          annotations: [
            { lines: '5-6', text: '`__len__` powers `len(d)` and, if there is no `__bool__`, truthiness.' },
            { lines: '8-9', text: '`__getitem__` receives whatever is inside the brackets: an int, a negative int, or a `slice` object. Delegating to the underlying list gets negative indexing and slicing for free.' },
            { lines: '11-12', text: '`__setitem__` makes `d[0] = ...` work.' },
            { lines: '14-15', text: '`__contains__` backs the `in` operator. Without it Python would still work (by looping), but here we can delegate to a faster check.' },
            { lines: 21, text: 'Indexing, slicing, `len` and `in` all work on our own class — it feels like a list.' },
            { lines: '24-25', text: 'We wrote no `__iter__`. Python’s fallback protocol calls `__getitem__(0)`, `__getitem__(1)`… until `IndexError`, so `list(d)` and `for` loops work anyway.' },
            { lines: 26, text: '`reversed` needs `__len__` plus `__getitem__`, which is exactly what we have.' },
            { lines: '27-28', text: '`sorted`, `max` and `min` consume any iterable, including ours.' },
          ],
        },
        {
          type: 'code',
          title: 'iter_and_call.py',
          runnable: true,
          code: `class Countdown:
    def __init__(self, n):
        self.n = n
    def __iter__(self):
        n = self.n
        while n > 0:
            yield n
            n -= 1

cd = Countdown(3)
print(list(cd), list(cd), sum(cd))

class Adder:
    def __init__(self, n):
        self.n = n
    def __call__(self, x):
        return x + self.n

add5 = Adder(5)
print(add5(10), callable(add5), list(map(add5, [1, 2])))`,
          output: `[3, 2, 1] [3, 2, 1] 6
15 True [6, 7]`,
          annotations: [
            { lines: '4-8', text: '`__iter__` written with `yield` is a **generator** (Unit 11 explains how they work). Each call to `iter(cd)` starts a fresh countdown from `self.n`.' },
            { lines: 11, text: 'Because every loop gets a fresh generator, the object can be iterated repeatedly: the same list twice, and `sum` still sees 3 + 2 + 1.' },
            { lines: '16-17', text: '`__call__` makes instances callable: `add5(10)` is `add5.__call__(10)`.' },
            { lines: 20, text: '`callable(add5)` is `True`, and the instance can be passed anywhere a function is expected, such as `map`. Unlike a plain function it can hold state (`self.n`).' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where this shows up in AI and game code',
          text: 'PyTorch’s `Dataset` needs `__len__` and `__getitem__`; `nn.Module` instances are callable via `__call__` (`model(x)` runs the layers); tensors overload every operator. Gymnasium environments and RLGym wrap game state in classes that you will write with these same hooks in the second course.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the class so that `Money(100) + Money(50)` works and a list of `Money` objects prints like `[Money(150)]`.',
      template: `class Money:
    def __init__(self, cents):
        self.cents = cents

    def ___(self, other):
        return Money(self.cents + other.cents)

    def ___(self):
        return f"Money({self.cents})"`,
      templateIsCode: true,
      blanks: [{ answers: ['__add__'] }, { answers: ['__repr__'] }],
      wordBank: ['__add__', '__repr__', '__str__', 'add', '__plus__'],
      explanation: '`+` is implemented by `__add__`. Elements shown *inside a list* are displayed with `__repr__`, not `__str__` — that is why `__repr__` is the one to define first.',
    },
    {
      kind: 'error',
      prompt: 'Calling `repr(Point(1))` prints `Point(1)` but then raises `TypeError: __repr__ returned non-string (type NoneType)`. Tap the faulty line.',
      lines: [
        'class Point:',
        '    def __init__(self, x):',
        '        self.x = x',
        '    def __repr__(self):',
        '        print(f"Point({self.x})")',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: '`__repr__` must **return** a string, not print one. The `print` call displays the text but the method returns `None`, which `repr` rejects. The fix: `return f"Point({self.x})"`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class Chain:`\n`    def __len__(self):`\n`        return 7`\n`print(len(Chain()) + len([Chain(), Chain()]))`',
      answer: '9',
      hint: 'The first `len` calls our method; the second counts list elements.',
      explanation: '`len(Chain())` calls `Chain.__len__` and gives 7. `len([Chain(), Chain()])` is the length of a list with two elements, 2. The sum is 9.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Money` that stores whole cents. Requirements: `__init__(self, cents)`; `__repr__` → `Money(1250)`; `__str__` → `"12.50 EUR"` (two decimal places; `Money(5)` is `"0.05 EUR"`); `+` and `-` between `Money` objects; `*` by an `int` in either order (`3 * m` and `m * 3`); `==` and a matching `__hash__`; `<` so a list can be sorted; and `bool()` is `False` only for zero cents. Operations with unsupported types must raise `TypeError` (return `NotImplemented`).',
      starter: `# define class Money here
`,
      solution: `class Money:
    def __init__(self, cents):
        self.cents = cents

    def __repr__(self):
        return f"Money({self.cents})"

    def __str__(self):
        return f"{self.cents // 100}.{self.cents % 100:02d} EUR"

    def __add__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.cents + other.cents)

    def __sub__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return Money(self.cents - other.cents)

    def __mul__(self, k):
        if not isinstance(k, int):
            return NotImplemented
        return Money(self.cents * k)

    __rmul__ = __mul__

    def __eq__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return self.cents == other.cents

    def __hash__(self):
        return hash(self.cents)

    def __lt__(self, other):
        if not isinstance(other, Money):
            return NotImplemented
        return self.cents < other.cents

    def __bool__(self):
        return self.cents != 0
`,
      tests: `m = Money(1250)
assert repr(m) == "Money(1250)"
assert str(m) == "12.50 EUR"
assert str(Money(5)) == "0.05 EUR"
assert Money(100) + Money(250) == Money(350)
assert Money(5) - Money(2) == Money(3)
assert Money(100) * 3 == Money(300)
assert 3 * Money(100) == Money(300)
assert sorted([Money(5), Money(1), Money(3)]) == [Money(1), Money(3), Money(5)]
assert Money(1) < Money(2) and not (Money(2) < Money(1))
assert hash(Money(7)) == hash(Money(7))
assert len({Money(7), Money(7), Money(8)}) == 2
assert (Money(1) == 1) is False
assert bool(Money(0)) is False and bool(Money(1)) is True
assert sum([Money(1), Money(2)], Money(0)) == Money(3)
for bad in (lambda: Money(1) + 5, lambda: Money(1) * 1.5, lambda: Money(1) * Money(1)):
    try:
        bad()
        assert False, "should raise TypeError"
    except TypeError:
        pass`,
      checks: ['`__repr__` and `__str__` format as requested', '`+`, `-`, `*` (both orders) return new `Money` objects', '`__eq__`/`__hash__` agree; `__lt__` makes sorting work', 'Unsupported operand types raise `TypeError` via `NotImplemented`'],
      hint: 'Guard each operator with `isinstance`, returning `NotImplemented` otherwise. Use `__rmul__ = __mul__` for `3 * m`. For `__str__`, `f"{self.cents // 100}.{self.cents % 100:02d} EUR"` pads the cents.',
      explanation: 'Returning `NotImplemented` (instead of raising) lets Python produce the right `TypeError` and gives the other operand a chance. Hashing `self.cents` — the same data `__eq__` compares — keeps equal objects hashing equally, so `Money` works in sets and as dictionary keys.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Grid(width, height, fill=0)` that stores cells in a flat list. Support `grid[x, y]` to read and `grid[x, y] = value` to write (the index arrives as a tuple); an out-of-range position must raise `IndexError`. `len(grid)` is the number of cells; `(x, y) in grid` is `True` only for in-range positions; iterating over the grid yields cell values **row by row** (all of y=0, then y=1, …).',
      starter: `# define class Grid here
`,
      solution: `class Grid:
    def __init__(self, width, height, fill=0):
        self.width = width
        self.height = height
        self._cells = [fill] * (width * height)

    def _index(self, pos):
        x, y = pos
        if not (0 <= x < self.width and 0 <= y < self.height):
            raise IndexError(f"position out of range: {pos}")
        return y * self.width + x

    def __getitem__(self, pos):
        return self._cells[self._index(pos)]

    def __setitem__(self, pos, value):
        self._cells[self._index(pos)] = value

    def __len__(self):
        return len(self._cells)

    def __contains__(self, pos):
        x, y = pos
        return 0 <= x < self.width and 0 <= y < self.height

    def __iter__(self):
        return iter(self._cells)
`,
      tests: `g = Grid(3, 2)
assert len(g) == 6
assert g[0, 0] == 0
g[1, 1] = 5
assert g[1, 1] == 5
assert (2, 1) in g
assert (3, 0) not in g
assert (-1, 0) not in g
assert (0, 2) not in g
for bad in ((3, 0), (0, 2), (-1, 0)):
    try:
        g[bad]
        assert False, "should raise IndexError"
    except IndexError:
        pass
try:
    g[5, 5] = 1
    assert False, "should raise IndexError"
except IndexError:
    pass
g[2, 0] = 7
assert list(g) == [0, 0, 7, 0, 5, 0]
assert sum(g) == 12
h = Grid(2, 2, fill=9)
assert list(h) == [9, 9, 9, 9]
assert g[1, 1] == 5`,
      checks: ['Tuple indexes map to `y * width + x` in a flat list', 'Out-of-range reads and writes raise `IndexError`', '`len`, `in` and iteration behave as specified'],
      hint: 'Write one helper `_index(pos)` that unpacks `x, y`, checks the bounds (raising `IndexError`) and returns `y * self.width + x`; then use it in both `__getitem__` and `__setitem__`. `__iter__` can return `iter(self._cells)`.',
      explanation: 'A single `_index` helper keeps the bounds rule in one place, so reading and writing can never disagree. Grid-like classes are everywhere in game and AI code — tile maps, boards, image buffers — and `grid[x, y]` is much nicer than `cells[y * w + x]` scattered around.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Poly(*coeffs)` for the polynomial `c0 + c1·x + c2·x² + …`. Make instances **callable** (`p(x)` evaluates it), support `+` between polynomials (add matching coefficients; the shorter one counts as zeros), `==` with a matching `__hash__`, and a `__repr__` like `Poly(1, 2, 3)`.',
      starter: `# define class Poly here
`,
      solution: `from itertools import zip_longest


class Poly:
    def __init__(self, *coeffs):
        self.coeffs = tuple(coeffs)

    def __call__(self, x):
        result = 0
        for c in reversed(self.coeffs):
            result = result * x + c
        return result

    def __add__(self, other):
        if not isinstance(other, Poly):
            return NotImplemented
        pairs = zip_longest(self.coeffs, other.coeffs, fillvalue=0)
        return Poly(*(a + b for a, b in pairs))

    def __eq__(self, other):
        if not isinstance(other, Poly):
            return NotImplemented
        return self.coeffs == other.coeffs

    def __hash__(self):
        return hash(self.coeffs)

    def __repr__(self):
        return f"Poly({', '.join(map(str, self.coeffs))})"
`,
      tests: `p = Poly(1, 2, 3)
assert p(2) == 17
assert p(0) == 1
assert Poly(5)(100) == 5
assert Poly(0, 1)(7) == 7
assert list(map(Poly(0, 1), [1, 2, 3])) == [1, 2, 3]
assert Poly(1, 2) + Poly(3, 4) == Poly(4, 6)
assert Poly(1, 2) + Poly(0, 0, 5) == Poly(1, 2, 5)
assert (Poly(1, 2, 3) + Poly(1))(2) == 18
assert repr(p) == "Poly(1, 2, 3)"
assert Poly(1, 2) == Poly(1, 2)
assert Poly(1, 2) != Poly(2, 1)
assert len({Poly(1, 2), Poly(1, 2)}) == 1
try:
    Poly(1) + 1
    assert False, "should raise TypeError"
except TypeError:
    pass`,
      checks: ['`p(x)` evaluates the polynomial through `__call__`', '`+` pads the shorter polynomial with zeros', '`==`, `hash` and `repr` agree with the coefficient tuple'],
      hint: 'Evaluate with Horner’s rule: loop over `reversed(self.coeffs)` doing `result = result * x + c`. For addition, `itertools.zip_longest(a, b, fillvalue=0)` pairs the coefficients.',
      explanation: '`__call__` turns the object into a function that carries its own data — exactly how PyTorch layers work (`layer(x)`). Horner’s rule evaluates a degree-n polynomial with n multiplications instead of computing each power separately.',
    },
  ],
  takeaways: [
    'Special methods are the hooks behind syntax and built-ins: `len(x)` → `__len__`, `x + y` → `__add__`, `x[i]` → `__getitem__`, `for` → `__iter__`, `x()` → `__call__`. You define them; Python calls them.',
    '`__repr__` is for developers (unambiguous; used in lists and debuggers), `__str__` for users. Both must **return** strings. Implement `__repr__` first.',
    'Defining `__eq__` removes the default `__hash__`. If instances are hashable, equal objects must have equal hashes, computed from immutable fields.',
    'Binary operators should return a new object and return `NotImplemented` for unsupported types so Python can try the reflected method (`__radd__`, `__rmul__`) or raise `TypeError`.',
    '`__lt__` plus `@total_ordering` gives all comparisons; `__len__` + `__getitem__` make a class behave like a sequence; `__call__` makes instances behave like functions with state.',
  ],
  reading: [
    { title: 'Data model — Special method names', url: 'https://docs.python.org/3/reference/datamodel.html#special-method-names', source: 'docs', note: 'The official, exhaustive list of special methods and the exact rules for each.' },
    { title: 'A Guide to Python’s Magic Methods', url: 'https://rszalski.github.io/magicmethods/', source: 'article', note: 'A friendly, example-driven tour of the most commonly used dunder methods.' },
    { title: 'Fluent Python (Luciano Ramalho), Part I: The Python Data Model', url: 'https://www.oreilly.com/library/view/fluent-python-2nd/9781492056348/', source: 'book', note: 'The best book-length treatment of this topic; chapter 1 builds a card deck exactly like the one here.' },
  ],
};
