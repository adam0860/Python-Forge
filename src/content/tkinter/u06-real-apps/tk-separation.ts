import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-separation',
  title: 'Separating Logic from the Interface (and Testing It)',
  summary: 'Split a GUI program into a model (plain Python rules and data), a view (widgets) and the glue between them, so that the important code can be tested without a window. Includes unittest basics and how to drive a real window in a test.',
  minutes: 36,
  objectives: [
    'Explain why calculations, validation and data rules should not live inside widget callbacks',
    'Write the logic of an application as plain functions and classes that never import or use widgets',
    'Write `unittest` tests for that logic, including expected errors with `assertRaises`',
    'Build a thin view that only shows model data and forwards user actions to the model',
    'Test a window by creating it, calling `invoke()` and `event_generate()`, and reading widget values',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Why separate logic from the interface?',
      blocks: [
        {
          type: 'p',
          text: 'A callback that reads three entries, validates them, calculates something and writes the result into a label mixes three jobs: **user interface**, **rules** and **display**. You can only test it by opening a window, clicking and looking, which is slow, boring and easy to skip. The rules inside also cannot be reused in a command-line tool or a web page. The cure is to give each job its own place:',
        },
        {
          type: 'table',
          headers: ['Layer', 'What it contains', 'Knows about tkinter?'],
          rows: [
            ['**Model** (logic)', 'Data and rules: parsing, validation, calculations, saving and loading. Plain functions and classes', '**No.** It never imports `tkinter`'],
            ['**View**', 'Widgets and layout. Shows values, collects input, nothing else', 'Yes'],
            ['**Glue** (controller)', 'The callbacks: read the widgets, call the model, show the result or the error', 'Yes, but each callback is only a few lines'],
          ],
          caption: 'A small model/view split. Bigger programs add more structure, but this alone removes most of the pain.',
        },
        {
          type: 'p',
          text: 'In the tip calculator below, `parse_money` and `split_bill` are the model: they take values and return values. The class is the view and the glue: its `calculate` method reads the entries, asks the model, and displays what comes back. A bug in the arithmetic can be found and fixed without ever opening the window.',
        },
        {
          type: 'code',
          title: 'tip_app.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk


def parse_money(text):
    """Return (value, error). Logic only: no widgets here."""
    text = text.strip().replace(",", ".")
    if not text:
        return None, "Enter the bill"
    try:
        value = float(text)
    except ValueError:
        return None, "Not a number"
    if value <= 0:
        return None, "Must be positive"
    return round(value, 2), None


def split_bill(bill, tip_percent, people):
    total = bill * (1 + tip_percent / 100)
    return round(total, 2), round(total / people, 2)


class TipApp(ttk.Frame):
    def __init__(self, parent):
        super().__init__(parent, padding=16)
        self.bill = tk.StringVar()
        self.result = tk.StringVar(value="Enter a bill")
        ttk.Label(self, text="Bill:").grid(row=0, column=0, sticky="w")
        ttk.Entry(self, textvariable=self.bill, width=12).grid(row=0, column=1)
        ttk.Label(self, text="Tip %:").grid(row=1, column=0, sticky="w")
        self.tip = tk.Spinbox(self, from_=0, to=30, width=5)
        self.tip.grid(row=1, column=1)
        ttk.Label(self, text="People:").grid(row=2, column=0, sticky="w")
        self.people = tk.Spinbox(self, from_=1, to=20, width=5)
        self.people.grid(row=2, column=1)
        ttk.Button(self, text="Calculate", command=self.calculate).grid(row=3, column=0, columnspan=2, pady=8)
        ttk.Label(self, textvariable=self.result).grid(row=4, column=0, columnspan=2)

    def calculate(self):
        bill, error = parse_money(self.bill.get())
        if error:
            self.result.set(error)
            return
        total, each = split_bill(bill, int(self.tip.get()), int(self.people.get()))
        self.result.set(f"Total {total:.2f}, each {each:.2f}")


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Tip calculator")
    TipApp(root).pack()
    root.mainloop()`,
          annotations: [
            { lines: '5-16', text: '`parse_money` turns text into a number or an **error message**, returning a pair instead of raising, so that the view can display the message. It has no idea where the text comes from.' },
            { lines: '19-21', text: '`split_bill` is arithmetic and nothing else. You can call it from a test, a script or a web server.' },
            { lines: '24-38', text: 'The view: it creates widgets and keeps the `StringVar`s and `Spinbox`es that it needs to read later. There are no rules in this part.' },
            { lines: '40-46', text: 'The glue is short: read the inputs, call the model, show what comes back. Each branch is one step, so there is little that can go wrong that tests of the model would not already have caught.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why this makes programs easier to change as well',
          text: 'A separated program can have its interface replaced (a new layout, ttk instead of tk, even a web page) without touching the rules, and its rules changed (a new tax, a new file format) without touching the widgets. The seam between the two is a handful of function calls whose names and arguments you can read at a glance.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these can be tested **without** opening a window?',
      options: [
        { text: 'A function `split_bill(bill, tip, people)` that takes numbers and returns numbers', correct: true, why: 'It has no widgets, no events and no `mainloop`: call it with arguments and compare the return value.' },
        { text: 'A callback that reads three entries and writes into a label', why: 'It needs real (or simulated) widgets to read and write, so a window has to exist.' },
        { text: 'A method that changes the title of the window when a menu item is chosen', why: 'It is about the window itself.' },
        { text: 'A handler that draws a shape on a canvas when the mouse is clicked', why: 'It needs the canvas and an event.' },
      ],
      explanation: 'The goal of the separation is to make as much of the program as possible look like the first option: values in, values out. The code that remains tied to widgets is small, and gets tested with a few button clicks.',
    },
    {
      kind: 'truefalse',
      prompt: 'A module that has `import tkinter as tk` at the top cannot even be imported on a computer that has no display.',
      answer: false,
      explanation: 'False. Importing tkinter works without a display; the error `TclError: no display name and no DISPLAY environment variable` only appears when the program creates a window with `tk.Tk()`. Keep window creation inside functions or under `if __name__ == "__main__":`, and a module with a GUI class can still be imported, and its logic tested, anywhere.',
    },
    {
      kind: 'concept',
      title: 'Testing the logic with unittest',
      blocks: [
        {
          type: 'p',
          text: 'Python ships with **`unittest`**. A test is a method whose name starts with `test_` in a class that inherits from `unittest.TestCase`; inside it you call the code under test and check the outcome with assertion methods such as `assertEqual(actual, expected)`, `assertTrue`, `assertIn` and `assertRaises` (a context manager that passes only if the block raises that exception). Run the file with `python -m unittest` (or with a test runner such as pytest) and a dot is printed for every test that passes.',
        },
        {
          type: 'code',
          title: 'test_todo.py',
          runnable: true,
          code: `import io
import unittest


class TodoList:
    def __init__(self):
        self.items = []

    def add(self, title):
        title = title.strip()
        if not title:
            raise ValueError("title is empty")
        self.items.append({"title": title, "done": False})

    def toggle(self, index):
        self.items[index]["done"] = not self.items[index]["done"]

    def remaining(self):
        return sum(1 for item in self.items if not item["done"])


class TodoTests(unittest.TestCase):
    def test_add_and_count(self):
        todo = TodoList()
        todo.add("  milk ")
        todo.add("eggs")
        self.assertEqual(todo.remaining(), 2)
        self.assertEqual(todo.items[0]["title"], "milk")

    def test_toggle(self):
        todo = TodoList()
        todo.add("milk")
        todo.toggle(0)
        self.assertEqual(todo.remaining(), 0)

    def test_empty_title(self):
        with self.assertRaises(ValueError):
            TodoList().add("   ")


suite = unittest.defaultTestLoader.loadTestsFromTestCase(TodoTests)
result = unittest.TextTestRunner(stream=io.StringIO()).run(suite)
print(result.testsRun, "tests run, all passed:", result.wasSuccessful())`,
          output: `3 tests run, all passed: True`,
          annotations: [
            { lines: '5-19', text: 'The model: a to-do list that does not know what a window is. It validates input (an empty title is an error) and answers questions (`remaining`).' },
            { lines: '22-34', text: 'Each test builds its own fresh object, does something, and asserts on the outcome. Tests must not depend on each other or on the order that they run in.' },
            { lines: '36-38', text: '`assertRaises` expects an exception: the test **fails** if the block does not raise `ValueError`. This is how you test the error paths as well as the happy path.' },
            { lines: '41-43', text: 'Normally you would run `python -m unittest`. Here the runner is called from code, with its text output sent into a `StringIO`, and the summary is read from the result object.' },
          ],
        },
        {
          type: 'p',
          text: 'Good tests are small, named for what they check (`test_empty_title`), and cover the edges as well as the typical case: empty input, zero, negative numbers, very large values, text that is almost a number. Those edge cases are exactly where GUI programs misbehave, since a user can type anything into an entry.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the two assertions inside a `unittest.TestCase`.',
      template: `self.___(parse_money("12,5"), (12.5, None))
with self.___(ValueError):
    todo.add("")`,
      templateIsCode: true,
      blanks: [{ answers: ['assertEqual'] }, { answers: ['assertRaises'] }],
      wordBank: ['assertEqual', 'assertRaises', 'assertTrue', 'assertIn', 'skipTest'],
      explanation: '`assertEqual(actual, expected)` compares two values, and `assertRaises(ExceptionType)` used as a `with` block passes only if the block raises that exception.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this model function. (A test would call it exactly like this.)',
      code: `def split_bill(bill, tip, people):
    total = bill * (1 + tip / 100)
    return round(total, 2), round(total / people, 2)


print(split_bill(80, 25, 4))`,
      answer: '(100.0, 25.0)',
      hint: 'A 25% tip on 80 is 20.',
      explanation: 'The total is 80 x 1.25 = 100.0, and split four ways it is 25.0 each. The function returns a tuple of two numbers, which is what makes it so easy to test: `assertEqual(split_bill(80, 25, 4), (100.0, 25.0))`.',
    },
    {
      kind: 'concept',
      title: 'Testing the view',
      blocks: [
        {
          type: 'p',
          text: 'Some code does have to touch widgets: the view and the glue. Test them in the way that a user would use them. Create a root window, build the frame, **fill the entries**, **press the button with `button.invoke()`** (it calls the command exactly as a click does), call `root.update()` to let pending events and `after(0)` callbacks run, and then **read** what the widgets show with `get()`, `cget("text")` or `var.get()`. Always `destroy()` the root at the end, so that the next test starts clean.',
        },
        {
          type: 'table',
          headers: ['To simulate...', 'Use'],
          rows: [
            ['A click on a button', '`button.invoke()`'],
            ['Typing into an entry', '`entry.delete(0, "end")` then `entry.insert(0, "12.5")` (or set its `StringVar`)'],
            ['A key press or a mouse click', '`widget.event_generate("<Return>")`, `canvas.event_generate("<Button-1>", x=10, y=20)`. Give a key event focus first with `focus_force()` and `update()`'],
            ['Waiting for `after` callbacks', '`root.update()` runs those that are due; a test must not use real sleeping'],
            ['Dialogs that would block', 'Replace `messagebox.askyesno` with a function that returns what you want, as in the dialogs lesson'],
            ['A machine with no display (CI servers)', 'On Linux run the tests under `xvfb-run`, or skip them when `tk.Tk()` raises `TclError`'],
          ],
          caption: 'Driving a tkinter window from test code.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A test pyramid for GUIs',
          text: 'Aim for many fast tests of the model (hundreds, no window), a few tests of each view that click through the main paths (dozens, one window each), and a short manual check of looks and layout before you ship. If a bug appears in a view test, ask whether the logic could have been in the model: moving it there makes the next test faster and more precise.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `TypeError: split_bill() missing 1 required positional argument: \'people\'`. Tap the line that raises it.',
      lines: [
        'def split_bill(bill, tip, people):',
        '    return bill * (1 + tip / 100) / people',
        'each = split_bill(80, 25)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The call leaves out the third argument. Because the logic is a plain function, a test that calls it directly finds the mistake at once, with a clear message, while the same mistake inside a callback would only show up after clicking through the window.',
    },
    {
      kind: 'numeric',
      prompt: 'A test class has 3 test methods and one of them fails. After `unittest` runs the whole class, what is `result.testsRun`?',
      answer: '3',
      hint: 'The count includes tests that failed.',
      explanation: '`testsRun` counts every test that was started, passing or failing, so it is 3. The number of failures is in `len(result.failures)` (here 1), and `result.wasSuccessful()` is `False`.',
      label: 'testsRun:',
    },
    {
      kind: 'concept',
      title: 'Your turn: model and view',
      blocks: [
        {
          type: 'p',
          text: 'Write the first two exercises as plain Python: the tests do not need a window at all. The third is a thin view: it should do no work of its own, but only ask a model for data and show it. Its tests use a stand-in model, to show that the view works with anything that has the right methods.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `TodoModel` (no tkinter). `add(title)` appends an item with the stripped title that is not done, and raises `ValueError` if the stripped title is empty. `toggle(index)` flips an item’s done flag. `remove(index)` deletes an item. `remaining()` counts the items that are not done. `clear_done()` removes all done items and returns how many were removed. `lines()` returns a list of strings: `"[ ] milk"` for open items and `"[x] milk"` for done ones.',
      starter: `class TodoModel:
    ...
`,
      solution: `class TodoModel:
    def __init__(self):
        self.items = []

    def add(self, title):
        title = title.strip()
        if not title:
            raise ValueError("title is empty")
        self.items.append({"title": title, "done": False})

    def toggle(self, index):
        self.items[index]["done"] = not self.items[index]["done"]

    def remove(self, index):
        del self.items[index]

    def remaining(self):
        return sum(1 for item in self.items if not item["done"])

    def clear_done(self):
        before = len(self.items)
        self.items = [item for item in self.items if not item["done"]]
        return before - len(self.items)

    def lines(self):
        return [("[x] " if item["done"] else "[ ] ") + item["title"] for item in self.items]
`,
      tests: `m = TodoModel()
assert m.lines() == [] and m.remaining() == 0
m.add("  milk ")
m.add("eggs")
m.add("bread")
assert m.lines() == ["[ ] milk", "[ ] eggs", "[ ] bread"], m.lines()
for bad in ("", "   ", "\\t"):
    try:
        m.add(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("an empty title must raise ValueError")
assert len(m.lines()) == 3, "a rejected title must not be added"
m.toggle(1)
m.toggle(2)
assert m.lines() == ["[ ] milk", "[x] eggs", "[x] bread"]
assert m.remaining() == 1
m.toggle(2)
assert m.remaining() == 2
m.toggle(2)
assert m.clear_done() == 2
assert m.lines() == ["[ ] milk"] and m.clear_done() == 0
m.remove(0)
assert m.lines() == [] and m.remaining() == 0`,
      checks: ['Titles are stripped, and an empty title raises `ValueError` without adding anything', '`toggle`, `remove` and `remaining` use the item’s index and its done flag', '`clear_done` returns the number of removed items, and `lines` shows `[ ]` or `[x]` before each title'],
      hint: 'Keep `self.items` as a list of dicts with `"title"` and `"done"`. `clear_done` can rebuild the list with a comprehension and return the difference in length.',
      explanation: 'Nothing here mentions a window, so the class can be tested in milliseconds, saved to a file, or put behind a web page. The view in the last exercise will only call `add`, `lines` and `remaining`.',
    },
    {
      kind: 'code',
      prompt: 'Write `parse_amount(text)`, returning a pair `(value, error)`. Strip the text and accept a comma as the decimal separator. Return `(None, "Enter an amount")` for empty text, `(None, "Not a number")` if it is not a finite number (this includes `"nan"` and `"inf"`), `(None, "Must be positive")` if the number is zero or negative, and otherwise `(round(value, 2), None)`.',
      starter: `import math


def parse_amount(text):
    ...
`,
      solution: `import math


def parse_amount(text):
    text = text.strip().replace(",", ".")
    if not text:
        return None, "Enter an amount"
    try:
        value = float(text)
    except ValueError:
        return None, "Not a number"
    if not math.isfinite(value):
        return None, "Not a number"
    if value <= 0:
        return None, "Must be positive"
    return round(value, 2), None
`,
      tests: `assert parse_amount("12.5") == (12.5, None)
assert parse_amount("  7  ") == (7.0, None)
assert parse_amount("12,5") == (12.5, None)
assert parse_amount("3.14159") == (3.14, None)
assert parse_amount("1e3") == (1000.0, None)
assert parse_amount("") == (None, "Enter an amount")
assert parse_amount("   ") == (None, "Enter an amount")
assert parse_amount("abc") == (None, "Not a number")
assert parse_amount("12abc") == (None, "Not a number")
assert parse_amount("nan") == (None, "Not a number")
assert parse_amount("inf") == (None, "Not a number")
assert parse_amount("-inf") == (None, "Not a number")
assert parse_amount("0") == (None, "Must be positive")
assert parse_amount("-4.5") == (None, "Must be positive")`,
      checks: ['Strips the text, accepts `"12,5"` and returns `(None, "Enter an amount")` for empty input', '`float()` failures **and** `nan`/`inf` give `(None, "Not a number")` (use `math.isfinite`)', 'Zero and negative values give `"Must be positive"`; a good value is rounded to two decimals with `None` as the error'],
      hint: 'First `text = text.strip().replace(",", ".")`. Use `try: value = float(text) except ValueError:`. `float("nan")` and `float("inf")` do **not** raise, so test `math.isfinite(value)` as well.',
      explanation: 'Returning `(value, error)` lets the view show the message right next to the field, and lets a test list every kind of bad input in a few lines. Note the trap: `float("nan")` is a valid float, and `nan <= 0` is `False`, so it would sail through a naive “positive?” check.',
    },
    {
      kind: 'code',
      prompt: 'Write the view `TodoView(ttk.Frame)`. `__init__(self, parent, model)` creates `self.listbox` (a `tk.Listbox`), `self.entry` (a `ttk.Entry`), `self.add_button` (a `ttk.Button` with the text `"Add"` that calls `self.add`) and `self.status` (a `StringVar`), then calls `self.refresh()`. `refresh()` replaces the listbox contents with `model.lines()` and sets the status to `f"{model.remaining()} left"`. `add()` calls `model.add(entry text)`; if the model raises `ValueError` the status becomes `"Type something first"`; otherwise it clears the entry and refreshes.',
      starter: `import tkinter as tk
from tkinter import ttk


class TodoView(ttk.Frame):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


class TodoView(ttk.Frame):
    def __init__(self, parent, model):
        super().__init__(parent, padding=8)
        self.model = model
        self.listbox = tk.Listbox(self, height=6)
        self.listbox.pack(fill="both", expand=True)
        self.entry = ttk.Entry(self)
        self.entry.pack(fill="x", pady=4)
        self.add_button = ttk.Button(self, text="Add", command=self.add)
        self.add_button.pack()
        self.status = tk.StringVar()
        ttk.Label(self, textvariable=self.status).pack()
        self.refresh()

    def refresh(self):
        self.listbox.delete(0, "end")
        for line in self.model.lines():
            self.listbox.insert("end", line)
        self.status.set(f"{self.model.remaining()} left")

    def add(self):
        try:
            self.model.add(self.entry.get())
        except ValueError:
            self.status.set("Type something first")
            return
        self.entry.delete(0, "end")
        self.refresh()
`,
      setup: TK_SIM,
      tests: `class FakeModel:
    def __init__(self):
        self.titles = ["milk"]

    def lines(self):
        return ["[ ] " + t for t in self.titles]

    def remaining(self):
        return len(self.titles)

    def add(self, title):
        if not title.strip():
            raise ValueError("empty")
        self.titles.append(title.strip())


root = tk.Tk()
model = FakeModel()
view = TodoView(root, model)
view.pack()
assert isinstance(view.listbox, tk.Listbox) and isinstance(view.add_button, ttk.Button)
assert view.add_button.cget("text") == "Add"
assert view.listbox.get(0, "end") == ("[ ] milk",)
assert view.status.get() == "1 left"
view.add_button.invoke()
assert view.status.get() == "Type something first"
assert view.listbox.get(0, "end") == ("[ ] milk",), "an error must not change the list"
view.entry.insert(0, "eggs")
view.add_button.invoke()
assert view.listbox.get(0, "end") == ("[ ] milk", "[ ] eggs"), view.listbox.get(0, "end")
assert view.status.get() == "2 left"
assert view.entry.get() == "", "the entry is cleared after a successful add"
model.titles.append("bread")
view.refresh()
assert view.listbox.size() == 3 and view.status.get() == "3 left"`,
      checks: ['Creates the four named parts and shows the model’s data at once by calling `refresh()`', '`refresh()` clears the listbox and inserts every line of `model.lines()`, then updates the status from `model.remaining()`', '`add()` passes the entry text to the model, reports a `ValueError` in the status, and on success clears the entry and refreshes'],
      hint: 'In `add`, wrap `self.model.add(self.entry.get())` in `try/except ValueError`. Clear the listbox with `self.listbox.delete(0, "end")` before inserting the lines again.',
      explanation: 'The view contains no rules: it passes text to the model, catches the model’s complaint, and redraws from the model’s answers. Because it only needs `lines`, `remaining` and `add`, the test could use a fake model, and the same view works with the real `TodoModel`, a database-backed one, or anything else with those methods.',
    },
  ],
  takeaways: [
    'Split the program into a **model** (data and rules, no tkinter import), a **view** (widgets and layout) and short **glue** callbacks that read widgets, call the model, and show the result.',
    'Make the model easy to test: functions that take values and return values; return `(value, error)` or raise exceptions for bad input; keep file and database access behind small functions.',
    '`unittest`: classes derived from `TestCase`, methods named `test_...`, `assertEqual`, `assertTrue`, `assertRaises`; run with `python -m unittest`. Test the edges: empty, zero, negative, huge, almost-a-number.',
    'Test a view like a user: fill entries, `button.invoke()`, `event_generate`, `root.update()`, read widget values, and `destroy()` the window at the end. Replace blocking dialogs with fakes.',
    'Importing `tkinter` needs no display, creating `Tk()` does. Keep window creation under `if __name__ == "__main__":` or inside functions so that modules stay importable everywhere.',
  ],
  reading: [
    { title: 'Python docs: unittest', url: 'https://docs.python.org/3/library/unittest.html', source: 'docs', note: 'TestCase, the assert methods, test discovery, and how to run tests from the command line.' },
    { title: 'Real Python: Python’s unittest', url: 'https://realpython.com/python-testing/', source: 'article', note: 'A practical introduction to testing in Python, with unittest and pytest.' },
    { title: 'Martin Fowler: GUI Architectures', url: 'https://martinfowler.com/eaaDev/uiArchs.html', source: 'article', note: 'The history of Model-View-Controller and its relatives, and why separating presentation from logic helps.' },
    { title: 'pytest documentation', url: 'https://docs.pytest.org/', source: 'docs', note: 'The most popular alternative test runner: plain `assert` statements and fixtures.' },
  ],
};
