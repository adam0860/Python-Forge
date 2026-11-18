import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-performance',
  title: 'Keeping the Frame Rate Up',
  summary: 'Know your 16-millisecond budget, measure where the time goes, and fix the real costs: converted images, cached text, culling, and a spatial grid that turns thousands of collision tests into a handful.',
  minutes: 42,
  objectives: [
    'Compute the frame budget for a target frame rate, and explain why you measure before you optimise',
    'Time sections of a frame with a small profiler, and read its report',
    'Apply the standard fixes: `convert()`ed images, cached text, culling, and capping object counts',
    'Explain why testing every pair of sprites is quadratic, and replace it with a spatial grid',
    'Build an LRU cache that evicts the least recently used item',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The frame budget, and measuring first',
      blocks: [
        {
          type: 'p',
          text: 'At 60 frames per second, each frame has **1000 / 60 = 16.7 milliseconds** to do everything: read input, update every object, draw the picture, and wait for the display. If the work takes 20 ms the game runs at 50 FPS; if it takes 40 ms, at 25 FPS. Performance work is about spending that budget wisely. A game that finishes its work in 5 ms is not "faster to play", but it has room for more enemies, more effects and slower computers.',
        },
        {
          type: 'table',
          headers: ['Target frame rate', 'Time per frame', 'Typical use'],
          rows: [
            ['30 FPS', '33.3 ms', 'Slow computers and phones saving battery'],
            ['60 FPS', '16.7 ms', 'The usual goal for a desktop game'],
            ['120 FPS', '8.3 ms', 'High-refresh monitors, fast action games'],
            ['144 FPS', '6.9 ms', 'Gaming monitors'],
          ],
          caption: 'The budget is 1000 divided by the frame rate, in milliseconds.',
        },
        {
          type: 'p',
          text: 'The first rule of optimising is: **do not guess, measure**. Programmers are famously bad at predicting where the time goes. The loop is always the same: **measure** each part of the frame, find the **biggest** cost, fix **that**, and **measure again** to confirm that it helped. Time a section by reading a clock before and after it (`time.perf_counter()` is the right clock), and add the elapsed time to a running total for that section.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not optimise everything in advance?',
          text: 'Most code is not the bottleneck. A clever trick in code that takes 0.1 ms saves nothing, and costs readability, bugs and time. The famous rule is "premature optimisation is the root of all evil": write clear code first, measure when it is too slow, and spend effort only where the measurements point. One fix in the right place (often one line) is worth more than a hundred in the wrong ones.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Your game has dropped to 40 FPS when 300 enemies are on screen. What is the best **first** step?',
      options: [
        { text: 'Measure how long each part of the frame (update, collisions, drawing) takes, to find the biggest cost', correct: true, why: 'Measuring tells you where the time actually goes; guessing often fixes the wrong thing.' },
        { text: 'Rewrite the whole game in a faster language', why: 'A huge effort, and the real cause is probably one function.' },
        { text: 'Lower the resolution and hope', why: 'It might help drawing costs, but if the cost is collisions it does nothing.' },
        { text: 'Remove all the comments from the code', why: 'Comments have no effect on speed.' },
      ],
      explanation: 'Measure, find the biggest cost, fix it, measure again. Everything else in this lesson is a list of fixes for common biggest costs.',
    },
    {
      kind: 'truefalse',
      prompt: 'Calling `convert()` or `convert_alpha()` on an image after loading it makes drawing it faster, because the pixels are put in the same format as the screen.',
      answer: true,
      explanation: 'True. An image loaded straight from a file may be in a different pixel format from the display, which forces pygame to convert it **every time** it is blitted. Converting once, right after loading (and after `set_mode`), can make blitting several times faster at no cost to the picture.',
    },
    {
      kind: 'concept',
      title: 'Four hundred balls and a grid',
      blocks: [
        {
          type: 'p',
          text: 'The program below counts the overlapping pairs among 400 moving squares, and lets you switch between two methods with the Space bar: **brute force** (test every pair) and a **spatial grid** (test only squares that share a grid cell). The window caption shows the method, the milliseconds the collision step took and the frame rate. Brute force needs about 80,000 tests per frame in Python, which is heavy; the grid needs a few hundred.',
        },
        {
          type: 'code',
          title: 'perf_demo.py',
          desktopOnly: true,
          code: `import random
import time
from collections import defaultdict

import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()
rng = random.Random(3)

rects = [pygame.Rect(rng.randrange(620), rng.randrange(340), 12, 12) for _ in range(400)]
pos = [pygame.Vector2(r.topleft) for r in rects]
vel = [pygame.Vector2(rng.uniform(-80, 80), rng.uniform(-80, 80)) for _ in rects]


def brute_force(rects):
    hits = 0
    for i in range(len(rects)):
        for j in range(i + 1, len(rects)):
            if rects[i].colliderect(rects[j]):
                hits += 1
    return hits


def with_grid(rects, cell=32):
    grid = defaultdict(list)
    for i, r in enumerate(rects):
        for cx in range(r.left // cell, (r.right - 1) // cell + 1):
            for cy in range(r.top // cell, (r.bottom - 1) // cell + 1):
                grid[(cx, cy)].append(i)
    pairs = set()
    for members in grid.values():
        for a in range(len(members)):
            for b in range(a + 1, len(members)):
                i, j = members[a], members[b]
                if rects[i].colliderect(rects[j]):
                    pairs.add((i, j))
    return len(pairs)


use_grid = True
running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:
            use_grid = not use_grid

    for i, r in enumerate(rects):
        pos[i] += vel[i] * dt
        pos[i].x %= 640
        pos[i].y %= 360
        r.topleft = (int(pos[i].x), int(pos[i].y))

    started = time.perf_counter()
    hits = with_grid(rects) if use_grid else brute_force(rects)
    ms = (time.perf_counter() - started) * 1000
    method = "grid" if use_grid else "brute force"
    pygame.display.set_caption(f"{method}: {ms:.1f} ms, {hits} hits, {clock.get_fps():.0f} fps")

    screen.fill((20, 24, 32))
    for r in rects:
        pygame.draw.rect(screen, (90, 200, 120), r)
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '17-23', text: 'Brute force: two nested loops compare every pair once. For `n` squares that is `n * (n - 1) / 2` tests: 79,800 for 400, and 499,500 for 1000. The work grows with the **square** of `n`.' },
            { lines: '26-31', text: 'The grid: square cells of 32 pixels. Each square is added to every cell it touches, using the same `// cell` and `(right - 1) // cell` arithmetic as for tile maps.' },
            { lines: '32-39', text: 'Only squares that share a cell can possibly overlap, so only pairs **within a cell** are tested. A set of `(i, j)` pairs removes the duplicates when two squares share more than one cell.' },
            { lines: '58-62', text: 'Time just the collision step with `time.perf_counter()` and show it in the window caption: measuring where it matters.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Show your numbers while you develop',
          text: 'Put the frame rate (`clock.get_fps()`) and the time of your heaviest steps in the window title or in a corner of the screen while you work. A slowdown that appears the moment you add a feature is then impossible to miss, and you know which change caused it.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete three performance idioms: converting an image, finding a grid cell, and computing a frame budget.',
      template: `image = pygame.image.load(path).___()
cell = x ___ cell_size
budget_ms = 1000 / ___`,
      templateIsCode: true,
      blanks: [{ answers: ['convert', 'convert_alpha'] }, { answers: ['//'] }, { answers: ['60'] }],
      wordBank: ['convert', '//', '60', '%', '1000', 'copy'],
      explanation: '`convert()` (or `convert_alpha()` for images with transparency) puts the pixels into the display’s format once; floor division maps a position to its cell; and the budget for 60 frames per second is `1000 / 60`, about 16.7 milliseconds.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is the key trick of a least-recently-used (LRU) cache: using a key moves it to the end, and the **oldest** key is evicted from the front.',
      code: `from collections import OrderedDict
c = OrderedDict()
for k in "abca":
    c[k] = 1
    c.move_to_end(k)
c.popitem(last=False)
print(list(c))`,
      answer: "['c', 'a']",
      hint: 'After "a", "b", "c" the order is a, b, c. Then "a" is used again: where does it go?',
      explanation: 'The order after the loop is `b, c, a`: using `a` again moved it to the end. `popitem(last=False)` removes from the **front**, the least recently used key, which is `b`. What remains, in order from oldest to newest, is `["c", "a"]`.',
    },
    {
      kind: 'concept',
      title: 'The usual suspects',
      blocks: [
        {
          type: 'p',
          text: 'Profiling nearly always finds the same handful of culprits in pygame games. Here they are, with the fix for each:',
        },
        {
          type: 'table',
          headers: ['Suspect', 'Why it is slow', 'Fix'],
          rows: [
            ['Unconverted images', 'Each blit converts the pixel format', '`.convert()` or `.convert_alpha()` once after loading (after `set_mode`)'],
            ['Rendering text every frame', '`font.render` builds a new surface each call', 'Cache the surface; re-render only when the text changes (an **LRU cache** for text that varies)'],
            ['Loading or scaling in the loop', 'Disk reads and `transform.scale` are expensive', 'Load and scale **once**, at start-up'],
            ['Drawing what cannot be seen', 'Off-screen sprites cost time for nothing', '**Cull**: draw only what intersects the view (a `Rect.colliderect` check)'],
            ['Testing every pair for collision', '`n * (n - 1) / 2` tests: quadratic', 'A **spatial grid** or a quadtree, so each object is compared only with neighbours'],
            ['Too many objects', 'Every particle and bullet costs update + draw time', 'Cap counts, recycle objects, and let effects die quickly'],
            ['Large alpha surfaces', 'Blending every pixel is costly', 'Keep translucent surfaces small, and create them once, not per frame'],
          ],
          caption: 'Measure first. Then go down this list in order of what the profiler shows.',
        },
        {
          type: 'p',
          text: 'A **profiler** is any tool that tells you where time is spent. The simplest, which you can write in twelve lines, wraps sections of the frame in a `with` block: `with profiler.section("draw"): ...`. It reads a clock on the way in and again on the way out, and adds the difference to the section’s total. At the end it prints the sections from most expensive to least. Python also includes `cProfile`, which does this for every function automatically, useful for finding which function is the culprit, once you know which part of the frame is slow.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does the grid win?',
          text: 'Brute force compares each object with all the others, so doubling the objects **quadruples** the work. With a grid, each object is compared only with the few others in its cell: doubling the objects only **doubles** the work. At 400 squares the grid is already around 20 times faster, and at 4000 the gap is hundreds of times. The price is a little memory and the code to build the grid each frame, which is cheap in comparison.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The game crashes at start-up with `pygame.error: No video mode has been set`. Tap the line that causes it.',
      lines: [
        'import pygame',
        'pygame.init()',
        'image = pygame.image.load("player.png").convert()',
        'screen = pygame.display.set_mode((640, 360))',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`convert()` needs to know the **display’s** pixel format, so a window must exist first. Create the screen with `set_mode` **before** converting any images, or the call fails.',
    },
    {
      kind: 'numeric',
      prompt: 'A game tests every pair of 1000 sprites for collision each frame with two nested loops (each pair once). How many pair tests is that? Use `n * (n - 1) / 2`.',
      answer: '499500',
      hint: '1000 * 999 = 999000, then halve it.',
      explanation: '`1000 * 999 / 2 = 499500` tests per frame. At 60 frames per second that is almost 30 million tests every second, in Python. A spatial grid reduces this to perhaps a few thousand.',
      label: 'Tests:',
    },
    {
      kind: 'concept',
      title: 'Your turn: caches, grids and a profiler',
      blocks: [
        {
          type: 'p',
          text: 'You will write an LRU cache for rendered text (with the render function passed in), a spatial grid with a pair finder that must agree with brute force, and a small profiler with a clock that the tests control. None of them needs a window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write the class `TextCache(render, capacity=3)`: an LRU cache for rendered text. `get(text, size, color)` uses the key `(text, size, color)`. If the key is cached, count a **hit**, mark it as most recently used, and return the stored value. Otherwise count a **miss**, call `render(text, size, color)`, store the result as most recently used, and if the cache now holds more than `capacity` items, **evict the least recently used one**. Provide `hits`, `misses`, `__len__`, and `keys()` returning the keys as a list from least to most recently used. Use `collections.OrderedDict`.',
      starter: `from collections import OrderedDict


class TextCache:
    def __init__(self, render, capacity=3):
        ...

    def get(self, text, size, color):
        ...

    def __len__(self):
        ...

    def keys(self):
        ...
`,
      solution: `from collections import OrderedDict


class TextCache:
    def __init__(self, render, capacity=3):
        self.render = render
        self.capacity = capacity
        self.items = OrderedDict()
        self.hits = 0
        self.misses = 0

    def get(self, text, size, color):
        key = (text, size, color)
        if key in self.items:
            self.hits += 1
            self.items.move_to_end(key)
            return self.items[key]
        self.misses += 1
        value = self.render(text, size, color)
        self.items[key] = value
        if len(self.items) > self.capacity:
            self.items.popitem(last=False)
        return value

    def __len__(self):
        return len(self.items)

    def keys(self):
        return list(self.items)
`,
      tests: `renders = []

def render(text, size, color):
    renders.append((text, size, color))
    return "surface:" + text + str(size)

W = (255, 255, 255)
c = TextCache(render, capacity=2)
assert len(c) == 0 and c.hits == 0 and c.misses == 0 and c.keys() == []
a1 = c.get("Score", 24, W)
assert a1 == "surface:Score24" and renders == [("Score", 24, W)]
assert c.misses == 1 and c.hits == 0
a2 = c.get("Score", 24, W)
assert a2 is a1 and len(renders) == 1 and c.hits == 1, "the second request is a hit: no new render"
c.get("Lives", 24, W)
assert c.keys() == [("Score", 24, W), ("Lives", 24, W)]
c.get("Score", 24, W)
assert c.keys() == [("Lives", 24, W), ("Score", 24, W)], "a hit makes it the most recently used"
c.get("Time", 24, W)
assert len(c) == 2
assert c.keys() == [("Score", 24, W), ("Time", 24, W)], "Lives was least recently used, so it was evicted"
assert len(renders) == 3
c.get("Lives", 24, W)
assert len(renders) == 4, "Lives must be rendered again after eviction"
assert c.keys() == [("Time", 24, W), ("Lives", 24, W)]
assert c.hits == 2 and c.misses == 4
c.get("Time", 32, W)
c.get("Time", 24, (255, 0, 0))
assert len(c) == 2, "size and colour are part of the key"
assert c.misses == 6
big = TextCache(render, capacity=10)
for i in range(5):
    big.get("n" + str(i), 12, W)
for i in range(5):
    big.get("n" + str(i), 12, W)
assert big.hits == 5 and big.misses == 5 and len(big) == 5`,
      checks: ['A repeated key is a hit that returns the stored object without calling `render`', 'A hit marks the key as most recently used; the oldest key is evicted when the capacity is exceeded', '`size` and `color` are part of the cache key'],
      hint: 'Keep an `OrderedDict`. On a hit use `move_to_end(key)`; after adding a new key, if `len(items) > capacity` call `popitem(last=False)` to drop the oldest.',
      explanation: 'Without a limit, a cache of rendered text would grow for ever (a timer showing a different string each frame would fill memory). LRU eviction keeps the **recently used** strings and discards the stale ones. In the game, `render` is a function that calls `font.render`.',
    },
    {
      kind: 'code',
      prompt: 'Write `SpatialGrid(cell)`. `insert(key, rect)` adds `key` to every cell the `pygame.Rect` covers: columns from `rect.left // cell` to `(rect.right - 1) // cell` and rows from `rect.top // cell` to `(rect.bottom - 1) // cell`. `query(rect)` returns the **set** of keys stored in any cell the rectangle covers. `clear()` empties the grid. Then write `collide_pairs(items, cell)`: `items` is a dictionary from an integer key to a `Rect`; build a grid, and return the **sorted list** of pairs `(a, b)` with `a < b` of keys whose rectangles really overlap (`colliderect`). It must give the same answer as testing every pair.',
      starter: `import pygame


class SpatialGrid:
    def __init__(self, cell):
        ...

    def insert(self, key, rect):
        ...

    def query(self, rect):
        ...

    def clear(self):
        ...


def collide_pairs(items, cell):
    ...
`,
      solution: `import pygame


class SpatialGrid:
    def __init__(self, cell):
        self.cell = cell
        self.cells = {}

    def _cells_for(self, rect):
        cell = self.cell
        for cx in range(rect.left // cell, (rect.right - 1) // cell + 1):
            for cy in range(rect.top // cell, (rect.bottom - 1) // cell + 1):
                yield (cx, cy)

    def insert(self, key, rect):
        for c in self._cells_for(rect):
            self.cells.setdefault(c, set()).add(key)

    def query(self, rect):
        found = set()
        for c in self._cells_for(rect):
            found |= self.cells.get(c, set())
        return found

    def clear(self):
        self.cells.clear()


def collide_pairs(items, cell):
    grid = SpatialGrid(cell)
    for key, rect in items.items():
        grid.insert(key, rect)
    pairs = set()
    for key, rect in items.items():
        for other in grid.query(rect):
            if other > key and rect.colliderect(items[other]):
                pairs.add((key, other))
    return sorted(pairs)
`,
      setup: PG_SIM,
      tests: `import random
R = pygame.Rect
g = SpatialGrid(32)
g.insert("a", R(0, 0, 10, 10))
g.insert("b", R(40, 40, 10, 10))
g.insert("wide", R(40, 0, 50, 10))
assert g.query(R(0, 0, 5, 5)) == {"a"}
assert g.query(R(35, 35, 5, 5)) == {"b"}
assert g.query(R(34, 0, 5, 5)) == {"wide"}, "wide covers cells 1 and 2 of the top row"
assert g.query(R(0, 0, 64, 64)) == {"a", "b", "wide"}
assert g.query(R(200, 200, 5, 5)) == set()
assert g.query(R(0, 0, 32, 32)) == {"a"}, "a 32 by 32 rectangle covers exactly one cell"
g.clear()
assert g.query(R(0, 0, 64, 64)) == set()

items = {0: R(0, 0, 10, 10), 1: R(5, 5, 10, 10), 2: R(100, 100, 10, 10), 3: R(10, 0, 10, 10)}
assert collide_pairs(items, 32) == [(0, 1), (1, 3)], "touching edges (0 and 3) do not collide"
assert collide_pairs({}, 32) == []
assert collide_pairs({5: R(0, 0, 4, 4)}, 32) == []
span = {1: R(30, 30, 10, 10), 2: R(35, 35, 10, 10)}
assert collide_pairs(span, 32) == [(1, 2)], "found even though both span four cells (no duplicates)"

def brute(items):
    keys = sorted(items)
    return [(a, b) for i, a in enumerate(keys) for b in keys[i + 1:] if items[a].colliderect(items[b])]

rng = random.Random(5)
for cell in (16, 32, 50):
    many = {i: R(rng.randrange(300), rng.randrange(200), rng.randrange(4, 40), rng.randrange(4, 40)) for i in range(120)}
    assert collide_pairs(many, cell) == brute(many), cell
    assert len(brute(many)) > 5, "the random test has real collisions in it"`,
      checks: ['`insert` and `query` use `left // cell` to `(right - 1) // cell` for columns and rows', '`query` returns a set of keys; a rectangle that spans cells is found from any of them', '`collide_pairs` agrees with testing every pair, lists each pair once as `(a, b)` with `a < b`, and treats touching edges as no collision'],
      hint: 'Write a helper that yields every `(cx, cy)` cell of a rectangle and use it in both `insert` and `query` (`self.cells.setdefault(cell, set()).add(key)`). In `collide_pairs`, only keep `other > key` so each pair appears once.',
      explanation: 'The grid only narrows down the **candidates**; `colliderect` still makes the final decision, so the answer is exactly the same as brute force (the last test proves it on 120 random rectangles). Rebuilding the grid each frame is cheap compared with the savings, and the cell size (about the size of a typical object) is the one setting to tune.',
    },
    {
      kind: 'code',
      prompt: 'Write the class `Profiler(clock)`. `clock` is a function that returns the current time in seconds. `section(name)` is a **context manager** (use `@contextmanager`): when the `with` block ends, **even if it raised an exception**, add `clock()` at the end minus `clock()` at the start to the total of `name` and count one call. `report()` returns a list of `(name, total, calls)` tuples sorted from the largest total to the smallest (ties keep the order in which the sections first appeared). `reset()` clears everything.',
      starter: `from contextlib import contextmanager


class Profiler:
    def __init__(self, clock):
        ...

    @contextmanager
    def section(self, name):
        ...

    def report(self):
        ...

    def reset(self):
        ...
`,
      solution: `from contextlib import contextmanager


class Profiler:
    def __init__(self, clock):
        self.clock = clock
        self.totals = {}
        self.calls = {}

    @contextmanager
    def section(self, name):
        start = self.clock()
        try:
            yield
        finally:
            elapsed = self.clock() - start
            self.totals[name] = self.totals.get(name, 0) + elapsed
            self.calls[name] = self.calls.get(name, 0) + 1

    def report(self):
        rows = [(name, self.totals[name], self.calls[name]) for name in self.totals]
        rows.sort(key=lambda row: row[1], reverse=True)
        return rows

    def reset(self):
        self.totals.clear()
        self.calls.clear()
`,
      tests: `class FakeClock:
    def __init__(self):
        self.t = 0.0

    def __call__(self):
        return self.t

    def advance(self, seconds):
        self.t += seconds

clock = FakeClock()
p = Profiler(clock)
assert p.report() == []
with p.section("update"):
    clock.advance(0.25)
with p.section("draw"):
    clock.advance(0.75)
with p.section("update"):
    clock.advance(0.25)
assert p.report() == [("draw", 0.75, 1), ("update", 0.5, 2)]
try:
    with p.section("boom"):
        clock.advance(2.0)
        raise RuntimeError("something failed")
except RuntimeError:
    pass
assert p.report()[0] == ("boom", 2.0, 1), "the time is recorded even though the block raised"
with p.section("idle"):
    pass
assert ("idle", 0.0, 1) in p.report()
p.reset()
assert p.report() == []
t = Profiler(clock)
with t.section("a"):
    clock.advance(0.5)
with t.section("b"):
    clock.advance(0.5)
assert t.report() == [("a", 0.5, 1), ("b", 0.5, 1)], "ties keep the order of first appearance"
n = Profiler(clock)
with n.section("frame"):
    clock.advance(0.25)
    with n.section("inner"):
        clock.advance(0.25)
assert n.report() == [("frame", 0.5, 1), ("inner", 0.25, 1)], "sections can be nested"
real_calls = []
timer = Profiler(lambda: real_calls.append(1) or len(real_calls))
with timer.section("x"):
    pass
assert len(real_calls) == 2, "the clock is read exactly twice per section"
assert timer.report() == [("x", 1, 1)]`,
      checks: ['`section` adds the elapsed time of the `with` block to the named total and counts the call', 'The time is recorded even if the block raises an exception', '`report` is sorted by total time, largest first, and `reset` clears everything'],
      hint: 'Inside `section`, read `start = self.clock()`, then `try: yield` and `finally:` compute the elapsed time and update `self.totals` and `self.calls` with `.get(name, 0) + ...`.',
      explanation: 'A context manager guarantees that the end of the section is recorded, even when the code inside fails. Passing the clock in is what lets the test control time exactly: in the game you pass `time.perf_counter`.',
    },
  ],
  takeaways: [
    'The **frame budget** is `1000 / fps` milliseconds: 16.7 ms at 60 FPS. Update, collisions and drawing must all fit inside it.',
    '**Measure, do not guess**: time each part of the frame with `time.perf_counter()` (or a small profiler), fix the biggest cost, then measure again. Show the frame rate while you develop.',
    'Quick wins: `convert()` or `convert_alpha()` every image once after `set_mode`, load and scale at start-up, **cache rendered text**, and draw only what is **visible** (culling).',
    'Testing every pair of objects costs `n * (n - 1) / 2` tests (quadratic). A **spatial grid** compares only objects that share a cell, so the work grows roughly in step with `n`. The grid only chooses candidates; `colliderect` still decides.',
    'A cache needs a **limit**. An **LRU** cache (an `OrderedDict` with `move_to_end` and `popitem(last=False)`) evicts the item that has gone longest without use.',
    'Pass dependencies such as the clock and the render function **in**, so that profilers and caches are testable with fakes.',
  ],
  reading: [
    { title: 'pygame docs: Surface.convert and convert_alpha', url: 'https://www.pygame.org/docs/ref/surface.html#pygame.Surface.convert', source: 'docs', note: 'Why and when to convert surfaces.' },
    { title: 'Python docs: The Python Profilers (cProfile)', url: 'https://docs.python.org/3/library/profile.html', source: 'docs', note: 'A built-in profiler that reports time per function.' },
    { title: 'Game Programming Patterns: Spatial Partition', url: 'https://gameprogrammingpatterns.com/spatial-partition.html', source: 'book', note: 'Grids, quadtrees and why they speed up neighbour searches.' },
  ],
};
