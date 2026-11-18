import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-images',
  title: 'Images and Blitting',
  summary: 'Load a picture once, copy it onto the screen every frame, and transform it: scale, flip, rotate, crop. Why convert matters, and how to centre things correctly.',
  minutes: 38,
  objectives: [
    'Load an image with `pygame.image.load`, convert it for speed, and draw it with `blit`',
    'Explain why images are loaded once, before the loop, and not every frame',
    'Position an image through its `Rect`, including centring with `get_rect(center=...)`',
    'Scale, flip, rotate and crop a surface, and know that each returns a new surface',
    'Explain transparency: colour keys, per-pixel alpha and `convert_alpha`',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Load once, blit every frame',
      blocks: [
        {
          type: 'p',
          text: 'Rectangles are fine for a prototype, but real games use pictures. In pygame a picture is a **Surface** (the same type as the screen), made by `pygame.image.load("file.png")`, and **blitting** (from "bit block transfer") copies one surface onto another: `screen.blit(image, (x, y))` copies the whole image so that its top-left corner is at `(x, y)`. Every sprite, tile and background is drawn this way.',
        },
        {
          type: 'table',
          headers: ['Step', 'Code', 'Notes'],
          rows: [
            ['**Load**', '`img = pygame.image.load("assets/player.png")`', 'Reads and decodes the file. PNG, JPG, GIF, BMP and more. Slow: **do it once**.'],
            ['**Convert**', '`img = img.convert_alpha()` (or `.convert()`)', 'Changes the pixel format to match the screen. Blitting is then several times faster. Needs `set_mode` to have been called first.'],
            ['**Blit**', '`screen.blit(img, (x, y))` or `screen.blit(img, rect)`', 'Draws it each frame, in the painter’s order.'],
            ['**Position**', '`rect = img.get_rect(center=(x, y))`', 'A rectangle of the image’s size, placed by any point you like.'],
          ],
          caption: 'Load and convert before the loop; blit inside it.',
        },
        {
          type: 'p',
          text: '**Why before the loop?** Loading reads a file from disk and decodes it: perhaps a few milliseconds. Done for every frame of a game with 30 sprites, that is far more than the 16 milliseconds a frame can take. So load everything at the start into variables (later, into a dictionary or cache) and only blit in the loop.',
        },
        {
          type: 'code',
          title: 'images_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

background = pygame.image.load("assets/background.png").convert()
player = pygame.image.load("assets/player.png").convert_alpha()
coin = pygame.image.load("assets/coin.png").convert_alpha()
coin_big = pygame.transform.scale(coin, (48, 48))
player_left = pygame.transform.flip(player, True, False)

pos = pygame.Vector2(320, 180)
facing_right = True
angle = 0
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    dx = keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]
    if dx != 0:
        facing_right = dx > 0
    pos.x += dx * 4
    angle = (angle + 2) % 360

    screen.blit(background, (0, 0))
    image = player if facing_right else player_left
    screen.blit(image, image.get_rect(center=pos))
    spinning = pygame.transform.rotate(coin_big, angle)
    screen.blit(spinning, spinning.get_rect(center=(500, 100)))
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '7-11', text: 'Everything is loaded, converted and prepared **before** the loop. `convert()` is for opaque images such as the background; `convert_alpha()` keeps transparency (a sprite’s empty corners). The flipped copy is made once, here, not every frame.' },
            { lines: '23-28', text: 'The direction of the keys decides which way the player faces, and the coin’s angle grows by 2 degrees a frame.' },
            { lines: '30', text: 'The background goes first, so that everything else is drawn on top of it. It covers (and clips to) the screen.' },
            { lines: '31-32', text: 'Pick the image that fits the direction, and blit it so that its **centre** is at the position: `get_rect(center=pos)` makes a rectangle of the image’s size around that point.' },
            { lines: '33-34', text: 'Rotating makes a **new, larger** surface (the corners of a tilted rectangle need room), so it must be re-centred the same way, or the coin would wobble as it turns.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why .convert() makes a difference',
          text: 'Image files store pixels in whatever format the artist saved them. The screen has its own format. Blitting between different formats converts every pixel, every frame. `convert()` does that conversion once, so later blits are a plain fast copy. It can double or triple the frame rate of a sprite-heavy game, for a call that costs nothing to add.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A game has 50 enemies drawn every frame from `enemy.png`. Where should `pygame.image.load("enemy.png")` be called?',
      options: [
        { text: 'Once, before the game loop, and the one surface is blitted 50 times per frame', correct: true, why: 'Surfaces can be blitted as often as you like. One loaded copy serves every enemy.' },
        { text: 'Inside the loop, for each enemy, so that each has its own copy', why: 'That reads and decodes the file 3000 times a second. The frame rate collapses.' },
        { text: 'Once per frame, at the start of the loop', why: 'Still 60 disk reads and decodes each second for no reason: the picture never changes.' },
        { text: 'Inside the `blit` call, as the first argument', why: 'The same problem in a shorter form: the file is loaded every time it is drawn.' },
      ],
      explanation: 'Load once, reuse many times. A loaded surface is just pixels in memory, and blitting never changes the source.',
    },
    {
      kind: 'truefalse',
      prompt: '`pygame.transform.flip(image, True, False)` flips the `image` surface in place, so there is no need to store the result.',
      answer: false,
      explanation: 'False. Every function in `pygame.transform` returns a **new surface** and leaves the original alone. Write `flipped = pygame.transform.flip(image, True, False)`. Forgetting to keep the result is the image-version of calling `rect.move()` and discarding the answer.',
    },
    {
      kind: 'concept',
      title: 'Transforming surfaces, and transparency',
      blocks: [
        {
          type: 'table',
          headers: ['Function', 'Result', 'Notes'],
          rows: [
            ['`transform.scale(img, (w, h))`', 'A copy resized to exactly `w` by `h`', 'Fast, blocky. `smoothscale` is slower but smoother when shrinking.'],
            ['`transform.rotozoom(img, angle, scale)`', 'Rotated (degrees, counter-clockwise) and scaled', 'Better quality than `rotate`.'],
            ['`transform.rotate(img, angle)`', 'Rotated; the new surface is larger', 'Re-centre it after each rotation.'],
            ['`transform.flip(img, flip_x, flip_y)`', 'A mirrored copy', 'The cheap way to get "walking left" from "walking right".'],
            ['`img.subsurface(rect)`', 'A window onto part of the image', 'It **shares** pixels with the parent. Use `.copy()` for an independent crop. Basis of sprite sheets.'],
            ['`img.copy()`', 'An independent duplicate', 'Before you draw on a surface you want to keep.'],
            ['`img.set_alpha(0..255)`', 'Fades the whole image', 'Use with `convert()` for opaque images, e.g. fading a screen.'],
            ['`img.set_colorkey(colour)`', 'Makes one colour transparent', 'For old-style art with a magenta background.'],
          ],
          caption: 'Transforming every frame is expensive: prepare the variants (flipped, scaled) once, before the loop.',
        },
        {
          type: 'p',
          text: 'There are two ways to make part of an image see-through. A **colour key** names one colour to skip when blitting (often pure magenta, `(255, 0, 255)`), simple and fast, but all-or-nothing and with jagged edges. **Per-pixel alpha** stores an opacity for each pixel, as PNG files do. Load such an image with `.convert_alpha()` and soft edges, shadows and glows all work. For almost everything today, use PNG and `convert_alpha()`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Position by the centre, after any transform',
          text: 'Surfaces are placed by their top-left corner, so a rotated or scaled image drawn at the same `(x, y)` appears to jump, because its size changed. Compute `rect = new_image.get_rect(center=old_center)` and blit at `rect`. The same applies when an animation swaps frames of different sizes.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that loads a sprite, makes a bigger copy, and draws it centred on the position.',
      template: `img = pygame.image.___("assets/coin.png").convert_alpha()
big = pygame.transform.___(img, (48, 48))
screen.___(big, big.get_rect(center=pos))`,
      templateIsCode: true,
      blanks: [{ answers: ['load'] }, { answers: ['scale', 'smoothscale'] }, { answers: ['blit'] }],
      wordBank: ['load', 'scale', 'blit', 'flip', 'draw', 'convert'],
      explanation: '`image.load` reads the file, `transform.scale` returns a resized copy, and `blit` draws a surface onto another one.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. How many 64-pixel tiles are needed to cover an 800 by 600 area? The code rounds up the number of columns and rows with integer division.',
      code: `cols = (800 + 63) // 64
rows = (600 + 63) // 64
print(cols * rows)`,
      answer: '130',
      hint: '800 / 64 is 12.5, so 13 columns. 600 / 64 is 9.4, so 10 rows.',
      explanation: 'Adding `tile - 1` before the integer division rounds **up**: 13 columns and 10 rows give 130 tiles. The last column and row are partly off-screen, which is fine: blitting outside the target is clipped, so no special case is needed.',
    },
    {
      kind: 'concept',
      title: 'Paths, formats and good habits',
      blocks: [
        {
          type: 'p',
          text: 'A relative path such as `"assets/player.png"` is looked up from the **current working directory**, which is where you ran the program from, not necessarily where the script is stored. Run the game from another folder and every `load` fails with `FileNotFoundError`. The robust habit is to build paths from the script’s own location, which the structure lesson covers with `pathlib`. For now: run the game from the folder that contains `assets`.',
        },
        {
          type: 'table',
          headers: ['Need', 'Use', 'Why'],
          rows: [
            ['Photos, backgrounds', 'JPG or PNG with `convert()`', 'No transparency, so the fastest blit'],
            ['Sprites with soft edges', 'PNG with `convert_alpha()`', 'Per-pixel transparency'],
            ['Pixel art', '`transform.scale` by whole numbers (2, 3, 4)', 'Keeps the pixels sharp; `smoothscale` would blur them'],
            ['Many small pictures', 'One **sprite sheet** and `subsurface`', 'One file, one load, and the animation lesson shows how to slice it'],
            ['Same sprite many times', 'One loaded surface, many blits', 'No extra memory'],
            ['Pictures that change size every frame', 'Avoid; prepare the sizes in advance', '`scale` and `rotate` cost time and memory each call'],
          ],
          caption: 'A short list of habits that avoids most performance problems.',
        },
        {
          type: 'p',
          text: 'Placeholder art is fine while you build: a coloured rectangle drawn on a `Surface((w, h))` behaves exactly like a loaded sprite, and the lesson exercises below use such surfaces so that they need no files. Swapping in the real art later changes one line.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This program crashes with a `pygame.error` about "No video mode has been set". Tap the line that causes it.',
      lines: [
        'import pygame',
        'player = pygame.image.load("assets/player.png").convert_alpha()',
        'screen = pygame.display.set_mode((640, 360))',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: '`convert_alpha()` converts to the **display’s** pixel format, so the display must already exist. Call `pygame.display.set_mode(...)` first, and only then convert the images. (`image.load` alone works without a window; the `convert` step is what needs it.)',
    },
    {
      kind: 'numeric',
      prompt: 'A sprite is 48 pixels wide and 32 high. You scale it to be 96 pixels wide, **keeping the proportions**. How high is it now?',
      answer: '64',
      hint: 'The scale factor is 96 divided by 48.',
      explanation: 'The factor is 96 / 48 = 2, so the height becomes 32 x 2 = 64. Scaling width and height by different factors would squash or stretch the picture, so compute one factor and apply it to both.',
      label: 'Height:',
    },
    {
      kind: 'concept',
      title: 'Your turn: blitting without files',
      blocks: [
        {
          type: 'p',
          text: 'These exercises build surfaces from drawing calls instead of loading files, so the tests need no assets and no window. You will tile, flip, crop, centre and scale: the five things that games do with images.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `tile_surface(tile, width, height)`. It returns a new `pygame.Surface` of the given size, covered by copies of the `tile` surface placed side by side starting at the top-left corner, from left to right and top to bottom. The last column and row may be cut off by the edge.',
      starter: `import pygame


def tile_surface(tile, width, height):
    ...
`,
      solution: `import pygame


def tile_surface(tile, width, height):
    surface = pygame.Surface((width, height))
    tw, th = tile.get_size()
    for y in range(0, height, th):
        for x in range(0, width, tw):
            surface.blit(tile, (x, y))
    return surface
`,
      setup: PG_SIM,
      tests: `def px(s, x, y):
    return tuple(s.get_at((x, y)))[:3]

A, B, C, D = (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)
tile = pygame.Surface((2, 2))
tile.set_at((0, 0), A)
tile.set_at((1, 0), B)
tile.set_at((0, 1), C)
tile.set_at((1, 1), D)
t = tile_surface(tile, 6, 4)
assert t.get_size() == (6, 4)
assert [px(t, x, 0) for x in range(6)] == [A, B, A, B, A, B]
assert [px(t, x, 1) for x in range(6)] == [C, D, C, D, C, D]
assert [px(t, x, 2) for x in range(6)] == [A, B, A, B, A, B]
assert [px(t, 5, y) for y in range(4)] == [B, D, B, D]
u = tile_surface(tile, 5, 3)
assert u.get_size() == (5, 3)
assert px(u, 4, 0) == A, "the cut-off column still shows the tile's left column"
assert px(u, 4, 2) == A and px(u, 3, 2) == B
assert px(u, 4, 1) == C
v = tile_surface(tile, 1, 1)
assert v.get_size() == (1, 1) and px(v, 0, 0) == A
assert tile.get_size() == (2, 2) and px(tile, 1, 1) == D`,
      checks: ['The result has the requested size and is a new surface', 'The tile is repeated from the top-left corner, left to right, row by row', 'Edge tiles are cut off, not skipped'],
      hint: 'Make `Surface((width, height))`, read the tile’s size with `get_size()`, and use `range(0, height, tile_height)` and `range(0, width, tile_width)` for the positions to blit at.',
      explanation: 'Blitting outside the target is clipped by pygame, so the loops simply run until the next tile would start beyond the edge. Tiled backgrounds, floors and walls are all made this way, often once into one big surface that is blitted every frame.',
    },
    {
      kind: 'code',
      prompt: 'Write `mirror(surface)` that returns a new surface flipped left to right (use `pygame.transform.flip`). Write `crop(surface, rect)` that returns an **independent copy** of the part of `surface` inside `rect` (a `pygame.Rect`), so that drawing on the crop does not change the original. Write `blit_centered(dest, src, center)` that draws `src` onto `dest` so that the middle of `src` is at `center`, and returns the `Rect` it covered.',
      starter: `import pygame


def mirror(surface):
    ...


def crop(surface, rect):
    ...


def blit_centered(dest, src, center):
    ...
`,
      solution: `import pygame


def mirror(surface):
    return pygame.transform.flip(surface, True, False)


def crop(surface, rect):
    return surface.subsurface(rect).copy()


def blit_centered(dest, src, center):
    rect = src.get_rect(center=center)
    dest.blit(src, rect)
    return rect
`,
      setup: PG_SIM,
      tests: `def px(s, x, y):
    return tuple(s.get_at((x, y)))[:3]

A, B, C, D = (255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)
s = pygame.Surface((3, 2))
s.fill(A)
s.set_at((2, 0), B)
s.set_at((0, 1), C)
m = mirror(s)
assert m.get_size() == (3, 2)
assert px(m, 0, 0) == B and px(m, 2, 0) == A
assert px(m, 2, 1) == C and px(m, 0, 1) == A
assert px(s, 2, 0) == B, "the original is not changed"
big = pygame.Surface((10, 10))
big.fill((10, 10, 10))
big.set_at((4, 5), D)
c = crop(big, pygame.Rect(3, 4, 4, 3))
assert c.get_size() == (4, 3)
assert px(c, 1, 1) == D and px(c, 0, 0) == (10, 10, 10)
c.fill((99, 99, 99))
assert px(big, 4, 5) == D, "drawing on the crop leaves the original alone"
dest = pygame.Surface((20, 20))
dest.fill((0, 0, 0))
src = pygame.Surface((4, 6))
src.fill(D)
r = blit_centered(dest, src, (10, 10))
assert (r.x, r.y, r.w, r.h) == (8, 7, 4, 6), r
assert px(dest, 8, 7) == D and px(dest, 11, 12) == D
assert px(dest, 7, 7) == (0, 0, 0) and px(dest, 12, 12) == (0, 0, 0) and px(dest, 8, 13) == (0, 0, 0)
assert blit_centered(dest, src, (0, 0)).topleft == (-2, -3)`,
      checks: ['`mirror` returns a left-right flipped copy and leaves the original alone', '`crop` returns an independent copy of the area, not a shared view', '`blit_centered` draws using `src.get_rect(center=center)` and returns that rectangle'],
      hint: '`pygame.transform.flip(surface, True, False)` for the mirror. `surface.subsurface(rect).copy()` for the crop. `rect = src.get_rect(center=center)` then `dest.blit(src, rect)`.',
      explanation: 'A `subsurface` is a **window** onto the parent’s pixels: drawing in one shows in the other. Calling `.copy()` makes it independent, which is what you want when you cut sprites out of a sheet and then colour-tint them. `get_rect(center=...)` is the habit that keeps rotated and scaled sprites from wobbling.',
    },
    {
      kind: 'code',
      prompt: 'Write `fit_inside(size, box)` that returns the `(width, height)` of an image of `size` scaled, **keeping its proportions**, to the largest size that fits inside `box` (both are `(width, height)` pairs). The dimensions are rounded down to whole pixels, and at least 1. Then write `scaled_to_fit(surface, box)` that returns a new surface of that size made with `pygame.transform.scale`.',
      starter: `import pygame


def fit_inside(size, box):
    ...


def scaled_to_fit(surface, box):
    ...
`,
      solution: `import pygame


def fit_inside(size, box):
    w, h = size
    bw, bh = box
    factor = min(bw / w, bh / h)
    return (max(1, int(w * factor)), max(1, int(h * factor)))


def scaled_to_fit(surface, box):
    return pygame.transform.scale(surface, fit_inside(surface.get_size(), box))
`,
      setup: PG_SIM,
      tests: `assert fit_inside((48, 32), (96, 96)) == (96, 64)
assert fit_inside((48, 32), (24, 100)) == (24, 16)
assert fit_inside((100, 50), (50, 50)) == (50, 25)
assert fit_inside((50, 100), (50, 50)) == (25, 50)
assert fit_inside((64, 64), (64, 64)) == (64, 64)
assert fit_inside((640, 360), (320, 320)) == (320, 180)
assert fit_inside((10, 3), (5, 5)) == (5, 1), "rounded down"
assert fit_inside((1000, 1), (10, 10)) == (10, 1), "never below 1 pixel"
assert fit_inside((10, 10), (100, 100)) == (100, 100), "it can also scale up"
s = pygame.Surface((48, 32))
t = scaled_to_fit(s, (96, 96))
assert t.get_size() == (96, 64)
assert scaled_to_fit(pygame.Surface((10, 40)), (20, 20)).get_size() == (5, 20)
assert s.get_size() == (48, 32)`,
      checks: ['The scale factor is the smaller of box width over width and box height over height', 'Sizes are whole pixels, rounded down and at least 1', '`scaled_to_fit` returns a new surface of that size and leaves the original alone'],
      hint: 'One factor for both axes: `min(box_w / w, box_h / h)`. Multiply both dimensions by it, `int()` them, and keep each at least 1 with `max(1, ...)`.',
      explanation: 'Using the **smaller** of the two ratios guarantees both sides fit. This one function is what a game uses to scale a background to the screen, shrink a portrait into a menu slot, or fit art to different screen sizes. Using one factor for both axes keeps the picture from being squashed.',
    },
  ],
  takeaways: [
    '`image.load(path)` reads a file into a **Surface**; `screen.blit(image, position)` copies it to the screen. Load and convert **once**, before the loop; blit every frame.',
    'Call `.convert()` (opaque images) or `.convert_alpha()` (transparent PNGs) **after** `set_mode`: it matches the display’s format and makes blitting several times faster.',
    'Place images by rectangle: `image.get_rect(center=pos)`. After rotating or scaling, re-centre, or the picture seems to jump, because the new surface has a new size.',
    '`pygame.transform` functions (`scale`, `rotate`, `rotozoom`, `flip`) return **new** surfaces; prepare variants once, not each frame.',
    '`subsurface` shares pixels with its parent (the basis of sprite sheets); `.copy()` makes an independent surface. Transparency: colour key (one colour) or per-pixel alpha (PNG with `convert_alpha`).',
    'To scale while keeping proportions use one factor: `min(box_w / w, box_h / h)`. Relative paths depend on where the program is run from.',
  ],
  reading: [
    { title: 'pygame docs: pygame.image', url: 'https://www.pygame.org/docs/ref/image.html', source: 'docs', note: 'Loading, saving, and the supported file formats.' },
    { title: 'pygame docs: pygame.transform', url: 'https://www.pygame.org/docs/ref/transform.html', source: 'docs', note: 'scale, rotate, rotozoom, flip and more, with notes on quality and speed.' },
    { title: 'pygame docs: Surface.convert_alpha', url: 'https://www.pygame.org/docs/ref/surface.html#pygame.Surface.convert_alpha', source: 'docs', note: 'Exactly what convert and convert_alpha do, and when to use each.' },
    { title: 'OpenGameArt.org', url: 'https://opengameart.org/', source: 'other', note: 'A large library of free game art, with licences stated for each asset.' },
  ],
};
