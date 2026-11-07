import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-string-methods',
  title: 'String Methods in Depth',
  summary: 'Split, join, partition, search, test, clean, translate, pad and wrap text — the toolbox for parsing commands, reading data files and building clean output — plus how to build strings efficiently.',
  minutes: 20,
  objectives: [
    'Split text with `split`, `rsplit`, `splitlines` and `partition`, and join pieces with `join`',
    'Search and test with `find`, `startswith`, `endswith`, `removeprefix`, `count` and the `is…` methods, knowing their pitfalls',
    'Clean text with the `strip` family, `replace`, `translate` and `casefold`',
    'Align and wrap text with `ljust`, `rjust`, `center`, `zfill` and `textwrap`',
    'Build strings efficiently and discover methods with `dir()` and `help()`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Splitting and joining',
      blocks: [
        {
          type: 'p',
          text: 'Most text processing is the same two moves: **split** a string into pieces, work on the pieces, and **join** them back together. You met `split()` and `join()` in Unit 2; here is the full family. Remember that strings are immutable, so every method returns a **new** string (or list) and leaves the original alone.',
        },
        {
          type: 'code',
          title: 'split_join.py',
          runnable: true,
          code: `line = "give sword 3"
parts = line.split()
print(parts)
print("a,b,,c".split(","))
print("a,b,c,d".split(",", 2))
print("path/to/file.txt".rsplit("/", 1))
print("one\\ntwo\\r\\nthree".splitlines())
cmd, _, rest = "say hello there".partition(" ")
print(cmd, "|", rest)
print("no-colon".partition(":"))
print(" and ".join(["red", "green", "blue"]))`,
          output: `['give', 'sword', '3']
['a', 'b', '', 'c']
['a', 'b', 'c,d']
['path/to', 'file.txt']
['one', 'two', 'three']
say | hello there
('no-colon', '', '')
red and green and blue`,
          annotations: [
            { lines: 2, text: '`split()` with **no argument** splits on any run of whitespace and ignores leading and trailing space — ideal for user input.' },
            { lines: 4, text: '`split(",")` with an explicit separator keeps empty pieces: two commas in a row produce an empty string between them.' },
            { lines: 5, text: 'The second argument limits the number of splits. After two splits, the rest stays together.' },
            { lines: 6, text: '`rsplit` splits from the **right** — the neat way to separate a file name from its folder.' },
            { lines: 7, text: '`splitlines()` splits at any line ending (`\\n`, `\\r\\n`…) and drops them.' },
            { lines: 8, text: '`partition(sep)` splits at the **first** separator into exactly three parts: before, the separator itself, and after. It always returns a 3-tuple, which unpacks neatly.' },
            { lines: 10, text: 'When the separator is missing, `partition` gives `(whole, "", "")` rather than raising an error.' },
            { lines: 11, text: '`sep.join(items)` glues a list of strings together using `sep` between them. It is called on the *separator*.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is join a string method, not a list method?',
          text: '`join` works on **any iterable of strings** — lists, tuples, generators, dictionary keys. If it lived on `list`, every iterable type would need its own copy. Putting it on the separator string gives one method that works everywhere.',
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Console commands, chat messages, config lines (`key=value`) and CSV-ish data files all go through this: `verb, _, argument = line.partition(" ")` is the first line of countless game console parsers.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `"a,b,,c".split(",")` return?',
      options: [
        { text: '`["a", "b", "c"]`', why: 'That is what you would get from `split()` on whitespace-separated text. With an explicit separator, empty pieces are kept.' },
        { text: '`["a", "b", "", "c"]`', correct: true, why: 'Right: the two adjacent commas surround an empty string, which is kept.' },
        { text: '`["a,b,,c"]`', why: 'The separator is found, so the string is split.' },
        { text: '`("a", "b", "", "c")`', why: '`split` returns a list, not a tuple.' },
      ],
      explanation: 'An explicit separator splits at *every* occurrence, so back-to-back separators produce empty strings. Only the no-argument form `split()` treats runs of whitespace as one separator and discards empties.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `cmd, sep, arg = "give sword 3".partition(" ")
print(cmd, repr(arg), len(arg.split()))`,
      answer: "give 'sword 3' 2",
      hint: '`partition` splits only at the first space, so `arg` still contains a space.',
      explanation: '`partition(" ")` splits at the first space: `cmd` is `"give"`, `sep` is `" "`, and `arg` is the remainder `"sword 3"`. `repr` shows it with quotes, and `arg.split()` gives `["sword", "3"]`, length 2.',
    },
    {
      kind: 'concept',
      title: 'Searching and testing',
      blocks: [
        {
          type: 'p',
          text: 'To locate or classify text there are `find`, `count`, `startswith`/`endswith`, `removeprefix`/`removesuffix` and a family of `is…` tests. A few have traps worth knowing.',
        },
        {
          type: 'code',
          title: 'searching_text.py',
          runnable: true,
          code: `name = "level_01.json"
print(name.find("_"), name.find("x"), name.rfind("."))
print(name.startswith("level"), name.endswith((".json", ".yaml")))
print(name.removeprefix("level_").removesuffix(".json"))
print("banana".count("an"), "banana".count("a"))
print("123".isdigit(), "-5".isdigit(), "3.5".isdigit(), "".isdigit())
print("abc".isalpha(), "abc1".isalnum(), "  ".isspace(), "ABC".isupper())
try:
    name.index("x")
except ValueError as e:
    print("ValueError:", e)`,
          output: `5 -1 8
True True
01
2 3
True False False False
True True True True
ValueError: substring not found`,
          annotations: [
            { lines: 2, text: '`find` returns the index of the first match, or **-1** if absent; `rfind` searches from the right. (Unlike `list.index`, `str.find` doesn’t raise an error.)' },
            { lines: 3, text: '`startswith` and `endswith` also accept a **tuple** of alternatives — much tidier than chaining `or`.' },
            { lines: 4, text: '`removeprefix` and `removesuffix` (Python 3.9+) strip an exact prefix or suffix only if present. Unlike `strip`, they remove a *string*, not a set of characters.' },
            { lines: 5, text: '`count` counts **non-overlapping** occurrences: `"banana"` contains `"an"` twice and `"a"` three times.' },
            { lines: 6, text: '`isdigit` is true only when *every* character is a digit and the string is non-empty — so `"-5"` and `"3.5"` are false. To test for numbers, try `int()` or `float()` and catch the error.' },
            { lines: 9, text: '`index` is the strict twin of `find`: it raises `ValueError` when the substring is missing. (The `try`/`except` here is explained in Unit 8.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'strip() takes a set of characters, not a word',
          text: '`"report.txt".strip(".txt")` doesn’t remove the suffix — it strips any of the characters `.`, `t`, `x` from both ends and gives `"repor"`. To remove an exact suffix, use `removesuffix(".txt")`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'To test whether text *contains* something, use the `in` operator: `"fire" in description`. Reach for `find` only when you need the *position*.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`"-5".isdigit()` returns `True`, because -5 is a number.',
      answer: false,
      explanation: 'False. `isdigit()` checks that every character is a digit; the minus sign is not. `"3.5".isdigit()` is false for the same reason. To validate a number, call `int(text)` or `float(text)` and handle the `ValueError` (Unit 8).',
    },
    {
      kind: 'fill',
      prompt: 'Turn the file name `"level_01.json"` into `"01"` by removing the exact prefix and suffix.',
      template: `filename = "level_01.json"
stem = filename.___(".json")     # "level_01"
num = stem.___("level_")         # "01"`,
      templateIsCode: true,
      blanks: [{ answers: ['removesuffix'] }, { answers: ['removeprefix'] }],
      wordBank: ['removesuffix', 'removeprefix', 'strip', 'lstrip'],
      explanation: '`removesuffix(".json")` drops the exact ending and `removeprefix("level_")` drops the exact beginning. `strip` and `lstrip` take a *set of characters* instead of a string, so they would eat extra characters from `"level_01"`.',
    },
    {
      kind: 'concept',
      title: 'Cleaning and transforming text',
      blocks: [
        {
          type: 'p',
          text: 'Real-world text is messy: stray whitespace, inconsistent case, odd separators. The cleaning tools are `strip` (and `lstrip`/`rstrip`), `replace`, `translate` for character-by-character swaps, and `casefold` for caseless comparison.',
        },
        {
          type: 'code',
          title: 'cleaning.py',
          runnable: true,
          code: `raw = "  \\t Dragon   Slayer \\n"
print(repr(raw.strip()))
print(repr(raw.lstrip()), repr(raw.rstrip()))
print(repr("xxhixx".strip("x")))
print(" ".join(raw.split()))
table = str.maketrans("aeiou", "AEIOU")
print("dragon slayer".translate(table))
print("ß".lower(), "ß".casefold(), "STRASSE".lower() == "straße".casefold())
print("they're".title(), "they're".capitalize())
print("a-b_c d".replace("-", " ").replace("_", " "))`,
          output: `'Dragon   Slayer'
'Dragon   Slayer \\n' '  \\t Dragon   Slayer'
'hi'
Dragon Slayer
drAgOn slAyEr
ß ss True
They'Re They're
a b c d`,
          annotations: [
            { lines: 2, text: '`strip()` removes whitespace (spaces, tabs, newlines) from **both ends only** — not the spaces inside. `repr` makes the invisible characters visible.' },
            { lines: 3, text: '`lstrip` strips only the left end, `rstrip` only the right.' },
            { lines: 4, text: 'Given an argument, `strip` removes any of *those characters* from the ends.' },
            { lines: 5, text: 'The whitespace-normalizing idiom: `split()` (which discards all whitespace runs) then `join` with a single space.' },
            { lines: 6, text: '`str.maketrans` builds a translation table that maps characters one-to-one; `translate` applies it in a single pass — much faster than many `replace` calls.' },
            { lines: 8, text: '`lower()` is not enough for comparing text in other languages: German `ß` stays `ß` under `lower()` but becomes `ss` under `casefold()`, which is designed for caseless matching.' },
            { lines: 9, text: '`title()` capitalizes after *every* non-letter, so `"they\'re"` becomes `"They\'Re"`. `capitalize()` only changes the first character.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Compare with casefold, not lower',
          text: 'For user-facing comparisons — searching a chat, matching player names — normalize both sides with `casefold()`: `a.casefold() == b.casefold()`. It handles the international edge cases that `lower()` misses.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code should print 3, the length of the cleaned name, but prints 7. Tap the line with the bug.',
      lines: ['name = "  ada  "', 'name.strip()', 'print(len(name))'],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Strings are immutable: `name.strip()` returns a *new* string and cannot change `name`. The result is thrown away on line 2, so `name` still has its 7 characters. Re-bind it: `name = name.strip()`.',
    },
    {
      kind: 'concept',
      title: 'Aligning, padding and wrapping',
      blocks: [
        {
          type: 'p',
          text: 'Formatted output — scoreboards, inventories, debug tables — needs columns to line up. `ljust`, `rjust` and `center` pad a string to a width; `zfill` left-pads numbers with zeros; and the standard `textwrap` module reflows long paragraphs. (f-strings can do the same with format specs like `{name:<10}`, as the next lesson shows.)',
        },
        {
          type: 'code',
          title: 'padding.py',
          runnable: true,
          code: `items = [("sword", 120), ("shield", 80), ("potion", 5)]
print("Item".ljust(10) + "Price".rjust(6))
print("-" * 16)
for name, price in items:
    print(name.ljust(10) + str(price).rjust(6))
print("TITLE".center(16, "*"))
print("7".zfill(3), "-42".zfill(5))

import textwrap
text = "The quick brown fox jumps over the lazy dog near the riverbank."
print(textwrap.fill(text, width=24))
print(textwrap.shorten(text, width=30, placeholder="..."))`,
          output: `Item       Price
----------------
sword        120
shield        80
potion         5
*****TITLE******
007 -0042
The quick brown fox
jumps over the lazy dog
near the riverbank.
The quick brown fox jumps...`,
          annotations: [
            { lines: 2, text: '`ljust(10)` pads on the right to 10 characters (text on the left); `rjust(6)` pads on the left — the usual alignment for numbers.' },
            { lines: 6, text: '`center(16, "*")` pads both sides, here with `*` instead of spaces.' },
            { lines: 7, text: '`zfill` pads with zeros and keeps a leading minus sign in front.' },
            { lines: 11, text: '`textwrap.fill` re-flows text into lines no longer than `width`, breaking only at spaces.' },
            { lines: 12, text: '`textwrap.shorten` collapses whitespace and truncates at a word boundary, appending the placeholder — perfect for tooltips and log previews.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Console tools and debug HUDs use fixed-width columns constantly: a profiler table, a chat log with wrapped lines, an inventory listing. For anything more elaborate, the `rich` library (Unit 9) draws full tables and progress bars.',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Arrange the lines into a program that parses the text `"hp=40"` into a dictionary and prints `{\'hp\': 40}`.',
      lines: ['line = "hp=40"', 'key, _, value = line.partition("=")', 'stats = {key: int(value)}', 'print(stats)'],
      linesAreCode: true,
      explanation: '`partition("=")` splits the line into the key, the separator (which we ignore with `_`) and the value text. Then we build a one-entry dictionary, converting the value text to an integer, and print it. Each line depends on the one before it.',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\nprint(len("a,b,,c".split(",")) + "banana".count("a"))\n```',
      answer: '7',
      hint: 'The split gives four pieces (one is empty). `"banana"` contains three `"a"`s.',
      explanation: '`"a,b,,c".split(",")` is `["a", "b", "", "c"]`, length 4; `"banana".count("a")` is 3. The sum is $4 + 3 = 7$.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'Building text efficiently, and exploring methods',
      blocks: [
        {
          type: 'p',
          text: 'Since strings never change, `s += piece` in a loop creates a brand-new string every time. CPython has an optimization that often hides the cost, but it isn’t guaranteed — the portable, fast way is to collect pieces in a list and `"".join` once at the end. You can also chain methods, each working on the result of the previous one.',
        },
        {
          type: 'code',
          title: 'building.py',
          runnable: true,
          code: `words = ["a"] * 5
s = ""
for w in words:
    s += w
print(s)
print("".join(words))

print("  Hello World  ".strip().lower().replace(" ", "_"))

public = [m for m in dir(str) if not m.startswith("_")]
print(public[:5])
print("split" in public, "append" in public)`,
          output: `aaaaa
aaaaa
hello_world
['capitalize', 'casefold', 'center', 'count', 'encode']
True False`,
          annotations: [
            { lines: 4, text: 'Works, but builds a new string on each pass. Fine for five items, wasteful for fifty thousand.' },
            { lines: 6, text: '`"".join(words)` allocates the final string once: the idiomatic and scalable way.' },
            { lines: 8, text: '**Method chaining**: `strip()` returns a string, so `.lower()` can be called on that, and so on. Read it left to right.' },
            { lines: 10, text: '`dir(obj)` lists an object’s attributes. Filtering out names starting with `_` leaves the public methods. Try `help(str.partition)` in the REPL to read any method’s documentation.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Why repeated += can be slow',
          text: 'Each `s += w` may copy the entire string so far, so building a string of $n$ pieces can cost O(n²) in the worst case. CPython often resizes in place when nothing else refers to the string, which is why simple benchmarks look fine — but on other implementations, or when the string is shared, the quadratic behavior returns. `join` is O(n) everywhere.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Learn to read the docs',
          text: 'You don’t need to memorize 47 string methods. Know the categories — split/join, search, test, clean, align — and look up the rest: `help(str)`, or the "String Methods" page in the Python docs (linked below). Recognizing that a method *exists* is most of the skill.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `parse_command(line)` that takes a console line such as `"  GIVE sword 3  "` and returns a tuple `(verb, args)`: the **lower-cased** verb and a list of the remaining words. For an empty or blank line return `("", [])`.',
      starter: `# define parse_command here
`,
      solution: `def parse_command(line):
    words = line.split()
    if not words:
        return "", []
    return words[0].lower(), words[1:]
`,
      tests: `assert parse_command("  GIVE sword 3  ") == ("give", ["sword", "3"])
assert parse_command("quit") == ("quit", [])
assert parse_command("say   hello   there") == ("say", ["hello", "there"])
assert parse_command("") == ("", [])
assert parse_command("   ") == ("", [])`,
      checks: ['The verb is lower-cased', 'Extra whitespace is ignored', 'Blank input returns `("", [])`'],
      hint: '`line.split()` handles all the whitespace. Check for an empty list first, then take the first word (lower-cased) and a slice of the rest.',
      explanation: '`split()` with no argument ignores leading, trailing and repeated whitespace, so the words come out clean. Blank input produces an empty list, which is falsy and caught by a guard clause. The verb is normalized with `lower()` so `GIVE` and `give` behave identically.',
    },
    {
      kind: 'code',
      prompt: 'Write `word_frequency(text)` that returns a dictionary of how many times each word appears. Compare words **case-insensitively** and strip the punctuation characters `.,!?` from the edges of each word. For `"The cat. The hat!"` the result is `{"the": 2, "cat": 1, "hat": 1}`.',
      starter: `# define word_frequency here
`,
      solution: `def word_frequency(text):
    counts = {}
    for raw in text.split():
        word = raw.strip(".,!?").lower()
        if word:
            counts[word] = counts.get(word, 0) + 1
    return counts
`,
      tests: `assert word_frequency("The cat. The hat!") == {"the": 2, "cat": 1, "hat": 1}
assert word_frequency("Go go GO, go!") == {"go": 4}
assert word_frequency("") == {}
assert word_frequency("... !!") == {}`,
      checks: ['Words are counted case-insensitively', 'Edge punctuation `.,!?` is removed', 'Punctuation-only tokens are skipped'],
      hint: 'For each `raw` in `text.split()`, clean it with `raw.strip(".,!?").lower()`, skip empty results, then count with `counts.get(word, 0) + 1`.',
      explanation: 'Splitting on whitespace gives tokens like `"cat."`. `strip(".,!?")` removes those characters from both ends (this is exactly where a *set* of characters is what you want), `lower()` normalizes case, and the dictionary counting pattern from the Dictionaries lesson does the rest.',
    },
    {
      kind: 'code',
      prompt: 'Write `slugify(title)` that turns a title into a URL- or file-friendly "slug": lower-case, keep only letters, digits and spaces, then join the words with hyphens. `slugify("Dragon\'s Lair: Level 2!")` is `"dragons-lair-level-2"`.',
      starter: `# define slugify here
`,
      solution: `def slugify(title):
    kept = "".join(c for c in title.lower() if c.isalnum() or c == " ")
    return "-".join(kept.split())
`,
      tests: `assert slugify("Dragon's Lair: Level 2!") == "dragons-lair-level-2"
assert slugify("  Hello   World  ") == "hello-world"
assert slugify("A-B C") == "ab-c"
assert slugify("") == ""
assert slugify("!!!") == ""`,
      checks: ['Result is lower-case', 'Punctuation is removed', 'Words are joined by single hyphens'],
      hint: 'Build a cleaned string with `"".join(c for c in title.lower() if c.isalnum() or c == " ")`, then `"-".join(cleaned.split())`.',
      explanation: 'The generator keeps only alphanumeric characters and spaces, `join` reassembles them, and `split()` followed by `"-".join(...)` collapses runs of spaces into single hyphens. Slugs like this name save files, asset bundles and web pages.',
    },
  ],
  takeaways: [
    '`split()` (no argument) splits on whitespace runs; `split(sep)` keeps empty pieces; `rsplit`, `splitlines` and `partition` cover the other common cases. `sep.join(items)` is the inverse.',
    '`find` returns -1 when missing, `index` raises `ValueError`; `startswith`/`endswith` take tuples; `removeprefix`/`removesuffix` remove exact strings; `isdigit()` rejects signs and decimals.',
    '`strip(chars)` removes a *set* of characters from the ends — not a substring. `translate` swaps characters in one pass, and `casefold()` is the right tool for caseless comparison.',
    '`ljust`, `rjust`, `center`, `zfill` and `textwrap` align and wrap text. Every string method returns a new string; assign the result.',
    'Build big strings with `"".join(pieces)` rather than repeated `+=`; discover methods with `dir()` and `help()`.',
  ],
  reading: [
    { title: 'String Methods (Built-in Types)', url: 'https://docs.python.org/3/library/stdtypes.html#string-methods', source: 'docs', note: 'The complete, authoritative list of every `str` method.' },
    { title: 'textwrap — Text wrapping and filling', url: 'https://docs.python.org/3/library/textwrap.html', source: 'docs', note: 'Wrap, fill, shorten and dedent text.' },
    { title: 'Real Python: Splitting, Concatenating, and Joining Strings', url: 'https://realpython.com/python-string-split-concatenate-join/', source: 'article', note: 'A practical walk-through of the split/join family.' },
  ],
};
