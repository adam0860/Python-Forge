import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-functions',
  title: 'Defining Functions and Returning Values',
  summary: 'Package code into named, reusable pieces: `def`, parameters, `return` versus `print`, multiple return values, side effects, and how to read the call stack when something goes wrong.',
  minutes: 19,
  objectives: [
    'Define a function with `def`, call it, and explain the difference between a parameter and an argument',
    'Use `return` to hand a value back, and explain why a function without `return` gives `None`',
    'Return several values as a tuple and unpack them, and leave a function early with `return`',
    'Tell a function that *computes* from one that *changes* its inputs (side effects), and test small functions with `assert`',
    'Read a traceback through several nested calls',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Name a piece of code, then reuse it',
      blocks: [
        {
          type: 'p',
          text: 'A [[function]] is a named block of code that you can run whenever you need it. You have used functions all along — `print`, `len`, `range`. Now you write your own. Functions let you give a *name* to an idea, avoid copy-pasting, and fix a bug in one place instead of ten.',
        },
        {
          type: 'code',
          title: 'greet.py',
          runnable: true,
          code: `def greet(name):
    return "Hello, " + name + "!"

message = greet("Ada")
print(message)
print(greet("Ben"))`,
          output: `Hello, Ada!
Hello, Ben!`,
          annotations: [
            { lines: 1, text: '`def` starts a function definition. `greet` is its name; `name` is a **parameter** — a variable that will hold whatever the caller passes in. The colon opens the body.' },
            { lines: 2, text: 'The body is indented. `return` ends the function and hands a value back to whoever called it.' },
            { lines: 4, text: 'The **call**. `"Ada"` is the **argument**: the actual value that becomes `name` for this run. The returned string is stored in `message`.' },
            { lines: 6, text: 'The same code runs again with a different argument. Defining a function does not run it — only calling does.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Parameter or argument?',
          text: 'A **parameter** is the name in the definition (`name`). An **argument** is the value in the call (`"Ada"`). People mix them up constantly, and nobody minds — but the distinction helps when reading error messages and documentation.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'No types, no prototypes',
          text: 'There is no return type or parameter type to declare, and no header file: a function exists from the moment its `def` statement has run, so it must be defined *before the line that calls it executes* (not necessarily before the line that mentions it). In Python, functions are also ordinary objects — you can store them in variables and pass them around (next lessons).',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> def greet(name):
...     return "Hello, " + name
...
>>> greet()
Traceback (most recent call last):
  File "<python-input-1>", line 1, in <module>
    greet()
    ~~~~~^^
TypeError: greet() missing 1 required positional argument: 'name'`,
          annotations: [
            { lines: 9, text: 'Forgetting an argument is a `TypeError` that names the function and the missing parameter. Passing *too many* gives "takes 1 positional argument but 2 were given".' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In `def heal(hp, amount):` and the call `heal(40, 15)`, which statement is correct?',
      options: [
        { text: '`hp` and `amount` are arguments; `40` and `15` are parameters', why: 'It is the other way around.' },
        { text: '`hp` and `amount` are parameters; `40` and `15` are arguments', correct: true, why: 'Right: parameters are the names in the definition, arguments are the values supplied in the call.' },
        { text: 'Both pairs are called parameters', why: 'The two are distinct ideas, and Python’s error messages use both words.' },
        { text: 'Nothing is passed until the function returns', why: 'Arguments are passed at the moment of the call, before the body runs.' },
      ],
      explanation: 'Inside the call `heal(40, 15)`, Python binds the parameter `hp` to 40 and `amount` to 15 *by position*, runs the body, and evaluates to whatever it returns.',
    },
    {
      kind: 'concept',
      title: 'return is not print',
      blocks: [
        {
          type: 'p',
          text: 'This is the single most common beginner confusion. `print` *shows* something on the screen and is gone. `return` *gives a value back to the caller*, who can store it, add to it, or pass it to another function. A function that never reaches a `return` statement hands back `None`.',
        },
        {
          type: 'code',
          title: 'return_vs_print.py',
          runnable: true,
          code: `def double_print(n):
    print(n * 2)

def double_return(n):
    return n * 2

a = double_print(4)
b = double_return(4)
print(a, b)
print(double_return(double_return(3)))`,
          output: `8
None 8
12`,
          annotations: [
            { lines: 2, text: 'Prints 8 to the screen, but the function’s *result* is `None`.' },
            { lines: 5, text: 'Returns 8 to the caller without printing anything.' },
            { lines: 7, text: 'The `8` on the first output line comes from the `print` *inside* `double_print`.' },
            { lines: 9, text: '`a` is `None` (nothing was returned) while `b` is 8.' },
            { lines: 10, text: 'Returned values can feed straight into another call: `double_return(3)` is 6, and doubling that gives 12. You can’t do that with `print`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Rule of thumb',
          text: 'Functions that *compute* something should `return` it. Only the outermost layer of your program — the part that talks to the user — should `print`. Returning keeps functions reusable: the same `damage_after_armor` can feed a health bar, a combat log and a unit test.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Code after return never runs',
          text: '`return` ends the function immediately. Any statements after it in the same block are unreachable. Editors usually grey them out.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `def square(n):
    return n * n
    print("done")

print(square(3) + square(2))`,
      answer: '13',
      hint: 'What happens to the `print("done")` line?',
      explanation: '`return n * n` ends the function, so `print("done")` is never reached and nothing extra is printed. `square(3)` is 9 and `square(2)` is 4; the sum 13 is printed by the last line.',
    },
    {
      kind: 'truefalse',
      prompt: 'A function that has no `return` statement returns `0` by default.',
      answer: false,
      explanation: 'False. It returns `None`, Python’s "no value" object. That is why `x = print("hi")` leaves `x` as `None`, and why `total = add_tax(100) + 5` crashes if `add_tax` only prints.',
    },
    {
      kind: 'concept',
      title: 'Many values out, and leaving early',
      blocks: [
        {
          type: 'p',
          text: 'A function returns exactly one object — but that object can be a **tuple**, and last lesson showed how easily tuples unpack. So "returning several values" is just returning a tuple. And since `return` ends the function on the spot, you can use it to **exit early** and avoid deep nesting.',
        },
        {
          type: 'code',
          title: 'multi_return.py',
          runnable: true,
          code: `def divide(a, b):
    if b == 0:
        return None, "cannot divide by zero"
    return a / b, "ok"

result, status = divide(10, 4)
print(result, status)
print(divide(1, 0))

def min_max(values):
    return min(values), max(values)

low, high = min_max([4, 9, 2, 7])
print(low, high)`,
          output: `2.5 ok
(None, 'cannot divide by zero')
2 9`,
          annotations: [
            { lines: 2, text: 'A **guard clause**: handle the unusual case first and return right away. The rest of the function can then assume `b` is not zero.' },
            { lines: 3, text: '`return None, "…"` builds a tuple of two items.' },
            { lines: 6, text: 'Tuple unpacking at the call site splits the pair into `result` and `status`.' },
            { lines: 8, text: 'Printing the call shows the raw tuple.' },
            { lines: 13, text: 'Python’s own `divmod`, `zip` and `enumerate` all work with tuples in just this way.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Guard clauses beat deep nesting',
          text: 'Instead of wrapping the main logic inside `if b != 0:`, check the bad cases first and `return`. The "happy path" then reads straight down the left margin. You will see this style in almost every well-written Python codebase.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the definition so that `area(3, 4)` returns `12`.',
      template: `___ area(w, h):
    ___ w * h

print(area(3, 4))`,
      templateIsCode: true,
      blanks: [{ answers: ['def'] }, { answers: ['return'] }],
      wordBank: ['def', 'return', 'print', 'function', 'lambda'],
      explanation: '`def` introduces a function definition. `return w * h` sends the product back to the caller so that `print(area(3, 4))` shows 12. With `print` in the body instead, the function would print 12 itself and return `None`.',
    },
    {
      kind: 'order',
      prompt: 'Arrange the lines into a program that defines `apply_damage` and then uses it to print the remaining hp (which should be 0, never negative).',
      lines: ['def apply_damage(hp, damage):', '    return max(0, hp - damage)', 'hp = apply_damage(50, 70)', 'print(hp)'],
      linesAreCode: true,
      explanation: 'The definition must run before the call, so `def` and its indented body come first. Then the call stores the result in `hp`, and the last line prints it. `max(0, hp - damage)` clamps the result at zero: `max(0, -20)` is 0.',
    },
    {
      kind: 'concept',
      title: 'Side effects, pure functions and testing',
      blocks: [
        {
          type: 'p',
          text: 'A function can affect the world in two ways: it can **return** a result, and it can have **side effects** — printing, writing files, or changing an object that was passed in. Recall from the Lists lesson that a list parameter is the *same list* as the caller’s, so mutating it changes the original.',
        },
        {
          type: 'code',
          title: 'effects.py',
          runnable: true,
          code: `def clamp(value, low, high):
    return max(low, min(value, high))

def apply_damage(hp, damage):
    return max(0, hp - damage)

def is_alive(hp):
    return hp > 0

hp = 50
for hit in [20, 25, 30]:
    hp = apply_damage(hp, hit)
    print(f"hit {hit}: hp={hp}, alive={is_alive(hp)}")
print(clamp(150, 0, 100), clamp(-5, 0, 100), clamp(42, 0, 100))

def add_item(items, item):
    items.append(item)

def with_item(items, item):
    return items + [item]

bag = ["torch"]
add_item(bag, "map")
print(bag)
new_bag = with_item(bag, "key")
print(bag, new_bag)`,
          output: `hit 20: hp=30, alive=True
hit 25: hp=5, alive=True
hit 30: hp=0, alive=False
100 0 42
['torch', 'map']
['torch', 'map'] ['torch', 'map', 'key']`,
          annotations: [
            { lines: '1-8', text: 'Three small **pure** functions: the result depends only on the arguments, and nothing outside changes. They are trivial to test and to reuse.' },
            { lines: 12, text: 'The caller keeps the new hp by assigning the returned value back. Forgetting this assignment is a classic bug.' },
            { lines: '16-17', text: '`add_item` has a **side effect**: it changes the caller’s list and returns `None`.' },
            { lines: '19-20', text: '`with_item` builds and returns a new list, leaving the original untouched.' },
          ],
        },
        {
          type: 'p',
          text: 'Small pure functions are easy to check. A one-line `assert` states what must be true and raises `AssertionError` if it isn’t — the seed of automated testing (Unit 15):',
        },
        {
          type: 'code',
          title: 'asserts.py',
          runnable: true,
          code: `def is_even(n):
    return n % 2 == 0

assert is_even(4)
assert not is_even(7)
assert is_even(0), "zero should count as even"
print("all tests passed")`,
          output: 'all tests passed',
          annotations: [
            { lines: 4, text: '`assert condition` does nothing when the condition is true and raises `AssertionError` when it is false.' },
            { lines: 6, text: 'An optional message after the comma is shown if the assertion fails.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Game logic organized into small functions — `apply_damage`, `is_alive`, `clamp`, `distance` — is easy to unit-test and to tune. Designers can rebalance one function without touching rendering or input code.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code crashes on the last line with `TypeError: unsupported operand type(s) for +: \'NoneType\' and \'int\'`. Tap the line that **causes** the problem.',
      lines: ['def add_tax(price):', '    print(price * 1.2)', '', 'total = add_tax(100) + 5'],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Line 2 prints the result instead of returning it, so `add_tax(100)` evaluates to `None` and line 4 tries `None + 5`. Change it to `return price * 1.2`. Whenever you see `NoneType` in an error, look for a function that forgot to `return` (or an in-place method whose `None` result was stored).',
    },
    {
      kind: 'concept',
      title: 'The call stack and reading tracebacks',
      blocks: [
        {
          type: 'p',
          text: 'When a function calls another, Python keeps a **call stack**: a pile of *frames*, each holding one call’s parameters and local variables. A new call puts a frame on top; `return` removes it. When an error escapes, the traceback prints the stack from the outermost call down to the one that failed.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `Traceback (most recent call last):
  File "game.py", line 7, in <module>
    load_level(0)
    ~~~~~~~~~~^^^
  File "game.py", line 2, in load_level
    return spawn_enemies(n)
  File "game.py", line 5, in spawn_enemies
    return 10 // count
           ~~~^^~~~~~~
ZeroDivisionError: division by zero`,
          annotations: [
            { lines: 2, text: 'The outermost frame: module-level code called `load_level(0)` on line 7.' },
            { lines: 5, text: '`load_level` in turn called `spawn_enemies(n)`.' },
            { lines: 7, text: 'The innermost frame — where the error actually happened. The carets point at the `//` operator and its operands.' },
            { lines: 10, text: 'The error type and message come last. **Read tracebacks from the bottom up**: what went wrong, then where, then how we got there.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'A stack has a limit',
          text: 'Each frame uses memory, so CPython caps the depth (about 1,000 frames by default). A function that keeps calling itself without stopping — runaway *recursion*, two lessons from now — ends in `RecursionError: maximum recursion depth exceeded`. Stack depth is also why very deep recursion in game AI or tree traversal needs care.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Design checklist for a new function',
          text: 'Give it a **verb** name that says what it does (`apply_damage`, `load_level`, `is_alive`). Make it do **one thing**. Prefer returning a value to printing it. If you can’t name it without "and", split it in two.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\ndef f(x):\n    if x > 5:\n        return x * 2\n    return x + 1\n\nprint(f(3) + f(7))\n```',
      answer: '18',
      hint: 'Evaluate `f(3)` and `f(7)` separately; each takes a different path through the function.',
      explanation: '`f(3)`: 3 is not above 5, so it skips the `if` and returns $3 + 1 = 4$. `f(7)`: 7 is above 5, so it returns $7 \\times 2 = 14$. The sum is $4 + 14 = 18$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a function `clamp(value, low, high)` that returns `low` if `value` is below `low`, `high` if it is above `high`, and `value` otherwise.',
      starter: `# define clamp here
`,
      solution: `def clamp(value, low, high):
    if value < low:
        return low
    if value > high:
        return high
    return value
`,
      tests: `assert clamp(5, 0, 10) == 5
assert clamp(-3, 0, 10) == 0
assert clamp(99, 0, 10) == 10
assert clamp(0, 0, 10) == 0 and clamp(10, 0, 10) == 10
assert clamp(2.5, 0, 1) == 1`,
      checks: ['Returns the value when it is inside the range', 'Returns `low` or `high` when outside', 'Uses `return`, not `print`'],
      hint: 'Two guard clauses — `if value < low: return low`, `if value > high: return high` — then `return value`. (`max(low, min(value, high))` also works.)',
      explanation: 'The guard clauses handle the two out-of-range cases and return early; anything left is already inside the range and is returned unchanged. Clamping keeps health, volume or coordinates inside legal limits throughout game code.',
    },
    {
      kind: 'code',
      prompt: 'Write `average(numbers)` that returns the mean of a list of numbers. For an **empty** list it should return `0` instead of crashing.',
      starter: `# define average here
`,
      solution: `def average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)
`,
      tests: `assert average([2, 4, 6]) == 4
assert average([1, 2]) == 1.5
assert average([]) == 0
assert average([10]) == 10`,
      checks: ['Handles an empty list without error', 'Returns the mean as a number'],
      hint: 'An empty list is falsy, so `if not numbers:` is a handy guard. Otherwise divide `sum(...)` by `len(...)`.',
      explanation: 'Dividing by `len([])` would raise `ZeroDivisionError`, so a guard clause returns 0 for an empty list first. Otherwise the mean is the sum divided by the count.',
    },
    {
      kind: 'code',
      prompt: 'Write `describe_hp(hp)` that returns `"dead"` when `hp <= 0`, `"critical"` when `hp < 25`, `"hurt"` when `hp < 75`, and `"healthy"` otherwise. It must **return** the word, not print it.',
      starter: `# define describe_hp here
`,
      solution: `def describe_hp(hp):
    if hp <= 0:
        return "dead"
    if hp < 25:
        return "critical"
    if hp < 75:
        return "hurt"
    return "healthy"
`,
      tests: `assert describe_hp(0) == "dead"
assert describe_hp(-5) == "dead"
assert describe_hp(10) == "critical"
assert describe_hp(24) == "critical"
assert describe_hp(25) == "hurt"
assert describe_hp(74) == "hurt"
assert describe_hp(75) == "healthy"
assert describe_hp(100) == "healthy"`,
      checks: ['Returns the words exactly', 'Boundary values 0, 25 and 75 are classified correctly'],
      hint: 'Check from the lowest threshold upward, returning in each branch; `return "healthy"` goes last with no condition.',
      explanation: 'Because each branch returns immediately, no `elif` is needed — reaching the second `if` already means `hp > 0`. Testing the boundary values (0, 24/25, 74/75) is how you catch off-by-one mistakes in thresholds.',
    },
  ],
  takeaways: [
    '`def name(parameters):` defines a function; a call passes arguments that bind to the parameters by position. Defining does not run the body.',
    '`return` hands a value back and ends the function at once; with no `return`, the result is `None`. Prefer returning over printing.',
    'Return several values as a tuple and unpack them; use guard clauses to exit early.',
    'Pure functions only compute; side effects (printing, mutating arguments) should be deliberate. Keep functions small, named with verbs, and test them with `assert`.',
    'Calls stack up in frames; a traceback lists them from the outermost call to the failing one — read it from the bottom up.',
  ],
  reading: [
    { title: 'Defining Functions (Python Tutorial)', url: 'https://docs.python.org/3/tutorial/controlflow.html#defining-functions', source: 'docs', note: 'The official introduction to `def`, `return` and the implicit `None`.' },
    { title: 'Function definitions (Language Reference)', url: 'https://docs.python.org/3/reference/compound_stmts.html#function-definitions', source: 'docs', note: 'The precise rules for what a `def` statement does.' },
    { title: 'Real Python: Defining Your Own Python Function', url: 'https://realpython.com/defining-your-own-python-function/', source: 'article', note: 'A longer walk-through with many examples.' },
  ],
};
