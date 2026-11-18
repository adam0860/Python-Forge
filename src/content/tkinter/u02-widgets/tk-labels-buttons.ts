import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-labels-buttons',
  title: 'Labels, Buttons and Commands',
  summary: 'The two most-used widgets in detail: show and style text with Label, make things happen with Button. Learn the common options (font, colours, size units, state), how to disable and re-enable a button, and the “pack() returns None” bug that catches everyone once.',
  minutes: 27,
  objectives: [
    'Create labels with fonts, colours, wrapping, alignment and relief',
    'Explain that `width` and `height` of text widgets are measured in characters and lines, not pixels',
    'Make a button run a function, disable and re-enable it, and press it from code with `invoke()`',
    'Avoid `label = tk.Label(...).pack()`, which stores `None` instead of the widget',
    'Use the options that almost every widget shares: `padx`, `pady`, `relief`, `cursor`, `anchor` and `state`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Label: showing text',
      blocks: [
        {
          type: 'p',
          text: 'A **Label** displays text (or an image) that the user cannot edit. It is the workhorse for headings, captions, status lines and results. Everything about its look comes from options given at creation or changed later with `config()`:',
        },
        {
          type: 'code',
          title: 'labels.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Labels")

tk.Label(root, text="Plain label").pack()
tk.Label(root, text="Big and bold", font=("Segoe UI", 18, "bold"), fg="#14532d").pack(pady=4)
tk.Label(root, text="White on green", fg="white", bg="#16a34a", padx=12, pady=6).pack(pady=4)
tk.Label(
    root,
    text="This long text wraps onto several lines because wraplength is set in pixels.",
    wraplength=220,
    justify="left",
).pack(pady=4)
tk.Label(root, text="Sunken, fixed width", relief="sunken", bd=2, width=24, anchor="w").pack(pady=4)

root.mainloop()`,
          annotations: [
            { lines: 6, text: 'The smallest label: just `text`. It is as big as its text.' },
            { lines: 7, text: '`font` is a tuple `(family, size, style)`. The size is in points, the style can combine words such as `"bold italic"`. `fg` is the text (foreground) colour.' },
            { lines: 8, text: '`bg` is the background; `padx` and `pady` add **pixels** of empty space inside the label, around its text.' },
            { lines: '9-14', text: 'A long text stays on one line (and makes the window very wide) unless `wraplength` gives a width **in pixels** at which to wrap. `justify` aligns the lines of a multi-line text *within* the label.' },
            { lines: 15, text: '`relief` draws a 3D border (`flat`, `raised`, `sunken`, `groove`, `ridge`, `solid`) with thickness `bd`. `width=24` is **24 characters**, not pixels, and `anchor="w"` pins the text to the west (left) side of that wider box.' },
          ],
        },
        {
          type: 'table',
          headers: ['Option', 'Meaning', 'Typical values'],
          rows: [
            ['`text`', 'The text shown', '`"Hello"`, or `"Line 1\\nLine 2"` for several lines'],
            ['`font`', 'Typeface, size, style', '`("Arial", 12)`, `("Consolas", 11, "bold")`'],
            ['`fg` / `bg`', 'Text colour / background colour', 'Names (`"red"`) or hex (`"#ff8800"`)'],
            ['`width`, `height`', 'Size in **characters** and **lines** (pixels if the label shows an image)', '`width=30`'],
            ['`padx`, `pady`', 'Extra space inside the widget, in pixels', '`padx=10`'],
            ['`anchor`', 'Where the text sits inside a larger label', '`"w"`, `"e"`, `"center"`, `"nw"`…'],
            ['`justify`', 'Alignment of the lines of multi-line text', '`"left"`, `"center"`, `"right"`'],
            ['`wraplength`', 'Width in pixels at which text wraps', '`wraplength=300`'],
            ['`relief`, `bd`', 'Border style and thickness', '`relief="groove"`, `bd=2`'],
            ['`cursor`', 'Mouse pointer when over the widget', '`"hand2"`, `"watch"`'],
            ['`image`, `compound`', 'Show a picture, and where the text goes relative to it', '`image=photo`, `compound="left"`'],
          ],
          caption: 'Options shared by Label and Button (and, with small differences, most other widgets).',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Characters, lines and pixels',
          text: 'Sizes in tkinter come in two kinds. For text widgets (`Label`, `Button`, `Entry`, `Text`, `Listbox`) `width` and `height` count **characters** and **lines** of the widget’s font. Space around things (`padx`, `pady`, `bd`, `wraplength`) is in **pixels**. Mixing them up is the most common reason that a widget is “much too wide”. A label that shows an image is the exception: its `width` and `height` are pixels.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A label is created with `tk.Label(root, text="Hi", width=30)`. What does `width=30` mean?',
      options: [
        { text: 'The label is as wide as 30 characters of its font', correct: true, why: 'For text widgets, `width` is measured in characters (of the current font), so the label gets a width that fits roughly 30 average characters.' },
        { text: 'The label is exactly 30 pixels wide', why: 'Pixels are used for `padx`, `pady`, `wraplength` and the width of image labels. A text label counts characters.' },
        { text: 'The text is cut off after 30 characters', why: 'It sets the size of the label, not the length of the text. Longer text is not truncated by `width`; it makes the label wider (or wraps if `wraplength` is set).' },
        { text: 'The label has 30 pixels of padding', why: 'Padding is `padx` and `pady`.' },
      ],
      explanation: 'Remember the rule: `width` and `height` of text-based widgets are in **characters** and **lines**; `padx`, `pady` and `wraplength` are in pixels.',
    },
    {
      kind: 'concept',
      title: 'Button: making things happen',
      blocks: [
        {
          type: 'p',
          text: 'A **Button** looks like a Label that can be pressed. It shares most options with Label and adds the important one you met in the last lesson, `command`: a function called with no arguments every time the button is pressed. Two more things make buttons useful in real programs: the `state` option, which can switch a button on and off, and the `invoke()` method, which presses it from code.',
        },
        {
          type: 'code',
          title: 'button_states.py',
          desktopOnly: true,
          code: `import tkinter as tk


def start():
    button.config(state="disabled", text="Working...")
    root.after(2000, finish)


def finish():
    button.config(state="normal", text="Start")


root = tk.Tk()
button = tk.Button(root, text="Start", width=14, command=start)
button.pack(padx=30, pady=30)
root.mainloop()`,
          annotations: [
            { lines: 5, text: 'Pressing the button immediately **disables** it, so that the user cannot start the job twice, and changes its text. Two options are changed in one `config` call.' },
            { lines: 6, text: 'The “work” is represented by a timer. `after(2000, finish)` calls `finish` in two seconds without blocking the window.' },
            { lines: 10, text: 'When the job is done the button is enabled again and gets its old text. The program’s state is shown by the **widget options themselves**.' },
            { lines: 14, text: '`command=start` is the function, without parentheses. `width=14` makes the button wide enough for both texts so that it does not change size.' },
          ],
        },
        {
          type: 'table',
          headers: ['Button feature', 'What it does'],
          rows: [
            ['`command=func`', 'Called without arguments when the button is pressed (mouse click, or space/Enter when it has focus)'],
            ['`state="disabled"`', 'Greys the button out and ignores clicks. `state="normal"` enables it again (`tk.DISABLED` and `tk.NORMAL` are the same strings)'],
            ['`button.invoke()`', 'Does what a click does (calls the command) and returns the command’s result. A disabled button does nothing'],
            ['`button.flash()`', 'Briefly flashes the button, e.g. to give feedback after a keyboard shortcut'],
            ['`default="active"`', 'Marks the “default” button, drawn with a special border'],
            ['`image=photo, compound="top"`', 'A button with an icon, with the text below it'],
          ],
          caption: 'A disabled button’s command is never called, which is exactly what you want while work is in progress.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why show state in widget options',
          text: 'A user needs to see what is possible right now. Disabling a button while a job runs, or until a form is valid, makes wrong actions *impossible* instead of reporting an error afterwards. It is also cheaper for you: you do not have to write the check “is a job already running?” in every callback, because the callback cannot be called.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Setting `state="disabled"` on a button greys it out and stops the user from triggering its command by clicking.',
      answer: true,
      explanation: 'True. A disabled button ignores clicks and key presses, and `invoke()` does nothing either. Set `state="normal"` to enable it again.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the line that disables the button and changes its text while a job runs.',
      template: `button.___(state=___, text="Working...")`,
      templateIsCode: true,
      blanks: [{ answers: ['config', 'configure'] }, { answers: ['"disabled"', "'disabled'", 'tk.DISABLED', 'DISABLED'] }],
      wordBank: ['config', 'cget', '"disabled"', '"normal"', 'invoke'],
      explanation: '`config(...)` changes options after creation, and `state="disabled"` (or the constant `tk.DISABLED`) disables the button. `"normal"` would be the opposite.',
    },
    {
      kind: 'concept',
      title: 'The bug that catches everyone: pack() returns None',
      blocks: [
        {
          type: 'p',
          text: 'You will see this line in countless tutorials: `tk.Label(root, text="Hi").pack()`. It is fine when you do not need the widget again. But the moment you write `label = tk.Label(root, text="Hi").pack()` you have a bug: `pack()`, like `grid()` and `place()`, **returns `None`**, so `label` is `None` and the widget is lost. The program then fails much later, at `label.config(...)`, with `AttributeError: \'NoneType\' object has no attribute \'config\'`.',
        },
        {
          type: 'code',
          title: 'pack_returns_none.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()

wrong = tk.Label(root, text="Hello").pack()
print(wrong)

right = tk.Label(root, text="Hello")
right.pack()
print(right.cget("text"))

root.mainloop()`,
          output: `None
Hello`,
          annotations: [
            { lines: 5, text: 'Creation and placement are chained in one expression. The value of the whole expression is the value of the *last* call, `pack()`, which is `None`.' },
            { lines: 6, text: 'Printing it shows the problem straight away. (Later, `wrong.config(...)` would raise `AttributeError`.)' },
            { lines: '8-9', text: 'The fix has two statements: **create and store** the widget, then place it. Now the variable refers to the widget.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A rule of thumb',
          text: 'If you will ever touch the widget again (to read it, update it or disable it), create it on one line and place it on the next. If you will never touch it (a fixed title, a static caption), chaining `.pack()` is fine. Many programmers simply never chain, so that every widget has a name and every layout call has its own line.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Pictures need a reference',
          text: 'A `PhotoImage` that is only held by a widget option can disappear: tkinter keeps no Python reference to it, so when your variable goes out of scope (typically at the end of a function) the picture vanishes and the widget shows nothing. Store the image on a long-lived object: `label.image = photo`, or keep it in a module-level variable.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This class mimics how `pack()` behaves in tkinter: it does its work and returns nothing.',
      code: `class Widget:
    def pack(self):
        print("packed")


w = Widget().pack()
print(w)`,
      answer: 'packed\nNone',
      hint: 'A method without a `return` statement returns `None`, and `w` receives that value, not the `Widget` object.',
      explanation: 'The expression `Widget().pack()` creates the widget, calls `pack()` (which prints `packed`) and evaluates to the *return value of pack*, which is `None`. So `w` is `None`, and printing it shows `None`. The real tkinter methods `pack`, `grid` and `place` behave in exactly this way.',
    },
    {
      kind: 'error',
      prompt: 'This program crashes with `AttributeError: \'NoneType\' object has no attribute \'config\'` when the button is pressed. Tap the line that contains the real mistake.',
      lines: [
        'import tkinter as tk',
        'def press():',
        '    status.config(text="Pressed")',
        'root = tk.Tk()',
        'status = tk.Label(root, text="Waiting").pack()',
        'tk.Button(root, text="Press", command=press).pack()',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: 'Line 5 stores the result of `pack()`, which is `None`, in `status`. The crash only shows up in `press()` (line 3), but the cause is where the variable was created. Create the label with `status = tk.Label(...)` and call `status.pack()` on the next line.',
    },
    {
      kind: 'numeric',
      prompt: 'A label has `width=30`. Assume each character of its font is about 8 pixels wide. About how many pixels wide is the label (ignore borders and padding)?',
      answer: '240',
      hint: 'Width in characters times pixels per character.',
      explanation: '30 characters × 8 pixels = 240 pixels. The exact result depends on the font (a typical value is the width of the digit `0` in the font), which is why text widgets are sized in characters: the same `width` stays sensible when a user has a larger system font.',
      label: 'Width in pixels:',
    },
    {
      kind: 'concept',
      title: 'Putting it together',
      blocks: [
        {
          type: 'p',
          text: 'Labels show things, buttons do things, and `config()` is the bridge between them: a callback changes the program’s state and then updates labels and buttons to match. Nearly every tkinter program is variations on that pattern. In the exercises you will style a label, make a button that disables itself, and build a row of buttons from a list of names.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Checking widgets in the exercises',
          text: 'The checks read back widget options with `cget()` and layout with `pack_info()`, which are real tkinter methods. Fonts are compared by their text, because Tk may return a font in a different but equivalent form.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_banner(root, text)`. It creates a `Label` in `root` with the given text, the font `("Arial", 18, "bold")`, white text (`fg`) on a dark green background (`bg="darkgreen"`), `padx=20` and `pady=10`. Pack it and return the label.',
      starter: `import tkinter as tk


def make_banner(root, text):
    ...
`,
      solution: `import tkinter as tk


def make_banner(root, text):
    banner = tk.Label(
        root,
        text=text,
        font=("Arial", 18, "bold"),
        fg="white",
        bg="darkgreen",
        padx=20,
        pady=10,
    )
    banner.pack()
    return banner
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
b = make_banner(root, "Welcome")
assert isinstance(b, tk.Label), "return the Label (not the result of pack())"
assert b.cget("text") == "Welcome"
font = str(b.cget("font"))
assert "Arial" in font and "18" in font and "bold" in font, "font should be Arial 18 bold"
assert b.cget("fg") == "white" and b.cget("bg") == "darkgreen"
assert int(str(b.cget("padx"))) == 20 and int(str(b.cget("pady"))) == 10
assert b.winfo_manager() == "pack"
assert b.master is root`,
      checks: ['Creates a `Label` in `root` with the given text', 'Uses the font `("Arial", 18, "bold")`, `fg="white"`, `bg="darkgreen"`, `padx=20`, `pady=10`', 'Packs the label and returns the label itself'],
      hint: 'Pass all the options as keyword arguments in the `tk.Label(...)` call. Store the label in a variable, call `.pack()` on it, then `return` the variable.',
      explanation: 'One widget, many options: this is the normal shape of tkinter code. Note how the label is stored first and packed second, so that the function can return the widget and not `None`.',
    },
    {
      kind: 'code',
      prompt: 'Write `add_submit_button(root, on_submit)`. It creates a `Button` with the text `Submit` whose command calls `on_submit()` once and then **disables the button** (`state="disabled"`), so that a second press does nothing. Pack the button and return it.',
      starter: `import tkinter as tk


def add_submit_button(root, on_submit):
    ...
`,
      solution: `import tkinter as tk


def add_submit_button(root, on_submit):
    def press():
        on_submit()
        button.config(state="disabled")

    button = tk.Button(root, text="Submit", command=press)
    button.pack()
    return button
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
calls = []
btn = add_submit_button(root, lambda: calls.append(1))
assert isinstance(btn, tk.Button)
assert btn.cget("text") == "Submit"
assert str(btn.cget("state")) == "normal"
btn.invoke()
assert calls == [1], "the first press must call on_submit"
assert str(btn.cget("state")) == "disabled", "the button must disable itself"
btn.invoke()
btn.invoke()
assert calls == [1], "a disabled button must not call on_submit again"
assert btn.winfo_manager() == "pack"`,
      checks: ['Creates a packed `Button` with the text `Submit` and returns it', 'The first press calls `on_submit()` once', 'Afterwards the button is disabled, so further presses do nothing'],
      hint: 'Define an inner function `press()` that calls `on_submit()` and then `button.config(state="disabled")`. Create the button with `command=press`. The name `button` is looked up when `press` runs, after the button exists.',
      explanation: 'This is the “double submit” protection every form needs. The callback uses the widget it belongs to, which works because a function is only looked up when it is *called*, not when it is defined. Once the button is disabled, tkinter itself ignores presses; you do not need an `if` in the callback.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_button_row(root, names)`. For each name create a `Button` with that text and pack it with `side="left"` and `padx=4`. Return the list of buttons in the same order.',
      starter: `import tkinter as tk


def make_button_row(root, names):
    ...
`,
      solution: `import tkinter as tk


def make_button_row(root, names):
    buttons = []
    for name in names:
        button = tk.Button(root, text=name)
        button.pack(side="left", padx=4)
        buttons.append(button)
    return buttons
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
buttons = make_button_row(root, ["New", "Open", "Save"])
assert len(buttons) == 3
assert [b.cget("text") for b in buttons] == ["New", "Open", "Save"]
for b in buttons:
    assert isinstance(b, tk.Button)
    info = b.pack_info()
    assert info["side"] == "left", "pack with side='left'"
    assert int(info["padx"]) == 4
assert root.pack_slaves() == buttons, "the buttons must be packed in order"
assert make_button_row(root, []) == []`,
      checks: ['Creates one `Button` per name, with the name as its text', 'Packs each with `side="left"` and `padx=4`', 'Returns the buttons as a list in the given order'],
      hint: 'Loop over `names`; for each one create the button, call `button.pack(side="left", padx=4)` and append the button (not the result of `pack`) to a list.',
      explanation: 'Building widgets in a loop from data is how you avoid pasting the same three lines ten times. Keeping the created buttons in a list gives you a way to change them later, for example to disable them all.',
    },
  ],
  takeaways: [
    '**Label** shows text or an image; style it with `font=(family, size, style)`, `fg`, `bg`, `padx`/`pady`, `anchor`, `justify`, `wraplength`, `relief` and `bd`.',
    '`width` and `height` of text widgets count **characters and lines**; `padx`, `pady`, `bd` and `wraplength` are **pixels**. Image labels use pixels for `width`/`height`.',
    '**Button** calls its `command` (a function without parentheses and without arguments). `state="disabled"` stops clicks and greys it out, `invoke()` presses it from code, and `config(...)` changes it at any time.',
    '`pack()`, `grid()` and `place()` return **`None`**: write `label = tk.Label(...)` and then `label.pack()` whenever you will use the widget again. Keep a reference to every `PhotoImage` you display.',
    'Show the program’s state through widget options (disable a button during work, change a label’s text) so that wrong actions are impossible rather than reported afterwards.',
  ],
  reading: [
    { title: 'TkDocs: Basic Widgets — Label and Button', url: 'https://tkdocs.com/tutorial/widgets.html', source: 'tutorial', note: 'The widget tutorial: each basic widget with its most useful options.' },
    { title: 'Python documentation: tkinter — Handy Reference', url: 'https://docs.python.org/3/library/tkinter.html#handy-reference', source: 'docs', note: 'How options are set and queried, and how to read the Tk man pages for Python.' },
    { title: 'Tk manual: label', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/label.htm', source: 'docs', note: 'The full list of Label options in the original reference.' },
    { title: 'Tk manual: button', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/button.htm', source: 'docs', note: 'Every Button option and its methods, including `invoke` and `flash`.' },
  ],
};
