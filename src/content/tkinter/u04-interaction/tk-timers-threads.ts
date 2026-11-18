import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-timers-threads',
  title: 'Timers, Animation and Background Work',
  summary: 'Make a window do things over time without freezing it: schedule and cancel work with after(), build a stopwatch, and move slow jobs onto a worker thread that reports back through a queue.',
  minutes: 34,
  objectives: [
    'Explain why `time.sleep()` and long loops freeze a window, and what `after()` does instead',
    'Schedule a one-shot call with `after()`, repeat it by rescheduling, and stop it with `after_cancel()`',
    'Build a clock, stopwatch or countdown that keeps its timer id so that it can be stopped',
    'Run slow work on a worker thread and send results to the window through a `queue.Queue` polled with `after()`',
    'State the rule that only the main thread may touch widgets',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'after(): do it later without freezing',
      blocks: [
        {
          type: 'p',
          text: 'Everything in a tkinter program runs on **one thread**, the one that is inside `mainloop()`. While your callback runs, nothing else happens: no redrawing, no clicks, no typing. That is why `time.sleep(3)` in a button callback freezes the window for three seconds (it shows “Not responding” on Windows), and why a `while True:` animation loop never lets the window appear. The cure is to hand the waiting to the event loop itself with [[after-method|after()]]: `root.after(1000, func)` returns immediately, and **one second later the event loop calls `func`**.',
        },
        {
          type: 'p',
          text: '`after` is **one-shot**. To repeat something (a clock, an animation, a game loop) the callback schedules itself again as its last step. Every call returns a timer **id**; keep it when you might need to stop the timer, and pass it to `root.after_cancel(id)`. The stopwatch below does both:',
        },
        {
          type: 'code',
          title: 'stopwatch.py',
          desktopOnly: true,
          code: `import tkinter as tk

root = tk.Tk()
root.title("Stopwatch")
elapsed = 0
job = None
label = tk.Label(root, text="0.0 s", font=("Segoe UI", 28))
label.pack(padx=40, pady=20)


def tick():
    global elapsed, job
    elapsed += 1
    label.config(text=f"{elapsed / 10:.1f} s")
    job = root.after(100, tick)


def start():
    global job
    if job is None:
        job = root.after(100, tick)


def stop():
    global job
    if job is not None:
        root.after_cancel(job)
        job = None


def reset():
    global elapsed
    stop()
    elapsed = 0
    label.config(text="0.0 s")


row = tk.Frame(root)
row.pack(pady=(0, 20))
tk.Button(row, text="Start", command=start).pack(side="left", padx=4)
tk.Button(row, text="Stop", command=stop).pack(side="left", padx=4)
tk.Button(row, text="Reset", command=reset).pack(side="left", padx=4)
root.mainloop()`,
          annotations: [
            { lines: '11-15', text: 'The repeating pattern: do one small step of work, update the display, and then ask `after` to call `tick` again. The new id replaces the old one in `job`.' },
            { lines: '18-21', text: '`start` checks `job is None` so that a second click cannot schedule a **second** chain of ticks, which would make the clock run twice as fast.' },
            { lines: '24-28', text: '`after_cancel(job)` removes the pending call, and setting `job = None` records that the timer is stopped. Only cancel a valid id: `after_cancel(None)` raises `ValueError`.' },
          ],
        },
        {
          type: 'table',
          headers: ['Call', 'What it does'],
          rows: [
            ['`root.after(ms, func, *args)`', 'Call `func(*args)` once, about `ms` milliseconds from now. Returns an id string'],
            ['`root.after_cancel(id)`', 'Cancel a pending call. Harmless if it already ran or was cancelled, but `None` raises `ValueError`'],
            ['`root.after_idle(func, *args)`', 'Call `func` as soon as the event loop has nothing else to do'],
            ['`root.update()`', 'Process all pending events and due timers **now**. Use rarely: it can re-enter your own callbacks'],
            ['`root.update_idletasks()`', 'Finish pending redraw and layout work only, without handling clicks or key presses'],
          ],
          caption: 'The timer toolbox. The delay is a minimum, not a promise: a busy event loop calls late.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just sleep in a loop?',
          text: 'Redrawing, button clicks and window moves are all **events**, and they are only processed when control returns to `mainloop()`. A loop with `sleep` never returns control, so the window cannot repaint between steps and the operating system decides that the program is hung. With `after`, each step is short and control goes back to the event loop in between, so the window stays alive.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Pass the function, do not call it',
          text: '`root.after(1000, tick)` schedules `tick`. Writing `root.after(1000, tick())` runs `tick` **now** and passes its result (`None`) to `after`, which then just waits 1 second and blocks the window. Extra arguments go after the function: `root.after(1000, show, "hi")`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A button’s callback runs `time.sleep(5)` and then updates a label. What does the user experience during those five seconds?',
      options: [
        { text: 'The whole window is frozen: it does not repaint and ignores clicks, because the event loop is blocked inside the callback', correct: true, why: 'Callbacks run on the event-loop thread, so while `sleep` waits, nothing else can be processed. Use `root.after(5000, update_label)` instead.' },
        { text: 'Only the button is disabled; the rest of the window stays interactive', why: 'Tk does not disable anything. The single thread is simply busy.' },
        { text: 'The label updates a bit at a time, as the sleep progresses', why: 'No redraw can happen while the callback is running, so the user sees nothing change until it ends.' },
        { text: 'tkinter automatically moves the callback to a background thread', why: 'tkinter never does that; callbacks always run on the main thread.' },
      ],
      explanation: 'One thread runs both your callbacks and the GUI’s redrawing. Blocking in a callback blocks the interface. Waiting is `after`’s job, and slow computing belongs to a worker thread (next).',
    },
    {
      kind: 'truefalse',
      prompt: '`root.after(1000, tick)` calls `tick` every second until the program ends.',
      answer: false,
      explanation: 'False. `after` is **one-shot**: it calls `tick` once, after about 1000 ms. To repeat, `tick` must call `root.after(1000, tick)` again at its end, and to stop the repetition you cancel the pending id with `after_cancel` or simply do not reschedule.',
    },
    {
      kind: 'concept',
      title: 'Worker threads and the queue',
      blocks: [
        {
          type: 'p',
          text: '`after` is perfect for many short steps, but it cannot help when **one step is itself slow**: downloading a file, compressing a folder, training a model, or one long database query. The solution is a [[worker-thread|worker thread]]: `threading.Thread(target=job, daemon=True).start()` runs `job` in the background while `mainloop` keeps serving the window.',
        },
        {
          type: 'p',
          text: 'There is one hard rule: **only the main thread may touch widgets.** Tk is not thread-safe, so calling `label.config(...)` from a worker can crash the program or fail at random. The worker instead puts messages into a `queue.Queue`, which **is** safe to share between threads, and the main thread polls that queue with a short repeating `after` and updates the widgets itself. The queue also decides the *protocol*: simple tuples like `("progress", 40)` and `("done", result)` are all you need.',
        },
        {
          type: 'code',
          title: 'background_work.py',
          desktopOnly: true,
          code: `import queue
import threading
import time
import tkinter as tk

root = tk.Tk()
root.title("Background work")
status = tk.Label(root, text="Idle", width=30)
status.pack(padx=20, pady=(20, 10))
messages = queue.Queue()


def slow_job():
    for step in range(1, 6):
        time.sleep(0.5)
        messages.put(("progress", step * 20))
    messages.put(("done", "Finished!"))


def poll():
    try:
        while True:
            kind, value = messages.get_nowait()
            if kind == "progress":
                status.config(text=f"Working... {value}%")
            else:
                status.config(text=value)
                button.config(state="normal")
    except queue.Empty:
        pass
    root.after(100, poll)


def start():
    button.config(state="disabled")
    threading.Thread(target=slow_job, daemon=True).start()


button = tk.Button(root, text="Start", command=start)
button.pack(pady=(0, 20))
poll()
root.mainloop()`,
          annotations: [
            { lines: '14-18', text: 'The worker runs in the background. It never touches \`status\` or \`button\`: it only **puts messages** into the queue. (\`time.sleep\` here stands in for real slow work.)' },
            { lines: '21-31', text: 'The poller runs on the main thread. \`get_nowait()\` takes messages until the queue is empty (it raises \`queue.Empty\`), updating the widgets for each one, and then it reschedules itself.' },
            { lines: '34-36', text: 'Disabling the button stops a second click from starting a second job. \`daemon=True\` means that the thread will not keep the program alive after the window closes.' },
            { lines: 41, text: 'The polling loop is started once, before \`mainloop\`. It costs almost nothing: ten tiny checks per second.' },
          ],
        },
        {
          type: 'p',
          text: 'The queue handling is plain Python, so the heart of the technique can be shown without any window. Here is the “drain” step on its own: take everything that is waiting, in order, and stop when the queue is empty. (Calling it again finds nothing.)',
        },
        {
          type: 'code',
          title: 'drain.py',
          runnable: true,
          code: `import queue

messages = queue.Queue()
for step in range(1, 4):
    messages.put(("progress", step * 25))
messages.put(("done", "Finished!"))


def drain(q):
    handled = []
    while True:
        try:
            kind, value = q.get_nowait()
        except queue.Empty:
            return handled
        handled.append(f"{kind}: {value}")


print(drain(messages))
print(drain(messages))`,
          output: `['progress: 25', 'progress: 50', 'progress: 75', 'done: Finished!']
[]`,
          annotations: [
            { lines: '4-6', text: 'A queue is first in, first out: messages come back in the order they were put in.' },
            { lines: '9-16', text: '\`get_nowait()\` never waits: it either returns the next item or raises \`queue.Empty\`, which is how the loop knows that it is finished.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that schedules a tick and, later, stops it.',
      template: `job = root.___(1000, tick)
root.___(job)`,
      templateIsCode: true,
      blanks: [{ answers: ['after'] }, { answers: ['after_cancel'] }],
      wordBank: ['after', 'after_cancel', 'after_idle', 'update', 'sleep'],
      explanation: '`after(ms, func)` schedules the call and returns an id, and `after_cancel(id)` cancels it if it has not run yet.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The event loop runs timers in order of their delays, which this code models.',
      code: `timers = [("save", 300), ("beep", 100), ("quit", 200)]
for name, delay in sorted(timers, key=lambda t: t[1]):
    print(name)`,
      answer: 'beep\nquit\nsave',
      hint: 'Sort by the delay, smallest first.',
      explanation: 'A timer that is due earlier runs earlier, no matter in which order the `after` calls were made: 100 ms (“beep”), 200 ms (“quit”), 300 ms (“save”). Timers that are due at the same moment run in the order that they were scheduled.',
    },
    {
      kind: 'concept',
      title: 'Stopping cleanly and common traps',
      blocks: [
        {
          type: 'p',
          text: 'Timers and threads outlive the callbacks that created them, so shut them down on purpose. A timer that fires after its window is destroyed raises a `TclError`; a thread that is still working when the window closes can keep the program alive (unless it is a `daemon`). The usual way to stop both is to intercept the close button and cancel everything:',
        },
        {
          type: 'code',
          title: 'clean_shutdown.py',
          code: `import threading

stop_flag = threading.Event()


def worker():
    while not stop_flag.is_set():
        ...  # one small piece of work
        stop_flag.wait(0.1)  # sleeps, but wakes at once when the flag is set


def on_close():
    stop_flag.set()
    if job is not None:
        root.after_cancel(job)
    root.destroy()


root.protocol("WM_DELETE_WINDOW", on_close)`,
          annotations: [
            { lines: '3', text: 'An \`Event\` is a thread-safe on/off flag. The worker checks it regularly and ends when it is set. A thread cannot be killed from outside, so it has to be asked to stop.' },
            { lines: '7-9', text: '\`stop_flag.wait(0.1)\` replaces \`time.sleep(0.1)\`: it waits at most 0.1 s but returns immediately when the flag is set, so shutdown is quick.' },
            { lines: '12-16', text: 'The close handler stops the thread and the timer before destroying the window, so nothing runs against a window that no longer exists.' },
          ],
        },
        {
          type: 'table',
          headers: ['Trap', 'What goes wrong', 'Fix'],
          rows: [
            ['`sleep` or a long loop in a callback', 'The window freezes', '`after` for waiting, a worker thread for slow work'],
            ['`after(1000, tick())`', '`tick` runs now, then `after` gets `None`', 'Pass the function: `after(1000, tick)`'],
            ['Starting the timer twice', 'Two chains of ticks run in parallel (double speed)', 'Keep the id and check `job is None` before scheduling'],
            ['Updating widgets from a thread', 'Random crashes or `RuntimeError`', 'Send messages through a queue and poll with `after`'],
            ['Timer firing after `destroy()`', '`TclError` from a missing widget', 'Cancel in the close handler, or check `winfo_exists()`'],
            ['`after_cancel(None)`', '`ValueError`', 'Keep `job = None` as the stopped state and test it first'],
          ],
          caption: 'The six timing bugs that account for most tkinter problems with time.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `ValueError: id must be a valid identifier returned from after or after_idle`. Tap the line that raises it.',
      lines: [
        'job = None',
        'root = tk.Tk()',
        'root.after_cancel(job)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`job` was never set to a timer id (it is still `None`), and `after_cancel` accepts only an id that `after` returned. The standard guard is `if job is not None: root.after_cancel(job)`.',
    },
    {
      kind: 'numeric',
      prompt: 'A progress display is refreshed by an `after` chain every 40 ms and runs for exactly 2 seconds. How many refreshes happen?',
      answer: '50',
      hint: 'Total time in milliseconds divided by the delay.',
      explanation: '2 seconds is 2000 ms, and 2000 / 40 = 50 refreshes. (Real programs get slightly fewer, because each delay is a minimum and the work itself takes time. This is why animations measure the real elapsed time instead of counting ticks.)',
      label: 'Refreshes:',
    },
    {
      kind: 'concept',
      title: 'Your turn: timers and queues',
      blocks: [
        {
          type: 'p',
          text: 'In the exercises, timers with a delay of `0` are due immediately, and `root.update()` runs every due timer, including the ones that those timers schedule. That lets a test play out a whole chain without waiting. A timer with a large delay does **not** run in `update()`, so it is also easy to test that nothing runs early.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `run_times(root, func, times, delay_ms=0)`. It must call `func(1)`, `func(2)` ... `func(times)` one after another, using `root.after` between the calls (each call `delay_ms` after the previous one). Nothing may run at the moment `run_times` is called, and `times=0` means no calls at all.',
      starter: `import tkinter as tk


def run_times(root, func, times, delay_ms=0):
    ...
`,
      solution: `import tkinter as tk


def run_times(root, func, times, delay_ms=0):
    def step(n):
        func(n)
        if n < times:
            root.after(delay_ms, step, n + 1)

    if times > 0:
        root.after(delay_ms, step, 1)
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
log = []
run_times(root, log.append, 3)
assert log == [], "nothing may run until the event loop gets control"
root.update()
assert log == [1, 2, 3], log
log.clear()
run_times(root, log.append, 0)
root.update()
assert log == [], "times=0 means no calls"
run_times(root, log.append, 2, 100000)
root.update()
assert log == [], "a long delay must not run early"
log.clear()
run_times(root, log.append, 1)
root.update()
assert log == [1]`,
      checks: ['The first call is scheduled with `root.after`, not made directly', 'Each step reschedules the next one until `times` calls have happened', '`times=0` schedules nothing'],
      hint: 'Write an inner function `step(n)` that calls `func(n)` and, if `n < times`, calls `root.after(delay_ms, step, n + 1)`. Then schedule `step(1)` with `root.after`.',
      explanation: 'This is the standard repeating pattern: a callback that does one step and then schedules the next. The step number travels as an argument to `after`, so no global variable is needed.',
    },
    {
      kind: 'code',
      prompt: 'Write the class `Countdown(root, label, seconds, delay_ms=1000)`. The constructor shows `str(seconds)` in the label. `start()` schedules the first `tick` with `root.after(self.delay_ms, ...)` **only if no timer is running** and stores the id in `self.job`. Each `tick` reduces `self.remaining` by 1: while it is above 0 it shows the number and schedules the next tick, and at 0 it shows `"Done!"` and sets `self.job = None`. `stop()` cancels the pending timer (if any) and sets `self.job = None`.',
      starter: `import tkinter as tk


class Countdown:
    def __init__(self, root, label, seconds, delay_ms=1000):
        ...

    def start(self):
        ...

    def tick(self):
        ...

    def stop(self):
        ...
`,
      solution: `import tkinter as tk


class Countdown:
    def __init__(self, root, label, seconds, delay_ms=1000):
        self.root = root
        self.label = label
        self.remaining = seconds
        self.delay_ms = delay_ms
        self.job = None
        self.label.config(text=str(seconds))

    def start(self):
        if self.job is None:
            self.job = self.root.after(self.delay_ms, self.tick)

    def tick(self):
        self.remaining -= 1
        if self.remaining > 0:
            self.label.config(text=str(self.remaining))
            self.job = self.root.after(self.delay_ms, self.tick)
        else:
            self.label.config(text="Done!")
            self.job = None

    def stop(self):
        if self.job is not None:
            self.root.after_cancel(self.job)
            self.job = None
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
lbl = tk.Label(root)
lbl.pack()
c = Countdown(root, lbl, 3, 0)
assert lbl.cget("text") == "3"
c.start()
assert lbl.cget("text") == "3" and c.job is not None, "start only schedules"
root.update()
assert lbl.cget("text") == "Done!" and c.remaining == 0 and c.job is None

lbl2 = tk.Label(root)
lbl2.pack()
c2 = Countdown(root, lbl2, 3, 0)
c2.start()
c2.start()
root.update()
assert c2.remaining == 0 and lbl2.cget("text") == "Done!", "start() twice must not schedule two chains"

lbl3 = tk.Label(root)
lbl3.pack()
c3 = Countdown(root, lbl3, 5, 0)
c3.start()
c3.stop()
assert c3.job is None
root.update()
assert c3.remaining == 5 and lbl3.cget("text") == "5", "a stopped countdown must not tick"
c3.stop()

c4 = Countdown(root, tk.Label(root), 4, 100000)
c4.start()
first = c4.job
c4.start()
assert c4.job == first and first is not None
c4.stop()
root.update()
assert c4.remaining == 4`,
      checks: ['`start()` schedules with `root.after` and keeps the id, but does nothing if a timer is already running', '`tick()` counts down, shows the number, reschedules until 0, then shows `"Done!"` and clears `self.job`', '`stop()` cancels a pending timer and is safe to call when nothing is running'],
      hint: 'Keep the timer id in `self.job`. In `tick`, both branches update `self.job`: a new id when rescheduling, `None` at the end.',
      explanation: 'Storing the id makes the timer stoppable, and the `job is None` test makes `start` idempotent, so a double click cannot start two chains. The same shape (id, start, tick, stop) is the skeleton of clocks, blinking cursors and game loops.',
    },
    {
      kind: 'code',
      prompt: 'Write `poll_queue(root, q, handle, interval_ms=100)` for a `queue.Queue` filled by a worker thread. It takes everything that is waiting in `q` (without blocking) and calls `handle(item)` for each item, in order. If it meets the item `None` (the “finished” marker) it stops at once, without calling `handle` for it and without polling again. Otherwise, when the queue is empty, it schedules itself to run again with `root.after(interval_ms, ...)`.',
      starter: `import queue
import tkinter as tk


def poll_queue(root, q, handle, interval_ms=100):
    ...
`,
      solution: `import queue
import tkinter as tk


def poll_queue(root, q, handle, interval_ms=100):
    while True:
        try:
            item = q.get_nowait()
        except queue.Empty:
            break
        if item is None:
            return
        handle(item)
    root.after(interval_ms, poll_queue, root, q, handle, interval_ms)
`,
      setup: TK_SIM,
      tests: `import queue

root = tk.Tk()
q = queue.Queue()
got = []
q.put("a")
q.put("b")
poll_queue(root, q, got.append, 0)
assert got == ["a", "b"], "the first call drains what is already waiting"
q.put("c")
q.put(None)
q.put("d")
root.update()
assert got == ["a", "b", "c"], "it must poll again with after(), and stop at None: " + repr(got)
assert q.qsize() == 1, "nothing after the None marker may be taken"
q.put("e")
root.update()
assert got == ["a", "b", "c"] and q.qsize() == 2, "polling must stop at the marker"

q2 = queue.Queue()
seen = []
poll_queue(root, q2, seen.append, 100000)
q2.put("x")
root.update()
assert seen == [] and q2.qsize() == 1, "the next poll is only due after interval_ms"`,
      checks: ['Drains the queue with `get_nowait()` and stops the loop on `queue.Empty`', 'Calls `handle(item)` in order, but stops (without polling again) when it reads `None`', 'Reschedules itself with `root.after(interval_ms, ...)` while the work is not finished'],
      hint: 'Loop with `try: item = q.get_nowait() except queue.Empty: break`. Return when `item is None`; after the loop, call `root.after(interval_ms, poll_queue, root, q, handle, interval_ms)`.',
      explanation: 'This function is the main thread’s half of every “background job with progress” program: the worker puts items (and finally `None`), and the poller applies them to the widgets in small, quick batches, so the window never blocks.',
    },
  ],
  takeaways: [
    'Callbacks and redrawing share **one thread**. Never block in a callback: no `time.sleep`, no long loops, no slow downloads.',
    '`root.after(ms, func, *args)` calls `func` **once** after about `ms` milliseconds and returns an id. Repeat by rescheduling from inside the callback, and stop with `after_cancel(id)` (keep `job = None` as the “stopped” state).',
    'Pass the function itself, not its result: `after(1000, tick)`, not `after(1000, tick())`. Guard against scheduling the same chain twice.',
    'For slow work, start a `threading.Thread(daemon=True)`. **Only the main thread touches widgets**: the worker sends messages through a `queue.Queue`, and the main thread polls the queue with `after` and `get_nowait()`.',
    'Shut down on purpose: set a `threading.Event` for the worker, cancel pending timers and then `destroy()` in a `WM_DELETE_WINDOW` handler.',
  ],
  reading: [
    { title: 'TkDocs: Event loop and the after command', url: 'https://tkdocs.com/tutorial/eventloop.html', source: 'tutorial', note: 'How Tk processes events, why callbacks must be short, and idle and timer events.' },
    { title: 'Python docs: tkinter, threading and queue notes', url: 'https://docs.python.org/3/library/tkinter.html#threading-model', source: 'docs', note: 'The official explanation of how tkinter behaves with threads.' },
    { title: 'Python docs: queue, a synchronized queue class', url: 'https://docs.python.org/3/library/queue.html', source: 'docs', note: 'Queue, get_nowait and the Empty exception.' },
    { title: 'Python docs: threading', url: 'https://docs.python.org/3/library/threading.html', source: 'docs', note: 'Thread, daemon threads and Event.' },
  ],
};
