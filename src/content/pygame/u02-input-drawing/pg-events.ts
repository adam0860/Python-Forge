import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-events',
  title: 'Events and Keyboard Input',
  summary: 'Two ways to read the player: events (things that happened) and polled state (what is held right now). Keys, the mouse, and the diagonal-speed trap.',
  minutes: 38,
  objectives: [
    'Tell apart events (`KEYDOWN`, `MOUSEBUTTONDOWN`) from polled state (`key.get_pressed()`), and pick the right one for jumping, walking and clicking',
    'Read the fields of key and mouse events: `key`, `pos`, `button`',
    'Combine held keys into a direction, and normalise it so that diagonal movement is not faster',
    'Test whether a click landed inside a rectangle with `collidepoint`',
    'Write input handling as functions of events and key state that can be tested without a window',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Events versus held keys',
      blocks: [
        {
          type: 'p',
          text: 'pygame gives you two views of the keyboard, and good games use both.',
        },
        {
          type: 'table',
          headers: ['Aspect', 'Events', 'Polling'],
          rows: [
            ['**Code**', '`for event in pygame.event.get()`', '`keys = pygame.key.get_pressed()`'],
            ['**Answers**', 'What **happened** since the last frame?', 'What is **held down** at this moment?'],
            ['**Fires**', 'Once per press (and once per release)', 'Every frame, for as long as the key is held'],
            ['**Good for**', 'Jump, shoot once, pause, menus, clicks, typing', 'Walking, steering, accelerating, holding to charge'],
            ['**Misses**', 'Nothing: even a very quick tap between two frames is queued', 'A tap shorter than one frame'],
          ],
          caption: 'Press space once to jump: an event. Hold the arrow to walk: polling.',
        },
        {
          type: 'code',
          title: 'input_demo.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((640, 360))
clock = pygame.time.Clock()

player = pygame.Rect(300, 160, 40, 40)
color = (250, 200, 40)
running = True

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False
            elif event.key == pygame.K_SPACE:
                color = (240, 90, 90)
        elif event.type == pygame.KEYUP and event.key == pygame.K_SPACE:
            color = (250, 200, 40)
        elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            player.center = event.pos

    keys = pygame.key.get_pressed()
    if keys[pygame.K_LEFT]:
        player.x -= 5
    if keys[pygame.K_RIGHT]:
        player.x += 5
    if keys[pygame.K_UP]:
        player.y -= 5
    if keys[pygame.K_DOWN]:
        player.y += 5
    player.clamp_ip(screen.get_rect())

    screen.fill((20, 24, 48))
    pygame.draw.rect(screen, color, player)
    pygame.display.flip()
    clock.tick(60)

pygame.quit()`,
          annotations: [
            { lines: '12-14', text: 'The event loop from the last lesson. `QUIT` always comes first: a game that cannot be closed is a broken game.' },
            { lines: '15-19', text: '`KEYDOWN` happens **once** when a key goes down. `event.key` holds which key, compared with constants such as `K_ESCAPE` and `K_SPACE`. Use this for one-time actions.' },
            { lines: '20-21', text: '`KEYUP` is the matching release. Here it puts the colour back when the space bar is let go.' },
            { lines: '22-23', text: 'A mouse click has `event.button` (1 is left, 2 middle, 3 right) and `event.pos`, the pixel where it happened as an `(x, y)` pair.' },
            { lines: '25-33', text: '`get_pressed()` returns a snapshot of every key. Indexing it with a constant tells whether that key is held **now**. Checked every frame, so the square keeps moving while the key is down.' },
            { lines: '34', text: '`clamp_ip` moves the rectangle (in place) so that it stays within the screen’s rectangle.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not use events for walking?',
          text: 'A held key produces only one `KEYDOWN`. If you moved the player on that event, you would have to tap the key again for every step. (pygame can repeat the event with `key.set_repeat`, but with an initial delay and an uneven rhythm.) Polling every frame gives smooth movement, and the same code works with a gamepad stick later.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Which input method fits "pressing the space bar makes the player jump once"?',
      options: [
        { text: 'A `KEYDOWN` event for `K_SPACE`', correct: true, why: 'The event fires once per press, so one press means one jump, even if the key stays down for a second.' },
        { text: '`get_pressed()[K_SPACE]` checked each frame', why: 'While the key is held this is true on every frame, so the player would jump again and again (or be launched into the sky).' },
        { text: '`pygame.mouse.get_pos()`', why: 'That is the mouse position, not the keyboard.' },
        { text: '`KEYUP`, because it is the final event', why: 'That would jump when the key is released, which feels laggy. It is fine for "charge while held, release to throw".' },
      ],
      explanation: 'One-shot actions use events; continuous actions use polled state.',
    },
    {
      kind: 'truefalse',
      prompt: 'If the player holds the left arrow for two seconds, `pygame.event.get()` returns a `KEYDOWN` event on every frame during those two seconds.',
      answer: false,
      explanation: 'False. By default there is one `KEYDOWN` when the key goes down and one `KEYUP` when it is released. The "held" state is what `get_pressed()` reports. (`pygame.key.set_repeat(delay, interval)` makes the queue produce repeated `KEYDOWN` events, which is useful for text boxes but not for movement.)',
    },
    {
      kind: 'concept',
      title: 'The mouse',
      blocks: [
        {
          type: 'table',
          headers: ['What you want', 'How', 'Result'],
          rows: [
            ['A click happened', '`event.type == pygame.MOUSEBUTTONDOWN`', '`event.pos` and `event.button` (1 left, 2 middle, 3 right, 4 and 5 are the wheel in older versions)'],
            ['The click ended', '`event.type == pygame.MOUSEBUTTONUP`', 'Same fields; good for drag and drop'],
            ['The mouse moved', '`event.type == pygame.MOUSEMOTION`', '`event.pos`, `event.rel` (how far it moved), `event.buttons`'],
            ['The wheel turned', '`event.type == pygame.MOUSEWHEEL`', '`event.y` is positive when scrolling away from you'],
            ['Where is it now?', '`pygame.mouse.get_pos()`', 'An `(x, y)` tuple'],
            ['Which buttons are down?', '`pygame.mouse.get_pressed()`', 'Three booleans: left, middle, right'],
            ['Hide the arrow', '`pygame.mouse.set_visible(False)`', 'Useful when you draw your own cursor'],
          ],
          caption: 'The same split as the keyboard: events for happenings, polling for the current state.',
        },
        {
          type: 'p',
          text: 'To find out which of your things was clicked, test the click position against each one’s `Rect`: `button_rect.collidepoint(event.pos)` is `True` when the point is inside. That one method is the basis of all menus, buttons and "click the enemy" games.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Events carry their own data',
          text: 'Use `event.pos` for a click, not `get_pos()`. The event records where the mouse was **when the click happened**; by the time your code runs, the mouse may already have moved on a few pixels.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that reacts to a left click inside a button.',
      template: `for event in pygame.event.get():
    if event.type == pygame.___:
        if event.button == ___ and button.___(event.pos):
            print("clicked")`,
      templateIsCode: true,
      blanks: [{ answers: ['MOUSEBUTTONDOWN'] }, { answers: ['1'] }, { answers: ['collidepoint'] }],
      wordBank: ['MOUSEBUTTONDOWN', '1', 'collidepoint', 'colliderect', '0', 'KEYDOWN'],
      explanation: '`MOUSEBUTTONDOWN` is the click event, the left button is number 1, and `collidepoint` checks whether a point is inside a rectangle.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Moving diagonally means going 1 right and 1 down. The code divides by the length to make the move 1 long (a "unit" vector), and prints the x part rounded to 2 decimals.',
      code: `x = 1
y = 1
length = (x * x + y * y) ** 0.5
print(round(x / length, 2))`,
      answer: '0.71',
      hint: 'The length is the square root of 2, about 1.414.',
      explanation: 'Going 1 right and 1 down covers a distance of √2 ≈ 1.41, which is 41 percent further than 1 step in a straight line. Dividing by the length gives 0.71 for each axis, so the diagonal is the same speed as a straight move.',
    },
    {
      kind: 'concept',
      title: 'Directions from keys, and the diagonal trap',
      blocks: [
        {
          type: 'p',
          text: 'The code above moves 5 pixels per frame horizontally **and** 5 vertically when two arrows are held. The player then travels 5 × √2 ≈ 7.07 pixels per frame diagonally: **41 percent faster**. This is a bug in countless games. The fix is to collect the keys into a direction first, then **normalise** it to length 1, then multiply by the speed:',
        },
        {
          type: 'code',
          code: `def direction(keys):
    d = pygame.Vector2(0, 0)
    if keys[pygame.K_LEFT]:
        d.x -= 1
    if keys[pygame.K_RIGHT]:
        d.x += 1
    if keys[pygame.K_UP]:
        d.y -= 1
    if keys[pygame.K_DOWN]:
        d.y += 1
    if d.length() > 0:
        d = d.normalize()
    return d`,
          annotations: [
            { lines: '2', text: '`Vector2` is pygame’s 2D vector: an `(x, y)` pair that knows its length, how to normalise, add, scale and more. The next lessons use it a lot.' },
            { lines: '3-10', text: 'Adding and subtracting makes opposite keys cancel out: holding left **and** right gives 0, not a flicker.' },
            { lines: '11-12', text: 'A zero vector cannot be normalised (division by zero), so check the length first. After this, the vector has length exactly 1 in every direction, diagonals included.' },
          ],
        },
        {
          type: 'p',
          text: 'Then movement is `position += direction(keys) * speed`, and it is the same speed in every direction. The function takes the key state as a parameter, so a test can hand it a fake one. The exercises below do that.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This loop crashes with `AttributeError: \'Event\' object has no attribute \'key\'` as soon as the player closes the window. Tap the line with the mistake.',
      lines: [
        'for event in pygame.event.get():',
        '    if event.key == pygame.K_SPACE:',
        '        jump()',
        '    elif event.type == pygame.QUIT:',
        '        running = False',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'Not every event has a `key`: a `QUIT` event has no fields at all, and mouse events have `pos` instead. Check `event.type == pygame.KEYDOWN` **first**, and only then read `event.key`: `if event.type == pygame.KEYDOWN and event.key == pygame.K_SPACE:`.',
    },
    {
      kind: 'numeric',
      prompt: 'A player moves 5 pixels per frame along x and 5 along y at the same time, with no normalising. How far does the player travel in one frame, rounded to the nearest whole pixel? (Distance = square root of 5 squared plus 5 squared.)',
      answer: '7',
      hint: 'The square root of 50.',
      explanation: 'The square root of 50 is 7.07, so 7 pixels, instead of the intended 5. That is the extra speed of the diagonal.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: testable input',
      blocks: [
        {
          type: 'p',
          text: 'Three functions that turn input into decisions. The key state is passed in as a parameter (anything you can index with key constants), and events are built with `pygame.event.Event`. No window and no keyboard are needed to test them.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `direction_from_keys(keys)`. `keys` can be indexed with key constants, such as `keys[pygame.K_LEFT]`. Return a `pygame.Vector2`: x is -1 for left (`K_LEFT` or `K_a`) and +1 for right (`K_RIGHT` or `K_d`); y is -1 for up (`K_UP` or `K_w`) and +1 for down (`K_DOWN` or `K_s`). Opposite keys cancel out. If the result is not zero, normalise it so that its length is 1.',
      starter: `import pygame


def direction_from_keys(keys):
    ...
`,
      solution: `import pygame


def direction_from_keys(keys):
    d = pygame.Vector2(0, 0)
    if keys[pygame.K_LEFT] or keys[pygame.K_a]:
        d.x -= 1
    if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
        d.x += 1
    if keys[pygame.K_UP] or keys[pygame.K_w]:
        d.y -= 1
    if keys[pygame.K_DOWN] or keys[pygame.K_s]:
        d.y += 1
    if d.length() > 0:
        d = d.normalize()
    return d
`,
      setup: PG_SIM,
      tests: `from collections import defaultdict

def held(*names):
    k = defaultdict(bool)
    for n in names:
        k[n] = True
    return k

def xy(v):
    return (round(v.x, 3), round(v.y, 3))

assert xy(direction_from_keys(held())) == (0, 0)
assert xy(direction_from_keys(held(pygame.K_RIGHT))) == (1, 0)
assert xy(direction_from_keys(held(pygame.K_a))) == (-1, 0)
assert xy(direction_from_keys(held(pygame.K_UP))) == (0, -1)
assert xy(direction_from_keys(held(pygame.K_s))) == (0, 1)
assert xy(direction_from_keys(held(pygame.K_LEFT, pygame.K_RIGHT))) == (0, 0), "opposites cancel"
assert xy(direction_from_keys(held(pygame.K_a, pygame.K_d, pygame.K_w))) == (0, -1)
d = direction_from_keys(held(pygame.K_RIGHT, pygame.K_DOWN))
assert xy(d) == (0.707, 0.707), xy(d)
assert abs(d.length() - 1) < 1e-6, "diagonals must have length 1"
d = direction_from_keys(held(pygame.K_LEFT, pygame.K_UP))
assert xy(d) == (-0.707, -0.707)
assert abs(direction_from_keys(held(pygame.K_LEFT, pygame.K_w, pygame.K_a)).length() - 1) < 1e-6`,
      checks: ['Arrow keys and WASD both work, and opposite keys cancel out', 'A diagonal result has length 1 (about 0.707 on each axis)', 'No key held gives the zero vector, without a division by zero'],
      hint: 'Start with `d = pygame.Vector2(0, 0)` and adjust `d.x` and `d.y` with `+= 1` / `-= 1`. Only call `d.normalize()` when `d.length() > 0`.',
      explanation: 'This is the function you will reuse in every game. Because it takes the keys as an argument, the real game calls it with `pygame.key.get_pressed()`, and a test calls it with a fake dictionary.',
    },
    {
      kind: 'code',
      prompt: 'Write `button_at(pos, buttons)`. `buttons` is a dictionary from a name to a `pygame.Rect`. Return the name of the **first** button (in dictionary order) whose rectangle contains `pos`, or `None` if none does. Then write `clicked_buttons(events, buttons)`, which returns a list of the names clicked: one per `MOUSEBUTTONDOWN` event with `button == 1` that landed on a button, in the order of the events. Other events and clicks on empty space are ignored.',
      starter: `import pygame


def button_at(pos, buttons):
    ...


def clicked_buttons(events, buttons):
    ...
`,
      solution: `import pygame


def button_at(pos, buttons):
    for name, rect in buttons.items():
        if rect.collidepoint(pos):
            return name
    return None


def clicked_buttons(events, buttons):
    names = []
    for event in events:
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            name = button_at(event.pos, buttons)
            if name is not None:
                names.append(name)
    return names
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
buttons = {
    "play": R(10, 10, 100, 40),
    "quit": R(10, 60, 100, 40),
    "big": R(0, 0, 300, 300),
}
assert button_at((20, 20), buttons) == "play", "first match wins, even though big also contains it"
assert button_at((20, 70), buttons) == "quit"
assert button_at((200, 200), buttons) == "big"
assert button_at((400, 400), buttons) is None
assert button_at((10, 10), buttons) == "play", "top-left corner is inside"
assert button_at((110, 10), buttons) == "big", "right edge is outside play (x = 110)"
assert button_at((5, 5), {}) is None
E = pygame.event.Event
events = [
    E(pygame.MOUSEBUTTONDOWN, pos=(20, 20), button=1),
    E(pygame.MOUSEBUTTONDOWN, pos=(20, 70), button=3),
    E(pygame.MOUSEBUTTONUP, pos=(20, 20), button=1),
    E(pygame.KEYDOWN, key=pygame.K_a),
    E(pygame.MOUSEBUTTONDOWN, pos=(20, 70), button=1),
    E(pygame.MOUSEBUTTONDOWN, pos=(999, 999), button=1),
    E(pygame.MOUSEBUTTONDOWN, pos=(20, 20), button=1),
]
assert clicked_buttons(events, buttons) == ["play", "quit", "play"]
assert clicked_buttons([], buttons) == []
assert clicked_buttons(events, {}) == []`,
      checks: ['`button_at` uses `collidepoint` and returns the first matching name in order, or `None`', '`clicked_buttons` looks only at `MOUSEBUTTONDOWN` with button 1 and keeps the order of events', 'Clicks on empty space and other event types are ignored'],
      hint: 'Loop over `buttons.items()` and `return name` at the first hit. In `clicked_buttons`, check `event.type`, then `event.button`, and call `button_at(event.pos, buttons)`.',
      explanation: 'A menu is a dictionary of rectangles and a function that finds which was hit. Notice that the right edge of a `Rect` is **outside** it (`Rect(10, 10, 100, 40)` covers x from 10 to 109): rectangles include their left and top edge but not their right and bottom edge.',
    },
    {
      kind: 'code',
      prompt: 'Write `drag(rect, events)` that returns a **new** `pygame.Rect` after applying drag movement. For every `MOUSEMOTION` event in `events` whose `buttons` tuple has the left button pressed (`event.buttons[0]` is truthy), move the rectangle by `event.rel`, a pair `(dx, dy)`. Ignore all other events. Do not change the rectangle given.',
      starter: `import pygame


def drag(rect, events):
    ...
`,
      solution: `import pygame


def drag(rect, events):
    new = rect.copy()
    for event in events:
        if event.type == pygame.MOUSEMOTION and event.buttons[0]:
            new.move_ip(event.rel)
    return new
`,
      setup: PG_SIM,
      tests: `R = pygame.Rect
E = pygame.event.Event
box = R(10, 20, 30, 40)
ev = [
    E(pygame.MOUSEMOTION, pos=(15, 25), rel=(5, 5), buttons=(1, 0, 0)),
    E(pygame.MOUSEMOTION, pos=(17, 24), rel=(2, -1), buttons=(1, 0, 0)),
    E(pygame.MOUSEMOTION, pos=(50, 50), rel=(33, 26), buttons=(0, 0, 0)),
    E(pygame.MOUSEMOTION, pos=(60, 60), rel=(10, 10), buttons=(0, 1, 0)),
    E(pygame.KEYDOWN, key=pygame.K_a),
]
moved = drag(box, ev)
assert (moved.x, moved.y, moved.width, moved.height) == (17, 24, 30, 40), moved
assert (box.x, box.y) == (10, 20), "the original must not change"
assert moved is not box
same = drag(box, [])
assert (same.x, same.y) == (10, 20) and same is not box
assert drag(box, ev[2:]).topleft == (10, 20)
assert drag(box, [E(pygame.MOUSEMOTION, pos=(0, 0), rel=(-10, -20), buttons=(1, 1, 0))]).topleft == (0, 0)`,
      checks: ['Only `MOUSEMOTION` events with the left button down move the rectangle', 'The rectangle moves by `event.rel` for each such event', 'A new rectangle is returned and the original is unchanged'],
      hint: '`new = rect.copy()` makes a safe copy; `new.move_ip(event.rel)` moves a rect in place by a `(dx, dy)` pair.',
      explanation: 'Dragging is just "while the button is down, add the mouse movement to the object". `event.rel` is the distance moved **since the previous motion event**, so adding all of them keeps the object under the mouse. A real game would also check that the drag started on the object.',
    },
  ],
  takeaways: [
    '**Events** tell you what happened (once per press or release); **polling** (`key.get_pressed()`, `mouse.get_pos()`) tells you what is true right now. Use events for one-shot actions, and polling for continuous ones.',
    'Always test `event.type` before reading fields such as `event.key` or `event.pos`: not every event has them, and `QUIT` has none.',
    'Key constants: `K_SPACE`, `K_ESCAPE`, `K_LEFT`, `K_a` and so on. Mouse buttons are numbered: 1 left, 2 middle, 3 right.',
    'Click detection is `rect.collidepoint(event.pos)`. A `Rect` includes its left and top edges, but not its right and bottom.',
    'Combine held keys into a direction vector, then **normalise** it (length 1) before multiplying by the speed, or diagonals are about 41 percent faster.',
    'Handle input in functions that take events or key state as parameters: the real game passes the real input, tests pass fakes built with `pygame.event.Event`.',
  ],
  reading: [
    { title: 'pygame docs: pygame.key', url: 'https://www.pygame.org/docs/ref/key.html', source: 'docs', note: 'get_pressed, key constants, set_repeat and the text-input functions.' },
    { title: 'pygame docs: pygame.mouse', url: 'https://www.pygame.org/docs/ref/mouse.html', source: 'docs', note: 'Mouse position, buttons, visibility and cursors.' },
    { title: 'pygame docs: pygame.event', url: 'https://www.pygame.org/docs/ref/event.html', source: 'docs', note: 'The full table of event types and their fields.' },
    { title: 'Real Python: PyGame - A Primer on Game Programming in Python', url: 'https://realpython.com/pygame-a-primer/', source: 'tutorial', note: 'A long beginner tutorial with player movement and input.' },
  ],
};
