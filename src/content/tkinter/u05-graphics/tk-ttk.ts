import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-ttk',
  title: 'Themed Widgets: ttk, Treeview, Notebook',
  summary: 'Use the modern ttk widgets: how they differ from the classic ones, the Combobox, Notebook and Progressbar, widget states, and the Treeview, tkinter’s table and tree, including sorting columns and reading the selected rows.',
  minutes: 36,
  objectives: [
    'Explain what `tkinter.ttk` adds, which classic widgets it replaces, and why `bg` and `fg` do not work on ttk widgets',
    'Build a form with `ttk.Combobox`, `ttk.Checkbutton`, `ttk.Notebook` and `ttk.Progressbar`',
    'Disable and enable ttk widgets with `state()` and `instate()`',
    'Show a table with `ttk.Treeview`: columns, headings, `insert`, `item`, `set`, `move` and `selection`',
    'Sort a table by a column, remembering that cell values can come back as strings',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'ttk: the modern widget set',
      blocks: [
        {
          type: 'p',
          text: 'The widgets in the first units (`tk.Button`, `tk.Label`, ...) are the original Tk set, which draws its own flat or 3D look on every platform. The [[ttk-widget|ttk]] module (“themed Tk”) adds a second set that **draws with the look of the operating system**, so buttons and scrollbars look native on Windows, macOS and Linux. It also adds widgets that did not exist before: **Combobox**, **Notebook**, **Treeview**, **Progressbar**, **Separator** and **Panedwindow**.',
        },
        {
          type: 'p',
          text: 'Import it with `from tkinter import ttk` and write `ttk.Button(...)`, `ttk.Label(...)`. Do not use `from tkinter.ttk import *`: it silently replaces `Button`, `Label` and friends with the ttk versions, and mixing the two sets is a common source of confusing bugs. The main habit changes are that **appearance moves to styles** (a `ttk.Button` or `ttk.Frame` has no `bg`, `fg` or `font` options, see the next lesson; only text widgets such as `ttk.Label` and `ttk.Entry` keep `font` and `foreground`) and that **state is managed with methods**.',
        },
        {
          type: 'code',
          title: 'settings_form.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Settings")
root.geometry("360x260")

notebook = ttk.Notebook(root)
notebook.pack(fill="both", expand=True, padx=10, pady=10)

general = ttk.Frame(notebook, padding=15)
advanced = ttk.Frame(notebook, padding=15)
notebook.add(general, text="General")
notebook.add(advanced, text="Advanced")

ttk.Label(general, text="Language:").grid(row=0, column=0, sticky="w", pady=4)
language = ttk.Combobox(general, values=["English", "Spanish", "German"], state="readonly")
language.current(0)
language.grid(row=0, column=1, sticky="ew", pady=4)
dark = tk.BooleanVar(value=True)
ttk.Checkbutton(general, text="Dark mode", variable=dark).grid(row=1, column=0, columnspan=2, sticky="w", pady=4)
general.columnconfigure(1, weight=1)

bar = ttk.Progressbar(advanced, mode="determinate", maximum=100)
bar.pack(fill="x", pady=10)


def run():
    advance(0)


def advance(value):
    bar["value"] = value
    if value < 100:
        root.after(200, advance, value + 10)


ttk.Button(advanced, text="Run", command=run).pack()
language.bind("<<ComboboxSelected>>", lambda event: root.title(f"Settings - {language.get()}"))
root.mainloop()`,
          annotations: [
            { lines: '8-14', text: 'A `Notebook` shows one page at a time. Each page is an ordinary `ttk.Frame` (with `padding`, which the classic Frame lacks) added with a tab title.' },
            { lines: '17-19', text: 'A readonly `Combobox`: the user can only choose one of `values`. `current(0)` selects the first one, `get()` reads the current text.' },
            { lines: '21-22', text: 'ttk widgets are laid out with the same `pack`, `grid` and `place` managers as before, and a `ttk.Checkbutton` uses a `BooleanVar` exactly like the classic one.' },
            { lines: '24-25', text: 'A determinate `Progressbar` fills up to `maximum`. Assign `bar["value"]` for an exact position (or use `step(n)` to add to it).' },
            { lines: '32-35', text: 'Progress driven by an `after` chain: each call sets the value and schedules the next one 200 ms later, so the window keeps responding.' },
            { lines: 39, text: '`<<ComboboxSelected>>` is a **virtual event**: it fires when the user picks an entry from the list, and is bound like any other event.' },
          ],
        },
        {
          type: 'table',
          headers: ['Classic (`tk`)', 'Themed (`ttk`)', 'What changes'],
          rows: [
            ['`tk.Button`, `tk.Label`, `tk.Entry`', '`ttk.Button`, `ttk.Label`, `ttk.Entry`', '`ttk.Button` has no `bg`, `fg`, `font` options: use a `style`. `ttk.Label` and `ttk.Entry` still accept `font` and `foreground` (the Label also `background`). `command` and `textvariable` work as before'],
            ['`tk.Frame`, `tk.LabelFrame`', '`ttk.Frame`, `ttk.Labelframe`', '`padding` option; background follows the theme'],
            ['`tk.Checkbutton`, `tk.Radiobutton`', '`ttk.Checkbutton`, `ttk.Radiobutton`', 'Same `variable`, `value`, `onvalue`; look follows the theme'],
            ['`tk.Scale`, `tk.Scrollbar`, `tk.Spinbox`', '`ttk.Scale`, `ttk.Scrollbar`, `ttk.Spinbox`', '`ttk.Scale` has no `resolution` and no label; its `get()` returns a float'],
            ['(none)', '`ttk.Combobox`, `ttk.Notebook`, `ttk.Treeview`, `ttk.Progressbar`, `ttk.Separator`, `ttk.Panedwindow`', 'New widgets with no classic equivalent'],
            ['`tk.Canvas`, `tk.Text`, `tk.Listbox`, `tk.Menu`', '(no ttk version)', 'Still used from `tk`; `ttk.Treeview` can replace a Listbox when you need columns'],
          ],
          caption: 'Which widgets exist in both sets. Mixing them in one window is fine.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why styles instead of bg and fg?',
          text: 'A classic widget carries its own colors, so one wrongly colored label stands out. A ttk widget asks its **theme** how to draw itself, which lets the operating system look be applied to the whole program, and lets you change one style (all `TButton`s, say) in one place instead of repeating options on every widget. The price is that a single widget cannot simply be given `bg="red"`: you create a named style for it.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What happens with `ttk.Button(root, text="OK", bg="red")`?',
      options: [
        { text: 'A `TclError: unknown option "-bg"`, because ttk widgets take their colors from a style, not from widget options', correct: true, why: 'ttk widgets deliberately do not accept `bg`, `fg`, `font` or `relief`. Create a `ttk.Style` and pass `style="..."` to the widget.' },
        { text: 'The button is red, just like with `tk.Button`', why: 'That is the classic widget. The themed button does not have a `bg` option.' },
        { text: 'The option is silently ignored', why: 'Unknown options are reported as errors by Tk, so the program stops at that line.' },
        { text: 'The background of the whole window turns red', why: '`bg` would never affect the window; the widget would only refuse it.' },
      ],
      explanation: 'This error is what most people first meet when they convert a program to ttk. The fix is a style (covered in the next lesson); the quick alternative is to keep the classic `tk.Button` for that one widget.',
    },
    {
      kind: 'truefalse',
      prompt: 'After `from tkinter.ttk import *` placed below `from tkinter import *`, the name `Button` refers to the classic tkinter button.',
      answer: false,
      explanation: 'False. The later star import **replaces** the earlier names, so `Button`, `Label`, `Entry` and others become the ttk versions, and options like `bg` suddenly fail. Import the module (`from tkinter import ttk`) and write `ttk.Button` so that it is always obvious which set is used.',
    },
    {
      kind: 'concept',
      title: 'Treeview: tables and trees',
      blocks: [
        {
          type: 'p',
          text: 'The [[treeview-widget|Treeview]] shows rows of data. With `show="headings"` it is a **table**: named columns with clickable headings, and one row per item. Without it, the first column is a tree of expandable parents and children, such as a file browser. Every row is an item identified by a **string id** (like `"I001"`, or one that you choose with `iid=`), and almost every method takes that id.',
        },
        {
          type: 'table',
          headers: ['Call', 'What it does'],
          rows: [
            ['`ttk.Treeview(parent, columns=("a", "b"), show="headings")`', 'Create a table with columns named `a` and `b`'],
            ['`tree.heading("a", text="Name", command=...)`', 'Set a column title and what happens when it is clicked'],
            ['`tree.column("a", width=120, anchor="e", stretch=False)`', 'Column width, alignment and resizing'],
            ['`tree.insert("", "end", values=(...))`', 'Add a row at the end (`""` is the root; use another item id to nest). **Returns the new item id**'],
            ['`tree.item(iid, "values")`, `tree.set(iid, "a")`', 'Read the whole row, or one cell, as a tuple of values or a string'],
            ['`tree.item(iid, values=(...))`, `tree.set(iid, "a", v)`', 'Change the row, or one cell'],
            ['`tree.get_children()`', 'Tuple of the ids of the rows, in display order'],
            ['`tree.move(iid, "", index)`', 'Reposition a row (used to sort: Treeview has no built-in sort)'],
            ['`tree.delete(iid)`, `tree.delete(*tree.get_children())`', 'Remove one row, or empty the whole table'],
            ['`tree.selection()`, `tree.selection_set(iid)`', 'The selected row ids (a tuple, empty if none), and selecting by code'],
            ['`tree.bind("<<TreeviewSelect>>", handler)`', 'Run when the selection changes'],
          ],
          caption: 'The Treeview toolbox for tables.',
        },
        {
          type: 'code',
          title: 'people_table.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk

people = [("Ada", 36, "London"), ("Linus", 55, "Portland"), ("Grace", 85, "New York"), ("Guido", 70, "Haarlem")]
root = tk.Tk()
root.title("People")
frame = ttk.Frame(root, padding=10)
frame.pack(fill="both", expand=True)
columns = ("name", "age", "city")
tree = ttk.Treeview(frame, columns=columns, show="headings", selectmode="browse")
for name in columns:
    tree.heading(name, text=name.title(), command=lambda col=name: sort_by(col))
tree.column("name", width=140)
tree.column("age", width=60, anchor="e")
tree.column("city", width=140)
scroll = ttk.Scrollbar(frame, orient="vertical", command=tree.yview)
tree.configure(yscrollcommand=scroll.set)
tree.grid(row=0, column=0, sticky="nsew")
scroll.grid(row=0, column=1, sticky="ns")
frame.rowconfigure(0, weight=1)
frame.columnconfigure(0, weight=1)
for person in people:
    tree.insert("", "end", values=person)
status = ttk.Label(frame, text="Select a row")
status.grid(row=1, column=0, columnspan=2, sticky="w", pady=(8, 0))
descending = {}


def sort_by(column):
    rows = [(tree.set(item, column), item) for item in tree.get_children()]
    numeric = all(value.isdigit() for value, _ in rows)
    rows.sort(key=lambda r: int(r[0]) if numeric else r[0].lower(), reverse=descending.get(column, False))
    for index, (_, item) in enumerate(rows):
        tree.move(item, "", index)
    descending[column] = not descending.get(column, False)


def on_select(event):
    selection = tree.selection()
    if selection:
        name, age, city = tree.item(selection[0], "values")
        status.config(text=f"{name} is {age} and lives in {city}")


tree.bind("<<TreeviewSelect>>", on_select)
root.mainloop()`,
          annotations: [
            { lines: '11-12', text: 'One `heading` call per column. The `lambda col=name:` default argument freezes the current column name for each heading (a plain `lambda: sort_by(name)` would use the last name for all of them).' },
            { lines: '13-15', text: 'Width and alignment of each column. Numbers look better right-aligned (`anchor="e"`).' },
            { lines: '16-21', text: 'A Treeview scrolls only when it is connected to a scrollbar in both directions: `command=tree.yview` for the bar and `yscrollcommand=scroll.set` for the tree. Row 0 and column 0 get the weight so that the table grows with the window.' },
            { lines: '22-23', text: 'Each person tuple becomes one row. The values go into the columns in order.' },
            { lines: '30-34', text: 'Sorting by hand: read each cell with `tree.set(item, column)` (always **text**), sort, and then `move` every row to its new index. The numeric test avoids sorting `"100"` before `"7"`.' },
            { lines: '39-42', text: '`selection()` returns a tuple of item ids, so `[0]` is the first selected row. `item(iid, "values")` gives back its values.' },
          ],
        },
        {
          type: 'p',
          text: 'One trap deserves its own example. Cell values are stored by Tcl, which knows nothing about Python types, so they usually come back as **strings** (and sometimes as numbers, depending on how they went in). Whatever you read from a Treeview, convert it yourself: `int(tree.set(item, "age"))`. A plain string sort of numbers gives the wrong order:',
        },
        {
          type: 'code',
          title: 'sort_text_vs_number.py',
          runnable: true,
          code: `rows = [("Ann", "30"), ("Bob", "7"), ("Cy", "100")]
by_text = sorted(rows, key=lambda r: r[1])
by_number = sorted(rows, key=lambda r: int(r[1]))
print([r[0] for r in by_text])
print([r[0] for r in by_number])`,
          output: `['Cy', 'Ann', 'Bob']
['Bob', 'Ann', 'Cy']`,
          annotations: [
            { lines: 2, text: 'Text order compares character by character: `"100"` < `"30"` < `"7"`, because `"1"` comes before `"3"` and `"7"`.' },
            { lines: 3, text: 'Converting with `int` before comparing gives the order that a person expects: 7, 30, 100.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the lines that import ttk and add a row to a table.',
      template: `from tkinter import ___
row = tree.___("", "end", values=("Ann", 30))`,
      templateIsCode: true,
      blanks: [{ answers: ['ttk'] }, { answers: ['insert'] }],
      wordBank: ['ttk', 'insert', 'item', 'set', 'messagebox'],
      explanation: '`ttk` is a **module** inside tkinter, so it is imported with `from tkinter import ttk`. `tree.insert(parent, index, values=...)` adds a row (the parent `""` is the root and `"end"` appends) and returns its item id.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This models how a ttk widget keeps its **state flags** (`state(["disabled"])` adds one, `state(["!disabled"])` removes it).',
      code: `flags = {"disabled"}
flags.add("focus")
flags.discard("disabled")
print(sorted(flags))`,
      answer: "['focus']",
      hint: 'A set of flag names: add `focus`, then remove `disabled`.',
      explanation: 'ttk widgets have a set of state flags (`disabled`, `focus`, `pressed`, `readonly`, `selected`, ...). `widget.state(["disabled"])` adds a flag, `widget.state(["!disabled"])` removes it, and `widget.instate(["disabled"])` tests it. Here only `focus` is left.',
    },
    {
      kind: 'concept',
      title: 'States, Combobox values and Progressbar',
      blocks: [
        {
          type: 'p',
          text: 'The classic widgets have a `state="disabled"` option. ttk widgets still accept it in the constructor, but the normal way to change it later is with **`state()` and `instate()`**: `button.state(["disabled"])` greys the button out, `button.state(["!disabled"])` re-enables it (the `!` means “not”), and `button.instate(["disabled"])` returns `True` or `False`. A disabled ttk button ignores `invoke()` and clicks.',
        },
        {
          type: 'table',
          headers: ['Widget', 'Key calls', 'Notes'],
          rows: [
            ['`ttk.Combobox`', '`values=[...]`, `get()`, `set(text)`, `current()`, `current(i)`', '`current()` returns the index of the selected value, or `-1` if the text is not in `values`. `state="readonly"` forbids typing'],
            ['`ttk.Notebook`', '`add(frame, text=...)`, `select()`, `select(i)`, `tab(i, "text")`, `tabs()`', '`select()` returns the id of the shown page. `index("current")` gives its position'],
            ['`ttk.Progressbar`', '`value`, `maximum`, `step(n)`, `start()`, `stop()`, `mode="indeterminate"`', '`step` wraps around to 0 when the value reaches `maximum`. Use `indeterminate` mode when you do not know how long it takes'],
            ['`ttk.Separator`, `ttk.Panedwindow`', '`orient="horizontal"`; `add(frame, weight=1)`', 'A dividing line, and a container with draggable dividers'],
          ],
          caption: 'The new ttk widgets and the calls you will use most.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Combobox values are text',
          text: '`get()` always returns a **string**, even if every value looks like a number, and `cb["values"]` returns the values as strings too. Convert with `int(cb.get())` when you need a number, and remember that `current()` gives the **index** (position), not the value.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `_tkinter.TclError: unknown option "-bg"`. Tap the line that raises it.',
      lines: [
        'root = tk.Tk()',
        'frame = ttk.Frame(root)',
        'button = ttk.Button(frame, text="OK", bg="red")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`ttk.Button` has no `bg` option. Color a ttk widget with a style (`ttk.Style().configure("Red.TButton", background="red")` and `style="Red.TButton"`), or use `tk.Button` when you really need a one-off colored button.',
    },
    {
      kind: 'numeric',
      prompt: 'A `ttk.Progressbar` has `maximum=100` and starts at 0. `bar.step(30)` is called four times. What is `bar["value"]` afterwards?',
      answer: '20',
      hint: 'The value wraps around to 0 when it reaches or passes the maximum.',
      explanation: '30, 60, 90, and then 120, which passes the maximum of 100 and wraps around to 120 mod 100 = 20. If you want a bar that stops at 100, set `bar["value"]` yourself and check the limit, as in the progress example.',
      label: 'Value:',
    },
    {
      kind: 'concept',
      title: 'Your turn: tables',
      blocks: [
        {
          type: 'p',
          text: 'The exercises work on a `ttk.Treeview` stand-in with the same item ids, `insert`, `set`, `move`, `get_children` and `selection` behaviour as the real widget. Because values may come back as strings, compare cells with `str(...)`, and when sorting numbers convert them yourself.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `fill_table(tree, rows)`. First remove every row that the table already has, then insert each tuple of `rows` as a new row at the end (`values=row`). Return the list of the new item ids, in order.',
      starter: `import tkinter as tk
from tkinter import ttk


def fill_table(tree, rows):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


def fill_table(tree, rows):
    tree.delete(*tree.get_children())
    ids = []
    for row in rows:
        ids.append(tree.insert("", "end", values=row))
    return ids
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
tree = ttk.Treeview(root, columns=("name", "qty"), show="headings")
ids = fill_table(tree, [("Ann", 3), ("Bob", 12)])
assert len(ids) == 2 and tree.get_children() == tuple(ids)
assert [tuple(str(v) for v in tree.item(i, "values")) for i in ids] == [("Ann", "3"), ("Bob", "12")]
assert tree.set(ids[1], "name") == "Bob"
new_ids = fill_table(tree, [("Cy", 7)])
assert len(new_ids) == 1 and tree.get_children() == tuple(new_ids), "old rows must be removed first"
assert tree.set(new_ids[0], "qty") == "7"
assert fill_table(tree, []) == [] and tree.get_children() == ()`,
      checks: ['Deletes all existing rows first with `tree.delete(*tree.get_children())`', 'Inserts every row with `tree.insert("", "end", values=row)` and collects the returned ids', 'Returns the ids in the same order as `rows` (an empty list for no rows)'],
      hint: 'Start with `tree.delete(*tree.get_children())`. Then loop over `rows`, and append the value that `tree.insert(...)` returns to a list.',
      explanation: 'Reloading a table (after a search or an edit) is always “clear, then insert”. `delete(*children)` unpacks the tuple of ids into separate arguments, and works fine when the table is empty.',
    },
    {
      kind: 'code',
      prompt: 'Write `sort_by(tree, column, numeric=False, reverse=False)`. Read each row’s cell for `column` with `tree.set(item, column)`. Sort the rows by that cell: as a **number** (`float`) when `numeric` is true, otherwise as **text ignoring case** (`.lower()`); the order is reversed when `reverse` is true. Then put every row in its new position with `tree.move(item, "", index)`.',
      starter: `import tkinter as tk
from tkinter import ttk


def sort_by(tree, column, numeric=False, reverse=False):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


def sort_by(tree, column, numeric=False, reverse=False):
    def key(item):
        value = str(tree.set(item, column))
        return float(value) if numeric else value.lower()

    items = sorted(tree.get_children(), key=key, reverse=reverse)
    for index, item in enumerate(items):
        tree.move(item, "", index)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
tree = ttk.Treeview(root, columns=("name", "qty"), show="headings")
rows = [("pear", "10"), ("Apple", "2"), ("fig", "33"), ("banana", "5")]
ids = [tree.insert("", "end", values=r) for r in rows]


def names():
    return [tree.set(i, "name") for i in tree.get_children()]


sort_by(tree, "qty", numeric=True)
assert names() == ["Apple", "banana", "pear", "fig"], names()
sort_by(tree, "qty", numeric=True, reverse=True)
assert names() == ["fig", "pear", "banana", "Apple"], names()
sort_by(tree, "name")
assert names() == ["Apple", "banana", "fig", "pear"], names()
sort_by(tree, "qty")
assert names() == ["pear", "Apple", "fig", "banana"], "text order: 10 < 2 < 33 < 5"
sort_by(tree, "name", reverse=True)
assert names() == ["pear", "fig", "banana", "Apple"], names()
assert len(tree.get_children()) == 4 and set(tree.get_children()) == set(ids), "no row may be lost or duplicated"`,
      checks: ['Reads cells with `tree.set(item, column)` and converts them to `float` only when `numeric` is true', 'Text sorting ignores case (`.lower()`), and `reverse` flips the order', 'Repositions every row with `tree.move(item, "", index)`, so the same items are kept'],
      hint: 'Sort `tree.get_children()` with a `key` function that reads `tree.set(item, column)`. Then `for index, item in enumerate(sorted_items): tree.move(item, "", index)`.',
      explanation: 'The Treeview has no sort method: you compute the order in Python and then move the rows. Moving (rather than deleting and re-inserting) keeps the item ids, so the selection and any stored ids stay valid. Sorting “10” before “2” as text is exactly the bug the `numeric` flag prevents.',
    },
    {
      kind: 'code',
      prompt: 'Write `selected_names(tree)`. Return the `"name"` column text of the **selected** rows, as a list, in the order the rows appear in the table (not in selection order). Return an empty list when nothing is selected.',
      starter: `import tkinter as tk
from tkinter import ttk


def selected_names(tree):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


def selected_names(tree):
    chosen = set(tree.selection())
    return [str(tree.set(item, "name")) for item in tree.get_children() if item in chosen]
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
tree = ttk.Treeview(root, columns=("name", "qty"), show="headings", selectmode="extended")
ids = [tree.insert("", "end", values=(n, q)) for n, q in [("Ann", 3), ("Bob", 5), ("Cy", 7), ("Di", 9)]]
assert selected_names(tree) == []
tree.selection_set(ids[2])
assert selected_names(tree) == ["Cy"]
tree.selection_set((ids[3], ids[0]))
assert selected_names(tree) == ["Ann", "Di"], selected_names(tree)
tree.selection_add(ids[1])
assert selected_names(tree) == ["Ann", "Bob", "Di"]
tree.selection_remove(ids[0], ids[1], ids[3])
assert selected_names(tree) == []
tree.move(ids[2], "", 0)
tree.selection_set(ids[2])
assert selected_names(tree) == ["Cy"]`,
      checks: ['Uses `tree.selection()` (a tuple of item ids) to know which rows are selected', 'Reads the `"name"` cell of each selected row with `tree.set(item, "name")`', 'Keeps the **table order** by walking `tree.get_children()`, and returns `[]` for no selection'],
      hint: 'Make `chosen = set(tree.selection())`, then go through `tree.get_children()` and keep the names of the items that are in `chosen`.',
      explanation: 'A selection is a set of **item ids**, not row numbers, so it stays correct after sorting or inserting. Walking `get_children()` and testing membership gives the visible order, which is the order users expect in a list of results.',
    },
  ],
  takeaways: [
    '`from tkinter import ttk` gives themed widgets that match the operating system. They are styled with a `style` (a Button or Frame has no `bg`, `fg`, `font`), and the new widgets (Combobox, Notebook, Treeview, Progressbar) exist only here. Never star-import both sets.',
    '`Combobox`: `values`, `get()` (always a string), `current()` (an index, or `-1`), `state="readonly"`, and the `<<ComboboxSelected>>` event. `Notebook`: `add(frame, text=...)`, `select()`. `Progressbar`: `value`, `maximum`, and `step` wraps around.',
    'Enable and disable ttk widgets with `state(["disabled"])`, `state(["!disabled"])` and `instate(["disabled"])`. A disabled widget ignores clicks and `invoke()`.',
    'A `Treeview` row is an **item with a string id**. `insert` returns the id, `set(item, column)` and `item(item, "values")` read it, `move` repositions it, and `selection()` returns the **ids** of the selected rows. There is no built-in sort: compute the order and `move` the rows.',
    'Cell values come back as **text** (sometimes numbers). Convert them yourself with `int(...)` or `float(...)` before comparing or calculating, otherwise `"100"` sorts before `"7"`.',
  ],
  reading: [
    { title: 'TkDocs: Treeview', url: 'https://tkdocs.com/tutorial/tree.html', source: 'tutorial', note: 'Tables and trees, columns and headings, selection events, and styling rows with tags.' },
    { title: 'TkDocs: Combobox, Notebook and Progressbar', url: 'https://tkdocs.com/tutorial/widgets.html', source: 'tutorial', note: 'The common ttk widgets with short examples.' },
    { title: 'Python docs: tkinter.ttk', url: 'https://docs.python.org/3/library/tkinter.ttk.html', source: 'docs', note: 'Every ttk widget, its options and methods, and the Treeview API in detail.' },
    { title: 'Tk manual: ttk widgets', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/ttk_widget.htm', source: 'docs', note: 'Common options and the state flag system shared by all themed widgets.' },
  ],
};
