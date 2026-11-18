import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-collisions',
  title: 'Collision Detection and Response',
  summary: 'Detect hits with rectangles, circles and groups, then respond: destroy, damage, or stop at a wall. Why fast objects tunnel, and how to move one axis at a time.',
  minutes: 42,
  objectives: [
    'Use `spritecollide`, `spritecollideany` and `groupcollide`, and say what each returns',
    'Detect collisions between circles with a squared-distance test, and between a circle and a rectangle',
    'Explain why a smaller hitbox often feels fairer than the picture’s rectangle',
    'Explain tunnelling, and avoid it with smaller steps',
    'Stop a moving rectangle at walls by moving and resolving one axis at a time',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Detecting hits between groups',
      blocks: [
        {
          type: 'p',
          text: 'A game is mostly "did these two things touch?" followed by "so what happens?". Detection is the easy half, because the rectangles you already have do most of the work. The `pygame.sprite` module wraps the rectangle test so that it works on groups of sprites:',
        },
        {
          type: 'table',
          headers: ['Function', 'Question it answers', 'Returns'],
          rows: [
            ['`spritecollide(sprite, group, dokill)`', 'Which sprites of `group` does `sprite` touch?', 'A **list** of those sprites (empty if none). With `dokill=True` they are killed.'],
            ['`spritecollideany(sprite, group)`', 'Does it touch **any**?', 'One sprite that it touches, or `None`: fast, and good in an `if`.'],
            ['`groupcollide(g1, g2, kill1, kill2)`', 'Which sprites of two groups touch?', 'A **dictionary**: each sprite of `g1` that hit something, mapped to the list of `g2` sprites it hit.'],
            ['`sprite.rect.colliderect(other.rect)`', 'Do these two rectangles overlap?', 'A single `True` or `False`.'],
          ],
          caption: 'All of them use `sprite.rect` by default. The first argument of `spritecollide` is a **sprite**; the second must be a **group**.',
        },
        {
          type: 'code',
          title: 'collisions_demo.py',
          desktopOnly: true,
          code: `import random
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()


class Block(pygame.sprite.Sprite):
    def __init__(self, size, color, pos, velocity=(0, 0)):
        super().__init__()
        self.image = pygame.Surface(size)
        self.image.fill(color)
        self.pos = pygame.Vector2(pos)
        self.velocity = pygame.Vector2(velocity)
        self.rect = self.image.get_rect(center=self.pos)

    def update(self, dt):
        self.pos += self.velocity * dt
        self.rect.center = self.pos
        if self.rect.top > 360 or self.rect.bottom < 0:
            self.kill()


player = Block((40, 20), (90, 200, 240), (320, 330))
all_sprites = pygame.sprite.Group(player)
enemies = pygame.sprite.Group()
bullets = pygame.sprite.Group()
score = 0
spawn_timer = 0.0
shot_timer = 0.0
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    player.velocity.x = (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * 300
    shot_timer -= dt
    if keys[pygame.K_SPACE] and shot_timer <= 0:
        shot_timer = 0.25
        bullet = Block((6, 14), (250, 230, 80), player.rect.midtop, (0, -400))
        bullets.add(bullet)
        all_sprites.add(bullet)

    spawn_timer -= dt
    if spawn_timer <= 0:
        spawn_timer = 0.6
        x = random.randint(20, 620)
        enemy = Block((30, 30), (220, 70, 70), (x, -20), (0, 120))
        enemies.add(enemy)
        all_sprites.add(enemy)

    all_sprites.update(dt)
    player.rect.clamp_ip(screen.get_rect())
    player.pos.update(player.rect.center)

    shot_down = pygame.sprite.groupcollide(bullets, enemies, True, True)
    score += len(shot_down)
    rammed = pygame.sprite.spritecollide(player, enemies, True)
    score -= len(rammed)
    pygame.display.set_caption(f"Score {score}")

    screen.fill((20, 24, 48))
    all_sprites.draw(screen)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '9-22', text: 'One small class serves every object: the player, bullets and enemies are just blocks with different sizes, colours and velocities. Off-screen blocks kill themselves.' },
            { lines: '25-28', text: 'The player, and three groups: everything (to update and draw), enemies and bullets (to test collisions against).' },
            { lines: '42-47', text: 'A **cooldown timer** limits shooting to once per quarter second, as in the delta-time lesson. The bullet starts at the top-centre of the player and flies upward.' },
            { lines: '49-55', text: 'A spawn timer adds an enemy above the screen every 0.6 seconds, at a random x.' },
            { lines: '61-62', text: '`groupcollide(bullets, enemies, True, True)` kills **both** the bullets and the enemies that touch. It returns a dictionary, so its length is the number of bullets that hit.' },
            { lines: '63-64', text: '`spritecollide(player, enemies, True)` finds the enemies that hit the player, and kills them. A different response for a different pair: the player loses a point.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why detection and response are separate',
          text: 'Detection answers a yes-or-no question and changes nothing (unless you pass `dokill`). The **response** is game design: kill both, damage one, bounce, collect, open a door. Keeping them apart lets the same detection serve many rules: `spritecollide` between player and coins collects, between player and enemies hurts, and between player and walls blocks.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You want "bullets and enemies that touch both disappear", and you want to count how many bullets hit. Which call fits?',
      options: [
        { text: '`pygame.sprite.groupcollide(bullets, enemies, True, True)`, and `len` of the dictionary it returns', correct: true, why: 'Both kill flags are `True`, so both sprites are removed, and each key of the returned dictionary is a bullet that hit.' },
        { text: '`pygame.sprite.spritecollide(bullets, enemies, True)`', why: 'The first argument of `spritecollide` must be a single sprite, not a group. A group has no `rect`, so it fails.' },
        { text: '`bullets.rect.colliderect(enemies.rect)`', why: 'Groups do not have a `rect`: they are containers. You would have to loop over the sprites yourself.' },
        { text: '`pygame.sprite.spritecollideany(bullets, enemies)`', why: 'Again a group is given where one sprite is expected, and it would only tell you about one hit.' },
      ],
      explanation: '`groupcollide` is the group-against-group tool; its two flags say which side to kill.',
    },
    {
      kind: 'truefalse',
      prompt: '`pygame.sprite.spritecollide(player, enemies, False)` returns `True` or `False`, depending on whether the player touches any enemy.',
      answer: false,
      explanation: 'False. It returns a **list** of the enemies touched. A non-empty list counts as true in an `if`, so `if pygame.sprite.spritecollide(...)` works, but the list also tells you **which** enemies, so that you can damage each of them. For a plain yes or no, `spritecollideany` is cheaper.',
    },
    {
      kind: 'concept',
      title: 'Fairer hitboxes, and circles',
      blocks: [
        {
          type: 'p',
          text: 'A sprite’s `rect` is the rectangle around its picture, and a round or irregular shape does not fill it. A rocket with a long flame, or a character with a thin sword, will "hit" things its picture does not appear to touch. Players notice, and it feels unfair when **they** are hit by an almost-miss; but it feels fine if they hit **by** an almost-miss. So the usual advice is to make the player’s hitbox **smaller** than the picture:',
        },
        {
          type: 'code',
          code: `class Player(pygame.sprite.Sprite):
    def __init__(self, pos):
        super().__init__()
        self.image = pygame.Surface((48, 48))
        self.rect = self.image.get_rect(center=pos)
        self.hitbox = self.rect.inflate(-24, -24)

    def update(self, dt):
        self.hitbox.center = self.rect.center`,
          annotations: [
            { lines: '5', text: 'The visible rectangle, used for drawing.' },
            { lines: '6', text: '`inflate(-24, -24)` shrinks it around the centre by 24 pixels in each direction: a 24 by 24 core. This is what enemies must touch to hurt.' },
            { lines: '8-9', text: 'Keep the hitbox centred on the picture every frame.' },
          ],
        },
        {
          type: 'p',
          text: 'To use it with the group functions, pass a **collided** callback: `pygame.sprite.spritecollide(player, enemies, False, lambda a, b: a.hitbox.colliderect(b.rect))`. The callback receives the two sprites and returns whether they collide. pygame also provides `collide_circle`, `collide_rect_ratio(0.6)` (a scaled rectangle) and `collide_mask` (pixel-exact, using the picture’s transparency, slower) for the cases where rectangles are not good enough.',
        },
        {
          type: 'p',
          text: '**Circles** suit balls, bullets and round characters, and they have a pleasant property: the hit does not depend on rotation. Two circles collide when the distance between their centres is **less than the sum of their radii**. To skip the square root, compare **squared** values: `dx*dx + dy*dy < (r1 + r2)**2`. A circle and a rectangle collide when the point of the rectangle **nearest** to the circle’s centre is closer than the radius, and that point is found by clamping the centre to the rectangle’s edges.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Squared distances',
          text: 'Square roots are slow and not needed for comparing: if `a < b` then `a*a < b*b` for positive numbers. Games compare squared distances everywhere (`Vector2.length_squared()` and `distance_squared_to()` exist for this reason).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the collision code: kill coins the player touches, and test two circles without a square root.',
      template: `collected = pygame.sprite.___(player, coins, ___)
close = dx * dx + dy * dy < (r1 + ___) ** 2`,
      templateIsCode: true,
      blanks: [{ answers: ['spritecollide'] }, { answers: ['True'] }, { answers: ['r2'] }],
      wordBank: ['spritecollide', 'True', 'r2', 'groupcollide', 'False', 'dx'],
      explanation: '`spritecollide(sprite, group, True)` removes the touched sprites; two circles collide when the squared distance is less than the squared sum of the radii.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Two circles of radius 2 have centres 3 apart horizontally and 4 apart vertically. Do they collide?',
      code: `dx, dy = 3, 4
r1, r2 = 2, 2
print(dx * dx + dy * dy < (r1 + r2) ** 2)`,
      answer: 'False',
      hint: 'The centres are 5 apart (3-4-5), and the radii add up to 4.',
      explanation: 'The squared distance is 9 + 16 = 25 and `(2 + 2) ** 2` is 16. Since 25 is not less than 16, the circles are apart: a gap of 5 - 4 = 1. Comparing the squares avoids computing the square root of 25.',
    },
    {
      kind: 'concept',
      title: 'Response: tunnelling and stopping at walls',
      blocks: [
        {
          type: 'p',
          text: 'Collision tests are checked **once per frame**, on the positions at that moment. An object that moves farther than the thickness of what it hits in one frame can pass **through** it without ever overlapping at the moments checked. This is called **tunnelling**: a bullet at 1200 pixels per second moves 20 pixels per frame at 60 FPS, and a 6-pixel wall is in the gap between two frames. Remedies, from simple to complex: keep speeds lower than the thinnest wall; make walls thick; limit `dt` (see the delta-time lesson); split a fast move into several small steps and check after each; or test the whole segment the object travelled (a "swept" test).',
        },
        {
          type: 'p',
          text: 'The other classic response is **stopping at walls**. Moving the rectangle by `(dx, dy)` and then pushing it out of whichever walls it overlaps does not tell you **which way** to push. The reliable method is to resolve **one axis at a time**:',
        },
        {
          type: 'table',
          headers: ['Step', 'What to do'],
          rows: [
            ['1', 'Move the rectangle by `dx` **only**'],
            ['2', 'For each wall it now overlaps: if `dx > 0` put its `right` at the wall’s `left`; if `dx < 0` put its `left` at the wall’s `right`'],
            ['3', 'Move the rectangle by `dy` **only**'],
            ['4', 'For each wall it now overlaps: if `dy > 0` put its `bottom` at the wall’s `top` (landed); if `dy < 0` put its `top` at the wall’s `bottom` (bumped a ceiling)'],
          ],
          caption: 'Because only one axis moved, you know the side of the wall that was hit.',
        },
        {
          type: 'p',
          text: 'The result is a character that **slides** along walls: walking diagonally into a wall keeps the movement along it, because only the blocked axis is cancelled. It also tells you when the character has landed (the vertical step hit a floor), which a platformer needs for jumping.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not push out by the smallest overlap?',
          text: 'Pushing out of the shallowest overlap often works, but in corners and with several walls it can choose the wrong side and pop the player through, or onto the top of a wall they touched from the side. Moving one axis at a time never has to guess: whatever blocked the x step is a side wall, and whatever blocked the y step is a floor or ceiling.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The program crashes with `AttributeError: \'Enemy\' object has no attribute \'sprites\'`. Tap the line with the mistake.',
      lines: [
        'enemy = Enemy()',
        'enemies = pygame.sprite.Group(enemy)',
        'hits = pygame.sprite.spritecollide(player, enemy, True)',
        'score += len(hits)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The second argument of `spritecollide` must be a **group** (it is going through its sprites), but here a single sprite, `enemy`, is given. Pass `enemies`. The error complains that an `Enemy` has no `sprites` method because only groups do.',
    },
    {
      kind: 'numeric',
      prompt: 'Two circles, one with radius 20 and one with radius 15, are just touching (neither overlapping nor apart). How far apart are their centres?',
      answer: '35',
      hint: 'Just touching means the distance equals the sum of the radii.',
      explanation: '20 + 15 = 35. Closer than 35 and they overlap; farther and they are apart. The test `distance < r1 + r2` is exactly this boundary.',
      label: 'Distance:',
    },
    {
      kind: 'concept',
      title: 'Your turn: collision functions',
      blocks: [
        {
          type: 'p',
          text: 'Three practical pieces: circle tests, a character that stops at walls, and a combat resolver that uses the real group functions. They use only behaviour that the in-app stand-in and real pygame share.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `circles_collide(c1, r1, c2, r2)` that returns `True` when the circles with centres `c1`, `c2` (pairs) and radii `r1`, `r2` overlap: the squared distance between the centres is **less than** the squared sum of the radii (touching is not colliding). Write `circle_hits_rect(center, radius, rect)` for a circle and a `pygame.Rect`: find the point of the rect nearest to `center` (clamp `x` between `rect.left` and `rect.right`, and `y` between `rect.top` and `rect.bottom`), and return `True` if its squared distance to `center` is less than `radius` squared.',
      starter: `import pygame


def circles_collide(c1, r1, c2, r2):
    ...


def circle_hits_rect(center, radius, rect):
    ...
`,
      solution: `import pygame


def circles_collide(c1, r1, c2, r2):
    dx = c2[0] - c1[0]
    dy = c2[1] - c1[1]
    return dx * dx + dy * dy < (r1 + r2) ** 2


def circle_hits_rect(center, radius, rect):
    nx = max(rect.left, min(center[0], rect.right))
    ny = max(rect.top, min(center[1], rect.bottom))
    dx = center[0] - nx
    dy = center[1] - ny
    return dx * dx + dy * dy < radius * radius
`,
      setup: PG_SIM,
      tests: `assert circles_collide((0, 0), 10, (15, 0), 10) is True
assert circles_collide((0, 0), 10, (20, 0), 10) is False, "just touching is not colliding"
assert circles_collide((0, 0), 10, (30, 0), 10) is False
assert circles_collide((0, 0), 2, (3, 4), 2) is False
assert circles_collide((0, 0), 3, (3, 4), 3) is True
assert circles_collide((5, 5), 1, (5, 5), 1) is True
assert circles_collide((-10, -10), 5, (-10, 0), 5) is False
assert circles_collide((0, 0), 5, (0, -9), 5) is True
R = pygame.Rect
box = R(10, 10, 20, 20)
assert circle_hits_rect((20, 20), 1, box) is True, "centre inside"
assert circle_hits_rect((5, 20), 6, box) is True
assert circle_hits_rect((5, 20), 5, box) is False, "just touching the left edge"
assert circle_hits_rect((0, 0), 5, box) is False
assert circle_hits_rect((5, 5), 7, box) is False, "the corner is 7.07 away"
assert circle_hits_rect((5, 5), 8, box) is True, "corner distance is 7.07"
assert circle_hits_rect((35, 20), 5, box) is False
assert circle_hits_rect((36, 20), 7, box) is True
assert circle_hits_rect((20, 40), 10, box) is False and circle_hits_rect((20, 40), 11, box) is True`,
      checks: ['`circles_collide` compares the squared distance of the centres with the squared sum of radii, strictly', '`circle_hits_rect` finds the nearest point of the rectangle by clamping, then compares squared distances', 'Touching exactly is not a collision, and a centre inside the rectangle always collides'],
      hint: 'For the rectangle, the nearest point is `(clamp(cx, left, right), clamp(cy, top, bottom))` with `max(lo, min(value, hi))`. If the centre is inside, the nearest point is the centre itself (distance 0).',
      explanation: 'The clamping trick works for any position of the circle: inside the rectangle the clamp changes nothing (distance 0), beside it the nearest point is on an edge, and diagonally from a corner the nearest point is the corner. It is a very useful little piece of geometry.',
    },
    {
      kind: 'code',
      prompt: 'Write `move_and_collide(rect, dx, dy, walls)` that returns a tuple `(new_rect, hit_x, hit_y)`. It does **not** change the `rect` given. Move a copy by `dx` along x only; for every wall (a `pygame.Rect`) that overlaps (`colliderect`), if `dx > 0` set its `right` to the wall’s `left`, and if `dx < 0` set its `left` to the wall’s `right`; `hit_x` is `True` if any wall stopped it. Then do the same for the y axis with `dy`, `bottom` and `top`. `hit_y` is `True` if any wall stopped it vertically.',
      starter: `import pygame


def move_and_collide(rect, dx, dy, walls):
    ...
`,
      solution: `import pygame


def move_and_collide(rect, dx, dy, walls):
    new = rect.copy()
    hit_x = False
    hit_y = False
    new.x += dx
    for wall in walls:
        if new.colliderect(wall):
            if dx > 0:
                new.right = wall.left
                hit_x = True
            elif dx < 0:
                new.left = wall.right
                hit_x = True
    new.y += dy
    for wall in walls:
        if new.colliderect(wall):
            if dy > 0:
                new.bottom = wall.top
                hit_y = True
            elif dy < 0:
                new.top = wall.bottom
                hit_y = True
    return new, hit_x, hit_y
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
me = R(0, 0, 10, 10)
walls = [R(50, 0, 10, 100), R(0, 50, 100, 10)]

r, hx, hy = move_and_collide(me, 20, 0, walls)
assert (r.topleft, hx, hy) == ((20, 0), False, False)
assert me.topleft == (0, 0), "the rect given is not changed"
r, hx, hy = move_and_collide(me, 55, 0, walls)
assert (r.right, r.y, hx, hy) == (50, 0, True, False), (r, hx, hy)
r, hx, hy = move_and_collide(me, 0, 55, walls)
assert (r.bottom, r.x, hx, hy) == (50, 0, False, True)
r, hx, hy = move_and_collide(R(20, 20, 10, 10), 30, 30, walls)
assert (r.right, r.bottom, hx, hy) == (50, 50, True, True), "stops at both walls (a corner)"
r, hx, hy = move_and_collide(R(70, 20, 10, 10), -15, 0, walls)
assert (r.left, hx) == (60, True), "walking left into the right face of a wall"
r, hx, hy = move_and_collide(R(20, 70, 10, 10), 0, -15, walls)
assert (r.top, hy) == (60, True), "bumping a ceiling"
r, hx, hy = move_and_collide(R(30, 30, 10, 10), 10, 0, walls)
assert hx is False and r.x == 40, "right edge exactly at the wall: touching is allowed"
r, hx, hy = move_and_collide(R(30, 30, 10, 10), 15, 15, walls)
r, hx, hy = move_and_collide(R(35, 30, 10, 10), 20, 10, walls)
assert hx is True and r.right == 50, "stopped by the side wall"
assert hy is False and r.y == 40, "but it still slides down along the wall"
r, hx, hy = move_and_collide(me, 0, 0, walls)
assert (r.topleft, hx, hy) == ((0, 0), False, False)
r, hx, hy = move_and_collide(me, 5, 5, [])
assert (r.topleft, hx, hy) == ((5, 5), False, False)`,
      checks: ['Moves along x first and resolves walls using `right`/`left`, then along y using `bottom`/`top`', 'Returns the moved copy and whether each axis was blocked, leaving the original unchanged', 'Sliding works: a blocked x movement does not cancel the y movement'],
      hint: 'Copy the rect. `new.x += dx`, then for each wall that `colliderect`s, put `new.right = wall.left` when `dx > 0` (or `new.left = wall.right` when `dx < 0`) and set `hit_x = True`. Repeat for y.',
      explanation: 'Resolving the axes separately is the foundation of nearly every 2D platformer and top-down game. The sliding behaviour comes for free, and `hit_y` with `dy > 0` is exactly "the character is standing on the ground", which the physics lesson will use for jumping.',
    },
    {
      kind: 'code',
      prompt: 'Write `resolve_combat(player, bullets, enemies)` using the real group functions. First, `groupcollide(bullets, enemies, True, True)`: bullets and enemies that touch are both killed; the number of enemies **destroyed** is the number of distinct enemies in the result. Then, `spritecollide(player, enemies, True)`: the enemies that reach the player are also killed, and each one is one point of damage. Return the tuple `(destroyed, damage)`.',
      starter: `import pygame


def resolve_combat(player, bullets, enemies):
    ...
`,
      solution: `import pygame


def resolve_combat(player, bullets, enemies):
    hits = pygame.sprite.groupcollide(bullets, enemies, True, True)
    destroyed = {e for victims in hits.values() for e in victims}
    rammed = pygame.sprite.spritecollide(player, enemies, True)
    return len(destroyed), len(rammed)
`,
      setup: PG_SIM,
      tests: `class Box(pygame.sprite.Sprite):
    def __init__(self, x, y, w=10, h=10):
        super().__init__()
        self.image = pygame.Surface((w, h))
        self.rect = self.image.get_rect(center=(x, y))

player = Box(100, 200, 20, 20)
bullets = pygame.sprite.Group()
enemies = pygame.sprite.Group()
assert resolve_combat(player, bullets, enemies) == (0, 0)
b1, b2 = Box(10, 10), Box(60, 60)
e1, e2, e3 = Box(12, 12), Box(200, 10), Box(100, 205)
bullets.add(b1, b2)
enemies.add(e1, e2, e3)
everything = pygame.sprite.Group(player, b1, b2, e1, e2, e3)
assert resolve_combat(player, bullets, enemies) == (1, 1)
assert b1 not in bullets and e1 not in enemies, "hit bullet and enemy are killed"
assert e3 not in enemies, "the enemy that rammed the player is killed"
assert b2 in bullets and e2 in enemies, "the others are untouched"
assert len(everything) == 3
assert resolve_combat(player, bullets, enemies) == (0, 0)
more = [Box(300, 30), Box(300, 80)]
shots = [Box(300, 30), Box(300, 80), Box(500, 500)]
bullets2, enemies2 = pygame.sprite.Group(*shots), pygame.sprite.Group(*more)
assert resolve_combat(player, bullets2, enemies2) == (2, 0)
assert len(bullets2) == 1 and len(enemies2) == 0
pl2 = Box(50, 50, 20, 20)
close = pygame.sprite.Group(Box(50, 50), Box(55, 55), Box(400, 400))
assert resolve_combat(pl2, pygame.sprite.Group(), close) == (0, 2)
assert len(close) == 1`,
      checks: ['Bullets and enemies that touch are both removed, and the number of destroyed enemies is returned', 'Enemies touching the player are removed and counted as damage', 'Untouched sprites stay in their groups'],
      hint: '`hits = pygame.sprite.groupcollide(bullets, enemies, True, True)` maps each bullet to a list of enemies. A set comprehension over `hits.values()` gives the distinct enemies. Then `spritecollide(player, enemies, True)` returns a list.',
      explanation: 'This is the "rules" function of a shooter. Counting distinct enemies (a set) guards against the case where two bullets hit one enemy. Later lessons add health, explosions and score on top of the same two calls.',
    },
  ],
  takeaways: [
    '`spritecollide(sprite, group, dokill)` returns a **list** of touched sprites; `spritecollideany` returns one or `None`; `groupcollide(g1, g2, kill1, kill2)` returns a **dict** from sprites of `g1` to lists from `g2`. The first argument of `spritecollide` is one sprite; the second must be a group.',
    'Detection says **whether**; the response is game design: kill, damage, collect, bounce or block. Use a different pair of groups for each rule.',
    'A rectangle is only an approximation of a shape. Make the **player’s** hitbox smaller than the picture (`rect.inflate(-w, -h)`) so that hits feel fair, and use a `collided` callback, `collide_circle` or `collide_mask` when needed.',
    'Circles collide when `distance < r1 + r2`; compare **squared** values to skip the square root. Circle against rectangle: clamp the circle’s centre to the rectangle to find the nearest point.',
    '**Tunnelling**: objects that move farther than a wall’s thickness in one frame skip through it. Limit speed and `dt`, use thicker walls, or take several small steps.',
    'To stop at walls, move **one axis at a time**: move x, push out of walls on x; move y, push out on y. That slides along walls and tells you when the object has landed.',
  ],
  reading: [
    { title: 'pygame docs: pygame.sprite (collision functions)', url: 'https://www.pygame.org/docs/ref/sprite.html#pygame.sprite.spritecollide', source: 'docs', note: 'spritecollide, groupcollide, collide_circle, collide_mask and their parameters.' },
    { title: 'pygame docs: pygame.mask', url: 'https://www.pygame.org/docs/ref/mask.html', source: 'docs', note: 'Pixel-perfect collision using the transparency of images.' },
    { title: 'Wikipedia: Collision detection', url: 'https://en.wikipedia.org/wiki/Collision_detection', source: 'wikipedia', note: 'An overview of the methods, including broad and narrow phases and tunnelling.' },
    { title: 'Game Programming Patterns: Spatial Partition', url: 'https://gameprogrammingpatterns.com/spatial-partition.html', source: 'book', note: 'How big games avoid testing every object against every other.' },
  ],
};
