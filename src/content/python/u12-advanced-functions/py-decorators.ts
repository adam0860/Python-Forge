import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-decorators',
  title: 'Decorators',
  summary: 'Wrapping functions without changing them: what `@decorator` really means, writing wrappers with `*args, **kwargs`, preserving metadata with `functools.wraps`, stacking decorators, and practical patterns like logging, counting and registries.',
  minutes: 20,
  objectives: [
    'Explain that `@deco` above a function is the same as `f = deco(f)` and that it runs at definition time',
    'Write a decorator with a wrapper that forwards arguments and return values (`*args`, `**kwargs`)',
    'Use `functools.wraps` to keep the name, docstring and signature of the decorated function',
    'Predict the order of execution when decorators are stacked',
    'Build practical decorators: call counters, logging with error handling, registries and simple validators',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A decorator is a function that takes a function',
      blocks: [
        {
          type: 'p',
          text: 'You know the pieces: functions are values, and closures remember variables. Put them together. A **[[decorator]]** is a function that **takes a function and returns a function** — usually a new *[[wrapper-function|wrapper]]* that does something extra before or after calling the original. The `@name` line above a `def` is only shorthand: `@shout` followed by `def bye(...)` means `bye = shout(bye)`. After that line, the name `bye` refers to whatever `shout` returned.',
        },
        {
          type: 'code',
          title: 'first_decorator.py',
          runnable: true,
          code: `def shout(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs).upper()
    return wrapper

def hello(name):
    return f"hello {name}"

manual = shout(hello)
print(manual("ada"))

@shout
def bye(name, punctuation="!"):
    return f"bye {name}{punctuation}"

print(bye("bo"), bye("cy", punctuation="?"))
print(type(shout).__name__, bye.__name__)`,
          output: `HELLO ADA
BYE BO! BYE CY?
function wrapper`,
          annotations: [
            { lines: 1, text: 'The decorator receives the original function as its argument. It runs *once*, when the decorated function is defined.' },
            { lines: 2, text: 'The wrapper takes `*args, **kwargs` — "whatever arguments you were given" — so the same decorator works for functions with *any* signature.' },
            { lines: 3, text: 'It forwards the arguments to the original, post-processes the result (here upper-casing it) and returns it. Forgetting to `return` the result is a classic bug.' },
            { lines: 4, text: 'The decorator returns the **wrapper function itself**, not a call of it. This function replaces the original.' },
            { lines: '9-10', text: 'Without the `@` syntax you can decorate by hand: pass the function in and keep the result.' },
            { lines: '12-14', text: '`@shout` is exactly `bye = shout(bye)`, written just above the function so you can see the modification immediately.' },
            { lines: 16, text: 'Positional and keyword arguments all pass through the wrapper: "BYE BO!" and "BYE CY?".' },
            { lines: 17, text: '`shout` itself is a plain function. But `bye` is now the *wrapper* — it even says so in its name. The next step fixes that.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why decorators?',
          text: 'They separate **what a function does** from **cross-cutting concerns** — logging, timing, caching, access checks, retries, registering — so the concern is written once and applied with one line. The function’s own code stays clean, and the extra behavior is visible right at the definition. Most Python frameworks lean on decorators: Flask routes (`@app.route`), pytest fixtures, `@dataclass`, `@property`, `@lru_cache`.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ achieves the same with wrapper classes, templates and higher-order functions (`std::function` wrappers), or macros. Python’s decorators are just closures with syntax sugar: no templates, no macro tricks, and they work on any callable at run time — including methods and classes.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What @ really does',
          text: 'When Python executes a decorated `def`, it (1) creates the function object, (2) calls the decorator with it, (3) binds the *result* to the function’s name. If a decorator returns something that is not a function (for example `None` because you forgot `return wrapper`), the name is bound to that object, and calling it later fails with confusing errors like "`NoneType` object is not callable".',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is `@shout` placed above `def bye(...)` equivalent to?',
      options: [
        { text: '`bye = shout(bye)` — executed once, right after the function is defined', correct: true, why: 'Exactly: the decorator is called with the function and its return value replaces the name `bye`.' },
        { text: '`shout(bye())` — calling `bye` first, then passing the result', why: 'The decorator receives the *function itself*, not the result of calling it.' },
        { text: '`bye = shout()` — calling `shout` without arguments', why: '`shout` needs the function as its argument; the `@` syntax supplies it.' },
        { text: 'It makes Python call `shout` each time `bye` is called, but never changes the name `bye`', why: 'The name `bye` *is* rebound — to the wrapper that `shout` returned. The wrapper is what runs on each call.' },
      ],
      explanation: '`@decorator` is syntactic sugar for `func = decorator(func)`, evaluated once at definition time. From then on, the name refers to the wrapper the decorator returned.',
    },
    {
      kind: 'concept',
      title: 'functools.wraps: keep the original’s identity',
      blocks: [
        {
          type: 'p',
          text: 'Because the decorated name now points to the wrapper, the function’s **`__name__`**, **`__doc__`** and other metadata are those of the wrapper, which breaks help texts, debuggers, logging and tools that inspect functions. The fix is one line: decorate the wrapper with **`functools.wraps(func)`**, which copies the metadata from the original (and sets `__wrapped__` so tools can reach it). Every well-behaved decorator uses it.',
        },
        {
          type: 'code',
          title: 'wraps_demo.py',
          runnable: true,
          code: `from functools import wraps

def plain(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

def proper(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@plain
def a():
    """Doc A."""

@proper
def b():
    """Doc B."""

print(a.__name__, a.__doc__)
print(b.__name__, b.__doc__)
print(b.__wrapped__ is not None)
import inspect
print(inspect.signature(b))`,
          output: `wrapper None
b Doc B.
True
()`,
          annotations: [
            { lines: '3-6', text: '`plain` is the decorator from the previous step: it works, but the decorated function loses its identity.' },
            { lines: '8-12', text: '`@wraps(func)` on the wrapper copies `__name__`, `__doc__`, `__module__`, `__qualname__` and `__dict__` from `func`, and stores the original in `__wrapped__`.' },
            { lines: 22, text: 'Without `wraps`, `a` calls itself "wrapper" and its docstring is gone — tracebacks and help show the wrong information.' },
            { lines: 23, text: 'With `wraps`, `b` keeps its own name and documentation.' },
            { lines: 24, text: '`__wrapped__` gives access to the undecorated function — handy in tests, and used by tools such as `inspect.unwrap`.' },
            { lines: '25-26', text: '`inspect.signature` follows `__wrapped__`, so help systems still show the original parameters (here none) instead of `(*args, **kwargs)`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Make `@wraps` automatic',
          text: 'Put `from functools import wraps` at the top and type `@wraps(func)` above *every* wrapper — no exceptions. The cost is one line; the benefit is correct names in tracebacks, working `help()`, and working introspection for tools like pytest, Sphinx and IDEs.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Wrappers must forward everything',
          text: 'A wrapper must pass along all arguments (`*args, **kwargs`) and **return the original’s return value**. A common bug: calling `func(*args, **kwargs)` but forgetting `return`, so the decorated function suddenly returns `None`. Another: catching exceptions without re-raising, hiding errors from the caller.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a decorator’s wrapper is not decorated with `functools.wraps`, the decorated function keeps its original `__name__` and docstring anyway.',
      answer: false,
      explanation: 'False. The decorated name refers to the *wrapper*, so `__name__` is `"wrapper"` and the docstring is the wrapper’s (usually `None`). `@wraps(func)` copies the original’s metadata onto the wrapper.',
    },
    {
      kind: 'concept',
      title: 'Stacking, registries and definition time',
      blocks: [
        {
          type: 'p',
          text: 'Several decorators can be stacked. They apply **bottom to top** (the one nearest the `def` first), so the *top* decorator becomes the **outermost** wrapper — and runs first when the function is called. Not every decorator needs a wrapper: a decorator may simply *register* the function somewhere and return it unchanged (a plugin registry, a command table, a game-event handler list). And remember: decoration happens at **definition time**, not call time.',
        },
        {
          type: 'code',
          title: 'stacking.py',
          runnable: true,
          code: `from functools import wraps

def bold(func):
    @wraps(func)
    def wrapper(*a, **k):
        return f"<b>{func(*a, **k)}</b>"
    return wrapper

def italic(func):
    @wraps(func)
    def wrapper(*a, **k):
        return f"<i>{func(*a, **k)}</i>"
    return wrapper

@bold
@italic
def text(s):
    return s

print(text("hi"))
print(text.__name__, hasattr(text, "__wrapped__"))`,
          output: `<b><i>hi</i></b>
text True`,
          annotations: [
            { lines: '15-18', text: 'Stacked decorators: `@italic` is applied first (closest to the function), then `@bold` is applied to the result. It is equivalent to `text = bold(italic(text))`.' },
            { lines: 20, text: 'At call time the outermost wrapper (`bold`) runs first and calls the next one inwards. The output nests the same way: `<b><i>hi</i></b>`.' },
            { lines: 21, text: 'Because both wrappers use `wraps`, the final function is still called `text`, and `__wrapped__` points one layer inward.' },
          ],
        },
        {
          type: 'code',
          title: 'registry_and_definition_time.py',
          runnable: true,
          code: `registry = {}
def register(func):
    registry[func.__name__] = func
    return func

@register
def attack():
    return "hit"

@register
def defend():
    return "block"

print(sorted(registry), registry["attack"]())

def trace(func):
    print("decorating", func.__name__)
    return func

@trace
def f():
    pass
print("defined")`,
          output: `['attack', 'defend'] hit
decorating f
defined`,
          annotations: [
            { lines: '2-4', text: 'A **registry decorator** adds the function to a dictionary and returns it **unchanged** — no wrapper at all. Handy for plugin systems, command handlers and event callbacks.' },
            { lines: '6-12', text: 'Merely defining the functions registers them. Later code can look them up by name.' },
            { lines: 14, text: 'The registry now holds both handlers; calling `registry["attack"]()` runs the original function.' },
            { lines: '16-18', text: 'This decorator only *prints* at decoration time. It returns the function untouched.' },
            { lines: '20-23', text: '"decorating f" appears while the function is being **defined** — before "defined", and without `f` ever being called. Decorators run at import time, so keep their top-level code cheap and free of surprises.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Reading a stack',
          text: 'Read stacked decorators from the **bottom up** to see the order they are applied (`italic`, then `bold`), and from the **top down** to see the order the wrappers run at call time (`bold` outermost, then `italic`, then the function). Order matters whenever wrappers interact — for example a cache above a logger caches the logged function, while a logger above a cache logs even cache hits.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Registry decorators in games',
          text: 'Command and event handlers (`@command("attack")`), AI behaviors registered by name (`@behavior("flee")`), console commands, loot-table generators — a registry decorator lets new content be added by writing a function and tagging it, without editing a central list. Flask’s `@app.route("/path")` and pytest’s `@pytest.fixture` work this way.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Practical decorators: logging, counting, memoizing',
      blocks: [
        {
          type: 'p',
          text: 'A few patterns cover most real-world uses. A **logging** decorator records calls and failures — remember to re-raise exceptions after logging. A **counting** decorator stores state on the wrapper itself, since functions can carry attributes. A **memoizing** decorator keeps a dictionary of past results (the standard library’s `lru_cache` is the polished version).',
        },
        {
          type: 'code',
          title: 'logging_and_counting.py',
          runnable: true,
          code: `from functools import wraps

calls = []

def logged(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        calls.append(f"{func.__name__}{args}")
        try:
            return func(*args, **kwargs)
        except Exception as exc:
            calls.append(f"{func.__name__} failed: {type(exc).__name__}")
            raise
    return wrapper

@logged
def divide(a, b):
    return a / b

print(divide(6, 3))
try:
    divide(1, 0)
except ZeroDivisionError:
    print("caught")
print(calls)

def counted(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@counted
def ping():
    return "pong"

ping(); ping()
print(ping.calls)`,
          output: `2.0
caught
['divide(6, 3)', 'divide(1, 0)', 'divide failed: ZeroDivisionError']
2`,
          annotations: [
            { lines: 8, text: 'The log entry is written **before** the call, so even calls that crash are recorded.' },
            { lines: '9-13', text: 'The `try`/`except` records the failure and then `raise` (bare) re-raises the *same* exception. Swallowing it would hide bugs from the caller.' },
            { lines: 20, text: 'The result flows back through the wrapper unchanged: 6 / 3 is 2.0.' },
            { lines: '21-24', text: 'The failing call still raises `ZeroDivisionError` to the caller, which handles it as usual.' },
            { lines: 25, text: 'The log shows both calls and the failure.' },
            { lines: '27-33', text: '`wrapper.calls` is an attribute stored on the function object itself, initialized to 0 right after the wrapper is defined. Each call increments it.' },
            { lines: 40, text: 'Two calls were made, so `ping.calls` is 2. Because `wraps` copied `__dict__`, tools can still see attributes like this.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Decorate behavior, not business logic',
          text: 'Good decorators add generic behavior that is independent of what the function does: timing, caching, retrying, permission checks, tracing. If the wrapper needs to know specifics of the function’s domain, the logic probably belongs in the function (or in a class). Keep decorators small and testable, and document what they do to arguments and return values.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Decorators in AI libraries',
          text: 'PyTorch uses `@torch.no_grad()` to turn off gradient tracking for a function, `@torch.compile` to optimize one, and `@torch.jit.script` to compile it; Gymnasium wrappers and RLGym reward functions are often organized like decorators. After the next lesson (decorators with arguments) you will understand exactly how `@torch.no_grad()` — with parentheses — is built.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What is the output of this code with two stacked decorators?" (apply bottom-up, run top-down); "Why does the decorated function show the name `wrapper`?" (missing `functools.wraps`); "Why does the function return `None` after decoration?" (wrapper forgets `return`, or decorator forgets `return wrapper`).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the decorator so the decorated function runs twice and the result of the second run is returned.',
      template: `def twice(func):
    def wrapper(*args, **kwargs):
        func(*args, **kwargs)
        return ___(*args, **kwargs)
    return ___`,
      templateIsCode: true,
      blanks: [{ answers: ['func'] }, { answers: ['wrapper'] }],
      wordBank: ['func', 'wrapper', 'twice', 'args'],
      explanation: 'The wrapper calls the original (`func`) twice and returns the second result. The decorator must return the **wrapper function itself** (`return wrapper`, not `wrapper()`), because that is what replaces the decorated function.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Decide which wrapper runs first.',
      code: `log = []

def a(f):
    def w():
        log.append("a")
        return f()
    return w

def b(f):
    def w():
        log.append("b")
        return f()
    return w

@a
@b
def run():
    log.append("run")

run()
print(log)`,
      answer: "['a', 'b', 'run']",
      hint: 'The top decorator is the outermost wrapper, so it runs first when called.',
      explanation: '`run = a(b(run))`. Calling `run()` calls `a`’s wrapper first (logs "a"), which calls `b`’s wrapper (logs "b"), which calls the original (logs "run"). Decorators are *applied* bottom-up but *run* top-down.',
    },
    {
      kind: 'error',
      prompt: 'Calling `hi()` raises `TypeError: \'NoneType\' object is not callable`. Tap the faulty line.',
      lines: [
        'def loud(func):',
        '    def wrapper():',
        '        return func().upper()',
        '    wrapper',
        '@loud',
        'def hi():',
        '    return "hi"',
        'print(hi())',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The decorator never **returns** the wrapper — line 4 just mentions the name, so `loud` returns `None`, and `hi` becomes `None`. The fix is `return wrapper`. Whenever a decorated function turns into `None`, check that the decorator returns something.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`def add_one(f):`\n`    def w(x):`\n`        return f(x) + 1`\n`    return w`\n`@add_one`\n`@add_one`\n`def base(x):`\n`    return x * 2`\n`print(base(5))`',
      answer: '12',
      hint: 'The original gives 10; each wrapper adds 1 on the way out.',
      explanation: '`base(5)` computes `5 * 2 = 10`. The inner `add_one` wrapper turns that into 11 and the outer one into 12. Both wrappers apply their `+ 1` to the result of the layer below.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a decorator `count_calls` that counts how many times the decorated function has been called. The wrapper must pass through all arguments and the return value, expose the count as `wrapper.calls`, and provide `wrapper.reset()` that sets the count back to 0. Use `functools.wraps` so the name and docstring survive.',
      starter: `from functools import wraps

def count_calls(func):
    ...
`,
      solution: `from functools import wraps


def count_calls(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)

    def reset():
        wrapper.calls = 0

    wrapper.calls = 0
    wrapper.reset = reset
    return wrapper
`,
      tests: `@count_calls
def add(a, b=0):
    """Add numbers."""
    return a + b

assert add.calls == 0
assert add(1, 2) == 3
assert add(1, b=5) == 6
assert add.calls == 2
add.reset()
assert add.calls == 0
assert add(4) == 4 and add.calls == 1
assert add.__name__ == "add"
assert add.__doc__ == "Add numbers."

@count_calls
def hello():
    return "hi"

assert hello() == "hi"
assert hello.calls == 1 and add.calls == 1
hello.reset()
assert hello.calls == 0 and add.calls == 1
try:
    add()
    assert False, "missing argument must still raise TypeError"
except TypeError:
    pass`,
      checks: ['Forwards `*args, **kwargs` and returns the original result', '`wrapper.calls` counts calls; `wrapper.reset()` sets it back to 0', 'Uses `@wraps`; each decorated function has its own counter'],
      hint: 'Inside the decorator define `wrapper` with `@wraps(func)`. Increment `wrapper.calls` before calling `func(*args, **kwargs)` and return its result. Initialize `wrapper.calls = 0`, define `reset()` and attach it as `wrapper.reset`.',
      explanation: 'Function objects can carry attributes, so the wrapper stores its own state without a global variable. Each decoration creates a new wrapper (and a new counter), so two decorated functions never interfere. The counter is incremented before the call, so calls that raise an exception are counted, too.',
    },
    {
      kind: 'code',
      prompt: 'Write a decorator `require_positive` that checks every argument (positional **and** keyword): if any argument is an `int` or `float` (but not a `bool`) that is `<= 0`, raise `ValueError("arguments must be positive")` **without calling** the function. Other argument types (strings, lists, …) are ignored. Preserve the function’s metadata.',
      starter: `from functools import wraps

def require_positive(func):
    ...
`,
      solution: `from functools import wraps


def require_positive(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        for value in (*args, *kwargs.values()):
            if (
                isinstance(value, (int, float))
                and not isinstance(value, bool)
                and value <= 0
            ):
                raise ValueError("arguments must be positive")
        return func(*args, **kwargs)

    return wrapper
`,
      tests: `ran = []

@require_positive
def area(w, h):
    """Area."""
    ran.append((w, h))
    return w * h

assert area(2, 3) == 6
assert area(2, h=4) == 8
for bad in (lambda: area(0, 3), lambda: area(2, h=-1), lambda: area(-1.5, 2)):
    try:
        bad()
        assert False, "should raise ValueError"
    except ValueError as e:
        assert str(e) == "arguments must be positive"
assert ran == [(2, 3), (2, 4)]
assert area.__name__ == "area" and area.__doc__ == "Area."

@require_positive
def label(text, n, flag=False):
    return f"{text}:{n}:{flag}"

assert label("x", 2) == "x:2:False"
assert label("", 1, flag=True) == "::1:True".replace("::1", ":1")
assert label("neg", 5, flag=False) == "neg:5:False"
@require_positive
def noargs():
    return "ok"
assert noargs() == "ok"`,
      checks: ['Checks positional and keyword argument values before calling', 'Ignores non-numbers and booleans', '`ValueError("arguments must be positive")` without running the function; metadata preserved'],
      hint: 'Loop over `(*args, *kwargs.values())`. For each value that is an int/float, not a bool, and `<= 0`, raise `ValueError("arguments must be positive")`. Only after the loop, `return func(*args, **kwargs)`.',
      explanation: 'The checks run before the original function, so invalid calls never reach it — the test’s `ran` list proves it. `bool` is a subclass of `int` in Python (`True == 1`), which is why booleans need an explicit exclusion. Validation decorators keep guard code out of every function body.',
    },
    {
      kind: 'code',
      prompt: 'Write your own caching decorator `memoize` for functions called with **positional, hashable arguments**. Keep results in a dictionary exposed as `wrapper.cache` (keyed by the argument tuple). Repeated calls with the same arguments must not run the function again. Use `functools.wraps`.',
      starter: `from functools import wraps

def memoize(func):
    ...
`,
      solution: `from functools import wraps


def memoize(func):
    cache = {}

    @wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]

    wrapper.cache = cache
    return wrapper
`,
      tests: `calls = []

@memoize
def slow_add(a, b):
    """Add."""
    calls.append((a, b))
    return a + b

assert slow_add(1, 2) == 3
assert slow_add(1, 2) == 3
assert slow_add(2, 1) == 3
assert calls == [(1, 2), (2, 1)]
assert slow_add.cache == {(1, 2): 3, (2, 1): 3}
assert slow_add.__name__ == "slow_add" and slow_add.__doc__ == "Add."

@memoize
def fib(n):
    return n if n < 2 else fib(n - 1) + fib(n - 2)

assert fib(60) == 1548008755920
assert len(fib.cache) == 61

@memoize
def greet(name):
    return "hi " + name
assert greet("a") == "hi a"
assert list(greet.cache) == [("a",)]
assert list(slow_add.cache) == [(1, 2), (2, 1)]`,
      checks: ['Results are stored in `wrapper.cache` keyed by the argument tuple', 'A repeated call does not run the function again', 'Each decorated function has its own cache'],
      hint: 'Create `cache = {}` in the decorator, define `wrapper(*args)`: if `args` is not in the cache, store `func(*args)`; then return `cache[args]`. Attach `wrapper.cache = cache` and return the wrapper.',
      explanation: 'The decorator’s closure holds `cache`, so it persists between calls but is private to this decoration. Recursive calls inside `fib` go through the *decorated* name `fib`, so they benefit from the cache too — which turns exponential time into linear. The standard `functools.lru_cache` does the same with eviction and statistics.',
    },
  ],
  takeaways: [
    'A decorator is a function that takes a function and returns a function. `@deco` above `def f` means `f = deco(f)`, executed once at definition time.',
    'A typical decorator defines a wrapper `(*args, **kwargs)` that forwards arguments, does extra work, and **returns the original’s result**; the decorator returns the wrapper (not a call of it).',
    'Always decorate the wrapper with `@functools.wraps(func)` so `__name__`, `__doc__`, the signature and `__wrapped__` survive.',
    'Stacked decorators are applied bottom-up and run top-down (the top one is outermost). Registry decorators just record the function and return it unchanged.',
    'Use decorators for generic cross-cutting behavior — logging, counting, caching, validation, registration — and keep them small. Re-raise exceptions you only wanted to log.',
  ],
  reading: [
    { title: 'Function definitions — Decorators (Python Language Reference)', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions', source: 'docs', note: 'The precise semantics of the `@` syntax and the order in which decorators apply.' },
    { title: 'functools.wraps', url: 'https://docs.python.org/3/library/functools.html#functools.wraps', source: 'docs', note: 'What `wraps` copies and how `__wrapped__` is used.' },
    { title: 'PEP 318 — Decorators for Functions and Methods', url: 'https://peps.python.org/pep-0318/', source: 'pep', note: 'The 2003 proposal that introduced the `@` syntax, including the long debate about its spelling.' },
    { title: 'Primer on Python Decorators', url: 'https://realpython.com/primer-on-python-decorators/', source: 'article', note: 'A long, example-rich Real Python tutorial that builds decorators step by step.' },
  ],
};
