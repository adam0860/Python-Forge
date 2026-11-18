import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-callbacks',
  title: 'Callbacks: Arguments, lambda and partial',
  summary: 'Master the mechanics of callbacks: pass the function, do not call it; send arguments with lambda or functools.partial; avoid the late-binding trap in loops; know the signature each kind of callback expects; and see what really happens when a callback raises an exception.',
  minutes: 30,
  objectives: [
    'Pass a function (not its result) to `command=`, and explain what goes wrong with `command=func()`',
    'Give a callback extra arguments with `lambda` and with `functools.partial`',
    'Explain and fix the late-binding bug for callbacks created in a loop',
    'Recall the arguments each kind of callback receives (command, bind, Scale, trace, after)',
    'Handle exceptions raised inside callbacks with `report_callback_exception`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Pass the function, do not call it',
      blocks: [
        {
          type: 'p',
          text: 'A **callback** is a function that you give to tkinter so that tkinter can call it later. The word “give” is the point: you hand over the function object itself, **without parentheses**. Writing parentheses calls the function **now**, at the moment the button is created, and what you hand to tkinter is its return value, usually `None`.',
        },
        {
          type: 'code',
          title: 'call_vs_pass.py',
          runnable: true,
          code: `def greet():
    print("greeting!")


print("--- with parentheses: calls now")
command = greet()
print("command is", command)

print("--- without parentheses: passes the function")
command = greet
print("command is", command.__name__)
print("--- later, 'tkinter' calls it")
command()`,
          output: `--- with parentheses: calls now
greeting!
command is None
--- without parentheses: passes the function
command is greet
--- later, 'tkinter' calls it
greeting!`,
          annotations: [
            { lines: 6, text: 'The parentheses run `greet` immediately. It prints at once, and `command` ends up as `None`, which is exactly what `command=greet()` would hand to a Button: no callback at all.' },
            { lines: '9-10', text: 'Without parentheses `command` refers to the function itself, nothing has run yet.' },
            { lines: 12, text: 'This is what a Button does when it is clicked: it calls the function it was given.' },
          ],
        },
        {
          type: 'code',
          title: 'keypad.py',
          desktopOnly: true,
          code: `import tkinter as tk
from functools import partial

root = tk.Tk()
root.title("Keypad")

display = tk.StringVar()
tk.Label(root, textvariable=display, width=12, anchor="e",
         font=("Consolas", 18)).grid(row=0, column=0, columnspan=3, padx=5, pady=5)


def press(char):
    display.set(display.get() + char)


def clear():
    display.set("")


for i, char in enumerate("123456789"):
    tk.Button(root, text=char, width=4,
              command=partial(press, char)).grid(row=i // 3 + 1, column=i % 3)
tk.Button(root, text="0", width=4, command=lambda: press("0")).grid(row=4, column=1)
tk.Button(root, text="C", width=4, command=clear).grid(row=4, column=0)
root.mainloop()`,
          annotations: [
            { lines: '12-13', text: '`press` needs an argument, but a Button calls its command with **none**. Something has to supply the `char`.' },
            { lines: '16-17', text: '`clear` needs no argument, so it is passed as it is: `command=clear`, no parentheses.' },
            { lines: '20-22', text: '`partial(press, char)` builds a new function with `char` already filled in. Each of the nine buttons gets its own, bound to its own digit.' },
            { lines: 23, text: 'A `lambda` does the same job: `lambda: press("0")` is a tiny function that calls `press("0")` when the button is clicked.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'command=func() is the number one beginner bug',
          text: '`tk.Button(root, text="Save", command=save())` calls `save()` while the window is being built (the work happens at startup), and then sets `command` to its result, `None`. The button looks fine but does nothing when clicked. If you see a callback run at startup and never again, look for stray parentheses.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A program has `tk.Button(root, text="Save", command=save_file())`. What happens?',
      options: [
        { text: '`save_file()` runs once while the button is created, and clicking the button then does nothing', correct: true, why: 'The parentheses call the function immediately. The Button receives its return value (`None`), so it has no callback.' },
        { text: '`save_file()` runs every time the button is clicked', why: 'That is what `command=save_file` (without parentheses) does.' },
        { text: 'tkinter raises a `SyntaxError`', why: 'The code is perfectly valid Python, which is why this mistake is so common. Nothing is reported.' },
        { text: '`save_file()` runs when the window closes', why: 'It runs at creation time, not at any later event.' },
      ],
      explanation: 'The rule for callbacks is the same everywhere: hand tkinter the function object. Parentheses mean “call it now”.',
    },
    {
      kind: 'concept',
      title: 'Giving a callback arguments',
      blocks: [
        {
          type: 'p',
          text: 'tkinter calls your callback with a fixed set of arguments, and for a Button that set is **empty**. To pass your own values you wrap the real call in something that takes no arguments. There are two standard ways: a **lambda** (a small anonymous function) and **`functools.partial`** (a function with some arguments pre-filled).',
        },
        {
          type: 'table',
          headers: ['Tool', 'Example', 'Good for'],
          rows: [
            ['`lambda`', '`command=lambda: press("0")`', 'One-off wrappers, small expressions, adjusting the arguments tkinter provides (`lambda e: submit()`)'],
            ['`lambda` with default', '`command=lambda c=char: press(c)`', 'Loops: the default freezes the current value'],
            ['`partial`', '`command=partial(press, char)`', 'Loops and anywhere you only need to pre-fill arguments. It reads clearly and has no late-binding trap'],
            ['A named function', '`def on_save(): save(path)`', 'Anything longer than a line, or logic that deserves a name'],
          ],
          caption: 'Four ways to adapt a function to a callback.',
        },
        {
          type: 'p',
          text: 'The trap with `lambda` is **late binding**. A lambda does not copy the variables it uses; it looks them up **when it runs**. In a loop that creates buttons, by the time anyone clicks, the loop variable holds its **last** value, so every button reports the same thing. The model below shows all three behaviours without any window:',
        },
        {
          type: 'code',
          title: 'late_binding.py',
          runnable: true,
          code: `from functools import partial


def show(name):
    return f"clicked {name}"


names = ["New", "Open", "Save"]

wrong = [lambda: show(name) for name in names]
print([f() for f in wrong])

with_default = [lambda name=name: show(name) for name in names]
print([f() for f in with_default])

with_partial = [partial(show, name) for name in names]
print([f() for f in with_partial])`,
          output: `['clicked Save', 'clicked Save', 'clicked Save']
['clicked New', 'clicked Open', 'clicked Save']
['clicked New', 'clicked Open', 'clicked Save']`,
          annotations: [
            { lines: '10-11', text: 'Every lambda refers to the variable `name`, not to its value. After the loop, `name` is `"Save"`, so all three print the same.' },
            { lines: '13-14', text: 'The default argument `name=name` is evaluated **once, when the lambda is created**, so each lambda keeps its own copy.' },
            { lines: '16-17', text: '`partial` stores the value it is given immediately, so it cannot suffer from late binding.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does Python work this way?',
          text: 'A function’s body is run **later**, and Python looks up names at that moment. That is what makes closures useful (a callback can see the current state of your program), and also what produces this bug when the name it sees has changed. Neither behaviour is wrong; you just have to choose the one you need.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a callback raises an exception, the tkinter program closes immediately.',
      answer: false,
      explanation: 'False. tkinter catches the exception, prints “Exception in Tkinter callback” and the traceback to the console, and **keeps running**. To the user the click simply seems to do nothing, which is why callbacks need their own error handling (see the next section).',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that clicking the button calls `open_file("notes.txt")`.',
      template: `from functools import ___
button = tk.Button(root, text="Open", command=___(open_file, "notes.txt"))`,
      templateIsCode: true,
      blanks: [{ answers: ['partial'] }, { answers: ['partial'] }],
      wordBank: ['partial', 'lambda', 'wraps', 'reduce', 'cache'],
      explanation: '`partial(open_file, "notes.txt")` creates a new function that calls `open_file("notes.txt")` with no further arguments, which is exactly what a Button’s `command` needs. (A lambda would be written `lambda: open_file("notes.txt")`, without a `from` import.)',
    },
    {
      kind: 'concept',
      title: 'What each callback receives, and when it fails',
      blocks: [
        {
          type: 'p',
          text: 'Different tkinter features call your function with different arguments. Knowing the signature is half of getting a callback right:',
        },
        {
          type: 'table',
          headers: ['Where you pass it', 'Called with', 'Typical form'],
          rows: [
            ['Button, Checkbutton, Radiobutton, Menu `command=`', 'nothing', '`def on_click():`'],
            ['`widget.bind(seq, handler)`', 'one `Event`', '`def on_key(event):`'],
            ['Scale `command=`', 'the new value, as a **string**', '`def on_move(value):`'],
            ['`var.trace_add(mode, cb)`', 'three strings: name, index, mode', '`def on_change(*args):`'],
            ['`root.after(ms, func, *args)`', 'the extra arguments you give', '`root.after(500, show, "hi")`'],
            ['`root.protocol("WM_DELETE_WINDOW", cb)`', 'nothing', '`def on_close():`'],
            ['A callback’s return value', 'ignored, except `"break"` from a `bind` handler', '—'],
          ],
          caption: 'Callback signatures. When in doubt, use `*args` while exploring and print what arrives.',
        },
        {
          type: 'p',
          text: 'Exceptions inside callbacks are **not** raised in your code: tkinter catches them and calls `root.report_callback_exception(exc, value, traceback)`, whose default prints the traceback to the console. A user running your program from a desktop shortcut (no console) sees nothing at all. You can replace the method to log the error to a file, show a message box, or both:',
        },
        {
          type: 'code',
          title: 'error_handler.py',
          desktopOnly: true,
          code: `import tkinter as tk
import traceback
from tkinter import messagebox

root = tk.Tk()
root.title("Error handler")


def report(exc, value, tb):
    traceback.print_exception(exc, value, tb)
    messagebox.showerror("Something went wrong", f"{exc.__name__}: {value}")


root.report_callback_exception = report


def divide():
    result.config(text=str(1 / int(entry.get())))


entry = tk.Entry(root)
entry.pack(padx=20, pady=(20, 5))
tk.Button(root, text="1 / x", command=divide).pack()
result = tk.Label(root, text="")
result.pack(pady=(5, 20))
root.mainloop()`,
          annotations: [
            { lines: '9-11', text: 'The new handler receives the exception class, the exception and the traceback, exactly what `traceback.print_exception` wants. It prints for the developer **and** tells the user.' },
            { lines: 14, text: 'Assigning to `root.report_callback_exception` replaces the default behaviour for **every** callback: commands, bindings, timers and traces.' },
            { lines: 18, text: 'Typing `0` or `abc` here raises `ZeroDivisionError` or `ValueError`. Instead of a silent failure, the user now sees a dialog. (Better still, catch the expected errors in `divide` and show a message next to the field.)' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Callbacks are the place for validation',
          text: 'Expect bad input in every callback that reads widgets: catch the specific errors you expect (`ValueError` for a number, `TclError` for a variable) and report them in the interface. Keep `report_callback_exception` as the safety net for the mistakes you did **not** expect.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This list of lambdas is the same trap as buttons created in a loop.',
      code: `callbacks = []
for i in range(3):
    callbacks.append(lambda: i * 10)
print([cb() for cb in callbacks])`,
      answer: '[20, 20, 20]',
      hint: 'The lambdas run after the loop has finished. What is `i` by then?',
      explanation: 'After the loop `i` is 2 (the last value of `range(3)`), and every lambda looks `i` up when it **runs**, so all three return `2 * 10 = 20`. With `lambda i=i: i * 10` the result would be `[0, 10, 20]`.',
    },
    {
      kind: 'error',
      prompt: 'Clicking any button prints `TypeError: <lambda>() missing 1 required positional argument: \'x\'`. Tap the line with the mistake.',
      lines: [
        'for name in names:',
        '    button = tk.Button(root, text=name, command=lambda x: show(x))',
        '    button.pack()',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'A Button calls its command with **no** arguments, so `lambda x: ...` has no way to receive `x`. The value must be supplied by you, with a default argument: `command=lambda x=name: show(x)`, or with `partial(show, name)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A loop creates five buttons with `command=lambda: print(i)` for `i` in `range(5)` and no default argument. The user clicks the third button. What number is printed?',
      answer: '4',
      hint: 'By the time anyone clicks, the loop has ended. What does `i` hold then?',
      explanation: 'Every lambda reads the loop variable `i` when it runs, and after `range(5)` finishes `i` is 4. Every button prints 4, whichever the user clicks. The fix is `lambda i=i: print(i)`.',
      label: 'Printed:',
    },
    {
      kind: 'concept',
      title: 'Your turn: callbacks that carry data',
      blocks: [
        {
          type: 'p',
          text: 'The exercises use the stand-in. `button.invoke()` simulates a click: it calls the button’s command exactly as a real click would, including routing exceptions to `report_callback_exception`, so you can test a callback without a window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `make_buttons(parent, names, log)`. Create one `Button` per name (the name is its text), pack it, and make its command append **that button’s own name** to the list `log`. Return the list of buttons.',
      starter: `import tkinter as tk


def make_buttons(parent, names, log):
    ...
`,
      solution: `import tkinter as tk
from functools import partial


def make_buttons(parent, names, log):
    buttons = []
    for name in names:
        button = tk.Button(parent, text=name, command=partial(log.append, name))
        button.pack()
        buttons.append(button)
    return buttons
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
log = []
buttons = make_buttons(root, ["New", "Open", "Save"], log)
assert [b.cget("text") for b in buttons] == ["New", "Open", "Save"]
assert log == [], "nothing may run when the buttons are created"
buttons[0].invoke()
buttons[2].invoke()
buttons[1].invoke()
buttons[2].invoke()
assert log == ["New", "Save", "Open", "Save"], log
assert all(b.winfo_manager() == "pack" for b in buttons)
assert make_buttons(root, [], log) == []`,
      checks: ['Nothing is called while the buttons are created (no `command=func()` mistake)', 'Each button’s command appends **its own** name (no late-binding bug)', 'Buttons are packed and returned in order'],
      hint: 'Use `command=partial(log.append, name)` or `command=lambda name=name: log.append(name)`. Plain `lambda: log.append(name)` would give every button the last name.',
      explanation: 'Both `partial` and the default-argument lambda freeze the loop variable. Note `log.append` is passed without parentheses: a bound method is a perfectly good callback.',
    },
    {
      kind: 'code',
      prompt: 'Write `click_counter(parent)`. Create and pack a `Button` that starts with the text `"Clicked 0 times"`. Each click must increase a counter and set the text to `"Clicked N times"` (use `"Clicked 1 time"` for N = 1). Return the button.',
      starter: `import tkinter as tk


def click_counter(parent):
    ...
`,
      solution: `import tkinter as tk


def click_counter(parent):
    count = 0

    def clicked():
        nonlocal count
        count += 1
        word = "time" if count == 1 else "times"
        button.config(text=f"Clicked {count} {word}")

    button = tk.Button(parent, text="Clicked 0 times", command=clicked)
    button.pack()
    return button
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
b = click_counter(root)
assert isinstance(b, tk.Button) and b.winfo_manager() == "pack"
assert b.cget("text") == "Clicked 0 times"
b.invoke()
assert b.cget("text") == "Clicked 1 time"
b.invoke()
b.invoke()
assert b.cget("text") == "Clicked 3 times"
other = click_counter(root)
other.invoke()
assert other.cget("text") == "Clicked 1 time" and b.cget("text") == "Clicked 3 times", "each button has its own counter"`,
      checks: ['The button starts at `"Clicked 0 times"`', 'Each click updates the text, with the singular `time` for exactly one click', 'Each call creates an independent counter (no shared global)'],
      hint: 'Keep the count in the enclosing function and declare it `nonlocal` inside the callback (or keep it in a list or a tk variable). Update the text with `button.config(text=...)`.',
      explanation: 'A callback can **remember** state through a closure. `nonlocal` lets the inner function change the outer variable, and because each call of `click_counter` has its own `count`, several counters never interfere.',
    },
    {
      kind: 'code',
      prompt: 'Write `install_error_log(root, log)`. Replace `root.report_callback_exception` with a function that appends the text `"ExceptionName: message"` (for example `"ValueError: boom"`) to the list `log`, instead of printing the traceback.',
      starter: `import tkinter as tk


def install_error_log(root, log):
    ...
`,
      solution: `import tkinter as tk


def install_error_log(root, log):
    def report(exc, value, tb):
        log.append(f"{exc.__name__}: {value}")

    root.report_callback_exception = report
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
log = []
install_error_log(root, log)


def boom():
    raise ValueError("boom")


def zero():
    return 1 / 0


b1 = tk.Button(root, text="a", command=boom)
b2 = tk.Button(root, text="b", command=zero)
b3 = tk.Button(root, text="c", command=lambda: log.append("fine"))
b1.invoke()
b2.invoke()
b3.invoke()
assert log == ["ValueError: boom", "ZeroDivisionError: division by zero", "fine"], log`,
      checks: ['Assigns a new function to `root.report_callback_exception`', 'The function takes `(exc, value, tb)` and appends `"ExceptionName: message"` to `log`', 'Callbacks that do not fail are unaffected'],
      hint: 'Define `report(exc, value, tb)` with `log.append(f"{exc.__name__}: {value}")`, then assign `root.report_callback_exception = report`.',
      explanation: 'Replacing `report_callback_exception` is a one-line way to turn invisible callback failures into a log file, a dialog or a crash report. `exc` is the exception **class**, so `exc.__name__` gives its name.',
    },
  ],
  takeaways: [
    'Give tkinter the function itself, **without parentheses**: `command=save`. `command=save()` runs `save` immediately and hands tkinter `None`.',
    'To send arguments, wrap the call: `command=lambda: press("0")` or `command=partial(press, char)`. A bound method such as `log.append` can also be a callback.',
    'Lambdas look names up when they **run**. In a loop that means every callback sees the last value; freeze it with a default argument (`lambda c=char: ...`) or use `functools.partial`.',
    'Know the signature: `command` gets nothing, `bind` handlers get an `Event`, a Scale gets a string value, `trace` gets three strings, and `after` passes your extra arguments.',
    'An exception in a callback is printed, not raised, and the program keeps running. Catch expected errors yourself and override `root.report_callback_exception` as a safety net.',
  ],
  reading: [
    { title: 'Python docs: functools.partial', url: 'https://docs.python.org/3/library/functools.html#functools.partial', source: 'docs', note: 'The documented behaviour of partial, with examples.' },
    { title: 'Python FAQ: why do lambdas defined in a loop all return the same value?', url: 'https://docs.python.org/3/faq/programming.html#why-do-lambdas-defined-in-a-loop-with-different-values-all-return-the-same-result', source: 'docs', note: 'The official explanation of the late-binding behaviour.' },
    { title: 'TkDocs: Event handling and callbacks', url: 'https://tkdocs.com/tutorial/eventloop.html', source: 'tutorial', note: 'How the event loop calls your functions, and what to do about long-running ones.' },
    { title: 'Python docs: tkinter, handling exceptions in callbacks', url: 'https://docs.python.org/3/library/tkinter.html#tkinter.Tk.report_callback_exception', source: 'docs', note: 'The hook that receives every exception raised inside a callback.' },
  ],
};
