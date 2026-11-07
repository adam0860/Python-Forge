import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-generators',
  title: 'Generators and yield',
  summary: 'Functions that pause and resume: `yield`, lazy pipelines, endless sequences, `yield from`, return values, generator expressions versus list comprehensions, and the `send`/`close` machinery behind coroutines.',
  minutes: 20,
  objectives: [
    'Write generator functions with `yield` and trace exactly when their code runs',
    'Build lazy pipelines of generators, including endless sequences, with constant memory',
    'Delegate with `yield from` and understand how a generator’s `return` value is delivered',
    'Choose between a list comprehension and a generator expression',
    'Explain what `send()`, `close()` and `finally` do inside a generator',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'yield: a function that pauses',
      blocks: [
        {
          type: 'p',
          text: 'Writing iterator classes by hand (previous lesson) takes a lot of ceremony: state in attributes, `__next__`, `StopIteration`. A **[[generator]]** gives you the same thing from an ordinary function. If a function body contains the keyword `yield`, calling it does **not** run the body: it returns a generator object (an iterator). Each `next()` runs the body *until the next `yield`*, hands that value out, and **freezes** the function — local variables and the position in the code are kept — until the next `next()` call. When the body ends, `StopIteration` is raised automatically.',
        },
        {
          type: 'code',
          title: 'countdown_generator.py',
          runnable: true,
          code: `def countdown(n):
    print("start")
    while n > 0:
        yield n
        n -= 1
    print("end")

g = countdown(3)
print(type(g).__name__)
print("created")
print(next(g))
print(next(g))
print(list(g))
print(list(g))`,
          output: `generator
created
start
3
2
end
[1]
[]`,
          annotations: [
            { lines: 4, text: '`yield n` hands a value to the caller and **suspends** the function right here. The local variables `n` and the position in the loop are remembered.' },
            { lines: 8, text: 'Calling `countdown(3)` runs *no* code of the body. It only creates a generator object that is ready to start.' },
            { lines: 9, text: 'The type is `generator` — a built-in kind of iterator, with `__iter__` and `__next__` written for you.' },
            { lines: 10, text: '"created" is printed **before** "start": proof that the body had not started yet.' },
            { lines: 11, text: 'The first `next(g)` starts the body: it prints "start", runs to the first `yield`, and returns 3.' },
            { lines: 12, text: 'The second `next(g)` resumes right after the `yield`, decrements `n` to 2, loops and yields 2. No "start" this time.' },
            { lines: 13, text: '`list(g)` keeps asking: it gets 1, then the loop finishes, "end" is printed, the body returns, and `StopIteration` stops the list. Result: `[1]`.' },
            { lines: 14, text: 'A generator is a one-shot iterator: once finished, it stays finished.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why generators?',
          text: 'They let you write *"produce a sequence of values"* as a plain loop, without building the whole sequence in memory. A generator holds one value at a time; a list holds all of them. That makes it possible to process a 50 GB file line by line, represent an endless stream (game ticks, random events, training batches), or stop early without wasted work.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'Generators are what C++20 calls *coroutines* (`co_yield`) and what C# calls `yield return`. A Python generator keeps its own stack frame alive between calls, so the function’s locals survive — something an ordinary function (whose frame is destroyed on return) can never do. In older C++ you would have written a class with explicit state, exactly like the `FibIter` class in the previous lesson.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What a generator object actually holds',
          text: 'A generator object owns a *suspended frame*: the function’s local variables plus a pointer to the bytecode instruction after the last `yield`. `next()` simply resumes that frame until it hits another `yield` or returns. Nothing runs in the background and there are no threads — it is ordinary, single-threaded, cooperative switching, which is also the foundation of `async`/`await` in the concurrency unit.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What happens when you call a generator function such as `countdown(3)`?',
      options: [
        { text: 'It returns a generator object immediately, without running any of the function’s body', correct: true, why: 'Right: the body starts only on the first `next()` (or when a `for` loop asks for a value).' },
        { text: 'It runs the body until the first `yield` and returns that value', why: 'That happens on `next(g)`, not on the call itself. The call just creates the generator object.' },
        { text: 'It runs the entire body and returns a list of all the yielded values', why: 'Generators are lazy: values are produced one at a time, only on demand.' },
        { text: 'It runs the body in a background thread', why: 'There are no threads involved. A generator is resumed by the caller’s own `next()` calls.' },
      ],
      explanation: 'A function containing `yield` is a generator function: calling it creates a generator object and runs nothing. The body runs piece by piece as the generator is asked for values.',
    },
    {
      kind: 'concept',
      title: 'Lazy pipelines, endless streams and yield from',
      blocks: [
        {
          type: 'p',
          text: 'Generators compose beautifully. Each stage consumes the previous one *item by item*, so no stage ever builds the full sequence, and the stream can even be **infinite**: values are only computed for as long as the final consumer keeps asking. `yield from other` delegates to another iterable, handing out each of its values in turn. A generator can also `return` a value; it is delivered to the caller as the `.value` of the final `StopIteration`.',
        },
        {
          type: 'code',
          title: 'pipeline.py',
          runnable: true,
          code: `def naturals():
    n = 0
    while True:
        yield n
        n += 1

def evens(source):
    for n in source:
        if n % 2 == 0:
            yield n

def squared(source):
    for n in source:
        yield n * n

def take(source, k):
    for i, x in enumerate(source):
        if i >= k:
            return
        yield x

pipeline = take(squared(evens(naturals())), 5)
print(list(pipeline))`,
          output: `[0, 4, 16, 36, 64]`,
          annotations: [
            { lines: '1-5', text: 'An **endless** generator: `while True` never finishes, yet it is perfectly safe because each value is only produced when somebody asks.' },
            { lines: '7-10', text: 'A filtering stage: reads values from `source` and yields only the even ones.' },
            { lines: '12-14', text: 'A transforming stage: yields the square of each value it receives.' },
            { lines: '16-20', text: '`take` stops the stream: after `k` values it `return`s, which ends the generator. Without it, `list(...)` would never finish.' },
            { lines: 22, text: 'The stages are chained like Unix pipes. Nothing runs yet: four generator objects are created, each waiting for the next.' },
            { lines: 23, text: '`list` pulls on `take`, which pulls on `squared`, which pulls on `evens`, which pulls on `naturals` — one value at a time all the way through. Memory use stays constant however long the pipeline is.' },
          ],
        },
        {
          type: 'code',
          title: 'yield_from.py',
          runnable: true,
          code: `def chain(*its):
    for it in its:
        yield from it

print(list(chain("ab", [1, 2], range(2))))

def counted():
    yield 1
    yield 2
    return "finished"

g = counted()
print(next(g), next(g))
try:
    next(g)
except StopIteration as e:
    print(e.value)`,
          output: `['a', 'b', 1, 2, 0, 1]
1 2
finished`,
          annotations: [
            { lines: 3, text: '`yield from it` is shorthand for `for x in it: yield x`, but also forwards `send`/`throw`/`close` and captures the sub-generator’s return value.' },
            { lines: 5, text: '`chain` stitches several iterables of different types into one stream: a string, a list and a `range`.' },
            { lines: 10, text: '`return value` inside a generator ends it and stores the value on the `StopIteration` exception. (It is not part of the stream.)' },
            { lines: 13, text: 'Two `next` calls give the yielded values 1 and 2.' },
            { lines: '14-17', text: 'The third `next` finds the end and raises `StopIteration("finished")`. A `for` loop swallows it silently; catching it manually reveals the return value. `yield from` uses it as the value of the expression.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Write small stages, then plug them together',
          text: 'Each stage does one thing (filter, transform, batch, limit). Combined, they read like a description of the data flow, and each stage can be tested alone with a plain list as input. This is how professional data pipelines are built — and how training-data loaders for machine learning stream samples from disk.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Endless generators need a stopper',
          text: '`list(naturals())` never returns: it tries to collect infinitely many values and eats all memory. Always limit endless streams (`take`, `itertools.islice`, `break` in a loop, `zip` with a finite source). Don’t forget that `sum`, `max`, `sorted` and `list` all consume an *entire* iterator.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Because `squares = (n * n for n in range(5))` is a generator, you can loop over `squares` twice and get the same values both times.',
      answer: false,
      explanation: 'False. A generator (including a generator expression) is a one-shot iterator. After the first loop it is exhausted; a second loop yields nothing. Create a new generator (or build a list) if you need another pass.',
    },
    {
      kind: 'concept',
      title: 'Generator expressions versus list comprehensions',
      blocks: [
        {
          type: 'p',
          text: 'A list comprehension `[expr for x in data]` builds the full list right away. Swap the brackets for parentheses — `(expr for x in data)` — and you get a **[[generator-expression|generator expression]]**: the same syntax, but lazy. When the result feeds a function that consumes values once (`sum`, `max`, `any`, `all`, `"".join`, `sorted`, `set`, `dict`), the parentheses of the call can serve as the generator’s own parentheses: `sum(n * n for n in nums)`.',
        },
        {
          type: 'code',
          title: 'genexp.py',
          runnable: true,
          code: `import sys
nums = range(100_000)
as_list = [n * n for n in nums]
as_gen = (n * n for n in nums)
print(sys.getsizeof(as_list) > 100_000, sys.getsizeof(as_gen) < 1000)
print(sum(as_gen), sum(as_gen))
print(max(n * n for n in range(5)), any(n > 3 for n in range(5)))
words = ["apple", "kiwi", "banana"]
print(sum(len(w) for w in words), ", ".join(w.upper() for w in words if len(w) > 4))`,
          output: `True True
333328333350000 0
16 True
15 APPLE, BANANA`,
          annotations: [
            { lines: 3, text: 'The list comprehension computes and stores 100,000 squares immediately.' },
            { lines: 4, text: 'The generator expression computes **nothing** yet; it holds the loop’s state only.' },
            { lines: 5, text: 'The list needs hundreds of kilobytes (just for the pointers); the generator object is a few hundred bytes — and stays that size however large the range.' },
            { lines: 6, text: '`sum(as_gen)` walks the stream once and adds the values. The second `sum` finds the generator empty, so it returns 0 — the one-shot rule again.' },
            { lines: 7, text: 'No extra brackets needed when the generator expression is the only argument: `max(n * n for n in range(5))`. `any` even stops at the first `True` and never computes the rest.' },
            { lines: 9, text: 'Also with filters and string methods: the generator feeds `join` directly with no intermediate list.' },
          ],
        },
        {
          type: 'table',
          headers: ['Use a list comprehension when…', 'Use a generator expression when…'],
          rows: [
            ['You need the results more than once', 'You consume the results exactly once'],
            ['You need `len()`, indexing or slicing', 'The data is large or endless'],
            ['The sequence is small', 'You can stop early (`any`, `next`, `break`)'],
            ['You will print or debug the values', 'You pass the result straight to `sum`, `max`, `join`…'],
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Speed vs. memory',
          text: 'For small data a list comprehension is often slightly *faster* (no pause/resume overhead). Generators win on memory and on early exit. Don’t convert everything into generators — choose by what you do with the result.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Streaming files and logs',
          text: 'File objects are lazy iterators over lines, so `sum(1 for line in open(path) if "ERROR" in line)` counts errors in a multi-gigabyte log while holding a single line in memory. Reading everything with `.readlines()` first would exhaust RAM. The same idea feeds big training datasets into a model batch by batch.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'send(), close() and finally: generators as coroutines',
      blocks: [
        {
          type: 'p',
          text: '`yield` is actually an *expression*: `value = yield result` hands `result` out **and** receives a value back when the caller uses `gen.send(x)`. That turns a generator into a two-way channel (a **coroutine**). `gen.close()` stops a generator by raising `GeneratorExit` at the `yield`, so `try`/`finally` blocks can clean up. You rarely write `send`-style coroutines in new code (`async`/`await` replaced most of that), but understanding it explains how `async` works, and `finally` inside generators matters for resource cleanup.',
        },
        {
          type: 'code',
          title: 'send_and_close.py',
          runnable: true,
          code: `def averager():
    total = 0
    count = 0
    average = None
    while True:
        value = yield average
        total += value
        count += 1
        average = total / count

avg = averager()
next(avg)
print(avg.send(10), avg.send(20), avg.send(60))
avg.close()
try:
    avg.send(1)
except StopIteration:
    print("closed")

def worker():
    try:
        while True:
            yield "working"
    finally:
        print("cleanup")

w = worker()
print(next(w))
w.close()
print("after")`,
          output: `10.0 15.0 30.0
closed
working
cleanup
after`,
          annotations: [
            { lines: 6, text: '`value = yield average` does two things: it sends the current average out, then pauses until someone calls `send(...)`; the sent number becomes `value`.' },
            { lines: 12, text: 'A new generator must first be started with `next(avg)` ("priming") so it runs to its first `yield`.' },
            { lines: 13, text: '`avg.send(10)` resumes the generator with `value = 10` and returns the next yielded average. A running mean computed with a few lines of state: 10, 15, 30.' },
            { lines: '14-18', text: '`close()` ends the generator; any later `send` raises `StopIteration` because it is finished.' },
            { lines: '20-25', text: 'A generator holding a resource (a file, a lock, a connection) can release it in `finally`.' },
            { lines: '27-30', text: '`w.close()` raises `GeneratorExit` at the paused `yield`; the `finally` block runs ("cleanup") before "after". Garbage collection does the same if a generator is abandoned, but explicit `close()` is predictable.' },
          ],
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'From generators to async/await',
          text: 'PEP 255 (Python 2.2, 2001) added `yield` for simple iteration. PEP 342 (2.5) made `yield` an expression with `send()`, enabling coroutines. PEP 380 (3.3) added `yield from`, and PEP 492 (3.5) built `async`/`await` on the same pause/resume machinery. When you reach the asyncio lesson, remember: an `async def` function is a cousin of a generator.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Prefer context managers for cleanup',
          text: 'Relying on `finally` inside a generator works, but to guarantee timely cleanup of a *consumer’s* resources use a `with` statement, which is the subject of the Context Managers lesson — it even lets you write a context manager as a generator with `@contextmanager`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the generators so that `list(squares(3))` is `[0, 1, 4]` and `list(both([1], [2]))` is `[1, 2]`.',
      template: `def squares(n):
    for i in range(n):
        ___ i * i

def both(a, b):
    yield ___ a
    yield ___ b`,
      templateIsCode: true,
      blanks: [{ answers: ['yield'] }, { answers: ['from'] }, { answers: ['from'] }],
      wordBank: ['yield', 'from', 'return', 'in'],
      explanation: '`yield` turns the function into a generator and hands out each square. `yield from other` delegates to another iterable, handing out each of its values in turn. `return` would end the function (and produce no values) and `in` is not valid in that position.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Track when the generator’s body runs.',
      code: `log = []
def gen():
    log.append("A")
    yield 1
    log.append("B")
    yield 2

g = gen()
log.append("start")
x = next(g)
log.append(f"got {x}")
print(log)`,
      answer: "['start', 'A', 'got 1']",
      hint: 'Which statements run when the generator is *created*, and which only on the first `next`?',
      explanation: '`gen()` runs nothing, so "start" is logged first. `next(g)` then runs the body up to the first `yield`: "A" is logged and the value 1 is returned. The line that logs "B" is never reached because the generator is paused (and never resumed).',
    },
    {
      kind: 'error',
      prompt: 'Calling `print(len(s))` raises `TypeError: object of type \'generator\' has no len()`. Tap the faulty line.',
      lines: [
        'def squares(n):',
        '    for i in range(n):',
        '        yield i * i',
        's = squares(4)',
        'print(len(s))',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'A generator produces values lazily and does not know how many it will produce, so it has no `len()`. If you need the count, consume it once (`len(list(s))` — but then the values are used up) or restructure the code so that the length is known.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`def f():`\n`    yield 1`\n`    yield 2`\n`    yield 3`\n`g = f()`\n`next(g)`\n`print(sum(g))`',
      answer: '5',
      hint: 'One value was already consumed by `next(g)`.',
      explanation: '`next(g)` resumes the generator and takes the first value, 1, which is then gone for good: a generator keeps its position and never rewinds. `sum(g)` continues from that position and consumes the remaining values, 2 + 3 = 5. Had `next` not been called first, the sum would have been 6.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write an **endless generator** `fib()` that yields the Fibonacci numbers 0, 1, 1, 2, 3, 5, 8, … forever. Each call to `fib()` must start a new, independent sequence.',
      starter: `def fib():
    ...
`,
      solution: `def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b
`,
      tests: `from itertools import islice
assert list(islice(fib(), 10)) == [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
g = fib()
assert [next(g) for _ in range(5)] == [0, 1, 1, 2, 3]
assert next(g) == 5
h = fib()
assert next(h) == 0 and next(g) == 8
big = next(x for i, x in enumerate(fib()) if i == 90)
assert big == 2880067194370816120
assert next(iter(fib())) == 0`,
      checks: ['Uses `yield` inside a `while True` loop', 'Keeps its state (`a`, `b`) in local variables', 'Independent calls give independent sequences'],
      hint: 'Keep `a, b = 0, 1` before an infinite `while True:` loop; `yield a`, then advance with `a, b = b, a + b`.',
      explanation: 'The two local variables survive between `next()` calls because the generator’s frame is suspended, not destroyed. Each call to `fib()` creates a new frame, so sequences are independent. No class, no `StopIteration` — the generator needs none because it never ends.',
    },
    {
      kind: 'code',
      prompt: 'Write a **recursive generator** `flatten(items)` that yields every non-list/tuple item from arbitrarily nested lists and tuples, in order. Strings must be yielded whole (not split into characters). Use `yield from` for the recursion.',
      starter: `def flatten(items):
    ...
`,
      solution: `def flatten(items):
    for item in items:
        if isinstance(item, (list, tuple)):
            yield from flatten(item)
        else:
            yield item
`,
      tests: `import types
assert list(flatten([1, [2, [3, 4]], 5])) == [1, 2, 3, 4, 5]
assert list(flatten(["ab", ["cd", ("ef",)]])) == ["ab", "cd", "ef"]
assert list(flatten([])) == []
assert list(flatten([[], [[]], ()])) == []
assert list(flatten([1, (2, [3]), [4, (5,)]])) == [1, 2, 3, 4, 5]
assert isinstance(flatten([1]), types.GeneratorType)
g = flatten([1, [2, 3]])
assert next(g) == 1
assert next(g) == 2
assert list(g) == [3]
deep = [1]
for _ in range(50):
    deep = [deep, 2]
assert list(flatten(deep)).count(2) == 50`,
      checks: ['A generator function (returns a generator object)', 'Recurses with `yield from` for lists and tuples', 'Strings are yielded as whole items'],
      hint: 'Loop over `items`. If an `item` is a list or tuple, `yield from flatten(item)`; otherwise `yield item`. Test with `isinstance(item, (list, tuple))` so strings are not split.',
      explanation: '`yield from flatten(item)` hands the sub-generator’s values straight to the caller, so deep nesting needs no helper lists. Checking `isinstance(item, (list, tuple))` explicitly avoids the trap of treating a string as iterable — iterating a string yields strings forever (each character is itself a string of length 1).',
    },
    {
      kind: 'code',
      prompt: 'Write a generator `windows(iterable, size)` that yields **tuples** of `size` consecutive items (a sliding window). `windows([1, 2, 3, 4], 2)` gives `(1, 2), (2, 3), (3, 4)`. It must work on any iterable in one pass (including iterators), yield nothing if there are fewer than `size` items, and raise `ValueError` for `size <= 0` (when iteration starts is fine).',
      starter: `def windows(iterable, size):
    ...
`,
      solution: `from collections import deque


def windows(iterable, size):
    if size <= 0:
        raise ValueError("size must be positive")
    window = deque(maxlen=size)
    for item in iterable:
        window.append(item)
        if len(window) == size:
            yield tuple(window)
`,
      tests: `assert list(windows([1, 2, 3, 4], 2)) == [(1, 2), (2, 3), (3, 4)]
assert list(windows("abcd", 3)) == [("a", "b", "c"), ("b", "c", "d")]
assert list(windows([1, 2], 3)) == []
assert list(windows([], 1)) == []
assert list(windows([5, 6, 7], 1)) == [(5,), (6,), (7,)]
assert list(windows(iter(range(5)), 2)) == [(0, 1), (1, 2), (2, 3), (3, 4)]
assert list(windows(range(3), 3)) == [(0, 1, 2)]
for bad in (0, -2):
    try:
        list(windows([1, 2, 3], bad))
        assert False, "should raise ValueError"
    except ValueError:
        pass
moving = [sum(w) / len(w) for w in windows([1, 2, 3, 4, 5], 3)]
assert moving == [2.0, 3.0, 4.0]`,
      checks: ['Yields tuples of exactly `size` consecutive items', 'Works on iterators in a single pass (a bounded `deque`)', 'Yields nothing for short inputs; `ValueError` for `size <= 0`'],
      hint: 'A `collections.deque(maxlen=size)` automatically drops the oldest item when a new one is appended. After appending each item, if the deque has `size` items, `yield tuple(window)`.',
      explanation: 'The bounded `deque` holds only the current window, so memory use is constant even for a huge stream. Moving averages, n-gram models and frame stacking in game AI (feeding the last 4 frames to a network) all use exactly this pattern.',
    },
  ],
  takeaways: [
    'A function with `yield` is a generator function: calling it creates an iterator and runs no code; each `next()` runs to the next `yield`, then pauses with all locals preserved.',
    'Generators are lazy and one-shot. They allow constant-memory pipelines and endless streams — remember to limit endless ones, and never expect a second pass.',
    '`yield from other` delegates to another iterable; a `return value` in a generator ends it and is delivered as `StopIteration.value`.',
    'Generator expressions `(x for x in data)` are lazy list comprehensions: ideal when feeding `sum`, `max`, `any` or `join`; use a list when you need to reuse, index or measure the data.',
    '`yield` is also an expression: `gen.send(x)` passes a value in, and `gen.close()` raises `GeneratorExit` so `finally` can clean up — the machinery behind coroutines and `async`/`await`.',
  ],
  reading: [
    { title: 'Generators (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/classes.html#generators', source: 'tutorial', note: 'The official, concise introduction to generators and generator expressions.' },
    { title: 'Generator expressions and yield (Python Language Reference)', url: 'https://docs.python.org/3/reference/expressions.html#yield-expressions', source: 'docs', note: 'The exact semantics of `yield`, `send`, `throw` and `close`.' },
    { title: 'Generator Tricks for Systems Programmers (David Beazley)', url: 'https://www.dabeaz.com/generators/', source: 'article', note: 'A classic, example-driven talk that builds log-processing pipelines entirely from generators.' },
  ],
};
