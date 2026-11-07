import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-docs',
  title: 'Docs, References and How to Get Unstuck',
  summary: 'Find answers fast: navigate the official documentation, read function signatures, use help() and dir(), decode error messages, search and ask well — plus the best books, courses and channels.',
  minutes: 15,
  objectives: [
    'Navigate docs.python.org: the Tutorial, Library Reference, Language Reference, HOWTOs and What’s New',
    'Read a function signature and use keyword arguments and defaults correctly',
    'Explore any object with `help()`, `dir()` and `type()`',
    'Read a traceback from the bottom up and act on Python’s "Did you mean…?" suggestions',
    'Search effectively, judge whether an answer is current, and pick good learning resources',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The official documentation is your best friend',
      blocks: [
        {
          type: 'p',
          text: 'Python has some of the best documentation of any language, all free at **[docs.python.org](https://docs.python.org/3/)**. It’s written by the people who build Python and updated for every release. Experienced developers read it constantly — not because they’ve forgotten everything, but because it’s the fastest route to a *correct* answer. It has several distinct parts:',
        },
        {
          type: 'table',
          headers: ['Section', 'Use it for', 'Example question'],
          rows: [
            ['**Tutorial**', 'A guided tour of the language for newcomers', '"How do `for` loops work?"'],
            ['**Library Reference**', 'Every built-in function, type and standard-library module', '"What arguments does `random.choice` take?"'],
            ['**Language Reference**', 'The precise rules of the syntax and semantics', '"Exactly when is a `finally` block executed?"'],
            ['**HOWTOs**', 'In-depth guides to specific topics', 'Sorting, logging, regular expressions, Unicode'],
            ['**What’s New**', 'Every release’s changes, with examples', '"What did Python 3.14 add?"'],
            ['**Glossary**', 'Short definitions of Python terms', '"What is an *iterable*?"'],
          ],
          caption: 'The version switcher at the top of every page matters: make sure it matches the Python you’re running.',
        },
        {
          type: 'p',
          text: 'You’ll spend most of your time in the **Library Reference**. Bookmark two pages now: [Built-in Functions](https://docs.python.org/3/library/functions.html) (the ~70 functions always available, like `print`, `len` and `input`) and [Built-in Types](https://docs.python.org/3/library/stdtypes.html) (everything you can do with numbers, strings, lists and dictionaries).',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Searching the web for "python docs round" is often faster than navigating. Prefer results on `docs.python.org/3/` — a URL with `/2/` is Python 2 documentation, which is badly out of date.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You want to know exactly which arguments `random.choice` accepts. Which part of the documentation should you look in?',
      options: [
        { text: 'The Tutorial', why: 'The Tutorial teaches concepts; it doesn’t list every module’s functions.' },
        { text: 'The Library Reference, under the `random` module', correct: true, why: 'Right — every standard-library module has a page in the Library Reference describing each function.' },
        { text: 'The Language Reference', why: 'That covers the language’s syntax and rules, not individual library functions.' },
        { text: 'What’s New', why: 'What’s New only lists changes between versions.' },
      ],
      explanation: 'Functions and modules are documented in the **Library Reference**. `random.choice` is on the page for the `random` module — search for "python docs random" and you’ll land right on it.',
    },
    {
      kind: 'concept',
      title: 'Reading a function signature',
      blocks: [
        {
          type: 'p',
          text: 'Every function in the docs starts with its **signature**: its name and the [[argument|arguments]] it accepts. Learning to read signatures unlocks the whole reference. Here’s the one for `print`:',
        },
        {
          type: 'code',
          lang: 'text',
          code: 'print(*objects, sep=\' \', end=\'\\n\', file=None, flush=False)',
          annotations: [
            { lines: 1, text: '`*objects` — any number of positional values. `sep=\' \'` and `end=\'\\n\'` are **parameters with defaults**: if you don’t pass them, `print` separates values with a space and ends with a newline. Parameters after `*objects` can only be passed **by name** (keyword arguments).' },
          ],
        },
        {
          type: 'code',
          title: 'signature.py',
          runnable: true,
          code: 'print("HP", 75, "of", 100)\nprint("HP", 75, "of", 100, sep="")\nprint("Loading", end="...")\nprint("done!")\nprint(round(3.14159), round(3.14159, 2))',
          output: 'HP 75 of 100\nHP75of100\nLoading...done!\n3 3.14',
          annotations: [
            { lines: 1, text: 'Four positional values, joined by the default separator, a space.' },
            { lines: 2, text: '`sep=""` overrides the default: no separator at all.' },
            { lines: '3-4', text: '`end="..."` replaces the newline, so the next `print` continues on the same line.' },
            { lines: 5, text: 'The signature is `round(number, ndigits=None)`: with no `ndigits` you get a whole number; with `ndigits=2` you get two decimal places.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why defaults and keyword arguments?',
          text: 'Most calls want the common behavior, so defaults keep everyday code short: `print(x)`. When you *do* need something unusual, a keyword argument names it explicitly — `print(x, end="")` is self-explanatory, whereas a mystery positional value would not be. That’s the Zen again: *explicit is better than implicit*.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Use what the `print` signature tells you to predict the output.',
      code: 'print("a", "b", "c", sep="-", end="!\\n")\nprint("x", end="")\nprint("y")',
      answer: 'a-b-c!\nxy',
      hint: '`sep` goes *between* values, `end` goes after the last one. An empty `end` means no newline.',
      explanation: 'The first call joins the three values with `-` and ends with `!` plus a newline: `a-b-c!`. The second prints `x` with `end=""`, so no newline follows, and the third prints `y` right after it, then the default newline: `xy`.',
    },
    {
      kind: 'concept',
      title: 'Ask Python itself: help(), dir() and type()',
      blocks: [
        {
          type: 'p',
          text: 'You don’t always need a browser — Python can describe itself. Three built-in functions answer most "what is this and what can it do?" questions:',
        },
        {
          type: 'list',
          items: [
            '`type(x)` — what kind of object is `x`?',
            '`dir(x)` — which names (attributes and [[method|methods]]) does `x` have?',
            '`help(x)` — show the documentation for `x`: a function, a type, a module, even a keyword like `help("for")`.',
          ],
        },
        {
          type: 'code',
          title: 'explore.py',
          runnable: true,
          code: 'word = "python"\nprint(type(word))\nprint(dir(word)[-8:])\nprint(len.__doc__)',
          output: "<class 'str'>\n['splitlines', 'startswith', 'strip', 'swapcase', 'title', 'translate', 'upper', 'zfill']\nReturn the number of items in a container.",
          annotations: [
            { lines: 3, text: '`dir` returns a sorted list of names. `[-8:]` takes the last eight — methods you can call on any string, like `word.upper()`. Names starting with `__` are special methods; skip those for now.' },
            { lines: 4, text: 'Every function carries its own documentation as a [[docstring]] in `__doc__`. `help(len)` shows the same text, nicely formatted.' },
          ],
        },
        {
          type: 'p',
          text: 'In the REPL, `help()` with no argument starts an interactive help system: type `modules` to list every installed module, `keywords` for the language’s keywords, or any name to look it up. In VS Code, hovering over a name shows the same docs, and Ctrl+click jumps to the source.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Error messages are help, not punishment',
      blocks: [
        {
          type: 'p',
          text: 'Beginners often see a red [[traceback]] and panic. Experienced developers see a precise bug report. Modern Python (3.10 and later) writes especially good error messages, often with a suggestion. Read them **from the bottom up**:',
        },
        {
          type: 'code',
          title: 'typo.py',
          runnable: true,
          code: 'score = 10\nbonus = 5\nprint(scroe + bonus)',
          output: "Traceback (most recent call last):\n  File \"main.py\", line 3, in <module>\n    print(scroe + bonus)\n          ^^^^^\nNameError: name 'scroe' is not defined. Did you mean: 'score'?",
          annotations: [
            { lines: 3, text: 'The bug: `scroe` instead of `score`. Press **Run** to see the traceback in the console.' },
          ],
        },
        {
          type: 'steps',
          items: [
            { title: 'Last line: what went wrong', text: '`NameError: name \'scroe\' is not defined. Did you mean: \'score\'?` — the exception type, the message, and here even the fix.' },
            { title: 'The lines above: where', text: '`File "main.py", line 3` and the code itself, with `^^^^^` under the exact culprit.' },
            { title: 'Further up: how you got there', text: 'In bigger programs the traceback lists the chain of function calls, most recent last. Find the first frame that is *your* code.' },
          ],
        },
        {
          type: 'table',
          headers: ['Error', 'Usually means'],
          rows: [
            ['`SyntaxError`', 'The code breaks Python’s grammar: missing `:` or `)`, an unclosed quote'],
            ['`IndentationError`', 'The indentation doesn’t match the structure'],
            ['`NameError`', 'A name is used before it’s defined, or it’s misspelled'],
            ['`TypeError`', 'An operation was given the wrong type, e.g. `"3" + 4`'],
            ['`ValueError`', 'Right type, bad value, e.g. `int("ten")`'],
            ['`ZeroDivisionError`', 'Division by zero'],
          ],
          caption: 'The errors you’ll meet most in the next few units.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'When searching for an error, paste the **last line** (the exception and message), remove details unique to your code such as variable names, and add "python". Someone has almost certainly had the same problem.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This program crashes with `NameError: name \'Lives\' is not defined. Did you mean: \'lives\'?`. Tap the line with the bug.',
      lines: ['lives = 3', 'damage = 1', 'lives = lives - damage', 'print("Lives left:", Lives)'],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Python names are case-sensitive: `lives` and `Lives` are different names. Line 4 uses `Lives`, which was never defined, so Python raises `NameError` — and suggests `lives`. The fix is `print("Lives left:", lives)`.',
    },
    {
      kind: 'concept',
      title: 'Searching and asking well',
      blocks: [
        {
          type: 'p',
          text: 'Getting unstuck is a skill you can practice. A good workflow:',
        },
        {
          type: 'steps',
          items: [
            { title: 'Read the error message', text: 'Really read it, bottom line first. Half of all bugs are solved here.' },
            { title: 'Reproduce it small', text: 'Shrink the problem to the fewest lines that still show it (a *minimal reproducible example*). Often you find the bug while doing this.' },
            { title: 'Check the docs', text: 'Look up the function or type involved in the Library Reference.' },
            { title: 'Search', text: 'Search the error message or the task ("python sort list of dicts by key"). Check the date and version of every answer.' },
            { title: 'Ask', text: 'Ask a person, a forum (Stack Overflow, Python Discord, discuss.python.org) or an AI assistant — with your minimal example, the full error, and what you expected.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Old answers age badly',
          text: 'A 2012 Stack Overflow answer may be Python 2, or may recommend something that has a much better modern replacement (`os.path` vs `pathlib`, `%` formatting vs f-strings). Prefer recent answers and the official docs.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Using AI assistants to learn',
          text: 'AI assistants are excellent tutors when you ask *why*: "explain this traceback", "what does `end=` do here?", "what’s wrong with my approach?". They can be confidently wrong, so test what they tell you in the REPL or the Code tab. And ask for explanations, not just finished code — you learn by writing it yourself.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: '**Rubber duck debugging**: explain your code, line by line, out loud to a rubber duck (or a patient friend). Saying what each line *should* do makes you notice what it actually does.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put a good "I’m stuck" workflow in order.',
      lines: [
        'Read the error message, starting from the last line',
        'Shrink the problem to a minimal example that still fails',
        'Look up the functions involved in the official docs',
        'Search for the error message and check the answers are current',
        'Ask for help with your minimal example and the full error',
      ],
      explanation: 'Start with the information you already have (the error), make the problem small, consult the authoritative source, then search, and finally ask — bringing a minimal example and the exact error so others can help quickly.',
    },
    {
      kind: 'concept',
      title: 'The best references and learning resources',
      blocks: [
        {
          type: 'p',
          text: 'A curated shelf, from first steps to mastery. You don’t need all of them — pick one per stage.',
        },
        {
          type: 'table',
          headers: ['Resource', 'Type', 'Best for'],
          rows: [
            ['[The Python Tutorial](https://docs.python.org/3/tutorial/)', 'Official docs', 'A concise, authoritative overview of the whole language'],
            ['[Real Python](https://realpython.com/)', 'Articles and videos', 'Clear, practical deep-dives on almost every topic'],
            ['*Python Crash Course* (Eric Matthes)', 'Book', 'Beginners who like projects, including a 2D game'],
            ['*Automate the Boring Stuff* (Al Sweigart)', 'Free online book', 'Practical scripts for everyday tasks'],
            ['[*Think Python*](https://allendowney.github.io/ThinkPython/) (Allen Downey)', 'Free online book', 'Thinking like a computer scientist'],
            ['*Fluent Python* (Luciano Ramalho)', 'Book', 'Intermediate to advanced: idiomatic Python and how it really works'],
            ['*Effective Python* (Brett Slatkin)', 'Book', 'Short, specific rules for writing better Python'],
            ['[PyMOTW-3](https://pymotw.com/3/) (Doug Hellmann)', 'Website', 'Example-driven tour of the standard library, module by module'],
            ['PyCon talks on YouTube', 'Videos', 'Experts explaining topics — Raymond Hettinger’s talks on idiomatic Python are classics'],
            ['[Exercism Python track](https://exercism.org/tracks/python)', 'Practice', 'Free exercises with mentor feedback'],
            ['[Advent of Code](https://adventofcode.com/)', 'Puzzles', 'Fun yearly puzzles that stretch your problem solving'],
          ],
          caption: 'This lesson’s reading list links the free ones directly.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'Reading other people’s good code is one of the fastest ways to improve. The standard library itself is written in Python (find it on GitHub in `python/cpython`, folder `Lib/`) — modules like `pathlib` and `dataclasses` are surprisingly readable.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'The docs say the signature is `round(number, ndigits=None)`. Change the program so it prints π rounded to **3** decimal places:\n\n```\n3.142\n```',
      starter: 'import math\n\nprint(round(math.pi))\n',
      solution: 'import math\n\nprint(round(math.pi, 3))\n',
      tests: '',
      expectOutput: '3.142',
      checks: ['Passes the `ndigits` argument to `round`', 'Prints `3.142`'],
      hint: 'Give `round` a second argument: the number of decimal places.',
      explanation: 'With no `ndigits`, `round` returns the nearest whole number (`3`). Passing `3` as the second argument — `round(math.pi, 3)`, or `round(math.pi, ndigits=3)` — keeps three decimal places: `3.142`.',
    },
    {
      kind: 'fill',
      prompt: 'Which built-in would you use?',
      template: 'To see what kind of object a value is: ___. To list the methods a string has: ___. To read the documentation of a function in the terminal: ___.',
      blanks: [{ answers: ['type()'] }, { answers: ['dir()'] }, { answers: ['help()'] }],
      wordBank: ['type()', 'dir()', 'help()', 'print()', 'len()'],
      explanation: '`type()` names an object’s type, `dir()` lists its attributes and methods, and `help()` shows its documentation. Together they let you explore any object without leaving Python.',
    },
    {
      kind: 'truefalse',
      prompt: 'A highly-voted Stack Overflow answer from 2011 is always a safe guide for modern Python.',
      answer: false,
      explanation: 'False. Votes measure how helpful an answer was *when written*. A 2011 answer may be Python 2, or may predate much better tools (f-strings arrived in 3.6, `pathlib` in 3.4, `match` in 3.10). Check the date, look for newer answers, and confirm in the official docs.',
    },
  ],
  takeaways: [
    'docs.python.org/3 has a Tutorial, Library Reference, Language Reference, HOWTOs, What’s New and a Glossary — the Library Reference is the one you’ll use most.',
    'A signature like `print(*objects, sep=\' \', end=\'\\n\')` tells you the arguments, their defaults, and which must be passed by keyword.',
    '`type()`, `dir()` and `help()` let you explore any object from inside Python.',
    'Read tracebacks bottom-up: the last line says what went wrong, the lines above say where. Python often suggests the fix.',
    'To get unstuck: read the error, make a minimal example, check the docs, search (checking dates), then ask with your example.',
    'Good next resources: Real Python, *Fluent Python*, *Effective Python*, PyMOTW, Exercism and Advent of Code.',
  ],
  reading: [
    { title: 'Python 3 documentation', url: 'https://docs.python.org/3/', source: 'docs', note: 'The home page: tutorial, library and language references, HOWTOs and What’s New.' },
    { title: 'Built-in Functions', url: 'https://docs.python.org/3/library/functions.html', source: 'docs', note: 'Every always-available function, with its signature. Worth skimming once from top to bottom.' },
    { title: 'Python Glossary', url: 'https://docs.python.org/3/glossary.html', source: 'docs', note: 'Official definitions of the terms you’ll see in docs and error messages.' },
    { title: 'Think Python, 3rd edition', url: 'https://allendowney.github.io/ThinkPython/', source: 'book', note: 'A free, thoughtful introduction to programming with Python.' },
    { title: 'Real Python', url: 'https://realpython.com/', source: 'tutorial', note: 'Practical tutorials on almost every Python topic, beginner to advanced.' },
    { title: 'Python Module of the Week (PyMOTW-3)', url: 'https://pymotw.com/3/', source: 'tutorial', note: 'Example-driven explanations of the standard library modules.' },
  ],
};
