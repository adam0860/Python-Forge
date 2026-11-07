import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-loop-patterns',
  title: 'Nested Loops and Common Loop Patterns',
  summary: 'Loops inside loops for grids, tables and tile maps; the patterns every programmer reuses — filter, search, build, count, any/all, pairs — and a first look at how loop cost grows.',
  minutes: 17,
  objectives: [
    'Write nested loops for tables, 2D grids and tile maps, and trace how many times the inner body runs',
    'Apply the filter, build-a-string, any/all and all-pairs patterns',
    'Use `enumerate` in nested loops to get (x, y) coordinates',
    'Estimate how the number of iterations grows (n vs n²) and why it matters',
    'Recognize when a built-in or `str.join` replaces a hand-written loop',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Loops inside loops',
      blocks: [
        {
          type: 'p',
          text: 'A loop’s block can contain another loop. For **every** iteration of the outer loop, the inner loop runs **all the way through**. That’s exactly what you need for anything two-dimensional: tables, grids, images, tile maps, game boards.',
        },
        {
          type: 'code',
          title: 'times_table.py',
          runnable: true,
          code: 'for row in range(1, 4):\n    for col in range(1, 5):\n        print(f"{row * col:3}", end="")\n    print()',
          output: '  1  2  3  4\n  2  4  6  8\n  3  6  9 12',
          annotations: [
            { lines: 1, text: 'The outer loop picks a row: 1, 2, 3.' },
            { lines: '2-3', text: 'For each row, the inner loop runs through all four columns, printing each product right-aligned in 3 characters, all on one line.' },
            { lines: 4, text: 'After the inner loop finishes — note the indentation — `print()` ends the row.' },
          ],
        },
        {
          type: 'p',
          text: 'The inner body runs $3 \\times 4 = 12$ times in total. In general, nested loops over $n$ and $m$ items run the inner body $n \\times m$ times.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Reading nested loops',
          text: 'Indentation tells the story: lines indented under the inner `for` run every inner iteration; lines indented only under the outer `for` run once per outer iteration. In VS Code, the vertical indent guides make each level easy to follow.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many times does `count += 1` run? (That is, what is printed?)\n\n```\ncount = 0\nfor i in range(4):\n    for j in range(i):\n        count += 1\nprint(count)\n```',
      answer: '6',
      hint: 'The inner range depends on `i`: when i = 0 it’s empty, when i = 1 it has one value, and so on.',
      explanation: 'The inner loop runs `range(i)`, so it does 0, 1, 2 and 3 iterations for i = 0, 1, 2, 3. Total: $0 + 1 + 2 + 3 = 6$. Inner loops whose length depends on the outer variable produce triangular counts like this.',
      label: 'Output:',
    },
    {
      kind: 'concept',
      title: 'Walking a tile map',
      blocks: [
        {
          type: 'p',
          text: 'Many 2D games store levels as rows of characters. With `enumerate` in both loops you get each tile’s **(x, y)** coordinates — x is the column, y is the row:',
        },
        {
          type: 'code',
          title: 'tilemap.py',
          runnable: true,
          code: 'level = [\n    "#########",\n    "#P..#...#",\n    "#.#.#.#E#",\n    "#...$...#",\n    "#########",\n]\n\nwalls = 0\nfor y, row in enumerate(level):\n    for x, tile in enumerate(row):\n        if tile == "#":\n            walls += 1\n        elif tile == "P":\n            print("Player at", (x, y))\n        elif tile == "E":\n            print("Exit at", (x, y))\nprint("Walls:", walls)',
          output: 'Player at (1, 1)\nExit at (7, 2)\nWalls: 28',
          annotations: [
            { lines: '1-7', text: 'A level as a list of equal-length strings: `#` wall, `.` floor, `P` player, `E` exit, `\\$` treasure.' },
            { lines: 10, text: 'The outer loop gives each row and its index `y`.' },
            { lines: 11, text: 'The inner loop gives each character of that row and its index `x`.' },
            { lines: 15, text: '`(x, y)` is a *tuple* — a pair of values you’ll study next unit.' },
          ],
        },
        {
          type: 'callout',
          variant: 'code',
          text: 'Roguelikes, puzzle games and level editors parse maps exactly like this. Pathfinding (A*), flood-fill and cellular-automata cave generation are all nested loops over a grid — and NumPy can run the same grid operations on millions of cells at once.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Remember which loop `break` exits.',
      code: 'for i in range(3):\n    for j in range(3):\n        if j == 1:\n            break\n        print(i, j)',
      answer: '0 0\n1 0\n2 0',
      hint: '`break` only exits the inner loop. The outer loop keeps going.',
      explanation: 'For each `i`, the inner loop prints `i 0` and then hits `break` when `j == 1`. `break` exits only the *inner* loop, so the outer loop continues with the next `i`. Result: `0 0`, `1 0`, `2 0`.',
    },
    {
      kind: 'concept',
      title: 'Patterns you’ll write a thousand times',
      blocks: [
        {
          type: 'p',
          text: 'Most loops in real code are one of a handful of patterns. Recognizing them makes code faster to write and to read:',
        },
        {
          type: 'code',
          title: 'patterns.py',
          runnable: true,
          code: 'scores = [12, 45, 33, 51, 28, 47]\n\n# Filter: keep the items that pass a test\nhigh = []\nfor s in scores:\n    if s >= 40:\n        high.append(s)\nprint("High scores:", high)\n\n# Any / all: does at least one (or every) item pass?\nprint("Any perfect?", any(s == 100 for s in scores))\nprint("All passing?", all(s >= 10 for s in scores))\n\n# Build: grow a result one piece at a time\nword = "level"\nbackwards = ""\nfor ch in word:\n    backwards = ch + backwards\nprint(backwards, backwards == word)',
          output: 'High scores: [45, 51, 47]\nAny perfect? False\nAll passing? True\nlevel True',
          annotations: [
            { lines: '4-7', text: '**Filter**: start with an empty list and `append` the items you keep. (The Collections unit turns this into a one-line *list comprehension*.)' },
            { lines: '11-12', text: '`any` and `all` with a *generator expression* — a compact loop inside parentheses. `any` stops at the first `True`, `all` at the first `False`, just like `or` and `and`.' },
            { lines: '15-18', text: '**Build**: prepend each character to reverse the word. "level" is a palindrome, so it equals its reverse.' },
          ],
        },
        {
          type: 'table',
          headers: ['Pattern', 'Loop shape', 'Built-in shortcut'],
          rows: [
            ['Accumulate', '`total += x`', '`sum(items)`'],
            ['Count matches', '`if test: count += 1`', '`sum(test for x in items)`'],
            ['Best so far', '`if x > best: best = x`', '`max(items)`, `min(items)`'],
            ['Search', '`if test: break` (+ loop `else`)', '`x in items`, `any(...)`'],
            ['Filter', '`if test: result.append(x)`', 'list comprehension (next unit)'],
            ['Join text', '`line += sep + item`', '`sep.join(items)`'],
          ],
          caption: 'Learn the loop first; then use the shortcut, which is shorter, clearer and usually faster.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why prefer the built-ins?',
          text: 'They state your *intent*: `max(scores)` says "the largest score" in two words, while a loop makes the reader reverse-engineer it. They also run in C, so they’re faster, and they’re already tested — no off-by-one errors.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`any(s > 50 for s in scores)` checks every score even after it finds one above 50.',
      answer: false,
      explanation: 'False. `any` short-circuits: it stops at the first item that is truthy and returns `True`. Likewise, `all` stops at the first falsy item and returns `False`. That makes them efficient for searching large collections.',
    },
    {
      kind: 'concept',
      title: 'All pairs, and how loop cost grows',
      blocks: [
        {
          type: 'p',
          text: 'A classic nested-loop job: consider every **pair** of items once — matchups in a tournament, collision checks between objects. Start the inner loop *after* the outer index so each pair appears once and nothing is paired with itself:',
        },
        {
          type: 'code',
          title: 'round_robin.py',
          runnable: true,
          code: 'players = ["A", "B", "C", "D"]\nmatches = 0\nfor i in range(len(players)):\n    for j in range(i + 1, len(players)):\n        print(players[i], "vs", players[j])\n        matches += 1\nprint(matches, "matches")',
          output: 'A vs B\nA vs C\nA vs D\nB vs C\nB vs D\nC vs D\n6 matches',
          annotations: [
            { lines: 4, text: 'Starting at `i + 1` skips self-pairs (A vs A) and duplicates (B vs A after A vs B). This is one of the few places where looping over indices is the clearest choice.' },
          ],
        },
        {
          type: 'p',
          text: 'With $n$ players there are $\\frac{n(n-1)}{2}$ pairs: 6 for 4 players, 4,950 for 100, almost 50 million for 10,000. A single loop over $n$ items does about $n$ steps; nested loops over the same items do about $n^2$. Programmers write this as **O(n)** versus **O(n²)**.',
        },
        {
          type: 'table',
          headers: ['n', 'n steps (one loop)', 'n² steps (nested)'],
          rows: [
            ['10', '10', '100'],
            ['1,000', '1,000', '1,000,000'],
            ['100,000', '100,000', '10,000,000,000'],
          ],
          caption: 'At 100,000 items, a nested loop in pure Python would take hours; a single loop takes a fraction of a second.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why games use spatial partitioning',
          text: 'Checking every object against every other for collisions is O(n²) — fine for 50 bullets, hopeless for 50,000 particles. Engines split the world into grids, quadtrees or BVHs so each object is only checked against its neighbors. You’ll meet these ideas again in data structures and algorithms courses.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A function compares every one of `n` enemies with every other enemy using two nested loops over the full list. If `n` grows from 100 to 1,000, roughly how much longer does it take?',
      options: [
        { text: 'About 10 times longer', why: 'That would be true for a single loop (O(n)). Nested loops over the same list grow with n².' },
        { text: 'About 100 times longer', correct: true, why: 'Right: (1000 / 100)² = 10² = 100.' },
        { text: 'About 1,000 times longer', why: 'That would be O(n³) — three nested loops.' },
        { text: 'The same, because computers are fast', why: 'Growth rates dominate as n gets large; a 100× slowdown is very noticeable.' },
      ],
      explanation: 'Nested loops over `n` items do about $n^2$ steps. Multiplying `n` by 10 multiplies $n^2$ by $10^2 = 100$. That’s why algorithm growth matters more than micro-optimizations.',
    },
    {
      kind: 'code',
      prompt: 'Use nested loops to print a 5 × 5 multiplication table, with the numbers in each row separated by single spaces:\n\n```\n1 2 3 4 5\n2 4 6 8 10\n3 6 9 12 15\n4 8 12 16 20\n5 10 15 20 25\n```',
      starter: 'n = 5\n\n# outer loop for rows, inner loop for columns\n',
      solution: 'n = 5\n\nfor row in range(1, n + 1):\n    line = ""\n    for col in range(1, n + 1):\n        if col > 1:\n            line += " "\n        line += str(row * col)\n    print(line)\n',
      tests: '',
      expectOutput: '1 2 3 4 5\n2 4 6 8 10\n3 6 9 12 15\n4 8 12 16 20\n5 10 15 20 25',
      checks: ['Uses an outer loop for rows and an inner loop for columns', 'No trailing or double spaces'],
      hint: 'Inside the outer loop, build each row’s text (or use `print(row * col, end=" ")` and a final `print()` — trailing spaces are ignored by the checker).',
      explanation: 'For each `row` from 1 to 5, the inner loop computes `row * col` for each column. One approach builds the line as a string, adding a space before every number except the first; another prints with `end=" "` and finishes each row with `print()`. A compact version: `print(" ".join(str(row * col) for col in range(1, n + 1)))`.',
    },
    {
      kind: 'error',
      prompt: 'This code should print every **pair** of different players exactly once (3 lines), but it prints 9 lines, including `Ada vs Ada`. Tap the line to change.',
      lines: ['players = ["Ada", "Ben", "Cai"]', 'for i in range(len(players)):', '    for j in range(len(players)):', '        print(players[i], "vs", players[j])'],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The inner loop starts at 0, so it pairs every player with everyone — including themselves — and visits each pair twice (Ada vs Ben *and* Ben vs Ada). Starting the inner loop after the outer index, `for j in range(i + 1, len(players)):`, gives each pair exactly once: 3 lines.',
    },
    {
      kind: 'code',
      prompt: 'Draw a centered triangle 4 rows tall using `range` and string repetition:\n\n```\n   *\n  ***\n *****\n*******\n```\n\nRow `size` (1 to 4) has `4 - size` spaces followed by `2 * size - 1` stars.',
      starter: 'height = 4\n\n# loop over the rows\n',
      solution: 'height = 4\n\nfor size in range(1, height + 1):\n    print(" " * (height - size) + "*" * (2 * size - 1))\n',
      tests: '',
      expectOutput: '   *\n  ***\n *****\n*******',
      checks: ['One `print` per row inside a loop', 'Correct spaces and stars on each row'],
      hint: 'For each `size` in `range(1, height + 1)`, print `" " * (height - size)` followed by `"*" * (2 * size - 1)`.',
      explanation: 'Row 1 needs 3 spaces and 1 star, row 4 needs 0 spaces and 7 stars. The formulas `height - size` and `2 * size - 1` produce exactly that, and string repetition turns the numbers into text. One loop is enough here because each row is a single string.',
    },
  ],
  takeaways: [
    'In nested loops the inner loop runs completely for every outer iteration: n × m runs of the inner body.',
    'Use `enumerate` on both levels of a grid to get (x, y) coordinates of each tile.',
    'Core patterns: accumulate, count, best-so-far, search, filter, build, all-pairs — and their built-in shortcuts (`sum`, `max`, `any`, `all`, `in`, `str.join`).',
    '`any`/`all` short-circuit, just like `or`/`and`.',
    'All-pairs loops start the inner loop at `i + 1`. Nested loops over n items cost about n² steps — O(n²) — which explodes for large n.',
  ],
  reading: [
    { title: 'Built-in Functions: any() and all()', url: 'https://docs.python.org/3/library/functions.html#any', source: 'docs', note: 'Short definitions, including the equivalent loop code.' },
    { title: 'Big O notation', url: 'https://en.wikipedia.org/wiki/Big_O_notation', source: 'wikipedia', note: 'The formal idea behind "n vs n²" — you’ll use it in every algorithms course.' },
    { title: 'Game Programming Patterns: Spatial Partition', url: 'https://gameprogrammingpatterns.com/spatial-partition.html', source: 'book', note: 'How games avoid O(n²) collision checks.' },
  ],
};
