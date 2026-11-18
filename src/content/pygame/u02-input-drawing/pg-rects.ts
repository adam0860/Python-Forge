import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-rects',
  title: 'Rects: Position, Size and Collision',
  summary: 'The Rect is the most-used class in pygame: it holds where a thing is and how big it is, moves by its edges and centre, and answers "do these overlap?".',
  minutes: 38,
  objectives: [
    'Create a `Rect` and read and assign its edge, corner, middle and size attributes',
    'Tell methods that return a new rectangle (`move`, `inflate`, `clamp`) from the in-place versions (`move_ip`, `clamp_ip`)',
    'Detect overlap with `colliderect`, `collidepoint`, `collidelist` and `clip`, including the edge rule: touching is not colliding',
    'Convert between pixel positions and grid cells with integer division, and build a grid of rectangles',
    'Explain why a Rect stores whole numbers, and what that means for slow movement',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A rectangle with many names',
      blocks: [
        {
          type: 'p',
          text: 'A `pygame.Rect(x, y, width, height)` is four whole numbers: where the **top-left corner** is, and how big the rectangle is. It is used for the position of every sprite, button, wall and screen area, and it has a lot of **virtual attributes** that are worked out from those four, so that you can say what you mean:',
        },
        {
          type: 'table',
          headers: ['Attribute', 'Meaning', 'For `Rect(10, 20, 30, 40)`'],
          rows: [
            ['`x`, `left`', 'Left edge', '10'],
            ['`y`, `top`', 'Top edge', '20'],
            ['`right`', 'Right edge: `x + width`', '40'],
            ['`bottom`', 'Bottom edge: `y + height`', '60'],
            ['`width`, `height`, `size`', 'Dimensions', '30, 40, (30, 40)'],
            ['`centerx`, `centery`, `center`', 'The middle', '25, 40, (25, 40)'],
            ['`topleft`, `topright`, `bottomleft`, `bottomright`', 'Corners', '(10, 20), (40, 20), (10, 60), (40, 60)'],
            ['`midtop`, `midbottom`, `midleft`, `midright`', 'Middles of the edges', '(25, 20), (25, 60), (10, 40), (40, 40)'],
          ],
          caption: 'All of these can be read, and also **assigned**: the rectangle moves so that the new value is true.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: `>>> r = pygame.Rect(10, 20, 30, 40)
>>> r
<rect(10, 20, 30, 40)>
>>> r.center = (100, 100)
>>> r
<rect(85, 80, 30, 40)>
>>> r.right = 200
>>> r
<rect(170, 80, 30, 40)>
>>> r.width = 10
>>> r.center
(180, 100)`,
          annotations: [
            { lines: '4', text: 'Assigning to `center` **moves** the rectangle so that its middle is at `(100, 100)`. The size does not change.' },
            { lines: '8', text: '`right = 200` moves it again, this time so that its right edge is at 200. (`x` becomes 170.) Position a thing by the point you care about: `midbottom` for a character standing on the floor, `center` for a ball.' },
            { lines: '10-11', text: 'Changing `width` keeps the top-left corner and resizes to the right and down, so the centre moves too.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why so many attributes?',
          text: 'Without them you would write `x = ball_x - width / 2` everywhere, and miscount. With them, `ball.center = (mx, my)` says what you mean, and `player.midbottom = floor.midtop` stands a character on a platform in one line. Most bugs in 2D games are off-by-one-half-a-sprite errors that this removes.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A player has `Rect(100, 200, 50, 80)`. Which expression gives the y of its **feet** (the bottom edge)?',
      options: [
        { text: '`player.bottom`, which is 280', correct: true, why: 'The bottom edge is y + height = 200 + 80 = 280.' },
        { text: '`player.y`, which is 200', why: '`y` is the **top** edge: the head, not the feet.' },
        { text: '`player.height`, which is 80', why: 'That is the size, not a position on the screen.' },
        { text: '`player.centery`, which is 240', why: 'That is the middle of the body.' },
      ],
      explanation: 'Remember that y grows downwards, so the bottom edge has the larger number.',
    },
    {
      kind: 'truefalse',
      prompt: 'For `a = pygame.Rect(0, 0, 10, 10)` and `b = pygame.Rect(10, 0, 10, 10)`, `a.colliderect(b)` is `True`, because the rectangles touch along the line x = 10.',
      answer: false,
      explanation: 'False. `a` covers the pixels from x = 0 to 9, and `b` from x = 10 to 19. They sit side by side and share no pixel, so they do **not** collide. (Overlap by even one pixel, such as `Rect(9, 0, 10, 10)`, and the result is `True`.) This is what lets tiles in a grid stand next to each other without colliding.',
    },
    {
      kind: 'concept',
      title: 'Methods: copies, in place, and collisions',
      blocks: [
        {
          type: 'p',
          text: 'Several methods come in two forms. The plain one **returns a new rectangle** and leaves the original alone; the form ending in `_ip` ("in place") **changes** the rectangle and returns `None`.',
        },
        {
          type: 'table',
          headers: ['Method', 'Returns / does', 'Example result'],
          rows: [
            ['`r.move(dx, dy)` / `r.move_ip(dx, dy)`', 'Shifts the rectangle', '`Rect(0,0,10,10).move(5, 3)` is `(5, 3, 10, 10)`'],
            ['`r.inflate(dw, dh)`', 'Grows (or shrinks) around the centre', '`Rect(0,0,10,10).inflate(6, 4)` is `(-3, -2, 16, 14)`'],
            ['`r.clamp(other)` / `r.clamp_ip(other)`', 'Moves `r` to be inside `other`', '`Rect(-5,90,20,20).clamp(Rect(0,0,100,100))` is `(0, 80, 20, 20)`'],
            ['`r.clip(other)`', 'The overlapping part', '`Rect(0,0,10,10).clip(Rect(5,5,10,10))` is `(5, 5, 5, 5)`'],
            ['`r.union(other)`', 'The smallest rectangle containing both', '`(0, 0, 15, 15)` for the same pair'],
            ['`r.copy()`', 'A new equal rectangle', 'Use before changing one you want to keep'],
          ],
          caption: 'A very common mistake is calling `r.move(5, 0)` and throwing away the result.',
        },
        {
          type: 'table',
          headers: ['Collision test', 'Is true when', 'Typical use'],
          rows: [
            ['`r.colliderect(other)`', 'The two rectangles overlap by at least one pixel', 'Player and enemy, bullet and wall'],
            ['`r.collidepoint(x, y)`', 'The point is inside (left and top edges count, right and bottom do not)', 'Mouse clicks, buttons'],
            ['`r.collidelist(list)`', 'Gives the **index** of the first rectangle in the list that overlaps, or `-1`', 'Wall checks'],
            ['`r.collidelistall(list)`', 'Gives a list of **all** the indexes that overlap', 'Collecting every coin touched'],
            ['`r.contains(other)`', '`other` is entirely inside `r`', 'Is an enemy fully on the screen?'],
          ],
          caption: 'The same ideas are used by sprite groups later.',
        },
        {
          type: 'code',
          title: 'rect_walls.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

player = pygame.Rect(0, 0, 50, 50)
player.center = screen.get_rect().center
walls = [pygame.Rect(100, 80, 120, 30), pygame.Rect(400, 200, 30, 120), pygame.Rect(250, 260, 140, 30)]
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    mouse = pygame.mouse.get_pos()
    player.center = mouse
    player.clamp_ip(screen.get_rect())
    hit = player.collidelist(walls)

    screen.fill((20, 24, 48))
    for wall in walls:
        pygame.draw.rect(screen, (120, 130, 160), wall)
    color = (240, 90, 90) if hit != -1 else (250, 200, 40)
    pygame.draw.rect(screen, color, player)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '7-8', text: 'Make the rectangle first, then **place** it by its centre. `screen.get_rect()` is a rectangle as big as the screen; its `center` is the middle of the window.' },
            { lines: '9', text: 'A list of walls. Rectangles are just data, so you can keep them in lists and loop over them.' },
            { lines: '17-19', text: 'The player follows the mouse by its centre, and `clamp_ip` stops it from leaving the window.' },
            { lines: '20', text: '`collidelist` returns the index of the first wall touched, or `-1` for none.' },
            { lines: '23-24', text: 'The same rectangles are used for drawing. `draw.rect` accepts a `Rect` directly.' },
            { lines: '25', text: 'A conditional expression picks red when touching a wall, yellow otherwise.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that keeps a player on the screen, and stands a crate on top of a floor.',
      template: `player.___(screen.get_rect())
crate.midbottom = floor.___
hit = player.___(enemy)`,
      templateIsCode: true,
      blanks: [{ answers: ['clamp_ip'] }, { answers: ['midtop'] }, { answers: ['colliderect'] }],
      wordBank: ['clamp_ip', 'midtop', 'colliderect', 'inflate', 'midbottom', 'collidepoint'],
      explanation: '`clamp_ip` pushes the rect back inside another one, in place. A crate\'s bottom middle goes to the floor\'s top middle. `colliderect` checks overlap between two rectangles.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A Rect stores whole numbers, so a slow object cannot move less than one pixel at a time. This imitates the position being stored as an integer after each frame, with a speed of 0.4 pixels per frame.',
      code: `pos = 0
for frame in range(10):
    pos = int(pos + 0.4)
print(pos)`,
      answer: '0',
      hint: 'What is int(0.4)?',
      explanation: 'Each frame computes `int(0 + 0.4)`, which is 0, and the 0.4 is lost. After ten frames the object has not moved at all, although it should have travelled 4 pixels. The cure is to keep the true position in a **float** variable (or `Vector2`) and copy it into the rect only for drawing and collisions.',
    },
    {
      kind: 'concept',
      title: 'Whole numbers, grids, and a place for floats',
      blocks: [
        {
          type: 'p',
          text: 'A `Rect` holds integers. Assign `rect.x = 3.7` and the fraction is thrown away (depending on the version, by cutting or by rounding). For fast objects that is fine, but a slow one, or one moved by `speed * dt`, loses its small steps. So the standard approach is: **keep the exact position as floats, and use the Rect as the integer "shadow"** that you draw and collide with.',
        },
        {
          type: 'code',
          code: `pos = pygame.Vector2(100.0, 50.0)   # exact position
vel = pygame.Vector2(0.4, 0)        # pixels per frame

pos += vel                          # exact: no lost steps
rect.center = pos                   # rounded, for drawing and collisions`,
          annotations: [
            { lines: '1-2', text: 'The true position and speed are floats, so 0.4 pixels per frame adds up properly over many frames.' },
            { lines: '4', text: 'Moving by the speed. (Vectors support `+=`, which you will use more in the vector lesson.)' },
            { lines: '5', text: 'Only now is the position converted to whole pixels. The rectangle is rebuilt from the exact position each frame, so errors never pile up.' },
          ],
        },
        {
          type: 'p',
          text: 'Rectangles are also the natural way to describe a **grid**, such as a tile map, a board game or a menu of buttons. Cell `(col, row)` of a grid of `cell`-sized squares is `Rect(col * cell, row * cell, cell, cell)`, and the cell under a pixel `(x, y)` is found with integer division: `(x // cell, y // cell)`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Never compare rects with positions you did not round',
          text: 'Collision and drawing use the integer rectangle; game maths uses the float position. If you mix them (say, checking `pos.x == rect.x`), you will chase rounding errors. Pick one source of truth, and derive the other.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The player never moves, although the loop runs 10 times and no error appears. Tap the line with the mistake.',
      lines: [
        'player = pygame.Rect(0, 0, 40, 40)',
        'for frame in range(10):',
        '    player.move(5, 0)',
        'print(player.x)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`move` returns a **new** rectangle and leaves `player` unchanged, and here the result is thrown away. Use `player.move_ip(5, 0)` (in place), or `player = player.move(5, 0)`. The program prints 0 instead of 50.',
    },
    {
      kind: 'numeric',
      prompt: 'Rectangles `Rect(0, 0, 10, 10)` and `Rect(5, 5, 10, 10)` overlap. What is the area, in pixels, of the overlapping part (the `clip`)?',
      answer: '25',
      hint: 'The overlap is a square from (5, 5) to (10, 10).',
      explanation: 'The overlap runs from x = 5 to 10 and y = 5 to 10: a 5 by 5 square, so 25 pixels. `clip` returns exactly that rectangle, and `union` returns the bounding rectangle `(0, 0, 15, 15)` around both.',
      label: 'Area:',
    },
    {
      kind: 'concept',
      title: 'Your turn: rectangle toolbox',
      blocks: [
        {
          type: 'p',
          text: 'Three small tools that real games use all the time. Each is written as a function of rectangles and numbers, so the tests need no window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `keep_inside(rect, area)` that returns a **new** rectangle: a copy of `rect`, moved the least needed to lie inside `area` (the same size as `rect`, which is never bigger than `area`). The original `rect` must not change. Then write `stand_on(rect, floor, gap=0)` that returns a new rectangle: `rect` moved so that its `midbottom` is at the floor’s `midtop`, lifted `gap` pixels above it.',
      starter: `import pygame


def keep_inside(rect, area):
    ...


def stand_on(rect, floor, gap=0):
    ...
`,
      solution: `import pygame


def keep_inside(rect, area):
    return rect.clamp(area)


def stand_on(rect, floor, gap=0):
    new = rect.copy()
    new.midbottom = (floor.midtop[0], floor.midtop[1] - gap)
    return new
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
area = R(0, 0, 100, 60)
a = R(-10, 20, 30, 20)
b = keep_inside(a, area)
assert b.topleft == (0, 20) and b.size == (30, 20), b
assert a.topleft == (-10, 20), "the original must not change"
assert keep_inside(R(90, 50, 30, 20), area).topleft == (70, 40)
assert keep_inside(R(40, 10, 10, 10), area).topleft == (40, 10), "already inside: unchanged"
assert keep_inside(R(-50, -50, 10, 10), area).topleft == (0, 0)
assert keep_inside(R(500, 20, 10, 10), area).topleft == (90, 20)
floor = R(100, 300, 200, 20)
p = R(0, 0, 40, 60)
q = stand_on(p, floor)
assert q.midbottom == (200, 300), q.midbottom
assert q.size == (40, 60) and p.topleft == (0, 0), "size kept, original untouched"
assert stand_on(p, floor, 5).bottom == 295
assert stand_on(p, floor, 5).centerx == 200`,
      checks: ['`keep_inside` returns a moved copy, the least movement needed, and the original is unchanged', 'A rect that is already inside is returned at the same position', '`stand_on` puts `midbottom` on the floor’s `midtop` (minus the gap) and keeps the size'],
      hint: 'The `Rect.clamp(other)` method does exactly the moving. For `stand_on`, copy the rect and assign `new.midbottom = ...` using the floor’s `midtop` x and y.',
      explanation: 'Positioning by named points is the heart of Rect use. `clamp` returns a moved copy; the in-place `clamp_ip` is the one you will use in the game loop.',
    },
    {
      kind: 'code',
      prompt: 'Write `grid_cells(cols, rows, cell)` that returns a list of `pygame.Rect`, one for each cell of a grid of `cols` columns and `rows` rows of `cell`-pixel squares, in **row order** (the whole top row from left to right, then the next row, and so on). Then write `cell_at(pos, cols, rows, cell)` that returns the `(col, row)` of the cell containing the pixel `pos`, or `None` if `pos` is outside the grid.',
      starter: `import pygame


def grid_cells(cols, rows, cell):
    ...


def cell_at(pos, cols, rows, cell):
    ...
`,
      solution: `import pygame


def grid_cells(cols, rows, cell):
    cells = []
    for row in range(rows):
        for col in range(cols):
            cells.append(pygame.Rect(col * cell, row * cell, cell, cell))
    return cells


def cell_at(pos, cols, rows, cell):
    x, y = pos
    if x < 0 or y < 0:
        return None
    col, row = x // cell, y // cell
    if col >= cols or row >= rows:
        return None
    return (col, row)
`,
      setup: PG_SIM,
      tests: `cells = grid_cells(3, 2, 10)
assert len(cells) == 6
assert [c.topleft for c in cells] == [(0, 0), (10, 0), (20, 0), (0, 10), (10, 10), (20, 10)]
assert all(c.size == (10, 10) for c in cells)
assert grid_cells(0, 5, 10) == [] and grid_cells(4, 0, 10) == []
assert len(grid_cells(5, 4, 32)) == 20
assert grid_cells(1, 1, 64)[0].bottomright == (64, 64)
assert cell_at((0, 0), 3, 2, 10) == (0, 0)
assert cell_at((9, 9), 3, 2, 10) == (0, 0)
assert cell_at((10, 9), 3, 2, 10) == (1, 0)
assert cell_at((29, 19), 3, 2, 10) == (2, 1)
assert cell_at((30, 5), 3, 2, 10) is None
assert cell_at((5, 20), 3, 2, 10) is None
assert cell_at((-1, 5), 3, 2, 10) is None
assert cell_at((5, -1), 3, 2, 10) is None
for i, c in enumerate(cells):
    assert cell_at(c.center, 3, 2, 10) == (i % 3, i // 3)`,
      checks: ['`grid_cells` returns `cols * rows` rectangles in row order', '`cell_at` uses integer division by the cell size', 'Pixels outside the grid, including negative ones, give `None`'],
      hint: 'Two nested loops, rows outside and columns inside, make row order. For `cell_at` take `x // cell` and `y // cell`, but check for negative numbers first (floor division of -1 gives -1, which is not a valid cell).',
      explanation: 'Integer division turns a position into a grid cell, and multiplication turns the cell back into a position. Tile maps, board games, puzzle grids and "which button is under the mouse" all rest on these two lines.',
    },
    {
      kind: 'code',
      prompt: 'Write `touching(rect, others)` returning the list of **indexes** of all rectangles in `others` that overlap `rect` (the edge rule: only touching edges do not count). Write `first_touch(rect, others)` returning the index of the first one, or `-1` if none. Write `overlap_area(a, b)` returning the number of pixels in which `a` and `b` overlap (0 when they do not).',
      starter: `import pygame


def touching(rect, others):
    ...


def first_touch(rect, others):
    ...


def overlap_area(a, b):
    ...
`,
      solution: `import pygame


def touching(rect, others):
    return [i for i, other in enumerate(others) if rect.colliderect(other)]


def first_touch(rect, others):
    return rect.collidelist(others)


def overlap_area(a, b):
    overlap = a.clip(b)
    return overlap.width * overlap.height
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
me = R(0, 0, 10, 10)
others = [R(50, 50, 5, 5), R(8, 8, 5, 5), R(10, 0, 10, 10), R(9, 9, 5, 5), R(-4, -4, 5, 5)]
assert touching(me, others) == [1, 3, 4]
assert first_touch(me, others) == 1
assert touching(me, []) == [] and first_touch(me, []) == -1
assert first_touch(me, [R(10, 10, 5, 5), R(-20, 0, 5, 5)]) == -1, "touching edges or corners do not count"
assert touching(me, [R(0, 0, 10, 10)]) == [0]
assert overlap_area(me, R(5, 5, 10, 10)) == 25
assert overlap_area(me, R(10, 0, 10, 10)) == 0
assert overlap_area(me, R(100, 100, 10, 10)) == 0
assert overlap_area(me, R(2, 2, 3, 3)) == 9, "fully inside: the area of the small one"
assert overlap_area(R(0, 0, 4, 4), me) == 16
assert overlap_area(R(-5, -5, 10, 10), me) == 25`,
      checks: ['`touching` returns every overlapping index in order, using the overlap rule of `colliderect`', '`first_touch` returns the first index or `-1`', '`overlap_area` is the width times the height of the `clip`, and 0 for no overlap'],
      hint: '`rect.colliderect(other)` for a yes or no, and `enumerate` for the indexes. `rect.collidelist(others)` already returns the first index or -1. `a.clip(b)` is the overlapping rectangle: its width and height are 0 if there is none.',
      explanation: 'These three are the usual forms of "what did I hit?": a list of everything, the first hit, and **how much** (the amount of overlap decides how far to push an object out in the collision lesson).',
    },
  ],
  takeaways: [
    '`Rect(x, y, w, h)` stores the top-left corner and the size as integers. Its virtual attributes (`right`, `bottom`, `center`, `midbottom`, `topleft` and more) can be read **and assigned**, which moves the rectangle.',
    'Position things by the point you mean: `ball.center`, `player.midbottom = floor.midtop`. It removes half-a-sprite mistakes.',
    '`move`, `inflate`, `clamp` and `union` return a **new** rect; `move_ip`, `clamp_ip` change it **in place**. Throwing away the result of `move` is a classic bug.',
    'Collisions: `colliderect`, `collidepoint`, `collidelist` (first index or -1), `collidelistall`. Rectangles that merely **touch** along an edge do not collide.',
    'A Rect holds whole numbers, so slow movement is lost. Keep exact positions in floats (or a `Vector2`) and copy them into the rect for drawing and collision.',
    'Grid cell `(col, row)` is `Rect(col * cell, row * cell, cell, cell)`, and the cell at a pixel is `(x // cell, y // cell)`, checking for negatives and the grid size.',
  ],
  reading: [
    { title: 'pygame docs: pygame.Rect', url: 'https://www.pygame.org/docs/ref/rect.html', source: 'docs', note: 'Every attribute and method, with notes on integer storage and edge cases.' },
    { title: 'pygame docs: Surface.get_rect', url: 'https://www.pygame.org/docs/ref/surface.html#pygame.Surface.get_rect', source: 'docs', note: 'How a surface hands you a Rect of its size, with position keywords.' },
    { title: 'Real Python: Python Rect and collision', url: 'https://realpython.com/pygame-a-primer/#sprites', source: 'tutorial', note: 'A tutorial section that uses Rects for sprites and collisions.' },
  ],
};
