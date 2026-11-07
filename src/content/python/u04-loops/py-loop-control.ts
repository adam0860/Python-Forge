import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-loop-control',
  title: 'break, continue and the Loop else',
  summary: 'Take control inside loops: leave early with break, skip ahead with continue, write "loop until done" with while True, and use Python’s unusual loop else clause for searches.',
  minutes: 14,
  objectives: [
    'Exit a loop immediately with `break`',
    'Skip the rest of an iteration with `continue`',
    'Write `while True:` loops that end with `break`, e.g. command prompts and menus',
    'Use the loop `else` clause to run code only when a loop finished without `break`',
    'Trace loops that combine `break` and `continue`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'break: stop the loop now',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes you know the answer before the loop is over. `break` exits the innermost loop **immediately** — the rest of the block is skipped, no more iterations happen, and the program continues after the loop.',
        },
        {
          type: 'code',
          title: 'find_key.py',
          runnable: true,
          code: 'inventory = ["rope", "torch", "key", "map"]\nfor item in inventory:\n    print("Checking", item)\n    if item == "key":\n        print("Found the key!")\n        break\nprint("Search over")',
          output: 'Checking rope\nChecking torch\nChecking key\nFound the key!\nSearch over',
          annotations: [
            { lines: 6, text: 'As soon as the key is found, `break` jumps out of the loop. `"map"` is never checked.' },
            { lines: 7, text: 'Execution resumes here, right after the loop.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why stop early?',
          text: 'Efficiency and correctness. Searching 100,000 save files for one name shouldn’t keep reading after it’s found. And sometimes continuing would be *wrong* — like spending gold on a second potion after the first one already healed you.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In a loop nested inside another loop, what does `break` exit?',
      options: [
        { text: 'Only the innermost loop that contains it', correct: true, why: 'Right — the outer loop carries on with its next iteration.' },
        { text: 'Every loop, all the way out', why: 'Python has no multi-level break; it exits just one loop.' },
        { text: 'The whole program', why: 'That’s `sys.exit()` (or reaching the end of the script). `break` only leaves a loop.' },
        { text: 'The current `if` block', why: '`break` isn’t about `if` statements — it always exits the nearest enclosing loop.' },
      ],
      explanation: '`break` (and `continue`) apply to the **innermost** enclosing loop. To leave several levels at once, Python programmers usually move the loops into a function and `return` from it — you’ll learn that in the Functions unit.',
    },
    {
      kind: 'concept',
      title: 'continue: skip to the next iteration',
      blocks: [
        {
          type: 'p',
          text: '`continue` abandons the **current** iteration and jumps straight back to the top of the loop for the next one. It’s a way to say "this item doesn’t interest me".',
        },
        {
          type: 'code',
          title: 'skip.py',
          runnable: true,
          code: 'for n in range(1, 8):\n    if n % 3 == 0:\n        continue\n    print(n, end=" ")\nprint()',
          output: '1 2 4 5 7 ',
          annotations: [
            { lines: '2-3', text: 'Multiples of 3 hit `continue`, so `print` is skipped for 3 and 6.' },
            { lines: 4, text: 'Runs for every number that didn’t `continue`.' },
          ],
        },
        {
          type: 'compare',
          left: {
            title: 'Nested',
            tone: 'neutral',
            code: 'for line in lines:\n    if line.strip():\n        if not line.startswith("#"):\n            process(line)',
            lang: 'python',
          },
          right: {
            title: 'Flat, with continue',
            tone: 'good',
            code: 'for line in lines:\n    if not line.strip():\n        continue          # skip blank lines\n    if line.startswith("#"):\n        continue          # skip comments\n    process(line)',
            lang: 'python',
          },
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'Using `continue` to skip uninteresting cases at the top of a loop — a *guard clause* — keeps the main logic at one indentation level. That’s *flat is better than nested* in action.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'for x in [4, 7, 10, 13]:\n    if x % 2 == 0:\n        continue\n    if x > 10:\n        break\n    print(x)\nprint("end")',
      answer: '7\nend',
      hint: 'Even numbers are skipped. An odd number above 10 ends the loop.',
      explanation: '`4` is even → `continue`. `7` is odd and not above 10 → printed. `10` is even → `continue`. `13` is odd and above 10 → `break`. Then `end` is printed after the loop.',
    },
    {
      kind: 'concept',
      title: 'while True: loop until done',
      blocks: [
        {
          type: 'p',
          text: 'When the "should I stop?" decision happens in the *middle* of an iteration — after reading input, for example — the cleanest loop is `while True:` with a `break` where the decision is made:',
        },
        {
          type: 'code',
          title: 'prompt.py',
          runnable: true,
          stdin: 'hello\n\nquit',
          code: 'while True:\n    command = input("> ")\n    if command == "quit":\n        print("Bye!")\n        break\n    if command == "":\n        continue\n    print("You said:", command)',
          output: '> hello\nYou said: hello\n> \n> quit\nBye!',
          annotations: [
            { lines: 1, text: '`True` is always true, so the loop only ends through `break`.' },
            { lines: '3-5', text: 'The exit condition, checked right after reading input.' },
            { lines: '6-7', text: 'An empty line: skip it and ask again.' },
          ],
        },
        {
          type: 'p',
          text: 'This replaces the "ask once before the loop, then again inside it" pattern from the `while` lesson with a single `input()` call. It’s also how Python writes a loop that must run **at least once** — Python has no `do … while`.',
        },
        {
          type: 'callout',
          variant: 'warning',
          text: 'Every `while True:` must have a reachable `break` (or `return`). Double-check the exit path: if the user can never type exactly `"quit"` — say, because you compare with `"Quit"` — the loop never ends.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`continue` ends the loop entirely, just like `break`.',
      answer: false,
      explanation: 'False. `break` ends the loop; `continue` only ends the *current iteration* and moves on to the next one (re-checking the condition, for a `while` loop).',
    },
    {
      kind: 'concept',
      title: 'The loop else clause',
      blocks: [
        {
          type: 'p',
          text: 'Python has a feature most languages don’t: loops can have an `else` block. It runs **when the loop finishes normally** — that is, when it was *not* ended by `break`. That’s exactly what a search needs: "if I never found it…":',
        },
        {
          type: 'code',
          title: 'search.py',
          runnable: true,
          code: 'guests = ["Ada", "Grace", "Linus"]\nfor name in guests:\n    if name == "Guido":\n        print("Guido is here!")\n        break\nelse:\n    print("Guido didn\'t come.")\n\nn = 29\nfor d in range(2, n):\n    if n % d == 0:\n        print(n, "is divisible by", d)\n        break\nelse:\n    print(n, "is prime")',
          output: "Guido didn't come.\n29 is prime",
          annotations: [
            { lines: 6, text: 'The `else` lines up with `for`, not with the `if`. It runs because the loop went through every guest without a `break`.' },
            { lines: '10-15', text: 'A primality check: if no divisor triggers `break`, the `else` declares the number prime.' },
          ],
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'Think of it as `nobreak:` instead of `else:`. Even Python core developers admit the name is confusing — Raymond Hettinger has said that if he could go back, he’d call it `nobreak`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The loop `else` works with `while` loops too. Use it sparingly and only for searches, where it reads naturally. If teammates might find it confusing, a "found" flag variable is the explicit alternative.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'When does the `else` block of a `for` loop run?',
      options: [
        { text: 'When the loop body never runs at all', why: 'It runs then too (an empty loop finishes normally), but that’s not the full rule.' },
        { text: 'When the loop finishes without hitting `break`', correct: true, why: 'Exactly — including when the iterable is empty.' },
        { text: 'When the loop is ended by `break`', why: 'That’s precisely when it’s *skipped*.' },
        { text: 'On every iteration where the `if` inside the loop is false', why: 'A loop `else` belongs to the loop, not to any `if` inside it, and runs at most once.' },
      ],
      explanation: 'A loop’s `else` runs once, after the loop, if and only if the loop wasn’t ended by `break` (an empty iterable also counts as finishing normally). That makes it perfect for "searched everything and didn’t find it".',
    },
    {
      kind: 'numeric',
      prompt: 'What does this print?\n\n```\ntotal = 0\nfor n in range(1, 11):\n    if n % 2:\n        continue\n    total += n\nprint(total)\n```',
      answer: '30',
      hint: '`n % 2` is truthy (1) for odd numbers, so those are skipped.',
      explanation: 'For odd `n`, `n % 2` is `1` (truthy) and `continue` skips the addition. Only the even numbers 2, 4, 6, 8, 10 are added: $2 + 4 + 6 + 8 + 10 = 30$.',
      label: 'Output:',
    },
    {
      kind: 'code',
      prompt: 'The player guesses a secret number. Loop over `guesses` and count the attempts, stopping **as soon as** the secret is guessed. If no guess is right, print `Not found` instead. For the data given, the output is:\n\n```\nGuessed in 3 attempts\n```',
      starter: 'secret = 7\nguesses = [3, 9, 7, 5]\nattempts = 0\n\n# loop here: count attempts and stop when the secret is found\n',
      solution: 'secret = 7\nguesses = [3, 9, 7, 5]\nattempts = 0\n\nfor g in guesses:\n    attempts += 1\n    if g == secret:\n        print("Guessed in", attempts, "attempts")\n        break\nelse:\n    print("Not found")\n',
      tests: 'assert attempts == 3, f"attempts should be 3 (the loop must stop at the correct guess), got {attempts}"',
      expectOutput: 'Guessed in 3 attempts',
      checks: ['Stops the loop with `break` when the guess is right', 'Prints `Not found` only if the loop never breaks (hint: loop `else`)'],
      hint: 'Increase `attempts` first, then check the guess. `break` when it matches; a loop `else:` handles "never found".',
      explanation: 'Counting before checking means the attempt that wins is included: 3 and 9 are wrong, 7 is right on attempt 3, and `break` stops the loop so the final 5 is never counted. The loop `else` runs only if no `break` happened — exactly the "not found" case.',
    },
    {
      kind: 'error',
      prompt: 'This menu loop is supposed to end when the user types `q`, but it never does — even after `q`. Tap the buggy line.',
      lines: ['while True:', '    choice = input("Menu (p=play, q=quit): ")', '    if choice == "p":', '        print("Starting game")', '    if choice == "q":', '        continue', '    print("Unknown option")'],
      linesAreCode: true,
      errorLines: [6],
      explanation: 'Line 6 uses `continue`, which just jumps back to the top of the loop and asks again — the loop never ends. It should be `break`. (There’s a second, smaller issue: after `"p"`, the code still falls through to `print("Unknown option")`; an `elif`/`else` chain would fix that.)',
    },
  ],
  takeaways: [
    '`break` exits the innermost loop immediately; execution continues after the loop.',
    '`continue` skips the rest of the current iteration and moves to the next one.',
    '`while True:` with a `break` at the decision point is the idiom for prompts, menus and "at least once" loops.',
    'A loop’s `else` runs only if the loop finished without `break` — ideal for searches ("think of it as `nobreak`").',
    'Guard clauses with `continue` keep loop bodies flat and readable.',
  ],
  reading: [
    { title: 'The Python Tutorial: break and continue Statements, and else Clauses on Loops', url: 'https://docs.python.org/3/tutorial/controlflow.html#break-and-continue-statements', source: 'tutorial', note: 'The official explanation, including the prime-number example.' },
    { title: 'Language Reference: The break statement', url: 'https://docs.python.org/3/reference/simple_stmts.html#the-break-statement', source: 'docs', note: 'Precise rules for `break` (and `continue` right after it).' },
    { title: 'Transforming Code into Beautiful, Idiomatic Python (Raymond Hettinger)', url: 'https://www.youtube.com/watch?v=OSGv2VnC0go', source: 'video', note: 'Includes the famous "it should have been called nobreak" explanation of the loop `else`.' },
  ],
};
