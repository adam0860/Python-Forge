import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-how-it-works',
  title: 'How Python Works: From Source Code to a Running Program',
  summary: 'Tokens, syntax trees, bytecode and a virtual machine: what really happens when you press Run — and why it makes Python flexible, friendly and slower than C++.',
  minutes: 18,
  objectives: [
    'Trace the four stages CPython uses to run a program: tokenize, parse, compile to bytecode, execute',
    'Explain how a bytecode virtual machine evaluates an expression with a stack',
    'Describe Python’s object model: names are labels that refer to objects with a type, a value and an identity',
    'Distinguish dynamic typing from strong typing and predict what Python does with mixed types',
    'Explain reference counting, the GIL, and why pure Python is slower than C++ — and how libraries get around it',
    'Name the main Python implementations, including the one running inside this app',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Compiled or interpreted? A bit of both',
      blocks: [
        {
          type: 'p',
          text: 'You may have heard that C++ is a *compiled* language and Python is an *interpreted* one. That’s a useful first approximation, but the real story is more interesting. When you build a C++ program, a [[compiler]] translates your source code into **native machine code** for your CPU, ahead of time, producing an `.exe`. The CPU then runs those instructions directly.',
        },
        {
          type: 'p',
          text: 'When you run `python game.py`, nothing like that happens up front. The [[interpreter]] — almost always [[cpython|CPython]] — reads your [[source-code|source code]], compiles it *in memory* into an intermediate form called **[[bytecode]]**, and then executes that bytecode on a **[[virtual-machine|virtual machine]]**: a program, written in C, that imitates a simple computer. So Python is compiled too — just to bytecode instead of machine code, and at the moment you run it.',
        },
        {
          type: 'table',
          headers: ['Aspect', 'C++', 'Python (CPython)'],
          rows: [
            ['When is code translated?', 'Ahead of time, in a separate build step', 'Every time you run it (cached for imported modules)'],
            ['Translated into', 'Native machine code for one CPU and OS', 'Portable bytecode for CPython’s virtual machine'],
            ['Who runs it?', 'The CPU, directly', 'CPython’s evaluation loop, one instruction at a time'],
            ['Types checked', 'At compile time', 'While the program runs'],
            ['Typical speed', 'Very fast', 'Often 10–100× slower for tight loops'],
            ['Edit → run cycle', 'Edit, compile, link, run', 'Edit, run'],
          ],
          caption: 'Two different trade-offs: C++ optimizes for speed of the program, Python for speed of the programmer.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bytecode instead of machine code?',
          text: 'Bytecode is **portable**: the same `.py` file runs on Windows, Linux, macOS, Android — even inside this app — because only the virtual machine has to be ported, not your program. It is also **quick to produce**, so there is no build step to wait for, and it keeps the language **dynamic**: types can change while the program runs, which a C++-style compiler couldn’t optimize ahead of time anyway.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'When you run `python game.py`, what does CPython actually execute?',
      options: [
        { text: 'The text of `game.py`, one character at a time', why: 'Python never executes raw text. It first tokenizes and parses the source, then compiles it.' },
        { text: 'Native machine code that it compiled ahead of time into an `.exe`', why: 'That’s the C++ model. CPython doesn’t produce an executable.' },
        { text: 'Bytecode, compiled from your source when you run it, executed by CPython’s virtual machine', correct: true, why: 'Right — compile to bytecode in memory, then run that bytecode in the evaluation loop.' },
        { text: 'JavaScript, which the operating system then runs', why: 'No JavaScript involved (though this app’s Python does run on WebAssembly, more on that later).' },
      ],
      explanation: 'CPython compiles your source to bytecode first and then executes the bytecode on its virtual machine. That’s why a `SyntaxError` anywhere in the file is reported *before* the first line runs: the whole file is compiled before anything executes.',
    },
    {
      kind: 'concept',
      title: 'Stage by stage: tokens, trees and bytecode',
      blocks: [
        {
          type: 'p',
          text: 'Let’s follow one line — `score = score + 10` — through the pipeline. Python ships modules that expose every stage, so you can watch it happen yourself.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Tokenize', text: 'The **tokenizer** chops the text into meaningful pieces: names, operators, numbers, strings, and the special `INDENT`/`DEDENT` tokens that make indentation part of the grammar.' },
            { title: 'Parse', text: 'The **parser** checks the tokens against Python’s grammar and builds an **abstract syntax tree (AST)**: a tree that captures the structure — "assign to `score` the result of adding `score` and `10`". A grammar violation here is a [[syntax-error|SyntaxError]].' },
            { title: 'Compile', text: 'The **compiler** walks the tree and emits **bytecode**: a flat list of simple instructions such as "load the value of `score`", "add", "store into `score`".' },
            { title: 'Execute', text: 'The **virtual machine** runs the bytecode instruction by instruction in a big loop written in C — the *evaluation loop*.' },
          ],
        },
        {
          type: 'code',
          title: 'stages.py',
          runnable: true,
          code: 'import tokenize, io, ast\n\nsource = "score = score + 10\\n"\n\n# Stage 1: tokens\nfor tok in tokenize.generate_tokens(io.StringIO(source).readline):\n    print(tokenize.tok_name[tok.type], repr(tok.string))\n\n# Stage 2: the abstract syntax tree\nprint(ast.dump(ast.parse(source)))',
          output: "NAME 'score'\nOP '='\nNAME 'score'\nOP '+'\nNUMBER '10'\nNEWLINE '\\n'\nENDMARKER ''\nModule(body=[Assign(targets=[Name(id='score', ctx=Store())], value=BinOp(left=Name(id='score', ctx=Load()), op=Add(), right=Constant(value=10)))])",
          annotations: [
            { lines: 6, text: '`tokenize` is the same tokenizer CPython uses. Each token has a type (`NAME`, `OP`, `NUMBER`…) and the exact text.' },
            { lines: 10, text: '`ast.parse` returns the tree; `ast.dump` prints it. Read it as: an `Assign` whose target is the name `score` (being *stored*) and whose value is a `BinOp` adding the name `score` (being *loaded*) and the constant `10`.' },
          ],
        },
        {
          type: 'p',
          text: 'And the third stage — the bytecode — comes from the `dis` (disassembler) module. Here is a slightly richer expression, `x = a + b * 2`, compiled by Python 3.14:',
        },
        {
          type: 'code',
          title: 'bytecode.py',
          runnable: true,
          outputVaries: true,
          code: 'import dis\n\ndis.dis("x = a + b * 2")',
          output: '  0           RESUME                   0\n\n  1           LOAD_NAME                0 (a)\n              LOAD_NAME                1 (b)\n              LOAD_SMALL_INT           2\n              BINARY_OP                5 (*)\n              BINARY_OP                0 (+)\n              STORE_NAME               2 (x)\n              LOAD_CONST               1 (None)\n              RETURN_VALUE',
          annotations: [
            { lines: 3, text: 'Running it needs no values for `a` and `b`: `dis` only *compiles* the code, it doesn’t run it.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Bytecode is an internal detail of CPython and changes between versions — Python 3.13 shows `LOAD_CONST` where 3.14 shows `LOAD_SMALL_INT`, for example. That’s why the output above is marked as a sample. Never write code that depends on specific bytecode.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put the stages CPython uses to run your program in order.',
      lines: [
        'The tokenizer splits the source text into tokens',
        'The parser builds an abstract syntax tree',
        'The compiler turns the tree into bytecode',
        'The virtual machine executes the bytecode instructions',
      ],
      distractors: ['The linker combines the bytecode into a standalone `.exe`'],
      explanation: 'Tokenize → parse → compile → execute. There is no linker and no `.exe`: CPython keeps the bytecode in memory and runs it right away. (Tools like PyInstaller can bundle the interpreter and your bytecode into an `.exe` for distribution, but that is packaging, not compilation to machine code.)',
    },
    {
      kind: 'concept',
      title: 'Inside the virtual machine: a stack machine',
      blocks: [
        {
          type: 'p',
          text: 'CPython’s virtual machine is a **stack machine**. Instead of CPU registers, it keeps a small stack of values. Most instructions take their inputs from the top of the stack and push their result back. Here is the bytecode for `x = a + b * 2`, step by step, if `a` is `1` and `b` is `5`:',
        },
        {
          type: 'table',
          headers: ['Instruction', 'What it does', 'Stack afterwards'],
          rows: [
            ['`LOAD_NAME a`', 'Look up the name `a`, push its value', '`[1]`'],
            ['`LOAD_NAME b`', 'Push the value of `b`', '`[1, 5]`'],
            ['`LOAD_SMALL_INT 2`', 'Push the constant `2`', '`[1, 5, 2]`'],
            ['`BINARY_OP *`', 'Pop two values, multiply, push the result', '`[1, 10]`'],
            ['`BINARY_OP +`', 'Pop two values, add, push the result', '`[11]`'],
            ['`STORE_NAME x`', 'Pop the top value and bind the name `x` to it', '`[]`'],
          ],
          caption: 'Notice that `b * 2` happens before the addition: operator precedence was already decided by the parser when it built the tree.',
        },
        {
          type: 'p',
          text: 'Every instruction is handled by a chunk of C code inside the evaluation loop. For `BINARY_OP +`, that C code has to ask the two objects *what kind of thing they are* before it can add them — two ints, two floats, two strings, or something that doesn’t support `+` at all. That check happens at run time, every single time, and it’s a big part of why Python is slower than C++, where the compiler knew the types in advance and emitted a single `add` instruction.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How CPython got faster',
          text: 'Since Python 3.11, the VM is a **specializing adaptive interpreter** (PEP 659). After an instruction has run a few times, CPython rewrites it in place into a faster, specialized version — for example, a `BINARY_OP +` that keeps seeing two ints becomes an "add two ints" instruction that skips the type questions. Python 3.13 added an experimental **[[jit|JIT compiler]]** that can turn hot bytecode into machine code. The basic model — bytecode on a stack machine — hasn’t changed.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'In C++, `a + b * 2` with `int`s compiles to two or three CPU instructions. In CPython it is six bytecode instructions, each of which runs dozens of C instructions: name lookups, type checks, creating a new int object for the result. That overhead is per *operation*, which is why a loop doing millions of tiny operations is where Python is slowest.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The `.pyc` files that Python stores in `__pycache__` folders contain native machine code that your CPU executes directly.',
      answer: false,
      explanation: 'False. `.pyc` files hold **bytecode**, cached so that imported modules don’t have to be re-compiled every time you run your program (CPython recompiles automatically if the source changes). The CPU can’t run bytecode — CPython’s virtual machine still interprets it. The `cpython-314` in a name like `utils.cpython-314.pyc` records which Python version produced it, because bytecode changes between versions.',
    },
    {
      kind: 'concept',
      title: 'Everything is an object, and names are labels',
      blocks: [
        {
          type: 'p',
          text: 'In Python, every value — every number, string, list, function, class and module — is an **[[object]]**: a chunk of memory that knows three things about itself: its **type** (what kind of thing it is), its **value**, and its **identity** (where it lives, which never changes while it exists).',
        },
        {
          type: 'code',
          title: 'objects.py',
          runnable: true,
          code: 'score = 100\nprint(type(score))\nprint(type(3.5), type("hi"), type(print))\nprint(isinstance(print, object), isinstance(42, object))',
          output: "<class 'int'>\n<class 'float'> <class 'str'> <class 'builtin_function_or_method'>\nTrue True",
          annotations: [
            { lines: 2, text: '[[type|`type()`]] asks an object for its type. The type travels with the *value*, not with the name `score`.' },
            { lines: 3, text: 'Even `print` is an object — a function object. You can pass functions around like any other value; that idea powers decorators and callbacks later in the course.' },
            { lines: 4, text: '`isinstance(x, object)` is `True` for every value in Python. There are no "primitive" types like C++’s `int`.' },
          ],
        },
        {
          type: 'p',
          text: 'A [[variable]] is not a box with a type, as in C++. It’s a **name tied to an object**, like a luggage tag. [[assignment|Assignment]] (`score = 100`) ties the tag `score` to the object `100`. Assigning one name to another doesn’t copy anything — it ties a second tag to the *same* object:',
        },
        {
          type: 'code',
          title: 'labels.py',
          runnable: true,
          code: 'team_a = ["Ana", "Ben"]\nteam_b = team_a          # a second label on the SAME list\nteam_b.append("Cai")     # change the list through one label...\nprint(team_a)            # ...and the other label sees it\nprint(team_a is team_b)  # same object?',
          output: "['Ana', 'Ben', 'Cai']\nTrue",
          annotations: [
            { lines: 1, text: 'A *list* — an ordered, changeable collection. You’ll meet lists properly in the Collections unit.' },
            { lines: 2, text: 'No copy is made. Both names now refer to one list object.' },
            { lines: 5, text: '`is` compares **identity** (is it the very same object?), while `==` compares **values**.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'Picture objects as balloons and names as strings tied to them. `team_b = team_a` ties a second string to the same balloon. If you change the balloon, everyone holding a string sees the change. When the last string is cut, the balloon floats away — that’s garbage collection, two cards from now.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Rebinding is not changing',
          text: 'Numbers and strings are [[immutable]]: you can’t change them in place. `x = x + 1` doesn’t modify the object `5`; it creates a new object `6` and moves the label `x` onto it. Any other name still tied to `5` is unaffected.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'What does this print?',
      code: 'x = 5\ny = x\nx = x + 1\nprint(x, y)',
      answer: '6 5',
      hint: 'Line 2 ties `y` to the same object as `x`. Line 3 creates a *new* object and moves only the `x` label.',
      explanation: 'After line 2, `x` and `y` are both labels on the object `5`. Line 3 evaluates `x + 1`, creating a new int object `6`, and re-ties `x` to it. `y` still refers to `5`. Integers are immutable, so nothing could change `5` itself. Output: `6 5`.',
    },
    {
      kind: 'concept',
      title: 'Dynamic, but strong: how Python handles types',
      blocks: [
        {
          type: 'p',
          text: 'Two words describe Python’s type system, and people often mix them up.',
        },
        {
          type: 'definition',
          term: 'Dynamic typing',
          text: 'Types belong to **values**, and are checked **while the program runs**. A name can refer to an `int` now and a `str` later. You never declare types (though you *may* add optional [[type-hint|type hints]] for tools to check).',
        },
        {
          type: 'definition',
          term: 'Strong typing',
          text: 'Python **won’t silently convert** between unrelated types. Adding a string to a number is an error, not a guess. You convert explicitly when you mean it.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> x = 42\n>>> type(x)\n<class \'int\'>\n>>> x = "forty-two"      # dynamic: the name can move to a str\n>>> type(x)\n<class \'str\'>\n>>> "3" + 4               # strong: no silent conversion\nTraceback (most recent call last):\n  File "<python-input-5>", line 1, in <module>\n    "3" + 4\n    ~~~~^~~\nTypeError: can only concatenate str (not "int") to str\n>>> int("3") + 4          # explicit conversion\n7',
          annotations: [
            { lines: 4, text: 'Allowed. The type lives on the object, so re-pointing `x` at a string is fine.' },
            { lines: '8-12', text: 'A [[traceback]]. Read it bottom-up: the last line says *what* went wrong; the `~~~~^~~` markers point at *where*.' },
            { lines: 13, text: 'Say what you mean: `int("3")` builds an `int` from the text, so the addition is between two numbers.' },
          ],
        },
        {
          type: 'compare',
          left: {
            title: 'JavaScript (weak typing)',
            tone: 'bad',
            text: '`"3" + 4` gives `"34"` and `"3" * 4` gives `12` — the language guesses, and bugs hide.',
          },
          right: {
            title: 'Python (strong typing)',
            tone: 'good',
            text: '`"3" + 4` raises `TypeError` immediately, pointing at the exact spot. You fix it once, explicitly.',
          },
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why check types at run time?',
          text: 'Dynamic typing makes code short and flexible — one function can work on ints, floats or anything else that supports `+` (an idea called *duck typing*). Strong typing stops that flexibility from turning into silent nonsense. The price is that type errors appear when a line *runs*, not when you start the program — which is exactly why good tests and type hints matter in bigger Python projects.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What happens when Python runs `total = "Score: " + 100`?',
      options: [
        { text: 'It prints `Score: 100`', why: 'It wouldn’t print anything — this is an assignment — and Python won’t convert `100` to text automatically.' },
        { text: '`total` becomes the string `"Score: 100"`', why: 'That’s what a weakly typed language like JavaScript would do. Python refuses to guess.' },
        { text: 'It raises a `TypeError` because a `str` and an `int` can’t be added', correct: true, why: 'Correct — strong typing. Fix it with `"Score: " + str(100)` or an f-string, `f"Score: {100}"`.' },
        { text: 'It raises a `SyntaxError` before the program starts', why: 'The syntax is fine; the problem is the *types* of the values, which Python only discovers when the line runs.' },
      ],
      explanation: 'Python is strongly typed, so `"Score: " + 100` raises `TypeError: can only concatenate str (not "int") to str` when the line runs. Convert explicitly: `"Score: " + str(100)`, or use an f-string — `f"Score: {100}"` — which you’ll learn soon.',
    },
    {
      kind: 'concept',
      title: 'Memory, the GIL and speed',
      blocks: [
        {
          type: 'p',
          text: 'You never call `delete` in Python. Memory is managed automatically by **[[reference-counting|reference counting]]**: every object keeps a count of how many references (names, list slots, and so on) point at it. When the count drops to zero, the object is freed immediately. A separate **cycle collector** occasionally finds groups of objects that only refer to each other and frees those too. Together this is Python’s [[garbage-collection|garbage collection]].',
        },
        {
          type: 'p',
          text: 'Reference counts change constantly, from every thread. To keep them consistent cheaply, CPython has long used the **[[gil|Global Interpreter Lock]]**: only one thread may execute Python bytecode at a time. Threads still help with waiting (downloads, files), but they couldn’t speed up pure-Python number crunching on several cores. Since 3.13 there is an optional *free-threaded* build without the GIL, officially supported since 3.14 — you’ll study it in the Concurrency unit.',
        },
        {
          type: 'p',
          text: 'Put it together and you can see where Python’s speed goes: every value is a full object on the heap (a small `int` takes about 28 bytes on a 64-bit machine, versus 4 in C++), every operation checks types at run time, and every name lookup goes through dictionaries. That’s the price of flexibility.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'How Python programs go fast anyway',
          text: 'Don’t do millions of tiny operations in Python — hand the whole job to a library written in C, C++ or CUDA. `sum(numbers)` loops in C. A NumPy expression like `positions + velocities * dt` updates a million particles in one call. PyTorch runs whole neural-network layers on your GPU. Python stays the readable "control code"; the heavy lifting never touches the bytecode loop.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the description of CPython’s memory management.',
      template: 'Each object keeps a ___ of how many references point to it, and is freed when it reaches ___. Objects that only refer to each other are cleaned up by the ___ collector. The ___ lets only one thread run Python bytecode at a time in the standard build.',
      blanks: [{ answers: ['reference count'] }, { answers: ['zero'] }, { answers: ['cycle'] }, { answers: ['GIL'] }],
      wordBank: ['reference count', 'zero', 'cycle', 'GIL', 'compiler', 'one', 'JIT'],
      explanation: 'CPython uses **reference counting** — an object is freed when its count reaches **zero** — plus a **cycle** collector for reference cycles that counting alone can’t free. The **GIL** (Global Interpreter Lock) keeps those counts safe by letting one thread run bytecode at a time in the standard build.',
    },
    {
      kind: 'concept',
      title: 'One language, many implementations',
      blocks: [
        {
          type: 'p',
          text: 'Python the *language* is defined by its reference documentation and PEPs. Python the *program* comes in several implementations:',
        },
        {
          type: 'table',
          headers: ['Implementation', 'Written in', 'Use it when…'],
          rows: [
            ['**CPython**', 'C', 'Almost always — the reference implementation from python.org, with the full ecosystem'],
            ['**PyPy**', 'RPython (a subset of Python)', 'You need pure-Python code to run faster; its JIT is often several times quicker than CPython'],
            ['**MicroPython / CircuitPython**', 'C', 'Programming microcontrollers such as the Raspberry Pi Pico with a few hundred KB of memory'],
            ['**Pyodide**', 'CPython compiled to WebAssembly', 'Running Python in a browser or an app — like this one'],
            ['**GraalPy**, **IronPython**, **Jython**', 'Java, .NET', 'Embedding Python in the Java or .NET world (Jython is still Python 2)'],
          ],
          caption: 'This course targets CPython 3.12 and newer; everything also runs on the app’s Pyodide.',
        },
        {
          type: 'p',
          text: 'The Python inside **Python Forge** is [[pyodide|Pyodide]]: the real CPython source code, compiled to **WebAssembly**, a portable instruction format that browsers and app WebViews can run at near-native speed. That’s why the Run buttons work offline on both Windows and Android, with the full standard library. Its limits: it can’t use your GPU, and packages with native code need special builds — so PyTorch examples in the AI course are marked *Run on your PC*.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Embedding Python in a game engine',
          text: 'Because CPython is a C library, a C++ program can link it in and run Python scripts inside itself — exactly how Battlefield 2, EVE Online and Blender use it. Unreal Engine ships a Python plugin for editor automation, and tools like pybind11 let you expose your C++ classes to Python with a few lines.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Every value carries its type with it. Finish the program so it prints the type of all three values, one per line, exactly like this:\n\n```\n<class \'int\'>\n<class \'float\'>\n<class \'str\'>\n```',
      starter: 'value1 = 42\nvalue2 = 3.5\nvalue3 = "forty-two"\n\nprint(type(value1))\n# print the types of value2 and value3 too\n',
      solution: 'value1 = 42\nvalue2 = 3.5\nvalue3 = "forty-two"\n\nprint(type(value1))\nprint(type(value2))\nprint(type(value3))\n',
      tests: '',
      expectOutput: "<class 'int'>\n<class 'float'>\n<class 'str'>",
      checks: ['Prints the type of `value1`, `value2` and `value3`', 'One per line, in that order'],
      hint: 'Copy the `print(type(value1))` line twice and change the name inside.',
      explanation: '`type(value)` returns the value’s type object, and printing a type shows `<class \'…\'>`. So three calls — `print(type(value1))`, `print(type(value2))`, `print(type(value3))` — print `int`, `float` and `str` in turn.',
    },
    {
      kind: 'mcq',
      prompt: 'Why can Python Forge run your code offline on both Windows and Android?',
      options: [
        { text: 'It sends your code to a server, which runs it and sends back the output', why: 'That would need internet. The code runs on your device.' },
        { text: 'It translates Python into JavaScript', why: 'No translation to JavaScript happens — the real CPython interpreter runs.' },
        { text: 'It includes CPython compiled to WebAssembly (Pyodide), which runs inside the app on any platform', correct: true, why: 'Right. WebAssembly is portable, so one build of the interpreter works on both platforms.' },
        { text: 'Windows and Android both have Python built into the operating system', why: 'Neither ships Python by default.' },
      ],
      explanation: 'The app bundles Pyodide — CPython compiled to WebAssembly. Because WebAssembly is a portable instruction format, the same interpreter runs inside the app on Windows and Android, with no internet and no installation.',
    },
  ],
  takeaways: [
    'CPython runs a program in four stages: tokenize → parse into an AST → compile to bytecode → execute on a stack-based virtual machine.',
    'Python is compiled too — to portable bytecode, at run time — and `.pyc` files in `__pycache__` cache the bytecode of imported modules.',
    'Every value is an object with a type, a value and an identity; variables are labels tied to objects, and assignment never copies.',
    'Python is dynamically typed (types live on values, checked at run time) and strongly typed (no silent conversions: `"3" + 4` is a `TypeError`).',
    'Reference counting plus a cycle collector manage memory; the GIL lets one thread run bytecode at a time in the standard build.',
    'Pure Python is slower than C++ because of per-operation overhead; fast Python hands bulk work to C/C++/CUDA libraries like NumPy and PyTorch.',
    'This app runs Pyodide — CPython compiled to WebAssembly — so your code runs offline on any device.',
  ],
  reading: [
    { title: 'The Python Language Reference: Execution model', url: 'https://docs.python.org/3/reference/executionmodel.html', source: 'docs', note: 'The official description of how names, blocks and scopes work when code runs.' },
    { title: 'dis — Disassembler for Python bytecode', url: 'https://docs.python.org/3/library/dis.html', source: 'docs', note: 'Use it on your own functions to see the bytecode, and look up any instruction.' },
    { title: 'ast — Abstract Syntax Trees', url: 'https://docs.python.org/3/library/ast.html', source: 'docs', note: 'The tree the parser builds; the basis of linters, formatters and code-generation tools.' },
    { title: 'Data model: Objects, values and types', url: 'https://docs.python.org/3/reference/datamodel.html#objects-values-and-types', source: 'docs', note: 'The reference’s definition of identity, type and value — short and worth reading now.' },
    { title: 'PEP 659 – Specializing Adaptive Interpreter', url: 'https://peps.python.org/pep-0659/', source: 'pep', note: 'How CPython 3.11 got so much faster by rewriting bytecode as it runs.' },
    { title: 'Pyodide documentation', url: 'https://pyodide.org/en/stable/', source: 'docs', note: 'The project that runs Python inside this app — and inside many browser-based notebooks.' },
  ],
};
