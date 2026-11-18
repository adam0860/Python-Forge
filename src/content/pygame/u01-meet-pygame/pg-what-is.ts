import type { Lesson } from '../../types';
import { PG_SIM } from '../../sims';

export const lesson: Lesson = {
  id: 'pg-what-is',
  title: 'What pygame Is and What It Is For',
  summary: 'Where pygame came from, what is inside it, what kinds of games it suits (and the ones it does not), how it compares with other tools, and how to install it and check that it works.',
  minutes: 30,
  objectives: [
    'Describe what pygame is, where it came from, and how it relates to SDL and to the pygame-ce fork',
    'Name the main pygame modules and say what each one is responsible for',
    'Judge which games pygame suits well, and when another tool would be a better choice',
    'Install pygame in a virtual environment and verify the installed version from Python',
    'Explain what a frame, a frame rate and a frame budget are',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What pygame is',
      blocks: [
        {
          type: 'p',
          text: '**pygame** is a free library that lets a Python program open a window, draw on it, read the keyboard, mouse and game controllers, play sounds, and keep time: everything the basic loop of a 2D game needs. It does not come with a level editor, a physics engine or a scene tree. It gives you the **building blocks**, and you write the game around them. That is why it is so good for learning: nothing is hidden, so you see exactly how a game works.',
        },
        {
          type: 'p',
          text: 'pygame was started by **Pete Shinners** and first released in **2000**, as a Python replacement for an older wrapper (PySDL). It is built on **SDL** (Simple DirectMedia Layer), a C library by Sam Lantinga that hides the differences between operating systems: SDL talks to Windows, macOS, Linux and the browser, and pygame makes SDL feel like Python. **pygame 2** (2020) moved to SDL2, which brought hardware-scaled windows, better input handling and support for newer operating systems. In late 2023 a group of contributors started **pygame-ce** (Community Edition), a fork with faster releases and extra features. Both are imported with the same line, `import pygame`, and almost all code works with either. This course uses the original pygame (version 2.6).',
        },
        {
          type: 'table',
          headers: ['Module', 'What it does', 'Example'],
          rows: [
            ['`pygame.display`', 'The window: create it, set its title, show the finished frame', '`pygame.display.set_mode((800, 600))`'],
            ['`pygame.event`', 'The queue of things that happened: key presses, clicks, window close', '`for event in pygame.event.get():`'],
            ['`pygame.draw`', 'Lines, rectangles, circles and polygons', '`pygame.draw.circle(screen, color, pos, 20)`'],
            ['`pygame.Surface` and `pygame.image`', 'Pictures in memory: load, copy, scale, blit onto each other', '`pygame.image.load("ship.png")`'],
            ['`pygame.Rect`', 'A rectangle with position, size and helpers for collisions', '`player.colliderect(wall)`'],
            ['`pygame.math.Vector2`', 'A 2D vector for positions, velocities and directions', '`(target - pos).normalize()`'],
            ['`pygame.sprite`', 'Sprites and groups: manage many game objects at once', '`pygame.sprite.Group()`'],
            ['`pygame.font`', 'Turn text into a Surface that can be drawn', '`font.render("Score", True, white)`'],
            ['`pygame.mixer`', 'Sound effects and music', '`pygame.mixer.Sound("jump.wav").play()`'],
            ['`pygame.time`', 'A `Clock` to keep a steady frame rate, and timers', '`clock.tick(60)`'],
            ['`pygame.key`, `pygame.mouse`', 'The current state of the keyboard and mouse', '`pygame.key.get_pressed()`'],
          ],
          caption: 'The parts of pygame that almost every game uses.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why learn the basics instead of a big engine',
          text: 'A game engine such as Godot or Unity gives you editors, physics and export tools, but it also hides the loop, the coordinates and the data structures. When you build the pieces yourself, you learn what an engine does for you, which makes you better with any engine afterwards. And a pygame game is only Python: you can read all of it, debug it with the tools you already know, and test its rules.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What is the relationship between pygame and SDL?',
      options: [
        { text: 'pygame is a Python library built on top of SDL, a C library that handles windows, input, graphics and sound on each operating system', correct: true, why: 'SDL does the system-specific work in C, and pygame exposes it with a Python-friendly interface.' },
        { text: 'SDL is a Python library that replaced pygame in 2020', why: 'SDL is written in C and is older than pygame. pygame 2 simply moved from SDL 1.2 to SDL 2.' },
        { text: 'They are two names for the same project', why: 'SDL is used by many languages and engines; pygame is one of the Python ways to use it.' },
        { text: 'SDL is an editor for building pygame games without code', why: 'SDL has no editor. It is a low-level library.' },
      ],
      explanation: 'Because SDL runs on Windows, macOS, Linux and in web browsers, the same pygame program runs on all of them with little or no change.',
    },
    {
      kind: 'truefalse',
      prompt: 'pygame includes a physics engine, a level editor and a scene system, so a complete game can be made by only configuring them.',
      answer: false,
      explanation: 'False. pygame deliberately provides only the building blocks: window, drawing, input, sound, timing and a few helpers such as Rect, Vector2 and sprites. Game rules, physics, levels and scenes are code that you write, and this course shows you how.',
    },
    {
      kind: 'concept',
      title: 'What pygame suits, and what it does not',
      blocks: [
        {
          type: 'p',
          text: 'pygame draws pictures by copying pixels on the CPU. That is plenty for the games it is used for, and it limits the games it is not used for. Python is not the fastest language, so the number of moving objects you can handle per frame is in the thousands, not the millions.',
        },
        {
          type: 'table',
          headers: ['A good fit', 'A poor fit'],
          rows: [
            ['2D arcade games, platformers, puzzle games, card and board games', '3D games with complex lighting (use Godot, Unity or Unreal)'],
            ['Prototypes and game jams: a playable idea in a weekend', 'Games with tens of thousands of animated objects on screen'],
            ['Teaching programming and game design', 'Console or mobile releases with big stores and ad networks (possible, but awkward)'],
            ['Simulations, visualisations, interactive art, AI experiments with a visual display', 'Games that need a visual editor for designers who do not code'],
            ['Training environments for reinforcement learning (many are pygame based)', 'Anything that needs shaders and GPU effects as its main feature'],
          ],
          caption: 'A rough guide. Skill and good design matter more than the tool.',
        },
        {
          type: 'table',
          headers: ['Alternative', 'Language', 'In one line'],
          rows: [
            ['**Arcade**', 'Python', 'A newer 2D library using the GPU (OpenGL); more built-in features such as physics, tile maps and cameras'],
            ['**pyglet**', 'Python', 'A windowing and multimedia library with OpenGL; good when you want GPU drawing'],
            ['**raylib** (Python bindings)', 'C with bindings', 'A tiny, friendly game library with a similar feel to pygame and fast drawing'],
            ['**Godot**', 'GDScript (C# optional)', 'A full free engine with an editor, similar in feel to Python, exports to many platforms'],
            ['**Unity**, **Unreal**', 'C#, C++', 'Industry engines for larger commercial games'],
          ],
          caption: 'Other ways to make games. Concepts learned in pygame carry over to all of them.',
        },
        {
          type: 'p',
          text: 'Success stories are small and large: pygame has powered game-jam entries, teaching tools, research simulations and a number of commercial indie releases. It is also a common choice for **reinforcement learning** environments, where an AI plays a game thousands of times and a simple, scriptable window is an advantage.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'Installing pygame and checking it works',
      blocks: [
        {
          type: 'p',
          text: 'Install pygame the way you install any package: into a **virtual environment** for the project, using `pip`. Then ask the library for its version, which also proves that it was installed in the Python you are running.',
        },
        {
          type: 'code',
          title: 'Setup',
          lang: 'shell',
          code: `python -m venv .venv
.venv\\Scripts\\Activate.ps1
python -m pip install pygame
python -c "import pygame; print(pygame.version.ver)"`,
          annotations: [
            { lines: '1-2', text: 'Create and activate a virtual environment (Windows PowerShell). On macOS and Linux the activate line is `source .venv/bin/activate`.' },
            { lines: '3', text: 'Installs the original pygame. To use the community edition instead, install `pygame-ce` (and never install both in one environment, because they share the name `pygame`).' },
            { lines: '4', text: 'Prints the version, such as `2.6.1`. The first time you `import pygame` it also prints a greeting line, which is normal.' },
          ],
        },
        {
          type: 'p',
          text: 'The version is text such as `"2.6.1"`. When you read documentation or follow a tutorial you often need to know whether your version has a feature, so a small helper that turns the text into numbers and compares it is genuinely useful. You will write one in the exercises.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Run it with Python, not by double-clicking',
          text: 'If a pygame window flashes and closes, the program crashed and its error message vanished with the window. Run games from a terminal (`python game.py`) or from your editor, so that you can read any error.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the command that checks which version of pygame is installed.',
      template: `python -c "import ___; print(pygame.version.___)"`,
      templateIsCode: true,
      blanks: [{ answers: ['pygame'] }, { answers: ['ver'] }],
      wordBank: ['pygame', 'ver', 'SDL', 'version_string', 'about'],
      explanation: '`pygame.version.ver` is the version as text. The module is called `pygame`, whichever of pygame or pygame-ce you installed.',
    },
    {
      kind: 'predict',
      prompt: 'A game runs at 50 frames per second. Predict the output (the time available to produce one frame, in milliseconds).',
      code: `fps = 50
print(1000 / fps)`,
      answer: '20.0',
      hint: 'There are 1000 milliseconds in a second.',
      explanation: 'At 50 frames per second, each frame has 1000 / 50 = 20 milliseconds. Reading input, moving everything, drawing and showing the picture must all fit inside that **frame budget**, or the game slows down.',
    },
    {
      kind: 'concept',
      title: 'Frames: the idea behind every game',
      blocks: [
        {
          type: 'p',
          text: 'A game is a **flip book**. It shows a still picture (a **frame**), changes the world a little, shows the next picture, and does it so fast that the eye sees movement. The number of pictures per second is the **frame rate** (FPS, frames per second). Films use 24, most games aim for 60. The time available for one frame is the **frame budget**: at 60 FPS it is about 16.7 ms.',
        },
        {
          type: 'p',
          text: 'Everything in the rest of this course is about what happens inside one frame: **read** what the player did, **update** the world, **draw** it. The next two lessons make that loop real. First, open a window, then keep it open and responsive.',
        },
        {
          type: 'table',
          headers: ['Frame rate', 'Budget per frame', 'Typical use'],
          rows: [
            ['30 FPS', '33.3 ms', 'Slow puzzle games, low-power devices, simple web games'],
            ['60 FPS', '16.7 ms', 'The usual target for action games on most monitors'],
            ['120 FPS', '8.3 ms', 'High refresh-rate screens, fast-paced competitive games'],
          ],
          caption: 'A lower rate gives you more time per frame; a higher rate feels smoother.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'Python raises `ModuleNotFoundError: No module named \'pygame\'`. Tap the line that raises it.',
      lines: [
        'import sys',
        'import pygame',
        'pygame.init()',
        'print(sys.version)',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'The error is raised by `import pygame`: pygame is not installed in the Python that is running the program. Typical causes are installing it into a different Python (check `python -m pip` is the same as `python`) or forgetting to activate the virtual environment.',
    },
    {
      kind: 'numeric',
      prompt: 'A frame must be ready in 16 milliseconds, and a game needs 4 ms to read input and update, and 9 ms to draw. How many milliseconds are left over?',
      answer: '3',
      hint: 'Budget minus the time already used.',
      explanation: '16 - (4 + 9) = 3 ms of spare time. If the work ever takes more than 16 ms, the frame is late and the game visibly stutters. That is why performance is measured against the frame budget.',
      label: 'Spare ms:',
    },
    {
      kind: 'concept',
      title: 'Your turn: small helpers for a game project',
      blocks: [
        {
          type: 'p',
          text: 'These helpers are the kind of function that real games need within the first hour. The first uses `pygame.Rect`, which is plain data and arithmetic, so it behaves the same everywhere.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `screen_info(width, height)`. It returns a dictionary with `"rect"` (a `pygame.Rect(0, 0, width, height)`), `"center"` (the center of that rect, a tuple), `"area"` (width times height) and `"aspect"` (width divided by height, rounded to 3 decimals).',
      starter: `import pygame


def screen_info(width, height):
    ...
`,
      solution: `import pygame


def screen_info(width, height):
    rect = pygame.Rect(0, 0, width, height)
    return {
        "rect": rect,
        "center": rect.center,
        "area": width * height,
        "aspect": round(width / height, 3),
    }
`,
      setup: PG_SIM,
      tests: `info = screen_info(800, 600)
assert info["rect"] == pygame.Rect(0, 0, 800, 600)
assert info["center"] == (400, 300)
assert info["area"] == 480000
assert info["aspect"] == 1.333
info = screen_info(1280, 720)
assert info["rect"].size == (1280, 720) and info["center"] == (640, 360)
assert info["aspect"] == 1.778
info = screen_info(641, 481)
assert info["center"] == (320, 240), "Rect.center rounds down"
assert info["rect"].right == 641 and info["rect"].bottom == 481
assert set(info) == {"rect", "center", "area", "aspect"}`,
      checks: ['`rect` is `pygame.Rect(0, 0, width, height)` and `center` is `rect.center`', '`area` and `aspect` are calculated from the width and height, with the aspect rounded to 3 decimals', 'The dictionary has exactly these four keys'],
      hint: 'Build the Rect first, then read `.center` from it. `round(width / height, 3)` gives the aspect.',
      explanation: 'A `Rect` is more than four numbers: its `center`, `right`, `bottom` and similar attributes are computed for you. Notice that `center` is a whole number: for odd sizes it rounds down. You will use Rects constantly.',
    },
    {
      kind: 'code',
      prompt: 'Write `timing(fps, seconds)`. It returns a pair `(budget_ms, frames)`: the time available for one frame in milliseconds, rounded to 2 decimals, and how many whole frames fit in the given number of seconds (use `int(seconds * fps)`).',
      starter: `def timing(fps, seconds):
    ...
`,
      solution: `def timing(fps, seconds):
    return round(1000 / fps, 2), int(seconds * fps)
`,
      tests: `assert timing(60, 1) == (16.67, 60)
assert timing(30, 2) == (33.33, 60)
assert timing(50, 0.5) == (20.0, 25)
assert timing(120, 1.5) == (8.33, 180)
assert timing(25, 0.1) == (40.0, 2)
b, f = timing(60, 10)
assert isinstance(f, int) and f == 600`,
      checks: ['The budget is `1000 / fps` rounded to 2 decimals', 'The frame count is the whole number from `int(seconds * fps)`'],
      hint: 'Return a tuple: `return round(1000 / fps, 2), int(seconds * fps)`.',
      explanation: 'The frame budget is the first performance number to know. Frame counts matter too: for example, an effect that lasts half a second at 60 FPS lasts 30 frames.',
    },
    {
      kind: 'code',
      prompt: 'Write `parse_version(text)`, which turns a version string such as `"2.6.1"` into a tuple of the first three whole numbers, `(2, 6, 1)`. If there are fewer than three parts, fill with zeros (`"2.5"` becomes `(2, 5, 0)`). Ignore anything after the third part, and a non-numeric ending such as `"dev3"` on the last part (`"2.6.0.dev3"` is `(2, 6, 0)`, and `"2.7.0rc1"` is `(2, 7, 0)`). Then write `at_least(text, minimum)`, which is true when the version in `text` is the same as or newer than `minimum`.',
      starter: `def parse_version(text):
    ...


def at_least(text, minimum):
    ...
`,
      solution: `def parse_version(text):
    numbers = []
    for part in text.split(".")[:3]:
        digits = ""
        for ch in part:
            if not ch.isdigit():
                break
            digits += ch
        numbers.append(int(digits) if digits else 0)
    while len(numbers) < 3:
        numbers.append(0)
    return tuple(numbers)


def at_least(text, minimum):
    return parse_version(text) >= parse_version(minimum)
`,
      tests: `assert parse_version("2.6.1") == (2, 6, 1)
assert parse_version("2.5") == (2, 5, 0)
assert parse_version("2") == (2, 0, 0)
assert parse_version("2.6.0.dev3") == (2, 6, 0)
assert parse_version("2.7.0rc1") == (2, 7, 0)
assert parse_version("1.9.6") == (1, 9, 6)
assert parse_version("2.10.3") == (2, 10, 3)
assert parse_version("10.0.0.1") == (10, 0, 0)
assert at_least("2.6.1", "2.5.0") is True
assert at_least("2.5.0", "2.5") is True
assert at_least("2.4.9", "2.5.0") is False
assert at_least("2.10.0", "2.9.9") is True, "compare numbers, not text"
assert at_least("1.9.6", "2.0.0") is False
assert at_least("2.1.3", "2.1.3") is True`,
      checks: ['`parse_version` returns a tuple of three integers, padded with zeros', 'Trailing text such as `dev3` or `rc1` on a part is ignored, and parts after the third are ignored', '`at_least` compares the tuples, so `2.10.0` is newer than `2.9.9`'],
      hint: 'For each of the first three parts, collect the leading digits (stop at the first non-digit). Tuples compare element by element, which is exactly how version numbers compare.',
      explanation: 'Comparing versions as **text** goes wrong: `"2.10.0" < "2.9.9"` is true for strings, because `"1"` sorts before `"9"`. Converting to a tuple of integers fixes it. A helper like `at_least(pygame.version.ver, "2.1.3")` lets a game use newer features only when they exist.',
    },
  ],
  takeaways: [
    'pygame is a free Python library for 2D games and interactive programs: a window, drawing, input, sound and timing. It gives you building blocks and leaves the game design to you.',
    'It was created by Pete Shinners (2000), is built on the C library SDL, and moved to SDL2 with pygame 2. The community fork **pygame-ce** uses the same `import pygame`; never install both in one environment.',
    'The main modules: `display`, `event`, `draw`, `Surface` and `image`, `Rect`, `math.Vector2`, `sprite`, `font`, `mixer`, `time`, `key` and `mouse`.',
    'It suits 2D arcade games, puzzles, prototypes, teaching, simulations and RL environments; it is a poor fit for heavy 3D or games with huge numbers of objects.',
    'Install in a virtual environment (`python -m pip install pygame`) and check with `pygame.version.ver`. Run games from a terminal so errors stay visible.',
    'A game is a loop of frames. The **frame budget** is 1000 / FPS milliseconds (16.7 ms at 60 FPS), and all the work for one frame must fit in it.',
  ],
  reading: [
    { title: 'pygame documentation', url: 'https://www.pygame.org/docs/', source: 'docs', note: 'The official reference for every module, with the “Getting started” and tutorial pages.' },
    { title: 'pygame: Getting Started (wiki)', url: 'https://www.pygame.org/wiki/GettingStarted', source: 'tutorial', note: 'Installation notes for each operating system and a first program.' },
    { title: 'pygame-ce documentation', url: 'https://pyga.me/docs/', source: 'docs', note: 'The community edition’s docs, including a list of what it adds to the original.' },
    { title: 'pygame on GitHub', url: 'https://github.com/pygame/pygame', source: 'repo', note: 'Source code, issues and release notes for the original pygame.' },
    { title: 'Simple DirectMedia Layer', url: 'https://www.libsdl.org/', source: 'docs', note: 'The C library that pygame is built on.' },
    { title: 'Real Python: PyGame, a primer', url: 'https://realpython.com/pygame-a-primer/', source: 'article', note: 'A long beginner walk-through that builds a small game.' },
  ],
};
