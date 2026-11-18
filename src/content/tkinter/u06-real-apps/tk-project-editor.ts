import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-project-editor',
  title: 'Project: A Text Editor',
  summary: 'Build a small but real text editor: a Text widget with a scrollbar, menus and keyboard shortcuts, open and save with file dialogs, a title that shows unsaved changes, a status bar, and a find command. The rules are kept in testable functions.',
  minutes: 40,
  objectives: [
    'Lay out an editor window with a Text widget, a scrollbar and a status bar, and explain why the pack order matters',
    'Read and change the contents of a Text widget using indexes such as `"1.0"`, `"end-1c"` and `"insert"`',
    'Open and save files with the file dialogs, using UTF-8, and handle cancelled dialogs and unreadable files',
    'Track unsaved changes with the modified flag and the `<<Modified>>` event, and ask before discarding work',
    'Add keyboard shortcuts that do not clash with the Text widget’s own bindings',
    'Keep the editor’s rules (title, search, status line) in small functions that can be tested',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The plan: what an editor needs',
      blocks: [
        {
          type: 'p',
          text: 'A text editor looks like a big job, but most of the hard work is done for you by the **Text widget**: it already handles typing, selection, copy and paste, undo and redo, scrolling and word wrap. The program you add around it is mostly **plumbing**: menus, files, and keeping the window title and status line truthful. This lesson builds that plumbing in the order a user would meet it.',
        },
        {
          type: 'table',
          headers: ['Feature', 'How it is built'],
          rows: [
            ['Typing area with word wrap and undo', '`tk.Text(root, wrap="word", undo=True)`'],
            ['A scrollbar', '`ttk.Scrollbar` linked in both directions with `yscrollcommand` and `command=text.yview`'],
            ['New, Open, Save, Save As, Exit', 'A `tk.Menu` with `add_command`, plus the file dialogs'],
            ['“Do you want to save?” protection', 'The Text widget’s modified flag, and `askyesnocancel`'],
            ['Title shows `*` when there are unsaved changes', 'The `<<Modified>>` virtual event updates `root.title()`'],
            ['Line, column and word count', 'A status bar label updated from `text.index("insert")`'],
            ['Find', '`simpledialog.askstring`, a search function, and a tag that highlights matches'],
            ['Ctrl+S, Ctrl+O, Ctrl+N, Ctrl+F', '`bind` on the Text widget, returning `"break"`'],
          ],
          caption: 'The feature list, and what each feature leans on.',
        },
        {
          type: 'p',
          text: 'The window is three parts. The **status bar** sits along the bottom, the **scrollbar** along the right, and the **Text** fills what is left. With `pack`, the order of calls is the order in which space is handed out, so the parts with a fixed size must be packed **before** the part that expands. If you pack the Text first with `expand=True`, it takes everything and the status bar can be squeezed out of view when the window is made small.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why build it as a class',
          text: 'The editor has state that many callbacks share: the current file path, the Text widget, the status variable. Putting them on `self` means every method can reach them without global variables, and the last lesson’s separation applies here too: anything that is a pure rule (the title, the search, the status line) is a plain function that a test can call without a window.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In the editor’s layout code, why are the status bar and the scrollbar packed **before** the `Text` widget?',
      options: [
        { text: 'The pack geometry manager gives space out in the order of the calls, so the fixed-size parts claim their edges first and the Text widget (with `expand=True`) takes what is left', correct: true, why: 'A widget that expands greedily should be packed last, so that it cannot push the fixed parts out when the window shrinks.' },
        { text: 'Widgets that are packed later are always drawn on top of earlier ones', why: 'Pack does not make widgets overlap; it divides the free space between them.' },
        { text: 'The Text widget cannot be created until the scrollbar exists', why: 'You could create them in any order; it is the order of `pack()` calls that matters here.' },
        { text: 'Scrollbars must always be packed first, or they will not scroll', why: 'The link between a scrollbar and a widget is made with `command` and `yscrollcommand`, not with the pack order.' },
      ],
      explanation: 'Create the widgets in whatever order is convenient, but pack the ones with a fixed size first, then pack the one with `expand=True` last.',
    },
    {
      kind: 'truefalse',
      prompt: '`text.get("1.0", "end")` returns exactly the characters the user typed, so it is the right call to use when saving a file.',
      answer: false,
      explanation: 'False. A Text widget always contains one extra newline after the last character, so `get("1.0", "end")` ends with a newline that the user never typed, and a file that is opened and saved repeatedly would grow by one blank line each time. Use `get("1.0", "end-1c")`, which means “the end, minus one character”.',
    },
    {
      kind: 'concept',
      title: 'The editor, piece by piece',
      blocks: [
        {
          type: 'p',
          text: 'The Text widget is addressed with **indexes**: strings that name a position in the text. The ones you will use all the time are in this table. Line numbers start at **1**, and column numbers start at **0**.',
        },
        {
          type: 'table',
          headers: ['Index', 'Meaning'],
          rows: [
            ['`"1.0"`', 'Line 1, column 0: the very beginning'],
            ['`"2.5"`', 'Line 2, five characters in'],
            ['`"end"`', 'One position **past** the last character (after the hidden final newline)'],
            ['`"end-1c"`', 'The real end: one character before `"end"`'],
            ['`"insert"`', 'The text cursor'],
            ['`"insert linestart"`, `"insert lineend"`', 'The start and the end of the cursor’s line'],
            ['`"sel.first"`, `"sel.last"`', 'The start and end of the selection (an error when nothing is selected)'],
          ],
          caption: 'Text indexes. `text.index(i)` turns any of them into a plain `"line.column"` string.',
        },
        {
          type: 'p',
          text: 'Here is the whole editor. Read it from the top: the layout, then the menu, then the file commands, then the shortcuts. Every method is short, and none of them is hard on its own.',
        },
        {
          type: 'code',
          title: 'editor.py',
          desktopOnly: true,
          code: `import os
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog, ttk

APP = "Editor"
FILETYPES = [("Text files", "*.txt"), ("All files", "*.*")]


class Editor:
    def __init__(self, root):
        self.root = root
        self.path = None
        self.status = tk.StringVar()

        ttk.Label(root, textvariable=self.status, anchor="w", padding=(6, 2)).pack(side="bottom", fill="x")
        scroll = ttk.Scrollbar(root)
        scroll.pack(side="right", fill="y")
        self.text = tk.Text(root, wrap="word", undo=True, width=80, height=24)
        self.text.pack(fill="both", expand=True)
        self.text.configure(yscrollcommand=scroll.set)
        scroll.configure(command=self.text.yview)
        self.text.tag_configure("match", background="#fff176")

        self.build_menu()
        self.bind_key("<Control-n>", self.new)
        self.bind_key("<Control-o>", self.open_file)
        self.bind_key("<Control-s>", self.save)
        self.bind_key("<Control-f>", self.find)
        self.text.bind("<<Modified>>", lambda event: self.refresh())
        self.text.bind("<KeyRelease>", lambda event: self.refresh())
        self.text.bind("<ButtonRelease-1>", lambda event: self.refresh())
        root.protocol("WM_DELETE_WINDOW", self.quit)
        self.refresh()

    def build_menu(self):
        bar = tk.Menu(self.root)
        file_menu = tk.Menu(bar, tearoff=False)
        file_menu.add_command(label="New", accelerator="Ctrl+N", command=self.new)
        file_menu.add_command(label="Open...", accelerator="Ctrl+O", command=self.open_file)
        file_menu.add_command(label="Save", accelerator="Ctrl+S", command=self.save)
        file_menu.add_command(label="Save As...", command=self.save_as)
        file_menu.add_separator()
        file_menu.add_command(label="Exit", command=self.quit)
        bar.add_cascade(label="File", menu=file_menu)
        edit_menu = tk.Menu(bar, tearoff=False)
        edit_menu.add_command(label="Undo", command=lambda: self.text.event_generate("<<Undo>>"))
        edit_menu.add_command(label="Redo", command=lambda: self.text.event_generate("<<Redo>>"))
        edit_menu.add_separator()
        edit_menu.add_command(label="Find...", accelerator="Ctrl+F", command=self.find)
        bar.add_cascade(label="Edit", menu=edit_menu)
        self.root.configure(menu=bar)

    def bind_key(self, sequence, command):
        def handler(event):
            command()
            return "break"
        self.text.bind(sequence, handler)

    def refresh(self):
        name = os.path.basename(self.path) if self.path else "untitled"
        mark = "*" if self.text.edit_modified() else ""
        self.root.title(f"{mark}{name} - {APP}")
        line, col = self.text.index("insert").split(".")
        words = len(self.text.get("1.0", "end-1c").split())
        self.status.set(f"Ln {line}, Col {int(col) + 1} | {words} words")

    def confirm_discard(self):
        if not self.text.edit_modified():
            return True
        answer = messagebox.askyesnocancel(APP, "Save changes first?")
        if answer is None:
            return False
        return self.save() if answer else True

    def load(self, content, path):
        self.text.delete("1.0", "end")
        self.text.insert("1.0", content)
        self.text.edit_reset()
        self.text.edit_modified(False)
        self.path = path
        self.refresh()

    def new(self):
        if self.confirm_discard():
            self.load("", None)

    def open_file(self):
        if not self.confirm_discard():
            return
        path = filedialog.askopenfilename(filetypes=FILETYPES)
        if not path:
            return
        try:
            with open(path, encoding="utf-8") as f:
                content = f.read()
        except (OSError, UnicodeDecodeError) as error:
            messagebox.showerror(APP, f"Could not open the file:\\n{error}")
            return
        self.load(content, path)

    def save(self):
        if self.path is None:
            return self.save_as()
        return self.write(self.path)

    def save_as(self):
        path = filedialog.asksaveasfilename(defaultextension=".txt", filetypes=FILETYPES)
        return bool(path) and self.write(path)

    def write(self, path):
        try:
            with open(path, "w", encoding="utf-8") as f:
                f.write(self.text.get("1.0", "end-1c"))
        except OSError as error:
            messagebox.showerror(APP, f"Could not save the file:\\n{error}")
            return False
        self.path = path
        self.text.edit_modified(False)
        self.refresh()
        return True

    def find(self):
        query = simpledialog.askstring(APP, "Text to find:", parent=self.root)
        self.text.tag_remove("match", "1.0", "end")
        if not query:
            return
        start = "1.0"
        while True:
            start = self.text.search(query, start, stopindex="end", nocase=True)
            if not start:
                break
            end = f"{start}+{len(query)}c"
            self.text.tag_add("match", start, end)
            start = end
        first = self.text.tag_nextrange("match", "1.0")
        if first:
            self.text.see(first[0])
        else:
            messagebox.showinfo(APP, "Not found")

    def quit(self):
        if self.confirm_discard():
            self.root.destroy()


if __name__ == "__main__":
    root = tk.Tk()
    Editor(root)
    root.mainloop()`,
          annotations: [
            { lines: '15-22', text: 'The layout. The status bar goes to the bottom and the scrollbar to the right **first**; the `Text` is packed last with `expand=True`. The scrollbar and the Text are then linked in both directions: the Text tells the scrollbar where it is, and the scrollbar tells the Text to scroll.' },
            { lines: '25-31', text: 'The shortcuts are bound on the **Text widget**, not on the window. Its built-in class bindings (Ctrl+O inserts a new line, Ctrl+F moves the cursor) run before the window’s, so a binding on the window would come too late. The `<<Modified>>` event runs whenever the modified flag changes.' },
            { lines: '53-57', text: '`bind_key` wraps a command in a handler that returns `"break"`. That tells Tk to stop processing the event, so the Text widget’s own response to the key never happens.' },
            { lines: '59-65', text: '`refresh` is the one place where the title and the status line are computed. It runs after every change that could affect them: the file commands, key releases, mouse clicks and the `<<Modified>>` event.' },
            { lines: '67-73', text: 'A command that would throw work away asks first. `askyesnocancel` gives `True` (save), `False` (do not save) or `None` (cancel), and cancelling stops the whole action.' },
            { lines: '75-81', text: '`load` puts new content into the widget. `edit_reset` clears the undo history, so that Ctrl+Z cannot undo the opening of the file, and `edit_modified(False)` marks the new content as unchanged.' },
            { lines: '87-99', text: 'Opening handles two failures: the user pressing Cancel (an empty path), and a file that cannot be read (`OSError`), or is not UTF-8 text (`UnicodeDecodeError`).' },
            { lines: '101-120', text: 'Saving writes `get("1.0", "end-1c")` as UTF-8 and clears the modified flag. `save` falls back to `save_as` when the document has no path yet, and returns `True` or `False` so that callers know whether it worked.' },
            { lines: '122-139', text: 'Find loops with `text.search`, which returns the index of the next match or an empty string. Moving the start to the end of the match makes each search continue from where the last one stopped, and a tag with a background colour highlights every hit.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the two lines that read the text for saving and mark it as saved.',
      template: `content = self.text.get("1.0", "___")
self.text.edit_modified(___)`,
      templateIsCode: true,
      blanks: [{ answers: ['end-1c'] }, { answers: ['False'] }],
      wordBank: ['end-1c', 'end', 'False', 'True', 'insert'],
      explanation: '`"end-1c"` leaves out the extra newline that the Text widget always has, and `edit_modified(False)` clears the modified flag, which also fires `<<Modified>>` so that the title loses its `*`.',
    },
    {
      kind: 'predict',
      prompt: 'This code mimics what the Find command does, as plain Python. Predict the output.',
      code: `content = "one two\\nthree two"
print([f"{n}.{line.find('two')}" for n, line in enumerate(content.split("\\n"), start=1)])`,
      answer: "['1.4', '2.6']",
      hint: 'Lines are numbered from 1, and columns from 0.',
      explanation: 'The word `two` starts at column 4 of the first line (`one two`) and at column 6 of the second (`three two`), so the positions are `1.4` and `2.6`, in the same `"line.column"` form that Tk uses for Text indexes.',
    },
    {
      kind: 'concept',
      title: 'Edge cases that make an editor feel solid',
      blocks: [
        {
          type: 'p',
          text: 'An editor that works on the happy path is easy. What makes one feel trustworthy is how it behaves when something goes wrong. These are the cases the code above already covers, and the reason for each one:',
        },
        {
          type: 'table',
          headers: ['Situation', 'What the editor does', 'Why'],
          rows: [
            ['The user cancels the Open dialog', 'The dialog returns an empty string, and the program does nothing', 'Cancelling is a normal answer. Check `if not path` before using it'],
            ['The chosen file is a picture or a binary', 'Catches `UnicodeDecodeError` and shows a message', 'Reading bytes that are not valid UTF-8 text raises an exception'],
            ['The disk is full or the file is read-only', 'Catches `OSError` on save, reports it, keeps the modified flag', 'The user’s text is still only in memory: it must not be marked as saved'],
            ['Closing the window with unsaved changes', '`WM_DELETE_WINDOW` calls `quit`, which asks first', 'Without `protocol`, the close button destroys the window at once'],
            ['Cancelling the “save changes?” question', '`confirm_discard` returns `False` and the action is abandoned', 'Three answers need three paths: yes, no and cancel'],
            ['Opening a file replaces the text', '`edit_reset()` clears the undo history', 'Otherwise Ctrl+Z would bring back the previous file’s text into this one'],
          ],
          caption: 'The unhappy paths.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Things to add when you extend it',
          text: 'Replace, a font size menu (change the `font` option), line numbers in a second Text or Canvas that follows the first, a recent files list stored in a settings file, drag-and-drop, and a dark theme using the colour options from the styling lesson. Each of them is a small step from this base, which is the sign of a structure that works.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Opening a picture by mistake raises `UnicodeDecodeError: \'utf-8\' codec can\'t decode byte 0x89 in position 0: invalid start byte`. Tap the line that raises it.',
      lines: [
        'path = "photo.png"',
        'with open(path, encoding="utf-8") as f:',
        '    content = f.read()',
        'print(len(content))',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`open` succeeds, because the file exists. It is `f.read()` that decodes the bytes as UTF-8 text, and a PNG file begins with the byte 0x89, which is not valid UTF-8. The editor wraps exactly this read in `try/except (OSError, UnicodeDecodeError)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A Text widget contains `ab`, a newline, `cd`, a newline and `ef`, with nothing after `ef`. What is the line number in `text.index("end")`? (It is the part before the dot.)',
      answer: '4',
      hint: 'The widget always holds one extra newline after the last character, and `"end"` is the position after it.',
      explanation: 'The text occupies lines 1, 2 and 3, and `"end"` is one position past the hidden final newline, so it is `4.0`. That is also why `"end-1c"` is the real end of the text, `3.2`.',
      label: 'Line:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the editor’s rules',
      blocks: [
        {
          type: 'p',
          text: 'Three pieces of the editor are rules rather than widgets, so they can be written and tested without any window at all, or with a bare Text widget. First the **document state**, which decides the title and whether Save needs a file name. Then the **search**, which gives positions in the same `"line.column"` form the widget uses. And last the **status line**, which reads a real Text widget.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `Document` with no tkinter. It starts with `path = None` and `modified = False`. The property `name` is the file’s base name (`os.path.basename`), or `"untitled"` with no path. The property `title` is the name followed by `" - Editor"`, with a `"*"` in front of it when `modified` is true. `edited()` sets `modified`. `opened(path)` sets the path and clears `modified`. `saved(path=None)` sets the path if one is given, and clears `modified`. `needs_save_as()` is true when there is no path yet.',
      starter: `import os


class Document:
    ...
`,
      solution: `import os


class Document:
    def __init__(self):
        self.path = None
        self.modified = False

    @property
    def name(self):
        return os.path.basename(self.path) if self.path else "untitled"

    @property
    def title(self):
        return ("*" if self.modified else "") + self.name + " - Editor"

    def edited(self):
        self.modified = True

    def opened(self, path):
        self.path = path
        self.modified = False

    def saved(self, path=None):
        if path is not None:
            self.path = path
        self.modified = False

    def needs_save_as(self):
        return self.path is None
`,
      tests: `d = Document()
assert d.path is None and d.modified is False
assert d.name == "untitled"
assert d.title == "untitled - Editor", d.title
assert d.needs_save_as() is True
d.edited()
assert d.modified is True and d.title == "*untitled - Editor", d.title
d.saved("/home/ann/notes.txt")
assert d.path == "/home/ann/notes.txt" and d.modified is False
assert d.name == "notes.txt" and d.title == "notes.txt - Editor"
assert d.needs_save_as() is False
d.edited()
assert d.title == "*notes.txt - Editor"
d.saved()
assert d.path == "/home/ann/notes.txt", "saved() without a path keeps the current one"
assert d.title == "notes.txt - Editor"
d.edited()
d.opened("/tmp/other.md")
assert d.path == "/tmp/other.md" and d.modified is False and d.title == "other.md - Editor"
d2 = Document()
assert d2.path is None, "every document has its own state"`,
      checks: ['`name` uses the base name of the path, or `"untitled"`, and `title` adds the `*` prefix and the `" - Editor"` suffix', '`edited`, `opened` and `saved` update `modified` and `path` as described, and `saved()` without an argument keeps the path', '`needs_save_as()` is true exactly when no path has been set'],
      hint: 'Use `@property` for `name` and `title`, so that they are always computed from the current `path` and `modified`.',
      explanation: 'Every decision the window needs to make (what to show in the title bar, whether Save should open the Save As dialog) is answered by this object. The window’s `refresh` can then be a few lines that copy `document.title` into `root.title()`.',
    },
    {
      kind: 'code',
      prompt: 'Write `find_all(content, query, ignore_case=False)`. It returns a list of `"line.column"` strings, one for each place where `query` occurs, in order. Lines start at 1 and columns at 0. Matches must not overlap (after a match, continue after its end), and an empty query finds nothing. With `ignore_case=True` upper and lower case letters are treated as the same.',
      starter: `def find_all(content, query, ignore_case=False):
    ...
`,
      solution: `def find_all(content, query, ignore_case=False):
    if not query:
        return []
    if ignore_case:
        content, query = content.lower(), query.lower()
    found = []
    for number, line in enumerate(content.split("\\n"), start=1):
        start = line.find(query)
        while start != -1:
            found.append(f"{number}.{start}")
            start = line.find(query, start + len(query))
    return found
`,
      tests: `assert find_all("one two\\nthree two", "two") == ["1.4", "2.6"]
assert find_all("Tea tea TEA", "tea") == ["1.4"]
assert find_all("Tea tea TEA", "tea", ignore_case=True) == ["1.0", "1.4", "1.8"]
assert find_all("Tea tea TEA", "tea", True) == ["1.0", "1.4", "1.8"]
assert find_all("aaaa", "aa") == ["1.0", "1.2"], "matches must not overlap"
assert find_all("abab\\nab", "ab") == ["1.0", "1.2", "2.0"]
assert find_all("hello", "") == []
assert find_all("hello", "xyz") == []
assert find_all("", "a") == []
assert find_all("a\\n\\nb a", "a") == ["1.0", "3.2"]
assert find_all("x\\ny", "y\\n") == [], "a query is searched for within each line"`,
      checks: ['Searches each line separately and reports `"line.column"` with lines from 1 and columns from 0', 'After a match, searching continues after its end, so matches never overlap', 'Handles `ignore_case`, an empty query and text with no matches'],
      hint: 'Loop with `for number, line in enumerate(content.split("\\n"), start=1)`. Inside, `line.find(query, start + len(query))` continues after the previous match, and it returns `-1` when there are no more.',
      explanation: 'The Text widget’s own `search` method works the same way: it returns the next match as `"line.column"`, and you start the next search at the end of the last match. Having a version in plain Python lets you test the edge cases (overlaps, empty queries, empty text) in one place, and use it for a “3 matches” counter.',
    },
    {
      kind: 'code',
      prompt: 'Write `status_text(text)`, where `text` is a `tk.Text` widget. It returns the status line `"Ln 2, Col 5 | 7 words"`: the line and the column of the text cursor (`"insert"`), with the column counted from **1** for display, then the number of words in the text, split on white space, with the word spelled `"word"` when the count is exactly 1.',
      starter: `import tkinter as tk


def status_text(text):
    ...
`,
      solution: `import tkinter as tk


def status_text(text):
    line, col = text.index("insert").split(".")
    words = len(text.get("1.0", "end-1c").split())
    noun = "word" if words == 1 else "words"
    return f"Ln {line}, Col {int(col) + 1} | {words} {noun}"
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
text = tk.Text(root)
assert status_text(text) == "Ln 1, Col 1 | 0 words", status_text(text)
text.insert("1.0", "hello")
assert status_text(text) == "Ln 1, Col 6 | 1 word", status_text(text)
text.insert("end", " big world\\nsecond line here")
assert status_text(text) == "Ln 2, Col 17 | 6 words", status_text(text)
text.mark_set("insert", "2.4")
assert status_text(text) == "Ln 2, Col 5 | 6 words", status_text(text)
text.mark_set("insert", "1.0")
assert status_text(text) == "Ln 1, Col 1 | 6 words"
text.delete("1.0", "end")
text.insert("1.0", "   \\n  \\n")
assert status_text(text).endswith("| 0 words"), status_text(text)
text.delete("1.0", "end")
text.insert("1.0", "word")
assert status_text(text).endswith("| 1 word")
root.destroy()`,
      checks: ['Reads the cursor position with `text.index("insert")` and shows the column plus one', 'Counts words in `text.get("1.0", "end-1c")` using `split()`, so blank lines and extra spaces do not count', 'Uses `"word"` for exactly one, and `"words"` otherwise (including zero)'],
      hint: '`text.index("insert")` returns a string like `"2.4"`. Split it on the dot, and convert the column with `int()` before adding 1.',
      explanation: 'The status line combines two of the Text widget’s views of itself: the cursor position and the full content. Because the function takes the widget as an argument, the same function can serve the real editor’s `refresh`, and a test only needs a bare Text widget with a few characters in it.',
    },
  ],
  takeaways: [
    'An editor is mostly **plumbing** around the Text widget: layout, menus, file commands, and keeping the title and the status line truthful in one `refresh` method.',
    'Pack the fixed-size parts (status bar, scrollbar) first and the expanding Text last. Link a scrollbar both ways with `yscrollcommand` and `command=text.yview`.',
    'Text indexes are `"line.column"` strings: lines start at 1, columns at 0. Use `"end-1c"` to read the real content (`"end"` is after a hidden final newline), and `"insert"` for the cursor.',
    'Handle every dialog outcome: cancel gives an empty string or `None`; reading can raise `OSError` or `UnicodeDecodeError`; always specify `encoding="utf-8"`. Do not mark text as saved unless the write succeeded.',
    'Track unsaved work with `edit_modified()` and the `<<Modified>>` event, ask with `askyesnocancel` before discarding it, and route the close button through `root.protocol("WM_DELETE_WINDOW", ...)`.',
    'Bind shortcuts on the Text widget and return `"break"`, because its class bindings (Ctrl+O, Ctrl+F, Ctrl+N) run before the window’s.',
  ],
  reading: [
    { title: 'Python docs: tkinter', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'The module overview, with the widget classes and the dialog modules.' },
    { title: 'TkDocs: Text widget', url: 'https://tkdocs.com/tutorial/text.html', source: 'tutorial', note: 'Indexes, tags, undo and the other Text features, with examples in Python.' },
    { title: 'Tk manual: text', url: 'https://www.tcl-lang.org/man/tcl8.6/TkCmd/text.htm', source: 'docs', note: 'The complete reference for index forms, search, marks, tags and the undo stack.' },
    { title: 'Python docs: tkinter.filedialog', url: 'https://docs.python.org/3/library/dialog.html', source: 'docs', note: 'Open and save dialogs, and what they return when cancelled.' },
  ],
};
