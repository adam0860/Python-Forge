import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-entry-text',
  title: 'Entry and Text: Letting Users Type',
  summary: 'Collect typed input with the single-line Entry and the multi-line Text widget: read, insert and delete content, understand indexes such as "1.0" and "end-1c", and remember the rule that everything the user types is a string that must be validated.',
  minutes: 28,
  objectives: [
    'Read, set and clear the content of an `Entry` with `get()`, `insert()` and `delete()`',
    'Validate and convert typed text, remembering that `Entry` always gives strings',
    'Use the `Text` widget: indexes like `"1.0"` and `"end-1c"`, inserting, deleting and tagging',
    'Avoid the classic gotchas: the extra newline from `Text.get`, and inserting into a disabled widget',
    'Choose between `Entry` and `Text`, and use password and read-only entries',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Entry: one line of input',
      blocks: [
        {
          type: 'p',
          text: 'An **Entry** is a single-line text box. You create it like any widget, and then use three methods to work with its content: `get()` returns what the user has typed, `insert(index, text)` adds text at a position, and `delete(first, last)` removes a range. Positions are character indexes starting at `0`, and the special value `tk.END` means “after the last character”. The program below reads a name, greets the user, and clears the box.',
        },
        {
          type: 'code',
          title: 'greeter.py',
          desktopOnly: true,
          code: `import tkinter as tk


def greet():
    name = entry.get().strip()
    if name:
        result.config(text=f"Hello, {name}!")
    else:
        result.config(text="Please type your name first.")
    entry.delete(0, tk.END)


root = tk.Tk()
root.title("Greeter")
tk.Label(root, text="Your name:").pack(padx=20, pady=(15, 0))
entry = tk.Entry(root, width=24)
entry.pack(padx=20, pady=5)
entry.focus()
tk.Button(root, text="Greet", command=greet).pack(pady=5)
result = tk.Label(root, text="")
result.pack(pady=(0, 15))
root.mainloop()`,
          annotations: [
            { lines: 5, text: '`get()` reads the current text. It is a **string**, and users add stray spaces, so `strip()` it right away.' },
            { lines: '6-9', text: 'Always handle the empty case. A required field that is empty should produce a helpful message, not an error or a silent nothing.' },
            { lines: 10, text: '`delete(0, tk.END)` empties the box: it removes everything from index 0 up to the end.' },
            { lines: '16-17', text: 'The entry is stored in a variable (and packed on its own line) because the callback needs to read it.' },
            { lines: 18, text: '`focus()` puts the text cursor in the entry when the window opens, so the user can start typing at once.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'Effect'],
          rows: [
            ['`e.get()`', 'The whole text as a string (`""` if empty)'],
            ['`e.insert(0, "abc")`', 'Insert at the start. `e.insert(tk.END, "abc")` appends. A second `insert` does **not** replace, it adds'],
            ['`e.delete(0, tk.END)`', 'Remove everything. `e.delete(3)` removes the one character at index 3'],
            ['`e.insert(0, "x")` after `delete`', 'The usual way to **set** a value: clear first, then insert'],
            ['`e.focus()`', 'Move the keyboard cursor into this widget'],
            ['`e.icursor(tk.END)`', 'Put the text cursor at a position'],
            ['`e.select_range(0, tk.END)`', 'Select text, for example everything, so typing replaces it'],
            ['`tk.Entry(root, show="*")`', 'A **password** box: every character is displayed as `*`, while `get()` still returns the real text'],
            ['`tk.Entry(root, state="readonly")`', 'The text can be selected and copied but not edited'],
          ],
          caption: 'The Entry toolbox. There is no `set()` on an Entry; you set text with `delete` and `insert` (or with a tk variable, in a later lesson).',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A disabled Entry ignores insert and delete',
          text: 'If the entry (or a `Text`) has `state="disabled"` or `"readonly"`, calls to `insert()` and `delete()` are **silently ignored**. To change the content from code, switch it to `"normal"` first, change it, and switch it back: `e.config(state="normal")`, `e.insert(...)`, `e.config(state="readonly")`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'The user types `42` into an Entry. What does `entry.get()` return?',
      options: [
        { text: 'The string `"42"`', correct: true, why: 'An Entry always returns text. If you need a number you must convert it yourself with `int()` or `float()`, and handle the case that the text is not a number.' },
        { text: 'The integer `42`', why: 'tkinter does not guess types. The text box holds characters, and `get()` gives you those characters as a string.' },
        { text: 'The integer `42`, because the user typed digits', why: 'Digits typed into an Entry are still characters. `"42" + "42"` is `"4242"`, not 84.' },
        { text: 'A `StringVar` holding `"42"`', why: '`get()` returns a plain string. A `StringVar` is a separate object you may attach to the entry; it is covered in the Tk Variables lesson.' },
      ],
      explanation: 'Treat everything that comes from an Entry as untrusted text: strip it, check it, and only then convert it.',
    },
    {
      kind: 'concept',
      title: 'Typed text must be validated',
      blocks: [
        {
          type: 'p',
          text: 'Because the user can type anything, a callback that reads an Entry has three jobs: **clean** the text (`strip()`), **check** it (empty? a number? in range?), and **report** a problem in the interface rather than crashing. Putting those steps in a plain function that takes a string and returns a result makes the logic easy to test, and means the callback only has to display the answer:',
        },
        {
          type: 'code',
          title: 'parse_age.py',
          runnable: true,
          code: `def parse_age(text):
    text = text.strip()
    if not text:
        return None, "Please enter your age."
    try:
        age = int(text)
    except ValueError:
        return None, f"'{text}' is not a whole number."
    if not 0 <= age <= 130:
        return None, "Age must be between 0 and 130."
    return age, ""


for raw in ["42", "  7 ", "", "abc", "200", "3.5"]:
    print(repr(raw), parse_age(raw))`,
          output: `'42' (42, '')
'  7 ' (7, '')
'' (None, 'Please enter your age.')
'abc' (None, "'abc' is not a whole number.")
'200' (None, 'Age must be between 0 and 130.')
'3.5' (None, "'3.5' is not a whole number.")`,
          annotations: [
            { lines: 2, text: 'Clean first: spaces around a number are harmless and should be accepted.' },
            { lines: '3-4', text: 'An empty field gets its own, helpful message.' },
            { lines: '5-8', text: '`int()` raises `ValueError` for text that is not a whole number (including `"3.5"`). Catch that and turn it into a message.' },
            { lines: '9-10', text: 'A number can still be wrong. Range checks belong here, too.' },
            { lines: 11, text: 'The function returns a **pair**: the value (or `None`) and an error message (or an empty string). The callback shows the message when there is one.' },
          ],
        },
        {
          type: 'p',
          text: 'In the real program the callback is then only a few lines: call `parse_age(entry.get())`, and if the message is not empty put it in a label (perhaps in red), otherwise carry on with the number. You will use exactly this style of function in the capstone project.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just let int() raise?',
          text: 'An uncaught exception inside a callback does not close the program; tkinter prints a traceback to the console and carries on, and the user sees **nothing happen**. That is the worst kind of failure: no error message in the window, and no result. Catching bad input and showing a message next to the field is part of the callback’s job.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`entry.insert(0, "x")` replaces whatever is already in the entry with `x`.',
      answer: false,
      explanation: 'False. `insert` only **adds** text at the given position. To replace the content, clear the entry first with `entry.delete(0, tk.END)` and then insert the new text.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that replaces the content of an entry with `"default"`.',
      template: `entry.___(0, tk.END)
entry.___(0, "default")`,
      templateIsCode: true,
      blanks: [{ answers: ['delete'] }, { answers: ['insert'] }],
      wordBank: ['delete', 'insert', 'get', 'set', 'clear'],
      explanation: 'There is no `set` or `clear` method on an Entry. You remove the old content with `delete(0, tk.END)` and add the new with `insert(0, "default")`.',
    },
    {
      kind: 'concept',
      title: 'Text: many lines, rich content',
      blocks: [
        {
          type: 'p',
          text: 'When one line is not enough (notes, a log, an editor), use a **Text** widget. It works like Entry but is far more capable. Positions are no longer single numbers but **indexes** written as strings `"line.column"`: lines count from **1**, columns from **0**. So `"1.0"` is the very start, `"2.5"` is the fifth character position of line 2, and `tk.END` is the end of the text.',
        },
        {
          type: 'code',
          title: 'text_widget.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Text widget")

text = tk.Text(root, width=40, height=8, wrap="word")
text.pack(padx=10, pady=10)
text.insert("1.0", "First line\\nSecond line\\n")
text.insert(tk.END, "Appended at the end")
text.tag_configure("title", font=("Arial", 12, "bold"), foreground="darkgreen")
text.tag_add("title", "1.0", "1.end")

content = text.get("1.0", "end-1c")
print(repr(content))

root.mainloop()`,
          output: `'First line\\nSecond line\\nAppended at the end'`,
          annotations: [
            { lines: 6, text: '`width` and `height` are in characters and lines. `wrap="word"` breaks long lines between words instead of in the middle of a word.' },
            { lines: 8, text: 'Insert at the very start: line 1, column 0. Newlines in the string create new lines in the widget.' },
            { lines: 9, text: '`tk.END` appends.' },
            { lines: '10-11', text: 'A **tag** gives a range of text its own formatting. `tag_configure` defines the look, `tag_add` applies it from `"1.0"` to `"1.end"` (the end of line 1).' },
            { lines: 13, text: '`get(start, stop)` returns the text in the range. `"end-1c"` means “the end, minus one character”.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The extra newline: use "end-1c"',
          text: 'A Text widget **always** has a final newline after the last line, so `text.get("1.0", tk.END)` returns your text **plus one extra `\\n`**. Writing a file with that value adds a blank line each time you save. Use `text.get("1.0", "end-1c")`: “end minus one character”. Both `1.0` and `end-1c` are *index expressions*, and tkinter understands modifiers like `+3c` (three characters further), `linestart` and `lineend`.',
        },
        {
          type: 'table',
          headers: ['Index', 'Means'],
          rows: [
            ['`"1.0"`', 'Line 1, column 0: the start of the text'],
            ['`"3.4"`', 'Line 3, the fifth character position'],
            ['`"1.end"`', 'The end of line 1 (just before its newline)'],
            ['`"2.0 lineend"`', 'The same idea with a modifier, for line 2'],
            ['`tk.END` (`"end"`)', 'After the last character *and* the implicit final newline'],
            ['`"end-1c"`', 'The end of the actual content (what you usually want)'],
            ['`tk.INSERT` (`"insert"`)', 'Where the text cursor currently is'],
          ],
          caption: 'Text indexes. They are strings, so you can build them with f-strings: `f"{line}.0"`.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Text typed into an `Entry` always arrives as strings, so what happens to `+`?',
      code: `value = "21"
print(value + value)
print(int(value) + int(value))`,
      answer: '2121\n42',
      hint: 'Adding two strings concatenates them; adding two integers adds them.',
      explanation: '`"21" + "21"` joins two strings and gives `2121`. Only after converting with `int()` does `+` do arithmetic and give `42`. Forgetting this conversion is the most common bug in the first calculator a new tkinter programmer writes.',
    },
    {
      kind: 'error',
      prompt: 'Pressing the button raises `TypeError: \'>=\' not supported between instances of \'str\' and \'int\'`. Tap the line that raises it.',
      lines: [
        'def check():',
        '    age = entry.get()',
        '    if age >= 18:',
        '        result.config(text="Adult")',
        '    else:',
        '        result.config(text="Minor")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`entry.get()` returns a string, and line 3 compares that string with the number 18. The fix is to convert (and validate) first: `age = int(entry.get())` inside a `try`/`except ValueError`, or by using a function like `parse_age`.',
    },
    {
      kind: 'numeric',
      prompt: 'A Text widget contains exactly `ab`, a newline, `cde`, a newline and `f` (that is, 2 + 1 + 3 + 1 + 1 characters). How many characters does `text.get("1.0", tk.END)` return?',
      answer: '9',
      hint: 'Count the content, then add the extra final newline that Text always has.',
      explanation: 'The content has 2 + 1 + 3 + 1 + 1 = 8 characters, and `tk.END` includes the implicit final newline, so `get("1.0", tk.END)` returns 9 characters. `get("1.0", "end-1c")` would return exactly the 8 characters of content.',
      label: 'Characters:',
    },
    {
      kind: 'concept',
      title: 'Choosing, and a first look at what comes next',
      blocks: [
        {
          type: 'table',
          headers: ['Aspect', 'Entry', 'Text'],
          rows: [
            ['Lines', 'One', 'Many'],
            ['Positions', 'Integers (`0`, `tk.END`)', 'Strings (`"1.0"`, `"end-1c"`)'],
            ['Read all', '`get()`', '`get("1.0", "end-1c")`'],
            ['Replace all', '`delete(0, tk.END)` + `insert(0, s)`', '`delete("1.0", tk.END)` + `insert("1.0", s)`'],
            ['Formatting', 'One style for the whole box', 'Tags: colours, fonts and styles per range'],
            ['Typical use', 'Names, numbers, search boxes, passwords', 'Notes, logs, editors, formatted output'],
          ],
          caption: 'Two ways to take typed input. Both are disabled by `state="disabled"`, which also blocks `insert` and `delete` from code.',
        },
        {
          type: 'p',
          text: 'Long content needs scrollbars, which the lesson on lists and scrollbars covers, and many programs also react to the **Enter** key in an entry: that is a key *event*, handled with `bind()` in the Events lesson. For now, a button and `get()` are all you need.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn',
          text: 'The exercises use the stand-in for `Entry` and `Text`. They implement the same indexes and the same newline rule as the real widgets, so the code you write is real tkinter code.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `read_number(entry)`. It returns the whole number typed into the `Entry` (ignore spaces around it), or `None` if the entry is empty or its text is not a whole number.',
      starter: `import tkinter as tk


def read_number(entry):
    ...
`,
      solution: `import tkinter as tk


def read_number(entry):
    text = entry.get().strip()
    try:
        return int(text)
    except ValueError:
        return None
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
e = tk.Entry(root)
assert read_number(e) is None
e.insert(0, "42")
assert read_number(e) == 42
e.delete(0, tk.END)
e.insert(0, "  7 ")
assert read_number(e) == 7
e.delete(0, tk.END)
e.insert(0, "-15")
assert read_number(e) == -15
for bad in ["abc", "3.5", "12a", "   ", ""]:
    e.delete(0, tk.END)
    e.insert(0, bad)
    assert read_number(e) is None, repr(bad)
e.delete(0, tk.END)
e.insert(0, "0")
assert read_number(e) == 0 and read_number(e) is not None`,
      checks: ['Reads the entry with `get()` and ignores spaces around the text', 'Returns an `int` for whole numbers, including negative ones and `0`', 'Returns `None` for empty text or text that is not a whole number'],
      hint: 'Use `entry.get().strip()`, then `int(...)` inside `try`/`except ValueError`. Return `None` in the `except` branch.',
      explanation: 'Converting inside `try`/`except` is the standard way to validate numbers. Note the check `is not None` for `0`: the result `0` is a valid number but is falsy, so never test the result with just `if result:`.',
    },
    {
      kind: 'code',
      prompt: 'Write `set_entry(entry, value)` that replaces the content of an `Entry` with the string `value` and returns the **previous** content. It must also work on a **read-only** entry (`state="readonly"`): switch it to normal while changing it, and put the state back afterwards.',
      starter: `import tkinter as tk


def set_entry(entry, value):
    ...
`,
      solution: `import tkinter as tk


def set_entry(entry, value):
    old = entry.get()
    state = str(entry.cget("state"))
    entry.config(state="normal")
    entry.delete(0, tk.END)
    entry.insert(0, value)
    entry.config(state=state)
    return old
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
e = tk.Entry(root)
assert set_entry(e, "hello") == ""
assert e.get() == "hello"
assert set_entry(e, "bye") == "hello"
assert e.get() == "bye"
assert set_entry(e, "") == "bye" and e.get() == ""

ro = tk.Entry(root, state="readonly")
assert set_entry(ro, "locked") == ""
assert ro.get() == "locked", "a read-only entry must still be changed from code"
assert str(ro.cget("state")) == "readonly", "restore the original state"
ro.insert(0, "ignored")
assert ro.get() == "locked", "the entry is read-only again"
assert str(e.cget("state")) == "normal"`,
      checks: ['Returns the previous content of the entry', 'Replaces the content (`delete` then `insert`), also when the entry is `readonly`', 'Restores the entry’s original `state`'],
      hint: 'Remember the old text with `entry.get()` and the old state with `entry.cget("state")`. Set `state="normal"`, `delete(0, tk.END)`, `insert(0, value)`, then restore the saved state.',
      explanation: 'Read-only entries are a good way to show text the user may copy but not change, and this is the recipe for updating them from code. The same three-step pattern (enable, change, restore) applies to a disabled `Text` widget used as a log window.',
    },
    {
      kind: 'code',
      prompt: 'Write `all_lines(text)` that returns the content of a `Text` widget as a **list of lines** without the extra final newline. An empty widget gives `[]`. (Use the index `"end-1c"`.)',
      starter: `import tkinter as tk


def all_lines(text):
    ...
`,
      solution: `import tkinter as tk


def all_lines(text):
    content = text.get("1.0", "end-1c")
    if not content:
        return []
    return content.split("\\n")
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
t = tk.Text(root)
assert all_lines(t) == []
t.insert("1.0", "one")
assert all_lines(t) == ["one"]
t.insert(tk.END, "\\ntwo\\nthree")
assert all_lines(t) == ["one", "two", "three"]
t.insert(tk.END, "\\n")
assert all_lines(t) == ["one", "two", "three", ""], "a trailing newline gives a final empty line"
t.delete("1.0", tk.END)
assert all_lines(t) == []
t.insert("1.0", "a\\n\\nb")
assert all_lines(t) == ["a", "", "b"]`,
      checks: ['Reads from `"1.0"` to `"end-1c"`, so there is no extra newline', 'Returns `[]` for an empty widget', 'Returns each line as a list item, keeping empty lines in the middle'],
      hint: 'Use `text.get("1.0", "end-1c")`, return `[]` if that is empty, otherwise `split("\\n")`.',
      explanation: 'Reading with `"end-1c"` is the correct way to get what the user actually wrote. With `tk.END` the list would always have one extra empty string at the end, which would make the empty widget look like it contains one empty line.',
    },
  ],
  takeaways: [
    '**Entry** is a one-line text box: `get()` returns a **string**, `insert(index, s)` adds text (it never replaces), `delete(first, last)` removes it (`tk.END` is the end), and `show="*"` makes a password box.',
    'Everything typed is a string: **clean** it (`strip()`), **check** it (empty, number, range) and **report** problems in the window. Put this in a plain function that returns `(value, error_message)`.',
    '**Text** is the multi-line widget. Indexes are strings `"line.column"` (line from 1, column from 0); `tk.END` includes an implicit final newline, so read content with `get("1.0", "end-1c")`.',
    'A widget with `state="disabled"` (or `"readonly"`) silently ignores `insert` and `delete` from code: set it to `"normal"` first and restore the state afterwards.',
    'Text tags (`tag_configure`, `tag_add`) format ranges of text; scrollbars and key events come in later lessons.',
  ],
  reading: [
    { title: 'TkDocs: Entry', url: 'https://tkdocs.com/tutorial/widgets.html#entry', source: 'tutorial', note: 'Entry basics, password entries, validation and disabling.' },
    { title: 'TkDocs: Text', url: 'https://tkdocs.com/tutorial/text.html', source: 'tutorial', note: 'The Text widget in depth: indexes, tags, marks, scrolling and the undo stack.' },
    { title: 'Tk manual: entry', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/entry.htm', source: 'docs', note: 'All Entry options, indexes and widget commands.' },
    { title: 'Tk manual: text (indices)', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/text.htm#M24', source: 'docs', note: 'The complete syntax of Text indexes and their modifiers.' },
  ],
};
