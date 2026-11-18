import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-animation',
  title: 'Sprite Sheets and Animation',
  summary: 'Slice a sprite sheet into frames, advance the frame with time (not with the loop), loop or play once, and switch between animations such as idle, walk and jump.',
  minutes: 36,
  objectives: [
    'Describe animation as a list of frames shown in turn, and a sprite sheet as one image holding them all',
    'Slice a sheet into frames with rectangles and `subsurface(...).copy()`',
    'Choose the current frame from elapsed time, so that the animation speed does not depend on the frame rate',
    'Write an `Animation` that loops or plays once, and an `Animator` that switches animations without restarting the current one',
    'Pick the right animation from the character’s state (idle, walk, jump, fall)',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A flipbook in a single picture',
      blocks: [
        {
          type: 'p',
          text: 'Animation is a trick of timing: show a series of slightly different pictures (**frames**) one after another, quickly enough, and the eye sees movement. A walking character may use 4 to 8 frames, shown at about 8 to 12 frames per second. That is much slower than the 60 frames per second of the game: the **animation rate** and the **game frame rate** are different things.',
        },
        {
          type: 'p',
          text: 'Artists usually deliver the frames in one image called a **sprite sheet**: all the frames in a grid, each the same size. One file means one load and one `convert_alpha`. Your code cuts the grid into frames **once**, at start-up, and keeps them in a list.',
        },
        {
          type: 'table',
          headers: ['Step', 'Code idea'],
          rows: [
            ['Load the sheet once', '`sheet = pygame.image.load("assets/hero.png").convert_alpha()`'],
            ['Find each frame’s rectangle', '`Rect(col * fw, row * fh, fw, fh)` for each column and row'],
            ['Cut it out', '`sheet.subsurface(rect).copy()`: an independent surface per frame'],
            ['Pick a frame by time', '`index = int(timer * anim_fps) % len(frames)`'],
            ['Draw it', '`screen.blit(frames[index], rect)`'],
          ],
          caption: 'The same five steps work for every animated character, enemy or explosion.',
        },
        {
          type: 'code',
          title: 'animation_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

sheet = pygame.image.load("assets/spritesheet.png").convert_alpha()
FRAME_W, FRAME_H = 32, 32
frames = [sheet.subsurface((i * FRAME_W, 0, FRAME_W, FRAME_H)).copy()
          for i in range(sheet.get_width() // FRAME_W)]

FPS_ANIM = 8
timer = 0.0
running = True

while running:
    dt = clock.tick(60) / 1000
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    timer += dt
    index = int(timer * FPS_ANIM) % len(frames)

    screen.fill((20, 24, 48))
    big = pygame.transform.scale(frames[index], (128, 128))
    screen.blit(big, big.get_rect(center=(320, 180)))
    pygame.display.flip()

pygame.quit()`,
          annotations: [
            { lines: '7-10', text: 'The sheet is loaded once and sliced once into a list of independent frames. `subsurface` gives a window onto the sheet; `.copy()` makes it a separate surface. A list comprehension builds the whole list.' },
            { lines: '12-13', text: 'The animation has its **own** speed in frames per second (8 here), and its own clock: `timer`.' },
            { lines: '22-23', text: 'The current frame is chosen from the **elapsed time**: `timer * 8` counts animation frames, `int` drops the fraction, and `% len(frames)` wraps around to the start. It plays at the same speed on every computer, however fast the game loop runs.' },
            { lines: '26-27', text: 'Scale the small frame up (whole-number factors keep pixel art sharp) and draw it centred.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why time and not "one frame per loop"?',
          text: '`frame += 1` each loop would run the walk cycle at 60 frames per second: a blur, and on a 144 Hz screen even faster. Deriving the frame from **seconds** keeps the legs moving at the artist’s intended speed everywhere, and lets you slow the animation for a slow character, or speed it up for a sprint, by changing one number.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A walking animation has 6 frames and should play at 10 animation frames per second. The game runs at 60 loops per second. How should the current frame be chosen?',
      options: [
        { text: 'From elapsed time: `int(timer * 10) % 6`', correct: true, why: 'Time drives the frame, so it advances every 0.1 second whether the game runs at 30, 60 or 144 loops per second.' },
        { text: 'Change frame on every loop of the game', why: 'That would play 60 animation frames per second: six times too fast, and dependent on the machine.' },
        { text: 'Draw all 6 frames in every loop', why: 'They would be drawn on top of each other, leaving only the last one visible.' },
        { text: 'Pick a random frame each loop', why: 'The result would flicker: a walk cycle has an order.' },
      ],
      explanation: 'The animation advances in **seconds**, the same idea as delta time: derive what you show from elapsed time, not from the number of loops.',
    },
    {
      kind: 'truefalse',
      prompt: 'If you cut frames with `sheet.subsurface(rect)` and do not call `.copy()`, the frames still share their pixels with the sheet, so changing a pixel in the sheet changes the frame as well.',
      answer: true,
      explanation: 'True. A subsurface is a **view** into its parent, not a duplicate: it costs almost no memory, but it also means that tinting or drawing on one changes the other. For frames that are only displayed it is fine; when you plan to modify frames (flash white on a hit), make independent copies with `.copy()`.',
    },
    {
      kind: 'concept',
      title: 'Loop or play once',
      blocks: [
        {
          type: 'p',
          text: 'Animations come in two kinds. A **looping** one (walk, idle, a spinning coin) wraps around with `%`. A **one-shot** one (an explosion, a jump take-off, a death) plays to the last frame and **stays there**, or tells the game it has finished so that the sprite can be removed. So an `Animation` needs a flag for that, and a way to say "done".',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Timing in one object',
          text: 'Put the timer, the frame list and the speed inside an `Animation` object with `update(dt)` and a `frame` property. The game then only says `anim.update(dt)` and `screen.blit(anim.frame, rect)`. This is exactly the shape the sprite lessons use for characters and effects.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that picks the frame from the time.',
      template: `timer += ___
index = int(timer * FPS_ANIM) ___ len(frames)
screen.blit(frames[___], rect)`,
      templateIsCode: true,
      blanks: [{ answers: ['dt'] }, { answers: ['%'] }, { answers: ['index'] }],
      wordBank: ['dt', '%', 'index', '//', 'timer', 'FPS_ANIM'],
      explanation: 'Add the frame time `dt`, wrap with the remainder operator `%`, and use the `index` to pick the frame.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. An animation of 4 frames runs at 8 animation frames per second and 0.62 seconds have passed. Which frame number is shown? (Frames are numbered from 0.)',
      code: `timer = 0.62
fps = 8
frames = 4
print(int(timer * fps) % frames)`,
      answer: '0',
      hint: '0.62 times 8 is 4.96. What is int(4.96), and what is that modulo 4?',
      explanation: '`int(4.96)` is 4, and `4 % 4` is 0: the animation has just completed one full cycle and wrapped back to its first frame. After 0.5 seconds it was at frame 4 % 4 = 0 too, so frame 0 is shown from 0 to 0.125 s, again from 0.5 to 0.625 s, and so on.',
    },
    {
      kind: 'concept',
      title: 'Switching animations',
      blocks: [
        {
          type: 'p',
          text: 'A character has several animations, and the game state decides which one to show: standing still means **idle**, moving on the ground means **walk**, moving up in the air **jump**, moving down in the air **fall**. Two rules keep the switching clean:',
        },
        {
          type: 'table',
          headers: ['Rule', 'Why'],
          rows: [
            ['Choose the animation from **state**, not from events', 'The picture then always matches reality, even after being hit, or landing during a walk'],
            ['Switching to the animation that is **already playing** does nothing', 'Otherwise it restarts every frame and stays stuck on frame 0'],
            ['A **new** animation starts from its first frame', 'A jump should begin at the take-off pose, not in the middle'],
            ['Flip the picture for left, don’t draw a second set', 'Half the art, and `transform.flip` is cheap if you flip once and cache'],
          ],
          caption: 'This is a small version of a state machine, which the game-states lesson takes further.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The program crashes with `IndexError: list index out of range` after a fraction of a second. Tap the line that causes it.',
      lines: [
        'frames = [f0, f1, f2, f3]',
        'frame = 0',
        'while running:',
        '    frame += 1',
        '    screen.blit(frames[frame], pos)',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The counter grows for ever, and when it reaches 4 there is no `frames[4]`. (It also starts at frame 1, skipping frame 0, and advances once per loop instead of by time.) Wrap it: `frame = (frame + 1) % len(frames)`, or better, compute the index from elapsed time as in the lesson.',
    },
    {
      kind: 'numeric',
      prompt: 'A sprite sheet is 128 pixels wide and 64 pixels high. Each frame is 32 by 32 pixels, laid out in a grid. How many frames does the sheet hold?',
      answer: '8',
      hint: 'Columns times rows.',
      explanation: '128 / 32 = 4 columns, and 64 / 32 = 2 rows, so 4 x 2 = 8 frames. Row-by-row numbering gives the first row frames 0 to 3 and the second row frames 4 to 7.',
      label: 'Frames:',
    },
    {
      kind: 'concept',
      title: 'Your turn: animation logic',
      blocks: [
        {
          type: 'p',
          text: 'You will write the sheet slicer, an `Animation` class and an `Animator` that switches between them. Frames can be any object (the tests use strings), so no pictures are needed, and the same classes will hold real surfaces in the game.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `slice_sheet(sheet_size, frame_size)` that returns the list of `pygame.Rect` for every frame of a sprite sheet, row by row (left to right, then the next row). `sheet_size` and `frame_size` are `(width, height)` pairs; only whole frames count (any leftover edge is ignored). Then write `frames_from_sheet(sheet, frame_w, frame_h)` that returns a list of **independent** surfaces cut from a `Surface`, in the same order.',
      starter: `import pygame


def slice_sheet(sheet_size, frame_size):
    ...


def frames_from_sheet(sheet, frame_w, frame_h):
    ...
`,
      solution: `import pygame


def slice_sheet(sheet_size, frame_size):
    sw, sh = sheet_size
    fw, fh = frame_size
    rects = []
    for row in range(sh // fh):
        for col in range(sw // fw):
            rects.append(pygame.Rect(col * fw, row * fh, fw, fh))
    return rects


def frames_from_sheet(sheet, frame_w, frame_h):
    rects = slice_sheet(sheet.get_size(), (frame_w, frame_h))
    return [sheet.subsurface(r).copy() for r in rects]
`,
      setup: PG_SIM,
      tests: `rects = slice_sheet((128, 64), (32, 32))
assert len(rects) == 8
assert [r.topleft for r in rects] == [(0, 0), (32, 0), (64, 0), (96, 0), (0, 32), (32, 32), (64, 32), (96, 32)]
assert all(r.size == (32, 32) for r in rects)
assert len(slice_sheet((130, 70), (32, 32))) == 8, "leftover edges are ignored"
assert slice_sheet((10, 10), (32, 32)) == []
assert [r.topleft for r in slice_sheet((6, 2), (2, 2))] == [(0, 0), (2, 0), (4, 0)]
assert len(slice_sheet((32, 96), (32, 32))) == 3

def px(s, x, y):
    return tuple(s.get_at((x, y)))[:3]

colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
sheet = pygame.Surface((8, 4))
for i, c in enumerate(colors):
    sheet.fill(c, pygame.Rect(i * 2, 0, 2, 4))
frames = frames_from_sheet(sheet, 2, 4)
assert len(frames) == 4
assert [f.get_size() for f in frames] == [(2, 4)] * 4
assert [px(f, 1, 3) for f in frames] == colors
frames[0].fill((9, 9, 9))
assert px(sheet, 0, 0) == (255, 0, 0), "frames are independent copies"
two_rows = pygame.Surface((4, 4))
two_rows.fill((1, 1, 1), pygame.Rect(0, 0, 2, 2))
two_rows.fill((2, 2, 2), pygame.Rect(2, 0, 2, 2))
two_rows.fill((3, 3, 3), pygame.Rect(0, 2, 2, 2))
two_rows.fill((4, 4, 4), pygame.Rect(2, 2, 2, 2))
assert [px(f, 0, 0)[0] for f in frames_from_sheet(two_rows, 2, 2)] == [1, 2, 3, 4], "row order"`,
      checks: ['`slice_sheet` gives one rectangle per whole frame, row by row', 'Leftover pixels at the right and bottom edges are ignored', '`frames_from_sheet` returns copies in the same order, and changing a copy leaves the sheet alone'],
      hint: 'Rows outside, columns inside: `range(sh // fh)` and `range(sw // fw)`. The rectangle is `Rect(col * fw, row * fh, fw, fh)`. For the surfaces: `sheet.subsurface(rect).copy()`.',
      explanation: 'Integer division counts the whole frames, which is also how you can read the number of frames from any sheet without hard-coding it. Cutting independent copies once, at load time, means the game loop only blits.',
    },
    {
      kind: 'code',
      prompt: 'Write a class `Animation(frames, fps, loop=True)` that holds a list of frames and plays them at `fps` frames per second. `update(dt)` adds `dt` seconds to its time. The property `frame` is the current frame: for a loop, `int(time * fps)` wrapped with `%` over the number of frames; for a one-shot (`loop=False`), the same index, but stopping at the **last** frame. The property `done` is `True` only for a one-shot animation that has reached its end: after `len(frames) / fps` seconds. `reset()` goes back to time 0.',
      starter: `class Animation:
    def __init__(self, frames, fps, loop=True):
        ...

    def update(self, dt):
        ...

    @property
    def frame(self):
        ...

    @property
    def done(self):
        ...

    def reset(self):
        ...
`,
      solution: `class Animation:
    def __init__(self, frames, fps, loop=True):
        self.frames = list(frames)
        self.fps = fps
        self.loop = loop
        self.time = 0.0

    def update(self, dt):
        self.time += dt

    @property
    def frame(self):
        index = int(self.time * self.fps)
        if self.loop:
            index %= len(self.frames)
        else:
            index = min(index, len(self.frames) - 1)
        return self.frames[index]

    @property
    def done(self):
        return (not self.loop) and self.time * self.fps >= len(self.frames)

    def reset(self):
        self.time = 0.0
`,
      tests: `a = Animation(["a", "b", "c", "d"], 4)
assert a.frame == "a" and a.done is False
a.update(0.25)
assert a.frame == "b"
a.update(0.25)
assert a.frame == "c"
a.update(0.5)
assert a.frame == "a", "looped back after one second"
a.update(0.125)
assert a.frame == "a"
a.update(0.125)
assert a.frame == "b"
assert a.done is False, "a loop is never done"
a.reset()
assert a.frame == "a"
b = Animation(["x", "y", "z"], 2, loop=False)
assert b.frame == "x" and b.done is False
b.update(0.5)
assert b.frame == "y" and b.done is False
b.update(0.5)
assert b.frame == "z" and b.done is False
b.update(0.49)
assert b.frame == "z" and b.done is False, "still the last frame, not finished yet"
b.update(0.01)
assert b.frame == "z" and b.done is True, "1.5 seconds in: done, stays on z"
b.update(100)
assert b.frame == "z" and b.done is True
b.reset()
assert b.frame == "x" and b.done is False
src = ["p", "q"]
c = Animation(src, 1)
src.append("r")
c.update(2)
assert c.frame == "p", "the list was copied"
many = Animation(list("abc"), 10)
for _ in range(100):
    many.update(0.016)
assert many.frame in "abc"`,
      checks: ['A looping animation picks `frames[int(time * fps) % n]`; a one-shot stops at the last frame', '`done` is `True` only for a one-shot after `len(frames) / fps` seconds', '`update` and `reset` change the time, and the frames list is copied'],
      hint: 'Keep `self.time`. `index = int(self.time * self.fps)`; then either `index %= n` or `index = min(index, n - 1)`. `done` is `not self.loop and self.time * self.fps >= n`.',
      explanation: 'The `done` flag is what lets a game remove an explosion once it has finished, or start the next animation. Because the whole class is driven only by `dt`, a test can step through two seconds in two lines.',
    },
    {
      kind: 'code',
      prompt: 'Write `pick_animation(vel_x, vel_y, on_ground)` that returns the name of the animation for a character: `"jump"` if in the air and moving up (`vel_y < 0`), `"fall"` if in the air and not moving up, `"walk"` if on the ground and `vel_x` is not 0, and `"idle"` otherwise. Then write a class `Animator(animations, start)`: `animations` is a dictionary from name to `Animation`; `play(name)` switches to that animation and resets it, **unless it is already the current one**; `update(dt)` updates the current animation; the property `frame` is the current animation’s frame; the attribute `name` is the current name.',
      starter: `def pick_animation(vel_x, vel_y, on_ground):
    ...


class Animator:
    def __init__(self, animations, start):
        ...

    def play(self, name):
        ...

    def update(self, dt):
        ...

    @property
    def frame(self):
        ...
`,
      solution: `def pick_animation(vel_x, vel_y, on_ground):
    if not on_ground:
        return "jump" if vel_y < 0 else "fall"
    if vel_x != 0:
        return "walk"
    return "idle"


class Animator:
    def __init__(self, animations, start):
        self.animations = animations
        self.name = start

    def play(self, name):
        if name != self.name:
            self.name = name
            self.animations[name].reset()

    def update(self, dt):
        self.animations[self.name].update(dt)

    @property
    def frame(self):
        return self.animations[self.name].frame
`,
      tests: `class Anim:
    def __init__(self, label):
        self.label = label
        self.time = 0.0
        self.resets = 0

    def reset(self):
        self.time = 0.0
        self.resets += 1

    def update(self, dt):
        self.time += dt

    @property
    def frame(self):
        return self.label + str(int(self.time * 10))

assert pick_animation(0, 0, True) == "idle"
assert pick_animation(3, 0, True) == "walk"
assert pick_animation(-3, 0, True) == "walk"
assert pick_animation(0, -5, False) == "jump"
assert pick_animation(2, -5, False) == "jump"
assert pick_animation(0, 5, False) == "fall"
assert pick_animation(0, 0, False) == "fall"
assert pick_animation(4, 5, False) == "fall"
assert pick_animation(0, 0, True) == "idle"
anims = {"idle": Anim("i"), "walk": Anim("w"), "jump": Anim("j")}
an = Animator(anims, "idle")
assert an.name == "idle" and an.frame == "i0"
an.update(0.25)
assert an.frame == "i2"
an.play("idle")
assert anims["idle"].resets == 0 and an.frame == "i2", "same animation: no restart"
an.play("walk")
assert an.name == "walk" and an.frame == "w0" and anims["walk"].resets == 1
an.update(0.3)
assert an.frame == "w3" and anims["idle"].time == 0.25, "only the current one is updated"
an.play("walk")
assert an.frame == "w3"
an.play("jump")
an.play("walk")
assert an.frame == "w0" and anims["walk"].resets == 2, "coming back restarts it"`,
      checks: ['`pick_animation` decides from the vertical state first (jump or fall in the air), then walk or idle on the ground', '`play` restarts the new animation but does nothing when asked for the current one', '`update` and `frame` use only the current animation'],
      hint: 'For `pick_animation`, test `on_ground` first. In `play`, `if name != self.name:` set the name and call `reset()` on the new animation.',
      explanation: 'Choosing the animation from the **state** each frame is robust, and "do nothing if already playing" is the one rule that stops the restart bug. This is a small finite-state machine, and the game-states lesson generalises it for whole screens.',
    },
  ],
  takeaways: [
    'An animation is a list of **frames** shown in turn at the animation’s own rate (often 8 to 12 per second), which is different from the game’s 60 loops per second.',
    'A **sprite sheet** packs the frames in a grid in one image. Slice it once at start-up: `Rect(col * fw, row * fh, fw, fh)` for each cell, and `sheet.subsurface(rect).copy()` for independent frames.',
    'Choose the frame from **elapsed time**: `int(timer * anim_fps) % len(frames)`. It then plays at the same speed on every machine.',
    '**Looping** animations wrap with `%`; **one-shot** animations stop on the last frame and report `done`, so that explosions and deaths can be removed.',
    'Wrap this in an `Animation` class with `update(dt)` and a `frame` property; use an `Animator` to switch by name, restarting only when the animation really changes.',
    'Choose the animation name from the character’s **state** (on the ground? moving? going up?), and mirror frames with `transform.flip` instead of drawing a second set.',
  ],
  reading: [
    { title: 'Aseprite', url: 'https://www.aseprite.org/', source: 'other', note: 'A popular editor for pixel art and animation that exports sprite sheets.' },
    { title: 'pygame docs: Surface.subsurface', url: 'https://www.pygame.org/docs/ref/surface.html#pygame.Surface.subsurface', source: 'docs', note: 'How a subsurface shares pixels with its parent, and its limits.' },
    { title: 'Kenney: Animated characters and tiles', url: 'https://kenney.nl/assets', source: 'other', note: 'Free sprite sheets that are ready to slice.' },
    { title: 'Wikipedia: Sprite (computer graphics)', url: 'https://en.wikipedia.org/wiki/Sprite_(computer_graphics)', source: 'wikipedia', note: 'The history of sprites and why game art is organised this way.' },
  ],
};
