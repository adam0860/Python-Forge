import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-enemy-ai',
  title: 'Enemy AI: Patrol, Sight and Pathfinding',
  summary: 'Give enemies a state machine (patrol, chase, attack), eyes that cannot see through walls, and a way to find a route around obstacles with breadth-first search.',
  minutes: 44,
  objectives: [
    'Model an enemy as a small state machine with distance thresholds, and explain why two thresholds avoid flickering',
    'Make an enemy follow waypoints at a steady speed, snapping to each one on arrival',
    'Test line of sight on a tile grid by walking the cells between two points with Bresenham’s line algorithm',
    'Find the shortest route between two cells with breadth-first search, and explain why a queue gives shortest paths',
    'Avoid the classic division-by-zero bug when steering towards a target',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Enemy AI is a small state machine',
      blocks: [
        {
          type: 'p',
          text: 'Game "artificial intelligence" is not the AI of research labs. For most enemies it is a handful of **states**, a few **rules** for moving between them, and simple **steering** inside each state. That is enough to make a guard feel alert. The state idea is the one from the game-states lesson, now applied to a single character:',
        },
        {
          type: 'table',
          headers: ['State', 'What the enemy does', 'Leaves the state when'],
          rows: [
            ['**Patrol**', 'Walks between waypoints', 'The player comes within **sight** range (and is visible)'],
            ['**Chase**', 'Moves toward the player, around obstacles', 'The player is within **reach** (attack), or farther than the **lose** range (give up)'],
            ['**Attack**', 'Strikes, stands its ground', 'The player moves farther than the **release** distance'],
          ],
          caption: 'Three states and four numbers make a convincing guard.',
        },
        {
          type: 'p',
          text: 'Notice that the distance for **starting** a chase (sight, say 200 pixels) is **smaller** than the distance for **giving up** (lose, say 260). That gap is deliberate and is called **hysteresis**: once the enemy has noticed you, it keeps following until you are clearly away. With a single threshold, a player standing right at the boundary would make the enemy flip between patrol and chase every frame, visibly jittering.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why separate thresholds for entering and leaving?',
          text: 'The rule "go to chase when the distance is 200 or less, go to patrol when it is more than 200" is **unstable** at exactly 200: a distance that wobbles between 199 and 201 toggles the state 60 times per second. Making leaving harder than entering (200 to enter, 260 to leave) gives a **dead band** in which the state stays put, and the behaviour looks calm and intentional.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'An enemy starts chasing when the player is within 200 pixels, and gives up when the player is farther than 260. What is the purpose of the 60-pixel gap?',
      options: [
        { text: 'It stops the enemy from rapidly switching state when the player hovers around the boundary (hysteresis)', correct: true, why: 'Inside the gap the current state simply continues.' },
        { text: 'It makes the enemy move faster when chasing', why: 'The gap controls state changes, not speed.' },
        { text: 'It lets the enemy see through walls', why: 'Seeing is a separate line-of-sight test.' },
        { text: 'It reduces memory use', why: 'Thresholds have no effect on memory.' },
      ],
      explanation: 'Two thresholds produce a dead band where nothing changes, so the AI looks decisive instead of twitchy.',
    },
    {
      kind: 'truefalse',
      prompt: 'Breadth-first search finds a path with the fewest steps on a grid where every move costs the same.',
      answer: true,
      explanation: 'True. BFS explores cells in rings: all cells 1 step from the start, then all cells 2 steps away, and so on. The first time it reaches the goal, no shorter route can exist. (If moves have different costs, such as mud and road, you need Dijkstra or A*.)',
    },
    {
      kind: 'concept',
      title: 'A guard you can walk away from',
      blocks: [
        {
          type: 'p',
          text: 'The program below puts a guard in a small maze. The guard patrols the four corners; if you come into view within six tiles it turns red and **chases** you, finding its way around the walls; and if you get more than nine tiles away it gives up and goes back to patrolling. You move one tile per key press. All the pathfinding and sight-testing code is explained in the next step, so for now read the structure: a state, a timer, and a goal.',
        },
        {
          type: 'code',
          title: 'guard_demo.py',
          desktopOnly: true,
          code: `import math
from collections import deque

import pygame

pygame.init()
TILE = 32
LEVEL = [
    "####################",
    "#..................#",
    "#.####.....####.##.#",
    "#.#..........#.....#",
    "#.#.####.##..#.###.#",
    "#...#......#.......#",
    "#.###..####..####..#",
    "#.....#........#...#",
    "#.#####.######.#.#.#",
    "#..................#",
    "####################",
]
ROWS, COLS = len(LEVEL), len(LEVEL[0])
WALLS = {(c, r) for r, line in enumerate(LEVEL) for c, ch in enumerate(line) if ch == "#"}
screen = pygame.display.set_mode((COLS * TILE, ROWS * TILE))
clock = pygame.time.Clock()


def bfs_path(start, goal):
    parent = {start: None}
    queue = deque([start])
    while queue:
        cell = queue.popleft()
        if cell == goal:
            path = []
            while cell is not None:
                path.append(cell)
                cell = parent[cell]
            return path[::-1]
        x, y = cell
        for nxt in ((x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y)):
            if nxt not in WALLS and nxt not in parent:
                parent[nxt] = cell
                queue.append(nxt)
    return None


def line_cells(a, b):
    x0, y0 = a
    x1, y1 = b
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    cells = []
    while True:
        cells.append((x0, y0))
        if (x0, y0) == (x1, y1):
            return cells
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def can_see(a, b, sight):
    if math.dist(a, b) > sight:
        return False
    return not any(cell in WALLS for cell in line_cells(a, b)[1:-1])


class Guard:
    WAYPOINTS = [(18, 9), (1, 9), (1, 1), (18, 1)]

    def __init__(self):
        self.cell = self.WAYPOINTS[0]
        self.target = 1
        self.state = "patrol"
        self.timer = 0.0

    def update(self, dt, player):
        distance = math.dist(self.cell, player)
        if self.state == "patrol" and can_see(self.cell, player, 6):
            self.state = "chase"
        elif self.state == "chase" and distance > 9:
            self.state = "patrol"

        self.timer += dt
        if self.timer < 0.2:
            return
        self.timer = 0.0
        if self.state == "chase":
            goal = player
        else:
            if self.cell == self.WAYPOINTS[self.target]:
                self.target = (self.target + 1) % len(self.WAYPOINTS)
            goal = self.WAYPOINTS[self.target]
        path = bfs_path(self.cell, goal)
        if path and len(path) > 1:
            self.cell = path[1]


player = (1, 1)
guard = Guard()
KEYS = {pygame.K_UP: (0, -1), pygame.K_DOWN: (0, 1), pygame.K_LEFT: (-1, 0), pygame.K_RIGHT: (1, 0)}

running = True
while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key in KEYS:
            step = KEYS[event.key]
            moved = (player[0] + step[0], player[1] + step[1])
            if moved not in WALLS:
                player = moved

    guard.update(dt, player)
    if guard.cell == player:
        player = (1, 1)

    screen.fill((20, 24, 32))
    for col, row in WALLS:
        pygame.draw.rect(screen, (70, 90, 120), (col * TILE, row * TILE, TILE, TILE))
    color = (220, 70, 70) if guard.state == "chase" else (90, 150, 240)
    pygame.draw.rect(screen, color, (guard.cell[0] * TILE + 4, guard.cell[1] * TILE + 4, 24, 24))
    pygame.draw.rect(screen, (90, 200, 120), (player[0] * TILE + 4, player[1] * TILE + 4, 24, 24))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '27-43', text: 'Breadth-first search from `start`: explained in the next step. It returns the list of cells to walk, or `None` if the goal cannot be reached.' },
            { lines: '46-64', text: 'Bresenham’s line algorithm: the cells that a straight line from `a` to `b` passes through.' },
            { lines: '67-70', text: 'The guard can see the player if they are close enough **and** no wall lies on the line between them (the first and last cells are the two characters themselves, so they are skipped with `[1:-1]`).' },
            { lines: '74-80', text: 'The guard’s whole memory: where it is, which waypoint it is heading to, its state, and a timer.' },
            { lines: '83-87', text: 'The state rules, with hysteresis: it starts chasing within 6 tiles **and** in view, but gives up only beyond 9 tiles.' },
            { lines: '89-101', text: 'Every 0.2 seconds the guard picks a goal (the player when chasing; otherwise the current waypoint, moving on to the next when it arrives), asks for a path, and takes **one step** along it. Re-planning every step makes the chase follow a moving player.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Think in steps, not frames',
          text: 'The guard moves a whole tile every 0.2 seconds instead of sliding a few pixels each frame. Grid movement like this is simple, easy to test, and a good fit for pathfinding, which works on cells. For smooth movement, keep the cell logic and animate the sprite from the old cell to the new one in between.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the line of the guard’s state rules that makes it give up the chase.',
      template: `elif self.state == "___" and distance ___ 9:
    self.state = "___"`,
      templateIsCode: true,
      blanks: [{ answers: ['chase'] }, { answers: ['>'] }, { answers: ['patrol'] }],
      wordBank: ['chase', 'patrol', '>', '<', 'attack', '=='],
      explanation: 'While in the `chase` state, if the player is farther than 9 tiles away the guard goes back to `patrol`. The give-up distance (9) is larger than the sight distance (6), which is the hysteresis.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is the queue pattern at the heart of breadth-first search: a number is taken from the **front**, and its two "children" are added to the **back**.',
      code: `from collections import deque
q = deque([1])
order = []
while q:
    n = q.popleft()
    order.append(n)
    if n < 4:
        q.append(n * 2)
        q.append(n * 2 + 1)
print(order)`,
      answer: '[1, 2, 3, 4, 5, 6, 7]',
      hint: 'Take from the left, add to the right: first-in, first-out. Which numbers are added after 1, then after 2, then after 3?',
      explanation: 'The queue goes [1], then [2, 3], then [3, 4, 5], then [4, 5, 6, 7] (numbers 4 and above add nothing). Items come out in the order they went in, so the numbers appear level by level. Breadth-first search visits cells in exactly this ring-by-ring way.',
    },
    {
      kind: 'concept',
      title: 'Seeing and finding a path',
      blocks: [
        {
          type: 'p',
          text: '**Can the guard see the player?** Being close is not enough; a wall in between must block the view. On a tile grid, the test is to list the cells that a straight line from the guard to the player passes through, and check whether any of them is a wall. Drawing a line through a grid is an old problem solved by **Bresenham’s algorithm**, which uses only integer arithmetic. The `err` variable tracks how far the true line has drifted from the cells chosen so far:',
        },
        {
          type: 'code',
          runnable: true,
          code: `def line_cells(a, b):
    x0, y0 = a
    x1, y1 = b
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    cells = []
    while True:
        cells.append((x0, y0))
        if (x0, y0) == (x1, y1):
            return cells
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


print(line_cells((0, 0), (6, 2)))`,
          output: '[(0, 0), (1, 0), (2, 1), (3, 1), (4, 1), (5, 2), (6, 2)]',
          annotations: [
            { lines: '4-7', text: '`dx` and `dy` are the distances in each direction (`dy` is stored negative, a convention that keeps the arithmetic short), and `sx`, `sy` are the directions to step: +1 or -1.' },
            { lines: '11-13', text: 'Record the current cell; stop when we reach the end.' },
            { lines: '14-20', text: 'Decide whether to step in x, in y, or in both, by comparing the accumulated error: the line is 6 across and 2 up, so it takes an upward step only every few cells.' },
          ],
        },
        {
          type: 'p',
          text: 'The line of sight is then clear if **none of the cells strictly between** the two ends is a wall: `not any(cell in walls for cell in line_cells(a, b)[1:-1])`. The slice `[1:-1]` drops the first and last cells, the two characters themselves.',
        },
        {
          type: 'p',
          text: '**How does the guard get around walls?** It needs a **path**: a list of cells from here to there that avoids the walls. **Breadth-first search (BFS)** finds the shortest one. Keep a **queue** of cells to explore, starting with the start cell. Repeatedly take the cell at the front, and add all its unvisited, non-wall neighbours to the back, remembering for each new cell **which cell it came from** (its `parent`). When the goal is reached, follow the parents backwards to rebuild the path, then reverse it.',
        },
        {
          type: 'code',
          runnable: true,
          code: `from collections import deque


def bfs_path(start, goal, walls, cols, rows):
    def ok(cell):
        return 0 <= cell[0] < cols and 0 <= cell[1] < rows and cell not in walls

    if not ok(start) or not ok(goal):
        return None
    parent = {start: None}
    queue = deque([start])
    while queue:
        cell = queue.popleft()
        if cell == goal:
            path = []
            while cell is not None:
                path.append(cell)
                cell = parent[cell]
            return path[::-1]
        x, y = cell
        for nxt in ((x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y)):
            if ok(nxt) and nxt not in parent:
                parent[nxt] = cell
                queue.append(nxt)
    return None


# a 3 by 3 map with a two-cell wall in the way
print(bfs_path((0, 0), (2, 0), {(1, 0), (1, 1)}, 3, 3))`,
          output: '[(0, 0), (0, 1), (0, 2), (1, 2), (2, 2), (2, 1), (2, 0)]',
          annotations: [
            { lines: '5-6', text: 'A cell is usable if it is inside the map and not a wall.' },
            { lines: '8-11', text: 'Give up at once if the start or goal is unusable. `parent` doubles as the **visited** set: a cell is in it once it has been queued.' },
            { lines: '13-19', text: 'Take the front cell. At the goal, walk back through the parents to build the path, then reverse it into start-to-goal order.' },
            { lines: '20-24', text: 'Queue every neighbour (up, down, left, right) not seen before, recording where it came from. Because the queue is first-in, first-out, cells are expanded in order of distance from the start.' },
            { lines: '25', text: 'If the queue empties without reaching the goal, there is no route: return `None`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a queue and not a stack?',
          text: 'A queue (first in, first out) explores in rings of equal distance, so the first path to reach the goal is a shortest one. Replace `popleft()` with `pop()` (last in, first out) and you get **depth-first search**: it dives down one corridor and finds *a* path, often a long, winding one. The two algorithms differ by one word.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The game crashes with `ZeroDivisionError: float division by zero` the moment the enemy reaches the exact position of the player. Tap the lines that cause it.',
      lines: [
        'dx, dy = player.x - enemy.x, player.y - enemy.y',
        'dist = math.hypot(dx, dy)',
        'enemy.x += dx / dist * enemy.speed * dt',
        'enemy.y += dy / dist * enemy.speed * dt',
      ],
      linesAreCode: true,
      errorLines: [3, 4],
      explanation: 'When the two positions are the same, `dist` is 0.0, and dividing by it fails. Steering code must **guard** against it: `if dist > 0:` (or `if dist > step:`). It also helps to stop when `dist <= step`, to avoid overshooting and jittering around the target.',
    },
    {
      kind: 'numeric',
      prompt: 'On a grid where you may only move up, down, left or right, how many **steps** long is the shortest path from cell (0, 0) to cell (3, 2) when there are no walls?',
      answer: '5',
      hint: 'Add the horizontal and vertical distances: 3 and 2.',
      explanation: 'With no walls, the shortest route is `3 + 2 = 5` steps (this sum is called the **Manhattan distance**). A path list of `bfs_path` would hold 6 cells, because it includes both the start and the goal.',
      label: 'Steps:',
    },
    {
      kind: 'concept',
      title: 'Your turn: build the guard’s brain',
      blocks: [
        {
          type: 'p',
          text: 'You will write the state rules, a waypoint patrol, a line-of-sight test (the Bresenham routine is supplied) and the breadth-first search. Everything is plain Python on numbers and tuples, so the tests need no window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `next_state(state, distance, sight, lose, reach, release)` returning the new state name. From `"patrol"`: go to `"chase"` when `distance <= sight`. From `"chase"`: go to `"attack"` when `distance <= reach`; otherwise go to `"patrol"` when `distance > lose`; otherwise stay. From `"attack"`: go to `"chase"` when `distance > release`; otherwise stay. Any other state is returned unchanged. Then write a class `Patroller(points, speed)` that walks around a looping list of `(x, y)` waypoints. It starts at the first point (`x`, `y` as floats) heading for the second (`index` is 1, or 0 for a single point). `update(dt)` moves toward `points[index]` by `speed * dt`; if the remaining distance is **at most** that step, it snaps exactly onto the waypoint and advances `index` (wrapping to 0), with no leftover movement.',
      starter: `import math


def next_state(state, distance, sight, lose, reach, release):
    ...


class Patroller:
    def __init__(self, points, speed):
        ...

    def update(self, dt):
        ...
`,
      solution: `import math


def next_state(state, distance, sight, lose, reach, release):
    if state == "patrol":
        return "chase" if distance <= sight else "patrol"
    if state == "chase":
        if distance <= reach:
            return "attack"
        if distance > lose:
            return "patrol"
        return "chase"
    if state == "attack":
        return "chase" if distance > release else "attack"
    return state


class Patroller:
    def __init__(self, points, speed):
        self.points = [(float(x), float(y)) for x, y in points]
        self.speed = speed
        self.x, self.y = self.points[0]
        self.index = 1 % len(self.points)

    def update(self, dt):
        tx, ty = self.points[self.index]
        dx, dy = tx - self.x, ty - self.y
        dist = math.hypot(dx, dy)
        step = self.speed * dt
        if dist <= step:
            self.x, self.y = tx, ty
            self.index = (self.index + 1) % len(self.points)
        else:
            self.x += dx / dist * step
            self.y += dy / dist * step
`,
      tests: `S = (200, 260, 40, 50)
assert next_state("patrol", 201, *S) == "patrol"
assert next_state("patrol", 200, *S) == "chase"
assert next_state("patrol", 10, *S) == "chase", "a patrol never jumps straight to attack"
assert next_state("chase", 40, *S) == "attack"
assert next_state("chase", 41, *S) == "chase"
assert next_state("chase", 260, *S) == "chase", "the dead band: no change at exactly 'lose'"
assert next_state("chase", 261, *S) == "patrol"
assert next_state("chase", 230, *S) == "chase", "between sight and lose, a chase continues"
assert next_state("attack", 50, *S) == "attack"
assert next_state("attack", 51, *S) == "chase"
assert next_state("dead", 0, *S) == "dead"
assert next_state("patrol", 230, *S) == "patrol", "230 is inside the dead band: it does not start a chase"

p = Patroller([(0, 0), (100, 0), (100, 50), (0, 50)], 100)
assert (p.x, p.y, p.index) == (0.0, 0.0, 1)
seen = []
for _ in range(14):
    p.update(0.25)
    seen.append((p.x, p.y, p.index))
assert seen == [(25.0, 0.0, 1), (50.0, 0.0, 1), (75.0, 0.0, 1), (100.0, 0.0, 2),
                (100.0, 25.0, 2), (100.0, 50.0, 3), (75.0, 50.0, 3), (50.0, 50.0, 3),
                (25.0, 50.0, 3), (0.0, 50.0, 0), (0.0, 25.0, 0), (0.0, 0.0, 1),
                (25.0, 0.0, 1), (50.0, 0.0, 1)], seen
q = Patroller([(0, 0), (3, 4)], 2.5)
q.update(1)
assert abs(q.x - 1.5) < 1e-9 and abs(q.y - 2.0) < 1e-9 and q.index == 1
q.update(1)
assert (q.x, q.y) == (3.0, 4.0) and q.index == 0
r = Patroller([(5, 5)], 10)
r.update(1)
assert (r.x, r.y, r.index) == (5.0, 5.0, 0)
big = Patroller([(0, 0), (10, 0)], 100)
big.update(1)
assert (big.x, big.y) == (10.0, 0.0), "a huge step stops on the waypoint instead of overshooting"`,
      checks: ['`next_state` uses `sight` to start a chase, `reach` to attack, and `lose` and `release` to leave, with the dead bands in between', '`Patroller` moves at `speed * dt`, snaps exactly onto a waypoint when within one step, and wraps around', 'A single-point patrol and an oversized step both behave'],
      hint: 'For `Patroller.update`: compute `dist = math.hypot(dx, dy)` and `step = self.speed * dt`. If `dist <= step`, snap to the target and advance `self.index`. Otherwise move by `dx / dist * step`.',
      explanation: 'The two thresholds you added (`sight` below `lose`, `reach` below `release`) are what make the guard’s behaviour stable. In `Patroller`, the `dist <= step` check is also what prevents the division by zero from the error question: when the distance is 0, it is certainly at most any step.',
    },
    {
      kind: 'code',
      prompt: 'The function `line_cells(a, b)` below is provided and returns the grid cells between two points, ends included. Write `line_of_sight(a, b, walls)`: `True` if **none of the cells strictly between** `a` and `b` is in the set `walls` (the two end cells are ignored, even if they are walls). Then write `can_see(enemy, player, walls, sight)`: `True` when the straight distance between the two cells (use `math.dist`) is **at most** `sight` **and** `line_of_sight` is true.',
      starter: `import math


def line_cells(a, b):
    x0, y0 = a
    x1, y1 = b
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    cells = []
    while True:
        cells.append((x0, y0))
        if (x0, y0) == (x1, y1):
            return cells
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def line_of_sight(a, b, walls):
    ...


def can_see(enemy, player, walls, sight):
    ...
`,
      solution: `import math


def line_cells(a, b):
    x0, y0 = a
    x1, y1 = b
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    cells = []
    while True:
        cells.append((x0, y0))
        if (x0, y0) == (x1, y1):
            return cells
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy


def line_of_sight(a, b, walls):
    return not any(cell in walls for cell in line_cells(a, b)[1:-1])


def can_see(enemy, player, walls, sight):
    return math.dist(enemy, player) <= sight and line_of_sight(enemy, player, walls)
`,
      tests: `assert line_cells((0, 0), (6, 2)) == [(0, 0), (1, 0), (2, 1), (3, 1), (4, 1), (5, 2), (6, 2)]
assert line_cells((2, 2), (2, 2)) == [(2, 2)]
assert line_cells((0, 0), (0, 3)) == [(0, 0), (0, 1), (0, 2), (0, 3)]
assert line_cells((5, 0), (2, 0)) == [(5, 0), (4, 0), (3, 0), (2, 0)]
walls = {(3, 2)}
assert line_of_sight((0, 2), (6, 2), walls) is False, "a wall in the middle blocks the view"
assert line_of_sight((0, 0), (6, 0), walls) is True
assert line_of_sight((0, 2), (3, 2), walls) is True, "a wall at the far end does not block: it is the target cell"
assert line_of_sight((3, 2), (6, 2), walls) is True, "standing in a wall cell is ignored too"
assert line_of_sight((1, 1), (1, 1), walls) is True
assert line_of_sight((1, 1), (2, 1), {(1, 1), (2, 1)}) is True, "adjacent cells: nothing in between"
assert line_of_sight((0, 0), (4, 4), {(2, 2)}) is False
assert line_of_sight((0, 0), (4, 4), {(2, 1)}) is True, "off the diagonal"
assert line_of_sight((0, 0), (6, 2), {(3, 1)}) is False
assert line_of_sight((0, 0), (6, 2), {(3, 2)}) is True
assert can_see((0, 0), (3, 4), set(), 5) is True, "distance 5.0 is within sight 5"
assert can_see((0, 0), (3, 4), set(), 4.9) is False
assert can_see((0, 0), (3, 4), {(1, 1)}, 5) is False, "close enough, but a wall is in the way"
assert can_see((0, 0), (3, 4), {(2, 3)}, 5) is False
assert can_see((0, 0), (3, 4), {(3, 3)}, 5) is True, "this wall is not on the line"
assert can_see((0, 0), (0, 0), set(), 0) is True`,
      checks: ['`line_of_sight` ignores the two end cells and checks only the cells strictly between them', '`can_see` needs both the distance test (`<= sight`) and a clear line', 'Adjacent or identical cells always see each other'],
      hint: '`line_cells(a, b)[1:-1]` is the list without its first and last cell. Use `any(cell in walls for cell in ...)`, and negate it.',
      explanation: 'Slicing off both ends is what lets an enemy see a player who is standing against a wall, and lets a character in a doorway see out. Notice also that `can_see` tests the cheap condition (distance) first; `and` stops there when the player is far away, so the line is only walked when it matters.',
    },
    {
      kind: 'code',
      prompt: 'Write `bfs_path(start, goal, walls, cols, rows)` that returns the **shortest** list of cells from `start` to `goal`, both included, moving up, down, left or right only (no diagonals) through cells inside `0 <= x < cols`, `0 <= y < rows` that are not in the set `walls`. Return `None` if the start or goal is a wall or outside the map, or if there is no route. If `start == goal` (and usable) return `[start]`. Use `collections.deque`.',
      starter: `from collections import deque


def bfs_path(start, goal, walls, cols, rows):
    ...
`,
      solution: `from collections import deque


def bfs_path(start, goal, walls, cols, rows):
    def ok(cell):
        return 0 <= cell[0] < cols and 0 <= cell[1] < rows and cell not in walls

    if not ok(start) or not ok(goal):
        return None
    parent = {start: None}
    queue = deque([start])
    while queue:
        cell = queue.popleft()
        if cell == goal:
            path = []
            while cell is not None:
                path.append(cell)
                cell = parent[cell]
            return path[::-1]
        x, y = cell
        for nxt in ((x, y - 1), (x, y + 1), (x - 1, y), (x + 1, y)):
            if ok(nxt) and nxt not in parent:
                parent[nxt] = cell
                queue.append(nxt)
    return None
`,
      tests: `def check(path, start, goal, walls, cols, rows):
    assert path[0] == start and path[-1] == goal
    for cell in path:
        assert 0 <= cell[0] < cols and 0 <= cell[1] < rows and cell not in walls, cell
    for a, b in zip(path, path[1:]):
        assert abs(a[0] - b[0]) + abs(a[1] - b[1]) == 1, "each step moves exactly one cell"
    assert len(set(path)) == len(path), "no cell is visited twice"

p = bfs_path((0, 0), (3, 0), set(), 5, 5)
check(p, (0, 0), (3, 0), set(), 5, 5)
assert len(p) == 4
p = bfs_path((0, 0), (2, 2), set(), 5, 5)
check(p, (0, 0), (2, 2), set(), 5, 5)
assert len(p) == 5, "Manhattan distance 4, so 5 cells"
wall = {(2, 0), (2, 1), (2, 2), (2, 3)}
p = bfs_path((0, 0), (4, 0), wall, 5, 5)
check(p, (0, 0), (4, 0), wall, 5, 5)
assert len(p) == 13, "down to the gap at the bottom row and back up: the shortest way round"
full = {(2, 0), (2, 1), (2, 2), (2, 3), (2, 4)}
assert bfs_path((0, 0), (4, 0), full, 5, 5) is None, "the wall closes the map: no route"
assert bfs_path((0, 0), (0, 0), set(), 5, 5) == [(0, 0)]
assert bfs_path((0, 0), (1, 0), {(1, 0)}, 5, 5) is None, "the goal is a wall"
assert bfs_path((1, 0), (0, 0), {(1, 0)}, 5, 5) is None, "the start is a wall"
assert bfs_path((0, 0), (9, 9), set(), 5, 5) is None, "the goal is outside the map"
assert bfs_path((-1, 0), (1, 0), set(), 5, 5) is None
tiny = bfs_path((0, 0), (2, 0), {(1, 0), (1, 1)}, 3, 3)
assert tiny == [(0, 0), (0, 1), (0, 2), (1, 2), (2, 2), (2, 1), (2, 0)]
maze = {(1, 0), (1, 1), (1, 2), (3, 1), (3, 2), (3, 3), (3, 4)}
p = bfs_path((0, 0), (4, 4), maze, 5, 5)
check(p, (0, 0), (4, 4), maze, 5, 5)
assert len(p) == 15, len(p)`,
      checks: ['The path starts at `start`, ends at `goal`, moves one orthogonal cell at a time and avoids walls', 'It is a **shortest** path (the tests check the length), found with a queue', '`None` is returned for a wall, an outside cell or an unreachable goal; `[start]` when they are equal'],
      hint: 'Keep `parent = {start: None}` and `queue = deque([start])`. Loop: `cell = queue.popleft()`; if it is the goal, follow `parent` back and reverse; else add every usable neighbour not in `parent`.',
      explanation: 'The `parent` dictionary does two jobs: it marks cells as visited (so no cell is queued twice) and it remembers how each cell was reached, which is all you need to rebuild the route. In the game, the enemy recomputes this path every step and moves along its second cell, `path[1]`.',
    },
  ],
  takeaways: [
    'Enemy AI is a small **state machine** (patrol, chase, attack) plus steering. Each state has a rule for leaving, usually a distance or a timer.',
    'Use two thresholds, **sight** below **lose** and **reach** below **release**, so that the state does not flicker when the player hovers around a boundary (hysteresis).',
    'A patrol moves toward its waypoint at `speed * dt` and **snaps** onto it when the remaining distance is within one step. Always guard `dx / dist` against `dist == 0`.',
    '**Line of sight** on a grid: list the cells on the line with **Bresenham’s algorithm**, ignore the two ends, and check that none is a wall. Test the cheap distance condition first.',
    '**Breadth-first search** (a queue and a `parent` dictionary) finds the shortest path on a grid with equal move costs, or reports that none exists. Replace the queue with a stack and it becomes depth-first search, which finds *a* path, not the shortest.',
    'For maps with different movement costs, or very large maps, step up to **Dijkstra** or **A\\***; the structure is the same, with a priority queue in place of the plain queue.',
  ],
  reading: [
    { title: 'Red Blob Games: Introduction to A*', url: 'https://www.redblobgames.com/pathfinding/a-star/introduction.html', source: 'tutorial', note: 'The best visual explanation of BFS, Dijkstra and A* on grids; follows on directly from this lesson.' },
    { title: 'Game Programming Patterns: State', url: 'https://gameprogrammingpatterns.com/state.html', source: 'book', note: 'State machines for characters, the pattern behind patrol, chase and attack.' },
    { title: 'Wikipedia: Bresenham’s line algorithm', url: 'https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm', source: 'wikipedia', note: 'The derivation of the line routine used for line of sight.' },
  ],
};
