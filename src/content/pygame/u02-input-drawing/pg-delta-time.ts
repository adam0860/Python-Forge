import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-delta-time',
  title: 'Delta Time and Timers',
  summary: 'Make a game run at the same speed on every computer: measure the time of each frame, move in pixels per second, and build cooldowns and fixed timesteps on top.',
  minutes: 36,
  objectives: [
    'Explain why movement in "pixels per frame" depends on the machine, and how "pixels per second" fixes it',
    'Compute `dt` in seconds from `clock.tick()` and use it for movement',
    'Protect the game from huge `dt` values after a lag spike or a pause',
    'Build a cooldown timer driven by `dt` (for firing rate, invulnerability, animations)',
    'Describe the fixed-timestep accumulator for stable physics',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The speed that depended on the computer',
      blocks: [
        {
          type: 'p',
          text: 'So far, objects moved a fixed number of pixels per **frame**. With `clock.tick(60)` the game aims for 60 frames per second, so 4 pixels per frame is 240 pixels per second. But `tick(60)` is only a **limit**: it cannot make a slow computer faster. On a machine that manages 30 frames per second the object moves 120 pixels per second, half as fast. And on a 144 Hz monitor without a limit it moves more than twice as fast. The same game feels different on every computer.',
        },
        {
          type: 'table',
          headers: ['Frames per second', 'Movement of 4 pixels per frame', 'Movement of 240 pixels per second times dt'],
          rows: [
            ['30', '120 pixels per second (too slow)', '240 pixels per second'],
            ['60', '240 pixels per second', '240 pixels per second'],
            ['144', '576 pixels per second (too fast)', '240 pixels per second'],
          ],
          caption: 'The fix: express speeds per **second**, and multiply by the time the last frame took.',
        },
        {
          type: 'p',
          text: 'That time is called **delta time**, `dt`: the seconds since the previous frame. `clock.tick(60)` returns the milliseconds that passed since its previous call, so `dt = clock.tick(60) / 1000`. Then every movement is `position += velocity * dt`, where the velocity is in pixels per second. A long frame means a big `dt`, which means a big step: the object covers the same distance in the same real time.',
        },
        {
          type: 'code',
          title: 'dt_race.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

SPEED = 240
a = pygame.Vector2(0, 120)
b = pygame.Vector2(0, 240)
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    a.x += 4
    b.x += SPEED * dt
    a.x %= 640
    b.x %= 640

    screen.fill((20, 24, 48))
    pygame.draw.circle(screen, (240, 90, 90), a, 16)
    pygame.draw.circle(screen, (90, 200, 240), b, 16)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '7', text: 'The speed is now written in **pixels per second**, so it means the same thing on any machine.' },
            { lines: '13', text: '`clock.tick(60)` waits as needed, and returns the milliseconds since the last call. Dividing by 1000 converts to seconds: about 0.0167 at 60 frames per second.' },
            { lines: '18', text: 'The red circle moves a fixed 4 pixels every frame. Change `tick(60)` to `tick(30)` and it slows to half speed.' },
            { lines: '19', text: 'The blue circle moves `SPEED * dt`. At 30 frames per second `dt` is double, so each step is double, and the speed in real time stays the same.' },
            { lines: '20-21', text: 'Wrap both around the screen so the race goes on. Run it with different tick limits to see the red circle change speed and the blue one keep pace.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother, if I can just set 60 frames per second?',
          text: 'Because the limit is a ceiling, not a promise. A busy computer, a laptop on battery, a heavy explosion scene, or a 144 Hz screen will all give a different frame time. With delta time the **game plays the same**, and only the smoothness changes. Without it, a player with a slower computer plays a slower game, which is unfair in anything with a score.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A game moves a ship 5 pixels per frame, and has no frame limit. A friend’s computer runs it at 120 frames per second, yours at 60. What happens?',
      options: [
        { text: 'The ship moves twice as fast on your friend’s computer: 600 versus 300 pixels per second', correct: true, why: 'Twice as many frames per second means twice as many 5-pixel steps in each second.' },
        { text: 'The ship moves at the same speed on both, because the code is the same', why: 'The code is the same, but it runs a different number of times per second.' },
        { text: 'The ship moves twice as fast on **your** computer', why: 'It is the faster computer (more frames per second) that moves the ship further each second.' },
        { text: 'Python slows down the loop automatically to match', why: 'Python does not regulate the speed. That is what `clock.tick()` and `dt` are for.' },
      ],
      explanation: 'Speed per frame is speed per second divided by... nothing: it is multiplied by however many frames fit in a second. Use `velocity * dt` to take that out of the equation.',
    },
    {
      kind: 'truefalse',
      prompt: '`pygame.time.Clock().tick(60)` returns the number of **milliseconds** since the previous call, so you divide by 1000 to get seconds.',
      answer: true,
      explanation: 'True. At a steady 60 frames per second it returns about 16 or 17 (it is a whole number of milliseconds). Forgetting to divide by 1000 makes everything move a thousand times too far.',
    },
    {
      kind: 'concept',
      title: 'Taming dt',
      blocks: [
        {
          type: 'p',
          text: 'Delta time has two traps. The first is the **spike**: if the window is dragged, the game is paused in a debugger, or the disk stalls, one frame may take two seconds, and `dt` is 2.0. The player then jumps 480 pixels in one step, straight through walls. Protect the game by **limiting** it: `dt = min(dt, 0.05)`. Time then slows down during the stall instead of making a huge leap.',
        },
        {
          type: 'p',
          text: 'The second is the tick resolution: `tick` returns whole milliseconds, which is plenty for movement. For finer measurement use `pygame.time.get_ticks()` (milliseconds since `pygame.init()`), or `time.perf_counter()`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the lines that give frame-rate independent movement with a limited step.',
      template: `dt = clock.tick(60) / ___
dt = ___(dt, 0.05)
pos.x += SPEED * ___`,
      templateIsCode: true,
      blanks: [{ answers: ['1000'] }, { answers: ['min'] }, { answers: ['dt'] }],
      wordBank: ['1000', 'min', 'dt', 'max', '60', 'SPEED'],
      explanation: 'Milliseconds become seconds by dividing by 1000; `min(dt, 0.05)` caps a lag spike at 50 ms; and movement is speed (per second) times `dt`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A runner moves at 100 pixels per second. The frames took 0.5, 0.25 and 0.25 seconds. How far has it gone?',
      code: `x = 0
for dt in [0.5, 0.25, 0.25]:
    x += 100 * dt
print(x)`,
      answer: '100.0',
      hint: 'The dt values add up to one second.',
      explanation: 'The three frames add up to 1 second of real time, so the runner covered 100 pixels, however the time was split into frames: 50 + 25 + 25. That independence from the frame pattern is the whole point of delta time. (Python prints a float, `100.0`.)',
    },
    {
      kind: 'concept',
      title: 'Timers and fixed steps',
      blocks: [
        {
          type: 'p',
          text: 'Time also drives things that are not movement. A **cooldown** is a number of seconds that counts down: the gun cannot fire until it reaches zero. The same idea runs invulnerability after a hit, how long a power-up lasts, how often an enemy spawns and when an animation frame changes.',
        },
        {
          type: 'code',
          code: `class Cooldown:
    def __init__(self, duration):
        self.duration = duration
        self.remaining = 0.0

    @property
    def ready(self):
        return self.remaining <= 0

    def trigger(self):
        if not self.ready:
            return False
        self.remaining = self.duration
        return True

    def update(self, dt):
        self.remaining = max(0.0, self.remaining - dt)`,
          annotations: [
            { lines: '2-4', text: 'It starts ready (`remaining` is 0). `duration` is how long to wait after each use.' },
            { lines: '6-8', text: 'A `property` lets you write `gun.ready` without brackets, as if it were a plain value.' },
            { lines: '10-14', text: '`trigger` asks permission: if the timer is still running, answer `False` and do nothing; otherwise restart the timer and answer `True`.' },
            { lines: '16-17', text: '`update(dt)` counts down once per frame. `max(0.0, ...)` stops it from going negative.' },
          ],
        },
        {
          type: 'p',
          text: 'In the game: `gun.update(dt)` every frame, and `if keys[K_SPACE] and gun.trigger(): shoot()`. The gun fires at most once per `duration` seconds, on any computer, and holding the key down does not turn into a stream of bullets.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Fixed timestep for physics',
          text: 'Physics (gravity, bouncing, collisions) behaves best with a **constant** step, because results change with large steps. The common recipe is an accumulator: add `dt` to a store, and while the store holds at least one fixed step (say 1/120 second), run one physics update and subtract the step. The display runs at any rate; the physics always runs in identical steps. The last exercise below builds that loop.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The player flies off the screen at once when the game starts, moving a thousand times too far. Tap the line with the mistake.',
      lines: [
        'dt = clock.tick(60)',
        'speed = 200',
        'pos.x += speed * dt',
      ],
      linesAreCode: true,
      errorLines: [1],
      explanation: '`tick` returns **milliseconds** (about 16), but the speed is in pixels per **second**, so `dt` must be in seconds: `dt = clock.tick(60) / 1000`. With the bug, each frame moves `200 * 16 = 3200` pixels instead of 3.3.',
    },
    {
      kind: 'numeric',
      prompt: 'A lag spike makes one frame take 0.5 seconds. The ship moves at 300 pixels per second, and the game limits `dt` to at most 0.05. How many pixels does the ship move in that frame?',
      answer: '15',
      hint: 'The limited dt is 0.05, so 300 times 0.05.',
      explanation: '`min(0.5, 0.05)` is 0.05, so the ship moves 300 x 0.05 = 15 pixels, a normal-sized step. Without the cap it would move 150 pixels and could skip over a thin wall. The price is that game time runs slow for that one frame, which nobody notices.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: time as data',
      blocks: [
        {
          type: 'p',
          text: 'A frame’s time is just a number, so everything here can be tested by passing in the `dt` values you want. That is the great benefit of delta time: a test can play one minute of "game time" in an instant.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `clamp_dt(dt, max_dt)` that returns `dt` limited to at most `max_dt` (and never below 0). Write `advance(pos, vel, dt)` that returns the new `(x, y)` tuple after moving with velocity `vel` (a pair in units per second) for `dt` seconds. Write `distance_travelled(speed, frame_times)` that returns the total distance covered by an object at `speed` units per second over the frames whose durations are in the list `frame_times` (in seconds).',
      starter: `def clamp_dt(dt, max_dt):
    ...


def advance(pos, vel, dt):
    ...


def distance_travelled(speed, frame_times):
    ...
`,
      solution: `def clamp_dt(dt, max_dt):
    return max(0.0, min(dt, max_dt))


def advance(pos, vel, dt):
    return (pos[0] + vel[0] * dt, pos[1] + vel[1] * dt)


def distance_travelled(speed, frame_times):
    total = 0.0
    for dt in frame_times:
        total += speed * dt
    return total
`,
      tests: `assert clamp_dt(0.016, 0.05) == 0.016
assert clamp_dt(0.5, 0.05) == 0.05
assert clamp_dt(-1, 0.05) == 0
assert clamp_dt(0.05, 0.05) == 0.05
assert advance((0, 0), (100, 0), 0.5) == (50.0, 0.0)
assert advance((10, 20), (-8, 4), 0.25) == (8.0, 21.0)
assert advance((3, 4), (100, 100), 0) == (3, 4)
a = distance_travelled(240, [0.25] * 4)
b = distance_travelled(240, [0.125] * 8)
c = distance_travelled(240, [0.5, 0.25, 0.25])
assert a == b == c == 240.0, "same time, same distance, however it is split"
assert distance_travelled(100, []) == 0
assert round(distance_travelled(240, [1 / 60] * 60), 6) == 240
assert round(distance_travelled(240, [1 / 30] * 30), 6) == 240`,
      checks: ['`clamp_dt` limits `dt` to the range 0 to `max_dt`', '`advance` moves each coordinate by velocity times `dt`', '`distance_travelled` gives the same total however the same total time is split into frames'],
      hint: '`max(0.0, min(dt, max_dt))` limits to the range. For `distance_travelled`, add `speed * dt` for each frame time in the list (or use `speed * sum(frame_times)`).',
      explanation: 'The last test is the idea in one line: 60 frames of 1/60 second and 30 frames of 1/30 second both give 240 units at 240 units per second. A game written this way plays identically on both machines.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Cooldown` as in the lesson, with a `duration` given when it is created. `ready` is a property: `True` when no time remains. A new cooldown starts ready. `trigger()` returns `False` (doing nothing) if the cooldown is not ready, otherwise it starts the cooldown and returns `True`. `update(dt)` reduces the time remaining by `dt` (but not below 0).',
      starter: `class Cooldown:
    def __init__(self, duration):
        ...

    @property
    def ready(self):
        ...

    def trigger(self):
        ...

    def update(self, dt):
        ...
`,
      solution: `class Cooldown:
    def __init__(self, duration):
        self.duration = duration
        self.remaining = 0.0

    @property
    def ready(self):
        return self.remaining <= 0

    def trigger(self):
        if not self.ready:
            return False
        self.remaining = self.duration
        return True

    def update(self, dt):
        self.remaining = max(0.0, self.remaining - dt)
`,
      tests: `gun = Cooldown(0.5)
assert gun.ready is True
assert gun.trigger() is True
assert gun.ready is False
assert gun.trigger() is False, "still cooling down"
gun.update(0.25)
assert gun.ready is False and gun.trigger() is False
gun.update(0.25)
assert gun.ready is True, "exactly the duration is enough"
assert gun.trigger() is True
gun.update(10)
assert gun.ready is True and gun.remaining == 0.0, "never negative"
shots = 0
gun = Cooldown(0.5)
for frame in range(120):
    gun.update(1 / 60)
    if gun.trigger():
        shots += 1
assert shots in (4, 5), shots
gun = Cooldown(1)
fired = []
for frame in range(8):
    gun.update(0.5)
    fired.append(gun.trigger())
assert fired == [True, False, True, False, True, False, True, False], fired`,
      checks: ['A new cooldown is ready; `trigger` starts it and returns `True`, or returns `False` when not ready', '`update` counts down but never below 0, and exactly `duration` seconds is enough', 'Over time the number of successful triggers follows the duration, whatever the frame rate'],
      hint: 'Keep `self.remaining` (seconds left). `ready` is `self.remaining <= 0`. In `trigger`, return `False` early when not ready; otherwise set `remaining = duration`.',
      explanation: 'A gun that fires every half second works the same at any frame rate, because the cooldown counts **seconds**, not frames. The same small class handles invulnerability after damage, ability recharge and spawn delays.',
    },
    {
      kind: 'code',
      prompt: 'Write `fixed_steps(accumulator, dt, step)` for a fixed-timestep loop. Add `dt` to `accumulator`, then count how many whole `step`s fit in it, and subtract them. Return `(steps, remaining)`: the number of fixed updates to run now and the leftover time to carry to the next frame. (Use values that are exact in binary, such as 0.25, in your thinking: avoid expecting a precise answer from messy decimals.)',
      starter: `def fixed_steps(accumulator, dt, step):
    ...
`,
      solution: `def fixed_steps(accumulator, dt, step):
    accumulator += dt
    steps = 0
    while accumulator >= step:
        accumulator -= step
        steps += 1
    return steps, accumulator
`,
      tests: `assert fixed_steps(0, 0.25, 0.25) == (1, 0.0)
assert fixed_steps(0, 0.125, 0.25) == (0, 0.125)
assert fixed_steps(0.125, 0.125, 0.25) == (1, 0.0)
assert fixed_steps(0.0, 1.0, 0.25) == (4, 0.0)
assert fixed_steps(0.125, 0.5, 0.25) == (2, 0.125)
assert fixed_steps(0, 0, 0.25) == (0, 0)
acc = 0.0
total_steps = 0
for dt in [0.125, 0.25, 0.125, 0.5, 0.0, 0.125]:
    n, acc = fixed_steps(acc, dt, 0.25)
    total_steps += n
assert total_steps == 4 and acc == 0.125, (total_steps, acc)
acc, steps60, steps30 = 0.0, 0, 0
for _ in range(64):
    n, acc = fixed_steps(acc, 1 / 64, 1 / 16)
    steps60 += n
for _ in range(16):
    n, acc = fixed_steps(acc, 1 / 16, 1 / 16)
    steps30 += n
assert steps60 == 16 and steps30 == 16, "same physics steps whatever the display rate"`,
      checks: ['Adds `dt` to the accumulator and subtracts whole steps while there is enough time', 'Returns the number of steps and the leftover time', 'The total number of steps over a second is the same whether the frames are short or long'],
      hint: 'A `while accumulator >= step:` loop that subtracts `step` and counts. Return the count and what is left.',
      explanation: 'Fast displays run 0 or 1 physics steps per frame; slow ones run several in a row to catch up. The physics sees the identical step every time, so a jump has the same height on every computer. This is the loop used by serious engines, in about six lines.',
    },
  ],
  takeaways: [
    'Movement in **pixels per frame** depends on the machine; movement in **pixels per second** multiplied by `dt` does not. `pos += vel * dt`.',
    '`dt = clock.tick(60) / 1000`: `tick` returns milliseconds since the last call, so divide by 1000 for seconds. Forgetting that is a thousand-fold error.',
    'Limit the step: `dt = min(dt, 0.05)` so that one long frame (a drag, a pause) cannot teleport objects through walls.',
    'A **cooldown** is a number of seconds counting down with `dt`; `trigger()` only succeeds when it has reached 0. It governs firing, invulnerability, power-ups and spawning, on every machine.',
    'For stable physics use a **fixed timestep**: add `dt` to an accumulator, run a fixed-size update while it holds a whole step, and carry the leftover over.',
    'Because `dt` is just a number passed in, time-based code is easy to test: feed it a list of frame durations and check the result.',
  ],
  reading: [
    { title: 'pygame docs: pygame.time.Clock', url: 'https://www.pygame.org/docs/ref/time.html#pygame.time.Clock', source: 'docs', note: 'tick, tick_busy_loop, get_time and get_fps.' },
    { title: 'Fix Your Timestep!', url: 'https://gafferongames.com/post/fix_your_timestep/', source: 'article', note: 'The accumulator pattern explained, with the reasons fixed steps matter for physics.' },
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'Fixed and variable time steps compared, with their problems.' },
  ],
};
