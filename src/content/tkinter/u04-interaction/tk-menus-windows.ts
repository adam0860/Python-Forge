import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-menus-windows',
  title: 'Menus and Extra Windows',
  summary: 'Build a menu bar with submenus, separators, checkable items and disabled entries, add a right-click context menu, then open extra windows with Toplevel: closing them cleanly, making them modal, opening only one copy, and returning a value from a custom dialog.',
  minutes: 32,
  objectives: [
    'Create a menu bar with `Menu`, `add_cascade`, `add_command` and `add_separator`, and turn tear-off off',
    'Add checkable and radio menu items, disable entries, and show a right-click context menu',
    'Explain why an `accelerator` is only a label, and bind the real keyboard shortcut yourself',
    'Open extra windows with `Toplevel`, and close them with `destroy()` or a `WM_DELETE_WINDOW` handler',
    'Build a modal dialog with `transient`, `grab_set` and `wait_window`, and open at most one copy of a window',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Menu bars: File, Edit, View',
      blocks: [
        {
          type: 'p',
          text: 'A menu is a `tk.Menu` widget. The **menu bar** is a Menu attached to the window with `root.config(menu=menubar)`. Each title in the bar (“File”, “Edit”) is an **entry of type cascade** that opens a second Menu, the **drop-down**, which holds the commands. You build the drop-down first, then attach it with `menubar.add_cascade(label="File", menu=file_menu)`. Create every Menu with **`tearoff=0`**: otherwise Tk adds a dashed “tear-off” strip as entry 0, which looks dated and moves all your other entries up by one index.',
        },
        {
          type: 'code',
          title: 'menu_editor.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Menu editor")
text = tk.Text(root, width=50, height=12, wrap="word")
text.pack(fill="both", expand=True)
wrap = tk.BooleanVar(value=True)


def new():
    text.delete("1.0", tk.END)


def toggle_wrap():
    text.config(wrap="word" if wrap.get() else "none")


menubar = tk.Menu(root, tearoff=0)
root.config(menu=menubar)

file_menu = tk.Menu(menubar, tearoff=0)
menubar.add_cascade(label="File", menu=file_menu, underline=0)
file_menu.add_command(label="New", accelerator="Ctrl+N", command=new)
file_menu.add_separator()
file_menu.add_command(label="Exit", command=root.destroy)

view_menu = tk.Menu(menubar, tearoff=0)
menubar.add_cascade(label="View", menu=view_menu)
view_menu.add_checkbutton(label="Word wrap", variable=wrap, command=toggle_wrap)

root.bind("<Control-n>", lambda event: new())

context = tk.Menu(root, tearoff=0)
context.add_command(label="Clear", command=new)


def show_context(event):
    try:
        context.tk_popup(event.x_root, event.y_root)
    finally:
        context.grab_release()


text.bind("<Button-3>", show_context)
root.mainloop()`,
          annotations: [
            { lines: '18-19', text: 'The menu bar: `tearoff=0` removes the dashed strip, and `root.config(menu=menubar)` attaches it to the window.' },
            { lines: '21-22', text: 'A drop-down is built as its own Menu (its parent is the menu bar) and then attached with `add_cascade`. `underline=0` makes the first letter the Alt+key mnemonic.' },
            { lines: 23, text: '`accelerator="Ctrl+N"` only **displays** the shortcut text next to the item. It does not bind anything.' },
            { lines: '27-29', text: 'An `add_checkbutton` entry toggles its `variable` (here a BooleanVar) every time it is chosen, and then calls its `command`.' },
            { lines: 31, text: 'The shortcut itself is a normal key binding on the root window, from the Events lesson.' },
            { lines: '33-41', text: 'A context menu is a Menu that is not attached to a bar. `tk_popup` shows it at the pointer position, and `grab_release` in `finally` makes sure that it does not keep the mouse grab.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'What it adds or does'],
          rows: [
            ['`menu.add_command(label=, command=)`', 'A normal item. Options: `accelerator`, `underline`, `state`, `image`'],
            ['`menu.add_separator()`', 'A horizontal line between groups of items'],
            ['`menu.add_cascade(label=, menu=submenu)`', 'An item that opens a submenu (also used for the entries of the menu bar)'],
            ['`menu.add_checkbutton(label=, variable=)`', 'A tickable item. Toggles `onvalue`/`offvalue` (default 1/0) in its variable'],
            ['`menu.add_radiobutton(label=, variable=, value=)`', 'One of a group that share a variable'],
            ['`menu.entryconfigure("Exit", state="disabled")`', 'Change an item (by label or index). `"disabled"` greys it out and ignores clicks'],
            ['`menu.delete(0, "end")`', 'Remove entries'],
            ['`menu.index("end")`', 'Index of the **last** entry (not the count), `None` when empty'],
            ['`menu.tk_popup(x_root, y_root)`', 'Show a context menu. Bind it to `<Button-3>` (and `<Button-2>` on macOS)'],
          ],
          caption: 'The Menu toolbox. Entries are numbered from 0 in the order they were added.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'An accelerator is just text',
          text: 'Tk does not turn `accelerator="Ctrl+N"` into a keyboard shortcut, because the label is only decoration. You have to bind the key yourself (`root.bind("<Control-n>", handler)`) and keep the label and the binding in agreement. A mismatch (the menu says Ctrl+N, the key does nothing) is one of the most common menu bugs.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why do almost all programs create menus with `tearoff=0`?',
      options: [
        { text: 'Otherwise a dashed “tear-off” entry is added as index 0, which looks dated and shifts every other entry’s index by one', correct: true, why: 'With the default `tearoff=1` your first real item is at index 1, and `menu.index("end")` counts one extra entry. Turning it off keeps menus looking native and the numbering simple.' },
        { text: 'Because tear-off menus cannot contain commands', why: 'They can: a tear-off is just a convenience that lets users detach the menu into its own window.' },
        { text: 'It is required for the menu bar to appear', why: 'The bar appears either way; only the extra entry differs.' },
        { text: 'It makes the menu respond faster', why: 'There is no performance difference.' },
      ],
      explanation: 'Always write `tk.Menu(parent, tearoff=0)`. Tear-off entries come from an old Tk look and feel that modern platforms do not use.',
    },
    {
      kind: 'concept',
      title: 'Menus built from data',
      blocks: [
        {
          type: 'p',
          text: 'Writing one `add_command` call per item gets repetitive quickly. A cleaner approach is to describe the menus as **data** (a list of titles and items) and write the loop that builds the widgets once. The same structure then also drives other features: a list of shortcuts for a help window, or the items that need disabling in a read-only mode. The model below prints such a specification as a tree:',
        },
        {
          type: 'code',
          title: 'menu_spec.py',
          runnable: true,
          code: `menu_spec = [
    ("File", [("New", "Ctrl+N"), ("Open...", "Ctrl+O"), "-", ("Exit", "Alt+F4")]),
    ("Edit", [("Undo", "Ctrl+Z"), ("Redo", "Ctrl+Y")]),
]


def show(spec):
    for label, items in spec:
        print(label)
        for item in items:
            if item == "-":
                print("  ----------")
            else:
                name, accelerator = item
                print(f"  {name:<10} {accelerator}")


show(menu_spec)
print(len(menu_spec), "menus,", sum(len(items) for _, items in menu_spec), "entries")`,
          output: `File
  New        Ctrl+N
  Open...    Ctrl+O
  ----------
  Exit       Alt+F4
Edit
  Undo       Ctrl+Z
  Redo       Ctrl+Y
2 menus, 6 entries`,
          annotations: [
            { lines: '1-4', text: 'The whole menu structure is a list of `(title, items)` pairs. `"-"` stands for a separator, a common convention in menu descriptions.' },
            { lines: '8-15', text: 'One loop walks the data. In a real program the `print` calls become `add_cascade`, `add_command` and `add_separator`, and the items carry a callback instead of a text.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keep the callbacks outside the menu code',
          text: 'Menu items should call functions with plain names (`new_file`, `save_file`) that you can also call from a toolbar button or a keyboard shortcut. That way the three entry points to a command can never drift apart, and the command code can be tested without any menu.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Giving a menu item `accelerator="Ctrl+S"` makes pressing Ctrl+S run that item’s command.',
      answer: false,
      explanation: 'False. The accelerator is only a **label** shown at the right of the item. Create the real shortcut with `root.bind("<Control-s>", handler)`, and remember a handler bound this way receives an event argument, so use `lambda event: save()`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the two lines that attach the drop-down to the menu bar and the bar to the window.',
      template: `menubar.add_cascade(label="File", ___=file_menu)
root.config(___=menubar)`,
      templateIsCode: true,
      blanks: [{ answers: ['menu'] }, { answers: ['menu'] }],
      wordBank: ['menu', 'command', 'label', 'accelerator', 'variable'],
      explanation: 'Both places use an option called `menu`: a cascade entry names the Menu that it opens, and the window names the Menu that is its menu bar.',
    },
    {
      kind: 'concept',
      title: 'Toplevel: extra windows',
      blocks: [
        {
          type: 'p',
          text: 'A **Toplevel** is an additional window that belongs to the same program, and `tk.Toplevel(root)` creates one. It is a container like the root: give it a `title`, fill it with widgets, and it shares the event loop with the main window. There is only ever **one** `Tk()` per program. For dialogs, tools and settings screens, use Toplevels, never a second `Tk()`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why only one Tk()?',
          text: 'The `Tk()` object **is** the Tcl interpreter, the one event loop and the application’s identity. A second `Tk()` creates a separate interpreter whose widgets, variables and images cannot talk to the first (a `StringVar` from one is invalid in the other). A `Toplevel` is a new window inside the same interpreter, so it shares variables, images and the event loop, which is what you want for dialogs.',
        },
        {
          type: 'table',
          headers: ['Call', 'Effect'],
          rows: [
            ['`top.title("Settings")`, `top.geometry("320x200")`', 'Title and size, as for the root'],
            ['`top.resizable(False, False)`, `top.minsize(w, h)`', 'Control resizing'],
            ['`top.transient(root)`', 'Marks the window as a helper of `root`: it stays on top of it and has no separate taskbar entry'],
            ['`top.grab_set()`', 'Directs all input to this window: it becomes **modal**'],
            ['`root.wait_window(top)`', 'Pauses the calling code until `top` is destroyed (the event loop keeps running)'],
            ['`top.destroy()`', 'Close it, with all its widgets. `winfo_exists()` is then `0`'],
            ['`top.withdraw()` / `top.deiconify()`', 'Hide it without destroying it / show it again'],
            ['`top.protocol("WM_DELETE_WINDOW", handler)`', 'Run `handler` when the user clicks the window’s close button, instead of closing at once'],
            ['`top.lift()`, `top.focus_set()`', 'Bring to the front, and give it the keyboard focus'],
          ],
          caption: 'Window management ("wm") methods. They work on `root` and on every Toplevel.',
        },
        {
          type: 'p',
          text: 'The recipe for a **modal dialog that returns a value** has four steps: build the window, make it modal (`transient` + `grab_set`), wait for it with `parent.wait_window(top)`, and then read the answer that the OK button stored. The answer travels through a variable that the buttons’ callbacks can change: a small dict, a `StringVar` or an attribute.',
        },
        {
          type: 'code',
          title: 'ask_name.py',
          desktopOnly: true,
          code: `import tkinter as tk


def ask_name(parent):
    result = {"name": None}
    top = tk.Toplevel(parent)
    top.title("Your name")
    top.transient(parent)
    top.resizable(False, False)
    entry = tk.Entry(top, width=24)
    entry.pack(padx=15, pady=(15, 5))
    entry.focus()

    def ok():
        result["name"] = entry.get().strip() or None
        top.destroy()

    row = tk.Frame(top)
    row.pack(pady=10)
    tk.Button(row, text="OK", command=ok).pack(side="left", padx=5)
    tk.Button(row, text="Cancel", command=top.destroy).pack(side="left", padx=5)
    top.bind("<Return>", lambda event: ok())
    top.bind("<Escape>", lambda event: top.destroy())
    top.grab_set()
    parent.wait_window(top)
    return result["name"]


root = tk.Tk()
root.title("Main")
greeting = tk.Label(root, text="Hello")
greeting.pack(padx=40, pady=20)


def change():
    name = ask_name(root)
    if name:
        greeting.config(text=f"Hello, {name}!")


tk.Button(root, text="Change name", command=change).pack(pady=(0, 20))
root.mainloop()`,
          annotations: [
            { lines: 5, text: 'A dict holds the answer: nested callbacks can **change** its contents (a plain variable would need `nonlocal`). It starts as `None`, which is also the “cancelled” result.' },
            { lines: '6-9', text: 'A Toplevel with `parent` as its owner. `transient(parent)` keeps it on top of the main window.' },
            { lines: '14-16', text: '`ok` stores the cleaned-up text (or `None` for an empty box) and closes the window. Cancel simply closes it, leaving `None`.' },
            { lines: '22-23', text: 'Enter and Escape work as keyboard shortcuts for OK and Cancel, a small touch that users expect from a dialog.' },
            { lines: '24-26', text: '`grab_set()` makes the dialog modal. `wait_window` blocks `ask_name` until the window is destroyed, and then the function returns the stored answer, exactly like `simpledialog.askstring`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Using a window after it was destroyed',
          text: 'Once `top.destroy()` has run, every method on `top` raises `TclError: bad window path name ".!toplevel"` (or `invalid command name`). If a callback may run after the window is gone (for example a timer), guard it with `if top.winfo_exists():`. Also keep **one** window of a kind: check whether it exists and `lift()` it instead of opening a second copy.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This models a menu that was created with `tearoff=1`, and the same menu with `tearoff=0`.',
      code: `entries = ["tearoff", "New", "Open"]
print(entries.index("Open"))
entries.pop(0)
print(entries.index("Open"))`,
      answer: '2\n1',
      hint: 'The tear-off strip occupies entry 0 when it is enabled.',
      explanation: 'With a tear-off the real items start at index 1, so “Open” is at index 2. Without it “Open” is at index 1. Code that says `menu.entryconfigure(1, ...)` would therefore address a different item depending on `tearoff`, which is one more reason to always turn it off.',
    },
    {
      kind: 'error',
      prompt: 'This code raises `_tkinter.TclError: bad window path name ".!toplevel"`. Tap the line that raises it.',
      lines: [
        'top = tk.Toplevel(root)',
        'top.destroy()',
        'top.title("Settings")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'After `destroy()` the window and all its widgets no longer exist, so any later call on `top` fails. Set the title **before** destroying the window, or check `top.winfo_exists()` before touching a window that the user might already have closed.',
    },
    {
      kind: 'numeric',
      prompt: 'A menu bar created with `tearoff=0` has four cascades added in this order: File, Edit, View, Help. What does `menubar.index("end")` return?',
      answer: '3',
      hint: 'The index of the last entry, counting from 0.',
      explanation: '`index("end")` is the index of the last entry, not the number of entries. With four entries numbered 0 to 3 the answer is 3. (With the default tear-off it would be 4, and on an empty menu without tear-off it is `None`.)',
      label: 'Index:',
    },
    {
      kind: 'concept',
      title: 'Your turn: menus and windows',
      blocks: [
        {
          type: 'p',
          text: 'The in-app exercises use the stand-in. Menu entries can be inspected with `entrycget`, `type` and `index`, and activated with `menu.invoke(index_or_label)`, which behaves like choosing the item: checkable items toggle their variable, disabled items do nothing. A cascade’s submenu is reached with `menubar.nametowidget(str(menubar.entrycget(i, "menu")))`.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `build_menubar(root, spec)`. `spec` is a list of `(title, items)` pairs, where each item is either the string `"-"` (a separator) or a `(label, callback)` pair. Create a menu bar and a drop-down for each title (all with `tearoff=0`), attach them with `add_cascade`, set the bar as the window’s menu with `root.config(menu=...)` and return the bar.',
      starter: `import tkinter as tk


def build_menubar(root, spec):
    ...
`,
      solution: `import tkinter as tk


def build_menubar(root, spec):
    menubar = tk.Menu(root, tearoff=0)
    for title, items in spec:
        menu = tk.Menu(menubar, tearoff=0)
        for item in items:
            if item == "-":
                menu.add_separator()
            else:
                label, callback = item
                menu.add_command(label=label, command=callback)
        menubar.add_cascade(label=title, menu=menu)
    root.config(menu=menubar)
    return menubar
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
log = []
spec = [
    ("File", [("New", lambda: log.append("new")), "-", ("Exit", lambda: log.append("exit"))]),
    ("Edit", [("Undo", lambda: log.append("undo"))]),
]
bar = build_menubar(root, spec)
assert isinstance(bar, tk.Menu)
assert str(root.cget("menu")) == str(bar), "the bar must be attached to the window"
assert bar.index("end") == 1, "two cascades and no tear-off entry"
assert [bar.entrycget(i, "label") for i in (0, 1)] == ["File", "Edit"]
assert [bar.type(i) for i in (0, 1)] == ["cascade", "cascade"]
file_menu = bar.nametowidget(str(bar.entrycget(0, "menu")))
edit_menu = bar.nametowidget(str(bar.entrycget(1, "menu")))
assert file_menu.index("end") == 2, "New, separator, Exit"
assert [file_menu.type(i) for i in range(3)] == ["command", "separator", "command"]
assert file_menu.entrycget(0, "label") == "New" and file_menu.entrycget(2, "label") == "Exit"
file_menu.invoke(0)
file_menu.invoke(2)
edit_menu.invoke(0)
assert log == ["new", "exit", "undo"], log`,
      checks: ['All menus are created with `tearoff=0`, so the first entry has index 0', 'Each title becomes a cascade of the bar, whose drop-down holds the commands and `"-"` separators in order', 'The bar is attached with `root.config(menu=...)` and returned'],
      hint: 'Create `menubar = tk.Menu(root, tearoff=0)`. For each title make `menu = tk.Menu(menubar, tearoff=0)`, add separators or `add_command(label=label, command=callback)`, then `menubar.add_cascade(label=title, menu=menu)`.',
      explanation: 'This function turns a data description into widgets, so adding a menu item to your program becomes a one-line change to the data. Because the drop-downs are created with `menubar` as their parent, Tk can find them again by name, which is what the test does.',
    },
    {
      kind: 'code',
      prompt: 'Write `set_enabled(menu, labels, enabled)`. For every label in `labels`, set that entry of `menu` to `state="normal"` when `enabled` is true, or to `state="disabled"` when it is false. Entries that are not listed must not change.',
      starter: `import tkinter as tk


def set_enabled(menu, labels, enabled):
    ...
`,
      solution: `import tkinter as tk


def set_enabled(menu, labels, enabled):
    state = "normal" if enabled else "disabled"
    for label in labels:
        menu.entryconfigure(label, state=state)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
log = []
m = tk.Menu(root, tearoff=0)
for name in ("Cut", "Copy", "Paste", "Select all"):
    m.add_command(label=name, command=lambda name=name: log.append(name))
set_enabled(m, ["Cut", "Copy"], False)
assert m.entrycget("Cut", "state") == "disabled" and m.entrycget("Copy", "state") == "disabled"
assert m.entrycget("Paste", "state") == "normal" and m.entrycget("Select all", "state") == "normal"
m.invoke("Cut")
m.invoke("Paste")
assert log == ["Paste"], "a disabled entry ignores invoke"
set_enabled(m, ["Cut"], True)
m.invoke("Cut")
assert log == ["Paste", "Cut"]
assert m.entrycget("Copy", "state") == "disabled", "enabling Cut must not change Copy"
set_enabled(m, [], False)`,
      checks: ['Uses `entryconfigure(label, state=...)` for every label', 'Uses `"normal"` when enabled and `"disabled"` otherwise', 'Leaves entries that are not in `labels` unchanged'],
      hint: 'Pick the state string first with a conditional expression, then loop: `menu.entryconfigure(label, state=state)`.',
      explanation: 'Greying out “Cut” and “Copy” when nothing is selected (and enabling them again when there is a selection) is the most common use of menu states. `entryconfigure` accepts the item’s label as well as its index.',
    },
    {
      kind: 'code',
      prompt: 'Write `open_settings(root, registry)` that opens a settings window **only once**. If `registry["settings"]` holds a window that still exists, bring it to the front with `lift()` and return it. Otherwise create a `Toplevel(root)` titled `"Settings"`, make it `transient(root)`, store it in the registry and return it.',
      starter: `import tkinter as tk


def open_settings(root, registry):
    ...
`,
      solution: `import tkinter as tk


def open_settings(root, registry):
    window = registry.get("settings")
    if window is not None and window.winfo_exists():
        window.lift()
        return window
    window = tk.Toplevel(root)
    window.title("Settings")
    window.transient(root)
    registry["settings"] = window
    return window
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
registry = {}


def count_windows():
    return len([w for w in root.winfo_children() if isinstance(w, tk.Toplevel)])


first = open_settings(root, registry)
assert isinstance(first, tk.Toplevel) and first.title() == "Settings"
assert registry["settings"] is first
assert count_windows() == 1
again = open_settings(root, registry)
assert again is first and count_windows() == 1, "a second click must not open a second window"
first.destroy()
assert count_windows() == 0
second = open_settings(root, registry)
assert second is not first and second.title() == "Settings"
assert registry["settings"] is second and count_windows() == 1`,
      checks: ['Returns the existing window (after `lift()`) while it still exists', 'Creates a `Toplevel` titled `"Settings"` with `transient(root)` and stores it in `registry`', 'Opens a **new** window once the old one has been destroyed'],
      hint: 'Check `window is not None and window.winfo_exists()` before reusing: `winfo_exists()` is false once the user has closed the window.',
      explanation: 'Without the existence check, a stale reference to a destroyed window would be returned and every method on it would fail. The pattern “look up, check that it exists, otherwise create” works for any window that should be unique: settings, help, a log viewer.',
    },
  ],
  takeaways: [
    'A **menu bar** is a `Menu` attached with `root.config(menu=bar)`; each drop-down is its own `Menu` attached with `add_cascade(label=, menu=)`. Always pass **`tearoff=0`**, or entry 0 becomes a dashed tear-off strip.',
    'Entries are commands, separators, cascades, **checkbuttons** and **radiobuttons** (which toggle their `variable`). `entryconfigure(label, state="disabled")` greys an entry out, and `index("end")` is the index of the last entry.',
    'An `accelerator` is only **text**. Bind the real shortcut with `root.bind("<Control-s>", ...)`. A context menu is an unattached Menu shown with `tk_popup(event.x_root, event.y_root)` from a `<Button-3>` binding.',
    '`tk.Toplevel(root)` makes an extra window (never a second `Tk()`). Use `transient`, `grab_set` and `wait_window` for a modal dialog that returns a value, and `protocol("WM_DELETE_WINDOW", handler)` to intercept the close button.',
    'A destroyed window raises `TclError` on every call: check `winfo_exists()`, and open **one** window of a kind by reusing (and lifting) the existing one.',
  ],
  reading: [
    { title: 'TkDocs: Menus', url: 'https://tkdocs.com/tutorial/menus.html', source: 'tutorial', note: 'Menu bars, checkbutton and radiobutton items, accelerators, and context menus across platforms.' },
    { title: 'TkDocs: Windows and dialogs', url: 'https://tkdocs.com/tutorial/windows.html', source: 'tutorial', note: 'Toplevel windows, window manager calls, modal dialogs and the close protocol.' },
    { title: 'Tk manual: menu', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/menu.htm', source: 'docs', note: 'Every Menu option and entry type.' },
    { title: 'Tk manual: wm', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/wm.htm', source: 'docs', note: 'The window manager commands behind title, geometry, transient, protocol and more.' },
  ],
};
