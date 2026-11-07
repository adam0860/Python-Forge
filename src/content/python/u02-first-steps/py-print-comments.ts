import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-print-comments',
  title: 'Your First Programs: print() and Comments',
  summary: 'Make Python talk: print text and numbers, control spacing and line endings, use quotes and escape sequences, write useful comments — and read the errors you’ll inevitably make.',
  minutes: 15,
  objectives: [
    'Write programs that print text, numbers and the results of expressions',
    'Choose the right quotes, and use escape sequences like `\\n` and `\\"`',
    'Control output with `print`’s `sep` and `end` options',
    'Write comments that explain *why*, following PEP 8 style',
    'Recognize and fix the most common beginner `SyntaxError`s and `IndentationError`s',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Hello, world',
      blocks: [
        {
          type: 'p',
          text: 'By tradition, the first program in any language prints "Hello, world!". In Python it’s one line. Press **Run**:',
        },
        {
          type: 'code',
          title: 'hello.py',
          runnable: true,
          code: 'print("Hello, world!")\nprint("Welcome to Python Forge.")\nprint(2 + 3)\nprint("Level", 7, "complete")',
          output: 'Hello, world!\nWelcome to Python Forge.\n5\nLevel 7 complete',
          annotations: [
            { lines: 1, text: '`print` is a [[built-in-function|built-in function]]. You *call* it with parentheses; the value inside is its [[argument]]. Text in quotes is a **string** — a piece of text.' },
            { lines: 2, text: 'Python runs statements in order, top to bottom. Each `print` starts a new line.' },
            { lines: 3, text: 'Without quotes, `2 + 3` is an [[expression]]: Python computes it first, then prints the result `5`.' },
            { lines: 4, text: 'Several arguments, separated by commas, are printed with a single space between them. Numbers and strings can be mixed freely.' },
          ],
        },
        {
          type: 'p',
          text: 'Try editing it: press the ✏️ button, change the text, and run your own version. Breaking things on purpose is one of the best ways to learn — you can always restore the original.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'Compare `std::cout << "Level " << 7 << " complete\\n";`. Python’s `print` adds the spaces between arguments and the newline at the end for you, and there’s no `#include`, no `main()` and no semicolons.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is print a function?',
          text: 'In Python 2, `print` was a special statement (`print "hi"`). Making it an ordinary function in Python 3 means it follows the same rules as everything else: it takes arguments, it has optional keyword arguments like `sep` and `end`, you can look it up with `help(print)`, and you can even pass it to other functions. One consistent rule is easier to learn than a special case.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which line prints `Game over` correctly in Python 3?',
      options: [
        { text: '`print "Game over"`', why: 'That’s Python 2 syntax. In Python 3 it’s a `SyntaxError` — `print` needs parentheses.' },
        { text: '`print(Game over)`', why: 'Without quotes, Python reads `Game` and `over` as names — this is a `SyntaxError`.' },
        { text: '`print("Game over")`', correct: true, why: 'Correct: call `print` with a string argument in quotes.' },
        { text: '`Print("Game over")`', why: 'Python is case-sensitive. `Print` isn’t defined, so this raises a `NameError`.' },
      ],
      explanation: '`print("Game over")` calls the `print` function with the string `"Game over"`. Python is case-sensitive (`Print` ≠ `print`), text needs quotes, and Python 3 requires the parentheses.',
      codeOptions: false,
    },
    {
      kind: 'concept',
      title: 'Quotes and escape sequences',
      blocks: [
        {
          type: 'p',
          text: 'A [[str|string]] can use single quotes `\'…\'` or double quotes `"…"` — they mean exactly the same thing. Pick whichever avoids clashing with the text: `"It\'s here"` needs no special handling, and neither does `\'She said "go"\'`. (PEP 8 doesn’t prefer one; just be consistent. Many projects use double quotes, as formatters like Ruff and Black do.)',
        },
        {
          type: 'p',
          text: 'For characters that are awkward to type inside a string, use an **[[escape-sequence|escape sequence]]**: a backslash followed by a code.',
        },
        {
          type: 'table',
          headers: ['Escape', 'Means', 'Example', 'Prints'],
          rows: [
            ['`\\n`', 'newline', '`print("one\\ntwo")`', 'one, then two on the next line'],
            ['`\\t`', 'tab', '`print("HP\\t75")`', 'HP, a tab, 75'],
            ['`\\\\`', 'a backslash', '`print("C:\\\\games")`', '`C:\\games`'],
            ['`\\"` / `\\\'`', 'a quote inside the same kind of quotes', '`print("say \\"hi\\"")`', '`say "hi"`'],
          ],
        },
        {
          type: 'code',
          title: 'title_card.py',
          runnable: true,
          code: 'print("=" * 22)\nprint("   DUNGEON  CRAWLER")\nprint("=" * 22)\nprint("Press \\"Start\\" to begin.\\nGood luck!")\nprint()\nprint("""Controls:\n  WASD  move\n  Space attack""")',
          output: '======================\n   DUNGEON  CRAWLER\n======================\nPress "Start" to begin.\nGood luck!\n\nControls:\n  WASD  move\n  Space attack',
          annotations: [
            { lines: 1, text: '`"=" * 22` repeats a string 22 times — a quick way to draw a line.' },
            { lines: 4, text: '`\\"` puts a double quote inside a double-quoted string, and `\\n` breaks the line in the middle of the output.' },
            { lines: 5, text: '`print()` with no arguments prints an empty line.' },
            { lines: '6-8', text: 'A **triple-quoted** string (`"""…"""`) can span several lines; the line breaks become part of the text.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Windows paths and backslashes',
          text: 'In `"C:\\new\\temp"`, Python sees `\\n` (a newline) and `\\t` (a tab)! Write `"C:\\\\new\\\\temp"`, use forward slashes (`"C:/new/temp"` works on Windows), or use a **raw string**: `r"C:\\new\\temp"` keeps every backslash as typed. You’ll mostly use `pathlib` for paths later anyway.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output, line by line.',
      code: 'print("Lives:", 3)\nprint("Line one\\nLine two")\nprint(\'Say "cheese"\')\nprint("-" * 5)',
      answer: 'Lives: 3\nLine one\nLine two\nSay "cheese"\n-----',
      hint: '`\\n` starts a new line in the middle of a string. Double quotes inside single quotes need no escaping. `*` repeats a string.',
      explanation: 'Line 1 prints two arguments separated by a space: `Lives: 3`. Line 2’s `\\n` splits the output across two lines. Line 3 is a single-quoted string, so the double quotes inside are printed as-is. Line 4 repeats `-` five times: `-----`.',
    },
    {
      kind: 'concept',
      title: 'Controlling spacing: sep and end',
      blocks: [
        {
          type: 'p',
          text: 'Remember `print`’s signature from the docs lesson: `print(*objects, sep=\' \', end=\'\\n\')`. Two keyword arguments control the layout:',
        },
        {
          type: 'list',
          items: [
            '`sep` — what goes **between** the values (default: one space).',
            '`end` — what goes **after** the last value (default: a newline `\\n`).',
          ],
        },
        {
          type: 'code',
          title: 'layout.py',
          runnable: true,
          code: 'print(10, 20, 30)\nprint(10, 20, 30, sep=", ")\nprint("2026", "11", "04", sep="-")\nprint("Saving", end="")\nprint("...", end="")\nprint(" done")',
          output: '10 20 30\n10, 20, 30\n2026-11-04\nSaving... done',
          annotations: [
            { lines: 2, text: '`sep=", "` joins the values with a comma and a space.' },
            { lines: 3, text: 'Handy for dates and file paths.' },
            { lines: '4-6', text: 'With `end=""`, the next `print` continues on the same line — useful for progress messages.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'For anything fancier than spacing — lining up columns, controlling decimal places, embedding values in the middle of a sentence — Python programmers use **f-strings** like `print(f"HP: {hp}/{max_hp}")`. They’re coming up in the Strings lesson; `sep` and `end` cover the simple cases.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a program that prints this scoreboard exactly (three lines):\n\n```\nPLAYER 1: 250\nPLAYER 2: 180\nWinner: Player 1!\n```',
      starter: '# Print the scoreboard here\n',
      solution: 'print("PLAYER 1: 250")\nprint("PLAYER 2: 180")\nprint("Winner: Player 1!")\n',
      tests: '',
      expectOutput: 'PLAYER 1: 250\nPLAYER 2: 180\nWinner: Player 1!',
      checks: ['Three lines of output', 'Text, capitals and punctuation match exactly'],
      hint: 'One `print` per line. Watch the capital letters and the space after each colon.',
      explanation: 'Three `print` calls produce three lines. You could also write `print("PLAYER 1:", 250)` — `print` adds the space after the colon automatically — or use one `print` with `\\n` escapes. All of these produce identical output, and identical output is all that matters here.',
    },
    {
      kind: 'concept',
      title: 'Comments: notes for humans',
      blocks: [
        {
          type: 'p',
          text: 'Anything after a `#` on a line is a **[[comment]]**: Python ignores it completely. Comments are for the people who read your code — including you, six months from now.',
        },
        {
          type: 'code',
          title: 'comments.py',
          runnable: true,
          code: '# Damage calculation for the boss fight.\n# Bosses take half damage from normal attacks (design doc v2).\nbase_damage = 40\ncrit_multiplier = 2  # crits double damage\n\nprint("Normal hit:", base_damage // 2)\nprint("Critical hit:", base_damage * crit_multiplier // 2)\n# print("Debug: boss HP", 1000)',
          output: 'Normal hit: 20\nCritical hit: 40',
          annotations: [
            { lines: '1-2', text: 'Block comments on their own lines describe the code that follows. Line 2 explains *why* — the rule comes from the design doc.' },
            { lines: 4, text: 'An inline comment. PEP 8: at least two spaces before `#`, one space after it.' },
            { lines: 6, text: '`//` is floor division — divide and drop the remainder. More on numbers in two lessons.' },
            { lines: 8, text: '"Commenting out" a line disables it without deleting it. In VS Code, Ctrl+/ toggles comments on the selected lines.' },
          ],
        },
        {
          type: 'compare',
          left: {
            title: 'Comments that repeat the code',
            tone: 'bad',
            code: 'x = x + 1  # add one to x\nprint(x)   # print x',
            lang: 'python',
          },
          right: {
            title: 'Comments that explain why',
            tone: 'good',
            code: 'retries = retries + 1  # the server drops ~1% of requests\nprint(retries)',
            lang: 'python',
          },
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Good names reduce the need for comments: `enemy_count = 12` needs no comment, `n = 12  # number of enemies` does. Write the comment when the *reason* behind the code isn’t obvious.',
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'Python has no special multi-line comment syntax. For several lines, start each with `#`. A triple-quoted string at the top of a file or function is a **[[docstring]]** — documentation that `help()` can show — which you’ll write in the Functions unit.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'This line prints `Hello` and then `# world`:\n\n`print("Hello")  # world`',
      answer: false,
      explanation: 'False. Everything after the `#` (outside of a string) is a comment, so Python only runs `print("Hello")` and prints `Hello`. A `#` *inside* quotes is ordinary text, though: `print("# world")` prints `# world`.',
    },
    {
      kind: 'concept',
      title: 'When it breaks: syntax and indentation errors',
      blocks: [
        {
          type: 'p',
          text: 'Before running anything, Python compiles your whole file. If the code breaks the grammar, you get a [[syntax-error|SyntaxError]] and *nothing* runs — not even the lines before the mistake. Python 3.14’s messages are very specific. Here are the classics:',
        },
        {
          type: 'table',
          headers: ['You wrote', 'Python says', 'Fix'],
          rows: [
            ['`print("hi"`', '`SyntaxError: \'(\' was never closed`', 'Add the closing `)`'],
            ['`print("hi)`', '`SyntaxError: unterminated string literal`', 'Close the quote: `"hi"`'],
            ['`print(\'It\'s here\')`', '`SyntaxError: unterminated string literal`', 'Use double quotes outside: `"It\'s here"`'],
            ['`print("Score:" 10)`', '`SyntaxError: invalid syntax. Perhaps you forgot a comma?`', '`print("Score:", 10)`'],
            ['`    print("hi")` at the top level', '`IndentationError: unexpected indent`', 'Remove the spaces at the start of the line'],
            ['`Print("hi")`', '`NameError: name \'Print\' is not defined. Did you mean: \'print\'?`', 'Lowercase `print`'],
          ],
          caption: 'The last one isn’t a syntax error: the grammar is fine, but the name doesn’t exist — so it fails only when that line runs.',
        },
        {
          type: 'code',
          title: 'oops.py',
          runnable: true,
          code: 'print("This line is fine")\nprint("This one is not"',
          output: '  File "main.py", line 2\n    print("This one is not"\n         ^\nSyntaxError: \'(\' was never closed',
          annotations: [
            { lines: 1, text: 'Press Run: even this correct line doesn’t print, because the whole file must compile first.' },
            { lines: 2, text: 'The caret `^` points at the bracket that was opened and never closed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does indentation cause errors at all?',
          text: 'Because indentation is how Python knows which lines belong together. A line indented for no reason is like a sentence that starts in the middle of a paragraph: Python can’t tell what block it belongs to. Inside `if` statements, loops and functions (coming soon), indentation is required; at the top level of a file, lines must start in the very first column.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This program won’t start: Python reports `SyntaxError: unterminated string literal`. Tap the line with the bug.',
      lines: ['print("Welcome, traveler")', 'print("You have", 3, "potions")', "print('You can't go that way')", 'print("Goodbye")'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Line 3 starts a string with a single quote, so the apostrophe in `can\'t` *ends* the string early — and the rest of the line leaves a quote that is never closed. Fix it with double quotes outside, `print("You can\'t go that way")`, or escape the apostrophe: `\'You can\\\'t go that way\'`.',
    },
    {
      kind: 'order',
      prompt: 'Arrange these lines so the program prints:\n\n```\nREADY\n3... 2... 1...\nGO!\n```',
      lines: ['print("READY")', 'print("3...", end=" ")', 'print("2...", end=" ")', 'print("1...")', 'print("GO!")'],
      linesAreCode: true,
      explanation: '`READY` comes first on its own line. The countdown needs `end=" "` on `3...` and `2...` so they stay on one line separated by spaces; `1...` uses the default newline to finish that line. Then `GO!` prints on the last line.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so it prints `Path: C:\\games` on one line and then `"Done"` (with the quotes) on the next.',
      template: 'print("Path: C:___games___\\"Done\\"")',
      templateIsCode: true,
      blanks: [{ answers: ['\\\\'] }, { answers: ['\\n'] }],
      wordBank: ['\\\\', '\\n', '\\t', '#', '\\"'],
      explanation: '`\\\\` produces a single backslash, and `\\n` starts a new line. Inside a double-quoted string, `\\"` produces a literal double quote — that’s already written around `Done` in the template.',
    },
  ],
  takeaways: [
    '`print(...)` displays values; several arguments are separated by spaces and each call ends with a newline.',
    'Strings use `\'…\'` or `"…"` (identical); triple quotes span lines. Escape sequences: `\\n` newline, `\\t` tab, `\\\\` backslash, `\\"` quote.',
    '`sep=` changes what goes between values; `end=` changes what goes after them (`end=""` keeps the next print on the same line).',
    'A `#` starts a comment that Python ignores. Comment the *why*, not the obvious *what*.',
    'Python compiles the whole file first: one `SyntaxError` means nothing runs. Read the message — it usually names the exact fix.',
    'Indentation is syntax: an unexpected indent at the top level is an `IndentationError`.',
  ],
  reading: [
    { title: 'Built-in Functions: print()', url: 'https://docs.python.org/3/library/functions.html#print', source: 'docs', note: 'The official definition of `print`, including `sep`, `end`, `file` and `flush`.' },
    { title: 'String and Bytes literals', url: 'https://docs.python.org/3/reference/lexical_analysis.html#string-and-bytes-literals', source: 'docs', note: 'Every kind of quote, prefix and escape sequence, precisely defined.' },
    { title: 'PEP 8: Comments', url: 'https://peps.python.org/pep-0008/#comments', source: 'pep', note: 'How to write block comments, inline comments and docstrings in standard style.' },
    { title: 'The Python Tutorial: An Informal Introduction', url: 'https://docs.python.org/3/tutorial/introduction.html', source: 'tutorial', note: 'The official tutorial’s first steps with numbers, text and print.' },
  ],
};
