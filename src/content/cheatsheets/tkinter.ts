import type { CheatSheet } from '../types';

export const tkinterCheatSheets: CheatSheet[] = [
  {
    id: 'tk-basics',
    title: 'tkinter Basics',
    course: 'tkinter',
    icon: '🪟',
    description: 'The skeleton of every tkinter program: the window, the event loop, variables, widget options and events.',
    sections: [
      {
        title: 'A minimal program',
        items: [
          { label: 'Window, widget, loop', code: 'import tkinter as tk\nfrom tkinter import ttk\n\nroot = tk.Tk()\nroot.title("Hello")\nttk.Label(root, text="Hi there").pack(padx=20, pady=20)\nroot.mainloop()' },
          { label: 'Only one Tk()', text: 'Create exactly one `Tk()` per program. More windows are `Toplevel(root)`. `mainloop()` runs until the window is closed, and code after it runs only then.' },
          { label: 'No display?', text: 'Importing `tkinter` works anywhere, but creating `Tk()` needs a display. Keep window creation under `if __name__ == "__main__":` or inside a function.' },
        ],
      },
      {
        title: 'The window',
        items: [
          { label: 'Title, size, position', code: 'root.title("My app")\nroot.geometry("400x300")        # width x height\nroot.geometry("400x300+100+50") # plus x and y offset' },
          { label: 'Resizing', code: 'root.resizable(False, False)\nroot.minsize(300, 200)' },
          { label: 'Always on top', code: 'root.attributes("-topmost", True)' },
          { label: 'Close button', code: 'root.protocol("WM_DELETE_WINDOW", on_close)   # then call root.destroy() yourself' },
          { label: 'Quit', code: 'root.destroy()   # ends mainloop and closes all windows' },
        ],
      },
      {
        title: 'Control variables',
        items: [
          { label: 'The four kinds', code: 'name = tk.StringVar(value="Ann")\ncount = tk.IntVar(value=0)\nprice = tk.DoubleVar(value=9.99)\nagree = tk.BooleanVar(value=False)' },
          { label: 'Read, write, watch', code: 'name.get()\nname.set("Bob")\nname.trace_add("write", lambda *args: print(name.get()))' },
          { label: 'Link a widget', code: 'ttk.Entry(root, textvariable=name)\nttk.Label(root, textvariable=name)   # label follows the entry' },
          { label: 'Bad value', text: '`IntVar.get()` raises `TclError` if the linked entry holds text that is not an integer. Catch it, or validate before reading.' },
        ],
      },
      {
        title: 'Widget options',
        items: [
          { label: 'Set at creation', code: 'btn = tk.Button(root, text="Go", width=10, bg="#2e7d32", fg="white", font=("Segoe UI", 12))' },
          { label: 'Change later', code: 'btn.configure(text="Stop")\nbtn["state"] = "disabled"\nbtn.cget("text")        # read an option' },
          { label: 'Common options', text: '`text`, `width`, `height`, `font`, `state` (`normal`, `disabled`, `readonly`), `command`, `textvariable`, `relief`, `cursor`. Classic widgets also take `bg` and `fg`.' },
          { label: 'Colours', text: 'Use a name (`"red"`) or a hex string (`"#2e7d32"`). Widgets reject unknown names with a `TclError`, for example `unknown color name "reed"`.' },
          { label: 'Fonts', code: '("Segoe UI", 12)\n("Segoe UI", 12, "bold")\n("Courier", 10, "bold italic")' },
        ],
      },
      {
        title: 'Events and bindings',
        items: [
          { label: 'Bind a handler', code: 'def on_click(event):\n    print(event.x, event.y)\n\ncanvas.bind("<Button-1>", on_click)' },
          { label: 'Common sequences', text: '`<Button-1>` left click · `<Double-Button-1>` · `<ButtonRelease-1>` · `<Motion>` · `<Enter>` / `<Leave>` · `<Key>` · `<Return>` · `<Escape>` · `<Control-s>` · `<FocusIn>` · `<Configure>` (size changed)' },
          { label: 'Event fields', text: '`event.x`, `event.y` (inside the widget) · `event.x_root`, `event.y_root` (on the screen) · `event.char` and `event.keysym` (keys) · `event.widget` · `event.delta` (mouse wheel)' },
          { label: 'Virtual events', text: 'Named by double angle brackets and sent by widgets: `<<ComboboxSelected>>`, `<<TreeviewSelect>>`, `<<Modified>>`, `<<Cut>>`, `<<Copy>>`, `<<Paste>>`, `<<Undo>>`.' },
          { label: 'Stop other handlers', code: 'def handler(event):\n    do_something()\n    return "break"   # the widget\'s own binding does not run' },
          { label: 'Button command', text: '`command=` takes a function, **not** a call: `command=save`, not `command=save()`. To pass arguments use `command=lambda: save(path)`.' },
        ],
      },
    ],
  },
  {
    id: 'tk-layout',
    title: 'Layout: pack, grid, place',
    course: 'tkinter',
    icon: '📐',
    description: 'How to arrange widgets, make a layout resize properly, and avoid the classic geometry-manager mistakes.',
    sections: [
      {
        title: 'Choosing a manager',
        items: [
          { label: 'The rule', text: 'Inside one container (a `Tk`, `Toplevel` or `Frame`) use **one** manager. Mixing `pack` and `grid` in the same container hangs the program or raises a `TclError`. Different frames may use different managers.' },
          { label: 'Which one', text: '`pack` for simple rows or columns · `grid` for forms and tables · `place` for exact positions (overlays, badges). Most layouts are frames packed together, with grids inside the frames.' },
        ],
      },
      {
        title: 'pack',
        items: [
          { label: 'Stack top to bottom', code: 'ttk.Label(root, text="A").pack()\nttk.Label(root, text="B").pack(pady=5)' },
          { label: 'Side by side', code: 'ttk.Button(root, text="OK").pack(side="left", padx=4)\nttk.Button(root, text="Cancel").pack(side="left", padx=4)' },
          { label: 'Fill and expand', code: 'text.pack(fill="both", expand=True)   # grows with the window\nbar.pack(side="bottom", fill="x")      # full width, fixed height' },
          { label: 'Order matters', text: 'Space is handed out in the order of the `pack` calls. Pack fixed-size parts (status bar, scrollbar) **first**, and the widget with `expand=True` last.' },
          { label: 'Options', text: '`side` (`top`, `bottom`, `left`, `right`) · `fill` (`x`, `y`, `both`) · `expand` · `anchor` (`n`, `s`, `e`, `w`, `center`...) · `padx`, `pady` · `ipadx`, `ipady` (padding inside)' },
        ],
      },
      {
        title: 'grid',
        items: [
          { label: 'Rows and columns', code: 'ttk.Label(form, text="Name").grid(row=0, column=0, sticky="w")\nttk.Entry(form).grid(row=0, column=1)\nttk.Button(form, text="Save").grid(row=1, column=0, columnspan=2)' },
          { label: 'sticky', text: 'Where a widget sits inside its cell: `"w"` left, `"e"` right, `"ew"` stretched horizontally, `"nsew"` fills the cell.' },
          { label: 'Make columns stretch', code: 'form.columnconfigure(1, weight=1)   # column 1 takes the extra width\nform.rowconfigure(2, weight=1)' },
          { label: 'Spacing', code: 'for child in form.winfo_children():\n    child.grid_configure(padx=4, pady=2)' },
          { label: 'Other options', text: '`rowspan`, `columnspan`, `padx`, `pady`, `ipadx`, `ipady`. Hide a widget with `grid_remove()` (remembers its place) and show it again with `grid()`.' },
        ],
      },
      {
        title: 'place',
        items: [
          { label: 'Absolute and relative', code: 'label.place(x=10, y=20)\nlabel.place(relx=0.5, rely=0.5, anchor="center")   # centred in its parent' },
          { label: 'Caution', text: '`place` does not adapt to font size, language or window size. Use it for overlays and small touches, not for whole windows.' },
        ],
      },
      {
        title: 'Frames and resizing',
        items: [
          { label: 'Group with a Frame', code: 'row = ttk.Frame(root, padding=8)\nrow.pack(fill="x")\nttk.Button(row, text="One").pack(side="left")\nttk.Button(row, text="Two").pack(side="left")' },
          { label: 'Labelled group', code: 'box = ttk.LabelFrame(root, text="Options", padding=8)\nbox.pack(fill="x", padx=8, pady=4)' },
          { label: 'Window and container weights', code: 'root.columnconfigure(0, weight=1)\nroot.rowconfigure(0, weight=1)\nframe.grid(row=0, column=0, sticky="nsew")' },
          { label: 'Size of the contents', text: '`widget.winfo_width()` and `winfo_height()` are 1 until the window has been drawn. Call `root.update_idletasks()` first, or read the size in a `<Configure>` handler.' },
          { label: 'Inspect', code: 'widget.pack_info()\nwidget.grid_info()\nparent.winfo_children()' },
        ],
      },
    ],
  },
  {
    id: 'tk-widgets',
    title: 'Widgets and Dialogs',
    course: 'tkinter',
    icon: '🧩',
    description: 'The widgets you use most, classic and ttk, with the methods for reading them, plus menus and the standard dialogs.',
    sections: [
      {
        title: 'Text input and display',
        items: [
          { label: 'Label', code: 'ttk.Label(root, text="Score: 0", font=("Segoe UI", 14))' },
          { label: 'Entry', code: 'e = ttk.Entry(root, width=20)\ne.insert(0, "hello")\ne.get()\ne.delete(0, "end")' },
          { label: 'Password field', code: 'ttk.Entry(root, show="*")' },
          { label: 'Text (many lines)', code: 't = tk.Text(root, wrap="word", undo=True)\nt.insert("1.0", "first line\\n")\nt.get("1.0", "end-1c")   # end-1c leaves out the extra final newline\nt.delete("1.0", "end")' },
          { label: 'Text indexes', text: '`"line.column"` with lines from 1 and columns from 0: `"1.0"` start · `"end"` after the hidden final newline · `"end-1c"` real end · `"insert"` cursor · `"insert lineend"`.' },
          { label: 'Scrollbar for a Text', code: 'bar = ttk.Scrollbar(root, command=t.yview)\nt.configure(yscrollcommand=bar.set)' },
        ],
      },
      {
        title: 'Choices',
        items: [
          { label: 'Button', code: 'ttk.Button(root, text="Save", command=save)' },
          { label: 'Checkbutton', code: 'on = tk.BooleanVar()\nttk.Checkbutton(root, text="Sound", variable=on)' },
          { label: 'Radiobutton group', code: 'level = tk.StringVar(value="easy")\nfor name in ("easy", "hard"):\n    ttk.Radiobutton(root, text=name, value=name, variable=level).pack()' },
          { label: 'Combobox', code: 'box = ttk.Combobox(root, values=["Food", "Travel"], state="readonly")\nbox.current(0)\nbox.get()\nbox.bind("<<ComboboxSelected>>", on_pick)' },
          { label: 'Spinbox and Scale', code: 'tk.Spinbox(root, from_=0, to=10)\nttk.Scale(root, from_=0, to=100, orient="horizontal")' },
          { label: 'Listbox', code: 'lb = tk.Listbox(root, height=6)\nlb.insert("end", "milk")\nlb.curselection()   # tuple of selected indexes\nlb.get(0, "end")\nlb.delete(0, "end")' },
        ],
      },
      {
        title: 'ttk table, tabs and progress',
        items: [
          { label: 'Treeview as a table', code: 'cols = ("name", "age")\ntree = ttk.Treeview(root, columns=cols, show="headings")\nfor c in cols:\n    tree.heading(c, text=c.title())\ntree.insert("", "end", iid="1", values=("Ann", 31))' },
          { label: 'Read and change rows', code: 'tree.selection()                 # tuple of selected iids\ntree.item("1", "values")         # values come back as text\ntree.set("1", "age", 32)\ntree.delete(*tree.get_children())' },
          { label: 'Selection event', code: 'tree.bind("<<TreeviewSelect>>", on_select)' },
          { label: 'Notebook (tabs)', code: 'nb = ttk.Notebook(root)\nnb.add(page1, text="General")\nnb.add(page2, text="Advanced")' },
          { label: 'Progressbar', code: 'bar = ttk.Progressbar(root, maximum=100, mode="determinate")\nbar["value"] = 40\nbar.step(10)             # wraps round at the maximum\n# mode="indeterminate": bar.start(); bar.stop()' },
        ],
      },
      {
        title: 'ttk versus classic',
        items: [
          { label: 'Prefer ttk', text: 'ttk widgets follow the operating system theme. Style them with `ttk.Style`, not with `bg` and `fg`: `ttk.Button`, `ttk.Frame` and `ttk.Checkbutton` reject `bg` with `unknown option "-bg"`.' },
          { label: 'Style', code: 'style = ttk.Style()\nstyle.theme_use("clam")\nstyle.configure("TButton", padding=6, font=("Segoe UI", 11))\nstyle.map("TButton", foreground=[("disabled", "gray")])' },
          { label: 'Disabled state', code: 'btn.state(["disabled"])    # ttk\nbtn.state(["!disabled"])\nbtn.instate(["disabled"])  # True or False' },
          { label: 'Classic only', text: '`Text`, `Listbox`, `Canvas`, `Spinbox` and `Menu` exist only as classic widgets, so they take `bg`, `fg` and `font` directly.' },
        ],
      },
      {
        title: 'Menus',
        items: [
          { label: 'Menu bar', code: 'bar = tk.Menu(root)\nfile = tk.Menu(bar, tearoff=False)\nfile.add_command(label="Open...", accelerator="Ctrl+O", command=open_file)\nfile.add_separator()\nfile.add_command(label="Exit", command=root.destroy)\nbar.add_cascade(label="File", menu=file)\nroot.configure(menu=bar)' },
          { label: 'Accelerator is only a label', text: '`accelerator="Ctrl+O"` just **shows** the shortcut. Add a real `bind("<Control-o>", ...)`. In a Text widget bind on the Text and return `"break"`, because its own bindings run first.' },
          { label: 'Enable and disable', code: 'file.entryconfigure("Open...", state="disabled")' },
          { label: 'Right-click menu', code: 'popup = tk.Menu(root, tearoff=False)\npopup.add_command(label="Copy")\nroot.bind("<Button-3>", lambda e: popup.tk_popup(e.x_root, e.y_root))' },
        ],
      },
      {
        title: 'Dialogs',
        items: [
          { label: 'Messages', code: 'from tkinter import messagebox\nmessagebox.showinfo("Saved", "Done")\nmessagebox.showerror("Error", "Could not save")\nok = messagebox.askyesno("Quit", "Quit now?")   # True or False\nanswer = messagebox.askyesnocancel("Save?", "Save changes?")   # True, False or None' },
          { label: 'Files', code: 'from tkinter import filedialog\npath = filedialog.askopenfilename(filetypes=[("Text", "*.txt"), ("All", "*.*")])\nsave = filedialog.asksaveasfilename(defaultextension=".txt")\nfolder = filedialog.askdirectory()' },
          { label: 'Cancelled?', text: 'Cancelling a file dialog returns an empty string (or an empty tuple for `askopenfilenames`). Always check `if not path: return`.' },
          { label: 'Ask for a value', code: 'from tkinter import simpledialog, colorchooser\nname = simpledialog.askstring("Name", "Your name?")   # None if cancelled\nn = simpledialog.askinteger("Count", "How many?", minvalue=1)\nrgb, hexcolor = colorchooser.askcolor()   # (None, None) if cancelled' },
          { label: 'Own dialog window', code: 'win = tk.Toplevel(root)\nwin.transient(root)   # stays above the parent\nwin.grab_set()        # blocks the parent\nroot.wait_window(win) # wait until it is closed' },
        ],
      },
    ],
  },
  {
    id: 'tk-canvas-timers',
    title: 'Canvas, Timers and Threads',
    course: 'tkinter',
    icon: '🎨',
    description: 'Drawing and animating with the Canvas, running things later with after(), and doing slow work without freezing the window.',
    sections: [
      {
        title: 'Drawing',
        items: [
          { label: 'Create a canvas', code: 'c = tk.Canvas(root, width=400, height=300, bg="white")\nc.pack()' },
          { label: 'Shapes', code: 'r = c.create_rectangle(10, 10, 110, 60, fill="#2e7d32", outline="")\no = c.create_oval(150, 10, 210, 70, fill="gold")\nl = c.create_line(0, 0, 400, 300, width=3, fill="gray")\np = c.create_polygon(50, 150, 100, 250, 0, 250, fill="red")\nt = c.create_text(200, 150, text="Hello", font=("Segoe UI", 16))' },
          { label: 'Coordinates', text: 'The origin `(0, 0)` is the **top-left**, x grows to the right, and y grows **downwards**. Rectangles and ovals take `(x1, y1, x2, y2)`. Lines need at least 4 numbers, and a wrong count raises `TclError: wrong # coordinates`.' },
          { label: 'Each call returns an id', text: 'An item id is an integer. Keep it to move, change or delete the item later. `coords(id)` returns floats, and an empty list for an item that does not exist.' },
        ],
      },
      {
        title: 'Changing items',
        items: [
          { label: 'Move, delete', code: 'c.move(r, 5, 0)        # relative move: dx, dy\nc.coords(r, 0, 0, 50, 50)   # set position\nc.delete(r)\nc.delete("all")' },
          { label: 'Options', code: 'c.itemconfigure(r, fill="red")\nc.itemcget(r, "fill")        # always returns a string' },
          { label: 'Tags', code: 'c.create_oval(10, 10, 30, 30, tags=("coin",))\nc.addtag_withtag("coin", r)\nc.find_withtag("coin")      # tuple of ids\nc.move("coin", 0, 2)         # moves every item with the tag' },
          { label: 'Where is it', code: 'c.bbox(r)                  # (x1, y1, x2, y2) including the outline\nc.find_overlapping(x1, y1, x2, y2)   # ids from bottom to top\nc.find_closest(x, y)' },
          { label: 'Stacking order', code: 'c.tag_raise(r)\nc.tag_lower(r)' },
          { label: 'Gotcha', text: 'A shape with no fill only reacts at its **outline**: `find_overlapping` and clicks pass through its hollow middle.' },
        ],
      },
      {
        title: 'Events on a canvas',
        items: [
          { label: 'Whole canvas', code: 'c.bind("<Button-1>", lambda e: print(e.x, e.y))\nc.bind("<B1-Motion>", drag)           # mouse moves with the left button down\nc.focus_set(); c.bind("<Left>", go_left)   # keys need focus' },
          { label: 'One item', code: 'c.tag_bind(r, "<Button-1>", on_rect_click)' },
          { label: 'Order', text: 'An item\'s binding runs before the canvas\'s own binding, and only the topmost item under the mouse receives the event.' },
        ],
      },
      {
        title: 'after: later, and repeatedly',
        items: [
          { label: 'Run once later', code: 'job = root.after(1000, say_hello)   # milliseconds' },
          { label: 'Cancel', code: 'root.after_cancel(job)   # job must be the id that after() returned' },
          { label: 'Animation loop', code: 'def tick():\n    c.move(ball, dx, dy)\n    root.after(16, tick)    # roughly 60 frames a second\n\ntick()' },
          { label: 'Never sleep', text: '`time.sleep()` and long loops block the event loop, and the window freezes. Use `after` instead, and when you need a pause, schedule the next step.' },
          { label: 'Stop cleanly', text: 'Keep the id of a pending `after` in an attribute, and `after_cancel` it when the window closes or the game ends, otherwise a callback may run on a destroyed widget.' },
          { label: 'Run what is due', code: 'root.update()           # processes pending events and after(0) callbacks\nroot.update_idletasks()  # only layout and drawing' },
        ],
      },
      {
        title: 'Threads and queues',
        items: [
          { label: 'The rule', text: 'Only the main thread may touch widgets. A worker thread does the slow work and puts results in a `queue.Queue`; the main thread checks the queue with `after`.' },
          { label: 'Pattern', code: 'import queue, threading\nresults = queue.Queue()\n\ndef work():\n    results.put(slow_function())\n\nthreading.Thread(target=work, daemon=True).start()\n\ndef poll():\n    try:\n        value = results.get_nowait()\n    except queue.Empty:\n        root.after(100, poll)\n    else:\n        label.config(text=value)\n\npoll()' },
          { label: 'daemon=True', text: 'A daemon thread does not keep the program alive, so closing the window ends the program even if the worker is still busy.' },
        ],
      },
      {
        title: 'Images',
        items: [
          { label: 'PhotoImage', code: 'img = tk.PhotoImage(file="icon.png")   # PNG and GIF\nlabel = ttk.Label(root, image=img)\nlabel.image = img   # keep a reference, or the picture disappears' },
          { label: 'Generate pixels', code: 'img = tk.PhotoImage(width=16, height=16)\nimg.put("#2e7d32", (3, 4))   # colour, (x, y)\nimg.get(3, 4)                # (46, 125, 50)\nbig = img.zoom(4)            # whole-number scaling' },
          { label: 'Show on a canvas', code: 'c.create_image(0, 0, image=img, anchor="nw")' },
        ],
      },
    ],
  },
  {
    id: 'tk-app-craft',
    title: 'Structure, Testing, Packaging',
    course: 'tkinter',
    icon: '📦',
    description: 'How to organise a bigger tkinter program, test it, store its data, and turn it into something other people can install.',
    sections: [
      {
        title: 'Structure',
        items: [
          { label: 'Model, view, glue', text: '**Model**: data and rules, no tkinter import, testable. **View**: widgets and layout. **Glue**: short callbacks that read widgets, call the model and show the result or the error.' },
          { label: 'Window as a class', code: 'class App(ttk.Frame):\n    def __init__(self, parent):\n        super().__init__(parent, padding=10)\n        self.name = tk.StringVar()\n        self.build()\n\n    def build(self):\n        ttk.Entry(self, textvariable=self.name).pack()\n\nif __name__ == "__main__":\n    root = tk.Tk()\n    App(root).pack(fill="both", expand=True)\n    root.mainloop()' },
          { label: 'Reusable widget', code: 'class LabeledEntry(ttk.Frame):\n    def __init__(self, parent, label):\n        super().__init__(parent)\n        ttk.Label(self, text=label).pack(side="left")\n        self.var = tk.StringVar()\n        ttk.Entry(self, textvariable=self.var).pack(side="left")' },
          { label: 'One refresh method', text: 'A `refresh()` that redraws the table, chart and status from the model keeps them consistent. Call it after every change.' },
          { label: 'Return errors as values', code: 'def parse_amount(text):\n    ...\n    return None, "Not a number"   # (value, error)\n    return 12.5, None' },
        ],
      },
      {
        title: 'Testing',
        items: [
          { label: 'unittest', code: 'import unittest\n\nclass TodoTests(unittest.TestCase):\n    def test_add(self):\n        todo = Todo()\n        todo.add("milk")\n        self.assertEqual(todo.remaining(), 1)\n\n    def test_empty(self):\n        with self.assertRaises(ValueError):\n            Todo().add("  ")' },
          { label: 'Run', code: 'python -m unittest\npython -m unittest -v tests.test_todo', lang: 'shell' },
          { label: 'Test a window like a user', code: 'root = tk.Tk()\nview = TodoView(root, model)\nview.entry.insert(0, "milk")\nview.add_button.invoke()      # same as a click\nroot.update()\nassert view.listbox.get(0, "end") == ("[ ] milk",)\nroot.destroy()' },
          { label: 'Generate input', code: 'widget.focus_force(); root.update()\nwidget.event_generate("<Return>")\ncanvas.event_generate("<Button-1>", x=10, y=20)' },
          { label: 'Headless CI', code: 'xvfb-run -a python -m unittest', lang: 'shell' },
          { label: 'Replace blocking dialogs', text: 'In tests, assign a function to `messagebox.askyesno` (and the others) that returns the answer you want, or the test hangs waiting for a click.' },
        ],
      },
      {
        title: 'Files and data',
        items: [
          { label: 'Read and write text', code: 'with open(path, encoding="utf-8") as f:\n    content = f.read()\nwith open(path, "w", encoding="utf-8") as f:\n    f.write(content)' },
          { label: 'Expected failures', text: 'Catch `OSError` (missing, locked or read-only) and `UnicodeDecodeError` (not text) around file reads, and report them with `messagebox.showerror`.' },
          { label: 'JSON settings', code: 'import json\nsettings = json.loads(text)       # raises ValueError if damaged\njson.dumps(settings, indent=2)' },
          { label: 'SQLite', code: 'import sqlite3\ndb = sqlite3.connect("app.db")     # ":memory:" for tests\ndb.execute("INSERT INTO t (a) VALUES (?)", (value,))   # always use ? placeholders\ndb.commit()\nrows = db.execute("SELECT a FROM t").fetchall()' },
          { label: 'CSV', code: 'import csv, io\nout = io.StringIO()\nw = csv.writer(out, lineterminator="\\n")\nw.writerow(["day", "note"])' },
          { label: 'Settings folder', text: 'Windows: `%APPDATA%/AppName` · macOS: `~/Library/Application Support/AppName` · Linux: `~/.config/AppName`. Never write next to the program: an installed or frozen app may not be allowed to.' },
        ],
      },
      {
        title: 'Packaging with PyInstaller',
        items: [
          { label: 'Install and build', code: 'pip install pyinstaller\npyinstaller --noconfirm --onefile --windowed --name MyApp --icon app.ico main.py', lang: 'shell' },
          { label: 'One file or one folder', text: '`--onefile`: one executable that unpacks to a temporary folder on every start (slower, more antivirus warnings). `--onedir` (default): a folder that starts quickly and is easy to wrap in an installer.' },
          { label: 'Bundle data files', code: 'pyinstaller --windowed --add-data "assets;assets" main.py     # Windows\npyinstaller --windowed --add-data "assets:assets" main.py     # macOS and Linux', lang: 'shell' },
          { label: 'Find bundled files', code: 'import os, sys\n\ndef resource_path(relative):\n    if getattr(sys, "frozen", False):\n        base = sys._MEIPASS\n    else:\n        base = os.path.dirname(os.path.abspath(__file__))\n    return os.path.join(base, relative)' },
          { label: 'No cross-compiling', text: 'Build on the system you target: Windows on Windows, macOS on macOS. Use a CI matrix (`windows-latest`, `macos-latest`, `ubuntu-latest`) to build all three.' },
          { label: 'Release checklist', text: 'Test on a clean machine, from another folder · version number visible · licence file · installer (Inno Setup, `.dmg`, `.deb`) · code signing if you can · say on the download page that antivirus may warn about unsigned programs.' },
        ],
      },
    ],
  },
];
