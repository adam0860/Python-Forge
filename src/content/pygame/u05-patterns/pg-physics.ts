import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-physics',
  title: 'Gravity, Jumping and Platformer Physics',
  summary: 'Velocity changes by acceleration, and position changes by velocity. Use that to build gravity, a jump that feels right, and a platformer character that stands, falls and bumps its head.',
  minutes: 42,
  objectives: [
    'Explain the chain acceleration to velocity to position, and apply gravity as `vy += g * dt` followed by `y += vy * dt`',
    'Compute a jump from an initial upward speed, and relate speed, gravity and jump height',
    'Detect standing, landing and head bumps with axis-separated collision, and keep an `on_ground` flag',
    'Add game feel with coyote time, jump buffering and variable jump height',
    'Know why jump height depends slightly on the time step, and how to keep it steady',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Acceleration, velocity, position',
      blocks: [
        {
          type: 'p',
          text: 'A falling object does not move at a constant speed: it moves faster every moment. That is the whole of gravity in a game. Three quantities are chained together:',
        },
        {
          type: 'table',
          headers: ['Quantity', 'Meaning', 'Unit in a game', 'Updated by'],
          rows: [
            ['**Position** `y`', 'Where the object is', 'pixels', '`y += vy * dt`'],
            ['**Velocity** `vy`', 'How fast it moves, and which way', 'pixels per second', '`vy += gravity * dt`'],
            ['**Acceleration** `gravity`', 'How quickly the velocity changes', 'pixels per second per second', 'a constant you choose'],
          ],
          caption: 'In pygame, y grows **downward**, so gravity is a **positive** number and a jump gives a **negative** velocity.',
        },
        {
          type: 'p',
          text: 'Each frame you apply the chain in order. Velocity first, then position, using the new velocity. This order is called **semi-implicit Euler** (or "symplectic Euler"), and it is the standard for games because it is simple, stable and handles gravity well. Both lines are multiplied by `dt`, so a game at 30 FPS and one at 144 FPS fall at (nearly) the same speed.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `frame 1:  vy = 0   + 400 * 0.25 = 100    y = 0   + 100 * 0.25 = 25
frame 2:  vy = 100 + 400 * 0.25 = 200    y = 25  + 200 * 0.25 = 75
frame 3:  vy = 200 + 400 * 0.25 = 300    y = 75  + 300 * 0.25 = 150`,
          annotations: [
            { lines: '1-3', text: 'With gravity 400 and a (very large) step of 0.25 seconds: the velocity grows by 100 each frame (constant acceleration), and the distance fallen in each frame grows too: 25, then 50, then 75.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why velocity, not position, is what gravity changes',
          text: 'If gravity moved the player by a fixed amount every frame, they would fall at a **constant** speed, like a parachutist already at terminal velocity. Real falling speeds up, and that speeding up is what makes a jump arc feel like a jump: slow at the top, fast at the bottom. Storing `vy` as a variable that accumulates is what produces the curve.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A platformer character is standing still on the floor, but the code applies gravity every frame. Why does it not sink into the floor?',
      options: [
        { text: 'After gravity moves it down a little, collision puts it back on top of the floor and sets `vy` to zero', correct: true, why: 'Gravity always applies; the collision step undoes the overlap and cancels the downward speed, every frame.' },
        { text: 'Gravity is switched off when the player stands on something', why: 'Most games leave gravity on; switching it off makes walking off a ledge awkward.' },
        { text: 'The floor pushes up with a force equal to gravity', why: 'There is no force simulation here; a position correction does the job.' },
        { text: 'pygame prevents rectangles from overlapping', why: 'pygame does nothing of the kind; you resolve overlaps yourself.' },
      ],
      explanation: 'Fall a little, get pushed back, reset `vy`: that cycle each frame is also what sets `on_ground = True`.',
    },
    {
      kind: 'truefalse',
      prompt: '"Coyote time" is a short grace period after the player walks off a ledge during which a jump is still allowed.',
      answer: true,
      explanation: 'True, and it is named after the cartoon coyote who hangs in the air after running off a cliff. The player thinks "I pressed jump just at the edge", and the game agrees with them. It costs a few lines and makes a platformer feel much fairer.',
    },
    {
      kind: 'concept',
      title: 'A platformer character',
      blocks: [
        {
          type: 'p',
          text: 'The program below puts the pieces together: a `Player` that falls, lands on platforms, jumps, bumps its head on the underside of a platform, and stops at walls. The ideas are the same ones you used for tile collision, moving one axis at a time, plus the gravity chain. Position is kept as **floats** (`x`, `y`) so that slow movement is not lost to the whole-number storage of a `Rect`, and the rectangle is rebuilt from them when needed.',
        },
        {
          type: 'code',
          title: 'platformer_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()


class Player:
    SPEED = 220
    GRAVITY = 1400
    JUMP_SPEED = 520
    MAX_FALL = 900

    def __init__(self, x, y):
        self.x, self.y = float(x), float(y)
        self.w, self.h = 28, 40
        self.vy = 0.0
        self.on_ground = False

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.w, self.h)

    def jump(self):
        if self.on_ground:
            self.vy = -self.JUMP_SPEED

    def release_jump(self):
        if self.vy < 0:
            self.vy *= 0.5

    def update(self, dt, direction, solids):
        self.x += direction * self.SPEED * dt
        for solid in solids:
            if self.rect.colliderect(solid):
                if direction > 0:
                    self.x = solid.left - self.w
                elif direction < 0:
                    self.x = solid.right

        self.vy = min(self.vy + self.GRAVITY * dt, self.MAX_FALL)
        self.y += self.vy * dt
        self.on_ground = False
        for solid in solids:
            if self.rect.colliderect(solid):
                if self.vy > 0:
                    self.y = solid.top - self.h
                    self.vy = 0.0
                    self.on_ground = True
                elif self.vy < 0:
                    self.y = solid.bottom
                    self.vy = 0.0


solids = [
    pygame.Rect(0, 320, 640, 40),
    pygame.Rect(120, 250, 120, 16),
    pygame.Rect(320, 190, 120, 16),
    pygame.Rect(480, 130, 100, 16),
    pygame.Rect(620, 0, 20, 320),
]
player = Player(40, 280)

running = True
while running:
    dt = min(clock.tick(60) / 1000, 0.05)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key in (pygame.K_SPACE, pygame.K_UP):
            player.jump()
        elif event.type == pygame.KEYUP and event.key in (pygame.K_SPACE, pygame.K_UP):
            player.release_jump()

    keys = pygame.key.get_pressed()
    direction = keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]
    player.update(dt, direction, solids)
    if player.y > 400:
        player = Player(40, 280)

    screen.fill((24, 28, 40))
    for solid in solids:
        pygame.draw.rect(screen, (80, 100, 130), solid)
    pygame.draw.rect(screen, (90, 200, 120), player.rect)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '9-12', text: 'Tuning numbers as class constants: speed, gravity, jump speed and a **terminal velocity** (`MAX_FALL`) so a long fall does not become uncontrollable. In pixels and seconds, so they are independent of the frame rate.' },
            { lines: '14-18', text: 'Position is stored as floats; the vertical speed and the on-ground flag are the state that physics needs.' },
            { lines: '20-22', text: 'The rectangle is rebuilt from the float position whenever a collision test needs it.' },
            { lines: '24-30', text: '`jump` works only on the ground: it just sets an upward (negative) velocity and lets gravity do the rest. `release_jump` halves a rising speed, so a short tap gives a short hop: **variable jump height**.' },
            { lines: '33-39', text: 'Horizontal first: move, then push out of any solid that now overlaps, depending on which way we were going.' },
            { lines: '41-43', text: 'Vertical: apply gravity (capped by `MAX_FALL`), move, and assume we are in the air until proven otherwise.' },
            { lines: '44-52', text: 'Falling onto a solid puts us on top of it, zeroes the speed and sets `on_ground`. Rising into one means a bumped head: we are put just under it and the upward speed is cancelled, so the player drops straight down.' },
            { lines: '66', text: '`min(..., 0.05)` caps a long frame (such as after dragging the window) so that one huge `dt` cannot carry the player through a thin platform.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Tune with numbers you can reason about',
          text: 'The highest point of a jump is about `jump_speed² / (2 * gravity)`. With 520 and 1400 that is 96 pixels, so a platform 60 pixels higher is reachable and one 120 pixels higher is not. Choose the jump height you want and your gravity first, then compute the speed: `jump_speed = sqrt(2 * gravity * height)`.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the three lines of the platformer’s vertical movement.',
      template: `self.vy = min(self.vy + GRAVITY * ___, MAX_FALL)
self.y += self.vy * ___
if jump and self.___:
    self.vy = -JUMP_SPEED`,
      templateIsCode: true,
      blanks: [{ answers: ['dt'] }, { answers: ['dt'] }, { answers: ['on_ground'] }],
      wordBank: ['dt', 'on_ground', 'vy', 'jump', 'GRAVITY', 'y'],
      explanation: 'Both the velocity change and the position change are scaled by `dt`, so the motion does not depend on the frame rate. And a jump is only allowed when `on_ground` is true; without that check, the player could jump in mid-air forever.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This loop applies "add the speed" three times, using a velocity that grows by 40 each frame.',
      code: `vy, y = 0.0, 0.0
for _ in range(3):
    vy += 40.0
    y += vy
print(y, vy)`,
      answer: '240.0 120.0',
      hint: 'The velocity is 40, then 80, then 120. The position adds the **new** velocity each time.',
      explanation: 'The velocity becomes 40, 80 and 120, and the position collects 40 + 80 + 120 = 240. The distance grows faster and faster: the signature of acceleration.',
    },
    {
      kind: 'concept',
      title: 'Game feel: coyote time, buffering and the time step',
      blocks: [
        {
          type: 'p',
          text: 'Physically correct is not the same as good to play. Players press buttons a few hundredths of a second **too late** or **too early**, and a strict game punishes them with a death or a missed jump they were certain they made. Two small tricks forgive that:',
        },
        {
          type: 'table',
          headers: ['Trick', 'The problem', 'The fix'],
          rows: [
            ['**Coyote time**', 'Jump pressed just *after* running off a ledge', 'Remember the last time you were on the ground; allow a jump for about 0.1 seconds afterwards'],
            ['**Jump buffering**', 'Jump pressed just *before* landing', 'Remember the press for about 0.1 seconds; when you land inside that window, jump at once'],
            ['**Variable jump height**', 'Every jump is the same height', 'Cut the upward speed when the button is released early'],
            ['**Terminal velocity**', 'Falls get faster than control or collision can handle', 'Cap the downward speed (`MAX_FALL`)'],
          ],
          caption: 'The timers are just numbers counted down with `dt`: no special graphics, no extra physics.',
        },
        {
          type: 'p',
          text: 'There is one more thing physics needs to be told. The update `y += vy * dt` is an **approximation**, and a big `dt` gives a visibly different result: a jump with speed 400 and gravity 1000 should rise 80 pixels (`v² / 2g`), but with a step of 0.125 seconds it peaks at 56.25, and at 60 frames per second it reaches about 76.7. The error is `v * dt / 2`. A game that runs on a slow computer would jump **lower** than on a fast one.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why cap or fix the time step?',
          text: 'Capping `dt` (as the demo does with 0.05) stops one huge frame from teleporting the player through the floor. For a jump that is identical everywhere, use the **fixed time step** from the delta-time lesson: run physics in constant slices such as 1/120 second, however fast frames arrive. Competitive platformers do exactly this so that every player gets the same jump.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Testers report that they can keep pressing jump in mid-air and fly upward forever. Tap the line that causes the bug.',
      lines: [
        'def update(self, dt, jump, solids):',
        '    if jump:',
        '        self.vy = -self.JUMP_SPEED',
        '    self.vy += self.GRAVITY * dt',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The jump test is missing `and self.on_ground`. Without it, every press sets a fresh upward speed, wherever the player is. The fix is `if jump and self.on_ground:` (or, with coyote time, a timer that says a jump is still allowed).',
    },
    {
      kind: 'numeric',
      prompt: 'A jump starts with an upward speed of 400 pixels per second, and gravity is 1000 pixels per second squared. Using the formula `v * v / (2 * g)`, how many pixels high does the character rise?',
      answer: '80',
      hint: '400 * 400 = 160000, and 2 * 1000 = 2000.',
      explanation: '160000 / 2000 = 80 pixels. The speed is squared, so doubling the jump speed gives four times the height, while doubling gravity halves it. That is why tuning by speed alone feels so touchy.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the physics',
      blocks: [
        {
          type: 'p',
          text: 'You will write the falling step and a jump simulation, the timer logic for coyote time and jump buffering, and the full `Player` class of the platformer. The tests use fixed time steps that are exact in binary (0.25 and 0.125) so that the numbers come out exactly.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `fall(y, vy, dt, gravity, terminal)`: first add `gravity * dt` to the speed and cap the **result** at `terminal`; then move `y` by the new speed times `dt`. Return the pair `(new_y, new_vy)`. Then write `jump_arc(jump_speed, gravity, dt)`: start at `y = 0` moving **up** (`vy = -jump_speed`) and call `fall` (with no terminal speed: use `float("inf")`) repeatedly until `y` is back at or below the start (`y >= 0`). It always takes at least one step. Return `(steps, peak)`, where `peak` is the highest the character rose above 0, as a positive number.',
      starter: `def fall(y, vy, dt, gravity, terminal):
    ...


def jump_arc(jump_speed, gravity, dt):
    ...
`,
      solution: `def fall(y, vy, dt, gravity, terminal):
    vy = min(vy + gravity * dt, terminal)
    return y + vy * dt, vy


def jump_arc(jump_speed, gravity, dt):
    y, vy = 0.0, -jump_speed
    steps = 0
    peak = 0.0
    while True:
        y, vy = fall(y, vy, dt, gravity, float("inf"))
        steps += 1
        peak = max(peak, -y)
        if y >= 0:
            return steps, peak
`,
      tests: `assert fall(0, 0, 0.25, 400, 250) == (25.0, 100.0)
assert fall(25, 100, 0.25, 400, 250) == (75.0, 200.0)
assert fall(75, 200, 0.25, 400, 250) == (137.5, 250), "the speed is capped, and the capped value moves y"
assert fall(137.5, 250, 0.25, 400, 250) == (200.0, 250)
y, vy = 0.0, 0.0
for _ in range(2):
    y, vy = fall(y, vy, 0.25, 400, 1000)
assert (y, vy) == (75.0, 200.0)
assert fall(100, -300, 0.25, 400, 250) == (100 + (-200) * 0.25, -200.0), "a rising object slows down first"
assert jump_arc(300, 400, 0.25) == (5, 75.0)
assert jump_arc(200, 400, 0.25) == (3, 25.0)
assert jump_arc(400, 1000, 0.125) == (6, 56.25)
steps, peak = jump_arc(400, 1000, 1 / 60)
assert 76 < peak < 80, "the exact height is 80; the smaller the step the closer"
fine_steps, fine_peak = jump_arc(400, 1000, 1 / 120)
assert peak < fine_peak < 80 and fine_steps > steps`,
      checks: ['`fall` caps the velocity first and then moves `y` by the capped velocity times `dt`', '`jump_arc` starts moving up, repeats at least once, and stops when `y >= 0`', '`peak` is positive and `steps` counts the updates'],
      hint: 'In `fall`: `vy = min(vy + gravity * dt, terminal)` and then `return y + vy * dt, vy`. In `jump_arc` use a `while True:` loop that updates, counts, tracks `max(peak, -y)`, and returns when `y >= 0`.',
      explanation: 'The finer step gets closer to the exact `v² / 2g` height of 80, which shows the effect of the time step: the same jump is a little lower at 60 FPS than at 120. A fixed physics step removes the difference between computers.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `JumpControl(coyote=0.1, buffer=0.1)` that decides when a jump should start. `update(dt, on_ground, jump_pressed)` is called once per frame and returns `True` when a jump should happen now. Rules: when `on_ground`, the coyote timer is set to `coyote`, otherwise it counts down by `dt` (never below 0). When `jump_pressed`, the buffer timer is set to `buffer`, otherwise it counts down by `dt` (never below 0). If **both** timers are above 0, reset both to 0 (the jump is used up) and return `True`; otherwise return `False`. Keep the timers in `coyote_left` and `buffer_left` (both start at `0.0`).',
      starter: `class JumpControl:
    def __init__(self, coyote=0.1, buffer=0.1):
        ...

    def update(self, dt, on_ground, jump_pressed):
        ...
`,
      solution: `class JumpControl:
    def __init__(self, coyote=0.1, buffer=0.1):
        self.coyote = coyote
        self.buffer = buffer
        self.coyote_left = 0.0
        self.buffer_left = 0.0

    def update(self, dt, on_ground, jump_pressed):
        if on_ground:
            self.coyote_left = self.coyote
        else:
            self.coyote_left = max(0.0, self.coyote_left - dt)
        if jump_pressed:
            self.buffer_left = self.buffer
        else:
            self.buffer_left = max(0.0, self.buffer_left - dt)
        if self.coyote_left > 0 and self.buffer_left > 0:
            self.coyote_left = 0.0
            self.buffer_left = 0.0
            return True
        return False
`,
      tests: `dt = 0.125
d = JumpControl()
assert d.coyote == 0.1 and d.buffer == 0.1 and d.coyote_left == 0.0 and d.buffer_left == 0.0
j = JumpControl(0.5, 0.5)
assert j.update(dt, True, False) is False, "standing, no press: nothing happens"
assert j.update(dt, False, True) is True, "just left the ledge and pressed: coyote time allows it"
assert j.update(dt, False, True) is False, "the jump was used up, and the coyote time with it"
assert j.update(dt, True, False) is True, "the press was buffered, so landing jumps at once"
assert j.update(dt, True, False) is False, "and only once"
k = JumpControl(0.5, 0.5)
k.update(dt, True, False)
assert [k.update(dt, False, False) for _ in range(4)] == [False, False, False, False]
assert k.coyote_left == 0.0
assert k.update(dt, False, True) is False, "the grace period is over"
m = JumpControl(0.5, 0.5)
assert m.update(dt, False, True) is False, "pressed in mid-air: remembered, not used yet"
assert [m.update(dt, False, False) for _ in range(2)] == [False, False]
assert m.update(dt, True, False) is True, "landing 3 frames after the press is still inside the buffer"
n = JumpControl(0.5, 0.5)
assert n.update(dt, False, True) is False
assert [n.update(dt, False, False) for _ in range(3)] == [False, False, False]
assert n.buffer_left == 0.125
assert n.update(dt, True, False) is False, "landing 4 frames later is too late"
p = JumpControl(0.5, 0.5)
assert p.update(dt, True, True) is True, "on the ground, a press jumps immediately"
assert p.update(dt, True, True) is True
assert p.update(dt, True, False) is False`,
      checks: ['The coyote timer is refilled while on the ground and counts down otherwise; the buffer timer is refilled on a press and counts down otherwise', 'A jump happens only when both timers are positive, and then both are reset', 'Neither timer ever goes below 0'],
      hint: 'Update both timers first (`max(0.0, timer - dt)` when counting down). Then `if self.coyote_left > 0 and self.buffer_left > 0:` reset both and `return True`.',
      explanation: 'Both forgiveness windows are the same idea seen from two sides: one remembers the **ground**, the other remembers the **button**. A jump fires when the two memories overlap. This little class is the entire feature.',
    },
    {
      kind: 'code',
      prompt: 'Write the class `Player(x, y, w=20, h=30)` with the constants `SPEED = 160`, `GRAVITY = 800`, `JUMP_SPEED = 320` and `MAX_FALL = 600`. It keeps float `x` and `y`, `w`, `h`, `vy = 0.0` and `on_ground = False`. The property `rect` is `pygame.Rect(round(x), round(y), w, h)`. `jump()` sets `vy = -JUMP_SPEED` only if `on_ground`. `update(dt, direction, solids)` (`direction` is -1, 0 or 1 and `solids` a list of Rects) first moves horizontally by `direction * SPEED * dt` and pushes out of any solid it overlaps (to `solid.left - w` when moving right, to `solid.right` when moving left); then applies gravity (capped by `MAX_FALL`), moves vertically, sets `on_ground = False`, and for any solid overlapped: if moving down, puts the player on top of it (`y = solid.top - h`), sets `vy = 0.0` and `on_ground = True`; if moving up, puts it under the solid (`y = solid.bottom`) and sets `vy = 0.0`.',
      starter: `import pygame


class Player:
    SPEED = 160
    GRAVITY = 800
    JUMP_SPEED = 320
    MAX_FALL = 600

    def __init__(self, x, y, w=20, h=30):
        ...

    @property
    def rect(self):
        ...

    def jump(self):
        ...

    def update(self, dt, direction, solids):
        ...
`,
      solution: `import pygame


class Player:
    SPEED = 160
    GRAVITY = 800
    JUMP_SPEED = 320
    MAX_FALL = 600

    def __init__(self, x, y, w=20, h=30):
        self.x = float(x)
        self.y = float(y)
        self.w = w
        self.h = h
        self.vy = 0.0
        self.on_ground = False

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.w, self.h)

    def jump(self):
        if self.on_ground:
            self.vy = -self.JUMP_SPEED

    def update(self, dt, direction, solids):
        self.x += direction * self.SPEED * dt
        for solid in solids:
            if self.rect.colliderect(solid):
                if direction > 0:
                    self.x = solid.left - self.w
                elif direction < 0:
                    self.x = solid.right

        self.vy = min(self.vy + self.GRAVITY * dt, self.MAX_FALL)
        self.y += self.vy * dt
        self.on_ground = False
        for solid in solids:
            if self.rect.colliderect(solid):
                if self.vy > 0:
                    self.y = solid.top - self.h
                    self.vy = 0.0
                    self.on_ground = True
                elif self.vy < 0:
                    self.y = solid.bottom
                    self.vy = 0.0
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
dt = 0.125
floor = R(0, 200, 400, 20)

p = Player(50, 170)
assert p.rect == R(50, 170, 20, 30) and p.vy == 0.0 and p.on_ground is False
p.jump()
assert p.vy == 0.0, "no jump in the air (not yet known to be on the ground)"
p.update(dt, 0, [floor])
assert p.y == 170 and p.vy == 0.0 and p.on_ground is True, "gravity pulls it into the floor and the floor pushes it back"
for _ in range(3):
    p.update(dt, 0, [floor])
assert p.y == 170 and p.on_ground is True

p.jump()
assert p.vy == -320
seen = []
for _ in range(6):
    p.update(dt, 0, [floor])
    seen.append((p.y, p.vy, p.on_ground))
assert seen == [(142.5, -220.0, False), (127.5, -120.0, False), (125.0, -20.0, False),
                (135.0, 80.0, False), (157.5, 180.0, False), (170, 0.0, True)], seen
q = Player(50, 170)
q.update(dt, 0, [floor])
q.jump()
q.update(dt, 0, [floor])
before = q.vy
q.jump()
assert q.vy == before, "a second jump in mid-air is ignored"

c = Player(50, 130)
c.vy = -300
c.update(dt, 0, [R(0, 100, 400, 20)])
assert c.y == 120 and c.vy == 0.0 and c.on_ground is False, "bumped the head and stopped rising"

w = Player(70, 170)
w.update(dt, 1, [floor, R(100, 0, 20, 300)])
assert w.x == 80 and w.on_ground is True, "stopped by the wall on the right"
w2 = Player(25, 170)
w2.update(dt, -1, [floor, R(0, 0, 20, 300)])
assert w2.x == 20 and w2.on_ground is True, "stopped by the wall on the left"
free = Player(40, 170)
free.update(dt, 1, [floor])
assert free.x == 60.0 and free.on_ground is True, "SPEED * dt = 20 pixels"

ledge = R(0, 200, 100, 20)
e = Player(90, 170)
e.update(dt, 0, [ledge])
assert e.on_ground is True
e.update(dt, 1, [ledge])
assert e.x == 110.0 and e.y == 182.5 and e.vy == 100.0 and e.on_ground is False, "walked off the edge: falling"

t = Player(300, 10)
t.vy = 550
t.update(dt, 0, [])
assert t.vy == 600 and t.y == 85.0, "the fall speed is capped by MAX_FALL"`,
      checks: ['Standing: gravity then collision keeps `y` on top of the floor, with `on_ground` true and `vy` zero', 'A jump needs `on_ground`, rises and returns in the expected arc, and a ceiling stops the rise', 'Horizontal movement is stopped by walls, and walking off a ledge makes the player fall'],
      hint: 'Copy the demo’s structure: horizontal move and push-out first, then `vy = min(vy + GRAVITY * dt, MAX_FALL)`, `y += vy * dt`, `on_ground = False`, and a loop over `solids` with `if self.vy > 0 ... elif self.vy < 0 ...`.',
      explanation: 'This class is the heart of every simple platformer. Because it only needs `Rect` and numbers, you can test its whole behaviour (standing, jumping, bumping, wall, ledge, terminal speed) without opening a window. Notice the first update: the player "falls" 12.5 pixels into the floor and is pushed back every single frame; that is how `on_ground` stays true.',
    },
  ],
  takeaways: [
    'Gravity is an **acceleration**: each frame `vy += gravity * dt`, and then `y += vy * dt`. In pygame y grows downward, so gravity is positive and an upward jump is a negative velocity.',
    'Jump height is about `v² / (2g)`. Choose the height you want and compute the speed, `sqrt(2 * g * height)`. Doubling the speed quadruples the height.',
    'Move and resolve **one axis at a time**. Falling onto a solid puts you on top of it, zeroes `vy` and sets `on_ground`; rising into one is a head bump that also zeroes `vy`.',
    'Standing still means falling a little every frame and being pushed back; `on_ground` is true only because of that collision. Allow jumping only when `on_ground`.',
    '**Coyote time** (a jump grace period after leaving the ground), **jump buffering** (remembering an early press), variable jump height and a terminal velocity make a platformer feel fair. The timers are plain numbers counted down with `dt`.',
    'The step `y += vy * dt` is an approximation: a bigger `dt` gives a lower jump. Cap `dt`, and use a **fixed time step** if every player must get an identical jump.',
  ],
  reading: [
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'Fixed and variable time steps, and why physics wants a constant step.' },
    { title: 'Wikipedia: Euler method (semi-implicit Euler)', url: 'https://en.wikipedia.org/wiki/Semi-implicit_Euler_method', source: 'wikipedia', note: 'The integration order used in this lesson, and why it is stable for games.' },
    { title: 'Game Maker’s Toolkit: Platformer Toolkit', url: 'https://www.youtube.com/watch?v=sSkZKlrcpxM', source: 'video', note: 'Coyote time, jump buffering and many other platformer feel tricks, shown interactively.' },
  ],
};
