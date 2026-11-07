import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-decorators-advanced',
  title: 'Decorators with Arguments and Class Decorators',
  summary: 'Decorator factories like `@repeat(3)` and `@retry(times=5)`, decorators that work with and without parentheses, decorating classes, writing decorators as classes with `__call__`, and decorating methods.',
  minutes: 20,
  objectives: [
    'Explain why `@repeat(3)` needs three nested functions and what Python evaluates first',
    'Write a decorator factory with sensible defaults, such as a `retry(times, exceptions)` decorator',
    'Write a decorator that works both as `@tag` and as `@tag(label="x")`',
    'Decorate a class to add behavior or register it, and know that the decorator must return the class',
    'Implement a decorator as a class with `__init__` and `__call__`, and decorate methods correctly',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Decorators that take arguments: factories',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes a decorator needs settings: how many times to repeat, which exceptions to retry, what to name the log label. The syntax `@repeat(3)` looks like a decorator with an argument, but Python is doing something simpler. It first **evaluates the expression after the `@`** — `repeat(3)` is an ordinary call — and the value it returns must be a decorator, which is then applied to the function. So `repeat` is a **[[decorator-factory|decorator factory]]**: a function that returns a decorator. That gives three levels: the factory (takes the settings), the decorator (takes the function), and the wrapper (takes the call’s arguments).',
        },
        {
          type: 'code',
          title: 'repeat_factory.py',
          runnable: true,
          code: `from functools import wraps

def repeat(times):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = None
            for _ in range(times):
                result = func(*args, **kwargs)
            return result
        return wrapper
    return decorator

out = []

@repeat(3)
def beep():
    out.append("beep")
    return len(out)

print(beep(), out)
manual = repeat(2)(beep)
print(manual.__name__, type(repeat(2)).__name__)`,
          output: `3 ['beep', 'beep', 'beep']
beep function`,
          annotations: [
            { lines: 3, text: 'The **factory** receives the settings (`times`). It runs when the `@repeat(3)` line is evaluated.' },
            { lines: 4, text: 'It returns the real **decorator**, which receives the function. Because it is nested, it can see `times` — a closure.' },
            { lines: '5-10', text: 'The **wrapper** is the same as in a plain decorator: forward the arguments, do the extra work (loop `times` times), return a result. `@wraps` keeps the metadata.' },
            { lines: 11, text: 'The decorator returns the wrapper...' },
            { lines: 12, text: '...and the factory returns the decorator. Count the `return` lines: wrapper, then decorator, then (implicitly) the decorated function replaces the name.' },
            { lines: '16-19', text: '`@repeat(3)` means: evaluate `repeat(3)` to get a decorator, then do `beep = decorator(beep)`. In one line: `beep = repeat(3)(beep)`.' },
            { lines: 21, text: 'The function ran three times: the list has three entries and the last return value (the list length) is 3.' },
            { lines: '22-23', text: 'You can apply a factory by hand: `repeat(2)(beep)`. The factory call returns a plain function, and `wraps` keeps the name `beep`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why three levels?',
          text: 'Each level has one job and gets its inputs at a different time: settings arrive when you write `@repeat(3)`, the function arrives when the `def` finishes, and the call arguments arrive each time the function is used. Closures carry the earlier inputs inward. Once you can name the three levels, every decorator you meet — `@lru_cache(maxsize=128)`, `@pytest.mark.parametrize(...)`, `@torch.no_grad()` — reads the same way.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t forget the parentheses',
          text: 'With a factory, `@repeat` (no parentheses) passes the *function* where `times` should go. `repeat(func)` returns `decorator`, so the decorated name becomes the inner decorator function, and the first real call fails with a baffling `TypeError`. If a decorator takes arguments, always call it — even with none: `@repeat()` if all settings have defaults.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Python meets `@repeat(3)` above `def beep():`. What happens, in order?',
      options: [
        { text: 'It calls `repeat(3)`, then applies the returned decorator to `beep` and rebinds the name', correct: true, why: 'Right: first the expression after `@` is evaluated, then the result is called with the function: `beep = repeat(3)(beep)`.' },
        { text: 'It calls `repeat(beep, 3)` with both values at once', why: '`@` never passes extra arguments; the arguments in `repeat(3)` go to the factory only, and the function goes to the decorator it returns.' },
        { text: 'It applies `repeat` to `beep` and later passes `3` to the result', why: 'The `3` is passed to `repeat` immediately, before the function is involved. Applying `repeat` to the function directly is the no-parentheses form.' },
        { text: 'It stores `3` and calls `beep` three times at definition time', why: 'Nothing calls `beep` at definition time. The repetition happens in the wrapper, when you call the decorated function.' },
      ],
      explanation: 'The expression after `@` is evaluated first. Its result must be a callable that takes the function. So `@repeat(3)` equals `beep = repeat(3)(beep)`: a factory call, followed by a decorator call.',
    },
    {
      kind: 'concept',
      title: 'Real factories: retry and optional arguments',
      blocks: [
        {
          type: 'p',
          text: 'A factory can take keyword arguments with defaults, which is how you build decorators that are configurable but easy to use. A classic example is **retry**: call a function, and if it raises one of the chosen exceptions try again, up to a limit. The last attempt must let the exception escape, and exceptions you did not list must pass through immediately — retrying a programming error only hides it.',
        },
        {
          type: 'code',
          title: 'retry.py',
          runnable: true,
          code: `from functools import wraps

attempts = []

def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions:
                    if attempt == times:
                        raise
        return wrapper
    return decorator

@retry(times=3, exceptions=(ValueError,))
def flaky():
    attempts.append(1)
    if len(attempts) < 3:
        raise ValueError("not yet")
    return "ok"

print(flaky(), len(attempts))

@retry(times=2, exceptions=(KeyError,))
def bad():
    raise ValueError("x")

try:
    bad()
except ValueError:
    print("ValueError passes through")`,
          output: `ok 3
ValueError passes through`,
          annotations: [
            { lines: 5, text: 'The factory has defaults, so `@retry()` means "3 tries, any `Exception`". `exceptions` can be one class or a tuple of classes — exactly what `except` accepts.' },
            { lines: 9, text: 'Attempts are numbered 1 to `times` so the last one is easy to recognize.' },
            { lines: '10-12', text: 'A successful call returns immediately. Only the listed exceptions are caught.' },
            { lines: '13-14', text: 'On the final attempt a bare `raise` re-raises the original exception with its traceback; otherwise the loop simply tries again.' },
            { lines: '18-23', text: '`flaky` fails twice and succeeds on the third try, so the decorated call returns "ok" after 3 attempts.' },
            { lines: 25, text: 'Prints `ok 3`: the result and the number of attempts that were made.' },
            { lines: '27-29', text: '`bad` raises `ValueError`, which is **not** in the `(KeyError,)` list, so it is not caught and the wrapper never retries.' },
            { lines: '31-34', text: 'The caller sees the original `ValueError` immediately.' },
          ],
        },
        {
          type: 'p',
          text: 'One more pattern. Many libraries let you write both `@decorator` and `@decorator(option=...)`. The trick: make the function argument optional, and make the settings keyword-only. If the function was passed, you were used without parentheses, so decorate immediately; if not, return the decorator for Python to apply.',
        },
        {
          type: 'code',
          title: 'optional_arguments.py',
          runnable: true,
          code: `from functools import wraps

def tag(func=None, *, label="log"):
    def decorator(f):
        @wraps(f)
        def wrapper(*a, **k):
            return f"[{label}] {f(*a, **k)}"
        return wrapper
    if func is None:
        return decorator
    return decorator(func)

@tag
def one():
    return "one"

@tag(label="warn")
def two():
    return "two"

print(one(), two())`,
          output: `[log] one [warn] two`,
          annotations: [
            { lines: 3, text: '`func=None` takes the decorated function if there are no parentheses. The `*` makes `label` keyword-only, so `@tag("warn")` cannot be mistaken for a function.' },
            { lines: '4-8', text: 'The real decorator and wrapper are written once, with `label` as a free variable.' },
            { lines: '9-10', text: '`@tag(label="warn")`: no function yet, so return the decorator and let Python apply it.' },
            { lines: 11, text: '`@tag`: Python passed the function directly as `func`, so decorate it right away.' },
            { lines: 21, text: 'Both spellings work: `[log] one` uses the default label, `[warn] two` the custom one.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Keep it simple',
          text: 'The optional-parentheses trick is convenient but adds a branch to every decorator that uses it. For your own code, prefer one clear rule: factories are always called (`@retry()`), plain decorators never are. Use the dual form only when you publish a library and want to match what users expect.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Validate settings early',
          text: 'Check the factory’s arguments *when the factory is called* (for example `if times < 1: raise ValueError(...)`), not inside the wrapper. The mistake is then reported at the `@retry(0)` line at import time, instead of crashing the first time the function is used.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If `retry` is a decorator factory (`def retry(times=3): ...`), then writing `@retry` without parentheses applies the default of 3 attempts.',
      answer: false,
      explanation: 'False. Without parentheses Python calls `retry(func)`, so the *function* is passed as `times`. The result is the inner decorator function, which replaces your function. Use `@retry()` to get the defaults.',
    },
    {
      kind: 'concept',
      title: 'Class decorators and decorator classes',
      blocks: [
        {
          type: 'p',
          text: 'Decorators are not only for functions. A **class decorator** receives a class, may change it, and returns a class (usually the same one). Because classes are mutable objects, the decorator can add methods and attributes, or just register the class. This is exactly how `@dataclass` works: it reads the annotations and adds `__init__`, `__repr__` and `__eq__` to your class. The rule from before still applies: **return the class**, or the name becomes `None`.',
        },
        {
          type: 'code',
          title: 'class_decorators.py',
          runnable: true,
          code: `def add_repr(cls):
    def __repr__(self):
        fields = ", ".join(f"{k}={v!r}" for k, v in vars(self).items())
        return f"{cls.__name__}({fields})"
    cls.__repr__ = __repr__
    return cls

@add_repr
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

print(Point(1, 2))

behaviors = {}

def behavior(name):
    def decorator(cls):
        behaviors[name] = cls
        return cls
    return decorator

@behavior("flee")
class Flee:
    def act(self):
        return "run"

@behavior("chase")
class Chase:
    def act(self):
        return "pursue"

print(sorted(behaviors), behaviors["flee"]().act())`,
          output: `Point(x=1, y=2)
['chase', 'flee'] run`,
          annotations: [
            { lines: '1-6', text: 'A class decorator that adds a `__repr__`: it builds the method, attaches it to the class with `cls.__repr__ = ...` and returns the same class.' },
            { lines: 3, text: '`vars(self)` is the instance’s attribute dictionary, so the repr lists whatever attributes the object has: `x=1, y=2`.' },
            { lines: '8-11', text: '`@add_repr` is `Point = add_repr(Point)`. The class body ran first; the decorator then patches the finished class.' },
            { lines: 13, text: 'The generated `__repr__` is used by `print`: `Point(x=1, y=2)`.' },
            { lines: '17-21', text: 'A **factory** for classes: `behavior("flee")` returns a decorator that records the class under a name and returns it unchanged.' },
            { lines: '23-31', text: 'Two AI behaviors register themselves just by being defined. A game loop can look up behaviors by name from data files.' },
            { lines: 33, text: 'Look up the class by name, instantiate it and use it. New behaviors never require editing this code.' },
          ],
        },
        {
          type: 'p',
          text: 'The other direction: the *decorator itself* can be a class. A class instance is decorated-function-like if it defines **`__call__`**, making it a **[[callable]]**. `__init__` receives the function, `__call__` runs on every call. This is natural when the decorator needs state — a counter, a cache, a history — because state lives in attributes instead of closure variables. Use `functools.update_wrapper(self, func)` (what `@wraps` calls under the hood) to copy the name and docstring onto the instance.',
        },
        {
          type: 'code',
          title: 'decorator_class.py',
          runnable: true,
          code: `from functools import update_wrapper

class Counter:
    def __init__(self, func):
        update_wrapper(self, func)
        self.func = func
        self.count = 0

    def __call__(self, *args, **kwargs):
        self.count += 1
        return self.func(*args, **kwargs)

@Counter
def square(x):
    "Square."
    return x * x

print(square(3), square(4), square.count, square.__name__, square.__doc__)
print(type(square).__name__, callable(square))`,
          output: `9 16 2 square Square.
Counter True`,
          annotations: [
            { lines: '4-7', text: '`@Counter` calls `Counter(square)`, so `__init__` receives the function. State (`count`) is stored on the instance.' },
            { lines: 5, text: '`update_wrapper(self, func)` copies `__name__`, `__doc__` and friends onto the instance, the same job `@wraps` does for a function wrapper.' },
            { lines: '9-11', text: '`__call__` runs when you write `square(3)`: count the call, then forward everything to the original.' },
            { lines: '13-16', text: '`square` is now a `Counter` *instance*, not a function.' },
            { lines: 18, text: 'Calls return the original results (9 and 16); the instance remembers the count (2) and still carries the original name and docstring.' },
            { lines: 19, text: 'It is not a function, but it is callable — and that is all a decorator result needs to be.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Functions are descriptors, instances are not',
          text: 'A plain function stored in a class turns into a **bound method** when accessed through an instance, because functions implement the descriptor protocol (`__get__`). A decorator *class* instance does not, so using it on a method means `self` is not passed to the wrapped function. Function-based decorators work on methods automatically; for class-based ones you must also implement `__get__`. We meet descriptors properly in Unit 13.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'A decorator class with `__call__` is a **functor** — C++’s class with `operator()`. And `partial`, `std::bind` and lambdas in C++ cover similar ground to closures. What Python adds is the `@` syntax and the fact that classes are mutable objects, so a class decorator can modify the class after it is defined, something C++ needs templates or macros to do at compile time.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete this decorator factory so that `@limit(10)` caps the returned number at 10.',
      template: `def limit(max_value):
    def ___(func):
        def wrapper(x):
            return min(func(x), ___)
        return wrapper
    return decorator`,
      templateIsCode: true,
      blanks: [{ answers: ['decorator'] }, { answers: ['max_value'] }],
      wordBank: ['decorator', 'max_value', 'wrapper', 'func'],
      explanation: 'The middle level must be the function named in `return decorator`, and it takes the decorated function (`func`). The setting `max_value` comes from the factory level and is available to the wrapper as a free variable — a closure.',
    },
    {
      kind: 'concept',
      title: 'Methods, caches and library decorators',
      blocks: [
        {
          type: 'p',
          text: 'Function-based decorators work on **methods** without any special effort. Inside a class body, `@logged` decorates a plain function; the wrapper’s `*args` simply receives `self` as the first positional argument and forwards it. The wrapper becomes the class attribute, and Python binds it like any other function when you call it through an instance.',
        },
        {
          type: 'code',
          title: 'decorating_methods.py',
          runnable: true,
          code: `from functools import wraps

log = []

def logged(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        log.append(func.__name__)
        return func(*args, **kwargs)
    return wrapper

class Hero:
    def __init__(self):
        self.hp = 10

    @logged
    def hit(self, dmg):
        self.hp -= dmg
        return self.hp

h = Hero()
print(h.hit(3), h.hit(2), log)`,
          output: `7 5 ['hit', 'hit']`,
          annotations: [
            { lines: 7, text: '`*args` captures `self` together with `dmg`; the wrapper does not need to know it is decorating a method.' },
            { lines: '16-19', text: 'The decorator is applied while the class body runs. The wrapper function, not the original, is stored in the class as `Hero.hit`.' },
            { lines: 22, text: 'Each call is logged, and the method still updates `self.hp`: 10 - 3 = 7, then 7 - 2 = 5.' },
          ],
        },
        {
          type: 'p',
          text: 'Several standard library decorators are factories you already half-know. `functools.lru_cache(maxsize=128)` remembers recent results and exposes statistics through `cache_info()`. Library decorators also live in AI code: `@torch.no_grad()` turns off gradient tracking for a function, and the same object can be used as a `with` statement — the next lesson shows how one class can be both a decorator and a context manager.',
        },
        {
          type: 'code',
          title: 'lru_cache_factory.py',
          runnable: true,
          code: `from functools import lru_cache

@lru_cache(maxsize=2)
def sq(n):
    return n * n

sq(1); sq(2); sq(1); sq(3)
info = sq.cache_info()
print(info.hits, info.misses, info.currsize)`,
          output: `1 3 2`,
          annotations: [
            { lines: 3, text: '`lru_cache(maxsize=2)` is a factory call; its result decorates `sq`. Only the 2 most recently used results are kept.' },
            { lines: 7, text: 'Calls: `sq(1)` miss, `sq(2)` miss, `sq(1)` **hit**, `sq(3)` miss — which evicts the least recently used entry, 2.' },
            { lines: 9, text: 'One hit, three misses, and two entries stored: `1 3 2`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where this shows up in AI code',
          text: 'Training scripts use decorators for everything that wraps a function: `@torch.no_grad()` for inference helpers, `@torch.compile` to speed up a model, `@lru_cache` for expensive config or tokenizer loading, and registries like `@register_env("MyGame-v0")` that map names to environment classes — the same registry pattern you wrote for behaviors.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"How many nested functions does `@deco(arg)` need?" (three: factory, decorator, wrapper); "What does the class decorator need to return?" (the class); "What do you implement to make an instance usable as a decorator?" (`__call__`, plus `__init__` to receive the function); "In what order do stacked decorators with arguments run?" (arguments are evaluated and applied bottom-up; wrappers run top-down).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Each wrapper records when it enters and when it leaves.',
      code: `order = []

def tagger(name):
    def deco(f):
        def w():
            order.append("in " + name)
            f()
            order.append("out " + name)
        return w
    return deco

@tagger("A")
@tagger("B")
def g():
    order.append("g")

g()
print(order)`,
      answer: "['in A', 'in B', 'g', 'out B', 'out A']",
      hint: 'The top decorator is outermost: it enters first and leaves last, like nested function calls.',
      explanation: '`g = tagger("A")(tagger("B")(g))`. Calling `g()` enters A’s wrapper first, which calls B’s wrapper, which calls the original. On the way back out B finishes before A: ordinary call-stack nesting.',
    },
    {
      kind: 'error',
      prompt: 'Defining `hi` prints "hi" twice, and then `hi()` raises `TypeError: \'NoneType\' object is not callable`. Tap the faulty line.',
      lines: [
        'def repeat(times):',
        '    def decorator(func):',
        '        def wrapper(*args, **kwargs):',
        '            for _ in range(times):',
        '                func(*args, **kwargs)',
        '        return wrapper()',
        '    return decorator',
        '@repeat(2)',
        'def hi():',
        '    print("hi")',
        'hi()',
      ],
      linesAreCode: true,
      errorLines: [6],
      explanation: '`wrapper()` *calls* the wrapper while the decorator runs (printing "hi" twice at definition time) and returns its result, `None`, so `hi` becomes `None`. The decorator must return the function object itself: `return wrapper`.',
    },
    {
      kind: 'numeric',
      prompt: 'How many entries does `hits` have at the end?\n\n`hits = []`\n`def repeat(times):`\n`    def deco(f):`\n`        def w():`\n`            for _ in range(times):`\n`                f()`\n`        return w`\n`    return deco`\n`@repeat(2)`\n`@repeat(3)`\n`def hit():`\n`    hits.append(1)`\n`hit()`\n`print(len(hits))`',
      answer: '6',
      hint: 'The outer wrapper calls the inner one twice; the inner one calls `hit` three times each time.',
      explanation: '`repeat(3)` wraps `hit` into a function that runs it 3 times; `repeat(2)` wraps *that* and runs it twice. Nested repetition multiplies: 2 * 3 = 6 appends.',
      label: 'Length:',
    },
    {
      kind: 'code',
      prompt: 'Write a decorator factory `limit_calls(max_calls)`. The decorated function may be called at most `max_calls` times; the next call must raise `RuntimeError("call limit reached")` **without** calling the function. Each decorated function has its own counter. Keep the function’s metadata with `functools.wraps`.',
      starter: `from functools import wraps

def limit_calls(max_calls):
    ...
`,
      solution: `from functools import wraps


def limit_calls(max_calls):
    def decorator(func):
        used = 0

        @wraps(func)
        def wrapper(*args, **kwargs):
            nonlocal used
            if used >= max_calls:
                raise RuntimeError("call limit reached")
            used += 1
            return func(*args, **kwargs)

        return wrapper

    return decorator
`,
      tests: `ran = []

@limit_calls(2)
def ping(x=0):
    """Ping."""
    ran.append(x)
    return x + 1

assert ping() == 1
assert ping(5) == 6
try:
    ping()
    assert False, "third call must raise"
except RuntimeError as e:
    assert str(e) == "call limit reached"
assert ran == [0, 5]
assert ping.__name__ == "ping" and ping.__doc__ == "Ping."

@limit_calls(1)
def other():
    return "o"

assert other() == "o"
try:
    other()
    assert False, "second call must raise"
except RuntimeError:
    pass

@limit_calls(0)
def never():
    return "x"

try:
    never()
    assert False, "zero calls allowed"
except RuntimeError:
    pass`,
      checks: ['Three levels: factory, decorator, wrapper', 'Raises `RuntimeError("call limit reached")` once the limit is used up, without running the function', 'Each decorated function has its own counter; `wraps` preserves metadata'],
      hint: 'Create `used = 0` inside `decorator` (so every decorated function gets its own), define the wrapper with `@wraps(func)`, declare `nonlocal used`, check the limit first, then count and forward the call.',
      explanation: 'The counter is created inside `decorator`, which runs once per decorated function, so counters are independent. The wrapper needs `nonlocal used` because it *rebinds* the variable. The limit check happens before the call, so a refused call never reaches the original function.',
    },
    {
      kind: 'code',
      prompt: 'Write a **class decorator** `count_instances` that adds a class attribute `instances` (starting at 0) and increases it every time an object of the class is created. The class’s own `__init__` must still run with its arguments, and the decorator must return the class. Two decorated classes must count independently.',
      starter: `from functools import wraps

def count_instances(cls):
    ...
`,
      solution: `from functools import wraps


def count_instances(cls):
    original_init = cls.__init__

    @wraps(original_init)
    def __init__(self, *args, **kwargs):
        cls.instances += 1
        original_init(self, *args, **kwargs)

    cls.instances = 0
    cls.__init__ = __init__
    return cls
`,
      tests: `@count_instances
class Orc:
    def __init__(self, name, hp=10):
        self.name = name
        self.hp = hp

assert Orc.instances == 0
a = Orc("a")
b = Orc("b", hp=3)
assert Orc.instances == 2
assert (a.name, a.hp, b.name, b.hp) == ("a", 10, "b", 3)
assert isinstance(a, Orc) and Orc.__name__ == "Orc"

@count_instances
class Elf:
    pass

assert Elf.instances == 0
Elf(); Elf(); Elf()
assert Elf.instances == 3
assert Orc.instances == 2
Orc("c")
assert Orc.instances == 3 and Elf.instances == 3`,
      checks: ['Adds `instances = 0` as a class attribute and returns the same class', 'Wraps `__init__`, calls the original with all arguments, and increments the counter', 'Works for classes without their own `__init__`; classes count independently'],
      hint: 'Keep `original_init = cls.__init__`. Define a new `__init__(self, *args, **kwargs)` that increments `cls.instances` and calls `original_init(self, *args, **kwargs)`. Set `cls.instances = 0` and `cls.__init__ = __init__`, then `return cls`.',
      explanation: 'The decorator patches the finished class: it replaces `__init__` by a wrapper that counts and then delegates. Because `cls.instances` is set per decorated class, counters are separate. A class without its own `__init__` simply delegates to `object.__init__`, so the same code covers it.',
    },
    {
      kind: 'code',
      prompt: 'Write a **decorator class** `Recorder`. Decorating a function with `@Recorder` must produce an object that behaves like the function, keeps its name and docstring (use `functools.update_wrapper`), and stores each **successful** call in a list `calls` as the tuple `(args, kwargs, result)`. Calls that raise must not be recorded, and the exception must propagate.',
      starter: `from functools import update_wrapper

class Recorder:
    ...
`,
      solution: `from functools import update_wrapper


class Recorder:
    def __init__(self, func):
        update_wrapper(self, func)
        self.func = func
        self.calls = []

    def __call__(self, *args, **kwargs):
        result = self.func(*args, **kwargs)
        self.calls.append((args, kwargs, result))
        return result
`,
      tests: `@Recorder
def add(a, b=0):
    """Add."""
    return a + b

assert add(1, 2) == 3
assert add(5, b=1) == 6
assert add.calls == [((1, 2), {}, 3), ((5,), {"b": 1}, 6)]
assert add.__name__ == "add" and add.__doc__ == "Add."
assert isinstance(add, Recorder) and callable(add)

@Recorder
def boom():
    raise ValueError("no")

try:
    boom()
    assert False, "must propagate"
except ValueError:
    pass
assert boom.calls == []
assert len(add.calls) == 2`,
      checks: ['\`__init__\` receives the function and creates the empty \`calls\` list', '\`__call__\` forwards \`*args, **kwargs\`, records \`(args, kwargs, result)\` only after success, and returns the result', '\`update_wrapper\` keeps \`__name__\` and \`__doc__\`'],
      hint: 'In `__init__`: `update_wrapper(self, func)`, store `self.func` and `self.calls = []`. In `__call__`, call `self.func` first; only after it returns, append `(args, kwargs, result)` and return `result`.',
      explanation: 'Calling the function *before* appending means an exception skips the recording line entirely, so failed calls leave no trace while the exception still reaches the caller. State lives in instance attributes, which is the main reason to choose a decorator class over a closure-based one.',
    },
  ],
  takeaways: [
    '`@deco(args)` evaluates `deco(args)` first and applies the returned decorator to the function: `f = deco(args)(f)`. A factory has three levels — factory, decorator, wrapper — linked by closures.',
    'Give factory settings sensible defaults, validate them when the factory is called, and always call factories (`@retry()`); omitting parentheses passes the function as the first setting.',
    'A class decorator receives a class, modifies or registers it, and must **return the class**. `@dataclass` is the best-known example.',
    'A decorator can be a class: `__init__` receives the function, `__call__` handles calls, and `update_wrapper` copies metadata. Instances are not descriptors, so prefer function-based decorators for methods.',
    'Stacked decorators — with or without arguments — are applied bottom-up and run top-down; library decorators like `lru_cache(maxsize=...)` and `torch.no_grad()` follow the same rules.',
  ],
  reading: [
    { title: 'functools — update_wrapper, wraps, lru_cache', url: 'https://docs.python.org/3/library/functools.html', source: 'docs', note: 'Reference for the helpers used in this lesson, including `cache_info()`.' },
    { title: 'The Python data model — Emulating callable objects', url: 'https://docs.python.org/3/reference/datamodel.html#emulating-callable-objects', source: 'docs', note: 'What `__call__` does and how it makes any object callable.' },
    { title: 'PEP 3129 — Class Decorators', url: 'https://peps.python.org/pep-3129/', source: 'pep', note: 'The proposal that extended the `@` syntax from functions to classes.' },
    { title: 'Primer on Python Decorators', url: 'https://realpython.com/primer-on-python-decorators/', source: 'article', note: 'Covers decorators with arguments, class decorators and stateful decorators with many examples.' },
  ],
};
