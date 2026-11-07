import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-first-class',
  title: 'First-Class Functions and Lambdas',
  summary: 'Functions are objects: store them, pass them to other functions, return them. Learn `key=`, `map`, `filter`, `lambda`, dispatch tables for game commands, function factories — and the late-binding trap in loops.',
  minutes: 20,
  objectives: [
    'Explain that a function is an object, and tell `f` (the function) from `f()` (a call)',
    'Pass functions as arguments — `sorted(key=…)`, `max(key=…)`, `map`, `filter` — and write your own higher-order function',
    'Write `lambda` expressions and know their limits compared with `def`',
    'Build a dispatch table (a dictionary of functions) and a function factory',
    'Explain and avoid the late-binding behavior of lambdas created in a loop',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Functions are objects',
      blocks: [
        {
          type: 'p',
          text: 'In Python a function is a value, just like a number or a string. `def shout(...)` creates a function **object** and binds the name `shout` to it. You can give it another name, put it in a list, or hand it to another function. This property is called *first-class functions*, and it is the key to a whole style of programming.',
        },
        {
          type: 'code',
          title: 'function_objects.py',
          runnable: true,
          code: `def shout(text):
    return text.upper() + "!"

yell = shout
print(yell("hi"))
print(type(shout).__name__, shout.__name__)
tools = [shout, str.title, len]
for tool in tools:
    print(tool("dragon"))
print(callable(shout), callable("dragon"))`,
          output: `HI!
function shout
DRAGON!
Dragon
6
True False`,
          annotations: [
            { lines: 4, text: '**No parentheses.** `shout` is the function object itself; `yell = shout` just adds a second name for it. Writing `shout("hi")` would *call* it and store the result instead.' },
            { lines: 6, text: 'A function has a type (`function`) and attributes such as `__name__`, like any other object.' },
            { lines: 7, text: 'A list holding three different functions — one of ours and two built-ins.' },
            { lines: 9, text: 'Each `tool` is called with the same argument. A function can be treated as data, then used when needed.' },
            { lines: 10, text: '`callable(x)` says whether `x` can be called with `()`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: '`f` versus `f()`',
          text: '`f` is the function; `f()` is the *result of calling it*. Mixing them up produces two classic bugs: forgetting parentheses (`print(shout)` shows `<function shout at 0x…>` instead of running it), and adding parentheses where a function is expected (`sorted(words, key=len())` fails because `len()` is called with no argument).',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Like function pointers, without the pain',
          text: 'In C++ you would reach for function pointers, `std::function` or lambdas with capture lists. Python needs none of that: every function is already a first-class object, with no declared type and no special syntax for passing one around.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Given `def shout(text): return text.upper() + "!"`, what does `yell = shout` do?',
      options: [
        { text: 'Calls `shout` with no arguments and stores the result in `yell`', why: 'That would be `yell = shout()`, which would also fail because `text` is missing.' },
        { text: 'Makes `yell` another name for the same function object', correct: true, why: 'Right: no copy and no call. `yell("hi")` and `shout("hi")` now run the same function.' },
        { text: 'Makes a copy of the function’s source code', why: 'No code is copied; both names point at one object.' },
        { text: 'Raises an error, because functions cannot be assigned', why: 'Functions are ordinary objects and can be assigned, stored and passed freely.' },
      ],
      explanation: 'Assignment never calls anything: `yell = shout` binds a second name to the existing function object. Only the parentheses in `shout(...)` trigger a call.',
    },
    {
      kind: 'concept',
      title: 'Passing functions to functions',
      blocks: [
        {
          type: 'p',
          text: 'A function that takes another function as an argument (or returns one) is called a **higher-order function**. You have already used them: `sorted(words, key=len)` hands `len` to `sorted`, which calls it on each item to decide the order. Python also provides `map` (apply a function to every item) and `filter` (keep items for which a function returns true).',
        },
        {
          type: 'code',
          title: 'higher_order.py',
          runnable: true,
          code: `def apply_twice(func, value):
    return func(func(value))

def add_ten(n):
    return n + 10

print(apply_twice(add_ten, 5))
print(apply_twice(str.upper, "ab"))
print(apply_twice(lambda s: s + "!", "go"))

words = ["pear", "fig", "banana", "kiwi"]
print(sorted(words, key=len))
print(max(words, key=len))
print(list(map(len, words)))
print(list(filter(lambda w: len(w) > 3, words)))`,
          output: `25
AB
go!!
['fig', 'pear', 'kiwi', 'banana']
banana
[4, 3, 6, 4]
['pear', 'banana', 'kiwi']`,
          annotations: [
            { lines: 1, text: '`func` is a parameter that holds a function; the body simply calls it. `apply_twice` works with any function that accepts and returns compatible values.' },
            { lines: 7, text: '`add_ten(add_ten(5))` is 25. We pass the *name* `add_ten`, without parentheses.' },
            { lines: 9, text: 'A `lambda` — a small anonymous function — written right where it is needed. The next card explains the syntax.' },
            { lines: 12, text: '`key=len` sorts by length. `pear` and `kiwi` tie, and the stable sort keeps their original order.' },
            { lines: 13, text: '`max` and `min` also take `key=`: here, the longest word.' },
            { lines: 14, text: '`map(len, words)` yields `len(word)` for each word. Like `zip`, it is lazy, so we wrap it in `list(...)`.' },
            { lines: 15, text: '`filter(test, items)` keeps the items for which `test(item)` is truthy.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'map and filter vs comprehensions',
          text: 'Most Python programmers prefer comprehensions: `[len(w) for w in words]` and `[w for w in words if len(w) > 3]` say the same thing without a `lambda`. `map` and `filter` shine when you already have a named function (`map(len, words)`, `filter(str.isdigit, tokens)`). The real power of passing functions is `key=` and callbacks.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Work from the inside out.',
      code: `def compose(f, g):
    return lambda x: f(g(x))

inc = lambda x: x + 1
dbl = lambda x: x * 2
print(compose(inc, dbl)(5), compose(dbl, inc)(5))`,
      answer: '11 12',
      hint: '`compose(f, g)(x)` applies `g` first, then `f`.',
      explanation: '`compose(inc, dbl)(5)` computes `inc(dbl(5))` = `inc(10)` = 11. `compose(dbl, inc)(5)` computes `dbl(inc(5))` = `dbl(6)` = 12. The order of composition matters, and `compose` returns a *new function* each time.',
    },
    {
      kind: 'concept',
      title: 'lambda: tiny anonymous functions',
      blocks: [
        {
          type: 'p',
          text: 'A `lambda` is a function written as a single **expression**: `lambda parameters: expression`. It returns that expression’s value automatically (there is no `return` keyword), and it has no name — which is why it suits one-off jobs like a sort key.',
        },
        {
          type: 'code',
          title: 'lambdas.py',
          runnable: true,
          code: `square = lambda n: n * n
print(square(7))
points = [(2, 9), (5, 1), (3, 4)]
print(sorted(points, key=lambda p: p[1]))
print(sorted(points, key=lambda p: p[0]))
add = lambda a, b=1: a + b
print(add(5), add(5, 5))
print((lambda x: x * 2)(21))`,
          output: `49
[(5, 1), (3, 4), (2, 9)]
[(2, 9), (3, 4), (5, 1)]
6 10
42`,
          annotations: [
            { lines: 1, text: 'Equivalent to `def square(n): return n * n`. (Naming a lambda like this is discouraged — see below.)' },
            { lines: 4, text: 'The classic use: tell `sorted` to order points by their second value.' },
            { lines: 6, text: 'Lambdas support defaults, `*args` and keyword arguments like any function.' },
            { lines: 8, text: 'You can even call a lambda immediately. It works, but is rarely clearer than writing the expression directly.' },
          ],
        },
        {
          type: 'table',
          headers: ['Feature', 'def', 'lambda'],
          rows: [
            ['Body', 'any number of statements', 'one expression only'],
            ['Name', 'has a name (helps tracebacks)', 'anonymous: `<lambda>`'],
            ['Docstring / annotations', 'yes', 'no'],
            ['Best for', 'anything reused or non-trivial', 'short `key=` functions and callbacks'],
          ],
          caption: 'PEP 8 says to use a `def` statement rather than assigning a lambda to a name: `def square(n): return n * n` gives the function a real name in tracebacks.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A `lambda` can contain several statements, such as assignments and loops, as long as they are on separate lines.',
      answer: false,
      explanation: 'False. A lambda’s body is a single *expression*; statements like assignments, `for`, `if` blocks or `return` are not allowed. Anything bigger needs a `def`. (A conditional *expression* `a if c else b` is fine, because it is an expression.)',
    },
    {
      kind: 'fill',
      prompt: 'Fill in the blanks so that `longest` is the longest word and `by_last_letter` sorts the words by their last character.',
      template: `words = ["pear", "fig", "banana"]
longest = max(words, key=___)
by_last_letter = sorted(words, key=___ w: w[-1])`,
      templateIsCode: true,
      blanks: [{ answers: ['len'] }, { answers: ['lambda'] }],
      wordBank: ['len', 'lambda', 'len()', 'def'],
      explanation: '`key=len` passes the function itself — no parentheses — so `max` calls `len(word)` on each word and picks the largest. The sort key needs a one-off function that takes a word and returns its last letter: `lambda w: w[-1]`. With `len()`, Python would call `len` with no argument and raise `TypeError`.',
    },
    {
      kind: 'concept',
      title: 'Dispatch tables and function factories',
      blocks: [
        {
          type: 'p',
          text: 'Storing functions in a dictionary gives you a **dispatch table**: look up a command by name and call whatever comes back — a lean replacement for a long `if`/`elif` chain that you can extend at run time. And since functions can be returned as well as passed, a **factory** can build specialized functions on demand.',
        },
        {
          type: 'code',
          title: 'dispatch.py',
          runnable: true,
          code: `def attack():
    return "You swing your sword."

def heal():
    return "You drink a potion."

def flee():
    return "You run away!"

commands = {"attack": attack, "heal": heal, "flee": flee}

for word in ["heal", "attack", "dance"]:
    action = commands.get(word)
    if action is None:
        print(f"Unknown command: {word}")
    else:
        print(action())

def make_multiplier(factor):
    def multiply(n):
        return n * factor
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5))
print(make_multiplier(10)(4))

from functools import partial
binary = partial(int, base=2)
print(binary("101"))`,
          output: `You drink a potion.
You swing your sword.
Unknown command: dance
10 15
40
5`,
          annotations: [
            { lines: 10, text: 'The values are the function objects themselves — no parentheses, so nothing is called yet.' },
            { lines: 13, text: '`get` returns the function or `None` for unknown words, so one lookup replaces a whole `if`/`elif` ladder.' },
            { lines: 17, text: '`action()` calls whichever function was found.' },
            { lines: '19-22', text: 'A **factory**: `make_multiplier(2)` returns a new `multiply` function that remembers `factor = 2` (a closure — Unit 12).' },
            { lines: 30, text: '`functools.partial` pre-fills some arguments of an existing function: `binary(x)` means `int(x, base=2)`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'This is how games dispatch',
          text: 'Console commands (`"spawn"` → `spawn_enemy`), input bindings (key → action), AI behavior tables (state → update function) and event handlers (event name → list of callbacks) are all dictionaries of functions. Adding a feature means registering one more function, not editing a giant `if` chain.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This should sort the words by length, but it crashes with `TypeError: \'int\' object is not callable`. Tap the line with the mistake.',
      lines: ['words = ["pear", "fig", "banana"]', 'by_length = sorted(words, key=len(words))', 'print(by_length)'],
      linesAreCode: true,
      errorLines: [2],
      explanation: '`len(words)` is a *call*: it runs immediately and produces the number 3, and `sorted` then tries to call that number for each item. `key` needs the function itself: `key=len`, without parentheses.',
    },
    {
      kind: 'concept',
      title: 'Gotcha: lambdas in loops, and a peek inside function objects',
      blocks: [
        {
          type: 'p',
          text: 'A function created in a loop does not copy the loop variable; it keeps a reference to the *variable itself*, and looks up its value **when the function is called**. This is *late binding*, and it surprises everybody once:',
        },
        {
          type: 'code',
          title: 'late_binding.py',
          runnable: true,
          code: `funcs = [lambda: i for i in range(3)]
print([f() for f in funcs])

funcs = [lambda i=i: i for i in range(3)]
print([f() for f in funcs])

def f(a, b=2):
    """Add numbers."""
    return a + b

print(f.__name__, f.__doc__, f.__defaults__)
print(f.__code__.co_varnames, f.__code__.co_argcount)
f.bonus = 99
print(f.bonus)`,
          output: `[2, 2, 2]
[0, 1, 2]
f Add numbers. (2,)
('a', 'b') 2
99`,
          annotations: [
            { lines: 1, text: 'All three lambdas refer to the *same* `i`. By the time they are called the loop has finished and `i` is 2, so each returns 2.' },
            { lines: 4, text: 'The fix: bind the current value as a **default argument**. Defaults are evaluated when the lambda is created — exactly the behavior that bit us with `bag=[]` — so each lambda captures its own `i`.' },
            { lines: 11, text: 'A function object carries its name, docstring and defaults as attributes.' },
            { lines: 12, text: 'Its compiled code lives in `__code__`, including the parameter names. Unit 13 explores this.' },
            { lines: 13, text: 'Functions are ordinary objects with a `__dict__`, so you can even attach your own attributes (rarely a good idea).' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Late binding bites in game UIs too',
          text: 'Creating a button callback in a loop — `for name in levels: button.on_click(lambda: load(name))` — makes *every* button load the last level. Use `lambda name=name: load(name)` or `functools.partial(load, name)` to freeze each value.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Closures capture variables, not values',
          text: 'The cell that holds `i` is shared by every lambda, which is the same mechanism that powers `make_counter` and `make_multiplier`. The default-argument trick sidesteps it by copying the value into each function’s own `__defaults__` at creation time.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `callbacks = []
for n in range(3):
    callbacks.append(lambda: n * 10)

print([cb() for cb in callbacks])`,
      answer: '[20, 20, 20]',
      hint: 'When are the lambdas *called*, and what is `n` by then?',
      explanation: 'All three lambdas close over the same variable `n`. They are called after the loop, when `n` is 2, so each returns 20. `lambda n=n: n * 10` would capture 0, 1 and 2 and give `[0, 10, 20]`.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nprint(sum(map(lambda x: x * x, [1, 2, 3])))\n```',
      answer: '14',
      hint: 'Square each number first, then add the squares.',
      explanation: '`map` squares each item: 1, 4, 9. `sum` adds them: $1 + 4 + 9 = 14$. Reading inside-out — lambda, map, sum — is how nested calls are evaluated.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `apply_to_all(func, items)` that returns a **new list** with `func` applied to every item (do not use `map`). For example `apply_to_all(len, ["ab", "c"])` is `[2, 1]`.',
      starter: `# define apply_to_all here
`,
      solution: `def apply_to_all(func, items):
    result = []
    for item in items:
        result.append(func(item))
    return result
`,
      tests: `assert apply_to_all(len, ["ab", "c", ""]) == [2, 1, 0]
assert apply_to_all(lambda n: n * n, [1, 2, 3]) == [1, 4, 9]
assert apply_to_all(str.upper, ["a", "b"]) == ["A", "B"]
original = [1, 2]
apply_to_all(abs, original)
assert original == [1, 2], "do not modify the input list"
assert apply_to_all(abs, []) == []`,
      checks: ['Returns a new list', 'Works with built-ins, lambdas and your own functions'],
      hint: 'Loop over `items`, append `func(item)` to a new list, then return the list.',
      explanation: 'The parameter `func` is just a name bound to whatever function the caller passes; calling `func(item)` runs it. This is the heart of `map`, and a one-line comprehension `[func(item) for item in items]` would do the same.',
    },
    {
      kind: 'code',
      prompt: 'Build a tiny calculator with a **dispatch table**. Write `calculate(op, a, b)` that supports `"+"`, `"-"`, `"*"` and `"/"` by looking up a function in a dictionary of lambdas, and returns `None` for an unknown operator.',
      starter: `# define calculate here
`,
      solution: `def calculate(op, a, b):
    operations = {
        "+": lambda x, y: x + y,
        "-": lambda x, y: x - y,
        "*": lambda x, y: x * y,
        "/": lambda x, y: x / y,
    }
    func = operations.get(op)
    if func is None:
        return None
    return func(a, b)
`,
      tests: `assert calculate("+", 2, 3) == 5
assert calculate("-", 2, 3) == -1
assert calculate("*", 4, 5) == 20
assert calculate("/", 9, 2) == 4.5
assert calculate("^", 2, 3) is None`,
      checks: ['All four operators work', 'An unknown operator returns `None` rather than crashing'],
      hint: 'Make a dict from operator strings to lambdas taking `(x, y)`. Use `.get(op)`; if it is `None`, return `None`; otherwise call `func(a, b)`.',
      explanation: 'The dictionary maps each symbol to a function, `get` returns `None` for unknown keys, and `func(a, b)` runs the chosen operation. Supporting a new operator is a one-line addition to the table, instead of another `elif` branch.',
    },
    {
      kind: 'code',
      prompt: '`players` is a list of dictionaries with `"name"` and `"score"`. Write `rank(players)` that returns the **names** ordered by score from highest to lowest, with ties broken alphabetically by name. Use `sorted` with a `key=` function.',
      starter: `# define rank here
`,
      solution: `def rank(players):
    ordered = sorted(players, key=lambda p: (-p["score"], p["name"]))
    return [p["name"] for p in ordered]
`,
      tests: `players = [
    {"name": "Cai", "score": 90},
    {"name": "Ada", "score": 75},
    {"name": "Ben", "score": 90},
    {"name": "Dee", "score": 100},
]
assert rank(players) == ["Dee", "Ben", "Cai", "Ada"], rank(players)
assert rank([]) == []
assert [p["name"] for p in players] == ["Cai", "Ada", "Ben", "Dee"], "do not reorder the input"`,
      checks: ['Highest score first', 'Ties are in alphabetical order', 'The input list is not reordered'],
      hint: 'Sort by a *tuple* key: `(-score, name)`. Negating the score flips the order for that part only; tuples compare item by item.',
      explanation: 'The key function returns `(-score, name)`: sorting those tuples ascending puts the biggest scores first (their negatives are the smallest), and equal scores fall back to comparing names alphabetically. `sorted` returns a new list, so `players` stays unchanged.',
    },
  ],
  takeaways: [
    'Functions are objects: `f` is the function, `f()` is a call. You can assign, store, pass and return functions.',
    'Higher-order functions take or return functions: `sorted(key=…)`, `max(key=…)`, `map`, `filter`, and your own.',
    '`lambda args: expression` makes a small anonymous function with a single expression; use `def` for anything longer or reused.',
    'Dictionaries of functions are dispatch tables; functions that return functions are factories (`partial` pre-fills arguments).',
    'Lambdas created in a loop share the loop variable (late binding): freeze a value with a default argument or `partial`.',
  ],
  reading: [
    { title: 'Lambda Expressions (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/controlflow.html#lambda-expressions', source: 'docs', note: 'The official introduction, including the pair-sorting example.' },
    { title: 'Functional Programming HOWTO', url: 'https://docs.python.org/3/howto/functional.html', source: 'docs', note: 'A deeper look at passing functions, iterators and `functools`.' },
    { title: 'functools.partial', url: 'https://docs.python.org/3/library/functools.html#functools.partial', source: 'docs', note: 'Pre-filling arguments of an existing function.' },
    { title: 'Sorting Techniques: key functions', url: 'https://docs.python.org/3/howto/sorting.html#key-functions', source: 'docs', note: 'How `key=` works, with tuple keys and `operator` helpers.' },
  ],
};
