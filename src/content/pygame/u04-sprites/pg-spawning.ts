import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-spawning',
  title: 'Spawning, Waves and Randomness',
  summary: 'Create enemies and pickups over time: spawn timers that survive lag spikes, controlled randomness you can reproduce, off-screen spawn points, waves and a rising difficulty.',
  minutes: 38,
  objectives: [
    'Build a spawn timer driven by `dt` that never loses spawns when a frame is long',
    'Use a `random.Random` generator object, and explain why a seed makes runs reproducible',
    'Choose spawn positions just outside the screen, and weighted random choices',
    'Design a difficulty ramp and a wave plan as plain functions of time or wave number',
    'Keep spawning under control: caps, safe distances and cleanup',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A timer that makes things',
      blocks: [
        {
          type: 'p',
          text: 'Games rarely start with everything on the screen. Enemies arrive, coins appear, asteroids drift in. The program that **creates** things as time passes is a **spawner**, and its core is the cooldown idea from the delta-time lesson turned around: instead of waiting for permission to fire, it counts down to the moment to **make** something.',
        },
        {
          type: 'table',
          headers: ['Part', 'Job'],
          rows: [
            ['A **timer**', 'Counts down by `dt` each frame; reaching 0 means "spawn now"'],
            ['An **interval**', 'How many seconds between spawns; shrinking it raises the difficulty'],
            ['A **recipe**', 'What to create: the class, speed and size, picked at random from some rules'],
            ['A **position rule**', 'Where it appears: a random x above the screen, an edge, a spawn point'],
            ['A **limit**', 'The most objects alive at once, so that the game stays playable (and fast)'],
          ],
          caption: 'Five small decisions; each can change the whole feel of a game.',
        },
        {
          type: 'code',
          title: 'spawner_demo.py',
          desktopOnly: true,
          code: `import random
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
rng = random.Random(7)


class Faller(pygame.sprite.Sprite):
    def __init__(self, x, speed, size):
        super().__init__()
        self.image = pygame.Surface((size, size))
        self.image.fill((220, 70, 70))
        self.rect = self.image.get_rect(midbottom=(x, 0))
        self.pos = pygame.Vector2(self.rect.center)
        self.speed = speed

    def update(self, dt):
        self.pos.y += self.speed * dt
        self.rect.center = self.pos
        if self.rect.top > 360:
            self.kill()


class Spawner:
    def __init__(self, interval):
        self.interval = interval
        self.timer = interval

    def update(self, dt):
        spawned = 0
        self.timer -= dt
        while self.timer <= 0:
            self.timer += self.interval
            spawned += 1
        return spawned


enemies = pygame.sprite.Group()
spawner = Spawner(1.0)
elapsed = 0.0
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    elapsed += dt
    spawner.interval = max(0.25, 1.0 - elapsed * 0.02)
    for _ in range(spawner.update(dt)):
        x = rng.randint(20, 620)
        enemies.add(Faller(x, rng.uniform(80, 200), rng.choice([20, 30, 40])))
    enemies.update(dt)

    pygame.display.set_caption(f"Enemies: {len(enemies)}  interval {spawner.interval:.2f}s")
    screen.fill((20, 24, 48))
    enemies.draw(screen)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '7', text: 'A private random generator with a **seed**. The same seed gives the same "random" sequence on every run, which is good for debugging; leave it out (`random.Random()`) for a different game each time.' },
            { lines: '10-23', text: 'The falling enemy appears just **above** the screen (its bottom edge at y = 0) and kills itself once it has fallen off the bottom.' },
            { lines: '26-33', text: 'The spawner holds a timer and an interval. `update(dt)` returns **how many** things to spawn this frame.' },
            { lines: '34-36', text: 'A `while`, not an `if`: after a long frame (a lag spike), more than one interval may have passed, and the loop produces every spawn that is due, so the rate stays correct.' },
            { lines: '51-52', text: 'The difficulty ramp: the interval shrinks by 0.02 seconds for every second played, but never below 0.25. A plain formula of elapsed time.' },
            { lines: '53-55', text: 'For every spawn due, pick random properties from the generator (position, speed, size), build the sprite and add it to the group.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why `+=` interval and not `= interval`?',
          text: 'Setting the timer back to exactly `interval` throws away the **overshoot**: if the timer reached -0.01 this frame, 0.01 seconds are lost each time, and over a minute the spawner runs slow. Adding `interval` to the (negative or zero) timer keeps the leftover, so spawns come at exactly the intended average rate, whatever the frame rate.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does the spawner use `while self.timer <= 0:` rather than `if self.timer <= 0:`?',
      options: [
        { text: 'After a long frame several intervals may have elapsed, and the loop spawns all of the objects that are due', correct: true, why: 'With `if`, a half-second stall with a 0.1-second interval would produce one enemy instead of five, and the game would permanently fall behind.' },
        { text: 'A `while` loop is faster than an `if`', why: 'Speed is not the reason: for the usual single spawn the two do the same work.' },
        { text: 'So that the spawner can run forever', why: 'The game loop already does that. The inner `while` ends as soon as the timer is positive.' },
        { text: 'Because `if` cannot compare floating-point numbers', why: 'It can: `if` and `while` use the same comparison.' },
      ],
      explanation: 'The `while` handles "catching up": the number of spawns depends on the time that passed, not on how many frames it took.',
    },
    {
      kind: 'truefalse',
      prompt: 'Two `random.Random(42)` generators, used in the same way, produce the same sequence of numbers, so a game seeded with 42 plays its random events in the same order each time.',
      answer: true,
      explanation: 'True. A pseudo-random generator is a formula that starts from the seed, so the same seed gives the same "random" numbers. That makes bugs reproducible ("it crashed on seed 42"), enables a "daily challenge" level, and makes random code testable. Without a seed, Python seeds from the system clock.',
    },
    {
      kind: 'concept',
      title: 'Controlled randomness',
      blocks: [
        {
          type: 'p',
          text: 'The `random` module has a global generator (`random.randint(...)`) and also a **class**, `random.Random`, whose instances are independent generators. Prefer an instance such as `rng = random.Random(seed)` that you pass around: you can seed it, replace it in tests, and give each part of the game its own, so that spawning enemies does not change what the loot drops.',
        },
        {
          type: 'table',
          headers: ['Method', 'Gives', 'Typical use'],
          rows: [
            ['`rng.random()`', 'A float from 0.0 up to (not including) 1.0', 'Chance checks: `rng.random() < 0.1` is a 10 percent chance'],
            ['`rng.randint(a, b)`', 'An integer from `a` to `b`, **both included**', 'A random x position'],
            ['`rng.uniform(a, b)`', 'A float between `a` and `b`', 'A random speed or angle'],
            ['`rng.choice(seq)`', 'One item of a sequence', 'A random enemy type or spawn point'],
            ['`rng.choices(seq, weights=w, k=n)`', '`n` items, some more likely than others', 'Loot tables: common, rare, legendary'],
            ['`rng.shuffle(list)`', 'Reorders the list in place', 'A deck of cards, a random level order'],
            ['`rng.sample(seq, k)`', '`k` different items', 'Pick 3 distinct power-ups'],
          ],
          caption: 'Randomness is a design tool: the art is in the limits you set around it.',
        },
        {
          type: 'p',
          text: 'Pure randomness often feels unfair: three enemies in a row from the same corner, or a coin on top of the player. Games shape it: spawn only **outside** the screen (so enemies don’t pop in), keep a **minimum distance** from the player, avoid the same spawn point twice in a row, and use **weights** so that strong enemies are rare. A **weighted pick** can be written with one random number `r` from 0 to 1: walk through the options, and the first whose running total passes `r * total` wins.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Pass the generator in',
          text: 'A function that takes `rng` as a parameter can be tested by giving it a seeded generator (or a fake with fixed answers) and checking properties of the result: "always outside the screen", "all four sides appear". Code that calls the global `random` directly is much harder to test.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the spawn code.',
      template: `rng = random.___(7)
for _ in range(spawner.___(dt)):
    x = rng.___(20, 620)
    enemies.add(Faller(x, 120, 30))`,
      templateIsCode: true,
      blanks: [{ answers: ['Random'] }, { answers: ['update'] }, { answers: ['randint'] }],
      wordBank: ['Random', 'update', 'randint', 'choice', 'seed', 'spawn'],
      explanation: '`random.Random(7)` creates a seeded generator, `spawner.update(dt)` says how many to make, and `rng.randint(20, 620)` picks a whole number between 20 and 620 (both included).',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A spawner with an interval of 1.0 second starts with its timer at 1.0 and receives four frames of 0.75 seconds each. How many things does it spawn in total?',
      code: `timer = 1.0
interval = 1.0
total = 0
for dt in [0.75, 0.75, 0.75, 0.75]:
    timer -= dt
    while timer <= 0:
        timer += interval
        total += 1
print(total)`,
      answer: '3',
      hint: 'Follow the timer: 0.25, then -0.5 (spawn, back to 0.5), then -0.25, then 0.',
      explanation: 'The timer goes 0.25, then -0.5 (spawn, timer becomes 0.5), then -0.25 (spawn, 0.75), then 0 (spawn, 1.0): three spawns in three seconds, exactly one per second, even though the frames did not line up with the interval.',
    },
    {
      kind: 'concept',
      title: 'Difficulty, waves, and limits',
      blocks: [
        {
          type: 'p',
          text: 'Difficulty is mostly a set of curves: how fast, how many, how tough, over time. Two common structures:',
        },
        {
          type: 'table',
          headers: ['Style', 'How it works', 'Feels like'],
          rows: [
            ['**Continuous ramp**', 'A formula of elapsed time changes the interval and speed: `interval = max(0.25, 1.0 - 0.02 * seconds)`', 'Steady, endless pressure (survival games, arcade)'],
            ['**Waves**', 'A plan for each wave number: so many of each type; the next wave starts when the last is cleared', 'Build-up and rest (tower defence, shooters with breaks)'],
            ['**Hybrid**', 'Waves with a ramp inside, and a boss every few waves', 'Most commercial games'],
          ],
          caption: 'Express the plan as a function from wave number or time to numbers, not as hard-coded special cases.',
        },
        {
          type: 'p',
          text: 'Keep a few safety rules in the spawner. **Cap** the number alive (`if len(enemies) < MAX`), because an unbounded group is a slow game. **Clean up** objects that leave the play area, or they accumulate. Keep a **safe distance** around the player. And use a **seeded** generator while developing so that a hard moment can be replayed.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why plain functions for the plan?',
          text: 'A function such as `wave_plan(3)` that returns `[("grunt", 7), ("tank", 1)]` can be checked with a test in a millisecond, and tuned by changing numbers. If the plan is tangled into the game loop, the only way to see wave 20 is to play 19 waves. Separating the plan from the machinery is what makes difficulty tunable.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Every enemy appears at exactly the same x position, although the code picks a "random" x. Tap the line with the mistake.',
      lines: [
        'def spawn_enemy():',
        '    rng = random.Random(42)',
        '    x = rng.randint(20, 620)',
        '    return Enemy(x)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'A new generator is created, with the **same seed**, each time the function is called, so it always produces the same first number. Create the generator **once** (at the top of the game, or as a parameter) and reuse it, so that each call continues the sequence.',
    },
    {
      kind: 'numeric',
      prompt: 'A spawner makes one enemy every 0.8 seconds. How many enemies does it spawn in one minute?',
      answer: '75',
      hint: '60 seconds divided by 0.8.',
      explanation: '60 / 0.8 = 75 spawns per minute. If the game removes enemies slower than that, the group grows, which is why a cap on how many may be alive at once is a sensible safety measure.',
      label: 'Enemies:',
    },
    {
      kind: 'concept',
      title: 'Your turn: spawning rules',
      blocks: [
        {
          type: 'p',
          text: 'Three pieces of spawn logic, all written to be tested: the timer, the positions (using a seeded generator you are given), and the wave plan with a weighted pick.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a class `Spawner(interval)`. It starts with its timer at `interval` (the first spawn comes after one full interval). `update(dt)` subtracts `dt` from the timer and, **while** the timer is 0 or less, adds `interval` back and counts one spawn; it returns the number of spawns. Also support changing `interval` between calls (the timer then simply continues).',
      starter: `class Spawner:
    def __init__(self, interval):
        ...

    def update(self, dt):
        ...
`,
      solution: `class Spawner:
    def __init__(self, interval):
        self.interval = interval
        self.timer = interval

    def update(self, dt):
        spawned = 0
        self.timer -= dt
        while self.timer <= 0:
            self.timer += self.interval
            spawned += 1
        return spawned
`,
      tests: `s = Spawner(1.0)
assert s.update(0.5) == 0
assert s.update(0.25) == 0
assert s.update(0.25) == 1, "exactly one interval: spawn"
assert s.update(0.5) == 0
assert s.update(0.5) == 1
t = Spawner(0.5)
assert t.update(2.0) == 4, "a long frame produces every spawn that is due"
assert t.update(0.25) == 0
assert t.update(0.25) == 1
u = Spawner(1.0)
total = 0
for _ in range(16):
    total += u.update(0.75)
assert total == 12, total
v = Spawner(1.0)
assert v.update(0.75) == 0
v.interval = 0.25
assert v.update(0.25) == 1, "the new interval applies from the next spawn"
assert v.update(0.25) == 1
assert v.update(0.5) == 2
w = Spawner(0.25)
assert [w.update(0.0625) for _ in range(8)] == [0, 0, 0, 1, 0, 0, 0, 1]`,
      checks: ['The first spawn comes after one full interval, and `update` returns how many are due', 'A long frame returns several spawns, and the leftover time is kept (the timer gets the interval **added**, not reset)', 'Changing `interval` takes effect for the following spawns'],
      hint: 'Same shape as the predict question: `self.timer -= dt`, then `while self.timer <= 0: self.timer += self.interval; spawned += 1`.',
      explanation: 'Because overshoot is kept, sixteen frames of 0.75 seconds (12 seconds in all) give exactly 12 spawns at one per second. A spawner built this way behaves identically at any frame rate.',
    },
    {
      kind: 'code',
      prompt: 'Write `spawn_position(rng, width, height, margin)` that returns an `(x, y)` position **just outside** a `width` by `height` screen. Pick one of the four sides at random with `rng.randint(0, 3)` (0 = top, 1 = right, 2 = bottom, 3 = left). For the top and bottom sides, x is a random integer from 0 to `width` (use `rng.randint`) and y is `-margin` (top) or `height + margin` (bottom). For the left and right sides, y is a random integer from 0 to `height`, and x is `-margin` (left) or `width + margin` (right).',
      starter: `def spawn_position(rng, width, height, margin):
    ...
`,
      solution: `def spawn_position(rng, width, height, margin):
    side = rng.randint(0, 3)
    if side == 0:
        return (rng.randint(0, width), -margin)
    if side == 1:
        return (width + margin, rng.randint(0, height))
    if side == 2:
        return (rng.randint(0, width), height + margin)
    return (-margin, rng.randint(0, height))
`,
      tests: `import random
rng = random.Random(1234)
sides = set()
for _ in range(400):
    x, y = spawn_position(rng, 640, 360, 20)
    assert isinstance(x, int) and isinstance(y, int)
    if y == -20:
        sides.add("top")
        assert 0 <= x <= 640
    elif y == 380:
        sides.add("bottom")
        assert 0 <= x <= 640
    elif x == -20:
        sides.add("left")
        assert 0 <= y <= 360
    elif x == 660:
        sides.add("right")
        assert 0 <= y <= 360
    else:
        raise AssertionError((x, y))
    assert not (0 <= x <= 640 and 0 <= y <= 360), "outside the screen"
assert sides == {"top", "bottom", "left", "right"}, sides

class Fixed:
    def __init__(self, values):
        self.values = list(values)

    def randint(self, a, b):
        v = self.values.pop(0)
        assert a <= v <= b, (a, b, v)
        return v

assert spawn_position(Fixed([0, 100]), 800, 600, 10) == (100, -10)
assert spawn_position(Fixed([1, 250]), 800, 600, 10) == (810, 250)
assert spawn_position(Fixed([2, 799]), 800, 600, 10) == (799, 610)
assert spawn_position(Fixed([3, 5]), 800, 600, 10) == (-10, 5)
a = [spawn_position(random.Random(5), 640, 360, 20) for _ in range(3)]
assert a[0] == a[1] == a[2], "the same seed gives the same position"`,
      checks: ['Chooses one of four sides with `rng.randint(0, 3)` and a position along it with `rng.randint`', 'Every position is outside the screen but only `margin` pixels away', 'The generator is used as given, so a fixed sequence gives a fixed position'],
      hint: 'First `side = rng.randint(0, 3)`. Then an `if` for each side returning a tuple: along-the-edge coordinate from `rng.randint(0, width)` or `(0, height)`, and the other coordinate from the margin.',
      explanation: 'The test passes in a fake generator with a fixed list of answers: that is what taking `rng` as a parameter buys you. In the game you pass the real `random.Random(seed)`, and enemies enter from all around, always from just outside the visible area.',
    },
    {
      kind: 'code',
      prompt: 'Write `wave_plan(wave)` that returns a list of `(enemy_type, count)` pairs for the wave number (1, 2, 3, ...). Always `("grunt", 3 + 2 * (wave - 1))`; add `("tank", wave // 3)` only if that count is above 0; and add `("boss", 1)` last if the wave number is a multiple of 5. Write `pick_weighted(items, r)` where `items` is a list of `(name, weight)` and `r` is a number from 0.0 up to (not including) 1.0: scale `r` by the total weight, and return the first name whose **running total** is **greater than** that scaled value (return the last name if rounding leaves none).',
      starter: `def wave_plan(wave):
    ...


def pick_weighted(items, r):
    ...
`,
      solution: `def wave_plan(wave):
    plan = [("grunt", 3 + 2 * (wave - 1))]
    tanks = wave // 3
    if tanks > 0:
        plan.append(("tank", tanks))
    if wave % 5 == 0:
        plan.append(("boss", 1))
    return plan


def pick_weighted(items, r):
    total = sum(w for _, w in items)
    target = r * total
    running = 0
    for name, weight in items:
        running += weight
        if running > target:
            return name
    return items[-1][0]
`,
      tests: `assert wave_plan(1) == [("grunt", 3)]
assert wave_plan(2) == [("grunt", 5)]
assert wave_plan(3) == [("grunt", 7), ("tank", 1)]
assert wave_plan(5) == [("grunt", 11), ("tank", 1), ("boss", 1)]
assert wave_plan(6) == [("grunt", 13), ("tank", 2)]
assert wave_plan(10) == [("grunt", 21), ("tank", 3), ("boss", 1)]
total = [sum(c for _, c in wave_plan(w)) for w in range(1, 12)]
assert all(b > a for a, b in zip(total, total[1:])), total
items = [("common", 70), ("rare", 25), ("epic", 5)]
assert pick_weighted(items, 0.0) == "common"
assert pick_weighted(items, 0.69) == "common"
assert pick_weighted(items, 0.7) == "rare"
assert pick_weighted(items, 0.94) == "rare"
assert pick_weighted(items, 0.95) == "epic"
assert pick_weighted(items, 0.999) == "epic"
assert pick_weighted([("only", 3)], 0.5) == "only"
assert pick_weighted([("a", 1), ("b", 1)], 0.49) == "a"
assert pick_weighted([("a", 1), ("b", 1)], 0.5) == "b"
assert pick_weighted([("zero", 0), ("b", 2)], 0.0) == "b", "weight 0 is never picked"
counts = {"common": 0, "rare": 0, "epic": 0}
for i in range(1000):
    counts[pick_weighted(items, i / 1000)] += 1
assert counts == {"common": 700, "rare": 250, "epic": 50}, counts`,
      checks: ['`wave_plan` has grunts that grow by 2 per wave, tanks from wave 3, and a boss every fifth wave', '`pick_weighted` picks the first name whose running total passes `r * total`', 'Zero weights are never picked, and the shares match the weights over many values of `r`'],
      hint: 'For `pick_weighted`: `target = r * sum_of_weights`, keep a running total, and return the name as soon as `running > target`. Strictly greater, so that a weight-0 item is never chosen and boundaries go to the next item.',
      explanation: 'Both functions are pure, so the difficulty curve and the loot table can be examined without playing: change a number, run the tests, and see the new plan. In the game, `pick_weighted(items, rng.random())` gives the random part.',
    },
  ],
  takeaways: [
    'A **spawner** is a timer (`timer -= dt`) plus an interval. Use `while timer <= 0: timer += interval` so that a long frame spawns every due object and the overshoot is kept, keeping the rate exact at any frame rate.',
    'Use a `random.Random(seed)` **instance**, created once and passed around: a seed makes runs reproducible (for debugging, daily challenges and tests) and a fake generator makes spawn code testable.',
    '`randint(a, b)` includes both ends; `uniform` gives floats; `choice`, `choices(weights=...)`, `shuffle` and `sample` pick from collections. A chance is `rng.random() < p`.',
    'Shape randomness: spawn **outside** the screen, keep a safe distance from the player, and use weights so strong enemies are rare.',
    'Difficulty is a function from time or wave number to numbers (interval, speed, counts, types): write it as a plain function, such as `wave_plan(n)`, and you can tune and test it without playing.',
    'Keep spawning under control: cap the number alive, remove objects that leave the play area, and never create the generator inside the function that uses it.',
  ],
  reading: [
    { title: 'Python docs: random', url: 'https://docs.python.org/3/library/random.html', source: 'docs', note: 'Every function of the random module, and notes on seeding and reproducibility.' },
    { title: 'Game Programming Patterns: Object Pool', url: 'https://gameprogrammingpatterns.com/object-pool.html', source: 'book', note: 'Reusing objects instead of creating and discarding many.' },
    { title: 'Wikipedia: Dynamic game difficulty balancing', url: 'https://en.wikipedia.org/wiki/Dynamic_game_difficulty_balancing', source: 'wikipedia', note: 'How games adapt their challenge to the player.' },
  ],
};
