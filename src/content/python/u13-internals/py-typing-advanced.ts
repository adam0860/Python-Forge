import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-typing-advanced',
  title: 'Advanced Type Hints: Generics, Protocols and Type Checkers',
  summary: 'Type hints beyond the basics: what Python does (and doesn’t) do with annotations, generics with the modern `[T]` syntax, `Literal`, `TypedDict`, `Final`, `Self`, `NewType`, typed decorators with `ParamSpec`, `@overload`, and using mypy or Pyright.',
  minutes: 20,
  objectives: [
    'Explain that annotations are not enforced at run time and how tools read them (`__annotations__`, `get_type_hints`)',
    'Write generic functions and classes with the modern `def f[T]` and `class C[T]` syntax and type aliases with `type`',
    'Use `Literal`, `TypedDict`, `Final`, `ClassVar`, `Self`, `NewType` and `@overload` to describe code precisely',
    'Type a decorator so it preserves the signature of the decorated function (`ParamSpec`)',
    'Read type-checker output, and know the limits of static types (`cast`, `TYPE_CHECKING`, `isinstance` with generics)',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Hints are for tools, not for the interpreter',
      blocks: [
        {
          type: 'p',
          text: 'You met [[type-hint|type hints]] in Unit 6: `def area(w: int) -> int`. Here is the key fact to build on: **Python ignores them when running your code.** Annotations are stored (in `__annotations__`) so that *other programs* can read them: a **[[type-checker|type checker]]** such as mypy or Pyright, your editor’s autocomplete, documentation generators, and libraries like `dataclasses` and Pydantic that build behavior from annotations. A hint is a promise you make to your tools, not a contract Python enforces.',
        },
        {
          type: 'code',
          title: 'hints_not_enforced.py',
          runnable: true,
          code: `def wrong(x: int) -> int:
    return x

print(wrong("not an int"))

x: int = "oops"
print(x)

def fn(a: int, b: "list[str]", c: int | None = None) -> bool:
    return True

from typing import get_type_hints
print(get_type_hints(fn))`,
          output: `not an int
oops
{'a': <class 'int'>, 'b': list[str], 'c': int | None, 'return': <class 'bool'>}`,
          annotations: [
            { lines: '1-2', text: 'The hint says `int`, but nothing checks it. Python happily runs the function with a string.' },
            { lines: 4, text: 'No `TypeError`: the call succeeds and prints the string. A type checker, by contrast, would flag this line **before** the program runs.' },
            { lines: '6-7', text: 'Variable annotations are ignored just the same: `x` holds a string despite `: int`.' },
            { lines: 9, text: 'Hints can use `|` for unions (Python 3.10+) and may be written as strings (a "forward reference") when a name isn’t defined yet.' },
            { lines: '12-13', text: '`typing.get_type_hints` is how tools read annotations: it collects them into a dictionary and evaluates string hints. (`fn.__annotations__` also has them, but unevaluated.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why add hints if nothing enforces them?',
          text: 'Because tools can enforce them **before** you run: an editor underlines a wrong argument as you type, autocomplete knows what methods an object has, and a checker in your CI finds the bug in the branch your tests never reach. In a large codebase, hints also act as always-up-to-date documentation. This gradual approach — add hints where they pay off, leave the rest dynamic — is called **gradual typing**.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Annotations in Python 3.14',
          text: 'Before 3.14, annotations were evaluated when the `def` ran, so a class could not mention itself without quotes (`"Node"`) or `from __future__ import annotations`. Python 3.14 evaluates annotations **lazily** (PEP 649/749): you can use forward references naturally, and tools get them through `annotationlib` or `get_type_hints`. Older versions still need the quotes, so you will see both styles in the wild.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ types are enforced by the compiler and decide how memory is laid out; Python hints are optional metadata and change nothing about how code runs. The closest C++ analogies are templates (generics, next step) and concepts (protocols). A type checker plays the role of the compiler’s type-checking phase, but you run it separately — and can adopt it one file at a time.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A function is annotated `def double(x: int) -> int`. What happens at run time when you call `double("ab")`?',
      options: [
        { text: 'It runs normally and returns `"abab"` — Python does not check annotations', correct: true, why: 'Annotations are metadata. Only a separate type checker (or a library that chooses to check) would complain.' },
        { text: 'Python raises `TypeError` because `"ab"` is not an `int`', why: 'Python never validates arguments against hints on its own. A `TypeError` would only come from inside the function, e.g. when `x * 2` fails.' },
        { text: 'Python converts `"ab"` to an `int` automatically', why: 'There is no automatic conversion. The string is passed through unchanged.' },
        { text: 'The program refuses to start, because the call contradicts the annotation', why: 'Python does not analyze types before running. Detecting this before the program starts is exactly the job of a tool like mypy.' },
      ],
      explanation: 'Type hints are ignored by the interpreter. `"ab" * 2` is valid Python, so the call succeeds. A type checker such as mypy would report the call as an error without running the code.',
    },
    {
      kind: 'concept',
      title: 'Generics: one definition, many types',
      blocks: [
        {
          type: 'p',
          text: 'How do you type a function that returns the first item of *any* list? `list[int]` is too narrow and `list[Any]` loses information — a checker would not know what comes out. The answer is a **[[generic]]**: a function or class with a **type parameter** that stands for "whatever type is used here". Since Python 3.12 the syntax is simple: `def first[T](items: list[T]) -> T` and `class Stack[T]:`. The checker infers `T` from the call — `first([3, 1])` returns an `int`, `first(["a"])` a `str`. The older spelling is `T = TypeVar("T")`; you will see it in existing code. The new `type` statement creates aliases, and they can be generic too.',
        },
        {
          type: 'code',
          title: 'generics.py',
          runnable: true,
          code: `def first[T](items: list[T]) -> T:
    return items[0]

class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        return self._items.pop()

type Pair[A] = tuple[A, A]

def swap[A](p: Pair[A]) -> Pair[A]:
    return (p[1], p[0])

print(first([3, 1]), first(["a"]))
s = Stack[int]()
s.push(1)
s.push(2)
print(s.pop(), type(s).__name__, Stack.__type_params__)
print(swap((1, 2)), Pair.__name__)`,
          output: `3 a
2 Stack (T,)
(2, 1) Pair`,
          annotations: [
            { lines: '1-2', text: '`[T]` after the function name declares a type parameter. "Whatever type of item the list holds, that is the type I return." The checker infers `T` at each call.' },
            { lines: '4-12', text: 'A generic class: `Stack[T]` is a stack of some item type. Every method that mentions `T` is tied to the same choice, so a `Stack[int]` can only push and pop `int`s.' },
            { lines: 14, text: 'A generic **type alias** with the `type` statement: a `Pair[A]` is a tuple of two `A`s.' },
            { lines: '16-17', text: 'Generic functions can use aliases: swapping a `Pair[int]` returns a `Pair[int]`.' },
            { lines: 19, text: 'Both calls work at run time; a checker infers `int` for the first and `str` for the second.' },
            { lines: 20, text: '`Stack[int]()` selects the type for the checker. At run time `int` is simply recorded — it doesn’t restrict anything.' },
            { lines: '21-23', text: 'Pushing and popping behave like a plain stack. `__type_params__` shows the declared parameter `T`.' },
            { lines: 24, text: 'The aliased tuple is swapped. The `type` statement created a `Pair` object.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Bounds and constraints',
          text: 'Limit what `T` can be: `def biggest[T: (int, float)](a: T, b: T) -> T` allows only those two types; `def top[T: Comparable](items: list[T])` requires `T` to match a protocol such as one defining `__lt__`. Without a bound, `T` could be anything, and the checker will refuse `a < b` because not every type supports it.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Use the built-in generics',
          text: 'Since Python 3.9 the ordinary collections are generic themselves: `list[int]`, `dict[str, float]`, `tuple[int, ...]`, `set[str]`. Prefer `collections.abc` types (`Sequence`, `Iterable`, `Mapping`) for **parameters** — they accept more — and concrete types (`list[int]`) for **return values**. The old `typing.List`/`Dict` aliases are obsolete.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If `s = Stack[int]()`, then pushing a string with `s.push("a")` raises a `TypeError` when the program runs.',
      answer: false,
      explanation: 'False. `Stack[int]` is information for type checkers; at run time nothing stops the push. mypy or Pyright would report `s.push("a")` as an error before the program runs, but Python itself runs it happily.',
    },
    {
      kind: 'concept',
      title: 'Precise types: Literal, TypedDict, Self, overloads and typed decorators',
      blocks: [
        {
          type: 'p',
          text: 'The `typing` module offers tools for describing code precisely. **`Literal["easy", "hard"]`** allows only specific values. **`TypedDict`** gives a dictionary a fixed set of keys with typed values — perfect for JSON-like config and game data. **`Final`** marks a constant, **`ClassVar`** a class-level attribute, **`Self`** the type of "the same class as `self`" (for methods returning `self`, such as builders), and **`NewType`** creates a distinct type so that a `UserId` cannot be mixed up with a plain `int`.',
        },
        {
          type: 'code',
          title: 'precise_types.py',
          runnable: true,
          code: `from typing import Literal, TypedDict, Final, NewType, ClassVar, Self

Mode = Literal["easy", "hard"]

class Enemy(TypedDict):
    name: str
    hp: int

MAX_HP: Final = 100
UserId = NewType("UserId", int)

class Counter:
    total: ClassVar[int] = 0

    def __init__(self) -> None:
        Counter.total += 1

    def me(self) -> Self:
        return self

orc: Enemy = {"name": "orc", "hp": 10}
uid = UserId(5)
print(orc["hp"], type(orc).__name__)
print(uid + 1, type(uid).__name__)
print(Counter().me().total)`,
          output: `10 dict
6 int
1`,
          annotations: [
            { lines: 3, text: '`Literal` lists the only values allowed — an enum-like type without a class. A checker rejects `"medium"` for a `Mode`.' },
            { lines: '5-7', text: 'A `TypedDict` describes a dict with exactly the keys `name` (a `str`) and `hp` (an `int`). Misspelled or missing keys become errors in the checker.' },
            { lines: 9, text: '`Final` tells the checker that `MAX_HP` must never be reassigned. (The interpreter does not stop you.)' },
            { lines: 10, text: '`NewType` makes `UserId` a distinct *type* for the checker, so `UserId` and `int` are not interchangeable by accident.' },
            { lines: 13, text: '`ClassVar` marks `total` as shared by the class, not a per-instance attribute.' },
            { lines: '18-19', text: '`Self` means "the type of the object this method was called on", which stays correct in subclasses. Methods that `return self` for chaining should use it.' },
            { lines: 21, text: 'At run time a `TypedDict` value *is* a plain `dict`, and the annotation costs nothing.' },
            { lines: 24, text: 'A `NewType` call at run time just returns its argument: `uid` is really an ordinary `int`. The distinction exists only for the checker.' },
          ],
        },
        {
          type: 'p',
          text: 'Two more tools solve problems you already know. A **decorator** returns a wrapper — but a naive hint like `Callable[..., Any]` loses the decorated function’s signature, so the checker can no longer verify calls. **`ParamSpec`** (`[**P, R]`) captures the parameters `P` and return type `R` and re-applies them to the wrapper. And **`@overload`** describes functions whose return type depends on the argument types, by listing the allowed signatures; the real implementation follows without a decorator.',
        },
        {
          type: 'code',
          title: 'typed_decorator_and_overload.py',
          runnable: true,
          code: `from collections.abc import Callable
from typing import overload

def logged[**P, R](func: Callable[P, R]) -> Callable[P, R]:
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        return func(*args, **kwargs)
    return wrapper

@logged
def add(a: int, b: int = 0) -> int:
    return a + b

print(add(1, b=2))

@overload
def conv(x: int) -> str: ...
@overload
def conv(x: str) -> int: ...
def conv(x):
    return str(x) if isinstance(x, int) else int(x)

print(conv(5), conv("7"))`,
          output: `3
5 7`,
          annotations: [
            { lines: 4, text: '`[**P, R]` declares a parameter list `P` and a return type `R`. The decorator takes a function of type `Callable[P, R]` and returns one with the *same* parameters and return type.' },
            { lines: 5, text: 'The wrapper takes exactly `P.args` and `P.kwargs` — "whatever parameters the original had" — and returns `R`.' },
            { lines: '9-11', text: 'With this typing, a checker still knows `add` takes `(a: int, b: int = 0)` and returns `int`; a call like `add("x")` is flagged. (With `Callable[..., Any]` it would not be.)' },
            { lines: '15-18', text: 'Two **overload** signatures: an `int` argument gives a `str`, a `str` argument gives an `int`. The `...` bodies are placeholders: overloads are only for the checker.' },
            { lines: '19-20', text: 'The actual implementation has no decorator and no precise hints. It runs for every call; only this one exists at run time.' },
            { lines: 22, text: 'A checker infers `str` for `conv(5)` and `int` for `conv("7")` without any unions or casts.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where this matters in AI and games',
          text: 'Training configs are often `TypedDict`s or dataclasses so that a misspelled key (`"learnng_rate"`) is caught immediately; PyTorch code uses `Tensor` hints and `Callable` for loss functions; libraries like Gymnasium describe environments with generic types (`Env[ObsType, ActType]`). Typed decorators keep editor autocomplete working on wrapped functions — the same decorators you wrote in the previous unit.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"Are type hints enforced at run time?" (no); "What does `def f[T](x: T) -> T` mean?" (the return type is the same as the argument’s); "Why use `Literal` or `TypedDict`?" (to catch wrong values or keys statically); "Which tool checks hints?" (mypy, Pyright/Pylance); "Why does `isinstance(x, list[int])` fail?" (generic aliases can’t be checked at run time).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete this generic class so the type of the stored item and the type returned by `get` are linked by one type parameter.',
      template: `class Box[T]:
    def __init__(self, item: ___) -> None:
        self.item = item

    def get(self) -> ___:
        return self.item`,
      templateIsCode: true,
      blanks: [{ answers: ['T'] }, { answers: ['T'] }],
      wordBank: ['T', 'Any', 'int', 'item'],
      explanation: 'Using the *same* type parameter `T` for the input and the output tells the checker they are the same type: a `Box[int]` returns `int`, a `Box[str]` returns `str`. `Any` would throw that information away.',
    },
    {
      kind: 'concept',
      title: 'Using a type checker (and its limits)',
      blocks: [
        {
          type: 'p',
          text: 'To use hints you need a checker. **mypy** (`pip install mypy`, then `mypy game.py`) is the reference tool; **Pyright** powers Pylance in VS Code and underlines problems as you type. Both read your annotations, infer types of unannotated code where they can, and report mismatches — **without running anything**. The code below has three deliberate mistakes; the checker finds them all, though the program itself would only fail at the last line.',
        },
        {
          type: 'code',
          title: 'game.py',
          code: `from typing import Literal, TypedDict

class Enemy(TypedDict):
    name: str
    hp: int

def heal(enemy: Enemy, amount: int) -> int:
    return enemy["hp"] + amount

def start(mode: Literal["easy", "hard"]) -> str:
    return mode

orc: Enemy = {"name": "orc", "hp": 10}
print(heal(orc, "5"))
start("medium")
print(orc["mana"])`,
          annotations: [
            { lines: '3-5', text: 'The `TypedDict` fixes the keys of `orc`.' },
            { lines: 14, text: 'A string where `heal` expects an `int` for `amount`. At run time this would raise `TypeError` *inside* `heal`... eventually.' },
            { lines: 15, text: '`"medium"` is not one of the allowed `Literal` values.' },
            { lines: 16, text: '`Enemy` has no key `"mana"`. At run time this is a `KeyError`.' },
          ],
        },
        {
          type: 'code',
          lang: 'text',
          title: 'mypy game.py',
          code: `game.py:14: error: Argument 2 to "heal" has incompatible type "str"; expected "int"  [arg-type]
game.py:15: error: Argument 1 to "start" has incompatible type "Literal['medium']"; expected "Literal['easy', 'hard']"  [arg-type]
game.py:16: error: TypedDict "Enemy" has no key "mana"  [typeddict-item]
Found 3 errors in 1 file (checked 1 source file)`,
        },
        {
          type: 'p',
          text: 'Static types have limits you should know. A checker can’t see everything, so you sometimes tell it what you know: **`cast(T, value)`** says "trust me, this is a `T`" (it does nothing at run time), and `# type: ignore` silences one line. **`typing.TYPE_CHECKING`** is `False` when the program runs but `True` for checkers — used to import names only for hints, avoiding circular imports. And generic aliases such as `list[int]` exist only for tools: `isinstance(x, list[int])` raises `TypeError`, because the elements can’t be inspected cheaply — use `isinstance(x, list)`.',
        },
        {
          type: 'code',
          title: 'runtime_limits.py',
          runnable: true,
          code: `from typing import TYPE_CHECKING, cast

print(isinstance([1], list), isinstance(3, int | str))
try:
    isinstance([1], list[int])
except TypeError:
    print("generic aliases can't be checked at runtime")
print(cast(int, "str"))
print(TYPE_CHECKING)`,
          output: `True True
generic aliases can't be checked at runtime
str
False`,
          annotations: [
            { lines: 3, text: '`isinstance` accepts a class or a union of classes (`int | str`), and checks the actual object.' },
            { lines: '4-7', text: 'A parameterized generic like `list[int]` is not a class. Python refuses to test it, because it would have to inspect every element.' },
            { lines: 8, text: '`cast` returns its argument unchanged. It only changes what the *checker* believes, so a wrong cast hides real bugs.' },
            { lines: 9, text: '`TYPE_CHECKING` is `False` while the program runs and `True` for the checker — the standard way to import names that are only needed for hints.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Any switches checking off',
          text: '`Any` is compatible with everything, so values typed `Any` (including the result of unannotated functions and `cast(Any, ...)`) are not checked at all, and the "infection" spreads to whatever you assign them to. Prefer a real type, a generic, a union or `object`; use `Any` only at genuinely untyped boundaries, such as parsed JSON.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Adopt types gradually',
          text: 'Start by annotating public function signatures and run the checker in CI and in your editor. Turn on stricter options one at a time (`--strict` in mypy, `"typeCheckingMode": "strict"` in Pyright) as the codebase becomes clean. Hints in tests and throwaway scripts are optional; hints at module boundaries pay off most.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Remember what Python does with annotations at run time.',
      code: `def double(x: int) -> int:
    return x * 2

print(double("ab"), double(2.5))`,
      answer: 'abab 5.0',
      hint: 'The hints do nothing at run time, so `*` works on whatever object arrives.',
      explanation: 'Neither call is checked. `"ab" * 2` repeats the string and `2.5 * 2` is `5.0`. A type checker would flag both calls, but Python itself just runs them.',
    },
    {
      kind: 'error',
      prompt: 'A type checker reports `Argument 1 to "start" has incompatible type "Literal[\'medium\']"; expected "Literal[\'easy\', \'hard\']"`. Tap the line it reports.',
      lines: [
        'from typing import Literal',
        'def start(mode: Literal["easy", "hard"]) -> str:',
        '    return mode',
        'start("easy")',
        'start("medium")',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'The checker reports the **call** that violates the signature, not the definition: `"medium"` is not one of the allowed `Literal` values. Run normally, Python accepts it without a word — only the checker catches it.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`from typing import Literal, get_args`\n`Mode = Literal["easy", "normal", "hard"]`\n`print(len(get_args(Mode)))`',
      answer: '3',
      hint: '`get_args` returns the values listed inside the `Literal`.',
      explanation: '`get_args(Literal["easy", "normal", "hard"])` returns the tuple of its three values, so its length is 3. `get_args` and `get_origin` are the tools libraries use to inspect hints at run time.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a generic function `first_or[T](items: list[T], default: T) -> T` using the modern `[T]` syntax. It returns the first item of the list, or `default` if the list is empty.',
      starter: `def first_or(items, default):
    ...
`,
      solution: `def first_or[T](items: list[T], default: T) -> T:
    return items[0] if items else default
`,
      tests: `assert first_or([3, 4], 0) == 3
assert first_or([], 0) == 0
assert first_or(["a"], "z") == "a"
assert first_or([], None) is None
assert first_or([0], 9) == 0
assert len(first_or.__type_params__) == 1
assert first_or.__type_params__[0].__name__ == "T"`,
      checks: ['Declares one type parameter with \`def first_or[T](...)\`', 'Returns the first item, or the default for an empty list', 'Treats a first item of 0 or "" as a real item (checks emptiness, not truthiness of the item)'],
      hint: 'The signature is `def first_or[T](items: list[T], default: T) -> T:`. Test the *list* (`if items`), not the first item, so that `0` still counts as an item.',
      explanation: 'The type parameter `T` links the list’s element type, the default and the result type: `first_or([1], 0)` is an `int`, `first_or([], "x")` is a `str`. The emptiness test must be on the list, otherwise a legitimate first item such as `0` would be replaced by the default.',
    },
    {
      kind: 'code',
      prompt: 'Write a generic class `Stack[T]` with `push(item)`, `pop()`, `peek()` and `len(stack)`. `pop()` and `peek()` on an empty stack must raise `IndexError("empty stack")`. Annotate with the `T` type parameter.',
      starter: `class Stack:
    ...
`,
      solution: `class Stack[T]:
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("empty stack")
        return self._items.pop()

    def peek(self) -> T:
        if not self._items:
            raise IndexError("empty stack")
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)
`,
      tests: `s = Stack[int]()
assert len(s) == 0
s.push(1)
s.push(2)
assert s.peek() == 2 and len(s) == 2
assert s.pop() == 2
assert s.pop() == 1
assert len(s) == 0
for op in (s.pop, s.peek):
    try:
        op()
        assert False, "must raise IndexError"
    except IndexError as e:
        assert str(e) == "empty stack"

names = Stack[str]()
names.push("a")
assert names.pop() == "a"
assert len(Stack.__type_params__) == 1
t = Stack()
t.push(None)
assert len(t) == 1 and t.pop() is None`,
      checks: ['Declares \`class Stack[T]\` and annotates methods with \`T\`', '\`push\`, \`pop\`, \`peek\` and \`len()\` work', 'Empty \`pop\`/\`peek\` raise \`IndexError("empty stack")\`'],
      hint: 'Store the items in a list created in `__init__`. For `pop` and `peek` check `if not self._items:` first and raise `IndexError("empty stack")`; define `__len__` for `len(stack)`.',
      explanation: 'The type parameter exists for checkers; at run time the class is an ordinary stack backed by a list (and `Stack[int]()` works just like `Stack()`). Raising `IndexError` mirrors the built-in list behavior, and checking emptiness explicitly gives a clearer message than the default "pop from empty list".',
    },
    {
      kind: 'code',
      prompt: 'Write a decorator `enforce_types` that checks arguments against the **plain-class** annotations of the decorated function at call time. Use `typing.get_type_hints` and `inspect.signature(...).bind`, apply defaults, and raise `TypeError(f"{name} must be {cls.__name__}")` if a value is not an instance of its annotated class. Annotations that are not plain classes (such as `int | None`) and parameters without annotations are not checked. Keep the metadata with `functools.wraps`.',
      starter: `import inspect
from functools import wraps
from typing import get_type_hints

def enforce_types(func):
    ...
`,
      solution: `import inspect
from functools import wraps
from typing import get_type_hints


def enforce_types(func):
    hints = get_type_hints(func)
    signature = inspect.signature(func)

    @wraps(func)
    def wrapper(*args, **kwargs):
        bound = signature.bind(*args, **kwargs)
        bound.apply_defaults()
        for name, value in bound.arguments.items():
            hint = hints.get(name)
            if isinstance(hint, type) and not isinstance(value, hint):
                raise TypeError(f"{name} must be {hint.__name__}")
        return func(*args, **kwargs)

    return wrapper
`,
      tests: `@enforce_types
def area(w: int, h: int = 1, label: str = "", extra: int | None = None, note=None) -> int:
    """Area."""
    return w * h

assert area(2, 3) == 6
assert area(2, extra=None) == 2
assert area(2, 2, "box", 5, note=object()) == 4
assert area.__name__ == "area" and area.__doc__ == "Area."

def message(call):
    try:
        call()
    except TypeError as e:
        return str(e)
    return None

assert message(lambda: area("2")) == "w must be int"
assert message(lambda: area(2, h=3.5)) == "h must be int"
assert message(lambda: area(2, label=5)) == "label must be str"
assert message(lambda: area(w="x")) == "w must be int"
assert message(lambda: area()) is not None

@enforce_types
def greet(name: str, times: int = 1):
    return name * times

assert greet("ab", 2) == "abab"
assert message(lambda: greet(5)) == "name must be str"
assert message(lambda: greet("a", "2")) == "times must be int"`,
      checks: ['Reads hints with \`get_type_hints\` and arguments with \`signature.bind\` + \`apply_defaults\`', 'Raises \`TypeError("<name> must be <class>")\` for plain-class annotations only', 'Ignores unannotated and union-annotated parameters; preserves metadata'],
      hint: 'Compute `hints` and `signature` once, outside the wrapper. Inside it: `bound = signature.bind(*args, **kwargs)`, `bound.apply_defaults()`, then loop over `bound.arguments.items()` and check `isinstance(hint, type)` before `isinstance(value, hint)`.',
      explanation: 'This is a miniature version of what libraries like Pydantic do: they read the annotations at run time and act on them. `isinstance(hint, type)` filters out unions and generic aliases (which can’t be used with `isinstance`), and `bind` copes with positional, keyword and default arguments uniformly. A missing required argument makes `bind` itself raise `TypeError`.',
    },
  ],
  takeaways: [
    'Python does **not** enforce type hints at run time. They are metadata (`__annotations__`, `get_type_hints`) for type checkers (mypy, Pyright), editors and libraries.',
    'Generics use a type parameter: `def first[T](items: list[T]) -> T` and `class Stack[T]`. The `type` statement makes (generic) aliases; `Stack[int]` has no run-time effect.',
    '`Literal`, `TypedDict`, `Final`, `ClassVar`, `Self`, `NewType` and `@overload` describe code precisely for the checker; `ParamSpec` (`[**P, R]`) keeps the signature of decorated functions.',
    'Run a checker (`mypy file.py`, or Pylance in VS Code) to find mismatches before running the program. Use `cast`, `# type: ignore` and `Any` sparingly — they switch checking off.',
    'Generic aliases like `list[int]` can’t be used with `isinstance`; `TYPE_CHECKING` is `True` only for checkers. Adopt typing gradually, starting at public function signatures.',
  ],
  reading: [
    { title: 'typing — Support for type hints', url: 'https://docs.python.org/3/library/typing.html', source: 'docs', note: 'The reference for every construct in this lesson.' },
    { title: 'PEP 695 — Type Parameter Syntax', url: 'https://peps.python.org/pep-0695/', source: 'pep', note: 'The proposal for `def f[T]`, `class C[T]` and the `type` statement.' },
    { title: 'Static typing with Python (typing.python.org)', url: 'https://typing.python.org/en/latest/', source: 'docs', note: 'The official typing guides, specification and the cheat sheet maintained with the type checkers.' },
    { title: 'mypy documentation', url: 'https://mypy.readthedocs.io/en/stable/', source: 'docs', note: 'Getting started, configuration and a cheat sheet for the reference type checker.' },
    { title: 'Python Type Checking (Guide)', url: 'https://realpython.com/python-type-checking/', source: 'article', note: 'A long practical tutorial from first hints to generics and checker setup.' },
  ],
};
