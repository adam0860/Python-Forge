import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-regex',
  title: 'Regular Expressions',
  summary: 'Find, validate, extract and rewrite text with the `re` module: search versus match, pattern syntax, groups and named groups, greedy versus lazy matching, flags, verbose patterns, and when not to use a regex at all.',
  minutes: 20,
  objectives: [
    'Use `re.search`, `match`, `fullmatch`, `findall`, `finditer`, `sub` and `split`, and write patterns as raw strings',
    'Read and write patterns using character classes, quantifiers, anchors, word boundaries and alternation',
    'Capture parts of a match with groups and named groups, and reuse them in `re.sub` replacements',
    'Explain greedy versus lazy quantifiers and use flags such as `re.IGNORECASE` and `re.VERBOSE`',
    'Judge when a regular expression is the right tool and when plain string methods or a parser are better',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A pattern language for text',
      blocks: [
        {
          type: 'p',
          text: 'String methods like `split` and `find` look for *exact* text. A [[regular-expression]] (regex) describes a **shape** of text instead — "one or more digits", "a word followed by a colon", "a date written as dd/mm/yyyy". Python’s `re` module compiles the pattern and searches strings for matches.',
        },
        {
          type: 'p',
          text: 'Regex patterns are full of backslashes (`\\d` for a digit, `\\b` for a word boundary), and Python strings treat backslashes as escapes too. The fix is to always write patterns as [[raw-string|raw strings]]: `r"\\d+"`. The `r` prefix tells Python to leave every backslash alone and pass it to the regex engine.',
        },
        {
          type: 'code',
          title: 're_basics.py',
          runnable: true,
          code: `import re
text = "Ada scored 120 points; Ben scored 95; Cai scored 7."
print(re.search(r"\\d+", text))
m = re.search(r"\\d+", text)
print(m.group(), m.span())
print(re.findall(r"\\d+", text))
print(re.match(r"Ada", text) is not None, re.match(r"Ben", text))
print(re.fullmatch(r"\\d+", "123"), re.fullmatch(r"\\d+", "123a"))
print(re.sub(r"\\d+", "#", text))
print(re.split(r"[;,]\\s*", "a; b,c;d"))`,
          output: `<re.Match object; span=(11, 14), match='120'>
120 (11, 14)
['120', '95', '7']
True None
<re.Match object; span=(0, 3), match='123'> None
Ada scored # points; Ben scored #; Cai scored #.
['a', 'b', 'c', 'd']`,
          annotations: [
            { lines: 3, text: '`re.search` scans the string and returns a **match object** for the *first* place the pattern fits — or `None` if it never does. `\\d+` means "one or more digits".' },
            { lines: 5, text: 'A match object knows what it matched: `.group()` is the text and `.span()` is its start and end positions.' },
            { lines: 6, text: '`re.findall` returns *every* non-overlapping match as a list of strings.' },
            { lines: 7, text: '`re.match` only matches at the **start** of the string. "Ada" is at the start, so it matches; "Ben" is not, so the result is `None`.' },
            { lines: 8, text: '`re.fullmatch` requires the **whole** string to fit the pattern. `"123a"` fails because of the trailing `a`.' },
            { lines: 9, text: '`re.sub(pattern, replacement, text)` replaces every match.' },
            { lines: 10, text: '`re.split` splits on a pattern instead of a fixed string: here a `;` or `,` followed by any whitespace (`\\s*` means zero or more).' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Always check for None',
          text: '`re.search(...)` returns `None` when nothing matches, and `None.group()` raises `AttributeError`. Write `if m := re.search(pattern, text):` (the walrus operator) and use `m` inside the `if`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother with regex?',
          text: 'Checking "does this look like a valid username?" or "pull all the coordinates out of this log" with `split` and `if` statements takes dozens of lines and is easy to get wrong. A one-line pattern states the intent directly. The price is readability, which is why regex is best kept for jobs that genuinely need a pattern (the last concept step returns to this).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `re.match(r"\\d+", "abc123")` return?',
      options: [
        { text: 'A match object for `123`', why: 'That would be `re.search`, which scans the whole string. `re.match` only tries the very beginning.' },
        { text: '`None`', correct: true, why: 'Right: the string starts with `a`, which is not a digit, and `re.match` does not look any further.' },
        { text: '`["123"]`', why: 'A list of strings is what `re.findall` returns, not `re.match`.' },
        { text: 'It raises a `ValueError`', why: 'No error is raised for a failed match; the function simply returns `None`.' },
      ],
      explanation: '`re.match` anchors at the start of the string, `re.search` finds the pattern anywhere, and `re.fullmatch` requires the pattern to cover the entire string. A frequent beginner bug is using `match` when `search` was intended.',
    },
    {
      kind: 'concept',
      title: 'The pattern toolbox',
      blocks: [
        {
          type: 'p',
          text: 'Most patterns combine a handful of building blocks: **what** to match (characters and classes), **how many** (quantifiers) and **where** (anchors). Anything not special matches itself; the special characters are `. ^ \\$ * + ? { } [ ] \\ ( )` and the vertical bar for alternatives, and a backslash in front of one makes it literal.',
        },
        {
          type: 'table',
          headers: ['Pattern', 'Matches', 'Example'],
          rows: [
            ['`.`', 'any one character except newline', '`a.c` matches `abc`, `a-c`'],
            ['`\\d` `\\w` `\\s`', 'digit, word character (letter, digit, `_`), whitespace', '`\\d\\d` matches `42`'],
            ['`\\D` `\\W` `\\S`', 'the opposite of each', '`\\S+` matches a run of non-space'],
            ['`[abc]` `[a-z]` `[^0-9]`', 'one character from the set, a range, or *not* in the set', '`[aeiou]` matches a vowel'],
            ['`*` `+` `?`', 'zero or more, one or more, zero or one', '`colou?r` matches `color` and `colour`'],
            ['`{n}` `{n,m}`', 'exactly n, or between n and m', '`\\d{4}` matches `2026`'],
            ['`^` `\\$`', 'start and end of the string', '`^Ada` only at the start'],
            ['`\\b`', 'a word boundary', '`\\bcat\\b` matches `cat`, not `concat`'],
            ['`a|b`', 'either alternative', '`cat|dog` matches either word'],
          ],
          caption: 'Core regex syntax. To match a special character literally, escape it: `\\.` matches a real dot.',
        },
        {
          type: 'code',
          title: 'greedy_flags.py',
          runnable: true,
          code: `import re
html = "<b>bold</b> and <i>it</i>"
print(re.findall(r"<.+>", html))
print(re.findall(r"<.+?>", html))
print(re.findall(r"<[^>]+>", html))
print(re.search(r"hello", "Say HELLO"), re.search(r"hello", "Say HELLO", re.IGNORECASE).group())
print(re.findall(r"^\\w+", "one\\ntwo\\nthree", re.MULTILINE))
print(re.findall(r"^\\w+", "one\\ntwo\\nthree"))
print(re.findall(r"\\bcat\\b", "cat concat cat."), re.findall(r"cat", "cat concat cat."))`,
          output: `['<b>bold</b> and <i>it</i>']
['<b>', '</b>', '<i>', '</i>']
['<b>', '</b>', '<i>', '</i>']
None HELLO
['one', 'two', 'three']
['one']
['cat', 'cat'] ['cat', 'cat', 'cat']`,
          annotations: [
            { lines: 3, text: '**Greedy** (the default): `.+` grabs as much as it can, so `<.+>` runs from the *first* `<` to the *last* `>` and finds one giant match.' },
            { lines: 4, text: '**Lazy**: adding `?` after a quantifier (`+?`, `*?`) makes it take as little as possible, so each tag is matched separately.' },
            { lines: 5, text: 'Often the cleanest fix is to say exactly what is allowed: "one or more characters that are not `>`", written `[^>]+`.' },
            { lines: 6, text: 'Flags change matching rules. `re.IGNORECASE` ignores letter case. Without it, "hello" does not match "HELLO" and the result is `None`.' },
            { lines: 7, text: 'With `re.MULTILINE`, `^` matches at the start of *every line*.' },
            { lines: 8, text: 'Without it, `^` only matches at the start of the whole string, so only `one` is found.' },
            { lines: 9, text: '`\\b` stops `cat` matching inside `concat`: the first call finds two whole words, the plain pattern finds three occurrences of the letters.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '`.` is not a dot',
          text: 'In a pattern, `.` means "any character". To match a real period, write `\\.` — or wrap user-supplied text in `re.escape(text)` so *all* special characters are treated literally. Forgetting this makes `"1.5"` also match `"1x5"`.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Watch greedy versus lazy.',
      code: `import re
print(re.findall(r"<.+?>", "<a><b>"), re.findall(r"<.+>", "<a><b>"))`,
      answer: "['<a>', '<b>'] ['<a><b>']",
      hint: 'The lazy `+?` stops at the first `>`; the greedy `+` runs to the last one.',
      explanation: 'The lazy version stops at the first `>` it can, so it finds `<a>` and then `<b>` separately. The greedy version keeps going to the *last* `>` in the string and returns one match covering everything.',
    },
    {
      kind: 'fill',
      prompt: 'Complete each pattern so that the comment on the line is true.',
      template: `import re
print(re.findall(r"___+", "a1b22c333"))             # ['1', '22', '333']
print(re.findall(r"[___]", "hello"))                # ['e', 'o']
print(re.fullmatch(r"\\d___", "42") is not None)     # exactly two digits: True`,
      templateIsCode: true,
      blanks: [{ answers: ['\\d'] }, { answers: ['aeiou'] }, { answers: ['{2}'] }],
      wordBank: ['\\d', '\\s', 'aeiou', 'xyz', '{2}', '?'],
      explanation: '`\\d+` finds runs of one or more digits. `[aeiou]` is a character class that matches one vowel. `\\d{2}` matches exactly two digits — and because the call is `fullmatch`, the whole string must be those two digits.',
    },
    {
      kind: 'concept',
      title: 'Groups: capture, name, reuse',
      blocks: [
        {
          type: 'p',
          text: 'Parentheses create a **group**. A group does two jobs: it treats several characters as one unit (so `(ab)+` repeats "ab"), and it *captures* the text it matched so you can read it back. Groups are numbered from 1 by the order of their opening parenthesis; `(?P<name>…)` gives a group a name, which makes patterns self-documenting.',
        },
        {
          type: 'code',
          title: 'groups.py',
          runnable: true,
          code: `import re
text = "Ada scored 120 points; Ben scored 95; Cai scored 7."
for m in re.finditer(r"(\\w+) scored (\\d+)", text):
    print(m.group(1), int(m.group(2)), m.start())
m = re.search(r"(?P<name>\\w+) scored (?P<pts>\\d+)", text)
print(m.group("name"), m.groupdict(), m.groups())
print(re.findall(r"(\\w+) scored (\\d+)", text))
print(re.sub(r"(\\w+) scored (\\d+)", r"\\2:\\1", text))
print(re.sub(r"\\d+", lambda m: str(int(m.group()) * 2), text))`,
          output: `Ada 120 0
Ben 95 23
Cai 7 38
Ada {'name': 'Ada', 'pts': '120'} ('Ada', '120')
[('Ada', '120'), ('Ben', '95'), ('Cai', '7')]
120:Ada points; 95:Ben; 7:Cai.
Ada scored 240 points; Ben scored 190; Cai scored 14.`,
          annotations: [
            { lines: 3, text: '`re.finditer` yields one match object per match — better than `findall` when you need positions or several groups. Here group 1 is the name and group 2 the score.' },
            { lines: 4, text: '`m.group(2)` is always *text*, so convert it: `int(m.group(2))`. `m.start()` is where the match begins in the string.' },
            { lines: 5, text: '`(?P<name>…)` names a group. Named groups survive edits to the pattern, because you refer to them by name rather than by position.' },
            { lines: 6, text: '`.groupdict()` returns all named groups as a dictionary; `.groups()` returns all groups as a tuple.' },
            { lines: 7, text: 'When the pattern has groups, `findall` returns **tuples of the groups** rather than the whole matches. Wrap it in `dict(...)` to get a name-to-score mapping directly.' },
            { lines: 8, text: 'In a replacement string, `\\1`, `\\2` refer to captured groups: this swaps the name and the score.' },
            { lines: 9, text: 'The replacement can also be a **function** that receives the match object and returns the new text — here doubling every number.' },
          ],
        },
        {
          type: 'code',
          title: 'verbose_patterns.py',
          runnable: true,
          code: `import re
pat = re.compile(r"""
    (?P<year>\\d{4}) -
    (?P<month>\\d{2}) -
    (?P<day>\\d{2})
""", re.VERBOSE)
print(pat.fullmatch("2026-11-07").groupdict())
print(pat.search("on 2026-11-07!").group("month"))
print(re.findall(r"(?<=#)\\d+", "item #30, #45, not 60"))
print(re.escape("a.b*c"), re.search(re.escape("a.b"), "axb"))
try:
    re.compile("(")
except re.error as e:
    print("bad pattern:", e)`,
          output: `{'year': '2026', 'month': '11', 'day': '07'}
11
['30', '45']
a\\.b\\*c None
bad pattern: missing ), unterminated subpattern at position 0`,
          annotations: [
            { lines: 2, text: '`re.compile` builds the pattern once and returns a reusable object with the same methods (`search`, `findall`, `sub`…). Worth doing when a pattern is used many times, for example on every line of a log.' },
            { lines: 3, text: '`re.VERBOSE` lets you spread a pattern over several lines, with whitespace and `#` comments ignored — the way to keep long patterns readable.' },
            { lines: 7, text: 'A compiled pattern has the methods directly; `fullmatch` requires the whole string to be a date.' },
            { lines: 8, text: '`search` finds the date inside a longer string, and `.group("month")` fetches one named group.' },
            { lines: 9, text: '`(?<=#)` is a **lookbehind**: "preceded by a `#`". It checks context without including it in the match, so only the digits come back. (Lookaheads, `(?=…)`, do the same for what follows.)' },
            { lines: 10, text: '`re.escape` makes every special character literal, which is what you want when the pattern comes from user text.' },
            { lines: 12, text: 'An invalid pattern raises `re.error` when it is compiled; the message includes the position of the problem.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How the engine works: backtracking',
          text: 'Python’s regex engine tries your pattern from left to right and, when a choice fails, *backs up* and tries the next option. That is why greedy `.+` first grabs everything and then gives characters back until the rest of the pattern fits. It also explains a danger: patterns with nested repeats such as `(a+)+\\$` can take exponential time on certain inputs ("catastrophic backtracking"). Never run an untrusted pattern, and be careful with nested quantifiers on untrusted text.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Unicode-aware by default',
          text: 'For `str` patterns, `\\w`, `\\d` and `\\s` match Unicode letters, digits and spaces — `\\w` matches `ë`. When you need strictly ASCII, spell out a class like `[A-Za-z0-9_]` or pass `re.ASCII`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'When a regex has two capture groups, `re.findall` returns a list of the full matched strings, just as it does for a pattern with no groups.',
      answer: false,
      explanation: 'False. With one group `findall` returns the text of that group; with several groups it returns a list of **tuples**, one tuple of group texts per match. Use `finditer` when you want the whole match objects, or `re.sub`/`group(0)` for the entire matched text.',
    },
    {
      kind: 'error',
      prompt: 'The program should only accept the exact version `1.5`, but it also accepts `1x5`. Tap the line with the bug.',
      lines: [
        'import re',
        'version = "1x5"',
        'if re.fullmatch("1.5", version):',
        '    print("exact version 1.5")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'In a pattern `.` matches **any** character, so `"1.5"` matches `1x5` as well. Escape the dot — `re.fullmatch(r"1\\.5", version)` — or use `re.escape("1.5")`. For an exact comparison like this, plain `version == "1.5"` is even simpler.',
    },
    {
      kind: 'concept',
      title: 'Using regex wisely',
      blocks: [
        {
          type: 'p',
          text: 'Regular expressions are powerful and easy to overuse. A good rule: reach for string methods first (`startswith`, `in`, `split`, `replace`), and use `re` when the *shape* of the text varies — optional parts, repeated parts, alternatives, or "any number". Typical good fits are validating identifiers, extracting numbers or tags from logs, tokenizing commands, and cleaning up messy input.',
        },
        {
          type: 'table',
          headers: ['Task', 'Better tool'],
          rows: [
            ['Does the text contain `"error"`?', '`"error" in text`'],
            ['Split on a single separator', '`text.split(",")`'],
            ['Replace one exact word', '`text.replace("a", "b")`'],
            ['Extract numbers, dates, ids of varying shape', '`re.findall` / `re.finditer`'],
            ['Validate a username or file-name format', '`re.fullmatch`'],
            ['Parse HTML, XML, JSON or program code', 'a real parser (`html.parser`, `json`, `ast`)'],
          ],
          caption: 'Regex is the middle ground between plain string methods and a full parser.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not parse HTML or code with regex',
          text: 'Nested, recursive structures such as HTML tags or JSON cannot be reliably described by a regular expression. Patterns like `<.+?>` work on a tidy example and break on real pages. Use a dedicated parser; the standard library has `html.parser`, `json`, `xml.etree` and `ast`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Make patterns maintainable',
          text: 'Give long patterns names (`DATE_RE = re.compile(...)` at module level), use `re.VERBOSE` with comments, prefer named groups, and write a few tests with inputs that *should not* match as well as ones that should. Interactive tools such as regex101.com (choose the Python flavor) let you experiment and explain a pattern step by step.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ has `std::regex`, but it is slow and little used in games. Python’s `re` is fast enough for tools, mod loaders, data cleaning and log analysis — a big part of why Python is popular for build scripts and asset pipelines around C++ engines.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`print(sum(int(n) for n in re.findall(r"\\d+", "HP 120, MP 30, SP 5")))`',
      answer: '155',
      hint: '`findall` gives `["120", "30", "5"]`. Convert and add them.',
      explanation: '`re.findall(r"\\d+", …)` returns the strings `"120"`, `"30"`, `"5"`; `int` converts them and `sum` adds: $120 + 30 + 5 = 155$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `extract_scores(text)` that finds every `"<name> scored <number>"` in the text and returns a dictionary mapping each name to its score as an **int**. For `"Ada scored 120; Ben scored 95"` it returns `{"Ada": 120, "Ben": 95}`; with no matches it returns `{}`.',
      starter: `import re

# define extract_scores here
`,
      solution: `import re

def extract_scores(text):
    return {name: int(points) for name, points in re.findall(r"(\\w+) scored (\\d+)", text)}
`,
      tests: `assert extract_scores("Ada scored 120; Ben scored 95") == {"Ada": 120, "Ben": 95}
assert extract_scores("nothing here") == {}
assert extract_scores("Cai scored 7.") == {"Cai": 7}
assert extract_scores("Ada scored 1 and Ada scored 2") == {"Ada": 2}
assert isinstance(extract_scores("Zed scored 10")["Zed"], int)`,
      checks: ['Scores are converted to `int`', 'No matches gives an empty dictionary', 'A repeated name keeps the last score'],
      hint: 'Use `re.findall(r"(\\w+) scored (\\d+)", text)`: with two groups it returns `(name, score)` tuples you can loop over.',
      explanation: 'Because the pattern has two groups, `findall` returns tuples of `(name, points)` — ready to unpack in a dictionary comprehension, converting the number with `int`. A repeated name simply overwrites the earlier entry.',
    },
    {
      kind: 'code',
      prompt: 'Write `is_valid_username(name)` that returns `True` only for names that: start with an ASCII letter, are 3 to 16 characters long in total, and contain only ASCII letters, digits and underscores. For example `"Ada_1"` is valid; `"1ada"`, `"ab"` and `"bad name"` are not.',
      starter: `import re

# define is_valid_username here
`,
      solution: `import re

def is_valid_username(name):
    return re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{2,15}", name) is not None
`,
      tests: `assert is_valid_username("Ada_1") is True
assert is_valid_username("abc") is True
assert is_valid_username("a" * 16) is True
assert is_valid_username("1ada") is False
assert is_valid_username("ab") is False
assert is_valid_username("a" * 17) is False
assert is_valid_username("bad name") is False
assert is_valid_username("ada!") is False
assert is_valid_username("Zo\\u00eb") is False
assert is_valid_username("") is False`,
      checks: ['Uses the whole string, not just a part of it', 'Length limits 3–16 are enforced', 'Returns a real `bool`'],
      hint: 'One letter, then 2 to 15 of letters, digits or underscores: `[A-Za-z][A-Za-z0-9_]{2,15}`. Use `fullmatch` so the whole name has to fit, and return `... is not None`.',
      explanation: 'The first character class pins the first letter and the second, with `{2,15}`, makes the total length 3 to 16. `fullmatch` rejects any extra characters (no need for `^` and `\\$`). Spelling the classes out as `[A-Za-z0-9_]` rather than `\\w` keeps the rule strictly ASCII, so a name containing `ë` is refused.',
    },
    {
      kind: 'code',
      prompt: 'Write `reformat_dates(text)` that rewrites every date in `MM/DD/YYYY` form (two digits, two digits, four digits) as `YYYY-MM-DD`, leaving the rest of the text alone. `"Due 11/07/2026."` becomes `"Due 2026-11-07."`. Other number patterns like `1/2/3` must be left untouched.',
      starter: `import re

# define reformat_dates here
`,
      solution: `import re

def reformat_dates(text):
    return re.sub(r"\\b(\\d{2})/(\\d{2})/(\\d{4})\\b", r"\\3-\\1-\\2", text)
`,
      tests: `assert reformat_dates("Due 11/07/2026.") == "Due 2026-11-07."
assert reformat_dates("Due 11/07/2026 and 01/02/2027.") == "Due 2026-11-07 and 2027-01-02."
assert reformat_dates("version 1/2/3 on 3/4/22") == "version 1/2/3 on 3/4/22"
assert reformat_dates("no dates") == "no dates"
assert reformat_dates("") == ""`,
      checks: ['Month, day and year are reordered', 'All dates in the text are rewritten', 'Text that only looks similar is left unchanged'],
      hint: 'Capture the three parts with groups, then refer to them in the replacement: `r"\\3-\\1-\\2"`. Use `\\d{2}`, `\\d{2}`, `\\d{4}` for the parts.',
      explanation: 'Three capture groups hold month, day and year. In the replacement `\\3-\\1-\\2` the group numbers reorder them. The `\\b` word boundaries prevent a match inside a longer number, and the exact digit counts (`{2}`, `{2}`, `{4}`) keep `1/2/3` and `3/4/22` unchanged. `re.sub` rewrites *every* match, not just the first.',
    },
  ],
  takeaways: [
    'Write patterns as raw strings (`r"\\d+"`). `search` finds a pattern anywhere, `match` only at the start, `fullmatch` requires the whole string; `findall`, `finditer`, `sub` and `split` handle many matches.',
    'Building blocks: classes (`\\d \\w \\s [a-z] [^x]`), quantifiers (`* + ? {n,m}`), anchors (`^ \\$ \\b`) and alternation. `.` means *any character* — escape it (`\\.`) or use `re.escape`.',
    'Groups `( )` capture text and `(?P<name>…)` names it; use them with `group`, `groupdict`, `findall` tuples and `\\1`-style replacements in `re.sub` (or a function replacement).',
    'Quantifiers are greedy by default; add `?` for lazy, or better, describe exactly what is allowed (`[^>]+`). Flags such as `re.IGNORECASE`, `re.MULTILINE` and `re.VERBOSE` change matching and readability.',
    'Use string methods when they are enough, regex when the shape varies, and a real parser for HTML, JSON or code. Beware nested quantifiers on untrusted input.',
  ],
  reading: [
    { title: 'Regular Expression HOWTO', url: 'https://docs.python.org/3/howto/regex.html', source: 'docs', note: 'The official gentle introduction, with the full syntax explained step by step.' },
    { title: 're — Regular expression operations', url: 'https://docs.python.org/3/library/re.html', source: 'docs', note: 'Reference for every function, flag and syntax element.' },
    { title: 'regex101', url: 'https://regex101.com/', source: 'other', note: 'An online tester that explains each part of a pattern; choose the Python flavor.' },
  ],
};
