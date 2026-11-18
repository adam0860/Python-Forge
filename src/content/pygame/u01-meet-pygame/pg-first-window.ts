import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-first-window',
  title: 'Your First pygame Window',
  summary: 'Initialise pygame, open a window, understand pixel coordinates and RGB colours, draw something, show it with flip(), and shut down cleanly.',
  minutes: 32,
  objectives: [
    'Initialise pygame, create a window with `display.set_mode`, and set its title and options',
    'Explain the screen coordinate system, with the origin at the top-left and y growing downwards',
    'Describe colours as RGB tuples and mix them with arithmetic',
    'Explain why drawing needs `pygame.display.flip()` and what double buffering is',
    'Quit properly with `pygame.quit()`, and recognise the error that appears when pygame is used after quitting',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Opening a window',
      blocks: [
        {
          type: 'p',
          text: 'Every pygame program begins the same way: `pygame.init()` starts the library, and `pygame.display.set_mode((width, height))` opens the window and returns its drawing surface, which is conventionally called `screen`. Everything you draw is drawn onto `screen`. The program below opens an 800 x 600 window, paints it dark green, draws a circle in the middle, and shows the result for a moment before closing.',
        },
        {
          type: 'code',
          title: 'first_window.py',
          desktopOnly: true,
          code: `import pygame

pygame.init()
screen = pygame.display.set_mode((800, 600))
pygame.display.set_caption("My first window")

BACKGROUND = (20, 60, 40)
GOLD = (250, 200, 40)

screen.fill(BACKGROUND)
pygame.draw.circle(screen, GOLD, (400, 300), 60)
pygame.display.flip()

pygame.time.wait(1500)
pygame.quit()`,
          annotations: [
            { lines: '3', text: '`pygame.init()` initialises every pygame module that is available (display, font, mixer and others) and returns how many started successfully.' },
            { lines: '4-5', text: '`set_mode` takes a **size tuple**, `(width, height)` in pixels, and returns the **Surface** that represents the window. `set_caption` sets the title in the window’s title bar.' },
            { lines: '7-8', text: 'Colours are tuples of three whole numbers from 0 to 255: red, green and blue. Giving them names makes the code readable. Constants are written in capitals by convention.' },
            { lines: '10-11', text: '`fill` paints the whole surface. `pygame.draw.circle(surface, color, center, radius)` draws a filled circle. At this point nothing has appeared on the screen yet.' },
            { lines: '12', text: '`pygame.display.flip()` shows the finished picture. Drawing happens on a hidden **back buffer**; `flip` swaps it with the visible one.' },
            { lines: '14-15', text: 'Wait one and a half seconds, so you can see the window, and shut down. A real game replaces this with a loop, which is the next lesson.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Display options',
          text: '`set_mode((800, 600), pygame.RESIZABLE)` lets the user resize the window. `pygame.FULLSCREEN` fills the monitor, and `pygame.SCALED` renders at your chosen size and lets pygame scale it to fit the monitor, which is very handy for pixel-art games. Flags can be combined with `|`, for example `pygame.SCALED | pygame.RESIZABLE`.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After `pygame.draw.circle(screen, GOLD, (400, 300), 60)` nothing appears in the window. What is missing?',
      options: [
        { text: 'A call to `pygame.display.flip()` (or `update()`) to show what was drawn on the back buffer', correct: true, why: 'Drawing changes the hidden surface only. `flip()` presents it on the screen.' },
        { text: 'A call to `screen.show()`', why: 'Surfaces have no `show` method. The display module presents the window.' },
        { text: 'The circle needs to be created first with `pygame.Circle()`', why: 'There is no circle object: `draw.circle` paints pixels directly onto the surface.' },
        { text: 'A larger radius, because 60 pixels is too small to see', why: 'A 60-pixel circle in an 800 x 600 window is very visible. The problem is that the frame was never presented.' },
      ],
      explanation: 'Drawing in pygame is **immediate and invisible** until you call `flip()`. This lets you draw many things and show them all at once, with no flicker.',
    },
    {
      kind: 'truefalse',
      prompt: 'In pygame, the point (0, 0) is the bottom-left corner of the window, and y increases upwards as in a maths graph.',
      answer: false,
      explanation: 'False. The origin is the **top-left** corner, x grows to the right, and y grows **downwards**. This matches how images and text are stored in memory, and it is why things "fall" when you add to y. When a formula from maths has y going up, you need to flip it.',
    },
    {
      kind: 'concept',
      title: 'Coordinates and colours',
      blocks: [
        {
          type: 'p',
          text: 'The window is a grid of pixels. A position is a pair `(x, y)`: x is the number of pixels from the **left** edge, y the number from the **top** edge. In an 800 x 600 window the top-left pixel is `(0, 0)`, the middle is `(400, 300)`, and the bottom-right pixel is `(799, 599)` (the last valid pixel is one less than the size, because counting starts at 0).',
        },
        {
          type: 'table',
          headers: ['Colour', 'RGB tuple', 'Notes'],
          rows: [
            ['Black', '`(0, 0, 0)`', 'No light'],
            ['White', '`(255, 255, 255)`', 'Full red, green and blue'],
            ['Red', '`(255, 0, 0)`', 'Only the red channel'],
            ['Gold', '`(250, 200, 40)`', 'Lots of red, some green, a little blue'],
            ['Mid gray', '`(128, 128, 128)`', 'Equal amounts of each'],
            ['Transparent black', '`(0, 0, 0, 0)`', 'A fourth number, **alpha**, is opacity: 255 is solid, 0 is invisible (on surfaces that support it)'],
          ],
          caption: 'Colours are three channels from 0 to 255. Hex strings such as `#fac828` can be turned into these numbers.',
        },
        {
          type: 'p',
          text: 'You can also write `pygame.Color("gold")` or `pygame.Color("#fac828")`. Because colours are just numbers, you can **calculate** with them: mixing two colours, fading to black, or running through a rainbow are small bits of arithmetic. You will write a colour-mixing function in the exercises.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why 0 to 255',
          text: 'Each channel is stored in one byte, which holds 256 different values (0 to 255). Three bytes give 256 x 256 x 256, about 16.7 million colours, which is called 24-bit "true colour". A fourth byte for alpha makes 32 bits per pixel.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the lines that open a 640 x 480 window and show a finished frame.',
      template: `pygame.init()
screen = pygame.display.___((___, 480))
screen.fill((0, 0, 0))
pygame.display.___()`,
      templateIsCode: true,
      blanks: [{ answers: ['set_mode'] }, { answers: ['640'] }, { answers: ['flip', 'update'] }],
      wordBank: ['set_mode', '640', 'flip', 'update', 'create_window', 'show'],
      explanation: '`set_mode((640, 480))` takes a single tuple `(width, height)`, and `flip()` (or `update()`) presents what has been drawn.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. The tuple is a colour, and the code makes it half as bright.',
      code: `color = (200, 100, 50)
dim = tuple(channel // 2 for channel in color)
print(dim)`,
      answer: '(100, 50, 25)',
      hint: '`//` divides and drops any fraction.',
      explanation: 'Each channel is halved: 200 -> 100, 100 -> 50, 50 -> 25. Because colours are plain tuples, a generator expression with `tuple()` transforms them. Pygame would accept this tuple anywhere a colour is expected.',
    },
    {
      kind: 'concept',
      title: 'flip, update and double buffering',
      blocks: [
        {
          type: 'p',
          text: 'If a game drew straight onto the visible screen, you would see half-drawn frames: the background, then the player appear a moment later, flickering. Instead pygame gives you a **back buffer**, an off-screen picture you draw onto freely. When the whole frame is done, `flip()` shows it in one step. This is called **double buffering**.',
        },
        {
          type: 'table',
          headers: ['Call', 'What it does', 'When to use it'],
          rows: [
            ['`pygame.display.flip()`', 'Shows the whole back buffer', 'Almost always: simple and fast enough'],
            ['`pygame.display.update()`', 'With no argument: the same as `flip()`', 'Same as above'],
            ['`pygame.display.update(rects)`', 'Shows only the listed rectangles', 'Rarely: only for large static scenes where few things change'],
          ],
          caption: 'Presenting a frame.',
        },
        {
          type: 'p',
          text: 'Two more habits to learn now. **Clear before drawing**: every frame, start with `screen.fill(...)`, or the previous frame stays and anything that moved leaves a trail. And **quit properly**: `pygame.quit()` shuts every module down. After that, most pygame calls fail, which is the error in the next question.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code raises `pygame.error: video system not initialized`. Tap the line that raises it.',
      lines: [
        'pygame.init()',
        'screen = pygame.display.set_mode((400, 300))',
        'pygame.quit()',
        'events = pygame.event.get()',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: '`pygame.quit()` shut the display system down, so the event queue no longer exists. A loop that keeps running after `pygame.quit()` is a classic source of this error. Quit **last**, after the loop has ended.',
    },
    {
      kind: 'numeric',
      prompt: 'A circle is drawn at (400, 300) in an 800-pixel-wide window. How many pixels is its centre from the right edge of the window?',
      answer: '400',
      hint: 'The right edge is at x = 800.',
      explanation: '800 - 400 = 400 pixels. The distance from the left edge is also 400, because the circle is centred horizontally. Subtracting a position from the window size is how you measure distance to the right or bottom edge.',
      label: 'Pixels:',
    },
    {
      kind: 'concept',
      title: 'Your turn: colours and positions',
      blocks: [
        {
          type: 'p',
          text: 'Colour mixing, hex conversion, and centring something in the window are the first three "helpers" that almost every game gets. None needs a window to be tested.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `mix(c1, c2, t)`, which blends two RGB colours. With `t = 0` the result is `c1`, with `t = 1` it is `c2`, and with `t = 0.5` it is halfway. Calculate each channel as `c1 + (c2 - c1) * t`, and return a tuple of three integers, each rounded with `round()`.',
      starter: `def mix(c1, c2, t):
    ...
`,
      solution: `def mix(c1, c2, t):
    return tuple(round(a + (b - a) * t) for a, b in zip(c1, c2))
`,
      tests: `assert mix((0, 0, 0), (255, 255, 255), 0) == (0, 0, 0)
assert mix((0, 0, 0), (255, 255, 255), 1) == (255, 255, 255)
assert mix((0, 0, 0), (200, 100, 50), 0.5) == (100, 50, 25)
assert mix((255, 0, 0), (0, 0, 255), 0.2) == (204, 0, 51)
assert mix((10, 20, 30), (10, 20, 30), 0.7) == (10, 20, 30)
assert mix((200, 100, 0), (0, 100, 200), 0.25) == (150, 100, 50)
r = mix((1, 2, 3), (4, 5, 6), 0.4)
assert isinstance(r, tuple) and all(isinstance(v, int) for v in r), r`,
      checks: ['Each channel is `a + (b - a) * t`, rounded to an integer', 'Returns a tuple of three ints, and `t = 0` gives the first colour, `t = 1` the second'],
      hint: 'Use `zip(c1, c2)` to walk both colours channel by channel, and `tuple(...)` around a generator expression.',
      explanation: 'This one function gives you fades (mix with black), flashes (mix with white), and health bars that go from green to red. A value `t` between 0 and 1 that slides a result between two ends is called **linear interpolation**, or **lerp**, and it shows up all over game code.',
    },
    {
      kind: 'code',
      prompt: 'Write `hex_to_rgb(text)`, which turns a hex colour string into an `(r, g, b)` tuple. It accepts `"#ff8000"`, `"ff8000"` and the short form `"#f80"` (each digit doubled, so it means `"#ff8800"`). Letters can be upper or lower case. Any other text raises `ValueError`.',
      starter: `def hex_to_rgb(text):
    ...
`,
      solution: `def hex_to_rgb(text):
    digits = text.strip().lstrip("#")
    if len(digits) == 3:
        digits = "".join(ch * 2 for ch in digits)
    if len(digits) != 6:
        raise ValueError("expected 3 or 6 hex digits: " + text)
    try:
        return tuple(int(digits[i:i + 2], 16) for i in (0, 2, 4))
    except ValueError:
        raise ValueError("not a hex colour: " + text) from None
`,
      tests: `assert hex_to_rgb("#ff8000") == (255, 128, 0)
assert hex_to_rgb("ff8000") == (255, 128, 0)
assert hex_to_rgb("#f80") == (255, 136, 0)
assert hex_to_rgb("#FFFFFF") == (255, 255, 255)
assert hex_to_rgb("#000000") == (0, 0, 0)
assert hex_to_rgb("  #1a2B3c ") == (26, 43, 60)
for bad in ("", "#12", "#12345", "#gg0000", "red", "#1234567", "#ff80zz"):
    try:
        hex_to_rgb(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("expected ValueError for %r" % bad)`,
      checks: ['Accepts 6 digits, with or without `#`, and 3 digits by doubling each one', 'Parses each pair as base 16 into integers 0 to 255', 'Raises `ValueError` for text of the wrong length or with non-hex characters'],
      hint: 'Strip the `#`, expand 3 digits to 6 with `"".join(ch * 2 for ch in digits)`, then `int(pair, 16)` for each pair. `int` itself raises `ValueError` for bad digits.',
      explanation: 'Designers and palette websites give colours as hex strings, so a converter is handy. In pygame itself, `pygame.Color("#ff8000")` does this for you, but writing it once shows how simple the format is: two hex digits per channel.',
    },
    {
      kind: 'code',
      prompt: 'Write `centered_rect(inner_size, outer_size)`. It returns a `pygame.Rect` with the width and height of `inner_size` whose **center** is at the point `(outer_width // 2, outer_height // 2)`. Set the rect’s `center` attribute rather than calculating the corner by hand.',
      starter: `import pygame


def centered_rect(inner_size, outer_size):
    ...
`,
      solution: `import pygame


def centered_rect(inner_size, outer_size):
    rect = pygame.Rect((0, 0), inner_size)
    rect.center = (outer_size[0] // 2, outer_size[1] // 2)
    return rect
`,
      setup: PG_SIM,
      tests: `r = centered_rect((100, 50), (800, 600))
assert r == pygame.Rect(350, 275, 100, 50), r
assert r.center == (400, 300)
r = centered_rect((800, 600), (800, 600))
assert tuple(r) == (0, 0, 800, 600)
r = centered_rect((51, 51), (101, 101))
assert r.center == (50, 50) and r.size == (51, 51), r
assert tuple(r) == (25, 25, 51, 51), tuple(r)
r = centered_rect((10, 10), (11, 7))
assert r.center == (5, 3), r.center
r = centered_rect((0, 0), (200, 100))
assert r.topleft == (100, 50)`,
      checks: ['The rect has the size `inner_size`', 'Its `center` is `(outer_width // 2, outer_height // 2)`, set through the `center` attribute'],
      hint: 'Create `pygame.Rect((0, 0), inner_size)`, then assign `rect.center = (...)`. A Rect moves itself when you set one of its position attributes.',
      explanation: 'Setting `rect.center`, `rect.midbottom`, `rect.topright` and friends is how pygame code positions things without any arithmetic: the Rect works out the top-left corner. Centring a title, a menu or a sprite uses this every time.',
    },
  ],
  takeaways: [
    'Start with `pygame.init()`, create the window with `screen = pygame.display.set_mode((w, h))`, and shut down with `pygame.quit()` last.',
    'Coordinates: `(0, 0)` is the **top-left**, x grows right, y grows **down**. In a 800 x 600 window the last pixel is `(799, 599)`.',
    'Colours are `(r, g, b)` tuples of 0 to 255 (optionally with alpha), so you can calculate with them: mix, dim, interpolate.',
    'Drawing goes to a hidden back buffer. `pygame.display.flip()` (or `update()`) shows it: no flip, no picture.',
    'Clear the screen at the start of each frame with `fill`, or moving objects leave trails.',
    'Using pygame after `pygame.quit()` raises `pygame.error: video system not initialized`.',
    'Set options with flags such as `pygame.RESIZABLE`, `pygame.FULLSCREEN` and `pygame.SCALED`, combined with `|`.',
  ],
  reading: [
    { title: 'pygame docs: pygame.display', url: 'https://www.pygame.org/docs/ref/display.html', source: 'docs', note: 'set_mode, flip, update, set_caption and every window option.' },
    { title: 'pygame docs: pygame.draw', url: 'https://www.pygame.org/docs/ref/draw.html', source: 'docs', note: 'The shape drawing functions and their arguments.' },
    { title: 'pygame docs: pygame.Color', url: 'https://www.pygame.org/docs/ref/color.html', source: 'docs', note: 'Colour objects, names, hex strings, and helpers such as lerp.' },
    { title: 'pygame docs: pygame.Rect', url: 'https://www.pygame.org/docs/ref/rect.html', source: 'docs', note: 'The position attributes (center, topleft, midbottom ...) used to place things.' },
  ],
};
