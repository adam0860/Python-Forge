import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-raising',
  title: 'Raising and Defining Exceptions',
  summary: 'How to signal errors yourself with `raise`, which built-in exception to choose, how to define custom exception classes, chain and re-raise exceptions, use `assert` correctly, and a first look at notes and exception groups.',
  minutes: 18,
  objectives: [
    'Raise built-in exceptions with clear messages when a function receives bad input',
    'Choose the right built-in exception (`ValueError`, `TypeError`, `KeyError`, `RuntimeError`, `NotImplementedError`)',
    'Define a custom exception hierarchy for a library or game and attach extra data to it',
    'Use `raise ... from e`, `from None` and a bare `raise` to chain or re-raise, and explain `__cause__` versus `__context__`',
    'Use `assert` only for internal sanity checks, and recognize `add_note`, `ExceptionGroup` and `except*`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'raise: signalling a problem',
      blocks: [
        {
          type: 'p',
          text: 'Catching exceptions is only half the story: *your* functions need to report failures too. A function that is given input it cannot work with should not guess or return a magic value — it should **raise** an exception, which forces the caller to deal with the problem. `raise ExceptionType("message")` creates the exception object and starts it travelling up the stack.',
        },
        {
          type: 'code',
          title: 'raise_basics.py',
          runnable: true,
          code: `def set_hp(player, hp):
    if not isinstance(hp, int):
        raise TypeError(f"hp must be int, not {type(hp).__name__}")
    if hp < 0:
        raise ValueError(f"hp must be >= 0, got {hp}")
    player["hp"] = hp

p = {}
for bad in [10, -5, "ten"]:
    try:
        set_hp(p, bad)
    except (TypeError, ValueError) as e:
        print(type(e).__name__ + ":", e)
    else:
        print("ok", p)`,
          output: `ok {'hp': 10}
ValueError: hp must be >= 0, got -5
TypeError: hp must be int, not str`,
          annotations: [
            { lines: '2-3', text: 'A **guard clause**: check the input first and raise `TypeError` for the wrong type. The message says what was wrong *and* what was received.' },
            { lines: '4-5', text: 'The right type but an unacceptable value is a `ValueError`.' },
            { lines: 6, text: 'This line is only reached for valid input, so the happy path stays flat and easy to read.' },
            { lines: 12, text: 'The caller decides what to do. Here it prints the problem; a game might clamp the value or show a message.' },
            { lines: 14, text: 'The `else` branch of the `try` shows the success case.' },
          ],
        },
        {
          type: 'table',
          headers: ['Raise this', 'When'],
          rows: [
            ['`ValueError`', 'the argument has the right type but an unacceptable value (`hp = -5`)'],
            ['`TypeError`', 'the argument has the wrong type (`hp = "ten"`)'],
            ['`KeyError` / `IndexError`', 'a lookup in your own container-like object fails'],
            ['`RuntimeError`', 'something went wrong that is not covered by a more specific type'],
            ['`NotImplementedError`', 'a method that subclasses are supposed to override'],
            ['`FileNotFoundError`, `PermissionError`…', 'let the standard library raise these for you'],
            ['A custom exception', 'a problem specific to your program or library (next step)'],
          ],
          caption: 'Prefer the most specific built-in that fits, and write a message that helps the reader fix the problem.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Fail fast, fail loudly',
          text: 'Raising at the *first* sign of bad data stops the problem where it is cheapest to find. If `set_hp` quietly stored `"ten"`, the crash would appear much later, in some unrelated damage calculation, and you would spend an hour tracing it back. A precise error at the boundary saves that hour.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Good error messages',
          text: 'Include the offending value (`got -5`), the expectation (`must be >= 0`) and, if useful, the name of the thing involved. `"invalid input"` tells the reader nothing; `"hp must be >= 0, got -5"` tells them everything.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A function `heal(player, amount)` receives `amount = -20`, which is an `int` but makes no sense for healing. Which exception fits best?',
      options: [
        { text: '`TypeError`', why: 'The type (`int`) is correct. `TypeError` is for the wrong *kind* of object.' },
        { text: '`ValueError`', correct: true, why: 'Right: correct type, unacceptable value.' },
        { text: '`KeyError`', why: '`KeyError` is for failed dictionary lookups, which is not what happened.' },
        { text: '`NotImplementedError`', why: 'That is for methods that a subclass is supposed to provide.' },
      ],
      explanation: '`TypeError` means "wrong kind of thing" and `ValueError` means "right kind of thing, bad value". A negative healing amount is a bad value of the right type.',
    },
    {
      kind: 'concept',
      title: 'Defining your own exceptions',
      blocks: [
        {
          type: 'p',
          text: 'Real programs and libraries define their own exception classes so callers can react to *specific* problems: `except InvalidMove:`, not a vague `except Exception:`. A custom exception is just a class that inherits from `Exception` (classes get their own unit later; for now, treat the pattern as a recipe). A common design is one **base** exception for the whole library, with specific subclasses beneath it — callers can then catch one case or *all* of the library’s errors with a single clause.',
        },
        {
          type: 'code',
          title: 'custom_exceptions.py',
          runnable: true,
          code: `class GameError(Exception):
    """Base class for errors raised by the game engine."""

class InvalidMove(GameError):
    def __init__(self, move, reason):
        super().__init__(f"{move}: {reason}")
        self.move = move
        self.reason = reason

def play(move):
    if move not in {"up", "down"}:
        raise InvalidMove(move, "unknown direction")
    return move

try:
    play("sideways")
except GameError as e:
    print(type(e).__name__, "|", e, "|", e.move, e.reason)
print(issubclass(InvalidMove, GameError), InvalidMove.__mro__[1].__name__)`,
          output: `InvalidMove | sideways: unknown direction | sideways unknown direction
True GameError`,
          annotations: [
            { lines: 1, text: 'Inherit from `Exception` (never from `BaseException`). A one-line class with a docstring is often all you need.' },
            { lines: 4, text: '`InvalidMove` is a kind of `GameError`, so `except GameError` catches it, too.' },
            { lines: 5, text: 'Add an `__init__` when the exception should carry **data**, not just a message.' },
            { lines: 6, text: '`super().__init__(message)` makes `str(e)` and tracebacks show a readable message.' },
            { lines: '7-8', text: 'Store the details as attributes so a handler can *use* them (replay the move, show a hint, log the reason) without parsing the text.' },
            { lines: 12, text: 'Raise it exactly like a built-in exception.' },
            { lines: 17, text: 'The handler catches the **base** class, so it handles every present and future `GameError` subclass — one reason to build a hierarchy.' },
            { lines: 19, text: 'The class tree can be inspected: `InvalidMove`’s parent is `GameError`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Naming and organizing exceptions',
          text: 'End the class name with `Error` for failures (`InvalidMove` is acceptable for a domain word; `SaveFileError` is clearer). Keep exceptions in one module (`errors.py`), give each library a base class, and document which functions raise what. The standard library does exactly this: `json.JSONDecodeError` inherits from `ValueError`, so old code catching `ValueError` keeps working.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'In game and tool projects',
          text: 'Typical custom exceptions: `AssetNotFound`, `InvalidSaveFile`, `ConfigError`, `NetworkTimeout`. The main loop then has a few focused handlers (show a message, fall back to a default asset) and one outermost `except Exception` that logs a crash report.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `class ConfigError(Exception):
    pass

try:
    try:
        int("x")
    except ValueError as e:
        raise ConfigError("bad") from e
except ConfigError as err:
    print(type(err.__cause__).__name__, err)`,
      answer: 'ValueError bad',
      hint: '`raise ... from e` records `e` as the new exception’s `__cause__`.',
      explanation: 'The inner `int("x")` raises `ValueError`; the handler raises `ConfigError("bad")` *from* it, so `err.__cause__` is the original `ValueError` and `err` prints its message, `bad`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the two exception patterns: wrap a low-level error in a higher-level one, and re-raise after logging.',
      template: `def load_level(text):
    try:
        return int(text)
    except ValueError as e:
        raise ConfigError("bad level") ___ e

def save(path):
    try:
        write(path)
    except OSError:
        print("save failed")
        ___`,
      templateIsCode: true,
      blanks: [{ answers: ['from'] }, { answers: ['raise'] }],
      wordBank: ['from', 'raise', 'as', 'assert'],
      explanation: '`raise NewError(...) from e` links the new exception to the one that caused it. A bare `raise` inside an `except` block re-raises the *current* exception unchanged, letting you log or clean up and still let the caller see the failure.',
    },
    {
      kind: 'concept',
      title: 'Chaining and re-raising',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes you catch a low-level exception and want to raise a higher-level one: a `ValueError` from `int()` becomes a `ConfigError` that names the file or level. Use **`raise NewError(...) from e`** so the traceback shows both, labelled "The above exception was the direct cause of the following exception". Inside an `except` block, a bare **`raise`** re-raises the exception being handled — perfect for "log it, then let it continue".',
        },
        {
          type: 'code',
          title: 'chaining.py',
          runnable: true,
          code: `class ConfigError(Exception):
    pass

def load_level(text):
    try:
        return int(text)
    except ValueError as e:
        raise ConfigError(f"bad level {text!r}") from e

try:
    load_level("x")
except ConfigError as err:
    print(err)
    print(repr(err.__cause__))

def logged(f):
    try:
        f()
    except ZeroDivisionError:
        print("logging the failure...")
        raise

try:
    logged(lambda: 1 / 0)
except ZeroDivisionError as e:
    print("caller still sees", type(e).__name__)`,
          output: `bad level 'x'
ValueError("invalid literal for int() with base 10: 'x'")
logging the failure...
caller still sees ZeroDivisionError`,
          annotations: [
            { lines: 8, text: '`from e` stores the original as `__cause__`. The `!r` in the message shows the offending text with its quotes.' },
            { lines: 13, text: 'The handler gets the friendly high-level error…' },
            { lines: 14, text: '…and can still inspect the low-level cause if it needs to.' },
            { lines: 21, text: 'A bare `raise` re-raises the *same* exception object, keeping its original traceback. The caller sees the failure as if nothing had intercepted it.' },
            { lines: 24, text: '`lambda: 1 / 0` is a tiny function that fails; `logged` runs it, logs, and re-raises.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: '__cause__ versus __context__',
          text: 'Raising a new exception while handling another sets `__context__` automatically ("during handling of the above exception, another exception occurred"). Writing `from e` sets `__cause__` explicitly and marks the link as intentional. `raise NewError from None` suppresses the context entirely — use it only when the earlier exception is an implementation detail that would just confuse the reader.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t `raise e` to re-raise',
          text: 'Inside a handler, write a bare `raise`, not `raise e`. It is shorter, preserves the traceback exactly and cannot accidentally change the exception type or lose the original location.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'It is good practice to use `assert amount >= 0` to validate arguments that come from users or files, because a failed `assert` raises an exception.',
      answer: false,
      explanation: 'False. Assertions can be switched off entirely (running Python with `-O` removes them), so validation that must always happen should use an explicit `if … raise ValueError(...)`. Use `assert` only for internal sanity checks — conditions that can only fail if your own code has a bug.',
    },
    {
      kind: 'error',
      prompt: 'The author wants a custom exception for failed saves, but raising it does not work as intended. Tap the line with the mistake.',
      lines: [
        'class SaveError:',
        '    pass',
        '',
        'def save(slot):',
        '    raise SaveError',
        '',
        'try:',
        '    save(1)',
        'except SaveError:',
        '    print("save failed")',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'A class can only be raised or caught if it inherits from `BaseException`, in practice from `Exception`. `SaveError` inherits from nothing, so Python raises a `TypeError` instead. Fix line 1: `class SaveError(Exception):`.',
    },
    {
      kind: 'concept',
      title: 'assert, notes and exception groups',
      blocks: [
        {
          type: 'p',
          text: '`assert condition, "message"` raises `AssertionError` when the condition is false. It documents and checks assumptions *inside your own code*. Python 3.11 added **`add_note`**, which attaches extra context to an exception after it was created, and **exception groups** (`ExceptionGroup` with the `except*` clause), which let a program report several unrelated errors at once — essential for concurrent code, which Unit 14 will use.',
        },
        {
          type: 'code',
          title: 'assert_notes_groups.py',
          runnable: true,
          code: `def damage(hp, amount):
    assert amount >= 0, "amount must be non-negative"
    return hp - amount
try:
    damage(10, -1)
except AssertionError as e:
    print("AssertionError:", e)
err = ValueError("bad")
err.add_note("while loading level 3")
print(err.__notes__)
try:
    raise ExceptionGroup("several", [ValueError("a"), TypeError("b")])
except* ValueError as eg:
    print("value errors:", [str(x) for x in eg.exceptions])
except* TypeError as eg:
    print("type errors:", [str(x) for x in eg.exceptions])`,
          output: `AssertionError: amount must be non-negative
['while loading level 3']
value errors: ['a']
type errors: ['b']`,
          annotations: [
            { lines: 2, text: 'An assertion with a message. If `amount` were negative here, it would be a bug in the *caller’s* code, not bad user input.' },
            { lines: 6, text: '`AssertionError` can be caught like any exception — in tests, this is the exception that signals a failed check.' },
            { lines: 9, text: '`add_note` appends a string to the exception. Notes are shown in the traceback, which makes it easy to add context ("while loading level 3") as an exception passes through layers.' },
            { lines: 12, text: '`ExceptionGroup(message, [exceptions])` bundles several exceptions into one.' },
            { lines: 13, text: '`except*` handles the matching *members* of the group, and **each** `except*` clause that matches runs.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Assertions can be disabled',
          text: 'Python removes `assert` statements when run with `python -O`. Never put code with side effects in an assertion (`assert do_work()`), and never rely on it to reject bad user data. In tests (pytest, unittest) assertions are exactly right.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Raise early, catch late',
          text: 'Raise as close as possible to where the problem is detected, and catch as far up as the code that knows how to *respond* — usually the main loop or a request handler. Intermediate functions mostly let exceptions pass through. If you catch an exception you cannot actually handle, re-raise it.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`try:`\n`    raise ExceptionGroup("g", [ValueError(), TypeError(), ValueError()])`\n`except* ValueError as eg:`\n`    print(len(eg.exceptions))`\n`except* TypeError:`\n`    pass`',
      answer: '2',
      hint: 'The `except* ValueError` clause receives a group containing only the `ValueError` members.',
      explanation: 'An `except*` clause is given a new group holding only the matching exceptions. The group contains two `ValueError`s, so `len(eg.exceptions)` is 2; the `TypeError` is handled separately by the second clause.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `validate_player(name, hp)` that returns `None` for valid data and otherwise raises:\n\n- `ValueError("name must be a non-empty string")` if `name` is not a non-empty `str`;\n- `TypeError(f"hp must be int, not {type(hp).__name__}")` if `hp` is not an `int`;\n- `ValueError(f"hp out of range: {hp}")` if `hp` is not between 0 and 100 inclusive.\n\nCheck the name first, then the type of `hp`, then its range.',
      starter: `# define validate_player here
`,
      solution: `def validate_player(name, hp):
    if not isinstance(name, str) or not name:
        raise ValueError("name must be a non-empty string")
    if not isinstance(hp, int):
        raise TypeError(f"hp must be int, not {type(hp).__name__}")
    if not 0 <= hp <= 100:
        raise ValueError(f"hp out of range: {hp}")
`,
      tests: `def outcome(*args):
    try:
        result = validate_player(*args)
    except Exception as e:
        return type(e).__name__, str(e)
    return result

assert outcome("Ada", 50) is None
assert outcome("Ada", 0) is None
assert outcome("Ada", 100) is None
assert outcome("", 50) == ("ValueError", "name must be a non-empty string")
assert outcome(5, 50) == ("ValueError", "name must be a non-empty string")
assert outcome("Ada", "5") == ("TypeError", "hp must be int, not str")
assert outcome("Ada", 2.5) == ("TypeError", "hp must be int, not float")
assert outcome("Ada", 101) == ("ValueError", "hp out of range: 101")
assert outcome("Ada", -1) == ("ValueError", "hp out of range: -1")`,
      checks: ['Valid data returns `None`', 'Each failure raises the right type with the exact message', 'Checks happen in the order name, type, range'],
      hint: 'Three guard clauses, each `if … : raise …`. A chained comparison, `0 <= hp <= 100`, tests the range neatly.',
      explanation: 'Each guard clause rejects one kind of bad input and raises the exception type that matches its meaning — wrong type versus wrong value. Because every check ends in `raise`, the function can simply fall off the end for valid data, returning `None`.',
    },
    {
      kind: 'code',
      prompt: 'Define a custom exception `InsufficientFunds` (a subclass of `Exception`) whose constructor takes `needed` and `available`, stores them as attributes with those names, and has the message `"need 30, have 10"` (for `needed=30, available=10`). Then write `withdraw(balance, amount)`, which returns the new balance, or raises `InsufficientFunds(amount, balance)` when `amount` is more than `balance`.',
      starter: `# define InsufficientFunds and withdraw here
`,
      solution: `class InsufficientFunds(Exception):
    def __init__(self, needed, available):
        super().__init__(f"need {needed}, have {available}")
        self.needed = needed
        self.available = available

def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFunds(amount, balance)
    return balance - amount
`,
      tests: `assert withdraw(100, 30) == 70
assert withdraw(10, 10) == 0
try:
    withdraw(10, 30)
    assert False, "should have raised"
except InsufficientFunds as e:
    assert str(e) == "need 30, have 10", str(e)
    assert e.needed == 30
    assert e.available == 10
    assert isinstance(e, Exception)
assert issubclass(InsufficientFunds, Exception)`,
      checks: ['`InsufficientFunds` is an `Exception` subclass with `needed` and `available` attributes', 'The message reads `need 30, have 10`', '`withdraw` returns the new balance when funds suffice'],
      hint: 'Call `super().__init__(f"need {needed}, have {available}")` first, then save the two values with `self.needed = needed` and `self.available = available`.',
      explanation: 'Passing the formatted message to `super().__init__` gives `str(e)` its text, and the attributes let a handler use the numbers directly (for example to show "you are 20 short") instead of parsing the message. `withdraw` guards with `>` so withdrawing the exact balance is allowed.',
    },
    {
      kind: 'code',
      prompt: 'Write `retry(func, attempts=3)` that calls `func()` and returns its result. If `func` raises an exception, call it again, up to `attempts` calls in total. If the last attempt also fails, let that exception propagate unchanged (re-raise it).',
      starter: `# define retry here
`,
      solution: `def retry(func, attempts=3):
    for attempt in range(attempts):
        try:
            return func()
        except Exception:
            if attempt == attempts - 1:
                raise
`,
      tests: `calls = []
def flaky():
    calls.append(1)
    if len(calls) < 3:
        raise RuntimeError("not yet")
    return "done"
assert retry(flaky) == "done"
assert len(calls) == 3

calls2 = []
def always_fails():
    calls2.append(1)
    raise KeyError("boom")
try:
    retry(always_fails, attempts=2)
    assert False, "should have raised"
except KeyError as e:
    assert str(e) == "'boom'"
assert len(calls2) == 2
assert retry(lambda: 5, 1) == 5`,
      checks: ['Returns the result as soon as one call succeeds', 'Makes at most `attempts` calls', 'The last failure is re-raised unchanged'],
      hint: 'Loop `for attempt in range(attempts)`. Inside `try`, `return func()`. In the `except`, re-raise with a bare `raise` only on the final attempt.',
      explanation: 'A successful call returns immediately, ending the loop. A failure on an earlier attempt is swallowed so the loop tries again; on the final attempt the bare `raise` re-raises the *same* exception with its original traceback. This pattern wraps flaky operations like network requests, usually with a delay between attempts.',
    },
  ],
  takeaways: [
    '`raise ExceptionType("message")` signals a failure. Validate input at the boundary with guard clauses and fail fast with messages that include the offending value.',
    'Choose precisely: `TypeError` for the wrong kind of object, `ValueError` for a bad value, `KeyError`/`IndexError` for lookups, `NotImplementedError` for abstract methods.',
    'Define custom exceptions by inheriting from `Exception`; build a base class per library, attach data as attributes, and keep them in one module.',
    '`raise New(...) from e` chains a cause, `from None` hides context, and a bare `raise` inside `except` re-raises the same exception. Never `raise e` to re-raise.',
    '`assert` is for internal sanity checks only (it can be disabled). `add_note` adds context; `ExceptionGroup` with `except*` handles several errors at once.',
  ],
  reading: [
    { title: 'Raising Exceptions (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/errors.html#raising-exceptions', source: 'tutorial', note: 'raise, chaining, user-defined exceptions, and notes.' },
    { title: 'The raise statement (Language Reference)', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-raise-statement', source: 'docs', note: 'Exact semantics of `raise`, `from` and exception context.' },
    { title: 'PEP 654 — Exception Groups and except*', url: 'https://peps.python.org/pep-0654/', source: 'pep', note: 'The design behind `ExceptionGroup` and `except*`.' },
  ],
};
