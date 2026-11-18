import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-project-build',
  title: 'Capstone 2: Build the Game Engine',
  summary: 'Write the logic layer of Star Defender (the ship, bullets, enemies, collisions and the world that runs them) and play the first complete version of the game.',
  minutes: 48,
  objectives: [
    'Build a game in milestones: ship, bullets, enemies, collisions, then score, lives and levels',
    'Write a `Ship` with clamped movement and a fire-rate cooldown, and bullets that are created by it',
    'Resolve bullet-enemy collisions so that each bullet hits at most one enemy and tougher enemies take several hits',
    'Write a `World.update` whose steps run in a deliberate order, and explain why that order matters',
    'Use events and hooks so that the logic layer stays free of drawing and sound',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Milestones: always have a game you can run',
      blocks: [
        {
          type: 'p',
          text: 'The plan from the last lesson has one more rule: **build in milestones, and keep the game runnable at every one**. Do not write a thousand lines and then run them. After each step below the program works, a little more of it each time, and when a bug appears you know it is in the last few lines you wrote.',
        },
        {
          type: 'table',
          headers: ['Milestone', 'What you add', 'How you know it works'],
          rows: [
            ['**1. A ship**', 'The `Ship` class: left and right movement, clamped to the screen', 'The ship slides and stops at both edges'],
            ['**2. Shooting**', 'Bullets, and a cooldown so holding Space gives a steady stream', 'A line of bullets leaves the ship; none when you release'],
            ['**3. Enemies**', '`Enemy` objects that spawn above the screen and fall', 'They appear at random places and move down'],
            ['**4. Collisions**', '`collide_bullets`, ship contact, enemies passing the bottom', 'Bullets destroy enemies; touching one costs a life'],
            ['**5. Rules**', 'Score, lives, levels, game over', 'It gets harder; losing ends the game; R restarts'],
          ],
          caption: 'The game below is milestone 5: a complete, playable game. The exercises build its logic piece by piece, in the same order.',
        },
        {
          type: 'p',
          text: 'The logic layer has five parts. Each is small, and each can be tested alone:',
        },
        {
          type: 'table',
          headers: ['Part', 'Responsibility', 'Knows about'],
          rows: [
            ['`Bullet`', 'A position, and the rectangle at that position', 'Nothing else'],
            ['`Enemy`', 'A position, hit points and a score value', 'Nothing else'],
            ['`Ship`', 'Moves on a line; decides when a bullet is created', '`Bullet`'],
            ['`collide_bullets`', 'A pure function: which bullets and enemies are left, which enemies died', '`Bullet`, `Enemy`'],
            ['`World`', 'Owns everything; one `update` call is one tick of the game', 'All of the above, and the difficulty functions'],
          ],
          caption: 'Notice that no part knows about the keyboard, the window or the sound: those belong to the presentation layer.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why do positions use floats and a rectangle property?',
          text: 'A `Rect` stores whole numbers, so adding 0.3 pixels per frame to a `Rect` would lose the movement. Each object therefore keeps `x` and `y` as **floats**, and a `rect` property builds a rectangle from them (rounded) whenever a collision test needs one. Movement stays smooth at any frame rate, and the rectangle is only ever used for overlap tests.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which of these belongs in the **logic layer** of Star Defender, rather than in the pygame (presentation) layer?',
      options: [
        { text: 'Deciding that a bullet hit an enemy and adding to the score', correct: true, why: 'This is a rule of the game; it needs no window and can be tested directly.' },
        { text: 'Drawing the ship as a triangle', why: 'Drawing is presentation: the logic only knows where the ship is.' },
        { text: 'Reading the arrow keys with `pygame.key.get_pressed()`', why: 'Input devices belong to the presentation layer, which hands the logic a plain direction number.' },
        { text: 'Playing the explosion sound', why: 'Sound is a reaction to an event; the logic only records the event.' },
      ],
      explanation: 'A rule of thumb: if it would still be true when the game is played with a different screen, keyboard and speakers, it is logic.',
    },
    {
      kind: 'truefalse',
      prompt: 'In `World.update`, bullets and enemies are both moved **before** collisions are tested, so the test looks at where they are now, not where they were.',
      answer: true,
      explanation: 'True. The update moves everything first, then resolves collisions on the new positions. If collisions were tested first, a fast bullet could move **through** an enemy in one frame without ever overlapping it at the moment of the test.',
    },
    {
      kind: 'concept',
      title: 'The first playable version',
      blocks: [
        {
          type: 'p',
          text: 'Here is the complete game at milestone 5. The top half is the **logic layer**: you will recognise every class, because the exercises build them. The bottom half is a thin **presentation layer**: a `draw_world` function, and a `main` that turns keys into `direction` and `firing`, calls `world.update`, and draws. Use the arrow keys (or A and D) to move, hold Space to fire, and press R after a game over. There are no image files: the ship, bullets and enemies are drawn with `pygame.draw`.',
        },
        {
          type: 'code',
          title: 'star_defender.py',
          desktopOnly: true,
          code: `import random

import pygame

WIDTH, HEIGHT = 480, 640


def level_for_score(score):
    return 1 + score // 100


def spawn_interval(level):
    return max(0.35, 1.25 - 0.125 * (level - 1))


def enemy_speed(level):
    return min(220, 70 + 12 * (level - 1))


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Enemy:
    W, H = 32, 24

    def __init__(self, x, y, hp=1, points=10):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.points = points

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Ship:
    W, H = 36, 28

    def __init__(self, x=222, y=580, speed=300, delay=0.25):
        self.x = float(x)
        self.y = y
        self.speed = speed
        self.delay = delay
        self.cooldown = 0.0

    @property
    def rect(self):
        return pygame.Rect(round(self.x), self.y, self.W, self.H)

    def update(self, dt, direction, firing):
        self.x = max(0, min(WIDTH - self.W, self.x + direction * self.speed * dt))
        self.cooldown = max(0.0, self.cooldown - dt)
        if firing and self.cooldown <= 0:
            self.cooldown = self.delay
            return [Bullet(self.x + self.W / 2 - Bullet.W / 2, self.y - Bullet.H)]
        return []


def collide_bullets(bullets, enemies):
    left = []
    destroyed = []
    for bullet in bullets:
        target = None
        for enemy in enemies:
            if enemy.hp > 0 and bullet.rect.colliderect(enemy.rect):
                target = enemy
                break
        if target is None:
            left.append(bullet)
        else:
            target.hp -= 1
            if target.hp <= 0:
                destroyed.append(target)
    alive = [e for e in enemies if e.hp > 0]
    return left, alive, destroyed


class World:
    BULLET_SPEED = 520
    INVULNERABLE = 1.5

    def __init__(self, rng):
        self.rng = rng
        self.ship = Ship()
        self.bullets = []
        self.enemies = []
        self.score = 0
        self.kills = 0
        self.lives = 3
        self.spawned = 0
        self.spawn_timer = 1.0
        self.invulnerable = 0.0
        self.over = False
        self.events = []

    @property
    def level(self):
        return level_for_score(self.score)

    def spawn(self):
        x = self.rng.randrange(0, WIDTH - Enemy.W + 1)
        self.spawned += 1
        if self.spawned % 5 == 0:
            self.enemies.append(Enemy(x, -Enemy.H, hp=3, points=30))
        else:
            self.enemies.append(Enemy(x, -Enemy.H))

    def on_destroyed(self, enemy):
        self.score += enemy.points
        self.kills += 1
        self.events.append(("explode", enemy.rect.centerx, enemy.rect.centery))

    def lose_life(self):
        self.lives -= 1
        self.invulnerable = self.INVULNERABLE
        self.events.append(("hurt",))
        if self.lives <= 0:
            self.over = True

    def update(self, dt, direction, firing):
        if self.over:
            return
        self.bullets += self.ship.update(dt, direction, firing)
        for bullet in self.bullets:
            bullet.y -= self.BULLET_SPEED * dt
        self.bullets = [b for b in self.bullets if b.y + Bullet.H > 0]

        speed = enemy_speed(self.level)
        for enemy in self.enemies:
            enemy.y += speed * dt
        self.spawn_timer -= dt
        if self.spawn_timer <= 0:
            self.spawn()
            self.spawn_timer += spawn_interval(self.level)

        self.bullets, self.enemies, destroyed = collide_bullets(self.bullets, self.enemies)
        for enemy in destroyed:
            self.on_destroyed(enemy)

        self.invulnerable = max(0.0, self.invulnerable - dt)
        survivors = []
        for enemy in self.enemies:
            if enemy.y >= HEIGHT:
                self.lose_life()
            elif self.invulnerable <= 0 and enemy.rect.colliderect(self.ship.rect):
                self.lose_life()
            else:
                survivors.append(enemy)
        self.enemies = survivors


def draw_world(screen, world, font, big):
    screen.fill((10, 12, 28))
    ship = world.ship.rect
    blinking = world.invulnerable > 0 and int(world.invulnerable * 10) % 2 == 0
    if not blinking:
        pygame.draw.polygon(screen, (90, 200, 240), [ship.midtop, ship.bottomleft, ship.bottomright])
    for bullet in world.bullets:
        pygame.draw.rect(screen, (250, 220, 90), bullet.rect)
    for enemy in world.enemies:
        color = (220, 90, 90) if enemy.max_hp == 1 else (240, 160, 60)
        pygame.draw.rect(screen, color, enemy.rect, border_radius=6)
        for pip in range(enemy.hp if enemy.max_hp > 1 else 0):
            pygame.draw.circle(screen, (30, 20, 20), (enemy.rect.x + 8 + pip * 8, enemy.rect.centery), 3)
    hud = f"Score {world.score}    Lives {world.lives}    Level {world.level}"
    screen.blit(font.render(hud, True, (230, 230, 240)), (10, 8))
    if world.over:
        text = big.render("GAME OVER", True, (240, 90, 90))
        screen.blit(text, text.get_rect(center=(WIDTH // 2, HEIGHT // 2 - 20)))
        hint = font.render("Press R to play again", True, (230, 230, 240))
        screen.blit(hint, hint.get_rect(center=(WIDTH // 2, HEIGHT // 2 + 24)))


def main():
    pygame.init()
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Star Defender")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 28)
    big = pygame.font.Font(None, 64)
    world = World(random.Random())
    running = True
    while running:
        dt = min(clock.tick(60) / 1000, 0.05)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN and event.key == pygame.K_r and world.over:
                world = World(random.Random())
        keys = pygame.key.get_pressed()
        direction = (keys[pygame.K_RIGHT] or keys[pygame.K_d]) - (keys[pygame.K_LEFT] or keys[pygame.K_a])
        world.update(dt, direction, keys[pygame.K_SPACE])
        world.events.clear()
        draw_world(screen, world, font, big)
        pygame.display.flip()
    pygame.quit()


if __name__ == "__main__":
    main()`,
          annotations: [
            { lines: '20-44', text: '`Bullet` and `Enemy` are almost empty: a float position, a size, and a `rect` property that builds a rounded rectangle for overlap tests. `Enemy` also has hit points, so the tougher enemies can take three hits.' },
            { lines: '61-67', text: '`Ship.update` does three things in order: move (clamped to the screen), count the cooldown down, and, if firing is allowed, return a new bullet centred above the nose. Returning a **list** keeps the interface uniform: zero bullets or one.' },
            { lines: '70-86', text: '`collide_bullets` is a pure function. Each bullet hits at most one enemy (the first overlapped that is still alive); a hit costs the enemy one hit point; and the enemies whose hit points reach zero are returned as `destroyed`.' },
            { lines: '89-105', text: 'The `World` owns every piece of state and starts with three lives and a one-second delay before the first enemy.' },
            { lines: '111-117', text: 'Every fifth enemy is a tough one with three hit points and 30 points. The random generator is **passed in**, so a test can control where enemies appear.' },
            { lines: '119-129', text: 'Two small methods are the only places where score or lives change. They also record **events** for the presentation layer (`("explode", x, y)` and `("hurt",)`).' },
            { lines: '131-145', text: 'The first half of `update`: nothing happens after game over; the ship may fire; bullets move up and those that leave the top vanish; enemies fall at the current level’s speed; the spawn timer counts down.' },
            { lines: '147-160', text: 'The second half: collisions on the new positions, the score for each kill, the invulnerability timer, then each remaining enemy either passes the bottom (a life lost), touches the ship (a life lost, unless blinking), or survives.' },
            { lines: '163-182', text: '`draw_world` only **reads** the world: a blinking triangle while invulnerable, yellow bullets, enemies with pips for their hit points, the heads-up display, and the game-over text.' },
            { lines: '185-211', text: '`main` is the whole presentation layer: input becomes two values, `world.update` runs one tick, events are discarded for now (the next lesson uses them for particles and shake), and the world is drawn. `R` creates a brand-new `World`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Play it, then break it on purpose',
          text: 'Once it runs, change numbers and watch: set `BULLET_SPEED` to 200, make `INVULNERABLE` 0.2, or give every enemy 3 hit points. A game is a set of numbers and rules; seeing how each one changes the feel is the fastest way to learn what to tune. Because the logic is separate, none of these experiments touches the drawing code.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete three details from the logic layer: clamped movement, keeping bullets that are still on screen, and the fire-rate check.',
      template: `self.x = max(0, min(WIDTH - self.W, self.x + direction * self.speed * ___))
self.bullets = [b for b in self.bullets if b.y + Bullet.H ___ 0]
if firing and self.cooldown ___ 0:`,
      templateIsCode: true,
      blanks: [{ answers: ['dt'] }, { answers: ['>'] }, { answers: ['<='] }],
      wordBank: ['dt', '>', '<=', '<', '>=', '=='],
      explanation: 'Movement is `speed * dt`, so it is the same at any frame rate. A bullet stays while its **bottom** edge (`y + H`) is still below the top of the screen (greater than 0). And a new bullet is allowed once the cooldown has reached zero (`<= 0`).',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The ship’s movement rule (clamped to 0..444) is applied three times with `dt = 0.125`.',
      code: `x = 222.0
for direction in (1, 1, -1):
    x = max(0, min(444, x + direction * 300 * 0.125))
print(x)`,
      answer: '259.5',
      hint: 'Each step moves 300 * 0.125 = 37.5 pixels. Right, right, then left.',
      explanation: 'The ship moves +37.5, +37.5 and -37.5: 222 becomes 259.5, then 297.0, then 259.5 again. The clamps do nothing here, because the ship never gets near the edges.',
    },
    {
      kind: 'concept',
      title: 'Order, events and a game that can play itself',
      blocks: [
        {
          type: 'p',
          text: 'In `World.update` the **order of the steps** is part of the design. Each step has a reason:',
        },
        {
          type: 'table',
          headers: ['Step', 'Why here'],
          rows: [
            ['1. Stop if the game is over', 'A finished world must not change: restart creates a new one'],
            ['2. The ship fires; bullets move; off-screen bullets are dropped', 'The new bullet exists before collisions, so it can hit something on its first frame'],
            ['3. Enemies move; the spawn timer runs', 'A new enemy appears above the screen and is not moved until the next frame'],
            ['4. Collide bullets with enemies; score the kills', 'Everything is at its **new** position; dead enemies are removed before they can also hurt the ship'],
            ['5. Count down invulnerability', 'After a hit the player gets a whole 1.5 seconds, not 1.5 minus one frame'],
            ['6. Enemies at the bottom or touching the ship cost a life', 'Only the survivors of step 4 are checked, so a destroyed enemy never hurts you'],
          ],
          caption: 'Change the order and the game changes: the rules are not only the formulas, they are the sequence.',
        },
        {
          type: 'p',
          text: 'Notice what the layer **does not** do. When an enemy dies, `on_destroyed` adds to the score and appends `("explode", x, y)` to `world.events`; it does not create particles. When a life is lost, `lose_life` appends `("hurt",)`; it does not shake the screen. The presentation layer reads `world.events` after each update, reacts, and clears the list. In the next lesson, that is how explosions, shake and sound are added without changing one line of the rules.',
        },
        {
          type: 'p',
          text: 'And because the logic needs no window, it can **play itself**. A *bot* is just a function that looks at the world and returns a direction and a firing flag. Run a hundred seconds of game in a fraction of a second, and you can check that the difficulty is fair. The author’s simple bot (move under the lowest enemy and hold fire) reaches levels 7 to 10 before it loses, which tells you the curve is steep but not impossible. The last lesson builds that bot.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why test the logic with fake random numbers?',
          text: 'Enemies spawn at random places, so a test cannot know where. If the world uses a generator that is **passed in**, the test supplies a tiny fake whose `randrange` always returns 100, and every enemy appears at x = 100. The tests below do exactly that, and every number in them is exact.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Players on 144 Hz monitors report that their bullets fly much faster than on 60 Hz monitors. Tap the line with the bug.',
      lines: [
        'def update(self, dt, direction, firing):',
        '    self.bullets += self.ship.update(dt, direction, firing)',
        '    for bullet in self.bullets:',
        '        bullet.y -= self.BULLET_SPEED',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The bullet moves by `BULLET_SPEED` every **frame**, so the faster the frame rate, the faster the bullet. Every movement must be scaled by the time step: `bullet.y -= self.BULLET_SPEED * dt`.',
    },
    {
      kind: 'numeric',
      prompt: 'Frames are capped at `dt = 0.05` seconds. A bullet travels at 520 pixels per second. How many pixels does it move in one such frame?',
      answer: '26',
      hint: '520 * 0.05.',
      explanation: '`520 * 0.05 = 26` pixels. That is more than the bullet’s own height (14), which is why collisions need care: a fast bullet in a long frame could jump past a thin target. The 0.05 cap keeps the jump small enough for 24-pixel-tall enemies.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the engine, piece by piece',
      blocks: [
        {
          type: 'p',
          text: 'Three exercises, in the order of the milestones: the `Ship`, `collide_bullets`, and finally `World.update`. The classes the exercises need but you do not write are already in the starter code. The tests use time steps of 0.125 and 0.25, so every value is exact.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `Ship(x=222, y=580, speed=300, delay=0.25)` (the `Bullet` class is given). Keep `x` as a float, `y`, `speed`, `delay` and `cooldown` (starts at 0.0). The property `rect` is `pygame.Rect(round(x), y, 36, 28)`. `update(dt, direction, firing)`: first move `x` by `direction * speed * dt`, clamped between 0 and `480 - 36`; then reduce `cooldown` by `dt` (not below 0); then, if `firing` and `cooldown <= 0`, set `cooldown` to `delay` and **return a list with one new `Bullet`** centred above the nose: `Bullet(x + 36 / 2 - 4 / 2, y - 14)`. Otherwise return an empty list.',
      starter: `import pygame

WIDTH = 480


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Ship:
    W, H = 36, 28

    def __init__(self, x=222, y=580, speed=300, delay=0.25):
        ...

    @property
    def rect(self):
        ...

    def update(self, dt, direction, firing):
        ...
`,
      solution: `import pygame

WIDTH = 480


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Ship:
    W, H = 36, 28

    def __init__(self, x=222, y=580, speed=300, delay=0.25):
        self.x = float(x)
        self.y = y
        self.speed = speed
        self.delay = delay
        self.cooldown = 0.0

    @property
    def rect(self):
        return pygame.Rect(round(self.x), self.y, self.W, self.H)

    def update(self, dt, direction, firing):
        self.x = max(0, min(WIDTH - self.W, self.x + direction * self.speed * dt))
        self.cooldown = max(0.0, self.cooldown - dt)
        if firing and self.cooldown <= 0:
            self.cooldown = self.delay
            return [Bullet(self.x + self.W / 2 - Bullet.W / 2, self.y - Bullet.H)]
        return []
`,
      setup: PG_SIM,
      tests: `s = Ship()
assert (s.x, s.y, s.speed, s.delay, s.cooldown) == (222.0, 580, 300, 0.25, 0.0)
assert s.rect == pygame.Rect(222, 580, 36, 28)
assert s.update(0.125, 1, False) == [] and s.x == 259.5, "300 * 0.125 = 37.5 pixels to the right"
assert s.update(0.125, -1, False) == [] and s.x == 222.0
s.x = 440.0
s.update(0.5, 1, False)
assert s.x == 444.0, "clamped at the right edge (480 - 36)"
s.x = 5.0
s.update(0.5, -1, False)
assert s.x == 0, "clamped at the left edge"
s.update(0.5, 0, False)
assert s.x == 0 and s.rect.x == 0

s = Ship()
shots = s.update(0.125, 0, True)
assert len(shots) == 1 and isinstance(shots[0], Bullet)
assert (shots[0].x, shots[0].y) == (238.0, 566.0), "centred over the nose, one bullet-height above the ship"
assert s.cooldown == 0.25
assert s.update(0.125, 0, True) == [] and s.cooldown == 0.125, "cooling down"
second = s.update(0.125, 0, True)
assert len(second) == 1 and s.cooldown == 0.25, "the cooldown reached zero, so it fires again"
assert s.update(0.125, 0, False) == [] and s.cooldown == 0.125, "not firing: the cooldown still counts down"
assert s.update(0.5, 0, False) == [] and s.cooldown == 0.0, "never below zero"
fast = Ship(delay=0.125)
assert [len(fast.update(0.125, 0, True)) for _ in range(4)] == [1, 1, 1, 1]
moving = Ship()
bullet = moving.update(0.125, 1, True)[0]
assert moving.x == 259.5 and bullet.x == 275.5, "the bullet leaves from the new position"
custom = Ship(x=100, y=500, speed=100, delay=1.0)
assert (custom.x, custom.y, custom.speed, custom.delay) == (100.0, 500, 100, 1.0)
assert custom.update(0.25, 1, True)[0].y == 486.0 and custom.x == 125.0`,
      checks: ['`update` moves by `direction * speed * dt` and clamps to the range 0 to 444', 'A bullet is returned only when firing and the cooldown has reached zero, and the cooldown is then reset to `delay`', 'The bullet is centred over the ship’s nose, from the new position'],
      hint: 'Move and clamp first (`max(0, min(WIDTH - self.W, ...))`), then `self.cooldown = max(0.0, self.cooldown - dt)`, then test `firing and self.cooldown <= 0`.',
      explanation: 'The `update` method does movement, timing and bullet creation in a fixed order, and returns a list so that the caller can always write `bullets += ship.update(...)`, with no special case for "no bullet". The clamp uses `WIDTH - self.W` because `x` is the **left** edge.',
    },
    {
      kind: 'code',
      prompt: 'Write `collide_bullets(bullets, enemies)` (the `Bullet` and `Enemy` classes are given). Go through the bullets in order. A bullet hits the **first** enemy in the list that still has `hp > 0` and whose rectangle overlaps the bullet’s. A bullet that hits is used up and reduces that enemy’s `hp` by 1; an enemy whose `hp` reaches 0 is added to the list of destroyed enemies (in the order of destruction). Bullets that hit nothing are kept. Return a tuple `(bullets_left, enemies_alive, destroyed)` of three **new** lists, each in the original order (the first two) without changing the lists given.',
      starter: `import pygame


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Enemy:
    W, H = 32, 24

    def __init__(self, x, y, hp=1, points=10):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.points = points

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


def collide_bullets(bullets, enemies):
    ...
`,
      solution: `import pygame


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Enemy:
    W, H = 32, 24

    def __init__(self, x, y, hp=1, points=10):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.points = points

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


def collide_bullets(bullets, enemies):
    left = []
    destroyed = []
    for bullet in bullets:
        target = None
        for enemy in enemies:
            if enemy.hp > 0 and bullet.rect.colliderect(enemy.rect):
                target = enemy
                break
        if target is None:
            left.append(bullet)
        else:
            target.hp -= 1
            if target.hp <= 0:
                destroyed.append(target)
    alive = [e for e in enemies if e.hp > 0]
    return left, alive, destroyed
`,
      setup: PG_SIM,
      tests: `e = Enemy(100, 100)
b = Bullet(110, 110)
left, alive, dead = collide_bullets([b], [e])
assert left == [] and alive == [] and dead == [e] and e.hp == 0

e = Enemy(100, 100)
far = Bullet(300, 300)
left, alive, dead = collide_bullets([far], [e])
assert left == [far] and alive == [e] and dead == [] and e.hp == 1

touching = Bullet(100, 124)
left, alive, dead = collide_bullets([touching], [Enemy(100, 100)])
assert left == [touching] and dead == [], "touching edges (the bullet starts at the enemy's bottom) is no hit"
top = Bullet(110, 90)
assert collide_bullets([top], [Enemy(100, 100)])[2] != [], "overlapping the top edge is a hit"

a, c = Enemy(100, 100), Enemy(110, 100)
left, alive, dead = collide_bullets([Bullet(112, 110)], [a, c])
assert dead == [a] and alive == [c] and left == [], "only the first overlapped enemy is hit"
assert c.hp == 1

tough = Enemy(100, 100, hp=3, points=30)
shots = [Bullet(110, 110), Bullet(111, 110)]
left, alive, dead = collide_bullets(shots, [tough])
assert tough.hp == 1 and alive == [tough] and dead == [] and left == []
left, alive, dead = collide_bullets([Bullet(112, 110)], alive)
assert dead == [tough] and alive == []

one = Enemy(100, 100)
volley = [Bullet(105, 110), Bullet(106, 110), Bullet(107, 110)]
left, alive, dead = collide_bullets(volley, [one])
assert dead == [one] and left == volley[1:], "a dead enemy absorbs no more bullets: the extra bullets fly on"

p, q = Enemy(0, 0), Enemy(200, 0)
bp, bq, miss = Bullet(5, 5), Bullet(205, 5), Bullet(400, 400)
left, alive, dead = collide_bullets([bq, miss, bp], [p, q])
assert dead == [q, p], "in the order of destruction (the bullet order)"
assert left == [miss] and alive == []

bullets, enemies = [Bullet(1, 1)], [Enemy(500, 500)]
copy_b, copy_e = list(bullets), list(enemies)
left, alive, dead = collide_bullets(bullets, enemies)
assert bullets == copy_b and enemies == copy_e, "the given lists are not modified"
assert left is not bullets and alive is not enemies
assert collide_bullets([], []) == ([], [], [])`,
      checks: ['Each bullet hits at most one enemy: the first overlapped enemy that is still alive', 'An enemy is destroyed when its `hp` reaches 0; a destroyed enemy cannot absorb more bullets', 'Three new lists are returned and the lists given are unchanged'],
      hint: 'For each bullet loop over the enemies and `break` at the first with `enemy.hp > 0 and bullet.rect.colliderect(enemy.rect)`. A hit reduces `hp`; the destroyed list gets the enemy when `hp <= 0`. Build `alive` at the end from `enemies`.',
      explanation: 'Checking `enemy.hp > 0` is what makes a volley behave: the first bullet kills, and the others pass through the now-dead enemy instead of being wasted. The function is pure (nothing outside it changes except the enemies’ `hp`), so it can be tested with a handful of rectangles.',
    },
    {
      kind: 'code',
      prompt: 'Everything except `World.update` is given. Write `update(self, dt, direction, firing)` with these steps in this order: (1) return at once if `self.over`; (2) `self.bullets += self.ship.update(dt, direction, firing)`; (3) move every bullet up by `BULLET_SPEED * dt` and keep only bullets with `y + Bullet.H > 0`; (4) move every enemy down by `enemy_speed(self.level) * dt`; (5) reduce `spawn_timer` by `dt` and, if it is now `<= 0`, call `spawn()` and add `spawn_interval(self.level)` to the timer; (6) `collide_bullets` sets `self.bullets` and `self.enemies`, and `on_destroyed` is called for each destroyed enemy; (7) `invulnerable = max(0.0, invulnerable - dt)`; (8) for each enemy in order: if `y >= HEIGHT`, call `lose_life()` and drop it; elif `invulnerable <= 0` and its rect overlaps the ship’s rect, call `lose_life()` and drop it; else keep it.',
      starter: `import pygame

WIDTH, HEIGHT = 480, 640


def level_for_score(score):
    return 1 + score // 100


def spawn_interval(level):
    return max(0.35, 1.25 - 0.125 * (level - 1))


def enemy_speed(level):
    return min(220, 70 + 12 * (level - 1))


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Enemy:
    W, H = 32, 24

    def __init__(self, x, y, hp=1, points=10):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.points = points

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Ship:
    W, H = 36, 28

    def __init__(self, x=222, y=580, speed=300, delay=0.25):
        self.x = float(x)
        self.y = y
        self.speed = speed
        self.delay = delay
        self.cooldown = 0.0

    @property
    def rect(self):
        return pygame.Rect(round(self.x), self.y, self.W, self.H)

    def update(self, dt, direction, firing):
        self.x = max(0, min(WIDTH - self.W, self.x + direction * self.speed * dt))
        self.cooldown = max(0.0, self.cooldown - dt)
        if firing and self.cooldown <= 0:
            self.cooldown = self.delay
            return [Bullet(self.x + self.W / 2 - Bullet.W / 2, self.y - Bullet.H)]
        return []


def collide_bullets(bullets, enemies):
    left = []
    destroyed = []
    for bullet in bullets:
        target = None
        for enemy in enemies:
            if enemy.hp > 0 and bullet.rect.colliderect(enemy.rect):
                target = enemy
                break
        if target is None:
            left.append(bullet)
        else:
            target.hp -= 1
            if target.hp <= 0:
                destroyed.append(target)
    alive = [e for e in enemies if e.hp > 0]
    return left, alive, destroyed


class World:
    BULLET_SPEED = 520
    INVULNERABLE = 1.5

    def __init__(self, rng):
        self.rng = rng
        self.ship = Ship()
        self.bullets = []
        self.enemies = []
        self.score = 0
        self.kills = 0
        self.lives = 3
        self.spawned = 0
        self.spawn_timer = 1.0
        self.invulnerable = 0.0
        self.over = False
        self.events = []

    @property
    def level(self):
        return level_for_score(self.score)

    def spawn(self):
        x = self.rng.randrange(0, WIDTH - Enemy.W + 1)
        self.spawned += 1
        if self.spawned % 5 == 0:
            self.enemies.append(Enemy(x, -Enemy.H, hp=3, points=30))
        else:
            self.enemies.append(Enemy(x, -Enemy.H))

    def on_destroyed(self, enemy):
        self.score += enemy.points
        self.kills += 1
        self.events.append(("explode", enemy.rect.centerx, enemy.rect.centery))

    def lose_life(self):
        self.lives -= 1
        self.invulnerable = self.INVULNERABLE
        self.events.append(("hurt",))
        if self.lives <= 0:
            self.over = True

    def update(self, dt, direction, firing):
        ...
`,
      solution: `import pygame

WIDTH, HEIGHT = 480, 640


def level_for_score(score):
    return 1 + score // 100


def spawn_interval(level):
    return max(0.35, 1.25 - 0.125 * (level - 1))


def enemy_speed(level):
    return min(220, 70 + 12 * (level - 1))


class Bullet:
    W, H = 4, 14

    def __init__(self, x, y):
        self.x = float(x)
        self.y = float(y)

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Enemy:
    W, H = 32, 24

    def __init__(self, x, y, hp=1, points=10):
        self.x = float(x)
        self.y = float(y)
        self.hp = hp
        self.max_hp = hp
        self.points = points

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class Ship:
    W, H = 36, 28

    def __init__(self, x=222, y=580, speed=300, delay=0.25):
        self.x = float(x)
        self.y = y
        self.speed = speed
        self.delay = delay
        self.cooldown = 0.0

    @property
    def rect(self):
        return pygame.Rect(round(self.x), self.y, self.W, self.H)

    def update(self, dt, direction, firing):
        self.x = max(0, min(WIDTH - self.W, self.x + direction * self.speed * dt))
        self.cooldown = max(0.0, self.cooldown - dt)
        if firing and self.cooldown <= 0:
            self.cooldown = self.delay
            return [Bullet(self.x + self.W / 2 - Bullet.W / 2, self.y - Bullet.H)]
        return []


def collide_bullets(bullets, enemies):
    left = []
    destroyed = []
    for bullet in bullets:
        target = None
        for enemy in enemies:
            if enemy.hp > 0 and bullet.rect.colliderect(enemy.rect):
                target = enemy
                break
        if target is None:
            left.append(bullet)
        else:
            target.hp -= 1
            if target.hp <= 0:
                destroyed.append(target)
    alive = [e for e in enemies if e.hp > 0]
    return left, alive, destroyed


class World:
    BULLET_SPEED = 520
    INVULNERABLE = 1.5

    def __init__(self, rng):
        self.rng = rng
        self.ship = Ship()
        self.bullets = []
        self.enemies = []
        self.score = 0
        self.kills = 0
        self.lives = 3
        self.spawned = 0
        self.spawn_timer = 1.0
        self.invulnerable = 0.0
        self.over = False
        self.events = []

    @property
    def level(self):
        return level_for_score(self.score)

    def spawn(self):
        x = self.rng.randrange(0, WIDTH - Enemy.W + 1)
        self.spawned += 1
        if self.spawned % 5 == 0:
            self.enemies.append(Enemy(x, -Enemy.H, hp=3, points=30))
        else:
            self.enemies.append(Enemy(x, -Enemy.H))

    def on_destroyed(self, enemy):
        self.score += enemy.points
        self.kills += 1
        self.events.append(("explode", enemy.rect.centerx, enemy.rect.centery))

    def lose_life(self):
        self.lives -= 1
        self.invulnerable = self.INVULNERABLE
        self.events.append(("hurt",))
        if self.lives <= 0:
            self.over = True

    def update(self, dt, direction, firing):
        if self.over:
            return
        self.bullets += self.ship.update(dt, direction, firing)
        for bullet in self.bullets:
            bullet.y -= self.BULLET_SPEED * dt
        self.bullets = [b for b in self.bullets if b.y + Bullet.H > 0]

        speed = enemy_speed(self.level)
        for enemy in self.enemies:
            enemy.y += speed * dt
        self.spawn_timer -= dt
        if self.spawn_timer <= 0:
            self.spawn()
            self.spawn_timer += spawn_interval(self.level)

        self.bullets, self.enemies, destroyed = collide_bullets(self.bullets, self.enemies)
        for enemy in destroyed:
            self.on_destroyed(enemy)

        self.invulnerable = max(0.0, self.invulnerable - dt)
        survivors = []
        for enemy in self.enemies:
            if enemy.y >= HEIGHT:
                self.lose_life()
            elif self.invulnerable <= 0 and enemy.rect.colliderect(self.ship.rect):
                self.lose_life()
            else:
                survivors.append(enemy)
        self.enemies = survivors
`,
      setup: PG_SIM,
      tests: `class Fixed:
    def __init__(self, value=100):
        self.value = value
        self.calls = []

    def randrange(self, a, b=None):
        self.calls.append((a, b))
        return self.value

def quiet():
    w = World(Fixed())
    w.spawn_timer = 99
    return w

w = World(Fixed())
assert (w.ship.x, w.spawn_timer, w.lives, w.score, w.over) == (222.0, 1.0, 3, 0, False)
w.update(0.5, 0, False)
assert w.spawn_timer == 0.5 and w.enemies == []
w.update(0.5, 0, False)
assert len(w.enemies) == 1 and w.spawn_timer == 1.25, "the timer reached 0: spawn, then wait one level-1 interval"
e = w.enemies[0]
assert (e.x, e.y, e.hp, e.points) == (100.0, -24.0, 1, 10) and w.rng.calls == [(0, 449)]
w.update(0.5, 0, False)
assert w.enemies[0].y == 11.0 and w.spawn_timer == 0.75, "70 pixels per second at level 1"

w = quiet()
w.update(0.125, 1, True)
assert w.ship.x == 259.5
assert [(b.x, b.y) for b in w.bullets] == [(275.5, 501.0)], "fired at 566, then moved up 65 in the same update"
w.update(0.125, 0, True)
assert [b.y for b in w.bullets] == [436.0], "still cooling down: no new bullet"
w.update(0.125, 0, True)
assert [b.y for b in w.bullets] == [371.0, 501.0]

w = quiet()
w.bullets = [Bullet(10, -10), Bullet(10, 100)]
w.update(0.125, 0, False)
assert [(b.x, b.y) for b in w.bullets] == [(10.0, 35.0)], "the bullet above the top is gone"

w = quiet()
w.enemies = [Enemy(100, 100)]
w.bullets = [Bullet(110, 170)]
w.update(0.125, 0, False)
assert (w.score, w.kills, w.enemies, w.bullets) == (10, 1, [], [])
assert w.events == [("explode", 116, 121)]

w = quiet()
w.enemies = [Enemy(100, 100, hp=3, points=30)]
for expected in (2, 1):
    w.bullets = [Bullet(110, w.enemies[0].y + 70)]
    w.update(0.125, 0, False)
    assert w.enemies[0].hp == expected and w.score == 0
w.bullets = [Bullet(110, w.enemies[0].y + 70)]
w.update(0.125, 0, False)
assert w.enemies == [] and w.score == 30 and w.kills == 1

w = quiet()
w.enemies = [Enemy(100, 100)]
w.bullets = [Bullet(110, 170), Bullet(112, 170)]
w.update(0.125, 0, False)
assert w.score == 10 and w.kills == 1 and len(w.bullets) == 1, "the second bullet flew on"

w = quiet()
w.enemies = [Enemy(222, 570)]
w.update(0.125, 0, False)
assert w.lives == 2 and w.invulnerable == 1.5 and w.enemies == [] and w.events == [("hurt",)]
w.enemies = [Enemy(222, 570)]
w.update(0.125, 0, False)
assert w.lives == 2 and w.invulnerable == 1.375 and len(w.enemies) == 1, "blinking: an overlapping enemy is harmless"

w = quiet()
w.invulnerable = 0.25
w.enemies = [Enemy(222, 570)]
w.update(0.125, 0, False)
assert w.lives == 3 and w.invulnerable == 0.125
w.update(0.125, 0, False)
assert w.lives == 2 and w.invulnerable == 1.5, "the protection ran out, so the contact counts"

w = quiet()
w.enemies = [Enemy(10, 630)]
w.update(0.25, 0, False)
assert w.lives == 2 and w.enemies == [] and w.events == [("hurt",)] and w.invulnerable == 1.5

w = quiet()
w.lives = 1
w.enemies = [Enemy(10, 630)]
w.update(0.25, 0, False)
assert w.lives == 0 and w.over is True
w.enemies = [Enemy(10, 10)]
w.update(1, 1, True)
assert w.enemies[0].y == 10.0 and w.ship.x == 222.0 and w.bullets == [], "nothing happens after game over"

w = quiet()
w.score = 100
w.enemies = [Enemy(10, 100)]
w.update(0.5, 0, False)
assert w.level == 2 and w.enemies[0].y == 141.0, "level 2 enemies fall at 82 pixels per second"

w = World(Fixed(50))
for _ in range(5):
    w.spawn_timer = 0.0
    w.update(0.0, 0, False)
assert w.spawned == 5
assert [(e.hp, e.points) for e in w.enemies] == [(1, 10)] * 4 + [(3, 30)], "every fifth enemy is tough"`,
      checks: ['Bullets and enemies move by speed times `dt`, off-screen bullets are dropped, and the spawn timer runs and resets by the level’s interval', 'Collisions are resolved after the movement, and each destroyed enemy goes through `on_destroyed`', 'Contact with the ship and passing the bottom both call `lose_life`, contact respects `invulnerable`, and nothing happens after game over'],
      hint: 'Follow the eight steps literally. For step 8, build a new list `survivors` and assign it to `self.enemies` at the end instead of removing items while looping over the list.',
      explanation: 'This one method is the whole rulebook of the game, and every line of it is testable without a window. Notice that it never mentions drawing, sound or the keyboard: those are the next lesson’s presentation layer. Building a **new** list of survivors avoids the classic bug of removing items from a list while looping over it, which skips elements.',
    },
  ],
  takeaways: [
    'Build in **milestones** (ship, shooting, enemies, collisions, rules) and keep the game runnable after every step. A bug is then always in the last few lines you wrote.',
    'The logic layer is a few small classes: `Bullet`, `Enemy`, `Ship`, a pure `collide_bullets` function, and a `World` that owns everything. None of them knows about the keyboard, the window or the speakers.',
    'Keep positions as **floats** and build a rounded `Rect` through a property only for overlap tests, so slow movement is never lost to integer storage.',
    'The **order** of the steps in `update` is part of the design: move first, collide on the new positions, remove the dead before they can hurt anyone, then apply damage.',
    '`collide_bullets` is a pure function: each bullet hits at most one enemy, a dead enemy absorbs no more bullets, and the given lists are not modified.',
    'The logic records **events** (`("explode", x, y)`, `("hurt",)`) and takes its random generator as a parameter, so effects can be added without touching the rules and tests can use exact numbers.',
  ],
  reading: [
    { title: 'pygame docs: pygame.Rect.colliderect', url: 'https://www.pygame.org/docs/ref/rect.html#pygame.Rect.colliderect', source: 'docs', note: 'The overlap test used by every collision in this game.' },
    { title: 'Game Programming Patterns: Update Method', url: 'https://gameprogrammingpatterns.com/update-method.html', source: 'book', note: 'How objects update themselves each tick, and why the order of updates matters.' },
    { title: 'Game Programming Patterns: Event Queue', url: 'https://gameprogrammingpatterns.com/event-queue.html', source: 'book', note: 'The idea behind `world.events`: decoupling the rules from what reacts to them.' },
  ],
};
