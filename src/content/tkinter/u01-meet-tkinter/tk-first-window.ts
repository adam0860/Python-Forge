import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-first-window',
  title: 'Your First Window',
  summary: 'Create and configure the root window: title, size and position, resizing limits, colours and extra windows. Learn the widget(parent, options) pattern, how to read and change options later, and the beginner mistakes that make windows misbehave.',
  minutes: 26,
  objectives: [
    'Create a root window and set its title, size, position and resizing rules',
    'Write the `Widget(parent, option=value)` pattern and change options later with `config`, `cget` and `widget["option"]`',
    'Compute a centred window position and understand geometry strings such as `400x300+100+50`',
    'Open extra windows with `Toplevel` and explain why a program has only one `Tk()`',
    'Recognise the usual first-day mistakes: two roots, a missing `mainloop()`, code after `mainloop()` and a file named `tkinter.py`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The root window and its settings',
      blocks: [
        {
          type: 'p',
          text: 'Every tkinter program starts by creating exactly one **root window** with `tk.Tk()`. The object it returns is your handle on the window: you call methods on it to change how the window looks and behaves. Most of these are **window manager** settings, because the operating system’s window manager is what draws the title bar, borders and the minimise and close buttons.',
        },
        {
          type: 'code',
          title: 'window_setup.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Notes")
root.geometry("480x240+200+120")
root.minsize(320, 160)
root.configure(bg="#e8f5e9")
tk.Label(root, text="A window with some settings", bg="#e8f5e9").pack(pady=20)
root.mainloop()`,
          annotations: [
            { lines: 4, text: '`title()` sets the text in the title bar and on the taskbar.' },
            { lines: 5, text: '`geometry()` takes a **string**: `"WIDTHxHEIGHT+X+Y"`. Here: 480 pixels wide, 240 high, with the top-left corner 200 pixels from the left edge of the screen and 120 from the top. The position part is optional.' },
            { lines: 6, text: '`minsize(width, height)` stops the user from dragging the window smaller than this. `maxsize()` is the counterpart.' },
            { lines: 7, text: '`configure(bg=...)` changes an option of the window itself, here its background colour (`bg` is short for `background`). Colours are names (`"red"`) or hex codes (`"#e8f5e9"`).' },
            { lines: 8, text: 'The label’s own background must be set too, or it shows the default grey on top of the green. Widgets do not inherit colours from their parent.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'What it does'],
          rows: [
            ['`root.title("Text")`', 'Window title; `root.title()` with no argument returns the current title'],
            ['`root.geometry("400x300")`', 'Size only. The window is placed by the system. `"+100+50"` alone sets just the position'],
            ['`root.resizable(False, False)`', 'Whether the width and the height may be changed by the user. `resizable(False, False)` gives a fixed-size window'],
            ['`root.minsize(w, h)` / `root.maxsize(w, h)`', 'Smallest and largest size the user can drag the window to'],
            ['`root.iconbitmap("app.ico")`', 'Window icon on Windows (an `.ico` file). `iconphoto` takes a `PhotoImage` and works on all platforms'],
            ['`root.attributes("-topmost", True)`', 'Keep the window above others. Attribute names are platform specific'],
            ['`root.withdraw()` / `root.deiconify()`', 'Hide the window and show it again'],
            ['`root.destroy()`', 'Close the window and end the event loop'],
          ],
          caption: 'The window settings you will use most. If you never call `geometry`, the window is as large as its contents need.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `root.geometry("300x200+50+20")` do?',
      options: [
        { text: 'Makes the window 300 pixels wide and 200 high, with its top-left corner 50 pixels from the left of the screen and 20 from the top', correct: true, why: 'The string is WIDTH x HEIGHT, followed by + X and + Y offsets of the window’s top-left corner from the top-left corner of the screen.' },
        { text: 'Makes the window 300 high and 200 wide', why: 'The width always comes first: `"300x200"` is 300 wide and 200 high.' },
        { text: 'Places the window at row 50, column 20 of a grid', why: 'Geometry is measured in screen pixels. Rows and columns belong to the `grid` layout manager, which is about widgets inside a window.' },
        { text: 'Raises a `TypeError`, because `geometry` expects four numbers', why: 'It takes a single string. Passing separate numbers is the mistake that raises an error.' },
      ],
      explanation: 'A geometry string is `WIDTHxHEIGHT+X+Y`. The `x` between the numbers is the letter x, and the two offsets each need a plus sign (a minus sign measures from the right or bottom edge instead).',
    },
    {
      kind: 'concept',
      title: 'Widget(parent, options): the pattern behind everything',
      blocks: [
        {
          type: 'p',
          text: 'You have now seen the same shape twice: `tk.Label(root, text="...", bg="...")`. It is the pattern for creating every widget in tkinter: **`Widget(parent, option=value, ...)`**. The first argument is the **parent**, the window or frame the widget lives in. After that come the **options** as keyword arguments: `text`, `fg` (foreground colour), `font`, `width`, `state` and many more, which differ from widget to widget.',
        },
        {
          type: 'p',
          text: 'Options are not fixed at creation. A widget remembers them, and you can **read** and **change** them at any time, in three equivalent ways. This is how a program updates its own interface while it runs:',
        },
        {
          type: 'code',
          title: 'options.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
label = tk.Label(root, text="Hello", fg="blue")
print(label.cget("text"))
label.config(text="Goodbye")
label["fg"] = "red"
print(label["text"], label["fg"])
label.pack()
root.mainloop()`,
          output: `Hello
Goodbye red`,
          annotations: [
            { lines: 4, text: 'The widget is created with two options. It is **stored in a variable**, so the program can talk to it later.' },
            { lines: 5, text: '`cget("text")` (“configuration get”) reads an option.' },
            { lines: 6, text: '`config(...)` (the same as `configure`) changes one or more options at once, using keyword arguments.' },
            { lines: 7, text: 'The dictionary style `label["fg"] = "red"` changes a single option. Reading works the same way, `label["text"]`.' },
            { lines: 8, text: 'The printed values show the changes took effect: the program reads back `Goodbye` and `red`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'A mistyped option is an error',
          text: 'Tk checks option names. `tk.Label(root, txet="Hi")` raises `TclError: unknown option "-txet"`, and the message starts with a dash because that is how Tcl writes option names. Tk also accepts unambiguous abbreviations of option names, but never rely on them: always write the full name.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the parent comes first',
          text: 'tkinter widgets form a tree, and a widget can only be created *inside* something. Giving the parent explicitly makes the tree visible in your code. If you leave it out, tkinter silently uses the default root window, and if there is none yet it creates one. That is a classic source of mysterious second empty windows, so always pass the parent.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'After a widget has been created, its options (such as the text of a label) can no longer be changed.',
      answer: false,
      explanation: 'False. Options can be read and changed at any time with `config(...)`, `cget(...)` or `widget["option"]`. Changing options while the program runs (a label showing a result, a button becoming disabled) is how interfaces respond to the user.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code: set a fixed-size window of 500 by 300 pixels.',
      template: `root.title("Notes")
root.___("500x300")
root.___(False, False)`,
      templateIsCode: true,
      blanks: [{ answers: ['geometry'] }, { answers: ['resizable'] }],
      wordBank: ['geometry', 'resizable', 'size', 'minsize', 'configure'],
      explanation: '`geometry("500x300")` sets the size, and `resizable(False, False)` forbids resizing in both directions (width first, then height). There is no `size()` method: the size is part of the `geometry` string.',
    },
    {
      kind: 'concept',
      title: 'Where on the screen? A little arithmetic',
      blocks: [
        {
          type: 'p',
          text: 'Windows normally open wherever the system puts them. To centre one yourself, ask the window how big the screen is with `winfo_screenwidth()` and `winfo_screenheight()`, then compute the top-left corner so that equal space is left on each side. The calculation does not involve tkinter at all, which makes it a good candidate for a plain function you can test:',
        },
        {
          type: 'code',
          title: 'centered.py',
          runnable: true,
          code: `def centered_geometry(width, height, screen_width, screen_height):
    x = (screen_width - width) // 2
    y = (screen_height - height) // 2
    return f"{width}x{height}+{x}+{y}"


print(centered_geometry(400, 300, 1920, 1080))
print(centered_geometry(800, 600, 1366, 768))`,
          output: `400x300+760+390
800x600+283+84`,
          annotations: [
            { lines: '2-3', text: 'Half of the leftover space goes on each side. `//` is integer division, because a pixel position must be a whole number.' },
            { lines: 4, text: 'The geometry string is built with an f-string: `WIDTHxHEIGHT+X+Y`.' },
            { lines: 7, text: 'On a Full HD screen a 400 by 300 window starts 760 pixels from the left and 390 from the top.' },
          ],
        },
        {
          type: 'p',
          text: 'Using it in a real program takes one line. `winfo_screenwidth()` is one of tkinter’s **`winfo_`** methods, which ask Tk for information about a window or the screen:',
        },
        {
          type: 'code',
          title: 'centered_window.py',
          desktopOnly: true,
          code: `import tkinter as tk


def centered_geometry(width, height, screen_width, screen_height):
    x = (screen_width - width) // 2
    y = (screen_height - height) // 2
    return f"{width}x{height}+{x}+{y}"


root = tk.Tk()
root.title("Centered")
root.geometry(centered_geometry(360, 200, root.winfo_screenwidth(), root.winfo_screenheight()))
root.mainloop()`,
          annotations: [
            { lines: '4-7', text: 'The same pure function as before, now living next to the GUI code.' },
            { lines: 12, text: 'The size and the screen size go in; a geometry string comes out and is handed to `geometry()`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Separate the calculation from the window',
          text: 'Keeping calculations in plain functions that take and return ordinary values makes them easy to test and reuse, and keeps tkinter calls in a thin layer on top. This idea grows into a whole lesson later in the course (Separating Logic from the Interface), and it is also why several of this lesson’s practice questions are plain functions.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output of this code (the function is the one from the lesson).',
      code: `def centered_geometry(width, height, screen_width, screen_height):
    x = (screen_width - width) // 2
    y = (screen_height - height) // 2
    return f"{width}x{height}+{x}+{y}"


print(centered_geometry(400, 300, 1000, 700))`,
      answer: '400x300+300+200',
      hint: 'x is (1000 - 400) // 2 and y is (700 - 300) // 2.',
      explanation: 'x = (1000 - 400) // 2 = 300 and y = (700 - 300) // 2 = 200, so the string is `400x300+300+200`. Check your own result by reading it as: size first, then the offsets from the left and the top.',
    },
    {
      kind: 'error',
      prompt: 'This program stops with an error while setting up the window. Tap the faulty line.',
      lines: [
        'import tkinter as tk',
        'root = tk.Tk()',
        'root.title("Size")',
        'root.geometry(400, 300)',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: '`geometry()` takes one **string**, `"400x300"`, not two numbers. Tk reports the problem as a `TclError` (or a `TypeError` about the extra argument), because the value has to be passed to Tk as one geometry specification.',
    },
    {
      kind: 'numeric',
      prompt: 'The screen is 1920 pixels wide and the window is 640 pixels wide. How many pixels from the left edge of the screen must the window start to be horizontally centred?',
      answer: '640',
      hint: 'The leftover space is 1920 - 640; half of it goes on each side.',
      explanation: '(1920 - 640) // 2 = 640. Coincidentally, the window then also takes exactly one third of the screen width, with a third of free space on each side.',
      label: 'x =',
      unit: 'px',
    },
    {
      kind: 'concept',
      title: 'More windows, and the first-day mistakes',
      blocks: [
        {
          type: 'p',
          text: 'A program has **one** `Tk()`, the root. It owns the event loop and the program ends when it is destroyed. When you need further windows (an About box, a settings window), create a **`Toplevel`**: a window that belongs to the root, closes with it, and is used like a small root of its own.',
        },
        {
          type: 'code',
          title: 'second_window.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Main")

about = tk.Toplevel(root)
about.title("About")
tk.Label(about, text="Version 1.0").pack(padx=30, pady=20)

root.mainloop()`,
          annotations: [
            { lines: 6, text: '`Toplevel(root)`: a second window whose parent is the root. Closing the root closes it too.' },
            { lines: 8, text: 'Widgets are placed in the extra window by giving it as their parent.' },
          ],
        },
        {
          type: 'table',
          headers: ['Mistake', 'Symptom', 'Fix'],
          rows: [
            ['Creating a second `tk.Tk()`', 'Two windows; widgets appear in the wrong one; odd errors with variables and images', 'One `Tk()` per program. Use `Toplevel` for other windows'],
            ['Forgetting `mainloop()` (or its parentheses)', 'The window flashes up and disappears, or never appears', 'End the program with `root.mainloop()`'],
            ['Writing code **after** `mainloop()`', 'That code only runs once the window has been closed', 'Build everything first; react to events inside callbacks'],
            ['Leaving out the parent: `tk.Label(text="x")`', 'The label lands in an unexpected default window', 'Always pass the parent as the first argument'],
            ['Naming your own file `tkinter.py` (or `tk.py`)', '`import tkinter` imports **your file** and fails with confusing errors', 'Never name a file after a module you import; delete the stray `__pycache__` folder'],
            ['Running a GUI over SSH or on a server', 'An error saying there is no display name or no display environment variable', 'Run it on a machine with a screen'],
          ],
          caption: 'Almost every beginner meets at least three of these. The fix is usually one line.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why code after mainloop() waits',
          text: '`mainloop()` is a loop that does not return until the window closes: it is where the program spends nearly all of its life, waiting for and dispatching events. Anything written after it sits behind that loop. Real work happens in **callbacks**, small functions that the loop calls when something happens, and the next lesson explains that model in depth.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `setup_window(root)`. It gives the window the title `Notes`, the size `500x300` and makes it **not resizable** in either direction.',
      starter: `import tkinter as tk


def setup_window(root):
    ...
`,
      solution: `import tkinter as tk


def setup_window(root):
    root.title("Notes")
    root.geometry("500x300")
    root.resizable(False, False)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
setup_window(root)
root.update()
assert root.title() == "Notes"
assert root.winfo_width() == 500 and root.winfo_height() == 300, "the size should be 500x300"
assert tuple(root.resizable()) == (0, 0), "the window must not be resizable"`,
      checks: ['Sets the title to `Notes`', 'Sets the size with `geometry("500x300")`', 'Disables resizing in both directions'],
      hint: 'Three method calls on `root`: `title`, `geometry` and `resizable`.',
      explanation: 'Putting window settings in one function keeps the main program readable, and the function can be reused for every window of the same kind. (`root.update()` in the test makes Tk apply the size so that `winfo_width()` reports it.)',
    },
    {
      kind: 'code',
      prompt: 'Write `centered_geometry(width, height, screen_width, screen_height)` returning a geometry string like `400x300+760+390` that centres the window on the screen. If the window is larger than the screen, never produce a negative position: use `0` instead.',
      starter: `def centered_geometry(width, height, screen_width, screen_height):
    ...
`,
      solution: `def centered_geometry(width, height, screen_width, screen_height):
    x = max(0, (screen_width - width) // 2)
    y = max(0, (screen_height - height) // 2)
    return f"{width}x{height}+{x}+{y}"
`,
      tests: `assert centered_geometry(400, 300, 1920, 1080) == "400x300+760+390"
assert centered_geometry(800, 600, 1366, 768) == "800x600+283+84"
assert centered_geometry(1000, 700, 1000, 700) == "1000x700+0+0"
assert centered_geometry(101, 51, 200, 100) == "101x51+49+24"
assert centered_geometry(2000, 500, 1920, 1080) == "2000x500+0+290"
assert centered_geometry(500, 2000, 1920, 1080) == "500x2000+710+0"`,
      checks: ['Centres with integer arithmetic (`//`)', 'Builds the string `WIDTHxHEIGHT+X+Y`', 'Uses `0` instead of a negative offset'],
      hint: 'Compute `(screen - size) // 2` for each axis and wrap it in `max(0, ...)`. Then format the string with an f-string.',
      explanation: 'Taking the larger of 0 and the computed position keeps an oversized window’s title bar reachable. `//` rounds down, so an odd leftover pixel goes to the right and bottom. Because this function is pure, it can be tested without opening a window.',
    },
    {
      kind: 'code',
      prompt: 'Write `open_about(root)`. It creates a `Toplevel` window with the parent `root`, the title `About` and a `Label` showing `Version 1.0` (placed with `pack()`), and returns the `Toplevel`.',
      starter: `import tkinter as tk


def open_about(root):
    ...
`,
      solution: `import tkinter as tk


def open_about(root):
    win = tk.Toplevel(root)
    win.title("About")
    tk.Label(win, text="Version 1.0").pack()
    return win
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
win = open_about(root)
assert isinstance(win, tk.Toplevel), "create a Toplevel"
assert win is not root
assert win.title() == "About"
labels = [w for w in win.winfo_children() if isinstance(w, tk.Label)]
assert len(labels) == 1 and labels[0].cget("text") == "Version 1.0", "the label belongs in the new window"
assert labels[0].winfo_manager() == "pack"
assert win in root.winfo_children(), "the Toplevel is a child of the root"
assert len([w for w in root.winfo_children() if isinstance(w, tk.Label)]) == 0, "no label should be in the root window"`,
      checks: ['Creates a `Toplevel` whose parent is `root`', 'Sets the title `About`', 'Puts a packed `Label` with the text `Version 1.0` inside the new window and returns it'],
      hint: '`win = tk.Toplevel(root)`, then `win.title(...)`, then create the label with `win` (not `root`) as its parent.',
      explanation: 'Extra windows are created from the root, never with a second `tk.Tk()`. Notice that the label’s parent is `win`: where a widget appears is decided entirely by the parent you give it.',
    },
  ],
  takeaways: [
    'Create **one** root window with `tk.Tk()` and end the program with `root.mainloop()`. Extra windows are `tk.Toplevel(root)`.',
    'Window settings are method calls: `title()`, `geometry("WxH+X+Y")` (a single string), `resizable(w, h)`, `minsize()`, `maxsize()`, `configure(bg=...)`, `withdraw()`, `destroy()`. Without `geometry`, the window is as big as its contents.',
    'Every widget is created with `Widget(parent, option=value, ...)`. Always pass the parent. Options can be read and changed later with `cget`, `config` and `widget["option"]`; a mistyped option name raises `TclError`.',
    'Keep calculations (such as centring a window) in plain functions that you can test; call `winfo_screenwidth()` and `winfo_screenheight()` to get the inputs.',
    'The usual first mistakes: a second `Tk()`, a missing `mainloop()` or its parentheses, code after `mainloop()`, no parent, and a file named `tkinter.py`.',
  ],
  reading: [
    { title: 'TkDocs: Tk Concepts, and Windows and Dialogs', url: 'https://tkdocs.com/tutorial/windows.html', source: 'tutorial', note: 'Window geometry, positioning, resizing and the window manager attributes.' },
    { title: 'Python documentation: Tkinter Window Manager Methods', url: 'https://docs.python.org/3/library/tkinter.html', source: 'docs', note: 'The overview page lists the common methods of the `Wm` class that Tk and Toplevel share.' },
    { title: 'Tk manual: wm (window manager commands)', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/wm.html', source: 'docs', note: 'Every window manager option, including geometry strings, in the original reference.' },
    { title: 'Python tutorial: Modules (why a file named like a module breaks imports)', url: 'https://docs.python.org/3/tutorial/modules.html', source: 'docs', note: 'Explains the module search path that makes a stray `tkinter.py` shadow the real one.' },
  ],
};
