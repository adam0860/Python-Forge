import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-what-is',
  title: 'What tkinter Is and What It Is For',
  summary: 'What a graphical user interface is, where tkinter comes from (Tcl/Tk), what it is good and not good for compared with the alternatives, how it is layered on top of Tk, and how this course lets you practise it.',
  minutes: 24,
  objectives: [
    'Explain what a GUI is and how a windowed program differs from a command-line program',
    'Describe what tkinter is, where it comes from and why it ships with Python',
    'Judge when tkinter is the right tool, and name the main alternatives',
    'Name the layers between your Python code and the screen, and the modules in the tkinter package',
    'Check that tkinter works on your computer and run a first window',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From command lines to windows',
      blocks: [
        {
          type: 'p',
          text: 'Every program you have written so far talks to its user through text: it prints lines and waits for `input()`. That is a **command-line interface** (CLI). It is fast to build, easy to automate, and perfectly good for many tools. But most software people use every day is different: it shows **windows** with buttons, text boxes, menus, lists and pictures, and it reacts to the mouse and keyboard at any moment. That is a [[gui|graphical user interface]] (GUI).',
        },
        {
          type: 'p',
          text: '**tkinter** is the toolkit for building GUIs that comes with Python. The name is short for “Tk interface”: it is Python’s connection to **Tk**, a widely used GUI toolkit. With a handful of lines you can open a window, put a label in it and have the program wait for the user to close it:',
        },
        {
          type: 'code',
          title: 'hello_window.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Hello")
tk.Label(root, text="Hello, tkinter!").pack(padx=40, pady=30)
root.mainloop()`,
          annotations: [
            { lines: 1, text: 'Import the `tkinter` module. By convention it is imported as `tk`, so every name you use from it starts with `tk.`.' },
            { lines: 3, text: '`tk.Tk()` creates the **root window**, the main window of the program. Nothing appears on screen until the loop starts, but the window object exists from this line on.' },
            { lines: 4, text: 'Windows have properties you set by calling methods. Here: the text in the title bar.' },
            { lines: 5, text: 'A **widget** is any building block of the interface. A `Label` shows text. The first argument (`root`) says which window or frame the widget lives in, and `.pack()` places it there. `padx` and `pady` add empty space around it.' },
            { lines: 6, text: '`mainloop()` hands control to tkinter’s [[gui-event-loop|event loop]]. The window appears, reacts to the user, and this line only returns once the window has been closed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Where the code runs',
          text: 'A program that opens a window needs a screen, so examples like this one are shown with **Run on your PC** instead of a run button: paste them into a file and run them with Python on Windows, macOS or Linux. (A phone cannot run tkinter programs, but you can read the whole course on it.) The **write-the-code questions** in this course are different: they run right here, on a small stand-in for tkinter that records the widgets you create instead of drawing them, so you can still practise the real tkinter calls and have them checked.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which statement about tkinter is correct?',
      options: [
        { text: 'It is part of Python’s standard library and gives Python access to the Tk GUI toolkit', correct: true, why: 'tkinter ships with Python (on Windows and macOS it is included in the standard installer) and is a Python interface to Tk. Nothing has to be downloaded with pip.' },
        { text: 'It is a web framework that turns Python code into web pages', why: 'tkinter draws native desktop windows. Web frameworks such as Flask or Django are separate projects.' },
        { text: 'It is a game engine with sprites and physics', why: 'tkinter can draw and animate on a canvas, but it is a general GUI toolkit for windows and widgets. Game libraries such as pygame cover sprites, sound and fast graphics.' },
        { text: 'It is a third-party library that has to be installed with pip', why: 'It comes with Python. (On some Linux systems it is a separate system package, but you install it with the system package manager, not pip.)' },
      ],
      explanation: 'tkinter is the standard, built-in way to make desktop GUIs in Python. That makes it the easiest to start with: if you have Python, you usually already have tkinter.',
    },
    {
      kind: 'concept',
      title: 'Where tkinter comes from',
      blocks: [
        {
          type: 'p',
          text: 'The story starts outside Python. **Tcl** (Tool Command Language) is a small scripting language created by John Ousterhout at the University of California, Berkeley, in the late 1980s. **Tk** is the GUI toolkit he wrote for it in the early 1990s, and it proved so convenient that it was soon used from other languages too. Python has had a Tk interface since its early years. The Python 2 module was called `Tkinter`; in Python 3 it was renamed to lowercase `tkinter`, to match the standard library’s naming rules.',
        },
        {
          type: 'p',
          text: 'Why does this matter? Because tkinter is a **thin layer**: it does not draw anything itself. When your Python code creates a `Button`, tkinter sends a command to an embedded Tcl/Tk interpreter, and Tk creates and draws the real button using the windowing system of your operating system. That explains a lot about how tkinter behaves: the widget names, the option names such as `-text` and `-padx`, and even some error messages come straight from Tk.',
        },
        {
          type: 'table',
          headers: ['Layer', 'What it is', 'Who writes it'],
          rows: [
            ['**Your program**', 'Python code that creates widgets and reacts to events', 'You'],
            ['**`tkinter` package**', 'Python classes such as `Tk`, `Button`, `Entry`, and the helper modules below', 'Python standard library'],
            ['**`_tkinter`**', 'A C extension that embeds a Tcl interpreter and passes commands to it', 'CPython'],
            ['**Tcl/Tk**', 'The toolkit: widgets, layout, events and drawing', 'The Tcl/Tk project (bundled with Python installers)'],
            ['**The operating system**', 'Windows, macOS or X11/Wayland draw windows and deliver mouse and keyboard input', 'Microsoft, Apple, Linux desktops'],
          ],
          caption: 'Your code talks to Tk through the tkinter package; Tk talks to the operating system. Most current Python builds use Tk 8.6.',
        },
        {
          type: 'p',
          text: 'The package is more than one module. The main one, `tkinter`, has the classic widgets. Around it sit several helper modules, which you will meet during this course:',
        },
        {
          type: 'table',
          headers: ['Module', 'Provides'],
          rows: [
            ['`tkinter`', 'The root window, classic widgets (`Label`, `Button`, `Entry`, `Text`, `Canvas`, `Listbox`, `Menu`…), the layout managers and tk variables'],
            ['`tkinter.ttk`', 'Themed widgets that look native (`ttk.Button`, `ttk.Combobox`, `ttk.Treeview`, `ttk.Notebook`…)'],
            ['`tkinter.messagebox`', 'Ready-made pop-up dialogs: information, warnings, yes/no questions'],
            ['`tkinter.filedialog`', 'The standard “Open file” and “Save as” dialogs'],
            ['`tkinter.simpledialog`, `tkinter.colorchooser`', 'Ask for one value; pick a colour'],
            ['`tkinter.font`', 'Fonts you can create, measure and change'],
          ],
          caption: 'The tkinter package. All of it is in the standard library.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'tkinter draws every button and text box itself, entirely in Python code.',
      answer: false,
      explanation: 'False. tkinter is a thin Python layer over the Tcl/Tk toolkit: your Python code sends commands to an embedded Tcl/Tk interpreter, and Tk creates and draws the widgets using the operating system’s windowing system.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the standard import line, and the command that opens a small test window to check that tkinter is installed.',
      template: `import ___ as tk
python -m ___`,
      templateIsCode: true,
      blanks: [{ answers: ['tkinter'] }, { answers: ['tkinter'] }],
      wordBank: ['tkinter', 'Tkinter', 'tk', 'turtle'],
      explanation: 'Python 3 spells the module in lowercase: `import tkinter as tk`. Running the module itself, `python -m tkinter`, opens a test window that shows the Tk version. If it opens, tkinter works on your computer. (`Tkinter` with a capital T is the Python 2 name.)',
    },
    {
      kind: 'concept',
      title: 'What tkinter is good for (and what it is not)',
      blocks: [
        {
          type: 'p',
          text: 'tkinter is a pragmatic tool. It starts instantly, needs no installation, has a small and stable API, and is documented everywhere. Its limits are just as clear. Choosing a toolkit is about the job in front of you:',
        },
        {
          type: 'table',
          headers: ['Good fit', 'Poor fit'],
          rows: [
            ['Small and medium **desktop tools**: converters, form-based data entry, file renamers, launchers, settings editors', 'Apps that must look **modern and polished** on every platform (animations, custom-styled controls)'],
            ['A **friendly front end for a script** you already have', '**Mobile apps** for Android or iOS (tkinter does not run there)'],
            ['**Teaching** and learning event-driven programming', '**Web apps** that run in a browser'],
            ['**Prototypes** and internal tools that are needed this afternoon', 'Very **large** applications with complex data tables, docking panels or rich text editing'],
            ['Simple 2D **drawing**, plots and small games on the Canvas', 'Fast **graphics and games**: use pygame or an engine instead'],
          ],
          caption: 'Rules of thumb. tkinter is at its best when a working tool matters more than a fancy look.',
        },
        {
          type: 'p',
          text: 'Real programs use tkinter too. **IDLE**, the editor that comes with Python, is written in tkinter, and many small utilities and teaching programs are as well. When a project outgrows it, the usual alternatives are:',
        },
        {
          type: 'table',
          headers: ['Toolkit', 'Choose it for'],
          rows: [
            ['**PyQt / PySide** (Qt)', 'Large, professional desktop applications with rich widgets; a big library to learn, and licence terms to read'],
            ['**wxPython**', 'Native-looking widgets on every platform'],
            ['**Kivy**', 'Touch interfaces and apps for phones and tablets'],
            ['**customtkinter**', 'A modern-looking skin for tkinter, with an almost identical way of programming'],
            ['**pygame**', 'Games and anything built around a fast, redraw-every-frame loop (the next course in this app)'],
            ['**Web-style toolkits** (Flet, NiceGUI, Streamlit)', 'Interfaces you view in a browser or share as a web page'],
            ['**Textual**', 'Rich interfaces that run inside the terminal'],
          ],
          caption: 'Learning tkinter is not a dead end: the ideas (widgets, layout, events, callbacks) carry over to every toolkit above.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why learn tkinter first',
          text: 'The hard part of GUI programming is not the syntax of any one toolkit. It is a new way of thinking: your program no longer runs from top to bottom and exits; it builds an interface and then **waits for events**. tkinter lets you learn exactly that, with nothing to install and very little code getting in the way. Once the event-driven way of thinking is familiar, other toolkits take days to learn, not months.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A button’s command is just a function that tkinter calls each time the button is pressed. This loop plays the role of three presses.',
      code: `clicks = 0


def on_click():
    global clicks
    clicks += 1


for _ in range(3):
    on_click()
print("clicked", clicks, "times")`,
      answer: 'clicked 3 times',
      hint: 'Each call to `on_click()` adds one to the global counter.',
      explanation: 'The function is called three times, so `clicks` goes 0 → 1 → 2 → 3. In a real program you never call the function yourself: you hand it to the button (`command=on_click`) and tkinter calls it every time the user presses it. Functions that you give to a framework to call later are called **callbacks**.',
    },
    {
      kind: 'error',
      prompt: 'This program runs without any error message, but no window ever appears. Tap the faulty line.',
      lines: [
        'import tkinter as tk',
        'root = tk.Tk()',
        'tk.Label(root, text="Hi").pack()',
        'root.mainloop',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Line 4 names the method but never **calls** it: `root.mainloop` without parentheses is just a reference to the method, so the event loop never starts and the program ends immediately. It must be `root.mainloop()`.',
    },
    {
      kind: 'numeric',
      prompt: 'A window contains one Frame and one Label placed directly in the window. The Frame holds 3 Buttons and 2 Labels. How many widgets are there in total, not counting the window itself?',
      answer: '7',
      hint: 'Count the Frame, the Label in the window, and everything inside the Frame.',
      explanation: 'Widgets form a **tree**: 1 Frame + 1 Label in the window + 3 Buttons + 2 Labels inside the Frame = 7. The window is the root of the tree, and each widget has exactly one parent. Understanding the widget tree is the key to layout, and you will write code that walks it in a moment.',
      label: 'Widgets:',
    },
    {
      kind: 'concept',
      title: 'Checking your setup and how to practise',
      blocks: [
        {
          type: 'p',
          text: 'Before the next lesson, make sure tkinter works on your computer. The python.org installer for **Windows** and **macOS** includes it (on Windows it is the “tcl/tk and IDLE” option of the installer, selected by default). On **Linux** it is often a separate package, for example `sudo apt install python3-tk` on Debian and Ubuntu. Run this in a terminal:',
        },
        {
          type: 'code',
          lang: 'shell',
          desktopOnly: true,
          code: `python -m tkinter`,
          output: `(a small window opens showing the Tk version and two buttons)`,
        },
        {
          type: 'p',
          text: 'You can also check from Python. These two numbers are the version of the Tk toolkit your Python was built with (usually 8.6):',
        },
        {
          type: 'code',
          desktopOnly: true,
          outputVaries: true,
          code: `import tkinter

print(tkinter.TkVersion)
print(tkinter.TclVersion)`,
          output: `8.6
8.6`,
          annotations: [
            { lines: 3, text: 'The version of Tk that tkinter is connected to.' },
            { lines: 4, text: 'The version of the Tcl language inside it. The two normally match.' },
          ],
        },
        {
          type: 'p',
          text: 'To run your own programs, save them as `.py` files and run `python file.py` (the `py` launcher also works on Windows), or press the Run button in VS Code or IDLE. If a program prints a traceback mentioning `_tkinter` or `no display name`, the Tk part is missing or you are on a machine without a screen.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn: the practice questions',
          text: 'The next three questions run real tkinter calls in the app. The stand-in library accepts the same code (`import tkinter as tk`, `tk.Tk()`, `tk.Label(...)`, `.pack()`) and its `mainloop()` prints the widget tree instead of opening a window, which is exactly what you want while learning. Use **Try it** to see the tree, then **Run and check**.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Build the program from the first example. Create the root window, give it the title `Hello`, put a `Label` with the text `Hello, tkinter!` in it (place it with `pack()`), and start the event loop.',
      starter: `import tkinter as tk

root = tk.Tk()
# 1. set the window title to "Hello"
# 2. add a Label that says "Hello, tkinter!" and pack it
# 3. start the event loop
`,
      solution: `import tkinter as tk

root = tk.Tk()
root.title("Hello")
tk.Label(root, text="Hello, tkinter!").pack()
root.mainloop()
`,
      setup: TK_SIM,
      tests: `assert root.title() == "Hello", "the window title should be Hello"
labels = [w for w in root.winfo_children() if isinstance(w, tk.Label)]
assert len(labels) == 1, "expected exactly one Label in the window"
assert labels[0].cget("text") == "Hello, tkinter!", "the label text is wrong"
assert labels[0].winfo_manager() == "pack", "place the label with pack()"`,
      checks: ['The root window has the title `Hello`', 'It contains one `Label` with the text `Hello, tkinter!`, placed with `pack()`', 'The program ends with `root.mainloop()`'],
      hint: '`root.title("Hello")` sets the title. `tk.Label(root, text="...")` creates the label with `root` as its parent, and `.pack()` places it.',
      explanation: 'These four lines (create the window, add widgets, start the loop) are the skeleton of every tkinter program. Notice the pattern `tk.Label(root, text=...)`: the first argument is the **parent**, everything after it is an **option** given as a keyword argument.',
    },
    {
      kind: 'code',
      prompt: 'Write `build_greeting(root, name)`. It creates a `Label` inside `root` showing `Hello, <name>!`, places it with `pack(pady=10)` and returns the label. If `name` is empty or only spaces, use `stranger` instead.',
      starter: `import tkinter as tk


def build_greeting(root, name):
    ...
`,
      solution: `import tkinter as tk


def build_greeting(root, name):
    name = name.strip() or "stranger"
    label = tk.Label(root, text=f"Hello, {name}!")
    label.pack(pady=10)
    return label
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
lab = build_greeting(root, "Ada")
assert isinstance(lab, tk.Label), "return the Label widget"
assert lab.cget("text") == "Hello, Ada!"
assert lab.winfo_manager() == "pack"
assert lab.pack_info()["pady"] == 10, "use pack(pady=10)"
assert lab.master is root
assert build_greeting(root, "").cget("text") == "Hello, stranger!"
assert build_greeting(root, "   ").cget("text") == "Hello, stranger!"
assert len(root.winfo_children()) == 3`,
      checks: ['Creates a `Label` with the parent `root` and the text `Hello, <name>!`', 'Packs it with `pady=10` and returns it', 'Uses `stranger` for an empty or blank name'],
      hint: 'Create the label with `tk.Label(root, text=f"Hello, {name}!")`, call `.pack(pady=10)` on it in a separate statement, and return it. (`pack()` itself returns `None`, so `return tk.Label(...).pack()` would return `None`.)',
      explanation: 'Wrapping widget creation in a function that takes the parent as a parameter is the first step towards organised GUI code: the function does not care whether `root` is a window or a frame. And note that `pack()` returns `None`, so a widget you want to keep must be stored **before** you pack it: `label = tk.Label(...)`, then `label.pack()`. You will see this bug again.',
    },
    {
      kind: 'code',
      prompt: 'Widgets form a tree. Write `count_widgets(widget)` that returns how many widgets are inside `widget`, counting children, grandchildren and so on, but **not** `widget` itself. Use `widget.winfo_children()`, which returns the list of direct children.',
      starter: `import tkinter as tk


def count_widgets(widget):
    ...
`,
      solution: `import tkinter as tk


def count_widgets(widget):
    total = 0
    for child in widget.winfo_children():
        total += 1 + count_widgets(child)
    return total
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
assert count_widgets(root) == 0
frame = tk.Frame(root)
for i in range(3):
    tk.Button(frame, text=str(i))
tk.Label(frame, text="a")
tk.Label(frame, text="b")
tk.Label(root, text="c")
assert count_widgets(frame) == 5
assert count_widgets(root) == 7
inner = tk.Frame(frame)
tk.Entry(inner)
assert count_widgets(root) == 9
assert count_widgets(inner) == 1`,
      checks: ['Returns 0 for a widget without children', 'Counts every descendant, at any depth', 'Does not count the widget you pass in'],
      hint: 'For each child add 1 for the child itself plus `count_widgets(child)` for everything below it (recursion).',
      explanation: 'The same recursion lets you apply a change to a whole part of the interface, for example disabling every widget in a frame. Real tkinter provides the same `winfo_children()`, so this function works unchanged on real windows. (The question you answered with 7 earlier is exactly the test case `count_widgets(root)`.)',
    },
  ],
  takeaways: [
    '**tkinter** is Python’s built-in toolkit for desktop GUIs: a thin layer over the **Tcl/Tk** toolkit that ships with Python (import it as `import tkinter as tk`; the capital-T `Tkinter` is Python 2).',
    'A GUI program builds an interface of **widgets** (a tree, with the root window at the top) and then hands control to an **event loop** with `root.mainloop()`. Forgetting the parentheses means the loop never starts.',
    'tkinter is a good fit for small and medium desktop tools, front ends for scripts, teaching and prototypes; it is a poor fit for mobile or web apps, very polished interfaces, and fast games. Alternatives include PyQt/PySide, wxPython, Kivy, customtkinter, pygame and web-style toolkits.',
    'The layers: your code, the `tkinter` package, the `_tkinter` C extension, Tcl/Tk, and the operating system. The package also provides `ttk` (themed widgets), `messagebox`, `filedialog`, `simpledialog`, `colorchooser` and `font`.',
    'Check your installation with `python -m tkinter`. In this course, windows themselves are “Run on your PC”, while the write-the-code questions run real tkinter calls on a stand-in that records widgets.',
  ],
  reading: [
    { title: 'tkinter — Python interface to Tcl/Tk (Python documentation)', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'The official overview: the architecture, the widget list and the Tk concepts behind them.' },
    { title: 'TkDocs: the modern Tk tutorial for Python', url: 'https://tkdocs.com/tutorial/index.html', source: 'tutorial', note: 'The best free tutorial; every example is shown in Python, Tcl, Ruby and Perl.' },
    { title: 'Real Python: Python GUI Programming With Tkinter', url: 'https://realpython.com/python-gui-tkinter/', source: 'tutorial', note: 'A long, practical beginner tutorial that builds several small apps.' },
    { title: 'Tk (software) on Wikipedia', url: 'https://en.wikipedia.org/wiki/Tk_(software)', source: 'wikipedia', note: 'The history of Tk and Tcl, and the languages that use them.' },
    { title: 'Tk commands reference (tcl.tk)', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/contents.html', source: 'docs', note: 'The original manual: every widget and option, which tkinter mirrors almost one to one.' },
  ],
};
