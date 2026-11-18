import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-canvas',
  title: 'The Canvas: Drawing Shapes',
  summary: 'Draw lines, rectangles, ovals, polygons, text and arcs on a Canvas, understand its coordinate system, and use item ids and tags to move, recolor, find, click and delete what you drew.',
  minutes: 36,
  objectives: [
    'Create a `Canvas` and draw with `create_line`, `create_rectangle`, `create_oval`, `create_polygon`, `create_arc` and `create_text`',
    'Use the canvas coordinate system (origin top-left, y pointing down) and the bounding-box rule for ovals and rectangles',
    'Style items with `fill`, `outline`, `width`, `dash`, `arrow` and `font`',
    'Change drawings with item ids and tags: `coords`, `move`, `itemconfig`, `delete`, `bbox`',
    'Find items with `find_overlapping`, and make a shape clickable with `tag_bind`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A canvas of objects',
      blocks: [
        {
          type: 'p',
          text: 'A [[canvas-widget|Canvas]] is a rectangular area for drawing. It is the tool for charts, diagrams, board games, simple animations and custom controls. The key idea is that a canvas does not store pixels: it stores **objects**. Every shape you draw is a [[canvas-item|canvas item]], and `create_*` returns an integer **id** that you can use later to move it, recolor it, ask where it is, or delete it. Tk redraws the items for you whenever the window needs it.',
        },
        {
          type: 'p',
          text: 'Positions are in **pixels** measured from the **top-left corner** of the canvas: `x` grows to the right and, unlike in maths class, **`y` grows downward**. A rectangle or oval is given by two opposite corners, `(x1, y1, x2, y2)`, and an oval is drawn **inside** that bounding box. Lines and polygons take as many `x, y` pairs as you like.',
        },
        {
          type: 'code',
          title: 'doodle_pad.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Doodle pad")
canvas = tk.Canvas(root, width=480, height=320, bg="white", highlightthickness=1,
                   highlightbackground="#888")
canvas.pack(padx=10, pady=10)
color = "black"
last = None

canvas.create_rectangle(20, 20, 120, 80, fill="gold", outline="black", width=2)
canvas.create_oval(160, 20, 260, 80, fill="tomato")
canvas.create_line(300, 20, 460, 80, width=4, arrow="last")
canvas.create_polygon(40, 280, 100, 280, 70, 200, fill="seagreen")
canvas.create_text(240, 300, text="Draw with the left mouse button", font=("Segoe UI", 11))


def press(event):
    global last
    last = (event.x, event.y)


def drag(event):
    global last
    x0, y0 = last
    canvas.create_line(x0, y0, event.x, event.y, fill=color, width=3,
                       capstyle="round", tags="stroke")
    last = (event.x, event.y)


def clear():
    canvas.delete("stroke")


canvas.bind("<ButtonPress-1>", press)
canvas.bind("<B1-Motion>", drag)
tk.Button(root, text="Clear strokes", command=clear).pack(pady=(0, 10))
root.mainloop()`,
          annotations: [
            { lines: '5-7', text: 'A `Canvas` has a fixed pixel size. `bg` is the background and `highlightthickness` the border drawn around it.' },
            { lines: '11-12', text: 'Rectangles and ovals both use the corner pair `(x1, y1, x2, y2)`. `fill` colors the inside and `outline` the border (`outline=""` removes it).' },
            { lines: 13, text: 'A line is a list of points. `width` is the thickness and `arrow="last"` puts an arrowhead at the final point.' },
            { lines: '14-15', text: 'A polygon is closed automatically. `create_text` places text **centered** on its point by default, and takes a `font` tuple.' },
            { lines: '23-28', text: 'Freehand drawing is many short line items: each mouse movement adds one segment from the previous position, tagged `"stroke"`. The tag lets `clear` delete all of them at once.' },
            { lines: '35-36', text: '`<B1-Motion>` fires while the left button is held and the mouse moves. Both events carry the pointer position as `event.x` and `event.y`, relative to the canvas.' },
          ],
        },
        {
          type: 'table',
          headers: ['Method', 'Coordinates', 'Useful options'],
          rows: [
            ['`create_line`', '`x1, y1, x2, y2, ...` (two or more points)', '`fill` (the color), `width`, `dash=(4, 2)`, `arrow`, `capstyle`, `smooth`'],
            ['`create_rectangle`', '`x1, y1, x2, y2`', '`fill`, `outline`, `width`, `dash`'],
            ['`create_oval`', '`x1, y1, x2, y2` (the bounding box)', '`fill`, `outline`, `width`'],
            ['`create_polygon`', '`x1, y1, x2, y2, x3, y3, ...`', '`fill` (black by default!), `outline`, `smooth`'],
            ['`create_arc`', '`x1, y1, x2, y2` (box of the full ellipse)', '`start`, `extent` (degrees), `style` (`pieslice`, `chord`, `arc`)'],
            ['`create_text`', '`x, y`', '`text`, `font`, `fill`, `anchor` (`"center"` by default), `width` (wrap)'],
            ['`create_image`', '`x, y`', '`image` (a `PhotoImage`), `anchor`'],
          ],
          caption: 'Item types. Coordinates can be given as separate numbers, or as one list or tuple of numbers.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a canvas keeps objects, not pixels',
          text: 'Because every shape is an item with an id, a canvas lets you write `canvas.move(ball, 5, 0)` instead of erasing and repainting pixels yourself, and it can tell you which item was clicked. It also redraws automatically when the window is uncovered or resized. The price is speed: thousands of items become slow, and that is the point at which games switch to pygame, which draws pixels directly.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Keep a reference to an image',
          text: '`create_image` does not keep the `PhotoImage` alive: if the only variable that holds it goes out of scope, the picture silently disappears. Store the image somewhere that lives as long as the canvas: a global, an attribute (`canvas.photo = photo`) or a list.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What do the four numbers in `canvas.create_oval(100, 50, 300, 150)` mean?',
      options: [
        { text: 'The corners of the bounding box that contains the oval: (100, 50) top-left and (300, 150) bottom-right', correct: true, why: 'An oval (and a circle) is described by the rectangle that just encloses it. This one is 200 pixels wide and 100 pixels tall, with its center at (200, 100).' },
        { text: 'The center (100, 50) followed by the radii 300 and 150', why: 'The canvas has no center-and-radius form: you must compute the box yourself, `(cx - r, cy - r, cx + r, cy + r)`.' },
        { text: 'The x, y position followed by the width and height (300 by 150)', why: 'The second pair is a corner, not a size. The size is `x2 - x1` by `y2 - y1`, which is 200 by 100 here.' },
        { text: 'Two points on the edge of the oval', why: 'The corners of the box are not on the oval; only the middle of each side of the box touches it.' },
      ],
      explanation: 'Rectangles and ovals share the same `(x1, y1, x2, y2)` form. To draw a circle with center `(cx, cy)` and radius `r`, use `create_oval(cx - r, cy - r, cx + r, cy + r)`.',
    },
    {
      kind: 'truefalse',
      prompt: 'On a canvas, the point (0, 0) is at the bottom-left corner and `y` grows upward, like a graph in maths.',
      answer: false,
      explanation: 'False. The origin is the **top-left** corner, `x` grows to the right and **`y` grows downward**, as in most computer graphics. To draw a bar that “grows up” from a baseline you subtract the height from the baseline’s y.',
    },
    {
      kind: 'concept',
      title: 'Items, ids and tags',
      blocks: [
        {
          type: 'p',
          text: 'Anything you want to change later needs a handle. The **id** returned by `create_*` is one; a [[canvas-tag|tag]] is another and can mark many items at once (`tags="enemy"` or `tags=("enemy", "fast")`). Every method below accepts an id **or a tag**, and the tag `"all"` means every item on the canvas.',
        },
        {
          type: 'table',
          headers: ['Call', 'What it does'],
          rows: [
            ['`canvas.coords(item)`', 'Returns the item’s coordinates as a list of **floats**. With numbers: `coords(item, x1, y1, x2, y2)` sets them'],
            ['`canvas.move(item, dx, dy)`', 'Shifts the item (or every item with that tag) by an offset'],
            ['`canvas.itemconfig(item, fill="red")`', 'Changes options. `itemcget(item, "fill")` reads one back, always as a **string** (`"1.0"` for a width)'],
            ['`canvas.delete(item)`', 'Removes an item, a tag or everything (`delete("all")`)'],
            ['`canvas.bbox(item)`', 'The bounding box `(x1, y1, x2, y2)` in whole pixels, **including the outline**, or `None`'],
            ['`canvas.find_all()`, `find_withtag(tag)`', 'Tuples of ids, **bottom to top** in drawing order'],
            ['`canvas.find_overlapping(x1, y1, x2, y2)`', 'Ids of items touching a rectangle. A single point is `(x, y, x, y)`'],
            ['`canvas.tag_raise(item)`, `tag_lower(item)`', 'Change the stacking order (later items are drawn on top)'],
            ['`canvas.tag_bind(item, "<Button-1>", func)`', 'Make an item react to a mouse event, separately from the canvas'],
          ],
          caption: 'The Canvas item toolbox. Item ids are never reused, even after a delete.',
        },
        {
          type: 'p',
          text: 'A lot of canvas code is just geometry, and that part is plain Python that you can test without any window. These helpers turn a circle (center and radius) into the box that `create_oval` needs, and back again:',
        },
        {
          type: 'code',
          title: 'geometry.py',
          runnable: true,
          code: `def circle_box(cx, cy, r):
    return (cx - r, cy - r, cx + r, cy + r)


def center(box):
    x1, y1, x2, y2 = box
    return ((x1 + x2) / 2, (y1 + y2) / 2)


box = circle_box(100, 80, 30)
print("oval box:", box)
print("center:", center(box))
print("width x height:", box[2] - box[0], "x", box[3] - box[1])`,
          output: `oval box: (70, 50, 130, 110)
center: (100.0, 80.0)
width x height: 60 x 60`,
          annotations: [
            { lines: '1-2', text: 'Moving 30 pixels left and up gives the top-left corner, 30 right and down the bottom-right one.' },
            { lines: '5-7', text: 'The center of a box is the average of its corners. `/` returns floats, matching what `canvas.coords` returns.' },
          ],
        },
        {
          type: 'p',
          text: 'Two details cause most “my shape does nothing” surprises. First, **stacking order**: items are painted in creation order, so a background rectangle created last hides everything. Second, hit testing follows the drawing: an item with `fill=""` (hollow) is only found at its **outline**, not inside, so a clickable shape needs a fill. Use `fill="white"` (or `fill=canvas["bg"]`) instead of an empty fill when you want an invisible-looking but clickable box.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that draws a red circle and then shifts it 10 pixels to the right.',
      template: `ball = canvas.create_oval(50, 50, 150, 150, ___="red")
canvas.___(ball, 10, 0)`,
      templateIsCode: true,
      blanks: [{ answers: ['fill'] }, { answers: ['move'] }],
      wordBank: ['fill', 'move', 'outline', 'coords', 'delete'],
      explanation: '`fill` colors the inside of a shape (`outline` colors its border). `move(item, dx, dy)` shifts an item by an offset; `coords` would **replace** its position instead.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this canvas arithmetic. It uses the corners of a rectangle drawn as `create_rectangle(20, 30, 120, 80)`.',
      code: `x1, y1, x2, y2 = 20, 30, 120, 80
print(x2 - x1, y2 - y1)
print((x1 + x2) // 2, (y1 + y2) // 2)`,
      answer: '100 50\n70 55',
      hint: 'The first line is the width and the height, the second line is the center.',
      explanation: 'The rectangle is 100 pixels wide (120 - 20) and 50 tall (80 - 30). Its center is the average of the corners: x = (20 + 120) // 2 = 70 and y = (30 + 80) // 2 = 55.',
    },
    {
      kind: 'concept',
      title: 'Hit testing and clickable items',
      blocks: [
        {
          type: 'p',
          text: 'Two ways to react to the mouse. **`canvas.bind`** reports every click on the canvas, and you decide what was hit with `find_overlapping(event.x, event.y, event.x, event.y)`. **`canvas.tag_bind(item_or_tag, "<Button-1>", handler)`** reports a click only when it lands on **that item (or a tagged group)**, so Tk does the hit test for you. When items overlap, only the **topmost** one receives the tag event. Tag bindings run **before** the canvas’s own binding.',
        },
        {
          type: 'code',
          title: 'clickable_cards.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Clickable cards")
canvas = tk.Canvas(root, width=360, height=140, bg="#f4f4f4")
canvas.pack(padx=10, pady=10)
status = tk.Label(root, text="Click a card")
status.pack(pady=(0, 10))

for i, name in enumerate(["red", "green", "blue"]):
    x = 20 + i * 115
    card = canvas.create_rectangle(x, 20, x + 100, 120, fill=name, tags="card")
    canvas.create_text(x + 50, 70, text=name.title(), fill="white", tags="card")


def clicked(event):
    items = canvas.find_overlapping(event.x, event.y, event.x, event.y)
    top = items[-1]
    status.config(text=f"Clicked item {top} of type {canvas.type(top)}")


canvas.tag_bind("card", "<Button-1>", clicked)
root.mainloop()`,
          annotations: [
            { lines: '10-13', text: 'Every card is a rectangle plus its label. Both get `tags="card"`, so one `tag_bind` call covers all six items.' },
            { lines: '16-19', text: '`find_overlapping` with a point returns the ids under it **from bottom to top**, so `[-1]` is the topmost item: the text label if the click was on it, otherwise the rectangle.' },
            { lines: 22, text: 'The handler receives the usual event object, with `x` and `y` relative to the canvas.' },
          ],
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `_tkinter.TclError: wrong # coordinates: expected 0 or 4, got 3`. Tap the line that raises it.',
      lines: [
        'canvas = tk.Canvas(root, width=200, height=100)',
        'canvas.pack()',
        'canvas.create_rectangle(10, 10, 50)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'A rectangle needs two full corners, four numbers. The third line gives only `x1, y1, x2`, so Tk reports the wrong coordinate count. (A line needs an even number of coordinates, a polygon at least two points.)',
    },
    {
      kind: 'numeric',
      prompt: 'What is the x-coordinate of the center of the oval created by `canvas.create_oval(100, 50, 300, 150)`?',
      answer: '200',
      hint: 'Average the two x values of the box.',
      explanation: 'The center of the bounding box is at ((100 + 300) / 2, (50 + 150) / 2) = (200, 100), so the x-coordinate is 200.',
      label: 'x =',
    },
    {
      kind: 'concept',
      title: 'Your turn: drawing with code',
      blocks: [
        {
          type: 'p',
          text: 'The exercises draw on a stand-in canvas that keeps the same items, ids, coordinates, tags, stacking order and hit testing as the real one, but draws nothing. Your tests can therefore check the items you created: `coords`, `itemcget`, `find_withtag`, `find_overlapping` and even `event_generate("<Button-1>", x=..., y=...)` for clicks. Remember that `coords` returns floats and `itemcget` returns strings.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `draw_grid(canvas, width, height, step)`. Draw the vertical lines at `x = step, 2*step, ...` below `width` (each from `y = 0` to `y = height`) and the horizontal lines at `y = step, 2*step, ...` below `height` (each from `x = 0` to `x = width`). All lines must have `fill="#cccccc"` and `tags="grid"`. Return the number of lines drawn.',
      starter: `import tkinter as tk


def draw_grid(canvas, width, height, step):
    ...
`,
      solution: `import tkinter as tk


def draw_grid(canvas, width, height, step):
    count = 0
    for x in range(step, width, step):
        canvas.create_line(x, 0, x, height, fill="#cccccc", tags="grid")
        count += 1
    for y in range(step, height, step):
        canvas.create_line(0, y, width, y, fill="#cccccc", tags="grid")
        count += 1
    return count
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
c = tk.Canvas(root, width=100, height=60)
c.pack()
n = draw_grid(c, 100, 60, 20)
assert n == 6, n
lines = c.find_withtag("grid")
assert len(lines) == 6 and len(c.find_all()) == 6
assert all(c.type(i) == "line" for i in lines)
assert all(c.itemcget(i, "fill") == "#cccccc" for i in lines)
coords = sorted(tuple(c.coords(i)) for i in lines)
assert (20.0, 0.0, 20.0, 60.0) in coords and (80.0, 0.0, 80.0, 60.0) in coords
assert (0.0, 20.0, 100.0, 20.0) in coords and (0.0, 40.0, 100.0, 40.0) in coords
assert (0.0, 0.0, 0.0, 60.0) not in coords, "no line on the border at 0"
c2 = tk.Canvas(root, width=50, height=50)
assert draw_grid(c2, 50, 50, 100) == 0 and c2.find_all() == ()`,
      checks: ['Vertical lines run from `y = 0` to `y = height`, horizontal lines from `x = 0` to `x = width`', 'The lines start at `step` (none on the border at 0) and stop before `width` or `height`', 'Every line has `fill="#cccccc"` and `tags="grid"`, and the function returns how many were drawn'],
      hint: 'Use `range(step, width, step)` for the x positions and `range(step, height, step)` for the y positions, and add one to a counter for each `create_line`.',
      explanation: '`range(step, width, step)` gives the multiples of `step` that are below `width`. The `"grid"` tag matters later: `canvas.delete("grid")` or `canvas.tag_lower("grid")` then handles the whole grid in one call.',
    },
    {
      kind: 'code',
      prompt: 'Write `bar_chart(canvas, values, width, height, margin=10)`. The drawing area is the canvas minus `margin` on every side. Split its width into `len(values)` equal slots; in slot `i` draw a rectangle `fill="steelblue"` whose left edge is the slot’s left edge and whose width is `0.8 * slot`. The baseline is `y = height - margin`. A bar’s height is `value / max(values) * (height - 2 * margin)`, and its top is the baseline minus that height. Return the list of rectangle ids.',
      starter: `import tkinter as tk


def bar_chart(canvas, values, width, height, margin=10):
    ...
`,
      solution: `import tkinter as tk


def bar_chart(canvas, values, width, height, margin=10):
    slot = (width - 2 * margin) / len(values)
    base = height - margin
    top_value = max(values)
    ids = []
    for i, value in enumerate(values):
        x1 = margin + i * slot
        bar_height = value / top_value * (height - 2 * margin)
        ids.append(canvas.create_rectangle(x1, base - bar_height, x1 + 0.8 * slot, base, fill="steelblue"))
    return ids
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
c = tk.Canvas(root, width=100, height=120)
c.pack()
ids = bar_chart(c, [2, 4, 1, 3], 100, 120)
assert len(ids) == 4 and all(c.type(i) == "rectangle" for i in ids)
expected = [
    (10, 60, 26, 110),
    (30, 10, 46, 110),
    (50, 85, 66, 110),
    (70, 35, 86, 110),
]
for i, want in zip(ids, expected):
    got = c.coords(i)
    assert all(abs(a - b) < 1e-6 for a, b in zip(got, want)), (got, want)
    assert c.itemcget(i, "fill") == "steelblue"
c2 = tk.Canvas(root, width=100, height=100)
single = bar_chart(c2, [5], 100, 100, margin=0)
got = c2.coords(single[0])
assert all(abs(a - b) < 1e-6 for a, b in zip(got, (0, 0, 80, 100))), got`,
      checks: ['Each bar uses a slot of `(width - 2 * margin) / len(values)` and is 80% of the slot wide', 'Bars stand on the baseline `height - margin`, and the tallest one fills the whole drawing height', 'Returns the ids of the rectangles, in order, filled `"steelblue"`'],
      hint: 'Compute `slot`, `base` and `max(values)` once. In the loop: `x1 = margin + i * slot`, then `create_rectangle(x1, base - bar_height, x1 + 0.8 * slot, base, fill="steelblue")`.',
      explanation: 'A chart is only a mapping from data to coordinates. Because `y` grows downward, a taller bar has a **smaller** top y: `base - bar_height`. Scaling by `max(values)` makes the tallest bar fill the area regardless of the units.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_toggle(canvas, item, on="green", off="red")`. It binds a left click (`"<Button-1>"`) **on that item only** using `canvas.tag_bind`: each click switches the item’s `fill` to `on` if its current fill is `off`, and to `off` otherwise.',
      starter: `import tkinter as tk


def make_toggle(canvas, item, on="green", off="red"):
    ...
`,
      solution: `import tkinter as tk


def make_toggle(canvas, item, on="green", off="red"):
    def flip(event):
        if canvas.itemcget(item, "fill") == off:
            canvas.itemconfig(item, fill=on)
        else:
            canvas.itemconfig(item, fill=off)

    canvas.tag_bind(item, "<Button-1>", flip)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
c = tk.Canvas(root, width=200, height=100)
c.pack()
root.update()
a = c.create_rectangle(10, 10, 60, 60, fill="red")
b = c.create_rectangle(100, 10, 150, 60, fill="red")
make_toggle(c, a)
c.event_generate("<Button-1>", x=30, y=30)
assert c.itemcget(a, "fill") == "green", c.itemcget(a, "fill")
c.event_generate("<Button-1>", x=30, y=30)
assert c.itemcget(a, "fill") == "red"
c.event_generate("<Button-1>", x=120, y=30)
assert c.itemcget(b, "fill") == "red", "only the bound item reacts"
c.event_generate("<Button-1>", x=190, y=90)
assert c.itemcget(a, "fill") == "red"
make_toggle(c, b, on="gold", off="red")
c.event_generate("<Button-1>", x=120, y=30)
assert c.itemcget(b, "fill") == "gold"
c.event_generate("<Button-1>", x=30, y=30)
assert c.itemcget(a, "fill") == "green"`,
      checks: ['Uses `canvas.tag_bind(item, "<Button-1>", handler)` rather than `canvas.bind`', 'The handler reads the current fill with `itemcget` and switches between `on` and `off` with `itemconfig`', 'Clicks outside the item, or on other items, change nothing'],
      hint: 'Define an inner function `flip(event)` that compares `canvas.itemcget(item, "fill")` with `off`, and call `canvas.tag_bind(item, "<Button-1>", flip)`.',
      explanation: 'The handler is a **closure**: it remembers `canvas`, `item`, `on` and `off` from the enclosing call, so one function can make any number of independent toggles. `tag_bind` makes Tk do the hit test, so there is no `find_overlapping` and no coordinate arithmetic in your code.',
    },
  ],
  takeaways: [
    'A `Canvas` keeps **items** (objects), not pixels. Each `create_*` call returns an integer id that stays valid until the item is deleted, and ids are never reused.',
    'The origin is the **top-left**, and **`y` grows downward**. Rectangles, ovals and arcs use the corner pair `(x1, y1, x2, y2)`: for a circle use `(cx - r, cy - r, cx + r, cy + r)`.',
    'Style with `fill` (inside), `outline`, `width`, `dash`, `arrow`, `font`. A polygon’s default fill is black. `coords` returns floats and `itemcget` returns strings.',
    'Change the drawing, not the pixels: `coords`, `move`, `itemconfig`, `delete`, `tag_raise`. A **tag** lets one call affect a whole group, and `"all"` means everything.',
    '`find_overlapping(x, y, x, y)` lists the items under a point from bottom to top. Hollow shapes (`fill=""`) are only hit on their outline. `tag_bind` makes one item or group clickable.',
  ],
  reading: [
    { title: 'TkDocs: Canvas', url: 'https://tkdocs.com/tutorial/canvas.html', source: 'tutorial', note: 'Creating items, tags, bindings, scrolling and the canvas coordinate system.' },
    { title: 'Python docs: tkinter.Canvas', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'How tkinter wraps the Tk canvas command.' },
    { title: 'Tk manual: canvas', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/canvas.htm', source: 'docs', note: 'Every item type, option and canvas command, with the exact rules for hit testing.' },
    { title: 'Tk manual: colors', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/colors.htm', source: 'docs', note: 'The full list of named colors that fill and outline accept.' },
  ],
};
