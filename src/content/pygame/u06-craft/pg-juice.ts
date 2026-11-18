import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-juice',
  title: 'Game Feel: Easing, Particles and Screen Shake',
  summary: 'Small bursts of feedback make a game feel alive. Learn easing curves, a tween that animates any number, screen shake that fades out, and a particle system.',
  minutes: 40,
  objectives: [
    'Explain "juice" and name the common feedback effects: easing, particles, shake, flashes and pauses',
    'Write easing functions that reshape `t` from 0 to 1, and use them to tween a value between two numbers',
    'Build a screen shake whose strength fades out over its duration, with the random numbers passed in',
    'Build a particle system that spawns, moves, fades and removes particles',
    'Pass the random generator in so that effects can be tested with exact numbers',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What is "juice"?',
      blocks: [
        {
          type: 'p',
          text: 'Two games can have identical rules and feel completely different. In one, a coin simply vanishes and the score ticks up. In the other, the coin pops, a sparkle bursts, the number bounces, and a sound rings. Designers call this layer of feedback **juice** (or "game feel"): small effects that confirm to the player that something happened, and that it mattered. It costs no gameplay logic at all, and it is often the difference between a prototype and a game people enjoy.',
        },
        {
          type: 'table',
          headers: ['Effect', 'What the player sees', 'The idea behind it'],
          rows: [
            ['**Easing / tweening**', 'Things speed up and slow down smoothly: a menu slides in, a number counts up', 'Reshape time: move by `ease(t)` instead of `t`'],
            ['**Particles**', 'Sparks, dust, smoke, confetti', 'Many tiny short-lived objects with simple physics'],
            ['**Screen shake**', 'The whole picture trembles for an instant when something heavy happens', 'Offset the drawing by a random amount that decays'],
            ['**Flash / squash**', 'A hit enemy flashes white; a landing character squashes', 'Briefly change colour or scale, then ease back'],
            ['**Hit-stop**', 'The game freezes for a few frames on a strong hit', 'Skip `update` for about 0.05 seconds'],
            ['**Sound and music**', 'A matching sound for every action', 'Triggered from the same event'],
          ],
          caption: 'Each effect is small. The craft is using a little of each, at the right moment.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why separate juice from game logic?',
          text: 'Juice should only **decorate** what the logic has already decided. If a shake or particle effect changed the score or a position that matters, bugs would creep in, and you could not switch effects off for an accessibility option. Keep them as separate objects fed by events ("enemy died here"), and the game plays identically with or without them.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A player hits an enemy. Which of these is an example of **juice** rather than a gameplay change?',
      options: [
        { text: 'A brief screen shake, a white flash on the enemy and a burst of sparks', correct: true, why: 'These only give feedback about what already happened.' },
        { text: 'The enemy now takes twice as much damage', why: 'That changes the rules of the game (balance).' },
        { text: 'A new, faster enemy type appears', why: 'New content is gameplay.' },
        { text: 'The player gets an extra life', why: 'That changes the game state.' },
      ],
      explanation: 'Juice is feedback: it leaves the rules alone and changes only how the result is presented.',
    },
    {
      kind: 'truefalse',
      prompt: 'An easing function changes **how fast** something moves along the way, but not where it starts or where it ends.',
      answer: true,
      explanation: 'True. Every easing function maps 0 to 0 and 1 to 1. Between them it bends the curve: "ease in" starts slowly, "ease out" ends slowly, and "ease in-out" does both. The start and end positions never change.',
    },
    {
      kind: 'concept',
      title: 'Pop, burst, shake',
      blocks: [
        {
          type: 'p',
          text: 'The program below combines three effects. Click anywhere (or press Space) and: a blue circle **pops** (it jumps to 1.5 times its size and eases back with an ease-out curve), thirty **particles** burst from the pointer and fall with gravity as they fade, and the whole scene **shakes** for 0.3 seconds with a strength that fades to nothing.',
        },
        {
          type: 'code',
          title: 'juice_demo.py',
          desktopOnly: true,
          code: `import math
import random

import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
rng = random.Random(7)

SHAKE_TIME, SHAKE_POWER = 0.3, 10
POP_TIME = 0.25


def ease_out_cubic(t):
    return 1 - (1 - t) ** 3


class Particle:
    def __init__(self, x, y):
        angle = rng.uniform(0, math.tau)
        speed = rng.uniform(60, 240)
        self.x, self.y = x, y
        self.vx = math.cos(angle) * speed
        self.vy = math.sin(angle) * speed
        self.max_life = rng.uniform(0.4, 0.9)
        self.life = self.max_life

    def update(self, dt):
        self.vy += 300 * dt
        self.x += self.vx * dt
        self.y += self.vy * dt
        self.life -= dt

    def draw(self, surface, offset):
        t = max(0.0, self.life / self.max_life)
        radius = max(1, int(5 * t))
        color = (255, int(80 + 175 * t), 40)
        center = (int(self.x + offset[0]), int(self.y + offset[1]))
        pygame.draw.circle(surface, color, center, radius)


particles = []
shake_left = 0.0
pop_left = 0.0

running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.MOUSEBUTTONDOWN or (
            event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE
        ):
            x, y = pygame.mouse.get_pos()
            particles.extend(Particle(x, y) for _ in range(30))
            shake_left = SHAKE_TIME
            pop_left = POP_TIME

    shake_left = max(0.0, shake_left - dt)
    pop_left = max(0.0, pop_left - dt)
    for p in particles:
        p.update(dt)
    particles = [p for p in particles if p.life > 0]

    if shake_left > 0:
        power = SHAKE_POWER * shake_left / SHAKE_TIME
        offset = (rng.uniform(-power, power), rng.uniform(-power, power))
    else:
        offset = (0.0, 0.0)
    settle = ease_out_cubic(1 - pop_left / POP_TIME)
    radius = int(40 * (1.5 - 0.5 * settle))

    screen.fill((20, 24, 32))
    center = (int(320 + offset[0]), int(180 + offset[1]))
    pygame.draw.circle(screen, (90, 200, 240), center, radius)
    for p in particles:
        p.draw(screen, offset)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '15-16', text: 'An easing function takes `t` from 0 to 1 and returns a reshaped value from 0 to 1. This one is "ease out cubic": fast at first, gently slowing to a stop.' },
            { lines: '20-27', text: 'Each particle gets a random direction and speed (`math.tau` is a full turn in radians), a velocity from sine and cosine, and a random lifetime.' },
            { lines: '29-33', text: 'Particles fall with gravity (300 pixels per second squared), move by velocity times `dt`, and lose life.' },
            { lines: '35-40', text: 'As life runs out, `t` falls from 1 to 0: the particle shrinks and its colour goes from yellow towards red.' },
            { lines: '53-59', text: 'The effect timers are set when the click happens: thirty particles, a new shake, a new pop. Each is just a number counted down.' },
            { lines: '61-65', text: 'Counting down each frame; dead particles (`life <= 0`) are filtered out by building a new list.' },
            { lines: '67-71', text: 'Shake: the strength `SHAKE_POWER * shake_left / SHAKE_TIME` falls linearly from 10 pixels to 0, and the offset is a random pair within that strength.' },
            { lines: '72-73', text: 'Pop: `1 - pop_left / POP_TIME` goes from 0 to 1 over the effect; easing it with `ease_out_cubic` makes the circle shrink back from 1.5 times to 1 times its size, fast at first and slowing down.' },
            { lines: '75-79', text: 'Everything drawn with the same `offset`, so the whole scene shakes together.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Less is more',
          text: 'Juice works because it is brief and matched to the importance of the event. A small pickup deserves a small sparkle; a boss death can have the shake, the freeze and the fireworks. If everything shakes, nothing feels special, and some players find constant shake uncomfortable, so offer an option to turn it down.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the three lines of a tween: the fraction of time, an ease-out curve, and the final value.',
      template: `t = ___(1.0, elapsed / duration)
eased = 1 - (1 - t) ___ 3
x = start + (end - start) * ___`,
      templateIsCode: true,
      blanks: [{ answers: ['min'] }, { answers: ['**'] }, { answers: ['eased'] }],
      wordBank: ['min', 'max', '**', '*', 'eased', 't'],
      explanation: '`min(1.0, ...)` stops `t` at 1 when the time is up, `(1 - t) ** 3` is the cubic part of "ease out", and the eased fraction, not the raw `t`, interpolates between the start and the end.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. "Ease out quad" is sampled at five equal steps of time. (All the numbers are exact in binary, so the printed values are tidy.)',
      code: `def ease_out_quad(t):
    return 1 - (1 - t) ** 2


print([ease_out_quad(t / 4) for t in range(5)])`,
      answer: '[0.0, 0.4375, 0.75, 0.9375, 1.0]',
      hint: 'For t = 0.25: 1 - 0.75 squared = 1 - 0.5625.',
      explanation: 'The steps of progress are 0, 0.4375, 0.75, 0.9375 and 1: bigger at the start (0.4375) and smaller at the end (0.0625), so the motion slows as it arrives. That is exactly what "ease out" means.',
    },
    {
      kind: 'concept',
      title: 'Curves, decay and testable randomness',
      blocks: [
        {
          type: 'p',
          text: '**Easing.** Linear motion (`value = start + (end - start) * t`) looks mechanical, because nothing in the real world starts and stops instantly. An easing function bends `t` before it is used. A few that cover most needs, for `t` between 0 and 1:',
        },
        {
          type: 'table',
          headers: ['Name', 'Formula', 'Feels like'],
          rows: [
            ['`linear`', '`t`', 'Constant speed'],
            ['`in_quad`', '`t * t`', 'Starts slowly, speeds up (a falling object)'],
            ['`out_quad`', '`1 - (1 - t) ** 2`', 'Starts fast, slows to a stop (a thrown object landing)'],
            ['`in_out_quad`', '`2 * t * t` for t below 0.5, else `1 - (-2 * t + 2) ** 2 / 2`', 'Slow, fast, slow (a sliding panel)'],
            ['`in_cubic` / `out_cubic`', '`t ** 3` and `1 - (1 - t) ** 3`', 'The same, more pronounced'],
          ],
          caption: 'All are 0 at the start and 1 at the end. Always clamp `t` into 0..1 first.',
        },
        {
          type: 'p',
          text: 'A **tween** is a small object that animates a number: it holds a start, an end, a duration and the elapsed time, advances with `dt`, and reports `value` and `done`. Use it for anything: a position, a scale, an opacity, a volume, a score counting up.',
        },
        {
          type: 'p',
          text: '**Decay.** Shake and flashes both fade. The strength is `intensity * time_left / duration`: full strength when it starts, zero when time is up, linear in between. For a more natural feel, square the fraction. **Testable randomness.** Effects use random numbers, which make exact tests impossible, unless the random generator is **passed in**. Your code calls `rng.uniform(a, b)`; the game passes a real `random.Random`, and a test passes a tiny fake that returns known values.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why pass `rng` in instead of importing `random`?',
          text: 'A function that calls the global `random.uniform` has a hidden input you cannot control. A function that **receives** its generator is deterministic whenever you want it to be: a seeded `random.Random(7)` gives the same shake every run (handy for replays and bug reports), and a fake gives exact values for a test. It is the same dependency-passing idea as the asset loader.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Creating an "instant" effect with a duration of zero crashes the game with `ZeroDivisionError: float division by zero`. Tap the line responsible.',
      lines: [
        'def tween(start, end, elapsed, duration):',
        '    t = min(1.0, elapsed / duration)',
        '    return start + (end - start) * t',
        'print(tween(0, 100, 0.0, 0.0))',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'When `duration` is 0, `elapsed / duration` divides by zero. Handle the instant case first: `if duration <= 0: return end`. Any effect whose duration is configured by a designer needs this guard.',
    },
    {
      kind: 'numeric',
      prompt: 'A screen shake starts with 12 pixels of strength and lasts 0.6 seconds, fading linearly. After 0.45 seconds have passed, what is the strength in pixels (`intensity * time_left / duration`)?',
      answer: '3',
      hint: 'The time left is 0.6 - 0.45 = 0.15 seconds.',
      explanation: '`12 * 0.15 / 0.6 = 3`: a quarter of the original strength, because a quarter of the time is left. The offset is then random within plus or minus 3 pixels.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the effects',
      blocks: [
        {
          type: 'p',
          text: 'You will write the easing functions and a tween, a decaying shake, and a particle system. Random numbers always come from a passed-in `rng`, and the tests use fakes, so every number is exact. Time steps are 0.25 and 0.5, which are exact in binary.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `ease(name, t)` returning the eased value for these names: `"linear"` (`t`), `"in_quad"` (`t*t`), `"out_quad"` (`1 - (1-t)**2`), `"in_out_quad"` (`2*t*t` when `t < 0.5`, else `1 - (-2*t + 2)**2 / 2`), `"in_cubic"` (`t**3`), `"out_cubic"` (`1 - (1-t)**3`). `t` is first **clamped** to 0..1. An unknown name raises `ValueError`. Then write `tween(start, end, t, name="linear")` returning `start + (end - start) * ease(name, t)`. Finally write a class `Tween(start, end, duration, ease_name="linear")` with `elapsed` (starts 0), `update(dt)` (adds `dt`, never beyond `duration`), `value` (the tweened value at the current time) and `done` (`True` when `elapsed >= duration`). A duration of 0 or less is done at once, and its value is `end`.',
      starter: `def ease(name, t):
    ...


def tween(start, end, t, name="linear"):
    ...


class Tween:
    def __init__(self, start, end, duration, ease_name="linear"):
        ...

    def update(self, dt):
        ...

    @property
    def value(self):
        ...

    @property
    def done(self):
        ...
`,
      solution: `def ease(name, t):
    t = max(0.0, min(1.0, t))
    if name == "linear":
        return t
    if name == "in_quad":
        return t * t
    if name == "out_quad":
        return 1 - (1 - t) ** 2
    if name == "in_out_quad":
        if t < 0.5:
            return 2 * t * t
        return 1 - (-2 * t + 2) ** 2 / 2
    if name == "in_cubic":
        return t ** 3
    if name == "out_cubic":
        return 1 - (1 - t) ** 3
    raise ValueError("unknown easing: " + name)


def tween(start, end, t, name="linear"):
    return start + (end - start) * ease(name, t)


class Tween:
    def __init__(self, start, end, duration, ease_name="linear"):
        self.start = start
        self.end = end
        self.duration = duration
        self.ease_name = ease_name
        self.elapsed = 0.0

    def update(self, dt):
        self.elapsed = min(self.duration, self.elapsed + dt)

    @property
    def done(self):
        return self.elapsed >= self.duration

    @property
    def value(self):
        if self.duration <= 0:
            return self.end
        return tween(self.start, self.end, self.elapsed / self.duration, self.ease_name)
`,
      tests: `names = ["linear", "in_quad", "out_quad", "in_out_quad", "in_cubic", "out_cubic"]
for n in names:
    assert ease(n, 0) == 0 and ease(n, 1) == 1, n
assert ease("linear", 0.25) == 0.25
assert ease("in_quad", 0.5) == 0.25
assert ease("out_quad", 0.5) == 0.75
assert ease("in_out_quad", 0.25) == 0.125
assert ease("in_out_quad", 0.5) == 0.5
assert ease("in_out_quad", 0.75) == 0.875
assert ease("in_cubic", 0.5) == 0.125
assert ease("out_cubic", 0.5) == 0.875
assert ease("out_quad", -3) == 0 and ease("in_quad", 7) == 1, "t is clamped"
try:
    ease("bouncy", 0.5)
    assert False, "an unknown name must raise"
except ValueError:
    pass
assert tween(10, 20, 0.5) == 15.0
assert tween(0, 100, 0.5, "in_quad") == 25.0
assert tween(100, 0, 0.5, "out_quad") == 25.0
assert tween(0, 10, 5) == 10 and tween(0, 10, -1) == 0
t = Tween(0, 100, 2.0)
assert t.value == 0.0 and t.done is False and t.elapsed == 0.0
t.update(0.5)
assert t.value == 25.0
t.update(1.0)
assert t.value == 75.0 and t.done is False
t.update(1.0)
assert t.value == 100.0 and t.done is True and t.elapsed == 2.0, "elapsed stops at the duration"
t.update(5)
assert t.value == 100.0 and t.elapsed == 2.0
q = Tween(0, 100, 1.0, "in_quad")
q.update(0.5)
assert q.value == 25.0
z = Tween(5, 9, 0)
assert z.done is True and z.value == 9
z.update(1)
assert z.value == 9
d = Tween(200, 100, 1.0)
d.update(0.25)
assert d.value == 175.0, "a tween can run downwards"`,
      checks: ['Every easing returns 0 at 0 and 1 at 1, and `t` is clamped before use', 'An unknown easing name raises `ValueError`', '`Tween` advances with `dt`, stops at the duration, and handles a zero duration without dividing by zero'],
      hint: 'Clamp with `max(0.0, min(1.0, t))` at the top of `ease`, then one `if` per name, and a `raise ValueError` at the end. In `Tween.value` check `self.duration <= 0` first.',
      explanation: 'Any number in your game can now be animated: a menu’s x position, a sprite’s scale, a volume fade. The `Tween` holds no game knowledge at all; you ask it for `value` each frame. The zero-duration guard is the fix for the error question above.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Shake` for screen shake. It starts idle: `intensity`, `duration` and `time_left` are all `0`. `start(intensity, duration)` sets them and fills `time_left` with the `duration`. `update(dt)` reduces `time_left` by `dt`, never below 0. `offset(rng)` returns `(0, 0)` when `time_left <= 0`; otherwise the strength `m = intensity * time_left / duration` and the pair `(rng.uniform(-m, m), rng.uniform(-m, m))`, with the x value drawn **first**.',
      starter: `class Shake:
    def __init__(self):
        ...

    def start(self, intensity, duration):
        ...

    def update(self, dt):
        ...

    def offset(self, rng):
        ...
`,
      solution: `class Shake:
    def __init__(self):
        self.intensity = 0
        self.duration = 0
        self.time_left = 0

    def start(self, intensity, duration):
        self.intensity = intensity
        self.duration = duration
        self.time_left = duration

    def update(self, dt):
        self.time_left = max(0, self.time_left - dt)

    def offset(self, rng):
        if self.time_left <= 0:
            return (0, 0)
        m = self.intensity * self.time_left / self.duration
        x = rng.uniform(-m, m)
        y = rng.uniform(-m, m)
        return (x, y)
`,
      tests: `class MaxRng:
    def __init__(self):
        self.calls = []

    def uniform(self, a, b):
        self.calls.append((a, b))
        return b

class MinRng(MaxRng):
    def uniform(self, a, b):
        self.calls.append((a, b))
        return a

s = Shake()
assert (s.intensity, s.duration, s.time_left) == (0, 0, 0)
assert s.offset(MaxRng()) == (0, 0), "idle: no offset, and no division by zero"
s.start(8, 0.5)
assert (s.intensity, s.duration, s.time_left) == (8, 0.5, 0.5)
r = MaxRng()
assert s.offset(r) == (8.0, 8.0)
assert r.calls == [(-8.0, 8.0), (-8.0, 8.0)], "the range is plus or minus the strength"
s.update(0.25)
r = MaxRng()
assert s.offset(r) == (4.0, 4.0), "half the time left: half the strength"
assert r.calls == [(-4.0, 4.0), (-4.0, 4.0)]
assert s.offset(MinRng()) == (-4.0, -4.0)
s.update(0.25)
assert s.time_left == 0 and s.offset(MaxRng()) == (0, 0)
s.update(5)
assert s.time_left == 0, "never below zero"
s.start(12, 1.0)
s.update(0.75)
assert s.offset(MaxRng()) == (3.0, 3.0)
s.start(2, 4.0)
assert s.time_left == 4.0 and s.offset(MaxRng()) == (2.0, 2.0), "starting again replaces the old shake"

class Pair:
    def __init__(self):
        self.values = [1.5, -2.5]

    def uniform(self, a, b):
        return self.values.pop(0)

s.start(10, 1.0)
assert s.offset(Pair()) == (1.5, -2.5), "x is drawn first, then y"`,
      checks: ['`offset` is `(0, 0)` when no time is left, with no division by zero', 'The strength is `intensity * time_left / duration`, and each axis uses `rng.uniform(-m, m)`', '`update` never takes `time_left` below 0, and `start` replaces any running shake'],
      hint: '`update`: `self.time_left = max(0, self.time_left - dt)`. In `offset`, return early when `self.time_left <= 0`; then compute `m` and call `rng.uniform(-m, m)` twice, x first.',
      explanation: 'Because the random generator is a parameter, the test could use fakes that always return the largest or smallest value and check the numbers **exactly**. In the game you pass a real `random.Random`, and the same code shakes the screen.',
    },
    {
      kind: 'code',
      prompt: 'Write a `Particle(x, y, vx, vy, life)` class with a `max_life` (the starting `life`) and a property `alpha`: `int(255 * max(0.0, life) / max_life)`. Then write `ParticleSystem` with a list `particles`, `emit(x, y, count, rng, speed=100, life=1.0)` (adds `count` particles at `(x, y)`; for each one, `vx = rng.uniform(-speed, speed)` is drawn first and then `vy = rng.uniform(-speed, speed)`), `update(dt, gravity=0.0)` (for each particle: `vy += gravity * dt`, then `x += vx * dt`, `y += vy * dt`, `life -= dt`; afterwards **remove** particles with `life <= 0`) and `__len__`.',
      starter: `class Particle:
    def __init__(self, x, y, vx, vy, life):
        ...

    @property
    def alpha(self):
        ...


class ParticleSystem:
    def __init__(self):
        ...

    def emit(self, x, y, count, rng, speed=100, life=1.0):
        ...

    def update(self, dt, gravity=0.0):
        ...

    def __len__(self):
        ...
`,
      solution: `class Particle:
    def __init__(self, x, y, vx, vy, life):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.life = life
        self.max_life = life

    @property
    def alpha(self):
        return int(255 * max(0.0, self.life) / self.max_life)


class ParticleSystem:
    def __init__(self):
        self.particles = []

    def emit(self, x, y, count, rng, speed=100, life=1.0):
        for _ in range(count):
            vx = rng.uniform(-speed, speed)
            vy = rng.uniform(-speed, speed)
            self.particles.append(Particle(x, y, vx, vy, life))

    def update(self, dt, gravity=0.0):
        for p in self.particles:
            p.vy += gravity * dt
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.life -= dt
        self.particles = [p for p in self.particles if p.life > 0]

    def __len__(self):
        return len(self.particles)
`,
      tests: `class Seq:
    def __init__(self, values):
        self.values = list(values)
        self.ranges = []

    def uniform(self, a, b):
        self.ranges.append((a, b))
        return self.values.pop(0)

p = Particle(1, 2, 3, 4, 2.0)
assert (p.x, p.y, p.vx, p.vy, p.life, p.max_life) == (1, 2, 3, 4, 2.0, 2.0)
assert p.alpha == 255
p.life = 1.0
assert p.alpha == 127
p.life = -0.5
assert p.alpha == 0, "a dead particle is never negative"

ps = ParticleSystem()
assert len(ps) == 0 and ps.particles == []
rng = Seq([10, -20, 30, 40])
ps.emit(100, 50, 2, rng, speed=50, life=1.0)
assert len(ps) == 2
assert rng.ranges == [(-50, 50)] * 4, "vx then vy for each particle, within plus or minus speed"
a, b = ps.particles
assert (a.vx, a.vy, b.vx, b.vy) == (10, -20, 30, 40)
assert (a.x, a.y, a.life) == (100, 50, 1.0)
ps.update(0.25)
assert (a.x, a.y, a.life) == (102.5, 45.0, 0.75)
assert (b.x, b.y, b.life) == (107.5, 60.0, 0.75)
assert a.alpha == 191
ps.update(0.25, gravity=40)
assert a.vy == -10.0 and a.y == 42.5 and a.x == 105.0
assert b.vy == 50.0 and b.y == 72.5
assert len(ps) == 2
ps.update(0.5)
assert len(ps) == 0 and ps.particles == [], "both reached the end of their life"
ps.emit(0, 0, 0, Seq([]))
assert len(ps) == 0
c = ParticleSystem()
c.emit(0, 0, 1, Seq([8, 8]), life=0.25)
d = ParticleSystem()
d.emit(0, 0, 1, Seq([8, 8]), life=0.5)
c.update(0.25)
d.update(0.25)
assert len(c) == 0 and len(d) == 1, "life 0.25 is used up after 0.25 s"
assert d.particles[0].alpha == 127`,
      checks: ['`emit` draws `vx` then `vy` from `rng.uniform(-speed, speed)` for each particle', '`update` applies gravity before moving, ages the particle, and removes those with `life <= 0`', '`alpha` falls from 255 to 0 with the remaining life and is never negative'],
      hint: 'In `update`, loop over `self.particles` doing the four updates in order, then rebuild the list with `[p for p in self.particles if p.life > 0]`.',
      explanation: 'A particle system is the whole trick behind explosions, smoke, rain and confetti: many tiny objects with a few numbers each, updated by one loop. Rebuilding the list (rather than removing while looping) is the safe way to delete from it, and the game’s `draw` simply reads `p.alpha` for the fade.',
    },
  ],
  takeaways: [
    '**Juice** is feedback that confirms that something happened: easing, particles, screen shake, flashes, hit-stop and sound. It decorates the game’s logic and should never change it.',
    'An **easing function** reshapes `t` (0 to 1) but keeps 0 at 0 and 1 at 1: `t * t` eases in, `1 - (1 - t) ** 2` eases out. Always clamp `t` first.',
    'A **tween** holds start, end, duration and elapsed time, and reports a `value` and `done`. It can animate any number: a position, a scale, an opacity, a score.',
    '**Screen shake** is a random offset applied to everything drawn, with a strength that decays: `intensity * time_left / duration`. Offer a way to reduce it.',
    'A **particle system** is a list of small objects with position, velocity and life; one loop updates them, and those whose life has run out are removed by rebuilding the list.',
    '**Pass the random generator in** (`rng.uniform`) so effects are deterministic when you want them to be (seeded replays, tests with fakes), and guard divisions by a duration of zero.',
  ],
  reading: [
    { title: 'easings.net: easing functions cheat sheet', url: 'https://easings.net/', source: 'tutorial', note: 'Pictures and formulas for dozens of easing curves; copy the ones you like.' },
    { title: 'Juice it or lose it (GDC talk)', url: 'https://www.youtube.com/watch?v=Fy0aCDmgnxg', source: 'video', note: 'The classic demonstration of how feedback effects transform a plain Breakout clone.' },
    { title: 'Python docs: random.Random', url: 'https://docs.python.org/3/library/random.html', source: 'docs', note: 'Seeded generators and `uniform`, used for the particles and the shake.' },
  ],
};
