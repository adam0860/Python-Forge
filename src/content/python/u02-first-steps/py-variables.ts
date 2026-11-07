import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-variables',
  title: 'Variables, Names and Assignment',
  summary: 'Give values names: how assignment really works, the rules and conventions for good names, updating values with +=, multiple assignment, swapping, and constants.',
  minutes: 16,
  objectives: [
    'Create, use and update variables with `=`, and explain that the right side is evaluated first',
    'Choose valid, readable names following PEP 8 (`snake_case`, `CapWords`, `UPPER_CASE`)',
    'Use augmented assignment (`+=`, `-=`, `*=` …), multiple assignment and tuple-unpacking swaps',
    'Explain why Python variables have no declared type, and what `NameError` means',
    'Avoid shadowing built-in names like `list`, `str` and `input`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Naming values',
      blocks: [
        {
          type: 'p',
          text: 'Programs are mostly about values that change: a player’s health, a score, the name they typed. A **[[variable]]** gives a value a name so you can use it later. You create one with an **[[assignment]]**: a name, an equals sign, and a value.',
        },
        {
          type: 'code',
          title: 'player.py',
          runnable: true,
          code: 'player_name = "Ada"\nhealth = 100\nspeed = 4.5\n\nprint(player_name, "has", health, "HP")\nhealth = health - 30\nprint(player_name, "now has", health, "HP")\nprint("Speed:", speed)',
          output: 'Ada has 100 HP\nAda now has 70 HP\nSpeed: 4.5',
          annotations: [
            { lines: '1-3', text: 'Three assignments. No declarations, no types written: just a name, `=`, and a value. The name now refers to that value.' },
            { lines: 5, text: 'Using a variable means using the value it refers to.' },
            { lines: 6, text: 'Reassignment: compute `health - 30` (that’s `70`), then make `health` refer to the new value.' },
          ],
        },
        {
          type: 'p',
          text: 'As you saw in *How Python Works*, a variable isn’t a box that *holds* a value — it’s a **label tied to an object**. `health = 100` ties the label `health` to the object `100`. That’s why you never declare a type: the type belongs to the object, not the name.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '`=` is not "equals"',
          text: 'In math, $x = x - 30$ is a contradiction. In Python, `=` is an *instruction*: "evaluate the right side, then bind the name on the left to the result". Reading it as "becomes" helps: *health becomes health minus 30*. To **compare** two values for equality, Python uses `==`, which you’ll meet in the Making Decisions unit.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'There is no `int health = 100;` in Python, and no separate declaration step. The first assignment creates the name. A name can later refer to a value of a different type — `health = "full"` is legal — though doing that on purpose is usually a sign of confusing code.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does the line `score = score + 5` do?',
      options: [
        { text: 'It checks whether `score` equals `score + 5`, which is always false', why: 'That would be the comparison `score == score + 5`. A single `=` assigns.' },
        { text: 'It computes `score + 5` using the current value, then makes `score` refer to the result', correct: true, why: 'Right: the right side is evaluated first, then the name is re-bound.' },
        { text: 'It creates a second variable also called `score`', why: 'A name can only refer to one thing at a time; the existing name is re-bound.' },
        { text: 'It’s a syntax error, because a variable can’t appear on both sides', why: 'It’s perfectly valid and extremely common.' },
      ],
      explanation: 'Assignment always evaluates the right-hand side first, using the *current* value of `score`, and then binds `score` to the result. If `score` was `10`, it becomes `15`. (If `score` didn’t exist yet, the right side would fail with a `NameError`.)',
    },
    {
      kind: 'concept',
      title: 'Rules and conventions for names',
      blocks: [
        {
          type: 'p',
          text: 'A name (formally, an **[[identifier]]**) must follow a few hard rules, and good Python code also follows the conventions of [[pep-8|PEP 8]].',
        },
        {
          type: 'list',
          items: [
            '**Rules:** letters, digits and underscores only; it can’t start with a digit; it can’t be a [[keyword]] such as `class`, `for` or `True`. Names are **case-sensitive**: `score`, `Score` and `SCORE` are three different names.',
            '**Variables and functions:** [[snake-case|`snake_case`]] — lowercase words joined by underscores: `max_health`, `enemy_count`.',
            '**Classes:** `CapWords`: `PlayerCharacter`, `HealthBar`.',
            '**Constants:** `UPPER_CASE`: `MAX_PLAYERS = 4`, `GRAVITY = 9.81`.',
            '**A leading underscore** (`_cache`) signals "internal, don’t touch from outside". A lone `_` is used for values you deliberately ignore.',
          ],
        },
        {
          type: 'table',
          headers: ['Name', 'Valid?', 'Why'],
          rows: [
            ['`enemy_count`', '✅', 'Perfect `snake_case`'],
            ['`player2_score`', '✅', 'Digits are fine after the first character'],
            ['`2nd_place`', '❌', 'Starts with a digit'],
            ['`high-score`', '❌', 'Python reads `-` as minus: `high - score`'],
            ['`class`', '❌', 'A keyword'],
            ['`π` or `ниндзя`', '✅ (but avoid)', 'Unicode letters are allowed; most teams stick to ASCII so everyone can type the names'],
            ['`x`', '✅ (but vague)', 'Fine for a coordinate or a short math formula; meaningless elsewhere'],
          ],
        },
        {
          type: 'code',
          title: 'keywords.py',
          runnable: true,
          code: 'import keyword\n\nprint(keyword.iskeyword("class"))\nprint(keyword.iskeyword("score"))\nprint(len(keyword.kwlist), "keywords in total")',
          output: 'True\nFalse\n35 keywords in total',
          annotations: [
            { lines: 3, text: '`keyword.iskeyword` tells you whether a word is reserved. `match`, `case`, `type` and `_` are *soft* keywords: reserved only in certain positions, so you can still use them as names.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t shadow built-ins',
          text: 'Names like `list`, `str`, `input`, `max`, `sum` and `print` aren’t keywords — they’re [[built-in-function|built-in functions]] — so Python *lets* you reuse them. But `max = 10` hides the real `max` for the rest of your program, and a later `max(a, b)` fails with a baffling `TypeError: \'int\' object is not callable`. Pick `max_hp`, `item_list` or `user_input` instead.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these are valid **and** follow PEP 8 for a variable name? Select all that apply.',
      multi: true,
      options: [
        { text: '`total_damage`', correct: true, why: 'Valid and idiomatic `snake_case`.' },
        { text: '`totalDamage`', why: 'Valid Python, but camelCase isn’t the PEP 8 style for variables (it’s common in Java and JavaScript).' },
        { text: '`total-damage`', why: 'Invalid: Python parses this as `total - damage`.' },
        { text: '`level_3_boss_hp`', correct: true, why: 'Valid — digits are fine anywhere but the start — and good `snake_case`.' },
        { text: '`3rd_boss_hp`', why: 'Invalid: a name can’t start with a digit.' },
      ],
      explanation: '`total_damage` and `level_3_boss_hp` are both valid and PEP 8 style. `totalDamage` works but isn’t idiomatic Python; `total-damage` and `3rd_boss_hp` aren’t valid names at all.',
    },
    {
      kind: 'concept',
      title: 'Updating values: augmented and multiple assignment',
      blocks: [
        {
          type: 'p',
          text: 'Updating a variable based on its own value is so common that Python has shorthand for it, called **[[augmented-assignment|augmented assignment]]**:',
        },
        {
          type: 'table',
          headers: ['Shorthand', 'Means', 'If `gold` was 50'],
          rows: [
            ['`gold += 10`', '`gold = gold + 10`', '`60`'],
            ['`gold -= 15`', '`gold = gold - 15`', '`35`'],
            ['`gold *= 2`', '`gold = gold * 2`', '`100`'],
            ['`gold /= 4`', '`gold = gold / 4`', '`12.5` (true division gives a float)'],
            ['`gold //= 4`', '`gold = gold // 4`', '`12` (floor division)'],
            ['`gold **= 2`', '`gold = gold ** 2`', '`2500`'],
          ],
          caption: 'There is no `++` or `--` in Python. Write `count += 1`.',
        },
        {
          type: 'p',
          text: 'You can also assign several names at once. Python evaluates **everything on the right first**, then assigns left to right — which makes swapping two values a one-liner:',
        },
        {
          type: 'code',
          title: 'multiple.py',
          runnable: true,
          code: 'x, y = 3, 7          # x gets 3, y gets 7\nprint(x, y)\nx, y = y, x          # swap!\nprint(x, y)\nlives = continues = 3  # chained: both names refer to 3\nprint(lives, continues)',
          output: '3 7\n7 3\n3 3',
          annotations: [
            { lines: 1, text: '**Unpacking**: the right side builds the pair `(3, 7)`, then its items are assigned to `x` and `y` in order.' },
            { lines: 3, text: 'The right side `y, x` is evaluated *completely* — producing `(7, 3)` — before either name changes. No temporary variable needed.' },
            { lines: 5, text: 'Chained assignment binds both names to the same object. Fine for numbers; be careful with lists, as you saw in the "labels" example.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does the swap work?',
          text: 'In many languages, swapping needs a temporary variable: `temp = x; x = y; y = temp`. Python’s rule — *evaluate the whole right side first* — means `x, y = y, x` first creates a new pair from the **old** values of `y` and `x`, and only then rebinds the names. Nothing gets overwritten too early.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'coins = 10\ncoins += 5\ncoins *= 2\na, b = coins, 1\na, b = b, a\nprint(coins, a, b)',
      answer: '30 1 30',
      hint: 'Work line by line: 10 → +5 → ×2. Then `a, b` start as `(30, 1)` and are swapped.',
      explanation: '`coins` goes 10 → 15 → 30. Line 4 sets `a = 30`, `b = 1`. Line 5 evaluates `b, a` as `(1, 30)` and assigns it, so `a = 1`, `b = 30`. Output: `30 1 30`.',
    },
    {
      kind: 'concept',
      title: 'Names, types and NameError',
      blocks: [
        {
          type: 'p',
          text: 'A name only exists after it has been assigned. Using it before then raises **`NameError`** — Python has no idea what you mean. And because types live on values, the same name can refer to different types over time; `type()` always tells you what it refers to *right now*:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> print(stage)\nTraceback (most recent call last):\n  File "<python-input-0>", line 1, in <module>\n    print(stage)\n          ^^^^^\nNameError: name \'stage\' is not defined\n>>> stage = 1\n>>> type(stage)\n<class \'int\'>\n>>> stage = "boss"\n>>> type(stage)\n<class \'str\'>\n>>> best_time = None\n>>> print(best_time)\nNone',
          annotations: [
            { lines: '1-6', text: '`stage` hasn’t been assigned yet, so it isn’t defined.' },
            { lines: '10-12', text: 'Legal, but switching a variable between unrelated types usually makes code harder to follow. Prefer a new name.' },
            { lines: 13, text: '[[none|`None`]] means "no value (yet)". It’s the standard way to create a variable before you have something to put in it — like a best lap time before the first lap.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'You can also remove a name with `del stage`. After that, using `stage` raises `NameError` again. You’ll rarely need it for simple variables — names disappear on their own when a function finishes — but you’ll meet `del` again with lists and dictionaries.',
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'Global names in a script are stored in a dictionary — you can even see it with `globals()`. An assignment is literally "store this object under this key". That’s why there’s no fixed memory slot or type: a dictionary entry can point at any object.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'In Python you must declare a variable’s type before assigning to it, like `int lives = 3` in C++.',
      answer: false,
      explanation: 'False. Python has no declarations: `lives = 3` creates the name on first assignment, and the type (`int`) belongs to the value. You *may* add an optional type hint — `lives: int = 3` — which documents intent for tools and readers but doesn’t change how the code runs.',
    },
    {
      kind: 'concept',
      title: 'Constants and readable code',
      blocks: [
        {
          type: 'p',
          text: 'Python has no `const` keyword. By convention, a name written in `UPPER_CASE` is a **constant**: assigned once, usually near the top of a file, and never changed. Nothing stops you from changing it, but every Python programmer reading your code will understand the intent.',
        },
        {
          type: 'code',
          title: 'wave.py',
          runnable: true,
          code: 'MAX_HEALTH = 100\nPOTION_HEAL = 35\nSPIKE_DAMAGE = 20\n\nhealth = MAX_HEALTH\nhealth -= SPIKE_DAMAGE * 3\nhealth += POTION_HEAL\nhealth = min(health, MAX_HEALTH)\nprint("Health:", health, "/", MAX_HEALTH)',
          output: 'Health: 75 / 100',
          annotations: [
            { lines: '1-3', text: 'Game-design numbers as named constants. Rebalancing means changing one line, and the code says *what* each number is.' },
            { lines: 6, text: 'Three spike hits: $100 - 20 \\times 3 = 40$.' },
            { lines: 7, text: 'A potion: $40 + 35 = 75$.' },
            { lines: 8, text: '`min` returns the smaller value, so health can never exceed the maximum — a classic "clamp".' },
          ],
        },
        {
          type: 'compare',
          left: {
            title: 'Magic numbers',
            tone: 'bad',
            code: 'hp = 100\nhp -= 20 * 3\nhp += 35\nhp = min(hp, 100)',
            lang: 'python',
          },
          right: {
            title: 'Named constants',
            tone: 'good',
            code: 'hp = MAX_HEALTH\nhp -= SPIKE_DAMAGE * 3\nhp += POTION_HEAL\nhp = min(hp, MAX_HEALTH)',
            lang: 'python',
          },
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'Readable names are the cheapest documentation there is. `seconds_since_last_save` is long, but it’s impossible to misunderstand — and your editor autocompletes it anyway.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code is supposed to swap `a` and `b` and print `9 5`, but it prints `9 9`. Tap the line where it first goes wrong.',
      lines: ['a = 5', 'b = 9', 'a = b', 'b = a', 'print(a, b)'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 overwrites `a` with `9` *before* its old value (`5`) has been saved anywhere, so line 4 just copies `9` back into `b`. Replace lines 3–4 with the Pythonic swap `a, b = b, a`, which evaluates the right side completely before assigning.',
    },
    {
      kind: 'code',
      prompt: 'A player starts with `50` gold. Using **augmented assignment**, update `gold` for each event in order, then print the result:\n\n1. Buys a potion for 15 gold.\n2. Buys another potion for 15 gold.\n3. Finds a chest with 40 gold.\n\nExpected output:\n\n```\nGold: 60\n```',
      starter: 'gold = 50\n\n# 1. buy a potion (15)\n# 2. buy another potion (15)\n# 3. open a chest (+40)\n\nprint("Gold:", gold)\n',
      solution: 'gold = 50\n\ngold -= 15\ngold -= 15\ngold += 40\n\nprint("Gold:", gold)\n',
      tests: 'assert gold == 60, f"gold should end at 60, but it is {gold}"',
      expectOutput: 'Gold: 60',
      checks: ['Uses `-=` and `+=` to update `gold`', 'Prints `Gold: 60`'],
      hint: '`gold -= 15` subtracts 15 from `gold`. Do it twice, then `gold += 40`.',
      explanation: '$50 - 15 - 15 + 40 = 60$. Each augmented assignment reads the current value, applies the operation and re-binds the name: `gold -= 15` twice, then `gold += 40`. (Writing `gold = 60` directly would also pass the check, but the point is to model each event — in a real game those numbers come from the shop and the chest.)',
    },
    {
      kind: 'fill',
      prompt: 'Complete each line with the augmented assignment that has the effect described in the comment.',
      template: 'score ___ 100      # score = score + 100\nlives ___ 1        # lives = lives - 1\ncombo ___ 2        # combo = combo * 2\nchunks ___ 16      # chunks = chunks // 16',
      templateIsCode: true,
      blanks: [{ answers: ['+='] }, { answers: ['-='] }, { answers: ['*='] }, { answers: ['//='] }],
      wordBank: ['+=', '-=', '*=', '//=', '/=', '++', '=='],
      explanation: '`+=`, `-=`, `*=` and `//=` are the augmented versions of `+`, `-`, `*` and `//`. Note the traps in the word bank: `/=` would give a float (true division), `++` doesn’t exist in Python, and `==` compares rather than assigns.',
    },
  ],
  takeaways: [
    'Assignment `name = value` evaluates the right side first, then binds the name to the result. Read `=` as "becomes"; `==` compares.',
    'Variables are labels with no declared type; the type belongs to the value. Using a name before assigning it raises `NameError`.',
    'Names: letters, digits, underscores, not starting with a digit, not a keyword, case-sensitive. Style: `snake_case` variables, `CapWords` classes, `UPPER_CASE` constants.',
    'Don’t reuse built-in names like `list`, `str`, `max` or `input` for your variables.',
    'Augmented assignment (`+=`, `-=`, `*=`, `/=`, `//=`, `**=`) updates a value in place; there is no `++`.',
    'Multiple assignment `x, y = 1, 2` and the swap `x, y = y, x` work because the right side is fully evaluated first.',
  ],
  reading: [
    { title: 'PEP 8: Naming Conventions', url: 'https://peps.python.org/pep-0008/#naming-conventions', source: 'pep', note: 'The official style rules for naming variables, functions, classes and constants.' },
    { title: 'Language Reference: Assignment statements', url: 'https://docs.python.org/3/reference/simple_stmts.html#assignment-statements', source: 'docs', note: 'The exact rules, including unpacking and chained assignment.' },
    { title: 'Facts and myths about Python names and values (Ned Batchelder)', url: 'https://nedbatchelder.com/text/names.html', source: 'article', note: 'A famous, very clear explanation of names as labels — the mental model this lesson uses.' },
    { title: 'Language Reference: Identifiers and keywords', url: 'https://docs.python.org/3/reference/lexical_analysis.html#identifiers', source: 'docs', note: 'The complete list of keywords and soft keywords.' },
  ],
};
