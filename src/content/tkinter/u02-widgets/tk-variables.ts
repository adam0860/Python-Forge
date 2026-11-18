import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-variables',
  title: 'Tk Variables and Live Updates',
  summary: 'Use StringVar, IntVar, DoubleVar and BooleanVar to link widgets to data: share one variable between widgets so they stay in sync, update labels by changing a variable, and react to every change with trace_add. Includes the errors and traps that catch almost everyone once.',
  minutes: 30,
  objectives: [
    'Create the four tk variable types and read or write them with `get()` and `set()`',
    'Use `textvariable=` to make a Label or Entry follow a variable, and share one variable between widgets',
    'React to changes with `trace_add("write", callback)` and remove a trace again',
    'Explain why `IntVar.get()` can raise `TclError`, and handle it',
    'Avoid the traps: no root window yet, variables that get garbage-collected, and traces that set their own variable',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A variable that widgets can watch',
      blocks: [
        {
          type: 'p',
          text: 'A **tk variable** is a small Python object whose value is also known to Tk. When either side changes it, the other side sees the change at once. That is the trick behind live-updating interfaces: instead of finding a Label and calling `config(text=...)` every time something changes, you give the Label a variable with `textvariable=` and from then on you just `set()` the variable.',
        },
        {
          type: 'table',
          headers: ['Class', 'Holds', 'Default', 'Notes'],
          rows: [
            ['`tk.StringVar`', 'Text', '`""`', 'The most flexible: any value is shown as text'],
            ['`tk.IntVar`', 'Whole numbers', '`0`', '`get()` raises `TclError` if the text is not a number'],
            ['`tk.DoubleVar`', 'Floating-point numbers', '`0.0`', '`get()` always returns a `float`, even after `set(3)`'],
            ['`tk.BooleanVar`', 'True / False', '`False`', 'Accepts `1`, `0`, `True`, `False`, and strings like `"yes"`'],
          ],
          caption: 'The four variable classes. Every one has `get()` and `set(value)`, and an optional `value=` argument when you create it.',
        },
        {
          type: 'code',
          title: 'live_counter.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Live counter")

text = tk.StringVar()
count = tk.StringVar(value="0 characters")


def update(*args):
    n = len(text.get())
    count.set(f"{n} character" + ("" if n == 1 else "s"))


text.trace_add("write", update)

entry = tk.Entry(root, textvariable=text, width=30)
entry.pack(padx=20, pady=(20, 5))
tk.Label(root, textvariable=count).pack(pady=(0, 5))
tk.Label(root, textvariable=text, fg="gray").pack(pady=(0, 20))
entry.focus()
root.mainloop()`,
          annotations: [
            { lines: '6-7', text: 'Two variables: the raw `text` and a derived `count` message. `value=` sets the starting content.' },
            { lines: '10-12', text: 'The callback accepts `*args`: tkinter passes it three arguments (the variable’s internal name, an index and the mode), which most callbacks ignore.' },
            { lines: 15, text: '`trace_add("write", ...)` runs `update` **every time the variable is written**, so on every keystroke in the entry.' },
            { lines: 17, text: '`textvariable=text` links the Entry to the variable: typing changes `text`, and `text.set(...)` changes the box.' },
            { lines: '19-20', text: 'Labels follow their variables. The first shows the count message; the second shows the very text being typed, a free live mirror.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not use config() everywhere?',
          text: '`label.config(text=...)` needs a reference to that exact label, in the right place, every time anything changes. With a variable you update **data**, and any number of widgets that watch it follow. That separation of data and display is the first step towards the structured programs you build in the last unit of this course.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Two Entry widgets are created with `textvariable=name` using the **same** StringVar. The user types `abc` into the first. What does the second one show?',
      options: [
        { text: '`abc`, immediately', correct: true, why: 'Both widgets are linked to one variable. Typing in the first writes the variable, and the second redraws from it.' },
        { text: 'Nothing, until `get()` is called on the first entry', why: 'No manual copy is needed. The link works in both directions automatically.' },
        { text: 'Nothing, because only one widget can use a variable', why: 'Any number of widgets may share a variable. That is a feature: radio buttons rely on it.' },
        { text: '`abc`, but only after the user presses Enter', why: 'Variables update on every change, not on Enter.' },
      ],
      explanation: 'A shared variable is a live connection between all widgets that use it. This is also how Radiobutton groups work.',
    },
    {
      kind: 'concept',
      title: 'How a trace works, and what it can read',
      blocks: [
        {
          type: 'p',
          text: 'A **trace** is a callback attached to a variable. `var.trace_add(mode, callback)` accepts `"write"` (the value changed), `"read"` (someone called `get()`) or `"unset"`, and returns an identifier that you pass to `var.trace_remove(mode, identifier)` to stop it. Inside, a variable is little more than a value plus a list of watchers, which you can model in a few lines of plain Python:',
        },
        {
          type: 'code',
          title: 'variable_model.py',
          runnable: true,
          code: `class Var:
    """A very small model of a tk variable with write traces."""

    def __init__(self, value=""):
        self._value = value
        self._watchers = []

    def trace_add(self, callback):
        self._watchers.append(callback)

    def get(self):
        return self._value

    def set(self, value):
        self._value = value
        for watcher in self._watchers:
            watcher(self)


log = []
name = Var()
name.trace_add(lambda v: log.append(f"changed to {v.get()!r}"))
name.set("Ada")
name.set("Grace")
print(log)
print(name.get())`,
          output: `["changed to 'Ada'", "changed to 'Grace'"]
Grace`,
          annotations: [
            { lines: '4-6', text: 'A variable is a value plus a list of watcher functions.' },
            { lines: '8-9', text: 'Adding a trace just stores the callback.' },
            { lines: '14-17', text: '`set` stores the new value **and then calls every watcher**. The real thing does this for each write, even when the new value equals the old one.' },
            { lines: '22-26', text: 'Each `set` triggers the callback once. Reading with `get()` (last line) is not traced here, whereas in real tkinter you may also ask for `"read"` traces.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not write the variable from inside its own write trace',
          text: 'If the callback does `var.set(...)`, that write fires the trace again, which sets the variable again, and so on: tkinter ends with a deep recursion error. If you need to normalise what the user typed (for example, upper-casing), compare first and only `set` when the value actually changes, or validate with a different mechanism such as the Entry’s `validatecommand`.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Three classic traps',
          text: '**1.** Creating a variable before `tk.Tk()` raises `RuntimeError: Too early to create variable: no default root window`: create the root first. **2.** A variable held only in a local name that goes out of scope is garbage-collected and its widgets go blank: keep a reference (module level, or `self.` in a class). **3.** `Label(textvariable=v, text="x")`: the variable **wins**; the `text` option is only the initial value.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A write trace on a StringVar is only called when the new value is different from the old one.',
      answer: false,
      explanation: 'False. A write trace is called on **every** write, including `var.set("a")` when the variable already holds `"a"`. If your callback is expensive, compare with the previous value yourself.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that runs `on_change` every time the StringVar `query` is written to.',
      template: `query.___("___", on_change)`,
      templateIsCode: true,
      blanks: [{ answers: ['trace_add'] }, { answers: ['write'] }],
      wordBank: ['trace_add', 'write', 'read', 'bind', 'after'],
      explanation: '`trace_add(mode, callback)` attaches the callback, and mode `"write"` means “when the value is changed”. `bind` is for events on widgets (a later lesson) and `after` for timers.',
    },
    {
      kind: 'concept',
      title: 'Types, conversion and errors',
      blocks: [
        {
          type: 'p',
          text: 'An Entry linked to an **IntVar** looks convenient: no `int()` call needed. But the text box can hold anything, and `IntVar.get()` has to turn that text into a number. If the box is **empty** or contains `abc`, `get()` raises `_tkinter.TclError` (a subclass of `Exception`, available as `tk.TclError`), and an unhandled error inside a callback means the user sees nothing happen.',
        },
        {
          type: 'code',
          title: 'safe_read.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
amount = tk.IntVar()


def double():
    try:
        value = amount.get()
    except tk.TclError:
        result.config(text="Enter a whole number")
        return
    result.config(text=f"Double: {value * 2}")


tk.Entry(root, textvariable=amount, width=10).pack(padx=20, pady=(20, 5))
tk.Button(root, text="Double it", command=double).pack()
result = tk.Label(root, text="")
result.pack(pady=(5, 20))
root.mainloop()`,
          annotations: [
            { lines: 4, text: 'The IntVar starts at `0`, so the box starts showing `0`. Use a StringVar and your own `parse` function instead if you want an empty start.' },
            { lines: '8-10', text: 'Wrap `get()` in `try`/`except tk.TclError`. An empty box or non-numeric text fails here, not at the entry.' },
            { lines: '11-12', text: 'Say what is wrong in the window, then `return` so that the rest of the function does not run with a missing `value`.' },
          ],
        },
        {
          type: 'p',
          text: 'A pattern many programs prefer: link the Entry to a **StringVar** and write a plain `parse_number(text)` function, exactly as in the Entry lesson. Plain functions are easy to test, you control the error message, and nothing depends on how Tk converts text.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Two watchers are attached to the same model variable, in this order.',
      code: `class Var:
    def __init__(self):
        self.value = ""
        self.watchers = []

    def set(self, value):
        self.value = value
        for watcher in self.watchers:
            watcher(value)


log = []
v = Var()
v.watchers.append(lambda x: log.append(x.upper()))
v.watchers.append(lambda x: log.append(x * 2))
v.set("ab")
print(log)`,
      answer: "['AB', 'abab']",
      hint: 'The watchers run in the order they were added, once per set.',
      explanation: '`set` calls the first watcher (appending `"AB"`) and then the second (appending `"abab"`). Real traces also run in the order in which they were added, once for each write.',
    },
    {
      kind: 'error',
      prompt: 'Running this script fails with `RuntimeError: Too early to create variable: no default root window`. Tap the line that causes it.',
      lines: [
        'import tkinter as tk',
        '',
        'name = tk.StringVar()',
        'root = tk.Tk()',
        'tk.Entry(root, textvariable=name).pack()',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'A tk variable belongs to a Tk interpreter, which only exists once `tk.Tk()` has been called. Create the root first (line 4), then the variable, or pass the root explicitly with `tk.StringVar(root)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A StringVar has one write trace that counts its calls. The program then runs `var.set("a")`, `var.set("a")`, `var.get()`, `var.set("b")`, `var.set("b")` in that order. How many times is the trace called?',
      answer: '4',
      hint: 'Count every `set`. Does `get()` count as a write? Does an identical value count?',
      explanation: 'Every `set` is a write, even when the value does not change, so the four calls to `set` call the trace four times. The `get()` is a read, which a write trace ignores.',
      label: 'Trace calls:',
    },
    {
      kind: 'concept',
      title: 'Your turn: three small tools',
      blocks: [
        {
          type: 'p',
          text: 'The exercises use the tkinter stand-in, which has the same variable classes, the same `textvariable` linking, the same `trace_add` and the same `TclError` as the real library. You will connect two widgets to one variable, attach a trace, and read an `IntVar` safely.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Check the behaviour you rely on',
          text: 'When you are not sure how a variable behaves, a three-line experiment in the interpreter (`v = tk.IntVar(); v.set("abc"); v.get()`) is faster than reading documentation, and it is the best way to learn which operations raise errors.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_mirror(parent)`. Create a `StringVar`, an `Entry` and a `Label` inside `parent`, with **both** widgets linked to that variable through `textvariable`. Pack them, and return the tuple `(var, entry, label)`.',
      starter: `import tkinter as tk


def make_mirror(parent):
    ...
`,
      solution: `import tkinter as tk


def make_mirror(parent):
    var = tk.StringVar(parent)
    entry = tk.Entry(parent, textvariable=var)
    label = tk.Label(parent, textvariable=var)
    entry.pack()
    label.pack()
    return var, entry, label
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
frame = tk.Frame(root)
frame.pack()
var, entry, label = make_mirror(frame)
assert isinstance(var, tk.StringVar) and isinstance(entry, tk.Entry) and isinstance(label, tk.Label)
assert entry.winfo_manager() == "pack" and label.winfo_manager() == "pack"
assert entry.winfo_parent() == str(frame) and label.winfo_parent() == str(frame)
var.set("hello")
assert entry.get() == "hello"
assert label.cget("text") == "hello"
entry.insert("end", "!")
assert var.get() == "hello!"
assert label.cget("text") == "hello!"
entry.delete(0, "end")
assert var.get() == "" and label.cget("text") == ""`,
      checks: ['Creates a `StringVar`, an `Entry` and a `Label` inside `parent`', 'Links **both** widgets with `textvariable=var`, so they always agree', 'Packs both and returns `(var, entry, label)`'],
      hint: 'Create `var = tk.StringVar(parent)` first, then `tk.Entry(parent, textvariable=var)` and `tk.Label(parent, textvariable=var)`. Pack both and `return var, entry, label`.',
      explanation: 'That is the whole “live preview” mechanism: no callback, no `config`. Both widgets display the same variable, so typing in the entry updates the label by itself.',
    },
    {
      kind: 'code',
      prompt: 'Write `watch(var, log)`. It attaches a **write** trace to the variable that appends the variable’s new value to the list `log` each time it changes. Return the trace’s identifier (what `trace_add` returns).',
      starter: `import tkinter as tk


def watch(var, log):
    ...
`,
      solution: `import tkinter as tk


def watch(var, log):
    def on_write(*args):
        log.append(var.get())

    return var.trace_add("write", on_write)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
v = tk.StringVar(root)
log = []
ident = watch(v, log)
assert ident, "return the identifier from trace_add"
v.set("a")
v.set("b")
assert log == ["a", "b"], log
v.get()
assert log == ["a", "b"], "reading is not a write"
v.trace_remove("write", ident)
v.set("c")
assert log == ["a", "b"], "the trace was removed"
n = tk.IntVar(root)
log2 = []
watch(n, log2)
n.set(5)
n.set(7)
assert log2 == [5, 7]`,
      checks: ['Attaches a `"write"` trace with `trace_add`', 'The callback accepts the three arguments tkinter passes (`*args`) and appends `var.get()` to `log`', 'Returns the identifier from `trace_add` so that the caller can remove the trace later'],
      hint: 'Define `on_write(*args)` that appends `var.get()` to `log`, then `return var.trace_add("write", on_write)`.',
      explanation: 'The callback must take `*args` because tkinter calls it with three arguments. Returning the identifier lets the caller call `trace_remove` later, which matters when a window closes and you no longer want the callback to run.',
    },
    {
      kind: 'code',
      prompt: 'Write `read_int(var, default)`. Return `var.get()` for an `IntVar`, but if the variable’s text is empty or not a number (the case in which `get()` raises `tk.TclError`) return `default` instead.',
      starter: `import tkinter as tk


def read_int(var, default):
    ...
`,
      solution: `import tkinter as tk


def read_int(var, default):
    try:
        return var.get()
    except tk.TclError:
        return default
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
v = tk.IntVar(root)
e = tk.Entry(root, textvariable=v)
assert read_int(v, -1) == 0
e.delete(0, tk.END)
assert read_int(v, -1) == -1, "an empty box is not a number"
e.insert(0, "abc")
assert read_int(v, 99) == 99
e.delete(0, tk.END)
e.insert(0, "12")
assert read_int(v, -1) == 12
v.set(40)
assert read_int(v, -1) == 40
e.delete(0, tk.END)
e.insert(0, "-3")
assert read_int(v, 0) == -3`,
      checks: ['Returns `var.get()` when the variable holds a valid whole number (including `0` and negatives)', 'Catches `tk.TclError` and returns `default` for empty or non-numeric text', 'Does not catch every exception: only the `TclError` that `get()` raises'],
      hint: 'Put `return var.get()` inside `try`, and `return default` in `except tk.TclError:`.',
      explanation: 'Catching the specific `tk.TclError` (rather than a bare `except`) keeps real bugs visible. A bare `except:` would also hide typos and keyboard interrupts.',
    },
  ],
  takeaways: [
    'A **tk variable** (`StringVar`, `IntVar`, `DoubleVar`, `BooleanVar`) is a value that Python and Tk share. `get()` reads it, `set()` writes it, and `value=` gives a starting value.',
    '`textvariable=` makes a Label or Entry follow a variable, and any number of widgets can share one variable, so they stay in sync without any callback code.',
    '`var.trace_add("write", callback)` runs the callback on **every** write (even an identical value) and passes three arguments, so define it with `*args`. `trace_remove("write", id)` stops it.',
    '`IntVar.get()` raises `tk.TclError` when its text is empty or not a number. Catch it, or keep text in a `StringVar` and parse it with your own function.',
    'Traps: create the root before any variable, keep a reference so the variable is not garbage-collected, and never `set` a variable inside its own write trace without a guard.',
  ],
  reading: [
    { title: 'Python docs: tkinter, coupling widget variables', url: 'https://docs.python.org/3/library/tkinter.html#coupling-widget-variables', source: 'docs', note: 'The official description of the four variable classes and how widgets use them.' },
    { title: 'TkDocs: Basic Widgets, Entry and variables', url: 'https://tkdocs.com/tutorial/widgets.html#entry', source: 'tutorial', note: 'Examples of textvariable and value-passing between widgets.' },
    { title: 'Tcl/Tk manual: trace', url: 'https://www.tcl.tk/man/tcl8.6/TclCmd/trace.htm', source: 'docs', note: 'The underlying Tcl mechanism that trace_add is built on.' },
  ],
};
