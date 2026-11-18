import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-tilemaps',
  title: 'Tile Maps and Scrolling Cameras',
  summary: 'Describe a level as rows of text, turn it into walls and coins, collide with tiles by arithmetic instead of loops, and scroll a camera over a world bigger than the window.',
  minutes: 42,
  objectives: [
    'Explain why levels are stored as grids of tiles, and read and write a map as a list of strings',
    'Convert between pixel coordinates and (column, row) tile coordinates with floor division',
    'Find the tiles a rectangle overlaps and use them for fast wall collision',
    'Write a camera that follows the player, stays inside the world, and shifts drawing by its offset',
    'Draw only the visible slice of the map, and understand why that matters',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Levels as grids of tiles',
      blocks: [
        {
          type: 'p',
          text: 'Until now every wall and platform in this course has been a rectangle you placed by hand. A level with hundreds of them needs a better way to describe it. The classic answer is the **tile map**: divide the world into a grid of equal squares (tiles, often 16, 32 or 64 pixels wide) and say what is in each one. A whole level becomes a small table of characters that you can read, edit and even paste into a chat:',
        },
        {
          type: 'code',
          lang: 'text',
          code: `#########
#@..o...#
#..###..#
#o......#
#########`,
          annotations: [
            { lines: '1-5', text: 'Each character is one tile: `#` is a wall, `.` is empty floor, `o` a coin and `@` where the player starts. The outline of `#` closes the level in.' },
          ],
        },
        {
          type: 'p',
          text: 'In code the map is a **list of strings**, one string per row. Because Python indexes a list by row first and then a string by column, the tile at column `col` and row `row` is `rows[row][col]`, with the row first, the opposite of the (x, y) order of coordinates. That swap is the most common tile-map bug, and an exercise below keeps you honest about it.',
        },
        {
          type: 'table',
          headers: ['Way to store a level', 'Good for', 'Weakness'],
          rows: [
            ['A list of `Rect` objects', 'A few hand-placed platforms', 'Hundreds of rectangles are slow to test and painful to edit'],
            ['**A grid of tile characters**', 'Rooms, mazes, platformers, top-down maps; easy to edit by hand', 'Everything snaps to the grid'],
            ['A grid of numbers (tile ids)', 'The same, with many tile types and images', 'Less readable without a legend'],
            ['A file made by an editor such as Tiled', 'Big levels with layers and objects', 'Needs a loader for the file format'],
          ],
          caption: 'Start with strings, then move to numbers and files as the game grows. The code that uses the grid hardly changes.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a grid makes collision cheap',
          text: 'With a grid, "what is at this position?" is **arithmetic**, not a search. Pixel (350, 100) in a world of 32-pixel tiles is in column `350 // 32 = 10`, row `100 // 32 = 3`, so you look at one entry in the map. With 10,000 individual wall rectangles you would test every one of them, every frame.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A map is a list of strings called `rows`. Which expression gives the character of the tile in **column** 7, **row** 2?',
      options: [
        { text: '`rows[2][7]`', correct: true, why: 'The list is indexed by row first, then the string by column.' },
        { text: '`rows[7][2]`', why: 'That swaps them: it asks for row 7, column 2.' },
        { text: '`rows[7, 2]`', why: 'Lists do not take two indexes separated by a comma; that raises a TypeError.' },
        { text: '`rows[2 * 7]`', why: 'That multiplies the numbers and indexes one row, which is not a tile.' },
      ],
      explanation: 'Row first, then column: `rows[row][col]`. Coordinates, by contrast, are written (x, y), that is (column, row), so convert with care.',
    },
    {
      kind: 'truefalse',
      prompt: 'Drawing only the tiles inside the camera’s view, instead of the whole map, is purely an optimisation: the player sees exactly the same picture either way.',
      answer: true,
      explanation: 'True. Tiles outside the window are drawn off-screen and cost time for nothing. With a 40-by-12 level it hardly matters, but with 400 by 200 tiles, drawing them all every frame would drag the game down while changing nothing on screen.',
    },
    {
      kind: 'concept',
      title: 'Walls, coins and a camera that follows',
      blocks: [
        {
          type: 'p',
          text: 'The program below loads a 40-by-12 level, lets you walk with the arrow keys, collides with walls using tile arithmetic, collects coins, and scrolls a camera over a world twice as wide as the window. Read it in four parts: building the sets, the tile helpers, moving with collision, and the camera.',
        },
        {
          type: 'code',
          title: 'tilemap_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
VIEW_W, VIEW_H = 640, 360
screen = pygame.display.set_mode((VIEW_W, VIEW_H))
clock = pygame.time.Clock()
TILE = 32

LEVEL = [
    "########################################",
    "#......................................#",
    "#..@......o.....###........o...........#",
    "#.......###.................###........#",
    "#..o..............o....................#",
    "#.....####.......###.......o...........#",
    "#......................................#",
    "#...o........####..........###.........#",
    "#..........o...........................#",
    "#.......###..............o.............#",
    "#......................................#",
    "########################################",
]
ROWS, COLS = len(LEVEL), len(LEVEL[0])
WORLD_W, WORLD_H = COLS * TILE, ROWS * TILE

walls, coins = set(), set()
start = (1, 1)
for row, line in enumerate(LEVEL):
    for col, ch in enumerate(line):
        if ch == "#":
            walls.add((col, row))
        elif ch == "o":
            coins.add((col, row))
        elif ch == "@":
            start = (col, row)

player = pygame.Rect(start[0] * TILE + 4, start[1] * TILE + 4, 24, 24)
score = 0


def tiles_overlapping(rect):
    for row in range(rect.top // TILE, (rect.bottom - 1) // TILE + 1):
        for col in range(rect.left // TILE, (rect.right - 1) // TILE + 1):
            yield col, row


def move(rect, dx, dy):
    rect.x += dx
    for col, row in tiles_overlapping(rect):
        if (col, row) in walls:
            if dx > 0:
                rect.right = col * TILE
            elif dx < 0:
                rect.left = (col + 1) * TILE
    rect.y += dy
    for col, row in tiles_overlapping(rect):
        if (col, row) in walls:
            if dy > 0:
                rect.bottom = row * TILE
            elif dy < 0:
                rect.top = (row + 1) * TILE


running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    keys = pygame.key.get_pressed()
    step = round(200 * dt)
    dx = (keys[pygame.K_RIGHT] - keys[pygame.K_LEFT]) * step
    dy = (keys[pygame.K_DOWN] - keys[pygame.K_UP]) * step
    move(player, dx, dy)
    for tile in tiles_overlapping(player):
        if tile in coins:
            coins.remove(tile)
            score += 1
    pygame.display.set_caption(f"Coins: {score}")

    cam_x = max(0, min(player.centerx - VIEW_W // 2, WORLD_W - VIEW_W))
    cam_y = max(0, min(player.centery - VIEW_H // 2, WORLD_H - VIEW_H))

    screen.fill((16, 20, 28))
    first_col = cam_x // TILE
    last_col = min(COLS, (cam_x + VIEW_W - 1) // TILE + 1)
    first_row = cam_y // TILE
    last_row = min(ROWS, (cam_y + VIEW_H - 1) // TILE + 1)
    for row in range(first_row, last_row):
        for col in range(first_col, last_col):
            x, y = col * TILE - cam_x, row * TILE - cam_y
            if (col, row) in walls:
                pygame.draw.rect(screen, (70, 90, 120), (x, y, TILE, TILE))
            elif (col, row) in coins:
                pygame.draw.circle(screen, (250, 200, 40), (x + TILE // 2, y + TILE // 2), 7)
    pygame.draw.rect(screen, (90, 200, 120), player.move(-cam_x, -cam_y))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '9-22', text: 'The level is a list of strings, all the same width. Every row is 40 characters, so the world is 40 by 12 tiles, or 1280 by 384 pixels.' },
            { lines: '26-35', text: 'One pass over the text builds a set of wall positions, a set of coin positions and the start. Sets of `(col, row)` pairs make "is there a wall here?" a single fast lookup. `enumerate` gives the row and column numbers.' },
            { lines: '41-44', text: 'The key helper: every tile touched by a rectangle. Rows run from `top // TILE` to `(bottom - 1) // TILE`; the `- 1` matters, because the bottom edge is **outside** the rectangle. Without it a rectangle exactly one tile tall would claim two rows.' },
            { lines: '47-61', text: 'Movement is **axis-separated**: move in x, push out of any wall hit, then do y. Moving right into a wall sets the player’s `right` edge to the wall’s left edge, `col * TILE`; moving left sets `left` to the wall’s right edge, `(col + 1) * TILE`. The y half mirrors it.' },
            { lines: '76-79', text: 'Coins are collected by checking the tiles the player overlaps and removing them from the set.' },
            { lines: '82-83', text: 'The camera is the world position of the window’s top-left corner. It centres on the player, then is **clamped** so that it never shows anything outside the world: between 0 and `world size - view size`.' },
            { lines: '86-89', text: 'Only the tiles in view are visited: the first column is `cam_x // TILE` and the last is the last pixel, `cam_x + VIEW_W - 1`, divided by `TILE`, plus one for `range`, limited to the map size.' },
            { lines: '90-97', text: 'World to screen: subtract the camera offset. A tile at column `col` appears at `col * TILE - cam_x`. The player is drawn with the same shift, `player.move(-cam_x, -cam_y)`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keep world and screen coordinates apart',
          text: 'Everything in the game logic (the player, enemies, walls) lives in **world** coordinates. Only the drawing code subtracts the camera, once, at the moment of blitting. If you mix the two, collisions start depending on where the camera happens to be, which is a miserable bug to hunt.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the three lines that find a tile, place it on screen, and clamp the camera.',
      template: `col = x ___ tile_size
screen_x = col * tile_size - ___
cam_x = max(0, min(cam_x, world_w - ___))`,
      templateIsCode: true,
      blanks: [{ answers: ['//'] }, { answers: ['cam_x'] }, { answers: ['view_w'] }],
      wordBank: ['//', '%', '/', 'cam_x', 'view_w', 'world_w'],
      explanation: 'Floor division `//` turns a pixel into a tile number; the camera offset is subtracted to get a screen position; and the camera may not go past `world_w - view_w`, the position at which the view’s right edge meets the world’s right edge.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Walls are collected from a tiny map exactly as the program above does it.',
      code: `rows = ["#..#", ".o.."]
walls = {(c, r) for r, line in enumerate(rows) for c, ch in enumerate(line) if ch == "#"}
print(sorted(walls))`,
      answer: '[(0, 0), (3, 0)]',
      hint: 'Row 0 is "#..#": which columns hold a "#"? Row 1 has none.',
      explanation: 'In row 0 the characters at columns 0 and 3 are `#`, so the set holds `(0, 0)` and `(3, 0)` as `(column, row)` pairs. Row 1 has none (the `o` is a coin). Sorting a set of tuples gives a predictable list.',
    },
    {
      kind: 'concept',
      title: 'Colliding by tile, and why the camera clamps',
      blocks: [
        {
          type: 'p',
          text: 'A rectangle spans a **range** of tiles, never just one, because it is rarely aligned to the grid. A 24-pixel player standing across a tile boundary overlaps two columns, and across a corner, four tiles. The helper in the demo turns the rectangle’s edges into the first and last row and column:',
        },
        {
          type: 'table',
          headers: ['Edge', 'Tile index', 'Why'],
          rows: [
            ['`left`', '`left // tile`', 'The leftmost pixel the rectangle covers'],
            ['`right`', '`(right - 1) // tile`', '`right` is one past the last pixel, so subtract 1 before dividing'],
            ['`top`', '`top // tile`', 'The topmost pixel'],
            ['`bottom`', '`(bottom - 1) // tile`', 'The same one-past-the-end rule'],
          ],
          caption: 'Floor division also works for negative pixels: `-1 // 32` is `-1`, the tile just left of the map, which is exactly what you want.',
        },
        {
          type: 'p',
          text: 'Then test only that handful of tiles against the wall set. This is why tile collision stays fast even in enormous levels: the work depends on the **size of the player**, not the size of the level.',
        },
        {
          type: 'p',
          text: 'The camera needs one more rule. If the player stands near the edge of the world, centring the camera on them would show empty space beyond the map. **Clamping** prevents that: the camera’s left edge is never below 0 and never beyond `world_w - view_w`. When the whole world is smaller than the window, `world_w - view_w` is negative; clamping with `max(0, ...)` last then pins the camera at 0, which is what you want for a small room.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why clamp the lower bound last?',
          text: 'The order `max(0, min(x, world - view))` applies the upper limit first and then the lower limit, so the lower limit wins whenever the two disagree. In a world smaller than the view the upper limit is negative, and 0 correctly overrides it. Written the other way round, `min(world - view, max(0, x))` would return a negative camera and shift a small level off the screen.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The program crashes with `IndexError: list index out of range` when the player at column 4, row 1 looks at its own tile. Tap the line that causes it.',
      lines: [
        'rows = ["#####", "#...#", "#####"]',
        'col, row = 4, 1',
        'cell = rows[col][row]',
        'print(cell)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The map is indexed **row first**: `rows[row][col]`. Here `rows[4]` asks for a fifth row, but there are only three. The correct line is `cell = rows[row][col]`, which gives `"#"` (the right wall of row 1).',
    },
    {
      kind: 'numeric',
      prompt: 'A world is 1000 pixels wide and the tiles are 48 pixels wide. In which tile **column** (counting from 0) is the pixel at x = 1000?',
      answer: '20',
      hint: 'Floor-divide: 1000 // 48.',
      explanation: '48 * 20 = 960 and 48 * 21 = 1008, so x = 1000 falls inside the column that starts at 960: column 20. Floor division, not rounding, is what maps a pixel to its tile.',
      label: 'Column:',
    },
    {
      kind: 'concept',
      title: 'Your turn: maps, collisions and cameras',
      blocks: [
        {
          type: 'p',
          text: 'You will parse a map from text, find the tiles a rectangle touches (and test them against walls), and compute a clamped camera together with the range of visible tiles. All three are pure functions, so the tests need no window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `parse_map(rows)` returning a dictionary with the keys `"walls"` (a set of `(col, row)` pairs for every `#`), `"coins"` (a **list** of `(col, row)` pairs for every `o`, in reading order: row by row, left to right), `"start"` (the `(col, row)` of `@`, or `None` if there is none), `"cols"` (the length of the longest row, `0` for an empty map) and `"rows"` (the number of rows). Then write `collect_coins(coins, tiles)`, which returns `(remaining, collected)`: `remaining` is the list of coins **not** in `tiles` (order kept) and `collected` is how many coins were in `tiles` (a repeated tile counts once).',
      starter: `def parse_map(rows):
    ...


def collect_coins(coins, tiles):
    ...
`,
      solution: `def parse_map(rows):
    walls = set()
    coins = []
    start = None
    for row, line in enumerate(rows):
        for col, ch in enumerate(line):
            if ch == "#":
                walls.add((col, row))
            elif ch == "o":
                coins.append((col, row))
            elif ch == "@":
                start = (col, row)
    cols = max((len(line) for line in rows), default=0)
    return {"walls": walls, "coins": coins, "start": start, "cols": cols, "rows": len(rows)}


def collect_coins(coins, tiles):
    touched = set(tiles)
    remaining = [c for c in coins if c not in touched]
    return remaining, len(coins) - len(remaining)
`,
      tests: `rows = [
    "#####",
    "#@.o#",
    "#.#.#",
    "#o..#",
    "#####",
]
m = parse_map(rows)
assert m["cols"] == 5 and m["rows"] == 5
assert m["start"] == (1, 1)
assert m["coins"] == [(3, 1), (1, 3)], m["coins"]
assert len(m["walls"]) == 17
assert (2, 2) in m["walls"] and (0, 0) in m["walls"] and (4, 4) in m["walls"]
assert (1, 1) not in m["walls"] and (3, 1) not in m["walls"]
assert isinstance(m["walls"], set) and isinstance(m["coins"], list)
empty = parse_map([])
assert empty == {"walls": set(), "coins": [], "start": None, "cols": 0, "rows": 0}
ragged = parse_map(["##", "#..o"])
assert ragged["cols"] == 4 and ragged["rows"] == 2 and ragged["coins"] == [(3, 1)]
assert ragged["start"] is None
coins = [(3, 1), (1, 3), (2, 2)]
rem, got = collect_coins(coins, [(1, 3), (5, 5), (3, 1)])
assert rem == [(2, 2)] and got == 2
rem, got = collect_coins(coins, [(1, 3), (1, 3)])
assert rem == [(3, 1), (2, 2)] and got == 1, "a repeated tile counts once"
assert collect_coins(coins, []) == (coins, 0)
assert collect_coins([], [(1, 1)]) == ([], 0)
assert coins == [(3, 1), (1, 3), (2, 2)], "the input list is not modified"`,
      checks: ['`parse_map` finds walls, coins in reading order, the start, and the grid size, and handles an empty map', '`(col, row)` order is used throughout, not `(row, col)`', '`collect_coins` keeps the order of the remaining coins and counts each collected coin once'],
      hint: 'Use `for row, line in enumerate(rows)` and `for col, ch in enumerate(line)`, and store `(col, row)`. For the width: `max((len(line) for line in rows), default=0)`. In `collect_coins`, turn `tiles` into a set first.',
      explanation: 'One pass over the text produces every structure the game needs. Using `enumerate` for both loops hands you the row and column numbers for free, and storing tiles as `(col, row)` matches the (x, y) order of everything else.',
    },
    {
      kind: 'code',
      prompt: 'Write `tiles_overlapping(rect, size)` returning a list of every `(col, row)` tile that `rect` (a `pygame.Rect`) overlaps, in reading order (row by row, left to right). Remember that the right and bottom edges are outside the rectangle. Then write `hits_wall(rect, walls, size)` that returns `True` if any overlapped tile is in the set `walls`.',
      starter: `import pygame


def tiles_overlapping(rect, size):
    ...


def hits_wall(rect, walls, size):
    ...
`,
      solution: `import pygame


def tiles_overlapping(rect, size):
    first_col = rect.left // size
    last_col = (rect.right - 1) // size
    first_row = rect.top // size
    last_row = (rect.bottom - 1) // size
    return [
        (col, row)
        for row in range(first_row, last_row + 1)
        for col in range(first_col, last_col + 1)
    ]


def hits_wall(rect, walls, size):
    return any(tile in walls for tile in tiles_overlapping(rect, size))
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
assert tiles_overlapping(R(0, 0, 32, 32), 32) == [(0, 0)], "exactly one tile, not four"
assert tiles_overlapping(R(32, 32, 32, 32), 32) == [(1, 1)]
assert tiles_overlapping(R(16, 16, 32, 32), 32) == [(0, 0), (1, 0), (0, 1), (1, 1)]
assert tiles_overlapping(R(30, 0, 4, 4), 32) == [(0, 0), (1, 0)]
assert tiles_overlapping(R(5, 40, 10, 50), 32) == [(0, 1), (0, 2)]
assert tiles_overlapping(R(0, 0, 33, 1), 32) == [(0, 0), (1, 0)]
assert tiles_overlapping(R(-1, 0, 2, 2), 32) == [(-1, 0), (0, 0)], "negative pixels floor downwards"
assert tiles_overlapping(R(0, 0, 100, 10), 16) == [(0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (5, 0), (6, 0)]
walls = {(2, 2), (0, 5)}
assert hits_wall(R(64, 64, 32, 32), walls, 32) is True
assert hits_wall(R(64, 64, 10, 10), walls, 32) is True
assert hits_wall(R(33, 33, 30, 30), walls, 32) is False, "the rectangle ends at pixel 62, in tile 1"
assert hits_wall(R(33, 33, 32, 32), walls, 32) is True, "one pixel further (it now ends at pixel 64) reaches tile 2"
assert hits_wall(R(0, 0, 100, 100), set(), 32) is False
assert hits_wall(R(0, 160, 5, 5), walls, 32) is True
assert hits_wall(R(5, 150, 5, 5), walls, 32) is False`,
      checks: ['A rectangle exactly one tile in size and aligned to the grid overlaps exactly one tile', 'Right and bottom edges are treated as outside, using `(edge - 1) // size`', 'Tiles come in reading order, and negative pixels floor to negative tiles'],
      hint: 'Compute `rect.left // size`, `(rect.right - 1) // size`, and the same for top and bottom; then use two `range`s, rows outside and columns inside. `hits_wall` can use `any(...)` over that list.',
      explanation: 'The `- 1` is the whole difficulty. Pixel 32 belongs to tile 1, but a rectangle from 0 to 32 covers pixels 0 to 31 only, so it must not touch tile 1. In the game, `hits_wall` is the test that makes the player stop at a wall.',
    },
    {
      kind: 'code',
      prompt: 'Write `camera_offset(target, view, world)`. `target` is the `(x, y)` world position the camera should centre on, `view` is `(view_w, view_h)` and `world` is `(world_w, world_h)` in pixels. Return `(cam_x, cam_y)`, the top-left of the view, using whole-number division by 2 for the centring, and clamp each axis between 0 and `world - view` (a world smaller than the view gives 0). Then write `visible_range(camera, view, tile, cols, rows)` that returns `(col0, col1, row0, row1)`: the tile columns and rows that the view touches, with the end values **exclusive** (as in `range`) and limited to the `cols` and `rows` of the map.',
      starter: `def camera_offset(target, view, world):
    ...


def visible_range(camera, view, tile, cols, rows):
    ...
`,
      solution: `def camera_offset(target, view, world):
    cam_x = target[0] - view[0] // 2
    cam_y = target[1] - view[1] // 2
    cam_x = max(0, min(cam_x, world[0] - view[0]))
    cam_y = max(0, min(cam_y, world[1] - view[1]))
    return cam_x, cam_y


def visible_range(camera, view, tile, cols, rows):
    col0 = max(0, camera[0] // tile)
    col1 = min(cols, (camera[0] + view[0] - 1) // tile + 1)
    row0 = max(0, camera[1] // tile)
    row1 = min(rows, (camera[1] + view[1] - 1) // tile + 1)
    return col0, col1, row0, row1
`,
      tests: `view = (320, 240)
world = (1000, 800)
assert camera_offset((500, 400), view, world) == (340, 280)
assert camera_offset((50, 50), view, world) == (0, 0), "clamped at the top-left corner"
assert camera_offset((990, 790), view, world) == (680, 560), "clamped at the bottom-right corner"
assert camera_offset((160, 400), view, world) == (0, 280), "each axis is clamped on its own"
assert camera_offset((900, 100), view, world) == (680, 0)
assert camera_offset((100, 100), (320, 240), (200, 100)) == (0, 0), "a world smaller than the view"
assert camera_offset((321, 241), (321, 241), (1000, 1000)) == (161, 121), "odd view sizes use whole-number halves"
assert visible_range((340, 280), view, 32, 40, 30) == (10, 21, 8, 17)
assert visible_range((0, 0), view, 32, 40, 30) == (0, 10, 0, 8)
assert visible_range((680, 560), view, 32, 32, 25) == (21, 32, 17, 25), "limited to the map size"
assert visible_range((32, 32), (64, 64), 32, 10, 10) == (1, 3, 1, 3), "exactly two tiles, not three"
assert visible_range((33, 33), (64, 64), 32, 10, 10) == (1, 4, 1, 4), "an offset of one pixel touches a third tile"
assert visible_range((0, 0), (100, 100), 32, 2, 2) == (0, 2, 0, 2), "a tiny map is fully visible"
c0, c1, r0, r1 = visible_range((340, 280), view, 32, 40, 30)
assert (c1 - c0) * (r1 - r0) == 99
assert 40 * 30 // ((c1 - c0) * (r1 - r0)) == 12`,
      checks: ['`camera_offset` centres on the target and clamps each axis to `0 .. world - view`, giving 0 for a world smaller than the view', '`visible_range` uses the last visible pixel, `camera + view - 1`, for the end, and limits to the map size', 'The end values are exclusive'],
      hint: 'Centre with `target - view // 2`, then `max(0, min(value, world - view))`. For the end of the visible columns: `min(cols, (cam_x + view_w - 1) // tile + 1)`.',
      explanation: 'These two functions are the camera of nearly every scrolling game. The last assertion shows the payoff: the view touches 99 of the map’s 1200 tiles, so you draw about 12 times fewer. On a large map the saving decides whether the game runs smoothly.',
    },
  ],
  takeaways: [
    'A **tile map** is a grid of equal squares described by a list of strings (or numbers). Read `rows[row][col]`, **row first**, and store positions as `(col, row)`.',
    'Pixel to tile is **floor division**: `col = x // tile`. A tile to its pixel position is `col * tile`. Negative pixels floor to negative tiles, which are simply outside the map.',
    'A rectangle overlaps a **range** of tiles: from `left // tile` to `(right - 1) // tile`, and likewise for rows. The `- 1` is needed because the right and bottom edges are outside the rectangle.',
    'Tile collision is cheap because it depends on the size of the **player**, not of the level: test the few overlapped tiles against a set of wall positions.',
    'A **camera** is a world-space offset. Centre it on the player and **clamp** it between 0 and `world - view`; draw by subtracting the offset. Keep game logic in world coordinates and subtract the camera only when drawing.',
    'Draw only the tiles in view (`visible_range`): the picture is the same, but the work no longer grows with the size of the world.',
  ],
  reading: [
    { title: 'Tiled map editor documentation', url: 'https://doc.mapeditor.org/en/stable/', source: 'docs', note: 'The popular free editor for big tile maps; pytmx and pygame-ce can load its files.' },
    { title: 'Wikipedia: Tile-based video game', url: 'https://en.wikipedia.org/wiki/Tile-based_video_game', source: 'wikipedia', note: 'History and variations of tile-based games.' },
    { title: 'pygame docs: pygame.Rect', url: 'https://www.pygame.org/docs/ref/rect.html', source: 'docs', note: 'left, right, top and bottom, and the move method used to shift by the camera.' },
  ],
};
