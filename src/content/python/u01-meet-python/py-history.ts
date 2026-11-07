import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-history',
  title: 'The Story of Python',
  summary: 'From a Christmas hobby project in Amsterdam to the world’s most popular programming language — and why its history still shapes the code you write.',
  minutes: 16,
  objectives: [
    'Explain who created Python, when, where and why',
    'Describe the design ideas Python inherited from ABC and the Zen of Python',
    'Recognize the major milestones: 0.9 (1991), 2.0 (2000), 3.0 (2008) and the yearly releases since 2020',
    'Explain why Python 3 deliberately broke compatibility, and spot Python 2 code in old tutorials',
    'Describe how Python is governed today: PEPs, the Steering Council and the Python Software Foundation',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A hobby project over Christmas',
      blocks: [
        {
          type: 'p',
          text: 'In December 1989, a Dutch programmer named **Guido van Rossum** was working at CWI (Centrum Wiskunde & Informatica), the national research institute for mathematics and computer science in Amsterdam. The office was closed for the Christmas holidays, and he wanted a project to keep him busy. He decided to write an interpreter for a new scripting language — one that would sit between the shell scripts of Unix and the power of C.',
        },
        {
          type: 'p',
          text: 'He had a concrete need, too. His group was building **Amoeba**, a distributed operating system, and system administration in C was slow and painful. Guido wanted something you could write quickly, that read clearly, and that could still call into C when you needed speed. That combination — *easy to write, easy to read, able to reach down into C* — is still the heart of Python today.',
        },
        {
          type: 'callout',
          variant: 'history',
          title: 'Where the name comes from',
          text: 'Python is not named after the snake. Guido was reading the scripts of *Monty Python’s Flying Circus*, the 1970s BBC comedy show, and wanted a name that was short, unique and slightly irreverent. That’s why Python examples traditionally use `spam` and `eggs` instead of `foo` and `bar` — a nod to a famous Monty Python sketch.',
        },
        {
          type: 'p',
          text: 'He posted the first public version, **Python 0.9.0**, to the Usenet newsgroup `alt.sources` in **February 1991**. Even that first release already had classes with inheritance, exception handling, functions, a module system, and the core types you will use every day: lists, dictionaries and strings. A lot of 1991 Python would still run, almost unchanged, on a modern interpreter.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a "scripting" language?',
          text: 'In 1989, programmers mostly chose between *systems languages* such as C — fast, but verbose and easy to crash — and *shell scripts* — quick, but clumsy for anything bigger than a few lines. Guido aimed for the gap: a language as quick to write as a script but structured enough for real programs. Thirty-five years later, that gap turned out to contain most of the world’s programming.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is Python named after?',
      options: [
        { text: 'The python snake, because the language "wraps around" other languages', why: 'A popular guess, and the logo has two snakes — but the name came first, and it isn’t from the animal.' },
        { text: 'The British comedy show *Monty Python’s Flying Circus*', correct: true, why: 'Right. Guido wanted a short, slightly irreverent name, and he was a fan of the show.' },
        { text: 'An acronym for "Programming Your Tasks Handily On Nix"', why: 'Python isn’t an acronym at all.' },
        { text: 'The Greek mythological serpent Python, guardian of Delphi', why: 'A nice story, but not the real one.' },
      ],
      explanation: 'Python is named after *Monty Python’s Flying Circus*. That’s why the official docs use `spam`, `eggs` and `ham` as example names — and why you’ll find the occasional Monty Python joke in Python’s own documentation.',
    },
    {
      kind: 'concept',
      title: 'Designed for humans: lessons from ABC',
      blocks: [
        {
          type: 'p',
          text: 'Before Python, Guido spent several years at CWI working on **ABC**, a language designed to teach programming to non-experts. ABC had brilliant ideas — clean syntax, powerful built-in data types, and *indentation* to group statements instead of braces — but it was a closed world: hard to extend, unable to talk to the operating system, and it never caught on.',
        },
        {
          type: 'p',
          text: 'Python kept ABC’s best ideas and fixed its weaknesses. It kept the readability and the use of [[indentation]] to show structure. It added what ABC lacked: easy extension with modules written in C, direct access to files and the operating system, and an open, practical attitude. Compare how a C++ programmer and a Python programmer write the same check:',
        },
        {
          type: 'compare',
          left: {
            title: 'C++: braces mark the block',
            tone: 'neutral',
            code: 'if (health <= 0) {\n    std::cout << "Game over\\n";\n    lives -= 1;\n}',
            lang: 'cpp',
          },
          right: {
            title: 'Python: indentation marks the block',
            tone: 'neutral',
            code: 'if health <= 0:\n    print("Game over")\n    lives -= 1',
            lang: 'python',
          },
        },
        {
          type: 'p',
          text: 'In C++ the indentation is only for humans — the compiler reads the braces. In Python the indentation *is* the structure. That sounds strict, but it means the code always looks the way it behaves: you can never have a block that is indented one way and actually grouped another way.',
        },
        {
          type: 'p',
          text: 'Python’s design philosophy was later written down by core developer Tim Peters as **[[zen-of-python|The Zen of Python]]** — nineteen short aphorisms hidden inside Python itself. Type `import this` in any Python interpreter:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> import this\nThe Zen of Python, by Tim Peters\n\nBeautiful is better than ugly.\nExplicit is better than implicit.\nSimple is better than complex.\n...\nReadability counts.\n...',
          annotations: [
            { lines: 1, text: 'The `this` module prints the Zen when imported — an Easter egg added in 2001 (it is PEP 20).' },
            { lines: 6, text: '"Explicit is better than implicit" explains many Python choices: you convert types yourself, and `self` is written out in methods.' },
            { lines: 9, text: 'The most quoted line. Code is read far more often than it is written, so Python optimizes for the reader.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'You already know C++, so expect Python to feel *looser* in some ways (no type declarations, no compile step) and *stricter* in others (indentation matters, and it refuses to silently convert `"3" + 4`). Both come from the same goal: code that says exactly what it does.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'In Python, indentation is just a style convention — like in C++, you could put everything on the left margin and the program would behave the same.',
      answer: false,
      explanation: 'False. Python uses indentation to decide which statements belong to an `if`, a loop or a function. Remove the indentation and you either get an `IndentationError` or a program that does something different. (In C++, braces decide structure and indentation is only for readers.)',
    },
    {
      kind: 'concept',
      title: 'Growing up: 1991 to 2008',
      blocks: [
        {
          type: 'p',
          text: 'Python spread through Usenet and early mailing lists. The community grew around Guido, who held the informal title **[[bdfl|BDFL]]** — "Benevolent Dictator For Life" — meaning everyone could propose ideas, but he made the final call.',
        },
        {
          type: 'table',
          headers: ['Year', 'Milestone', 'Why it mattered'],
          rows: [
            ['1991', 'Python 0.9.0 posted to `alt.sources`', 'Classes, exceptions, modules, lists, dicts and strings from day one'],
            ['1994', 'Python 1.0', 'Added `lambda`, `map`, `filter` and `reduce` — functional tools contributed by a Lisp fan'],
            ['2000', 'Python 2.0', 'List comprehensions, a garbage collector for reference cycles, Unicode strings, and a more open, community-driven process'],
            ['2000', 'The PEP process begins', 'New features are proposed in public design documents called [[pep|PEPs]]'],
            ['2001', 'Python Software Foundation founded', 'A non-profit ([[psf|PSF]]) now owns Python’s intellectual property and protects its open-source license'],
            ['2008', 'Python 3.0 released (December)', 'A deliberate clean-up that broke backward compatibility — more on the next card'],
          ],
          caption: 'The early milestones. Python 2.x and 3.x then lived side by side for over a decade.',
        },
        {
          type: 'p',
          text: 'A **PEP** (Python Enhancement Proposal) is a public document that proposes a change, explains the motivation, considers alternatives and records the decision. It’s why Python’s evolution is unusually well documented: you can read the reasoning behind nearly every feature at [peps.python.org](https://peps.python.org/). You’ll meet several famous PEPs in this course — PEP 8 (style), PEP 20 (the Zen), PEP 484 (type hints).',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Python in games, early on',
          text: 'Game studios noticed Python early because it is easy to *embed* in a C++ engine as a scripting language. DICE’s **Battlefield 2** (2005) used Python for much of its game logic and all of its mod support; CCP’s **EVE Online** runs on Stackless Python; **Civilization IV** and **The Sims 4** use Python for gameplay scripting. Today Python is everywhere in game *pipelines* — Blender, Maya, Houdini and build tools are scripted in it.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put these events in chronological order, earliest first.',
      lines: [
        'Guido starts writing Python over the Christmas holidays',
        'Python 0.9.0 is posted to `alt.sources`',
        'Python 2.0 adds list comprehensions and Unicode strings',
        'Python 3.0 is released, breaking backward compatibility',
        'Python 2 reaches end of life',
      ],
      explanation: 'December 1989 (the hobby project) → February 1991 (0.9.0) → October 2000 (2.0) → December 2008 (3.0) → January 1, 2020 (Python 2’s end of life). Note how long the 2-to-3 transition took: more than eleven years.',
    },
    {
      kind: 'concept',
      title: 'Python 3: breaking things on purpose',
      blocks: [
        {
          type: 'p',
          text: 'By the mid-2000s Python had accumulated design mistakes that couldn’t be fixed without breaking old code. The biggest was text: in Python 2, a `str` was really a sequence of *bytes*, and Unicode text was a separate type. Programs worked fine in English and then crashed the moment a user typed "José" or "Привет". Guido decided to fix the mistakes all at once, in a release nicknamed "Python 3000".',
        },
        {
          type: 'table',
          headers: ['Python 2', 'Python 3', 'What changed'],
          rows: [
            ['`print "hello"`', '`print("hello")`', '`print` became an ordinary function'],
            ['`7 / 2` gives `3`', '`7 / 2` gives `3.5`', '`/` is true division; `//` is floor division'],
            ['`str` = bytes, `unicode` = text', '`str` = Unicode text, `bytes` = raw bytes', 'Text and binary data are separate, explicit types'],
            ['`raw_input()` and `input()`', 'just `input()`', 'One safe way to read a line of text'],
            ['`xrange()`', '`range()`', 'The lazy version took the simpler name'],
          ],
          caption: 'The changes you’re most likely to notice in old code.',
        },
        {
          type: 'p',
          text: 'Python 3.0 shipped in **December 2008**, and the transition was famously slow. Big libraries had to be ported before their users could move, so for years most real code stayed on Python 2.7. Python 2 finally reached its official **end of life on January 1, 2020**. Today, Python 2 is history — but old tutorials, Stack Overflow answers and books still show its syntax.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Spotting Python 2 code',
          text: 'If you see `print "something"` without parentheses, `raw_input()`, `xrange()`, or `u"text"` prefixes everywhere, you’re reading Python 2. Look for a newer source instead of translating it — the advice may be outdated in other ways too.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just keep both behaviors forever?',
          text: 'Backward compatibility is valuable, but carrying broken designs forever has a cost: every new learner hits the same traps, and every library must work around them. The Python 3 break was painful for a decade so that the next several decades would be cleaner. The lesson the core team took from it is the opposite one, though: there will be **no Python 4-style break**. Changes now arrive gradually, with deprecation warnings years in advance.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'This is Python 3. What does it print? (Python 2 would have printed something different on the first line.)',
      code: 'print(7 / 2)\nprint(7 // 2)\nprint("Python", 3)',
      answer: '3.5\n3\nPython 3',
      hint: 'In Python 3, `/` always gives a true (decimal) answer and `//` rounds down to a whole number. `print` puts a space between the things you give it.',
      explanation: '`7 / 2` is true division, so it prints `3.5` (Python 2 printed `3`). `7 // 2` is *floor division*: divide and round down, giving `3`. Finally, `print` with two arguments separates them with a space: `Python 3`.',
    },
    {
      kind: 'code',
      prompt: 'This line is Python 2 code, so it is a `SyntaxError` in Python 3. Fix it so the program prints exactly:\n\n`Hello from Python 3`',
      starter: 'print "Hello from Python 2"',
      solution: 'print("Hello from Python 3")',
      tests: '',
      expectOutput: 'Hello from Python 3',
      checks: ['Uses `print(...)` as a function, with parentheses', 'Prints exactly `Hello from Python 3`'],
      hint: 'In Python 3, `print` is a function, so the text goes inside parentheses: `print("...")`. Don’t forget to change the 2 to a 3.',
      explanation: 'In Python 3, `print` is a function like any other, so its argument goes in parentheses: `print("Hello from Python 3")`. Press **Try it** first to see the `SyntaxError` Python 3 gives for the old form — it even suggests the fix.',
    },
    {
      kind: 'concept',
      title: 'Who decides? From BDFL to Steering Council',
      blocks: [
        {
          type: 'p',
          text: 'For almost thirty years Guido had the final word on every change. That changed in **July 2018**, after a long and heated debate over [PEP 572](https://peps.python.org/pep-0572/), which added the *assignment expression* operator `:=` (nicknamed the **walrus operator** because `:=` looks like a walrus lying on its side). Exhausted by the arguments, Guido accepted the PEP and then stepped down as BDFL.',
        },
        {
          type: 'code',
          title: 'walrus.py',
          runnable: true,
          code: 'words = ["spam", "eggs", "Holy Grail", "ni"]\n\n# := assigns AND gives back the value, inside an expression\nfor w in words:\n    if (n := len(w)) > 4:\n        print(f"{w!r} is long: {n} characters")',
          output: "'Holy Grail' is long: 10 characters",
          annotations: [
            { lines: 5, text: '`n := len(w)` stores the length in `n` *and* uses it in the comparison, so `len` is only called once. You’ll learn loops, `if` and f-strings soon — for now, just notice the operator that changed Python’s governance.' },
          ],
        },
        {
          type: 'p',
          text: 'The core developers then voted on a new model, and since early 2019 Python has been governed by a **five-person [[steering-council|Steering Council]]**, elected by the core developers after every major release ([PEP 13](https://peps.python.org/pep-0013/)). Guido served on the first council and remains an active core developer.',
        },
        {
          type: 'list',
          items: [
            '**Core developers** — about a hundred volunteers and sponsored engineers with commit rights to CPython.',
            '**The Steering Council** — accepts or rejects PEPs and resolves disputes.',
            '**The [[psf|Python Software Foundation]]** — the non-profit that owns the trademark, runs python.org and the Python Package Index ([[pypi|PyPI]]), funds development and organizes PyCon US.',
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Python is [[open-source|open source]] under the PSF License. Anyone can read CPython’s source on GitHub, report bugs, or propose a PEP — and companies such as Microsoft, Meta, Google and Bloomberg pay engineers to work on it.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the sentence about how Python changes.',
      template: 'New features are proposed in a ___ (a Python Enhancement Proposal). Since 2019 the final decision belongs to the ___, which replaced the ___ model.',
      blanks: [{ answers: ['PEP'] }, { answers: ['Steering Council'] }, { answers: ['BDFL'] }],
      wordBank: ['PEP', 'Steering Council', 'BDFL', 'PSF', 'PyPI', 'CPython'],
      explanation: 'A **PEP** is the design document for a change. The five-person **Steering Council** decides on PEPs; it replaced the **BDFL** ("Benevolent Dictator For Life") model when Guido stepped down in 2018. The PSF is the non-profit behind Python, PyPI is the package index, and CPython is the interpreter.',
    },
    {
      kind: 'concept',
      title: 'Modern Python: a new version every October',
      blocks: [
        {
          type: 'p',
          text: 'Since Python 3.9 (October 2020) a new feature release comes out **every October** ([PEP 602](https://peps.python.org/pep-0602/)), and each version receives fixes and security patches for about five years. That steady rhythm replaced the old "big bang" releases. Some highlights:',
        },
        {
          type: 'table',
          headers: ['Version', 'Released', 'Headline features'],
          rows: [
            ['3.10', 'Oct 2021', 'Structural pattern matching (`match` / `case`), much better error messages'],
            ['3.11', 'Oct 2022', 'The "Faster CPython" release: roughly 25% faster on average, fine-grained error locations'],
            ['3.12', 'Oct 2023', 'More flexible f-strings, new syntax for generic types (`def f[T](x: T)`)'],
            ['3.13', 'Oct 2024', 'A new interactive REPL with colors and multi-line editing, an experimental JIT, and an experimental *free-threaded* build without the [[gil|GIL]]'],
            ['3.14', 'Oct 2025', 'Free-threaded Python officially supported, template strings (t-strings), lazily evaluated annotations'],
            ['3.15', 'Oct 2026', 'Explicit lazy imports, a built-in `frozendict`, UTF-8 as the default text encoding, a new sampling profiler'],
          ],
          caption: 'You’ll use features from all of these releases in this course.',
        },
        {
          type: 'p',
          text: 'The Python built into this app is **3.14**, which covers everything in this course. On your own PC you’ll usually want a recent release — the setup lesson in this unit walks you through it.',
        },
        {
          type: 'code',
          title: 'version_check.py',
          runnable: true,
          code: 'import sys\n\nmajor, minor = sys.version_info[:2]\nprint("Major version:", major)\nprint("Modern enough for this course:", (major, minor) >= (3, 10))',
          output: 'Major version: 3\nModern enough for this course: True',
          annotations: [
            { lines: 1, text: '`sys` is a [[standard-library]] module with information about the running interpreter.' },
            { lines: 3, text: '`sys.version_info` holds the version numbers. `[:2]` takes the first two — you’ll learn this *slicing* soon.' },
            { lines: 5, text: 'Tuples compare item by item, so `(3, 14) >= (3, 10)` is `True`. Press **Run** to try it on the app’s Python.' },
          ],
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'In interviews and on the job',
          text: 'Teams pin a specific Python version per project (for example "3.12 or newer"), because libraries — especially machine-learning ones like PyTorch — support new Python versions a few months after release. Knowing *why* a project uses an older version, and what features you can rely on, is a real-world skill.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which statement about Python versions today is correct?',
      options: [
        { text: 'Python 2 and Python 3 are both actively maintained; you choose based on taste', why: 'Python 2 reached end of life on January 1, 2020. It gets no fixes, not even security patches.' },
        { text: 'A new Python 3 feature release arrives every October, and old versions are supported for about five years', correct: true, why: 'Correct — that is the PEP 602 schedule, in place since Python 3.9.' },
        { text: 'Python 4 is planned soon and will break compatibility like Python 3 did', why: 'The core developers have said the opposite: after the painful 2-to-3 transition, changes now arrive gradually with long deprecation periods.' },
        { text: 'Each new version is only supported until the next one comes out a year later', why: 'Versions overlap: each gets about two years of bug fixes and then security fixes, roughly five years in total.' },
      ],
      explanation: 'Since 3.9, Python has released a new 3.x version every October, and each is supported for about five years. Python 2 is dead (end of life 2020), and there are no plans for a Python 4 that breaks everything.',
    },
    {
      kind: 'concept',
      title: 'Why Python won',
      blocks: [
        {
          type: 'p',
          text: 'Python is now one of the most widely used programming languages on Earth. It has topped the TIOBE popularity index since late 2021, and in 2024 it overtook JavaScript as the most-used language on GitHub. That wasn’t luck. Several design choices compounded over decades:',
        },
        {
          type: 'steps',
          items: [
            { title: 'Readable code', text: 'Python reads close to pseudocode, which made it the default teaching language in universities — so every new generation of programmers already knew it.' },
            { title: 'Batteries included', text: 'A huge [[standard-library]] ships with every install: files, JSON, networking, dates, math, testing and more, with nothing to download.' },
            { title: 'A glue language', text: 'Python calls C, C++ and Fortran libraries easily. Scientists wrapped their fast numerical code in friendly Python interfaces, and NumPy, SciPy and later PyTorch were born.' },
            { title: 'An enormous ecosystem', text: 'Over half a million packages on PyPI cover web development, automation, data science, AI, games and hardware.' },
            { title: 'Right place, right time', text: 'When data science and deep learning exploded in the 2010s, the best tools were already in Python. Today almost all AI research code is written in it.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'Think of Python as a universal remote control. The heavy lifting — matrix math on a GPU, video decoding, database engines — is done by fast machinery written in C, C++ or CUDA. Python is the friendly interface on top that lets you combine all of it in a few readable lines.',
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'The "glue" design has a cost: pure Python code is much slower than C++ (often 10–100× for tight loops). The way around it is to push heavy work into libraries written in compiled languages — which is exactly what NumPy and PyTorch do. You’ll see how and why in the next lesson.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'One of these statements about Python’s history is false. Tap it.',
      lines: [
        'Guido van Rossum started Python in December 1989 at CWI in Amsterdam.',
        'Python borrowed the idea of grouping statements by indentation from ABC.',
        'Python 3.0 was fully backward compatible, so Python 2 code ran unchanged.',
        'Guido stepped down as BDFL in 2018 after the debate over PEP 572.',
        'Since 2019 a five-person Steering Council has governed Python.',
      ],
      errorLines: [3],
      explanation: 'Statement 3 is false: Python 3.0 *deliberately broke* backward compatibility — `print` became a function, `/` became true division and `str` became Unicode text. That’s why the transition from Python 2 took more than a decade. Every other statement is true.',
    },
  ],
  takeaways: [
    'Guido van Rossum began Python in December 1989 at CWI in Amsterdam; 0.9.0 was released in February 1991. It is named after *Monty Python’s Flying Circus*.',
    'Python inherited readability and indentation-based blocks from ABC, and added easy C extensions and access to the operating system.',
    'The Zen of Python (`import this`) sums up the philosophy: readability counts, explicit is better than implicit.',
    'Python 3.0 (2008) broke compatibility to fix text handling, `print` and division; Python 2 reached end of life on January 1, 2020.',
    'Changes go through public PEPs; since 2019 a five-person Steering Council decides, and the non-profit PSF owns Python and runs PyPI.',
    'A new Python 3.x arrives every October and is supported for about five years. This app runs Python 3.14.',
  ],
  reading: [
    { title: 'The History of Python (Guido’s blog)', url: 'https://python-history.blogspot.com/', source: 'article', note: 'Guido van Rossum’s own series on how Python’s features came to be — the origin of the language, straight from its creator.' },
    { title: 'History of Python', url: 'https://en.wikipedia.org/wiki/History_of_Python', source: 'wikipedia', note: 'A well-sourced timeline of every major version and the people behind them.' },
    { title: 'PEP 20 – The Zen of Python', url: 'https://peps.python.org/pep-0020/', source: 'pep', note: 'The nineteen aphorisms in full, plus the Easter egg that prints them.' },
    { title: 'PEP 13 – Python Language Governance', url: 'https://peps.python.org/pep-0013/', source: 'pep', note: 'How the Steering Council is elected and what it can decide.' },
    { title: 'What’s New in Python', url: 'https://docs.python.org/3/whatsnew/index.html', source: 'docs', note: 'The official summary of every release’s new features — skim the latest one to see where the language is going.' },
    { title: 'Status of Python versions', url: 'https://devguide.python.org/versions/', source: 'docs', note: 'Which versions are supported right now and until when.' },
  ],
};
