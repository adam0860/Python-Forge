import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-parameters',
  title: 'Parameters: Defaults, Keywords, args and kwargs',
  summary: 'Every way to pass information into a function — positional and keyword arguments, defaults, keyword-only and positional-only parameters, `*args`, `**kwargs` and unpacking — plus the famous mutable-default trap.',
  minutes: 20,
  objectives: [
    'Call functions with positional and keyword arguments and give parameters sensible defaults',
    'Explain why a mutable default such as `[]` is shared between calls, and fix it with `None`',
    'Declare keyword-only (`*`) and positional-only (`/`) parameters and know the required parameter order',
    'Collect extra arguments with `*args` and `**kwargs`, and spread collections into a call with `*` and `**`',
    'Write a wrapper that forwards its arguments to another function',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Positional, keyword and default arguments',
      blocks: [
        {
          type: 'p',
          text: 'Arguments can be passed **by position** (matched left to right) or **by keyword** (`name=value`, matched by name, in any order). A parameter can have a **default**, written `name=value` in the definition; callers may then leave it out.',
        },
        {
          type: 'code',
          title: 'defaults.py',
          runnable: true,
          code: `def spawn(enemy, x=0, y=0, hp=100):
    return f"{enemy} at ({x}, {y}) with {hp} hp"

print(spawn("orc"))
print(spawn("orc", 5, 3))
print(spawn("orc", hp=40))
print(spawn(hp=60, enemy="elf", y=9))`,
          output: `orc at (0, 0) with 100 hp
orc at (5, 3) with 100 hp
orc at (0, 0) with 40 hp
elf at (0, 9) with 60 hp`,
          annotations: [
            { lines: 1, text: '`enemy` is required. `x`, `y` and `hp` have defaults, so they are optional. Required parameters must come **before** optional ones.' },
            { lines: 5, text: 'Positional: 5 goes to `x`, 3 to `y`; `hp` keeps its default.' },
            { lines: 6, text: 'Keyword: skip `x` and `y` and set only `hp`. Keywords make a call self-documenting — `hp=40` says what 40 means.' },
            { lines: 7, text: 'Keyword arguments can come in any order, and can even supply the required `enemy`. Once you use a keyword in a call, everything after it must be a keyword too.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> def f(a, b=2):
...     pass
...
>>> f(1, a=5)
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    f(1, a=5)
    ~^^^^^^^^
TypeError: f() got multiple values for argument 'a'`,
          annotations: [
            { lines: 9, text: 'The positional `1` already filled `a`, so `a=5` is a second value for the same parameter.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Use keywords for anything that isn’t obvious',
          text: '`spawn("orc", 5, 3, 40)` makes the reader count positions; `spawn("orc", x=5, y=3, hp=40)` doesn’t. Boolean flags in particular should almost always be passed by keyword: `draw(sprite, flip=True)` beats `draw(sprite, True)`.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Defaults without overloads',
          text: 'C++ simulates this with default arguments *and* function overloading. Python has no overloading — one name, one function — so defaults, keywords and `*args` carry all that flexibility. Unlike C++, Python lets callers name arguments, which is why Python APIs read so cleanly.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `def f(a, b=2, c=3):
    return a, b, c

print(f(1), f(1, 5), f(1, c=9))`,
      answer: '(1, 2, 3) (1, 5, 3) (1, 2, 9)',
      hint: 'Positional arguments fill parameters from the left; keywords hit one parameter by name; the rest keep their defaults.',
      explanation: '`f(1)` uses both defaults: `(1, 2, 3)`. `f(1, 5)` sets `b` positionally: `(1, 5, 3)`. `f(1, c=9)` skips `b` and sets `c` by name: `(1, 2, 9)`. Each call returns a tuple, which `print` shows with parentheses.',
    },
    {
      kind: 'mcq',
      prompt: 'Which function definition is a syntax error?',
      options: [
        { text: '`def f(a, b=1):`', why: 'Required first, optional after — valid.' },
        { text: '`def f(a=1, b):`', correct: true, why: 'A parameter without a default cannot follow one with a default: `SyntaxError: parameter without a default follows parameter with a default`.' },
        { text: '`def f(*args, k=1):`', why: 'Valid: `k` is a keyword-only parameter with a default.' },
        { text: '`def f(a, *, k):`', why: 'Valid: `k` is keyword-only and required.' },
      ],
      explanation: 'Python needs to know how to match positional arguments, so every parameter after the first default must also have one — or be keyword-only (placed after a `*`).',
    },
    {
      kind: 'concept',
      title: 'The mutable default trap',
      blocks: [
        {
          type: 'p',
          text: 'Here is one of Python’s best-known gotchas. A default value is evaluated **once**, when the `def` statement runs — not on every call. If the default is a mutable object like a list, every call that uses the default shares that *one* list.',
        },
        {
          type: 'code',
          title: 'mutable_default.py',
          runnable: true,
          code: `def add_item(item, bag=[]):
    bag.append(item)
    return bag

print(add_item("a"))
print(add_item("b"))
print(add_item.__defaults__)

def add_item_fixed(item, bag=None):
    if bag is None:
        bag = []
    bag.append(item)
    return bag

print(add_item_fixed("a"))
print(add_item_fixed("b"))`,
          output: `['a']
['a', 'b']
(['a', 'b'],)
['a']
['b']`,
          annotations: [
            { lines: 1, text: 'The `[]` is created once, when the function is defined, and stored on the function object.' },
            { lines: 6, text: 'The second call did *not* start fresh: it appended to the same list the first call used.' },
            { lines: 7, text: 'You can see the shared list: `__defaults__` holds the stored default, now containing both items.' },
            { lines: '9-11', text: 'The fix: default to `None` (immutable) and create a new list inside the body, each call.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does Python work this way?',
          text: 'A `def` is an executable statement: when it runs, Python builds the function object, evaluating the default expressions at that moment. Evaluating them per call would be possible, but would make function calls slower and surprise people in other ways. The rule is simple and consistent — it just bites when the default is mutable. Immutable defaults (numbers, strings, `None`, tuples) are always safe.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The pattern to remember',
          text: 'Never write `def f(x, items=[])`, `items={}` or `items=set()`. Write `items=None` and `if items is None: items = []`. Linters flag the dangerous form, and it is a favorite question in interviews.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `def log(msg, history=[]):
    history.append(msg)
    return len(history)

print(log("a"), log("b"), log("c"))`,
      answer: '1 2 3',
      hint: 'Does each call get its own `history` list?',
      explanation: 'All three calls use the default list created at definition time, so it keeps growing: lengths 1, 2, 3. If each call started with a fresh list, you would see `1 1 1`. This is exactly the mutable-default trap.',
    },
    {
      kind: 'error',
      prompt: 'Every wave should start with only its own boss, yet `wave2` ends up with both bosses. Tap the line that **causes** the bug.',
      lines: ['def new_wave(boss, minions=[]):', '    minions.append(boss)', '    return minions', 'wave1 = new_wave("orc")', 'wave2 = new_wave("elf")', 'print(wave2)'],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'The default `minions=[]` is created once and shared, so the second call appends to the list the first call used and `wave2` becomes `["orc", "elf"]`. Fix the signature to `minions=None` and add `if minions is None: minions = []` inside the function.',
    },
    {
      kind: 'concept',
      title: 'Keyword-only and positional-only parameters',
      blocks: [
        {
          type: 'p',
          text: 'You can *force* how callers pass certain arguments. A bare `*` in the parameter list means "everything after me must be given by keyword". A `/` means "everything before me must be positional".',
        },
        {
          type: 'code',
          title: 'only.py',
          runnable: true,
          code: `def move(x, y, *, speed=1, relative=False):
    return (x, y, speed, relative)

print(move(1, 2))
print(move(1, 2, speed=5))

def hypot(a, b, /):
    return (a * a + b * b) ** 0.5

print(hypot(3, 4))`,
          output: `(1, 2, 1, False)
(1, 2, 5, False)
5.0`,
          annotations: [
            { lines: 1, text: '`speed` and `relative` come after the `*`, so callers *must* write `speed=…` — a call like `move(1, 2, 5)` is rejected, which prevents unreadable calls with unlabeled flags.' },
            { lines: 7, text: 'Before the `/`, callers *cannot* use names: `hypot(a=3, b=4)` is an error. That frees the author to rename parameters later without breaking anyone, and is how many built-in functions work.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> move(1, 2, 5)
Traceback (most recent call last):
  File "<python-input-4>", line 1, in <module>
    move(1, 2, 5)
    ~~~~^^^^^^^^^
TypeError: move() takes 2 positional arguments but 3 were given`,
          annotations: [
            { lines: 6, text: 'The message counts only the *positional* parameters; the keyword-only ones can’t absorb a third positional argument.' },
          ],
        },
        {
          type: 'table',
          headers: ['Order in a signature', 'Example', 'Passed by'],
          rows: [
            ['Positional-only', '`a, b, /`', 'position only'],
            ['Normal', '`c, d`', 'position or keyword'],
            ['With defaults', '`e=1`', 'position or keyword (optional)'],
            ['Extra positionals', '`*args`', 'position (collected into a tuple)'],
            ['Keyword-only', '`g, h=2`', 'keyword only'],
            ['Extra keywords', '`**kwargs`', 'keyword (collected into a dict)'],
          ],
          caption: 'A full signature like `def f(a, b=1, *args, c, d=4, **kw)` is legal. In practice, most functions use just a couple of these.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A call such as `spawn(hp=60, "elf")`, with a keyword argument before a positional one, is legal Python.',
      answer: false,
      explanation: 'False. It is a `SyntaxError: positional argument follows keyword argument`. In a call, all positional arguments must come first, then the keyword arguments.',
    },
    {
      kind: 'concept',
      title: 'Variable arguments: args and kwargs',
      blocks: [
        {
          type: 'p',
          text: 'Prefix a parameter with `*` and it **collects** all the extra positional arguments into a tuple. Prefix one with `**` and it collects the extra keyword arguments into a dictionary. The names `args` and `kwargs` are only conventions. At the *call site*, the same symbols go the other way and **spread** a collection into separate arguments.',
        },
        {
          type: 'code',
          title: 'varargs.py',
          runnable: true,
          code: `def total(*numbers):
    return sum(numbers)

def describe(name, **traits):
    parts = [f"{k}={v}" for k, v in traits.items()]
    return name + ": " + ", ".join(parts)

print(total(1, 2, 3), total())
print(describe("orc", hp=40, armor=3))

def show(a, b, x=0, y=0):
    return (a, b, x, y)

args = [10, 20]
kwargs = {"x": 1, "y": 2}
print(show(*args, **kwargs))
print(*args, sep=" | ")
config = {"hp": 100}
merged = {**config, "hp": 80, "mana": 5}
print(merged)
print([*args, 30])`,
          output: `6 0
orc: hp=40, armor=3
(10, 20, 1, 2)
10 | 20
{'hp': 80, 'mana': 5}
[10, 20, 30]`,
          annotations: [
            { lines: 1, text: '`*numbers` gathers every positional argument into a tuple, so `numbers` is `(1, 2, 3)` for the first call and `()` for the second.' },
            { lines: 4, text: '`**traits` gathers keyword arguments into a dict: `{"hp": 40, "armor": 3}`.' },
            { lines: 16, text: 'At the call site, `*args` spreads a list into positional arguments and `**kwargs` spreads a dict into keyword arguments: this is `show(10, 20, x=1, y=2)`.' },
            { lines: 17, text: 'This is how `print` itself works: it is defined with `*values`, and `sep=` is a keyword-only parameter.' },
            { lines: 19, text: 'The same `**` also merges dicts in a literal; later entries win, so `hp` becomes 80. And `[*args, 30]` builds a list the same way.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Just a tuple and a dict',
          text: 'Inside the function, `args` is an ordinary `tuple` and `kwargs` an ordinary `dict` — you can loop over them, index them and check their length. Python builds them fresh on each call, which is why they are never shared the way a mutable default is.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: '`*args` is great for functions that naturally take "one or more things" (`max`, `print`, `os.path.join`), and `**kwargs` for options bags and forwarding. But don’t use them to avoid thinking about a clear signature: explicit parameters document themselves, while `**kwargs` hides what is accepted.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Fill in the symbols so that `total` accepts any number of arguments, and the call spreads the list `values` into separate arguments.',
      template: `def total(___numbers):
    return sum(numbers)

values = [1, 2, 3]
print(total(___values))`,
      templateIsCode: true,
      blanks: [{ answers: ['*'] }, { answers: ['*'] }],
      explanation: 'In a definition, `*numbers` collects extra positional arguments into a tuple. In a call, `*values` unpacks the list into separate arguments, so the call is `total(1, 2, 3)`. Without the star, `total(values)` would pass one argument — the list — so `numbers` would be `([1, 2, 3],)` and `sum` would fail with a `TypeError` trying to add a list to 0.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\ndef f(*args, **kwargs):\n    return len(args) * 10 + len(kwargs)\n\nprint(f(1, 2, 3, a=1, b=2))\n```',
      answer: '32',
      hint: 'Three positional arguments land in `args`; two keyword arguments land in `kwargs`.',
      explanation: '`args` is `(1, 2, 3)`, length 3; `kwargs` is `{"a": 1, "b": 2}`, length 2. The result is $3 \\times 10 + 2 = 32$.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'Forwarding arguments',
      blocks: [
        {
          type: 'p',
          text: 'The most important use of `*args` and `**kwargs` together is a **wrapper**: a function that accepts anything and passes it straight on to another function. It is how logging, timing and retry helpers are built — and the foundation of decorators in Unit 12.',
        },
        {
          type: 'code',
          title: 'forward.py',
          runnable: true,
          code: `def call_logged(func, *args, **kwargs):
    print("calling", func.__name__, args, kwargs)
    return func(*args, **kwargs)

print(call_logged(max, 3, 9, 4))
print(call_logged(sorted, [3, 1, 2], reverse=True))`,
          output: `calling max (3, 9, 4) {}
9
calling sorted ([3, 1, 2],) {'reverse': True}
[3, 2, 1]`,
          annotations: [
            { lines: 1, text: '`func` is a function passed as an argument (the next lesson shows how). Everything else is captured in `args` and `kwargs` — whatever the target function needs.' },
            { lines: 3, text: 'Spreading them again with `*args` and `**kwargs` re-creates the original call exactly, and `return` hands the result back.' },
            { lines: 6, text: 'The same wrapper works unchanged for `max` (positional only) and `sorted` (a positional plus a keyword).' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Game engines love this pattern: an event system calls `handler(*event_args, **event_kwargs)`, a console command registry forwards typed arguments, and a profiler wrapper times any function without knowing its signature.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why forward instead of repeating the parameters?',
          text: 'A wrapper that spells out the target’s parameters has to be edited every time the target changes. One that forwards `*args, **kwargs` keeps working automatically — the wrapper doesn’t need to know or care what the arguments mean.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'This function should return a fresh list on every call that does not pass `bucket`, but it keeps reusing one list. Fix it so that `collect("a")` returns `["a"]`, a later `collect("b")` returns `["b"]`, and passing your own list still appends to it.',
      starter: `def collect(item, bucket=[]):
    bucket.append(item)
    return bucket
`,
      solution: `def collect(item, bucket=None):
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket
`,
      tests: `assert collect("a") == ["a"]
assert collect("b") == ["b"], "the default list is being shared between calls"
mine = ["x"]
assert collect("y", mine) is mine and mine == ["x", "y"]`,
      checks: ['Each call without `bucket` starts with an empty list', 'A list passed in is still modified and returned'],
      hint: 'Default to `None`, then `if bucket is None: bucket = []` inside the function.',
      explanation: 'With `bucket=None` as the default, a new list is created in the body on every call that omits the argument, while a list the caller *does* pass in is used as-is. The `is None` test (not `if not bucket`) matters: an empty list the caller passes in must still be used, not replaced.',
    },
    {
      kind: 'code',
      prompt: 'Write `mean(*numbers)` that takes any number of numeric arguments and returns their average, or `0` if there are none. For example `mean(2, 4, 6)` is `4`.',
      starter: `# define mean here
`,
      solution: `def mean(*numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)
`,
      tests: `assert mean(2, 4, 6) == 4
assert mean(5) == 5
assert mean() == 0
assert mean(1, 2) == 1.5
assert mean(*[10, 20, 30]) == 20`,
      checks: ['Accepts any number of arguments', 'Returns 0 when called with none'],
      hint: '`numbers` is a tuple, so `sum(numbers)` and `len(numbers)` both work. An empty tuple is falsy.',
      explanation: '`*numbers` collects the arguments into a tuple. The guard `if not numbers` handles the empty call, avoiding division by zero. The last test shows spreading a list into the call with `*`.',
    },
    {
      kind: 'code',
      prompt: 'Write `build_unit(name, **stats)` that returns a dictionary with the key `"name"`, a default `"hp"` of 100, and any extra keyword arguments as additional entries (which may override `hp`).\n\n`build_unit("orc", hp=40, armor=2)` → `{"name": "orc", "hp": 40, "armor": 2}`\n`build_unit("elf")` → `{"name": "elf", "hp": 100}`',
      starter: `# define build_unit here
`,
      solution: `def build_unit(name, **stats):
    unit = {"name": name, "hp": 100}
    unit.update(stats)
    return unit
`,
      tests: `assert build_unit("orc", hp=40, armor=2) == {"name": "orc", "hp": 40, "armor": 2}
assert build_unit("elf") == {"name": "elf", "hp": 100}
assert build_unit("bat", speed=9) == {"name": "bat", "hp": 100, "speed": 9}`,
      checks: ['`hp` defaults to 100', 'Extra keywords become entries and may override `hp`'],
      hint: 'Start a dict with `"name"` and `"hp": 100`, then `update(stats)` so the caller’s values win. (`{"name": name, "hp": 100, **stats}` also works.)',
      explanation: '`**stats` collects the extra keyword arguments into a dict. Starting from the defaults and calling `update(stats)` lets any supplied `hp` replace the default. This is the standard "defaults plus overrides" idiom for configuration and game-object factories.',
    },
  ],
  takeaways: [
    'Arguments match parameters by position or by keyword; defaults make parameters optional. Required parameters come first, and in a call, keywords come after positionals.',
    'Defaults are evaluated once, at definition time — so a mutable default (`[]`, `{}`) is shared between calls. Use `None` and create the object inside.',
    'A bare `*` makes later parameters keyword-only; a `/` makes earlier ones positional-only.',
    '`*args` collects extra positionals into a tuple and `**kwargs` collects extra keywords into a dict; at a call site, `*seq` and `**mapping` spread them back out.',
    'A wrapper that takes `*args, **kwargs` and forwards them can wrap any function — the basis of decorators.',
  ],
  reading: [
    { title: 'More on Defining Functions (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/controlflow.html#more-on-defining-functions', source: 'docs', note: 'Default values, keyword arguments, special parameters and unpacking, all with examples.' },
    { title: 'Common Gotchas: mutable default arguments', url: 'https://docs.python-guide.org/writing/gotchas/#mutable-default-arguments', source: 'article', note: 'The Hitchhiker’s Guide to Python on the shared-default surprise.' },
    { title: 'PEP 3102 — Keyword-Only Arguments', url: 'https://peps.python.org/pep-3102/', source: 'pep', note: 'Why the bare `*` exists.' },
    { title: 'PEP 570 — Positional-Only Parameters', url: 'https://peps.python.org/pep-0570/', source: 'pep', note: 'The proposal that added `/` in Python 3.8.' },
  ],
};
