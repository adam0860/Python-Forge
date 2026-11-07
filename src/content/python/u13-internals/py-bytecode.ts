import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-bytecode',
  title: 'Bytecode, the dis Module and Performance',
  summary: 'What the interpreter actually runs: code objects and bytecode, reading `dis` output, constant folding, why locals beat globals, measuring with `timeit`, which Python code is fast and which is slow, and why `counter += 1` is not atomic.',
  minutes: 20,
  objectives: [
    'Describe how Python source becomes a code object of bytecode and runs on a stack-based virtual machine',
    'Read simple `dis` output (`LOAD_*`, `STORE_*`, `BINARY_OP`, jumps) and inspect code objects',
    'Explain why compiled-in-C builtins, the right data structure and local variables make Python code faster',
    'Measure code with `timeit` instead of guessing',
    'Show with `dis` that `counter += 1` is several steps and therefore not thread-safe',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From source to code object',
      blocks: [
        {
          type: 'p',
          text: 'In Unit 1 you learned that CPython first **compiles** your source to [[bytecode]] and then runs it on a virtual machine. Now we can look inside. The compiled form is a **[[code-object]]**: it holds the bytecode instructions plus the constants, names and local variables they refer to. Every function has one (`func.__code__`), and the built-in `compile()` turns a string of source into one. `exec` (for statements) and `eval` (for a single expression) then run it. Python does this every time you run a script or import a module; compiled modules are cached as `.pyc` files in `__pycache__`.',
        },
        {
          type: 'code',
          title: 'compile_exec.py',
          runnable: true,
          code: `code = compile("x = 1 + 2\\nprint(x * 10)", "<demo>", "exec")
print(type(code).__name__, code.co_names)
exec(code)`,
          output: `code ('x', 'print')
30`,
          annotations: [
            { lines: 1, text: '`compile(source, filename, mode)` turns text into a code object **without running it**. The filename `"<demo>"` is used in tracebacks; the mode `"exec"` means "a sequence of statements".' },
            { lines: 2, text: 'A code object is a real Python object (`type` is `code`). `co_names` lists the global names it uses: `x` (being assigned) and `print`.' },
            { lines: 3, text: '`exec` runs the code object on the virtual machine, which prints `30`.' },
          ],
        },
        {
          type: 'p',
          text: 'The **`dis`** module (*disassembler*) shows the instructions of a code object. Each line is one **opcode**: `LOAD_FAST` pushes a local variable on the stack, `BINARY_OP` pops two values and pushes the result of an operator, `RETURN_VALUE` hands back the top of the stack. CPython’s virtual machine is a **[[stack-machine|stack machine]]**: operations take their inputs from, and leave their results on, a stack of values.',
        },
        {
          type: 'code',
          title: 'dis_add.py',
          runnable: true,
          code: `import dis

def add(a, b):
    return a + b

dis.dis(add)
print([i.opname for i in dis.get_instructions(add)])
c = add.__code__
print(c.co_varnames, c.co_argcount, c.co_name)
print(type(c.co_code).__name__)`,
          output: `  3           RESUME                   0

  4           LOAD_FAST_BORROW_LOAD_FAST_BORROW 1 (a, b)
              BINARY_OP                0 (+)
              RETURN_VALUE
['RESUME', 'LOAD_FAST_BORROW_LOAD_FAST_BORROW', 'BINARY_OP', 'RETURN_VALUE']
('a', 'b') 2 add
bytes`,
          annotations: [
            { lines: 4, text: 'The source line that produced the instructions shown for line 4 of the disassembly (the left column holds source line numbers).' },
            { lines: 6, text: '`dis.dis(add)` prints one line per instruction: first `RESUME` (start of the function), then a combined instruction that pushes `a` and `b` onto the stack, `BINARY_OP (+)` which pops both and pushes `a + b`, and `RETURN_VALUE`. The exact opcode names change between Python versions — your output may differ slightly.' },
            { lines: 7, text: '`get_instructions` returns the same information as objects you can process in code: here, just the opcode names.' },
            { lines: '8-9', text: 'The code object also stores the argument count and the names of local variables. Locals are numbered, which is why local access is quick.' },
            { lines: 10, text: 'The raw bytecode (`co_code`) is a `bytes` object: a sequence of small integers. Those are what the interpreter loop actually executes.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why compile to bytecode at all?',
          text: 'Parsing text on every run would be slow. Compiling once to compact bytecode lets the interpreter loop be a simple, fast `switch` over opcodes, makes imports faster (the `.pyc` cache skips compiling unchanged modules), and gives Python one portable intermediate form, independent of the operating system and CPU.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'A C++ compiler turns your code into machine instructions for one CPU, doing heavy optimization (inlining, vectorization) up front. CPython compiles to *bytecode for a virtual machine* with only light optimization, then interprets it: each bytecode instruction costs many CPU instructions. That is the main reason pure-Python loops are 10-100 times slower than C++. `dis` is Python’s counterpart to looking at assembly in a tool like Compiler Explorer.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Bytecode is an implementation detail',
          text: 'Opcodes are not a public interface: they differ between CPython versions (3.11 added specialized instructions; this lesson’s output comes from 3.14) and other implementations (PyPy, MicroPython) use different ones. Use `dis` to learn and to investigate, never to build programs that depend on exact opcodes. Likewise never `exec`/`eval` text from an untrusted source: it runs with all your program’s powers.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `compile("x = 1 + 2", "<s>", "exec")` return, and what does it do with the code?',
      options: [
        { text: 'A code object containing bytecode; nothing has been executed yet', correct: true, why: '`compile` only translates the source. Running it is a separate step (`exec` or `eval`).' },
        { text: 'The number 3, because the expression is evaluated immediately', why: 'That would be `eval("1 + 2")`. `compile` doesn’t run anything, and in `"exec"` mode there is no result value anyway.' },
        { text: 'A string of assembly code for your CPU', why: 'Python compiles to bytecode for its own virtual machine, not to machine code for your processor.' },
        { text: 'Nothing: it only checks the syntax and discards the result', why: 'It does check syntax (raising `SyntaxError`), but it returns the resulting code object so you can run it later.' },
      ],
      explanation: '`compile` translates source text into a code object (bytecode plus constants and names) without executing it. You then run it with `exec(code)` or `eval(code)`.',
    },
    {
      kind: 'concept',
      title: 'Reading dis: loads, stores, jumps and constant folding',
      blocks: [
        {
          type: 'p',
          text: 'Once you know the vocabulary, bytecode is readable. **`LOAD_*`** instructions push values (`LOAD_FAST` a local, `LOAD_GLOBAL` a global or builtin, `LOAD_CONST` a constant), **`STORE_*`** pops into a variable, **`BINARY_OP`** and **`COMPARE_OP`** compute, **`CALL`** calls a function, and control flow is made of **jumps** (`POP_JUMP_IF_FALSE`, `JUMP_BACKWARD`, `FOR_ITER`). There is no `for` or `if` in bytecode — just stack operations and jumps. The compiler also does some work in advance: **constant folding** replaces `2 * 3 + 1` by `7` at compile time.',
        },
        {
          type: 'code',
          title: 'reading_bytecode.py',
          runnable: true,
          code: `import dis

def f():
    return 2 * 3 + 1

def g(x):
    return x * 2 * 3

def loop(n):
    total = 0
    for i in range(n):
        total += i
    return total

def pick(x):
    if x > 0:
        return "pos"
    return "non"

def ops(func):
    return [i.opname for i in dis.get_instructions(func)]

print(ops(f).count("BINARY_OP"), ops(g).count("BINARY_OP"))
o = ops(loop)
print("FOR_ITER" in o, "JUMP_BACKWARD" in o, o.count("BINARY_OP"))
p = ops(pick)
print("COMPARE_OP" in p, "POP_JUMP_IF_FALSE" in p, p.count("RETURN_VALUE"))`,
          output: `0 2
True True 1
True True 2`,
          annotations: [
            { lines: '3-4', text: '`2 * 3 + 1` involves only constants, so the compiler computes `7` once, before the program runs. No arithmetic remains in the bytecode: zero `BINARY_OP` instructions.' },
            { lines: '6-7', text: '`x * 2 * 3` is evaluated left to right as `(x * 2) * 3`. The compiler can’t fold across the unknown `x`, so both multiplications stay (`2` BINARY_OPs).' },
            { lines: '9-13', text: 'The loop becomes `GET_ITER` plus `FOR_ITER` (fetch the next item or exit) and a `JUMP_BACKWARD` at the end of the body. `total += i` is one `BINARY_OP`.' },
            { lines: '15-18', text: '`if` compiles to a comparison plus a conditional jump that skips the first return when the test is false.' },
            { lines: '20-21', text: 'A small helper that lists the opcode names of any function.' },
            { lines: 23, text: 'Folded function: 0 operations; unfolded: 2.' },
            { lines: '24-25', text: 'The loop contains the iteration and jump-back instructions (`True True`) and one addition.' },
            { lines: '26-27', text: 'The `if` produces a comparison and a conditional jump, and the function has two return instructions (one per branch).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Tools for exploring',
          text: '`dis.dis(func)` prints a listing; `dis.get_instructions(func)` gives objects with `opname`, `argrepr` and `starts_line`; `python -m dis script.py` disassembles a file from the command line; `func.__code__.co_consts` lists constants. Disassemble two versions of the same code side by side — it is the quickest way to see what a rewrite really changes.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'The adaptive interpreter (3.11+)',
          text: 'Since Python 3.11 the interpreter **specializes** hot instructions at run time: after seeing that a `BINARY_OP` always adds two ints, it replaces it with a faster `BINARY_OP_ADD_INT` and caches type information inline. `dis.dis(func, adaptive=True)` shows those variants after the function has run a few times. This is why newer Python versions are 25-60% faster than 3.10 on typical programs, with no source changes. An experimental JIT compiler can be enabled in some builds from 3.13.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The Python compiler turns an `if` statement into a special `IF` bytecode instruction.',
      answer: false,
      explanation: 'False. Bytecode has no `if` or `for` instructions. Conditions compile to a comparison followed by a conditional jump (`POP_JUMP_IF_FALSE`), and loops use `FOR_ITER` plus `JUMP_BACKWARD`. Structured statements are just patterns of jumps.',
    },
    {
      kind: 'concept',
      title: 'Why some Python is fast and some is slow',
      blocks: [
        {
          type: 'p',
          text: 'Every bytecode instruction costs the interpreter real time, so fast Python means **fewer bytecode instructions doing the same work**. Three principles follow. **1. Pick the right algorithm and data structure** — looking up an item in a `set` or `dict` takes constant time, while `in list` scans every element. **2. Let C do the looping**: builtins like `sum`, `min`, `sorted`, `str.join` and comprehensions run their loops in compiled C code, while a hand-written `for` loop executes bytecode for every iteration. **3. Do less per iteration**: avoid repeated attribute and global lookups in hot loops. Always **measure** with `timeit` rather than guess.',
        },
        {
          type: 'code',
          title: 'timeit_comparison.py',
          runnable: true,
          code: `import timeit

setup = "data = list(range(5000)); table = set(data)"
list_t = timeit.timeit("4999 in data", setup=setup, number=2000)
set_t = timeit.timeit("4999 in table", setup=setup, number=2000)
print(list_t > set_t * 5)

loop_setup = "data = list(range(1000))"
loop_t = timeit.timeit("t = 0\\nfor x in data:\\n    t += x", setup=loop_setup, number=300)
sum_t = timeit.timeit("sum(data)", setup=loop_setup, number=300)
print(loop_t > sum_t * 1.5)`,
          output: `True
True`,
          annotations: [
            { lines: 3, text: '`setup` code runs once and is not timed. It builds a list and a set of the same 5000 numbers.' },
            { lines: '4-5', text: '`timeit.timeit(statement, setup, number)` returns the total seconds for running the statement `number` times. Searching for the *last* element is the list’s worst case: it must check all 5000 items, whereas the set computes a hash.' },
            { lines: 6, text: 'The set is more than 5 times faster (typically hundreds of times). We print a comparison, not the raw time, because timings vary from machine to machine.' },
            { lines: '8-10', text: 'The same total of 1000 numbers, computed by a hand-written loop (about 1000 trips through the bytecode loop) and by `sum(data)`, which loops in C. Note that the second statement `sum(data)` has its own `setup`.' },
            { lines: 11, text: 'The builtin is clearly faster — typically around 3 times on current versions. The more of a loop runs inside a builtin, the bigger the gain.' },
          ],
        },
        {
          type: 'p',
          text: 'The third principle is visible in bytecode. A **local variable** is a numbered slot (`LOAD_FAST`); a **global or attribute** needs a dictionary lookup (`LOAD_GLOBAL`, `LOAD_ATTR`) every time it is used. In a hot loop you can bind a global or method to a local name once. Do this only for code that your profiler shows is hot — it costs readability.',
        },
        {
          type: 'code',
          title: 'local_binding.py',
          runnable: true,
          code: `import math

def slow(xs):
    return [math.sqrt(x) for x in xs]

def fast(xs, sqrt=math.sqrt):
    return [sqrt(x) for x in xs]

print(slow.__code__.co_names, fast.__code__.co_names)
print(fast.__code__.co_varnames)
print(slow([4, 9]) == fast([4, 9]))`,
          output: `('math', 'sqrt') ()
('xs', 'sqrt', 'x')
True`,
          annotations: [
            { lines: 4, text: '`math.sqrt` means: look up the global `math`, then look up the attribute `sqrt` in it — on *every* iteration.' },
            { lines: '6-7', text: 'Binding `sqrt` as a default parameter turns it into a local variable, loaded from a numbered slot.' },
            { lines: 9, text: '`co_names` lists the names that need a lookup: `slow` uses `math` and `sqrt`; `fast` needs none.' },
            { lines: 10, text: '`co_varnames` lists local slots: `fast` has `sqrt` among its locals (and the loop variable `x`).' },
            { lines: 11, text: 'Same results. The change affects speed only, typically by a modest 10-30%, which is why it matters just in the hottest loops.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Profile first, optimize second',
          text: 'Most programs spend almost all their time in a tiny fraction of the code, and the bottleneck is rarely where you guess. Write clear code, measure (`timeit` for snippets, `cProfile` for programs — Unit 15), and optimize only what the numbers point to. Choosing a better algorithm beats any amount of micro-tuning.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why AI code leaves Python’s loops',
          text: 'A Python loop over a million numbers executes bytecode a million times; `numpy_array * 2` or a PyTorch tensor operation runs one call into optimized C/C++/CUDA code. That is why numerical Python is written as **whole-array operations** and why training loops spend their time inside compiled libraries, not the interpreter. In game development the same trick applies: move per-frame hot loops into NumPy, a C extension, Cython or Numba rather than rewriting the game in another language.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Bytecode and concurrency: why counter += 1 is not atomic',
      blocks: [
        {
          type: 'p',
          text: 'One more reason to read bytecode: it explains **thread-safety**. A single Python statement is usually *several* bytecode instructions, and a thread switch can happen between any two of them. `counter += 1` loads the value, adds one, then stores it back. If two threads both load 5, both add 1, and both store 6, one increment is lost. You will meet this race condition properly in the concurrency unit; `dis` shows the three steps right now.',
        },
        {
          type: 'code',
          title: 'not_atomic.py',
          runnable: true,
          code: `import dis

def bump():
    global counter
    counter += 1

wanted = ("LOAD_GLOBAL", "BINARY_OP", "STORE_GLOBAL")
print([i.opname for i in dis.get_instructions(bump) if i.opname in wanted])

import importlib.util
import sys
path = importlib.util.cache_from_source("game.py")
print(path.startswith("__pycache__"), path.endswith(".pyc"), sys.implementation.cache_tag.startswith("cpython"))`,
          output: `['LOAD_GLOBAL', 'BINARY_OP', 'STORE_GLOBAL']
True True True`,
          annotations: [
            { lines: '3-5', text: 'A tiny function that increments a global counter.' },
            { lines: 7, text: 'We filter the opcodes to the important three.' },
            { lines: 8, text: 'Three separate steps: **load** the global, **add** (`BINARY_OP`), **store** it back. Another thread can run between any two of them — so the statement is not atomic.' },
            { lines: '10-13', text: 'A side topic: where compiled modules live. `cache_from_source` shows that `game.py` would be cached as `__pycache__/game.cpython-<version>.pyc`. The `.pyc` only saves *compile* time when the module is imported; it does not make the code run faster.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'The GIL and free-threading',
          text: 'CPython’s **[[gil|Global Interpreter Lock]]** lets only one thread execute bytecode at a time, which protects the interpreter’s internal data but does *not* make your own multi-step operations atomic. Recent versions ship an optional **free-threaded** build without the GIL (officially supported since 3.14), where truly parallel threads make correct locking even more important. The next unit covers threads, processes and `asyncio`.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What is a code object?" (compiled bytecode plus constants, names and locals); "Why is a local variable faster than a global?" (indexed slot vs dictionary lookup); "What does constant folding do?" (computes constant expressions at compile time); "Why isn’t `x += 1` thread-safe?" (it is load, add and store — several instructions); "Does a `.pyc` file make code run faster?" (no — only loading).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code to print the bytecode listing of `add` and then run a compiled string.',
      template: `import dis
def add(a, b):
    return a + b

dis.___(add)
code = ___("print(1 + 2)", "<s>", "exec")
exec(code)`,
      templateIsCode: true,
      blanks: [{ answers: ['dis'] }, { answers: ['compile'] }],
      wordBank: ['dis', 'compile', 'eval', 'parse'],
      explanation: '`dis.dis(func)` prints a function’s disassembly, and `compile(source, filename, mode)` turns text into a code object that `exec` can run. (`eval` would run an expression immediately instead of returning a code object.)',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. What does the code object know about the names in the source?',
      code: `ns = {}
code = compile("a = 2\\nb = a * 5", "<s>", "exec")
exec(code, ns)
print(ns["b"], code.co_names)`,
      answer: "10 ('a', 'b')",
      hint: '`exec` stores the results in the dictionary `ns`. `co_names` lists the names used by the code.',
      explanation: 'Running the code in the namespace `ns` assigns `a = 2` and `b = a * 5 = 10`, so `ns["b"]` is 10. The code object records the names it uses in order of first appearance: `a`, then `b`. Note that `a * 5` can’t be folded because `a` is a variable.',
    },
    {
      kind: 'error',
      prompt: '`print(value + 1)` raises `TypeError: unsupported operand type(s) for +: \'NoneType\' and \'int\'`. The goal is to compute `1 + 2` from a string. Tap a line that is the real mistake.',
      lines: [
        'code = compile("1 + 2", "<s>", "exec")',
        'value = exec(code)',
        'print(value + 1)',
      ],
      linesAreCode: true,
      errorLines: [1, 2],
      explanation: '`exec` runs *statements* and always returns `None`, so `value` is `None`. To get the result of an expression use `"eval"` mode and `eval`: `value = eval(compile("1 + 2", "<s>", "eval"))`, or simply `eval("1 + 2")`. (And never `eval` untrusted text.)',
    },
    {
      kind: 'numeric',
      prompt: 'How many `BINARY_OP` instructions does the bytecode of this function contain?\n\n`def g(x):`\n`    return x * 2 * 3`',
      answer: '2',
      hint: 'Python evaluates `x * 2 * 3` as `(x * 2) * 3`. Can the compiler combine the two constants?',
      explanation: 'The expression is parsed as `(x * 2) * 3`, so there is no constant sub-expression to fold: one `BINARY_OP` for `x * 2` and another for `* 3`. Written as `x * (2 * 3)` the compiler would fold `2 * 3` into `6` and only one multiplication would remain.',
      label: 'Count:',
    },
    {
      kind: 'code',
      prompt: 'Write `count_ops(func, opname)` that returns how many instructions in the bytecode of `func` have the opcode name `opname` (for example `"BINARY_OP"`). Use the `dis` module.',
      starter: `import dis

def count_ops(func, opname):
    ...
`,
      solution: `import dis


def count_ops(func, opname):
    return sum(1 for ins in dis.get_instructions(func) if ins.opname == opname)
`,
      tests: `def three(a, b, c):
    return a + b + c

def one():
    return 5

def calls(x):
    return len(x) + len(x)

def folded():
    return 2 * 3

assert count_ops(three, "BINARY_OP") == 2
assert count_ops(one, "BINARY_OP") == 0
assert count_ops(calls, "CALL") == 2
assert count_ops(calls, "BINARY_OP") == 1
assert count_ops(folded, "BINARY_OP") == 0
assert count_ops(three, "NO_SUCH_OP") == 0`,
      checks: ['Iterates over \`dis.get_instructions(func)\`', 'Counts instructions whose \`opname\` equals the given name', 'Returns 0 for opcodes that do not occur'],
      hint: '`dis.get_instructions(func)` yields `Instruction` objects. Count those with `ins.opname == opname`, for example with `sum(1 for ...)`.',
      explanation: 'The `Instruction` objects returned by `get_instructions` expose `opname`, `argrepr` and `offset`, so analyzing bytecode is ordinary Python. The test with `2 * 3` shows constant folding: no `BINARY_OP` remains in the compiled function.',
    },
    {
      kind: 'code',
      prompt: 'Write `has_loop(func)` that returns `True` if the bytecode of `func` contains a loop — that is, an instruction named `FOR_ITER` or `JUMP_BACKWARD` — and `False` otherwise.',
      starter: `import dis

def has_loop(func):
    ...
`,
      solution: `import dis


def has_loop(func):
    loop_ops = {"FOR_ITER", "JUMP_BACKWARD"}
    return any(ins.opname in loop_ops for ins in dis.get_instructions(func))
`,
      tests: `def a(n):
    for i in range(n):
        pass

def b(n):
    while n:
        n -= 1

def c(xs):
    return [x for x in xs]

def d(x):
    return x + 1

def e(x):
    return x if x else 0

def r(n):
    return 1 if n == 0 else r(n - 1)

assert has_loop(a) is True
assert has_loop(b) is True
assert has_loop(c) is True
assert has_loop(d) is False
assert has_loop(e) is False
assert has_loop(r) is False`,
      checks: ['Looks at every instruction of the function', 'Recognizes \`for\` loops, \`while\` loops and comprehensions', 'Recursion and plain branches are not loops'],
      hint: 'Use `any(...)` over `dis.get_instructions(func)` and test whether `ins.opname` is in `{"FOR_ITER", "JUMP_BACKWARD"}`.',
      explanation: '`for` loops and comprehensions contain `FOR_ITER`; `while` loops jump back with `JUMP_BACKWARD`. Recursion isn’t a loop in bytecode — it is just a `CALL`. This is how static-analysis tools find loops without running the code.',
    },
    {
      kind: 'code',
      prompt: 'Write `fast_membership(items, queries)` that returns how many values in `queries` (counting repeats) are present in `items`. The test data is large (hundreds of thousands of values), so choose an appropriate data structure; items are hashable.',
      starter: `def fast_membership(items, queries):
    ...
`,
      solution: `def fast_membership(items, queries):
    lookup = set(items)
    return sum(1 for q in queries if q in lookup)
`,
      tests: `items = list(range(200_000))
queries = list(range(0, 400_000, 2))
assert fast_membership(items, queries) == 100_000
assert fast_membership([], [1, 2]) == 0
assert fast_membership([1, 2, 2, 3], [2, 2, 5]) == 2
assert fast_membership(["a", "b"], ["b", "a", "c"]) == 2
assert fast_membership([1, 2], []) == 0`,
      checks: ['Builds a \`set\` from \`items\` once', 'Counts queries found in the set, including repeated queries', 'Handles empty inputs; finishes quickly on large data'],
      hint: 'Convert `items` to a `set` once, outside the loop. Then count the queries `q` for which `q in lookup` is true.',
      explanation: 'Testing `q in items` on a list scans the whole list for every query — with these sizes about 40 billion comparisons, far beyond the time limit. A set answers each lookup in constant time, so the whole job takes a few milliseconds. The right data structure beat any micro-optimization by factors of a million.',
    },
  ],
  takeaways: [
    'CPython compiles source to a **code object** (bytecode plus constants, names and locals), cached as `.pyc` for imports, and runs it on a **stack-based virtual machine**. `compile`, `exec` and `eval` expose this; never run untrusted text.',
    '`dis.dis` and `dis.get_instructions` show the opcodes: `LOAD_*`/`STORE_*` move values, `BINARY_OP`/`COMPARE_OP` compute, `CALL` calls, jumps implement `if` and loops. The compiler folds constant expressions. Opcodes vary between versions, so use them to learn, not to depend on.',
    'Fast Python means fewer bytecode instructions for the same work: a better algorithm or data structure (`set`/`dict` lookups), loops pushed into C builtins and libraries (`sum`, NumPy, PyTorch), and fewer lookups in hot loops.',
    'Measure with `timeit` (and profile, in Unit 15) instead of guessing; optimize only the hot spots.',
    'A statement like `counter += 1` is several bytecode steps (load, add, store), so it is not atomic and can race between threads. The GIL doesn’t change that.',
  ],
  reading: [
    { title: 'dis — Disassembler for Python bytecode', url: 'https://docs.python.org/3/library/dis.html', source: 'docs', note: 'The reference for `dis`, `get_instructions` and the list of opcodes for your Python version.' },
    { title: 'timeit — Measure execution time of small code snippets', url: 'https://docs.python.org/3/library/timeit.html', source: 'docs', note: 'How to time code correctly, including the command-line interface.' },
    { title: 'CPython Developer’s Guide — The bytecode interpreter', url: 'https://devguide.python.org/internals/interpreter/', source: 'docs', note: 'How the evaluation loop and the specializing adaptive interpreter work.' },
    { title: 'PythonSpeed — Performance Tips', url: 'https://wiki.python.org/moin/PythonSpeed/PerformanceTips', source: 'article', note: 'The classic wiki page of common idioms and which are actually faster.' },
  ],
};
