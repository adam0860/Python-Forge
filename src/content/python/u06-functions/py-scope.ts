import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-scope',
  title: 'Scope and Namespaces (LEGB)',
  summary: 'Where a name is visible: local and global variables, why assigning inside a function creates a new local, the `global` and `nonlocal` keywords, the LEGB lookup order, and how shadowing a built-in goes wrong.',
  minutes: 18,
  objectives: [
    'Distinguish local and global variables and predict which one a name refers to',
    'Explain `UnboundLocalError` and when `global` is — and isn’t — needed',
    'State the LEGB rule (Local, Enclosing, Global, Built-in) and use `nonlocal` in a nested function',
    'Recognize and avoid shadowing built-in names such as `list` and `max`',
    'Inspect namespaces with `globals()`, `locals()` and `dir()`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Local variables live and die with the call',
      blocks: [
        {
          type: 'p',
          text: 'A variable’s **scope** is the part of the program where its name can be used. A name created by assignment inside a function is **local**: it exists only while that call runs, and no other code can see it. A name created at the top level of a file is **global** to that module, and functions can read it.',
        },
        {
          type: 'code',
          title: 'local_global.py',
          runnable: true,
          code: `def spawn():
    enemy = "orc"
    print("inside:", enemy)

spawn()
print("outside:", "enemy" in dir())

level = 3

def show_level():
    print("level is", level)

show_level()`,
          output: `inside: orc
outside: False
level is 3`,
          annotations: [
            { lines: 2, text: '`enemy` is assigned inside `spawn`, so it is local to `spawn`. Parameters are local too.' },
            { lines: 6, text: 'Back at the top level, `enemy` doesn’t exist: `"enemy" in dir()` is `False`. Using it would raise `NameError`.' },
            { lines: 8, text: '`level` is assigned at the top level, so it is global.' },
            { lines: 11, text: 'Reading a global from inside a function works: Python finds no local `level`, so it looks outward.' },
          ],
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> def f():
...     x = 1
...
>>> f()
>>> print(x)
Traceback (most recent call last):
  File "<python-input-3>", line 1, in <module>
    print(x)
          ^
NameError: name 'x' is not defined`,
          annotations: [
            { lines: 10, text: 'The local `x` vanished when `f()` returned. This is by design: each call starts clean and cannot disturb another call’s variables.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why have local scope at all?',
          text: 'Without it, every variable in a program would be visible everywhere. A function using `i` or `total` could clobber another function’s `i` or `total`, and you would need globally unique names for thousands of throwaway values. Local scope lets you write each function in isolation and reuse short names freely.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Function scope, not block scope',
          text: 'In C++ a variable declared inside an `if` or `for` block disappears at the closing brace. Python has **no block scope**: names created inside `if`, `for` and `while` belong to the enclosing *function* (or module) and remain visible afterwards. Only functions, classes, modules and comprehensions create new scopes.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After this code runs, what happens at the last line?\n\n```\ndef compute():\n    total = 5 + 5\n    return total\n\ncompute()\nprint(total)\n```',
      options: [
        { text: 'It prints `10`', why: '`total` was local to `compute`. Returning its *value* doesn’t make the *name* visible outside.' },
        { text: 'It raises `NameError`', correct: true, why: 'Right: `total` only existed inside the call. The value 10 was returned and discarded because the caller didn’t store it.' },
        { text: 'It prints `None`', why: '`None` is the return value of a function with no `return`. Here the problem is the unknown name.' },
        { text: 'It prints `0`', why: 'Python never invents a default value for an unknown name.' },
      ],
      explanation: 'The name `total` lives in `compute`’s local scope and disappears when the call ends. To use the result, capture the returned value: `total = compute()`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Which `x` does each part of the program see?',
      code: `x = 10

def f():
    x = 20
    return x

print(f(), x)`,
      answer: '20 10',
      hint: 'Assigning inside a function creates a *new local*; it doesn’t touch the global.',
      explanation: 'The assignment `x = 20` inside `f` makes `x` a local variable that merely *shadows* the global `x`. `f()` returns that local 20, while the global `x` is still 10. The two variables share a name but are different objects in different scopes.',
    },
    {
      kind: 'concept',
      title: 'Assigning to a global: UnboundLocalError and `global`',
      blocks: [
        {
          type: 'p',
          text: 'Here is the subtle rule. Python decides whether a name is local **by looking at the whole function body before it runs**: if the function *assigns* to the name anywhere, that name is local throughout the entire function — even on lines above the assignment.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> score = 0
>>> def add_points(n):
...     score = score + n
...
>>> add_points(5)
Traceback (most recent call last):
  File "<python-input-3>", line 1, in <module>
    add_points(5)
    ~~~~~~~~~~^^^
  File "<python-input-2>", line 2, in add_points
    score = score + n
            ^^^^^
UnboundLocalError: cannot access local variable 'score' where it is not associated with a value`,
          annotations: [
            { lines: 3, text: 'Because `score` is assigned on this line, Python treats it as local to the *whole* function.' },
            { lines: 12, text: 'The right-hand `score` is therefore the local one — which has no value yet. The global `score` is never consulted.' },
          ],
        },
        {
          type: 'p',
          text: 'If you really do want to rebind a global from inside a function, declare it with the `global` keyword. But note that **mutating** a global object (appending to a list, say) is not rebinding, so it needs no declaration:',
        },
        {
          type: 'code',
          title: 'global_keyword.py',
          runnable: true,
          code: `score = 0

def add_points_bad(n):
    total = score + n
    return total

def add_points(n):
    global score
    score = score + n

add_points(5)
add_points(10)
print(score, add_points_bad(1), score)

items = []
def pick_up(thing):
    items.append(thing)
pick_up("key")
print(items)`,
          output: `15 16 15
['key']`,
          annotations: [
            { lines: 4, text: 'Only *reading* `score`: no assignment to it, so Python looks it up in the global scope.' },
            { lines: 8, text: '`global score` tells Python that assignments to `score` in this function rebind the **module-level** variable.' },
            { lines: 13, text: 'Evaluated left to right: 15, then 16 (a pure calculation that leaves `score` alone), then 15 again.' },
            { lines: 17, text: '`items.append` changes the existing list; it never assigns to the name `items`, so no `global` is needed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Prefer parameters and return values',
          text: 'Code that reads and writes globals is hard to test and hard to follow: any function might change any value at any time. The cleaner shape is `score = add_points(score, 5)`: pass what the function needs in, return what it produces. Reserve globals for true constants (`MAX_HP = 100`) and genuinely program-wide state — and keep that state in one clearly named place.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code crashes with `UnboundLocalError`. Tap the line that **causes** it.',
      lines: ['lives = 3', 'def lose_life():', '    lives = lives - 1', 'lose_life()'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 assigns to `lives`, so Python treats `lives` as a local variable throughout `lose_life` — and the right-hand side reads it before it has a value. One fix is `global lives` at the top of the function; the better fix is `def lose_life(lives): return lives - 1` and `lives = lose_life(lives)`.',
    },
    {
      kind: 'truefalse',
      prompt: 'A function can add an item to a global list with `items.append(x)` without declaring `global items`.',
      answer: true,
      explanation: 'True. `global` is only needed to *rebind* the name (`items = [...]`). `items.append(x)` looks the name up, finds the global list and mutates that object, which is allowed. This is also why mutable globals are risky: any function can change them silently.',
    },
    {
      kind: 'concept',
      title: 'The LEGB rule and nonlocal',
      blocks: [
        {
          type: 'p',
          text: 'When Python meets a name it searches four scopes, innermost first, and stops at the first match: **L**ocal (the current function), **E**nclosing (any functions this one is nested inside), **G**lobal (the module), **B**uilt-in (names like `len`, `print`, `range`). That order is **LEGB**.',
        },
        {
          type: 'code',
          title: 'legb.py',
          runnable: true,
          code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print("inner sees", x)
    inner()
    print("outer sees", x)

outer()
print("module sees", x)

def show_enclosing():
    msg = "hello"
    def inner():
        print(msg)
    inner()

show_enclosing()
print(len("abc"))`,
          output: `inner sees local
outer sees enclosing
module sees global
hello
3`,
          annotations: [
            { lines: 6, text: 'Each function has its own `x`. `inner` finds its Local `x` first and never looks further.' },
            { lines: 9, text: '`outer` sees its own `x` — the Enclosing one from `inner`’s point of view — unaffected by `inner`’s assignment.' },
            { lines: 12, text: 'The module’s Global `x` is untouched by all of it.' },
            { lines: 17, text: '`inner` has no `msg` of its own, so Python finds it in the Enclosing function. Functions that capture variables like this are *closures* (Unit 12).' },
            { lines: 21, text: '`len` is nowhere in the code, so it is found last, in the Built-in scope.' },
          ],
        },
        {
          type: 'p',
          text: 'Just as `global` lets a function rebind a module-level name, `nonlocal` lets a **nested** function rebind a variable in the *enclosing* function. That is how a function can remember state between calls without any global variable:',
        },
        {
          type: 'code',
          title: 'nonlocal.py',
          runnable: true,
          code: `def make_counter():
    count = 0
    def increment():
        nonlocal count
        count += 1
        return count
    return increment

tick = make_counter()
print(tick(), tick(), tick())
other = make_counter()
print(other())`,
          output: `1 2 3
1`,
          annotations: [
            { lines: 4, text: '`nonlocal count` says: assignments to `count` here refer to the variable in the nearest enclosing function, not a new local.' },
            { lines: 7, text: '`make_counter` returns the *function* `increment` (not a call). It keeps its link to `count` even after `make_counter` has finished.' },
            { lines: 11, text: 'Each call to `make_counter` creates a separate `count`, so `other` starts again at 1.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How CPython decides',
          text: 'At compile time Python scans each function body and classifies every name: local, free (taken from an enclosing function), or global. Locals live in fast array slots rather than a dictionary — one reason local-variable access is quicker than global access. This compile-time classification is also why `UnboundLocalError` exists: the decision is made before any line runs.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the lookup order Python follows for a name inside a nested function.',
      template: 'Local → ___ → Global → ___',
      blanks: [{ answers: ['Enclosing'], caseSensitive: false }, { answers: ['Built-in', 'Builtin', 'Built in'], caseSensitive: false }],
      wordBank: ['Enclosing', 'Built-in', 'Module', 'Class'],
      explanation: 'After the current function’s **L**ocal scope, Python checks any **E**nclosing function scopes, then the **G**lobal (module) scope, and finally the **B**uilt-in scope — LEGB. If the name isn’t found anywhere, you get a `NameError`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. How many separate counters are created?',
      code: `def make():
    n = 0
    def bump():
        nonlocal n
        n += 10
        return n
    return bump

a = make()
print(a(), a(), make()())`,
      answer: '10 20 10',
      hint: '`a` keeps its own `n` between calls. What about the brand-new function created by the last `make()`?',
      explanation: '`a` carries its own `n`: the first call makes it 10, the second 20. The expression `make()()` creates a *new* `bump` with its own fresh `n = 0` and calls it once, giving 10. Each call to `make` makes an independent counter.',
    },
    {
      kind: 'concept',
      title: 'Shadowing built-ins, and peeking at namespaces',
      blocks: [
        {
          type: 'p',
          text: 'A **namespace** is the mapping from names to objects that a scope owns; in practice a dictionary. Because the Built-in scope is searched last, any name you create *earlier in the order* hides the built-in — silently. That is called **shadowing**, and it causes some of the most confusing errors beginners meet:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> list = [1, 2]
>>> list("abc")
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    list("abc")
    ~~~~^^^^^^^
TypeError: 'list' object is not callable`,
          annotations: [
            { lines: 1, text: 'Innocent-looking, but this creates a global named `list` that now hides the built-in function `list`.' },
            { lines: 7, text: 'Python found *your* `list` first and tried to call a list. The same happens with `max = 10`, `sum = 0`, `str = "x"`, `id`, `input`, `type`…' },
          ],
        },
        {
          type: 'code',
          title: 'namespaces.py',
          runnable: true,
          code: `def f(a, b):
    c = a + b
    return sorted(locals())

print(f(1, 2))

for i in range(3):
    pass
print(i)

squares = [j for j in range(3)]
print("j" in globals(), "i" in globals())
print("len" in dir(__import__("builtins")), "len" in globals())`,
          output: `['a', 'b', 'c']
2
False True
True False`,
          annotations: [
            { lines: 3, text: '`locals()` is the function’s local namespace as a dictionary: its parameters and the variables assigned so far. Sorting its keys gives a list of names.' },
            { lines: 9, text: 'A `for` loop variable *leaks*: `i` still exists after the loop, holding the last value (2). Python has no block scope.' },
            { lines: 12, text: 'A comprehension has its own scope, so `j` does *not* leak into the module — while `i` does.' },
            { lines: 13, text: '`len` lives in the built-ins namespace, not in the module’s globals.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Avoid shadowing',
          text: 'Pick names like `items`, `scores`, `total_sum`, `kind` or `text` instead of `list`, `sum`, `max`, `type` or `str`. Good editors highlight built-ins in a different color, and linters (Unit 15) warn about shadowing. If you ever see "`x` object is not callable", suspect you overwrote a function with a value.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Names are dictionary keys',
          text: 'The module namespace behind `globals()` really is a dict: `globals()["level"]` is the same as `level`. Every `import`, `def`, `class` and assignment at the top level adds an entry. Objects and classes keep their attributes in similar dictionaries, which is why Python is so introspective — you will use that in the object-model unit.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A script starts with `max = 10`, and later calls `max(3, 8)`. What happens?',
      options: [
        { text: 'It returns 8, as usual', why: 'Your global `max` is found before the built-in one, so the built-in is never reached.' },
        { text: 'It returns 10, the larger of the two values', why: 'Variables are not mixed into function calls; the name `max` now refers to the integer 10.' },
        { text: 'It raises `TypeError: \'int\' object is not callable`', correct: true, why: 'Right: `max` now names the integer 10, and calling an integer is an error.' },
        { text: 'It raises `NameError` because `max` is defined twice', why: 'Python happily lets you rebind names; there is no "defined twice" error.' },
      ],
      explanation: 'The global `max` shadows the built-in because the Built-in scope is searched last. Rename your variable (`max_hp`, `highest`), and if you are in a REPL session where it already happened, `del max` removes your variable and exposes the built-in again.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nx = 5\ndef f():\n    global x\n    x = x * 2\n\nf()\nf()\nprint(x)\n```',
      answer: '20',
      hint: '`global x` means the function rebinds the module-level `x`. Run it twice.',
      explanation: 'Each call doubles the global `x`: after the first call it is 10, after the second 20. Without `global x`, the line `x = x * 2` would raise `UnboundLocalError` instead.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `make_counter()` that returns a function. Each call to *that* function returns the next whole number starting from 1, and two counters must count independently.',
      starter: `# define make_counter here
`,
      solution: `def make_counter():
    count = 0
    def next_number():
        nonlocal count
        count += 1
        return count
    return next_number
`,
      tests: `a = make_counter()
b = make_counter()
assert a() == 1 and a() == 2 and a() == 3
assert b() == 1, "counters must be independent"
assert a() == 4`,
      checks: ['The returned function counts 1, 2, 3 …', 'Two counters do not share state', 'Uses `nonlocal` rather than a global'],
      hint: 'Create `count = 0` in `make_counter`, define an inner function that does `nonlocal count`, increments and returns it, and return the inner function (without calling it).',
      explanation: 'Each call to `make_counter` creates a fresh `count` and an inner function bound to it. `nonlocal` lets the inner function rebind that variable instead of making a new local. Returning `next_number` (no parentheses) hands the caller the function itself.',
    },
    {
      kind: 'code',
      prompt: 'Write `with_bonus(stats, bonus)` that returns a **new** dictionary in which `bonus` is added to every value. It must not modify the dictionary that was passed in.',
      starter: `# define with_bonus here
`,
      solution: `def with_bonus(stats, bonus):
    return {name: value + bonus for name, value in stats.items()}
`,
      tests: `base = {"hp": 100, "mana": 40}
boosted = with_bonus(base, 5)
assert boosted == {"hp": 105, "mana": 45}, f"boosted is {boosted}"
assert base == {"hp": 100, "mana": 40}, "the original dict must not change"
assert with_bonus({}, 3) == {}`,
      checks: ['Returns the boosted values', 'The original dictionary is unchanged'],
      hint: 'A dict comprehension over `stats.items()` builds a new dict and leaves the original alone.',
      explanation: 'Building and returning a new dict is the side-effect-free approach: the caller decides whether to keep the result or discard it. Modifying `stats` in place and returning `None` would work for one caller and quietly corrupt the data of another.',
    },
    {
      kind: 'code',
      prompt: 'A module-level counter `_next_id` hands out unique ids. Write `next_id()` that increments it and returns the new value: the first call returns 1, the second 2, and so on. (This is one of the rare cases where `global` is reasonable.)',
      starter: `_next_id = 0

# define next_id here
`,
      solution: `_next_id = 0

def next_id():
    global _next_id
    _next_id += 1
    return _next_id
`,
      tests: `assert next_id() == 1
assert next_id() == 2
assert next_id() == 3
assert _next_id == 3, "the module-level counter must be updated"`,
      checks: ['Uses `global _next_id`', 'Returns 1, 2, 3 on successive calls'],
      hint: 'Without `global _next_id`, the line `_next_id += 1` would raise `UnboundLocalError`.',
      explanation: '`_next_id += 1` assigns to the name, so the function needs `global _next_id` to rebind the module-level variable. The leading underscore signals "internal to this module". For several independent counters, the `make_counter` closure from the previous exercise is cleaner than a global.',
    },
  ],
  takeaways: [
    'A name assigned inside a function is local to that call; parameters are local too. Python has function scope, not block scope — `if`/`for` bodies don’t create new scopes.',
    'If a function assigns to a name anywhere, that name is local for the whole function, so reading it first gives `UnboundLocalError`. Use `global` to rebind a module-level name — or, better, pass values in and return results.',
    'Lookup follows LEGB: Local → Enclosing → Global → Built-in. `nonlocal` lets a nested function rebind an enclosing variable.',
    'Mutating a global object (e.g. `.append`) doesn’t need `global`; rebinding the name does.',
    'Don’t shadow built-ins (`list`, `max`, `sum`, `type`, `str`): "object is not callable" is the usual symptom. Comprehension variables don’t leak but `for` variables do.',
  ],
  reading: [
    { title: 'Python Scopes and Namespaces (Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces', source: 'docs', note: 'The official walk-through of scopes, `global` and `nonlocal`, with a worked example.' },
    { title: 'Naming and binding (Language Reference)', url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding', source: 'docs', note: 'The precise rules, including why scope is decided at compile time.' },
    { title: 'PEP 3104 — Access to Names in Outer Scopes', url: 'https://peps.python.org/pep-3104/', source: 'pep', note: 'The proposal that added `nonlocal` in Python 3.' },
    { title: 'Real Python: Python Scope & the LEGB Rule', url: 'https://realpython.com/python-scope-legb-rule/', source: 'article', note: 'A detailed tour with diagrams and examples.' },
  ],
};
