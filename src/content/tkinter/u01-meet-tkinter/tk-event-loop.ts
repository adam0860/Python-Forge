import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-event-loop',
  title: 'The Event Loop: How a GUI Really Works',
  summary: 'The mental model behind every GUI: instead of running top to bottom, the program builds an interface and then waits for events. See a toy event loop in plain Python, wire a button to a callback, learn why a slow callback freezes the window, and handle the close button.',
  minutes: 28,
  objectives: [
    'Contrast a script that runs top to bottom with an event-driven program',
    'Describe what the event loop does and write a toy version in plain Python',
    'Connect a function to a button with `command=` and avoid the `command=f()` mistake',
    'Explain why a long-running callback freezes the window, and how `after()` avoids it',
    'Intercept the window’s close button with `protocol("WM_DELETE_WINDOW", ...)`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Scripts run; GUIs wait',
      blocks: [
        {
          type: 'p',
          text: 'A script has a beginning, a middle and an end: it reads input, does its work in the order you wrote, and exits. A GUI program has no such story. After it has built its windows it does **nothing at all** until the user does something: clicks, types, drags, resizes, or until a timer goes off. Your code runs only in short bursts, in response to those happenings. This style is called [[event-driven-programming|event-driven programming]].',
        },
        {
          type: 'p',
          text: 'What waits and decides which burst of code runs next is the [[gui-event-loop|event loop]]. Conceptually it is just this: *wait for an event; find the function registered for it; call the function; repeat until the window is closed.* To see how little magic there is, here is a toy event loop in plain Python. Events are `(name, data)` pairs; handlers are functions you registered for a name.',
        },
        {
          type: 'code',
          title: 'toy_event_loop.py',
          runnable: true,
          code: `from collections import deque

handlers = {}


def on(event_name, func):
    handlers.setdefault(event_name, []).append(func)


def run(events):
    queue = deque(events)
    while queue:
        name, data = queue.popleft()
        if name == "quit":
            print("quit received, loop ends")
            break
        for func in handlers.get(name, []):
            func(data)


def greet(name):
    print("Hello,", name)


def show_key(key):
    print("key pressed:", key)


on("click", greet)
on("key", show_key)

run([("click", "Ada"), ("key", "x"), ("move", "(3, 4)"), ("click", "Grace"), ("quit", None), ("click", "never")])`,
          output: `Hello, Ada
key pressed: x
Hello, Grace
quit received, loop ends`,
          annotations: [
            { lines: '3-7', text: 'The **registry**: a dictionary from an event name to a list of functions. `on()` is the toy equivalent of `command=` and `bind()`: “when this happens, call that”.' },
            { lines: '10-18', text: 'The **loop** itself. Real tkinter’s `mainloop()` takes events from the operating system instead of a list, but the structure is the same.' },
            { lines: '14-16', text: 'A special event ends the loop. In tkinter, destroying the root window does the same.' },
            { lines: '17-18', text: 'Dispatch: call every handler registered for this event name, passing the event’s data. An event nobody listens for (`"move"` here) is simply ignored.' },
            { lines: '29-30', text: '**Registering** the handlers happens up front, before the loop runs. In a GUI this is when you build the widgets and give them callbacks.' },
            { lines: 32, text: 'The events arrive in order. `"move"` has no handler, and the click after `"quit"` is never processed because the loop has ended.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why one loop instead of many threads?',
          text: 'GUI toolkits run **all** user-interface code in a single thread, so two callbacks can never change a widget at the same time and widgets need no locks. The price is the rule you will meet in a moment: callbacks must return quickly, because while one runs, nothing else can.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `root.mainloop()` do in a tkinter program?',
      options: [
        { text: 'It runs the event loop: it waits for events and calls the matching callbacks until the window is closed', correct: true, why: 'That is the whole job. Between events nothing of your code runs, and the call returns only after the root window has been destroyed.' },
        { text: 'It creates the widgets that you defined above it', why: 'Widgets exist from the moment you create them with their constructors. `mainloop()` does not create anything.' },
        { text: 'It repeats the code above it forever, like `while True`', why: 'It does not re-run your code. It waits, and only runs your callbacks when an event arrives.' },
        { text: 'It draws the window once and then returns immediately', why: 'The opposite: it keeps running, and the program stays inside this call for its entire life.' },
      ],
      explanation: '`mainloop()` is “start waiting for events”. Everything that happens afterwards happens inside callbacks that the loop calls for you.',
    },
    {
      kind: 'concept',
      title: 'Connecting a button to a function',
      blocks: [
        {
          type: 'p',
          text: 'The simplest way to register a callback is the `command=` option of a `Button`: the function runs each time the button is pressed. The program below is a complete tkinter application with state: a counter that is updated whenever the button is pressed.',
        },
        {
          type: 'code',
          title: 'click_counter.py',
          desktopOnly: true,
          code: `import tkinter as tk

count = 0


def on_click():
    global count
    count += 1
    label.config(text=f"Clicked {count} times")


root = tk.Tk()
label = tk.Label(root, text="Not clicked yet")
label.pack(padx=30, pady=10)
tk.Button(root, text="Click me", command=on_click).pack(pady=(0, 20))
root.mainloop()`,
          annotations: [
            { lines: 3, text: 'State that must survive between events lives outside the callback, here in a module-level variable. (Later lessons use classes and tk variables for this.)' },
            { lines: '6-9', text: 'The **callback**: an ordinary function, written before the button exists. It changes the program state and then updates the interface with `config()`. It takes no arguments because a button’s command is called without any.' },
            { lines: 9, text: 'The text of the label is rebuilt from the state each time, so the display always matches `count`.' },
            { lines: 13, text: 'Defined at module level, `label` can be used by the callback even though the callback is written above this line: the name is looked up when the callback *runs*, after the label exists.' },
            { lines: 15, text: '`command=on_click`: the function **itself**, with no parentheses. tkinter stores it and calls it for you at every press.' },
            { lines: 16, text: 'After this line the program just waits. Each click makes the loop call `on_click()`, once, quickly.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'The most common callback bug: command=on_click()',
          text: 'With parentheses, you call the function **right now**, while building the button, and pass its *return value* (usually `None`) as the command. The function runs once at start-up, and the button then does nothing. The same applies everywhere callbacks are accepted: pass the function, do not call it. When you need to pass arguments, a later lesson shows `lambda` and `functools.partial`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'To make a button run `on_click` when pressed, you write `command=on_click()` with parentheses, so that the function is called.',
      answer: false,
      explanation: 'False. With parentheses the function is called immediately while the button is being created, and its return value (usually `None`) becomes the command. Write `command=on_click`, so that tkinter can call it later, when the button is pressed.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the program so that pressing the button prints `go`, and so that the event loop is started.',
      template: `def on_go():
    print("go")


root = tk.Tk()
tk.Button(root, text="Go", command=___).pack()
root.___()`,
      templateIsCode: true,
      blanks: [{ answers: ['on_go'] }, { answers: ['mainloop'] }],
      wordBank: ['on_go', 'on_go()', 'mainloop', 'quit', 'update'],
      explanation: 'The command is the function object `on_go`, without parentheses, and `root.mainloop()` starts the loop that will call it.',
    },
    {
      kind: 'concept',
      title: 'Why a slow callback freezes the window',
      blocks: [
        {
          type: 'p',
          text: 'The loop and your callbacks share **one** thread. While a callback is running, the loop is not: no clicks are noticed, no text is typed, and the window is not even **repainted**, so it looks frozen (and the operating system may mark it “Not responding”). That is why callbacks must be short.',
        },
        {
          type: 'code',
          title: 'frozen.py',
          desktopOnly: true,
          code: `import time
import tkinter as tk


def work():
    status.config(text="Working...")
    time.sleep(3)
    status.config(text="Done")


root = tk.Tk()
status = tk.Label(root, text="Idle", width=24)
status.pack(padx=30, pady=10)
tk.Button(root, text="Start", command=work).pack(pady=(0, 20))
root.mainloop()`,
          annotations: [
            { lines: 6, text: 'This label change is **not shown** immediately: the screen is only updated when the callback returns and the loop gets control again.' },
            { lines: 7, text: '`time.sleep(3)` blocks the only thread. For three seconds the window cannot move, repaint or react, and “Working...” never appears.' },
            { lines: 8, text: 'When the callback ends, the loop repaints, and the user sees only the final “Done”.' },
          ],
        },
        {
          type: 'p',
          text: 'The fix is to **never wait inside a callback**. Instead, ask the loop to call you again later with `root.after(milliseconds, function)`, and return at once. Between the two calls the loop is free to repaint and handle events:',
        },
        {
          type: 'code',
          title: 'not_frozen.py',
          desktopOnly: true,
          code: `import tkinter as tk


def start():
    status.config(text="Working...")
    root.after(3000, finish)


def finish():
    status.config(text="Done")


root = tk.Tk()
status = tk.Label(root, text="Idle", width=24)
status.pack(padx=30, pady=10)
tk.Button(root, text="Start", command=start).pack(pady=(0, 20))
root.mainloop()`,
          annotations: [
            { lines: 5, text: 'The new text is shown straight away, because the callback now returns after one quick line.' },
            { lines: 6, text: '`after(3000, finish)` schedules `finish` to be called by the loop in 3000 ms (3 seconds) and returns immediately. The window stays alive in the meantime.' },
            { lines: '9-10', text: 'The second callback finishes the job. A job that has several steps becomes a chain of short callbacks.' },
          ],
        },
        {
          type: 'p',
          text: 'Work that is truly long (downloading a file, a heavy calculation) can be moved to a **background thread**, with results handed back to the interface through a queue. A later lesson (Timers, Long Tasks and Threads) shows exactly how.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This toy dispatcher works like the loop in the lesson: it calls the handlers registered for each event name and skips events without handlers.',
      code: `log = []
handlers = {
    "click": [lambda d: log.append("A" + d)],
    "key": [lambda d: log.append("K" + d)],
}
events = [("click", "1"), ("key", "x"), ("click", "2"), ("move", "3")]
for name, data in events:
    for handler in handlers.get(name, []):
        handler(data)
print(log)`,
      answer: "['A1', 'Kx', 'A2']",
      hint: 'The `move` event has no handler, so nothing is appended for it.',
      explanation: 'The events are processed in arrival order: click 1 gives `A1`, key x gives `Kx`, click 2 gives `A2`, and `move` is looked up with `handlers.get(name, [])`, which returns an empty list, so it is ignored. A real event loop treats the many events nobody is interested in (the mouse moving over a label, for instance) in the same way.',
    },
    {
      kind: 'error',
      prompt: 'This program’s button does nothing when pressed, although `on_click` prints `clicked` once as soon as the program starts. Tap the faulty line.',
      lines: [
        'import tkinter as tk',
        'def on_click():',
        '    print("clicked")',
        'root = tk.Tk()',
        'tk.Button(root, text="Click", command=on_click()).pack()',
        'root.mainloop()',
      ],
      linesAreCode: true,
      errorLines: [5],
      explanation: '`command=on_click()` **calls** the function while the button is being created (which is why `clicked` appears at start-up) and gives the button the result, `None`, as its command. It has to be `command=on_click`.',
    },
    {
      kind: 'numeric',
      prompt: 'A callback blocks the event loop for 2.5 seconds. The screen would normally be repainted 60 times per second. How many repaints are lost while the window is frozen?',
      answer: '150',
      hint: 'Multiply the duration in seconds by the number of repaints per second.',
      explanation: '2.5 seconds × 60 repaints per second = 150 repaints that never happen. For the user this is a window that cannot be moved, redrawn or clicked for two and a half seconds. As a rule of thumb, a callback should finish in a few milliseconds, and certainly well below a tenth of a second.',
      label: 'Lost repaints:',
    },
    {
      kind: 'concept',
      title: 'Other events, and the close button',
      blocks: [
        {
          type: 'p',
          text: 'Button presses are only one kind of event. The event loop also delivers key presses, mouse movement, **timers** scheduled with `after()`, requests to **redraw** a part of the window, resizes, focus changes, and the click on the title bar’s **close button**. By default, pressing close destroys the window and ends the loop. If you want to do something first (ask for confirmation, save a file), register your own handler for the special protocol `"WM_DELETE_WINDOW"`:',
        },
        {
          type: 'code',
          title: 'confirm_close.py',
          desktopOnly: true,
          code: `import tkinter as tk
from tkinter import messagebox


def on_close():
    if messagebox.askokcancel("Quit", "Really quit?"):
        root.destroy()


root = tk.Tk()
root.protocol("WM_DELETE_WINDOW", on_close)
tk.Label(root, text="Try closing this window").pack(padx=40, pady=30)
root.mainloop()`,
          annotations: [
            { lines: 2, text: '`messagebox` is a submodule, so it has to be imported separately from `tkinter` itself.' },
            { lines: '5-7', text: '`askokcancel` shows a modal dialog and returns `True` for OK. Only then is the window destroyed. If the user cancels, the window simply stays open.' },
            { lines: 11, text: 'This line replaces the default behaviour of the close button with your function. From now on, **you** are responsible for closing the window: nothing ends unless the callback calls `root.destroy()`.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'Effect'],
          rows: [
            ['`root.destroy()`', 'Destroys the window and all its widgets, and the event loop ends. The normal way to quit'],
            ['`root.quit()`', 'Stops the event loop but leaves the windows in place; the code after `mainloop()` then runs. Rarely what you want in a simple program'],
            ['`root.update()`', 'Handles all pending events *now*, from inside your own code. Tempting for “repaint during a long loop”, but it causes hard-to-debug re-entrancy bugs. Prefer `after()`'],
            ['`root.update_idletasks()`', 'Only does pending redrawing and layout, without running user callbacks. A safer way to force a repaint'],
          ],
          caption: 'Ending the loop, and forcing it to work. When in doubt, use `destroy()`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Your turn: callbacks on the stand-in',
          text: 'The practice questions build a counter that works with `invoke()` (which presses a button from code, exactly like a click), a toy event loop in plain Python, and a close handler. Use **Try it** to see the widget tree, then **Run and check**.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `build_counter(root)`. It creates a `Label` with the text `Clicked 0 times` and a `Button` with the text `Click me`, packs both, and returns `(label, button)`. Each press of the button must change the label to `Clicked 1 times`, `Clicked 2 times` and so on.',
      starter: `import tkinter as tk


def build_counter(root):
    ...
`,
      solution: `import tkinter as tk


def build_counter(root):
    label = tk.Label(root, text="Clicked 0 times")
    label.pack()
    count = 0

    def on_click():
        nonlocal count
        count += 1
        label.config(text=f"Clicked {count} times")

    button = tk.Button(root, text="Click me", command=on_click)
    button.pack()
    return label, button
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
label, button = build_counter(root)
assert isinstance(label, tk.Label) and isinstance(button, tk.Button)
assert label.cget("text") == "Clicked 0 times"
assert button.cget("text") == "Click me"
assert label.winfo_manager() == "pack" and button.winfo_manager() == "pack"
button.invoke()
assert label.cget("text") == "Clicked 1 times", "the first press should show 1"
button.invoke()
button.invoke()
assert label.cget("text") == "Clicked 3 times"
other_root = tk.Tk()
l2, b2 = build_counter(other_root)
b2.invoke()
assert l2.cget("text") == "Clicked 1 times"
assert label.cget("text") == "Clicked 3 times", "each counter keeps its own count"`,
      checks: ['Creates and packs a label (`Clicked 0 times`) and a button (`Click me`) and returns them', 'Pressing the button updates the label to `Clicked N times`', 'Each call of `build_counter` has its own, independent count'],
      hint: 'Define the callback inside `build_counter` so that it can use `label`, and keep the count in a variable of the enclosing function with `nonlocal`. Pass the function (no parentheses) as `command=`.',
      explanation: 'A function defined inside another function keeps access to the variables around it (a closure). That is why `on_click` can update `label` and `count` of the call it was created in, and why two counters do not interfere. `button.invoke()` does what a mouse click does: it calls the command.',
    },
    {
      kind: 'code',
      prompt: 'Write `run_events(events, handlers)`: a tiny event loop. `events` is a list of `(name, data)` pairs and `handlers` maps a name to a list of functions. Process the events in order, calling every handler of an event with its `data`. Stop at an event named `"quit"` (do not process anything after it). Return the number of events that had **no handler** (the `"quit"` event is not counted).',
      starter: `def run_events(events, handlers):
    ...
`,
      solution: `def run_events(events, handlers):
    ignored = 0
    for name, data in events:
        if name == "quit":
            break
        funcs = handlers.get(name, [])
        if not funcs:
            ignored += 1
        for func in funcs:
            func(data)
    return ignored
`,
      tests: `log = []
handlers = {"click": [lambda d: log.append(("a", d)), lambda d: log.append(("b", d))], "key": [lambda d: log.append(("k", d))]}
events = [("click", 1), ("move", 2), ("key", "x"), ("click", 3)]
assert run_events(events, handlers) == 1
assert log == [("a", 1), ("b", 1), ("k", "x"), ("a", 3), ("b", 3)]

log.clear()
assert run_events([("click", 1), ("quit", None), ("click", 2), ("scroll", 5)], handlers) == 0
assert log == [("a", 1), ("b", 1)]

assert run_events([], handlers) == 0
assert run_events([("x", 1), ("y", 2), ("z", 3)], {}) == 3
assert run_events([("quit", None)], {"quit": [lambda d: log.append("never")]}) == 0
assert "never" not in log`,
      checks: ['Calls every handler of each event, in event order, with the event’s data', 'Stops at `"quit"` and processes nothing after it', 'Returns the number of events that had no registered handler'],
      hint: 'Loop over the events. Break when the name is `"quit"`. Use `handlers.get(name, [])` to get the (possibly empty) list, count events whose list is empty, and call each function.',
      explanation: 'This is the dispatch core of every GUI toolkit: a table from event names to callbacks and a loop that consults it. In tkinter the table is built by `command=`, `bind()` and `after()`, and the events come from the window system.',
    },
    {
      kind: 'code',
      prompt: 'Write `install_close_handler(root, confirm)`. It defines a function `on_close()` that destroys the window **only if** `confirm()` returns a true value, registers it for the `"WM_DELETE_WINDOW"` protocol with `root.protocol(...)`, and returns `on_close`.',
      starter: `import tkinter as tk


def install_close_handler(root, confirm):
    ...
`,
      solution: `import tkinter as tk


def install_close_handler(root, confirm):
    def on_close():
        if confirm():
            root.destroy()

    root.protocol("WM_DELETE_WINDOW", on_close)
    return on_close
`,
      setup: TK_SIM,
      tests: `def exists(win):
    try:
        return bool(win.winfo_exists())
    except tk.TclError:
        return False

root = tk.Tk()
handler = install_close_handler(root, lambda: False)
assert callable(handler)
assert root.protocol("WM_DELETE_WINDOW"), "register the handler with root.protocol"
handler()
assert exists(root), "the window must stay open when confirm() is false"

root2 = tk.Tk()
handler2 = install_close_handler(root2, lambda: True)
assert root2.protocol("WM_DELETE_WINDOW")
handler2()
assert not exists(root2), "the window must be destroyed when confirm() is true"`,
      checks: ['`on_close()` calls `root.destroy()` only when `confirm()` is true', 'The handler is registered with `root.protocol("WM_DELETE_WINDOW", ...)`', 'The function returns the handler'],
      hint: 'Define `on_close` inside the function (it needs `root` and `confirm`), then call `root.protocol("WM_DELETE_WINDOW", on_close)` and return `on_close`.',
      explanation: 'Passing the question in as a function (`confirm`) is what makes this code testable: the real program passes `lambda: messagebox.askokcancel(...)`, while a test passes `lambda: True` and never needs a dialog. Remember that once you register a close handler, closing the window is entirely your job.',
    },
  ],
  takeaways: [
    'A GUI program is **event-driven**: it builds its interface, then `mainloop()` waits for events and calls the matching **callbacks**. Between events, none of your code runs.',
    'Register a callback by passing the **function itself** (`command=on_click`), never its result (`command=on_click()`, which calls it immediately and gives the button `None`).',
    'There is **one thread** for the interface. A slow callback (`time.sleep`, a long loop) freezes the window because nothing is repainted or handled until it returns. Keep callbacks short and use `root.after(ms, function)` for delays.',
    '`root.protocol("WM_DELETE_WINDOW", handler)` lets you intercept the close button; then you must call `root.destroy()` yourself. Prefer `update_idletasks()` or `after()` to `update()`.',
    'State that callbacks share can live in module variables, closures or (later) classes and tk variables; separating pure logic from widget code keeps it testable.',
  ],
  reading: [
    { title: 'TkDocs: Event Handling', url: 'https://tkdocs.com/tutorial/eventloop.html', source: 'tutorial', note: 'How the event loop works, why blocking is bad, and how `after` and `update` behave.' },
    { title: 'Python documentation: tkinter — Handy Reference (callbacks and the event loop)', url: 'https://docs.python.org/3/library/tkinter.html#handy-reference', source: 'docs', note: 'The basics of setting options and binding callbacks in tkinter.' },
    { title: 'Event-driven programming (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Event-driven_programming', source: 'wikipedia', note: 'The general idea behind GUIs, servers and games.' },
    { title: 'Real Python: Python GUI Programming With Tkinter — handling events', url: 'https://realpython.com/python-gui-tkinter/#handling-events-with-event-handlers', source: 'tutorial', note: 'A beginner-friendly walk through event handlers and the main loop.' },
  ],
};
