import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-docstrings-hints',
  title: 'Docstrings and Type Hints',
  summary: 'Make functions self-explaining: docstrings that `help()` can show and `doctest` can run, type hints that tools check even though Python doesn’t, and the style conventions of professional Python.',
  minutes: 18,
  objectives: [
    'Write a docstring in the standard places and style, and read one with `help()` or `__doc__`',
    'Embed runnable examples in a docstring with `doctest`',
    'Annotate parameters, return values and variables with type hints, including `list[int]`, `X | None` and `Callable`',
    'Explain that type hints are not enforced at runtime and how a checker such as mypy uses them',
    'Follow the basics of PEP 8 and know what formatters and linters do',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Docstrings: documentation that travels with the code',
      blocks: [
        {
          type: 'p',
          text: 'A [[docstring]] is a string literal placed as the **first statement** of a function, class or module. Python stores it in the object’s `__doc__` attribute, so `help(function)`, editors and documentation tools can show it. A comment (`#`) is for the next programmer reading the source; a docstring is for the *user* of the function.',
        },
        {
          type: 'code',
          title: 'docstring.py',
          runnable: true,
          code: `def damage(base, armor=0):
    """Return the damage dealt after armor, never below 1.

    Args:
        base: Raw damage before armor is applied.
        armor: Flat reduction subtracted from base.

    Returns:
        The damage as a whole number, at least 1.
    """
    return max(1, base - armor)

print(damage(10, 3))
print(damage.__doc__.splitlines()[0])
print(damage(2, 50))`,
          output: `7
Return the damage dealt after armor, never below 1.
1`,
          annotations: [
            { lines: 2, text: 'The first line is a **summary**: one sentence, imperative mood ("Return…", "Load…"), ending with a period. Tools show this line in tooltips and listings.' },
            { lines: '4-9', text: 'After a blank line, optional detail. This layout (Args / Returns) is the *Google style*; NumPy and reStructuredText styles are common alternatives. Pick one and use it consistently.' },
            { lines: 11, text: 'The real code follows the docstring, which must be the very first statement of the body.' },
            { lines: 14, text: '`__doc__` holds the text. `help(damage)` in the REPL formats it with the signature, and VS Code shows it when you hover over a call.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother with docstrings?',
          text: 'Code tells you *how*; a docstring tells you *what* and *why it exists* — without making you read the body. Six months from now, you are the "other programmer". And because the docstring is attached to the object, it appears exactly where it is needed: in the editor tooltip while you type the call.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'PEP 257 in one paragraph',
          text: 'Use triple double quotes, even for one-liners. A one-line docstring fits on one line: `"""Return the player’s level."""`. For longer ones, write the summary line, a blank line, then details. Describe what the function *does* and *returns*, not how it works internally — that is what comments and code are for.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Like Doxygen, but built in',
          text: 'C++ projects use comments with a tool such as Doxygen. In Python the documentation is a real attribute of the object, available at run time, so interactive help and IDE tooltips work with no extra tool at all.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Where must a docstring appear for Python to treat it as the function’s documentation?',
      options: [
        { text: 'In a `#` comment on the line above `def`', why: 'Comments are discarded by the compiler; they never reach `__doc__`.' },
        { text: 'As the first statement inside the function body', correct: true, why: 'Right: a string literal as the very first statement becomes `__doc__`.' },
        { text: 'At the very end of the function, after `return`', why: 'Code after `return` never runs, and a string there is not treated as a docstring.' },
        { text: 'Anywhere in the file, as long as it uses triple quotes', why: 'Position matters, not the quotes: only the first statement of a function, class or module is its docstring.' },
      ],
      explanation: 'Python looks at the first statement of a function body: if it is a bare string literal, it becomes the `__doc__` attribute. Triple quotes are just the convention that lets the text span several lines.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `def f():
    """Say hi."""
    return "hi"

print(f.__doc__, f())`,
      answer: 'Say hi. hi',
      hint: '`f.__doc__` is the docstring text; `f()` is the returned value.',
      explanation: '`print` shows two values separated by a space: the docstring `Say hi.` stored in `__doc__`, and the return value `hi`. The docstring has no effect on what the function does — it is metadata.',
    },
    {
      kind: 'concept',
      title: 'Docstrings that test themselves: doctest',
      blocks: [
        {
          type: 'p',
          text: 'Examples in documentation rot: the code changes and the examples quietly become wrong. The standard-library **`doctest`** module fixes that. It finds lines that look like an interactive session (`>>> code` followed by the expected output) inside docstrings, runs them and reports any difference. The examples become both documentation *and* tests.',
        },
        {
          type: 'code',
          title: 'doctest_demo.py',
          runnable: true,
          code: `import doctest

def clamp(value, low, high):
    """Limit value to the range low..high.

    >>> clamp(5, 0, 10)
    5
    >>> clamp(-3, 0, 10)
    0
    >>> clamp(99, 0, 10)
    10
    """
    return max(low, min(value, high))

finder = doctest.DocTestFinder()
runner = doctest.DocTestRunner()
for test in finder.find(clamp, "clamp", globs=globals()):
    runner.run(test)
print(runner.summarize(verbose=False))`,
          output: 'TestResults(failed=0, attempted=3)',
          annotations: [
            { lines: '6-11', text: 'Each \`>>>\` line is code to run; the line below is the exact output expected. Docstring examples like these double as quick-start documentation.' },
            { lines: '15-19', text: 'We find the examples in `clamp`’s docstring and run them, then print a summary: no failures out of 3 attempted. In an ordinary file you would just call `doctest.testmod()`, or run `python -m doctest -v yourfile.py` from a terminal; the explicit finder and runner are used here because this page runs your code in an embedded interpreter.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Comments vs docstrings vs tests',
          text: 'A `#` comment explains a tricky *line* ("clamp to avoid negative hp"). A docstring explains how to *use* a function. Doctests prove the docstring is true. For anything beyond small examples, you will use a real test framework such as `pytest` (Unit 15).',
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'In a game codebase, docstrings on public helpers such as `world_to_tile(pos)` or `apply_damage(unit, hit)` spare teammates (and your future self) from reading the implementation, and make auto-generated API docs possible with tools like Sphinx and MkDocs.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Type hints: saying what goes in and out',
      blocks: [
        {
          type: 'p',
          text: 'A [[type-hint|type hint]] (or *annotation*) states the type a parameter or return value is *meant* to have. Parameters get `: type`, the return value gets `-> type`, and a variable can be annotated too. Hints are documentation that tools can check — but **Python itself never enforces them**.',
        },
        {
          type: 'code',
          title: 'hints.py',
          runnable: true,
          code: `def damage(base: int, armor: int = 0) -> int:
    return max(1, base - armor)

print(damage(10, 3))
print(damage.__annotations__)

hp: int = 100
names: list[str] = []

def double(n: int) -> int:
    return n * 2

print(double(4))
print(double("ab"))
print(double(2.5))`,
          output: `7
{'base': <class 'int'>, 'armor': <class 'int'>, 'return': <class 'int'>}
8
abab
5.0`,
          annotations: [
            { lines: 1, text: '`base: int` and `armor: int = 0` annotate the parameters (the default goes after the annotation); `-> int` annotates the return value.' },
            { lines: 5, text: 'Annotations are stored on the function as a dictionary — that is all Python does with them.' },
            { lines: 7, text: 'A variable annotation: `hp: int = 100`. These are rarely needed for simple assignments, since a checker can infer `int` itself.' },
            { lines: 14, text: 'A string where `int` was promised — and Python happily runs it, because `"ab" * 2` is valid. Hints are **not** runtime checks.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'If Python ignores them, why write them?',
          text: 'Because *other programs* read them: editors give better autocompletion and tooltips, checkers like **mypy** and **Pyright** find whole classes of bugs before you run the code, and readers see at a glance what a function expects. On a large project, hints are the cheapest documentation that cannot go out of date without a checker noticing. They also make AI/ML and game-tool code far easier to navigate.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Gradual typing',
          text: 'Hints arrived in Python 3.0 as bare annotation syntax and became a proper system with PEP 484 in Python 3.5 (2015). Python is a **gradually typed** language: you annotate as much or as little as you like, and checkers only verify what is annotated. Python 3.14 evaluates annotations lazily (PEP 649), which cuts startup cost and removes the need for quoting forward references.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you call a function annotated `n: int` with the string `"ab"`, Python raises a `TypeError` before running the body.',
      answer: false,
      explanation: 'False. Type hints are ignored at run time. The call runs normally — `"ab" * 2` is even valid — and only a separate **static checker** (mypy, Pyright) run before the program would flag the mismatch. If you need run-time validation, you must write it yourself or use a library such as Pydantic.',
    },
    {
      kind: 'concept',
      title: 'The hint vocabulary: collections, None, callables, aliases',
      blocks: [
        {
          type: 'p',
          text: 'Since Python 3.9 you can parametrize built-in containers directly — `list[int]`, `dict[str, int]`, `tuple[int, int]`, `set[str]` — and since 3.10 you can write "either/or" with `|`. The standard library supplies the rest, such as `Callable`.',
        },
        {
          type: 'code',
          title: 'hint_vocabulary.py',
          runnable: true,
          code: `from collections.abc import Callable

def total(prices: list[float]) -> float:
    return sum(prices)

def find_player(players: dict[str, int], name: str) -> int | None:
    return players.get(name)

def move(pos: tuple[int, int], delta: tuple[int, int]) -> tuple[int, int]:
    return (pos[0] + delta[0], pos[1] + delta[1])

def apply(func: Callable[[int], int], value: int) -> int:
    return func(value)

Point = tuple[int, int]

def origin_distance(p: Point) -> float:
    return (p[0] ** 2 + p[1] ** 2) ** 0.5

def describe(x: int | str | None) -> str:
    if x is None:
        return "nothing"
    if isinstance(x, int):
        return f"number {x + 1}"
    return f"text {x.upper()}"

print(total([1.5, 2.5]), find_player({"ada": 3}, "bob"), move((1, 2), (3, 4)))
print(apply(abs, -5), origin_distance((3, 4)))
print(describe(None), describe(41), describe("hi"))`,
          output: `4.0 None (4, 6)
5 5.0
nothing number 42 text HI`,
          annotations: [
            { lines: 3, text: '`list[float]`: a list whose items are floats.' },
            { lines: 6, text: '`int | None` means "an int, or None" — the honest hint for a lookup that may find nothing. Older code spells this `Optional[int]`.' },
            { lines: 9, text: '`tuple[int, int]` is a fixed pair of ints — the hint equivalent of our coordinates.' },
            { lines: 12, text: '`Callable[[int], int]`: a function taking one int and returning an int — a hint for the "functions as arguments" idea of the previous lesson.' },
            { lines: 15, text: 'A **type alias**: give a long type a short name. Now `Point` documents intent.' },
            { lines: '21-25', text: 'A checker understands `isinstance` and `is None` checks (*narrowing*): after `x is None` returns, it knows `x` is `int | str`, and after the `isinstance` test, that it must be `str`, so `x.upper()` is safe.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Hint the edges, not every variable',
          text: 'Annotate **function signatures** (parameters and returns) and anything a checker can’t infer, such as an empty list: `enemies: list[Enemy] = []`. Skip trivial locals like `count = 0`. Public functions benefit most from hints; throwaway scripts may need none at all.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the hints so `find` takes a list of strings and a string, and returns an int or `None`.',
      template: `def find(items: ___[str], target: str) -> int ___ None:
    ...`,
      templateIsCode: true,
      blanks: [{ answers: ['list'] }, { answers: ['|'] }],
      wordBank: ['list', 'List', '|', 'or', '+'],
      explanation: '`list[str]` (Python 3.9+) describes a list of strings; `int | None` (3.10+) means either an int or `None`. The older spellings are `typing.List[str]` and `typing.Optional[int]`, which you will still see in existing code. `or` is not valid inside annotations.',
    },
    {
      kind: 'error',
      prompt: 'A type checker like mypy rejects this function even though it runs fine. Tap a line that makes the hints wrong.',
      lines: ['def average(nums: list[int]) -> int:', '    return sum(nums) / len(nums)', '', 'print(average([1, 2]))'],
      linesAreCode: true,
      errorLines: [1, 2],
      explanation: 'The annotation promises an `int`, but `/` always produces a `float` (the program prints `1.5`). The hint on line 1 is wrong — it should be `-> float` — or the body on line 2 should compute something else, such as `//`. This is exactly the kind of mismatch a static checker catches before the code ever runs.',
    },
    {
      kind: 'numeric',
      prompt: 'For `def damage(base: int, armor: int = 0) -> int:`, how many entries does `len(damage.__annotations__)` report?',
      answer: '3',
      hint: 'The return annotation is stored in the same dictionary, under the key `"return"`.',
      explanation: '`__annotations__` is `{"base": int, "armor": int, "return": int}` — one entry for each annotated parameter plus one for the return value: 3.',
      label: 'Entries:',
    },
    {
      kind: 'concept',
      title: 'Checkers, formatters and style',
      blocks: [
        {
          type: 'p',
          text: 'Real projects pair the language with a few tools. A **type checker** reads your hints and reports mismatches. A **linter** flags likely bugs and style problems. A **formatter** rewrites code into one consistent layout so nobody argues about spacing. None of them runs your program.',
        },
        {
          type: 'code',
          lang: 'shell',
          code: `$ python -m pip install mypy
$ mypy game.py
game.py:7: error: Argument 1 to "double" has incompatible type "str"; expected "int"  [arg-type]
Found 1 error in 1 file (checked 1 source file)`,
          annotations: [
            { lines: 3, text: 'mypy points at the file and line, and explains the mismatch — before the program has run once. Pyright (built into VS Code’s Pylance) does the same as you type.' },
          ],
        },
        {
          type: 'table',
          headers: ['Tool kind', 'Examples', 'What it does'],
          rows: [
            ['Type checker', 'mypy, Pyright, ty', 'Checks your type hints for consistency'],
            ['Linter', 'Ruff, Pylint, Flake8', 'Finds unused variables, shadowed built-ins, risky patterns'],
            ['Formatter', 'Ruff format, Black', 'Rewrites code into one standard layout'],
            ['Test runner', 'pytest, unittest, doctest', 'Runs your tests and reports failures'],
          ],
          caption: 'You will set these up properly in Unit 15. Editors such as VS Code run most of them automatically.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'PEP 8: the style everyone shares',
          text: '4-space indentation (never tabs mixed in); `snake_case` for functions and variables, `CapWords` for classes, `UPPER_CASE` for constants; lines up to about 79–99 characters; two blank lines between top-level functions; spaces around operators (`a + b`) but not around `=` in keyword arguments (`f(x=1)`). The point isn’t that these rules are perfect — it’s that when every Python program looks alike, every Python program is easier to read.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Annotations are just data',
          text: 'The `->` and `:` syntax stores objects in `__annotations__`; the interpreter attaches no meaning to them. Libraries are free to give them meaning — `dataclasses`, Pydantic and FastAPI all read annotations at run time to build behavior (Unit 10 and beyond). Python 3.14’s `annotationlib` module offers a stable way to inspect them.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Add **type hints** and a **docstring** to `heal` without changing what it does. Hints: `hp` and `amount` are `int`, and it returns an `int`. The docstring should start with a one-line summary.',
      starter: `def heal(hp, amount=10):
    return min(100, hp + amount)
`,
      solution: `def heal(hp: int, amount: int = 10) -> int:
    """Return hp after healing, capped at 100."""
    return min(100, hp + amount)
`,
      tests: `assert heal(50) == 60
assert heal(95, 20) == 100
assert heal.__annotations__ == {"hp": int, "amount": int, "return": int}, heal.__annotations__
assert heal.__doc__ and heal.__doc__.strip(), "add a docstring"
assert len(heal.__doc__.strip().splitlines()[0]) > 5`,
      checks: ['Parameters and return value are annotated with `int`', 'The first statement is a docstring with a summary line', 'The behavior is unchanged'],
      hint: 'Write `hp: int, amount: int = 10` and `-> int`. The docstring is a triple-quoted string on the first line of the body.',
      explanation: 'The annotation goes after each parameter name (`hp: int`) with the default after it (`amount: int = 10`), and `-> int` after the parameter list. The docstring is the first statement in the body, so it becomes `__doc__`. Neither changes what the function computes.',
    },
    {
      kind: 'code',
      prompt: 'Write `find_index(items, target)` that returns the index of the first occurrence of `target` in the list, or `None` if it is absent. Annotate it as `(items: list[str], target: str) -> int | None`.',
      starter: `# define find_index here
`,
      solution: `def find_index(items: list[str], target: str) -> int | None:
    for i, item in enumerate(items):
        if item == target:
            return i
    return None
`,
      tests: `assert find_index(["a", "b", "c"], "b") == 1
assert find_index(["a", "b", "b"], "b") == 1
assert find_index(["a"], "z") is None
assert find_index([], "a") is None
hints = find_index.__annotations__
assert hints["items"] == list[str] and hints["target"] is str
assert hints["return"] == (int | None), hints["return"]`,
      checks: ['Returns the first matching index, or `None`', 'Annotated with `list[str]`, `str` and `int | None`'],
      hint: 'Loop with `enumerate`; return `i` on a match. If the loop finishes, `return None`.',
      explanation: 'Returning `None` for "not found" is honest only if the hint says so: `int | None` tells callers (and checkers) they must handle the missing case before using the result as a number. Unlike `list.index`, which raises an error, this function reports absence as a value.',
    },
    {
      kind: 'code',
      prompt: 'Write `is_palindrome(text: str) -> bool` that ignores case and spaces (so `"Never odd or even"` is a palindrome). Give it a docstring that contains **at least two `>>>` examples** — they will be run as doctests, so they must pass.',
      starter: `def is_palindrome(text: str) -> bool:
    # write a docstring with two or more >>> examples, then the code
    ...
`,
      solution: `def is_palindrome(text: str) -> bool:
    """Return True if text reads the same backwards, ignoring case and spaces.

    >>> is_palindrome("Level")
    True
    >>> is_palindrome("Never odd or even")
    True
    >>> is_palindrome("dragon")
    False
    """
    cleaned = text.replace(" ", "").lower()
    return cleaned == cleaned[::-1]
`,
      tests: `import doctest

assert is_palindrome("Level") is True
assert is_palindrome("Never odd or even") is True
assert is_palindrome("dragon") is False
assert is_palindrome("") is True

finder = doctest.DocTestFinder()
found = finder.find(is_palindrome, "is_palindrome", globs=globals())
assert found and len(found[0].examples) >= 2, "the docstring needs at least two >>> examples"
runner = doctest.DocTestRunner(verbose=False)
for t in found:
    runner.run(t)
assert runner.failures == 0, "one of the docstring examples fails"`,
      checks: ['Ignores case and spaces', 'The docstring has two or more `>>>` examples', 'All docstring examples pass when run as doctests'],
      hint: 'Clean the text with `.replace(" ", "").lower()`, then compare it with its reverse `[::-1]`. In the docstring write `>>> is_palindrome("Level")` followed by `True` on the next line.',
      explanation: 'The cleaned string equals its reverse exactly when the text is a palindrome. The docstring examples serve as documentation *and* tests: doctest runs each `>>>` line and compares the printed result — here `True` or `False` — with the line below it.',
    },
  ],
  takeaways: [
    'A docstring is the first statement of a function, class or module; it is stored in `__doc__`, shown by `help()` and editors. Start with a one-line imperative summary, then details in a consistent style (Google, NumPy or reST).',
    '`doctest` runs the `>>>` examples inside docstrings, so documentation doubles as a test; comments (`#`) explain tricky lines, docstrings explain usage.',
    'Type hints annotate parameters (`x: int`), returns (`-> str`) and variables; they are stored in `__annotations__` but **never enforced** by Python.',
    'Modern hint syntax: `list[int]`, `dict[str, int]`, `tuple[int, int]`, `int | None`, `Callable[[int], int]`, and aliases such as `Point = tuple[int, int]`.',
    'Static checkers (mypy, Pyright), linters and formatters (Ruff, Black) use hints and style rules to catch bugs and keep code uniform; PEP 8 is the shared style guide.',
  ],
  reading: [
    { title: 'PEP 257 — Docstring Conventions', url: 'https://peps.python.org/pep-0257/', source: 'pep', note: 'The official conventions for writing docstrings.' },
    { title: 'doctest — Test interactive Python examples', url: 'https://docs.python.org/3/library/doctest.html', source: 'docs', note: 'Complete documentation of the module, with options and gotchas.' },
    { title: 'typing — Support for type hints', url: 'https://docs.python.org/3/library/typing.html', source: 'docs', note: 'The reference for every hint construct, plus a type-hints cheat sheet.' },
    { title: 'PEP 8 — Style Guide for Python Code', url: 'https://peps.python.org/pep-0008/', source: 'pep', note: 'The community’s shared style rules.' },
    { title: 'mypy documentation', url: 'https://mypy.readthedocs.io/en/stable/', source: 'docs', note: 'A getting-started guide to the most widely used static type checker.' },
  ],
};
