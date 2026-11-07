import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-exceptions',
  title: 'Exceptions: try, except, else, finally',
  summary: 'How Python reports errors, how to catch them precisely with `try`/`except`/`else`/`finally`, the exception hierarchy, why "ask forgiveness, not permission" is idiomatic, and how to read a traceback.',
  minutes: 19,
  objectives: [
    'Explain what an exception is and how it travels up the call stack until something catches it',
    'Write `try`/`except`/`else`/`finally` blocks and predict the order in which their parts run',
    'Catch specific exceptions (single and multiple) and read the message from the `as` variable',
    'Use the exception hierarchy to order `except` clauses correctly and avoid bare `except:`',
    'Choose between the EAFP and LBYL styles and read a traceback from the bottom up',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Errors are values you can catch',
      blocks: [
        {
          type: 'p',
          text: 'When Python cannot do what you asked — convert `"x"` to a number, open a missing file, divide by zero — it does not return a special error code. It **raises** an [[exception]]: an object describing the problem. Execution stops at that line and the exception travels *up* through the calling functions looking for code prepared to handle it. If nothing handles it, the program ends and Python prints a [[traceback]].',
        },
        {
          type: 'p',
          text: 'You prepare to handle one with `try`. Put the risky code in the `try` block and the recovery code in an `except` block for the kind of exception you expect. Two optional parts complete the statement: `else` (runs only if **no** exception happened) and `finally` (runs **always**, for cleanup).',
        },
        {
          type: 'code',
          title: 'try_flow.py',
          runnable: true,
          code: `def parse_hp(text):
    try:
        hp = int(text)
    except ValueError:
        print("not a number:", repr(text))
        return None
    else:
        print("parsed", hp)
        return hp
    finally:
        print("done with", repr(text))

print(parse_hp("42"))
print(parse_hp("4x2"))`,
          output: `parsed 42
done with '42'
42
not a number: '4x2'
done with '4x2'
None`,
          annotations: [
            { lines: 3, text: 'The **try** block: code that might fail. `int("4x2")` raises `ValueError`; `int("42")` does not.' },
            { lines: 4, text: 'The **except** block runs only if the exception is a `ValueError` (or a subclass). Anything else is *not* caught and keeps travelling up.' },
            { lines: 7, text: 'The **else** block runs only when the `try` block finished with *no* exception. Keeping the success path here means the `try` covers only the line that can fail.' },
            { lines: 10, text: 'The **finally** block runs no matter what: success, caught error, even a `return` inside the block above. Notice that "done with" is printed *before* the caller prints the returned value.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why exceptions instead of error codes?',
          text: 'With return codes (`-1`, `NULL`) every caller has to remember to check, and one forgotten `if` lets a bad value flow silently through the program. An exception cannot be ignored by accident: unhandled, it stops the program at the exact place the problem happened and tells you what and where. Handling it is a deliberate choice made at whichever level of the program knows what to do.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'The idea is the same as C++ `try`/`catch`/`throw`, with different words: `except` instead of `catch`, `raise` instead of `throw`, and no destructors — cleanup is done with `finally` or, better, with `with` statements (context managers). Python also uses exceptions for ordinary flow: the end of a `for` loop is signalled internally by a `StopIteration` exception, so they are cheap and normal, not exceptional events.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'When does the `finally` block of a `try` statement run?',
      options: [
        { text: 'Only when an exception was raised', why: 'That describes `except`. `finally` does not depend on whether anything went wrong.' },
        { text: 'Only when no exception was raised', why: 'That describes `else`.' },
        { text: 'Always — whether the block succeeds, raises, or returns early', correct: true, why: 'Right: `finally` is for cleanup that must happen on every path out of the statement.' },
        { text: 'Only when the exception was not caught by any `except`', why: '`finally` runs for caught and uncaught exceptions alike (and for no exception at all).' },
      ],
      explanation: '`finally` runs on every exit path — normal completion, a caught exception, an uncaught exception (the exception continues after the block finishes) and an early `return`, `break` or `continue`. That is why it is the right place to release resources such as files and locks.',
    },
    {
      kind: 'concept',
      title: 'Catching the right exception',
      blocks: [
        {
          type: 'p',
          text: 'Always catch the **specific** exceptions you expect. `except ValueError:` handles bad text; unrelated bugs such as a typo in a variable name (`NameError`) still stop the program, as they should. To handle several kinds the same way, give a tuple: `except (TypeError, ValueError):`. Add `as e` to name the exception object, whose message you can print or log.',
        },
        {
          type: 'code',
          title: 'common_errors.py',
          runnable: true,
          code: `for value in ["10", None, "abc", ""]:
    try:
        print(int(value))
    except (TypeError, ValueError) as e:
        print(type(e).__name__, "->", e)
inventory = {"sword": 1}
try:
    inventory["shield"]
except KeyError as e:
    print("KeyError", e, repr(e), e.args)
try:
    [1, 2, 3][5]
except IndexError as e:
    print(e)
try:
    1 / 0
except ZeroDivisionError as e:
    print(e)`,
          output: `10
TypeError -> int() argument must be a string, a bytes-like object or a real number, not 'NoneType'
ValueError -> invalid literal for int() with base 10: 'abc'
ValueError -> invalid literal for int() with base 10: ''
KeyError 'shield' KeyError('shield') ('shield',)
list index out of range
division by zero`,
          annotations: [
            { lines: 1, text: 'Four different inputs: a good number, `None`, bad text and empty text. The loop continues after each handled error.' },
            { lines: 4, text: 'A **tuple** of exception types catches any of them. `int(None)` raises `TypeError` (wrong *type*), while `int("abc")` raises `ValueError` (right type, wrong *value*).' },
            { lines: 5, text: '`type(e).__name__` is the class name; printing `e` shows the message.' },
            { lines: 8, text: 'A missing dictionary key raises `KeyError`.' },
            { lines: 10, text: 'For `KeyError` the message is the *missing key itself* (with quotes). `repr(e)` shows the full exception and `e.args` is the tuple of arguments it was created with.' },
            { lines: 13, text: 'An index beyond the end of a list raises `IndexError`.' },
            { lines: 17, text: 'Dividing by zero raises `ZeroDivisionError`. Learn these names — they are the vocabulary of every traceback you will read.' },
          ],
        },
        {
          type: 'table',
          headers: ['Exception', 'Typically raised when'],
          rows: [
            ['`ValueError`', 'right type, unacceptable value: `int("abc")`'],
            ['`TypeError`', 'wrong type: `"a" + 1`, `len(5)`, wrong number of arguments'],
            ['`KeyError` / `IndexError`', 'missing dictionary key / index out of range'],
            ['`AttributeError`', 'object has no such attribute: `None.upper()`'],
            ['`NameError`', 'variable not defined (often a typo)'],
            ['`ZeroDivisionError`', 'division or modulo by zero'],
            ['`FileNotFoundError`', 'opening a file that does not exist'],
            ['`StopIteration`', 'an iterator has run out of items'],
          ],
          caption: 'The exceptions you will meet most often.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Python 3.14: parentheses are optional',
          text: 'Since Python 3.14 (PEP 758) you may write `except ValueError, TypeError:` without parentheses when you do not use `as`. Using the parenthesized tuple, `except (ValueError, TypeError):`, remains valid in every version and is the safer habit if your code must run on older Pythons.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `total = 0
for text in ["7", "x", "3", "", "10"]:
    try:
        total += int(text)
    except ValueError:
        total += 100
print(total)`,
      answer: '220',
      hint: 'Two of the five strings are not valid integers, and each of those adds 100 instead.',
      explanation: '`"7"`, `"3"` and `"10"` convert and add 20 in total; `"x"` and `""` both raise `ValueError`, so each adds 100. The total is $20 + 200 = 220$.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the statement: catch only the error `int()` raises for bad text, and always print a message at the end.',
      template: `try:
    level = int(text)
except ___ as err:
    print("bad level:", err)
___:
    print("finished reading level")`,
      templateIsCode: true,
      blanks: [{ answers: ['ValueError'] }, { answers: ['finally'] }],
      wordBank: ['ValueError', 'finally', 'else', 'TypeError', 'Exception'],
      explanation: '`int("abc")` raises `ValueError`, so that is the type to catch. A `finally:` clause runs on every path, so the final message prints whether or not the conversion worked. (`else` would run only on success, and catching `Exception` would be too broad.)',
    },
    {
      kind: 'concept',
      title: 'The exception hierarchy',
      blocks: [
        {
          type: 'p',
          text: 'Exceptions are classes arranged in an inheritance tree. `except X:` catches `X` **and everything derived from it**. At the top is `BaseException`; almost everything you want to handle sits below `Exception`. `KeyError` and `IndexError` share the parent `LookupError`, and `FileNotFoundError` is a kind of `OSError`. A few — `KeyboardInterrupt` (Ctrl+C) and `SystemExit` — deliberately sit *outside* `Exception` so that a broad handler cannot swallow them.',
        },
        {
          type: 'code',
          title: 'hierarchy.py',
          runnable: true,
          code: `print([c.__name__ for c in KeyError.__mro__])
print([c.__name__ for c in FileNotFoundError.__mro__])
print(issubclass(KeyError, LookupError), issubclass(KeyboardInterrupt, Exception))
try:
    open("missing.txt")
except FileNotFoundError as e:
    print(type(e).__name__, e.filename)
except OSError:
    print("some other OS problem")
def f():
    for i in range(3):
        try:
            return i
        finally:
            print("cleanup", i)
print(f())`,
          output: `['KeyError', 'LookupError', 'Exception', 'BaseException', 'object']
['FileNotFoundError', 'OSError', 'Exception', 'BaseException', 'object']
True False
FileNotFoundError missing.txt
cleanup 0
0`,
          annotations: [
            { lines: 1, text: '`__mro__` lists a class followed by its ancestors: `KeyError` is a `LookupError`, which is an `Exception`, which is a `BaseException`.' },
            { lines: 3, text: '`KeyboardInterrupt` is **not** an `Exception`, so `except Exception:` lets Ctrl+C through.' },
            { lines: 6, text: 'Handlers are checked **top to bottom** and the first match wins, so list specific exceptions *before* their parents. `FileNotFoundError` comes before `OSError` here.' },
            { lines: 7, text: 'Exception objects carry data. A file error knows the name of the file involved (`e.filename`).' },
            { lines: 8, text: 'This second handler would catch other `OSError` subclasses, such as `PermissionError`.' },
            { lines: 13, text: 'Even though `return i` leaves the function immediately, `finally` still runs first, printing `cleanup 0` before `0` comes back.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never write a bare `except:`',
          text: '`except:` with no type catches *everything*, including Ctrl+C and `SystemExit`, and it hides real bugs. If you really need a catch-all (for example at the top of a game loop that must log a crash before closing), write `except Exception as e:`, log `e`, and usually re-raise it. Also avoid `except Exception: pass` — a silent swallow turns every future bug into a mystery.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keep the try block small',
          text: 'Wrap only the lines that can raise the exception you are handling. A giant `try` that covers twenty lines may catch an unrelated `ValueError` from line 12 and respond as if line 3 had failed. Move the success path to `else`.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A bare `except:` is a good way to make a program "robust", because it catches only errors and lets everything else through.',
      answer: false,
      explanation: 'False. A bare `except:` catches `BaseException`, which includes `KeyboardInterrupt` and `SystemExit`, so the user cannot stop the program with Ctrl+C. It also swallows genuine bugs such as typos (`NameError`). Catch the specific exceptions you can actually handle.',
    },
    {
      kind: 'error',
      prompt: 'The code should print `missing hp` when the dictionary has no `"hp"` key, but the second handler never runs. Tap the line where the problem starts.',
      lines: [
        'try:',
        '    value = data["hp"]',
        'except Exception:',
        '    print("something went wrong")',
        'except KeyError:',
        '    print("missing hp")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Handlers are tried in order. `KeyError` is a subclass of `Exception`, so `except Exception:` on line 3 catches it first and the `KeyError` handler is unreachable. Put the specific handler first: `except KeyError:` and then, if needed, the broader one.',
    },
    {
      kind: 'concept',
      title: 'EAFP, LBYL and reading tracebacks',
      blocks: [
        {
          type: 'p',
          text: 'Two styles guard against failure. **LBYL** — "look before you leap" — checks first: `if text.isdigit(): int(text)`. **EAFP** — "easier to ask forgiveness than permission" — just tries it and handles the exception. Python code leans toward EAFP, because the check often disagrees with what the operation actually accepts, and between checking and acting the situation can change (a file can vanish).',
        },
        {
          type: 'code',
          title: 'eafp.py',
          runnable: true,
          code: `def lbyl(text):
    return int(text) if text.isdigit() else None

def eafp(text):
    try:
        return int(text)
    except ValueError:
        return None

for t in ["42", "-5", " 7 ", "x"]:
    print(repr(t), lbyl(t), eafp(t))`,
          output: `'42' 42 42
'-5' None -5
' 7 ' None 7
'x' None None`,
          annotations: [
            { lines: 2, text: '`isdigit()` is a *guess* about what `int` accepts. It rejects `"-5"` (a minus sign is not a digit) and `" 7 "` (spaces), although `int` happily converts both.' },
            { lines: 5, text: 'The EAFP version lets `int` decide. There is exactly one definition of "valid" — the one in the function that does the real work.' },
          ],
        },
        {
          type: 'p',
          text: 'When an exception is not caught, Python prints a **traceback**. Read it from the **bottom**: the last line is the exception type and message (what happened); the lines above, bottom to top, show the chain of calls that led there (where). The line nearest the bottom is where it was raised.',
        },
        {
          type: 'code',
          title: 'traceback.txt',
          lang: 'text',
          code: `Traceback (most recent call last):
  File "game.py", line 9, in <module>
    heal(player, "ten")
  File "game.py", line 5, in heal
    player["hp"] = min(player["hp"] + amount, 100)
TypeError: unsupported operand type(s) for +: 'int' and 'str'`,
          annotations: [
            { lines: '2-3', text: 'The top frame shows who called `heal` with the bad argument: the line `heal(player, "ten")` in the main program.' },
            { lines: '4-5', text: 'The failing line is inside `heal`, at `player["hp"] + amount`: `amount` is the string `"ten"`.' },
            { lines: 6, text: 'Start reading here: a `TypeError` — we tried to add an `int` and a `str`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'How the exception travels',
          text: 'Each function call sits in a *frame* on the call stack. When an exception is raised, Python looks for a matching `except` in the current frame; if there is none, it discards that frame (running any `finally` blocks on the way out) and looks in the caller, then the caller’s caller, and so on. The traceback is the record of the frames it passed through. If it reaches the top without a handler, the program exits. This is why you can handle an error far from where it happened — at the level that knows what to do about it.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'When LBYL is right',
          text: 'Checking first is fine when the check is cheap and exact (`if items:`, `if key in table:`) or when failing would be *costly* or irreversible. EAFP is best when the only way to know whether something works is to try it: parsing input, opening files, network calls.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n`count = 0`\n`for item in [5, 0, "a", 2]:`\n`    try: count += 10 // item`\n`    except ZeroDivisionError: count += 100`\n`    except TypeError: count += 1000`\n`print(count)`',
      answer: '1107',
      hint: 'Work through each item: `10 // 5`, then a division by zero, then `10 // "a"`, then `10 // 2`.',
      explanation: '`10 // 5 = 2`; `10 // 0` raises `ZeroDivisionError` (+100); `10 // "a"` raises `TypeError` (+1000); `10 // 2 = 5`. Total: $2 + 100 + 1000 + 5 = 1107$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'Write `safe_int(text, default=0)` that converts `text` to an `int` and returns `default` when the conversion is impossible — for bad text **and** for values such as `None`.',
      starter: `# define safe_int here
`,
      solution: `def safe_int(text, default=0):
    try:
        return int(text)
    except (TypeError, ValueError):
        return default
`,
      tests: `assert safe_int("42") == 42
assert safe_int(" 7 ") == 7
assert safe_int("x") == 0
assert safe_int("") == 0
assert safe_int(None, -1) == -1
assert safe_int("3.5", 9) == 9
assert safe_int(12.9) == 12`,
      checks: ['Valid numbers convert normally', 'Bad text returns the default', '`None` also returns the default instead of crashing'],
      hint: '`int("x")` raises `ValueError` and `int(None)` raises `TypeError`. Catch both in one `except (…)` clause.',
      explanation: 'EAFP in its simplest form: try the conversion and let `int` decide what is valid. The tuple catches both the wrong-value case (`ValueError`) and the wrong-type case (`TypeError`) while letting unrelated bugs propagate.',
    },
    {
      kind: 'code',
      prompt: 'Write `get_nested(data, path, default=None)` that follows `path` (a list of dictionary keys and list indexes) into nested data and returns the value found, or `default` if any step fails. For `data = {"player": {"items": ["sword", "bow"]}}`, the path `["player", "items", 1]` gives `"bow"`.',
      starter: `# define get_nested here
`,
      solution: `def get_nested(data, path, default=None):
    current = data
    try:
        for step in path:
            current = current[step]
    except (KeyError, IndexError, TypeError):
        return default
    return current
`,
      tests: `data = {"player": {"items": ["sword", "bow"], "hp": 10}}
assert get_nested(data, ["player", "hp"]) == 10
assert get_nested(data, ["player", "items", 1]) == "bow"
assert get_nested(data, ["player", "items", 5]) is None
assert get_nested(data, ["enemy", "hp"], "n/a") == "n/a"
assert get_nested(data, ["player", "hp", "x"], 0) == 0
assert get_nested(data, []) == data`,
      checks: ['Follows keys and indexes in order', 'A missing key, bad index or non-container returns `default`', 'An empty path returns the data itself'],
      hint: 'Loop over the path, doing `current = current[step]`. Wrap the loop in `try` and catch `KeyError`, `IndexError` and `TypeError` (indexing an `int` raises `TypeError`).',
      explanation: 'Each kind of failure maps to one exception: a missing key is `KeyError`, a list index out of range is `IndexError`, and subscripting something that is not a container (like an `int`) is `TypeError`. One `try` around the whole loop handles all of them; this is far shorter than checking `isinstance` and `in` at every step.',
    },
    {
      kind: 'code',
      prompt: 'Write `average_of_valid(items)` that takes a list of strings and returns a tuple `(average, skipped)`: the average of the entries that are valid integers (as a float) and the number of entries that were skipped. If there are no valid numbers the average is `None`. Example: `["10", "x", "20"]` gives `(15.0, 1)`.',
      starter: `# define average_of_valid here
`,
      solution: `def average_of_valid(items):
    numbers = []
    skipped = 0
    for item in items:
        try:
            value = int(item)
        except ValueError:
            skipped += 1
        else:
            numbers.append(value)
    if not numbers:
        return None, skipped
    return sum(numbers) / len(numbers), skipped
`,
      tests: `assert average_of_valid(["10", "x", "20"]) == (15.0, 1)
assert average_of_valid([]) == (None, 0)
assert average_of_valid(["a", "b"]) == (None, 2)
assert average_of_valid(["1", "2", "4"]) == (7 / 3, 0)
assert average_of_valid([" 5 ", "-5", "10"]) == (10 / 3, 0)`,
      checks: ['Invalid entries are counted, not crashed on', 'The average is `None` when nothing is valid (no division by zero)', 'Valid numbers are added only in the `else` branch'],
      hint: 'Loop with `try: value = int(item)`, `except ValueError: skipped += 1` and `else: numbers.append(value)`. Check for an empty list before dividing.',
      explanation: 'The `else` clause keeps the success path out of the `try`, so only `int(item)` is guarded. Checking `if not numbers` before dividing avoids a `ZeroDivisionError` — a case of LBYL being the right choice because the check is cheap and exact.',
    },
  ],
  takeaways: [
    'An exception is an object raised when an operation fails. It travels up the call stack until an `except` matches; if none does, the program ends with a traceback.',
    '`try` holds the risky code, `except` handles a specific type, `else` runs only on success and `finally` always runs (even on `return`) — use it for cleanup.',
    'Catch specific exceptions (single or a tuple), name them with `as e`, order handlers from specific to general, and never use a bare `except:` or a silent `except Exception: pass`.',
    '`except X` also catches subclasses: `KeyError`/`IndexError` ⊂ `LookupError` ⊂ `Exception`; `KeyboardInterrupt` and `SystemExit` sit outside `Exception` on purpose.',
    'Python prefers EAFP — try it and handle the exception — to LBYL checks that can disagree with the real operation. Read tracebacks from the bottom: what happened, then where.',
  ],
  reading: [
    { title: 'Errors and Exceptions (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/errors.html', source: 'tutorial', note: 'The official walk-through of try, except, else, finally, raising and cleanup.' },
    { title: 'Built-in Exceptions', url: 'https://docs.python.org/3/library/exceptions.html', source: 'docs', note: 'The full exception hierarchy with a description of every class.' },
    { title: 'PEP 758 — Allow except and except* expressions without parentheses', url: 'https://peps.python.org/pep-0758/', source: 'pep', note: 'The Python 3.14 change to the `except` syntax.' },
  ],
};
