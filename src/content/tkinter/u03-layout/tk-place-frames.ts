import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-place-frames',
  title: 'Frames, place and Layout Recipes',
  summary: 'Group widgets with Frame and LabelFrame, position things exactly with place (absolute and relative), stack several frames into pages and switch between them with tkraise, and hide or show widgets without losing their position. Ends with a catalogue of layout recipes you can reuse.',
  minutes: 30,
  objectives: [
    'Use `Frame` and `LabelFrame` to group widgets, each with its own geometry manager',
    'Position a widget with `place` using absolute (`x`, `y`) and relative (`relx`, `rely`) coordinates and an `anchor`',
    'Explain when place is the right tool and when it is the wrong one',
    'Build a multi-page window by stacking frames in one grid cell and raising one with `tkraise()`',
    'Hide and show widgets with `pack_forget`, `grid_remove` and `grid_forget`, and know how they differ',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Frames: containers that organise',
      blocks: [
        {
          type: 'p',
          text: 'A **Frame** is an empty rectangular widget whose only job is to hold other widgets. Frames are the key to complex layouts, because every container may use **its own** geometry manager. A typical window is a grid of frames at the top level, with a pack inside the toolbar frame, a grid inside the form frame, and so on. A **LabelFrame** is a frame with a border and a title, handy for grouping related options (“Display”, “Sound”).',
        },
        {
          type: 'p',
          text: 'A frame normally shrinks (or grows) to fit its contents, which means `Frame(root, width=200, height=100)` is ignored as soon as something is packed or gridded inside it. To force a frame to keep the size you gave it, turn off **propagation**: `frame.pack_propagate(False)` for a frame whose children use pack, and `frame.grid_propagate(False)` for a grid. Use it sparingly, because it also stops the frame from adapting to its contents.',
        },
        {
          type: 'p',
          text: 'The most powerful frame trick is the **page stack**: put several frames in the **same grid cell** (`row=0, column=0`). They overlap, and the one most recently created is on top. Calling `page.tkraise()` brings any frame to the front, which makes a multi-screen application with a few lines of code.',
        },
        {
          type: 'code',
          title: 'pages.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Pages")
root.geometry("360x220")

nav = tk.Frame(root)
nav.pack(side="top", fill="x")
stack = tk.Frame(root)
stack.pack(side="top", fill="both", expand=True)
stack.rowconfigure(0, weight=1)
stack.columnconfigure(0, weight=1)

pages = {}
for name, colour in (("Home", "lightblue"), ("Settings", "khaki"), ("About", "lightgreen")):
    page = tk.Frame(stack, bg=colour)
    page.grid(row=0, column=0, sticky="nsew")
    tk.Label(page, text=f"{name} page", bg=colour, font=("Arial", 16)).pack(expand=True)
    pages[name] = page
    tk.Button(nav, text=name, command=lambda n=name: pages[n].tkraise()).pack(side="left", padx=2, pady=2)

pages["Home"].tkraise()
root.mainloop()`,
          annotations: [
            { lines: '7-12', text: 'The window is two stacked frames (pack): a navigation bar on top and a **stack** frame that expands. The stack uses grid internally, with row 0 and column 0 growing.' },
            { lines: '16-17', text: 'Every page goes in **the same cell**, row 0 and column 0, with `sticky="nsew"` so each fills it. They overlap, like a pile of cards.' },
            { lines: 18, text: 'Page content uses its own manager (`pack`) inside the page frame: a different container, so there is no conflict.' },
            { lines: 20, text: '`command=lambda n=name: pages[n].tkraise()`: `tkraise()` brings a page to the front. The `n=name` default argument captures the **current** name, a trick explained in the Callbacks lesson.' },
            { lines: 22, text: 'Show the first page when the program starts. Pages keep their state (typed text, selection) because they are only hidden behind another page, not destroyed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does lambda n=name matter?',
          text: 'Without `n=name`, every button’s lambda would look up `name` **when it is clicked**, by which time the loop has finished and `name` is the last value, `"About"`: all three buttons would open the About page. The default argument freezes the value at the moment the lambda is created.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You want a “3” notification badge to overlap the top-right corner of an existing button, without changing the layout of the widgets around it. Which tool fits?',
      options: [
        { text: '`place` on the badge, positioned relative to the button’s container', correct: true, why: 'place does not take part in the cavity or table calculation, so the badge can float over other widgets at exact coordinates.' },
        { text: '`pack` the badge with `side="right"`', why: 'Pack would reserve its own strip next to the button and shift the layout instead of overlapping it.' },
        { text: '`grid` the badge in a new row', why: 'That makes a new row of space in the table, which is the opposite of an overlay.' },
        { text: 'Use `columnspan` to make the button larger', why: '`columnspan` stretches widgets across cells. It does not overlap one widget on another.' },
      ],
      explanation: 'Overlays, badges, floating hints, and the centered “Loading…” label are the legitimate niche of `place`. For layouts that must adapt to window size, pack and grid are the better choices.',
    },
    {
      kind: 'concept',
      title: 'place: exact positions, and relative ones',
      blocks: [
        {
          type: 'p',
          text: '**place** positions a widget by coordinates inside its container. There are two kinds, and you can **add** them together. **Absolute** values (`x`, `y`, `width`, `height`) are in pixels. **Relative** values (`relx`, `rely`, `relwidth`, `relheight`) are fractions from `0.0` to `1.0` of the container’s size. The `anchor` says which point of the widget is attached to that position (default `"nw"`, the top-left corner; `"center"` is the middle). So `place(relx=0.5, rely=0.5, anchor="center")` always centers a widget, whatever the size of its container.',
        },
        {
          type: 'code',
          title: 'place_model.py',
          runnable: true,
          code: `def place_rect(cw, ch, anchor="nw", x=0, y=0, relx=0.0, rely=0.0,
               width=0, height=0, relwidth=0.0, relheight=0.0):
    """Where place puts a widget: (left, top, width, height) in a cw x ch container."""
    w = float(relwidth * cw + width)
    h = float(relheight * ch + height)
    px = relx * cw + x            # the point the anchor is attached to
    py = rely * ch + y
    sides = set() if anchor == "center" else set(anchor)
    fx = 0 if "w" in sides else 1 if "e" in sides else 0.5
    fy = 0 if "n" in sides else 1 if "s" in sides else 0.5
    return (px - fx * w, py - fy * h, w, h)


examples = {
    "fixed corner":  dict(x=20, y=10, width=100, height=30),
    "centered":      dict(relx=0.5, rely=0.5, anchor="center", width=100, height=30),
    "top-right":     dict(relx=1, x=-10, y=10, anchor="ne", width=60, height=20),
    "bottom bar":    dict(relwidth=1, height=25, rely=1, anchor="sw"),
}
for size in ((400, 200), (800, 400)):
    print("container", size)
    for name, options in examples.items():
        print(f"  {name:13}", place_rect(*size, **options))`,
          output: `container (400, 200)
  fixed corner  (20.0, 10.0, 100.0, 30.0)
  centered      (150.0, 85.0, 100.0, 30.0)
  top-right     (330.0, 10.0, 60.0, 20.0)
  bottom bar    (0.0, 175.0, 400.0, 25.0)
container (800, 400)
  fixed corner  (20.0, 10.0, 100.0, 30.0)
  centered      (350.0, 185.0, 100.0, 30.0)
  top-right     (730.0, 10.0, 60.0, 20.0)
  bottom bar    (0.0, 375.0, 800.0, 25.0)`,
          annotations: [
            { lines: '4-5', text: 'Size is a relative part (a fraction of the container) **plus** an absolute part, so `relwidth=1, width=-20` means “20 pixels narrower than the container”.' },
            { lines: '6-7', text: 'The position works the same way. `relx=1, x=-10` means “10 pixels in from the right edge”.' },
            { lines: '8-10', text: 'The anchor decides which point of the widget lands on that position: `"ne"` the top-right corner, `"center"` the middle, `"sw"` the bottom-left corner.' },
            { lines: '20-23', text: 'Compare the two containers. The absolute **fixed corner** never moves; the relative ones follow the container’s size and stay centered, at the right edge and across the bottom.' },
          ],
        },
        {
          type: 'table',
          headers: ['Use place for', 'Avoid place for'],
          rows: [
            ['A widget centered over another (loading message, empty-state hint)', 'The main layout of a window: it will not resize sensibly'],
            ['Badges, tooltips, floating buttons and overlays', 'Forms and dialogs: text and fonts vary between systems and scaling settings, so fixed pixels clip or overlap'],
            ['Pinning something to a corner with `relx=1, rely=0, anchor="ne"`', 'Anything that has to adapt to the language, the font or the DPI of the user’s screen'],
          ],
          caption: 'Pixel positions look right on your machine and wrong on someone else’s. Prefer pack and grid, and keep place for deliberate overlays.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'place can be mixed with the others',
          text: 'Unlike the pack and grid pair, `place` may be used in a container that also uses pack or grid for other children. That is exactly why overlays work: the badge floats over a gridded layout without disturbing it.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`widget.place(x=50, y=20)` keeps the widget at the same relative spot (the same fraction of the window) when the window is made larger.',
      answer: false,
      explanation: 'False. `x` and `y` are absolute pixels, so the widget stays 50 and 20 pixels from the top-left corner however large the window becomes. Only the relative options (`relx`, `rely`, `relwidth`, `relheight`) follow the size of the container.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the call that centers a widget in its container, whatever its size.',
      template: `widget.place(relx=___, rely=___, anchor="___")`,
      templateIsCode: true,
      blanks: [{ answers: ['0.5', '.5'] }, { answers: ['0.5', '.5'] }, { answers: ['center'] }],
      wordBank: ['0.5', '1.0', '0', 'center', 'nw'],
      explanation: '`relx=0.5, rely=0.5` is the middle of the container, but it is the widget’s top-left corner that would sit there, so `anchor="center"` shifts the widget’s own center onto that point.',
    },
    {
      kind: 'concept',
      title: 'Hiding, showing and recipes',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes a widget should disappear (an error message, an advanced panel) and come back later. The three managers have different ways to do it, and the difference matters:',
        },
        {
          type: 'table',
          headers: ['Call', 'What it does', 'Putting it back'],
          rows: [
            ['`w.pack_forget()`', 'Removes the widget from the layout (the widget still exists)', '`w.pack(...)` again. It goes to the **end** of the packing order, so use `before=` / `after=` to put it in the right spot'],
            ['`w.grid_remove()`', 'Removes it but **remembers** its row, column and options', '`w.grid()` with no arguments restores it exactly'],
            ['`w.grid_forget()`', 'Removes it and forgets everything', '`w.grid(row=…, column=…)` with all options again'],
            ['`w.place_forget()`', 'Removes it from the layout', '`w.place(...)` again'],
            ['`w.destroy()`', 'Deletes the widget forever', 'Create a new widget'],
          ],
          caption: 'Hiding versus deleting. `grid_remove` is the one to use for a panel you will show again.',
        },
        {
          type: 'table',
          headers: ['Layout goal', 'Recipe'],
          rows: [
            ['Toolbar, content and status bar', 'pack: toolbar `side="top", fill="x"`, status `side="bottom", fill="x"`, content `fill="both", expand=True`'],
            ['A form', 'grid: labels `sticky="e"`, entries `sticky="ew"`, `columnconfigure(1, weight=1)`'],
            ['A row of buttons', 'a Frame, with the buttons packed `side="left"` (or `side="right"` to align right)'],
            ['A grid of equal cells', '`rowconfigure` and `columnconfigure` with `weight=1` for each index, `sticky="nsew"`'],
            ['Content centered in the window', 'one widget with `expand=True` and no `fill` in pack; or `place(relx=0.5, rely=0.5, anchor="center")`'],
            ['Several screens', 'frames stacked in one grid cell and `tkraise()`'],
            ['A list with a scrollbar', 'a Frame; the scrollbar `side="right", fill="y"`, the list `side="left", fill="both", expand=True`'],
            ['A group with a title', '`LabelFrame(parent, text="Options")` with a manager of your choice inside it'],
          ],
          caption: 'Recipes for the layouts you will meet again and again.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'pack_forget changes the order',
          text: 'After `w.pack_forget()` and `w.pack()`, the widget is packed **last**, so in a toolbar it would jump to the far end. If the widget must return to its old position, re-pack it with `before=` or `after=` another widget (`w.pack(before=other, side="left")`), or use grid, where `grid_remove()` remembers the position.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This applies the place formula `position = rel * container + offset` for a container 400 wide and 200 high.',
      code: `width, height = 400, 200
x = 0.5 * width - 10
y = 0.25 * height + 20
print(x, y)`,
      answer: '190.0 70.0',
      hint: 'x = 0.5 * 400 - 10, y = 0.25 * 200 + 20.',
      explanation: 'This is `place(relx=0.5, x=-10, rely=0.25, y=20)`: half-way across minus 10 pixels gives 190.0, and a quarter of the way down plus 20 pixels gives 70.0 (floats, because `0.5 * 400` is a float).',
    },
    {
      kind: 'error',
      prompt: 'Running this code raises `_tkinter.TclError: bad screen distance "left"`. Tap the line that raises it.',
      lines: [
        'root = tk.Tk()',
        'button = tk.Button(root, text="OK")',
        'button.place(x="left", y=10)',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`x` and `y` are distances: numbers of pixels (or numbers with a unit such as `"2c"` for centimetres). They are not directions. To put a widget at the left, use `x=0` (or `anchor="w"` with `relx=0`).',
    },
    {
      kind: 'numeric',
      prompt: 'A container is 500 pixels wide. A widget is placed with `place(relx=0.5, x=-50, width=100)` and the default anchor `"nw"`. At which x coordinate (in pixels) does the widget’s left edge sit?',
      answer: '200',
      hint: 'Left edge = relx * container width + x, because the anchor is the top-left corner.',
      explanation: '0.5 * 500 - 50 = 200. The widget occupies x = 200 to 300, so it is centered in the 500 pixel container: the same result as `relx=0.5, anchor="center"`, written with pixels.',
      label: 'Left edge:',
    },
    {
      kind: 'concept',
      title: 'Your turn: groups, overlays and hide/show',
      blocks: [
        {
          type: 'p',
          text: 'The exercises use the stand-in, which records layout options for `place`, `pack` and `grid`. You verify them with `place_info()`, `pack_info()`, `grid_info()` and `winfo_manager()`. Note that `place_info()` reports its values as **strings** (such as `"0.5"`), so convert them with `float()` before comparing.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_group(parent, title, items)`. Create a `LabelFrame` in `parent` with the text `title`, pack it with `fill="x"` and `padx=10`, and put one `Label` for each item inside it (packed with `anchor="w"`). Return the LabelFrame.',
      starter: `import tkinter as tk


def make_group(parent, title, items):
    ...
`,
      solution: `import tkinter as tk


def make_group(parent, title, items):
    group = tk.LabelFrame(parent, text=title)
    group.pack(fill="x", padx=10)
    for item in items:
        tk.Label(group, text=item).pack(anchor="w")
    return group
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
g = make_group(root, "Options", ["Sound", "Music", "Video"])
assert isinstance(g, tk.LabelFrame)
assert g.cget("text") == "Options"
info = g.pack_info()
assert info["fill"] == "x" and info["padx"] in (10, (10, 10), "10")
kids = g.winfo_children()
assert [k.cget("text") for k in kids] == ["Sound", "Music", "Video"]
assert all(isinstance(k, tk.Label) and k.pack_info()["anchor"] == "w" for k in kids)
assert make_group(root, "Empty", []).winfo_children() == []`,
      checks: ['Creates a `LabelFrame` with the given title and packs it with `fill="x"` and `padx=10`', 'Creates a `Label` per item **inside the group**, packed with `anchor="w"`', 'Returns the LabelFrame'],
      hint: 'The labels’ parent must be the LabelFrame (`tk.Label(group, text=item)`), not `parent`. Pack the group before or after filling it; the result is the same.',
      explanation: 'A LabelFrame is simply a Frame with a border and a caption, so it can contain any layout. Because the labels have the group as their parent, they move with it when the group is packed elsewhere.',
    },
    {
      kind: 'code',
      prompt: 'Write `center_widget(widget)` that centers a widget in its parent using `place` with relative coordinates and an anchor, so that it stays centered when the window is resized. Return the widget.',
      starter: `import tkinter as tk


def center_widget(widget):
    ...
`,
      solution: `import tkinter as tk


def center_widget(widget):
    widget.place(relx=0.5, rely=0.5, anchor="center")
    return widget
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
label = tk.Label(root, text="Loading...")
assert center_widget(label) is label
assert label.winfo_manager() == "place"
info = label.place_info()
assert float(info["relx"]) == 0.5 and float(info["rely"]) == 0.5
assert info["anchor"] == "center"
other = tk.Button(root, text="Go")
center_widget(other)
assert other.winfo_manager() == "place" and other.place_info()["anchor"] == "center"`,
      checks: ['Uses `place` with `relx=0.5` and `rely=0.5`', 'Sets `anchor="center"`, so the widget’s middle is at that point', 'Returns the same widget'],
      hint: 'One call: `widget.place(relx=0.5, rely=0.5, anchor="center")`, and then `return widget`.',
      explanation: 'Relative coordinates track the container’s size, and the anchor moves the widget’s own centre to the target point: together they keep the widget centered at every window size.',
    },
    {
      kind: 'code',
      prompt: 'Write `toggle_visible(widget)` for a **gridded** widget. If it is currently shown (it has a geometry manager), hide it with `grid_remove()`; if it is hidden, show it again with `grid()` so that it returns to its **original row and column**.',
      starter: `import tkinter as tk


def toggle_visible(widget):
    ...
`,
      solution: `import tkinter as tk


def toggle_visible(widget):
    if widget.winfo_manager():
        widget.grid_remove()
    else:
        widget.grid()
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
panel = tk.Frame(root)
panel.pack()
note = tk.Label(panel, text="Advanced")
note.grid(row=3, column=2, sticky="w", padx=7)
assert note.winfo_manager() == "grid"
toggle_visible(note)
assert note.winfo_manager() == "", "hidden"
toggle_visible(note)
assert note.winfo_manager() == "grid", "shown again"
gi = note.grid_info()
assert (gi["row"], gi["column"]) == (3, 2), "grid_remove must remember the position"
assert gi["sticky"] == "w" and gi["padx"] in (7, (7, 7), "7")
toggle_visible(note)
toggle_visible(note)
assert note.grid_info()["row"] == 3`,
      checks: ['Hides a visible widget with `grid_remove()` (not `grid_forget()`)', 'Shows a hidden widget again with a plain `grid()`', 'The widget returns to its original row, column and options'],
      hint: '`widget.winfo_manager()` returns an empty string when the widget is not managed. Use `grid_remove()` to hide it and a plain `grid()` to restore it.',
      explanation: '`grid_remove()` remembers the options that `grid_forget()` throws away, so a bare `grid()` puts the widget back exactly where it was. This is the standard way to build collapsible panels and error messages.',
    },
  ],
  takeaways: [
    'A **Frame** groups widgets, and each container can use its own geometry manager (pack in one frame, grid in another). A **LabelFrame** adds a border and a title. Frames shrink to fit their contents unless you call `pack_propagate(False)` or `grid_propagate(False)`.',
    '**place** uses coordinates: absolute (`x`, `y`, `width`, `height` in pixels) and relative (`relx`, `rely`, `relwidth`, `relheight` as fractions), added together, with an `anchor`. `relx=0.5, rely=0.5, anchor="center"` always centers.',
    'Use place for overlays, badges and centered messages. It does not take part in pack or grid layouts (so it can be mixed with them), but fixed pixel positions do not adapt to window size, fonts or DPI.',
    'For multi-page windows, grid several frames in the **same cell** and bring one forward with `frame.tkraise()`. Capture loop variables in lambdas with a default argument (`lambda n=name: ...`).',
    'Hide with `grid_remove()` (remembers position) or `grid_forget()` / `pack_forget()` (forgets); a re-packed widget goes to the **end** of the packing order unless you use `before=` or `after=`.',
  ],
  reading: [
    { title: 'TkDocs: Widget placement and the place geometry manager', url: 'https://tkdocs.com/tutorial/grid.html', source: 'tutorial', note: 'A good companion to the grid chapter, with advice on keeping layouts flexible.' },
    { title: 'Tk manual: place', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/place.htm', source: 'docs', note: 'Absolute and relative placement, anchors and border modes.' },
    { title: 'Tk manual: frame and labelframe', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/frame.htm', source: 'docs', note: 'Frame options, including the pack_propagate behaviour described in the geometry manager pages.' },
    { title: 'Python docs: tkinter, handy reference (setting options and geometry managers)', url: 'https://docs.python.org/3/library/tkinter.html#handy-reference', source: 'docs', note: 'How options are named in Python and a summary of the geometry managers.' },
  ],
};
