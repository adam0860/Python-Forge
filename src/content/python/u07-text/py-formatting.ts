import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-formatting',
  title: 'String Formatting',
  summary: 'The full format-spec mini-language behind f-strings — widths, alignment, signs, separators, precision, percentages, number bases and dynamic widths — plus `str.format`, `%`, `str` versus `repr`, date formatting and Python 3.14’s new template strings.',
  minutes: 19,
  objectives: [
    'Write f-strings with expressions, `=` debugging and `!r` conversions',
    'Use the format-spec mini-language: fill, alignment, sign, width, thousands separators, precision and type codes',
    'Compute widths dynamically with nested fields such as `{x:{w}.{p}f}`',
    'Read and write the older `str.format` and `%` styles, and know when a template must be a runtime value',
    'Explain the difference between `str()` and `repr()`, format dates with `%Y-%m-%d`, and describe what t-strings add in Python 3.14',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'f-strings: expressions inside text',
      blocks: [
        {
          type: 'p',
          text: 'An [[f-string]] is a string literal with an `f` prefix. Anything inside `{ }` is a full Python **expression**, evaluated when the line runs and converted to text. Adding `:spec` after the expression controls *how* it is displayed, which is what most of this lesson is about.',
        },
        {
          type: 'code',
          title: 'fstrings.py',
          runnable: true,
          code: `name, hp, max_hp = "Ada", 75, 120
print(f"{name} has {hp}/{max_hp} HP")
print(f"{hp / max_hp:.1%}")
print(f"{hp=} {max_hp=}")
print(f"{name!r} {name!s}")
print(f"{{literal braces}} {hp + 5}")
print(f"{'quoted'} {name.upper()} {[1, 2][1]}")`,
          output: `Ada has 75/120 HP
62.5%
hp=75 max_hp=120
'Ada' Ada
{literal braces} 80
quoted ADA 2`,
          annotations: [
            { lines: 2, text: 'Plain substitution: each `{…}` is replaced by the text form of its value.' },
            { lines: 3, text: 'Any expression works — here a division — followed by `:.1%`, a format spec that multiplies by 100, shows one decimal and adds `%`.' },
            { lines: 4, text: '`{hp=}` prints the expression *and* its value: `hp=75`. A beloved debugging shortcut (Python 3.8+).' },
            { lines: 5, text: '`!r` applies `repr()` instead of `str()` — it shows quotes. `!s` is the default.' },
            { lines: 6, text: 'To print literal braces, double them: `{{` and `}}`.' },
            { lines: 7, text: 'Method calls, indexing and nested quotes all work. (Since Python 3.12 you can even reuse the same kind of quote inside the braces.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why f-strings won',
          text: 'Older ways to format put the values *far* from where they appear (`"%s has %d" % (name, hp)`), so you have to match them up by position. In an f-string the value is written exactly where it shows up, which is shorter, easier to read and harder to get wrong — and, since f-strings are compiled to direct string-building code, they are also the fastest option.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Don’t forget the f',
          text: 'Without the `f` prefix, `"Level {level}"` is an ordinary string and prints the braces literally. The program won’t crash, which makes this a very easy bug to miss.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `f"{0.625:.1%}"` produce?',
      options: [
        { text: '`0.6%`', why: 'The `%` type multiplies by 100 first.' },
        { text: '`62.5%`', correct: true, why: 'Right: 0.625 × 100 = 62.5, shown with one decimal place and a percent sign.' },
        { text: '`0.625%`', why: 'The `%` format type scales the number; it does not just append a symbol.' },
        { text: '`63%`', why: 'That would be `.0%`, which rounds to a whole number.' },
      ],
      explanation: 'The `%` presentation type multiplies the number by 100 and appends `%`. The `.1` is the precision — one digit after the decimal point — so 0.625 becomes `62.5%`.',
    },
    {
      kind: 'concept',
      title: 'The format-spec mini-language',
      blocks: [
        {
          type: 'p',
          text: 'After the colon comes a compact spec with a fixed grammar. Read it left to right: **[[fill]align] [sign] [#] [0] [width] [, or _] [.precision] [type]**. Every part is optional, so you rarely write them all.',
        },
        {
          type: 'code',
          title: 'format_specs.py',
          runnable: true,
          code: `n = 1234567.891
print(f"{n:,.2f}")
print(f"{n:_.0f}")
print(f"[{42:5d}] [{42:<5d}] [{42:^5d}] [{42:05d}]")
print(f"[{'hi':>6}] [{'hi':<6}] [{'hi':^6}] [{'hi':*^6}]")
print(f"{255:b} {255:o} {255:x} {255:X} {255:#x} {255:#010b}")
print(f"{12345.6789:e} {0.00001234:.2e} {1e6:g}")
print(f"{3.14159:+.2f} {-3.14159:+.2f} {5: d}")
print(f"{0.256:.0%}")
w, p = 10, 3
print(f"[{3.14159:{w}.{p}f}]")`,
          output: `1,234,567.89
1_234_568
[   42] [42   ] [ 42  ] [00042]
[    hi] [hi    ] [  hi  ] [**hi**]
11111111 377 ff FF 0xff 0b11111111
1.234568e+04 1.23e-05 1e+06
+3.14 -3.14  5
26%
[     3.142]`,
          annotations: [
            { lines: 2, text: '`,` adds thousands separators; `.2f` fixes two decimals. Together: `,.2f`, the standard money format.' },
            { lines: 3, text: '`_` is the alternative separator (nice for binary and hex too). `.0f` rounds to a whole number.' },
            { lines: 4, text: 'Integers: `5d` is width 5, right-aligned by default; `<` left-aligns, `^` centers; `05d` pads with zeros.' },
            { lines: 5, text: 'Strings default to left alignment. Put any character before the align symbol to use it as **fill**: `*^6` centers with stars.' },
            { lines: 6, text: 'Type codes for integers: `b` binary, `o` octal, `x`/`X` hexadecimal. `#` adds the `0x`/`0b` prefix; `#010b` is "prefixed, zero-padded, 10 wide".' },
            { lines: 7, text: '`e` is scientific notation; `g` picks the shorter of fixed and scientific, which is handy when magnitudes vary.' },
            { lines: 8, text: '`+` always shows the sign; a space reserves room for a sign so positive and negative numbers line up.' },
            { lines: 9, text: '`.0%` rounds to a whole percent.' },
            { lines: 11, text: '**Nested fields**: width and precision can themselves come from variables, so column widths can be computed at run time.' },
          ],
        },
        {
          type: 'table',
          headers: ['Type', 'Meaning', 'Example (value → output)'],
          rows: [
            ['`d`', 'integer', '`f"{42:d}"` → `42`'],
            ['`f`', 'fixed-point', '`f"{3.14159:.2f}"` → `3.14`'],
            ['`e`', 'scientific', '`f"{12345.6789:.2e}"` → `1.23e+04`'],
            ['`%`', 'percent (×100)', '`f"{0.256:.0%}"` → `26%`'],
            ['`b` `o` `x`', 'binary, octal, hex', '`f"{255:x}"` → `ff`'],
            ['`s`', 'string (default)', '`f"{"hi":>4}"` → `  hi`'],
          ],
          caption: 'Alignment symbols: `<` left, `>` right, `^` center, `=` pad between sign and digits.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Memorize three specs',
          text: '`:,.2f` (money), `:.1%` (percent) and `:>8` / `:<8` (alignment) cover most of what you will ever need. Look up the rest in the docs’ "Format Specification Mini-Language" page.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this one line.',
      code: `print(f"[{7:03d}] [{'ab':>4}] [{3.14159:.2f}]")`,
      answer: '[007] [  ab] [3.14]',
      hint: 'Zero-padded to width 3; right-aligned in width 4; two decimals.',
      explanation: '`07:03d` pads with zeros to width 3: `007`. `\'ab\':>4` right-aligns in 4 characters: two spaces then `ab`. `3.14159:.2f` rounds to two decimals: `3.14`.',
    },
    {
      kind: 'fill',
      prompt: 'Supply the format spec that produces each commented result.',
      template: `score = 3
price = 1234.5
print(f"{score:___}")     # 003
print(f"{price:___}")     # 1,234.50
print(f"{price:___}")     # 1.2e+03`,
      templateIsCode: true,
      blanks: [{ answers: ['03d', '03'] }, { answers: [',.2f'] }, { answers: ['.1e'] }],
      explanation: '`03d` means zero-padded, width 3, integer. `,.2f` adds a thousands separator and two decimals. `.1e` gives scientific notation with one digit after the decimal point: `1.2e+03`.',
    },
    {
      kind: 'concept',
      title: 'format(), % and templates that aren’t literals',
      blocks: [
        {
          type: 'p',
          text: 'An f-string must be written directly in the source, because it is evaluated on the spot. Sometimes the template text arrives from *outside* the program — a translation file, a config setting, a user-edited message. For those, the older `str.format` method works on any string, and the printf-style `%` operator (familiar from C) is still common in older code and in logging.',
        },
        {
          type: 'code',
          title: 'format_methods.py',
          runnable: true,
          code: `template = "{name} the {cls} has {hp} HP"
print(template.format(name="Ada", cls="mage", hp=75))
stats = {"name": "Ben", "cls": "orc", "hp": 120}
print(template.format(**stats))
print("{0} {1} {0}".format("a", "b"))
print("%s has %d HP (%.1f%%)" % ("Ada", 75, 62.5))
print(format(1234.5, ",.1f"), format("x", ">3"))
from string import Template
print(Template("$who scored $pts").substitute(who="Cai", pts=90))`,
          output: `Ada the mage has 75 HP
Ben the orc has 120 HP
a b a
Ada has 75 HP (62.5%)
1,234.5   x
Cai scored 90`,
          annotations: [
            { lines: 2, text: '`template` is an ordinary string, so it can come from a file or a setting. `.format` fills the named fields from keyword arguments; the same spec mini-language works inside: `{hp:>5}`.' },
            { lines: 4, text: '`**stats` spreads a dictionary into keyword arguments — the Parameters lesson at work.' },
            { lines: 5, text: 'Numbered fields can repeat and reorder values — useful when translations need a different word order.' },
            { lines: 6, text: 'The `%` style: `%s` text, `%d` integer, `%.1f` one decimal, and `%%` for a literal percent sign. You will see it in older code and logging calls.' },
            { lines: 7, text: 'The built-in `format(value, spec)` applies a spec directly, with no template.' },
            { lines: 9, text: '`string.Template` uses `\\$name` fields and is deliberately limited — a safer choice for text written by *untrusted* users, since it can’t evaluate attribute access or run format specs.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never .format() text you don’t control carelessly',
          text: 'A format string like `"{player.__class__}"` can reach into objects. If a template comes from a user (a chat message, a mod), use `string.Template` or fill it in with a function you control, not `.format` with real game objects.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'printf, std::format and f-strings',
          text: 'The `%` operator will feel like `printf`; `str.format` resembles C++20’s `std::format`, which borrowed the same `{}` and `:spec` syntax from Python. For everyday code, f-strings replace both — because the value sits right in the text.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Inside an f-string, `{ }` can only contain a plain variable name; expressions such as `hp + 5` or `name.upper()` are not allowed.',
      answer: false,
      explanation: 'False. The braces hold any Python expression: arithmetic, method calls, indexing, conditional expressions, even function calls. Only statements (like assignments or `for`) are not allowed.',
    },
    {
      kind: 'error',
      prompt: 'The program should print `Level 3: Ada`, but it prints the text `Level {level}: {name}` instead. Tap the line with the mistake.',
      lines: ['level = 3', 'name = "Ada"', 'print("Level {level}: {name}")'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The string on line 3 has no `f` prefix, so it is an ordinary string and the braces are printed literally. Write `print(f"Level {level}: {name}")`.',
    },
    {
      kind: 'concept',
      title: 'str versus repr, and dates',
      blocks: [
        {
          type: 'p',
          text: 'Every object can show itself in two ways. `str(x)` is meant for **people**: tidy and readable. `repr(x)` is meant for **programmers**: unambiguous, ideally something you could paste back into Python. `print` uses `str`; the REPL and debuggers use `repr`; and lists show the `repr` of their items.',
        },
        {
          type: 'code',
          title: 'str_repr_dates.py',
          runnable: true,
          code: `s = "line1\\nline2"
print(s)
print(repr(s))
print(str(3.0), repr(3.0), str("x"), repr("x"))
print(["a", "b"])

from datetime import datetime
when = datetime(2026, 11, 7, 6, 30)
print(f"{when:%Y-%m-%d %H:%M}  {when:%A %d %B}")
print(when)`,
          output: `line1
line2
'line1\\nline2'
3.0 3.0 x 'x'
['a', 'b']
2026-11-07 06:30  Saturday 07 November
2026-11-07 06:30:00`,
          annotations: [
            { lines: 2, text: '`print` shows the *meaning* of the escape: two lines.' },
            { lines: 3, text: '`repr` shows the string as source code, with quotes and the `\\n` escape visible. Perfect for spotting hidden whitespace and special characters.' },
            { lines: 4, text: 'For a string, `repr` adds quotes; for numbers the two usually agree.' },
            { lines: 5, text: 'Containers use `repr` for their items, which is why you see quotes inside the list.' },
            { lines: 9, text: 'Dates have their own spec language, `strftime` codes: `%Y` year, `%m` month, `%d` day, `%H` hour, `%M` minute, `%A` weekday name, `%B` month name. The format spec after the colon is handed straight to the object.' },
            { lines: 10, text: '`str(datetime)` uses ISO 8601 — a sortable, unambiguous format that is also good for logs and save files.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'The format protocol',
          text: 'When you write `f"{value:spec}"`, Python calls `type(value).__format__(value, spec)`. Numbers, strings and dates each interpret the spec their own way; your own classes can too (Unit 10 explains `__format__`, `__str__` and `__repr__`). That is why `{when:%Y-%m-%d}` works with the same syntax as `{n:,.2f}`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Debugging with !r',
          text: 'When text behaves oddly — a comparison fails, a lookup misses — print it with `!r`: `print(f"{name!r}")`. Trailing spaces, tabs and newlines become visible, and `"1"` is clearly distinguished from `1`.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many characters long is the string produced by `f"{1234567:,}"`?',
      answer: '9',
      hint: 'Count the digits and the commas: 1,234,567.',
      explanation: 'The comma spec gives `1,234,567`: seven digits plus two separators, so $7 + 2 = 9$ characters.',
      label: 'Length:',
    },
    {
      kind: 'concept',
      title: 'Computed widths, reports and t-strings',
      blocks: [
        {
          type: 'p',
          text: 'Nested replacement fields let one value decide how another is shown, so a report can size its columns from the data itself. The newest addition to the family is the **t-string** (Python 3.14, PEP 750): written like an f-string with a `t` prefix, but instead of immediately producing text, it produces a `Template` object that keeps the literal strings and the interpolated values *separate*.',
        },
        {
          type: 'code',
          title: 'reports_and_tstrings.py',
          runnable: true,
          code: `rows = [("Ada", 1200), ("Benedict", 85), ("Cai", 9)]
width = max(len(name) for name, _ in rows)
for name, score in rows:
    print(f"{name:<{width}} | {score:>6,}")
print(f"{'Total':<{width}} | {sum(s for _, s in rows):>6,}")

from string.templatelib import Interpolation

def render_upper(template):
    parts = []
    for item in template:
        if isinstance(item, Interpolation):
            parts.append(str(item.value).upper())
        else:
            parts.append(item)
    return "".join(parts)

name = "ada"
print(render_upper(t"Hello {name}, welcome!"))`,
          output: `Ada      |  1,200
Benedict |     85
Cai      |      9
Total    |  1,294
Hello ADA, welcome!`,
          annotations: [
            { lines: 2, text: 'The widest name decides the width of the first column.' },
            { lines: 4, text: '`{name:<{width}}` — the inner `{width}` is replaced first, giving `<8`. `{score:>6,}` right-aligns the score with a thousands separator.' },
            { lines: 5, text: 'Quotes inside an f-string expression can be reused in 3.12+; `{sum(...):>6,}` formats a computed total.' },
            { lines: 7, text: 'A t-string (`t"…"`) does **not** build a string. It builds a `Template` made of text pieces and `Interpolation` objects (each holding the value, its expression text and any spec).' },
            { lines: 11, text: 'Iterating a template yields the literal strings and the interpolations in order, so *your* code decides how each value is rendered — escaping it, quoting it, upper-casing it.' },
            { lines: 17, text: 'The result: the value was transformed by our function, not simply pasted in.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'What are t-strings for?',
          text: 'An f-string pastes values straight into text — dangerous for SQL, HTML or shell commands, where an unescaped value is a security hole (injection). A t-string hands the pieces to a function that can *safely escape* each value before assembling the result. Libraries will adopt it for safe SQL, HTML templating and structured logging. For plain display text, f-strings remain the right tool.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Python 3.14 only',
          text: 't-strings are new in Python 3.14. Earlier versions raise a `SyntaxError`, so projects that must support 3.13 or older can’t use them yet — a good reminder to check your minimum Python version.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `format_money(cents)` that takes a whole number of cents and returns a dollar string with a thousands separator and two decimals: `format_money(123456)` is `"\\$1,234.56"` and `format_money(5)` is `"\\$0.05"`.',
      starter: `# define format_money here
`,
      solution: `def format_money(cents):
    return f"\${cents / 100:,.2f}"
`,
      tests: `assert format_money(123456) == "$1,234.56", format_money(123456)
assert format_money(5) == "$0.05"
assert format_money(0) == "$0.00"
assert format_money(100) == "$1.00"
assert format_money(100000000) == "$1,000,000.00"`,
      checks: ['Dollar sign, thousands separator and two decimals', 'Small amounts such as 5 cents give `\\$0.05`'],
      hint: 'Divide by 100, then use the spec `,.2f` and put a literal `\\$` in front.',
      explanation: '`cents / 100` converts to dollars, and `:,.2f` gives a thousands separator and exactly two decimals, so 5 cents becomes `0.05`. The `\\$` is plain text in the f-string. (For real money, store cents as integers and avoid floats for sums — the `decimal` module handles precision.)',
    },
    {
      kind: 'code',
      prompt: 'Write `scoreboard(rows)` that takes a list of `(name, score)` tuples and returns a **single string** with one line per row: the name left-aligned in 8 characters followed by the score right-aligned in 5, with lines joined by `"\\n"` (no trailing newline).\n\nFor `[("Ada", 120), ("Ben", 7)]` it returns `"Ada       120\\nBen         7"`.',
      starter: `# define scoreboard here
`,
      solution: `def scoreboard(rows):
    lines = []
    for name, score in rows:
        lines.append(f"{name:<8}{score:>5}")
    return "\\n".join(lines)
`,
      tests: `assert scoreboard([("Ada", 120), ("Ben", 7)]) == "Ada       120\\nBen         7", repr(scoreboard([("Ada", 120), ("Ben", 7)]))
assert scoreboard([]) == ""
assert scoreboard([("Christina", 5)]) == "Christina    5"`,
      checks: ['Name left-aligned in width 8, score right-aligned in width 5', 'Lines are joined with newlines and no trailing newline', 'A name longer than 8 characters is not cut off'],
      hint: 'Per row: `f"{name:<8}{score:>5}"`. Collect the lines in a list and finish with `"\\n".join(lines)`.',
      explanation: 'The spec `<8` pads or leaves the name as it is — a longer name overflows rather than being truncated — and `>5` right-aligns the number. `"\\n".join(lines)` places newlines only *between* lines, so there is no trailing one.',
    },
    {
      kind: 'code',
      prompt: 'Write `progress_bar(fraction, width=10)` that returns a text bar: `#` for the filled part, `-` for the rest, followed by the percentage. `progress_bar(0.4)` is `"[####------] 40%"` and `progress_bar(1, 4)` is `"[####] 100%"`.',
      starter: `# define progress_bar here
`,
      solution: `def progress_bar(fraction, width=10):
    filled = round(fraction * width)
    return f"[{'#' * filled}{'-' * (width - filled)}] {fraction:.0%}"
`,
      tests: `assert progress_bar(0.4) == "[####------] 40%", progress_bar(0.4)
assert progress_bar(1, 4) == "[####] 100%"
assert progress_bar(0, 4) == "[----] 0%"
assert progress_bar(0.5, 4) == "[##--] 50%"
assert progress_bar(0.7) == "[#######---] 70%"`,
      checks: ['Filled and empty parts add up to `width`', 'Percentage shown with no decimals'],
      hint: 'Work out `filled = round(fraction * width)`, then repeat `"#"` that many times and `"-"` for the remainder. `{fraction:.0%}` formats the percentage.',
      explanation: 'String repetition builds the two halves of the bar, and `.0%` turns the fraction into a whole-number percentage. Loading screens, health bars in a terminal UI and training-progress displays are all built from exactly these pieces.',
    },
  ],
  takeaways: [
    'An f-string evaluates any expression in `{ }`; `{x=}` shows the expression and value, `{x!r}` uses `repr`, and `{{ }}` prints braces. Don’t forget the `f` prefix.',
    'Format spec grammar: `[[fill]align][sign][#][0][width][,|_][.precision][type]` — e.g. `:>8`, `:05d`, `:,.2f`, `:.1%`, `:#x`. Nested fields (`{x:{w}.{p}f}`) compute widths at run time.',
    '`str.format`, `format()`, `%` and `string.Template` work on template text that isn’t a source literal; use `Template` for untrusted text.',
    '`str()` is for people and `repr()` for programmers: lists, debuggers and `!r` show `repr`. Dates use `strftime` codes like `%Y-%m-%d %H:%M`.',
    'Python 3.14’s t-strings (`t"…"`) produce a `Template` that separates strings from values, enabling safe escaping for SQL, HTML and logging.',
  ],
  reading: [
    { title: 'Format Specification Mini-Language', url: 'https://docs.python.org/3/library/string.html#format-specification-mini-language', source: 'docs', note: 'The complete grammar of format specs, with a table of every type code.' },
    { title: 'Formatted string literals (Reference)', url: 'https://docs.python.org/3/reference/lexical_analysis.html#f-strings', source: 'docs', note: 'The precise rules for f-strings, including the Python 3.12 improvements.' },
    { title: 'PEP 750 — Template Strings', url: 'https://peps.python.org/pep-0750/', source: 'pep', note: 'The design of t-strings and the `string.templatelib` module.' },
    { title: 'datetime: strftime() and strptime() format codes', url: 'https://docs.python.org/3/library/datetime.html#strftime-and-strptime-format-codes', source: 'docs', note: 'Every `%` code for dates and times.' },
  ],
};
