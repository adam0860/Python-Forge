import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-booleans',
  title: 'Booleans and Comparisons',
  summary: 'True and False, the six comparison operators, how strings compare, chained comparisons like 0 <= x < 10, and the difference between == and is.',
  minutes: 15,
  objectives: [
    'Produce `bool` values with the comparison operators `==`, `!=`, `<`, `>`, `<=`, `>=`',
    'Predict how numbers and strings compare, including uppercase vs lowercase and digit strings',
    'Write chained comparisons such as `1 <= level <= 99` and explain how they evaluate',
    'Distinguish equality (`==`) from identity (`is`), and use `is None` correctly',
    'Use the fact that `True` and `False` behave like `1` and `0` to count conditions',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'True, False and comparisons',
      blocks: [
        {
          type: 'p',
          text: 'Programs constantly ask yes-or-no questions: *Is the player alive? Did they reach the exit? Is the password correct?* Python’s answer to a yes-or-no question is a **[[bool|Boolean]]**: one of exactly two values, `True` or `False` (capitalized — they’re [[keyword|keywords]]).',
        },
        {
          type: 'p',
          text: 'You rarely type `True` or `False` directly. Instead you get them from **comparisons**:',
        },
        {
          type: 'table',
          headers: ['Operator', 'Meaning', 'Example (`hp = 30`)', 'Result'],
          rows: [
            ['`==`', 'equal to', '`hp == 100`', '`False`'],
            ['`!=`', 'not equal to', '`hp != 100`', '`True`'],
            ['`<`', 'less than', '`hp < 30`', '`False`'],
            ['`<=`', 'less than or equal to', '`hp <= 30`', '`True`'],
            ['`>`', 'greater than', '`hp > 0`', '`True`'],
            ['`>=`', 'greater than or equal to', '`hp >= 50`', '`False`'],
          ],
        },
        {
          type: 'code',
          title: 'compare.py',
          runnable: true,
          code: 'hp = 30\nprint(hp > 0)\nprint(hp == 100, hp != 100)\nprint(hp <= 30, hp < 30)\nalive = hp > 0\nprint(alive, type(alive))',
          output: "True\nFalse True\nTrue False\nTrue <class 'bool'>",
          annotations: [
            { lines: 2, text: 'A comparison is an [[expression]]: it produces a value, `True` or `False`.' },
            { lines: 5, text: 'Like any value, a Boolean can be stored in a variable. Names like `alive`, `is_boss` or `has_key` read naturally in the `if` statements of the next lesson.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why are Booleans so important?',
          text: 'Every decision a program makes — every `if`, every loop that stops — comes down to a value that is true or false. Comparisons are how raw data (numbers, text) becomes decisions. Master them and the next two units are mostly about *what to do* with the answers.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is the difference between `score = 100` and `score == 100`?',
      options: [
        { text: 'There is no difference; both check whether score is 100', why: 'A single `=` never checks anything — it assigns.' },
        { text: '`score = 100` makes `score` refer to 100; `score == 100` asks whether `score` equals 100 and gives `True` or `False`', correct: true, why: 'Exactly: one is a statement that binds a name, the other an expression that produces a Boolean.' },
        { text: '`score == 100` assigns 100 twice, for safety', why: 'Doubling the equals sign changes the meaning entirely: it compares.' },
        { text: '`score = 100` is for numbers and `score == 100` is for strings', why: 'Both work with any type. The difference is assigning vs comparing.' },
      ],
      explanation: '`=` is assignment (a statement that binds a name); `==` is the equality operator (an expression producing `True` or `False`). Mixing them up is one of the most common bugs in every C-family language. Python helps a little: writing `if score = 100:` is a `SyntaxError`, so you can’t accidentally assign inside a condition.',
    },
    {
      kind: 'concept',
      title: 'How different values compare',
      blocks: [
        {
          type: 'p',
          text: '**Numbers** compare by value, even across types: `3 == 3.0` is `True`. **Strings** compare *lexicographically* — like a dictionary, character by character — using each character’s Unicode number (its *code point*, from `ord()`).',
        },
        {
          type: 'code',
          title: 'ordering.py',
          runnable: true,
          code: 'print(3 == 3.0, 2 < 2.5)\nprint("apple" < "banana", "Zebra" < "apple")\nprint(ord("Z"), ord("a"))\nprint("10" < "9", 10 < 9)\nprint("3" == 3)',
          output: 'True True\nTrue True\n90 97\nTrue False\nFalse',
          annotations: [
            { lines: 2, text: '"apple" comes before "banana" because `a` < `b`. But "Zebra" < "apple" too…' },
            { lines: 3, text: '…because every uppercase letter (A–Z are 65–90) has a smaller code point than every lowercase letter (a–z are 97–122).' },
            { lines: 4, text: 'Digit strings compare as text, character by character: `"1"` < `"9"`, so `"10"` < `"9"`. Convert to numbers before comparing them as numbers!' },
            { lines: 5, text: '`==` between a string and a number is simply `False` — they’re different kinds of values.' },
          ],
        },
        {
          type: 'p',
          text: 'Ordering comparisons (`<`, `>`, …) between unrelated types aren’t allowed at all:',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> "3" < 4\nTraceback (most recent call last):\n  File "<python-input-0>", line 1, in <module>\n    "3" < 4\nTypeError: \'<\' not supported between instances of \'str\' and \'int\'',
          annotations: [
            { lines: 5, text: 'Python 2 allowed this and gave a meaningless answer. Python 3 refuses — strong typing again.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'To compare text without caring about case, normalize first: `answer.lower() == "yes"`. (For international text, `casefold()` is even more thorough than `lower()`.)',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'print("Apple" < "apple", "cat" > "car")\nprint("100" < "20", 100 < 20)\nprint(7 == 7.0)',
      answer: 'True True\nTrue False\nTrue',
      hint: 'Uppercase letters come before lowercase. Strings compare character by character; the first difference decides.',
      explanation: '`"A"` (65) is less than `"a"` (97), so `"Apple" < "apple"`. In `"cat"` vs `"car"` the first difference is `t` vs `r`, and `t` comes later, so `"cat" > "car"`. `"100" < "20"` because `"1"` < `"2"` — text comparison — while the numbers compare normally: `100 < 20` is `False`. And `7 == 7.0` compares values: `True`.',
    },
    {
      kind: 'concept',
      title: 'Chained comparisons',
      blocks: [
        {
          type: 'p',
          text: 'To check that a value lies in a range, math writes $1 \\le x \\le 10$. Python lets you write exactly that:',
        },
        {
          type: 'code',
          title: 'ranges.py',
          runnable: true,
          code: 'level = 7\nprint(1 <= level <= 10)\nprint(0 < level < 5)\n\na = b = c = 4\nprint(a == b == c)\nprint(1 < 5 < 3)',
          output: 'True\nFalse\nTrue\nFalse',
          annotations: [
            { lines: 2, text: 'Read it as "level is between 1 and 10, inclusive".' },
            { lines: 6, text: 'Chaining works with any comparison operators: all three are equal.' },
            { lines: 7, text: '`1 < 5` is true but `5 < 3` is false, so the whole chain is `False`.' },
          ],
        },
        {
          type: 'definition',
          term: 'How a chain evaluates',
          text: '`a < b < c` means `(a < b) and (b < c)`, except that `b` is evaluated only once. Evaluation stops at the first comparison that is false. (You’ll meet `and` in two lessons.)',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'A classic C++ trap that Python avoids',
          text: 'In C++, `0 <= x < 10` compiles — and is always true! It evaluates `(0 <= x)` to `true` or `false` (1 or 0), then checks whether that is `< 10`. In Python, the chain means what it looks like.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`print(3 < 7 < 5)` displays `True`, because `3 < 7` is true.',
      answer: false,
      explanation: 'False. A chain is true only if *every* link is true: `3 < 7` is true, but `7 < 5` is false, so `3 < 7 < 5` is `False`. Python does not compare the result of `3 < 7` (`True`) with `5` the way C++ would.',
    },
    {
      kind: 'concept',
      title: 'Equality vs identity: == and is',
      blocks: [
        {
          type: 'p',
          text: 'Python has two kinds of "sameness". `==` asks whether two values are **equal** (same contents). `is` asks whether two names refer to the **identical object** in memory — remember labels and balloons.',
        },
        {
          type: 'code',
          title: 'identity.py',
          runnable: true,
          code: 'inventory_a = ["sword", "shield"]\ninventory_b = ["sword", "shield"]\nalias = inventory_a\n\nprint(inventory_a == inventory_b)\nprint(inventory_a is inventory_b)\nprint(alias is inventory_a)\n\nresult = None\nprint(result is None)',
          output: 'True\nFalse\nTrue\nTrue',
          annotations: [
            { lines: '1-2', text: 'Two separate lists that happen to contain the same items.' },
            { lines: 5, text: 'Equal contents → `==` is `True`.' },
            { lines: 6, text: 'But they’re two different objects → `is` is `False`.' },
            { lines: 7, text: '`alias` is a second label on the *same* list → `is` is `True`.' },
            { lines: 10, text: 'The one place you should always use `is`: checking for `None`. There is only ever one `None` object.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t use `is` to compare numbers or strings',
          text: 'Python reuses some small integers and short strings internally, so `x is 5` might *happen* to be `True` — until a different value or Python version makes it `False`. Python 3.8+ even prints a `SyntaxWarning` for `is` with a literal. Use `==` for values; use `is` only for `None` (and, occasionally, `True`/`False` or sentinel objects).',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'PEP 8 says comparisons to `None` should always use `is` or `is not`: write `if result is None:` and `if result is not None:`, never `== None`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which line is the correct, idiomatic way to check whether `best_time` hasn’t been set yet?',
      options: [
        { text: '`best_time == None`', why: 'It usually works, but PEP 8 says to use `is` for `None`, and custom objects can redefine `==`.' },
        { text: '`best_time is None`', correct: true, why: 'Correct — `None` is a single object, so identity is the precise test.' },
        { text: '`best_time = None`', why: 'That *assigns* `None` — it doesn’t check anything.' },
        { text: '`best_time is "None"`', why: 'That compares with the four-letter *string* "None", and uses `is` on a string literal, which is unreliable.' },
      ],
      explanation: '`best_time is None` is the idiomatic check (and `is not None` for the opposite). `None` is a singleton — there’s exactly one `None` object — so testing identity is both precise and fast.',
    },
    {
      kind: 'concept',
      title: 'Booleans are numbers in disguise',
      blocks: [
        {
          type: 'p',
          text: 'In Python, `bool` is a subtype of `int`: `True` behaves like `1` and `False` like `0` in arithmetic. That gives you a neat trick for **counting** how many conditions are true:',
        },
        {
          type: 'code',
          title: 'counting.py',
          runnable: true,
          code: 'print(True == 1, False == 0, True + True)\n\npassed = (72 >= 50) + (45 >= 50) + (90 >= 50)\nprint("Passed:", passed)',
          output: 'True True 2\nPassed: 2',
          annotations: [
            { lines: 3, text: 'Each comparison becomes `True` (1) or `False` (0); adding them counts the passes: $1 + 0 + 1 = 2$. With lists, `sum(score >= 50 for score in scores)` does the same for any number of scores — you’ll write that in the Collections unit.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          text: 'This is a historical decision: Python had no `bool` type until 2.3, and people used `1` and `0`. When `True` and `False` were added, making `bool` a subclass of `int` kept all the old code working. It also means `isinstance(True, int)` is `True` — something to remember when you validate input types.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Floats and `==` don’t mix, as you saw in the Numbers lesson: `0.1 + 0.2 == 0.3` is `False`. For floats, compare with `math.isclose(a, b)` or check a range.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`print((3 > 2) + (2 > 3) + (5 == 5.0) + ("a" < "B"))`',
      answer: '2',
      hint: 'Evaluate each comparison to `True` (1) or `False` (0). For the last one, compare the code points of lowercase `a` and uppercase `B`.',
      explanation: '`3 > 2` is `True` (1); `2 > 3` is `False` (0); `5 == 5.0` is `True` (1); `"a" < "B"` is `False` (0) because lowercase `a` is 97 and uppercase `B` is 66. Total: $1 + 0 + 1 + 0 = 2$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Create two Boolean variables for this level:\n\n- `in_range` — `True` if `level` is between 1 and 99 **inclusive** (use a chained comparison)\n- `is_boss` — `True` if `level` is a multiple of 10\n\nThen print both. For `level = 40` the output is:\n\n```\nIn range: True\nBoss level: True\n```',
      starter: 'level = 40\n\nin_range = False  # fix me\nis_boss = False   # fix me\n\nprint("In range:", in_range)\nprint("Boss level:", is_boss)\n',
      solution: 'level = 40\n\nin_range = 1 <= level <= 99\nis_boss = level % 10 == 0\n\nprint("In range:", in_range)\nprint("Boss level:", is_boss)\n',
      tests: 'assert in_range is True, "For level 40, in_range should be True"\nassert is_boss is True, "For level 40, is_boss should be True"',
      expectOutput: 'In range: True\nBoss level: True',
      checks: ['`in_range` uses a chained comparison `1 <= level <= 99`', '`is_boss` checks the remainder after dividing by 10'],
      hint: 'A multiple of 10 leaves no remainder: `level % 10 == 0`.',
      explanation: '`1 <= level <= 99` is true exactly when the level is in range, ends included. A number is a multiple of 10 when dividing by 10 leaves remainder 0, so `level % 10 == 0`. Both expressions produce `bool` values that you can store and print.',
    },
    {
      kind: 'error',
      prompt: 'This check should print `True`, but prints `False`. Tap the line with the bug.',
      lines: ['subtotal = 0.1 + 0.2', 'expected = 0.3', 'print(subtotal == expected)'],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`0.1 + 0.2` is `0.30000000000000004` in binary floating point, so `==` with `0.3` is `False`. Line 3 should compare with a tolerance: `import math` and `print(math.isclose(subtotal, expected))`, which prints `True`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete each line so it prints `True`.',
      template: 'print(5 ___ 5.0)\nprint("b" ___ "a")\nprint(10 ___ 3)\nprint(None ___ None)',
      templateIsCode: true,
      blanks: [{ answers: ['=='] }, { answers: ['>'] }, { answers: ['!='] }, { answers: ['is'] }],
      wordBank: ['==', '>', '!=', 'is', '=', '<'],
      explanation: '`5 == 5.0` compares values across int and float. `"b" > "a"` because `b` comes after `a`. `10 != 3` is true. `None is None` is the identity check for the single `None` object. (A single `=` is assignment and would be a `SyntaxError` here.)',
    },
  ],
  takeaways: [
    'A `bool` is `True` or `False`. Comparisons `==`, `!=`, `<`, `<=`, `>`, `>=` produce Booleans.',
    '`=` assigns; `==` compares. Python makes `if x = 5:` a syntax error.',
    'Numbers compare by value across `int`/`float`; strings compare by Unicode code point, character by character (uppercase before lowercase, `"10" < "9"`).',
    'Chained comparisons like `1 <= level <= 99` mean what they look like.',
    '`==` tests equality of values; `is` tests identity of objects. Use `is` for `None`, `==` for everything else.',
    '`True` and `False` act as `1` and `0`, so adding comparisons counts how many are true. Compare floats with `math.isclose`.',
  ],
  reading: [
    { title: 'Language Reference: Comparisons', url: 'https://docs.python.org/3/reference/expressions.html#comparisons', source: 'docs', note: 'The exact rules for chaining, value comparisons and identity.' },
    { title: 'Built-in Types: Boolean Type', url: 'https://docs.python.org/3/library/stdtypes.html#boolean-type-bool', source: 'docs', note: 'How `bool` relates to `int`, and the truth-value rules.' },
    { title: 'PEP 8: Programming Recommendations', url: 'https://peps.python.org/pep-0008/#programming-recommendations', source: 'pep', note: 'Includes the rule to compare with `None` using `is`.' },
    { title: 'PEP 285 – Adding a bool type', url: 'https://peps.python.org/pep-0285/', source: 'pep', note: 'Why `True` and `False` were added in Python 2.3, and why `bool` subclasses `int`.' },
  ],
};
