import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-lists',
  title: 'Listbox, Combobox and Scrollbars',
  summary: 'Show and pick from lists of items: fill a Listbox, read and remove its selection safely, attach a Scrollbar in both directions, and use the ttk Combobox as a compact drop-down. Learn the index-shifting bug that every first delete-selected button has.',
  minutes: 30,
  objectives: [
    'Add, read and delete items in a `Listbox`, and choose a `selectmode`',
    'Read the selection with `curselection()` and handle the empty case',
    'Delete several selected items correctly (from the end backwards)',
    'Connect a `Scrollbar` to a `Listbox` or `Text` with `yscrollcommand` and `command`',
    'Use `ttk.Combobox` for a drop-down: `values`, `state="readonly"`, `get()`, `current()`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Listbox: a scrollable list of strings',
      blocks: [
        {
          type: 'p',
          text: 'A **Listbox** shows a column of text items from which the user selects one or more. You add items with `insert(index, *items)` (use `tk.END` to append), read them with `get(first, last)`, and remove them with `delete(first, last)`. The **selection** is read with `curselection()`, which returns a **tuple of integer indexes**: `(2,)` when the third item is selected, `(0, 3)` for two items in a multi-select list, and the **empty tuple** `()` when nothing is selected.',
        },
        {
          type: 'code',
          title: 'tasks.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Tasks")

entry = tk.Entry(root)
entry.pack(fill="x", padx=10, pady=(10, 0))


def add():
    text = entry.get().strip()
    if text:
        listbox.insert(tk.END, text)
        entry.delete(0, tk.END)


def remove():
    for index in reversed(listbox.curselection()):
        listbox.delete(index)


tk.Button(root, text="Add", command=add).pack(pady=5)

frame = tk.Frame(root)
frame.pack(fill="both", expand=True, padx=10)
listbox = tk.Listbox(frame, height=8, selectmode="extended")
scroll = tk.Scrollbar(frame, orient="vertical", command=listbox.yview)
listbox.config(yscrollcommand=scroll.set)
scroll.pack(side="right", fill="y")
listbox.pack(side="left", fill="both", expand=True)

for task in ("Write notes", "Buy milk", "Call Sam"):
    listbox.insert(tk.END, task)

tk.Button(root, text="Remove selected", command=remove).pack(pady=10)
root.mainloop()`,
          annotations: [
            { lines: '10-14', text: '`add` validates the text, appends it with `insert(tk.END, text)` and clears the entry, the same pattern as the Entry lesson.' },
            { lines: '17-19', text: '`curselection()` gives indexes such as `(1, 3)`. Deleting **in reverse order** keeps the remaining indexes valid; see the next section for why this matters.' },
            { lines: 26, text: '`selectmode="extended"` lets the user select ranges with Shift and individual items with Ctrl. The default is `"browse"` (exactly one item).' },
            { lines: '27-28', text: 'The **two-way scrollbar link**: the scrollbar’s `command` scrolls the listbox, and the listbox’s `yscrollcommand` tells the scrollbar its position and size.' },
            { lines: '29-30', text: 'The scrollbar is packed first on the right, so the listbox fills the remaining space on the left.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'Result'],
          rows: [
            ['`lb.insert(tk.END, "a", "b")`', 'Append one or more items. `lb.insert(0, "x")` inserts at the top'],
            ['`lb.get(0)`', 'The item at index 0 (a string)'],
            ['`lb.get(0, tk.END)`', 'A **tuple** of all items'],
            ['`lb.size()`', 'How many items there are'],
            ['`lb.curselection()`', 'Tuple of selected indexes, `()` if none'],
            ['`lb.delete(0, tk.END)`', 'Remove all items'],
            ['`lb.selection_set(2)` / `selection_clear(0, tk.END)`', 'Select an item from code / clear the selection'],
            ['`lb.see(index)`', 'Scroll so that the item is visible'],
            ['`selectmode=`', '`"browse"` (default), `"single"`, `"multiple"` (click toggles), `"extended"` (Shift and Ctrl)'],
            ['`exportselection=False`', 'Keep the selection when the user clicks into another widget'],
          ],
          caption: 'The Listbox toolbox. Items are always stored as strings.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The selection disappears when focus moves',
          text: 'By default a Listbox “exports” its selection, so on many systems selecting text in an `Entry` clears the Listbox selection. If your program reads the selection after the user has clicked a button or typed in a box, create the listbox with `exportselection=False`.',
        },
        {
          type: 'p',
          text: 'To react **immediately** when the user picks an item, bind the virtual event `<<ListboxSelect>>` (`listbox.bind("<<ListboxSelect>>", on_select)`). Binding events is covered properly in the Events lesson; until then a button that reads `curselection()` does the job.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Nothing is selected in a Listbox. What does `listbox.curselection()` return?',
      options: [
        { text: 'An empty tuple, `()`', correct: true, why: 'It always returns a tuple of indexes, and with no selection that tuple is empty. Check `if not sel:` before using `sel[0]`.' },
        { text: '`None`', why: '`curselection()` never returns `None`; the empty tuple is falsy, so `if not selection:` works.' },
        { text: '`-1`', why: 'Some other GUI libraries use `-1` for “no selection”, but tkinter returns a tuple.' },
        { text: 'It raises `TclError`', why: 'Asking for the selection is always safe. The error comes later, if you index into the empty tuple.' },
      ],
      explanation: 'Always handle the empty selection. Indexing `curselection()[0]` raises `IndexError` when nothing is selected, which is one of the most common crashes in beginner tkinter code.',
    },
    {
      kind: 'concept',
      title: 'Deleting several items: the index-shifting bug',
      blocks: [
        {
          type: 'p',
          text: 'Every time you delete an item from a list, all later items move up one place. If `curselection()` returns `(1, 3)` and you delete index 1 first, the item that was at index 3 is now at index 2, and `delete(3)` removes the **wrong** item (or nothing at all, at the end of the list). The fix is simple: process the indexes from **last to first**, so deleting never disturbs an index you have not handled yet.',
        },
        {
          type: 'code',
          title: 'index_shift.py',
          runnable: true,
          code: `names = ["a", "b", "c", "d", "e"]
selected = (1, 3)          # what curselection() would return: b and d

wrong = names.copy()
for i in selected:
    del wrong[i]           # after the first delete, the indexes have shifted
print("forward :", wrong)

right = names.copy()
for i in reversed(selected):
    del right[i]           # later indexes first: earlier ones stay valid
print("reversed:", right)`,
          output: `forward : ['a', 'c', 'd']
reversed: ['a', 'c', 'e']`,
          annotations: [
            { lines: '5-6', text: 'Deleting index 1 shifts `d` down to index 2, so the second `del wrong[3]` removes `e` instead of `d`.' },
            { lines: '10-11', text: 'Going backwards: delete index 3 (`d`) first, then index 1 (`b`). Nothing that is still to come has moved.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is this so easy to get wrong?',
          text: 'With a single selected item the forward loop works perfectly, so the bug is not found until someone selects two items. Make “several selected items” part of every manual test of a list feature, and write the delete as `for i in reversed(selection)` from the start.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'To delete every selected item of a Listbox you can loop over `listbox.curselection()` from the first index to the last and call `listbox.delete(index)` each time.',
      answer: false,
      explanation: 'False. Each deletion shifts the later items up, so the remaining indexes in the tuple point at the wrong items. Loop over `reversed(listbox.curselection())` instead.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the two-way link between a Listbox and its Scrollbar.',
      template: `listbox.config(___=scroll.set)
scroll.config(___=listbox.yview)`,
      templateIsCode: true,
      blanks: [{ answers: ['yscrollcommand'] }, { answers: ['command'] }],
      wordBank: ['yscrollcommand', 'command', 'xscrollcommand', 'scrollregion', 'orient'],
      explanation: 'Two connections are needed: the listbox reports its visible range to the scrollbar through `yscrollcommand=scroll.set`, and dragging the scrollbar scrolls the listbox through `command=listbox.yview`. (`xscrollcommand` is the same for horizontal scrolling.)',
    },
    {
      kind: 'concept',
      title: 'Scrollbars and the Combobox',
      blocks: [
        {
          type: 'p',
          text: 'The scrollbar wiring above works for any scrollable widget: `Listbox`, `Text`, `Canvas`, and the ttk `Treeview` later in the course. For vertical scrolling the pair is always `widget.config(yscrollcommand=bar.set)` and `bar.config(command=widget.yview)`; for horizontal scrolling use `xscrollcommand` and `xview` with `orient="horizontal"`.',
        },
        {
          type: 'p',
          text: 'When there is not enough room for a list, use a **Combobox**: a text box with a drop-down list. It lives in the **ttk** module (themed widgets, covered fully in its own lesson), so import it with `from tkinter import ttk`.',
        },
        {
          type: 'code',
          title: 'combobox.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Pick a colour")

choice = tk.StringVar()
combo = ttk.Combobox(root, textvariable=choice, state="readonly",
                     values=["red", "green", "blue"])
combo.current(0)
combo.pack(padx=20, pady=(20, 5))

shown = tk.Label(root, text="")
shown.pack(pady=(0, 20))


def selected(event):
    shown.config(text=f"You chose {combo.get()} (index {combo.current()})")


combo.bind("<<ComboboxSelected>>", selected)
root.mainloop()`,
          annotations: [
            { lines: '8-9', text: '`values` holds the choices. `state="readonly"` stops the user typing anything else, so `get()` is always one of the values.' },
            { lines: 10, text: '`current(0)` selects the first item. With no `current` call, the box starts empty.' },
            { lines: 17, text: 'A virtual-event callback receives an `event` argument. Like the Scale’s callback, it must accept a parameter.' },
            { lines: 18, text: '`get()` returns the selected text and `current()` returns its index, or `-1` if the text is not in `values`.' },
            { lines: 21, text: '`<<ComboboxSelected>>` fires when the user picks an item from the list. (Typing in an editable box does not fire it.)' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'Code'],
          rows: [
            ['Read the choice', '`combo.get()` (a string, even for numbers) or a linked `StringVar`'],
            ['Which item is it', '`combo.current()`: index in `values`, `-1` for text that is not in the list'],
            ['Select by index', '`combo.current(2)`'],
            ['Select by text', '`combo.set("blue")` (does not check that it is in `values`)'],
            ['Change the choices', '`combo["values"] = ["a", "b"]`'],
            ['Forbid typing', '`state="readonly"`'],
          ],
          caption: 'Combobox cheat sheet.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Editable comboboxes accept any text',
          text: 'Without `state="readonly"` the user may type `purple` even though it is not in `values`. `get()` returns it unchanged, and `current()` is `-1`. Either use `readonly`, or check `combo.current() != -1` before trusting the value.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this model of a Listbox that deletes the selected items with the **reversed** loop.',
      code: `items = ["red", "green", "blue", "pink", "gold"]
selection = (0, 2, 4)
for i in reversed(selection):
    del items[i]
print(items)`,
      answer: "['green', 'pink']",
      hint: 'Index 4 goes first, then 2, then 0. Nothing earlier moves while you work.',
      explanation: 'Deleting 4 (`gold`), then 2 (`blue`), then 0 (`red`) leaves `green` and `pink`. The same loop in forward order would delete `red`, then the item that had moved into index 2 (`pink`), then fail at index 4.',
    },
    {
      kind: 'error',
      prompt: 'Pressing the button with nothing selected raises `IndexError: tuple index out of range`. Tap the line that raises it.',
      lines: [
        'def show():',
        '    index = listbox.curselection()[0]',
        '    info.config(text=listbox.get(index))',
        '',
        'button = tk.Button(root, text="Show", command=show)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'With no selection `curselection()` is `()`, and `()[0]` raises `IndexError`. Check first: `selection = listbox.curselection()` then `if not selection: return` (or show a hint such as “Select an item first”).',
    },
    {
      kind: 'numeric',
      prompt: 'A Listbox holds `a`, `b`, `c`, `d`. You run `lb.insert(2, "x")` and then `lb.delete(0)`. What is now the index of `"x"`?',
      answer: '1',
      hint: 'First insert before `c` (index 2), then see what the deletion of the first item does to every later index.',
      explanation: 'After the insert the list is `a b x c d` and `x` is at index 2. Deleting index 0 removes `a`, and everything moves up by one, so `x` is now at index 1.',
      label: 'Index:',
    },
    {
      kind: 'concept',
      title: 'Your turn: lists in practice',
      blocks: [
        {
          type: 'p',
          text: 'The exercises use the stand-in for `Listbox` and `ttk.Combobox`. Selections are made from code with `selection_set`, exactly as you would to preselect an item in a real program. Handle the empty selection in each one.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `selected_items(lb)` that returns the **text** of every selected item of a Listbox, as a list in list order. If nothing is selected, return an empty list.',
      starter: `import tkinter as tk


def selected_items(lb):
    ...
`,
      solution: `import tkinter as tk


def selected_items(lb):
    return [lb.get(i) for i in lb.curselection()]
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
lb = tk.Listbox(root, selectmode="extended")
for word in ["red", "green", "blue", "pink"]:
    lb.insert(tk.END, word)
assert selected_items(lb) == []
lb.selection_set(1)
assert selected_items(lb) == ["green"]
lb.selection_set(3)
assert selected_items(lb) == ["green", "pink"]
lb.selection_clear(0, tk.END)
lb.selection_set(0, 2)
assert selected_items(lb) == ["red", "green", "blue"]
assert isinstance(selected_items(lb), list)`,
      checks: ['Uses `curselection()` and `get(index)` for each selected index', 'Returns a **list** of the item texts in list order', 'Returns `[]` when nothing is selected'],
      hint: 'A list comprehension over `lb.curselection()`: `[lb.get(i) for i in lb.curselection()]`.',
      explanation: 'Because `curselection()` is a tuple of indexes (empty when nothing is selected), a comprehension handles the empty case with no special code: there is simply nothing to loop over.',
    },
    {
      kind: 'code',
      prompt: 'Write `remove_selected(lb)` that deletes every selected item from the Listbox and returns how many items were removed. Take care that the right items are deleted when several are selected.',
      starter: `import tkinter as tk


def remove_selected(lb):
    ...
`,
      solution: `import tkinter as tk


def remove_selected(lb):
    selection = lb.curselection()
    for index in reversed(selection):
        lb.delete(index)
    return len(selection)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
lb = tk.Listbox(root, selectmode="extended")
for word in ["a", "b", "c", "d", "e"]:
    lb.insert(tk.END, word)
lb.selection_set(1)
lb.selection_set(3)
assert remove_selected(lb) == 2
assert lb.get(0, tk.END) == ("a", "c", "e"), lb.get(0, tk.END)
assert lb.size() == 3
assert remove_selected(lb) == 0, "nothing selected, nothing removed"
assert lb.get(0, tk.END) == ("a", "c", "e")
lb.selection_set(0, tk.END)
assert remove_selected(lb) == 3
assert lb.size() == 0
lb.insert(tk.END, "x", "y", "z")
lb.selection_set(2)
assert remove_selected(lb) == 1
assert lb.get(0, tk.END) == ("x", "y")`,
      checks: ['Deletes the selected items, in **reverse** index order, so that no index is shifted before it is used', 'Returns the number of items that were removed', 'Does nothing (and returns `0`) when nothing is selected'],
      hint: 'Save `selection = lb.curselection()`, loop `for index in reversed(selection):` and call `lb.delete(index)`. Return `len(selection)`.',
      explanation: 'Reading the selection once, before any deletion, and walking it backwards is the safe recipe. Deleting an item also changes `curselection()`, so never loop over a fresh call to it while you delete.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_picker(parent, choices, start)` that creates a **read-only** `ttk.Combobox` inside `parent` with `choices` as its values, selects the item at index `start`, packs it and returns it.',
      starter: `import tkinter as tk
from tkinter import ttk


def make_picker(parent, choices, start):
    ...
`,
      solution: `import tkinter as tk
from tkinter import ttk


def make_picker(parent, choices, start):
    combo = ttk.Combobox(parent, values=choices, state="readonly")
    combo.current(start)
    combo.pack()
    return combo
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
frame = tk.Frame(root)
frame.pack()
cb = make_picker(frame, ["red", "green", "blue"], 1)
assert isinstance(cb, ttk.Combobox)
assert cb.winfo_manager() == "pack"
assert cb.winfo_parent() == str(frame)
assert cb.get() == "green"
assert cb.current() == 1
assert list(cb["values"]) == ["red", "green", "blue"]
assert cb.instate(["readonly"]), "the picker must be read-only"
cb.current(2)
assert cb.get() == "blue"
cb2 = make_picker(frame, ["x", "y"], 0)
assert cb2.get() == "x" and cb2.current() == 0`,
      checks: ['Creates a `ttk.Combobox` in `parent` with `values=choices` and `state="readonly"`', 'Selects the item at index `start` with `current(start)`', 'Packs the combobox and returns it'],
      hint: 'Import `ttk` from `tkinter`. Create `ttk.Combobox(parent, values=choices, state="readonly")`, then `combo.current(start)`, `combo.pack()` and `return combo`.',
      explanation: '`current(index)` is the easiest way to preselect an item. The read-only state guarantees that `get()` always returns one of the values, which means you do not need to validate the choice later.',
    },
  ],
  takeaways: [
    'A **Listbox** stores strings. `insert(tk.END, item)` appends, `get(first, last)` reads, `delete(first, last)` removes, and `curselection()` returns a **tuple** of selected indexes (`()` when empty).',
    'Always handle the empty selection, and when deleting several selected items go through `reversed(curselection())` so that earlier deletions do not shift the indexes still to come.',
    'Link a **Scrollbar** both ways: `widget.config(yscrollcommand=bar.set)` and `bar.config(command=widget.yview)`. It works for Listbox, Text, Canvas and Treeview.',
    'Use `exportselection=False` if the Listbox selection must survive the user clicking into other widgets, and `selectmode` to choose single or multiple selection.',
    '**`ttk.Combobox`** is a drop-down: `values=`, `state="readonly"`, `get()`, `current()`. An editable one accepts any typed text, so check `current() != -1` or make it readonly.',
  ],
  reading: [
    { title: 'TkDocs: Listbox', url: 'https://tkdocs.com/tutorial/morewidgets.html#listbox', source: 'tutorial', note: 'Listbox options, selection modes, scrolling and styling individual items.' },
    { title: 'TkDocs: Combobox', url: 'https://tkdocs.com/tutorial/widgets.html#combobox', source: 'tutorial', note: 'Drop-down lists, readonly state and the virtual event.' },
    { title: 'Python docs: tkinter.ttk Combobox', url: 'https://docs.python.org/3/library/tkinter.ttk.html#combobox', source: 'docs', note: 'The documented methods and options of ttk.Combobox.' },
    { title: 'Tk manual: listbox', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/listbox.htm', source: 'docs', note: 'Complete Listbox reference, including index syntax.' },
  ],
};
