import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-choices',
  title: 'Checkbuttons, Radiobuttons, Scales and Spinboxes',
  summary: 'Let users make choices without typing: Checkbuttons for on/off, Radiobuttons for one-of-many, Scale sliders and Spinboxes for numbers. Learn how a shared variable ties a group together, why Scale callbacks receive a string, and how to build the same choice panel with the right widget every time.',
  minutes: 30,
  objectives: [
    'Choose the right widget for a choice: Checkbutton, Radiobutton, Scale or Spinbox',
    'Connect widgets to `IntVar`, `StringVar` and `BooleanVar` objects with `variable=`',
    'Build a Radiobutton group by sharing one variable and giving each button its own `value`',
    'Configure a `Scale` (`from_`, `to`, `resolution`, `orient`) and handle its string-valued `command`',
    'Read a `Spinbox` and remember that it returns text that the user can still edit',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Choices without typing',
      blocks: [
        {
          type: 'p',
          text: 'Typed input is error-prone, so whenever the possible answers are known, offer them. tkinter has four classic widgets for this, and the decision is usually obvious from the question you are asking:',
        },
        {
          type: 'table',
          headers: ['Widget', 'Question it answers', 'Value you get'],
          rows: [
            ['`Checkbutton`', 'On or off? (independent yes/no options)', '`onvalue` or `offvalue` (default `1` / `0`)'],
            ['`Radiobutton`', 'Which **one** of these? (exclusive)', 'The `value` of the selected button'],
            ['`Scale`', 'How much? (a slider within a range)', 'A number between `from_` and `to`'],
            ['`Spinbox`', 'Which number or item? (arrows plus typing)', 'The text in the box (a **string**)'],
          ],
          caption: 'One widget per kind of question. A group of Checkbuttons answers many yes/no questions; a group of Radiobuttons answers one multiple-choice question.',
        },
        {
          type: 'p',
          text: 'All four hold their value in a **tk variable**, an object from `tk.IntVar`, `tk.StringVar`, `tk.DoubleVar` or `tk.BooleanVar` that you attach with `variable=`. The widget updates the variable when the user clicks, and the widget updates itself if your code changes the variable. You read it with `.get()` and write it with `.set()`. The next lesson covers variables in depth; for now they are just boxes that the widget and your code share.',
        },
        {
          type: 'code',
          title: 'order_form.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Pizza order")

size = tk.StringVar(value="medium")
cheese = tk.BooleanVar(value=True)
olives = tk.BooleanVar()
quantity = tk.IntVar(value=1)

tk.Label(root, text="Size").pack(anchor="w", padx=10, pady=(10, 0))
for label in ("small", "medium", "large"):
    tk.Radiobutton(root, text=label, variable=size, value=label).pack(anchor="w", padx=20)

tk.Label(root, text="Toppings").pack(anchor="w", padx=10, pady=(10, 0))
tk.Checkbutton(root, text="Extra cheese", variable=cheese).pack(anchor="w", padx=20)
tk.Checkbutton(root, text="Olives", variable=olives).pack(anchor="w", padx=20)

tk.Label(root, text="How many?").pack(anchor="w", padx=10, pady=(10, 0))
tk.Spinbox(root, from_=1, to=10, textvariable=quantity, width=5).pack(anchor="w", padx=20)


def order():
    toppings = [name for name, var in (("cheese", cheese), ("olives", olives)) if var.get()]
    summary.config(text=f"{quantity.get()} x {size.get()} pizza, toppings: {toppings}")


tk.Button(root, text="Order", command=order).pack(pady=10)
summary = tk.Label(root, text="")
summary.pack(padx=10, pady=(0, 10))
root.mainloop()`,
          annotations: [
            { lines: '6-9', text: 'The variables come first. `value=` gives each its starting state: the medium size is preselected, extra cheese is ticked.' },
            { lines: '12-13', text: 'A **Radiobutton group**: every button uses the **same** variable (`size`) but a different `value`. Clicking one sets `size` to its value, which automatically deselects the others.' },
            { lines: '16-17', text: 'Each **Checkbutton** has its own variable, because toppings are independent. A `BooleanVar` gives `True`/`False`.' },
            { lines: 20, text: 'A `Spinbox` here shares `quantity` through `textvariable`. Spinbox holds text, and an `IntVar` converts it.' },
            { lines: '23-25', text: 'The callback never inspects widgets. It just reads the variables, which always reflect what the user chose.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why variables instead of asking the widget?',
          text: 'A widget’s state lives inside Tk. A variable is a Python-side handle on that state that works the same for every widget type, can be shared by several widgets, and can be **changed from code** to update the screen. Programs that read and write variables (and never poke at widgets) end up much simpler to extend.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which widget is the best fit for asking “Which of these three difficulty levels do you want?”',
      options: [
        { text: 'Three `Radiobutton` widgets sharing one variable', correct: true, why: 'Exactly one choice is allowed, so the buttons must be exclusive. Sharing a variable is what makes selecting one deselect the others.' },
        { text: 'Three `Checkbutton` widgets', why: 'Checkbuttons are independent, so the user could tick all three at once. You would have to write code to un-tick the others.' },
        { text: 'One `Scale` from 1 to 3', why: 'A slider can work for a numeric range, but names like “Easy / Normal / Hard” are clearer and harder to misread as radio choices.' },
        { text: 'One `Entry` where they type the level', why: 'Typed input invites typos (“hrad”), spelling and case variations that you would have to validate.' },
      ],
      explanation: 'Use Radiobuttons when exactly one of a small, fixed set of options applies, and Checkbuttons when each option is its own yes/no question.',
    },
    {
      kind: 'concept',
      title: 'Checkbuttons and Radiobuttons in detail',
      blocks: [
        {
          type: 'p',
          text: 'A **Checkbutton** toggles between two values: `onvalue` when ticked and `offvalue` when not. The defaults are `1` and `0`, so an `IntVar` works with no extra options, and a `BooleanVar` is the most readable choice for plain yes/no. If you want the values to mean something else (for example `"yes"`/`"no"` or `"on"`/`"off"`), set `onvalue` and `offvalue` and use a `StringVar`.',
        },
        {
          type: 'p',
          text: 'A **Radiobutton group** exists only because its buttons share a variable. Each button says what to put into that variable when selected (`value=`), and the button looks selected when the variable currently *equals* its `value`. The variable’s type must match: an `IntVar` goes with integer values, a `StringVar` with strings.',
        },
        {
          type: 'table',
          headers: ['Task', 'Code'],
          rows: [
            ['Preselect a radio option', '`var.set("medium")` (or create the variable with `value="medium"`)'],
            ['No radio option selected yet', 'Set the variable to a value that no button has: `""` for a `StringVar`, `-1` for an `IntVar`'],
            ['Tick or untick from code', '`check.select()` / `check.deselect()` / `check.toggle()`, or just `var.set(...)`'],
            ['Run code when the user clicks', '`command=callback` (called after the variable has changed)'],
            ['Click from code', '`check.invoke()` toggles **and** calls the command, like a user click'],
            ['Side-by-side buttons', 'Radio buttons and checks accept `indicatoron=False` to look like toggle buttons'],
          ],
          caption: 'Everyday recipes for choice buttons.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'An IntVar that no radio button matches',
          text: 'A new `IntVar()` holds `0`. If none of your radio buttons has `value=0`, no button looks selected, and `get()` still returns `0`, which is not a real option. Always set the variable to a valid starting choice (or deliberately to a value like `-1` meaning “none”), and make sure your code copes with it.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Keep a reference to your variables',
          text: 'If you create a variable as a **local** inside a function and the function ends, Python may garbage-collect it. The widget then loses its state and looks blank or unchecked. Keep variables in a long-lived place: a module-level name for small scripts, or an attribute (`self.size = tk.StringVar()`) in a class, as in the Object-Oriented tkinter lesson.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Two Radiobuttons only act as a group (selecting one deselects the other) if they share the same variable.',
      answer: true,
      explanation: 'True. A radio button looks selected when the shared variable equals its own `value`. If each button had its own variable they would never affect each other, and you would simply have buttons that behave like unconnected switches.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the Radiobutton so that choosing it stores the string `"large"` in the variable `size`.',
      template: `tk.Radiobutton(root, text="Large", ___=size, ___="large")`,
      templateIsCode: true,
      blanks: [{ answers: ['variable'] }, { answers: ['value'] }],
      wordBank: ['variable', 'value', 'text', 'command', 'textvariable'],
      explanation: '`variable=` says which tk variable the button belongs to and `value=` says what it stores there when selected. (`textvariable` is for the text shown on a Label or Entry, not for choices.)',
    },
    {
      kind: 'concept',
      title: 'Scale and Spinbox: choosing numbers',
      blocks: [
        {
          type: 'p',
          text: 'A **Scale** is a slider. Because `from` is a Python keyword, its option is spelled `from_` (with an underscore). Besides the range you can set `orient` (`"horizontal"` or `"vertical"`), a `resolution` (the step size, default `1`), a `length` in pixels, a `label`, and `tickinterval`. Its value is read with `get()` and set with `set()`, and it is clamped to the range and snapped to the resolution: asking a `Scale(from_=0, to=100, resolution=5)` for `42` gives `40`.',
        },
        {
          type: 'p',
          text: 'The Scale’s `command` is different from a Button’s: tkinter **passes the new value to it**, and the value arrives as a **string** (for example `"37"`). Your callback must accept that argument, and convert if it needs a number.',
        },
        {
          type: 'code',
          title: 'volume_slider.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Volume")

readout = tk.Label(root, text="Volume: 50")
readout.pack(pady=(15, 0))


def on_move(value):
    # value is a string such as "37"
    readout.config(text=f"Volume: {int(float(value))}")


slider = tk.Scale(root, from_=0, to=100, orient="horizontal",
                  length=250, resolution=5, command=on_move)
slider.set(50)
slider.pack(padx=20, pady=15)
root.mainloop()`,
          annotations: [
            { lines: '10-12', text: 'The callback **must accept one parameter**. tkinter calls it with the new value every time the slider moves, as a string.' },
            { lines: 12, text: 'Convert the string. `float` first, then `int`, because a Scale with a decimal `resolution` sends strings like `"2.5"` that `int` would reject.' },
            { lines: '15-16', text: '`from_` has the trailing underscore. `resolution=5` makes the slider snap to multiples of 5, and `length` is its size in pixels.' },
            { lines: 17, text: '`set(50)` moves the slider from code (and so, in real tkinter, also runs `command`).' },
          ],
        },
        {
          type: 'p',
          text: 'A **Spinbox** is a text box with up/down arrows. Give it either a numeric range (`from_`, `to`, `increment`) or a list of choices with `values=("low", "medium", "high")`. `wrap=True` makes the arrows wrap around at the ends, and `state="readonly"` stops the user typing so that they can only use the arrows (and `get()` then always returns a legal choice).',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A Spinbox is still a text box',
          text: 'The user can click in a Spinbox and type `abc` or `999`, so the range is **not enforced** on typed text. `get()` returns a string, so convert and validate it as you would an Entry, or use `state="readonly"` so that only the arrows can change it.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This models how a Checkbutton with `onvalue="yes"` and `offvalue="no"` changes on each click.',
      code: `onvalue, offvalue = "yes", "no"
state = offvalue
for click in range(3):
    state = onvalue if state == offvalue else offvalue
    print(click + 1, state)`,
      answer: '1 yes\n2 no\n3 yes',
      hint: 'The state starts as "no" and flips each time.',
      explanation: 'Each click toggles between the two stored values: off becomes on (`yes`), then back to `no`, then `yes` again. A real Checkbutton does exactly this to its variable, so after three clicks starting from off the variable holds `"yes"`.',
    },
    {
      kind: 'error',
      prompt: 'Moving the slider prints `TypeError: on_move() takes 0 positional arguments but 1 was given`. Tap the line with the mistake.',
      lines: [
        'def on_move():',
        '    label.config(text="moved")',
        '',
        'scale = tk.Scale(root, from_=0, to=100, command=on_move)',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'A Scale calls its `command` with the new value, so the function must accept a parameter: `def on_move(value):`. (Button commands are called with no arguments, which is why this surprises people who are used to Buttons.)',
    },
    {
      kind: 'numeric',
      prompt: 'A slider is created with `tk.Scale(root, from_=10, to=50, resolution=5)`. You call `slider.set(23)`. What does `slider.get()` return?',
      answer: '25',
      hint: 'Valid positions are 10, 15, 20, 25, and so on. Which one is nearest to 23?',
      explanation: 'The value is snapped to the nearest step counted from `from_`: the positions are 10, 15, 20, 25, 30 … and 23 is closest to 25. Values outside the range are clamped, so `set(99)` would give `50`.',
      label: 'Value:',
    },
    {
      kind: 'concept',
      title: 'Putting a choice panel together',
      blocks: [
        {
          type: 'p',
          text: 'Notice what you have been doing in every example: build the widgets in a loop, give each the shared variable, and use the variable to read the answer. That pattern keeps the code short and the widgets in sync, and it is how you would write the three exercises that follow. They run on a stand-in for tkinter in the app, with the same widget methods and the same variable behaviour as the real library, so what you write is real tkinter code.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Rule of thumb for choosing',
          text: 'Two to five fixed, mutually exclusive options: Radiobuttons. Many independent options: Checkbuttons. A number on a scale where the exact value is not critical: Scale. A precise number or a short list the user steps through: Spinbox. More than about six exclusive options: a Combobox or Listbox (coming soon).',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_checks(parent, names)`. For each name, create a `Checkbutton` inside `parent` with that text and its own `BooleanVar`, pack it, and return a **dictionary** mapping each name to its `BooleanVar`.',
      starter: `import tkinter as tk


def make_checks(parent, names):
    ...
`,
      solution: `import tkinter as tk


def make_checks(parent, names):
    variables = {}
    for name in names:
        var = tk.BooleanVar(parent)
        tk.Checkbutton(parent, text=name, variable=var).pack(anchor="w")
        variables[name] = var
    return variables
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
frame = tk.Frame(root)
frame.pack()
vs = make_checks(frame, ["cheese", "olives", "ham"])
assert list(vs) == ["cheese", "olives", "ham"]
boxes = frame.winfo_children()
assert len(boxes) == 3
assert [b.cget("text") for b in boxes] == ["cheese", "olives", "ham"]
assert all(b.winfo_manager() == "pack" for b in boxes)
assert all(isinstance(v, tk.BooleanVar) for v in vs.values())
assert [v.get() for v in vs.values()] == [False, False, False]
boxes[1].invoke()
assert vs["olives"].get() is True and vs["cheese"].get() is False
boxes[1].invoke()
assert vs["olives"].get() is False
boxes[0].select()
assert vs["cheese"].get() is True
assert make_checks(tk.Frame(root), []) == {}`,
      checks: ['Creates one `Checkbutton` per name, with the name as its text', 'Gives each button its **own** `BooleanVar` (clicking one changes only that variable)', 'Packs each button and returns the `{name: variable}` dictionary in order'],
      hint: 'Loop over `names`. For each: `var = tk.BooleanVar(parent)`, create `tk.Checkbutton(parent, text=name, variable=var)`, call `.pack(anchor="w")`, and store `variables[name] = var`.',
      explanation: 'One variable per Checkbutton is the rule for independent options. Returning a dictionary means the rest of the program can ask `vars["olives"].get()` without caring about the widgets at all.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_radios(parent, options, var)`. Create one `Radiobutton` in `parent` per option (text and `value` both equal to the option), all sharing the variable `var`, pack each one, and return the list of buttons.',
      starter: `import tkinter as tk


def make_radios(parent, options, var):
    ...
`,
      solution: `import tkinter as tk


def make_radios(parent, options, var):
    buttons = []
    for option in options:
        button = tk.Radiobutton(parent, text=option, variable=var, value=option)
        button.pack(anchor="w")
        buttons.append(button)
    return buttons
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
size = tk.StringVar(value="medium")
frame = tk.Frame(root)
frame.pack()
rs = make_radios(frame, ["small", "medium", "large"], size)
assert len(rs) == 3
assert [r.cget("text") for r in rs] == ["small", "medium", "large"]
assert [r.cget("value") for r in rs] == ["small", "medium", "large"]
assert frame.winfo_children() == rs
assert all(r.winfo_manager() == "pack" for r in rs)
assert size.get() == "medium", "creating the buttons must not change the variable"
rs[2].invoke()
assert size.get() == "large"
rs[0].invoke()
assert size.get() == "small"
other = tk.IntVar(value=3)
ns = make_radios(frame, [1, 2, 3], other)
ns[0].invoke()
assert other.get() == 1`,
      checks: ['Creates a `Radiobutton` per option whose `text` and `value` are the option', 'All buttons share the same `variable`, so choosing one stores its value there', 'Packs each button and returns them as a list in order'],
      hint: 'Inside the loop: `tk.Radiobutton(parent, text=option, variable=var, value=option)`, then `.pack(anchor="w")`, and append to a list. `text=` needs a string, which tkinter will make from an integer option.',
      explanation: 'The variable is shared and the value is unique: that is the whole mechanism of a radio group. Because the function takes the variable as a parameter, the caller keeps a reference to it and can read the choice later.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_slider(parent, low, high, step, var)` that creates, packs and returns a horizontal `Scale` from `low` to `high` that moves in steps of `step` and is linked to the `IntVar` `var`.',
      starter: `import tkinter as tk


def make_slider(parent, low, high, step, var):
    ...
`,
      solution: `import tkinter as tk


def make_slider(parent, low, high, step, var):
    slider = tk.Scale(parent, from_=low, to=high, resolution=step,
                      orient="horizontal", variable=var)
    slider.pack(fill="x")
    return slider
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
v = tk.IntVar()
frame = tk.Frame(root)
frame.pack()
s = make_slider(frame, 0, 20, 5, v)
assert isinstance(s, tk.Scale)
assert s.winfo_manager() == "pack"
assert str(s.cget("orient")) == "horizontal"
s.set(7)
assert s.get() == 5 and v.get() == 5
s.set(8)
assert s.get() == 10 and v.get() == 10
s.set(500)
assert s.get() == 20, "values above the range are clamped"
s.set(-30)
assert s.get() == 0, "values below the range are clamped"
v.set(15)
assert s.get() == 15, "changing the variable moves the slider"`,
      checks: ['Creates a horizontal `Scale` with `from_=low`, `to=high` and `resolution=step`', 'Links it to `var`, so the variable and the slider always agree', 'Packs the slider and returns it'],
      hint: 'Pass `from_=low, to=high, resolution=step, orient="horizontal", variable=var` to `tk.Scale`, then `.pack(fill="x")` and `return` it. Remember the underscore in `from_`.',
      explanation: 'Linking a variable lets other code (a label, a save routine) read the slider without holding a reference to it, and lets code move the slider by setting the variable. The `resolution` option does the snapping so you do not need to round values yourself.',
    },
  ],
  takeaways: [
    'Use **Checkbuttons** for independent on/off options (each with its own variable), **Radiobuttons** for one-of-many (all sharing one variable, each with its own `value`), **Scale** for a slider and **Spinbox** for stepping through numbers or a list.',
    'Widgets are tied to `IntVar`, `StringVar`, `DoubleVar` or `BooleanVar` objects through `variable=`. Read with `get()`, change with `set()`, and keep a reference to the variable so that it is not garbage-collected.',
    'A Checkbutton toggles between `onvalue` and `offvalue` (default `1`/`0`). A new `IntVar` holds `0`, so make sure the variable starts at a legal choice for a Radiobutton group.',
    'A **Scale** uses `from_` (with the underscore), `to`, `resolution` and `orient`. Its `command` receives the new value as a **string**, so the callback needs a parameter and a conversion.',
    'A **Spinbox** is still a text box: typed text is not range-checked, so validate `get()` or use `state="readonly"`.',
  ],
  reading: [
    { title: 'TkDocs: Checkbutton, Radiobutton and Scale', url: 'https://tkdocs.com/tutorial/widgets.html', source: 'tutorial', note: 'The basic widgets chapter, with all four widgets and their variables.' },
    { title: 'Python docs: tkinter, coupling widget variables', url: 'https://docs.python.org/3/library/tkinter.html#coupling-widget-variables', source: 'docs', note: 'How StringVar, IntVar, DoubleVar and BooleanVar connect to widgets.' },
    { title: 'Tk manual: scale', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/scale.htm', source: 'docs', note: 'Every Scale option, including resolution, tickinterval and command.' },
    { title: 'Tk manual: spinbox', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/spinbox.htm', source: 'docs', note: 'Spinbox options: from, to, increment, values, wrap and validation.' },
  ],
};
