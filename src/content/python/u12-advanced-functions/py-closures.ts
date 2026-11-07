import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-closures',
  title: 'Closures and Function Factories',
  summary: 'Functions that remember: nested functions, closures and free variables, `nonlocal` and the LEGB scope rules, the late-binding trap with lambdas in loops, and practical closures for cooldowns, counters and callbacks.',
  minutes: 18,
  objectives: [
    'Define a nested function and explain how a closure remembers variables from its enclosing function',
    'Use `nonlocal` to rebind an enclosing variable and avoid `UnboundLocalError`',
    'Apply the LEGB rule to predict which variable a name refers to',
    'Recognize and fix the late-binding bug with closures created in loops',
    'Write function factories (counters, cooldowns, validators, event buses) and decide when a class is better',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Functions that build functions',
      blocks: [
        {
          type: 'p',
          text: 'Functions are **[[first-class-function|first-class]]** values, so a function can *define another function inside itself* and **return** it. The inner function can use variables of the outer function — and here is the surprise — it keeps using them **after the outer function has returned**. An inner function bundled with the variables it needs is a **[[closure]]**; the borrowed variables are its **[[free-variable|free variables]]**. Each call to the outer function creates a *fresh* closure with its own private copies.',
        },
        {
          type: 'code',
          title: 'closure_basics.py',
          runnable: true,
          code: `def make_multiplier(k):
    def multiply(x):
        return x * k
    return multiply

double = make_multiplier(2)
triple = make_multiplier(3)
print(double(5), triple(5), make_multiplier(10)(7))
print(double.__name__, double.__closure__[0].cell_contents, triple.__closure__[0].cell_contents)
print(double.__code__.co_freevars, double.__code__.co_varnames)

def make_counter():
    count = 0
    def tick():
        nonlocal count
        count += 1
        return count
    return tick

c1, c2 = make_counter(), make_counter()
print(c1(), c1(), c1(), c2())`,
          output: `10 15 70
multiply 2 3
('k',) ('x',)
1 2 3 1`,
          annotations: [
            { lines: '1-4', text: '`make_multiplier` defines `multiply` inside itself and returns it **without calling it**. The returned object is a function that uses `k`, a variable from the outer function.' },
            { lines: '6-7', text: 'Each call runs `make_multiplier` once with a different `k`. By the time it returns, its local variable `k` would normally be gone — but the inner function has captured it.' },
            { lines: 8, text: '`double(5)` is 10 and `triple(5)` is 15: the two functions share their code but each remembers its own `k`. `make_multiplier(10)(7)` calls a factory and the product in one expression.' },
            { lines: 9, text: 'The captured values live in the function’s `__closure__`, a tuple of **cells**. `double` holds a cell with 2, `triple` one with 3.' },
            { lines: 10, text: '`co_freevars` lists the free variables (`k`, borrowed from outside) while `co_varnames` lists the function’s own local names (`x`). The compiler worked this out when it read the code.' },
            { lines: '12-18', text: 'A closure can also hold **changing state**. `count` lives in the enclosing function; `tick` updates it. `nonlocal` is needed to *rebind* it (explained in the next step).' },
            { lines: 20, text: 'Each call to `make_counter` creates a separate `count`.' },
            { lines: 21, text: '`c1` counts 1, 2, 3 while `c2` starts at 1: two independent counters, each with private state and no global variable.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          title: 'A backpack that travels with the function',
          text: 'Imagine the inner function setting off on a journey with a backpack. When it is defined, Python packs the outer variables it will need (`k`). The outer function can disappear — the inner function carries the backpack wherever it goes. Two functions made by two calls each get their own backpack.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why closures matter',
          text: 'They give you *private state without a class* and let you create specialized functions on demand: a damage calculator for each weapon, a cooldown timer per ability, a validator per input field, an event handler remembering which button it belongs to. Closures are also the mechanism behind **decorators** — the next lesson — which wrap a function in another function that remembers the original.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ lambdas capture variables explicitly with `[k]` (by copy) or `[&k]` (by reference), and a by-reference capture can *dangle* once the function returns. Python captures by **reference to a cell** automatically, and the cell is kept alive as long as any closure uses it, so a dangling capture can’t happen. The price: loop closures can all see the variable’s final value (see the late-binding step below).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What makes a nested function a **closure**?',
      options: [
        { text: 'It uses variables from an enclosing function and keeps them alive after that function returns', correct: true, why: 'Exactly — the variables it borrows (its free variables) are stored with the function in cells.' },
        { text: 'It is defined inside another function', why: 'Nesting alone isn’t enough. An inner function that uses *no* outer variables is not a closure.' },
        { text: 'It is defined with `lambda`', why: 'Lambdas are closures only if they refer to outer variables; a plain `lambda x: x + 1` is not. A `def` function can be a closure just as well.' },
        { text: 'It modifies a global variable', why: 'Globals live at module level and need no closure at all; a closure is about *enclosing function* variables.' },
      ],
      explanation: 'A closure is a function plus the variables it captured from its enclosing scope(s). It needs (1) nesting and (2) use of an outer local variable. The captured values survive in cells after the outer function returns.',
    },
    {
      kind: 'concept',
      title: 'Scope, LEGB and nonlocal',
      blocks: [
        {
          type: 'p',
          text: 'When Python meets a name it searches four scopes in order — **L**ocal (this function), **E**nclosing (outer functions), **G**lobal (the module), **B**uilt-in (`len`, `print`…): the **LEGB** rule. *Reading* an outer variable just works. But *assigning* to a name inside a function makes that name **local** to the function — so `total += n` in an inner function tries to read a local `total` that doesn’t exist yet, causing `UnboundLocalError`. The fix is `nonlocal total`, which says "this name refers to the enclosing function’s variable".',
        },
        {
          type: 'code',
          title: 'legb_nonlocal.py',
          runnable: true,
          code: `x = "global"

def outer():
    x = "enclosing"
    def inner():
        return x
    return inner()

print(outer(), x)

def broken():
    total = 0
    def add(n):
        total += n
    try:
        add(5)
    except UnboundLocalError:
        return "UnboundLocalError"

print(broken())

def fixed():
    total = 0
    def add(n):
        nonlocal total
        total += n
        return total
    return add(5), add(3)
print(fixed())`,
          output: `enclosing global
UnboundLocalError
(5, 8)`,
          annotations: [
            { lines: 4, text: 'This `x` belongs to `outer`. It *shadows* the global `x` inside `outer` and everything nested in it.' },
            { lines: '5-6', text: '`inner` has no `x` of its own, so Python looks outward: Local (no) → Enclosing (yes, `outer`’s `x`). It never reaches the global one.' },
            { lines: 9, text: 'Inside `outer` the enclosing variable wins; the module-level `x` is untouched.' },
            { lines: '13-14', text: '`total += n` is an *assignment*, so Python treats `total` as local to `add`. But no local value exists yet to add to.' },
            { lines: '15-18', text: 'Calling `add(5)` raises `UnboundLocalError`; the code catches it and reports the name. The message says the local variable was used before assignment.' },
            { lines: 25, text: '`nonlocal total` tells Python that `total` is the enclosing function’s variable, so assignments rebind *that* one.' },
            { lines: 28, text: 'Both calls update the same `total`: 5 and then 8. (`global name` does the same thing for module-level variables — and is usually a sign that a class or an argument would be cleaner.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Reading is free, rebinding needs a declaration',
          text: 'Mutating a captured object needs no `nonlocal`: `items.append(x)` works because it changes the list in place without rebinding the name `items`. Only *assigning* to the name (`items = []`, `count += 1`, `total = total + n`) requires `nonlocal`. This asymmetry explains most "why doesn’t my closure work?" bugs.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How cells work',
          text: 'The compiler decides at compile time which names are local, free or global. A variable that an inner function uses is stored in a **cell object** instead of directly on the stack; both functions hold a reference to the *same* cell, so a change by one is visible to the other. That is why closures share state (and why the late-binding behavior in the next step happens): they capture the variable, not its current value.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Scope questions',
          text: 'Expect LEGB tracing ("what does this print?") and the `UnboundLocalError` puzzle: a function that reads a global *and* assigns to the same name fails, because the assignment makes the name local for the whole function body.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Calling `make_counter()` twice (as in the lesson) gives two closures that share one `count`, so their counts interfere with each other.',
      answer: false,
      explanation: 'False. Every call to `make_counter()` runs the function body afresh, creating a new `count` variable and a new `tick` closure. The two counters are completely independent: `c1` can be at 3 while `c2` is at 1.',
    },
    {
      kind: 'concept',
      title: 'The late-binding trap in loops',
      blocks: [
        {
          type: 'p',
          text: 'A closure captures the **variable**, not its value at that moment — it looks the value up when the function is *called* (**[[late-binding|late binding]]**). Normally harmless, this bites when you create functions in a loop: they all share the one loop variable, which by the time you call them holds its **last** value. There are three clean fixes: a default argument (evaluated at definition time), `functools.partial`, or a factory function that gives each closure its own variable.',
        },
        {
          type: 'code',
          title: 'late_binding.py',
          runnable: true,
          code: `funcs = []
for i in range(3):
    funcs.append(lambda: i)
print([f() for f in funcs])

fixed = [lambda i=i: i for i in range(3)]
print([f() for f in fixed])

from functools import partial
def show(i):
    return i
bound = [partial(show, i) for i in range(3)]
print([f() for f in bound])

def make_all():
    return [lambda: j for j in range(3)]
print([f() for f in make_all()])`,
          output: `[2, 2, 2]
[0, 1, 2]
[0, 1, 2]
[2, 2, 2]`,
          annotations: [
            { lines: '2-3', text: 'Three lambdas are created, and each refers to the **same** variable `i`, not to a copy of its value.' },
            { lines: 4, text: 'When they are finally called the loop is over and `i` is 2, so every function returns 2 — not 0, 1, 2 as you might expect.' },
            { lines: 6, text: 'Fix 1: the default argument `i=i` is evaluated *when the lambda is created*, freezing each value into a parameter. (A caller could override it, so it’s slightly hacky.)' },
            { lines: '9-13', text: 'Fix 2: `partial(show, i)` stores the *value* of `i` at that moment inside the partial object — clean and explicit.' },
            { lines: '15-17', text: 'The same trap hides in comprehensions: all lambdas capture the single loop variable `j`. Fix 3 is a factory function (as in `make_multiplier`) so every closure gets its own variable.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Where this bites in real programs',
          text: 'Creating buttons, event handlers or per-enemy behaviors in a loop (`for enemy in enemies: button.on_click(lambda: attack(enemy))`) makes every callback act on the *last* enemy. If it looks right with one item and wrong with several, suspect late binding. Bind the current value with a default argument, `partial`, or a helper function.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Closure or class?',
          text: 'A closure with one piece of changing state (a counter, a cooldown) is neat. When you need several operations on the same state (`increment`, `reset`, `value`), inspection, or inheritance, write a class — as the saying goes, "a closure is a poor man’s object, and an object is a poor man’s closure". Choose whichever reads more naturally.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Practical closures: cooldowns, event buses and callbacks',
      blocks: [
        {
          type: 'p',
          text: 'Closures are everywhere in real code: a **cooldown timer** that remembers when an ability last fired, an **event bus** whose private list of listeners can only be reached through `subscribe` and `publish`, and every callback you hand to a framework. The returned functions form a tiny API; the state behind them is truly private.',
        },
        {
          type: 'code',
          title: 'practical_closures.py',
          runnable: true,
          code: `def make_cooldown(seconds):
    last = None
    def ready(now):
        nonlocal last
        if last is None or now - last >= seconds:
            last = now
            return True
        return False
    return ready

fire = make_cooldown(2)
print([fire(t) for t in [0, 1, 2, 3, 5]])

def make_event_bus():
    listeners = []
    def subscribe(fn):
        listeners.append(fn)
    def publish(msg):
        return [fn(msg) for fn in listeners]
    return subscribe, publish

subscribe, publish = make_event_bus()
subscribe(lambda m: m.upper())
subscribe(len)
print(publish("hit"))`,
          output: `[True, False, True, False, True]
['HIT', 3]`,
          annotations: [
            { lines: 2, text: '`last` is the closure’s private memory: the time of the last successful use (`None` before the first).' },
            { lines: '3-8', text: '`ready(now)` allows an action when enough time has passed since `last`. It *rebinds* `last`, so `nonlocal` is required.' },
            { lines: 11, text: 'One call creates one cooldown timer; another `make_cooldown(5)` would give an independent one with a different delay — one factory, many abilities.' },
            { lines: 12, text: 'At time 0 the ability fires; at 1 it is still cooling down; at 2 it is ready again; 3 is blocked (only 1 s later); at 5 it fires again.' },
            { lines: 15, text: '`listeners` is a list private to this bus. Nothing outside can touch it directly.' },
            { lines: '16-19', text: '`subscribe` only *mutates* the list (`append`), so no `nonlocal` is needed. `publish` calls every registered function with the message.' },
            { lines: '23-24', text: 'Listeners can be lambdas or any callable, like the built-in `len`.' },
            { lines: 25, text: 'Each listener received `"hit"`: the first made it upper case, the second measured its length.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'In games and AI',
          text: 'Callbacks and event systems (`on_collision`, `on_episode_end`), per-ability cooldowns, reward-shaping functions built from configuration (`make_reward(weights)`), learning-rate schedules (`make_schedule(start, decay)` returns `lr(step)`) and learning-curve loggers are all natural closures. PyTorch and Gymnasium accept such callables for hooks and wrappers.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Give the returned functions good names',
          text: 'A factory that returns a function should usually be named `make_...` or `create_...`, and the inner functions should have descriptive names (`ready`, `tick`), not `inner` or `wrapper`. Tracebacks and logs show these names, and clear names make closures much easier to debug.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the factory so that each counter remembers and updates its own count.',
      template: `def make_counter():
    n = 0
    def tick():
        ___ n
        n += 1
        return n
    return tick`,
      templateIsCode: true,
      blanks: [{ answers: ['nonlocal'] }],
      wordBank: ['nonlocal', 'global', 'local', 'static'],
      explanation: '`n += 1` rebinds the name, so `tick` must declare it `nonlocal` to refer to the enclosing function’s `n`. `global` would look for a *module-level* `n`; `local` and `static` are not Python keywords.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. When is the loop variable read?',
      code: `def make():
    fs = []
    for k in range(3):
        fs.append(lambda: k * 10)
    return fs

print([f() for f in make()])`,
      answer: '[20, 20, 20]',
      hint: 'By the time any lambda runs, the loop has finished — what does `k` hold then?',
      explanation: 'All three lambdas refer to the same variable `k`. The loop leaves it at 2, so every lambda computes `2 * 10 = 20` when finally called. This is late binding; `lambda k=k: k * 10` would give `[0, 10, 20]`.',
    },
    {
      kind: 'error',
      prompt: 'Calling `make_counter()()` raises `UnboundLocalError: cannot access local variable \'count\' where it is not associated with a value`. Tap a line that has to change.',
      lines: [
        'def make_counter():',
        '    count = 0',
        '    def tick():',
        '        count += 1',
        '        return count',
        '    return tick',
      ],
      linesAreCode: true,
      errorLines: [3, 4],
      explanation: '`count += 1` assigns to `count`, which makes it a *local* variable of `tick` — with no value yet. Add `nonlocal count` as the first line of `tick` (right after line 3) so that it rebinds the enclosing variable instead.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`def make_adder(n):`\n`    def add(x):`\n`        return x + n`\n`    return add`\n`a = make_adder(10)`\n`b = make_adder(20)`\n`print(a(1) + b(1))`',
      answer: '32',
      hint: 'Each adder remembers its own `n`.',
      explanation: '`a` remembers `n = 10`, so `a(1)` is 11; `b` remembers `n = 20`, so `b(1)` is 21. The sum is 32. The two closures share code but each carries its own captured value.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write a factory `make_accumulator(start=0)` that returns a function `add(n)`. Each call to `add` adds `n` to a running total (initially `start`) and returns the new total. Separate accumulators must not interfere.',
      starter: `def make_accumulator(start=0):
    ...
`,
      solution: `def make_accumulator(start=0):
    total = start

    def add(n):
        nonlocal total
        total += n
        return total

    return add
`,
      tests: `acc = make_accumulator()
assert acc(5) == 5
assert acc(10) == 15
assert acc(-3) == 12
other = make_accumulator(100)
assert other(1) == 101
assert acc(0) == 12
assert make_accumulator(5)(5) == 10
a, b = make_accumulator(), make_accumulator()
a(1); a(1)
assert b(1) == 1 and a(0) == 2
assert callable(acc)
assert make_accumulator(1.5)(1) == 2.5`,
      checks: ['Returns a function (the closure), not a number', 'Uses `nonlocal` so the total persists between calls', 'Two accumulators keep separate totals'],
      hint: 'Store `total = start` in the outer function. In the inner `add`, write `nonlocal total`, then `total += n` and `return total`. The outer function returns `add` (without calling it).',
      explanation: 'The closure keeps `total` alive between calls with no global variable and no class. `nonlocal` is required because `total += n` rebinds the name. Each call to `make_accumulator` creates a fresh `total`, so the accumulators are independent.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_limiter(limit)` that returns **two** functions `(allow, reset)`. `allow()` returns `True` for the first `limit` calls and `False` afterwards; `reset()` starts the count over. This is a rate limiter for abilities or API calls. Limiters from separate `make_limiter` calls must be independent.',
      starter: `def make_limiter(limit):
    ...
`,
      solution: `def make_limiter(limit):
    used = 0

    def allow():
        nonlocal used
        if used < limit:
            used += 1
            return True
        return False

    def reset():
        nonlocal used
        used = 0

    return allow, reset
`,
      tests: `allow, reset = make_limiter(2)
assert [allow() for _ in range(4)] == [True, True, False, False]
reset()
assert allow() is True
assert allow() is True
assert allow() is False
a1, r1 = make_limiter(1)
a2, r2 = make_limiter(1)
assert a1() is True and a1() is False
assert a2() is True
r1()
assert a1() is True and a2() is False
zero, _ = make_limiter(0)
assert zero() is False
assert isinstance(make_limiter(3), tuple) and len(make_limiter(3)) == 2`,
      checks: ['Returns a tuple of two functions sharing the same private counter', 'Both inner functions rebind the counter with `nonlocal`', 'Separate limiters do not share state'],
      hint: 'Keep `used = 0` in the outer function. `allow` and `reset` both declare `nonlocal used`; `allow` increments only while `used < limit`. Return them as `return allow, reset`.',
      explanation: 'Two closures created in the same call share the *same* cell, so `reset` sees what `allow` changed — while closures from a different `make_limiter` call have their own cell. That sharing between sibling functions is what makes closures a lightweight object: a hidden counter plus two methods.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_multipliers(n)` that returns a **list of `n` functions**; the function at index `i` multiplies its argument by `i` (so the list contains "times 0", "times 1", …). Avoid the late-binding trap: `[f(10) for f in make_multipliers(4)]` must be `[0, 10, 20, 30]`.',
      starter: `def make_multipliers(n):
    ...
`,
      solution: `def make_multipliers(n):
    def make(i):
        return lambda x: x * i

    return [make(i) for i in range(n)]
`,
      tests: `fs = make_multipliers(4)
assert [f(10) for f in fs] == [0, 10, 20, 30]
assert len(fs) == 4
assert make_multipliers(0) == []
assert [f(3) for f in make_multipliers(3)] == [0, 3, 6]
one = make_multipliers(2)
assert one[1](7) == 7 and one[0](7) == 0
assert [f(1.5) for f in make_multipliers(3)] == [0.0, 1.5, 3.0]
assert all(callable(f) for f in fs)
assert fs[3](2) == 6 and fs[2](2) == 4`,
      checks: ['Returns a list with one function per index', 'Each function uses its *own* `i` (no late-binding bug)', 'An empty list for `n = 0`'],
      hint: 'Use a helper factory `make(i)` that returns `lambda x: x * i`, then `return [make(i) for i in range(n)]`. (A default argument `lambda x, i=i: x * i` also works.)',
      explanation: 'Each call to the helper `make(i)` creates a new scope with its own `i`, so every lambda captures a separate variable. Writing `lambda x: x * i` directly in the loop would make all functions see the final `i` — the classic late-binding bug.',
    },
  ],
  takeaways: [
    'A closure is an inner function plus the variables it captured from enclosing functions (its free variables). They survive after the outer function returns, stored in cells; each call to the outer function makes a fresh set.',
    'Name lookup follows LEGB: Local, Enclosing, Global, Built-in. Assigning to a name inside a function makes it local — use `nonlocal` (or `global`) to rebind an outer variable. Mutating an object needs no declaration.',
    'Closures capture variables, not values (late binding). Lambdas created in a loop all see the final loop value; fix with a default argument, `functools.partial` or a factory function.',
    'Function factories give private state and specialized behavior without classes: counters, cooldowns, validators, schedules and callbacks. Use a class when you need several operations, inspection or inheritance.',
    'Closures are the mechanism behind decorators, which is the next lesson.',
  ],
  reading: [
    { title: 'Python Scopes and Namespaces', url: 'https://docs.python.org/3/tutorial/classes.html#python-scopes-and-namespaces', source: 'tutorial', note: 'The official explanation of scopes, `global` and `nonlocal`, with a clear example.' },
    { title: 'Naming and binding (Python Language Reference)', url: 'https://docs.python.org/3/reference/executionmodel.html#naming-and-binding', source: 'docs', note: 'The precise rules of name resolution that closures rely on.' },
    { title: 'Python Inner Functions: What Are They Good For?', url: 'https://realpython.com/inner-functions-what-are-they-good-for/', source: 'article', note: 'Real Python’s practical guide to nested functions and closures.' },
  ],
};
