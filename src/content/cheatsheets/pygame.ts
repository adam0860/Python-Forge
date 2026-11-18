import type { CheatSheet } from '../types';

export const pygameCheatSheets: CheatSheet[] = [
  {
    id: 'pg-basics',
    title: 'pygame Basics: Window, Loop and Input',
    course: 'pygame',
    icon: '🎮',
    description: 'The skeleton of every pygame program: the window, the game loop, delta time, events and keyboard input.',
    sections: [
      {
        title: 'A minimal game',
        items: [
          { label: 'Window and loop', code: 'import pygame\n\npygame.init()\nscreen = pygame.display.set_mode((640, 480))\npygame.display.set_caption("My game")\nclock = pygame.time.Clock()\n\nrunning = True\nwhile running:\n    dt = clock.tick(60) / 1000\n    for event in pygame.event.get():\n        if event.type == pygame.QUIT:\n            running = False\n    screen.fill((20, 24, 48))\n    pygame.display.flip()\npygame.quit()' },
          { label: 'The four jobs of a frame', text: 'Every pass of the loop does the same four things in the same order: **handle events**, **update** the game state, **draw**, then **flip** and wait for the next tick.' },
          { label: 'Always handle QUIT', text: 'Without the `pygame.QUIT` check the window cannot be closed. Keep the loop as `while running:` so the cleanup after it still runs.' },
          { label: 'Coordinates', text: '`(0, 0)` is the **top-left** corner. `x` grows to the right, `y` grows **down**.' },
        ],
      },
      {
        title: 'Time',
        items: [
          { label: 'Frame cap and delta time', code: 'dt = clock.tick(60) / 1000     # seconds since the last frame\nx += speed * dt                # speed is in pixels per second' },
          { label: 'Cap dt', code: 'dt = min(clock.tick(60) / 1000, 0.05)   # a long pause must not teleport things' },
          { label: 'Show the real rate', code: 'pygame.display.set_caption(f"{clock.get_fps():.0f} FPS")' },
          { label: 'Timers', code: 'now = pygame.time.get_ticks()      # milliseconds since pygame.init()\nif now - last_shot >= 250:\n    last_shot = now' },
        ],
      },
      {
        title: 'Events and keys',
        items: [
          { label: 'One-off actions: events', code: 'for event in pygame.event.get():\n    if event.type == pygame.KEYDOWN:\n        if event.key == pygame.K_SPACE:\n            jump()\n        elif event.key == pygame.K_ESCAPE:\n            running = False' },
          { label: 'Held keys: state', code: 'keys = pygame.key.get_pressed()\ndirection = keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]   # -1, 0 or 1\nx += direction * speed * dt' },
          { label: 'Events or state?', text: 'Use `KEYDOWN` for things that happen **once** per press (jump, pause, shoot one bullet). Use `get_pressed()` for things that continue **while held** (walking).' },
          { label: 'Mouse', code: 'x, y = pygame.mouse.get_pos()\nif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:\n    click(event.pos)' },
          { label: 'Call event.get once', text: '`pygame.event.get()` empties the queue. Call it **once** per frame and pass the events around, or one part of the code will steal them from another.' },
        ],
      },
    ],
  },
  {
    id: 'pg-geometry',
    title: 'Rect and Vector2',
    course: 'pygame',
    icon: '📐',
    description: 'Position, size and movement: the two classes you will use in every game.',
    sections: [
      {
        title: 'Rect',
        items: [
          { label: 'Create', code: 'r = pygame.Rect(x, y, width, height)\nr = image.get_rect(center=(320, 240))' },
          { label: 'Edges and points', text: '`left`, `right`, `top`, `bottom`, `centerx`, `centery`, `center`, `midtop`, `midbottom`, `topleft`, `bottomright`, `size`, `width`, `height`. Assigning to any of them moves the rectangle.' },
          { label: 'Integers only', text: 'A `Rect` stores **whole numbers**. Adding 0.4 to `rect.x` loses the movement. Keep the true position in floats (or a `Vector2`) and copy it into the rect.' },
          { label: 'Moving', code: 'r.x += 5\nr.center = (100, 100)\nmoved = r.move(10, 0)      # returns a new Rect\nr.move_ip(10, 0)           # changes r in place' },
          { label: 'Keep inside a box', code: 'r.clamp_ip(screen.get_rect())' },
          { label: 'Test overlap', code: 'if a.colliderect(b): ...\nif r.collidepoint(pygame.mouse.get_pos()): ...\nindex = a.collidelist(list_of_rects)    # first hit or -1' },
          { label: 'Touching is not a hit', text: 'Two rectangles that only share an edge (one ends at `x = 100`, the next starts at `x = 100`) do **not** collide.' },
        ],
      },
      {
        title: 'Vector2',
        items: [
          { label: 'Create and use', code: 'from pygame.math import Vector2\n\npos = Vector2(100, 50)\nvel = Vector2(3, 4)\npos += vel * dt\nvel.length()           # 5.0\nvel.x, vel.y' },
          { label: 'Direction', code: 'direction = Vector2(target) - Vector2(pos)\nif direction.length() > 0:\n    direction = direction.normalize()   # length 1\npos += direction * speed * dt' },
          { label: 'Diagonal speed', text: 'Moving right and down at once with `(1, 1)` is about 41 percent faster than right alone. Normalise the direction vector when it is not zero.' },
          { label: 'Distance and clamp', code: 'a.distance_to(b)\nvel.clamp_magnitude(0, max_speed)   # pygame 2.1.3+\nvel.rotate(90)                    # degrees, returns a new vector' },
          { label: 'Zero vector', text: '`Vector2(0, 0).normalize()` raises `ValueError`. Test `length() > 0` (or `if vector:`) first.' },
        ],
      },
    ],
  },
  {
    id: 'pg-drawing',
    title: 'Drawing, Images, Text and Sound',
    course: 'pygame',
    icon: '🎨',
    description: 'Putting pictures, shapes, words and sounds into the game.',
    sections: [
      {
        title: 'Shapes',
        items: [
          { label: 'Fill and draw', code: 'screen.fill((10, 12, 28))\npygame.draw.rect(screen, (220, 90, 90), rect, border_radius=6)\npygame.draw.circle(screen, (250, 220, 90), (x, y), 12)\npygame.draw.line(screen, (255, 255, 255), (0, 0), (100, 50), 2)\npygame.draw.polygon(screen, (90, 200, 240), [p1, p2, p3])' },
          { label: 'Outline or filled', text: 'The last number (`width`) is the outline thickness. `0` (the default) fills the shape.' },
          { label: 'Colours', text: 'Tuples of 0 to 255: `(red, green, blue)`. A fourth number is alpha (transparency) on surfaces made with `pygame.SRCALPHA`.' },
        ],
      },
      {
        title: 'Images',
        items: [
          { label: 'Load once, draw often', code: 'player = pygame.image.load("assets/player.png").convert_alpha()   # after set_mode\nscreen.blit(player, (x, y))' },
          { label: 'Do not load inside the loop', text: 'Loading from disk every frame is slow. Load before the loop (or through an asset cache) and reuse the surface.' },
          { label: 'Scale and flip', code: 'big = pygame.transform.scale(player, (96, 96))\nleft = pygame.transform.flip(player, True, False)\nturned = pygame.transform.rotate(player, 45)' },
          { label: 'Cut a sprite sheet', code: 'frame = sheet.subsurface(pygame.Rect(i * 32, 0, 32, 32))' },
          { label: 'Position by rect', code: 'rect = player.get_rect(midbottom=(320, 400))\nscreen.blit(player, rect)' },
        ],
      },
      {
        title: 'Animation',
        items: [
          { label: 'Timer-based frames', code: 'timer += dt\nif timer >= 0.1:           # 10 frames per second\n    timer -= 0.1\n    index = (index + 1) % len(frames)\nscreen.blit(frames[index], pos)' },
          { label: 'Why a timer', text: 'Advancing the animation by a timer (not once per game frame) keeps its speed the same at any frame rate.' },
        ],
      },
      {
        title: 'Text',
        items: [
          { label: 'Render and blit', code: 'font = pygame.font.Font(None, 32)          # default font\nimage = font.render("Score 10", True, (255, 255, 255))\nscreen.blit(image, (10, 10))' },
          { label: 'Centre text', code: 'rect = image.get_rect(center=(320, 240))\nscreen.blit(image, rect)' },
          { label: 'Cache it', text: 'Rendering text is relatively slow. Render once and reuse the surface until the string changes.' },
        ],
      },
      {
        title: 'Sound',
        items: [
          { label: 'Effects and music', code: 'pygame.mixer.init()\nshoot = pygame.mixer.Sound("assets/shoot.wav")\nshoot.set_volume(0.5)\nshoot.play()\npygame.mixer.music.load("assets/music.ogg")\npygame.mixer.music.play(-1)    # -1 = loop forever' },
          { label: 'No audio device', text: '`mixer.init()` can fail on a computer with no sound card. Wrap it in `try` / `except pygame.error` and let the game run silently.' },
        ],
      },
    ],
  },
  {
    id: 'pg-sprites',
    title: 'Sprites, Groups and Collisions',
    course: 'pygame',
    icon: '👾',
    description: 'Game objects, groups of objects, and every way to ask whether two things touch.',
    sections: [
      {
        title: 'Sprite and Group',
        items: [
          { label: 'A sprite class', code: 'class Enemy(pygame.sprite.Sprite):\n    def __init__(self, x, y):\n        super().__init__()\n        self.image = pygame.Surface((32, 24))\n        self.image.fill((220, 90, 90))\n        self.rect = self.image.get_rect(topleft=(x, y))\n\n    def update(self, dt):\n        self.rect.y += int(80 * dt)\n        if self.rect.top > 480:\n            self.kill()' },
          { label: 'Groups', code: 'enemies = pygame.sprite.Group()\nenemies.add(Enemy(10, 0))\nenemies.update(dt)       # calls update(dt) on every member\nenemies.draw(screen)     # blits every image at its rect' },
          { label: 'kill()', text: '`sprite.kill()` removes the sprite from **all** its groups, and is safe to call while looping over a group with `update` or over `.sprites()`.' },
          { label: 'Several groups', text: 'Keep one group for drawing (`all_sprites`) and separate ones for logic (`enemies`, `bullets`). A sprite can belong to more than one.' },
        ],
      },
      {
        title: 'Collision tests',
        items: [
          { label: 'Rect vs rect', code: 'if player.rect.colliderect(enemy.rect): ...' },
          { label: 'Sprite against group', code: 'hit = pygame.sprite.spritecollideany(player, enemies)\nhits = pygame.sprite.spritecollide(player, enemies, dokill=True)' },
          { label: 'Group against group', code: 'kills = pygame.sprite.groupcollide(bullets, enemies, True, True)   # dict: bullet -> [enemies]' },
          { label: 'Circles', code: 'def circles_touch(a, ar, b, br):\n    return (a - b).length_squared() <= (ar + br) ** 2' },
          { label: 'Smaller hitbox', code: 'self.hitbox = self.rect.inflate(-10, -10)     # shrink by 5 pixels on each side' },
          { label: 'Masks', code: 'player.mask = pygame.mask.from_surface(player.image)\npygame.sprite.collide_mask(player, enemy)   # pixel-perfect, slower' },
        ],
      },
      {
        title: 'Spawning and pitfalls',
        items: [
          { label: 'Spawn on a timer', code: 'spawn_timer -= dt\nif spawn_timer <= 0:\n    enemies.add(Enemy(random.randrange(0, 448), -24))\n    spawn_timer += interval' },
          { label: 'Remove with kill', text: 'Never remove from a plain list while looping over it (items get skipped). Use `kill()` with groups, or build a new list of survivors.' },
          { label: 'Tunneling', text: 'A fast object can jump **over** a thin target in one frame. Cap `dt`, move in smaller steps, or test the swept path.' },
        ],
      },
    ],
  },
  {
    id: 'pg-patterns',
    title: 'Game Patterns: States, UI, Maps and Physics',
    course: 'pygame',
    icon: '🧩',
    description: 'The structures that appear in almost every game beyond the first prototype.',
    sections: [
      {
        title: 'Game states',
        items: [
          { label: 'A state string', code: 'if state == "title":\n    draw_title()\nelif state == "play":\n    update_game(dt); draw_game()\nelif state == "paused":\n    draw_pause()' },
          { label: 'State classes', code: 'class State:\n    def handle(self, event): ...\n    def update(self, dt): ...\n    def draw(self, screen): ...' },
          { label: 'Stack of states', text: 'Keep a list of states and only run the **last** one. Pushing a pause menu on top and popping it later leaves the game below untouched.' },
          { label: 'Restart', text: 'The simplest reliable restart is to create a brand-new world object. Resetting twenty fields by hand always forgets one.' },
        ],
      },
      {
        title: 'Buttons and menus',
        items: [
          { label: 'A click on a button', text: 'Fire only when the mouse is **pressed and released** on the same button. Track `hover` (pointer inside) and `pressed` (mouse went down inside).' },
          { label: 'Keyboard menus', code: 'index = (index + 1) % len(items)     # wrap around\nindex = (index - 1) % len(items)' },
          { label: 'HUD', text: 'Draw the score and lives last, in screen coordinates, so the camera and shake do not move them (or shake only the canvas you blit).' },
        ],
      },
      {
        title: 'Tile maps and cameras',
        items: [
          { label: 'A map as text', code: 'LEVEL = [\n    "..........",\n    "....C.....",\n    "##########",\n]' },
          { label: 'Pixels to tiles', code: 'col, row = x // TILE, y // TILE\nrect = pygame.Rect(col * TILE, row * TILE, TILE, TILE)' },
          { label: 'Tiles under a rect', code: 'for row in range(r.top // TILE, (r.bottom - 1) // TILE + 1):\n    for col in range(r.left // TILE, (r.right - 1) // TILE + 1):\n        ...' },
          { label: 'Camera', code: 'cam_x = max(0, min(player.centerx - WIDTH // 2, map_w - WIDTH))\nscreen.blit(image, (x - cam_x, y))' },
        ],
      },
      {
        title: 'Platformer physics',
        items: [
          { label: 'Gravity and jump', code: 'vy = min(vy + GRAVITY * dt, MAX_FALL)\ny += vy * dt\nif on_ground and jump_pressed:\n    vy = -JUMP_SPEED' },
          { label: 'Move one axis at a time', text: 'Move on **x**, fix collisions, then move on **y** and fix collisions. Doing both together makes it impossible to tell which wall you hit.' },
          { label: 'Fair-feeling jumps', text: '**Coyote time** (a short grace period after leaving a ledge) and **input buffering** (remembering a jump pressed just before landing) cost a few lines and make controls feel forgiving.' },
        ],
      },
      {
        title: 'Simple AI',
        items: [
          { label: 'Patrol, chase, return', code: 'if state == "patrol" and sees_player:\n    state = "chase"\nelif state == "chase" and not sees_player:\n    state = "patrol"' },
          { label: 'Shortest path on a grid', text: 'Breadth-first search with a queue finds a shortest path on a tile grid. Store where each cell came from, then walk back from the goal.' },
          { label: 'Line of sight', text: 'List the cells on the straight line between two tiles (Bresenham) and see whether any of them is a wall.' },
        ],
      },
    ],
  },
  {
    id: 'pg-craft',
    title: 'Craft: Juice, Saving, Speed and Shipping',
    course: 'pygame',
    icon: '🚀',
    description: 'Making a game feel good, keeping it fast, saving data, testing without a window and packaging it.',
    sections: [
      {
        title: 'Structure and testing',
        items: [
          { label: 'Logic apart from drawing', text: 'Put the rules in classes that never call `pygame.display`, `pygame.key` or `pygame.mixer`. They can then be tested with plain `assert`s and driven by a bot.' },
          { label: 'Inject dependencies', code: 'class World:\n    def __init__(self, rng):\n        self.rng = rng      # tests pass a fake with randrange()\n\nworld = World(random.Random(7))   # seeded: repeatable' },
          { label: 'Events out, effects in', code: 'self.events.append(("explode", x, y))      # in the rules\n\nfor event in world.events:                  # in the game\n    if event[0] == "explode":\n        burst(event[1], event[2])\nworld.events.clear()' },
          { label: 'Subclass to extend', code: 'class ArcadeWorld(World):\n    def lose_life(self):\n        if self.effects.active("shield"):\n            return\n        super().lose_life()' },
          { label: 'Settings as data', code: '@dataclass\nclass Settings:\n    width: int = 480\n    height: int = 640\n    volume: float = 0.5' },
        ],
      },
      {
        title: 'Juice',
        items: [
          { label: 'Easing', code: 'def ease_out(t):\n    return 1 - (1 - t) ** 3     # fast start, gentle stop\n\nvalue = start + (end - start) * ease_out(elapsed / duration)' },
          { label: 'Screen shake', code: 'canvas.fill(bg)   # draw everything on canvas...\noffset = (random.randint(-a, a), random.randint(-a, a))\nscreen.blit(canvas, offset)   # ...then blit it shaken\nshake = max(0, shake - dt)' },
          { label: 'Particles', code: 'p = [x, y, vx, vy, life]\np[0] += p[2] * dt; p[1] += p[3] * dt; p[4] -= dt\nparticles = [p for p in particles if p[4] > 0]' },
          { label: 'Small touches add up', text: 'A flash, a short shake, a puff of particles and a sound on every hit change how the game **feels** without changing one rule.' },
        ],
      },
      {
        title: 'Saving data',
        items: [
          { label: 'Where to save', code: 'from pathlib import Path\nSAVE = Path.home() / ".mygame" / "save.json"' },
          { label: 'Load safely', code: 'try:\n    data = json.loads(SAVE.read_text())\nexcept (OSError, ValueError):\n    data = {"best": 0}' },
          { label: 'Atomic write', code: 'fd, tmp = tempfile.mkstemp(dir=SAVE.parent)\nwith os.fdopen(fd, "w") as f:\n    json.dump(data, f)\nos.replace(tmp, SAVE)     # a crash never leaves half a file' },
          { label: 'Version your saves', text: 'Store `"version": 3` and keep a `migrate` function that upgrades older data one step at a time.' },
        ],
      },
      {
        title: 'Performance',
        items: [
          { label: 'Measure first', code: 'start = time.perf_counter()\nwork()\nprint(f"{(time.perf_counter() - start) * 1000:.2f} ms")' },
          { label: 'Cache what is slow', text: 'Rendered text, scaled images and loaded files should be created once and reused. A small LRU cache keeps memory bounded.' },
          { label: 'Fewer collision tests', text: 'Testing every object against every other is quadratic. A **spatial grid** only compares objects in the same or neighbouring cells.' },
          { label: 'Draw only what is visible', text: 'Skip objects outside the camera view, and convert images with `convert()` or `convert_alpha()` once after loading.' },
        ],
      },
      {
        title: 'Packaging',
        items: [
          { label: 'Find files from anywhere', code: 'def resource_path(relative):\n    base = getattr(sys, "_MEIPASS", Path(__file__).parent)\n    return Path(base) / relative' },
          { label: 'Windows build', code: 'pyinstaller --onefile --windowed --add-data "assets;assets" main.py' },
          { label: 'Web build', code: 'pygbag main.py       # async main loop with await asyncio.sleep(0)' },
          { label: 'Before you share', text: 'The window closes cleanly, pause works, nothing depends on frame rate, a missing save file does not crash it, and a README lists the controls.' },
        ],
      },
    ],
  },
];
