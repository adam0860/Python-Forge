import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-logic-truthiness',
  title: 'Logical Operators and Truthiness',
  summary: 'Combine conditions with and, or and not; understand precedence and short-circuiting; learn which values count as false; and avoid the most famous beginner bug in Python.',
  minutes: 16,
  objectives: [
    'Combine conditions with `and`, `or` and `not`, using truth tables to predict results',
    'Apply precedence (`not` before `and` before `or`) and De Morgan’s laws',
    'Use short-circuit evaluation to guard risky expressions',
    'List the falsy values and write idiomatic tests like `if items:` and `if name:`',
    'Explain why `and`/`or` return operands, and use `value or default` carefully',
    'Spot and fix the `x == "a" or "b"` bug',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'and, or, not',
      blocks: [
        {
          type: 'p',
          text: 'Real decisions depend on several facts at once: *the door opens if you have the key **and** you’re close enough*; *you take damage if you touch lava **or** an enemy*. Python’s three logical operators are plain English words:',
        },
        {
          type: 'table',
          headers: ['`a`', '`b`', '`a and b`', '`a or b`', '`not a`'],
          rows: [
            ['`True`', '`True`', '`True`', '`True`', '`False`'],
            ['`True`', '`False`', '`False`', '`True`', '`False`'],
            ['`False`', '`True`', '`False`', '`True`', '`True`'],
            ['`False`', '`False`', '`False`', '`False`', '`True`'],
          ],
          caption: '`and` needs both; `or` needs at least one; `not` flips.',
        },
        {
          type: 'code',
          title: 'door.py',
          runnable: true,
          code: 'has_key = True\nlevel = 7\nprint(has_key and level >= 5)\nprint(has_key and level >= 10)\nprint(has_key or level >= 10)\nprint(not has_key)',
          output: 'True\nFalse\nTrue\nFalse',
          annotations: [
            { lines: 3, text: 'Both parts are true, so `and` gives `True`.' },
            { lines: 4, text: '`7 >= 10` is false, so the whole `and` is false.' },
            { lines: 5, text: '`or` only needs one true part — `has_key` is enough.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'Python spells `&&`, `||` and `!` as `and`, `or` and `not`. The symbols `&` and `|` exist in Python too, but they’re *bitwise* operators (and, in NumPy and pandas, element-wise ones) — not the logical operators you want in an `if`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A trap fires if the player is **not** invisible **and** is standing on the pressure plate. Which condition is right?',
      options: [
        { text: '`not invisible and on_plate`', correct: true, why: 'Right. `not` applies to `invisible` first, then `and` combines it with `on_plate`.' },
        { text: '`not (invisible and on_plate)`', why: 'This is true whenever the player isn’t both invisible *and* on the plate — including when they’re nowhere near it.' },
        { text: '`invisible or on_plate`', why: 'This fires for invisible players anywhere, the opposite of what we want.' },
        { text: '`invisible != on_plate`', why: 'That’s an exclusive-or: it’s also true for an invisible player who is off the plate.' },
      ],
      explanation: '`not` binds tighter than `and`, so `not invisible and on_plate` means `(not invisible) and on_plate`: visible *and* on the plate. Adding parentheses around the whole `and`, as in option 2, changes the meaning completely.',
    },
    {
      kind: 'concept',
      title: 'Precedence and De Morgan’s laws',
      blocks: [
        {
          type: 'p',
          text: 'In an expression, comparisons happen first, then `not`, then `and`, then `or` — like multiplication before addition. When a condition mixes `and` and `or`, add parentheses to make your intent obvious:',
        },
        {
          type: 'code',
          title: 'precedence.py',
          runnable: true,
          code: 'print(True or False and False)\nprint((True or False) and False)',
          output: 'True\nFalse',
          annotations: [
            { lines: 1, text: '`and` first: `False and False` is `False`; then `True or False` is `True`.' },
            { lines: 2, text: 'Parentheses force the `or` first: `True and False` is `False`.' },
          ],
        },
        {
          type: 'p',
          text: 'Two identities, **De Morgan’s laws**, let you rewrite a negated condition — very handy when simplifying an `if`:',
        },
        {
          type: 'theorem',
          name: 'De Morgan’s laws',
          text: '`not (a and b)` is the same as `(not a) or (not b)`\n\n`not (a or b)` is the same as `(not a) and (not b)`',
        },
        {
          type: 'derivation',
          title: 'Simplify "not (alive and armed)"',
          steps: [
            { tex: '\\text{not (alive and armed)}', why: 'We want the condition for "the player can’t fight".' },
            { tex: '= \\text{(not alive) or (not armed)}', why: 'De Morgan: negating an `and` turns it into an `or` of the negations.' },
            { tex: '= \\text{dead or unarmed}', why: 'Read in plain English: the player can’t fight if they’re dead *or* have no weapon — which is obviously right.' },
          ],
          result: 'The two forms always agree. Choose whichever reads more naturally in your code.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does and bind tighter than or?',
          text: 'It mirrors arithmetic: think of `and` as multiplication (both must be 1) and `or` as addition (any 1 makes it non-zero). Mathematicians and C, C++, Java and JavaScript all use the same ordering, so it transfers to every language you’ll learn.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'raining = True\nhas_umbrella = False\nprint(raining and not has_umbrella)\nprint(not raining or has_umbrella)\nprint(raining or has_umbrella and False)',
      answer: 'True\nFalse\nTrue',
      hint: 'Apply `not` first, then `and`, then `or`.',
      explanation: 'Line 3: `not has_umbrella` is `True`, and `True and True` is `True` — you’ll get wet. Line 4: `not raining` is `False`, `False or False` is `False` (De Morgan says this is the opposite of line 3). Line 5: `and` first, `has_umbrella and False` is `False`; then `True or False` is `True`.',
    },
    {
      kind: 'concept',
      title: 'Short-circuit evaluation',
      blocks: [
        {
          type: 'p',
          text: 'Python evaluates `and` and `or` from left to right and **stops as soon as the answer is known**. If the left side of an `and` is false, the whole thing must be false — the right side is never evaluated. If the left side of an `or` is true, the right side is skipped.',
        },
        {
          type: 'code',
          title: 'guard.py',
          runnable: true,
          code: 'kills = 0\nshots_hit = 50\n\nif kills > 0 and shots_hit / kills > 5:\n    print("Wasteful aim!")\nelse:\n    print("No kills yet, or efficient aim.")',
          output: 'No kills yet, or efficient aim.',
          annotations: [
            { lines: 4, text: '`kills > 0` is false, so Python never evaluates `shots_hit / kills` — which would have raised `ZeroDivisionError`. The left side *guards* the right.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Put the cheap or protective check first: `if enemy is not None and enemy.hp > 0:` avoids touching `.hp` on a missing enemy. You’ll use this pattern constantly.',
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'Short-circuiting is visible in the bytecode: `and` compiles to a conditional *jump* over the right-hand side. That’s also why it’s fast — skipped code costs nothing.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'This line raises a `ZeroDivisionError`:\n\n`print(False and 1 / 0)`',
      answer: false,
      explanation: 'False — it prints `False`. Because the left side of `and` is false, the result is already known and `1 / 0` is never evaluated. Swap the order (`1 / 0 and False`) and you *would* get the error.',
    },
    {
      kind: 'concept',
      title: 'Truthiness: every value is true or false',
      blocks: [
        {
          type: 'p',
          text: 'An `if` doesn’t need a real `True` or `False`. Python asks every value to behave like a Boolean — its **truthiness**. A small, memorable set of values are **falsy**; everything else is **truthy**:',
        },
        {
          type: 'list',
          items: [
            '`False` and `None`',
            'Zero of any number type: `0`, `0.0`',
            'Empty collections and strings: `""`, `[]`, `{}`, `set()`, `()`, `range(0)`',
          ],
        },
        {
          type: 'code',
          title: 'truthy.py',
          runnable: true,
          code: 'for value in [False, None, 0, 0.0, "", [], {}, "False", " ", -1, [0]]:\n    print(repr(value), bool(value))',
          output: "False False\nNone False\n0 False\n0.0 False\n'' False\n[] False\n{} False\n'False' True\n' ' True\n-1 True\n[0] True",
          annotations: [
            { lines: 1, text: 'A `for` loop runs the indented line once per value (loops are next unit). `repr` shows each value as you’d write it in code.' },
            { lines: 2, text: 'Note the truthy surprises: the *text* `"False"`, a single space, negative numbers, and a list containing `0` — it isn’t empty, so it’s truthy.' },
          ],
        },
        {
          type: 'p',
          text: 'This lets you write checks that read like English:',
        },
        {
          type: 'compare',
          left: {
            title: 'Wordy',
            tone: 'bad',
            code: 'if len(inventory) > 0:\n    ...\nif name != "":\n    ...',
            lang: 'python',
          },
          right: {
            title: 'Pythonic',
            tone: 'good',
            code: 'if inventory:\n    ...\nif name:\n    ...',
            lang: 'python',
          },
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why let non-Booleans be tested?',
          text: '"Is there anything here?" is one of the most common questions in programming, and empty-vs-not-empty maps naturally onto false-vs-true. Defining truthiness once, consistently, for every type (your own classes can opt in too) means one short idiom works for strings, lists, dictionaries, NumPy arrays of size one, and more.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these values are **falsy**? Select all that apply.',
      multi: true,
      options: [
        { text: '`0`', correct: true, why: 'Zero is falsy.' },
        { text: '`"0"`', why: 'A non-empty string — even one containing the digit zero — is truthy.' },
        { text: '`[]`', correct: true, why: 'An empty list is falsy.' },
        { text: '`None`', correct: true, why: '`None` is always falsy.' },
        { text: '`-0.5`', why: 'Any non-zero number, negative or positive, is truthy.' },
      ],
      explanation: 'The falsy values are `False`, `None`, zeros (`0`, `0.0`) and empty containers (`""`, `[]`, `{}`, …). `"0"` is a one-character string, so it’s truthy, and `-0.5` is a non-zero number, so it’s truthy too.',
    },
    {
      kind: 'concept',
      title: 'and / or return values, not just True and False',
      blocks: [
        {
          type: 'p',
          text: 'Here’s a subtlety: `and` and `or` don’t convert their result to `bool`. They return **one of their operands** — the one that decided the answer. `a or b` returns `a` if `a` is truthy, otherwise `b`. `a and b` returns `a` if `a` is falsy, otherwise `b`.',
        },
        {
          type: 'code',
          title: 'defaults.py',
          runnable: true,
          code: 'name = ""\nprint(name or "Player 1")\nname = "Ada"\nprint(name or "Player 1")\n\nprint(0 or 10, 5 or 10)\nprint(3 and "yes", 0 and "yes")\n\nvolume = 0\nprint(volume or 50)   # careful!',
          output: 'Player 1\nAda\n10 5\nyes 0\n50',
          annotations: [
            { lines: 2, text: 'The **default value** idiom: an empty name is falsy, so `or` falls through to `"Player 1"`.' },
            { lines: 7, text: '`and` returns the first falsy operand, or the last one if all are truthy.' },
            { lines: '9-10', text: 'The trap: a volume of `0` is a perfectly valid setting, but it’s falsy, so `or` replaces it with `50`. When `0` (or `""`) is a legitimate value, test explicitly: `50 if volume is None else volume`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: '`value or default` is idiomatic for strings and lists where empty means "missing". For numbers, and anything where a falsy value is meaningful, use an explicit `is None` check instead.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The player typed `no`, but the game starts anyway. Tap the buggy line.',
      lines: ['choice = input("Start the game? ")', 'if choice == "y" or "yes":', '    print("Starting game...")', 'else:', '    print("Maybe later.")'],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'This is the most famous beginner bug in Python. Line 2 is read as `(choice == "y") or ("yes")`. The first part is `False`, so `or` returns `"yes"` — a non-empty string, which is truthy — and the `if` always runs. Compare `choice` with each value: `if choice == "y" or choice == "yes":`, or more neatly, `if choice in ("y", "yes"):`.',
    },
    {
      kind: 'code',
      prompt: 'Write the rule for opening a vault door as a single Boolean expression stored in `can_open`:\n\nThe door opens if the player **has the master key**, or if they are **level 10 or higher and not cursed**.\n\nWith the values given, the output should be:\n\n```\nCan open: True\n```',
      starter: 'has_master_key = False\nlevel = 12\ncursed = False\n\ncan_open = False  # fix me\n\nprint("Can open:", can_open)\n',
      solution: 'has_master_key = False\nlevel = 12\ncursed = False\n\ncan_open = has_master_key or (level >= 10 and not cursed)\n\nprint("Can open:", can_open)\n',
      tests: 'assert can_open is True, "With level 12 and no curse, the door should open"',
      expectOutput: 'Can open: True',
      checks: ['Combines the conditions with `or`, `and` and `not`', 'Prints `Can open: True` for these values'],
      hint: 'The second way in needs two things at once: `level >= 10 and not cursed`. Join it to the key check with `or`. Parentheses make it clearer.',
      explanation: '`has_master_key or (level >= 10 and not cursed)` matches the sentence exactly. The parentheses aren’t strictly required — `and` binds tighter than `or` — but they make the two "ways in" obvious to the reader. Here the key is missing, but `12 >= 10` is true and `not False` is true, so the door opens.',
    },
    {
      kind: 'fill',
      prompt: 'Using De Morgan’s laws, complete the equivalent conditions.',
      template: 'not (fast and quiet)   ==   (not fast) ___ (not quiet)\nnot (wet or cold)      ==   (not wet) ___ (not cold)',
      templateIsCode: true,
      blanks: [{ answers: ['or'] }, { answers: ['and'] }],
      wordBank: ['or', 'and', 'not', '=='],
      explanation: 'Negating an `and` gives an `or` of the negations: "not (fast and quiet)" means "slow or noisy". Negating an `or` gives an `and`: "not (wet or cold)" means "dry and warm".',
    },
  ],
  takeaways: [
    '`and` needs both sides true, `or` needs at least one, `not` flips a value.',
    'Precedence: comparisons, then `not`, then `and`, then `or`. Use parentheses when mixing `and` and `or`.',
    'De Morgan: `not (a and b)` = `not a or not b`; `not (a or b)` = `not a and not b`.',
    '`and`/`or` short-circuit: put guards first, like `count > 0 and total / count > 5`.',
    'Falsy values: `False`, `None`, `0`, `0.0`, and empty strings and collections. Everything else is truthy — write `if items:` and `if name:`.',
    '`and`/`or` return an operand: `name or "default"` is idiomatic, but beware when `0` is valid. Never write `x == "a" or "b"`; use `x in ("a", "b")`.',
  ],
  reading: [
    { title: 'Language Reference: Boolean operations', url: 'https://docs.python.org/3/reference/expressions.html#boolean-operations', source: 'docs', note: 'The precise rules for `and`, `or`, `not` — including that they return operands.' },
    { title: 'Truth Value Testing', url: 'https://docs.python.org/3/library/stdtypes.html#truth-value-testing', source: 'docs', note: 'The official list of falsy values.' },
    { title: 'Using the "and" Boolean Operator in Python (Real Python)', url: 'https://realpython.com/python-and-operator/', source: 'tutorial', note: 'A deep dive into `and`, short-circuiting and idioms (there are matching articles for `or` and `not`).' },
    { title: 'De Morgan’s laws', url: 'https://en.wikipedia.org/wiki/De_Morgan%27s_laws', source: 'wikipedia', note: 'The logic behind rewriting negated conditions.' },
  ],
};
