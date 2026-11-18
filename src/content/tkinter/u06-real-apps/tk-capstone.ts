import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-capstone',
  title: 'Capstone: An Expense Tracker',
  summary: 'Put the whole course to work in one program: a SQLite-backed model with validation and tests, a ttk table, a drop-down list, a Canvas bar chart, CSV export, and a view that only shows what the model says.',
  minutes: 45,
  objectives: [
    'Design a small desktop application as a model, a view and a thin layer of glue, and say what belongs in each',
    'Store data in SQLite with parameterised queries, and summarise it with `GROUP BY`',
    'Validate user input in the model, and report problems to the user without crashing',
    'Show data in a `ttk.Treeview`, choose from a `ttk.Combobox`, and draw a proportional bar chart on a `Canvas`',
    'Export data as CSV with the `csv` module',
    'Test the model with plain asserts, and the view with a stand-in model',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The plan',
      blocks: [
        {
          type: 'p',
          text: 'You will build an **expense tracker**: type a date, a category, an amount and a note, and press Add. The expense appears in a table, a bar chart shows the total for each category, a status line gives the grand total, and a button exports everything as a CSV file that opens in a spreadsheet. Expenses are kept in a **SQLite** database file, so they are still there tomorrow.',
        },
        {
          type: 'p',
          text: 'Almost every idea in the program comes from an earlier lesson. The design from the separation lesson decides where each piece goes:',
        },
        {
          type: 'table',
          headers: ['Part', 'Contents', 'Uses'],
          rows: [
            ['**Model**: `ExpenseStore`', 'Creates the table, validates and adds an expense, lists, deletes, totals per category, exports CSV', '`sqlite3`, `csv`, `datetime`. **No tkinter.**'],
            ['**Pure helpers**', '`monthly_summary(rows, month)`: count, total and the biggest category for one month', 'Plain functions and dictionaries'],
            ['**View**: `ExpenseView`', 'The form, the table, the chart and the status line; `refresh()` redraws all of them from the store', '`ttk.Entry`, `ttk.Combobox`, `ttk.Treeview`, `Canvas`'],
            ['**Glue**', '`add`, `delete_selected` and `export_csv`: read the widgets, call the store, show errors in the status line, refresh', '`StringVar`, dialogs'],
          ],
          caption: 'Four parts, in four small pieces of code.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the model comes first',
          text: 'It is tempting to start with the window, because that is the part you can see. But everything the program promises (an expense is never saved with a bad date, a total is always the sum of the rows, a deleted expense is gone) is a promise made by the model. If it is built and tested first, the window becomes a thin skin over code that is already known to work, and a bug in the view can only be a bug in the display.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Where should the code that adds up the expenses by category live?',
      options: [
        { text: 'In the model (a method or function that works on the data), and the view only calls it and draws the result', correct: true, why: 'Then the same totals feed the chart, the status line and the CSV file, and a test can check them without any window.' },
        { text: 'In the Add button’s callback, because that is where the data changes', why: 'Then every other place that needs totals would have to repeat the calculation, and it could only be tested by clicking.' },
        { text: 'In the Canvas drawing code, since the chart is what shows the totals', why: 'Mixing the calculation with the drawing makes both harder to test and to change.' },
        { text: 'In the `Treeview`, which can calculate sums by itself', why: 'A Treeview only displays rows. It has no idea what the values mean.' },
      ],
      explanation: 'Calculations belong with the data. The view asks the model for `totals()` and turns the answer into bars, which is the only part that needs pixels.',
    },
    {
      kind: 'truefalse',
      prompt: 'It is safe to build an SQL statement with an f-string, such as `f"INSERT INTO expense VALUES (\'{note}\')"`, as long as the program is only used by its owner.',
      answer: false,
      explanation: 'False. A note such as `it\'s lunch` contains a quote that ends the string early, so the statement breaks, and a deliberately crafted note can change what the statement does (SQL injection). Pass values separately as parameters, `execute("INSERT ... VALUES (?)", (note,))`, and the database treats them as data and never as SQL.',
    },
    {
      kind: 'concept',
      title: 'The model, and the whole program',
      blocks: [
        {
          type: 'p',
          text: 'SQLite is a complete database in a single file, and it is built into Python as the `sqlite3` module. A table is created once, rows are added with `INSERT`, removed with `DELETE`, and summarised with `GROUP BY`. The values always go in through `?` placeholders. This short script shows the four statements the program needs, on a database held in memory:',
        },
        {
          type: 'code',
          title: 'sqlite_basics.py',
          runnable: true,
          code: `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE expense (id INTEGER PRIMARY KEY, day TEXT, category TEXT, amount REAL, note TEXT)")
rows = [
    ("2026-11-01", "Food", 12.5, "lunch"),
    ("2026-11-02", "Food", 7.25, "coffee"),
    ("2026-11-02", "Travel", 40, "train"),
]
db.executemany("INSERT INTO expense (day, category, amount, note) VALUES (?, ?, ?, ?)", rows)

for category, total in db.execute("SELECT category, SUM(amount) FROM expense GROUP BY category ORDER BY category"):
    print(category, total)

print(db.execute("DELETE FROM expense WHERE id = ?", (1,)).rowcount)
print(db.execute("SELECT COUNT(*) FROM expense").fetchone()[0])`,
          output: `Food 19.75
Travel 40.0
1
2`,
          annotations: [
            { lines: '4', text: '`INTEGER PRIMARY KEY` makes SQLite number the rows by itself: 1, 2, 3. The `id` is how the program later says “delete that one”.' },
            { lines: '10', text: '`executemany` runs one statement for every tuple in a list. Each `?` is replaced by the matching value, safely.' },
            { lines: '12-13', text: '`GROUP BY category` makes one row per category, and `SUM(amount)` adds up the amounts inside each group. The query is an iterable of tuples.' },
            { lines: '15', text: '`rowcount` says how many rows a `DELETE` removed. It is 0 when the id does not exist, which is how the model can answer “was something deleted?”.' },
          ],
        },
        {
          type: 'p',
          text: 'Here is the complete program. Notice the order: first the model, with all of the SQL and all of the rules; then the view, which has no SQL and no rules; and last the three lines that start it. The class `ExpenseView` holds the glue methods too, because at this size they are only a few lines each.',
        },
        {
          type: 'code',
          title: 'expense_tracker.py',
          desktopOnly: true,
          code: `import csv
import io
import sqlite3
import tkinter as tk
from datetime import date, datetime
from pathlib import Path
from tkinter import filedialog, messagebox, ttk

CATEGORIES = ["Food", "Travel", "Home", "Fun", "Other"]
DB_PATH = Path.home() / ".expense_tracker.db"


class ExpenseStore:
    """The model: all the rules and all the SQL. It knows nothing about tkinter."""

    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(str(path))
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS expense "
            "(id INTEGER PRIMARY KEY, day TEXT, category TEXT, amount REAL, note TEXT)"
        )
        self.db.commit()

    def add(self, day, category, amount, note=""):
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must look like 2026-11-30") from None
        category = category.strip()
        if not category:
            raise ValueError("Choose a category")
        if not 0 < amount < float("inf"):
            raise ValueError("Amount must be positive")
        cursor = self.db.execute(
            "INSERT INTO expense (day, category, amount, note) VALUES (?, ?, ?, ?)",
            (day, category, amount, note.strip()),
        )
        self.db.commit()
        return cursor.lastrowid

    def all(self):
        return self.db.execute(
            "SELECT id, day, category, amount, note FROM expense ORDER BY day, id"
        ).fetchall()

    def delete(self, expense_id):
        cursor = self.db.execute("DELETE FROM expense WHERE id = ?", (expense_id,))
        self.db.commit()
        return cursor.rowcount > 0

    def totals(self):
        rows = self.db.execute(
            "SELECT category, SUM(amount) FROM expense GROUP BY category ORDER BY category"
        )
        return {category: round(total, 2) for category, total in rows}

    def to_csv(self):
        out = io.StringIO()
        writer = csv.writer(out, lineterminator="\\n")
        writer.writerow(["day", "category", "amount", "note"])
        for _id, day, category, amount, note in self.all():
            writer.writerow([day, category, f"{amount:.2f}", note])
        return out.getvalue()


class ExpenseView(ttk.Frame):
    def __init__(self, parent, store):
        super().__init__(parent, padding=10)
        self.store = store
        self.day = tk.StringVar(value=date.today().isoformat())
        self.category = tk.StringVar(value=CATEGORIES[0])
        self.amount = tk.StringVar()
        self.note = tk.StringVar()
        self.status = tk.StringVar()

        form = ttk.Frame(self)
        form.pack(fill="x")
        for column, text in enumerate(("Date", "Category", "Amount", "Note")):
            ttk.Label(form, text=text).grid(row=0, column=column, sticky="w", padx=2)
        ttk.Entry(form, textvariable=self.day, width=11).grid(row=1, column=0, padx=2)
        box = ttk.Combobox(form, textvariable=self.category, values=CATEGORIES, state="readonly", width=8)
        box.grid(row=1, column=1, padx=2)
        ttk.Entry(form, textvariable=self.amount, width=8).grid(row=1, column=2, padx=2)
        ttk.Entry(form, textvariable=self.note, width=20).grid(row=1, column=3, padx=2)
        ttk.Button(form, text="Add", command=self.add).grid(row=1, column=4, padx=2)

        columns = ("day", "category", "amount", "note")
        self.table = ttk.Treeview(self, columns=columns, show="headings", height=8)
        for name, width in zip(columns, (90, 80, 70, 170)):
            self.table.heading(name, text=name.title())
            self.table.column(name, width=width, anchor="e" if name == "amount" else "w")
        self.table.pack(fill="both", expand=True, pady=6)

        self.chart = tk.Canvas(self, width=300, height=120, background="white")
        self.chart.pack()
        buttons = ttk.Frame(self)
        buttons.pack(fill="x", pady=4)
        ttk.Button(buttons, text="Delete selected", command=self.delete_selected).pack(side="left")
        ttk.Button(buttons, text="Export CSV...", command=self.export_csv).pack(side="left", padx=6)
        ttk.Label(self, textvariable=self.status).pack(anchor="w")
        self.refresh()

    def add(self):
        try:
            amount = float(self.amount.get().replace(",", "."))
        except ValueError:
            self.status.set("Amount must be a number")
            return
        try:
            self.store.add(self.day.get(), self.category.get(), amount, self.note.get())
        except ValueError as error:
            self.status.set(str(error))
            return
        self.amount.set("")
        self.note.set("")
        self.refresh()

    def delete_selected(self):
        for iid in self.table.selection():
            self.store.delete(int(iid))
        self.refresh()

    def export_csv(self):
        path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV files", "*.csv")])
        if not path:
            return
        try:
            with open(path, "w", encoding="utf-8", newline="") as f:
                f.write(self.store.to_csv())
        except OSError as error:
            messagebox.showerror("Export", f"Could not write the file:\\n{error}")

    def refresh(self):
        self.table.delete(*self.table.get_children())
        rows = self.store.all()
        for expense_id, day, category, amount, note in rows:
            self.table.insert("", "end", iid=str(expense_id), values=(day, category, f"{amount:.2f}", note))
        total = sum(row[3] for row in rows)
        self.status.set(f"{len(rows)} expenses, total {total:.2f}")
        self.draw_chart(self.store.totals())

    def draw_chart(self, totals):
        self.chart.delete("all")
        biggest = max(totals.values(), default=0)
        for index, (category, total) in enumerate(sorted(totals.items())):
            height = total / biggest * 100
            x = 10 + 50 * index
            self.chart.create_rectangle(x, 110 - height, x + 40, 110, fill="#2e7d32", tags="bar")
            self.chart.create_text(x + 20, 115, text=category[:6], font=("Segoe UI", 8))


if __name__ == "__main__":
    root = tk.Tk()
    root.title("Expense tracker")
    ExpenseView(root, ExpenseStore(DB_PATH)).pack(fill="both", expand=True)
    root.mainloop()`,
          annotations: [
            { lines: '16-22', text: '`CREATE TABLE IF NOT EXISTS` is safe to run on every start: the first run makes the table, and later runs find it. A file path stores the data on disk, while `":memory:"` (the default) keeps it only until the program ends, which is what the tests use.' },
            { lines: '24-39', text: '`add` is where the rules live. Each failure raises a `ValueError` with a message meant for the user, and nothing is written to the database unless every check passes. `0 < amount < float("inf")` is false for `nan` as well, so one test rejects zero, negatives, `nan` and infinity.' },
            { lines: '41-44', text: '`ORDER BY day, id` makes the order reproducible: by date, and by entry order within a day.' },
            { lines: '57-63', text: 'CSV export builds the text in memory, so that a test can check it exactly. The `csv` module takes care of quotes and commas inside values; `f"{amount:.2f}"` always shows two decimals.' },
            { lines: '67-101', text: 'The view builds the form, the table and the chart. It keeps every value that it later needs (`day`, `category`, `amount`, `note`, `status`) as a `StringVar` on `self`, and finishes with `refresh()`, so that the window shows the database from the very first moment.' },
            { lines: '103-116', text: 'The glue for Add. It converts the text, asks the store to add, and turns a `ValueError` into a message on the status line. A comma as a decimal separator is accepted. Only a successful add clears the fields.' },
            { lines: '118-121', text: '`delete_selected` works because `refresh` inserted each row with `iid=str(expense_id)`: the id of a selected row is the database id, so each deletion is one line.' },
            { lines: '133-140', text: '`refresh` is the only place that draws. It clears the table, reloads every row from the store and rebuilds the status line and the chart, which keeps the three of them consistent. For a few thousand rows that is instant.' },
            { lines: '142-149', text: 'The chart: the tallest bar is 100 pixels, and the others are proportional to their totals. The bars grow upwards from `y = 110`, with 50 pixels between the left edges, and each has a short label underneath.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the parameterised statement, so that the values are passed safely instead of being pasted into the text.',
      template: `db.execute("INSERT INTO expense (day, amount) VALUES (___, ___)", (day, amount))`,
      templateIsCode: true,
      blanks: [{ answers: ['?'] }, { answers: ['?'] }],
      wordBank: ['?', '%s', '{}', '$1'],
      explanation: 'Each `?` is a placeholder that receives the next value from the tuple. The database never mistakes a value for SQL, so a quote or a semicolon in the data is harmless.',
    },
    {
      kind: 'predict',
      prompt: 'This loop does by hand what `GROUP BY category` and `SUM(amount)` do in SQL. Predict the output.',
      code: `rows = [("Food", 12.5), ("Travel", 40.0), ("Food", 7.25)]
totals = {}
for category, amount in rows:
    totals[category] = totals.get(category, 0) + amount
print(totals)`,
      answer: "{'Food': 19.75, 'Travel': 40.0}",
      hint: 'Both Food rows are added into the same dictionary entry.',
      explanation: '`totals.get(category, 0)` is the running total so far, or 0 for a new category. Food collects 12.5 + 7.25 = 19.75, and Travel is 40.0. In the real program, SQLite does this work, and `totals()` just wraps the answer in a dictionary.',
    },
    {
      kind: 'concept',
      title: 'Taking it further',
      blocks: [
        {
          type: 'p',
          text: 'With a working base, each extension is a small step, and each is a good test of whether you have understood how the parts fit together. For every one, say first **which layer it belongs to**; that tells you where the code goes.',
        },
        {
          type: 'table',
          headers: ['Extension', 'Layer', 'Hint'],
          rows: [
            ['A month filter (a drop-down of the months in the data)', 'Model + view', '`monthly_summary` already selects a month. Add a `Combobox` whose value is passed in when the table is refreshed'],
            ['Edit an existing expense', 'Model + view', 'An `update(expense_id, ...)` method that runs the same validation as `add`; fill the form from the selected row on double-click'],
            ['Budgets, with a warning when a category goes over', 'Model', 'A `budgets` table and a function that compares totals to limits; the view only colours the result'],
            ['Sort by clicking a column heading', 'View', '`heading(name, command=...)` and the `sort_by` function from the ttk lesson'],
            ['Import from a CSV file', 'Model', 'The reverse of `to_csv`: parse with `csv.reader` and call `add` for each row, collecting the errors'],
            ['Package it for Windows', 'Build', 'The packaging lesson: `--windowed`, an icon, and the database in the settings folder rather than next to the program'],
          ],
          caption: 'Ideas, with the layer each belongs to.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'The shape of a finished project',
          text: 'You now have all the parts of a normal desktop program: a model that owns the data and the rules; a view that follows the model; tests for the part that matters most; files and a database for storage; and a way to ship it. A bigger program is more of the same, in more files. When a project grows, the thing to protect is the seam between the model and the view.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `sqlite3.ProgrammingError: Incorrect number of bindings supplied. The current statement uses 2, and there are 1 supplied.` Tap the line that raises it.',
      lines: [
        'db = sqlite3.connect(":memory:")',
        'db.execute("CREATE TABLE t (a, b)")',
        'db.execute("INSERT INTO t VALUES (?, ?)", (1,))',
        'print(db.execute("SELECT * FROM t").fetchall())',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The statement has two `?` placeholders but the tuple has only one value. Note the trailing comma in `(1,)`: it is what makes a one-item tuple. The number of placeholders and the number of values must always match.',
    },
    {
      kind: 'numeric',
      prompt: 'The chart makes the tallest bar 100 pixels high and scales the others in proportion. Food is 30, Travel is 120 and Home is 90. How many pixels high is the Food bar?',
      answer: '25',
      hint: 'height = total / biggest * 100, and the biggest total is 120.',
      explanation: '30 / 120 = 0.25, and 0.25 x 100 = 25 pixels. Scaling every bar by the same factor keeps the picture truthful: a bar that is half as tall stands for half as much.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the three parts',
      blocks: [
        {
          type: 'p',
          text: 'Write the model, a helper that summarises one month, and the view, in that order. The first two need no window at all. The view is tested with a fake store, so that it is tested on its own: it must do exactly what the specification says with whatever the store returns.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `ExpenseStore(path=":memory:")` using `sqlite3`. `add(day, category, amount, note="")` returns the new row id. It raises `ValueError` (and stores nothing) if `day` is not a valid `YYYY-MM-DD` date (use `datetime.strptime`), if the stripped category is empty, or if the amount is not between 0 and infinity exclusive (so zero, negatives, `nan` and `inf` are rejected). The category and the note are stored stripped. `all()` returns a list of `(id, day, category, amount, note)` tuples ordered by day and then id. `delete(expense_id)` returns `True` if a row was removed and `False` otherwise. `totals()` returns a dictionary of category to the total, rounded to 2 decimals, in alphabetical order. `to_csv()` returns CSV text with the header `day,category,amount,note`, one line per expense in `all()` order, amounts with exactly two decimals, and `"\\n"` line endings.',
      starter: `import csv
import io
import sqlite3
from datetime import datetime


class ExpenseStore:
    ...
`,
      solution: `import csv
import io
import sqlite3
from datetime import datetime


class ExpenseStore:
    def __init__(self, path=":memory:"):
        self.db = sqlite3.connect(str(path))
        self.db.execute(
            "CREATE TABLE IF NOT EXISTS expense "
            "(id INTEGER PRIMARY KEY, day TEXT, category TEXT, amount REAL, note TEXT)"
        )
        self.db.commit()

    def add(self, day, category, amount, note=""):
        try:
            datetime.strptime(day, "%Y-%m-%d")
        except ValueError:
            raise ValueError("Date must look like 2026-11-30") from None
        category = category.strip()
        if not category:
            raise ValueError("Choose a category")
        if not 0 < amount < float("inf"):
            raise ValueError("Amount must be positive")
        cursor = self.db.execute(
            "INSERT INTO expense (day, category, amount, note) VALUES (?, ?, ?, ?)",
            (day, category, amount, note.strip()),
        )
        self.db.commit()
        return cursor.lastrowid

    def all(self):
        return self.db.execute(
            "SELECT id, day, category, amount, note FROM expense ORDER BY day, id"
        ).fetchall()

    def delete(self, expense_id):
        cursor = self.db.execute("DELETE FROM expense WHERE id = ?", (expense_id,))
        self.db.commit()
        return cursor.rowcount > 0

    def totals(self):
        rows = self.db.execute(
            "SELECT category, SUM(amount) FROM expense GROUP BY category ORDER BY category"
        )
        return {category: round(total, 2) for category, total in rows}

    def to_csv(self):
        out = io.StringIO()
        writer = csv.writer(out, lineterminator="\\n")
        writer.writerow(["day", "category", "amount", "note"])
        for _id, day, category, amount, note in self.all():
            writer.writerow([day, category, f"{amount:.2f}", note])
        return out.getvalue()
`,
      tests: `s = ExpenseStore()
assert s.all() == [] and s.totals() == {} and s.to_csv() == "day,category,amount,note\\n"
a = s.add("2026-11-02", "Food", 7.25, "  coffee ")
b = s.add("2026-11-01", " Food", 12.5, "lunch")
c = s.add("2026-11-02", "Travel", 40, "train")
assert (a, b, c) == (1, 2, 3), (a, b, c)
assert s.all() == [
    (2, "2026-11-01", "Food", 12.5, "lunch"),
    (1, "2026-11-02", "Food", 7.25, "coffee"),
    (3, "2026-11-02", "Travel", 40.0, "train"),
], s.all()
assert s.totals() == {"Food": 19.75, "Travel": 40.0}
assert list(s.totals()) == ["Food", "Travel"]
bad = [
    ("2026-13-01", "Food", 5),
    ("yesterday", "Food", 5),
    ("", "Food", 5),
    ("2026-11-01", "   ", 5),
    ("2026-11-01", "Food", 0),
    ("2026-11-01", "Food", -3),
    ("2026-11-01", "Food", float("nan")),
    ("2026-11-01", "Food", float("inf")),
]
for args in bad:
    try:
        s.add(*args)
    except ValueError:
        pass
    else:
        raise AssertionError("should have raised ValueError: %r" % (args,))
assert len(s.all()) == 3, "a rejected expense must not be stored"
assert s.delete(2) is True
assert s.delete(2) is False
assert s.delete(99) is False
assert len(s.all()) == 2
s.add("2026-11-03", "Fun", 9.5, "tickets, popcorn")
assert s.to_csv() == (
    "day,category,amount,note\\n"
    "2026-11-02,Food,7.25,coffee\\n"
    "2026-11-02,Travel,40.00,train\\n"
    '2026-11-03,Fun,9.50,"tickets, popcorn"\\n'
), repr(s.to_csv())
assert s.totals() == {"Food": 7.25, "Fun": 9.5, "Travel": 40.0}
t = ExpenseStore()
assert t.all() == [], "every store has its own database"`,
      checks: ['`add` validates the date, category and amount, raises `ValueError` before storing anything, and returns the new id', '`all()` is ordered by day then id; `delete()` reports whether a row was removed; `totals()` is rounded and alphabetical', '`to_csv()` uses the `csv` module (so commas are quoted), two-decimal amounts and `"\\n"` line endings', 'Values reach SQL only through `?` placeholders'],
      hint: 'Create the table in `__init__` with `CREATE TABLE IF NOT EXISTS`. `cursor.lastrowid` is the id of the inserted row and `cursor.rowcount` the number of deleted rows. The condition `0 < amount < float("inf")` is false for `nan`, so `if not ...` catches it.',
      explanation: 'This class is the heart of the application. It can be used from a command-line tool, a web page or a test, and every promise that the program makes to the user is checked here, in one place, by about thirty lines of asserts.',
    },
    {
      kind: 'code',
      prompt: 'Write `monthly_summary(rows, month)`. `rows` is a list of `(id, day, category, amount, note)` tuples and `month` is text like `"2026-11"`. Use only the rows whose day starts with that month. Return a dictionary with `"count"` (how many rows), `"total"` (their amounts added up and rounded to 2 decimals) and `"top"` (the category with the biggest total in that month; if two categories tie, the alphabetically first; `None` when there are no rows).',
      starter: `def monthly_summary(rows, month):
    ...
`,
      solution: `def monthly_summary(rows, month):
    totals = {}
    count = 0
    for _id, day, category, amount, _note in rows:
        if day[:7] != month:
            continue
        count += 1
        totals[category] = totals.get(category, 0) + amount
    top = None
    if totals:
        top = min(totals, key=lambda name: (-totals[name], name))
    return {"count": count, "total": round(sum(totals.values()), 2), "top": top}
`,
      tests: `rows = [
    (1, "2026-11-01", "Food", 12.5, "a"),
    (2, "2026-11-02", "Travel", 40.0, "b"),
    (3, "2026-10-30", "Fun", 99.0, "c"),
    (4, "2026-11-05", "Food", 30.0, "d"),
    (5, "2026-11-06", "Home", 42.5, "e"),
]
assert monthly_summary(rows, "2026-11") == {"count": 4, "total": 125.0, "top": "Food"}, monthly_summary(rows, "2026-11")
assert monthly_summary(rows, "2026-10") == {"count": 1, "total": 99.0, "top": "Fun"}
assert monthly_summary(rows, "2026-12") == {"count": 0, "total": 0.0, "top": None}
assert monthly_summary([], "2026-11") == {"count": 0, "total": 0.0, "top": None}
more = rows + [(6, "2026-11-09", "Travel", 10.0, "f")]
assert monthly_summary(more, "2026-11")["top"] == "Travel", "Travel 50 is now the biggest"
assert monthly_summary(more, "2025-11")["count"] == 0
assert rows[0] == (1, "2026-11-01", "Food", 12.5, "a")`,
      checks: ['Only rows whose day starts with the month are counted', 'The total is the rounded sum of the amounts, and the count is the number of rows', '`top` is the category with the biggest total, the alphabetically first on a tie, and `None` when there is nothing'],
      hint: 'Compare `day[:7]` with `month`. To pick the biggest category with an alphabetical tie-break, use `min(totals, key=lambda name: (-totals[name], name))`.',
      explanation: 'A pure function over plain tuples: the same code can feed a label in the window, a line in a report or a test. Using `-total` with the name as a second key is a common trick for “largest first, then alphabetical”.',
    },
    {
      kind: 'code',
      prompt: 'Write the view `ExpenseView(ttk.Frame)`; `__init__(self, parent, store)` creates `self.day`, `self.category`, `self.amount`, `self.note` and `self.status` (all `tk.StringVar`), `self.table` (a `ttk.Treeview` with the four columns `"day"`, `"category"`, `"amount"`, `"note"` and `show="headings"`) and `self.chart` (a `tk.Canvas`, 300 wide and 120 high), and then calls `refresh()`. `refresh()` replaces the table rows with `store.all()`, each inserted with `iid=str(id)` and the values `(day, category, f"{amount:.2f}", note)`; sets the status to `f"{count} expenses, total {total:.2f}"`; and draws the chart from `store.totals()`: for the categories in alphabetical order, bar number `i` is a rectangle with the tag `"bar"` from `x = 10 + 50 * i` to `x + 40`, whose bottom is at `y = 110` and whose height is `total / biggest * 100`, where `biggest` is the largest total. `add()` converts `self.amount` to a float (a comma counts as a decimal point); if that fails, the status is `"Amount must be a number"` and nothing else happens. Otherwise it calls `store.add(day, category, amount, note)`. A `ValueError` from the store puts `str(error)` in the status. On success it clears the amount and the note, and refreshes. `delete_selected()` deletes every selected row from the store (the row’s iid is the id) and refreshes.',
      starter: `import tkinter as tk
from tkinter import ttk


class ExpenseView(ttk.Frame):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


class ExpenseView(ttk.Frame):
    def __init__(self, parent, store):
        super().__init__(parent, padding=10)
        self.store = store
        self.day = tk.StringVar()
        self.category = tk.StringVar()
        self.amount = tk.StringVar()
        self.note = tk.StringVar()
        self.status = tk.StringVar()
        columns = ("day", "category", "amount", "note")
        self.table = ttk.Treeview(self, columns=columns, show="headings", height=6)
        for name in columns:
            self.table.heading(name, text=name.title())
        self.table.pack(fill="both", expand=True)
        self.chart = tk.Canvas(self, width=300, height=120)
        self.chart.pack()
        ttk.Label(self, textvariable=self.status).pack(anchor="w")
        self.refresh()

    def add(self):
        try:
            amount = float(self.amount.get().replace(",", "."))
        except ValueError:
            self.status.set("Amount must be a number")
            return
        try:
            self.store.add(self.day.get(), self.category.get(), amount, self.note.get())
        except ValueError as error:
            self.status.set(str(error))
            return
        self.amount.set("")
        self.note.set("")
        self.refresh()

    def delete_selected(self):
        for iid in self.table.selection():
            self.store.delete(int(iid))
        self.refresh()

    def refresh(self):
        self.table.delete(*self.table.get_children())
        rows = self.store.all()
        for expense_id, day, category, amount, note in rows:
            self.table.insert("", "end", iid=str(expense_id), values=(day, category, f"{amount:.2f}", note))
        total = sum(row[3] for row in rows)
        self.status.set(f"{len(rows)} expenses, total {total:.2f}")
        self.draw_chart(self.store.totals())

    def draw_chart(self, totals):
        self.chart.delete("all")
        biggest = max(totals.values(), default=0)
        for index, (category, value) in enumerate(sorted(totals.items())):
            height = value / biggest * 100
            x = 10 + 50 * index
            self.chart.create_rectangle(x, 110 - height, x + 40, 110, tags="bar")
`,
      setup: TK_SIM,
      tests: `class FakeStore:
    def __init__(self):
        self.rows = []
        self.next_id = 1

    def add(self, day, category, amount, note=""):
        if not amount > 0:
            raise ValueError("Amount must be positive")
        self.rows.append((self.next_id, day, category, amount, note))
        self.next_id += 1
        return self.next_id - 1

    def all(self):
        return list(self.rows)

    def delete(self, expense_id):
        before = len(self.rows)
        self.rows = [r for r in self.rows if r[0] != expense_id]
        return len(self.rows) < before

    def totals(self):
        out = {}
        for _id, _day, category, amount, _note in self.rows:
            out[category] = out.get(category, 0) + amount
        return {k: round(v, 2) for k, v in sorted(out.items())}


root = tk.Tk()
store = FakeStore()
view = ExpenseView(root, store)
view.pack()
assert isinstance(view.table, ttk.Treeview) and isinstance(view.chart, tk.Canvas)
assert view.table.get_children() == ()
assert view.status.get() == "0 expenses, total 0.00", view.status.get()
assert len(view.chart.find_withtag("bar")) == 0

view.day.set("2026-11-01")
view.category.set("Food")
view.amount.set("12,5")
view.note.set("lunch")
view.add()
assert view.table.get_children() == ("1",), view.table.get_children()
assert tuple(view.table.item("1", "values")) == ("2026-11-01", "Food", "12.50", "lunch"), view.table.item("1", "values")
assert view.status.get() == "1 expenses, total 12.50", view.status.get()
assert view.amount.get() == "" and view.note.get() == ""
bars = view.chart.find_withtag("bar")
assert len(bars) == 1
x1, y1, x2, y2 = view.chart.coords(bars[0])
assert (x1, x2, y2) == (10, 50, 110) and abs(y1 - 10) < 0.01, view.chart.coords(bars[0])

view.category.set("Travel")
view.amount.set("40")
view.note.set("train")
view.add()
assert view.table.get_children() == ("1", "2")
assert view.status.get() == "2 expenses, total 52.50", view.status.get()
bars = view.chart.find_withtag("bar")
assert len(bars) == 2
a = view.chart.coords(bars[0])
b = view.chart.coords(bars[1])
assert (a[0], a[2], a[3]) == (10, 50, 110) and abs((a[3] - a[1]) - 31.25) < 0.01, a
assert (b[0], b[2], b[3]) == (60, 100, 110) and abs((b[3] - b[1]) - 100) < 0.01, b

view.amount.set("abc")
view.add()
assert view.status.get() == "Amount must be a number"
view.amount.set("-5")
view.add()
assert view.status.get() == "Amount must be positive", view.status.get()
assert len(view.table.get_children()) == 2, "failed adds must not change the table"
assert view.amount.get() == "-5", "a failed add keeps the typed amount"

view.table.selection_set("1")
view.delete_selected()
assert view.table.get_children() == ("2",)
assert view.status.get() == "1 expenses, total 40.00"
bars = view.chart.find_withtag("bar")
assert len(bars) == 1
c = view.chart.coords(bars[0])
assert abs((c[3] - c[1]) - 100) < 0.01
view.table.selection_set("2")
view.delete_selected()
assert view.table.get_children() == () and len(view.chart.find_withtag("bar")) == 0
assert view.status.get() == "0 expenses, total 0.00"
root.destroy()`,
      checks: ['Creates the five `StringVar`s, the Treeview with its four columns, and the 300 x 120 Canvas, and calls `refresh()` at the end', '`refresh()` rebuilds the rows (iid = the id), the status line and one tagged bar per category, scaled so that the biggest is 100 pixels', '`add()` reports a non-number or the store’s `ValueError` in the status, and only a success clears the fields and refreshes; `delete_selected()` deletes by iid'],
      hint: 'Clear old rows with `self.table.delete(*self.table.get_children())`. For the bars, use `sorted(totals.items())`, and note that `max(totals.values(), default=0)` avoids an error when there are no totals (and that no bar is drawn then, so there is no division by zero).',
      explanation: 'Look at what is **not** in this class: no SQL, no date rules, no arithmetic beyond scaling a bar. It could be connected to a different model (a file, a web service, a fake) with no change, and that is the whole point. The program is now small pieces that each have one job, and that can each be tested alone.',
    },
  ],
  takeaways: [
    'A real program is a **model** (data and rules, no tkinter), a **view** (widgets that mirror the model) and short **glue** callbacks. Build and test the model first.',
    'SQLite is a database in one file, built into Python. Pass values with `?` placeholders (never f-strings), call `commit()` after changes, and use `GROUP BY` with `SUM` for totals.',
    'Validate in the model and raise `ValueError` with a message for people. The view catches it and shows the message, and nothing bad is stored.',
    '`ttk.Treeview` shows rows (use `iid` to tie a row to a database id), `ttk.Combobox(state="readonly")` offers a fixed choice, and a `Canvas` with proportional rectangles makes a truthful bar chart.',
    'One `refresh()` method that redraws everything from the model keeps the table, the chart and the status line consistent.',
    'The `csv` module writes correct CSV (quoting included). Build the text in memory, so that it can be tested, and write it to a file in one place.',
    'Everything in this course (widgets, layout, events, dialogs, timers, canvas, ttk, OOP, testing and packaging) is used here. The next project is more of the same.',
  ],
  reading: [
    { title: 'Python docs: sqlite3', url: 'https://docs.python.org/3/library/sqlite3.html', source: 'docs', note: 'Connections, cursors, placeholders, transactions, and the tutorial at the top of the page.' },
    { title: 'SQLite: SQL language reference', url: 'https://www.sqlite.org/lang.html', source: 'docs', note: 'The full syntax of every statement, including `GROUP BY` and aggregate functions.' },
    { title: 'Python docs: csv', url: 'https://docs.python.org/3/library/csv.html', source: 'docs', note: 'Readers, writers, dialects, and why files are opened with `newline=""`.' },
    { title: 'TkDocs: Treeview', url: 'https://tkdocs.com/tutorial/tree.html', source: 'tutorial', note: 'Columns, headings, selection, and events for the ttk table widget.' },
    { title: 'Python docs: tkinter', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'The module reference: widgets, geometry managers, variables, and the standard dialogs.' },
  ],
};
