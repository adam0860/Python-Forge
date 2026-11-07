import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-while',
  title: 'while Loops',
  summary: 'Repeat code as long as a condition holds: countdowns, input validation, simulations and game loops — plus how to trace a loop by hand and avoid (or escape) infinite loops.',
  minutes: 15,
  objectives: [
    'Write `while` loops whose condition is re-checked before every iteration',
    'Trace a loop by hand with a table of variable values',
    'Use loops to validate input and to run a simulation until something happens',
    'Use counters and accumulators inside loops',
    'Recognize and fix infinite loops, and stop a runaway program',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Repeat while a condition is true',
      blocks: [
        {
          type: 'p',
          text: 'An `if` runs a block *once* when its condition is true. A `while` loop runs its block **again and again, as long as** its condition stays true. Before each pass (each *iteration*), Python re-checks the condition; the moment it’s false, the loop ends and the program continues after the block.',
        },
        {
          type: 'code',
          title: 'countdown.py',
          runnable: true,
          code: 'countdown = 3\nwhile countdown > 0:\n    print(countdown, "...")\n    countdown -= 1\nprint("Liftoff!")',
          output: '3 ...\n2 ...\n1 ...\nLiftoff!',
          annotations: [
            { lines: 2, text: 'Same shape as an `if`: keyword, condition, colon, indented block.' },
            { lines: 4, text: 'The loop must *change something* that affects the condition. Here `countdown` shrinks until `countdown > 0` becomes false.' },
            { lines: 5, text: 'Runs once, after the loop has finished.' },
          ],
        },
        {
          type: 'p',
          text: 'The best way to understand a loop is to **trace** it: write down the variables at each check of the condition.',
        },
        {
          type: 'table',
          headers: ['Check #', '`countdown`', '`countdown > 0`?', 'What happens'],
          rows: [
            ['1', '3', 'True', 'prints `3 ...`, countdown → 2'],
            ['2', '2', 'True', 'prints `2 ...`, countdown → 1'],
            ['3', '1', 'True', 'prints `1 ...`, countdown → 0'],
            ['4', '0', 'False', 'loop ends; prints `Liftoff!`'],
          ],
          caption: 'Three iterations, but four checks: the condition is tested one extra time, when it finally fails.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does the check come first?',
          text: 'Checking *before* each iteration means a `while` loop can run **zero times**: if `countdown` started at 0, nothing would print except "Liftoff!". That’s usually what you want — "keep drinking potions while health is low" should do nothing if health is already fine. (Python has no `do … while`; you’ll see the `while True` + `break` idiom for "at least once" loops in two lessons.)',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'How many times does `"tick"` get printed?\n\n```\nt = 0\nwhile t < 10:\n    print("tick")\n    t += 3\n```',
      options: [
        { text: '3', why: 't takes the values 0, 3, 6, 9 — that’s four values below 10.' },
        { text: '4', correct: true, why: 'Right: t = 0, 3, 6 and 9 all pass `t < 10`; at t = 12 the loop stops.' },
        { text: '10', why: 'The step is 3, not 1.' },
        { text: 'Forever', why: '`t` increases every time, so it eventually reaches 12 and the condition fails.' },
      ],
      explanation: 'Trace it: the condition is checked with t = 0, 3, 6, 9 (all true → four prints) and then t = 12 (false → stop). Counting iterations by tracing is a skill you’ll use for the rest of your career.',
    },
    {
      kind: 'concept',
      title: 'Looping until the input is valid',
      blocks: [
        {
          type: 'p',
          text: 'You often don’t know in advance how many times a loop should run. A classic case: keep asking the user until they type something valid.',
        },
        {
          type: 'code',
          title: 'players.py',
          runnable: true,
          stdin: 'five\n9\n3',
          code: 'answer = input("How many players (1-4)? ")\nwhile not (answer.isdigit() and 1 <= int(answer) <= 4):\n    print("Please enter a number from 1 to 4.")\n    answer = input("How many players (1-4)? ")\n\nplayers = int(answer)\nprint("Starting a", players, "player game.")',
          output: 'How many players (1-4)? five\nPlease enter a number from 1 to 4.\nHow many players (1-4)? 9\nPlease enter a number from 1 to 4.\nHow many players (1-4)? 3\nStarting a 3 player game.',
          annotations: [
            { lines: 1, text: 'Ask once before the loop, so there’s something to check.' },
            { lines: 2, text: 'Keep looping while the answer is *not* valid. Short-circuiting matters: `int(answer)` only runs if `isdigit()` was true, so `"five"` never reaches `int()`.' },
            { lines: 4, text: 'Ask again *inside* the loop — this is what eventually makes the condition false.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'The Input box under this example holds three answers. Edit them (for example, make the first one valid) and run again to see the loop run zero, one or more times.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'n = 10\nwhile n > 0:\n    n -= 3\nprint(n)',
      answer: '-2',
      hint: 'Trace n: 10 → 7 → 4 → 1 → … The condition is only checked at the top of each iteration.',
      explanation: 'n goes 10 → 7 → 4 → 1 → −2. After it becomes 1, the condition `1 > 0` is still true, so the loop runs once more and n becomes −2. Now `-2 > 0` is false, the loop ends, and `-2` is printed. Loops don’t stop the instant a value "crosses" a line — only at the next check.',
    },
    {
      kind: 'concept',
      title: 'Counters, accumulators and simulations',
      blocks: [
        {
          type: 'p',
          text: 'Two variable patterns appear in almost every loop: a **counter** that tracks *how many* iterations have happened, and an **accumulator** that builds up a *total*. Here’s a boss fight simulated until the boss falls:',
        },
        {
          type: 'code',
          title: 'boss_fight.py',
          runnable: true,
          code: 'boss_hp = 100\nattacks = [18, 25, 30, 12, 22]   # damage pattern that repeats\nturn = 0                         # counter\n\nwhile boss_hp > 0:\n    damage = attacks[turn % len(attacks)]\n    boss_hp -= damage\n    turn += 1\n    print(f"Turn {turn}: hit for {damage}, boss HP {max(boss_hp, 0)}")\n\nprint("Boss defeated in", turn, "turns")',
          output: 'Turn 1: hit for 18, boss HP 82\nTurn 2: hit for 25, boss HP 57\nTurn 3: hit for 30, boss HP 27\nTurn 4: hit for 12, boss HP 15\nTurn 5: hit for 22, boss HP 0\nBoss defeated in 5 turns',
          annotations: [
            { lines: 2, text: 'A list of damage values. `attacks[i]` picks the value at index `i`, just like indexing a string.' },
            { lines: 6, text: '`turn % len(attacks)` cycles 0, 1, 2, 3, 4, 0, 1, … — the modulo trick from the Numbers lesson — so the pattern repeats if the fight lasts longer.' },
            { lines: 9, text: '`max(boss_hp, 0)` keeps the display from showing negative HP.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Every game is a while loop',
          text: 'At its core, a game engine is `while running: process_input(); update(dt); render()`. Unreal, Unity and your own SFML games all run a loop like this dozens of times per second until the player quits. In the AI course, reinforcement-learning training is a loop too: `while not done: action = agent(obs); obs, reward, done = env.step(action)`.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many iterations does this loop run — that is, what is the final value of `count`?\n\n```\nx = 3\ncount = 0\nwhile x <= 100:\n    x *= 2\n    count += 1\n```',
      answer: '6',
      hint: 'List the values of x at each check: 3, 6, 12, …',
      explanation: 'x is checked at 3, 6, 12, 24, 48 and 96 (all ≤ 100 → six iterations), then becomes 192, which fails the check. So `count` is `6` and `x` ends at `192`.',
      label: '`count` =',
    },
    {
      kind: 'concept',
      title: 'Infinite loops',
      blocks: [
        {
          type: 'p',
          text: 'If nothing inside the loop ever makes the condition false, the loop runs **forever**. The classic cause is forgetting to update the variable the condition depends on:',
        },
        {
          type: 'compare',
          left: {
            title: 'Never ends',
            tone: 'bad',
            code: 'wave = 1\nwhile wave <= 3:\n    print("Spawning wave", wave)\n# wave never changes!',
            lang: 'python',
          },
          right: {
            title: 'Ends after 3 waves',
            tone: 'good',
            code: 'wave = 1\nwhile wave <= 3:\n    print("Spawning wave", wave)\n    wave += 1',
            lang: 'python',
          },
        },
        {
          type: 'p',
          text: 'To stop a runaway program in a terminal, press **Ctrl+C**: Python raises `KeyboardInterrupt` and quits. In this app, press **Stop** — and any program that runs longer than 10 seconds is stopped automatically.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Off-by-one errors',
          text: 'The other classic loop bug is running one time too many or too few: `<` vs `<=`, starting at 0 vs 1. Tracing the first and last iteration by hand catches most of these.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          text: 'When you know *how many* times to loop, or you’re going through the items of a collection, Python programmers reach for a `for` loop instead (next lesson) — it can’t forget to increment. Keep `while` for "repeat until something happens".',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'A `while` loop always runs its block at least once.',
      answer: false,
      explanation: 'False. The condition is checked *before* every iteration, including the first. If it’s false from the start — say `while hp < 50:` when `hp` is already 80 — the block never runs.',
    },
    {
      kind: 'error',
      prompt: 'This program never finishes. Tap the line that causes the infinite loop.',
      lines: ['steps = 0', 'position = 0', 'while position < 10:', '    position + 2', '    steps += 1', 'print("Reached the goal in", steps, "steps")'],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'Line 4 *computes* `position + 2` and throws the result away — it never changes `position`, so `position < 10` stays true forever. It should be `position += 2` (or `position = position + 2`). Then the loop runs 5 times.',
    },
    {
      kind: 'code',
      prompt: 'A slime colony starts with `50` slimes and **doubles** every year. Use a `while` loop to count how many years it takes until there are **more than 1000** slimes. Print:\n\n```\nYears: 5\n```',
      starter: 'slimes = 50\nyears = 0\n\n# loop here\n\nprint("Years:", years)\n',
      solution: 'slimes = 50\nyears = 0\n\nwhile slimes <= 1000:\n    slimes *= 2\n    years += 1\n\nprint("Years:", years)\n',
      tests: 'assert years == 5, f"years should be 5, got {years}"\nassert slimes == 1600, f"After 5 doublings there should be 1600 slimes, got {slimes}"',
      expectOutput: 'Years: 5',
      checks: ['Uses a `while` loop that doubles `slimes` and counts `years`', 'Stops as soon as there are more than 1000'],
      hint: 'Loop *while* the colony is still 1000 or fewer: `while slimes <= 1000:`. Inside, double the slimes and add 1 to the years.',
      explanation: 'The colony goes 50 → 100 → 200 → 400 → 800 → 1600. After four doublings it’s 800 (still ≤ 1000), so the loop runs a fifth time, reaching 1600, and stops. `years` counts the five iterations. Using `<= 1000` (not `< 1000`) is what "more than 1000" requires.',
    },
    {
      kind: 'order',
      prompt: 'Arrange the lines to sum the numbers 1 to 5 with a `while` loop and print `15`.',
      lines: ['total = 0', 'n = 1', 'while n <= 5:', '    total += n', '    n += 1', 'print(total)'],
      linesAreCode: true,
      explanation: 'Initialize the accumulator (`total`) and the counter (`n`) before the loop; inside, add `n` to the total and then advance `n`; print after the loop (unindented). $1 + 2 + 3 + 4 + 5 = 15$.',
    },
  ],
  takeaways: [
    '`while condition:` repeats its block as long as the condition is true, checking it before every iteration — so it may run zero times.',
    'Trace loops with a table of variable values at each check; the condition is checked one extra time when it finally fails.',
    'Something inside the loop must eventually make the condition false, or you get an infinite loop. Stop one with Ctrl+C (or Stop in the app).',
    'Counters count iterations; accumulators build totals. Both are initialized before the loop.',
    'Use `while` for "repeat until something happens" (input validation, simulations, game loops); prefer `for` when looping a known number of times.',
  ],
  reading: [
    { title: 'Language Reference: The while statement', url: 'https://docs.python.org/3/reference/compound_stmts.html#the-while-statement', source: 'docs', note: 'The precise semantics, including the `else` clause you’ll meet soon.' },
    { title: 'Python "while" Loops (Real Python)', url: 'https://realpython.com/python-while-loop/', source: 'tutorial', note: 'More patterns and pitfalls with `while`.' },
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'Robert Nystrom’s free chapter on the loop at the heart of every game engine.' },
  ],
};
