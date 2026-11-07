import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-testing',
  title: 'Testing with pytest',
  summary: 'Automated tests with `assert`: how a test runner finds and runs tests, pytest’s plain-assert style, fixtures, `parametrize` and `pytest.raises`, plus `unittest`, `doctest` and mocks, and how to decide what to test.',
  minutes: 20,
  objectives: [
    'Write test functions that use `assert`, and explain how a runner discovers and runs them',
    'Use pytest features: readable failure reports, fixtures, `parametrize` and `pytest.raises`',
    'Know the standard-library alternatives `unittest` and `doctest`, and use `unittest.mock` to replace randomness or I/O',
    'Compare floating-point results safely instead of with `==`',
    'Choose good test cases: normal inputs, boundaries, errors and regressions',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A test is a function that asserts',
      blocks: [
        {
          type: 'p',
          text: 'Programs change constantly, and every change can break something that used to work. An automated test records what the code is supposed to do and checks it in milliseconds, whenever you like. In Python the basic ingredient is the **[[assertion]]**: `assert condition` does nothing when the condition is true and raises `AssertionError` when it is false. A **[[unit-test]]** is simply a small function that sets up some input, calls the code under test and asserts the result. Test tools such as pytest add *discovery* (find every function whose name starts with `test_`), *running* (call each one, catching failures) and *reporting* — which is a short loop. The program below is a complete miniature test runner.',
        },
        {
          type: 'code',
          title: 'mini_runner.py',
          runnable: true,
          code: `def apply_damage(hp, dmg):
    return max(0, hp - dmg)

def test_normal():
    assert apply_damage(10, 3) == 7

def test_floor_at_zero():
    assert apply_damage(5, 99) == 0

def test_broken():
    assert apply_damage(10, 3) == 8

def run_tests(ns):
    passed = failed = 0
    for name, fn in list(ns.items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
            except AssertionError:
                failed += 1
                print("FAIL", name)
            else:
                passed += 1
    return passed, failed

print(run_tests(globals()))`,
          output: `FAIL test_broken
(2, 1)`,
          annotations: [
            { lines: '1-2', text: 'The **code under test**: reduces hit points but never below zero.' },
            { lines: '4-8', text: 'Two tests. Each is a plain function with no parameters; the check is a single `assert` comparing the actual result with the expected one.' },
            { lines: '10-11', text: 'A test with a deliberately wrong expectation (the real result is 7), so you can see a failure being reported.' },
            { lines: 13, text: 'The runner receives a dictionary of names; we will pass `globals()`, the names defined in this file.' },
            { lines: 16, text: '**Discovery by naming convention**: anything callable whose name starts with `test_` is a test. This is exactly pytest’s rule.' },
            { lines: '17-23', text: 'Run it inside `try`. An `AssertionError` means the test failed; no exception (the `else` branch) means it passed.' },
            { lines: 26, text: 'Two passed, one failed. Real runners add colours, a traceback and the values involved, but the idea is the same.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother testing?',
          text: 'Tests let you **change code fearlessly**: after a refactor or a performance tweak you run the suite, and in seconds you know whether anything broke. They are also executable documentation of how a function should behave, and writing them first tends to produce simpler designs because untestable code (global state, hidden randomness) becomes obvious. A **[[regression]]** test locks in a fixed bug so it can never silently return.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A tuple in assert is always true',
          text: '`assert (x == 1, "message")` asserts a non-empty *tuple*, which is always truthy, so the test can never fail (Python prints a `SyntaxWarning`). Write `assert x == 1, "message"` — no parentheses around both parts.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ has the `assert` macro (removed when you compile with `NDEBUG`) and frameworks such as GoogleTest or Catch2 with `EXPECT_EQ` macros. Python’s `assert` is a statement and pytest simply understands it, so tests need no special macros or base classes. Note that `python -O` also strips `assert` statements, so never use `assert` to validate user input in real code — raise exceptions for that.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You run `pytest` in a project folder. Which tests does it run, with no configuration?',
      options: [
        { text: 'Functions named `test_*` (and methods in `Test*` classes) inside files named `test_*.py` or `*_test.py`', correct: true, why: 'This is pytest’s default discovery convention. Following it means you never have to register tests anywhere.' },
        { text: 'Every function in every `.py` file that contains the word `assert`', why: 'pytest does not scan for `assert`. It relies on file and function names.' },
        { text: 'Only the functions you list in a `tests.txt` file', why: 'There is no such list. Discovery is automatic, based on names.' },
        { text: 'Only functions decorated with `@pytest.test`', why: 'No decorator is needed — and `@pytest.test` does not exist. A `test_` prefix is enough.' },
      ],
      explanation: 'pytest collects files matching `test_*.py` or `*_test.py`, then functions starting with `test_` (and `Test*` classes with `test_*` methods). Name things accordingly and they are found automatically.',
    },
    {
      kind: 'concept',
      title: 'pytest in practice: plain asserts, fixtures, parametrize',
      blocks: [
        {
          type: 'p',
          text: '**pytest** is the most popular third-party test framework (`pip install pytest`, then run `pytest`). Its trick is that it *rewrites your `assert` statements*: when one fails it shows the values of every sub-expression, so you rarely need special `assertEqual` helpers. Three features cover most real needs. A **[[fixture]]** is a function marked `@pytest.fixture` that builds test input; a test uses it just by naming it as a parameter, and each test gets a fresh copy. `@pytest.mark.parametrize` runs one test function over many inputs, reported as separate tests. `pytest.raises` asserts that code raises a particular exception. (pytest can’t run inside the in-app Python, so this example is display-only — try it on your PC.)',
        },
        {
          type: 'code',
          title: 'inventory + test_inventory.py',
          lang: 'text',
          code: `# inventory.py
def add_item(inv, name, qty=1):
    if qty <= 0:
        raise ValueError("qty must be positive")
    inv[name] = inv.get(name, 0) + qty
    return inv

# test_inventory.py
import pytest
from inventory import add_item

@pytest.fixture
def inv():
    return {"potion": 2}

def test_add_new_item(inv):
    add_item(inv, "sword")
    assert inv == {"potion": 2, "sword": 1}

def test_add_existing_item(inv):
    add_item(inv, "potion", 3)
    assert inv["potion"] == 5

@pytest.mark.parametrize("qty", [0, -1])
def test_rejects_bad_qty(inv, qty):
    with pytest.raises(ValueError, match="positive"):
        add_item(inv, "gem", qty)

# terminal
#   $ pytest -q
#   ....                                  [100%]
#   4 passed in 0.02s`,
          annotations: [
            { lines: '2-6', text: 'The function under test, in its own module so tests can import it.' },
            { lines: '12-14', text: 'A **fixture**: pytest calls it to build a fresh `{"potion": 2}` inventory for each test that asks for it.' },
            { lines: '16-18', text: 'A test asks for the fixture by naming a parameter `inv`. The check is a plain `assert` comparing whole dictionaries.' },
            { lines: '24-27', text: '`parametrize` runs the test twice (qty 0 and qty -1). `pytest.raises` passes only if the block raises `ValueError` whose message matches "positive".' },
            { lines: '29-32', text: 'Four tests ran (1 + 1 + 2 parametrized) and all passed; the timing varies. `-q` means quiet.' },
          ],
        },
        {
          type: 'p',
          text: 'The real payoff is the failure report. Suppose the expected value in a test is wrong or the code regressed; pytest shows the failing line and the actual values involved, with no extra effort from you:',
        },
        {
          type: 'code',
          title: 'terminal',
          lang: 'text',
          code: `$ pytest -q
F                                         [100%]
================ FAILURES ================
____________ test_apply_damage ____________

    def test_apply_damage():
>       assert apply_damage(10, 3) == 8
E       assert 7 == 8
E        +  where 7 = apply_damage(10, 3)

test_dmg.py:5: AssertionError
======= short test summary info =======
FAILED test_dmg.py::test_apply_damage - assert 7 == 8
1 failed in 0.01s`,
          annotations: [
            { lines: 7, text: 'The `>` marks the line that failed.' },
            { lines: '8-9', text: 'pytest evaluated the pieces of your assert: the call returned `7`, not `8`. You see the real values without adding a single `print`.' },
            { lines: 13, text: 'The summary line is a copy-paste-able test id (`file::function`): `pytest test_dmg.py::test_apply_damage` re-runs just that one.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Handy pytest options',
          text: '`pytest -x` stops at the first failure; `pytest -k damage` runs only tests whose name contains "damage"; `pytest --lf` re-runs the last failures; `pytest -v` lists every test; `pytest --cov=mypackage` (with the pytest-cov plugin) shows which lines no test executed. Keep tests in a `tests/` folder next to your package.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Use the language, not a framework',
          text: 'In `unittest` you must remember `assertEqual`, `assertTrue`, `assertIn`, `assertRaises`… In pytest the same checks are `assert a == b`, `assert x`, `assert item in items`, `with pytest.raises(...)`. Fewer names to learn, and the failure messages are better.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If all of a project’s tests pass, the program is guaranteed to be free of bugs.',
      answer: false,
      explanation: 'False. Tests only check the cases someone thought to write. A passing suite means "none of the situations we tested are broken", which is valuable but not a proof. Even 100% line coverage only shows every line ran, not that every behavior was checked.',
    },
    {
      kind: 'concept',
      title: 'unittest, doctest and mocks (all built in)',
      blocks: [
        {
          type: 'p',
          text: 'You don’t need to install anything to test. The standard library ships **`unittest`** (classes derived from `TestCase` with `assertEqual`/`assertRaises` methods — the Python version of JUnit) and **`doctest`**, which runs the examples written inside docstrings and checks that they print what the docstring claims. pytest can run `unittest` tests as well, so existing suites keep working. Both of the following run right here in the app.',
        },
        {
          type: 'code',
          title: 'unittest_demo.py',
          runnable: true,
          code: `import io
import unittest

def clamp(x, lo, hi):
    return max(lo, min(hi, x))

class ClampTests(unittest.TestCase):
    def test_inside(self):
        self.assertEqual(clamp(5, 0, 10), 5)
    def test_below(self):
        self.assertEqual(clamp(-3, 0, 10), 0)
    def test_above(self):
        self.assertEqual(clamp(99, 0, 10), 10)
    def test_bad_type(self):
        with self.assertRaises(TypeError):
            clamp("a", 0, 10)

suite = unittest.defaultTestLoader.loadTestsFromTestCase(ClampTests)
stream = io.StringIO()
result = unittest.TextTestRunner(stream=stream, verbosity=0).run(suite)
print(result.testsRun, len(result.failures), len(result.errors), result.wasSuccessful())`,
          output: `4 0 0 True`,
          annotations: [
            { lines: '7-16', text: 'Each test is a **method** whose name starts with `test`, on a class derived from `unittest.TestCase`. The `self.assert...` helpers produce the messages when a check fails.' },
            { lines: 15, text: '`assertRaises` as a context manager: the block must raise `TypeError` (comparing a string with numbers does).' },
            { lines: '18-20', text: 'Normally you would run `python -m unittest`. Here we drive the runner by hand, sending its text report into a `StringIO` so we can print a compact summary instead.' },
            { lines: 21, text: 'Four tests ran, no failures, no errors, and `wasSuccessful()` is true.' },
          ],
        },
        {
          type: 'code',
          title: 'doctest_demo.py',
          runnable: true,
          code: `import doctest

def double(x):
    """Return twice x.

    >>> double(4)
    8
    >>> double("ab")
    'abab'
    """
    return x * 2

finder = doctest.DocTestFinder()
runner = doctest.DocTestRunner(verbose=False)
for t in finder.find(double, "double", globs=globals()):
    runner.run(t)
print(runner.summarize(verbose=False))`,
          output: `TestResults(failed=0, attempted=2)`,
          annotations: [
            { lines: '4-10', text: 'The docstring contains a tiny interactive session: lines starting with `>>>` are code, the line after is the expected output. It documents the function **and** tests it.' },
            { lines: '13-16', text: 'The finder extracts the examples from the docstring and the runner executes them, comparing real output with the text. (On your PC `python -m doctest file.py` does all this in one command.)' },
            { lines: 17, text: 'Both examples ran and none failed. If the function stopped returning `8`, a failure report would show expected versus actual output.' },
          ],
        },
        {
          type: 'p',
          text: 'Tests must be **fast and repeatable**. Code that rolls dice, reads the clock or calls a web server breaks that. A **[[mock]]** from `unittest.mock` replaces the troublesome part with a stand-in that returns values you choose and remembers how it was called. `patch("module.name", ...)` swaps something out temporarily — handy for fixing a game’s random number generator in a test.',
        },
        {
          type: 'code',
          title: 'mock_demo.py',
          runnable: true,
          code: `from unittest.mock import Mock, patch
import random

def roll_damage(rng):
    return rng.randint(1, 6) * 2

fake = Mock()
fake.randint.return_value = 4
print(roll_damage(fake), fake.randint.call_args.args)

def loot(rng=random):
    return "rare" if rng.random() < 0.1 else "common"

with patch("random.random", return_value=0.05):
    print(loot())
print(fake.randint.call_count)`,
          output: `8 (1, 6)
rare
1`,
          annotations: [
            { lines: '4-5', text: 'A function that takes its random generator as a **parameter** (dependency injection) — the easiest design to test.' },
            { lines: '7-9', text: 'A `Mock` accepts any method call. We tell its `randint` to always return 4, so the damage is exactly 8, and afterwards inspect the arguments it received: `(1, 6)`.' },
            { lines: '11-12', text: 'This function calls the global `random.random()`, which we can’t pass in…' },
            { lines: '14-15', text: '…so `patch` temporarily replaces `random.random` with a stand-in returning 0.05 (below 0.1), forcing the "rare" branch deterministically. The original is restored when the block ends.' },
            { lines: 16, text: 'The mock remembers it was called exactly once.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Testing game and AI code',
          text: 'Seed random generators (`random.seed(0)`, `numpy.random.seed`, `torch.manual_seed`) so runs repeat; keep game rules in plain functions separate from rendering so you can test them without a window; for machine-learning code test *shapes* (`assert out.shape == (batch, 10)`), *invariants* (probabilities sum to 1, loss decreases on a tiny dataset) and use `pytest.approx` for float comparisons.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the pytest tests: one checks that dividing by zero raises, the other is an ordinary check.',
      template: `import pytest

def test_divide_by_zero():
    with pytest.___(ZeroDivisionError):
        1 / 0

def test_sum():
    ___ sum([1, 2]) == 3`,
      templateIsCode: true,
      blanks: [{ answers: ['raises'] }, { answers: ['assert'] }],
      wordBank: ['raises', 'assert', 'expect', 'catch'],
      explanation: '`with pytest.raises(ZeroDivisionError):` passes only if the block raises that exception, and a plain `assert` is all pytest needs for an ordinary check.',
    },
    {
      kind: 'concept',
      title: 'What to test: cases, floats and habits',
      blocks: [
        {
          type: 'p',
          text: 'Good tests come from **choosing cases well**. Test a typical input, then the **boundaries** where behavior changes (empty list, zero, one item, maximum), then the **error paths** (bad input should raise the right exception), and finally every **bug you fix** (a regression test). Test one behavior per test with a name that says what — `test_damage_never_below_zero` beats `test_1`. Keep tests independent of each other and of the order they run in.',
        },
        {
          type: 'table',
          headers: ['Kind of case', 'Example for `apply_damage(hp, dmg)`', 'Why it matters'],
          rows: [
            ['Typical', '`apply_damage(10, 3) == 7`', 'The main path works'],
            ['Boundary', '`apply_damage(5, 5) == 0`', 'Off-by-one errors live at edges'],
            ['Extreme', '`apply_damage(5, 10**9) == 0`', 'No overflow or negative hit points'],
            ['Zero / empty', '`apply_damage(5, 0) == 5`', 'Do-nothing input is handled'],
            ['Error', 'negative damage raises `ValueError`', 'Bad input fails loudly, not silently'],
          ],
          caption: 'A small checklist of test cases for a tiny function.',
        },
        {
          type: 'p',
          text: 'One trap deserves special attention: **floating-point numbers**. Most decimal fractions can’t be stored exactly in binary, so `0.1 + 0.2` is not exactly `0.3`. Never compare floats with `==` in a test; compare with a tolerance — `pytest.approx(0.3)`, `math.isclose(a, b)`, or your own `abs(a - b) < 1e-9`. This matters constantly in game physics and in machine learning, where almost every number is a float.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Test-driven development (TDD)',
          text: 'Some people write the test *first*: write a failing test for the next small behavior, write just enough code to pass it, then clean up (red → green → refactor). Even if you don’t work that way all the time, it is a great habit for fixing bugs: first write a test that reproduces the bug (it fails), then fix the code until it passes.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"How does pytest discover tests?" (names: `test_*.py`, `test_*`); "What is a fixture?" (reusable setup injected by parameter name); "How do you test that an exception is raised?" (`pytest.raises`); "Why not compare floats with `==`?" (rounding error; use a tolerance); "What does a mock do?" (replaces a slow or random dependency and records calls).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is why tests compare floats with a tolerance.',
      code: `print(0.1 + 0.2 == 0.3, abs((0.1 + 0.2) - 0.3) < 1e-9)`,
      answer: 'False True',
      hint: '`0.1 + 0.2` is slightly more than `0.3` in binary floating point, but only by about 5.5e-17.',
      explanation: 'The exact comparison is `False` because `0.1 + 0.2` is `0.30000000000000004`. The difference is tiny (far below `1e-9`), so the tolerance comparison is `True`. That is exactly what `pytest.approx` does for you.',
    },
    {
      kind: 'error',
      prompt: 'This test is supposed to fail whenever `add_item` is broken, but it passes even when `add_item` returns garbage. Tap the faulty line.',
      lines: [
        'from inventory import add_item',
        'def test_add_item():',
        '    inv = add_item({}, "gem")',
        '    assert (inv == {"gem": 1}, "inventory should hold one gem")',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The parentheses make the `assert` check a two-element tuple, and a non-empty tuple is always true, so the test can never fail (Python even warns about it). Write `assert inv == {"gem": 1}, "inventory should hold one gem"`.',
    },
    {
      kind: 'numeric',
      prompt: 'A test is decorated with `@pytest.mark.parametrize("a", [1, 2, 3])` and also with `@pytest.mark.parametrize("b", [10, 20])`. Stacked decorators multiply: how many separate test runs does pytest report for it?',
      answer: '6',
      hint: 'Every value of `a` is combined with every value of `b`.',
      explanation: 'Stacked `parametrize` decorators produce the cross product: 3 values of `a` times 2 values of `b` is 6 tests. It is a compact way to cover all combinations.',
      label: 'Test runs:',
    },
    {
      kind: 'code',
      prompt: 'Write `run_tests(ns)`, a miniature test runner. `ns` is a dict of names to objects (like `globals()`). Call, in dict order, every **callable** whose name starts with `test_`. A test passes if it returns normally and fails if it raises **any** exception. Ignore everything else (helpers, non-callables). Return the tuple `(passed, failed)`.',
      starter: `def run_tests(ns):
    ...
`,
      solution: `def run_tests(ns):
    passed = failed = 0
    for name, obj in list(ns.items()):
        if name.startswith("test_") and callable(obj):
            try:
                obj()
            except Exception:
                failed += 1
            else:
                passed += 1
    return passed, failed
`,
      tests: `def test_ok():
    assert 1 == 1

def test_fail():
    assert 1 == 2

def test_error():
    raise KeyError("x")

def helper():
    raise RuntimeError("must not run")

test_value = 5

ns = {"test_ok": test_ok, "test_fail": test_fail, "test_error": test_error,
      "helper": helper, "test_value": test_value}
assert run_tests(ns) == (1, 2)
assert run_tests({}) == (0, 0)
assert run_tests({"helper": helper}) == (0, 0)

calls = []

def test_a():
    calls.append("a")

def test_b():
    calls.append("b")

assert run_tests({"test_a": test_a, "test_b": test_b}) == (2, 0)
assert calls == ["a", "b"]
assert run_tests({"test_ok": test_ok, "test_ok2": test_ok}) == (2, 0)`,
      checks: ['Only callables whose names start with \`test_\` are run; helpers and non-callables are ignored', 'A test that raises any exception (not just \`AssertionError\`) counts as failed', 'Returns the tuple \`(passed, failed)\` and runs tests in dict order'],
      hint: 'Loop over `ns.items()`, keep names with `name.startswith("test_")` that are `callable`, run each inside `try`/`except Exception`/`else`, and count.',
      explanation: 'This is the core of pytest and unittest: discover by name, run each test in isolation so one failure cannot stop the others, count the outcomes. Real runners add captured output, tracebacks, fixtures and parallelism on top.',
    },
    {
      kind: 'code',
      prompt: 'Write `close(a, b, rel=1e-9, abs_tol=1e-12)`, a float comparison for tests (like `math.isclose`). It returns `True` when `abs(a - b) <= max(rel * max(abs(a), abs(b)), abs_tol)` and `False` otherwise. The relative part handles big numbers, the absolute part handles numbers near zero.',
      starter: `def close(a, b, rel=1e-9, abs_tol=1e-12):
    ...
`,
      solution: `def close(a, b, rel=1e-9, abs_tol=1e-12):
    return abs(a - b) <= max(rel * max(abs(a), abs(b)), abs_tol)
`,
      tests: `assert close(0.1 + 0.2, 0.3) is True
assert close(1.0, 1.1) is False
assert close(5, 5) is True
assert close(-2.0, -2.0000000001) is True
assert close(1e12, 1e12 + 1) is True
assert close(1e12, 1e12 + 5000) is False
assert close(0, 1e-13) is True
assert close(0, 1e-6) is False
assert close(1e-6, 2e-6) is False
assert close(1, 1.05, rel=0.1) is True
assert close(1, 1.2, rel=0.1) is False
assert close(3, 3.0000001, abs_tol=1e-3) is True
assert close(0.1 + 0.2, 0.3, rel=0, abs_tol=0) is False`,
      checks: ['Uses a relative tolerance scaled by the larger magnitude, plus an absolute tolerance', 'Handles large numbers, numbers near zero and negatives', 'Returns a real \`bool\` and respects custom \`rel\` and \`abs_tol\`'],
      hint: 'The tolerance is `max(rel * max(abs(a), abs(b)), abs_tol)`; return whether `abs(a - b)` is at most that.',
      explanation: 'A relative tolerance alone fails near zero (any difference is huge compared with 0), and an absolute tolerance alone fails for huge numbers, so the formula takes the larger of the two. It is exactly how `math.isclose` is defined.',
    },
    {
      kind: 'code',
      prompt: 'Write `raises(exc_type, func, *args)` that calls `func(*args)` and returns `True` if it raises `exc_type` (or a subclass), `False` if it returns normally. If it raises a **different** exception, that exception must propagate. This is a tiny version of `pytest.raises`.',
      starter: `def raises(exc_type, func, *args):
    ...
`,
      solution: `def raises(exc_type, func, *args):
    try:
        func(*args)
    except exc_type:
        return True
    return False
`,
      tests: `assert raises(ZeroDivisionError, divmod, 1, 0) is True
assert raises(ValueError, int, "abc") is True
assert raises(ValueError, int, "5") is False
assert raises(LookupError, {}.__getitem__, "x") is True
assert raises(Exception, int, "abc") is True

try:
    raises(ValueError, divmod, 1, 0)
    assert False, "other exceptions must propagate"
except ZeroDivisionError:
    pass

def no_args():
    return 3

assert raises(ValueError, no_args) is False`,
      checks: ['Returns \`True\` when \`func\` raises \`exc_type\` or a subclass', 'Returns \`False\` when no exception is raised', 'Lets exceptions of other types propagate unchanged'],
      hint: 'Call `func(*args)` inside `try`, catch only `exc_type` and return `True`; after the `try` return `False`.',
      explanation: 'Catching only `exc_type` means unrelated errors (a typo, a different bug) are not hidden: they surface as ordinary failures. `pytest.raises` works the same way, with the extra option of checking the message.',
    },
  ],
  takeaways: [
    'A test is a function that sets up input, calls the code and uses `assert`. A runner discovers tests by name (`test_*`), runs each in isolation and reports failures.',
    '**pytest** needs only plain `assert`, and shows the values behind a failure. Use fixtures for shared setup, `parametrize` for many inputs and `pytest.raises` for expected errors.',
    '`unittest` and `doctest` are built in, and `unittest.mock` replaces slow or random dependencies (`Mock`, `patch`) so tests stay fast and repeatable. Seed random generators in game and ML tests.',
    'Test typical inputs, **boundaries**, error paths and every fixed bug. Compare floats with a tolerance (`pytest.approx`, `math.isclose`), never `==`.',
    'Passing tests show that the tested cases work, not that the program is bug-free. Beware `assert (a, b)` (always true) and never rely on `assert` for validating real input — `python -O` removes it.',
  ],
  reading: [
    { title: 'pytest documentation — Get Started', url: 'https://docs.pytest.org/en/stable/getting-started.html', source: 'docs', note: 'Installation, your first test, running several tests, asserting exceptions and grouping tests in classes.' },
    { title: 'pytest — How to use fixtures', url: 'https://docs.pytest.org/en/stable/how-to/fixtures.html', source: 'docs', note: 'Fixtures in depth: scope, teardown with `yield`, shared fixtures in `conftest.py`.' },
    { title: 'unittest — Unit testing framework', url: 'https://docs.python.org/3/library/unittest.html', source: 'docs', note: 'The standard-library framework, including `TestCase`, subtests and the `unittest.mock` library.' },
    { title: 'doctest — Test interactive Python examples', url: 'https://docs.python.org/3/library/doctest.html', source: 'docs', note: 'How docstring examples double as tests.' },
    { title: 'Effective Python Testing With pytest', url: 'https://realpython.com/pytest-python-testing/', source: 'article', note: 'A practical tutorial covering fixtures, marks, parametrization and plugins.' },
  ],
};
