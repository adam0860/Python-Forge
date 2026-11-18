import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-movement',
  title: 'Moving Things Around',
  summary: 'Position, velocity and acceleration. Direct movement, smooth movement with friction, what to do at the screen edge (stop, wrap, bounce), and moving along a path.',
  minutes: 38,
  objectives: [
    'Separate position, velocity and acceleration, and update them in the right order every frame',
    'Implement smooth movement: accelerate in the pressed direction, apply friction, and cap the speed',
    'Choose between the edge behaviours: clamp, wrap, bounce',
    'Move an object toward a target or along waypoints without overshooting',
    'Keep movement in the update step, once per frame, never inside the event loop',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Position, velocity, acceleration',
      blocks: [
        {
          type: 'p',
          text: 'Moving an object means changing its **position** a little each frame. Three quantities describe the motion, each the rate of change of the one before:',
        },
        {
          type: 'table',
          headers: ['Quantity', 'Meaning', 'Changed by', 'Update rule'],
          rows: [
            ['**Position**', 'Where the object is', 'Its velocity', '`pos += vel`'],
            ['**Velocity**', 'How fast, and in which direction (pixels per frame)', 'Acceleration, friction, collisions', '`vel += accel`'],
            ['**Acceleration**', 'How velocity is changing: a push, gravity, braking', 'Input and forces', 'Set each frame from what the game says'],
          ],
          caption: 'Games run this chain once per frame. In a physics class it is the same: distance, speed, acceleration.',
        },
        {
          type: 'p',
          text: 'The simplest style is **direct**: a key press adds a fixed amount to the position, and the object stops the instant the key is released. It is crisp, and right for puzzle games and menus. The smoother style, used by ships, cars and most action games, keeps a **velocity**: keys *push* it, and friction slows it down. The program below does that, with the screen edge wrapping around.',
        },
        {
          type: 'code',
          title: 'ship_move.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

pos = pygame.Vector2(320, 180)
vel = pygame.Vector2(0, 0)
ACCEL = 0.4
FRICTION = 0.92
MAX_SPEED = 6
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    push = pygame.Vector2(keys[pygame.K_RIGHT] - keys[pygame.K_LEFT],
                          keys[pygame.K_DOWN] - keys[pygame.K_UP])
    if push.length() > 0:
        vel += push.normalize() * ACCEL
    vel *= FRICTION
    if vel.length() > MAX_SPEED:
        vel.scale_to_length(MAX_SPEED)
    pos += vel
    pos.x %= screen.get_width()
    pos.y %= screen.get_height()

    screen.fill((20, 24, 48))
    pygame.draw.circle(screen, (250, 200, 40), pos, 16)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '7-11', text: 'The state is a position and a velocity (both vectors), plus tuning constants. Changing `ACCEL` or `FRICTION` changes how the ship feels, without touching the logic.' },
            { lines: '19-21', text: 'The push direction from the keys. A boolean counts as 0 or 1, so `right - left` gives -1, 0 or +1 on each axis, with no `if` needed.' },
            { lines: '22-23', text: 'If a key is held, **accelerate** in that direction. Normalising keeps diagonals the same strength as straight pushes.' },
            { lines: '24', text: '**Friction**: multiply the velocity by a number just under 1 each frame. With no push, the ship slows smoothly to a stop; the closer to 1, the slipperier the floor.' },
            { lines: '25-26', text: 'A speed cap: if the velocity is longer than the maximum, shrink it to exactly that length, keeping its direction.' },
            { lines: '27', text: 'Finally, **move**: position changes by the velocity.' },
            { lines: '28-29', text: 'Wrap-around: `%` (modulo) turns an x of 650 into 10 and an x of -10 into 630, so leaving one side re-enters from the other.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why accelerate instead of setting the speed?',
          text: 'Setting the speed directly feels like a robot: instant start, instant stop. Pushing the velocity gives weight and momentum: the ship eases up to speed and drifts to a halt. The same three lines, with different numbers, produce an ice level (friction close to 1), a heavy tank (low acceleration) or a sports car. Game feel is mostly tuning these constants.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which line makes the ship slow down gradually when no key is pressed?',
      options: [
        { text: '`vel *= 0.92`', correct: true, why: 'Each frame the velocity is cut to 92 percent of itself: 6, 5.5, 5.1, 4.7, and so on, a smooth glide that approaches zero.' },
        { text: '`vel = 0`', why: 'That stops the ship instantly: not gradual.' },
        { text: '`pos *= 0.92`', why: 'That shrinks the **position**, pulling the ship toward the corner (0, 0).' },
        { text: '`vel += 0.92`', why: 'That would speed it up, not slow it down.' },
      ],
      explanation: 'Friction is multiplication of the velocity by a factor below 1. Each frame removes a fixed **fraction**, so fast ships slow down quickly, and slow ones fade out gently.',
    },
    {
      kind: 'truefalse',
      prompt: 'In Python, `-10 % 640` is `630`, so `pos.x %= 640` makes an object that leaves the left edge reappear at the right edge.',
      answer: true,
      explanation: 'True. Python’s `%` always gives a result with the same sign as the divisor, so negative numbers wrap round to the positive side. (In C and some other languages, `-10 % 640` is `-10`, which is why wrap-around code from other languages needs extra care.)',
    },
    {
      kind: 'concept',
      title: 'What happens at the edge?',
      blocks: [
        {
          type: 'p',
          text: 'Sooner or later an object reaches the edge of the playing area, and the game must decide what to do. There are four standard answers:',
        },
        {
          type: 'table',
          headers: ['Behaviour', 'Code idea', 'Feels like', 'Typical games'],
          rows: [
            ['**Clamp** (stop)', '`rect.clamp_ip(area)`', 'A wall', 'Platformers, top-down games, the player’s paddle'],
            ['**Wrap**', '`x = left + (x - left) % width`', 'The world is a donut', 'Asteroids, Pac-Man tunnels'],
            ['**Bounce**', 'Reverse the velocity on that axis', 'A rubber wall', 'Pong, ball games, breakout'],
            ['**Remove**', 'Delete the object when it is off-screen', 'It flies away', 'Bullets, enemies, particles'],
          ],
          caption: 'Pick one per kind of object. The player is usually clamped; bullets are usually removed.',
        },
        {
          type: 'p',
          text: 'The **order** inside a frame also matters: read input, change velocity (forces first), apply friction, cap, then move the position, then resolve the edge or collisions, then draw. Doing the steps in another order still "works", but changes the feel. For example, moving before capping lets the speed exceed the cap for one frame.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Friction and the top speed',
          text: 'With acceleration `a` and friction `f` applied as `vel = (vel + a) * f`, the speed settles at `a * f / (1 - f)` where the push balances the friction. So you can **choose** the top speed and solve for the numbers, instead of guessing and testing.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the update step of the ship.',
      template: `vel += push.___() * ACCEL
vel *= ___
pos += ___`,
      templateIsCode: true,
      blanks: [{ answers: ['normalize'] }, { answers: ['FRICTION'] }, { answers: ['vel'] }],
      wordBank: ['normalize', 'FRICTION', 'vel', 'ACCEL', 'push', 'length'],
      explanation: 'Normalise the push so that diagonals are not stronger, apply friction by multiplying the velocity, then move the position by the velocity.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A ship moves at speed 10 and no key is held. Each frame friction halves the speed. What is the speed after 3 frames?',
      code: `v = 10
for frame in range(3):
    v *= 0.5
print(v)`,
      answer: '1.25',
      hint: '10, then 5, then 2.5, then ...',
      explanation: '10 → 5 → 2.5 → 1.25. The speed never quite reaches zero, so real games also say "if the speed is tiny, set it to zero", to avoid endless crawling.',
    },
    {
      kind: 'concept',
      title: 'Toward a target, and along a path',
      blocks: [
        {
          type: 'p',
          text: 'Many things do not follow the keyboard: a chasing enemy, a patrolling guard, a moving platform, a camera. They all work by **moving toward a point** at a limited speed. Take the vector from the object to the target, shrink it to the speed, and add it. But if the target is closer than one step, the object must **stop exactly on it**, or it will overshoot and jitter back and forth.',
        },
        {
          type: 'code',
          code: `def step_toward(pos, target, speed):
    dx = target[0] - pos[0]
    dy = target[1] - pos[1]
    dist = (dx * dx + dy * dy) ** 0.5
    if dist <= speed:
        return target
    return (pos[0] + dx / dist * speed, pos[1] + dy / dist * speed)`,
          annotations: [
            { lines: '2-4', text: 'The offset to the target, and its length by Pythagoras. `dx / dist` and `dy / dist` together form a vector of length 1 pointing at the target.' },
            { lines: '5-6', text: 'Close enough: **arrive** exactly, and use no more than the allowed distance. Without this check the object overshoots, then turns, then overshoots again.' },
            { lines: '7', text: 'Otherwise, take one full step in the unit direction. Multiplying by `speed` makes every step the same length however far away the target is.' },
          ],
        },
        {
          type: 'p',
          text: 'Waypoints are only a list of such targets: move toward the current one, and when you arrive, switch to the next (looping back to the first). That is a patrol route, a bus line or a tower-defence enemy walking its path.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The player only moves when the mouse is wiggled, and then much too fast. Tap the line with the mistake.',
      lines: [
        'for event in pygame.event.get():',
        '    if event.type == pygame.QUIT:',
        '        running = False',
        '    player.x += 5',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The line sits **inside** the event loop, so it runs once per **event** and not once per frame: when nothing happens there are no events and no movement; when the mouse generates dozens of motion events, the player jumps dozens of times. Movement belongs after the loop, in the update step, so that it runs exactly once per frame.',
    },
    {
      kind: 'numeric',
      prompt: 'A ship has `ACCEL = 0.4` and `FRICTION = 0.92`, updated as `vel = (vel + ACCEL) * FRICTION` while a key is held. What top speed does it settle at? (Use `a * f / (1 - f)`.)',
      answer: '4.6',
      hint: '0.4 times 0.92 divided by 0.08.',
      explanation: '0.4 x 0.92 = 0.368, divided by (1 - 0.92) = 0.08, gives 4.6 pixels per frame. At that speed the push added each frame is exactly what friction removes. It is below the cap of 6, so the cap never matters in this setting.',
      label: 'Pixels per frame:',
    },
    {
      kind: 'concept',
      title: 'Your turn: three movement rules',
      blocks: [
        {
          type: 'p',
          text: 'Each rule is a small function from the old state to the new state, with no window involved. Together they are the engine of the ship program above, plus the waypoint walker.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `step_velocity(vel, push, accel, friction, max_speed)`. `vel` and `push` are `pygame.Vector2`. Return a **new** vector: if `push` is not the zero vector, add `push.normalize() * accel` to the velocity; then multiply the velocity by `friction`; then, if its length is over `max_speed`, shorten it to exactly `max_speed` (same direction). Do not change the `vel` given.',
      starter: `import pygame


def step_velocity(vel, push, accel, friction, max_speed):
    ...
`,
      solution: `import pygame


def step_velocity(vel, push, accel, friction, max_speed):
    new = pygame.Vector2(vel)
    if push.length() > 0:
        new += push.normalize() * accel
    new *= friction
    if new.length() > max_speed:
        new.scale_to_length(max_speed)
    return new
`,
      setup: PG_SIM,
      tests: `V = pygame.Vector2

def xy(v):
    return (round(v.x, 3), round(v.y, 3))

v0 = V(0, 0)
assert xy(step_velocity(v0, V(1, 0), 0.4, 0.9, 6)) == (0.36, 0)
assert xy(step_velocity(v0, V(0, -5), 0.4, 0.9, 6)) == (0, -0.36), "only the direction of push matters"
assert xy(step_velocity(V(4, 0), V(0, 0), 0.4, 0.5, 6)) == (2, 0), "no push: friction only"
assert xy(step_velocity(V(0, 0), V(0, 0), 0.4, 0.5, 6)) == (0, 0)
v = V(0, 0)
for _ in range(100):
    v = step_velocity(v, V(1, 0), 0.4, 0.9, 6)
assert round(v.x, 2) == 3.6 and abs(v.y) < 1e-9, "top speed a*f/(1-f)"
v = V(0, 0)
for _ in range(10):
    v = step_velocity(v, V(1, 0), 3, 1.0, 4)
assert round(v.length(), 3) == 4, "speed cap"
v = V(0, 0)
for _ in range(10):
    v = step_velocity(v, V(1, 1), 3, 1.0, 4)
assert xy(v) == (2.828, 2.828), xy(v)
start = V(1, 2)
step_velocity(start, V(1, 0), 0.4, 0.9, 6)
assert xy(start) == (1, 2), "the vel given must not be changed"`,
      checks: ['Accelerates along the normalised push, then applies friction, then caps the speed', 'No push means friction only, and a zero push does not cause a division by zero', 'Returns a new vector: the argument is unchanged'],
      hint: 'Copy first: `new = pygame.Vector2(vel)`. `push.normalize()` is only safe when `push.length() > 0`. `new.scale_to_length(max_speed)` shortens in place.',
      explanation: 'This is the whole feel of a ship in one function. Making it a function of the old state means a test can run a hundred frames in a millisecond and check the top speed, instead of someone playing the game and judging by eye.',
    },
    {
      kind: 'code',
      prompt: 'Write `wrap(value, low, high)` that returns `value` brought into the range from `low` up to (but not including) `high` by wrapping around (so the length of the range is `high - low`). Then write `wrap_point(point, rect)` that wraps an `(x, y)` pair into a `pygame.Rect` (x between `rect.left` and `rect.right`, y between `rect.top` and `rect.bottom`) and returns a tuple.',
      starter: `import pygame


def wrap(value, low, high):
    ...


def wrap_point(point, rect):
    ...
`,
      solution: `import pygame


def wrap(value, low, high):
    return low + (value - low) % (high - low)


def wrap_point(point, rect):
    return (wrap(point[0], rect.left, rect.right), wrap(point[1], rect.top, rect.bottom))
`,
      setup: PG_SIM,
      tests: `assert wrap(5, 0, 10) == 5
assert wrap(10, 0, 10) == 0, "the top of the range wraps to the bottom"
assert wrap(13, 0, 10) == 3
assert wrap(-1, 0, 10) == 9
assert wrap(-21, 0, 10) == 9
assert wrap(25, 0, 10) == 5
assert wrap(0, 0, 10) == 0
assert wrap(7, 5, 10) == 7
assert wrap(4, 5, 10) == 9
assert wrap(10, 5, 10) == 5
assert wrap(0.5, 0, 1) == 0.5 and wrap(1.5, 0, 1) == 0.5 and wrap(-0.5, 0, 1) == 0.5
R = pygame.Rect
screen = R(0, 0, 640, 360)
assert wrap_point((650, 370), screen) == (10, 10)
assert wrap_point((-10, -5), screen) == (630, 355)
assert wrap_point((100, 100), screen) == (100, 100)
assert wrap_point((640, 360), screen) == (0, 0)
assert wrap_point((110, 5), R(100, 50, 20, 20)) == (110, 65)
assert wrap_point((130, 75), R(100, 50, 20, 20)) == (110, 55)`,
      checks: ['`wrap` handles values above, below and exactly at the limits, including with a `low` that is not 0', '`wrap_point` wraps each axis against the rectangle’s edges and returns a tuple', 'Works for floats as well as for integers'],
      hint: 'Shift the range to start at 0, use `%`, and shift back: `low + (value - low) % (high - low)`. For the point, call `wrap` once for each axis.',
      explanation: 'Because Python’s `%` gives non-negative results for a positive divisor, a one-line formula covers going over and going under the limits. Asteroids-style screen wrapping is just this applied to the ship, rocks and bullets alike.',
    },
    {
      kind: 'code',
      prompt: 'Write `follow_path(pos, waypoints, index, speed)`. `pos` is an `(x, y)` tuple, `waypoints` a list of `(x, y)` tuples, and `index` the waypoint being approached. Move `speed` units straight toward `waypoints[index]`. If that point is within `speed` of `pos` (or exactly at it), land **exactly** on it and advance `index` to the next waypoint, wrapping to 0 after the last. Return `(new_pos, new_index)`. Positions may be returned as floats.',
      starter: `def follow_path(pos, waypoints, index, speed):
    ...
`,
      solution: `def follow_path(pos, waypoints, index, speed):
    target = waypoints[index]
    dx = target[0] - pos[0]
    dy = target[1] - pos[1]
    dist = (dx * dx + dy * dy) ** 0.5
    if dist <= speed:
        return target, (index + 1) % len(waypoints)
    return (pos[0] + dx / dist * speed, pos[1] + dy / dist * speed), index
`,
      tests: `W = [(0, 0), (10, 0), (10, 10)]

def close(a, b):
    return round(a[0], 6) == round(b[0], 6) and round(a[1], 6) == round(b[1], 6)

p, i = follow_path((0, 0), W, 1, 4)
assert close(p, (4, 0)) and i == 1
p, i = follow_path(p, W, i, 4)
assert close(p, (8, 0)) and i == 1
p, i = follow_path(p, W, i, 4)
assert p == (10, 0) and i == 2, "lands exactly on the waypoint and switches"
p, i = follow_path(p, W, i, 4)
assert close(p, (10, 4)) and i == 2
p, i = follow_path((10, 8), W, 2, 4)
assert p == (10, 10) and i == 0, "wraps to the first waypoint"
p, i = follow_path((10, 10), W, 0, 3)
assert close(p, (7.5, 7.5)) is False
assert close(p, (10 - 3 * 10 / (200 ** 0.5), 10 - 3 * 10 / (200 ** 0.5))) and i == 0
p, i = follow_path((0, 0), [(3, 4)], 0, 2.5)
assert close(p, (1.5, 2.0)) and i == 0
p, i = follow_path((0, 0), [(3, 4)], 0, 5)
assert p == (3, 4) and i == 0, "exactly speed away counts as arrived"
p, i = follow_path((3, 4), [(3, 4), (9, 9)], 0, 1)
assert p == (3, 4) and i == 1, "already there: just switch"
assert close(follow_path((0, 0), [(0, 100)], 0, 7)[0], (0, 7))`,
      checks: ['Moves exactly `speed` units toward the current waypoint while it is farther than that', 'Lands exactly on the waypoint when within `speed` (or already there) and advances the index', 'The index wraps to 0 after the last waypoint'],
      hint: 'Same shape as `step_toward`: compute `dx`, `dy` and the distance. If `dist <= speed`, return the target and `(index + 1) % len(waypoints)`; otherwise return the stepped position and the same index.',
      explanation: 'Patrols, buses, tower-defence enemies and camera tours are all "step toward the next waypoint". Landing exactly on the point (rather than overshooting) keeps the route precise, and the `%` makes the route loop for ever.',
    },
  ],
  takeaways: [
    'A frame updates **acceleration → velocity → position**: `vel += accel`, `pos += vel`. Direct movement skips velocity; smooth movement keeps it.',
    'Smooth feel comes from three numbers: acceleration (`vel += push.normalize() * ACCEL`), friction (`vel *= FRICTION`, a little under 1), and a speed cap (`scale_to_length`). With `vel = (vel + a) * f` the top speed is `a * f / (1 - f)`.',
    'Choose an edge rule for each object: **clamp** (stop), **wrap** (`%`), **bounce** (reverse velocity), or **remove** (bullets).',
    'Python’s `%` is non-negative for a positive divisor, so wrapping is `low + (x - low) % size`.',
    'To move toward a target: step along the unit direction by `speed`; if closer than one step, **land exactly** on the target. Waypoints are targets in a list.',
    'Movement belongs in the **update step, once per frame**: never in the event loop, where it would run once per event.',
  ],
  reading: [
    { title: 'pygame docs: pygame.math (Vector2)', url: 'https://www.pygame.org/docs/ref/math.html', source: 'docs', note: 'The vector class used for position and velocity, with every method.' },
    { title: 'Game Programming Patterns: Update Method', url: 'https://gameprogrammingpatterns.com/update-method.html', source: 'book', note: 'Why each object gets an update step each frame.' },
    { title: 'Kids Can Code: Game Development with pygame', url: 'https://kidscancode.org/blog/2016/08/pygame_1-1_getting-started/', source: 'tutorial', note: 'A well-known series that builds moving sprites with friction and acceleration.' },
  ],
};
