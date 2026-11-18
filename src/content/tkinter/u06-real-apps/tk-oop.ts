import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-oop',
  title: 'Structuring a GUI with Classes',
  summary: 'Move from one long script with globals to classes: an App subclass of Tk, reusable Frame subclasses, widgets and state as attributes, methods as callbacks, and callbacks passed in so that parts of the interface do not depend on each other.',
  minutes: 34,
  objectives: [
    'Explain why growing tkinter programs need classes rather than module-level code and `global`',
    'Write an `App(tk.Tk)` class and reusable `ttk.Frame` subclasses that build their own widgets',
    'Use methods as callbacks (`command=self.method`) and keep state in attributes',
    'Create custom widgets such as a labeled entry, and expose a small public interface (`get`, `set`, `clear`)',
    'Connect parts of the interface with callbacks passed in, instead of reaching into each other’s widgets',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a script to classes',
      blocks: [
        {
          type: 'p',
          text: 'The first GUI programs in this course were scripts: create the widgets at the top level, write callbacks as functions, and share state with `global`. That works for a window with a few widgets, and it falls apart quickly. Every callback needs `global` declarations, two similar windows need copied code, and nothing says which function belongs to which part of the screen. **Classes** fix all three problems: widgets and the data they show live together as **attributes** of one object, callbacks are **methods** that reach everything through `self`, and the same class can be created twice, with its own state each time.',
        },
        {
          type: 'p',
          text: 'The standard shape is a **frame subclass per screen area** and one **application class**. A frame subclass calls `super().__init__(parent)`, builds its widgets with itself as the parent, and offers methods for the rest of the program. The application class (a subclass of `tk.Tk`) creates the pieces and puts them in the window. The program below has a counter frame that is used twice, with independent counts:',
        },
        {
          type: 'code',
          title: 'counters.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk


class CounterFrame(ttk.Frame):
    def __init__(self, parent, start=0):
        super().__init__(parent, padding=16)
        self.count = start
        self.text = tk.StringVar(value=str(start))
        ttk.Label(self, textvariable=self.text, font=("Segoe UI", 24)).grid(row=0, column=0, columnspan=3)
        ttk.Button(self, text="-", width=4, command=self.decrement).grid(row=1, column=0, pady=8)
        ttk.Button(self, text="Reset", command=self.reset).grid(row=1, column=1, padx=8)
        ttk.Button(self, text="+", width=4, command=self.increment).grid(row=1, column=2)

    def increment(self):
        self._set(self.count + 1)

    def decrement(self):
        self._set(self.count - 1)

    def reset(self):
        self._set(0)

    def _set(self, value):
        self.count = value
        self.text.set(str(value))


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Counters")
        for column in range(2):
            CounterFrame(self).grid(row=0, column=column)


if __name__ == "__main__":
    App().mainloop()`,
          annotations: [
            { lines: '5-9', text: 'The class **is** a frame, so it can be placed with `grid` or `pack` like any widget. `super().__init__(parent, padding=16)` runs the Frame constructor: without it nothing works. The state (`count`, `text`) belongs to this object.' },
            { lines: '10-13', text: 'The widgets get `self` as their parent, so they are inside this frame. `command=self.decrement` passes the **bound method** (no parentheses): when the button is clicked, Tk calls it and `self` is already filled in.' },
            { lines: '15-26', text: 'One method per action. The small helper `_set` keeps the number and the label in step, so no other code has to remember to update both. (A leading underscore means “internal”.)' },
            { lines: '29-34', text: 'The app class makes two counters. Each `CounterFrame` has its own `count`, which a pair of global variables could not give you.' },
            { lines: '37-38', text: 'The `if __name__ == "__main__":` guard lets other files import the classes without opening a window.' },
          ],
        },
        {
          type: 'table',
          headers: ['Script style', 'Class style'],
          rows: [
            ['`count = 0` at the top, `global count` in callbacks', '`self.count`, no `global` anywhere'],
            ['`def on_click():` functions near widgets', '`def on_click(self):` methods next to the data they use'],
            ['Copy and paste to get a second panel', '`CounterFrame(root)` twice, each with its own state'],
            ['Widgets created in any order at module level', 'A constructor that builds the screen, and one method per behavior'],
            ['Import the file = a window pops up', '`if __name__ == "__main__":` starts the program only when run'],
            ['Hard to test', 'A frame can be created and driven from test code'],
          ],
          caption: 'What changes when a GUI is organised in classes.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why subclass a frame instead of writing a class that holds widgets?',
          text: 'A class that merely **has** a frame (composition) works too and is sometimes cleaner. But subclassing `ttk.Frame` has a practical advantage: your object **is** a widget, so `grid`, `pack`, `bind`, `after`, `winfo_*` and `destroy` all work on it directly, and destroying it destroys all its children. The rule of thumb is to subclass for “a piece of the screen” and use ordinary objects for data and logic (the next lesson).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In `CounterFrame`, why is the button written `command=self.increment` and not `command=self.increment()`?',
      options: [
        { text: 'The command must be the method **itself**, to be called later by Tk; the parentheses would call it immediately, while the window is built', correct: true, why: '`self.increment` is a bound method: a function that already knows `self`. `self.increment()` would run it now and pass its result (`None`) to the button.' },
        { text: 'Because methods cannot take parentheses inside a call', why: 'Parentheses are fine in general: they are what calls a function. The point is **when** the call should happen.' },
        { text: 'Because `self` must be passed explicitly in the other form', why: 'It is the opposite: a bound method already contains `self`, Tk does not need to pass it.' },
        { text: 'Because the button would otherwise call it twice', why: 'The problem is not a double call but a call at the wrong moment.' },
      ],
      explanation: 'This is the same rule as with `after`: pass the callable, do not call it. If the method needs an argument, use `command=lambda: self.add(5)` or `functools.partial(self.add, 5)`.',
    },
    {
      kind: 'truefalse',
      prompt: 'A class `Panel(ttk.Frame)` can skip the call `super().__init__(parent)` in its constructor, as long as it creates its widgets with `self` as the parent.',
      answer: false,
      explanation: 'False. The `Frame` constructor creates the actual Tk widget and sets up attributes such as `tk` and `master`. Without it, `ttk.Label(self, ...)` fails with `AttributeError: ... object has no attribute \'tk\'`. Always call `super().__init__(...)` first.',
    },
    {
      kind: 'concept',
      title: 'Reusable widgets and passing callbacks in',
      blocks: [
        {
          type: 'p',
          text: 'A subclass can bundle several widgets into one **custom widget** with a small public interface. A `LabeledEntry` (a label and an entry) offers `get()`, `set(value)` and `clear()`, and the code that uses it never has to know that there is an `Entry` inside. That is the main benefit of classes: the **inside** of a part can change without touching the outside.',
        },
        {
          type: 'p',
          text: 'The second idea is how parts talk to each other. A `Form` frame should not reach into the table frame and insert rows; that ties the two together forever. Instead, give the form a **callback** when it is created (`Form(parent, on_submit=self.add_row)`) and let it call that function when the user submits. The form only knows “somebody wants the values”, and the app decides what to do with them. This is the observer pattern in its simplest form, and it needs no tkinter at all, as this runnable model shows:',
        },
        {
          type: 'code',
          title: 'observer.py',
          runnable: true,
          code: `class Counter:
    def __init__(self):
        self.value = 0
        self._listeners = []

    def subscribe(self, callback):
        self._listeners.append(callback)

    def increment(self, step=1):
        self.value += step
        for callback in self._listeners:
            callback(self.value)


counter = Counter()
counter.subscribe(lambda v: print("label shows", v))
counter.subscribe(lambda v: print("log:", v))
counter.increment()
counter.increment(5)`,
          output: `label shows 1
log: 1
label shows 6
log: 6`,
          annotations: [
            { lines: '6-7', text: '`subscribe` just stores the function. The counter has no idea what the functions do: they could update a label, write a log, or refresh a chart.' },
            { lines: '9-12', text: 'When the value changes, every listener is called, in the order in which they subscribed. In a GUI the listener is typically a method such as `self.refresh_label`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A layout for a bigger program',
          text: 'Keep one class per screen area (`ToolbarFrame`, `TableFrame`, `FormFrame`) and one `App` that creates them and connects them with callbacks. Build each frame in a `_build()` method, and give every part an obvious public interface (`load(rows)`, `get_values()`, `clear()`). Put the data and rules in plain classes that **know nothing about tkinter** (the next lesson): then the frames shrink to a few lines each.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the skeleton of an application class.',
      template: `class App(tk.___):
    def __init__(self):
        super().___()
        self.title("Demo")`,
      templateIsCode: true,
      blanks: [{ answers: ['Tk'] }, { answers: ['__init__'] }],
      wordBank: ['Tk', '__init__', 'Frame', 'mainloop', 'self'],
      explanation: 'The application class inherits from `tk.Tk` (the main window) and starts with `super().__init__()`, which creates the window. After that, `self` is the window: `self.title(...)`, `self.geometry(...)` and `self.mainloop()` all work on it.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A bound method is stored first, and the object changes afterwards.',
      code: `class Greeter:
    def __init__(self, name):
        self.name = name

    def greet(self):
        return "Hello, " + self.name


g = Greeter("Ada")
callback = g.greet
g.name = "Linus"
print(callback())`,
      answer: 'Hello, Linus',
      hint: 'A bound method remembers the object, not the value of its attributes at that moment.',
      explanation: '`g.greet` is a bound method: it keeps a reference to **the object** `g`, so the method reads `g.name` when it runs, and by then the name is `"Linus"`. This is why a button’s `command=self.save` always sees the current state of the form.',
    },
    {
      kind: 'concept',
      title: 'Good habits for GUI classes',
      blocks: [
        {
          type: 'table',
          headers: ['Habit', 'Why'],
          rows: [
            ['Call `super().__init__(...)` first', 'The Tk widget must exist before children are created or options are used'],
            ['Build widgets in the constructor (or a `_build_ui` method), not at import time', 'The class can be imported and tested without opening a window'],
            ['Keep references: `self.entry = ttk.Entry(...)` for widgets you read later', 'A local variable disappears when `__init__` ends. Widgets that are only displayed need no attribute'],
            ['Call `grid()` or `pack()` on its **own line** (not `self.entry = ttk.Entry(...).grid(...)`)', '`grid` returns `None`, so the attribute would be `None` and the next use fails'],
            ['Pass data and callbacks into a frame (`Form(parent, on_submit=...)`)', 'Parts stay independent and easy to rearrange or reuse'],
            ['Keep rules and data in plain classes and functions', 'They can be tested without a window; see the next lesson'],
            ['Override `destroy()` to cancel timers and threads', '`after` callbacks that run on a destroyed window raise `TclError`'],
            ['One responsibility per class', 'A 500-line `App` with every widget in it is the new global scope'],
          ],
          caption: 'A checklist for tkinter classes.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The classic None bug',
          text: '`self.entry = ttk.Entry(self).pack()` stores **`None`** in `self.entry`, because `pack()` returns `None`. The program starts fine, and fails later with `AttributeError: \'NoneType\' object has no attribute \'get\'`. Create the widget on one line and place it on the next.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `AttributeError: \'Counter\' object has no attribute \'tk\'`. Tap the line that raises it.',
      lines: [
        'class Counter(ttk.Frame):',
        '    def __init__(self, parent):',
        '        self.count = 0',
        '        ttk.Label(self, text="0").pack()',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The constructor never called `super().__init__(parent)`, so the object is not a real widget yet: it has no `tk` attribute. The label needs a working parent, so the error appears on line 4. The fix is to add `super().__init__(parent)` as the first line of `__init__`.',
    },
    {
      kind: 'numeric',
      prompt: 'An app creates 3 `CounterFrame` objects. Each one contains 1 label and 3 buttons. How many widgets exist in total, counting the frames themselves but not the main window?',
      answer: '15',
      hint: 'Per counter: the frame, the label and the three buttons.',
      explanation: 'One counter is 1 frame + 1 label + 3 buttons = 5 widgets, so three counters are 3 x 5 = 15 widgets. The same class built three times shows the saving: one definition, any number of independent panels.',
      label: 'Widgets:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build with classes',
      blocks: [
        {
          type: 'p',
          text: 'The tests create your class on the stand-in window and drive it like a user would: read and fill entries, call `invoke()` on buttons, and look at labels and variables. Give widgets that the outside needs a name (an attribute), and widgets that nobody touches no name at all.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `LabeledEntry(ttk.Frame)`. `__init__(self, parent, label, width=20)` creates `self.label` (a `ttk.Label` showing `label`) and `self.entry` (a `ttk.Entry` of the given `width`), both packed with `side="left"`. Methods: `get()` returns the entry text **without surrounding spaces**, `set(value)` replaces the text with `str(value)`, `clear()` empties the entry.',
      starter: `import tkinter as tk
from tkinter import ttk


class LabeledEntry(ttk.Frame):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


class LabeledEntry(ttk.Frame):
    def __init__(self, parent, label, width=20):
        super().__init__(parent)
        self.label = ttk.Label(self, text=label)
        self.label.pack(side="left")
        self.entry = ttk.Entry(self, width=width)
        self.entry.pack(side="left")

    def get(self):
        return self.entry.get().strip()

    def set(self, value):
        self.clear()
        self.entry.insert(0, str(value))

    def clear(self):
        self.entry.delete(0, "end")
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
w = LabeledEntry(root, "Name", width=12)
w.pack()
assert isinstance(w, ttk.Frame)
assert len(w.winfo_children()) == 2
assert w.label.cget("text") == "Name"
assert int(str(w.entry.cget("width"))) == 12
assert w.get() == ""
w.entry.insert(0, "  Ada  ")
assert w.get() == "Ada", repr(w.get())
w.set(42)
assert w.get() == "42" and w.entry.get() == "42", "set replaces the old text"
w.set("hello")
assert w.entry.get() == "hello"
w.clear()
assert w.get() == "" and w.entry.get() == ""
second = LabeledEntry(root, "Email")
second.set("a@b.c")
assert w.get() == "" and second.get() == "a@b.c", "each instance has its own entry"`,
      checks: ['Calls `super().__init__(parent)` and creates `self.label` and `self.entry` inside the frame (parent `self`)', 'Both widgets are packed on their own line with `side="left"`', '`get()` strips the text, `set()` replaces it (using `str(value)`), and `clear()` empties the entry'],
      hint: 'In `set`, call `self.clear()` and then `self.entry.insert(0, str(value))`. `Entry.delete(0, "end")` empties the field.',
      explanation: 'The three methods are the public interface: code that uses `LabeledEntry` never touches `self.entry`. If you later switch to a `Combobox` or add validation, nothing outside the class changes.',
    },
    {
      kind: 'code',
      prompt: 'Write `CounterFrame(ttk.Frame)` as in the lesson: `__init__(self, parent, start=0)` sets `self.count` and a `StringVar` `self.text` (the text of the number), and creates a label bound to `self.text` and three `ttk.Button`s with the texts `"-"`, `"Reset"` and `"+"`. The methods `increment()`, `decrement()` and `reset()` (to 0) change the count **and** the shown text.',
      starter: `import tkinter as tk
from tkinter import ttk


class CounterFrame(ttk.Frame):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


class CounterFrame(ttk.Frame):
    def __init__(self, parent, start=0):
        super().__init__(parent, padding=16)
        self.count = start
        self.text = tk.StringVar(value=str(start))
        ttk.Label(self, textvariable=self.text).grid(row=0, column=0, columnspan=3)
        ttk.Button(self, text="-", command=self.decrement).grid(row=1, column=0)
        ttk.Button(self, text="Reset", command=self.reset).grid(row=1, column=1)
        ttk.Button(self, text="+", command=self.increment).grid(row=1, column=2)

    def increment(self):
        self._set(self.count + 1)

    def decrement(self):
        self._set(self.count - 1)

    def reset(self):
        self._set(0)

    def _set(self, value):
        self.count = value
        self.text.set(str(value))
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
f = CounterFrame(root, start=5)
f.pack()
buttons = {w.cget("text"): w for w in f.winfo_children() if isinstance(w, ttk.Button)}
assert set(buttons) == {"-", "Reset", "+"}, set(buttons)
assert f.count == 5 and f.text.get() == "5"
buttons["+"].invoke()
buttons["+"].invoke()
assert f.count == 7 and f.text.get() == "7"
buttons["-"].invoke()
assert f.count == 6 and f.text.get() == "6"
buttons["Reset"].invoke()
assert f.count == 0 and f.text.get() == "0"
other = CounterFrame(root)
other.increment()
assert other.count == 1 and f.count == 0, "each frame keeps its own count"
labels = [w for w in f.winfo_children() if isinstance(w, ttk.Label)]
assert len(labels) == 1 and str(labels[0].cget("textvariable")) == str(f.text)`,
      checks: ['Keeps `self.count` and the `StringVar` `self.text` in step, in one helper method', 'The three buttons use the bound methods as their `command` (no parentheses)', 'Two frames do not share any state'],
      hint: 'Write a helper `_set(self, value)` that stores `self.count = value` and calls `self.text.set(str(value))`, and let the three public methods call it.',
      explanation: 'Because the count lives in `self`, two `CounterFrame`s are fully independent, which is the thing a script with a global `count` cannot do. The helper `_set` is the single place where the model value and the display are updated together.',
    },
    {
      kind: 'code',
      prompt: 'Write `Form(ttk.Frame)`. `__init__(self, parent, fields, on_submit)` creates, for every name in `fields`, a label and a `ttk.Entry` (stored in the dict `self.entries[name]`), a `ttk.Button` `self.submit_button` with the text `"Submit"` whose command is `self.submit`, and a `StringVar` `self.status`. `submit()` collects `{name: entry text stripped}`. If any value is empty it sets `self.status` to `"Fill in all fields"` and returns `False`. Otherwise it calls `on_submit(values)`, clears all entries, sets `self.status` to `"Saved"` and returns `True`.',
      starter: `import tkinter as tk
from tkinter import ttk


class Form(ttk.Frame):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


class Form(ttk.Frame):
    def __init__(self, parent, fields, on_submit):
        super().__init__(parent, padding=8)
        self.on_submit = on_submit
        self.entries = {}
        for row, name in enumerate(fields):
            ttk.Label(self, text=name).grid(row=row, column=0, sticky="w")
            entry = ttk.Entry(self)
            entry.grid(row=row, column=1)
            self.entries[name] = entry
        self.status = tk.StringVar()
        self.submit_button = ttk.Button(self, text="Submit", command=self.submit)
        self.submit_button.grid(row=len(fields), column=0, columnspan=2)
        ttk.Label(self, textvariable=self.status).grid(row=len(fields) + 1, column=0, columnspan=2)

    def submit(self):
        values = {name: entry.get().strip() for name, entry in self.entries.items()}
        if not all(values.values()):
            self.status.set("Fill in all fields")
            return False
        self.on_submit(values)
        for entry in self.entries.values():
            entry.delete(0, "end")
        self.status.set("Saved")
        return True
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
received = []
form = Form(root, ["name", "email"], received.append)
form.pack()
assert list(form.entries) == ["name", "email"]
assert isinstance(form.submit_button, ttk.Button) and form.submit_button.cget("text") == "Submit"
form.submit_button.invoke()
assert received == [] and form.status.get() == "Fill in all fields"
form.entries["name"].insert(0, "  Ada ")
assert form.submit() is False and received == []
form.entries["email"].insert(0, "ada@example.com")
assert form.submit() is True
assert received == [{"name": "Ada", "email": "ada@example.com"}], received
assert form.status.get() == "Saved"
assert form.entries["name"].get() == "" and form.entries["email"].get() == ""
form.entries["name"].insert(0, "Bob")
form.entries["email"].insert(0, "bob@example.com")
form.submit_button.invoke()
assert len(received) == 2 and received[1]["name"] == "Bob"`,
      checks: ['Stores each entry in `self.entries[name]` and keeps the callback passed in as `on_submit`', 'Incomplete input sets the status text, returns `False` and does **not** call the callback', 'On success calls `on_submit(values)`, clears every entry, sets the status to `"Saved"` and returns `True`'],
      hint: 'Build `values = {name: entry.get().strip() for name, entry in self.entries.items()}` and test it with `all(values.values())` (empty strings are false).',
      explanation: 'The form knows nothing about what happens to the data: the callback does. The same `Form` could add a row to a table, write a file or send a message, and the app decides when it creates the form. Returning `True` or `False` also makes `submit()` easy to test without any window.',
    },
  ],
  takeaways: [
    'Replace globals with **attributes**: widgets and the data that they show live in one object, so a screen can be created twice with independent state.',
    'The standard layout: an `App(tk.Tk)` that creates the window, and one `ttk.Frame` subclass per area. Always call `super().__init__(...)` first, create children with `self` as the parent, and start the program under `if __name__ == "__main__":`.',
    'Methods are callbacks: `command=self.save` (the bound method, **without** parentheses). The method reaches the widgets and the state through `self`.',
    'Give custom widgets a small public interface (`get`, `set`, `clear`, `load`), and let parts talk through **callbacks passed to the constructor**, not by reaching into each other’s widgets.',
    'Place a widget on its own line: `self.entry = ttk.Entry(self)` then `self.entry.pack()`. `pack()` and `grid()` return `None`, and chaining them stores `None`.',
  ],
  reading: [
    { title: 'TkDocs: Organizing your program', url: 'https://tkdocs.com/tutorial/windows.html', source: 'tutorial', note: 'Windows and dialogs, and the notes on structuring larger Tk programs.' },
    { title: 'Python docs: Classes', url: 'https://docs.python.org/3/tutorial/classes.html', source: 'docs', note: 'Methods, bound methods and inheritance, the tools that this lesson relies on.' },
    { title: 'Python docs: tkinter', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'The tkinter module reference, including the classes that you subclass.' },
    { title: 'Real Python: Python GUI Programming With Tkinter', url: 'https://realpython.com/python-gui-tkinter/', source: 'article', note: 'A long beginner-friendly walkthrough that finishes with a class-based application.' },
  ],
};
