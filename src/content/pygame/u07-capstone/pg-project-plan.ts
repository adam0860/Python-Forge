import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-project-plan',
  title: 'Capstone 1: Plan Star Defender',
  summary: 'Design a complete arcade shooter on one page, cut it down to a scope you can finish, separate the rules from the pygame code, and tune the difficulty with simple, testable curves.',
  minutes: 40,
  objectives: [
    'Write a one-page game design: the core loop, the lose condition, the controls and a prioritised feature list',
    'Cut scope with a must / should / could split and a time budget, so that the game gets finished',
    'Explain the two-layer architecture: a pure logic layer that can be tested without a window, and a thin pygame layer',
    'Write difficulty functions that rise smoothly and stop at a floor or a cap',
    'Write a combo multiplier that rewards quick successive hits',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A one-page design',
      blocks: [
        {
          type: 'p',
          text: 'The last three lessons build one complete game, **Star Defender**: a vertical arcade shooter in which you slide a ship along the bottom of the screen, fire at waves of descending enemies, and survive as they speed up. You already know every technique it needs. What this capstone adds is the part that no tutorial can give you in a single lesson: **planning a whole game and finishing it**.',
        },
        {
          type: 'p',
          text: 'Start with a one-page design. It should fit in a few lines, and it should answer five questions:',
        },
        {
          type: 'table',
          headers: ['Question', 'Star Defender’s answer'],
          rows: [
            ['What does the player **do** all the time? (the core loop)', 'Move left and right, hold fire, and pick off enemies before they reach the bottom'],
            ['How does the player **win** a moment?', 'Each kill scores points; quick kills build a combo multiplier'],
            ['How does the player **lose**?', 'Three lives. Touching an enemy or letting one pass costs a life'],
            ['What gets **harder** over time?', 'Level rises with the score: enemies fall faster and arrive more often'],
            ['What are the **controls**?', 'Left and right arrows (or A and D), hold Space to fire, P to pause'],
          ],
          caption: 'If you can fill in these five rows, you can build the game. If you cannot, no amount of code will help yet.',
        },
        {
          type: 'p',
          text: 'Then sort **every feature you can think of** into three piles. The skill is not in having ideas (everyone has too many) but in deciding what to leave out. A finished small game is worth far more than an abandoned big one.',
        },
        {
          type: 'table',
          headers: ['Pile', 'Meaning', 'For Star Defender'],
          rows: [
            ['**Must**', 'Without it there is no game', 'Moving ship, shooting, enemies, collisions, score, lives, game over'],
            ['**Should**', 'Makes it a good game; do it second', 'Levels and difficulty, high score, title and game-over screens, pause'],
            ['**Could**', 'Nice if time remains; cut first', 'Particles and shake, power-ups, scrolling stars, sound, combo multiplier'],
          ],
          caption: 'Build the musts first, in order. You can always add a could; you can never get back time wasted on one.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why plan with a budget?',
          text: 'Estimate each feature in hours, and decide how many hours you have. A feature costs more than its estimate (it always does), so keep a reserve. When the budget runs out, the game is **done**: whatever is in the must and should piles ships. That rule is what turns a never-ending hobby project into a finished one, and finished projects are what you learn from.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You have 10 hours for the project and your wish list would take 40. What should you do?',
      options: [
        { text: 'Sort the features into must, should and could, and build in that order, cutting from the bottom when time runs out', correct: true, why: 'The musts give you a playable game early; everything else is a bonus.' },
        { text: 'Start with the coolest effects, since they motivate you', why: 'You may run out of time with no playable game at all.' },
        { text: 'Work faster and hope to fit everything', why: 'Estimates are almost always too low, so the plan is already optimistic.' },
        { text: 'Skip the design and let the code decide', why: 'Without a design the scope grows without limit.' },
      ],
      explanation: 'Scope is the one thing you control completely. Priorities decide what survives when time is short.',
    },
    {
      kind: 'truefalse',
      prompt: 'It is better to have a small game that is finished and playable than a large game that is 70 percent done.',
      answer: true,
      explanation: 'True. A finished small game can be played, shared, improved and learned from; an unfinished big one can only be abandoned. Most successful hobby games grow by repeatedly finishing something small and then adding to it.',
    },
    {
      kind: 'concept',
      title: 'Two layers: the rules and the screen',
      blocks: [
        {
          type: 'p',
          text: 'The most important decision in the whole project is how to organise the code. Star Defender is split into two layers:',
        },
        {
          type: 'code',
          lang: 'text',
          code: `star_defender/
    logic.py      the rules: World, Ship, Enemy, difficulty (no window needed)
    game.py       the screen: window, input, drawing, sound, menus
    main.py       starts the game
    tests/        tests that run without a window

keyboard --> direction, firing
direction, firing --> world.update(dt, direction, firing)
world.update --> new state + world.events
new state --> draw()
world.events --> particles, shake, sound`,
          annotations: [
            { lines: '2', text: 'The **logic layer** holds all the rules. It uses `pygame.Rect` for geometry but never opens a window, plays a sound or reads the keyboard.' },
            { lines: '3', text: 'The **presentation layer** is the thin shell: it turns key presses into numbers, calls the logic, and draws whatever the logic says.' },
            { lines: '5', text: 'Tests need no window, so they can run anywhere, in a fraction of a second.' },
            { lines: '7-8', text: 'The only inputs the logic ever receives are plain values: a direction (-1, 0 or 1), a firing flag and the time step.' },
            { lines: '9-11', text: 'The logic never calls the effects. Instead it records **events** (`("explode", x, y)`, `("hurt",)`) in a list, and the presentation layer reads that list and decides what to show or play.' },
          ],
        },
        {
          type: 'p',
          text: 'The reasons for the split are the ones you have met all through this course, now applied to a whole game. Because the logic is plain Python, you can **test** it (the exercises in the next lesson are exactly such tests), **simulate** it (a bot that plays 2 minutes of the game in a fraction of a second, to check that the difficulty is fair), and **change the screen** (a different art style, a different window size) without touching a rule.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why events instead of calling effects directly?',
          text: 'If the logic called `spawn_particles()` when an enemy died, it would need a particle system, and therefore a window, in every test. With an event list, the logic only says "an explosion happened here"; the game layer reacts. Turning off screen shake, adding sound, or recording a replay is then a change in one place, and the rules never know.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the difficulty rules: the level rises with the score, speed is capped, and the spawn interval has a floor.',
      template: `level = 1 + score ___ 100
speed = ___(220, 70 + 12 * (level - 1))
interval = ___(0.35, 1.25 - 0.125 * (level - 1))`,
      templateIsCode: true,
      blanks: [{ answers: ['//'] }, { answers: ['min'] }, { answers: ['max'] }],
      wordBank: ['//', '%', 'min', 'max', '/', 'abs'],
      explanation: 'Floor division makes one level per 100 points. `min(220, ...)` **caps** a value that grows (the speed can never exceed 220), and `max(0.35, ...)` sets a **floor** under a value that shrinks (the interval never goes below 0.35 seconds).',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The level formula is tried on four scores.',
      code: `print([1 + s // 100 for s in (0, 99, 100, 250)])`,
      answer: '[1, 1, 2, 3]',
      hint: 'Floor division: 99 // 100 is 0, but 100 // 100 is 1.',
      explanation: 'Scores 0 and 99 are both in level 1; 100 reaches level 2; and 250 is level 3 (`250 // 100 = 2`, plus 1). The level changes exactly at multiples of 100.',
    },
    {
      kind: 'concept',
      title: 'Tuning difficulty with curves',
      blocks: [
        {
          type: 'p',
          text: 'A good arcade game gets harder at a steady, fair pace. A **difficulty curve** is a function from the level to a number: how fast the enemies are, how often they arrive. Two rules keep a curve sensible. It should **change smoothly** (no sudden jumps that feel unfair), and it should **stop somewhere** (a cap on speed, a floor on the interval), because beyond a certain point the game would simply be impossible. Run the program below to *see* the two curves for levels 1 to 20: the speed line rises until it hits its cap, and the spawn-interval line falls until it hits its floor.',
        },
        {
          type: 'code',
          title: 'difficulty_plot.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
font = pygame.font.Font(None, 24)


def spawn_interval(level):
    return max(0.35, 1.25 - 0.125 * (level - 1))


def enemy_speed(level):
    return min(220, 70 + 12 * (level - 1))


def plot(surface, color, values, top, bottom):
    left, right = 60, 600
    points = []
    for i, value in enumerate(values):
        x = left + (right - left) * i / (len(values) - 1)
        y = bottom - (bottom - top) * value
        points.append((x, y))
    pygame.draw.lines(surface, color, False, points, 3)


levels = list(range(1, 21))
speeds = [enemy_speed(n) / 220 for n in levels]
intervals = [spawn_interval(n) / 1.25 for n in levels]

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    screen.fill((20, 24, 32))
    pygame.draw.line(screen, (90, 100, 120), (60, 40), (60, 320))
    pygame.draw.line(screen, (90, 100, 120), (60, 320), (600, 320))
    plot(screen, (230, 90, 90), speeds, 40, 320)
    plot(screen, (90, 170, 240), intervals, 40, 320)
    screen.blit(font.render("enemy speed", True, (230, 90, 90)), (70, 10))
    screen.blit(font.render("spawn interval", True, (90, 170, 240)), (220, 10))
    screen.blit(font.render("level 1 to 20", True, (200, 200, 200)), (480, 330))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '8-9', text: 'The spawn interval falls by an eighth of a second per level and **stops** at 0.35. `max` sets the floor.' },
            { lines: '12-13', text: 'The speed rises by 12 pixels per second per level and **stops** at 220. `min` sets the cap.' },
            { lines: '16-23', text: 'A tiny plotting helper: each value (already scaled to 0..1) becomes a point, and the points are joined with one `draw.lines` call.' },
            { lines: '26-28', text: 'Both curves are divided by their maximum so that they fit the same graph: each is drawn as a fraction of its own range.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Use numbers that are exact in binary',
          text: 'The curves use `0.125` (one eighth) and whole numbers, which computers store exactly. A step such as `0.1` is **not** exact in binary, so `1.2 - 0.1 * 2` is `0.9999999999999999`, not `1.0`. Exact steps make tests simple (`==` works) and the behaviour identical on every machine. In the exercises, the expected values are exact for this reason.',
        },
        {
          type: 'p',
          text: 'A last piece of scoring: the **combo multiplier**. Each kill that comes within one second of the previous one raises the multiplier by one, up to a cap of five; a longer gap resets it to one. Quick, confident play is rewarded, and a missed streak costs the bonus, with no timers to manage: the object just remembers when the last hit happened.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Testers say the enemies are at maximum speed from the very first second. Tap the line with the bug.',
      lines: [
        'level = 1 + score // 100',
        'speed = max(220, 70 + 12 * (level - 1))',
        'interval = max(0.35, 1.25 - 0.125 * (level - 1))',
        'print(speed, interval)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: '`max(220, ...)` returns the **larger** of the two numbers, so the speed is never below 220. A cap needs `min`: `min(220, 70 + 12 * (level - 1))`. (`max` for the floor on the interval, on the next line, is correct.)',
    },
    {
      kind: 'numeric',
      prompt: 'The spawn interval is `max(0.35, 1.25 - 0.125 * (level - 1))`. At which level does it first hit the 0.35 floor (that is, the formula inside `max` is 0.35 or less)?',
      answer: '9',
      hint: 'Level 8 gives 1.25 - 0.875 = 0.375. What does level 9 give?',
      explanation: 'At level 9 the formula gives 1.25 - 1.0 = 0.25, below the floor, so `max` returns 0.35. At level 8 it is 0.375, still above the floor. From level 9 on, the interval stays at 0.35 seconds.',
      label: 'Level:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the first pieces of the logic layer',
      blocks: [
        {
          type: 'p',
          text: 'You will write the difficulty functions, the combo multiplier, and a small planning function that picks features within a time budget, which is the scope discipline from the start of this lesson as code. The numbers are all exact in binary.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `level_for_score(score)` returning `1 + score // 100`; `spawn_interval(level)` returning `max(0.35, 1.25 - 0.125 * (level - 1))`; and `enemy_speed(level)` returning `min(220, 70 + 12 * (level - 1))`.',
      starter: `def level_for_score(score):
    ...


def spawn_interval(level):
    ...


def enemy_speed(level):
    ...
`,
      solution: `def level_for_score(score):
    return 1 + score // 100


def spawn_interval(level):
    return max(0.35, 1.25 - 0.125 * (level - 1))


def enemy_speed(level):
    return min(220, 70 + 12 * (level - 1))
`,
      tests: `assert level_for_score(0) == 1
assert level_for_score(99) == 1
assert level_for_score(100) == 2
assert level_for_score(250) == 3
assert level_for_score(1000) == 11
assert spawn_interval(1) == 1.25
assert spawn_interval(2) == 1.125
assert spawn_interval(3) == 1.0
assert spawn_interval(8) == 0.375
assert spawn_interval(9) == 0.35, "the floor"
assert spawn_interval(40) == 0.35
assert enemy_speed(1) == 70
assert enemy_speed(2) == 82
assert enemy_speed(13) == 214
assert enemy_speed(14) == 220, "the cap"
assert enemy_speed(99) == 220
for level in range(1, 40):
    assert spawn_interval(level + 1) <= spawn_interval(level), "never gets easier"
    assert enemy_speed(level + 1) >= enemy_speed(level), "never gets easier"
    assert 0.35 <= spawn_interval(level) <= 1.25 and 70 <= enemy_speed(level) <= 220`,
      checks: ['The level rises by one per 100 points', 'The spawn interval falls with the level and never goes below 0.35', 'The speed rises with the level and never goes above 220'],
      hint: '`1 + score // 100`; `max(0.35, ...)` for a floor; `min(220, ...)` for a cap.',
      explanation: 'Three one-line functions are the whole difficulty system. Keeping them separate from the game means you can tune the feel of the game by editing numbers in one place, and the test at the end proves that the game never gets easier as it goes on.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Combo(window=1.0, cap=5)` with attributes `window`, `cap`, `count` (starts at 0) and `last` (the time of the last hit, starts as `None`). `hit(now)` records a hit at time `now` and returns the new `count`: if there was a previous hit and `now - last <= window`, the count rises by one but never above `cap`; otherwise it is set to 1. Then it stores `now` in `last`. Also write `points(base, now)` which returns `base * self.hit(now)`.',
      starter: `class Combo:
    def __init__(self, window=1.0, cap=5):
        ...

    def hit(self, now):
        ...

    def points(self, base, now):
        ...
`,
      solution: `class Combo:
    def __init__(self, window=1.0, cap=5):
        self.window = window
        self.cap = cap
        self.count = 0
        self.last = None

    def hit(self, now):
        if self.last is not None and now - self.last <= self.window:
            self.count = min(self.cap, self.count + 1)
        else:
            self.count = 1
        self.last = now
        return self.count

    def points(self, base, now):
        return base * self.hit(now)
`,
      tests: `c = Combo()
assert (c.window, c.cap, c.count, c.last) == (1.0, 5, 0, None)
assert c.hit(0.0) == 1
assert c.hit(0.5) == 2
assert c.hit(1.5) == 3, "a gap of exactly the window still counts"
assert c.hit(3.0) == 1, "a gap longer than the window resets the combo"
assert c.last == 3.0
fast = Combo()
assert [fast.hit(t * 0.25) for t in range(8)] == [1, 2, 3, 4, 5, 5, 5, 5], "capped at five"
assert fast.hit(10.0) == 1
small = Combo(window=0.5, cap=3)
assert small.hit(0.0) == 1 and small.hit(0.25) == 2 and small.hit(0.75) == 3 and small.hit(1.25) == 3
assert small.hit(2.0) == 1
p = Combo()
assert p.points(10, 0.0) == 10
assert p.points(10, 0.5) == 20
assert p.points(10, 1.0) == 30
assert p.points(30, 1.25) == 120
assert p.points(10, 5.0) == 10`,
      checks: ['A hit within the window raises the count by one, up to the cap; otherwise it resets to 1', 'A gap of exactly `window` still counts as quick', '`points` multiplies the base score by the new count'],
      hint: 'The first hit has `last` equal to `None`, so check `self.last is not None` before subtracting. Use `min(self.cap, self.count + 1)`.',
      explanation: 'The object needs only two numbers of memory, `count` and `last`, to implement a rule that would otherwise need a timer for every kill. Because time is passed in (`now`), the test can use exact values instead of waiting for real seconds.',
    },
    {
      kind: 'code',
      prompt: 'Write `plan_sprint(features, budget)`. `features` is a list of dictionaries with `"name"`, `"value"` (1 to 5), `"effort"` (hours, positive) and `"must"` (`True` or `False`). Pick the features to build with `budget` hours: first go through the **must** features in the given order, then through the others sorted by `value / effort` from highest to lowest (ties broken by name, alphabetically). Take a feature only if its `effort` fits in the hours still left. Return the list of the chosen names, in the order they were chosen.',
      starter: `def plan_sprint(features, budget):
    ...
`,
      solution: `def plan_sprint(features, budget):
    must = [f for f in features if f["must"]]
    rest = [f for f in features if not f["must"]]
    rest.sort(key=lambda f: (-f["value"] / f["effort"], f["name"]))
    chosen = []
    left = budget
    for feature in must + rest:
        if feature["effort"] <= left:
            chosen.append(feature["name"])
            left -= feature["effort"]
    return chosen
`,
      tests: `F = [
    {"name": "movement", "value": 5, "effort": 2, "must": True},
    {"name": "shooting", "value": 5, "effort": 3, "must": True},
    {"name": "enemies", "value": 4, "effort": 3, "must": True},
    {"name": "sound", "value": 2, "effort": 2, "must": False},
    {"name": "powerups", "value": 3, "effort": 4, "must": False},
    {"name": "particles", "value": 3, "effort": 1, "must": False},
    {"name": "menu", "value": 2, "effort": 1, "must": False},
    {"name": "online", "value": 1, "effort": 8, "must": False},
]
assert plan_sprint(F, 12) == ["movement", "shooting", "enemies", "particles", "menu", "sound"]
assert plan_sprint(F, 8) == ["movement", "shooting", "enemies"]
assert plan_sprint(F, 5) == ["movement", "shooting"], "a must that does not fit is skipped, and nothing else fits"
assert plan_sprint(F, 20) == ["movement", "shooting", "enemies", "particles", "menu", "sound", "powerups"]
assert plan_sprint(F, 1) == ["particles"], "no must fits in one hour, but the best cheap extra does"
assert plan_sprint(F, 0) == []
assert plan_sprint(F, 100) == ["movement", "shooting", "enemies", "particles", "menu", "sound", "powerups", "online"]
assert plan_sprint([], 10) == []
tie = [
    {"name": "beta", "value": 1, "effort": 1, "must": False},
    {"name": "alpha", "value": 2, "effort": 2, "must": False},
]
assert plan_sprint(tie, 3) == ["alpha", "beta"], "equal value per hour: alphabetical"
assert plan_sprint(tie, 2) == ["alpha"]
copy = [dict(f) for f in F]
plan_sprint(F, 12)
assert F == copy, "the list of features is not changed or reordered"`,
      checks: ['Must features are considered first, in the order given', 'The others are ordered by value per hour (highest first), then by name', 'A feature is chosen only if it fits in the remaining hours, and the input is not modified'],
      hint: 'Split into `must` and `rest`. Sort `rest` with `key=lambda f: (-f["value"] / f["effort"], f["name"])`. Then loop over `must + rest`, subtracting efforts from the budget.',
      explanation: 'This is a greedy plan: it is not always the perfect combination, but it is fast, explainable, and follows the rule that matters most: **musts first**. It also never reorders your original list (`sort` is applied to a new list).',
    },
  ],
  takeaways: [
    'Plan before coding: a **one-page design** answers what the player does all the time, how they win a moment, how they lose, what gets harder, and what the controls are.',
    'Sort features into **must, should and could**; give each an hour estimate; build the musts first and cut from the bottom when time runs out. A finished small game beats an unfinished big one.',
    'Split the game into a **logic layer** (pure rules, testable without a window, using only plain inputs such as direction, firing and `dt`) and a thin **presentation layer** (window, keyboard, drawing, sound).',
    'Let the logic record **events** (`("explode", x, y)`) instead of calling effects. The presentation layer reads them and decides what to show, so effects can change without touching a rule.',
    'A **difficulty curve** should change smoothly and stop somewhere: `min(cap, ...)` limits a value that grows, `max(floor, ...)` limits a value that shrinks. Use steps that are exact in binary (such as 0.125) so tests can use `==`.',
    'A **combo** needs only two numbers of memory (`count` and `last`) and a window of time. Passing the time in (`now`) makes it testable.',
  ],
  reading: [
    { title: 'Game Programming Patterns: Introduction and Architecture', url: 'https://gameprogrammingpatterns.com/architecture-performance-and-games.html', source: 'book', note: 'Why separating the rules from the rest keeps a game maintainable.' },
    { title: 'Wikipedia: MoSCoW method', url: 'https://en.wikipedia.org/wiki/MoSCoW_method', source: 'wikipedia', note: 'The must, should, could (and won’t) prioritisation used in this lesson.' },
    { title: 'Wikipedia: Dynamic game difficulty balancing', url: 'https://en.wikipedia.org/wiki/Dynamic_game_difficulty_balancing', source: 'wikipedia', note: 'Ideas for difficulty that adapts to the player, beyond a fixed curve.' },
  ],
};
