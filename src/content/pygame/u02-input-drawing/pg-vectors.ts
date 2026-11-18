import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-vectors',
  title: 'Vectors: Directions and Distances',
  summary: 'Vector2 turns positions into arithmetic: offsets, distances, directions, bouncing, sliding, aiming and smoothing, in a line or two each.',
  minutes: 40,
  objectives: [
    'Use `pygame.Vector2` for positions, velocities and offsets, with `+`, `-`, `*` and `/`',
    'Get a distance with `length` or `distance_to`, and a direction with `normalize`',
    'Move an object toward a target, aim at the mouse, and smooth a camera with `lerp`',
    'Bounce a velocity off a surface with `reflect`, and slide along it by removing the part pointing into it',
    'Use the dot product to decide whether something is in front of an object',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A vector is an arrow',
      blocks: [
        {
          type: 'p',
          text: 'A **vector** is a pair of numbers that describes a step: so far along x, so far along y. It can be a **position** (a step from the origin), an **offset** between two things, or a **velocity** (a step per second). `pygame.Vector2(3, 4)` is a vector that can do arithmetic, and that knows its own length and direction, which tuples cannot do. It also works almost everywhere pygame expects a point: in `draw.circle`, in `rect.center = ...`, in `blit`.',
        },
        {
          type: 'table',
          headers: ['Expression', 'Meaning', 'Example (a = (3, 4), b = (1, 2))'],
          rows: [
            ['`a + b`, `a - b`', 'Add or subtract: combine steps, or find the offset between two points', '`[4, 6]`, `[2, 2]`'],
            ['`a * 2`, `a / 2`', 'Scale by a number', '`[6, 8]`, `[1.5, 2]`'],
            ['`a.length()`', 'The size of the arrow (Pythagoras)', '5.0'],
            ['`a.normalize()`', 'The same direction, length 1 (a **unit vector**)', '`[0.6, 0.8]`'],
            ['`a.scale_to_length(10)`', 'Set the length, in place, keep the direction', '`[6, 8]`'],
            ['`a.distance_to(b)`', 'Distance between two positions', '`distance_to((6, 8))` is 5.0'],
            ['`a.dot(b)`', 'Dot product: large when the arrows point the same way, 0 at a right angle', '11.0'],
            ['`a.lerp(b, t)`', 'A point a fraction `t` of the way from a to b', '`(0,0).lerp((10,20), 0.25)` is `[2.5, 5]`'],
            ['`a.reflect(n)`', 'Bounce off a surface with normal `n`', '`(5, -3).reflect((0, 1))` is `[5, 3]`'],
            ['`a.rotate(deg)`', 'Turn by an angle in degrees', 'Spin a gun, an orbit, a spread of bullets'],
          ],
          caption: 'Vectors are used for positions, velocities, offsets and directions alike.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> from pygame import Vector2
>>> a = Vector2(3, 4)
>>> b = Vector2(1, 2)
>>> print(a + b, a - b, a * 2)
[4, 6] [2, 2] [6, 8]
>>> a.length()
5.0
>>> print(a.normalize())
[0.6, 0.8]
>>> a.dot(b)
11.0
>>> print(Vector2(0, 0).lerp(Vector2(10, 20), 0.25))
[2.5, 5]
>>> a == (3, 4)
True`,
          annotations: [
            { lines: '4-5', text: 'Arithmetic works element by element, and `print` shows a vector as `[x, y]`.' },
            { lines: '6-7', text: 'The length of (3, 4) is 5: the classic 3-4-5 right triangle.' },
            { lines: '8-9', text: '`normalize()` returns a **new** vector with length 1: `[0.6, 0.8]`, since 3 divided by 5 is 0.6 and 4 divided by 5 is 0.8.' },
            { lines: '12-13', text: '`lerp` (linear interpolation) is a quarter of the way from the first point to the second.' },
            { lines: '14-15', text: 'A vector equals a tuple with the same numbers, so you can mix the two freely.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just use x and y?',
          text: 'With separate numbers, "move toward the player" needs four lines of arithmetic and a square root, repeated for x and y. With vectors it is `pos += (player - pos).normalize() * speed`. Each line reads like the idea behind it, which is where bugs are hardest to see. Vectors are also **dimension-free**: the same code works in 3D with `Vector3`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which expression gives a vector of length 1 that points **from** an enemy **to** the player?',
      options: [
        { text: '`(player - enemy).normalize()`', correct: true, why: '`player - enemy` is the offset that goes from the enemy to the player. Normalising keeps the direction and sets the length to 1.' },
        { text: '`(enemy - player).normalize()`', why: 'That points the other way: from the player to the enemy. The enemy would run away.' },
        { text: '`player - enemy`', why: 'It has the right direction, but its length is the distance between them, not 1.' },
        { text: '`(player + enemy).normalize()`', why: 'Adding positions is meaningless here: it points to the combined point from the origin, not toward the player.' },
      ],
      explanation: '"Target minus start" is the offset **to** the target. Remember the order: destination first, then subtract where you are.',
    },
    {
      kind: 'truefalse',
      prompt: 'Calling `.normalize()` on `Vector2(0, 0)` is safe and returns `Vector2(0, 0)`.',
      answer: false,
      explanation: 'False. A vector of length zero has no direction, so pygame raises `ValueError: Can\'t normalize Vector of length Zero`. Always check `if v.length() > 0` (or `if v:`) first, or handle the case of an enemy standing exactly on its target.',
    },
    {
      kind: 'concept',
      title: 'Direction, distance, and the dot product',
      blocks: [
        {
          type: 'p',
          text: 'Nearly every use of vectors in a game is built from one idea: the **offset** `target - position` holds both pieces of information at once. Its **length** is the distance, and its **direction** (the offset normalised) says where to go.',
        },
        {
          type: 'table',
          headers: ['I want to…', 'Code'],
          rows: [
            ['Know how far apart two things are', '`a.distance_to(b)`, or `(b - a).length()`'],
            ['Move toward a target at a given speed', '`pos += (target - pos).normalize() * speed * dt` (stop when within one step)'],
            ['Aim a bullet at the mouse', '`direction = (mouse - gun).normalize()`, then `vel = direction * bullet_speed`'],
            ['Smoothly follow something', '`cam = cam.lerp(target, 0.1)`: close 10 percent of the gap per frame'],
            ['Bounce off a wall', '`vel = vel.reflect(wall_normal)`'],
            ['Slide along a wall', 'Remove the part of the velocity that points into it (see the exercises)'],
            ['Fire a spread of bullets', '`direction.rotate(-15)`, `direction`, `direction.rotate(15)`'],
            ['Check whether a target is in front', '`forward.dot(to_target) > 0`'],
          ],
          caption: 'A small vocabulary covers an enormous range of game behaviour.',
        },
        {
          type: 'p',
          text: 'The **dot product** deserves a special look. For two **unit** vectors it is the cosine of the angle between them: 1 when they point the same way, 0 at a right angle, -1 when they are opposite. So `forward.dot(to_enemy)` answers "is the enemy in front of me?" with no trigonometry at all: positive means in front, negative means behind, and a number such as 0.7 means within about 45 degrees of straight ahead. That is how a guard decides whether it can see you.',
        },
        {
          type: 'code',
          title: 'turret_ball.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

center = pygame.Vector2(320, 180)
ball = pygame.Vector2(100, 100)
vel = pygame.Vector2(180, 120)
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    ball += vel * dt
    if ball.x < 10 or ball.x > 630:
        vel = vel.reflect(pygame.Vector2(1, 0))
        ball.x = max(10, min(630, ball.x))
    if ball.y < 10 or ball.y > 350:
        vel = vel.reflect(pygame.Vector2(0, 1))
        ball.y = max(10, min(350, ball.y))

    mouse = pygame.Vector2(pygame.mouse.get_pos())
    aim = mouse - center
    if aim.length() > 0:
        tip = center + aim.normalize() * 60
    else:
        tip = center

    screen.fill((20, 24, 48))
    pygame.draw.circle(screen, (250, 200, 40), ball, 10)
    pygame.draw.line(screen, (240, 240, 240), center, tip, 4)
    pygame.draw.circle(screen, (90, 200, 240), center, 14)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '18', text: 'Movement is one line: position plus velocity times `dt`. The same line works for any direction.' },
            { lines: '19-21', text: 'Hitting a left or right wall reflects the velocity across the wall’s normal `(1, 0)`: the x part flips and the y part is unchanged. Then the ball is put back inside, so that it cannot stick in the wall.' },
            { lines: '22-24', text: 'The same for the top and bottom, with the normal `(0, 1)`.' },
            { lines: '26-27', text: 'The mouse position as a vector, and the offset from the turret to the mouse.' },
            { lines: '28-31', text: 'The barrel tip is 60 pixels from the centre **in the direction of the mouse**. The `if` avoids normalising a zero vector when the mouse is exactly on the centre.' },
            { lines: '34-36', text: 'Draw the ball, the barrel and the turret hub. `draw.circle` and `draw.line` accept vectors as points.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Mutating vectors: a classic trap',
          text: '`b = a` does not copy a vector: both names point at the same object, so `b += (1, 0)` changes `a` as well. Make a real copy with `b = a.copy()` or `b = pygame.Vector2(a)`. Methods such as `normalize()` and `reflect()` return **new** vectors, while `normalize_ip()` and `scale_to_length()` change the vector itself.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the chase and the bounce.',
      template: `direction = (player - enemy).___()
enemy += direction * speed * dt
vel = vel.___(floor_normal)
gap = enemy.___(player)`,
      templateIsCode: true,
      blanks: [{ answers: ['normalize'] }, { answers: ['reflect'] }, { answers: ['distance_to'] }],
      wordBank: ['normalize', 'reflect', 'distance_to', 'lerp', 'dot', 'rotate'],
      explanation: 'The direction is the normalised offset; `reflect` bounces a velocity off a surface; `distance_to` measures the gap.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is the dot product of the vectors (3, 4) and (1, 2), written out with plain numbers: multiply the x parts, multiply the y parts, add the results.',
      code: `ax, ay = 3, 4
bx, by = 1, 2
print(ax * bx + ay * by)`,
      answer: '11',
      hint: '3 times 1, plus 4 times 2.',
      explanation: '3 x 1 + 4 x 2 = 11. For vectors of different lengths the result is not a cosine, but its **sign** still tells you the story: positive when the arrows point roughly the same way. (`Vector2.dot` gives `11.0`, as a float.)',
    },
    {
      kind: 'concept',
      title: 'Reflect, slide, and turn',
      blocks: [
        {
          type: 'p',
          text: 'A **normal** is a unit vector at right angles to a surface, pointing away from it: for a floor it is "up", `(0, -1)` on the screen, because y grows downwards. Two things can happen when something moving hits a surface:',
        },
        {
          type: 'table',
          headers: ['Response', 'What it does', 'Formula', 'Used for'],
          rows: [
            ['**Bounce**', 'The part of the velocity heading into the surface flips; the rest is unchanged', '`vel.reflect(normal)`, times a "bounciness" below 1 to lose energy', 'Balls, grenades, Pong'],
            ['**Slide**', 'The part of the velocity heading into the surface is removed; the rest stays', '`vel - normal * vel.dot(normal)` when `vel.dot(normal) < 0`', 'A character walking along a wall'],
            ['**Stop**', 'Velocity becomes zero', '`vel = Vector2(0, 0)`', 'Landing, crashing'],
          ],
          caption: 'The dot product `vel.dot(normal)` is how fast the object moves into the surface (negative) or away from it (positive).',
        },
        {
          type: 'p',
          text: 'To turn between an **angle** and a **direction** you need a little trigonometry. `math.atan2(dy, dx)` gives the angle of an offset (in radians; `math.degrees` converts). On the screen, where y grows downwards, an angle of 0 is to the right and 90 degrees is **down**. And `Vector2(math.cos(a), math.sin(a))` is the unit vector for an angle `a` in radians. A **field of view** test combines them: the target is visible if the angle between the facing direction and the target direction is within half the field of view, which, in dot-product terms, means `dot >= cos(fov / 2)`.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'An enemy chases the player, but the game crashes with `ValueError: Can\'t normalize Vector of length Zero` when they meet. Tap the line that raises it.',
      lines: [
        'enemy = pygame.Vector2(100, 100)',
        'player = pygame.Vector2(100, 100)',
        'direction = (player - enemy).normalize()',
        'enemy += direction * 3',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'When the enemy stands exactly on the player, `player - enemy` is the zero vector, which has no direction to normalise. Guard it: `offset = player - enemy`, then `if offset.length() > 0: enemy += offset.normalize() * 3`.',
    },
    {
      kind: 'numeric',
      prompt: 'A camera follows its target by closing 30 percent of the gap each frame: `cam = cam.lerp(target, 0.3)`. The camera starts at x = 0 and the target stays at x = 100. What is the camera’s x after the first frame?',
      answer: '30',
      hint: 'lerp(0, 100, 0.3).',
      explanation: '0 + (100 - 0) x 0.3 = 30. The next frame closes 30 percent of the remaining 70, giving 51, then 65.7, and so on: it eases in smoothly and never overshoots. A smaller factor feels heavier and lazier.',
      label: 'x:',
    },
    {
      kind: 'concept',
      title: 'Your turn: vector toolbox',
      blocks: [
        {
          type: 'p',
          text: 'Three groups of functions that every action game ends up writing. They take and return `pygame.Vector2` objects (and degrees), so the tests need no window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `direction_to(a, b)`: a unit `Vector2` pointing from point `a` to point `b`, or the zero vector `Vector2(0, 0)` if the points are the same. Write `move_toward(pos, target, step)`: a **new** `Vector2` that is `pos` moved `step` units toward `target`, landing exactly on `target` if it is within `step`. The vectors given must not be changed.',
      starter: `import pygame


def direction_to(a, b):
    ...


def move_toward(pos, target, step):
    ...
`,
      solution: `import pygame


def direction_to(a, b):
    offset = pygame.Vector2(b) - pygame.Vector2(a)
    if offset.length() == 0:
        return pygame.Vector2(0, 0)
    return offset.normalize()


def move_toward(pos, target, step):
    pos = pygame.Vector2(pos)
    target = pygame.Vector2(target)
    offset = target - pos
    if offset.length() <= step:
        return target
    return pos + offset.normalize() * step
`,
      setup: PG_SIM,
      tests: `V = pygame.Vector2

def xy(v):
    return (round(v.x, 3), round(v.y, 3))

assert xy(direction_to(V(0, 0), V(3, 4))) == (0.6, 0.8)
assert xy(direction_to(V(10, 0), V(0, 0))) == (-1, 0)
assert xy(direction_to(V(5, 5), V(5, 5))) == (0, 0)
assert xy(direction_to((0, 0), (0, -9))) == (0, -1), "tuples are accepted too"
assert abs(direction_to(V(1, 1), V(8, 5)).length() - 1) < 1e-9
assert xy(move_toward(V(0, 0), V(10, 0), 3)) == (3, 0)
assert xy(move_toward(V(0, 0), V(10, 0), 10)) == (10, 0)
assert xy(move_toward(V(0, 0), V(10, 0), 25)) == (10, 0), "never overshoots"
assert xy(move_toward(V(0, 0), V(3, 4), 2.5)) == (1.5, 2)
assert xy(move_toward(V(5, 5), V(5, 5), 1)) == (5, 5)
assert xy(move_toward(V(10, 10), V(0, 10), 4)) == (6, 10)
a = V(0, 0)
b = V(10, 0)
move_toward(a, b, 3)
assert xy(a) == (0, 0) and xy(b) == (10, 0), "arguments unchanged"
p = V(0, 0)
for _ in range(10):
    p = move_toward(p, V(10, 0), 3)
assert xy(p) == (10, 0), "arrives and stays"`,
      checks: ['`direction_to` is a unit vector from `a` to `b`, and the zero vector for equal points', '`move_toward` steps by exactly `step`, lands on the target when close enough, and never overshoots', 'The arguments are not modified'],
      hint: 'The offset is `target - pos`. Check its `length()` first: if it is `<= step` return the target; otherwise `pos + offset.normalize() * step`. Copy with `pygame.Vector2(x)` so that tuples work.',
      explanation: 'These two small functions are behind chasing enemies, homing missiles, follow-the-leader and click-to-move. The check for "already close enough" is what prevents the shaking an object shows when it overshoots its target every frame.',
    },
    {
      kind: 'code',
      prompt: 'Write `bounce(vel, normal, restitution=1.0)`: the velocity after bouncing off a surface whose unit normal is `normal`, with the result multiplied by `restitution` (1.0 means no energy lost, 0.5 loses half the speed). Write `slide(vel, normal)`: if the velocity points into the surface (its dot product with the normal is negative), remove that part and return the rest; otherwise return the velocity unchanged. Both return new vectors and do not change the arguments.',
      starter: `import pygame


def bounce(vel, normal, restitution=1.0):
    ...


def slide(vel, normal):
    ...
`,
      solution: `import pygame


def bounce(vel, normal, restitution=1.0):
    return vel.reflect(normal) * restitution


def slide(vel, normal):
    into = vel.dot(normal)
    if into >= 0:
        return pygame.Vector2(vel)
    return vel - normal * into
`,
      setup: PG_SIM,
      tests: `V = pygame.Vector2

def xy(v):
    return (round(v.x, 3), round(v.y, 3))

floor = V(0, -1)
assert xy(bounce(V(4, 6), floor)) == (4, -6), "falling ball goes up"
assert xy(bounce(V(4, 6), floor, 0.5)) == (2, -3)
assert xy(bounce(V(-5, 2), V(1, 0))) == (5, 2), "left wall"
assert xy(bounce(V(5, -3), V(0, 1))) == (5, 3), "ceiling"
assert xy(bounce(V(3, 4), V(0, -1), 0)) == (0, 0)
v = V(4, 6)
bounce(v, floor, 0.5)
assert xy(v) == (4, 6), "unchanged"
assert xy(slide(V(4, 6), floor)) == (4, 0), "landing on the floor keeps the horizontal speed"
assert xy(slide(V(4, -6), floor)) == (4, -6), "moving away: unchanged"
assert xy(slide(V(-5, 2), V(1, 0))) == (0, 2), "sliding along a left wall"
assert xy(slide(V(0, 0), V(1, 0))) == (0, 0)
assert xy(slide(V(3, 0), V(0, -1))) == (3, 0), "parallel: unchanged"
w = V(-5, 2)
r = slide(w, V(1, 0))
assert xy(w) == (-5, 2) and r is not w`,
      checks: ['`bounce` reflects the velocity across the normal and then applies the restitution', '`slide` removes only the component of the velocity that points into the surface', 'A velocity moving away from, or along, the surface is returned unchanged; arguments are not modified'],
      hint: '`vel.reflect(normal) * restitution` is a one-liner. For `slide`, `into = vel.dot(normal)`: if it is negative, return `vel - normal * into`.',
      explanation: 'Bounce makes a ball; slide makes a character who walks along walls instead of getting stuck on them. Both use the same fact: the dot product with the normal measures how fast you are moving **into** the wall. Note that the normal must have length 1.',
    },
    {
      kind: 'code',
      prompt: 'Write `aim_angle(origin, target)`: the angle in degrees of the direction from `origin` to `target` (use `math.atan2(dy, dx)` and `math.degrees`). On the screen 0 is right, 90 is down, 180 (or -180) is left and -90 is up. Write `heading(angle_deg)`: the unit `Vector2` for an angle in degrees. Write `is_facing(forward, to_target, fov_deg)`: `True` if the angle between `forward` and `to_target` is at most `fov_deg / 2`, using the dot product of their normalised versions against `math.cos(math.radians(fov_deg / 2))`. If either vector has length 0, return `False`.',
      starter: `import math
import pygame


def aim_angle(origin, target):
    ...


def heading(angle_deg):
    ...


def is_facing(forward, to_target, fov_deg):
    ...
`,
      solution: `import math
import pygame


def aim_angle(origin, target):
    dx = target[0] - origin[0]
    dy = target[1] - origin[1]
    return math.degrees(math.atan2(dy, dx))


def heading(angle_deg):
    a = math.radians(angle_deg)
    return pygame.Vector2(math.cos(a), math.sin(a))


def is_facing(forward, to_target, fov_deg):
    if forward.length() == 0 or to_target.length() == 0:
        return False
    dot = forward.normalize().dot(to_target.normalize())
    return dot >= math.cos(math.radians(fov_deg / 2))
`,
      setup: PG_SIM,
      tests: `V = pygame.Vector2
assert round(aim_angle((0, 0), (10, 0)), 3) == 0
assert round(aim_angle((0, 0), (0, 10)), 3) == 90
assert round(aim_angle((0, 0), (-10, 0)), 3) == 180
assert round(aim_angle((0, 0), (0, -10)), 3) == -90
assert round(aim_angle((5, 5), (6, 6)), 3) == 45
assert round(aim_angle((100, 100), (100 + 3, 100 + 4)), 3) == 53.13

def xy(v):
    return (round(v.x, 3), round(v.y, 3))

assert xy(heading(0)) == (1, 0)
assert xy(heading(90)) == (0, 1)
assert xy(heading(180)) == (-1, 0)
assert xy(heading(-90)) == (0, -1)
assert xy(heading(45)) == (0.707, 0.707)
for a in (0, 30, 77, -120, 200):
    assert round(aim_angle((0, 0), heading(a)) - a, 3) % 360 in (0, 360, 0.0)
fwd = V(1, 0)
assert is_facing(fwd, V(10, 0), 90) is True
assert is_facing(fwd, V(10, 5), 90) is True, "about 27 degrees off"
assert is_facing(fwd, V(10, -5), 90) is True
assert is_facing(fwd, V(5, 10), 90) is False, "about 63 degrees off"
assert is_facing(fwd, V(-3, 0), 90) is False, "behind"
assert is_facing(fwd, V(5, 10), 150) is True
assert is_facing(fwd, V(1, 0.2), 180) is True
assert is_facing(V(0, 0), V(1, 0), 90) is False
assert is_facing(fwd, V(0, 0), 90) is False
assert is_facing(V(0, 5), V(0, 100), 10) is True, "forward need not be a unit vector"`,
      checks: ['`aim_angle` gives 0 for right, 90 for down, 180 for left, -90 for up', '`heading` is the unit vector for an angle in degrees, and undoes `aim_angle`', '`is_facing` compares the dot product of the unit vectors with the cosine of half the field of view, and handles zero vectors'],
      hint: '`math.atan2(dy, dx)` takes y first. `Vector2(math.cos(a), math.sin(a))` with `a` in radians. For `is_facing`, normalise both vectors before the dot product.',
      explanation: 'Angle and direction are two ways to say the same thing, and the code needs both: angles for rotating sprites and turret speeds, direction vectors for moving and for dot-product tests. A guard that checks `is_facing(...)` and a distance is the first step of enemy AI.',
    },
  ],
  takeaways: [
    '`pygame.Vector2(x, y)` is a pair of numbers that does arithmetic, and knows `length()`, `normalize()`, `distance_to()`, `dot()`, `lerp()`, `reflect()` and `rotate()`. It can be used wherever pygame wants a point.',
    'The offset `target - position` holds the distance (its length) and the direction (its normalised form). `pos += (target - pos).normalize() * speed * dt` moves toward a target.',
    'Never `normalize()` a zero vector: it raises `ValueError`. Check `length() > 0` first, and stop when within one step, so objects do not overshoot.',
    '`lerp(target, 0.1)` closes a fraction of the gap each frame: smooth cameras, fading and easing.',
    '`reflect(normal)` bounces; `vel - normal * vel.dot(normal)` slides along a surface. A normal is a **unit** vector pointing away from the surface (up is `(0, -1)` on screen).',
    'The dot product of unit vectors is the cosine of the angle between them: positive means "in front", and `dot >= cos(fov / 2)` is a field-of-view test. `b = a` does not copy a vector; use `a.copy()`.',
  ],
  reading: [
    { title: 'pygame docs: pygame.math (Vector2, Vector3)', url: 'https://www.pygame.org/docs/ref/math.html', source: 'docs', note: 'Every vector method, with the exact behaviour of reflect, lerp and angle_to.' },
    { title: 'Khan Academy: Vectors and Spaces', url: 'https://www.khanacademy.org/math/linear-algebra/vectors-and-spaces', source: 'course', note: 'The mathematics of vectors, from first principles, if you want to go further.' },
    { title: 'Wikipedia: Dot product', url: 'https://en.wikipedia.org/wiki/Dot_product', source: 'wikipedia', note: 'The geometric meaning of the dot product, and why it is a cosine.' },
    { title: 'Kids Can Code: Vectors in pygame', url: 'https://kidscancode.org/blog/2016/08/pygame_1-3_working-with-sprites/', source: 'tutorial', note: 'Practical use of vectors for movement in a pygame series.' },
  ],
};
