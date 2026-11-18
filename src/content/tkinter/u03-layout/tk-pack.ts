import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-pack',
  title: 'pack: Stacking Widgets',
  summary: 'Understand geometry managers and the pack model: every pack call cuts a slice from the free space on one side of its container. Learn side, fill, expand, padding and anchor, why the order of pack calls matters, the classic toolbar / sidebar / status-bar skeleton, and the mistakes (pack returning None, mixing pack and grid) that stop programs working.',
  minutes: 32,
  objectives: [
    'Explain what a geometry manager is and why a widget never appears without one',
    'Use `side`, `fill`, `expand`, `padx`, `pady`, `ipadx`, `ipady` and `anchor` in `pack()`',
    'Predict a layout by following the “free cavity” model of pack, including the effect of call order',
    'Build the standard window skeleton: toolbar on top, status bar at the bottom, main area expanding',
    'Avoid `widget = Widget(...).pack()` (a `None` bug) and mixing pack with grid in one container',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Geometry managers: telling Tk where things go',
      blocks: [
        {
          type: 'p',
          text: 'Creating a widget does not show it. You must hand it to a **geometry manager**, which decides its position and size. tkinter has three: **pack** (stack widgets along the edges of the container), **grid** (a table of rows and columns) and **place** (exact coordinates). A widget that is created but never given to a geometry manager simply does not appear, which is the most common reason for “my label is missing”.',
        },
        {
          type: 'p',
          text: 'Pack is the quickest to use. Each `widget.pack(...)` call takes a strip of the remaining free space on one **side** of its container, puts the widget in it, and the next call works with whatever space is left. The options adjust that process:',
        },
        {
          type: 'table',
          headers: ['Option', 'Values', 'What it does'],
          rows: [
            ['`side`', '`"top"` (default), `"bottom"`, `"left"`, `"right"`', 'Which edge of the free space this widget’s strip is cut from'],
            ['`fill`', '`"none"` (default), `"x"`, `"y"`, `"both"`', 'Stretch the widget to fill its strip horizontally, vertically or both'],
            ['`expand`', '`False` (default), `True`', 'Give this widget a share of any **spare** space in the container'],
            ['`padx`, `pady`', 'a number, or a pair `(left, right)`', 'Empty space **outside** the widget'],
            ['`ipadx`, `ipady`', 'a number', 'Empty space **inside** the widget (makes it bigger)'],
            ['`anchor`', '`"n"`, `"s"`, `"e"`, `"w"`, `"nw"` … (default `"center"`)', 'Where the widget sits inside a strip that is larger than it'],
          ],
          caption: 'The pack options you will use every day.',
        },
        {
          type: 'code',
          title: 'skeleton.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Window skeleton")
root.geometry("500x350")

toolbar = tk.Frame(root, bg="lightgray", height=40)
toolbar.pack(side="top", fill="x")
tk.Button(toolbar, text="New").pack(side="left", padx=4, pady=4)
tk.Button(toolbar, text="Open").pack(side="left", padx=4, pady=4)

status = tk.Label(root, text="Ready", anchor="w", relief="sunken")
status.pack(side="bottom", fill="x")

sidebar = tk.Listbox(root, width=14)
sidebar.pack(side="left", fill="y")
for name in ("Inbox", "Sent", "Drafts"):
    sidebar.insert(tk.END, name)

main = tk.Text(root)
main.pack(side="top", fill="both", expand=True)

root.mainloop()`,
          annotations: [
            { lines: '7-8', text: 'The toolbar takes a strip from the **top** and `fill="x"` stretches it across the whole window width.' },
            { lines: '9-10', text: 'Inside the toolbar (a different container) the buttons are packed `side="left"`, so they line up from left to right.' },
            { lines: '12-13', text: 'The status bar claims the **bottom** strip, packed *before* the main area so that it keeps its space when the window shrinks.' },
            { lines: '15-16', text: 'The sidebar takes a strip on the **left**, but only the height that is still free (between toolbar and status bar). `fill="y"` stretches it to that height.' },
            { lines: '20-21', text: 'The main area is packed **last**. `expand=True` hands it all the space that is left, and `fill="both"` stretches it into that space. When the user resizes the window, this area grows.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does the order of the pack calls matter?',
          text: 'Because each call cuts its strip from the space that **earlier calls left over**. The same widgets packed in a different order give a different layout. That makes pack easy for one-directional stacks and easy to get wrong for complex layouts, which is why the next lesson introduces grid.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A program creates `label = tk.Label(root, text="Hello")` but never calls `pack`, `grid` or `place` on it. What does the user see?',
      options: [
        { text: 'No label at all, because the widget has no geometry manager', correct: true, why: 'A widget only appears when a geometry manager has placed it. There is no error, which is why this bug can be hard to spot.' },
        { text: 'The label at the top left of the window', why: 'Without a geometry manager there is no position to default to. Tk does not guess one.' },
        { text: 'An error message about a missing geometry manager', why: 'Nothing is raised; the widget is simply never displayed. Check that every widget you create is also packed, gridded or placed.' },
        { text: 'The label, but it is too small to read', why: 'It is not displayed at all, however large its requested size.' },
      ],
      explanation: 'Creating and showing are two separate steps in tkinter. Whenever a widget is missing from the window, check first that it was given to a geometry manager.',
    },
    {
      kind: 'concept',
      title: 'The free-cavity model, in code',
      blocks: [
        {
          type: 'p',
          text: 'To predict what pack does, think of the container as a rectangular **cavity** of free space. Each widget in turn gets a **parcel** cut from one side of the cavity: the full width and the widget’s height when packed to the top or bottom, or the widget’s width and the full height when packed left or right. The parcel is removed from the cavity, then the widget is placed inside it (centered, or stretched when `fill` is set). The model below is a simplified version of the real algorithm. It treats `expand` as “this widget gets everything that is left”, which is exact when the expanding widget is packed last, as in the skeleton above.',
        },
        {
          type: 'code',
          title: 'pack_model.py',
          runnable: true,
          code: `def pack_layout(width, height, widgets):
    """A simplified model of pack: each widget takes a slice of the free space."""
    left, top, right, bottom = 0, 0, width, height
    placed = {}
    for name, side, w, h, fill, expand in widgets:
        cav_w, cav_h = right - left, bottom - top
        if expand:
            px, py, pw, ph = left, top, cav_w, cav_h
            left, top, right, bottom = right, bottom, right, bottom
        elif side in ("top", "bottom"):
            pw, ph = cav_w, h
            px = left
            py = top if side == "top" else bottom - h
            if side == "top":
                top += h
            else:
                bottom -= h
        else:
            pw, ph = w, cav_h
            px = left if side == "left" else right - w
            py = top
            if side == "left":
                left += w
            else:
                right -= w
        ww = pw if fill in ("x", "both") else w
        hh = ph if fill in ("y", "both") else h
        placed[name] = (px + (pw - ww) // 2, py + (ph - hh) // 2, ww, hh)
    return placed


widgets = [
    ("toolbar", "top",    400, 40, "x",    False),
    ("status",  "bottom", 400, 20, "x",    False),
    ("sidebar", "left",   100, 10, "y",    False),
    ("main",    "top",     10, 10, "both", True),
]
for name, (x, y, w, h) in pack_layout(400, 300, widgets).items():
    print(f"{name:8} x={x:3} y={y:3} width={w:3} height={h:3}")`,
          output: `toolbar  x=  0 y=  0 width=400 height= 40
status   x=  0 y=280 width=400 height= 20
sidebar  x=  0 y= 40 width=100 height=240
main     x=100 y= 40 width=300 height=240`,
          annotations: [
            { lines: 3, text: 'The free **cavity**, as four edges. It starts as the whole container and shrinks with every widget.' },
            { lines: '7-9', text: 'An expanding widget (packed last) gets the entire remaining cavity.' },
            { lines: '10-17', text: 'Top or bottom: the parcel is as wide as the cavity and as tall as the widget. Then the cavity loses that strip from the top or the bottom.' },
            { lines: '18-26', text: 'Left or right: the parcel is as tall as the **cavity** and as wide as the widget, so a sidebar only gets the height left over by earlier top and bottom widgets.' },
            { lines: '26-28', text: '`fill` stretches the widget to its parcel. Otherwise the widget keeps its own size and is centered in the parcel.' },
          ],
        },
        {
          type: 'p',
          text: 'The output explains the skeleton: the toolbar and status bar span the full width because they were packed to the top and bottom first, the sidebar has height 240 (300 minus 40 minus 20) and the main area is what remains, 300 by 240. Pack the sidebar **before** the toolbar and it would take the full 300 pixel height instead, and the toolbar would be only 300 pixels wide.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Read pack code as a story',
          text: '“Toolbar to the top. Status bar to the bottom. Sidebar to the left. Main area gets the rest.” If you can say it in that order, you can write it in that order. When a widget ends up in the wrong place, the first suspect is always the order of the calls.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'With the default `side="top"`, `widget.pack(fill="x")` stretches the widget across the full width of its container, even without `expand=True`.',
      answer: true,
      explanation: 'True. A top (or bottom) widget’s parcel is as wide as the whole free cavity, so `fill="x"` stretches the widget across it. `expand=True` is only needed to claim **spare** space beyond the strips: for example, to let the main area grow vertically when the window grows.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the call that puts a label on the left, stretched to the full height, and grows with the window.',
      template: `label.pack(___="left", ___="y", ___=True)`,
      templateIsCode: true,
      blanks: [{ answers: ['side'] }, { answers: ['fill'] }, { answers: ['expand'] }],
      wordBank: ['side', 'fill', 'expand', 'anchor', 'padx'],
      explanation: '`side` chooses the edge, `fill` stretches the widget along an axis (`"y"` is vertical), and `expand=True` claims the spare space when the window is resized.',
    },
    {
      kind: 'concept',
      title: 'Padding, anchoring and the two pack traps',
      blocks: [
        {
          type: 'p',
          text: '`padx` and `pady` add empty space **outside** a widget, which separates it from its neighbours and from the container edge. A single number pads both sides; a pair such as `pady=(10, 0)` pads the top and bottom differently. `ipadx` and `ipady` add space **inside** the widget, making buttons and labels larger. `anchor` is used when a widget is smaller than its strip, for example `anchor="w"` to align labels at the left edge.',
        },
        {
          type: 'code',
          title: 'pack_options.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Pack options")
root.geometry("320x220")

tk.Label(root, text="Left aligned", bg="khaki").pack(anchor="w", padx=10, pady=(10, 2))
tk.Label(root, text="Stretched", bg="lightblue").pack(fill="x", padx=10, pady=2)
tk.Button(root, text="Roomy button").pack(ipadx=30, ipady=10, pady=10)

row = tk.Frame(root)
row.pack(pady=5)
for text in ("A", "B", "C"):
    tk.Button(row, text=text, width=4).pack(side="left", padx=3)
root.mainloop()`,
          annotations: [
            { lines: 7, text: '`anchor="w"` keeps the label at the west (left) edge. `pady=(10, 2)` leaves 10 pixels above and 2 below.' },
            { lines: 8, text: '`fill="x"` stretches the label across the window, and `padx=10` keeps a margin at both ends.' },
            { lines: 9, text: '`ipadx` and `ipady` enlarge the button itself, while `pady` keeps its neighbours away.' },
            { lines: '11-14', text: 'The standard trick for a horizontal row: put the widgets in a **Frame** and pack them `side="left"` inside it. The frame itself is stacked vertically with everything else.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Trap 1: pack() returns None',
          text: '`label = tk.Label(root, text="Hi").pack()` stores **`None`** in `label`, because `pack()` returns nothing. Later `label.config(...)` fails with `AttributeError: \'NoneType\' object has no attribute \'config\'`. Create the widget on one line and pack it on the next, as in this lesson, whenever you need to keep the widget.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Trap 2: never mix pack and grid in the same container',
          text: 'Both managers try to compute the layout of the same container and can fight forever, so tkinter refuses with `TclError: cannot use geometry manager grid inside . which already has slaves managed by pack` (or the reverse). Use **one** manager per container. Mixing is fine across containers: a grid inside a Frame that is itself packed is a very common structure.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is stored in `status` after `status = tk.Label(root, text="Ready").pack(side="bottom")`?',
      options: [
        { text: '`None`', correct: true, why: '`pack()` configures the widget and returns `None`. The Label object was never stored anywhere.' },
        { text: 'The `Label` widget', why: 'Only if the widget was created in one statement and packed in another. Chaining `.pack()` on the constructor assigns the **result of pack**, not the widget.' },
        { text: 'A dictionary of the packing options', why: 'That is what `status.pack_info()` returns, and only when you call it on the widget.' },
        { text: 'The string `"bottom"`', why: 'The pack options are applied to the widget but not returned.' },
      ],
      explanation: 'The one-line “create and pack” habit is only safe for widgets that you never need to touch again, like a decorative Label.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This models how much free space remains after four pack calls in a 300 by 200 window.',
      code: `cavity_w, cavity_h = 300, 200
for side, size in [("top", 40), ("left", 60), ("bottom", 30), ("right", 50)]:
    if side in ("top", "bottom"):
        cavity_h -= size
    else:
        cavity_w -= size
print(cavity_w, cavity_h)`,
      answer: '190 130',
      hint: 'Top and bottom strips reduce the height; left and right strips reduce the width.',
      explanation: 'Width: 300 - 60 (left) - 50 (right) = 190. Height: 200 - 40 (top) - 30 (bottom) = 130. That 190 by 130 space is what an `expand=True` main widget would receive.',
    },
    {
      kind: 'concept',
      title: 'When the layout looks wrong: a checklist',
      blocks: [
        {
          type: 'table',
          headers: ['What you see', 'Most likely cause', 'Fix'],
          rows: [
            ['A widget is missing', 'It was never packed, or `pack()` was chained and you lost the widget', 'Pack on its own line and check each widget has a geometry manager'],
            ['The status bar vanishes when the window shrinks', 'It was packed **after** a widget that takes all the space', 'Pack edge widgets (top, bottom, sides) before the expanding one'],
            ['The main area does not grow with the window', '`expand=True` is missing (or `fill`)', '`pack(fill="both", expand=True)` on the main widget'],
            ['Buttons stack vertically instead of side by side', 'The default `side` is `"top"`', 'Use `side="left"` and put the row in a Frame'],
            ['Everything is squeezed into the middle', 'No `fill`, so widgets keep their natural size and are centered', 'Add `fill="x"` or `anchor="w"`'],
            ['A `TclError` about geometry managers', 'pack and grid used in the same container', 'Use one manager, or put one group inside a Frame'],
          ],
          caption: 'Symptoms and causes for pack layouts. A shortcut for finding the cause is to give each Frame a bright `bg=` colour temporarily: then you can see which rectangle really goes where.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Running this code raises `_tkinter.TclError: cannot use geometry manager grid inside . which already has slaves managed by pack`. Tap the line that raises the error.',
      lines: [
        'tk.Label(root, text="Name").pack()',
        'entry = tk.Entry(root)',
        'entry.grid(row=0, column=1)',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The root container already has a packed child (line 1), so line 3 may not use `grid` in the same container. Use `pack` or `grid` for **all** of the root’s children. To combine both, put the grid widgets inside a Frame.',
    },
    {
      kind: 'numeric',
      prompt: 'A 400 pixel wide window packs a toolbar with `side="top"`, then a sidebar `side="left"` that is 100 pixels wide, and then a status bar with `side="bottom", fill="x"`. How many pixels wide is the status bar?',
      answer: '300',
      hint: 'The status bar is packed after the sidebar. How wide is the free cavity by then?',
      explanation: 'The sidebar already took a 100 pixel strip from the left, so the cavity is 300 pixels wide when the status bar is packed, and `fill="x"` stretches it across exactly that. Packed **before** the sidebar, it would have been 400 pixels wide.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the skeleton',
      blocks: [
        {
          type: 'p',
          text: 'The in-app exercises use the stand-in for tkinter, which records widgets and layout options but does not draw anything, so they check the *options you chose* through `pack_info()`, and the order of packing through `pack_slaves()`. Both are real tkinter methods. Run the complete programs above on your PC to see the layouts they describe.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `build_toolbar(parent, names)`. Create a `Frame` in `parent` and pack it `side="top"`, `fill="x"`. Inside the frame, create one `Button` per name (the name is its text) and pack each with `side="left"` and `padx=2`. Return the frame.',
      starter: `import tkinter as tk


def build_toolbar(parent, names):
    ...
`,
      solution: `import tkinter as tk


def build_toolbar(parent, names):
    bar = tk.Frame(parent)
    bar.pack(side="top", fill="x")
    for name in names:
        tk.Button(bar, text=name).pack(side="left", padx=2)
    return bar
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
bar = build_toolbar(root, ["New", "Open", "Save"])
assert isinstance(bar, tk.Frame)
info = bar.pack_info()
assert info["side"] == "top" and info["fill"] == "x"
buttons = bar.winfo_children()
assert [b.cget("text") for b in buttons] == ["New", "Open", "Save"]
for b in buttons:
    assert isinstance(b, tk.Button)
    pi = b.pack_info()
    assert pi["side"] == "left", "buttons go side by side"
    assert pi["padx"] in (2, (2, 2), "2")
assert build_toolbar(root, []).winfo_children() == []`,
      checks: ['Creates a Frame in `parent` and packs it `side="top"`, `fill="x"`', 'Creates one Button per name inside the frame, each packed `side="left"` with `padx=2`', 'Returns the frame'],
      hint: 'Create `bar = tk.Frame(parent)`, pack it, then loop: `tk.Button(bar, text=name).pack(side="left", padx=2)`. The buttons’ parent must be `bar`, not `parent`.',
      explanation: 'A Frame per row is the standard way to line widgets up horizontally in a packed layout: the frame is stacked with `side="top"`, and the widgets inside are packed `side="left"`.',
    },
    {
      kind: 'code',
      prompt: 'Write `build_skeleton(root)` that creates and packs three widgets in the right order and returns them as `(toolbar, status, main)`: a `Frame` toolbar (`side="top"`, `fill="x"`), a `Label` status bar (`side="bottom"`, `fill="x"`) and a `Frame` main area (`fill="both"`, `expand=True`). The main area must be packed **last**.',
      starter: `import tkinter as tk


def build_skeleton(root):
    ...
`,
      solution: `import tkinter as tk


def build_skeleton(root):
    toolbar = tk.Frame(root)
    toolbar.pack(side="top", fill="x")
    status = tk.Label(root, text="Ready", anchor="w")
    status.pack(side="bottom", fill="x")
    main = tk.Frame(root)
    main.pack(fill="both", expand=True)
    return toolbar, status, main
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
toolbar, status, main = build_skeleton(root)
assert isinstance(toolbar, tk.Frame) and isinstance(status, tk.Label) and isinstance(main, tk.Frame)
t, s, m = toolbar.pack_info(), status.pack_info(), main.pack_info()
assert t["side"] == "top" and t["fill"] == "x"
assert s["side"] == "bottom" and s["fill"] == "x"
assert m["fill"] == "both" and int(m["expand"]) == 1
assert root.pack_slaves()[-1] is main, "the expanding main area must be packed last"
assert set(root.pack_slaves()) == {toolbar, status, main}`,
      checks: ['The toolbar is packed `side="top"`, `fill="x"` and the status bar `side="bottom"`, `fill="x"`', 'The main area uses `fill="both"` and `expand=True`', 'The main area is packed last, so the toolbar and status bar keep their strips'],
      hint: 'Create and pack the toolbar, then the status label, and finally the main frame with `pack(fill="both", expand=True)`. Return the three widgets as a tuple.',
      explanation: 'Edge widgets first, the expanding centre last: this is the pattern behind almost every packed application window. The checker uses `pack_slaves()`, which lists a container’s children in packing order.',
    },
    {
      kind: 'code',
      prompt: 'Write `stack_labels(parent, texts)` that creates a `Label` for each text, packs each with `anchor="w"` and `padx=10`, and returns the list of labels. The labels must be stacked from top to bottom in the order of `texts`.',
      starter: `import tkinter as tk


def stack_labels(parent, texts):
    ...
`,
      solution: `import tkinter as tk


def stack_labels(parent, texts):
    labels = []
    for text in texts:
        label = tk.Label(parent, text=text)
        label.pack(anchor="w", padx=10)
        labels.append(label)
    return labels
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
labels = stack_labels(root, ["one", "two", "three"])
assert [l.cget("text") for l in labels] == ["one", "two", "three"]
assert all(isinstance(l, tk.Label) for l in labels)
assert root.pack_slaves() == labels, "packed in order, so they stack top to bottom"
for l in labels:
    pi = l.pack_info()
    assert pi["anchor"] == "w" and pi["side"] == "top"
    assert pi["padx"] in (10, (10, 10), "10")
assert all(l is not None for l in labels), "pack() returns None: do not store its result"
assert stack_labels(tk.Frame(root), []) == []`,
      checks: ['Creates the Label and **then** packs it, keeping the widget (not the `None` that `pack()` returns)', 'Packs each with `anchor="w"` and `padx=10` and the default `side="top"`', 'Returns the labels in the order of `texts`'],
      hint: 'Inside the loop write `label = tk.Label(parent, text=text)` on one line and `label.pack(anchor="w", padx=10)` on the next, then append `label` to a list.',
      explanation: 'This is Trap 1 in practice: `labels.append(tk.Label(...).pack())` would fill the list with `None`. Two lines per widget is the safe habit.',
    },
  ],
  takeaways: [
    'A widget appears only after a **geometry manager** (`pack`, `grid` or `place`) has placed it. Use **one** manager per container, never `pack` and `grid` together in the same parent.',
    '**pack** cuts a strip from the free space on one `side` for each call, so **order matters**: edges first, then the `expand=True`, `fill="both"` widget that takes everything that is left.',
    '`fill` stretches a widget within its strip, `expand` claims spare space when the window grows, `padx`/`pady` add outside space, `ipadx`/`ipady` inside space, and `anchor` aligns within a larger strip.',
    'To line widgets up horizontally, pack them `side="left"` inside a **Frame**; the Frame itself is stacked with the other widgets.',
    '`pack()` returns **`None`**: create the widget on one line and pack it on the next if you need to keep it.',
  ],
  reading: [
    { title: 'TkDocs: Geometry management (pack, grid and place)', url: 'https://tkdocs.com/tutorial/grid.html', source: 'tutorial', note: 'The modern guide to laying out widgets, with notes on when each manager fits.' },
    { title: 'Python docs: tkinter, the packer', url: 'https://docs.python.org/3/library/tkinter.html#the-packer', source: 'docs', note: 'The official summary of how pack works, and the pack options.' },
    { title: 'Tk manual: pack', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/pack.htm', source: 'docs', note: 'The full description of the packing algorithm, with parcels and the cavity.' },
    { title: 'Real Python: Python GUI programming with tkinter', url: 'https://realpython.com/python-gui-tkinter/', source: 'tutorial', note: 'A long beginner tutorial with pack, grid and place examples.' },
  ],
};
