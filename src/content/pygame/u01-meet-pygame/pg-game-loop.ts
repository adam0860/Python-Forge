import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-game-loop',
  title: 'The Game Loop',
  summary: 'The loop at the heart of every game: handle events, update the world, draw the frame, and keep time with a Clock. Includes the common loop bugs, and how to test a game’s rules apart from the window.',
  minutes: 36,
  objectives: [
    'Write the standard game loop: events, update, draw, with `Clock.tick` to limit the frame rate',
    'Handle the `QUIT` event, and explain what happens to the window if events are never read',
    'Explain why a loop without a frame limit wastes the CPU, and how `clock.tick(60)` helps',
    'Keep game rules in functions that take events and state, so that they can be tested without a window',
    'Recognise the usual loop mistakes: drawing before filling, updating inside the event loop, and quitting inside the loop',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The loop that never ends (until you say so)',
      blocks: [
        {
          type: 'p',
          text: 'The program in the last lesson drew one picture and quit. A game has to keep going: it must respond to the player many times a second. So the heart of every game is a `while` loop that runs once per frame, and does three jobs **in this order**:',
        },
        {
          type: 'table',
          headers: ['Step', 'Question it answers', 'Typical code'],
          rows: [
            ['**1. Events (input)**', 'What did the player do since the last frame?', '`for event in pygame.event.get():`'],
            ['**2. Update (logic)**', 'How does the world change because of that, and because time passed?', 'Move objects, check collisions, change score'],
            ['**3. Draw (render)**', 'What does the world look like now?', '`screen.fill(...)`, draw everything, `pygame.display.flip()`'],
          ],
          caption: 'Every frame of every game, from Pong to a 3D shooter, does these three things.',
        },
        {
          type: 'code',
          title: 'bouncing_square.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
pygame.display.set_caption("Game loop")
clock = pygame.time.Clock()

square = pygame.Rect(100, 150, 60, 60)
speed = 4
running = True

while running:
    # 1. events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            running = False

    # 2. update
    square.x += speed
    if square.right > screen.get_width() or square.left < 0:
        speed = -speed

    # 3. draw
    screen.fill((20, 24, 48))
    pygame.draw.rect(screen, (250, 200, 40), square)
    pygame.display.flip()

    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '6', text: 'A `Clock` measures time between frames and, with `tick`, makes the loop wait so that it runs at a steady rate.' },
            { lines: '8-10', text: 'The **state** of the game lives in variables outside the loop: a `Rect` for the square, its speed, and a flag `running`. The loop reads and changes them.' },
            { lines: '12', text: '`while running:` repeats until something sets `running` to `False`. The quit happens **after** the loop, so the display is still alive during the last frame.' },
            { lines: '14-18', text: '`pygame.event.get()` empties the event queue and gives a list of what happened. Handle `QUIT` (the window’s close button) so that the window can close, and `K_ESCAPE` as a convenience.' },
            { lines: '21-23', text: 'Update: move the square, and when it touches the left or right edge, reverse its direction. No drawing happens here.' },
            { lines: '26-28', text: 'Draw: clear the frame, draw everything in its new place, then show it. Drawing never changes the game state.' },
            { lines: '30', text: '`clock.tick(60)` pauses until 1/60 of a second has passed since the last call, so the loop runs at no more than 60 frames per second.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why events, update and draw stay separate',
          text: 'Keeping the three apart means you can reason about each one. Input only records what the player did. Update changes the world and never touches the screen, which makes it testable and lets you pause a game by skipping it. Draw only reads the world, so you can draw twice (for a replay or a screenshot) with no side effects. Games that mix these jobs together become hard to change.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'The loop contains no `for event in pygame.event.get()`. What happens when the program runs?',
      options: [
        { text: 'The window appears, but the operating system treats it as "not responding", and the close button does nothing, because nobody reads the event queue', correct: true, why: 'pygame (SDL) expects the program to process events regularly. If it does not, the window freezes from the system’s point of view and cannot be closed normally.' },
        { text: 'Python raises an error telling you to add an event loop', why: 'Nothing checks that. The program just misbehaves.' },
        { text: 'The game runs faster, because it skips the events', why: 'Events are cheap, and skipping them breaks input and closing.' },
        { text: 'pygame creates the event loop for you automatically', why: 'pygame never handles input for you: reading events is the program’s job.' },
      ],
      explanation: 'Even a program that needs no input must call `pygame.event.get()` (or `pygame.event.pump()`) every frame, so that the window stays alive.',
    },
    {
      kind: 'truefalse',
      prompt: 'Without `clock.tick(60)`, a simple game loop runs as fast as the computer allows, so the speed of the game depends on the machine and one CPU core is used at 100 percent.',
      answer: true,
      explanation: 'True. The loop would spin thousands of times per second. A square moving 4 pixels per frame would race across the screen on a fast computer and crawl on a slow one. `tick(60)` limits the rate, so that the game runs at roughly the same speed everywhere, and gives the CPU a rest. (Making movement independent of the frame rate is the topic of a later lesson.)',
    },
    {
      kind: 'concept',
      title: 'Events: reading what happened',
      blocks: [
        {
          type: 'p',
          text: '`pygame.event.get()` returns a **list** of `Event` objects, one for each thing that happened since you last asked, in order. Each has a `type`, and extra fields that depend on the type: a `KEYDOWN` event has `key`, a `MOUSEBUTTONDOWN` has `pos` and `button`. You compare `event.type` to the constants in `pygame`:',
        },
        {
          type: 'table',
          headers: ['Event type', 'When it happens', 'Useful fields'],
          rows: [
            ['`QUIT`', 'The player closes the window', 'none'],
            ['`KEYDOWN`, `KEYUP`', 'A key is pressed, released', '`key`, `mod`, `unicode`'],
            ['`MOUSEBUTTONDOWN`, `MOUSEBUTTONUP`', 'A mouse button is pressed, released', '`pos`, `button`'],
            ['`MOUSEMOTION`', 'The mouse moved', '`pos`, `rel`, `buttons`'],
            ['`USEREVENT` and above', 'Events that **your** game posts, such as timers', 'Anything you attach'],
          ],
          caption: 'The most common event types. The next lesson looks at input in depth.',
        },
        {
          type: 'p',
          text: 'You can build `Event` objects yourself, with `pygame.event.Event(pygame.QUIT)` or `pygame.event.Event(pygame.KEYDOWN, key=pygame.K_ESCAPE)`. That lets you test the part of a game that reacts to events with no window and no keyboard: a function that takes a list of events and the current state, and returns the new state. The exercises below do exactly that.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Get the events once per frame',
          text: 'Call `pygame.event.get()` **once** per frame and loop over the result. Each call empties the queue, so a second call in the same frame would see nothing, and events would seem to vanish. Pass the list to the functions that need it.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the heart of the loop.',
      template: `while running:
    for event in pygame.event.___():
        if event.type == pygame.___:
            running = False
    clock.___(60)`,
      templateIsCode: true,
      blanks: [{ answers: ['get'] }, { answers: ['QUIT'] }, { answers: ['tick'] }],
      wordBank: ['get', 'QUIT', 'tick', 'wait', 'EXIT', 'poll_all'],
      explanation: '`event.get()` returns the list of events, `QUIT` is the type of the close-button event, and `clock.tick(60)` limits the loop to 60 frames per second.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The loop imitates 5 frames of the game: the position grows by the speed each frame.',
      code: `x = 10
speed = 4
for frame in range(5):
    x += speed
print(x)`,
      answer: '30',
      hint: 'Five frames, each adding 4.',
      explanation: '10 + 5 x 4 = 30. A game loop is exactly this: the state (`x`) is carried from one frame to the next, and each frame changes it a little. Written as a plain `for` loop, the rules can run with no window at all.',
    },
    {
      kind: 'concept',
      title: 'Common mistakes in the loop',
      blocks: [
        {
          type: 'table',
          headers: ['Symptom', 'Cause', 'Fix'],
          rows: [
            ['Window freezes, cannot be closed', 'No `event.get()` (or the loop is blocked by a long calculation or `time.sleep`)', 'Process events every frame; keep each frame short'],
            ['Objects leave a smear behind them', 'No `screen.fill()` at the start of drawing', 'Clear first, then draw everything'],
            ['Nothing is drawn', 'No `display.flip()`, or drawing happened before the fill', 'Order: fill, draw, flip'],
            ['Everything moves at a different speed on another computer', 'No `clock.tick()`, or movement tied to frames', 'Limit the rate; later, use delta time'],
            ['`pygame.error: video system not initialized`', '`pygame.quit()` is inside the loop, or events are read after quitting', 'Quit once, after the loop'],
            ['Input is missed or happens twice', 'More than one `event.get()` per frame', 'Call it once and pass the list on'],
            ['The game gets slower the longer it runs', 'Objects are created every frame and never removed', 'Remove dead objects; see the sprite lessons'],
          ],
          caption: 'Nearly every beginner bug is one of these.',
        },
        {
          type: 'p',
          text: 'When something odd happens, the first questions to ask are: is the loop running (print a frame counter once a second)? Are the events being read? Is the drawing order right? A one-line `print` in the loop is a perfectly good debugger at this stage.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This loop raises `pygame.error: video system not initialized` on the second pass. Tap the line that makes it fail.',
      lines: [
        'running = True',
        'while running:',
        '    pygame.quit()',
        '    for event in pygame.event.get():',
        '        if event.type == pygame.QUIT:',
        '            running = False',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The cause is `pygame.quit()` inside the loop: it shuts pygame down in the first frame, so the following `pygame.event.get()` has no event system to ask. (The error is *raised* on line 4, but the *mistake* is line 3.) Call `pygame.quit()` once, after the loop ends.',
    },
    {
      kind: 'numeric',
      prompt: 'A game runs at 60 frames per second and a square moves 5 pixels per frame. How many pixels does it move in 2 seconds?',
      answer: '600',
      hint: 'Frames in 2 seconds, times pixels per frame.',
      explanation: '2 seconds x 60 frames x 5 pixels = 600 pixels. If the computer could only manage 30 frames per second, it would move just 300 pixels: the reason for the **delta time** lesson later, which ties movement to seconds rather than frames.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the rules inside the loop',
      blocks: [
        {
          type: 'p',
          text: 'You will write the parts of a game loop as plain functions: one that reacts to events, one that moves a bouncing object for some frames, and one that measures the frame rate from timings. The first uses `pygame.event.Event` objects, so the real pygame is used, and the test needs no window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `process_events(events, state)`. `state` is a dictionary with the keys `"running"` and `"paused"`. Go through the events in order. A `QUIT` event sets `running` to `False`. A `KEYDOWN` of `pygame.K_ESCAPE` also sets `running` to `False`. A `KEYDOWN` of `pygame.K_p` **toggles** `paused`. Other events are ignored. Return a **new** dictionary (do not change the one given).',
      starter: `import pygame


def process_events(events, state):
    ...
`,
      solution: `import pygame


def process_events(events, state):
    new = dict(state)
    for event in events:
        if event.type == pygame.QUIT:
            new["running"] = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                new["running"] = False
            elif event.key == pygame.K_p:
                new["paused"] = not new["paused"]
    return new
`,
      setup: PG_SIM,
      tests: `E = pygame.event.Event
start = {"running": True, "paused": False}
assert process_events([], start) == start
assert process_events([E(pygame.QUIT)], start) == {"running": False, "paused": False}
assert process_events([E(pygame.KEYDOWN, key=pygame.K_ESCAPE)], start)["running"] is False
assert process_events([E(pygame.KEYDOWN, key=pygame.K_p)], start) == {"running": True, "paused": True}
twice = process_events([E(pygame.KEYDOWN, key=pygame.K_p), E(pygame.KEYDOWN, key=pygame.K_p)], start)
assert twice["paused"] is False, "two toggles cancel out"
other = [E(pygame.KEYDOWN, key=pygame.K_a), E(pygame.KEYUP, key=pygame.K_p), E(pygame.MOUSEBUTTONDOWN, pos=(1, 2), button=1)]
assert process_events(other, start) == start, "other events and KEYUP are ignored"
mixed = process_events([E(pygame.KEYDOWN, key=pygame.K_p), E(pygame.QUIT)], start)
assert mixed == {"running": False, "paused": True}
assert start == {"running": True, "paused": False}, "the given state must not be changed"
assert process_events([E(pygame.KEYDOWN, key=pygame.K_p)], {"running": True, "paused": True})["paused"] is False`,
      checks: ['`QUIT` and the Escape `KEYDOWN` set `running` to `False`', '`KEYDOWN` of `K_p` toggles `paused`, and `KEYUP` and other events are ignored', 'The input dictionary is not modified: a new one is returned'],
      hint: 'Start with `new = dict(state)`. For each event check `event.type`, and for `KEYDOWN` look at `event.key`. `not new["paused"]` toggles a boolean.',
      explanation: 'The window is not needed to test how a game reacts to input: events are just objects. A function from (events, state) to a new state is easy to read, to test, and to reuse. The real loop only calls it: `state = process_events(pygame.event.get(), state)`.',
    },
    {
      kind: 'code',
      prompt: 'Write `bounce(x, speed, frames, left, right, width)`, the update rule of the bouncing square, run for a number of frames. The square’s left edge is `x` and its width is `width`. Each frame: `x` grows by `speed`; then if `x + width > right`, set `x = right - width` and reverse `speed`; or if `x < left`, set `x = left` and reverse `speed`. Return the pair `(x, speed)` after `frames` frames.',
      starter: `def bounce(x, speed, frames, left, right, width):
    ...
`,
      solution: `def bounce(x, speed, frames, left, right, width):
    for _ in range(frames):
        x += speed
        if x + width > right:
            x = right - width
            speed = -speed
        elif x < left:
            x = left
            speed = -speed
    return x, speed
`,
      tests: `assert bounce(0, 5, 0, 0, 100, 10) == (0, 5), "zero frames changes nothing"
assert bounce(0, 5, 4, 0, 100, 10) == (20, 5)
assert bounce(0, 5, 18, 0, 100, 10) == (90, 5), "touching the wall exactly is not a bounce"
assert bounce(0, 5, 19, 0, 100, 10) == (90, -5), "first frame past the right wall"
assert bounce(0, 5, 20, 0, 100, 10) == (85, -5)
assert bounce(0, 5, 37, 0, 100, 10) == (0, -5)
assert bounce(0, 5, 38, 0, 100, 10) == (0, 5), "bounces off the left wall"
assert bounce(50, -20, 2, 0, 100, 10) == (10, -20)
assert bounce(50, -20, 3, 0, 100, 10) == (0, 20)
assert bounce(0, 30, 3, 0, 100, 40) == (60, -30), "a fast square is put back inside the wall"
assert bounce(0, 30, 4, 0, 100, 40) == (30, -30)
x, s = bounce(10, 7, 100, 0, 50, 10)
assert 0 <= x <= 40, "the square never ends outside the walls"`,
      checks: ['Each frame moves by `speed`, then checks the right edge (`x + width > right`), then the left edge (`x < left`)', 'On a bounce the position is put back inside (`right - width` or `left`) and the speed is reversed', 'Returns `(x, speed)` after the given number of frames, and `frames = 0` changes nothing'],
      hint: 'Loop `for _ in range(frames)`. In the loop: `x += speed`, then `if x + width > right: ... elif x < left: ...`. Resetting `x` to the edge stops the square from sticking in the wall.',
      explanation: 'This is the update step of the bouncing square, as a pure function of its inputs. You can run a thousand frames in a test in a fraction of a second, which is impossible with a window. Putting the square back at the edge (rather than only reversing the speed) matters: otherwise a fast square can stay outside the wall and flip direction every frame.',
    },
    {
      kind: 'code',
      prompt: 'Write `average_fps(frame_times_ms)`. It takes a list of frame durations in milliseconds and returns the average frames per second, rounded to 1 decimal: 1000 divided by the average frame time. An empty list returns `0.0`. Also write `slow_frames(frame_times_ms, budget_ms)` that returns the **indexes** of the frames that took longer than the budget.',
      starter: `def average_fps(frame_times_ms):
    ...


def slow_frames(frame_times_ms, budget_ms):
    ...
`,
      solution: `def average_fps(frame_times_ms):
    if not frame_times_ms:
        return 0.0
    average = sum(frame_times_ms) / len(frame_times_ms)
    return round(1000 / average, 1)


def slow_frames(frame_times_ms, budget_ms):
    return [i for i, t in enumerate(frame_times_ms) if t > budget_ms]
`,
      tests: `assert average_fps([]) == 0.0
assert average_fps([16.67, 16.67, 16.67]) == 60.0
assert average_fps([20, 20, 20, 20]) == 50.0
assert average_fps([10, 30]) == 50.0
assert average_fps([33.3]) == 30.0
assert average_fps([8, 8, 8]) == 125.0
assert slow_frames([], 16.7) == []
assert slow_frames([16, 17, 16.7, 40, 5], 16.7) == [1, 3]
assert slow_frames([10, 10, 10], 16.7) == []
assert slow_frames([20, 20], 16.7) == [0, 1]
assert slow_frames([16.7], 16.7) == [], "exactly on budget is not slow"`,
      checks: ['`average_fps` is 1000 divided by the mean frame time, rounded to 1 decimal, and `0.0` for an empty list', '`slow_frames` returns the indexes of the frames strictly above the budget'],
      hint: 'The mean frame time is `sum(times) / len(times)`. For the indexes, `enumerate` in a list comprehension.',
      explanation: 'These two are the beginning of a frame-time profiler: `clock.get_time()` gives you each frame’s duration, and a list of them reveals the average rate and the **spikes** that cause stutter. Average FPS alone hides spikes, which is why listing the slow frames is worth the extra function.',
    },
  ],
  takeaways: [
    'Every game is a loop that repeats three steps each frame, in order: **events** (read input), **update** (change the world), **draw** (show it).',
    '`for event in pygame.event.get():` reads the queue; call it **once per frame**. Handle `QUIT`, or the window cannot be closed, and never skip reading events, or the OS thinks the program froze.',
    '`clock = pygame.time.Clock()` and `clock.tick(60)` at the end of the frame limit the speed to 60 FPS, and give the CPU a rest. Without it, the game speed depends on the machine.',
    'Game state lives in variables outside the loop and is carried from frame to frame. Draw reads the state; it never changes it.',
    'Quit **once, after** the loop: `pygame.quit()` inside the loop causes `video system not initialized`. Clear with `fill`, draw, then `flip`.',
    'Put the rules in functions that take events and state and return new state. They are then testable without a window: build events with `pygame.event.Event(...)`.',
  ],
  reading: [
    { title: 'pygame docs: pygame.event', url: 'https://www.pygame.org/docs/ref/event.html', source: 'docs', note: 'The event queue, every event type, and how to create and post your own.' },
    { title: 'pygame docs: pygame.time', url: 'https://www.pygame.org/docs/ref/time.html', source: 'docs', note: 'Clock.tick, get_fps, get_time and timers.' },
    { title: 'Game Programming Patterns: Game Loop', url: 'https://gameprogrammingpatterns.com/game-loop.html', source: 'book', note: 'A clear chapter on why the loop is structured this way, and fixed versus variable time steps.' },
    { title: 'Fix Your Timestep!', url: 'https://gafferongames.com/post/fix_your_timestep/', source: 'article', note: 'The classic article on making game speed independent of the frame rate.' },
  ],
};
