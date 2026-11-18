import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-drawing',
  title: 'Drawing Shapes and Surfaces',
  summary: 'Coordinates, colours, and the draw module: rectangles, circles, lines and polygons. How a Surface works, and why the drawing order matters.',
  minutes: 36,
  objectives: [
    'Use the screen’s coordinate system, with the origin at the top left and y growing downwards',
    'Describe colours as RGB (and RGBA) tuples, and as `pygame.Color` objects',
    'Draw rectangles, circles, ellipses, lines and polygons with `pygame.draw`, filled or as outlines using the `width` argument',
    'Explain that everything is drawn onto a `Surface`, that later drawing covers earlier drawing, and that nothing shows until `display.flip()`',
    'Create an off-screen `Surface`, and read and write its pixels',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Where things go, and what colour they are',
      blocks: [
        {
          type: 'p',
          text: 'The screen is a grid of pixels. A position is a pair `(x, y)`: `x` counts pixels from the **left** edge, and `y` counts pixels from the **top** edge. This is different from the maths class graph: **y grows downwards**. The point `(0, 0)` is the top-left corner, and in a 640 by 360 window the bottom-right pixel is `(639, 359)`.',
        },
        {
          type: 'table',
          headers: ['Point', 'Where it is'],
          rows: [
            ['`(0, 0)`', 'Top-left corner'],
            ['`(639, 0)`', 'Top-right corner (the last pixel, because counting starts at 0)'],
            ['`(0, 359)`', 'Bottom-left corner'],
            ['`(320, 180)`', 'The centre of a 640 by 360 window'],
            ['`(100, 50)` then `(100, 80)`', 'Moving **down** the screen: y grew by 30'],
          ],
          caption: 'To move something up, subtract from y.',
        },
        {
          type: 'p',
          text: 'Colours are **RGB** triples: how much red, green and blue light, each from 0 (none) to 255 (full). `(0, 0, 0)` is black, `(255, 255, 255)` is white, `(255, 0, 0)` is red, and `(250, 200, 40)` is a warm yellow. A fourth number is **alpha** (opacity), from 0 (invisible) to 255 (solid); it matters only on surfaces made to support transparency.',
        },
        {
          type: 'table',
          headers: ['Way to write a colour', 'Example', 'Notes'],
          rows: [
            ['RGB tuple', '`(250, 200, 40)`', 'The most common form; accepted everywhere'],
            ['RGBA tuple', '`(250, 200, 40, 128)`', 'The last number is opacity'],
            ['`pygame.Color` by name', '`pygame.Color("tomato")`', 'Hundreds of CSS colour names'],
            ['`pygame.Color` by hex', '`pygame.Color("#fac828")`', 'Copy colours straight from a colour picker'],
            ['`pygame.Color` fields', '`c.r`, `c.g`, `c.b`, `c.a`', 'Read and change the parts of a colour'],
          ],
          caption: 'Define your colours once as named constants at the top of the file, such as SKY = (110, 180, 240).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'In a window of size (640, 360), which point is **lowest** on the screen?',
      options: [
        { text: '`(100, 350)`', correct: true, why: 'y grows downwards, so the largest y is the lowest point on the screen.' },
        { text: '`(100, 10)`', why: 'A small y is near the top of the window.' },
        { text: '`(600, 180)`', why: 'That is at mid height, far to the right.' },
        { text: '`(0, 0)`', why: 'That is the top-left corner: the highest point.' },
      ],
      explanation: 'Screen coordinates start in the top-left corner, and y increases downwards. Many beginners expect the opposite, so it is worth saying out loud: "to go up, subtract".',
    },
    {
      kind: 'truefalse',
      prompt: 'In `pygame.draw.rect(screen, color, rect, 3)` the last argument, the **width**, means a 3-pixel thick outline. If it is left out (or is 0), the rectangle is filled.',
      answer: true,
      explanation: 'True. `width=0` (the default) fills the shape; a positive width draws only an outline of that many pixels. Drawing a filled shape and then a thin outline of a different colour on top gives a neat bordered look.',
    },
    {
      kind: 'concept',
      title: 'The draw module',
      blocks: [
        {
          type: 'p',
          text: 'All of these take the **surface to draw on** first (usually `screen`), then a colour, then the geometry, and finally an optional `width`.',
        },
        {
          type: 'table',
          headers: ['Function', 'Geometry arguments', 'Example'],
          rows: [
            ['`draw.rect`', 'A `Rect` or `(x, y, w, h)`', '`draw.rect(screen, RED, (20, 20, 100, 50))`'],
            ['`draw.circle`', 'Centre `(x, y)`, radius', '`draw.circle(screen, RED, (100, 100), 30)`'],
            ['`draw.ellipse`', 'The bounding `Rect`', '`draw.ellipse(screen, RED, (20, 20, 120, 50))`'],
            ['`draw.line`', 'Start, end, optional width', '`draw.line(screen, RED, (0, 0), (100, 50), 3)`'],
            ['`draw.lines`', 'closed (bool), list of points', '`draw.lines(screen, RED, False, points, 2)`'],
            ['`draw.polygon`', 'A list of points', '`draw.polygon(screen, RED, [(0, 0), (50, 0), (25, 40)])`'],
            ['`draw.arc`', 'Bounding rect, start and end angle (radians)', 'For pie charts and arcs'],
            ['`draw.aaline`', 'Start, end', 'An anti-aliased (smooth) line, one pixel thick'],
          ],
          caption: 'Most return a `Rect` that covers the changed pixels.',
        },
        {
          type: 'code',
          title: 'scene.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
pygame.display.set_caption("Drawing")
clock = pygame.time.Clock()

SKY = (110, 180, 240)
GRASS = (70, 160, 80)
SUN = (250, 220, 70)

running = True
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    screen.fill(SKY)
    pygame.draw.circle(screen, SUN, (540, 70), 40)
    pygame.draw.rect(screen, GRASS, (0, 260, 640, 100))
    pygame.draw.rect(screen, (200, 90, 70), (200, 170, 120, 90))
    pygame.draw.polygon(screen, (150, 50, 50), [(190, 170), (260, 110), (330, 170)])
    pygame.draw.rect(screen, (90, 60, 40), (245, 210, 30, 50))
    pygame.draw.line(screen, (255, 255, 255), (0, 260), (640, 260), 3)
    pygame.draw.ellipse(screen, (255, 255, 255), (60, 40, 120, 50))
    pygame.draw.rect(screen, (0, 0, 0), (200, 170, 120, 90), 3)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '8-10', text: 'Named colour constants make the drawing code readable, and one change updates every use.' },
            { lines: '18', text: '`fill` paints the whole surface in one colour. It is the first drawing step of each frame: it wipes the previous frame.' },
            { lines: '19', text: '`draw.circle(surface, colour, centre, radius)`. The sun is at (540, 70) with a radius of 40.' },
            { lines: '20-21', text: 'A rect can be a plain tuple `(x, y, width, height)`. The grass is drawn **before** the house, so that the house is on top of it.' },
            { lines: '22', text: 'A polygon takes a list of corner points: here a triangle for the roof.' },
            { lines: '24', text: 'A line has start and end points, and a thickness as the last argument.' },
            { lines: '26', text: 'A `width` of 3 turns the rectangle into an outline. It is drawn last, so that it sits on top of the house walls.' },
            { lines: '27', text: 'Everything above is drawn on a hidden back buffer. `display.flip()` makes it visible, in one go, so you never see a half-drawn frame.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why order matters: the painter’s algorithm',
          text: 'pygame has no layers or "depth": every draw call simply overwrites the pixels below it, like paint on a canvas. The thing drawn **last** appears **in front**. So you draw the background first, then the world, then the player, and lastly the interface (score, health). Getting the order wrong is the usual reason for "my sprite is invisible": it is there, but covered.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the calls that draw a filled red circle and a white outline of a rectangle.',
      template: `pygame.draw.___(screen, (255, 0, 0), (100, 100), 30)
pygame.draw.rect(screen, (255, 255, 255), (20, 20, 80, 40), ___)
pygame.display.___()`,
      templateIsCode: true,
      blanks: [{ answers: ['circle'] }, { answers: ['2', '1', '3', '4', '5'] }, { answers: ['flip', 'update'] }],
      wordBank: ['circle', 'ellipse', '2', '0', 'flip', 'update', 'blit'],
      explanation: '`circle(surface, colour, centre, radius)` draws a filled circle by default. A positive `width` (2 here) draws just the outline, and `display.flip()` (or `update()`) shows the result.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This imitates the painter’s algorithm with a row of 5 cells: each tuple paints the cells from start up to (not including) end with a letter, and later paint covers earlier paint.',
      code: `canvas = ["."] * 5
for start, end, ch in [(0, 4, "a"), (2, 5, "b"), (1, 3, "c")]:
    for i in range(start, end):
        canvas[i] = ch
print("".join(canvas))`,
      answer: 'accbb',
      hint: 'Work through the three paints in order, and write the row after each one.',
      explanation: 'After `a` (cells 0 to 3): `aaaa.`. After `b` (cells 2 to 4): `aabbb`. After `c` (cells 1 and 2): `accbb`. Each cell shows the **last** paint that touched it, which is exactly how overlapping draw calls behave.',
    },
    {
      kind: 'concept',
      title: 'Surfaces, and the pixels inside',
      blocks: [
        {
          type: 'p',
          text: 'The window you get from `set_mode` is one `Surface`, but a `Surface` is a general idea: **a rectangular grid of pixels in memory**. You can create more, of any size, and draw on them with the same functions: `pygame.Surface((200, 100))`. Why? To build a picture once and then copy it onto the screen many times, or to compose a sprite, a minimap or a menu panel. Copying one surface onto another is called **blitting**, and is the subject of the images lesson.',
        },
        {
          type: 'table',
          headers: ['Method', 'What it does'],
          rows: [
            ['`pygame.Surface((w, h))`', 'A new surface of that size, filled with black'],
            ['`pygame.Surface((w, h), pygame.SRCALPHA)`', 'A surface with a per-pixel alpha channel: it starts fully transparent'],
            ['`surf.fill(colour)`', 'Paint the whole surface (or a rect: `surf.fill(colour, rect)`)'],
            ['`surf.get_at((x, y))`', 'Read one pixel as a `Color`'],
            ['`surf.set_at((x, y), colour)`', 'Write one pixel'],
            ['`surf.get_size()`, `get_width()`, `get_height()`', 'Its dimensions'],
            ['`surf.get_rect()`', 'A `Rect` the same size as the surface, at `(0, 0)`'],
            ['`pygame.display.flip()`', 'Show the screen surface on the monitor'],
          ],
          caption: 'Reading and writing single pixels is slow in Python. Use `draw` and `fill` for bulk work.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'flip or update?',
          text: '`pygame.display.flip()` shows the whole screen. `pygame.display.update(rects)` can redraw only the listed areas, which was a speed trick on old computers. On a modern PC the two cost about the same: use `flip()` and forget about it.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The red circle never appears on the screen, although the code runs without errors. Tap the line that causes it.',
      lines: [
        'pygame.draw.circle(screen, (255, 0, 0), (100, 100), 30)',
        'screen.fill((20, 24, 48))',
        'pygame.display.flip()',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The circle is drawn, and then `fill` paints the whole screen over it. Fill belongs **first** in the frame, and the circle after it. Nothing is wrong with the circle line itself: the order is the bug.',
    },
    {
      kind: 'numeric',
      prompt: 'How many pixels are there on a 640 by 360 screen?',
      answer: '230400',
      hint: 'Width times height.',
      explanation: '640 x 360 = 230 400 pixels. `screen.fill` changes all of them 60 times per second, which is fast because it runs in C. A Python loop over every pixel would take far too long: use the draw functions, not `set_at`, for large areas.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: drawing, tested',
      blocks: [
        {
          type: 'p',
          text: 'A `Surface` does not need a window: it is just memory, so you can draw on one in a function and then **read the pixels back** to check the result. The next three exercises do that.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `checkerboard(width, height, cell, c1, c2)`. It returns a new `pygame.Surface` of the given size. Fill it with `c1`, then draw `cell` by `cell` squares of `c2` on the cells where `(column + row)` is odd (column 0, row 0 is the top-left cell, and stays `c1`). Cells at the edge may be cut off.',
      starter: `import pygame


def checkerboard(width, height, cell, c1, c2):
    ...
`,
      solution: `import pygame


def checkerboard(width, height, cell, c1, c2):
    surf = pygame.Surface((width, height))
    surf.fill(c1)
    for row in range(0, (height + cell - 1) // cell):
        for col in range(0, (width + cell - 1) // cell):
            if (col + row) % 2 == 1:
                pygame.draw.rect(surf, c2, (col * cell, row * cell, cell, cell))
    return surf
`,
      setup: PG_SIM,
      tests: `A = (200, 30, 30)
B = (30, 30, 200)

def px(s, x, y):
    return tuple(s.get_at((x, y)))[:3]

s = checkerboard(40, 30, 10, A, B)
assert s.get_size() == (40, 30)
assert px(s, 5, 5) == A, "cell (0, 0) is c1"
assert px(s, 15, 5) == B, "cell (1, 0) is c2"
assert px(s, 5, 15) == B, "cell (0, 1) is c2"
assert px(s, 15, 15) == A, "cell (1, 1) is c1"
assert px(s, 35, 5) == B and px(s, 25, 5) == A
assert px(s, 39, 29) == (A if (3 + 2) % 2 == 0 else B)
assert px(s, 10, 0) == B and px(s, 9, 0) == A, "cell borders are exact"
t = checkerboard(25, 25, 10, A, B)
assert t.get_size() == (25, 25)
assert px(t, 24, 4) == A, "the cut-off column 2, row 0 is c1"
assert px(t, 24, 14) == B, "column 2, row 1 is c2"
assert px(t, 4, 24) == A, "row 2, column 0 is c1"
one = checkerboard(8, 8, 8, A, B)
assert px(one, 0, 0) == A and px(one, 7, 7) == A`,
      checks: ['Returns a `Surface` of the requested size, filled with `c1` first', 'Cell `(column, row)` has `c2` when `column + row` is odd', 'Cells cut off by the edge are still drawn, partly'],
      hint: 'Make the surface with `pygame.Surface((width, height))` and `fill(c1)`. Loop over rows and columns; `(height + cell - 1) // cell` rounds the number of rows up. Draw `(col * cell, row * cell, cell, cell)`.',
      explanation: 'Drawing outside the surface is safe: pygame clips anything that does not fit. That is why the loop can simply cover enough cells to reach the edge. A checkerboard tile like this is also the classic way to show "transparent" in a paint program.',
    },
    {
      kind: 'code',
      prompt: 'Write `bar_color(fraction)` and `draw_bar(surface, rect, fraction)`. `bar_color` returns `(60, 200, 80)` (green) when the fraction is at least 0.5, `(240, 200, 50)` (yellow) when it is at least 0.25, and `(220, 60, 60)` (red) otherwise. `draw_bar` first fills `rect` with the dark grey `(50, 50, 50)`; then draws the filled part: a rectangle starting at `rect.topleft`, of the width `int(rect.width * fraction)` (the fraction is first limited to the range 0 to 1) and the full height, in `bar_color(fraction)`. Return the width of the filled part. Do not draw anything when that width is 0.',
      starter: `import pygame


def bar_color(fraction):
    ...


def draw_bar(surface, rect, fraction):
    ...
`,
      solution: `import pygame


def bar_color(fraction):
    if fraction >= 0.5:
        return (60, 200, 80)
    if fraction >= 0.25:
        return (240, 200, 50)
    return (220, 60, 60)


def draw_bar(surface, rect, fraction):
    fraction = max(0.0, min(1.0, fraction))
    pygame.draw.rect(surface, (50, 50, 50), rect)
    width = int(rect.width * fraction)
    if width > 0:
        pygame.draw.rect(surface, bar_color(fraction), (rect.x, rect.y, width, rect.height))
    return width
`,
      setup: PG_SIM,
      tests: `GREEN, YELLOW, RED, GREY = (60, 200, 80), (240, 200, 50), (220, 60, 60), (50, 50, 50)
assert bar_color(1.0) == GREEN and bar_color(0.5) == GREEN
assert bar_color(0.49) == YELLOW and bar_color(0.25) == YELLOW
assert bar_color(0.24) == RED and bar_color(0.0) == RED

def px(s, x, y):
    return tuple(s.get_at((x, y)))[:3]

s = pygame.Surface((120, 20))
r = pygame.Rect(10, 5, 100, 10)
assert draw_bar(s, r, 0.5) == 50
assert px(s, 10, 5) == GREEN and px(s, 59, 14) == GREEN
assert px(s, 60, 5) == GREY and px(s, 109, 14) == GREY
assert px(s, 9, 5) == (0, 0, 0) and px(s, 110, 5) == (0, 0, 0), "nothing outside the rect"
assert px(s, 30, 4) == (0, 0, 0) and px(s, 30, 15) == (0, 0, 0)
assert draw_bar(s, r, 0.3) == 30
assert px(s, 39, 8) == YELLOW and px(s, 40, 8) == GREY, "old fill is painted over"
assert draw_bar(s, r, 0) == 0
assert px(s, 10, 8) == GREY and px(s, 109, 8) == GREY
assert draw_bar(s, r, 1.7) == 100
assert px(s, 109, 8) == GREEN
assert draw_bar(s, r, -2) == 0
assert px(s, 10, 8) == GREY
assert draw_bar(s, r, 0.1) == 10 and px(s, 15, 8) == RED`,
      checks: ['`bar_color` switches at 0.5 and 0.25', 'The background is dark grey over the whole rect, then the coloured part starts at the top-left corner', 'The fraction is limited to 0..1, and the returned width is `int(rect.width * fraction)`'],
      hint: 'Limit the fraction with `max(0.0, min(1.0, fraction))`. `pygame.draw.rect(surface, color, rect)` accepts a `Rect`, and `(rect.x, rect.y, width, rect.height)` builds the filled part.',
      explanation: 'A health bar is a good example of "game state to picture": the bar contains no logic about health, it only draws a fraction. Because the function draws onto whatever surface it is given, it works on the screen and on a test surface alike.',
    },
    {
      kind: 'code',
      prompt: 'Write `count_color(surface, color)`: the number of pixels in the surface that have exactly the given RGB colour (ignore alpha). Then write `bounding_box(surface, background)`, which returns the smallest `pygame.Rect` containing every pixel that is **not** the background colour, or `None` if every pixel matches the background.',
      starter: `import pygame


def count_color(surface, color):
    ...


def bounding_box(surface, background):
    ...
`,
      solution: `import pygame


def count_color(surface, color):
    count = 0
    for y in range(surface.get_height()):
        for x in range(surface.get_width()):
            if tuple(surface.get_at((x, y)))[:3] == tuple(color)[:3]:
                count += 1
    return count


def bounding_box(surface, background):
    xs = []
    ys = []
    for y in range(surface.get_height()):
        for x in range(surface.get_width()):
            if tuple(surface.get_at((x, y)))[:3] != tuple(background)[:3]:
                xs.append(x)
                ys.append(y)
    if not xs:
        return None
    return pygame.Rect(min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1)
`,
      setup: PG_SIM,
      tests: `BG = (0, 0, 0)
RED = (255, 0, 0)
s = pygame.Surface((20, 10))
assert count_color(s, BG) == 200
assert count_color(s, RED) == 0
assert bounding_box(s, BG) is None
pygame.draw.rect(s, RED, (3, 2, 5, 4))
assert count_color(s, RED) == 20
assert count_color(s, BG) == 180
box = bounding_box(s, BG)
assert (box.x, box.y, box.w, box.h) == (3, 2, 5, 4), box
s.set_at((19, 9), (0, 255, 0))
box = bounding_box(s, BG)
assert (box.x, box.y, box.right, box.bottom) == (3, 2, 20, 10), box
assert count_color(s, (0, 255, 0)) == 1
t = pygame.Surface((4, 4))
t.fill(RED)
assert bounding_box(t, RED) is None
assert (bounding_box(t, BG).w, bounding_box(t, BG).h) == (4, 4)`,
      checks: ['`count_color` visits every pixel and compares only the red, green and blue parts', '`bounding_box` returns a `Rect` that touches the outermost non-background pixels', 'It returns `None` when nothing differs from the background'],
      hint: 'Two nested loops over `get_height()` and `get_width()`. `tuple(surface.get_at((x, y)))[:3]` gives the RGB of one pixel. For the box, keep the minimum and maximum x and y found.',
      explanation: 'Reading pixels back lets you test drawing code, and it is also how some games do **pixel-perfect collision** or find the edges of a sprite. But the double loop is slow in Python (hundreds of thousands of steps for a full screen), so use it for testing and one-off work, never every frame.',
    },
  ],
  takeaways: [
    'Screen coordinates start at the **top-left** `(0, 0)`; x grows to the right and **y grows downwards**. To move up, subtract from y.',
    'Colours are `(R, G, B)` tuples from 0 to 255 (a fourth number is alpha), or `pygame.Color("tomato")` / `pygame.Color("#fac828")`. Name your colours as constants.',
    '`pygame.draw.rect/circle/ellipse/line/lines/polygon/arc` draw on a surface: surface, colour, geometry, then an optional `width` (0 means filled, more than 0 an outline).',
    'Drawing is painting: **later calls cover earlier ones**. Order each frame as fill, world, player, interface. A missing sprite is often just covered.',
    'A `Surface` is a grid of pixels in memory: make your own with `pygame.Surface((w, h))` (add `SRCALPHA` for transparency). `fill`, `get_at` and `set_at` read and write; per-pixel loops are slow.',
    'Nothing is visible until `pygame.display.flip()`. Draw functions that take a surface parameter can be tested by drawing on an off-screen surface and reading the pixels back.',
  ],
  reading: [
    { title: 'pygame docs: pygame.draw', url: 'https://www.pygame.org/docs/ref/draw.html', source: 'docs', note: 'Every drawing function, with the exact rules for width and anti-aliasing.' },
    { title: 'pygame docs: pygame.Surface', url: 'https://www.pygame.org/docs/ref/surface.html', source: 'docs', note: 'Creating surfaces, pixel access, flags and blitting.' },
    { title: 'pygame docs: pygame.Color', url: 'https://www.pygame.org/docs/ref/color.html', source: 'docs', note: 'Colour objects, names, hex strings and conversions.' },
    { title: 'Wikipedia: Painter’s algorithm', url: 'https://en.wikipedia.org/wiki/Painter%27s_algorithm', source: 'wikipedia', note: 'The "draw far things first" idea behind the order of draw calls.' },
  ],
};
