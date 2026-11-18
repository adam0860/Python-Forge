import type { Lesson } from '../../types';
import { TK_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'tk-canvas-animation',
  title: 'Animation and Simple Games',
  summary: 'Animate canvas items with an after() loop: time-based movement, bouncing off walls, keyboard control, collisions and removing items. Keep the game state in plain Python and draw it, so the logic stays testable.',
  minutes: 38,
  objectives: [
    'Build an animation loop with `after()` that moves canvas items every frame',
    'Move at a speed in pixels per second using the elapsed time `dt`, so the speed does not depend on the computer',
    'Keep positions and velocities in Python variables, update them in a pure function, and then draw',
    'Read the keyboard with a set of pressed keys, and find collisions with `find_overlapping`',
    'Create items once, move them every frame, and delete them when they leave the screen',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The animation loop',
      blocks: [
        {
          type: 'p',
          text: 'Animation is a loop that runs about 60 times a second: **update** the positions a little, **draw** the result, and let the event loop run. In tkinter you build that loop from the tool you already know, [[after-method|after()]]: a `frame()` function does one step and ends with `root.after(16, frame)`. 16 ms is a little more than 1/60 of a second. Never use `while True` or `sleep`, because the window cannot repaint while your function is running.',
        },
        {
          type: 'p',
          text: 'A canvas item is created **once**, and each frame you only change its position with `canvas.move(item, dx, dy)` or `canvas.coords(item, ...)`. The ball below keeps its position and its velocity in ordinary variables and measures the real time since the previous frame (`dt`), so a velocity of `180` really means 180 pixels per second, even when a frame comes late.',
        },
        {
          type: 'code',
          title: 'bouncing_ball.py',
          desktopOnly: true,
          code: `import time
import tkinter as tk

WIDTH, HEIGHT, R = 480, 300, 15
root = tk.Tk()
root.title("Bouncing ball")
canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="#101820", highlightthickness=0)
canvas.pack()

x, y = 60.0, 60.0
vx, vy = 180.0, 120.0  # pixels per second
ball = canvas.create_oval(x - R, y - R, x + R, y + R, fill="#4cc9f0", outline="")
last = time.perf_counter()


def frame():
    global x, y, vx, vy, last
    now = time.perf_counter()
    dt = min(now - last, 0.05)
    last = now
    x += vx * dt
    y += vy * dt
    if x < R or x > WIDTH - R:
        vx = -vx
        x = max(R, min(WIDTH - R, x))
    if y < R or y > HEIGHT - R:
        vy = -vy
        y = max(R, min(HEIGHT - R, y))
    canvas.coords(ball, x - R, y - R, x + R, y + R)
    root.after(16, frame)


frame()
root.mainloop()`,
          annotations: [
            { lines: '10-13', text: 'The **state** lives in plain variables: position, velocity (in pixels per second) and the canvas item that shows it. The item is created once.' },
            { lines: '18-20', text: '`dt` is the time since the previous frame. `min(..., 0.05)` caps it so that a long pause (for example while the window is dragged) does not make the ball jump across the screen.' },
            { lines: '21-22', text: 'Distance = speed x time: this is why the speed is the same on a fast and on a slow computer.' },
            { lines: '23-28', text: 'At a wall the velocity is reversed, and the position is clamped back inside, so the ball can never get stuck outside the wall and flip again every frame.' },
            { lines: '29-30', text: 'Drawing: put the item at the new place, then schedule the next frame. `frame()` itself calls `root.after`, so the chain continues.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why measure dt instead of counting frames?',
          text: 'The `after` delay is only a minimum. A busy computer, a slow drawing step or a dragged window can make frames late. If every frame moves the ball 3 pixels, a slow machine plays the whole game in slow motion. Multiplying the speed by the real elapsed time keeps the motion correct whatever the frame rate, and every game engine, pygame included, uses the same idea.',
        },
        {
          type: 'table',
          headers: ['Task', 'Tool'],
          rows: [
            ['Run every frame', '`root.after(16, frame)` at the end of `frame` (keep the id if you need `after_cancel`)'],
            ['Move an item', '`canvas.move(item, dx, dy)` (relative) or `canvas.coords(item, x1, y1, x2, y2)` (absolute)'],
            ['Read where it is', 'Prefer your own variables. `canvas.coords(item)` returns floats if you need to ask'],
            ['Remove an item', '`canvas.delete(item)`. Do this when it leaves the screen, otherwise items pile up and slow every frame'],
            ['Show a score', 'Create one `create_text` item and change it with `canvas.itemconfig(item, text=...)`'],
            ['Pause', 'Stop rescheduling (or `after_cancel`) and start the chain again to resume. Reset `last` to the current time first'],
          ],
          caption: 'The building blocks of a canvas game loop.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why should an animation create its canvas items once and then move them, rather than deleting and re-drawing everything in every frame?',
      options: [
        { text: 'The canvas already stores and redraws its items, so changing coordinates is cheap and keeps each item’s id, tags and bindings', correct: true, why: 'Items are retained objects. `move` and `coords` update one of them, while re-creating means new ids, lost bindings, and more work and flicker for Tk.' },
        { text: 'Because `create_oval` can only be called once per canvas', why: 'You can create any number of items; the point is that you usually should not re-create them each frame.' },
        { text: 'Because deleting an item freezes the window', why: 'Deleting is fine, and you should delete items that are no longer needed (such as rocks that left the screen).' },
        { text: 'Because moved items are drawn faster by the graphics card', why: 'Tk’s canvas does not work like that; the saving is in the work that your program and Tk do.' },
      ],
      explanation: 'Create items once, update them every frame, and delete the ones that are gone for good. A game with a hundred bullets creates a bullet item when it is fired and deletes it when it hits something or leaves the canvas.',
    },
    {
      kind: 'truefalse',
      prompt: 'If a ball moves 5 pixels per frame and the frames are scheduled with `after(16, ...)`, it travels at the same speed on every computer.',
      answer: false,
      explanation: 'False. `after(16, ...)` waits **at least** 16 ms, and the work done in a frame adds to it, so a slower or busier computer produces fewer frames per second and the ball moves more slowly. Moving by `velocity * dt` (with `dt` the real time since the last frame) removes this dependence.',
    },
    {
      kind: 'concept',
      title: 'State in Python, drawing on the canvas',
      blocks: [
        {
          type: 'p',
          text: 'The bouncing ball already shows the best habit for games: keep the **game state** (positions, velocities, score) in Python values, change it with ordinary functions, and only then **draw** it. A function such as `bounce(position, velocity, dt, low, high)` knows nothing about tkinter, so you can test it, run it without a window, and later reuse it with pygame. Here is the wall bounce on one axis. The ball is reflected back by the amount that it went past the wall:',
        },
        {
          type: 'code',
          title: 'bounce_1d.py',
          runnable: true,
          code: `def bounce_1d(pos, vel, dt, low, high):
    pos += vel * dt
    if pos < low:
        pos, vel = 2 * low - pos, -vel
    elif pos > high:
        pos, vel = 2 * high - pos, -vel
    return pos, vel


pos, vel = 50, 80
for frame in range(1, 5):
    pos, vel = bounce_1d(pos, vel, 0.5, 10, 90)
    print(frame, pos, vel)`,
          output: `1 90.0 80
2 50.0 -80
3 10.0 -80
4 50.0 80`,
          annotations: [
            { lines: 2, text: 'Move first: new position = old position + velocity x time.' },
            { lines: '3-6', text: 'If the move carried the ball past a wall, mirror it back (`2 * wall - pos`) and reverse the velocity. This keeps the leftover distance instead of throwing it away.' },
            { lines: '10-13', text: 'Frame 2 overshoots the wall at 90 (the ball would be at 130) and comes back to 50, and in frame 4 it does the same at the other wall. The numbers repeat, so a test can check them exactly.' },
          ],
        },
        {
          type: 'p',
          text: 'The same split gives a clean main loop: `update(dt)` changes the state, `draw()` copies the state to the canvas, and `frame()` calls them one after the other and schedules itself again. Keeping the game rules out of the drawing code means that you can fix a bug in the physics without touching the graphics.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the frame function: move by speed times the elapsed time, update the item, and schedule the next frame.',
      template: `dt = now - last
x = x + vx * ___
canvas.coords(ball, x - r, y - r, x + r, y + r)
job = root.___(16, frame)`,
      templateIsCode: true,
      blanks: [{ answers: ['dt'] }, { answers: ['after'] }],
      wordBank: ['dt', 'after', 'sleep', 'last', 'update'],
      explanation: 'Distance = speed x time, so velocity is multiplied by `dt`. `root.after(16, frame)` schedules the next call and lets the event loop draw this frame; a `sleep` would freeze the window.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. This is the simplest wall bounce (no mirroring): the velocity is reversed once the ball is past the wall at 100.',
      code: `x, vx = 95, 10
for _ in range(3):
    x += vx
    if x > 100:
        vx = -vx
    print(x)`,
      answer: '105\n95\n85',
      hint: 'The check happens after the move, and the position is not corrected.',
      explanation: 'Frame 1: x = 105 is past 100, so vx becomes -10 (the ball is still printed at 105). Frame 2: x = 95. Frame 3: x = 85. This version lets the ball sink 5 pixels into the wall for one frame, which is why `bounce_1d` mirrors or clamps the position as well.',
    },
    {
      kind: 'concept',
      title: 'Keyboard control, collisions and cleanup',
      blocks: [
        {
          type: 'p',
          text: 'Games need to know which keys are **held**, not only which key was just pressed. The usual recipe is a `set` of key names: add `event.keysym` on `<KeyPress>`, remove it on `<KeyRelease>`, and let every frame look at the set. Collisions come from `find_overlapping` applied to the item’s own coordinates: every item that touches the box is returned, **including the item itself**, so filter it out (a tag such as `"rock"` is the easy way to say what you care about).',
        },
        {
          type: 'code',
          title: 'dodger.py',
          desktopOnly: true,
          code: `import random
import tkinter as tk

WIDTH, HEIGHT = 400, 500
root = tk.Tk()
root.title("Dodger")
canvas = tk.Canvas(root, width=WIDTH, height=HEIGHT, bg="#0b132b")
canvas.pack()
player = canvas.create_rectangle(180, 460, 220, 485, fill="#5bc0be", outline="")
score_text = canvas.create_text(10, 10, anchor="nw", fill="white", font=("Consolas", 14), text="Score: 0")
pressed = set()
score = 0
alive = True


def key_down(event):
    pressed.add(event.keysym)


def key_up(event):
    pressed.discard(event.keysym)


def spawn():
    if alive:
        x = random.randint(0, WIDTH - 30)
        canvas.create_rectangle(x, -30, x + 30, 0, fill="#ff6b6b", outline="", tags="rock")
        root.after(600, spawn)


def frame():
    global score, alive
    dx = (4 if "Right" in pressed else 0) - (4 if "Left" in pressed else 0)
    x1, _, x2, _ = canvas.coords(player)
    if x1 + dx >= 0 and x2 + dx <= WIDTH:
        canvas.move(player, dx, 0)
    canvas.move("rock", 0, 5)
    for rock in canvas.find_withtag("rock"):
        if canvas.coords(rock)[1] > HEIGHT:
            canvas.delete(rock)
            score += 1
            canvas.itemconfig(score_text, text=f"Score: {score}")
    touching = canvas.find_overlapping(*canvas.coords(player))
    if any("rock" in canvas.gettags(item) for item in touching):
        alive = False
        canvas.create_text(WIDTH // 2, HEIGHT // 2, text="Game over", fill="white", font=("Consolas", 28))
        return
    root.after(16, frame)


root.bind("<KeyPress>", key_down)
root.bind("<KeyRelease>", key_up)
spawn()
frame()
root.mainloop()`,
          annotations: [
            { lines: '9-10', text: 'The player and the score label are created once. `anchor="nw"` pins the text’s top-left corner to the point, so it grows to the right.' },
            { lines: '11-13', text: 'Game state: the set of held keys, the score and an `alive` flag that stops both loops when the game ends.' },
            { lines: '16-21', text: 'The key handlers only record what is down. Nothing moves here; movement is decided once per frame.' },
            { lines: '24-28', text: '`spawn` is a second, slower after chain (every 600 ms) that makes a new rock above the top edge, tagged `"rock"` so that all rocks can be moved or searched together.' },
            { lines: '33-36', text: 'Pressing both arrows cancels out. The check stops the player at the walls, because the move is only made when the new box is still inside the canvas.' },
            { lines: '37-42', text: '`move("rock", 0, 5)` moves **every** rock with one call. A rock that fell off the bottom is deleted and counts as a point, so items never pile up.' },
            { lines: '43-48', text: '`find_overlapping(*canvas.coords(player))` lists everything touching the player (the player included). Only tagged rocks count as a hit, and the loop ends by not calling `after` again.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Key repeat and focus',
          text: 'On some systems (Linux in particular), holding a key sends repeated release/press pairs, which makes the “set of held keys” flicker. If movement stutters, ignore a release that is followed immediately by a press, or move in bigger steps on `<KeyPress>` events. Also remember that key events go to the widget **with the focus**, which is why this program binds them on the root window.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `ValueError: not enough values to unpack (expected 4, got 0)`. Tap the line that raises it.',
      lines: [
        'ball = canvas.create_oval(10, 10, 30, 30)',
        'canvas.delete(ball)',
        'x1, y1, x2, y2 = canvas.coords(ball)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'After `delete`, the id no longer exists, and `canvas.coords(ball)` returns an **empty list** instead of raising an error, so the unpacking fails. If an item can disappear (hit by a bullet, off screen), forget its id or check `canvas.find_withtag(item)` first.',
    },
    {
      kind: 'numeric',
      prompt: 'A ball moves at 300 pixels per second and the game runs at 60 frames per second. How many pixels does it move in one frame?',
      answer: '5',
      hint: 'Distance = speed x time, with a time of 1/60 second.',
      explanation: 'dt = 1/60 s, so the distance per frame is 300 x (1/60) = 5 pixels. At 30 frames per second the same speed would give 10 pixels per frame: the motion per second stays 300 pixels, which is the benefit of using `dt`.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: moving and colliding',
      blocks: [
        {
          type: 'p',
          text: 'The first exercise is pure Python (a function of numbers, no window), and the other two use a canvas. The canvas stand-in follows real `coords`, `move`, `find_overlapping` and `delete` behaviour, so your solutions will work unchanged in a real program. Use filled shapes in your own tests: hollow shapes are only “hit” along their outline.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `step_ball(x, y, vx, vy, dt, width, height, r)` for a ball with radius `r` in a `width` x `height` box. Move it by `vx * dt` and `vy * dt`. If the **center** is now left of `r`, or right of `width - r`, mirror it back (`x = 2 * wall - x`, where `wall` is `r` or `width - r`) and reverse `vx`. Do the same for `y` and `vy`. Return `(x, y, vx, vy)`.',
      starter: `def step_ball(x, y, vx, vy, dt, width, height, r):
    ...
`,
      solution: `def step_ball(x, y, vx, vy, dt, width, height, r):
    x += vx * dt
    y += vy * dt
    if x < r:
        x, vx = 2 * r - x, -vx
    elif x > width - r:
        x, vx = 2 * (width - r) - x, -vx
    if y < r:
        y, vy = 2 * r - y, -vy
    elif y > height - r:
        y, vy = 2 * (height - r) - y, -vy
    return x, y, vx, vy
`,
      tests: `assert step_ball(50, 30, 80, 40, 0.5, 100, 60, 10) == (90.0, 50.0, 80, 40)
assert step_ball(90.0, 50.0, 80, 40, 0.5, 100, 60, 10) == (50.0, 30.0, -80, -40)
assert step_ball(50.0, 30.0, -80, -40, 0.5, 100, 60, 10) == (10.0, 10.0, -80, -40)
assert step_ball(10.0, 10.0, -80, -40, 0.5, 100, 60, 10) == (50.0, 30.0, 80, 40)
assert step_ball(85, 30, 40, 0, 0.5, 100, 60, 10) == (75.0, 30.0, -40, 0)
assert step_ball(20, 20, 0, 0, 1, 100, 60, 10) == (20, 20, 0, 0)`,
      checks: ['Moves by `velocity * dt` on both axes before checking the walls', 'Mirrors the position back by the amount of overshoot and reverses the matching velocity', 'The walls are `r` and `width - r` (or `height - r`) because `x` and `y` are the **center** of the ball'],
      hint: 'Mirror a position `p` that went past a wall `w` with `2 * w - p`. The lower walls are `r`, the upper walls `width - r` and `height - r`. Use `if/elif` for each axis.',
      explanation: 'Two copies of the 1D bounce, one per axis. Notice that the function knows nothing about tkinter: the canvas version only has to call it each frame and then `canvas.coords(ball, x - r, y - r, x + r, y + r)`.',
    },
    {
      kind: 'code',
      prompt: 'Write `bounce_item(canvas, item, vx, vy, width, height)`. Move the item by `(vx, vy)` with `canvas.move`. Then read its coordinates: if the left edge is below 0, move the item right by the overshoot and set `vx = abs(vx)`; if the right edge is past `width`, move it left by the overshoot and set `vx = -abs(vx)`. Do the same for the top and bottom edges with `height` and `vy`. Return `(vx, vy)`.',
      starter: `import tkinter as tk


def bounce_item(canvas, item, vx, vy, width, height):
    ...
`,
      solution: `import tkinter as tk


def bounce_item(canvas, item, vx, vy, width, height):
    canvas.move(item, vx, vy)
    x1, y1, x2, y2 = canvas.coords(item)
    if x1 < 0:
        canvas.move(item, -x1, 0)
        vx = abs(vx)
    elif x2 > width:
        canvas.move(item, width - x2, 0)
        vx = -abs(vx)
    if y1 < 0:
        canvas.move(item, 0, -y1)
        vy = abs(vy)
    elif y2 > height:
        canvas.move(item, 0, height - y2)
        vy = -abs(vy)
    return vx, vy
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
c = tk.Canvas(root, width=100, height=100)
c.pack()
a = c.create_rectangle(10, 10, 30, 30, fill="red")
assert bounce_item(c, a, -15, 0, 100, 100) == (15, 0)
assert c.coords(a) == [0.0, 10.0, 20.0, 30.0], c.coords(a)
b = c.create_rectangle(70, 40, 90, 60, fill="red")
assert bounce_item(c, b, 20, 10, 100, 100) == (-20, 10)
assert c.coords(b) == [80.0, 50.0, 100.0, 70.0], c.coords(b)
d = c.create_rectangle(60, 60, 90, 90, fill="red")
assert bounce_item(c, d, 20, 20, 100, 100) == (-20, -20)
assert c.coords(d) == [70.0, 70.0, 100.0, 100.0], c.coords(d)
e = c.create_rectangle(40, 10, 60, 30, fill="red")
assert bounce_item(c, e, 0, -15, 100, 100) == (0, 15)
assert c.coords(e) == [40.0, 0.0, 60.0, 20.0], c.coords(e)
f = c.create_rectangle(40, 40, 60, 60, fill="red")
assert bounce_item(c, f, 5, 5, 100, 100) == (5, 5)
assert c.coords(f) == [45.0, 45.0, 65.0, 65.0]`,
      checks: ['Moves first, then looks at `canvas.coords(item)` to find which edges went out', 'Pushes the item back inside by exactly the overshoot, so it ends touching the wall', 'Returns the new `(vx, vy)`, reversed on the axes that bounced, with the sign forced by `abs`'],
      hint: 'After the move, `x1, y1, x2, y2 = canvas.coords(item)`. Left wall: `canvas.move(item, -x1, 0)`. Right wall: `canvas.move(item, width - x2, 0)` (a negative number). Using `abs(vx)` or `-abs(vx)` stops a ball that is still outside from flipping every frame.',
      explanation: 'This is the “canvas as state” style: the item’s coordinates are the position. It is shorter than keeping separate variables but harder to test, and it only works while the item exists. The clamping with `abs` is the same safety idea as in `bouncing_ball.py`.',
    },
    {
      kind: 'code',
      prompt: 'Write `collect_coins(canvas, player)`. Find every item that overlaps the player’s box (`canvas.find_overlapping(*canvas.coords(player))`). Delete those that have the tag `"coin"`, leave all other items alone, and return how many coins were collected.',
      starter: `import tkinter as tk


def collect_coins(canvas, player):
    ...
`,
      solution: `import tkinter as tk


def collect_coins(canvas, player):
    collected = 0
    for item in canvas.find_overlapping(*canvas.coords(player)):
        if "coin" in canvas.gettags(item):
            canvas.delete(item)
            collected += 1
    return collected
`,
      setup: TK_SIM,
      tests: `root = tk.Tk()
c = tk.Canvas(root, width=300, height=300)
c.pack()
player = c.create_rectangle(40, 40, 80, 80, fill="blue")
wall = c.create_rectangle(60, 60, 70, 70, fill="gray", tags="wall")
inside = c.create_oval(50, 50, 70, 70, fill="gold", tags="coin")
partly = c.create_oval(70, 60, 90, 80, fill="gold", tags="coin")
far = c.create_oval(200, 200, 220, 220, fill="gold", tags="coin")
assert collect_coins(c, player) == 2
assert c.find_withtag("coin") == (far,), c.find_withtag("coin")
assert set(c.find_all()) == {player, wall, far}
assert collect_coins(c, player) == 0
c.move(player, 160, 160)
assert collect_coins(c, player) == 1
assert c.find_withtag("coin") == ()
assert wall in c.find_all()`,
      checks: ['Uses `find_overlapping` with the player’s own coordinates', 'Deletes only items tagged `"coin"` (not the player, and not other items such as walls)', 'Returns the number of coins deleted, and `0` when nothing overlaps'],
      hint: 'Loop over `canvas.find_overlapping(*canvas.coords(player))`. The player itself is in that list too, so test `"coin" in canvas.gettags(item)` before deleting.',
      explanation: 'The tag turns “what did I hit?” into a one-line question. The same pattern collects coins, picks up power-ups, or finds which bullets hit an enemy (tag `"bullet"`). `find_overlapping` is a bounding-box test, which is fast and good enough for most simple games.',
    },
  ],
  takeaways: [
    'Animation is a loop: **update**, **draw**, then `root.after(16, frame)`. Never use `sleep` or `while True` in tkinter. Keep the timer id if you want to pause with `after_cancel`.',
    'Create items **once** and move them (`canvas.move`, `canvas.coords`), and **delete** the ones that are gone. Items that pile up slow every frame down.',
    'Move by `velocity * dt` with `dt` measured from `time.perf_counter()` (capped, for example at 0.05 s), so that the speed does not depend on the computer.',
    'Keep game state in Python values and update it with ordinary functions (such as `step_ball`), then draw it: the logic stays testable and reusable.',
    'Held keys: a `set` filled by `<KeyPress>` and `<KeyRelease>`. Collisions: `find_overlapping(*canvas.coords(item))`, which includes the item itself, plus tags to say what counts as a hit.',
  ],
  reading: [
    { title: 'TkDocs: Canvas', url: 'https://tkdocs.com/tutorial/canvas.html', source: 'tutorial', note: 'Item handling, tags and events that animations rely on.' },
    { title: 'Python docs: time.perf_counter', url: 'https://docs.python.org/3/library/time.html#time.perf_counter', source: 'docs', note: 'The high-resolution clock to use for measuring dt.' },
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'A clear explanation of fixed and variable time steps. The ideas carry over to the pygame course.' },
    { title: 'Tk manual: canvas (find overlapping)', url: 'https://www.tcl.tk/man/tcl8.6/TkCmd/canvas.htm', source: 'docs', note: 'Exactly how overlapping and closest-item searches decide what is a hit.' },
  ],
};
