import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-events',
  title: 'Binding Events: Keys, Mouse and Focus',
  summary: 'React to anything the user does with bind(): mouse clicks and drags, hovering, keys and shortcuts. Learn the event sequence syntax, what the event object contains, which widget receives keyboard events, how events travel from widget to window, and how to stop them with "break".',
  minutes: 34,
  objectives: [
    'Attach handlers with `widget.bind(sequence, handler)` and write handlers that accept an `event`',
    'Use the common sequences: `<Button-1>`, `<B1-Motion>`, `<Enter>`, `<Leave>`, `<Key>`, `<Return>`, `<Control-s>`',
    'Read `event.x`, `event.y`, `event.keysym`, `event.char`, `event.num`, `event.delta` and `event.state`',
    'Explain why keyboard events need focus, and when to bind on the root window or with `bind_all`',
    'Control propagation with `add="+"` and `return "break"`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'bind: attach a handler to an event',
      blocks: [
        {
          type: 'p',
          text: 'A `command=` option covers the one thing a Button is built for. Everything else the user can do, such as clicking a label, dragging on a canvas, hovering, pressing a key, resizing the window, is an **event**, and you subscribe to it with `widget.bind(sequence, handler)`. The **sequence** is a string in angle brackets that names the event, and the **handler** is a function that tkinter calls with one argument: an **Event** object describing what happened.',
        },
        {
          type: 'code',
          title: 'event_lab.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Event lab")

info = tk.StringVar(value="Click, drag or press a key")
tk.Label(root, textvariable=info, width=36).pack(pady=(10, 0))

pad = tk.Frame(root, width=360, height=160, bg="khaki")
pad.pack(padx=10, pady=10)


def on_click(event):
    info.set(f"click at ({event.x}, {event.y}), button {event.num}")


def on_drag(event):
    info.set(f"dragging at ({event.x}, {event.y})")


def on_key(event):
    info.set(f"key {event.keysym!r}, char {event.char!r}")


pad.bind("<Button-1>", on_click)
pad.bind("<B1-Motion>", on_drag)
pad.bind("<Enter>", lambda e: pad.config(bg="gold"))
pad.bind("<Leave>", lambda e: pad.config(bg="khaki"))
root.bind("<Key>", on_key)
root.bind("<Escape>", lambda e: root.destroy())
root.mainloop()`,
          annotations: [
            { lines: '13-14', text: 'A handler **must accept one parameter**, the event. `event.x` and `event.y` are the pointer position inside the widget, in pixels, and `event.num` is the mouse button number.' },
            { lines: '21-22', text: 'For keys, `event.keysym` is the key’s name (`"a"`, `"Return"`, `"Left"`) and `event.char` is the character it produces (an empty string for keys such as arrows).' },
            { lines: '25-26', text: '`<Button-1>` is a left click on the widget. `<B1-Motion>` is mouse movement **while button 1 is held**: a drag.' },
            { lines: '27-28', text: 'Hover effects: `<Enter>` and `<Leave>` fire as the pointer moves onto and off the widget. The lambdas ignore the event and just change the colour.' },
            { lines: '29-30', text: 'Key events are bound on the **root window**, because only the widget that has keyboard focus receives them. `<Escape>` closes the window, which is a common convenience.' },
          ],
        },
        {
          type: 'table',
          headers: ['Sequence', 'When it fires'],
          rows: [
            ['`<Button-1>`, `<Button-2>`, `<Button-3>`', 'Mouse button pressed: left, middle, right (on macOS right is often `<Button-2>`)'],
            ['`<ButtonRelease-1>`', 'Button released (end of a click or drag)'],
            ['`<Double-Button-1>`', 'Double click (valid in `bind`, not in `event_generate`)'],
            ['`<B1-Motion>`, `<Motion>`', 'Pointer moves with button 1 held / with no button'],
            ['`<Enter>`, `<Leave>`', 'Pointer enters or leaves the widget'],
            ['`<MouseWheel>`', 'Wheel scrolled; read `event.delta` (positive is up). On Linux the wheel sends `<Button-4>` and `<Button-5>` instead'],
            ['`<Key>`, `<KeyPress-a>`, `<a>`', 'Any key / the key a. A single character sequence like `"a"` works too'],
            ['`<Return>`, `<Escape>`, `<space>`, `<BackSpace>`, `<Left>`, `<F1>`', 'Named keys'],
            ['`<Control-s>`, `<Shift-Tab>`, `<Alt-F4>`', 'A key with modifiers'],
            ['`<FocusIn>`, `<FocusOut>`', 'The widget gains or loses keyboard focus'],
            ['`<Configure>`', 'The widget is resized or moved. `event.width` and `event.height` hold the new size'],
            ['`<<Copy>>`, `<<Modified>>`', 'Virtual events: named, platform-independent actions. Double angle brackets'],
          ],
          caption: 'The sequences you will use most often. The general form is `<modifiers-type-detail>`.',
        },
        {
          type: 'table',
          headers: ['Attribute', 'Contains'],
          rows: [
            ['`event.widget`', 'The widget that received the event'],
            ['`event.x`, `event.y`', 'Pointer position relative to the widget (mouse events). `event.x_root` and `y_root` are relative to the screen'],
            ['`event.num`', 'Mouse button number (1, 2, 3)'],
            ['`event.delta`', 'Wheel movement, a multiple of 120 on Windows'],
            ['`event.keysym`', 'Key name: `"a"`, `"A"`, `"Return"`, `"Escape"`, `"Left"`'],
            ['`event.char`', 'The typed character, or `""` for keys that print nothing'],
            ['`event.state`', 'Bit mask of modifiers: Shift is `1`, Control is `4`, and the held mouse buttons are `256`, `512`, `1024`'],
            ['`event.width`, `event.height`', 'New size (only for `<Configure>`)'],
          ],
          caption: 'Attributes that do not apply to an event type hold the text `"??"` (for example `event.keysym` for a mouse click), not `None`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A program calls `label.bind("<Return>", submit)` on a Label, but pressing Enter does nothing. What is the most likely reason?',
      options: [
        { text: 'A Label never gets keyboard focus, so key events are never sent to it', correct: true, why: 'Keyboard events go to the widget that has focus. Bind `<Return>` on the root window (or on an Entry that the user is typing in) instead.' },
        { text: '`<Return>` is not a valid sequence; it should be `<Enter>`', why: '`<Return>` is correct for the Enter key. `<Enter>` means “the pointer entered the widget”, which is a different event.' },
        { text: 'A bound handler can only be a lambda', why: 'Any function that accepts the event argument works.' },
        { text: 'bind only works on Buttons', why: 'You can bind events on every widget, and on the window itself.' },
      ],
      explanation: 'Mouse events go to the widget under the pointer, but keyboard events go to the widget with the **focus**. For window-wide shortcuts bind on the root window; for “press Enter in this box” bind on the Entry.',
    },
    {
      kind: 'concept',
      title: 'Where events go, and how to stop them',
      blocks: [
        {
          type: 'p',
          text: 'An event is offered to a series of **binding tags** in a fixed order: first the widget itself, then its widget **class** (the built-in behaviour of every Entry, Button and so on), then the widget’s **toplevel window**, and finally `"all"`. Each tag may have a handler for the sequence. Binding with `widget.bind` adds to the first tag, `root.bind` to the window tag, and `widget.bind_all` to the last. A handler that returns the string `"break"` stops the event from reaching any later tag, and any later handler for the same sequence.',
        },
        {
          type: 'code',
          title: 'event_order.py',
          runnable: true,
          code: `def dispatch(tags, handlers, event):
    """Run the handlers of each tag in order. A handler can return 'break' to stop."""
    for tag in tags:
        for handler in handlers.get(tag, []):
            if handler(event) == "break":
                return f"stopped at {tag}"
    return "reached the end"


log = []
handlers = {
    "label":  [lambda e: log.append("label handler")],
    "window": [lambda e: log.append("window handler")],
    "all":    [lambda e: log.append("all handler")],
}
tags = ["label", "class", "window", "all"]

print(dispatch(tags, handlers, "click"), log)

log.clear()
handlers["label"].append(lambda e: "break")
print(dispatch(tags, handlers, "click"), log)

log.clear()
handlers["label"] = [lambda e: "break", lambda e: log.append("never")]
print(dispatch(tags, handlers, "click"), log)`,
          output: `reached the end ['label handler', 'window handler', 'all handler']
stopped at label ['label handler']
stopped at label []`,
          annotations: [
            { lines: '3-6', text: 'Tags are visited in order, and each tag may hold several handlers. Returning `"break"` ends the whole dispatch immediately.' },
            { lines: 18, text: 'Normal case: every tag’s handler runs, from the most specific (the widget) to the most general (all).' },
            { lines: '20-22', text: 'A `"break"` from the label’s second handler stops the window and all handlers.' },
            { lines: '24-26', text: 'Even later handlers **on the same tag** do not run once a handler has broken the chain.' },
          ],
        },
        {
          type: 'p',
          text: 'Two more rules complete the picture. First, `widget.bind(sequence, handler)` **replaces** an existing binding for the same sequence on that widget. To keep both, pass `add="+"`: `widget.bind("<Button-1>", second, add="+")`. Second, if several sequences on one tag match an event, only the **most specific** one runs: with bindings for `<Key>` and `<a>`, pressing `a` calls only the `<a>` handler, and `<Control-a>` beats `<a>` when Control is held.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Window-wide shortcuts',
          text: 'Bind them on the **root** window (`root.bind("<Control-s>", save)`). Every widget inside the window passes unhandled key events up to its toplevel, so the shortcut works wherever the focus is. Use `bind_all` only for events that must work in every window of the program, such as `<F1>` for help, and note that caps lock changes the keysym: bind `<Control-s>` **and** `<Control-S>` if you want both to work.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does Entry still receive characters if I bind <Key> on the window?',
          text: 'The Entry’s own **class binding** (the built-in typing behaviour) runs on the class tag, before the window tag, so typing works and your window binding is still called afterwards. To **suppress** the built-in behaviour, bind on the Entry itself and return `"break"`: for example, a filter that blocks non-digits.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The function you pass to `widget.bind(...)` is called with no arguments, just like the function for a Button’s `command=`.',
      answer: false,
      explanation: 'False. `bind` always calls the handler with one argument, the `Event`. A function defined as `def on_click():` fails with `TypeError: on_click() takes 0 positional arguments but 1 was given`. Accept the event (`def on_click(event):`) or use a lambda that ignores it (`lambda e: do_it()`).',
    },
    {
      kind: 'fill',
      prompt: 'Complete the bindings: a left-button press, and mouse movement while button 1 is held.',
      template: `canvas.bind("<___-1>", on_press)
canvas.bind("<B1-___>", on_drag)`,
      templateIsCode: true,
      blanks: [{ answers: ['Button', 'ButtonPress'] }, { answers: ['Motion'] }],
      wordBank: ['Button', 'Motion', 'Key', 'Enter', 'Configure'],
      explanation: '`<Button-1>` is the press of the left button and `<B1-Motion>` is a move with the left button held down. Together with `<ButtonRelease-1>` they let you implement dragging: remember the start point on press, update on motion, finish on release.',
    },
    {
      kind: 'concept',
      title: 'Common patterns and traps',
      blocks: [
        {
          type: 'table',
          headers: ['Goal', 'Code'],
          rows: [
            ['Press Enter in an Entry to submit', '`entry.bind("<Return>", lambda e: submit())`'],
            ['Keyboard shortcut for the whole window', '`root.bind("<Control-s>", lambda e: save())`'],
            ['Close with Escape', '`root.bind("<Escape>", lambda e: root.destroy())`'],
            ['Hover highlight', '`<Enter>` sets the hover colour, `<Leave>` restores it'],
            ['Right-click menu', '`widget.bind("<Button-3>", show_menu)` (see the Menus lesson)'],
            ['React to resizing', '`root.bind("<Configure>", on_resize)`, using `event.width` and `event.height`. It fires many times during a resize'],
            ['Which modifiers are held', '`event.state & 1` (Shift), `event.state & 4` (Control)'],
            ['Block a keystroke', 'Bind `<Key>` on that widget and `return "break"`'],
            ['Move focus', '`widget.focus_set()`; Tab moves the focus along automatically'],
          ],
          caption: 'Reusable event recipes.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Late binding in loops',
          text: 'If you create bindings or buttons in a loop with `lambda e: show(name)`, every lambda looks up `name` when it **runs**, after the loop has finished, so they all see the last value. Capture the current value with a default argument: `lambda e, name=name: show(name)`. The Callbacks lesson, which follows, covers this and `functools.partial` in depth.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not do slow work in an event handler',
          text: 'A handler runs on the same thread that draws the window, so anything slow (a download, a big calculation, `time.sleep`) freezes the window until it finishes. `<Motion>` and `<Configure>` events arrive dozens of times per second, so keep their handlers tiny. The last lesson of this unit shows how to run long tasks without freezing.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The `state` of a key event is a bit mask: Shift is 1, Control is 4 and Alt is 8 (on some systems).',
      code: `state = 5
print(bool(state & 1), bool(state & 4), bool(state & 8))`,
      answer: 'True True False',
      hint: '5 is 4 + 1, so two of the three bits are set.',
      explanation: '`5 = 4 + 1` means Control and Shift are both held, so the tests for bit 1 and bit 4 are true and the test for bit 8 is false. The `&` operator keeps only the bits that are set in both numbers.',
    },
    {
      kind: 'error',
      prompt: 'Clicking the label raises `TypeError: on_click() takes 0 positional arguments but 1 was given`. Tap the line that has the mistake.',
      lines: [
        'def on_click():',
        '    print("clicked")',
        '',
        'label.bind("<Button-1>", on_click)',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: 'A handler passed to `bind` always receives the event object, so it must accept a parameter: `def on_click(event):`. If you do not need the event, you can name it `_event` or wrap the call in a lambda: `lambda e: on_click()`.',
    },
    {
      kind: 'numeric',
      prompt: 'A key event arrives with Shift and Control held down. Shift has the bit value 1 and Control has 4. What is `event.state` (ignoring other modifiers such as Num Lock)?',
      answer: '5',
      hint: 'The state is the sum (the bitwise OR) of the bits of the modifiers that are held.',
      explanation: '1 + 4 = 5. To test for a modifier, use `event.state & 4` (Control) or `event.state & 1` (Shift), and not `==`, because other modifier bits are often present as well.',
      label: 'State:',
    },
    {
      kind: 'concept',
      title: 'Your turn: handlers you can test',
      blocks: [
        {
          type: 'p',
          text: 'The exercises use the stand-in, whose `event_generate` creates the same event objects as the real thing, with the same fields and the same dispatch rules, so your handlers can be tested without a window. Two reminders: key events are sent to the widget that has focus, so call `widget.focus_force()` and `root.update()` first, and call `root.update()` after packing a widget before generating events on it.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `record_clicks(widget, log)`. Bind a handler for left clicks (`<Button-1>`) on the widget that appends the click position as a tuple `(event.x, event.y)` to the list `log`.',
      starter: `import tkinter as tk


def record_clicks(widget, log):
    ...
`,
      solution: `import tkinter as tk


def record_clicks(widget, log):
    def on_click(event):
        log.append((event.x, event.y))

    widget.bind("<Button-1>", on_click)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
label = tk.Label(root, text="Click me")
label.pack()
root.update()
log = []
record_clicks(label, log)
label.event_generate("<Button-1>", x=5, y=6)
label.event_generate("<Button-1>", x=40, y=2)
assert log == [(5, 6), (40, 2)], log
label.event_generate("<Button-2>", x=1, y=1)
assert len(log) == 2, "only the left button counts"
other = tk.Label(root, text="Other")
other.pack()
root.update()
other.event_generate("<Button-1>", x=9, y=9)
assert len(log) == 2, "the binding belongs to one widget"`,
      checks: ['Binds `<Button-1>` on the given widget', 'The handler accepts the event and appends `(event.x, event.y)` to `log`', 'Other buttons and other widgets do not add to the log'],
      hint: 'Define `def on_click(event):` inside the function, appending `(event.x, event.y)` to `log`, then `widget.bind("<Button-1>", on_click)`.',
      explanation: 'The handler is a closure: it remembers `log` from the enclosing function. This is a standard way to give a handler access to data without global variables.',
    },
    {
      kind: 'code',
      prompt: 'Write `bind_shortcuts(root, actions)`. `actions` is a dictionary from event sequences (such as `"<Control-s>"`) to **zero-argument** functions. Bind every sequence on `root` so that the matching function is called when the event happens. Take care that each binding calls **its own** function.',
      starter: `import tkinter as tk


def bind_shortcuts(root, actions):
    ...
`,
      solution: `import tkinter as tk


def bind_shortcuts(root, actions):
    for sequence, action in actions.items():
        root.bind(sequence, lambda event, action=action: action())
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
root.update()
calls = []
bind_shortcuts(root, {
    "<Control-s>": lambda: calls.append("save"),
    "<Control-o>": lambda: calls.append("open"),
    "<Escape>": lambda: calls.append("quit"),
})
root.focus_force()
root.update()
root.event_generate("<Control-s>")
root.event_generate("<Control-o>")
root.event_generate("<Escape>")
root.event_generate("<Control-s>")
assert calls == ["save", "open", "quit", "save"], calls
root.event_generate("<Control-p>")
root.event_generate("<a>")
assert len(calls) == 4, "unbound keys do nothing"`,
      checks: ['Binds each sequence of the dictionary on `root`', 'Each handler accepts the event and calls the zero-argument action', 'Every sequence runs its **own** action (no late-binding mix-up)'],
      hint: 'Loop over `actions.items()`. The handler must accept the event: `lambda event, action=action: action()`. The `action=action` default captures the current action.',
      explanation: 'Without `action=action`, all three lambdas would call the last action of the loop. The default argument freezes the current value when the lambda is created. `functools.partial` is another way, shown in the next lesson.',
    },
    {
      kind: 'code',
      prompt: 'Write `add_hover(widget, normal, hover)` that changes the widget’s **background** colour to `hover` when the pointer enters it (`<Enter>`) and back to `normal` when it leaves (`<Leave>`). Also set the widget to the `normal` colour right away.',
      starter: `import tkinter as tk


def add_hover(widget, normal, hover):
    ...
`,
      solution: `import tkinter as tk


def add_hover(widget, normal, hover):
    widget.config(background=normal)
    widget.bind("<Enter>", lambda event: widget.config(background=hover))
    widget.bind("<Leave>", lambda event: widget.config(background=normal))
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
box = tk.Label(root, text="Hover")
box.pack()
root.update()
add_hover(box, "lightgray", "gold")
assert box.cget("background") == "lightgray", "starts in the normal colour"
box.event_generate("<Enter>")
assert box.cget("background") == "gold"
box.event_generate("<Leave>")
assert box.cget("background") == "lightgray"
box.event_generate("<Enter>")
box.event_generate("<Leave>")
assert box.cget("background") == "lightgray"
second = tk.Label(root, text="Other", background="white")
second.pack()
root.update()
add_hover(second, "white", "pink")
second.event_generate("<Enter>")
assert second.cget("background") == "pink" and box.cget("background") == "lightgray"`,
      checks: ['Sets the `normal` background immediately', '`<Enter>` changes the background to `hover` and `<Leave>` restores `normal`', 'Works on several widgets independently'],
      hint: 'Use `widget.config(background=...)` in two lambdas that accept the event: `lambda event: ...`. Bind them to `<Enter>` and `<Leave>`.',
      explanation: 'Hover effects are the simplest use of `<Enter>` and `<Leave>`. The lambdas use `widget`, `normal` and `hover` from the enclosing function, so each call to `add_hover` creates an independent pair of handlers.',
    },
  ],
  takeaways: [
    '`widget.bind(sequence, handler)` subscribes to an event. The handler is **always** called with one `Event` argument, so define it as `def handler(event):` or use `lambda e: ...`.',
    'Sequences look like `<Button-1>`, `<B1-Motion>`, `<Enter>`, `<Key>`, `<Return>`, `<Control-s>`, `<Configure>` and `<<Virtual>>`. The event carries `x`, `y`, `num`, `delta`, `keysym`, `char`, `state` and `widget`.',
    'Mouse events go to the widget under the pointer; **keyboard events go to the widget with focus**, so bind shortcuts on the root window and “Enter to submit” on the Entry.',
    'Events visit the widget, its class, its toplevel window, then `all`. `add="+"` keeps older bindings, only the most specific matching sequence runs on a tag, and `return "break"` stops the event.',
    'Keep handlers fast, and capture loop variables with default arguments (`lambda e, x=x: ...`).',
  ],
  reading: [
    { title: 'TkDocs: Events', url: 'https://tkdocs.com/tutorial/eventloop.html', source: 'tutorial', note: 'How the event loop and bindings work, with the event types and modifiers.' },
    { title: 'Python docs: tkinter, bindings and events', url: 'https://docs.python.org/3/library/tkinter.html#bindings-and-events', source: 'docs', note: 'The documented form of bind, and the event attributes available to handlers.' },
    { title: 'Tk manual: bind', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/bind.htm', source: 'docs', note: 'The full reference for event patterns, modifiers, binding tags and precedence.' },
    { title: 'Tk manual: keysyms', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/keysyms.htm', source: 'docs', note: 'Every key name you can use in a sequence, such as Return, BackSpace and F1.' },
  ],
};
