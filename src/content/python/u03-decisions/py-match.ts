import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-match',
  title: 'Pattern Matching with match',
  summary: 'Python 3.10’s match statement: more than a switch. Match literals, alternatives, guards, the shape of a sequence and the keys of a dictionary — and avoid the capture-pattern trap.',
  minutes: 16,
  objectives: [
    'Write `match`/`case` statements with literal patterns, `|` alternatives and the `_` wildcard',
    'Capture parts of a value into names and add `if` guards to cases',
    'Destructure sequences such as `command.split()` with patterns like `["go", direction]` and `*rest`',
    'Match dictionaries by their keys (mapping patterns), e.g. game events',
    'Explain why a bare name in a `case` captures instead of comparing, and how to avoid the bug',
    'Decide when `match` is clearer than `if`/`elif`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'match: choosing by the shape of a value',
      blocks: [
        {
          type: 'p',
          text: 'Python 3.10 added **structural pattern matching** ([PEP 634](https://peps.python.org/pep-0634/)). At its simplest, `match` compares one value against a list of `case` patterns, top to bottom, and runs the block of the first one that matches:',
        },
        {
          type: 'code',
          title: 'controller.py',
          runnable: true,
          code: 'button = "Y"\n\nmatch button:\n    case "A":\n        print("Jump")\n    case "B":\n        print("Attack")\n    case "X" | "Y":\n        print("Use item")\n    case _:\n        print("Unknown button")',
          output: 'Use item',
          annotations: [
            { lines: 3, text: '`match` takes the **subject** — the value being examined — followed by a colon.' },
            { lines: 4, text: 'A **literal pattern**: matches if `button == "A"`.' },
            { lines: 8, text: '`|` means "or": this case matches `"X"` or `"Y"`.' },
            { lines: 10, text: '`_` is the **wildcard**: it matches anything. Like `else`, it goes last.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Not a C++ switch',
          text: 'There’s no fall-through and no `break`: exactly one case runs, then Python continues after the `match`. And patterns can do far more than compare constants — they can take values *apart*, as you’ll see next. Under the hood, a simple literal `match` behaves much like an `if`/`elif` chain; it isn’t compiled into a jump table.',
        },
        {
          type: 'callout',
          variant: 'note',
          text: '`match` and `case` are *soft keywords*: they only act as keywords at the start of a `match` statement, so existing code that used `match` as a variable name (very common with regular expressions) kept working.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In a `match` statement, what does `case _:` do?',
      options: [
        { text: 'It matches only the underscore character `"_"`', why: '`_` isn’t a literal here — it’s the special wildcard pattern.' },
        { text: 'It matches any value, so it acts like `else` and should come last', correct: true, why: 'Right — it’s the catch-all case.' },
        { text: 'It ends the `match` statement, like `break`', why: 'There’s no `break` in `match`; each case’s block simply ends.' },
        { text: 'It matches `None` only', why: 'To match `None`, write `case None:`.' },
      ],
      explanation: '`_` is the wildcard pattern: it always matches and doesn’t bind any name. Put it last to handle every value not caught by an earlier case. (Any case after it would be unreachable, and Python reports that as a `SyntaxError`.)',
    },
    {
      kind: 'concept',
      title: 'Capturing values and adding guards',
      blocks: [
        {
          type: 'p',
          text: 'A bare **name** in a pattern is a **capture pattern**: it matches anything and binds the matched value to that name. Add `if condition` after a pattern — a **guard** — to accept the match only when the condition is true:',
        },
        {
          type: 'code',
          title: 'grade.py',
          runnable: true,
          code: 'score = 77\n\nmatch score:\n    case 100:\n        print("Perfect!")\n    case s if s >= 90:\n        print("Great:", s)\n    case s if s >= 60:\n        print("Pass:", s)\n    case _:\n        print("Try again")',
          output: 'Pass: 77',
          annotations: [
            { lines: 6, text: '`s` captures the score; the guard `if s >= 90` must also be true. 77 fails the guard, so Python moves on.' },
            { lines: 8, text: 'Captures 77 again; this time the guard passes.' },
          ],
        },
        {
          type: 'p',
          text: 'For plain numeric ranges like this, an `if`/`elif` chain is equally clear. Pattern matching really shines when values have **structure** — which is next.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Sequence patterns: matching the shape of a list',
      blocks: [
        {
          type: 'p',
          text: 'A pattern in square brackets matches a sequence (like the list `split()` returns) **of the right length**, comparing literals and capturing names element by element. `*name` captures "all the rest". This makes command parsers — text adventures, chat bots, console commands in a game — wonderfully readable:',
        },
        {
          type: 'code',
          title: 'adventure.py',
          runnable: true,
          code: 'for command in ["go north", "take rusty sword", "drop map compass", "look", "dance wildly"]:\n    match command.split():\n        case ["go", direction]:\n            print(f"You walk {direction}.")\n        case ["take", *words]:\n            print(f"You pick up the {\' \'.join(words)}.")\n        case ["drop", *items] if len(items) > 1:\n            print(f"You drop {len(items)} items.")\n        case ["look"]:\n            print("You see a dark corridor.")\n        case _:\n            print(f"I don\'t understand {command!r}.")',
          output: "You walk north.\nYou pick up the rusty sword.\nYou drop 2 items.\nYou see a dark corridor.\nI don't understand 'dance wildly'.",
          annotations: [
            { lines: 1, text: 'A `for` loop tries five commands in turn (loops are the next unit).' },
            { lines: 2, text: '`"go north".split()` is the list `["go", "north"]` — that’s what gets matched.' },
            { lines: 3, text: 'Matches a two-word list whose first word is `"go"`, and captures the second word as `direction`.' },
            { lines: 5, text: '`*words` captures any number of remaining words into a list, so `take rusty sword` works.' },
            { lines: 7, text: 'Patterns and guards combine: drop at least two items.' },
            { lines: 9, text: 'Exactly one word, `"look"`. A one-element pattern doesn’t match longer lists.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is this better than if/elif?',
          text: 'Compare: `if len(words) == 2 and words[0] == "go": direction = words[1]`. The pattern `["go", direction]` checks the length, checks the first word *and* extracts the second in one declarative line that looks like the data it matches. The bigger the input language, the bigger the win.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'for cmd in ["attack goblin", "cast fire bolt", "run"]:\n    match cmd.split():\n        case ["attack", target]:\n            print("Hit", target)\n        case ["cast", *spell]:\n            print("Cast", "-".join(spell))\n        case [verb]:\n            print("Just", verb)',
      answer: 'Hit goblin\nCast fire-bolt\nJust run',
      hint: '`split()` turns each command into a list of words. `*spell` collects the rest into a list, and `"-".join` glues it with hyphens.',
      explanation: '`["attack", "goblin"]` matches the first case, so `Hit goblin`. `["cast", "fire", "bolt"]` matches the second; `spell` is `["fire", "bolt"]`, joined as `fire-bolt`. `["run"]` is a one-element list, which matches `[verb]` with `verb = "run"`.',
    },
    {
      kind: 'concept',
      title: 'Mapping patterns: matching dictionaries',
      blocks: [
        {
          type: 'p',
          text: 'Games, web APIs and network protocols constantly pass around **events** shaped like JSON — dictionaries with a `"type"` key and some data. A pattern in curly braces matches a dictionary that **has** the listed keys (extra keys are fine) and captures their values:',
        },
        {
          type: 'code',
          title: 'events.py',
          runnable: true,
          code: 'events = [\n    {"type": "damage", "amount": 25},\n    {"type": "heal", "amount": 10},\n    {"type": "levelup"},\n    {"type": "chat", "text": "gg"},\n]\n\nhp = 100\nfor event in events:\n    match event:\n        case {"type": "damage", "amount": amount}:\n            hp -= amount\n        case {"type": "heal", "amount": amount}:\n            hp += amount\n        case {"type": "levelup"}:\n            print("Level up!")\n        case {"type": other}:\n            print("Ignoring", other)\n\nprint("HP:", hp)',
          output: 'Level up!\nIgnoring chat\nHP: 85',
          annotations: [
            { lines: '1-6', text: 'A list of dictionaries — key/value records. You’ll study both in the Collections unit; for now, read `{"type": "damage", "amount": 25}` as "an event of type damage with amount 25".' },
            { lines: 11, text: 'Matches only if `type` is `"damage"` **and** an `amount` key exists; its value is captured into `amount`.' },
            { lines: 17, text: 'Any other event with a `type`: capture the type name to report it.' },
            { lines: 20, text: '$100 - 25 + 10 = 85$.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'This is how you’d write a message handler for a multiplayer server, or process the observation dictionaries that game environments return in the AI course. Patterns can also match **objects** by class and attribute — `case Point(x=0, y=0):` — which you’ll use after the OOP unit.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Like a C++ `switch` without `break`, a `match` statement runs the matching case and then "falls through" into the cases below it.',
      answer: false,
      explanation: 'False. Python’s `match` never falls through: the first matching case runs, and then execution continues after the whole `match` statement. To share one block between several values, use an or-pattern: `case "X" | "Y":`.',
    },
    {
      kind: 'concept',
      title: 'The capture trap',
      blocks: [
        {
          type: 'p',
          text: 'The single most surprising rule of pattern matching: **a bare name in a `case` never compares — it captures**. So you can’t compare against a constant stored in a plain variable:',
        },
        {
          type: 'code',
          title: 'trap.py',
          runnable: true,
          code: 'MAX_HP = 100\nhp = 40\n\nmatch hp:\n    case MAX_HP:          # captures! (does not compare)\n        print("Full health")\n\nprint("MAX_HP is now", MAX_HP)',
          output: 'Full health\nMAX_HP is now 40',
          annotations: [
            { lines: 5, text: '`MAX_HP` here is a capture pattern: it matches *anything* and re-binds the name `MAX_HP` to the subject, 40.' },
            { lines: 8, text: 'Your constant has been overwritten. If another case followed this one, Python would refuse to compile: `SyntaxError: name capture \'MAX_HP\' makes remaining patterns unreachable`.' },
          ],
        },
        {
          type: 'list',
          items: [
            'Compare with a **literal**: `case 100:`',
            'Or use a **dotted name**, which *is* treated as a value: `case Limits.MAX_HP:` or `case Color.RED:` (enums, coming in the OOP unit).',
            'Or capture and guard: `case n if n == MAX_HP:`',
          ],
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'match or if/elif?',
          text: 'Use `match` when you’re asking "what *shape* is this data?" — command words, events, tokens, tuples like `(x, y)`, nested JSON. Use `if`/`elif` for ranges and arbitrary conditions (`hp < 25`, `is_raining and not has_umbrella`). Both are Pythonic; pick the one that reads like the problem.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code should print `Normal day`, because `today` is `"monday"` — but it prints `Weekend!`. Tap the line with the bug.',
      lines: ['SATURDAY = "saturday"', 'today = "monday"', 'match today:', '    case SATURDAY:', '        print("Weekend!")'],
      linesAreCode: true,
      errorLines: [4],
      explanation: '`case SATURDAY:` is a capture pattern, not a comparison: it matches *any* value and re-binds `SATURDAY` to `"monday"`. Compare with a literal — `case "saturday":` — or a dotted name such as an enum member. (With a `case _: print("Normal day")` after it, Python would even refuse to run the code, because the capture makes later cases unreachable.)',
    },
    {
      kind: 'code',
      prompt: 'Move the player with a `match` statement on `command.split()`:\n\n- `go north` → `y += 1`, `go south` → `y -= 1`\n- `go east` → `x += 1`, `go west` → `x -= 1`\n- anything else → print `Unknown command`\n\nFor the input `go north`, the output is:\n\n```\nCommand: go north\nPosition: 0 1\n```',
      starter: 'x, y = 0, 0\ncommand = input("Command: ")\n\n# match command.split(): ...\n\nprint("Position:", x, y)\n',
      solution: 'x, y = 0, 0\ncommand = input("Command: ")\n\nmatch command.split():\n    case ["go", "north"]:\n        y += 1\n    case ["go", "south"]:\n        y -= 1\n    case ["go", "east"]:\n        x += 1\n    case ["go", "west"]:\n        x -= 1\n    case _:\n        print("Unknown command")\n\nprint("Position:", x, y)\n',
      stdin: 'go north',
      tests: 'assert (x, y) == (0, 1), f"After go north the position should be (0, 1), got ({x}, {y})"',
      expectOutput: 'Command: go north\nPosition: 0 1',
      checks: ['Uses `match` with sequence patterns like `["go", "north"]`', 'Handles unknown commands with `case _`'],
      hint: 'Each case can be a list pattern of two literal words: `case ["go", "north"]:`. Don’t forget `case _:` at the end.',
      explanation: 'Splitting `"go north"` gives `["go", "north"]`, which matches `case ["go", "north"]:`, so `y` becomes 1. A neat alternative uses a capture plus an or-pattern: `case ["go", ("north" | "south") as d]:` — but four explicit cases are perfectly clear.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the pattern match for a two-element `(x, y)` position.',
      template: 'match position:\n    case (0, 0):\n        print("Origin")\n    case (0, y):\n        print("On the y-axis at", y)\n    case (x, 0):\n        print("On the x-axis at", x)\n    case (x, y) ___ x == y:\n        print("On the diagonal")\n    case ___:\n        print("Somewhere else")',
      templateIsCode: true,
      blanks: [{ answers: ['if'] }, { answers: ['_'] }],
      wordBank: ['if', '_', 'else', 'and', 'when'],
      explanation: 'A **guard** is written with `if` after the pattern: `case (x, y) if x == y:`. The catch-all is the wildcard `case _:`. Note how `(0, y)` mixes a literal (`0` must match exactly) with a capture (`y` takes whatever is there).',
    },
  ],
  takeaways: [
    '`match subject:` tries each `case` pattern top to bottom and runs only the first that matches — no fall-through, no `break`.',
    'Literal patterns compare values; `|` combines alternatives; `_` matches anything and goes last.',
    'A bare name captures the matched value; add `if` guards for extra conditions.',
    'Sequence patterns like `["go", direction]` and `["take", *words]` match length and contents and extract parts — perfect for command parsers.',
    'Mapping patterns like `{"type": "damage", "amount": amount}` match dictionaries by their keys — perfect for events and JSON.',
    'The trap: `case SOME_CONSTANT:` captures instead of comparing. Use literals, dotted names (enums) or guards. Requires Python 3.10+.',
  ],
  reading: [
    { title: 'PEP 636 – Structural Pattern Matching: Tutorial', url: 'https://peps.python.org/pep-0636/', source: 'pep', note: 'The official tutorial, built around a text-adventure command parser.' },
    { title: 'The Python Tutorial: match Statements', url: 'https://docs.python.org/3/tutorial/controlflow.html#match-statements', source: 'tutorial', note: 'A short overview of every kind of pattern.' },
    { title: 'Language Reference: The match statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-match-statement', source: 'docs', note: 'The full specification of patterns, guards and bindings.' },
    { title: 'PEP 635 – Structural Pattern Matching: Motivation and Rationale', url: 'https://peps.python.org/pep-0635/', source: 'pep', note: 'Why pattern matching was added and the design choices behind it.' },
  ],
};
