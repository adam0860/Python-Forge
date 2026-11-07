import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-debugging-logging',
  title: 'Debugging and Logging',
  summary: 'Finding and fixing bugs systematically: reading tracebacks, the `pdb` debugger and `breakpoint()`, bisecting a problem, and the `logging` module (levels, loggers, handlers) that replaces scattered `print` calls.',
  minutes: 20,
  objectives: [
    'Read a traceback from the bottom up and locate the failing line and its callers',
    'Use `breakpoint()` and the basic `pdb` commands to inspect a running program',
    'Apply a systematic debugging routine: reproduce, isolate, hypothesize, verify',
    'Configure `logging` with levels, loggers, handlers and formatters instead of using `print`',
    'Use warnings and fail-fast checks to surface problems early, and avoid swallowing exceptions',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Reading a traceback',
      blocks: [
        {
          type: 'p',
          text: 'When an exception is not caught Python prints a **traceback**: the chain of function calls that led to the error. It is the best clue you will ever get, and it is read **from the bottom up**. The last line names the exception type and message; just above it is the line that raised it; the lines above that are the callers, up to where your program started. The header says "most recent call **last**", so the innermost call is at the bottom.',
        },
        {
          type: 'code',
          title: 'game.py — a crash',
          lang: 'text',
          code: `Traceback (most recent call last):
  File "game.py", line 7, in <module>
    get_hp({"name": "Ada"})
    ~~~~~~^^^^^^^^^^^^^^^^^
  File "game.py", line 5, in get_hp
    return load(player, "hp")
  File "game.py", line 2, in load
    return data[key]
           ~~~~^^^^^
KeyError: 'hp'`,
          annotations: [
            { lines: 1, text: 'The header: calls are listed oldest first, **most recent last**.' },
            { lines: '2-4', text: 'The outermost frame: the script called `get_hp(...)` at line 7. The `~~^^` markers underline the exact sub-expression being executed.' },
            { lines: '5-6', text: 'The middle frame: `get_hp` called `load` at line 5.' },
            { lines: '7-9', text: 'The **innermost frame**, where the error actually happened: `data[key]` at line 2 of `load`.' },
            { lines: 10, text: 'The verdict — **start reading here**. A `KeyError` for `\'hp\'`: the dictionary has no key "hp". The fix is likely in the caller that built `{"name": "Ada"}` without it.' },
          ],
        },
        {
          type: 'p',
          text: 'The traceback is also an object you can inspect in code. `err.__traceback__` holds the frames, and the `traceback` module turns them into data or text — handy for custom error reports. The example below catches the same error and lists the call chain.',
        },
        {
          type: 'code',
          title: 'inspect_traceback.py',
          runnable: true,
          code: `import traceback

def load(data, key):
    return data[key]

def get_hp(player):
    return load(player, "hp")

try:
    get_hp({"name": "Ada"})
except KeyError as err:
    frames = traceback.extract_tb(err.__traceback__)
    print([f.name for f in frames])
    print(type(err).__name__, err)
    print(frames[-1].lineno)`,
          output: `['<module>', 'get_hp', 'load']
KeyError 'hp'
4`,
          annotations: [
            { lines: '9-10', text: 'The same buggy call, now inside `try` so the program carries on instead of crashing.' },
            { lines: 12, text: '`err.__traceback__` is the traceback object attached to the exception; `extract_tb` converts it to a list of frame summaries, outermost first.' },
            { lines: 13, text: 'The call chain, top to bottom: module level, then `get_hp`, then `load` — the same order as the printed traceback.' },
            { lines: 14, text: 'The exception type and message: `KeyError` with the message ‘hp’ (the message of a `KeyError` is the missing key).' },
            { lines: 15, text: 'The last frame is the innermost one: line 4, `return data[key]`, where the exception was raised.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Common exceptions, quick meanings',
          text: '`NameError` (typo or used before assignment), `TypeError` (wrong kind of value, e.g. `"a" + 1`), `ValueError` (right type, bad value), `KeyError`/`IndexError` (missing key or position), `AttributeError` (object lacks that attribute — often a `None` where you expected an object), `ZeroDivisionError`, `ImportError`/`ModuleNotFoundError`, `RecursionError` (runaway recursion). The message after the colon usually says exactly what to look at.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'A C++ crash gives you "segmentation fault" and perhaps a core dump to open in gdb. Python raises an exception with a complete, readable stack trace instead, and bugs rarely corrupt memory. Most Python bugs are found by reading that trace; the interactive debugger is for the harder cases.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A traceback ends with `AttributeError: \'NoneType\' object has no attribute \'hp\'`. Where should you start looking?',
      options: [
        { text: 'At the last frame shown, then ask why that variable is `None` — usually a function that returned nothing or a failed lookup earlier', correct: true, why: 'The bottom frame is where the attribute access failed; the real mistake is often earlier, where `None` came from (a missing `return`, a `.get()` that found nothing, a search that failed).' },
        { text: 'At the first line of the traceback, because that is where the bug is', why: 'The first frame is just the outermost caller. The failing operation is at the bottom.' },
        { text: 'At the Python installation; this error means Python is broken', why: 'Exceptions describe your program’s state. `NoneType` simply means a value you expected to be an object is `None`.' },
        { text: 'Nowhere: restart the program and it will probably go away', why: 'A deterministic error will come back. Reproduce it and read what the trace says.' },
      ],
      explanation: 'Read from the bottom: that frame shows the failing line, and the message shows that a value was `None`. Then work backwards to find where the `None` came from.',
    },
    {
      kind: 'concept',
      title: 'Debugging method and the pdb debugger',
      blocks: [
        {
          type: 'p',
          text: 'Debugging is detective work, and a routine beats random edits. **1. Reproduce** the bug reliably (the same input, preferably the smallest one). **2. Isolate**: narrow down where the program first goes wrong — comment out parts, test functions on their own, or *bisect* (check the middle, then the half that contains the problem). **3. Hypothesize** a cause and predict what you would see if it were true. **4. Check** with a print, a log line or a **[[debugger]]**. **5. Fix** the cause rather than the symptom, then add a test so the bug can’t return. Change one thing at a time, and don’t trust assumptions — verify them.',
        },
        {
          type: 'p',
          text: 'A debugger pauses the program and lets you look around. Python’s built-in one is **`pdb`**. Insert a **[[breakpoint]]** by writing `breakpoint()` in your code, or start the whole script under it with `python -m pdb script.py` (add `-m pdb` to also catch crashes: post-mortem debugging stops *at the failing line* with all variables intact). Editors such as VS Code and PyCharm offer the same features with clickable breakpoints and a variables panel. Below is a real session hunting a wrong average: the program prints 7.0 but the scores 4, 6, 8 average 6.',
        },
        {
          type: 'code',
          title: 'buggy.py and a pdb session',
          lang: 'text',
          code: `def average(scores):
    total = 0
    for s in scores:
        total += s
    return total / len(scores) + 1

print(average([4, 6, 8]))

$ python -m pdb buggy.py
> buggy.py(1)<module>()
-> def average(scores):
(Pdb) b 5
Breakpoint 1 at buggy.py:5
(Pdb) c
> buggy.py(5)average()
-> return total / len(scores) + 1
(Pdb) p total
18
(Pdb) p len(scores)
3
(Pdb) p total / len(scores)
6.0
(Pdb) c
7.0
The program finished and will be restarted
(Pdb) q`,
          annotations: [
            { lines: 5, text: 'The bug: a stray `+ 1` in the return expression. We pretend not to know that yet.' },
            { lines: 9, text: 'Start the program under the debugger. It stops before the first line.' },
            { lines: '12-13', text: '`b 5` sets a **breakpoint** on line 5, the `return`.' },
            { lines: '14-16', text: '`c` (continue) runs until the breakpoint. The debugger shows the next line to execute and the function we are in.' },
            { lines: '17-22', text: '`p expression` prints any expression using the real variables: the total is 18, there are 3 scores, and `18 / 3` is `6.0` — correct so far.' },
            { lines: '23-24', text: 'Continuing, the program prints **7.0**, but the pieces gave 6.0. So the difference must come from the rest of that `return` line: the `+ 1`. Hypothesis confirmed, bug found.' },
          ],
        },
        {
          type: 'table',
          headers: ['Command', 'Meaning', 'Use it to'],
          rows: [
            ['`n`', 'next line (steps over calls)', 'move through a function line by line'],
            ['`s`', 'step into a call', 'follow execution into a function'],
            ['`c`', 'continue to next breakpoint', 'run on until something interesting'],
            ['`p expr`', 'print an expression', 'inspect variables and test hypotheses'],
            ['`l`', 'list source around here', 'see where you are'],
            ['`w`', 'where: show the call stack', 'see who called this function'],
            ['`b N`', 'set a breakpoint at line N', 'stop at a specific place'],
            ['`q`', 'quit the debugger', 'finish debugging'],
          ],
          caption: 'The pdb commands that cover most sessions (`h` lists them all).',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'breakpoint() and print debugging',
          text: 'The built-in `breakpoint()` (Python 3.7+) starts the debugger at that line; set the environment variable `PYTHONBREAKPOINT=0` to disable all of them without editing code. A quick `print(repr(value))` is perfectly fine for small problems — but remember to remove it afterwards, and note that `print` output vanishes on the next run, whereas logging (next steps) can stay in the code for good.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Rubber-duck and bisect',
          text: 'Explaining the problem line by line to a rubber duck (or a friend) often reveals the wrong assumption. When a bug *appeared* between two versions of the project, `git bisect` automates a binary search through the history: it checks out the middle commit, you say "good" or "bad", and after about log2(n) steps it names the commit that introduced the bug. You will write that search yourself at the end of this lesson.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The only way to use `pdb` is to edit your source and insert a `breakpoint()` call.',
      answer: false,
      explanation: 'False. You can run any script under the debugger with `python -m pdb script.py` (setting breakpoints with `b`), and after a crash you can inspect the failed state by running `import pdb; pdb.pm()` in an interactive session, or by using your editor’s debugger with clickable breakpoints.',
    },
    {
      kind: 'concept',
      title: 'The logging module',
      blocks: [
        {
          type: 'p',
          text: 'Print statements are fine while you debug, but real programs need *lasting* diagnostics: messages with a severity, a timestamp and a source, that you can send to a file, filter and switch on or off without editing code. That is the **`logging`** module. Your code creates a **[[logger]]** with `logging.getLogger(__name__)` and calls `log.info("loaded %d levels", n)`. Each message has a **[[log-level]]**; a **[[handler]]** (console, file, network) delivers the messages that pass the level filter, formatted by a *formatter*. The program — not each library — decides which levels are shown.',
        },
        {
          type: 'table',
          headers: ['Level', 'Value', 'Use it for'],
          rows: [
            ['`DEBUG`', '10', 'Detailed diagnostics while developing (every AI decision, every packet)'],
            ['`INFO`', '20', 'Normal milestones: "level loaded", "server started"'],
            ['`WARNING`', '30', 'Something unexpected, but the program carries on: "save file missing, using defaults"'],
            ['`ERROR`', '40', 'An operation failed: "could not connect"'],
            ['`CRITICAL`', '50', 'The program cannot continue: "out of memory, shutting down"'],
          ],
          caption: 'The five standard levels. By default the root logger only shows WARNING and above.',
        },
        {
          type: 'code',
          title: 'logging_demo.py',
          runnable: true,
          code: `import logging
import sys

logging.basicConfig(stream=sys.stdout, level=logging.INFO,
                    format="%(levelname)s %(name)s: %(message)s", force=True)
log = logging.getLogger("game.combat")

def hit(attacker, target, dmg):
    log.debug("rolling damage for %s", attacker)
    target["hp"] -= dmg
    log.info("%s hits %s for %d", attacker, target["name"], dmg)
    if target["hp"] <= 0:
        log.warning("%s is down!", target["name"])
    return target["hp"]

orc = {"name": "orc", "hp": 5}
hit("Ada", orc, 3)
hit("Ada", orc, 3)
logging.getLogger("game").setLevel(logging.DEBUG)
hit("Ada", {"name": "bat", "hp": 9}, 1)`,
          output: `INFO game.combat: Ada hits orc for 3
INFO game.combat: Ada hits orc for 3
WARNING game.combat: orc is down!
DEBUG game.combat: rolling damage for Ada
INFO game.combat: Ada hits bat for 1`,
          annotations: [
            { lines: '4-5', text: '`basicConfig` sets up one console handler on the root logger: show INFO and above, formatted as level, logger name and message. (`force=True` replaces any earlier configuration.)' },
            { lines: 6, text: 'Logger names are dotted: `game.combat` is a child of `game`, which is a child of the root. Libraries and modules usually use `logging.getLogger(__name__)`.' },
            { lines: '9-13', text: 'Calls at three levels. Use **lazy `%s` arguments** instead of f-strings: the string is only built if the message is actually emitted.' },
            { lines: '17-18', text: 'The first two hits log INFO lines; the second also logs a WARNING because the orc’s hit points reached zero. The DEBUG call is discarded silently.' },
            { lines: 19, text: 'Raising the **`game` logger** to DEBUG at run time turns on detail for the whole `game.*` family — no edits to `hit`.' },
            { lines: 20, text: 'Now the debug message appears too. This is the big advantage over `print`: verbosity is a setting, not code you add and delete.' },
          ],
        },
        {
          type: 'p',
          text: 'Loggers and handlers each have a level, and both must allow a message. A common setup is a detailed log file plus a quiet console. The example uses an in-memory stream so you can see which messages each handler lets through.',
        },
        {
          type: 'code',
          title: 'handlers.py',
          runnable: true,
          code: `import io
import logging

stream = io.StringIO()
log = logging.getLogger("demo")
log.setLevel(logging.DEBUG)
log.propagate = False
handler = logging.StreamHandler(stream)
handler.setLevel(logging.WARNING)
handler.setFormatter(logging.Formatter("%(levelname)s|%(message)s"))
log.addHandler(handler)

log.debug("x")
log.warning("careful")
log.error("boom")
print(stream.getvalue().splitlines())`,
          output: `['WARNING|careful', 'ERROR|boom']`,
          annotations: [
            { lines: '6-7', text: 'The logger accepts everything from DEBUG up, and `propagate = False` stops records also going to the root logger’s handlers.' },
            { lines: '8-11', text: 'A handler writing to our in-memory stream, with its own level (WARNING), formatter and attachment to the logger. A real program would use `FileHandler` or `RotatingFileHandler` here.' },
            { lines: '13-15', text: 'Three messages are sent; the debug one passes the logger but is rejected by the handler’s level.' },
            { lines: 16, text: 'Only the warning and the error were written, in our format.' },
          ],
        },
        {
          type: 'p',
          text: 'One more essential tool: inside an `except` block, **`log.exception("message")`** logs at ERROR level *and* includes the full traceback, so a failure can be recorded and the program can carry on:',
        },
        {
          type: 'code',
          title: 'net.py',
          lang: 'text',
          code: `import logging

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("game.net")

def connect():
    raise ConnectionError("refused")

try:
    connect()
except ConnectionError:
    log.exception("connect failed")
print("still running")

# output (the log goes to stderr):
ERROR game.net: connect failed
Traceback (most recent call last):
  File "net.py", line 10, in <module>
    connect()
    ~~~~~~~^^
  File "net.py", line 7, in connect
    raise ConnectionError("refused")
ConnectionError: refused
still running`,
          annotations: [
            { lines: 12, text: '`log.exception` is `log.error` plus the current exception’s traceback. Only call it inside an `except` block.' },
            { lines: '16-23', text: 'The log line followed by the complete traceback — the same information as a crash, but the program is still alive.' },
            { lines: 24, text: 'Execution continued: the error was recorded, not swallowed.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why logging beats print',
          text: 'With logging you get severity, a timestamp (add `%(asctime)s` to the format), the module name and line number (`%(name)s`, `%(lineno)d`), output to files that rotate, and per-module verbosity switches — all without touching the code that emits the messages. Games and servers run for hours; when a player reports a bug you want the log file, not a console that closed. Machine-learning code logs training metrics the same way (and to dashboards such as TensorBoard).',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"Which level is shown by default?" (WARNING and above); "Why `getLogger(__name__)`?" (hierarchy and filtering per module); "What does `log.exception` add?" (the traceback); "Why `%s` arguments instead of f-strings?" (lazy formatting); "Difference between logger level and handler level?" (both must allow the message).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A game cannot find the player’s save file and continues with default settings. Which log level fits best?',
      options: [
        { text: '`WARNING`: unexpected, but the program carries on', correct: true, why: 'WARNING marks something unexpected that did not stop the program. The player can still play, so it is not an error.' },
        { text: '`DEBUG`', why: 'DEBUG is for developer detail and is hidden by default; a missing save file is something an operator should notice.' },
        { text: '`CRITICAL`', why: 'CRITICAL means the program cannot go on. Here it can, with defaults.' },
        { text: '`INFO`', why: 'INFO is for normal milestones. A missing file is not normal, so a WARNING makes it stand out.' },
      ],
      explanation: '`WARNING` for "unexpected but handled", `ERROR` when an operation fails, `CRITICAL` when the program cannot continue, `INFO` for routine milestones and `DEBUG` for fine detail.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code so that each module gets a logger named after itself and records a routine milestone.',
      template: `import logging

log = logging.getLogger(___)
log.___("loaded %d levels", 12)`,
      templateIsCode: true,
      blanks: [{ answers: ['__name__'] }, { answers: ['info'] }],
      wordBank: ['__name__', 'info', 'debug', '"main"'],
      explanation: '`logging.getLogger(__name__)` names the logger after the module, so you can control it by name; a routine milestone belongs at `INFO` level (`debug` would be hidden by default and is meant for detail).',
    },
    {
      kind: 'concept',
      title: 'Failing early: warnings, asserts and silent errors',
      blocks: [
        {
          type: 'p',
          text: 'The cheapest bugs to fix are those that announce themselves close to their cause. Make code **fail fast**: validate inputs at the boundary and raise a specific exception with a helpful message (`raise ValueError(f"hp must be >= 0, got {hp}")`); use `assert` for internal assumptions ("this list is sorted") that should never be false; and use the **`warnings`** module to tell callers that something still works but should change. A warning does not stop the program: it is reported once and can be turned into an error with `python -W error` — useful in your test suite.',
        },
        {
          type: 'code',
          title: 'warnings_demo.py',
          runnable: true,
          code: `import warnings

def old_api():
    warnings.warn("old_api is deprecated; use new_api", DeprecationWarning, stacklevel=2)
    return 1

with warnings.catch_warnings(record=True) as caught:
    warnings.simplefilter("always")
    old_api()
print(len(caught), caught[0].category.__name__, str(caught[0].message))`,
          output: `1 DeprecationWarning old_api is deprecated; use new_api`,
          annotations: [
            { lines: 4, text: '`warnings.warn(message, category, stacklevel=2)` reports a problem without stopping. `stacklevel=2` points the warning at the *caller’s* line, which is where the fix belongs.' },
            { lines: '7-8', text: '`catch_warnings(record=True)` collects warnings in a list instead of printing them (handy in tests); `simplefilter("always")` makes sure none are suppressed.' },
            { lines: 10, text: 'One `DeprecationWarning` was recorded, with our message.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never swallow exceptions',
          text: 'A bare `except:` or `except Exception: pass` hides the very traceback you need: the program carries on with wrong data and fails somewhere far away, with no clue. Catch the *specific* exception you can handle, and log it (`log.exception`) or re-raise when you cannot. If you must catch broadly (a game loop that should not die), always log the traceback.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'More tools worth knowing',
          text: '`python -X dev` enables extra runtime checks and warnings; `python -X faulthandler` (or `import faulthandler; faulthandler.enable()`) prints a traceback when the interpreter itself crashes or hangs; `sys.settrace`-based tools power debuggers; and `pytest --pdb` drops into `pdb` at the first failing test. For AI work, `torch.autograd.set_detect_anomaly(True)` pinpoints the operation that produced a NaN.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. With only `level=logging.WARNING` configured, which severities are enabled for the logger?',
      code: `import logging
logging.basicConfig(level=logging.WARNING, force=True)
log = logging.getLogger("audio")
print(log.isEnabledFor(logging.INFO), log.isEnabledFor(logging.ERROR))`,
      answer: 'False True',
      hint: 'Messages below the configured level are discarded; those at or above it pass.',
      explanation: 'The logger inherits the root level WARNING (30). INFO (20) is below it, so it is disabled (`False`); ERROR (40) is above it, so it is enabled (`True`).',
    },
    {
      kind: 'error',
      prompt: 'The game starts with an empty level and nobody can tell why; the log is silent. Tap the faulty line(s).',
      lines: [
        'def load_level(name):',
        '    try:',
        '        return parse(read(name))',
        '    except:',
        '        pass',
      ],
      linesAreCode: true,
      errorLines: [4, 5],
      explanation: 'A bare `except:` followed by `pass` swallows every error, even typos and keyboard interrupts, and the function quietly returns `None`. Catch the specific exception you expect (for example `FileNotFoundError`), and log it with `log.exception(...)` or let it propagate.',
    },
    {
      kind: 'numeric',
      prompt: 'The root logger is configured with `level=logging.WARNING`. The program then calls `debug`, `info`, `warning`, `error` and `critical` once each. How many of those messages are shown?',
      answer: '3',
      hint: 'WARNING and everything more severe pass the filter.',
      explanation: 'WARNING, ERROR and CRITICAL pass (levels 30, 40, 50); DEBUG and INFO (10, 20) are below the threshold, so 3 messages are shown.',
      label: 'Messages shown:',
    },
    {
      kind: 'code',
      prompt: 'Write `summarize_log(lines)` for text log files with lines like `2026-01-05 12:00:02 WARNING game.save: no save file`. The **third whitespace-separated word** is the level. Return a dict counting how many lines have each of the levels in `LEVELS`; ignore lines whose third word is not a level (blank lines, traceback lines, …). Levels that never occur are not in the dict.',
      starter: `LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}

def summarize_log(lines):
    ...
`,
      solution: `LEVELS = {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}


def summarize_log(lines):
    counts = {}
    for line in lines:
        parts = line.split()
        if len(parts) >= 3 and parts[2] in LEVELS:
            counts[parts[2]] = counts.get(parts[2], 0) + 1
    return counts
`,
      tests: `lines = [
    "2026-01-05 12:00:01 INFO game.start: loaded 3 levels",
    "2026-01-05 12:00:02 WARNING game.save: no save file",
    "2026-01-05 12:00:03 ERROR game.net: connect failed",
    "Traceback (most recent call last):",
    '  File "net.py", line 9, in connect',
    "ConnectionError: refused",
    "",
    "2026-01-05 12:00:04 INFO game.start: ready",
    "2026-01-05 12:00:05 DEBUG game.ai: tick",
    "2026-01-05 12:00:06 INFO",
    "2026-01-05 12:00:07 INFO game: the word ERROR in a message",
    "note ERROR happened somewhere",
]
assert summarize_log(lines) == {"INFO": 4, "WARNING": 1, "ERROR": 1, "DEBUG": 1}
assert summarize_log([]) == {}
assert summarize_log(["", "   ", "x y"]) == {}
assert summarize_log(["a b CRITICAL boom"]) == {"CRITICAL": 1}
assert summarize_log(["a b info lowercase is not a level"]) == {}
assert isinstance(summarize_log(lines), dict)`,
      checks: ['Counts lines whose third whitespace-separated word is one of the \`LEVELS\`', 'Ignores blank lines, traceback lines and lines where a level word appears elsewhere', 'Returns a plain dict containing only the levels that occur'],
      hint: 'Use `parts = line.split()`; if `len(parts) >= 3` and `parts[2] in LEVELS`, add one to `counts[parts[2]]` (`counts.get(level, 0) + 1`).',
      explanation: 'Splitting on whitespace and checking one position keeps the parser simple and robust: junk lines are skipped and a level word inside a message does not count. Summaries like this are how you spot, say, a sudden burst of ERROR lines in a long log.',
    },
    {
      kind: 'code',
      prompt: 'Write `make_logger(name, stream, level=logging.INFO)` that returns the logger `name` set to `level`, with `propagate` turned off and a single `StreamHandler` writing to `stream` in the format `"%(levelname)s:%(message)s"`. Calling it again for the same name must **not** add a second handler (otherwise every line would be printed twice).',
      starter: `import logging

def make_logger(name, stream, level=logging.INFO):
    ...
`,
      solution: `import logging


def make_logger(name, stream, level=logging.INFO):
    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False
    if not logger.handlers:
        handler = logging.StreamHandler(stream)
        handler.setFormatter(logging.Formatter("%(levelname)s:%(message)s"))
        logger.addHandler(handler)
    return logger
`,
      tests: `import io
import logging
import time

base = "ex%d" % time.time_ns()
s = io.StringIO()
lg = make_logger(base + ".one", s, logging.INFO)
lg.debug("a")
lg.info("b")
lg.warning("c %d", 5)
assert s.getvalue() == "INFO:b\\nWARNING:c 5\\n"
assert lg.propagate is False
assert lg.name == base + ".one"

lg2 = make_logger(base + ".one", s, logging.INFO)
assert lg2 is lg
assert len(lg.handlers) == 1
lg2.error("d")
assert s.getvalue().count("ERROR:d") == 1

s2 = io.StringIO()
lg3 = make_logger(base + ".two", s2, logging.DEBUG)
lg3.debug("x")
assert s2.getvalue() == "DEBUG:x\\n"
assert lg3.level == logging.DEBUG`,
      checks: ['Returns \`logging.getLogger(name)\` with the requested level and \`propagate\` off', 'Adds one \`StreamHandler\` with the format \`LEVEL:message\`', 'Does not add a second handler when called again for the same name'],
      hint: 'Get the logger, `setLevel`, set `propagate = False`, and only create and add the handler `if not logger.handlers`. Give the handler a `logging.Formatter("%(levelname)s:%(message)s")`.',
      explanation: 'Loggers are global singletons per name, so setup code that runs twice (a module imported again, a function called twice) would otherwise stack up handlers and duplicate every message. Checking `logger.handlers` first makes the setup idempotent.',
    },
    {
      kind: 'code',
      prompt: 'Automate `git bisect`. Versions are numbered `0 .. n-1`, and once a version is bad every later one is bad too. Write `bisect_first_bad(n, is_bad)` that returns the number of the **first** bad version using binary search, or `None` if no version is bad (or `n` is 0). It must call `is_bad` at most `n.bit_length()` times.',
      starter: `def bisect_first_bad(n, is_bad):
    ...
`,
      solution: `def bisect_first_bad(n, is_bad):
    lo, hi = 0, n
    while lo < hi:
        mid = (lo + hi) // 2
        if is_bad(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo if lo < n else None
`,
      tests: `calls = []

def make(first):
    def bad(v):
        calls.append(v)
        return v >= first
    return bad

for n in (1, 2, 3, 10, 100, 1000):
    for first in sorted({0, n // 2, n - 1}):
        calls.clear()
        assert bisect_first_bad(n, make(first)) == first, (n, first)
        assert len(calls) <= n.bit_length(), (n, first, len(calls))

assert bisect_first_bad(10, lambda v: False) is None
assert bisect_first_bad(0, lambda v: True) is None
assert bisect_first_bad(1, lambda v: True) == 0
assert bisect_first_bad(5, lambda v: True) == 0`,
      checks: ['Returns the smallest bad version, or \`None\` when none is bad or \`n\` is 0', 'Uses binary search, calling \`is_bad\` at most \`n.bit_length()\` times', 'Works when the first bad version is the first, middle or last one'],
      hint: 'Keep `lo, hi = 0, n`. While `lo < hi`, test `mid`; if it is bad the answer is at `mid` or earlier (`hi = mid`), otherwise it is later (`lo = mid + 1`). At the end `lo == n` means nothing was bad.',
      explanation: 'Halving the search range each time finds the culprit among a thousand versions in ten checks — exactly what `git bisect` does with commits. The same idea localises a bug in a long pipeline: test the middle stage and discard the half that is still correct.',
    },
  ],
  takeaways: [
    'Read a traceback **from the bottom**: the exception type and message, then the failing line, then the callers. `err.__traceback__` and the `traceback` module expose the same information in code.',
    'Debug systematically: reproduce, isolate (bisect), hypothesize, verify, fix the cause and add a test. `breakpoint()` and `python -m pdb` give you `n`, `s`, `c`, `p`, `l`, `w` and `b` to explore a live program.',
    'Use the `logging` module instead of `print` for lasting diagnostics: loggers named with `__name__`, levels (DEBUG 10 … CRITICAL 50, default WARNING), handlers and formatters, lazy `%s` arguments and `log.exception` for tracebacks.',
    'Fail fast with specific exceptions, `assert` for internal assumptions and `warnings.warn` for deprecations. Never write a bare `except: pass`: it hides bugs.',
    'Control verbosity with configuration, not by editing code: levels per logger and per handler let you turn detail on in production only when you need it.',
  ],
  reading: [
    { title: 'Logging HOWTO', url: 'https://docs.python.org/3/howto/logging.html', source: 'docs', note: 'The official tutorial: basic usage, levels, handlers, formatters and configuration.' },
    { title: 'Logging Cookbook', url: 'https://docs.python.org/3/howto/logging-cookbook.html', source: 'docs', note: 'Recipes for multiple handlers, rotating files, logging from several processes and more.' },
    { title: 'pdb — The Python Debugger', url: 'https://docs.python.org/3/library/pdb.html', source: 'docs', note: 'All debugger commands, post-mortem debugging and `breakpoint()`.' },
    { title: 'traceback — Print or retrieve a stack traceback', url: 'https://docs.python.org/3/library/traceback.html', source: 'docs', note: 'Formatting and extracting tracebacks programmatically.' },
    { title: 'Python Debugging With Pdb', url: 'https://realpython.com/python-debugging-pdb/', source: 'article', note: 'A hands-on walkthrough of stepping through code with pdb.' },
  ],
};
