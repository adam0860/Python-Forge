import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-context-managers',
  title: 'Context Managers and with',
  summary: 'The `with` statement and guaranteed cleanup: how it replaces `try`/`finally`, writing context managers as classes (`__enter__`/`__exit__`) and as generators (`@contextmanager`), the `contextlib` toolbox, and how `torch.no_grad()` works.',
  minutes: 20,
  objectives: [
    'Explain what `with` guarantees and rewrite it as `try`/`finally`',
    'Implement a context manager as a class with `__enter__` and `__exit__`, including exception suppression',
    'Write a generator-based context manager with `contextlib.contextmanager`, using `try`/`finally` around `yield`',
    'Use `suppress`, `redirect_stdout`, `nullcontext` and `ExitStack` from `contextlib`',
    'Recognize the "set a flag, restore it afterwards" pattern behind `torch.no_grad()` and build a decorator-capable version',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'with: cleanup that cannot be forgotten',
      blocks: [
        {
          type: 'p',
          text: 'Many resources must be released: files closed, locks unlocked, database transactions committed or rolled back, GPU modes switched back. Forgetting is easy, and an exception in the middle makes it worse. A **[[context-manager|context manager]]** packages "set up" and "clean up" into one object, and the **`with`** statement guarantees the clean-up runs when the block ends — normally, through `return`/`break`, or because an exception was raised. The name after `as` receives whatever the manager hands out on entry.',
        },
        {
          type: 'code',
          title: 'with_files.py',
          runnable: true,
          code: `with open("note.txt", "w") as f:
    f.write("hi")
print(f.closed)

with open("note.txt") as f:
    print(f.read())

try:
    with open("note.txt") as f:
        raise RuntimeError("boom")
except RuntimeError:
    print("closed after error:", f.closed)`,
          output: `True
hi
closed after error: True`,
          annotations: [
            { lines: '1-2', text: '`open(...)` returns a file object, which is a context manager. `with` calls its entry hook, and `as f` binds the file to `f`.' },
            { lines: 3, text: 'When the block ends the file has been closed automatically. The name `f` still exists — only the file’s resource was released.' },
            { lines: '5-6', text: 'Reading mode works the same way; there is no `f.close()` to remember.' },
            { lines: '8-12', text: 'Even though the body raised an exception, the file was closed before the exception reached `except`. That guarantee is the whole point.' },
          ],
        },
        {
          type: 'p',
          text: 'Underneath, `with` is a tidy way to write `try`/`finally`. The second version below is what you would have to write by hand every single time.',
        },
        {
          type: 'code',
          title: 'with_equals_try_finally.py',
          runnable: true,
          code: `with open("note.txt", "w") as f:
    f.write("hi")

f = open("note.txt")
try:
    data = f.read()
finally:
    f.close()
print(data, f.closed)`,
          output: `hi True`,
          annotations: [
            { lines: '1-2', text: 'Create the file the same way as before.' },
            { lines: '4-8', text: 'The manual pattern: acquire, `try` the work, and always `close()` in `finally`. A `with` block does exactly this for you, for any resource, and the setup and cleanup live inside the object, not at every use site.' },
            { lines: 9, text: 'Both versions end with the file closed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just call close()?',
          text: 'Because the code between acquiring and releasing may raise, return early, or be edited later by someone who adds another `return`. With `try`/`finally` you must write the cleanup correctly at every use site. A context manager writes it **once**, inside the object, and every user gets it right automatically.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ solves this with **RAII**: constructors acquire, destructors release when an object leaves scope, so `std::lock_guard` and `std::ifstream` clean up automatically. Python objects are destroyed at unpredictable times (the garbage collector, other implementations), so Python uses an *explicit* scope: the `with` block. You get the same deterministic guarantee, but you must ask for it.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Multiple managers',
          text: 'Several managers can share one statement: `with open("a") as fa, open("b", "w") as fb:`. They are entered left to right and exited in **reverse** order, like nested blocks — a lock acquired last is released first.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A `with` block raises an exception halfway through. When does the context manager’s clean-up run?',
      options: [
        { text: 'Always — before the exception propagates to the surrounding code', correct: true, why: 'The exit hook runs whether the body finished normally, returned early, or raised. That is exactly the `finally` behavior.' },
        { text: 'Never — an exception skips the clean-up, so you need `try`/`except` as well', why: 'This is the opposite of the guarantee. The exit hook always runs; you only need `try`/`except` if you want to *handle* the exception.' },
        { text: 'Only if the exception is caught inside the `with` block', why: 'The clean-up does not depend on anyone catching anything. It runs on the way out, in all cases.' },
        { text: 'Only when the garbage collector happens to destroy the object', why: 'That is how destructors behave. Context managers run clean-up deterministically at the end of the block.' },
      ],
      explanation: 'The `with` statement calls the manager’s exit hook in every case: normal completion, early `return`/`break`, or an exception. Handling the exception is a separate matter.',
    },
    {
      kind: 'concept',
      title: 'Writing a class: __enter__ and __exit__',
      blocks: [
        {
          type: 'p',
          text: 'A context manager is any object with two methods. **`__enter__(self)`** runs on entry; whatever it returns is bound by `as`. **`__exit__(self, exc_type, exc, tb)`** runs on exit and receives the exception class, instance and traceback — all `None` if the block succeeded. If `__exit__` returns a **truthy** value the exception is *suppressed* and execution continues after the `with`; if it returns a falsy value (including the implicit `None`) the exception propagates after cleanup. Never swallow exceptions unless that is the manager’s purpose.',
        },
        {
          type: 'code',
          title: 'tracer.py',
          runnable: true,
          code: `events = []

class Tracer:
    def __init__(self, name):
        self.name = name

    def __enter__(self):
        events.append("enter " + self.name)
        return self

    def __exit__(self, exc_type, exc, tb):
        events.append("exit " + self.name)
        if exc_type is ValueError:
            events.append("suppressed")
            return True
        return False

with Tracer("a") as t:
    events.append("body " + t.name)
print(events)

events.clear()
with Tracer("b"):
    raise ValueError("ignored")
print(events)

events.clear()
try:
    with Tracer("c"):
        raise KeyError("k")
except KeyError:
    events.append("caught KeyError")
print(events)`,
          output: `['enter a', 'body a', 'exit a']
['enter b', 'exit b', 'suppressed']
['enter c', 'exit c', 'caught KeyError']`,
          annotations: [
            { lines: '4-5', text: 'Setup of the *object* happens in `__init__` (called by `Tracer("a")`). Acquiring the *resource* belongs in `__enter__`.' },
            { lines: '7-9', text: '`__enter__` runs as the block starts. Its return value (here `self`) is what `as t` receives. Returning `self` is the usual choice.' },
            { lines: '11-16', text: '`__exit__` always runs. The three arguments describe the exception that ended the block — all `None` if there was none.' },
            { lines: '13-15', text: 'Returning `True` tells Python "I handled this exception": here every `ValueError` is suppressed.' },
            { lines: 16, text: 'Returning `False` (or nothing) lets any other exception continue propagating, after the cleanup has run.' },
            { lines: '18-20', text: 'Normal case: enter, body, exit — in that order.' },
            { lines: '22-25', text: 'The `ValueError` is raised in the body, `__exit__` suppresses it, and execution simply continues after the `with` — no `except` needed.' },
            { lines: '27-33', text: 'A `KeyError` is not suppressed. `__exit__` still ran first (`exit c`), and then the exception reached the `except`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What with does',
          text: '`with M() as x: body` calls `M().__enter__()` and binds the result to `x`, runs the body in a `try`, and calls `__exit__(type, value, traceback)` on the way out. If `__exit__` returns a truthy value the exception is discarded; otherwise it is re-raised. The `__exit__` method looked up is the one on the manager’s **class**, so assigning it to an instance won’t work.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Common __exit__ mistakes',
          text: 'Giving `__exit__` the wrong signature (it must accept `exc_type, exc, tb`, or `*exc`), forgetting that `return True` hides errors including ones you did not mean to catch, and forgetting `return self` in `__enter__` when callers use `as`. Return `True` only for the exact exception types you handle, and check `exc_type` before doing so.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If the body of a `with` block raises an exception, Python skips the context manager’s `__exit__` method.',
      answer: false,
      explanation: 'False. `__exit__` is called in every case, and it receives the exception details. It can suppress the exception by returning a truthy value; otherwise the exception propagates once cleanup has finished.',
    },
    {
      kind: 'concept',
      title: 'The easy way: contextlib.contextmanager',
      blocks: [
        {
          type: 'p',
          text: 'Writing a class for every small manager is wordy. **`contextlib.contextmanager`** turns a **generator function** into one: everything before the single `yield` is the setup (`__enter__`), the yielded value is what `as` receives, and everything after the `yield` is the cleanup (`__exit__`). If the body raises, the exception is thrown into the generator *at the `yield`*, so wrap it in **`try`/`finally`** to guarantee the cleanup runs.',
        },
        {
          type: 'code',
          title: 'debug_mode.py',
          runnable: true,
          code: `from contextlib import contextmanager

settings = {"debug": False}

@contextmanager
def debug_mode():
    old = settings["debug"]
    settings["debug"] = True
    try:
        yield settings
    finally:
        settings["debug"] = old

with debug_mode() as s:
    print(s["debug"])
print(settings["debug"])
try:
    with debug_mode():
        raise RuntimeError
except RuntimeError:
    print(settings["debug"])`,
          output: `True
False
False`,
          annotations: [
            { lines: 5, text: '`@contextmanager` converts the generator function into a factory of context managers.' },
            { lines: '7-8', text: 'Setup: remember the old value, switch the setting on. This is the `__enter__` part.' },
            { lines: '9-12', text: '`yield` hands control to the `with` body. `finally` restores the old value however the body ends — that is the `__exit__` part.' },
            { lines: 10, text: 'The yielded value is what `as s` receives. Yield nothing (`yield`) when callers don’t need a value.' },
            { lines: '14-15', text: 'Inside the block the setting is on: `True`.' },
            { lines: 16, text: 'After the block it was restored: `False`.' },
            { lines: '17-21', text: 'Even when the body raised `RuntimeError`, the `finally` ran and the setting is back to `False` by the time the exception is caught.' },
          ],
        },
        {
          type: 'p',
          text: 'The `contextlib` module ships ready-made managers for common jobs: **`suppress(*exceptions)`** ignores the listed exceptions, **`redirect_stdout(target)`** temporarily sends `print` output elsewhere, **`nullcontext(value)`** does nothing (useful as an optional manager), and **`closing(obj)`** calls `obj.close()` on exit.',
        },
        {
          type: 'code',
          title: 'contextlib_helpers.py',
          runnable: true,
          code: `import io
from contextlib import suppress, redirect_stdout, nullcontext

with suppress(KeyError):
    {}["x"]
    print("not reached")
print("after suppress")

buf = io.StringIO()
with redirect_stdout(buf):
    print("captured")
print(repr(buf.getvalue()))

with nullcontext(5) as n:
    print(n)`,
          output: `after suppress
'captured\\n'
5`,
          annotations: [
            { lines: '4-7', text: '`suppress(KeyError)` replaces `try: ... except KeyError: pass`. The failing line ends the block, so the `print` after it never runs, and execution continues after the `with`.' },
            { lines: '9-12', text: '`redirect_stdout` temporarily replaces `sys.stdout`: the print goes into the buffer, and normal output is restored on exit.' },
            { lines: '14-15', text: '`nullcontext(5)` does nothing but hand `5` to `as`. It lets code write `with (lock or nullcontext()):` without special cases.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer the generator form',
          text: 'For small managers use `@contextmanager`; reach for a class when you need state that outlives one block, reusability with several attributes, or custom `__exit__` logic. And *always* put the `yield` inside `try`/`finally` if the cleanup must run on errors — without it, an exception skips everything after the `yield`.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Yield exactly once',
          text: 'A `@contextmanager` generator must `yield` exactly once. Zero yields (the generator ends without yielding) gives a `RuntimeError` on entry; yielding twice gives one on exit. If you catch an exception around the `yield`, re-raise it unless you really mean to suppress it — catching it swallows the error, just like `return True` in `__exit__`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the generator-based context manager so that the flag is on inside the block and restored afterwards, even when the body raises.',
      template: `@contextmanager
def flag_on():
    old = state["on"]
    state["on"] = True
    try:
        ___
    finally:
        state["on"] = ___`,
      templateIsCode: true,
      blanks: [{ answers: ['yield'] }, { answers: ['old'] }],
      wordBank: ['yield', 'old', 'return', 'True'],
      explanation: '`yield` marks where the `with` body runs; the `finally` then restores the **old** value (not a hard-coded one), so the flag returns to whatever it was before — even if it was already on, and even if the body raised.',
    },
    {
      kind: 'concept',
      title: 'ExitStack, decorators, and torch.no_grad',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes the number of managers is only known at run time — open every file in a list, say. **`ExitStack`** is a manager that collects other managers: call `enter_context` for each, and when the stack exits it unwinds them all in reverse order, even if one of the setups fails halfway. You can also register ad-hoc cleanup with `stack.callback(func)`.',
        },
        {
          type: 'code',
          title: 'exit_stack.py',
          runnable: true,
          code: `from contextlib import ExitStack, contextmanager

events = []

@contextmanager
def tracer(name):
    events.append("enter " + name)
    try:
        yield name
    finally:
        events.append("exit " + name)

with ExitStack() as stack:
    for name in ("p", "q", "r"):
        stack.enter_context(tracer(name))
    events.append("body")
print(events)`,
          output: `['enter p', 'enter q', 'enter r', 'body', 'exit r', 'exit q', 'exit p']`,
          annotations: [
            { lines: '5-11', text: 'A tiny generator-based manager that records its entry and exit.' },
            { lines: '13-15', text: 'The stack enters three managers in a loop. A plain `with` statement could not do that without knowing the count in advance.' },
            { lines: 16, text: 'The body runs after all three are entered.' },
            { lines: 17, text: 'Exits happen in **reverse** order — `r`, `q`, `p` — which is how nested resources must be released.' },
          ],
        },
        {
          type: 'p',
          text: 'Finally, the pattern behind PyTorch. A manager that *sets a global flag and restores it* is everywhere in machine learning: `torch.no_grad()` turns off gradient recording, `torch.autocast` switches precision, `model.eval()` and `torch.inference_mode()` follow the same idea. PyTorch’s versions can also be used as **decorators**, because the class inherits from `contextlib.ContextDecorator` (or implements the same idea): the object works as `with torch.no_grad():` *and* as `@torch.no_grad()`.',
        },
        {
          type: 'code',
          title: 'no_grad_clone.py',
          runnable: true,
          code: `from contextlib import ContextDecorator

class NoGrad(ContextDecorator):
    enabled = True

    def __enter__(self):
        self.prev = NoGrad.enabled
        NoGrad.enabled = False
        return self

    def __exit__(self, *exc):
        NoGrad.enabled = self.prev
        return False

@NoGrad()
def infer():
    return NoGrad.enabled

print(infer(), NoGrad.enabled)
with NoGrad():
    print(NoGrad.enabled)
print(NoGrad.enabled)`,
          output: `False True
False
True`,
          annotations: [
            { lines: 3, text: 'Inheriting from `ContextDecorator` gives the class a ready-made `__call__`, so instances can wrap functions as decorators.' },
            { lines: 4, text: '`enabled` stands in for PyTorch’s global "gradients are recorded" switch.' },
            { lines: '6-9', text: 'Entering saves the previous state, then switches recording off.' },
            { lines: '11-13', text: 'Exiting restores the **previous** state (not a hard-coded `True`), so nested uses behave correctly. Returning `False` never hides errors.' },
            { lines: '15-17', text: 'Used as a decorator: every call to `infer` runs inside the manager.' },
            { lines: 19, text: 'Inside the call the flag was `False`; afterwards it is back to `True`.' },
            { lines: '20-22', text: 'Used as a `with` statement it does the same job.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'In your training code',
          text: 'You will write `with torch.no_grad(): preds = model(x)` for evaluation and `@torch.no_grad()` on helper functions, `with torch.autocast("cuda"):` for mixed precision, `with open(...)` for checkpoints and logs, and `with lock:` when threads share data. A `@contextmanager` is also a neat way to time a block or to switch a game environment into a "debug" or "headless" mode and always switch it back.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What does `__exit__` returning `True` do?" (suppresses the exception); "In which order are managers in `with a, b:` exited?" (reverse); "Why wrap `yield` in `try`/`finally`?" (so the cleanup runs when the body raises); "What does `as` receive?" (the return value of `__enter__`, not necessarily the manager itself).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Note where the clean-up code is placed.',
      code: `from contextlib import contextmanager

log = []

@contextmanager
def cm(name):
    log.append("+" + name)
    yield
    log.append("-" + name)

try:
    with cm("a"):
        raise ValueError
except ValueError:
    log.append("caught")
print(log)`,
      answer: "['+a', 'caught']",
      hint: 'The exception is thrown into the generator at the `yield`. Is there a `try`/`finally` there?',
      explanation: 'The generator has no `try`/`finally`, so when the body raises, the exception is re-thrown at the `yield` and leaves the generator immediately: `"-a"` is never appended. With `try: yield ... finally: log.append("-" + name)` the log would be `[\'+a\', \'-a\', \'caught\']`.',
    },
    {
      kind: 'error',
      prompt: 'Leaving the `with` block raises `TypeError: __exit__() takes 1 positional argument but 4 were given`. Tap the faulty line.',
      lines: [
        'class Guard:',
        '    def __enter__(self):',
        '        return self',
        '    def __exit__(self):',
        '        print("bye")',
        'with Guard():',
        '    print("hi")',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Python always calls `__exit__` with three extra arguments: the exception type, value and traceback (all `None` if nothing went wrong). The signature must accept them: `def __exit__(self, exc_type, exc, tb):` or `def __exit__(self, *exc):`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`class C:`\n`    def __enter__(self):`\n`        return 10`\n`    def __exit__(self, *a):`\n`        return False`\n`with C() as v:`\n`    total = v * 2`\n`print(total)`',
      answer: '20',
      hint: '`as` binds the value returned by `__enter__`, which is not the `C` object here.',
      explanation: '`__enter__` returns the number 10, and `as v` binds exactly that return value, so `v` is 10 and `total` is 20. A manager decides what `as` receives; most return `self`, but files return the file, `nullcontext(5)` returns 5 and `ExitStack` returns itself.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a generator-based context manager `temp_attr(obj, name, value)` that sets `obj.name = value` for the duration of the block and **always** restores the previous state on exit — even when the body raises. If the attribute did not exist before, delete it afterwards instead. Use `contextlib.contextmanager`.',
      starter: `from contextlib import contextmanager

@contextmanager
def temp_attr(obj, name, value):
    ...
`,
      solution: `from contextlib import contextmanager

_MISSING = object()


@contextmanager
def temp_attr(obj, name, value):
    old = getattr(obj, name, _MISSING)
    setattr(obj, name, value)
    try:
        yield
    finally:
        if old is _MISSING:
            delattr(obj, name)
        else:
            setattr(obj, name, old)
`,
      tests: `class Box:
    pass

b = Box()
b.size = 1

with temp_attr(b, "size", 9):
    assert b.size == 9
assert b.size == 1

try:
    with temp_attr(b, "size", 7):
        assert b.size == 7
        raise RuntimeError("x")
except RuntimeError:
    pass
assert b.size == 1

with temp_attr(b, "color", "red"):
    assert b.color == "red"
assert not hasattr(b, "color")

try:
    with temp_attr(b, "color", "blue"):
        raise KeyError("k")
except KeyError:
    pass
assert not hasattr(b, "color")

with temp_attr(b, "size", 3):
    with temp_attr(b, "size", 4):
        assert b.size == 4
    assert b.size == 3
assert b.size == 1`,
      checks: ['Sets the attribute before the \`yield\` and restores it in \`finally\`', 'Restores the previous value, or deletes the attribute if it did not exist', 'Works when the body raises, and when uses are nested'],
      hint: 'Use a sentinel (`_MISSING = object()`) with `getattr(obj, name, _MISSING)` to remember whether the attribute existed. Put the restore code in a `finally` after the `yield`.',
      explanation: 'The sentinel distinguishes "attribute was None/0" from "attribute did not exist". `try`/`finally` around `yield` makes the restore run on errors; restoring the *previous* value (not a fixed one) makes nested uses work, which the last test checks.',
    },
    {
      kind: 'code',
      prompt: 'Write a **class-based** context manager `Transaction(items)` for a list. On entry it takes a snapshot copy of the list and returns the list itself (so `as` gives the list). If the body raises an exception, the list must be **rolled back in place** to the snapshot and the exception must still propagate. If the body succeeds, the changes stay.',
      starter: `class Transaction:
    ...
`,
      solution: `class Transaction:
    def __init__(self, items):
        self.items = items

    def __enter__(self):
        self.snapshot = list(self.items)
        return self.items

    def __exit__(self, exc_type, exc, tb):
        if exc_type is not None:
            self.items[:] = self.snapshot
        return False
`,
      tests: `items = [1, 2]

try:
    with Transaction(items) as got:
        assert got is items
        got.append(3)
        got.append(4)
        raise ValueError("fail")
except ValueError:
    pass
assert items == [1, 2]

with Transaction(items) as t:
    t.append(3)
assert items == [1, 2, 3]

try:
    with Transaction(items):
        items.clear()
        raise KeyError("again")
except KeyError:
    pass
assert items == [1, 2, 3]

other = []
with Transaction(other) as o:
    o.extend("ab")
assert other == ["a", "b"]`,
      checks: ['\`__enter__\` stores a snapshot and returns the list', '\`__exit__\` restores the list **in place** only when an exception occurred', 'Returns a falsy value so the exception still propagates'],
      hint: 'Snapshot with `list(self.items)`. In `__exit__`, if `exc_type is not None`, do `self.items[:] = self.snapshot` (slice assignment mutates the same list). Return `False`.',
      explanation: 'Slice assignment `items[:] = snapshot` rolls the *same* list object back, so every reference sees the restored contents. Returning `False` (rather than `True`) matters: the caller must still learn that the operation failed. This commit-or-rollback shape is how database transactions work.',
    },
    {
      kind: 'code',
      prompt: 'Write a context manager `capture_prints()` that captures everything printed inside the block into an `io.StringIO` buffer and **yields that buffer**. Output printed after the block must not be captured. Build it from `contextlib.contextmanager` and `contextlib.redirect_stdout`.',
      starter: `import io
from contextlib import contextmanager, redirect_stdout

@contextmanager
def capture_prints():
    ...
`,
      solution: `import io
from contextlib import contextmanager, redirect_stdout


@contextmanager
def capture_prints():
    buffer = io.StringIO()
    with redirect_stdout(buffer):
        yield buffer
`,
      tests: `with capture_prints() as out:
    print("a")
    print("b", 1)
assert out.getvalue() == "a\\nb 1\\n"

before = out.getvalue()
print("visible")
assert out.getvalue() == before

try:
    with capture_prints() as out2:
        print("x")
        raise ValueError("fail")
except ValueError:
    pass
assert out2.getvalue() == "x\\n"

with capture_prints() as first:
    print("one")
with capture_prints() as second:
    print("two")
assert first.getvalue() == "one\\n" and second.getvalue() == "two\\n"`,
      checks: ['Creates a fresh \`io.StringIO\` on each use', 'Redirects stdout while the block runs and yields the buffer', 'Output printed after the block (or after an error) is not captured'],
      hint: 'Create `buffer = io.StringIO()`, enter `with redirect_stdout(buffer):` and `yield buffer` inside it. Because `redirect_stdout` is itself a context manager, its cleanup runs automatically when the block ends or fails.',
      explanation: 'Context managers compose: yielding *inside* another `with` means the inner cleanup (restoring `sys.stdout`) runs when the outer block ends — normally or by exception. A new buffer per call keeps captures independent. This is essentially how testing tools capture output.',
    },
  ],
  takeaways: [
    '`with` guarantees clean-up: the context manager’s exit hook runs on normal completion, early exit and exceptions — it is `try`/`finally` written once, inside the object.',
    'A class manager defines `__enter__` (its return value goes to `as`) and `__exit__(exc_type, exc, tb)`; returning a truthy value suppresses the exception, so return `True` only deliberately.',
    '`@contextmanager` turns a generator into a manager: setup, a single `yield`, then cleanup. Wrap the `yield` in `try`/`finally` or errors will skip the cleanup.',
    '`contextlib` offers `suppress`, `redirect_stdout`, `nullcontext`, `closing` and `ExitStack` (for a run-time number of managers, unwound in reverse order).',
    'Save-and-restore managers such as `torch.no_grad()` are context managers that are also decorators (`ContextDecorator`): `with torch.no_grad():` and `@torch.no_grad()` do the same job.',
  ],
  reading: [
    { title: 'The with statement (Python Language Reference)', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-with-statement', source: 'docs', note: 'The exact semantics, including how multiple managers are nested.' },
    { title: 'contextlib — Utilities for with-statement contexts', url: 'https://docs.python.org/3/library/contextlib.html', source: 'docs', note: 'Reference for `contextmanager`, `suppress`, `redirect_stdout`, `ExitStack` and `ContextDecorator`.' },
    { title: 'PEP 343 — The "with" Statement', url: 'https://peps.python.org/pep-0343/', source: 'pep', note: 'The proposal behind `with`, `__enter__`/`__exit__` and `contextlib.contextmanager`.' },
    { title: 'Context Managers and Python’s with Statement', url: 'https://realpython.com/python-with-statement/', source: 'article', note: 'A practical tutorial on writing your own class- and generator-based managers.' },
  ],
};
