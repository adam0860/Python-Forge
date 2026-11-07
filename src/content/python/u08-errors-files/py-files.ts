import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-files',
  title: 'Reading and Writing Files',
  summary: 'Open, read and write text and binary files safely with `open()` and `with`: modes, encodings, iterating lines, seeking, in-memory files, newline handling, error handling and crash-safe saving.',
  minutes: 19,
  objectives: [
    'Open files with `with open(...)` and explain why the context manager guarantees the file is closed',
    'Choose the right mode (`r`, `w`, `a`, `x`, `b`, `+`) and avoid accidentally erasing a file',
    'Read text with `read`, `readline`, `readlines` and by iterating, and write with `write` and `writelines`',
    'Read and write binary data, use `seek` and `tell`, and test file code with `io.StringIO` and `io.BytesIO`',
    'Handle missing files and encodings, understand newline translation, and save data atomically',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'open() and the with statement',
      blocks: [
        {
          type: 'p',
          text: 'A program talks to a file through a **file object**, returned by `open(path, mode, encoding=...)`. You read from it or write to it, and when you are done it must be **closed** so the operating system finishes writing the data and releases the file. Python’s idiom is the `with` statement: it closes the file automatically when the block ends — even if an exception is raised inside it.',
        },
        {
          type: 'code',
          title: 'read_write.py',
          runnable: true,
          code: `import os
with open("notes.txt", "w", encoding="utf-8") as f:
    count = f.write("first line\\n")
    f.write("second line\\n")
    f.writelines(["third\\n", "fourth\\n"])
print(count, f.closed)

with open("notes.txt", encoding="utf-8") as f:
    print(repr(f.readline()))
    print(repr(f.read()))
    print(repr(f.read()))

with open("notes.txt", encoding="utf-8") as f:
    for number, line in enumerate(f, start=1):
        print(number, line.rstrip("\\n"))
with open("notes.txt", encoding="utf-8") as f:
    print(f.readlines())
print(os.path.exists("notes.txt"), os.path.getsize("notes.txt"))
os.remove("notes.txt")
print(os.path.exists("notes.txt"))`,
          output: `11 True
'first line\\n'
'second line\\nthird\\nfourth\\n'
''
1 first line
2 second line
3 third
4 fourth
['first line\\n', 'second line\\n', 'third\\n', 'fourth\\n']
True 36
False`,
          annotations: [
            { lines: 2, text: '`"w"` opens for **writing** (creating the file, or erasing an existing one). Always pass `encoding="utf-8"` for text. `as f` names the file object.' },
            { lines: 3, text: '`write` takes a **string** and returns the number of characters written (11 here). It does *not* add a newline — you supply `"\\n"` yourself.' },
            { lines: 5, text: '`writelines` writes each string in a list; again, no newlines are added for you.' },
            { lines: 6, text: 'After the `with` block, `f.closed` is `True`: the file was closed automatically.' },
            { lines: 8, text: 'The default mode is `"r"` (read text), so you can leave it out.' },
            { lines: 9, text: '`readline()` returns **one line** including its trailing `\\n`.' },
            { lines: 10, text: '`read()` returns **everything that is left** from the current position.' },
            { lines: 11, text: 'At the end of the file, `read()` returns an empty string, not an error. That is how you detect "no more data".' },
            { lines: '13-15', text: '**The best way to read lines**: iterate over the file object. It reads one line at a time, so it works even for files bigger than memory. `rstrip("\\n")` removes the newline before printing.' },
            { lines: '16-17', text: '`readlines()` returns a list of all lines (newlines included). Convenient for small files, wasteful for big ones.' },
            { lines: '18-20', text: '`os.path.exists` and `getsize` ask the operating system about the file; `os.remove` deletes it. (This lesson’s examples clean up after themselves.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why `with` instead of `f.close()`?',
          text: 'Data you `write` is *buffered* in memory and only reaches the disk when the file is flushed or closed. If your program raises an exception before reaching `f.close()`, the end of the file may be lost and the file stays locked. `with` is a **context manager**: it guarantees cleanup on every exit path, the same job `finally` does, written once. You will build your own context managers in Unit 12.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ closes an `std::fstream` automatically in its destructor (RAII). Python cannot promise when an object is destroyed, so it makes the scope explicit with `with`. The result looks different but gives the same guarantee: the file is closed at the end of the block.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Files inside this app',
          text: 'Code you run in the lessons uses a private, in-memory file system, so it can create and delete files freely without touching your computer, and files disappear when the runner restarts. On your own machine the same code reads and writes real files — always relative to the *current working directory*, not to the script’s folder.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What happens when you run `open("save.txt", "w")` and `save.txt` already contains 5,000 bytes?',
      options: [
        { text: 'The new text is added at the end of the file', why: 'That is append mode, `"a"`.' },
        { text: 'The file is emptied immediately; new writes start from the beginning', correct: true, why: 'Right: write mode truncates the file the moment it is opened.' },
        { text: 'Python raises `FileExistsError`', why: 'That only happens in exclusive-creation mode, `"x"`.' },
        { text: 'The file is opened read-only', why: 'Write mode is for writing, and `"r"` is read-only.' },
      ],
      explanation: '`"w"` truncates (erases) an existing file as soon as it is opened — even if you never write anything. Use `"a"` to add to the end, `"x"` to fail if the file exists, and check twice before using `"w"` on a file that matters.',
    },
    {
      kind: 'concept',
      title: 'Modes: read, write, append, exclusive',
      blocks: [
        {
          type: 'p',
          text: 'The **mode** string says what you intend to do. Combine one of the four main letters with `b` for binary (`"rb"`, `"wb"`) or leave it as text (the default, `t`). Adding `+` allows both reading and writing.',
        },
        {
          type: 'table',
          headers: ['Mode', 'Meaning', 'If the file…'],
          rows: [
            ['`"r"`', 'read (default)', 'does not exist: `FileNotFoundError`'],
            ['`"w"`', 'write', 'exists: **erased**; missing: created'],
            ['`"a"`', 'append', 'exists: new data goes at the end; missing: created'],
            ['`"x"`', 'create exclusively', 'exists: `FileExistsError`'],
            ['`"r+"`', 'read and write', 'must exist; nothing is erased'],
            ['`"b"` suffix', 'binary: `bytes` instead of `str`', 'no encoding, no newline translation'],
          ],
          caption: 'The `"+"` and `"b"` flags combine with the others: `"rb"`, `"wb"`, `"a+"`.',
        },
        {
          type: 'code',
          title: 'modes.py',
          runnable: true,
          code: `import os
with open("log.txt", "w", encoding="utf-8") as f:
    f.write("one\\n")
with open("log.txt", "a", encoding="utf-8") as f:
    f.write("two\\n")
with open("log.txt", encoding="utf-8") as f:
    print(f.read().splitlines())
try:
    open("log.txt", "x")
except FileExistsError as e:
    print(type(e).__name__)
with open("log.txt", "w", encoding="utf-8") as f:
    pass
print(os.path.getsize("log.txt"))
os.remove("log.txt")`,
          output: `['one', 'two']
FileExistsError
0`,
          annotations: [
            { lines: '2-3', text: 'Write mode creates the file and writes `one`.' },
            { lines: '4-5', text: 'Append mode keeps `one` and adds `two` after it.' },
            { lines: 7, text: '`read().splitlines()` is a tidy way to get the lines *without* their newlines.' },
            { lines: '8-11', text: 'Exclusive mode refuses to touch a file that already exists, so you cannot overwrite a save by accident.' },
            { lines: '12-14', text: 'Opening in `"w"` mode and writing nothing still **truncates** the file: afterwards its size is 0 bytes.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Always say encoding="utf-8"',
          text: 'In text mode, Python must translate between bytes on disk and `str` in memory, and the default encoding depends on the operating system (and, until recently, on Windows regional settings). Passing `encoding="utf-8"` makes your program behave identically everywhere. (This is the Unicode lesson’s advice put into practice.)',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: '"w" is destructive',
          text: 'There is no undo. If a program opens `highscores.txt` with `"w"` and then crashes before writing, the old scores are gone. For important data, write to a temporary file first and replace the original at the end (shown below).',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `with open("t.txt", "w", encoding="utf-8") as f:
    f.write("ab")
with open("t.txt", "a", encoding="utf-8") as f:
    f.write("cd")
with open("t.txt", "w", encoding="utf-8") as f:
    f.write("e")
with open("t.txt", encoding="utf-8") as f:
    print(f.read())`,
      answer: 'e',
      hint: 'Which of the three opens erases what was there before?',
      explanation: 'The first block writes `ab`, the second appends `cd` (giving `abcd`), but the third reopens the file in `"w"` mode, which erases it before writing `e`. Only `e` is left.',
    },
    {
      kind: 'fill',
      prompt: 'Choose the correct mode for each job.',
      template: `with open("log.txt", "___", encoding="utf-8") as f:   # add to the end of the file
    f.write("new entry\\n")
with open("log.txt", "___") as f:                      # read the raw bytes
    raw = f.read()`,
      templateIsCode: true,
      blanks: [{ answers: ['a'] }, { answers: ['rb'] }],
      wordBank: ['a', 'w', 'rb', 'r', 'x'],
      explanation: 'Append mode `"a"` adds data at the end without erasing what is there. `"rb"` reads in binary mode, so `read()` returns `bytes` rather than text. `"w"` would erase the log, and plain `"r"` would decode the data as text.',
    },
    {
      kind: 'concept',
      title: 'Binary files, seek and in-memory files',
      blocks: [
        {
          type: 'p',
          text: 'Save files, images and network captures are not text. In **binary mode** (`"rb"`, `"wb"`) you read and write `bytes` — exactly the objects from the Unicode lesson — with no encoding and no newline translation. A file also remembers a **position**: `tell()` reports it and `seek(n)` jumps to byte `n`, which lets you read the middle of a big file without reading the start.',
        },
        {
          type: 'code',
          title: 'binary_files.py',
          runnable: true,
          code: `import io, os, struct
with open("scores.bin", "wb") as f:
    for score in (120, 95, 7):
        f.write(struct.pack("<I", score))
with open("scores.bin", "rb") as f:
    data = f.read()
print(len(data), struct.unpack("<3I", data))
with open("scores.bin", "rb") as f:
    f.seek(4)
    print(struct.unpack("<I", f.read(4)), f.tell())
os.remove("scores.bin")
buf = io.StringIO()
buf.write("hello\\nworld\\n")
buf.seek(0)
print(buf.readlines())
print(io.BytesIO(b"abc").read(2))`,
          output: `12 (120, 95, 7)
(95,) 8
['hello\\n', 'world\\n']
b'ab'`,
          annotations: [
            { lines: '2-4', text: 'Each score is packed into 4 little-endian bytes and written to a binary file: 12 bytes in total.' },
            { lines: '5-7', text: 'Read it all back as `bytes` and unpack three integers at once.' },
            { lines: 9, text: '`seek(4)` moves the position to byte 4 — the start of the second score.' },
            { lines: 10, text: 'Read 4 bytes: the second score (95). `tell()` now reports 8, the position after the read.' },
            { lines: '12-15', text: '`io.StringIO` is a **file object that lives in memory**. It has the same `write`, `seek` and `readlines` as a real file, so code that expects a file works with it unchanged.' },
            { lines: 16, text: '`io.BytesIO` is the binary equivalent.' },
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Write functions that accept file objects',
          text: 'A function `parse(f)` that reads from any file-like object is much easier to test than one that takes a path: in a test, pass `io.StringIO("line1\\nline2\\n")` and no real file is needed. Do the `open` at the edge of the program and pass the file object inwards.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Buffers and file descriptors',
          text: 'Under the hood, `open` asks the operating system for a **file descriptor** (a small integer handle) and wraps it in layers: a raw binary file, a buffer that collects data in memory (typically 8 KB at a time) and, in text mode, a decoder. `flush()` forces the buffer to the OS; `close()` flushes and releases the descriptor. Operating systems limit how many descriptors a process may hold, which is why leaking open files eventually raises `OSError: Too many open files`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'It is fine to skip `close()` and `with` in a short script, because Python always closes and flushes a file the instant the variable stops being used.',
      answer: false,
      explanation: 'False. CPython often closes an unreferenced file promptly, but this is an implementation detail: other Python implementations do not, an exception can keep the file object alive (inside the traceback), and buffered data may not have been flushed when you expect. `with` makes the guarantee explicit.',
    },
    {
      kind: 'error',
      prompt: 'The code should print the first line and the rest of the file, but it crashes with `ValueError: I/O operation on closed file`. Tap the line with the bug.',
      lines: [
        'with open("notes.txt", encoding="utf-8") as f:',
        '    first = f.readline()',
        'rest = f.read()',
        'print(first, rest)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The `with` block ends after line 2, which closes the file. Line 3 is outside the block, so `f.read()` runs on a closed file. Indent it so that both reads happen inside the `with`.',
    },
    {
      kind: 'concept',
      title: 'Newlines, missing files and safe saving',
      blocks: [
        {
          type: 'p',
          text: 'Real files are messy. Windows ends lines with `\\r\\n`, Linux and macOS with `\\n`. In text mode Python hides the difference: when reading, any of `\\n`, `\\r\\n` or `\\r` becomes `\\n` (**universal newlines**); when writing, `\\n` becomes the platform’s native ending. Pass `newline=""` to turn the translation off. Files can also be missing, or the disk can fail halfway through a write — so serious code handles both.',
        },
        {
          type: 'code',
          title: 'robust_files.py',
          runnable: true,
          code: `import os
with open("win.txt", "wb") as f:
    f.write(b"a\\r\\nb\\r\\n")
with open("win.txt", encoding="utf-8") as f:
    print(f.readlines())
with open("win.txt", encoding="utf-8", newline="") as f:
    print(f.readlines())
os.remove("win.txt")

def read_lines(path):
    try:
        with open(path, encoding="utf-8") as f:
            return [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        return []

def save_atomic(path, text):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
    os.replace(tmp, path)

print(read_lines("nope.txt"))
save_atomic("save.txt", "level=3\\n")
print(read_lines("save.txt"), os.path.exists("save.txt.tmp"))
os.remove("save.txt")`,
          output: `['a\\n', 'b\\n']
['a\\r\\n', 'b\\r\\n']
[]
['level=3'] False`,
          annotations: [
            { lines: '2-3', text: 'Write a Windows-style file in **binary** mode so that Python does not translate anything.' },
            { lines: '4-5', text: 'Read in default text mode: universal newlines turn `\\r\\n` into `\\n`, so the code never has to care about the platform.' },
            { lines: '6-7', text: 'With `newline=""` the translation is off and the original `\\r\\n` endings are visible.' },
            { lines: '10-15', text: 'A reader that treats "no file yet" as "no data" — the normal first-run situation for a game’s save or settings file. The comprehension skips blank lines.' },
            { lines: '17-21', text: '**Atomic save**: write the complete new data to a temporary file, then `os.replace` swaps it over the real file in one step. If the program crashes midway, the old file is still intact instead of half-written.' },
            { lines: '23-25', text: '`read_lines("nope.txt")` returns `[]` rather than crashing. The temporary file no longer exists after a successful save.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Where games keep their files',
          text: 'Use a per-user folder for saves and settings (on Windows `%APPDATA%`, on Linux `~/.local/share`) rather than the working directory — the next lesson, `pathlib`, makes building those paths easy and portable. Never write next to the installed program: it may be read-only.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Reading huge files',
          text: '`f.read()` and `f.readlines()` load the **entire** file into memory. For logs and datasets of unknown size, iterate (`for line in f:`) or read in chunks (`f.read(65536)`) and process as you go.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'A binary file holds 10 bytes. You open it with `"rb"`, call `f.seek(3)`, then `f.read(4)`. What does `f.tell()` return afterwards?',
      answer: '7',
      hint: 'You start at position 3 and consume 4 bytes.',
      explanation: '`seek(3)` moves to byte 3; reading 4 bytes advances the position to $3 + 4 = 7$, which is what `tell()` reports.',
      label: 'tell():',
    },
    {
      kind: 'code',
      prompt: 'Write `read_config(path)` that reads a settings file of `key=value` lines and returns a dictionary of strings. Ignore blank lines, lines starting with `#` and lines without `=`. Strip spaces around keys and values and split on the **first** `=` only. If the file does not exist, return `{}`.',
      starter: `# define read_config here
`,
      solution: `def read_config(path):
    config = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, _, value = line.partition("=")
                config[key.strip()] = value.strip()
    except FileNotFoundError:
        return {}
    return config
`,
      tests: `import os
with open("cfg_test.ini", "w", encoding="utf-8") as f:
    f.write("# settings\\nvolume = 7\\n\\nname=Ada Lovelace\\nempty=\\nnot a setting\\nurl=a=b\\n")
assert read_config("cfg_test.ini") == {"volume": "7", "name": "Ada Lovelace", "empty": "", "url": "a=b"}, read_config("cfg_test.ini")
os.remove("cfg_test.ini")
assert read_config("does_not_exist.ini") == {}`,
      checks: ['Comments, blank lines and lines without `=` are skipped', 'Keys and values are stripped, splitting on the first `=` only', 'A missing file gives `{}`'],
      hint: 'Loop over the file, `strip()` each line, `continue` for lines to ignore, and use `line.partition("=")` to split on the first `=`.',
      explanation: '`partition` splits at only the first separator, so `url=a=b` keeps `a=b` as the value. The `FileNotFoundError` handler turns "no config yet" into an empty dictionary, so callers can simply merge it with defaults.',
    },
    {
      kind: 'code',
      prompt: 'Write two functions for a high-score file with one `name,score` line per entry. `append_score(path, name, score)` **appends** a line `"name,score\\n"`. `top_scores(path, n)` returns the best `n` entries as a list of `(name, score)` tuples (score as `int`), highest first; if the file does not exist it returns `[]`.',
      starter: `# define append_score and top_scores here
`,
      solution: `def append_score(path, name, score):
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"{name},{score}\\n")

def top_scores(path, n):
    rows = []
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                name, _, score = line.strip().partition(",")
                rows.append((name, int(score)))
    except FileNotFoundError:
        return []
    rows.sort(key=lambda row: row[1], reverse=True)
    return rows[:n]
`,
      tests: `import os
p = "scores_test.csv"
if os.path.exists(p):
    os.remove(p)
assert top_scores(p, 3) == []
append_score(p, "Ada", 120)
append_score(p, "Ben", 95)
append_score(p, "Cai", 200)
assert top_scores(p, 2) == [("Cai", 200), ("Ada", 120)], top_scores(p, 2)
assert top_scores(p, 10) == [("Cai", 200), ("Ada", 120), ("Ben", 95)]
with open(p, encoding="utf-8") as f:
    assert f.read() == "Ada,120\\nBen,95\\nCai,200\\n"
os.remove(p)`,
      checks: ['`append_score` adds a line without erasing earlier ones', 'Scores come back as `int` and sorted from highest to lowest', 'A missing file returns an empty list'],
      hint: 'Open with mode `"a"` to append. To read, `partition(",")` each stripped line, convert the score with `int`, then sort by score with `reverse=True` and slice `[:n]`.',
      explanation: 'Append mode lets many calls build the file up over time. Reading is the mirror image: parse each line, convert the text score to a number (sorting strings would put `"95"` after `"200"`), sort, and slice. The `FileNotFoundError` handler makes the very first run work without special setup.',
    },
    {
      kind: 'code',
      prompt: 'Write `number_lines(src, dst)` that reads the text file `src` one line at a time and writes a copy to `dst` in which every line is prefixed with its number: `"1: first"`. Every output line ends with `"\\n"`, even if the last input line did not. Return the number of lines written (0 for an empty file).',
      starter: `# define number_lines here
`,
      solution: `def number_lines(src, dst):
    count = 0
    with open(src, encoding="utf-8") as fin, open(dst, "w", encoding="utf-8") as fout:
        for count, line in enumerate(fin, start=1):
            text = line.rstrip("\\n")
            fout.write(f"{count}: {text}\\n")
    return count
`,
      tests: `import os
def put(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
def get(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

put("nl_src.txt", "a\\nb\\nc\\n")
assert number_lines("nl_src.txt", "nl_dst.txt") == 3
assert get("nl_dst.txt") == "1: a\\n2: b\\n3: c\\n"
put("nl_src.txt", "x\\ny")
assert number_lines("nl_src.txt", "nl_dst.txt") == 2
assert get("nl_dst.txt") == "1: x\\n2: y\\n"
put("nl_src.txt", "")
assert number_lines("nl_src.txt", "nl_dst.txt") == 0
assert get("nl_dst.txt") == ""
os.remove("nl_src.txt")
os.remove("nl_dst.txt")`,
      checks: ['Streams the input line by line', 'Each output line is `"N: text"` plus a newline', 'Returns the number of lines, and 0 for an empty file'],
      hint: 'A single `with` can open two files: `with open(src) as fin, open(dst, "w") as fout:`. Loop with `enumerate(fin, start=1)` and strip the newline before adding your own.',
      explanation: 'Opening both files in one `with` guarantees both are closed. Iterating the input processes a line at a time, so the function works for files of any size. Stripping `"\\n"` and writing a fresh one normalizes the last line, and `count` simply keeps its last value from `enumerate`, staying 0 when the loop never runs.',
    },
  ],
  takeaways: [
    'Open files with `with open(path, mode, encoding="utf-8") as f:` — the block closes the file even if an exception occurs. Without `with`, buffered data can be lost.',
    'Modes: `r` read, `w` write (**erases**), `a` append, `x` create-only, `+` read/write, `b` binary (`bytes`). Opening with `w` truncates immediately.',
    'Read with `for line in f` (best, streaming), `read()`, `readline()` or `readlines()`. `write` and `writelines` add no newlines for you; `read()` returns `""` at the end of the file.',
    'Binary files use `bytes`, `seek` and `tell`. `io.StringIO` and `io.BytesIO` are in-memory files, ideal for tests and for functions that accept any file-like object.',
    'Handle `FileNotFoundError`, rely on universal newlines (or `newline=""`), and save important data atomically: write a temporary file, then `os.replace` it over the original.',
  ],
  reading: [
    { title: 'Reading and Writing Files (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files', source: 'tutorial', note: 'The official introduction to `open`, `with`, `read` and `write`.' },
    { title: 'open() — built-in function', url: 'https://docs.python.org/3/library/functions.html#open', source: 'docs', note: 'Every mode, the `encoding`, `errors` and `newline` parameters, and buffering.' },
    { title: 'io — Core tools for working with streams', url: 'https://docs.python.org/3/library/io.html', source: 'docs', note: 'The layers beneath `open`, plus `StringIO` and `BytesIO`.' },
  ],
};
