import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-project-finish',
  title: 'Capstone 3: Polish, Test and Ship',
  summary: 'Turn the working engine into a finished game with a title screen, power-ups, combos, particles, screen shake and a saved high score, then play-test it with a bot and get it ready to share.',
  minutes: 52,
  objectives: [
    'Extend a tested class by subclassing it and overriding its hooks, instead of rewriting it',
    'Drive visual effects (particles, shake) from the events the game logic records',
    'Write a scrolling `Starfield` and a timed `Effects` manager that can be tested with fake random numbers and exact times',
    'Play-test a game with a bot to check its difficulty, without ever opening a window',
    'Work through a release checklist and know where to go next',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a working game to a finished one',
      blocks: [
        {
          type: 'p',
          text: 'The engine from the last lesson is already a game. What separates a game from a **finished** game is rarely new rules; it is the layer of care around them: a title screen, a pause key, feedback when something happens, something to chase (a high score), and a few surprises. This lesson adds exactly that, and almost none of it touches the tested rules.',
        },
        {
          type: 'table',
          headers: ['Addition', 'Where it lives', 'Idea from'],
          rows: [
            ['Title, play, paused and game-over screens', '`Game` (a small state machine)', 'Game states'],
            ['Scrolling stars in three layers', '`Starfield`', 'Delta time, animation'],
            ['Rapid-fire and shield power-ups', '`ArcadeWorld`, with the `Effects` timers', 'Sprites, spawning'],
            ['Combo multiplier for fast kills', '`Combo`, used by `ArcadeWorld`', 'Planning'],
            ['Explosion particles and screen shake', '`Game`, driven by `world.events`', 'Juice'],
            ['A high score that survives closing the game', '`load_best` and `save_best`', 'Saving data'],
          ],
          caption: 'Everything you learned in the course shows up once: that is the point of a capstone.',
        },
        {
          type: 'p',
          text: 'The key move is **subclassing**. `ArcadeWorld` extends `World` and overrides only three methods: `on_destroyed` (for the combo and the drops), `lose_life` (for the shield) and `update` (for the timers and the power-ups). The `World` rules you tested stay untouched, and the new behaviour is added **around** them with `super()`.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why subclass instead of editing World?',
          text: 'Every test you wrote for `World` still describes the base game exactly. Editing it would risk breaking rules that already work, and it would mix two ideas (the core game and the arcade extras) in one class. With a subclass the extras can be switched off by creating a `World` instead of an `ArcadeWorld`, and each class stays small enough to hold in your head.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In the finished game, who is responsible for creating the explosion **particles** when an enemy is destroyed?',
      options: [
        { text: 'The `Game` class, which reads the `("explode", x, y)` event from `world.events`', correct: true, why: 'The logic only records that something happened; the presentation layer decides how it looks.' },
        { text: 'The `World.on_destroyed` method, which creates the particles directly', why: 'That would tie the rules to pygame drawing and make them harder to test.' },
        { text: 'The `Starfield`, because it already draws small dots', why: 'The starfield is background scenery; it knows nothing about enemies.' },
        { text: 'The `Enemy` object, in its own `__del__` method', why: 'Python does not promise when `__del__` runs, and an enemy should not know about screens.' },
      ],
      explanation: 'Events are the bridge between the layers. If you later add a sound effect, it is one more `elif` in `react`, and the rules do not change.',
    },
    {
      kind: 'truefalse',
      prompt: 'Because `ArcadeWorld` overrides `lose_life` to do nothing while the shield is active, **every** way of losing a life (touching an enemy or letting one pass the bottom) is protected, with no other change.',
      answer: true,
      explanation: 'True. `World.update` calls `self.lose_life()` for both cases, and Python looks the method up on the object’s real class, so the overridden version runs for both. This is the benefit of funnelling a rule through one method.',
    },
    {
      kind: 'concept',
      title: 'The finished game',
      blocks: [
        {
          type: 'p',
          text: 'Here is the complete file. The first part is the engine you built (unchanged), the middle is new (`Combo`, `Starfield`, `Effects`, `PowerUp`, `ArcadeWorld`, and the save functions), and the end is the `Game` class that owns the window and the states. Controls: **Enter** to start, **arrows or A/D** to move, **Space** to fire, **P** to pause, **R** after a game over, **Esc** to quit. Your best score is saved in a small file in your home folder and is shown on the title and game-over screens.',
        },
        {
          type: 'code',
          title: 'star_defender.py',
          desktopOnly: true,
          code: `import json
import math
import os
import random
import tempfile
from pathlib import Path

import pygame

WIDTH, HEIGHT = 480, 640
SAVE_PATH = Path.home() / ".pyforge_demo" / "star_defender.json"


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


class Combo:
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


class Starfield:
    SPEEDS = (20, 50, 90)

    def __init__(self, width, height, rng, count=40):
        self.width = width
        self.height = height
        self.rng = rng
        self.stars = []
        for i in range(count):
            self.stars.append([float(rng.randrange(width)), float(rng.randrange(height)), i % 3])

    def update(self, dt):
        for star in self.stars:
            star[1] += self.SPEEDS[star[2]] * dt
            if star[1] >= self.height:
                star[1] -= self.height
                star[0] = float(self.rng.randrange(self.width))


class Effects:
    def __init__(self):
        self.timers = {}

    def activate(self, name, duration):
        self.timers[name] = max(self.timers.get(name, 0.0), duration)

    def update(self, dt):
        for name in list(self.timers):
            self.timers[name] -= dt
            if self.timers[name] <= 0:
                del self.timers[name]

    def active(self, name):
        return name in self.timers

    def time_left(self, name):
        return self.timers.get(name, 0.0)


class PowerUp:
    W, H = 20, 20
    SPEED = 120
    COLORS = {"rapid": (250, 220, 90), "shield": (90, 200, 240)}

    def __init__(self, x, y, kind):
        self.x = float(x)
        self.y = float(y)
        self.kind = kind

    @property
    def rect(self):
        return pygame.Rect(round(self.x), round(self.y), self.W, self.H)


class ArcadeWorld(World):
    DROP_ONE_IN = 6
    DURATIONS = {"rapid": 6.0, "shield": 8.0}

    def __init__(self, rng):
        super().__init__(rng)
        self.effects = Effects()
        self.combo = Combo()
        self.powerups = []
        self.clock = 0.0

    def on_destroyed(self, enemy):
        super().on_destroyed(enemy)
        count = self.combo.hit(self.clock)
        self.score += enemy.points * (count - 1)
        if self.rng.randrange(self.DROP_ONE_IN) == 0:
            kind = "rapid" if self.rng.randrange(2) == 0 else "shield"
            self.powerups.append(PowerUp(enemy.rect.centerx - 10, enemy.rect.y, kind))

    def lose_life(self):
        if self.effects.active("shield"):
            self.events.append(("block",))
            return
        super().lose_life()

    def update(self, dt, direction, firing):
        if self.over:
            return
        self.clock += dt
        self.effects.update(dt)
        self.ship.delay = 0.1 if self.effects.active("rapid") else 0.25
        super().update(dt, direction, firing)
        kept = []
        for item in self.powerups:
            item.y += PowerUp.SPEED * dt
            if item.rect.colliderect(self.ship.rect):
                self.effects.activate(item.kind, self.DURATIONS[item.kind])
                self.events.append(("power", item.kind))
            elif item.y < HEIGHT:
                kept.append(item)
        self.powerups = kept


def load_best(path):
    try:
        return int(json.loads(Path(path).read_text())["best"])
    except (OSError, ValueError, KeyError, TypeError):
        return 0


def save_best(path, best):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    with os.fdopen(fd, "w") as handle:
        json.dump({"best": best}, handle)
    os.replace(tmp, path)


class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("Star Defender")
        self.canvas = pygame.Surface((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 28)
        self.big = pygame.font.Font(None, 64)
        self.rng = random.Random()
        self.stars = Starfield(WIDTH, HEIGHT, self.rng)
        self.best = load_best(SAVE_PATH)
        self.state = "title"
        self.world = None
        self.particles = []
        self.shake = 0.0
        self.running = True

    def new_game(self):
        self.world = ArcadeWorld(self.rng)
        self.particles = []
        self.shake = 0.0
        self.state = "play"

    def handle_event(self, event):
        if event.type == pygame.QUIT:
            self.running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                self.running = False
            elif self.state in ("title", "over") and event.key in (pygame.K_RETURN, pygame.K_r):
                self.new_game()
            elif event.key == pygame.K_p and self.state in ("play", "paused"):
                self.state = "paused" if self.state == "play" else "play"

    def burst(self, x, y):
        for _ in range(12):
            angle = self.rng.uniform(0, 2 * math.pi)
            speed = self.rng.uniform(40, 200)
            self.particles.append([x, y, math.cos(angle) * speed, math.sin(angle) * speed, 0.5])

    def react(self):
        for event in self.world.events:
            if event[0] == "explode":
                self.burst(event[1], event[2])
            elif event[0] == "hurt":
                self.shake = 0.35
        self.world.events.clear()

    def finish_if_over(self):
        if self.world.over:
            self.state = "over"
            if self.world.score > self.best:
                self.best = self.world.score
                try:
                    save_best(SAVE_PATH, self.best)
                except OSError:
                    pass

    def update(self, dt):
        self.stars.update(dt)
        if self.state == "play":
            keys = pygame.key.get_pressed()
            direction = (keys[pygame.K_RIGHT] or keys[pygame.K_d]) - (keys[pygame.K_LEFT] or keys[pygame.K_a])
            self.world.update(dt, direction, keys[pygame.K_SPACE])
            self.react()
            self.finish_if_over()
        for p in self.particles:
            p[0] += p[2] * dt
            p[1] += p[3] * dt
            p[4] -= dt
        self.particles = [p for p in self.particles if p[4] > 0]
        self.shake = max(0.0, self.shake - dt)

    def text(self, surface, message, y, font, color=(230, 230, 240)):
        image = font.render(message, True, color)
        surface.blit(image, image.get_rect(center=(WIDTH // 2, y)))

    def draw(self):
        canvas = self.canvas
        canvas.fill((10, 12, 28))
        for x, y, layer in self.stars.stars:
            shade = 80 + layer * 60
            pygame.draw.circle(canvas, (shade, shade, shade + 20), (int(x), int(y)), 1 + layer // 2)
        world = self.world
        if world is not None:
            self.draw_world(canvas, world)
        for x, y, _, _, life in self.particles:
            pygame.draw.circle(canvas, (255, int(120 + 270 * life), 80), (int(x), int(y)), 3)
        if self.state == "title":
            self.text(canvas, "STAR DEFENDER", 240, self.big, (90, 200, 240))
            self.text(canvas, "Arrows or A/D move, Space fires, P pauses", 300, self.font)
            self.text(canvas, "Press Enter to start", 340, self.font, (250, 220, 90))
            self.text(canvas, f"Best: {self.best}", 400, self.font)
        elif self.state == "paused":
            self.text(canvas, "PAUSED", HEIGHT // 2, self.big)
        elif self.state == "over":
            self.text(canvas, "GAME OVER", 270, self.big, (240, 90, 90))
            self.text(canvas, f"Score {world.score}   Best {self.best}", 320, self.font)
            self.text(canvas, "Press R to play again", 360, self.font, (250, 220, 90))
        amplitude = int(self.shake * 20)
        offset = (self.rng.randint(-amplitude, amplitude), self.rng.randint(-amplitude, amplitude))
        self.screen.fill((0, 0, 0))
        self.screen.blit(canvas, offset)
        pygame.display.flip()

    def draw_world(self, canvas, world):
        ship = world.ship.rect
        blinking = world.invulnerable > 0 and int(world.invulnerable * 10) % 2 == 0
        if not blinking:
            pygame.draw.polygon(canvas, (90, 200, 240), [ship.midtop, ship.bottomleft, ship.bottomright])
        if world.effects.active("shield"):
            pygame.draw.circle(canvas, (90, 200, 240), ship.center, 30, 2)
        for bullet in world.bullets:
            pygame.draw.rect(canvas, (250, 220, 90), bullet.rect)
        for enemy in world.enemies:
            color = (220, 90, 90) if enemy.max_hp == 1 else (240, 160, 60)
            pygame.draw.rect(canvas, color, enemy.rect, border_radius=6)
        for item in world.powerups:
            pygame.draw.rect(canvas, PowerUp.COLORS[item.kind], item.rect, border_radius=10)
        hud = f"Score {world.score}   Lives {world.lives}   Level {world.level}   x{max(1, world.combo.count)}"
        canvas.blit(self.font.render(hud, True, (230, 230, 240)), (10, 8))
        for row, name in enumerate(("rapid", "shield")):
            if world.effects.active(name):
                label = f"{name} {world.effects.time_left(name):.1f}s"
                canvas.blit(self.font.render(label, True, PowerUp.COLORS[name]), (10, 34 + row * 22))

    def run(self):
        while self.running:
            dt = min(self.clock.tick(60) / 1000, 0.05)
            for event in pygame.event.get():
                self.handle_event(event)
            self.update(dt)
            self.draw()
        pygame.quit()


if __name__ == "__main__":
    Game().run()`,
          annotations: [
            { lines: '26-166', text: 'The engine from the last lesson, **unchanged**: `Bullet`, `Enemy`, `Ship`, `collide_bullets` and `World`. Nothing in the new code needed editing here.' },
            { lines: '169-183', text: '`Combo` counts kills that arrive within `window` seconds of the previous one, up to `cap`. Time is passed in (`now`), so it is easy to test.' },
            { lines: '185-201', text: '`Starfield` keeps `[x, y, layer]` lists. Each layer falls at its own speed, which gives a cheap depth effect, and a star that leaves the bottom wraps to the top at a new random x. The random generator is injected.' },
            { lines: '204-222', text: '`Effects` is a dictionary of name to seconds remaining. `activate` keeps the **longer** of the old and new time, `update` counts down and removes the expired ones (over a copy of the keys, so deleting is safe).' },
            { lines: '224-237', text: 'A `PowerUp` is a falling coloured square with a `kind`, built the same way as `Bullet` and `Enemy`.' },
            { lines: '239-248', text: '`ArcadeWorld(World)` calls `super().__init__` and adds its own state: the timers, the combo, the power-ups and a running clock.' },
            { lines: '250-262', text: 'Two overrides. `on_destroyed` runs the original, then adds the combo bonus and sometimes drops a power-up. `lose_life` returns early while the shield is on, and otherwise defers to `super()`.' },
            { lines: '264-280', text: '`update` advances the clock and timers, picks the fire delay from whether rapid fire is on, runs the **base** update, then moves the power-ups and collects any the ship touches.' },
            { lines: '282-296', text: '`load_best` returns 0 for a missing or damaged file instead of crashing. `save_best` writes to a temporary file and then swaps it in with `os.replace`, so a crash never leaves a half-written save.' },
            { lines: '298-331', text: 'The `Game` owns the window, fonts, stars and a `state` string (`title`, `play`, `paused` or `over`). `handle_event` is a tiny state machine: which key does what depends on the current state.' },
            { lines: '333-355', text: '`react` turns the world’s events into effects (particles for `explode`, shake for `hurt`) and clears them. `finish_if_over` switches to the game-over state and saves a new best score.' },
            { lines: '357-370', text: 'One update step: the stars always move; the world only while playing; particles age and die; the shake fades.' },
            { lines: '372-423', text: 'Drawing goes to an off-screen `canvas`, which is blitted to the window at a random offset while the shake is active. That is the whole screen-shake effect: nothing else needs to know about it.' },
            { lines: '425-436', text: 'The classic loop, now only four lines: events, update, draw, repeat.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Make it yours',
          text: 'The best way to learn from a finished game is to extend it. Try one of these: a third power-up (a spread shot that fires three bullets), a boss every ten levels, a sound for each event in `react`, or a second enemy type that moves sideways. Each of them fits into one of the places the lesson already showed you.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the `ArcadeWorld.on_destroyed` override: call the parent version, record a combo hit with the world’s own clock, and add the bonus for every hit after the first.',
      template: `def on_destroyed(self, enemy):
    ___().on_destroyed(enemy)
    count = self.combo.hit(self.___)
    self.score += enemy.points * (count - ___)`,
      templateIsCode: true,
      blanks: [{ answers: ['super'] }, { answers: ['clock'] }, { answers: ['1'] }],
      wordBank: ['super', 'clock', '1', 'self', 'time', '0'],
      explanation: '`super().on_destroyed(enemy)` runs the original rule (it already adds `enemy.points` once). The combo then adds the extra: with a combo of 3 the multiplier is 3, so `points * (3 - 1)` more is added. `self.clock` is the world’s own running time, which keeps the combo independent of the real clock.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is the logic of `Effects.activate` and `Effects.update` written out step by step.',
      code: `timers = {"rapid": 6.0}
timers["rapid"] = max(timers.get("rapid", 0.0), 4.0)
timers["rapid"] -= 2.5
print(timers["rapid"])`,
      answer: '3.5',
      hint: 'Activating again with a shorter time must not shorten the effect.',
      explanation: '`max(6.0, 4.0)` is 6.0, so the shorter second pickup changes nothing. Then 2.5 seconds pass: 6.0 - 2.5 = 3.5.',
    },
    {
      kind: 'concept',
      title: 'Play-testing without playing',
      blocks: [
        {
          type: 'p',
          text: 'You cannot tune difficulty by feel alone, and you cannot ask a friend to play fifty games for you. But because the logic runs without a window, a **bot** can. A bot is a function from the world to `(direction, firing)`, the same two values the keyboard produces. `playtest` creates a fresh world, feeds it the bot’s decisions for a number of simulated seconds, and returns the result.',
        },
        {
          type: 'code',
          title: 'A simple bot and a play-test',
          lang: 'python',
          code: `def chase_bot(world):
    # aim at the lowest enemy and hold fire
    ...

result = playtest(lambda: World(random.Random(3)), chase_bot, 120, 1 / 60)
print(result)   # score, kills, lives, over, level`,
        },
        {
          type: 'p',
          text: 'The author’s version of this bot (move under the lowest enemy, fire all the time) was run for 120 simulated seconds on five different seeds against the base game. It always survived past level 7 and always lost in the end, and an idle bot that never fires lost within seconds. That is the shape you want: the game is beatable by a competent player, but not forever. If the bot never lost you would raise the speeds; if it lost at level 2 you would lower them. Each run takes a fraction of a second.',
        },
        {
          type: 'p',
          text: 'Here is a checklist to run through before you share a game with anyone:',
        },
        {
          type: 'table',
          headers: ['Check', 'Why it matters'],
          rows: [
            ['The window closes cleanly (the X button and Esc)', 'A game that cannot be closed gets uninstalled'],
            ['Pausing stops the world but not the window', 'Players answer the door in the middle of a game'],
            ['Nothing moves faster on a faster monitor', 'Everything is scaled by `dt`, and `dt` is capped'],
            ['A missing or damaged save file does not crash it', 'Players delete folders'],
            ['All paths to images and sounds work from any folder', 'Use `resource_path`, as in the packaging lesson'],
            ['A bot loses, and a human can win a few rounds', 'The difficulty curve is neither flat nor a wall'],
            ['A short README says the controls', 'Nobody reads the code to find the pause key'],
          ],
          caption: 'Packaging itself (PyInstaller for a desktop build, pygbag for the web) is covered in the packaging lesson.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why do the tests use fake worlds?',
          text: 'To test `playtest` you only need an object with an `update` method and the few fields it reads. A tiny fake world that counts the calls and records the inputs lets the test prove, with exact numbers, that `playtest` stops at the right moment. Testing the helper separately from the game is the same idea as testing `collide_bullets` separately from `World`.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Players report that the shield power-up shows the shield ring, plays the "block" event, and yet they **still lose a life**. Tap the line with the bug.',
      lines: [
        'def lose_life(self):',
        '    if self.effects.active("shield"):',
        '        self.events.append(("block",))',
        '    super().lose_life()',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'There is no `return` after recording the block, so the parent’s `lose_life` runs every time, shield or not. The block needs to end the method (`return`), and only an unshielded player should reach `super().lose_life()`.',
    },
    {
      kind: 'numeric',
      prompt: 'An enemy worth 30 points is destroyed as the **fourth** kill of a combo (the combo count is 4). The base rule adds 30, then `ArcadeWorld` adds `points * (count - 1)`. How many points does the kill add in total?',
      answer: '120',
      hint: '30 + 30 * 3.',
      explanation: 'The base `on_destroyed` adds 30, and the combo bonus adds `30 * (4 - 1) = 90`. The total is 120, which is `points * count`.',
      label: 'Points:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the finishing touches',
      blocks: [
        {
          type: 'p',
          text: 'Three last exercises, all of them pieces of the finished game: the `Starfield`, the `Effects` timers, and the `playtest` function with its bot. None needs a window, so each is tested with fake random numbers, exact times or a fake world. After this you will have written every moving part of Star Defender.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `Starfield(width, height, rng, count=40)`. It has the class attribute `SPEEDS = (20, 50, 90)` and keeps a list `stars` of `[x, y, layer]` lists. In `__init__`, create `count` stars in order: for star number `i`, `x` is `float(rng.randrange(width))` (asked **first**), `y` is `float(rng.randrange(height))`, and `layer` is `i % 3`. `update(dt)` moves every star down by `SPEEDS[layer] * dt`; a star whose `y` has reached `height` or more wraps: subtract `height` from `y` and pick a new `x` with `float(rng.randrange(width))`.',
      starter: `class Starfield:
    SPEEDS = (20, 50, 90)

    def __init__(self, width, height, rng, count=40):
        ...

    def update(self, dt):
        ...
`,
      solution: `class Starfield:
    SPEEDS = (20, 50, 90)

    def __init__(self, width, height, rng, count=40):
        self.width = width
        self.height = height
        self.rng = rng
        self.stars = []
        for i in range(count):
            self.stars.append([float(rng.randrange(width)), float(rng.randrange(height)), i % 3])

    def update(self, dt):
        for star in self.stars:
            star[1] += self.SPEEDS[star[2]] * dt
            if star[1] >= self.height:
                star[1] -= self.height
                star[0] = float(self.rng.randrange(self.width))
`,
      tests: `class Seq:
    def __init__(self, values):
        self.values = list(values)
        self.calls = []

    def randrange(self, n):
        self.calls.append(n)
        return self.values.pop(0)

rng = Seq([10, 20, 30, 40, 50, 5, 60, 7, 99, 88, 77])
s = Starfield(100, 50, rng, count=4)
assert s.stars == [[10.0, 20.0, 0], [30.0, 40.0, 1], [50.0, 5.0, 2], [60.0, 7.0, 0]]
assert rng.calls == [100, 50, 100, 50, 100, 50, 100, 50], "x first (width), then y (height), for every star"
assert all(isinstance(star[0], float) and isinstance(star[1], float) for star in s.stars)

s.update(0.5)
assert s.stars == [[10.0, 30.0, 0], [99.0, 15.0, 1], [88.0, 0.0, 2], [60.0, 17.0, 0]]
assert rng.calls[8:] == [100, 100], "only the two stars that wrapped drew a new x, in order"
s.update(0.5)
assert s.stars == [[10.0, 40.0, 0], [99.0, 40.0, 1], [88.0, 45.0, 2], [60.0, 27.0, 0]]
assert len(rng.calls) == 10, "no wrap: no new random numbers"

assert Starfield.SPEEDS == (20, 50, 90)
empty = Starfield(100, 50, Seq([]), count=0)
assert empty.stars == []
empty.update(1.0)
assert [star[2] for star in Starfield(10, 10, Seq([1] * 80), count=7).stars] == [0, 1, 2, 0, 1, 2, 0]`,
      checks: ['The stars are created in order, with x asked before y, and the layer cycles 0, 1, 2', 'Each star moves by its layer’s speed times `dt`', 'A star that reaches `height` wraps (subtracting `height`) and gets a new x'],
      hint: 'In `update`, `star[1] += self.SPEEDS[star[2]] * dt`, then `if star[1] >= self.height:` subtract the height and replace `star[0]`.',
      explanation: 'Three layers at three speeds give an impression of depth for almost no code: the slow stars look far away. Because the generator is passed in, the test can feed a known list of numbers and check every position exactly. Subtracting `height` instead of setting `y` to zero keeps the extra distance travelled, so the stars never stutter.',
    },
    {
      kind: 'code',
      prompt: 'Write the class `Effects`: a manager of timed effects. It keeps a dictionary `timers` (name to seconds left, starting empty). `activate(name, duration)` sets the effect to the **longer** of its current time (0.0 if absent) and `duration`. `update(dt)` reduces every timer by `dt` and removes the effects whose time is now `<= 0`. `active(name)` says whether the effect is running, and `time_left(name)` returns its seconds left, or `0.0` if it is not running.',
      starter: `class Effects:
    def __init__(self):
        ...

    def activate(self, name, duration):
        ...

    def update(self, dt):
        ...

    def active(self, name):
        ...

    def time_left(self, name):
        ...
`,
      solution: `class Effects:
    def __init__(self):
        self.timers = {}

    def activate(self, name, duration):
        self.timers[name] = max(self.timers.get(name, 0.0), duration)

    def update(self, dt):
        for name in list(self.timers):
            self.timers[name] -= dt
            if self.timers[name] <= 0:
                del self.timers[name]

    def active(self, name):
        return name in self.timers

    def time_left(self, name):
        return self.timers.get(name, 0.0)
`,
      tests: `e = Effects()
assert e.timers == {} and e.active("rapid") is False and e.time_left("rapid") == 0.0
e.update(1.0)
assert e.timers == {}, "updating nothing is fine"

e.activate("rapid", 6.0)
assert e.active("rapid") is True and e.time_left("rapid") == 6.0
e.activate("rapid", 4.0)
assert e.time_left("rapid") == 6.0, "a shorter pickup never shortens the effect"
e.update(2.5)
assert e.time_left("rapid") == 3.5 and e.active("rapid")
e.activate("rapid", 2.0)
assert e.time_left("rapid") == 3.5
e.activate("rapid", 8.0)
assert e.time_left("rapid") == 8.0, "a longer pickup extends it"

e = Effects()
e.activate("rapid", 3.5)
e.activate("shield", 1.0)
e.update(0.5)
assert e.timers == {"rapid": 3.0, "shield": 0.5}
e.update(0.5)
assert e.active("shield") is False and e.time_left("shield") == 0.0, "expired at exactly zero"
assert e.timers == {"rapid": 2.5}
e.update(10.0)
assert e.timers == {}, "several effects can expire in one update"
assert e.active("rapid") is False

a, b = Effects(), Effects()
a.activate("shield", 1.0)
assert b.timers == {}, "each manager has its own dictionary"`,
      checks: ['`activate` keeps the longer of the old and new durations', '`update` counts every timer down and removes the expired ones without errors', '`active` and `time_left` read the dictionary, with `0.0` for an effect that is not running'],
      hint: 'In `update`, loop over `list(self.timers)` (a copy of the keys), so that deleting entries while looping is safe.',
      explanation: 'Looping over `list(self.timers)` matters: deleting from a dictionary while iterating over it directly raises a `RuntimeError`. A dictionary of names to timers is a very reusable shape; it also fits cooldowns, invulnerability, stun, buffs and any other "for the next N seconds" idea.',
    },
    {
      kind: 'code',
      prompt: 'Write two functions. `chase_bot(world)` returns `(direction, firing)`. Find the **lowest** enemy in `world.enemies` (the largest `y`; on a tie the **first** one). With no enemies return `(0, False)`. Otherwise compute `diff`, the target’s centre (`target.x + ENEMY_W / 2`) minus the ship’s centre (`world.ship.x + SHIP_W / 2`); if `abs(diff) <= 6` return `(0, True)`, else return `(1, True)` when `diff > 0` and `(-1, True)` otherwise. `playtest(make_world, bot, seconds, dt)` creates a world with `make_world()`, then repeats `int(seconds / dt)` times: stop early if `world.over`; otherwise get `(direction, firing)` from `bot(world)` and call `world.update(dt, direction, firing)`. At the end return the dictionary `{"score": ..., "kills": ..., "lives": ..., "over": ..., "level": ...}` from the world.',
      starter: `SHIP_W = 36
ENEMY_W = 32


def chase_bot(world):
    ...


def playtest(make_world, bot, seconds, dt):
    ...
`,
      solution: `SHIP_W = 36
ENEMY_W = 32


def chase_bot(world):
    target = None
    for enemy in world.enemies:
        if target is None or enemy.y > target.y:
            target = enemy
    if target is None:
        return 0, False
    diff = target.x + ENEMY_W / 2 - (world.ship.x + SHIP_W / 2)
    if abs(diff) <= 6:
        return 0, True
    return (1 if diff > 0 else -1), True


def playtest(make_world, bot, seconds, dt):
    world = make_world()
    for _ in range(int(seconds / dt)):
        if world.over:
            break
        direction, firing = bot(world)
        world.update(dt, direction, firing)
    return {"score": world.score, "kills": world.kills, "lives": world.lives, "over": world.over, "level": world.level}
`,
      tests: `from types import SimpleNamespace as NS

def world_with(ship_x, enemies):
    return NS(ship=NS(x=ship_x), enemies=[NS(x=x, y=y) for x, y in enemies])

assert chase_bot(world_with(100, [])) == (0, False), "no enemies: stand still, do not fire"
assert chase_bot(world_with(100, [(300, 50)])) == (1, True), "target on the right"
assert chase_bot(world_with(300, [(100, 50)])) == (-1, True), "target on the left"
assert chase_bot(world_with(100, [(102, 50)])) == (0, True), "centres 2 pixels apart: close enough"
assert chase_bot(world_with(100, [(98, 50)])) == (0, True)
assert chase_bot(world_with(100, [(108, 50)])) == (0, True), "centres exactly 6 apart: still aligned"
assert chase_bot(world_with(100, [(109, 50)])) == (1, True), "7 apart: move right"
assert chase_bot(world_with(100, [(96, 50)])) == (0, True), "centres 6 apart on the left"
assert chase_bot(world_with(100, [(95, 50)])) == (-1, True), "7 apart on the left"
assert chase_bot(world_with(100, [(300, 10), (50, 200), (400, 90)])) == (-1, True), "the lowest enemy (y = 200) is at x = 50"
assert chase_bot(world_with(100, [(300, 80), (50, 80)])) == (1, True), "tie: the first one in the list"

class FakeWorld:
    def __init__(self, die_after=None):
        self.calls = []
        self.die_after = die_after
        self.score, self.kills, self.lives, self.level = 70, 7, 2, 3

    @property
    def over(self):
        return self.die_after is not None and len(self.calls) >= self.die_after

    def update(self, dt, direction, firing):
        self.calls.append((dt, direction, firing))

made = []
def make():
    w = FakeWorld()
    made.append(w)
    return w

seen = []
def bot(world):
    seen.append(len(world.calls))
    return (len(world.calls) % 3) - 1, len(world.calls) % 2 == 0

result = playtest(make, bot, 1.0, 0.25)
assert len(made) == 1, "one world is created per play-test"
assert seen == [0, 1, 2, 3], "int(1.0 / 0.25) = 4 steps"
assert made[0].calls == [(0.25, -1, True), (0.25, 0, False), (0.25, 1, True), (0.25, -1, False)]
assert result == {"score": 70, "kills": 7, "lives": 2, "over": False, "level": 3}

made.clear()
def make_dying():
    w = FakeWorld(die_after=2)
    made.append(w)
    return w
result = playtest(make_dying, lambda w: (0, False), 10, 0.5)
assert len(made[0].calls) == 2, "stops as soon as the world is over"
assert result["over"] is True

made.clear()
assert playtest(make, bot, 0.1, 0.25)["over"] is False and made[0].calls == [], "less than one step: nothing happens"`,
      checks: ['`chase_bot` targets the lowest enemy (first on a tie), stands still when aligned within 6 pixels, and does not fire with no enemies', '`playtest` runs `int(seconds / dt)` steps with the bot’s decisions and stops early when the world is over', 'The result is a dictionary with the five fields read from the world'],
      hint: 'Pick the target with a loop that replaces it only when `enemy.y > target.y` (strictly greater, so the first one wins ties). For `playtest`, `break` at the top of the loop when `world.over`.',
      explanation: 'This is small, but it is the most powerful tool in the lesson: any change to the speeds or spawn rates can now be judged by numbers instead of by feel. Notice that `playtest` never mentions pygame, and the tests never use the real game: a fake world with an `update` method is enough, because the function only needs that interface.',
    },
  ],
  takeaways: [
    'A finished game is mostly the **care around the rules**: states, pause, feedback, a goal to chase and a few surprises. Most of it can be added without touching the tested core.',
    '**Subclass and override hooks** (`ArcadeWorld(World)`, calling `super()`) to extend tested behaviour: the original tests still describe the base game, and the extras live in one place.',
    'Funnel each rule through **one method** (`lose_life`, `on_destroyed`). One override then changes every path that reaches it, such as the shield protecting against both contact and enemies passing the bottom.',
    'Visual effects react to **events**: particles and shake are driven by `world.events`, and screen shake is just blitting an off-screen canvas at a random offset.',
    'A **bot** and a `playtest` function let you check difficulty in a fraction of a second, with no window. Inject the random generator and the world factory so runs are repeatable.',
    'Finish with a checklist: clean exit, pause, `dt` everywhere, safe save loading, working asset paths, a beatable-but-not-forever difficulty, and a README with the controls.',
  ],
  reading: [
    { title: 'pygame docs: pygame.Surface', url: 'https://www.pygame.org/docs/ref/surface.html', source: 'docs', note: 'The off-screen canvas used for the shake effect, and everything else you can do with surfaces.' },
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'A deeper look at fixed and variable time steps, the foundation of everything in this course.' },
    { title: 'Python docs: super()', url: 'https://docs.python.org/3/library/functions.html#super', source: 'docs', note: 'How a subclass calls the parent version of a method.' },
    { title: 'pygame-ce documentation', url: 'https://pyga.me/docs/', source: 'docs', note: 'The community edition of pygame, a good place to look for new features once you outgrow the basics.' },
  ],
};
