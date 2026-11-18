import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-grid',
  title: 'grid: Rows, Columns and Resizing',
  summary: 'Lay widgets out in a table with grid: rows, columns, spans, sticky alignment and padding, then make the layout respond to window resizing with column and row weights. Includes the standard form recipe and the mistakes that leave a grid frozen at its natural size.',
  minutes: 32,
  objectives: [
    'Place widgets with `grid(row=, column=)` and span cells with `rowspan` and `columnspan`',
    'Use `sticky` to align a widget in its cell or stretch it to fill the cell',
    'Make columns and rows grow with the window using `columnconfigure` and `rowconfigure` weights',
    'Predict how extra space is shared between columns of different weights',
    'Build a resizable form and a button grid, and recognise the classic grid errors',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A table for your widgets',
      blocks: [
        {
          type: 'p',
          text: '**grid** places each widget in a cell of an invisible table. You give it a `row` and a `column` (both counted from **0**), and tkinter sizes every column to the widest widget in it and every row to the tallest. That is exactly what forms, calculators, dialogs and any layout with aligned columns need, and is the geometry manager most programs end up using.',
        },
        {
          type: 'code',
          title: 'form.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Contact form")

fields = ("Name", "Email", "City")
entries = {}
for row, name in enumerate(fields):
    tk.Label(root, text=name + ":").grid(row=row, column=0, sticky="e", padx=5, pady=3)
    entry = tk.Entry(root, width=28)
    entry.grid(row=row, column=1, sticky="ew", padx=5, pady=3)
    entries[name] = entry

tk.Label(root, text="Notes:").grid(row=3, column=0, sticky="ne", padx=5, pady=3)
notes = tk.Text(root, width=28, height=4)
notes.grid(row=3, column=1, sticky="nsew", padx=5, pady=3)

tk.Button(root, text="Send").grid(row=4, column=0, columnspan=2, pady=10)

root.columnconfigure(1, weight=1)
root.rowconfigure(3, weight=1)
root.mainloop()`,
          annotations: [
            { lines: 8, text: 'A loop builds one row per field: a label in column 0 and an entry in column 1. `enumerate` supplies the row number.' },
            { lines: 9, text: '`sticky="e"` pushes the label against the **east** (right) edge of its cell, so the label text lines up next to its entry.' },
            { lines: 11, text: '`sticky="ew"` stretches the entry from the east edge to the west edge of its cell: it fills the column width.' },
            { lines: '14-16', text: '`"ne"` aligns the label to the top-right (next to the first line of the Text), and `"nsew"` makes the Text fill its whole cell in both directions.' },
            { lines: 18, text: '`columnspan=2` lets the button use both columns. Without `sticky` it stays centered in the spanned area.' },
            { lines: '20-21', text: 'Weights tell the grid which column and row **grow** when the window is resized. Without them the layout keeps its natural size.' },
          ],
        },
        {
          type: 'table',
          headers: ['Option', 'Meaning'],
          rows: [
            ['`row`, `column`', 'Cell position, starting at `0`. If you omit `row`, the widget goes in the next free row'],
            ['`rowspan`, `columnspan`', 'How many rows or columns the widget occupies (default `1`)'],
            ['`sticky`', 'Which edges of the cell the widget touches: any of `"n"`, `"s"`, `"e"`, `"w"`. Default: centered, natural size'],
            ['`padx`, `pady`', 'Empty space around the widget, inside its cell'],
            ['`ipadx`, `ipady`', 'Extra space inside the widget'],
          ],
          caption: 'The grid options. Empty rows and columns take no space at all, so you may leave gaps in the numbering.',
        },
        {
          type: 'table',
          headers: ['sticky', 'Effect in its cell'],
          rows: [
            ['(none)', 'Centered, at its natural size'],
            ['`"w"`', 'Left edge (west), natural size'],
            ['`"e"`', 'Right edge (east): good for labels beside entries'],
            ['`"ew"`', 'Stretched horizontally across the cell'],
            ['`"ns"`', 'Stretched vertically'],
            ['`"nsew"`', 'Fills the whole cell in both directions'],
            ['`"nw"`', 'Top-left corner, natural size'],
          ],
          caption: 'sticky is a compass: the letters name the edges the widget is “glued” to. Glue it to two opposite edges and it stretches between them.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which `sticky` value makes an Entry widen when its column gets wider?',
      options: [
        { text: '`"ew"`', correct: true, why: 'Glued to both the east and the west edge of the cell, the entry has to stretch whenever the cell grows horizontally.' },
        { text: '`"n"`', why: '`"n"` anchors the widget to the top edge only. Nothing makes it wider.' },
        { text: '`"e"`', why: 'A single edge only **aligns** the widget at that side (here, the right) and keeps its natural width.' },
        { text: '`"center"`', why: 'That is not a legal value. `sticky` only accepts the letters n, s, e and w, and tkinter raises `TclError` for anything else.' },
      ],
      explanation: 'Two opposite sides = stretch. Use `"ew"` for entries, `"ns"` for vertical elements like scrollbars, and `"nsew"` for areas that should fill their cell, such as a Text or Canvas.',
    },
    {
      kind: 'concept',
      title: 'Resizing: weights decide who grows',
      blocks: [
        {
          type: 'p',
          text: 'By default a grid never grows. If the user enlarges the window, the extra space just appears around the table. To make columns or rows grow, give them a **weight**: `container.columnconfigure(index, weight=n)` and `container.rowconfigure(index, weight=n)`. When there is spare space, it is divided between the columns **in proportion to their weights**, and a column with weight `0` (the default) stays at its natural width. A `sticky` option on the widget then decides whether the widget fills the larger cell.',
        },
        {
          type: 'code',
          title: 'weights_model.py',
          runnable: true,
          code: `def column_widths(window_width, natural, weights):
    """How grid shares extra width: in proportion to the column weights."""
    extra = window_width - sum(natural)
    total = sum(weights)
    if extra <= 0 or total == 0:
        return list(natural)
    return [n + extra * w // total for n, w in zip(natural, weights)]


natural = [80, 120, 60]
print("window  no weights        weights 1, 2, 0")
for window in (260, 410, 560):
    plain = column_widths(window, natural, [0, 0, 0])
    shared = column_widths(window, natural, [1, 2, 0])
    print(f"{window:6}  {str(plain):17} {shared}")`,
          output: `window  no weights        weights 1, 2, 0
   260  [80, 120, 60]     [80, 120, 60]
   410  [80, 120, 60]     [130, 220, 60]
   560  [80, 120, 60]     [180, 320, 60]`,
          annotations: [
            { lines: 3, text: 'Extra space is whatever the window has beyond the columns’ combined natural widths. At 260 pixels there is none.' },
            { lines: '5-6', text: 'No weights anywhere, or no spare space: every column keeps its natural width. This is why an unconfigured grid never stretches.' },
            { lines: 7, text: 'Each column receives `extra * weight / total_weight`. Column 1 (weight 2) gets twice as much as column 0 (weight 1), and column 2 (weight 0) stays the same. Real Tk works in whole pixels and also respects `minsize`.' },
          ],
        },
        {
          type: 'p',
          text: 'The usual recipe for a resizable window is therefore **three steps**: give the growing columns and rows a weight (`weight=1` is enough), set `sticky` on the widgets that should fill their cell, and remember to configure the right container. A frame’s grid is configured on **that frame**, not on the window around it.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Weight on the wrong container',
          text: 'The most common reason a grid refuses to resize is that `columnconfigure` was called on `root` while the widgets live in a Frame (or the other way round). Weights belong to the container whose children you grid. If a Frame is itself packed or gridded in the window, it needs its own `fill`/`expand` or weight and `sticky` so that **it** grows as well.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Equal columns with uniform',
          text: 'To make several columns exactly the same width regardless of their content, give them the same `uniform` group: `root.columnconfigure(0, weight=1, uniform="cols")` and the same for the other columns. Use `minsize=` to stop a column from shrinking below a width.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you place widgets in rows 0 and 5 of a grid and nothing in rows 1 to 4, the grid leaves four blank rows of space between them.',
      answer: false,
      explanation: 'False. Rows and columns that contain no widgets take **no space** at all (unless you give them a `minsize` or `pad`). Row numbers only decide the order, so gaps in the numbering are harmless.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the lines that make column 1 take all the extra width when the window grows.',
      template: `root.___(1, ___=1)`,
      templateIsCode: true,
      blanks: [{ answers: ['columnconfigure', 'grid_columnconfigure'] }, { answers: ['weight'] }],
      wordBank: ['columnconfigure', 'weight', 'rowconfigure', 'sticky', 'columnspan'],
      explanation: '`columnconfigure(index, weight=...)` sets a column’s share of extra space. (`rowconfigure` does the same for rows, and `sticky` is an option of the widget, not of the container.)',
    },
    {
      kind: 'concept',
      title: 'Spans, frames and the pack-grid mix',
      blocks: [
        {
          type: 'p',
          text: 'Widgets can cover several cells: `columnspan=3` takes three columns in a row, and `rowspan=2` takes two rows. Combine this with a **Frame** to build complicated windows from simple parts: a Frame is a widget like any other, so you can grid or pack it in the window and then use a different manager **inside** it. Each container uses one manager; the containers can differ.',
        },
        {
          type: 'code',
          title: 'calculator_layout.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Calculator layout")

display = tk.Label(root, text="0", anchor="e", bg="white", font=("Consolas", 20))
display.grid(row=0, column=0, columnspan=4, sticky="ew", padx=5, pady=5)

keys = [
    "7", "8", "9", "/",
    "4", "5", "6", "*",
    "1", "2", "3", "-",
    "0", ".", "=", "+",
]
for i, key in enumerate(keys):
    r, c = divmod(i, 4)
    tk.Button(root, text=key, width=4).grid(row=r + 1, column=c, sticky="nsew", padx=2, pady=2)

for c in range(4):
    root.columnconfigure(c, weight=1)
for r in range(1, 5):
    root.rowconfigure(r, weight=1)
root.mainloop()`,
          annotations: [
            { lines: '6-7', text: 'The display spans all four columns (`columnspan=4`) and stretches across them (`sticky="ew"`).' },
            { lines: '9-14', text: 'The keys are plain data. A layout described as data (a list of labels) is shorter and easier to change than sixteen separate `grid` calls.' },
            { lines: '15-17', text: '`divmod(i, 4)` turns a running index into `(row, column)`. Row `r + 1` leaves row 0 for the display.' },
            { lines: '19-22', text: 'Every key column and row gets weight `1`, so the buttons share spare space equally, and `sticky="nsew"` makes each button fill its cell. The display row (row 0) keeps its natural height.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is grid usually better than pack for complex windows?',
          text: 'With grid you state **where** each widget goes, so the code mirrors the picture and changing one widget does not disturb the others. With pack the position of a widget depends on the order of every call before it. Use pack for simple one-direction rows and columns (toolbars, stacks of buttons), grid for anything with aligned columns, and combine them with Frames.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This shares 80 pixels of spare width between three columns with weights 1, 0 and 3.',
      code: `base = [100, 200, 50]
weights = [1, 0, 3]
extra = 80
total = sum(weights)
final = [b + extra * w // total for b, w in zip(base, weights)]
print(final)`,
      answer: '[120, 200, 110]',
      hint: 'The shares are extra * weight / total_weight, with total_weight 4.',
      explanation: 'Column 0 gets 80 * 1 / 4 = 20, column 1 gets nothing (weight 0) and column 2 gets 80 * 3 / 4 = 60, giving `[120, 200, 110]`. A weight-0 column never grows.',
    },
    {
      kind: 'error',
      prompt: 'Running this code raises `_tkinter.TclError: bad stickyness value "center": must be a string containing n, e, s, and/or w`. Tap the line that raises it.',
      lines: [
        'tk.Label(root, text="Name").grid(row=0, column=0)',
        'entry = tk.Entry(root)',
        'entry.grid(row=0, column=1, sticky="center")',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`sticky` is a compass: only the letters `n`, `s`, `e`, `w` (and combinations) are allowed. To center a widget, omit `sticky`; to stretch it across the cell, use `"ew"` or `"nsew"`.',
    },
    {
      kind: 'numeric',
      prompt: 'A window is 600 pixels wide. Its grid has two columns with natural widths 100 and 200 and weights 1 and 2. How many pixels wide is column 1 once the window is 600 pixels wide?',
      answer: '400',
      hint: 'Spare width = 600 - (100 + 200). Column 1 receives 2/3 of it, on top of its natural width.',
      explanation: 'The spare width is 600 - 300 = 300 pixels. With weights 1 and 2, column 1 receives 2/3 of it, 200 pixels, so it ends up 200 + 200 = 400 pixels wide (and column 0 grows to 200).',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: forms and button grids',
      blocks: [
        {
          type: 'p',
          text: 'The in-app exercises use the stand-in, which records the grid options of every widget without drawing it. You check your layout with `grid_info()` (row, column, sticky, spans), the container’s `columnconfigure()` weights and `grid_size()`, all of which are real tkinter methods that work the same way in a desktop program. One detail: Tk stores the sticky letters in the order n, e, s, w, so `sticky="nsew"` is reported back as `"nesw"`. Compare it as a set of letters, not as a string.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `build_form(parent, names)`. For each name (row 0, 1, 2 …) put a `Label` with the text `name + ":"` in column 0 (`sticky="e"`) and an `Entry` in column 1 (`sticky="ew"`). Give column 1 a weight of 1 so the entries grow with the window. Return a dictionary from name to Entry.',
      starter: `import tkinter as tk


def build_form(parent, names):
    ...
`,
      solution: `import tkinter as tk


def build_form(parent, names):
    entries = {}
    for row, name in enumerate(names):
        tk.Label(parent, text=name + ":").grid(row=row, column=0, sticky="e", padx=5, pady=2)
        entry = tk.Entry(parent)
        entry.grid(row=row, column=1, sticky="ew", padx=5, pady=2)
        entries[name] = entry
    parent.columnconfigure(1, weight=1)
    return entries
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
form = tk.Frame(root)
form.pack()
entries = build_form(form, ["Name", "Email", "City"])
assert list(entries) == ["Name", "Email", "City"]
for row, name in enumerate(["Name", "Email", "City"]):
    e = entries[name]
    assert isinstance(e, tk.Entry)
    gi = e.grid_info()
    assert gi["row"] == row and gi["column"] == 1 and gi["sticky"] == "ew", (name, gi)
labels = [w for w in form.winfo_children() if isinstance(w, tk.Label)]
assert [l.cget("text") for l in labels] == ["Name:", "Email:", "City:"]
for row, l in enumerate(labels):
    gi = l.grid_info()
    assert gi["row"] == row and gi["column"] == 0 and gi["sticky"] == "e"
assert form.columnconfigure(1)["weight"] == 1, "the entry column must grow"
assert form.columnconfigure(0)["weight"] == 0, "the label column keeps its size"
assert form.grid_size() == (2, 3)`,
      checks: ['Labels (`name + ":"`) go in column 0 with `sticky="e"`; entries in column 1 with `sticky="ew"`, one row per name', 'Column 1 has `weight=1` on the **parent** container, while column 0 keeps weight 0', 'Returns a dictionary from each name to its Entry'],
      hint: 'Loop with `for row, name in enumerate(names)`. Use `grid(row=row, column=...)` for both widgets, and call `parent.columnconfigure(1, weight=1)` once after the loop.',
      explanation: 'This is the standard form recipe: labels right-aligned in a fixed column, entries stretched in a growing column. Weights are set on the container the widgets are gridded in (here `parent`), not on the window.',
    },
    {
      kind: 'code',
      prompt: 'Write `button_grid(parent, labels, columns)`. Create a `Button` for each label and grid them left to right and top to bottom with `columns` buttons per row (button `i` goes in row `i // columns`, column `i % columns`), each with `sticky="nsew"`. Return the list of buttons.',
      starter: `import tkinter as tk


def button_grid(parent, labels, columns):
    ...
`,
      solution: `import tkinter as tk


def button_grid(parent, labels, columns):
    buttons = []
    for i, label in enumerate(labels):
        button = tk.Button(parent, text=label)
        button.grid(row=i // columns, column=i % columns, sticky="nsew")
        buttons.append(button)
    return buttons
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
f = tk.Frame(root)
f.pack()
bs = button_grid(f, list("ABCDEFG"), 3)
assert [b.cget("text") for b in bs] == list("ABCDEFG")
for i, b in enumerate(bs):
    gi = b.grid_info()
    assert (gi["row"], gi["column"]) == (i // 3, i % 3), (i, gi)
    assert set(gi["sticky"]) == set("nsew")
assert f.grid_size() == (3, 3)
g = tk.Frame(root)
g.pack()
assert button_grid(g, ["x", "y"], 4) and g.grid_size() == (2, 1)
assert button_grid(tk.Frame(root), [], 3) == []`,
      checks: ['Button `i` is in row `i // columns` and column `i % columns`', 'Every button is gridded with `sticky="nsew"`', 'Returns the list of buttons in order'],
      hint: 'Inside `for i, label in enumerate(labels)`: `button.grid(row=i // columns, column=i % columns, sticky="nsew")`. `//` is whole-number division and `%` is the remainder.',
      explanation: 'Converting a running index into `(row, column)` with `//` and `%` (or `divmod`) is the standard way to lay out a grid from a list. Changing `columns` re-flows the whole layout with no other edits.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_resizable(frame, rows, columns)` that gives every row `0 … rows-1` and every column `0 … columns-1` of `frame` a weight of 1, so that all cells share the extra space equally when the frame grows. Return nothing.',
      starter: `import tkinter as tk


def make_resizable(frame, rows, columns):
    ...
`,
      solution: `import tkinter as tk


def make_resizable(frame, rows, columns):
    for r in range(rows):
        frame.rowconfigure(r, weight=1)
    for c in range(columns):
        frame.columnconfigure(c, weight=1)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
f = tk.Frame(root)
assert make_resizable(f, 2, 3) is None
for r in range(2):
    assert f.rowconfigure(r)["weight"] == 1
for c in range(3):
    assert f.columnconfigure(c)["weight"] == 1
assert f.rowconfigure(2)["weight"] == 0, "only rows 0 and 1"
assert f.columnconfigure(3)["weight"] == 0, "only columns 0 to 2"
g = tk.Frame(root)
make_resizable(g, 0, 1)
assert g.columnconfigure(0)["weight"] == 1 and g.rowconfigure(0)["weight"] == 0`,
      checks: ['Gives each row in `range(rows)` weight 1 with `rowconfigure`', 'Gives each column in `range(columns)` weight 1 with `columnconfigure`', 'Does not touch rows and columns beyond those counts, and returns `None`'],
      hint: 'Two loops: `for r in range(rows): frame.rowconfigure(r, weight=1)` and the same for columns.',
      explanation: 'This helper is useful for game boards, calculators and dashboards where every cell should grow equally. Remember it must be applied to the container that holds the gridded widgets, and the widgets themselves need `sticky="nsew"` to use the extra room.',
    },
  ],
  takeaways: [
    '**grid** places widgets in a table: `grid(row=, column=)` (from 0), with `rowspan` / `columnspan` for spanning. Empty rows and columns take no space.',
    '`sticky` is a compass of `n`, `s`, `e`, `w`: one letter aligns a widget to an edge, two opposite letters (`"ew"`, `"ns"`, `"nsew"`) stretch it. Anything else, like `"center"`, raises `TclError`.',
    'A grid does not grow by default. Give columns and rows a **weight** (`columnconfigure(i, weight=1)`) on the container that holds the widgets, and spare space is shared in proportion to the weights.',
    'The standard form: labels in column 0 with `sticky="e"`, entries in column 1 with `sticky="ew"`, and column 1 with weight 1.',
    'Use pack **or** grid in a given container, never both. You can still use both in one window by nesting Frames, each with its own manager. Like `pack()`, `grid()` returns `None`.',
  ],
  reading: [
    { title: 'TkDocs: The grid geometry manager', url: 'https://tkdocs.com/tutorial/grid.html', source: 'tutorial', note: 'A clear, illustrated tutorial on rows, columns, sticky, weights and resizing.' },
    { title: 'Tk manual: grid', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/grid.htm', source: 'docs', note: 'The complete reference: options, weights, uniform and minsize.' },
    { title: 'Python docs: tkinter, geometry management', url: 'https://docs.python.org/3/library/tkinter.html#the-grid-geometry-manager', source: 'docs', note: 'The documented grid method names and options in Python.' },
  ],
};
