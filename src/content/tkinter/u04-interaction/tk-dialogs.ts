import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-dialogs',
  title: 'Standard Dialogs: Messages, Files and Colors',
  summary: 'Use the ready-made dialogs: message boxes for information and questions, file and folder choosers, simple input prompts and the colour picker. Learn what each returns, especially when the user cancels, how to keep dialogs attached to your window, and how to write dialog code that is testable.',
  minutes: 30,
  objectives: [
    'Show information, warnings and errors with `messagebox`, and ask questions with `askyesno` and friends',
    'Choose files and folders with `filedialog`, set `filetypes`, and handle a cancelled dialog',
    'Prompt for a value with `simpledialog.askstring`, `askinteger` and `askfloat`',
    'Pick a colour with `colorchooser.askcolor` and unpack its result',
    'Pass `parent=` to every dialog and keep the dialog call separate from the logic so that it can be tested',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Message boxes: tell and ask',
      blocks: [
        {
          type: 'p',
          text: 'The `tkinter.messagebox` module shows small modal windows: the program waits until the user answers. They exist in two families. The **show** functions only inform and return `"ok"`. The **ask** functions pose a question and **return the answer**, so you can use them directly in an `if`. Because `messagebox` is a *submodule*, it must be imported on its own: `from tkinter import messagebox`. Writing only `import tkinter as tk` and then `tk.messagebox` fails with `AttributeError`.',
        },
        {
          type: 'table',
          headers: ['Function', 'Buttons', 'Returns'],
          rows: [
            ['`showinfo(title, message)`', 'OK', '`"ok"`'],
            ['`showwarning(title, message)`', 'OK (warning icon)', '`"ok"`'],
            ['`showerror(title, message)`', 'OK (error icon)', '`"ok"`'],
            ['`askyesno(title, message)`', 'Yes / No', '`True` or `False`'],
            ['`askokcancel(title, message)`', 'OK / Cancel', '`True` or `False`'],
            ['`askretrycancel(title, message)`', 'Retry / Cancel', '`True` or `False`'],
            ['`askyesnocancel(title, message)`', 'Yes / No / Cancel', '`True`, `False` or `None` (cancel)'],
            ['`askquestion(title, message)`', 'Yes / No', 'the **strings** `"yes"` or `"no"` (a common trap: `"no"` is truthy!)'],
          ],
          caption: 'The message box family. Pass `icon="warning"`, `detail="more text"` or `parent=root` as keyword arguments.',
        },
        {
          type: 'code',
          title: 'dialog_demo.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import colorchooser, filedialog, messagebox, simpledialog

root = tk.Tk()
root.title("Dialog demo")
status = tk.StringVar(value="Pick a dialog")
tk.Label(root, textvariable=status, width=46, anchor="w").pack(padx=10, pady=10)


def open_file():
    path = filedialog.askopenfilename(
        parent=root,
        title="Open a text file",
        filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
    )
    status.set(f"Chosen: {path}" if path else "Open cancelled")


def ask_name():
    name = simpledialog.askstring("Name", "What is your name?", parent=root)
    status.set(f"Hello, {name}!" if name else "No name given")


def pick_colour():
    rgb, hex_code = colorchooser.askcolor(parent=root, title="Pick a colour")
    if hex_code:
        status.set(f"Colour {hex_code}, rgb {rgb}")


def quit_app():
    if messagebox.askyesno("Quit", "Do you really want to quit?", parent=root):
        root.destroy()


for text, command in (("Open file...", open_file), ("Ask a name...", ask_name),
                      ("Pick colour...", pick_colour), ("Quit", quit_app)):
    tk.Button(root, text=text, command=command).pack(fill="x", padx=10, pady=2)
root.mainloop()`,
          annotations: [
            { lines: '11-15', text: 'A file dialog returns the chosen path as a string. `parent=root` keeps the dialog on top of your window, and `filetypes` fills the “type” drop-down.' },
            { lines: 16, text: 'On cancel `askopenfilename` returns an **empty string**, so test the result with `if path:` before using it.' },
            { lines: '20-21', text: '`askstring` returns the text, or `None` if the user cancels. An empty string is also falsy, so one check covers both.' },
            { lines: '25-27', text: '`askcolor` returns a pair: `((r, g, b), "#rrggbb")`, and `(None, None)` when cancelled. Unpack it, then test the hex string.' },
            { lines: '31-32', text: '`askyesno` returns a real `bool`, so it can go straight into an `if`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Always pass parent=',
          text: 'Without `parent=root` a dialog may open behind your main window, on a different screen, or without the main window being disabled. Passing the window you came from keeps the dialog on top, centred over its owner and modal to it. It is a one-word habit that prevents a whole category of “the program froze” reports (the dialog was simply hidden).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `messagebox.askyesno("Quit", "Really?")` return when the user clicks **No**?',
      options: [
        { text: '`False`', correct: true, why: 'askyesno returns a real boolean: `True` for Yes and `False` for No, so `if messagebox.askyesno(...):` reads naturally.' },
        { text: '`"no"`', why: 'The string result belongs to `askquestion`. That function returns `"yes"` or `"no"`, and both strings are truthy, which makes it easy to misuse in an `if`.' },
        { text: '`None`', why: '`None` is returned by `askyesnocancel` when the user cancels. `askyesno` has no cancel button.' },
        { text: '`0`', why: 'The result is a bool, `False`. (It compares equal to `0` in Python, but it is not an int that the dialog returned.)' },
      ],
      explanation: 'Prefer `askyesno`, `askokcancel` and `askretrycancel`, which return booleans. If you must use `askquestion`, compare the result to `"yes"` explicitly.',
    },
    {
      kind: 'concept',
      title: 'Choosing files, values and colours',
      blocks: [
        {
          type: 'p',
          text: '`tkinter.filedialog` opens the operating system’s own file chooser. The functions you will use are `askopenfilename()` (one existing file), `askopenfilenames()` (several, returned as a tuple), `asksaveasfilename()` (a path that need not exist yet; the system asks before overwriting) and `askdirectory()` (a folder). Useful options: `title`, `initialdir`, `initialfile`, `defaultextension` (added when the user types a name without one) and `filetypes`.',
        },
        {
          type: 'p',
          text: '`filetypes` is a list of `(label, patterns)` pairs. Patterns are separated by **spaces** inside one string, and the first pair is the one preselected: `[("Images", "*.png *.jpg"), ("All files", "*.*")]`. The dialogs return a path **string**, so convert it with `pathlib.Path` as soon as you have it. A cancelled dialog returns an **empty** value (`""` for single files, `""` or `()` for `askopenfilenames`), never `None`, so always test with `if not path:`.',
        },
        {
          type: 'code',
          title: 'handle_choice.py',
          runnable: true,
          code: `from pathlib import Path


def describe(choice):
    if not choice:
        return "cancelled"
    path = Path(choice)
    return f"{path.name} ({path.suffix or 'no extension'}) in {path.parent}"


for choice in ["C:/Users/ana/notes.txt", "/home/ana/archive.tar.gz", "/home/ana/Makefile", "", ()]:
    print(repr(choice), "->", describe(choice))`,
          output: `'C:/Users/ana/notes.txt' -> notes.txt (.txt) in C:/Users/ana
'/home/ana/archive.tar.gz' -> archive.tar.gz (.gz) in /home/ana
'/home/ana/Makefile' -> Makefile (no extension) in /home/ana
'' -> cancelled
() -> cancelled`,
          annotations: [
            { lines: '5-6', text: 'One truthiness check handles every “nothing chosen” result: `""`, `()` and `None` are all falsy.' },
            { lines: '7-8', text: '`pathlib.Path` splits the string into name, suffix and folder, with no string slicing. (Tk returns forward slashes, even on Windows.)' },
          ],
        },
        {
          type: 'table',
          headers: ['Module and function', 'Returns', 'On cancel'],
          rows: [
            ['`filedialog.askopenfilename()`', 'path string', '`""`'],
            ['`filedialog.askopenfilenames()`', 'tuple of path strings', 'an empty value (`""` or `()`)'],
            ['`filedialog.asksaveasfilename()`', 'path string', '`""`'],
            ['`filedialog.askdirectory()`', 'folder path string', '`""`'],
            ['`simpledialog.askstring(title, prompt)`', 'the text typed', '`None`'],
            ['`simpledialog.askinteger(title, prompt, minvalue=, maxvalue=)`', '`int` (the dialog re-asks for invalid input)', '`None`'],
            ['`simpledialog.askfloat(...)`', '`float`', '`None`'],
            ['`colorchooser.askcolor()`', '`((r, g, b), "#rrggbb")`', '`(None, None)`'],
          ],
          caption: 'Return values and cancel results. Test for “nothing” with `if not result:`, except for `0`, which is a valid answer from `askinteger`: use `if result is None:` there.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is the 0 case special?',
          text: '`simpledialog.askinteger` returns `0` when the user types `0`, and `0` is falsy just like `None`. `if not value:` would treat a legitimate 0 as a cancel. Use `if value is None:` for the dialogs whose cancel result is `None`, and truthiness only for the ones that cancel with an empty string.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`filedialog.askopenfilename()` returns `None` when the user clicks Cancel.',
      answer: false,
      explanation: 'False. It returns an **empty string**. Code that checks `if path is None:` never notices a cancel, and then tries to open the file `""`, which fails. Use `if not path:` (or `if path:`) for the file dialogs.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the call that asks for confirmation, with the dialog owned by `root`.',
      template: `answer = messagebox.___("Quit", "Discard your changes?", ___=root)`,
      templateIsCode: true,
      blanks: [{ answers: ['askyesno', 'askokcancel'] }, { answers: ['parent'] }],
      wordBank: ['askyesno', 'parent', 'showinfo', 'master', 'askquestion'],
      explanation: '`askyesno` returns a boolean, which is what a yes/no question needs, and `parent=root` attaches the dialog to your window so that it appears on top of it. (`showinfo` cannot ask a question, and `askquestion` returns strings.)',
    },
    {
      kind: 'concept',
      title: 'Testable dialog code',
      blocks: [
        {
          type: 'p',
          text: 'Dialogs are awkward for automated tests, because they stop the program until a human clicks. The standard solution is to **keep the dialog call small and the decision separate**. A function that asks the question and a function that acts on the answer can be tested by replacing the dialog function with one that returns a fixed answer. In Python that is one line: `messagebox.askyesno = lambda *args, **kw: True`.',
        },
        {
          type: 'table',
          headers: ['Do', 'Why'],
          rows: [
            ['`messagebox.askyesno(...)` (call through the module)', 'A test can replace the module attribute. With `from tkinter.messagebox import askyesno` the name is already copied and cannot be replaced'],
            ['Return the user’s decision from a small function', 'The rest of the program tests a value, not a window'],
            ['Pass `parent=`', 'Correct stacking and modality'],
            ['Treat cancel as a normal outcome', 'Most dialogs are cancelled more often than you think'],
            ['Show errors where the user is looking: a dialog for a failed action, a label for a mistyped field', 'Dialogs interrupt; use them for events, not for validation of every keystroke'],
          ],
          caption: 'Habits that make dialog code robust.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The exercises replace the dialog',
          text: 'In the exercises the tests replace the dialog functions with fakes that record how they were called, and return fixed answers. That is how you test dialog code in a real project, and it is the only way to run a dialog in a page without a screen. Call the dialogs through their module (`messagebox.askyesno`, `simpledialog.askinteger`, `filedialog.asksaveasfilename`), exactly as in the demo program.',
        },
        {
          type: 'p',
          text: 'Dialogs are *modal* but not *frozen*: while one is open, your timers (`after`) and trace callbacks still run, and clicks on other windows of your program are ignored. For a dialog of your own design (several fields, a custom layout) you build a `Toplevel` window, which the next lesson introduces.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The colour chooser returns a pair, and the program unpacks it.',
      code: `result = ((255, 128, 0), "#ff8000")
rgb, hex_code = result
print(hex_code, sum(rgb))`,
      answer: '#ff8000 383',
      hint: 'Add 255 + 128 + 0.',
      explanation: '`askcolor` returns `(rgb_tuple, hex_string)`. Unpacking gives `rgb = (255, 128, 0)` and `hex_code = "#ff8000"`; the sum of the channels is 255 + 128 + 0 = 383.',
    },
    {
      kind: 'error',
      prompt: 'This program stops with `AttributeError: module \'tkinter\' has no attribute \'messagebox\'`. Tap the line that raises it.',
      lines: [
        'import tkinter as tk',
        'root = tk.Tk()',
        'tk.messagebox.showinfo("Hi", "Hello")',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`messagebox` is a separate submodule that `import tkinter` does not load. Add `from tkinter import messagebox` (or `import tkinter.messagebox`) and call `messagebox.showinfo(...)`. The same holds for `filedialog`, `simpledialog`, `colorchooser` and `ttk`.',
    },
    {
      kind: 'numeric',
      prompt: 'A save dialog is configured with `filetypes=[("Python", "*.py *.pyw"), ("Text", "*.txt"), ("All", "*.*")]`. How many file name **patterns** does the call define in total?',
      answer: '4',
      hint: 'Patterns inside one string are separated by spaces. Count `*.py`, `*.pyw`, `*.txt` and `*.*`.',
      explanation: 'There are three entries in the drop-down (Python, Text, All), but four patterns: `*.py` and `*.pyw` share the first entry, `*.txt` is the second and `*.*` the third.',
      label: 'Patterns:',
    },
    {
      kind: 'concept',
      title: 'Your turn: three dialog helpers',
      blocks: [
        {
          type: 'p',
          text: 'In the exercises the dialog functions are replaced by fakes, so you test only your own logic: what you ask, which options you pass, and what you do with each possible answer, including cancel. Use the module functions exactly as in the demo.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `confirm_discard(root, has_unsaved)`. If there are no unsaved changes, return `True` **without showing any dialog**. Otherwise call `messagebox.askyesno("Unsaved changes", "Discard your changes?", icon="warning", parent=root)` and return its answer.',
      starter: `import tkinter as tk
from tkinter import messagebox


def confirm_discard(root, has_unsaved):
    ...
`,
      solution: `import tkinter as tk
from tkinter import messagebox


def confirm_discard(root, has_unsaved):
    if not has_unsaved:
        return True
    return messagebox.askyesno(
        "Unsaved changes", "Discard your changes?", icon="warning", parent=root
    )
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
calls = []
answers = [True]


def fake_askyesno(title=None, message=None, **options):
    calls.append((title, message, options))
    return answers[0]


messagebox.askyesno = fake_askyesno

assert confirm_discard(root, False) is True
assert calls == [], "no dialog when nothing is unsaved"
assert confirm_discard(root, True) is True
assert len(calls) == 1
title, message, options = calls[0]
assert title == "Unsaved changes" and message == "Discard your changes?"
assert options.get("icon") == "warning"
assert options.get("parent") is root
answers[0] = False
assert confirm_discard(root, True) is False
assert len(calls) == 2`,
      checks: ['Returns `True` without any dialog when there is nothing unsaved', 'Calls `messagebox.askyesno` with the title, message, `icon="warning"` and `parent=root`', 'Returns the user’s answer (`True` or `False`)'],
      hint: 'Return early if `not has_unsaved`. Otherwise `return messagebox.askyesno("Unsaved changes", "Discard your changes?", icon="warning", parent=root)`. Call it through `messagebox.` so that the test can replace it.',
      explanation: 'A small function that answers “may I continue?” is easy to reuse for closing the window, opening another file, and starting a new document. The early return avoids a pointless dialog for the common case.',
    },
    {
      kind: 'code',
      prompt: 'Write `ask_age(root)`. Use `simpledialog.askinteger("Age", "How old are you?", parent=root, minvalue=0, maxvalue=130)`. Return the string `"You are N years old."` for the number `N` that was entered (zero is a valid age!), or `"No age given."` when the user cancels.',
      starter: `import tkinter as tk
from tkinter import simpledialog


def ask_age(root):
    ...
`,
      solution: `import tkinter as tk
from tkinter import simpledialog


def ask_age(root):
    age = simpledialog.askinteger(
        "Age", "How old are you?", parent=root, minvalue=0, maxvalue=130
    )
    if age is None:
        return "No age given."
    return f"You are {age} years old."
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
seen = []
reply = [42]


def fake_askinteger(title=None, prompt=None, **options):
    seen.append((title, prompt, options))
    return reply[0]


simpledialog.askinteger = fake_askinteger

assert ask_age(root) == "You are 42 years old."
title, prompt, options = seen[0]
assert title == "Age" and prompt == "How old are you?"
assert options.get("parent") is root
assert options.get("minvalue") == 0 and options.get("maxvalue") == 130
reply[0] = 0
assert ask_age(root) == "You are 0 years old.", "0 is a real answer, not a cancel"
reply[0] = None
assert ask_age(root) == "No age given."`,
      checks: ['Calls `simpledialog.askinteger` with the title, prompt, `parent`, `minvalue=0` and `maxvalue=130`', 'Treats `0` as a valid answer (checks `is None`, not truthiness)', 'Returns the two messages exactly'],
      hint: 'Store the answer, then `if age is None: return "No age given."`. Do not write `if not age:` because `0` is falsy.',
      explanation: 'This is the “0 versus None” trap from the lesson. `askinteger` cancels with `None`, so `is None` is the right test, and a user whose age is 0 (or whose answer is 0 in any other quantity) is handled correctly.',
    },
    {
      kind: 'code',
      prompt: 'Write `save_note(root, text)`. Ask for a file name with `filedialog.asksaveasfilename(parent=root, defaultextension=".txt", filetypes=[("Text files", "*.txt"), ("All files", "*.*")])`. If the user cancels (empty result) return `None`; otherwise write `text` to that path (UTF-8) and return the path.',
      starter: `import tkinter as tk
from tkinter import filedialog


def save_note(root, text):
    ...
`,
      solution: `import tkinter as tk
from tkinter import filedialog


def save_note(root, text):
    path = filedialog.asksaveasfilename(
        parent=root,
        defaultextension=".txt",
        filetypes=[("Text files", "*.txt"), ("All files", "*.*")],
    )
    if not path:
        return None
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)
    return path
`,
      setup: TK_SIM,
      tests: `import os
import tempfile

root = tk.Tk()
target = os.path.join(tempfile.mkdtemp(), "note.txt")
seen = []
reply = [target]


def fake_save(**options):
    seen.append(options)
    return reply[0]


filedialog.asksaveasfilename = fake_save

assert save_note(root, "hello\\nworld") == target
with open(target, encoding="utf-8") as handle:
    assert handle.read() == "hello\\nworld"
options = seen[0]
assert options.get("parent") is root
assert options.get("defaultextension") == ".txt"
types = [tuple(t) for t in options.get("filetypes")]
assert types == [("Text files", "*.txt"), ("All files", "*.*")], types
reply[0] = ""
assert save_note(root, "ignored") is None
reply[0] = ()
assert save_note(root, "ignored") is None, "any empty result means cancel"
assert len(seen) == 3`,
      checks: ['Calls `filedialog.asksaveasfilename` with `parent`, `defaultextension=".txt"` and the two file types', 'Returns `None` and writes nothing when the result is empty', 'Writes the text as UTF-8 to the chosen path and returns that path'],
      hint: 'Use `if not path: return None` right after the dialog. Then `with open(path, "w", encoding="utf-8") as handle: handle.write(text)` and `return path`.',
      explanation: 'The three steps (ask, handle cancel, act) are the shape of every file dialog. Checking `if not path` covers every kind of empty result, which keeps the code correct on all systems.',
    },
  ],
  takeaways: [
    '`messagebox` has **show** functions (info, warning, error: return `"ok"`) and **ask** functions (`askyesno`, `askokcancel`, `askretrycancel` return booleans, `askyesnocancel` can return `None`, `askquestion` returns the strings `"yes"`/`"no"`). Import it with `from tkinter import messagebox`.',
    '`filedialog` returns **path strings**, and an **empty value** (not `None`) on cancel: test with `if not path:`. `filetypes` is a list of `(label, "*.ext *.ext2")` pairs; `defaultextension` completes names typed without one.',
    '`simpledialog.askstring`, `askinteger` and `askfloat` return `None` on cancel, so test with `is None` (zero is a valid answer). `colorchooser.askcolor` returns `((r, g, b), "#rrggbb")`, or `(None, None)`.',
    'Pass `parent=root` to every dialog so that it stays on top of your window and is modal to it.',
    'Call dialogs through their module (`messagebox.askyesno(...)`) and keep the decision in a small function: tests can then replace the dialog with a fake, and the rest of the program works with plain values.',
  ],
  reading: [
    { title: 'Python docs: tkinter.messagebox', url: 'https://docs.python.org/3/library/tkinter.messagebox.html', source: 'docs', note: 'All message box functions with their return values.' },
    { title: 'Python docs: tkinter.filedialog', url: 'https://docs.python.org/3/library/dialog.html#module-tkinter.filedialog', source: 'docs', note: 'File and directory choosers, options and return values.' },
    { title: 'TkDocs: Standard dialogs', url: 'https://tkdocs.com/tutorial/windows.html#dialogs', source: 'tutorial', note: 'Message boxes, file and colour choosers, and how to build your own dialog.' },
    { title: 'Python docs: tkinter.colorchooser and simpledialog', url: 'https://docs.python.org/3/library/dialog.html', source: 'docs', note: 'The colour chooser and the simple value prompts in one page.' },
  ],
};
