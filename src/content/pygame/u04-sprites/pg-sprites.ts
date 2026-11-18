import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-sprites',
  title: 'Sprites and Groups',
  summary: 'Turn each thing in the game into an object with an image, a rectangle and an update method, and manage hundreds of them with Groups.',
  minutes: 40,
  objectives: [
    'Write a `pygame.sprite.Sprite` subclass with `image`, `rect` and `update`, remembering `super().__init__()`',
    'Collect sprites in a `Group` and use `update`, `draw`, `add`, `remove`, `len` and iteration',
    'Use several groups at once (all sprites, enemies, bullets) and explain what `kill()` does',
    'Keep exact positions in floats and copy them to the rect',
    'Draw sprites in a chosen order, such as sorted by their bottom edge',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From variables to objects',
      blocks: [
        {
          type: 'p',
          text: 'In the earlier lessons every moving thing was a handful of variables: `player_x`, `player_speed`, `player_image`. With one player that is fine. With thirty enemies, forty bullets and a dozen coins, it becomes a mess of lists and parallel indexes. The answer is the one Python gives for everything: **a class**. Each thing in the game becomes an object that owns its picture, its rectangle and its own behaviour.',
        },
        {
          type: 'p',
          text: 'pygame offers a ready-made base class for this: `pygame.sprite.Sprite`. A sprite is only a convention: it expects two attributes, `image` (a surface) and `rect` (a `Rect`), and an `update` method that you override. In return it can live in **Groups**, which update, draw and clean up many sprites with one call.',
        },
        {
          type: 'table',
          headers: ['Part', 'What you provide', 'Used by'],
          rows: [
            ['`self.image`', 'The surface to draw', '`group.draw(screen)`'],
            ['`self.rect`', 'Where it is and how big', '`group.draw`, and the collision functions'],
            ['`update(self, ...)`', 'What it does each frame', '`group.update(...)`'],
            ['`super().__init__()`', 'A required call at the start of your `__init__`', 'Sets up the sprite’s group bookkeeping'],
            ['`self.kill()`', 'Inherited: remove itself from every group', 'Dead enemies, spent bullets'],
          ],
          caption: 'The base class does the bookkeeping; you write the behaviour.',
        },
        {
          type: 'code',
          title: 'sprites_demo.py',
          desktopOnly: true,
          code: `import random
import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()


class Player(pygame.sprite.Sprite):
    def __init__(self, pos):
        super().__init__()
        self.image = pygame.Surface((40, 40))
        self.image.fill((90, 200, 240))
        self.pos = pygame.Vector2(pos)
        self.rect = self.image.get_rect(center=self.pos)

    def update(self, dt, keys):
        move = pygame.Vector2(keys[pygame.K_RIGHT] - keys[pygame.K_LEFT],
                              keys[pygame.K_DOWN] - keys[pygame.K_UP])
        if move.length() > 0:
            self.pos += move.normalize() * 240 * dt
        self.rect.center = self.pos
        self.rect.clamp_ip(pygame.display.get_surface().get_rect())
        self.pos.update(self.rect.center)


class Coin(pygame.sprite.Sprite):
    def __init__(self, pos):
        super().__init__()
        self.image = pygame.Surface((20, 20), pygame.SRCALPHA)
        pygame.draw.circle(self.image, (250, 200, 40), (10, 10), 10)
        self.rect = self.image.get_rect(center=pos)


player = Player((320, 180))
coins = pygame.sprite.Group()
for _ in range(8):
    coins.add(Coin((random.randint(20, 620), random.randint(20, 340))))
all_sprites = pygame.sprite.Group(player, *coins)
score = 0
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    all_sprites.update(dt, pygame.key.get_pressed())
    score += len(pygame.sprite.spritecollide(player, coins, True))

    screen.fill((20, 24, 48))
    all_sprites.draw(screen)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '9-15', text: 'A sprite class. `super().__init__()` comes first, then the two required attributes, `image` and `rect`. Here the picture is a plain coloured surface, so no art files are needed.' },
            { lines: '14-15', text: 'The exact position is a float `Vector2`, and the rectangle is created from it, as in the rect lesson: slow movement would otherwise be lost to rounding.' },
            { lines: '17-24', text: '`update` runs once per frame. Its parameters are up to you; here it takes `dt` and the key state. It moves the position, copies it to the rect, keeps the rect on the screen, and copies the clamped centre back into `pos`, so that the exact position cannot drift off-screen.' },
            { lines: '27-32', text: 'Coins have no behaviour: just a picture (a circle on a transparent surface) and a rectangle. They need no `update` of their own: the inherited one does nothing.' },
            { lines: '36-39', text: 'Two groups: `coins` (to test collisions against) and `all_sprites` (to update and draw everything). A sprite can belong to any number of groups.' },
            { lines: '49', text: '`all_sprites.update(dt, keys)` calls `update(dt, keys)` on **every** sprite in the group.' },
            { lines: '50', text: '`spritecollide(player, coins, True)` finds the coins the player touches **and kills them**, removing them from every group. It returns the list, so `len` counts the collected ones.' },
            { lines: '53', text: '`all_sprites.draw(screen)` blits each sprite’s `image` at its `rect`: one line draws the whole game.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother with classes and groups?',
          text: 'Each sprite knows how to move and look, so the main loop shrinks to "update everything, draw everything". Adding a new kind of enemy means writing one more small class, not editing five lists. And because a group can hold any number of sprites, a game with 3 bullets and a game with 300 use the same code.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does `enemy.kill()` do on a sprite that belongs to the groups `all_sprites` and `enemies`?',
      options: [
        { text: 'Removes it from **every** group it is in, so it is no longer updated or drawn', correct: true, why: 'That is the whole purpose of `kill`: it takes the sprite out of all its groups at once. If nothing else refers to the object, Python then frees it.' },
        { text: 'Removes it only from the group it was last added to', why: '`kill` removes it from all groups. To leave just one, use `group.remove(sprite)`.' },
        { text: 'Deletes the Python object immediately', why: 'The object lives on as long as some variable refers to it. `kill` only removes it from the groups.' },
        { text: 'Sets its `image` to `None`', why: 'The sprite is untouched; it is just no longer in any group, so group operations ignore it.' },
      ],
      explanation: '`kill()` removes a sprite from all groups. Groups are how the game finds sprites, so a killed sprite is gone from the game.',
    },
    {
      kind: 'truefalse',
      prompt: 'Calling `kill()` on a sprite while a `for` loop goes through the group is safe, because a `Group` iterates over a copy of its sprites.',
      answer: true,
      explanation: 'True. `Group.sprites()` (and so iteration) returns a **list copy**, so removing sprites from the group while looping does not skip anything or raise an error. This is different from removing items from a plain list while looping over that same list, which is a classic bug.',
    },
    {
      kind: 'concept',
      title: 'Groups: one call for many',
      blocks: [
        {
          type: 'p',
          text: 'A `Group` is a container of sprites with batch operations. You usually keep one group per **role** the sprites play, and a sprite can be in several at once:',
        },
        {
          type: 'table',
          headers: ['Group', 'Holds', 'Why it exists'],
          rows: [
            ['`all_sprites`', 'Everything visible', '`update` and `draw` the whole world in two lines'],
            ['`enemies`', 'Enemy sprites only', 'Collide the player and the bullets against enemies'],
            ['`bullets`', 'Bullet sprites only', 'Collide against enemies, remove when off-screen'],
            ['`pickups`', 'Coins, power-ups', '`spritecollide(player, pickups, True)`'],
            ['`walls`', 'Solid tiles', 'Collide movers against walls'],
          ],
          caption: 'A sprite built with several groups: `super().__init__(all_sprites, enemies)` adds it to both.',
        },
        {
          type: 'table',
          headers: ['Operation', 'Effect'],
          rows: [
            ['`Group(a, b, c)`', 'Create a group holding those sprites'],
            ['`group.add(s)`, `group.remove(s)`', 'Join or leave a group'],
            ['`group.update(*args)`', 'Call `update(*args)` on every sprite'],
            ['`group.draw(surface)`', 'Blit every sprite’s `image` at its `rect`'],
            ['`len(group)`, `for s in group`, `s in group`', 'Count, iterate, test membership'],
            ['`group.sprites()`', 'A list copy of the sprites'],
            ['`group.empty()`', 'Remove all the sprites from the group (not from other groups)'],
            ['`sprite.groups()`, `sprite.alive()`', 'Which groups a sprite is in; whether it is in any'],
          ],
          caption: 'The collision functions in the next lesson take groups too.',
        },
        {
          type: 'p',
          text: 'Because groups hold **references**, a sprite that is in no group and has no variable pointing at it is deleted by Python. So `Group` is also the **owner** of the sprites: add a bullet to `bullets`, and it exists until it is killed.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the sprite class, and the loop that draws a group.',
      template: `class Enemy(pygame.sprite.___):
    def __init__(self):
        super().___()
        self.image = pygame.Surface((30, 30))
        self.rect = self.image.get_rect()

enemies.___(screen)`,
      templateIsCode: true,
      blanks: [{ answers: ['Sprite'] }, { answers: ['__init__'] }, { answers: ['draw'] }],
      wordBank: ['Sprite', '__init__', 'draw', 'update', 'Group', 'kill'],
      explanation: 'Subclass `pygame.sprite.Sprite`, call `super().__init__()` first, and draw a whole group with `group.draw(screen)`.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This imitates killing sprites while going through a group: the loop goes over a copy (`items[:]`) so that removing from the list is safe.',
      code: `items = [1, 2, 3, 4]
for item in items[:]:
    if item % 2 == 0:
        items.remove(item)
print(items)`,
      answer: '[1, 3]',
      hint: 'The even numbers are removed from the real list.',
      explanation: 'Looping over the copy `items[:]` while removing from `items` is safe, and leaves `[1, 3]`. Looping over `items` itself would skip elements as they shift down. A pygame `Group` does the copying for you.',
    },
    {
      kind: 'concept',
      title: 'Habits for sprite code',
      blocks: [
        {
          type: 'table',
          headers: ['Habit', 'Reason'],
          rows: [
            ['Call `super().__init__()` **first** in `__init__`', 'Without it the sprite cannot join a group'],
            ['Keep an exact `pos` (float) and set `rect.center = pos`', 'Slow movement and `dt` steps are not lost to integer rounding'],
            ['Give each class one job and a short `update`', 'Enemy, Bullet, Coin: easy to read and to change'],
            ['Pass shared things (`dt`, the player, the screen size) into `update`', 'Avoids global variables'],
            ['Make `kill()` the way things leave the game', 'One place for removal; no lists to keep in sync'],
            ['Pre-load images once and pass them in', 'Don’t call `image.load` in `__init__`: you would reload a file for every bullet'],
            ['Draw in a deliberate order', 'Later sprites are painted on top: see below'],
          ],
          caption: 'Most sprite bugs are broken versions of one of these.',
        },
        {
          type: 'p',
          text: '`group.draw(screen)` draws the sprites in **no promised order**. When overlap matters, decide the order yourself. In a top-down game the usual rule is "**things lower on the screen are in front**", so sort by `rect.bottom` before drawing (a "y-sort"). For fixed layers (background, world, interface) use `pygame.sprite.LayeredUpdates`, which has a `layer` for each sprite.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'A sprite does not have to be a picture',
          text: 'Invisible sprites are normal: a trigger zone, a spawner, a timer. They are objects with a `rect` and an `update`, added to a group, but with no `image` (and kept out of the draw group). The Sprite class is a game **object**, and drawing is only one of the things it can do.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The program crashes with `AttributeError: \'Enemy\' object has no attribute \'_Sprite__g\'` when the enemy is put in a group. Tap the line where the missing call belongs.',
      lines: [
        'class Enemy(pygame.sprite.Sprite):',
        '    def __init__(self):',
        '        self.image = pygame.Surface((30, 30))',
        '        self.rect = self.image.get_rect()',
        'enemies = pygame.sprite.Group(Enemy())',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The `__init__` of `Enemy` replaces the one in `Sprite` without calling it, so the sprite’s group bookkeeping (the hidden `_Sprite__g` attribute) never gets set up. Add `super().__init__()` as the first line inside `__init__`.',
    },
    {
      kind: 'numeric',
      prompt: 'A group holds 25 sprites, and the game runs at 60 frames per second. How many images does `group.draw(screen)` blit each second?',
      answer: '1500',
      hint: 'Sprites times frames.',
      explanation: '25 x 60 = 1500 blits per second. That is nothing for pygame; hundreds of sprites are fine, and thousands start to need care (the performance lesson). Converting images with `convert_alpha()` is the first thing that keeps it fast.',
      label: 'Blits:',
    },
    {
      kind: 'concept',
      title: 'Your turn: sprite classes',
      blocks: [
        {
          type: 'p',
          text: 'You will write real `Sprite` subclasses and group helpers. The sprites use plain surfaces, so no art is needed, and the tests check the group contents rather than the pixels.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write a sprite class `Mover(pos, velocity)`. It has a 10 by 10 surface `image` and a `rect` centred on `pos`. It keeps its exact position in `self.pos` (a `pygame.Vector2`) and its `velocity` (pixels per second, a `Vector2`). `update(dt)` moves `self.pos` by `velocity * dt`, then sets `rect.center = self.pos`. If after that the rect has left the area `Rect(0, 0, 100, 100)` **completely** (it does not overlap it at all), call `self.kill()`.',
      starter: `import pygame

AREA = pygame.Rect(0, 0, 100, 100)


class Mover(pygame.sprite.Sprite):
    def __init__(self, pos, velocity):
        ...

    def update(self, dt):
        ...
`,
      solution: `import pygame

AREA = pygame.Rect(0, 0, 100, 100)


class Mover(pygame.sprite.Sprite):
    def __init__(self, pos, velocity):
        super().__init__()
        self.image = pygame.Surface((10, 10))
        self.pos = pygame.Vector2(pos)
        self.velocity = pygame.Vector2(velocity)
        self.rect = self.image.get_rect(center=self.pos)

    def update(self, dt):
        self.pos += self.velocity * dt
        self.rect.center = self.pos
        if not self.rect.colliderect(AREA):
            self.kill()
`,
      setup: PG_SIM,
      tests: `group = pygame.sprite.Group()
m = Mover((50, 50), (40, 0))
group.add(m)
assert m.rect.center == (50, 50) and m.image.get_size() == (10, 10)
assert len(group) == 1 and m in group
group.update(0.25)
assert m.pos.x == 60 and m.pos.y == 50, m.pos
assert m.rect.center == (60, 50)
group.update(0.5)
assert m.rect.center == (80, 50) and len(group) == 1
group.update(0.5)
assert m.rect.center == (100, 50) and len(group) == 1, "half outside: still alive"
group.update(0.25)
assert m.rect.center == (110, 50) and m.rect.left == 105, m.rect
assert len(group) == 0 and m not in group, "completely outside: killed"
assert m.alive() is False
a = Mover((50, 50), (0, -100))
b = Mover((20, 20), (0, 0))
both = pygame.sprite.Group(a, b)
both.update(0.25)
assert a.rect.center == (50, 25) and len(both) == 2
both.update(1)
assert a not in both and b in both and len(both) == 1
solo = Mover((0, 0), (0, 0))
assert solo.groups() == []
other = pygame.sprite.Group()
extra = pygame.sprite.Group()
x = Mover((50, 50), (1000, 0))
other.add(x)
extra.add(x)
other.update(1)
assert len(other) == 0 and len(extra) == 0, "kill removes it from every group"`,
      checks: ['A `Mover` is a `Sprite` with a 10 by 10 `image` and a `rect` centred on `pos`', '`update(dt)` moves the exact position by `velocity * dt` and copies it to the rect', 'When no part of the rect overlaps the area any more, the sprite kills itself (from every group)'],
      hint: 'Start `__init__` with `super().__init__()`. Keep `self.pos` and `self.velocity` as `Vector2`. In `update`: `self.pos += self.velocity * dt`, `self.rect.center = self.pos`, then `if not self.rect.colliderect(AREA): self.kill()`.',
      explanation: 'A bullet, a spark and a falling rock are all this class with different numbers. Notice the sprite cleans itself up: nothing outside needs to track which movers have left the screen. Using `colliderect` (rather than a point) means a sprite is removed only when it is entirely gone.',
    },
    {
      kind: 'code',
      prompt: 'Write `nearest(sprite, group)` that returns the sprite in `group` whose rect centre is closest to the centre of `sprite` (or `None` if the group is empty; if `sprite` itself is in the group, ignore it). Write `remove_offscreen(group, area)` that kills every sprite in `group` whose rect does not overlap the `area` rectangle at all, and returns how many were killed.',
      starter: `import pygame


def nearest(sprite, group):
    ...


def remove_offscreen(group, area):
    ...
`,
      solution: `import pygame


def nearest(sprite, group):
    best = None
    best_distance = None
    here = pygame.Vector2(sprite.rect.center)
    for other in group:
        if other is sprite:
            continue
        d = here.distance_to(pygame.Vector2(other.rect.center))
        if best is None or d < best_distance:
            best = other
            best_distance = d
    return best


def remove_offscreen(group, area):
    killed = 0
    for s in group.sprites():
        if not s.rect.colliderect(area):
            s.kill()
            killed += 1
    return killed
`,
      setup: PG_SIM,
      tests: `class Box(pygame.sprite.Sprite):
    def __init__(self, x, y, size=10):
        super().__init__()
        self.image = pygame.Surface((size, size))
        self.rect = self.image.get_rect(center=(x, y))

me = Box(0, 0)
a, b, c = Box(30, 40), Box(-10, 0), Box(100, 100)
g = pygame.sprite.Group(a, b, c)
assert nearest(me, g) is b
assert nearest(me, pygame.sprite.Group()) is None
g.add(me)
assert nearest(me, g) is b, "the sprite itself is ignored"
only = pygame.sprite.Group(me)
assert nearest(me, only) is None
assert nearest(a, pygame.sprite.Group(c, Box(1000, 1000))) is c
far = Box(1000, 1000)
assert nearest(me, pygame.sprite.Group(far)) is far
area = pygame.Rect(0, 0, 200, 100)
group = pygame.sprite.Group(Box(50, 50), Box(-20, 50), Box(300, 50), Box(195, 50), Box(50, 130), Box(-4, 50))
other = pygame.sprite.Group()
for s in group:
    other.add(s)
assert remove_offscreen(group, area) == 3
assert len(group) == 3 and len(other) == 3, "killed from all groups"
assert remove_offscreen(group, area) == 0
assert remove_offscreen(pygame.sprite.Group(), area) == 0
assert all(s.rect.colliderect(area) for s in group)`,
      checks: ['`nearest` compares centre distances, ignores the sprite itself, and returns `None` for nothing to compare', '`remove_offscreen` kills every sprite that is entirely outside `area` and returns the count', 'It is safe to kill sprites while processing the group'],
      hint: 'For `nearest`, keep the best sprite and its distance so far, using `Vector2.distance_to`. For `remove_offscreen`, loop over `group.sprites()` (a copy) and call `kill()` on those that fail `colliderect(area)`.',
      explanation: '"Find the nearest enemy" is the heart of homing missiles and turrets; "remove what left the screen" is the cleanup every bullet group needs. Both are short because the group already provides iteration and `kill`.',
    },
    {
      kind: 'code',
      prompt: 'Write a sprite class `Spark(pos, velocity, lifetime)` for a short-lived particle. It has a 4 by 4 `image` and a `rect` centred at `pos`; an exact `pos` and `velocity` as `Vector2` (pixels per second); an `age` starting at 0.0. `update(dt)` adds `dt` to `age`; if `age >= lifetime`, it kills itself and does nothing else; otherwise it moves by `velocity * dt` and sets `rect.center`. Write `draw_order(sprites)` that returns a list of the sprites sorted by their `rect.bottom` from **smallest to largest**, so that the lowest sprites are drawn last (in front). Sprites with equal bottoms keep their original order.',
      starter: `import pygame


class Spark(pygame.sprite.Sprite):
    def __init__(self, pos, velocity, lifetime):
        ...

    def update(self, dt):
        ...


def draw_order(sprites):
    ...
`,
      solution: `import pygame


class Spark(pygame.sprite.Sprite):
    def __init__(self, pos, velocity, lifetime):
        super().__init__()
        self.image = pygame.Surface((4, 4))
        self.pos = pygame.Vector2(pos)
        self.velocity = pygame.Vector2(velocity)
        self.lifetime = lifetime
        self.age = 0.0
        self.rect = self.image.get_rect(center=self.pos)

    def update(self, dt):
        self.age += dt
        if self.age >= self.lifetime:
            self.kill()
            return
        self.pos += self.velocity * dt
        self.rect.center = self.pos


def draw_order(sprites):
    return sorted(sprites, key=lambda s: s.rect.bottom)
`,
      setup: PG_SIM,
      tests: `g = pygame.sprite.Group()
s = Spark((100, 100), (20, -40), 1.0)
g.add(s)
assert s.rect.center == (100, 100) and s.image.get_size() == (4, 4) and s.age == 0.0
g.update(0.25)
assert s.rect.center == (105, 90), s.rect.center
assert s.age == 0.25 and len(g) == 1
g.update(0.5)
assert s.rect.center == (115, 70)
g.update(0.25)
assert len(g) == 0 and s.alive() is False, "dies exactly at its lifetime"
assert s.rect.center == (115, 70), "a dying spark does not move on its last update"
sparks = [Spark((0, 0), (10, 0), 0.5) for _ in range(5)]
group = pygame.sprite.Group(*sparks)
group.update(0.25)
assert len(group) == 5
group.update(0.25)
assert len(group) == 0

class Box(pygame.sprite.Sprite):
    def __init__(self, name, bottom):
        super().__init__()
        self.name = name
        self.image = pygame.Surface((10, 10))
        self.rect = self.image.get_rect(bottomleft=(0, bottom))

items = [Box("c", 50), Box("a", 20), Box("d", 50), Box("b", 30)]
order = draw_order(items)
assert [i.name for i in order] == ["a", "b", "c", "d"]
assert [i.name for i in items] == ["c", "a", "d", "b"], "the input list is not changed"
assert draw_order([]) == []
assert [i.name for i in draw_order(pygame.sprite.Group(*items))] in (["a", "b", "c", "d"], ["a", "b", "d", "c"])`,
      checks: ['A `Spark` ages with `dt` and kills itself when its age reaches its lifetime, without moving on that last update', 'While alive it moves by `velocity * dt` and keeps its rect centred on the exact position', '`draw_order` sorts by `rect.bottom` (smallest first), keeps equal ones in order, and leaves the input unchanged'],
      hint: 'In `update`: add `dt` to `age`, `if self.age >= self.lifetime: self.kill(); return`, then move. `sorted(sprites, key=lambda s: s.rect.bottom)` is stable, so equal values keep their order, and it returns a new list.',
      explanation: 'Particles are the classic short-lived sprite: spawn many, let each age and kill itself, and the group needs no extra management. The y-sort is the one-line trick that makes a top-down game look right: a character standing lower on the screen is nearer to the viewer, so it is drawn on top.',
    },
  ],
  takeaways: [
    'A `pygame.sprite.Sprite` is a game object with an `image`, a `rect` and an `update` method. Subclass it for each kind of thing, and call `super().__init__()` **first**.',
    'A `Group` holds sprites: `update(*args)` calls every sprite’s `update`, `draw(screen)` blits every image at its rect, and `len`, iteration and `in` work as you would expect.',
    'Use several groups, one per role (`all_sprites`, `enemies`, `bullets`, `pickups`); a sprite can be in many. `kill()` removes it from **all** of them, and iterating a group is safe while killing, because it uses a copy.',
    'Keep the exact position as a float (`Vector2`) and copy it to `rect.center` each frame, so slow or `dt`-scaled movement is not lost to rounding.',
    'Let sprites clean up after themselves (`kill()` when off-screen or out of lifetime), and load images once, outside the sprite classes.',
    '`group.draw` has no promised order: sort by `rect.bottom` for a top-down view, or use `LayeredUpdates` for fixed layers. Sprites need not be visible; a timer or trigger can be a sprite too.',
  ],
  reading: [
    { title: 'pygame docs: pygame.sprite', url: 'https://www.pygame.org/docs/ref/sprite.html', source: 'docs', note: 'Sprite, Group, LayeredUpdates and every collision function.' },
    { title: 'Real Python: Sprites in the pygame primer', url: 'https://realpython.com/pygame-a-primer/#sprites', source: 'tutorial', note: 'A first sprite-based game, built step by step.' },
    { title: 'Game Programming Patterns: Update Method', url: 'https://gameprogrammingpatterns.com/update-method.html', source: 'book', note: 'Why each object gets its own update, and how collections of objects are updated.' },
  ],
};
