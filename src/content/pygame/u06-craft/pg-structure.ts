import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-structure',
  title: 'Structuring a Game Project',
  summary: 'Split a growing game into modules, put every tuning number in one settings object, load assets once through a cache, and find files reliably from any folder.',
  minutes: 38,
  objectives: [
    'Organise a game into folders and modules with one clear job each, and explain what `if __name__ == "__main__":` is for',
    'Wrap the main loop in a `Game` class with `run`, `handle_events`, `update` and `draw`',
    'Keep configuration in one `Settings` dataclass and load it safely from saved data',
    'Build file paths from the location of the script with `pathlib`, so the game runs from any folder',
    'Cache loaded assets so that each file is read from disk only once',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From one file to a project',
      blocks: [
        {
          type: 'p',
          text: 'Every game in this course so far has fitted in one file. That works up to a few hundred lines. Beyond that you scroll for ever to find anything, two people cannot work at once, and changing one thing breaks another. The cure is the same one used in every large program: split the code into **modules**, each with a single job, and keep the data (images, sounds, fonts) in an `assets` folder next to the code.',
        },
        {
          type: 'code',
          lang: 'text',
          code: `mygame/
    main.py          starts the game
    settings.py      sizes, speeds, colours, key bindings
    game.py          the Game class: window, loop, state machine
    states/
        menu.py      one file per screen
        play.py
    entities/
        player.py    one file per kind of game object
        enemy.py
    assets/
        images/
        sounds/
        fonts/`,
          annotations: [
            { lines: '2-4', text: '`main.py` stays tiny: it only creates a `Game` and runs it. Tuning numbers live in `settings.py`, so you never hunt through code to change a speed.' },
            { lines: '5-7', text: 'Screens (the states of the earlier lesson) get their own folder and one file each.' },
            { lines: '8-10', text: 'Game objects (the sprites) get theirs, so that `enemy.py` can import `Player` without importing a menu.' },
            { lines: '11-14', text: 'Data is kept apart from code and is **loaded by path** when the game starts.' },
          ],
        },
        {
          type: 'table',
          headers: ['Module', 'Responsible for', 'Should not contain'],
          rows: [
            ['`main.py`', 'Creating the game and starting it', 'Game logic'],
            ['`settings.py`', 'Constants and default options', 'Behaviour'],
            ['`game.py`', 'The window, the clock, the loop, switching states', 'Details of one level'],
            ['`states/*.py`', 'One screen each: input, update, draw', 'Code that belongs to many screens'],
            ['`entities/*.py`', 'Sprites and their behaviour', 'Drawing the whole screen'],
          ],
          caption: 'The test of a good split: for any change you want to make, you know in which file to look.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does `if __name__ == "__main__":` matter?',
          text: 'When Python runs a file directly, it sets the variable `__name__` to `"__main__"`; when another file **imports** it, `__name__` is the module’s name instead. Wrapping the start-up in that test means you can `import game` from a test or another script to reuse its classes **without opening a window**. It is also what lets the tests in this course run your code with no display.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why should `main.py` be only a few lines long?',
      options: [
        { text: 'So the real code lives in modules that can be imported, tested and reused without starting the game', correct: true, why: 'A short entry point just builds the `Game` and calls `run()`.' },
        { text: 'Because Python limits the length of the main file', why: 'There is no such limit.' },
        { text: 'Because long files run more slowly', why: 'The length of a file does not affect speed.' },
        { text: 'Because pygame only reads the first 20 lines', why: 'pygame does not read your source at all.' },
      ],
      explanation: 'A tiny entry point is a convention, not a rule of Python, but it keeps the project organised and testable.',
    },
    {
      kind: 'truefalse',
      prompt: 'Code under `if __name__ == "__main__":` runs when the file is run directly, but not when the file is imported by another module.',
      answer: true,
      explanation: 'True. Importing a module executes its top level, but `__name__` is then the module’s own name, not `"__main__"`, so the guarded block is skipped. That is how a game file can be both a program and a library.',
    },
    {
      kind: 'concept',
      title: 'A game skeleton you can grow',
      blocks: [
        {
          type: 'p',
          text: 'Below is the skeleton to start every serious game from. It has three of the pieces from this lesson in one file so that you can read them together: a **`Settings`** dataclass for the options, an **asset cache**, and a **`Game` class** that owns the window and the loop. In a real project each would be its own file.',
        },
        {
          type: 'code',
          title: 'skeleton.py',
          desktopOnly: true,
          code: `from dataclasses import dataclass
from pathlib import Path

import pygame

BASE_DIR = Path(__file__).resolve().parent
ASSETS = BASE_DIR / "assets"


@dataclass
class Settings:
    width: int = 640
    height: int = 360
    fps: int = 60
    title: str = "Skeleton"


class AssetCache:
    def __init__(self, loader):
        self.loader = loader
        self.items = {}

    def get(self, name):
        if name not in self.items:
            self.items[name] = self.loader(name)
        return self.items[name]


def load_image(name):
    path = ASSETS / "images" / name
    if path.exists():
        return pygame.image.load(path).convert_alpha()
    surface = pygame.Surface((32, 32))
    surface.fill((90, 200, 120))
    return surface


class Game:
    def __init__(self, settings):
        pygame.init()
        self.settings = settings
        self.screen = pygame.display.set_mode((settings.width, settings.height))
        pygame.display.set_caption(settings.title)
        self.clock = pygame.time.Clock()
        self.images = AssetCache(load_image)
        self.running = True
        self.x = 0.0

    def run(self):
        while self.running:
            dt = self.clock.tick(self.settings.fps) / 1000
            self.handle_events()
            self.update(dt)
            self.draw()
        pygame.quit()

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

    def update(self, dt):
        self.x = (self.x + 120 * dt) % self.settings.width

    def draw(self):
        self.screen.fill((20, 24, 32))
        self.screen.blit(self.images.get("player.png"), (int(self.x), 160))
        pygame.display.flip()


def main():
    Game(Settings()).run()


if __name__ == "__main__":
    main()`,
          annotations: [
            { lines: '6-7', text: '`Path(__file__)` is the location of **this script**; `.resolve().parent` is the folder that contains it. Everything else is built from `BASE_DIR`, so the game finds its files wherever it is launched from.' },
            { lines: '10-15', text: 'All tunable options in one place. `@dataclass` writes the `__init__` for you, with these defaults.' },
            { lines: '18-26', text: 'The cache: ask for an asset by name; the first request calls the loader, every later one returns the stored object. The loader is passed in, so the cache itself needs no pygame.' },
            { lines: '29-35', text: 'The loader: build a path with the `/` operator, load the file if it exists, and otherwise return a plain green square. A missing image then gives a visible placeholder instead of a crash while you are still drawing it.' },
            { lines: '38-47', text: 'The `Game` object owns everything a running game needs: settings, window, clock, assets, and the `running` flag.' },
            { lines: '49-55', text: 'The loop has been reduced to three method calls. Adding a state machine means replacing these methods with calls into the current state.' },
            { lines: '57-68', text: 'One small method per job: events, update, draw. Each can be read, changed and tested alone.' },
            { lines: '71-76', text: 'A tiny `main` and the `__main__` guard: importing this file does nothing, running it plays the game.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Run it from anywhere',
          text: 'A path written as `"assets/player.png"` is looked up relative to the **current working directory**, which is wherever the program was launched from (a shortcut, an IDE, a terminal in another folder). A path built from `Path(__file__)` is relative to the **script**, so it always finds the same file.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the two idioms that every game project uses.',
      template: `BASE_DIR = ___(__file__).resolve().parent
if __name__ == "___":
    main()`,
      templateIsCode: true,
      blanks: [{ answers: ['Path'] }, { answers: ['__main__'] }],
      wordBank: ['Path', '__main__', 'os', '__init__', 'open', 'pygame'],
      explanation: '`Path(__file__)` turns the script’s location into a `pathlib.Path`, and `.resolve().parent` is its folder. The test `__name__ == "__main__"` is true only when the file is run directly.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. `Path` objects know their parts.',
      code: `from pathlib import Path
p = Path("game") / "assets" / "images" / "player.png"
print(p.name, p.suffix, p.parent.name)`,
      answer: 'player.png .png images',
      hint: '`name` is the last part, `suffix` is its extension including the dot, and `parent` is the path without the last part.',
      explanation: 'The `/` operator joins path parts. `name` is `player.png`, `suffix` is `.png`, and `parent` is `game/assets/images`, whose own `name` is `images`. Using `Path` instead of string concatenation also takes care of `\\` on Windows and `/` elsewhere.',
    },
    {
      kind: 'concept',
      title: 'Settings, caches and paths',
      blocks: [
        {
          type: 'p',
          text: '**Settings in one object.** Window size, speeds, volume, key bindings, colours: every number the player or the designer might want to change goes in one place. A `@dataclass` is ideal: it lists the fields with their defaults, and prints and compares nicely. You can load the options saved by the player into it, taking only the keys that exist and have sensible types, so a damaged or outdated settings file can never crash the game.',
        },
        {
          type: 'p',
          text: '**Load once.** Reading a PNG from disk, decoding it and converting it is slow compared to a frame (about 16 milliseconds). If forty enemies each call `pygame.image.load("enemy.png")`, the game reads the same file forty times, and stutters every time a wave spawns. An **asset cache** is a dictionary from names to loaded objects: the first request loads and stores, every later request returns the stored object. A **preload** step at start-up (or on a loading screen) fills the cache before gameplay begins, so nothing loads in the middle of a level.',
        },
        {
          type: 'table',
          headers: ['Problem', 'Symptom', 'Cure'],
          rows: [
            ['Relative path `"assets/x.png"`', 'Works from the project folder, `FileNotFoundError` elsewhere', 'Build from `Path(__file__).resolve().parent`'],
            ['Loading in the draw or spawn code', 'A hitch whenever something new appears', 'A cache, plus preloading'],
            ['Constants scattered in the code', 'Rebalancing means editing ten files', 'One `Settings` object or `settings.py`'],
            ['Everything in `main.py`', 'Hard to find, test or share work', 'Modules by responsibility'],
            ['Start-up code at the top level', 'Importing the module opens a window', 'The `__main__` guard'],
          ],
          caption: 'Each fix is small. Together they are the difference between a script and a project.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why pass the loader into the cache?',
          text: 'A cache that calls `pygame.image.load` itself can only be used (and tested) in a real pygame program. A cache that receives its **loader** as an argument works with anything: images, sounds, JSON files, or a fake function in a test that just records its calls. The same idea, handing a dependency in instead of reaching out for it, appears all over this course: the `measure` function for text, the `rng` for random numbers.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The game works when started from the project folder, but crashes with `FileNotFoundError` when launched from a shortcut on the desktop. Tap the line responsible.',
      lines: [
        'import pygame',
        'pygame.init()',
        'screen = pygame.display.set_mode((400, 300))',
        'player = pygame.image.load("assets/player.png")',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The relative path `"assets/player.png"` is resolved against the **working directory**, which for a shortcut is not the project folder. Build the path from the script’s own location: `BASE_DIR / "assets" / "player.png"` with `BASE_DIR = Path(__file__).resolve().parent`.',
    },
    {
      kind: 'numeric',
      prompt: 'A wave spawns 40 enemies, and each one needs `enemy.png`. Without a cache every enemy loads the file from disk; with a cache only the first does. How many disk reads does the cache save?',
      answer: '39',
      hint: 'Without a cache: 40 reads. With a cache: 1 read.',
      explanation: '40 reads become 1, a saving of 39. If one load costs about 2 milliseconds, that is nearly 80 milliseconds, enough to drop four or five frames at the moment the wave appears.',
      label: 'Reads saved:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the project toolkit',
      blocks: [
        {
          type: 'p',
          text: 'You will write a path helper and a missing-asset check (with the file test passed in, so no files are needed), the asset cache, and a safe `Settings.from_dict`. None of them needs pygame or a window.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `asset_path(base_dir, *parts)` that joins `base_dir` and the parts with `pathlib.Path` and returns the result as a string with forward slashes (`as_posix()`). Then write `list_missing(base_dir, names, exists)`: `names` is a list such as `"images/player.png"`; `exists` is a function that takes a path string and returns whether the file exists. Return the list of names whose path, `asset_path(base_dir, "assets", name)`, does **not** exist, in the original order.',
      starter: `from pathlib import Path


def asset_path(base_dir, *parts):
    ...


def list_missing(base_dir, names, exists):
    ...
`,
      solution: `from pathlib import Path


def asset_path(base_dir, *parts):
    return Path(base_dir, *parts).as_posix()


def list_missing(base_dir, names, exists):
    return [name for name in names if not exists(asset_path(base_dir, "assets", name))]
`,
      tests: `assert asset_path("/game", "assets", "images", "player.png") == "/game/assets/images/player.png"
assert asset_path("game", "a.png") == "game/a.png"
assert asset_path("/game") == "/game"
assert asset_path("/game", "assets", "images/enemy.png") == "/game/assets/images/enemy.png"
assert asset_path("/game/", "x") == "/game/x", "a trailing slash does not double up"
present = {"/g/assets/images/player.png", "/g/assets/sounds/jump.wav"}
names = ["images/player.png", "images/enemy.png", "sounds/jump.wav", "sounds/hit.wav"]
assert list_missing("/g", names, lambda p: p in present) == ["images/enemy.png", "sounds/hit.wav"]
assert list_missing("/g", names, lambda p: True) == []
assert list_missing("/g", names, lambda p: False) == names
assert list_missing("/g", [], lambda p: False) == []
asked = []
def spy(path):
    asked.append(path)
    return True
list_missing("/home/me/game", ["music/theme.ogg"], spy)
assert asked == ["/home/me/game/assets/music/theme.ogg"]`,
      checks: ['`asset_path` joins with `Path` and returns a forward-slash string', '`list_missing` builds `base_dir/assets/<name>` and asks `exists` about each', 'The order of the names is kept'],
      hint: '`Path(base_dir, *parts).as_posix()`. For `list_missing`, a list comprehension with `if not exists(asset_path(base_dir, "assets", name))`.',
      explanation: 'A start-up check that lists every missing asset at once is much friendlier than a crash on the first one, and because `exists` is passed in (it would be `os.path.exists` in the game), the logic is testable without touching the disk.',
    },
    {
      kind: 'code',
      prompt: 'Write the class `AssetCache(loader)`. `get(name)` returns the stored asset, calling `loader(name)` only the **first** time that name is requested (even if the loader returns `None` or another falsy value). `preload(names)` calls `get` for each name. `clear()` forgets everything. The attribute `loads` counts how many times the loader has been called. `name in cache` and `len(cache)` should work (the number of stored assets).',
      starter: `class AssetCache:
    def __init__(self, loader):
        ...

    def get(self, name):
        ...

    def preload(self, names):
        ...

    def clear(self):
        ...

    def __contains__(self, name):
        ...

    def __len__(self):
        ...
`,
      solution: `class AssetCache:
    def __init__(self, loader):
        self.loader = loader
        self.items = {}
        self.loads = 0

    def get(self, name):
        if name not in self.items:
            self.items[name] = self.loader(name)
            self.loads += 1
        return self.items[name]

    def preload(self, names):
        for name in names:
            self.get(name)

    def clear(self):
        self.items.clear()

    def __contains__(self, name):
        return name in self.items

    def __len__(self):
        return len(self.items)
`,
      tests: `calls = []

def loader(name):
    calls.append(name)
    return {"file": name}

c = AssetCache(loader)
assert len(c) == 0 and c.loads == 0 and "a" not in c
a1 = c.get("a")
a2 = c.get("a")
assert a1 is a2 and a1 == {"file": "a"}, "the same object comes back"
assert calls == ["a"] and c.loads == 1
c.get("b")
assert calls == ["a", "b"] and c.loads == 2 and len(c) == 2
assert "a" in c and "b" in c and "z" not in c
c.preload(["a", "b", "c", "c"])
assert calls == ["a", "b", "c"] and c.loads == 3, "only the new name was loaded, once"
c.clear()
assert len(c) == 0 and "a" not in c
a3 = c.get("a")
assert calls == ["a", "b", "c", "a"] and c.loads == 4 and a3 is not a1, "after clear, it loads again"
nothing = AssetCache(lambda n: None)
assert nothing.get("x") is None and nothing.get("x") is None
assert nothing.loads == 1, "a stored None counts as loaded"
other = AssetCache(loader)
assert len(other) == 0, "caches do not share storage"
other.preload([])
assert other.loads == 0`,
      checks: ['The loader is called only on the first request for a name, even when it returns `None`', '`preload`, `clear`, `in` and `len` behave as described', '`loads` counts loader calls, and different caches do not share storage'],
      hint: 'Test `name not in self.items` (not the value’s truthiness) before calling the loader. Increment `self.loads` only then. Create `self.items = {}` inside `__init__`.',
      explanation: 'Testing for the **key** rather than the value is the detail that matters: an asset that legitimately loads as `None` or an empty object must still be cached. In the game, `loader` is a function like `load_image` from the skeleton above.',
    },
    {
      kind: 'code',
      prompt: 'Complete the dataclass `Settings` (fields are given) by adding a class method `from_dict(cls, data)` and a method `to_dict(self)`. `from_dict` returns a `Settings` where each field takes its value from `data` **only if** the key is present and the value has **exactly** the same type as the field’s default (`type(value) is type(default)`); anything else keeps the default, and unknown keys are ignored. `to_dict` returns all the fields as a dictionary (use `dataclasses.asdict`).',
      starter: `from dataclasses import dataclass, asdict, fields


@dataclass
class Settings:
    width: int = 800
    height: int = 600
    fps: int = 60
    volume: float = 0.7
    fullscreen: bool = False
    title: str = "My Game"

    @classmethod
    def from_dict(cls, data):
        ...

    def to_dict(self):
        ...
`,
      solution: `from dataclasses import dataclass, asdict, fields


@dataclass
class Settings:
    width: int = 800
    height: int = 600
    fps: int = 60
    volume: float = 0.7
    fullscreen: bool = False
    title: str = "My Game"

    @classmethod
    def from_dict(cls, data):
        defaults = cls()
        values = {}
        for f in fields(cls):
            if f.name in data:
                default = getattr(defaults, f.name)
                if type(data[f.name]) is type(default):
                    values[f.name] = data[f.name]
        return cls(**values)

    def to_dict(self):
        return asdict(self)
`,
      tests: `d = Settings()
assert (d.width, d.height, d.fps, d.volume, d.fullscreen, d.title) == (800, 600, 60, 0.7, False, "My Game")
assert Settings.from_dict({}) == Settings()
s = Settings.from_dict({"fps": 30, "volume": 0.5, "extra": 1, "title": "Forge"})
assert s.fps == 30 and s.volume == 0.5 and s.title == "Forge"
assert s.width == 800 and s.height == 600 and s.fullscreen is False
assert not hasattr(s, "extra"), "unknown keys are ignored"
bad = Settings.from_dict({"fps": "fast", "width": 800.5, "fullscreen": 1, "volume": 1, "title": 5})
assert bad == Settings(), "wrong types fall back to the defaults (note: 1 is an int, not a float or a bool)"
assert Settings.from_dict({"fullscreen": True}).fullscreen is True
assert Settings.from_dict({"volume": 1.0}).volume == 1.0
data = {"fps": 144, "unknown": [1, 2]}
Settings.from_dict(data)
assert data == {"fps": 144, "unknown": [1, 2]}, "the input is not modified"
full = Settings(width=1280, height=720, fps=30, volume=0.25, fullscreen=True, title="Round trip")
assert full.to_dict() == {"width": 1280, "height": 720, "fps": 30, "volume": 0.25, "fullscreen": True, "title": "Round trip"}
assert Settings.from_dict(full.to_dict()) == full
a, b = Settings(), Settings()
a.fps = 10
assert b.fps == 60, "each instance has its own values"`,
      checks: ['`from_dict` uses a value only when the key exists and `type(value) is type(default)`', 'Unknown keys are ignored and the input dictionary is not changed', '`to_dict` and `from_dict` round-trip a `Settings` object'],
      hint: 'Loop over `fields(cls)`. For each field name in `data`, compare `type(data[name])` with `type(getattr(defaults, name))`, where `defaults = cls()`. Collect the good ones in a dict and return `cls(**values)`.',
      explanation: 'Checking the exact type is blunt on purpose: `True` is an `int` in Python, so `isinstance(True, int)` would accept a boolean as a window width. This is the loader you will use in the save-data lesson, where the data comes from a file the player (or time) might have damaged.',
    },
  ],
  takeaways: [
    'Split a growing game by **responsibility**: a tiny `main.py`, a `settings.py`, a `Game` class for window, clock and loop, one file per screen and per kind of game object, and an `assets` folder for data.',
    'Wrap start-up in `if __name__ == "__main__":` so the file can be imported (by tests, or other modules) without opening a window.',
    'A `Game` class with `run`, `handle_events`, `update` and `draw` keeps the loop readable, and gives each job a name.',
    'Keep every tunable number in one `Settings` dataclass. When loading saved options, accept only known keys with the right type, so damaged data cannot crash the game.',
    'Build file paths from `Path(__file__).resolve().parent`, not from relative strings: relative paths depend on where the game was launched from.',
    'Load each asset **once** through a cache (testing for the key, not the value), and **preload** before gameplay starts so that nothing loads in the middle of a level.',
  ],
  reading: [
    { title: 'Python docs: pathlib', url: 'https://docs.python.org/3/library/pathlib.html', source: 'docs', note: 'Path objects, the `/` operator, `name`, `suffix` and `parent`.' },
    { title: 'Python docs: dataclasses', url: 'https://docs.python.org/3/library/dataclasses.html', source: 'docs', note: '`@dataclass`, `fields` and `asdict`.' },
    { title: 'Python docs: __main__ (top-level code environment)', url: 'https://docs.python.org/3/library/__main__.html', source: 'docs', note: 'What `if __name__ == "__main__":` does and why.' },
  ],
};
