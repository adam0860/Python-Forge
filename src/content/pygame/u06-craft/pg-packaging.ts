import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'pg-packaging',
  title: 'Packaging and Sharing Your Game',
  summary: 'Turn a folder of Python files into something a friend can double-click: PyInstaller for Windows, macOS and Linux, pygbag for the browser, bundled assets, version numbers and a release checklist.',
  minutes: 36,
  objectives: [
    'Explain what "freezing" does and why a friend does not need Python installed to run the result',
    'Build a one-file windowed executable with PyInstaller and bundle the assets folder with `--add-data`',
    'Find bundled files at run time with a `resource_path` helper that works both from source and when frozen',
    'Describe how a game is adapted for the web with pygbag (an async main loop)',
    'Use semantic version numbers, name release files consistently, and audit a build before shipping it',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'From a folder of scripts to a download',
      blocks: [
        {
          type: 'p',
          text: 'Your game runs on your computer because Python, pygame and your files are all there. A friend probably has none of them. To share the game you have two choices: ask them to install Python and run `pip install pygame`, or give them a **bundle** that contains the Python interpreter, pygame, your code and your assets, and needs nothing installed at all. Making that bundle is called **freezing** (or packaging, or building).',
        },
        {
          type: 'table',
          headers: ['Tool', 'Produces', 'Runs on', 'Notes'],
          rows: [
            ['**PyInstaller**', 'A folder or a single executable file', 'The operating system you build on', 'The most popular; build on Windows for Windows, macOS for macOS, Linux for Linux'],
            ['**pygbag**', 'A web page with your game (WebAssembly)', 'Any modern browser', 'Needs an `async` main loop; ideal for itch.io and sharing a link'],
            ['`pip install` / source zip', 'Your source code', 'Computers with Python', 'Fine for other programmers'],
            ['Platform stores (Steam, itch.io app)', 'A listing and a launcher', 'Depends', 'You still upload a frozen build'],
          ],
          caption: 'PyInstaller does **not** cross-compile: to get a Windows .exe, build on Windows. This course’s own installers are built that way, in the cloud, by a GitHub Actions workflow.',
        },
        {
          type: 'p',
          text: 'PyInstaller reads your main script, follows every `import`, collects those modules together with the Python runtime, and writes the result to a `dist` folder. It finds your **Python code** automatically, but it cannot know about your **data files** (images, sounds, fonts, level files): you must tell it to include them, and your code must look for them in the right place at run time. Those two details cause most packaging problems.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does a frozen game need a special path helper?',
          text: 'A one-file PyInstaller build unpacks itself into a **temporary folder** each time it starts, and your assets are inside it. `Path(__file__)` may then point somewhere unexpected, so PyInstaller sets `sys._MEIPASS` to the unpacked folder (and `sys.frozen` to `True`). Your code asks "am I frozen? then use `_MEIPASS`, otherwise use the folder of this script", in one helper function used for every asset.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does the PyInstaller option `--windowed` (also written `--noconsole`) do?',
      options: [
        { text: 'It stops a black console window from opening alongside the game, so only the game window appears', correct: true, why: 'Games do not want a terminal behind them; use this for the final build.' },
        { text: 'It makes the game run in a window instead of full screen', why: 'The window mode is decided by your pygame code, not by PyInstaller.' },
        { text: 'It compresses the executable', why: 'Compression is a different option.' },
        { text: 'It adds Windows support to a Linux build', why: 'PyInstaller never cross-compiles.' },
      ],
      explanation: 'Leave the console on while testing (so that error messages are visible), and add `--windowed` for the version you ship.',
    },
    {
      kind: 'truefalse',
      prompt: 'PyInstaller finds the Python modules you import automatically, but your image, sound and font files must be added explicitly (for example with `--add-data`).',
      answer: true,
      explanation: 'True. Imports can be discovered by reading the code; a file opened by name at run time cannot. A frozen game that runs but shows no pictures, or crashes with `FileNotFoundError`, has almost always forgotten its data files.',
    },
    {
      kind: 'concept',
      title: 'A game that knows where it lives',
      blocks: [
        {
          type: 'p',
          text: 'The program below is a tiny pygame skeleton prepared for both kinds of sharing. It has the `resource_path` helper that finds assets whether the game is run from source or frozen, and it uses an **`async` main loop** with `await asyncio.sleep(0)` at the end of every frame. That one line is what **pygbag** needs, because a browser cannot let a program loop without ever giving control back to the page; on a desktop it does nothing harmful.',
        },
        {
          type: 'code',
          title: 'packaging_demo.py',
          desktopOnly: true,
          code: `import asyncio
import sys
from pathlib import Path

import pygame


def resource_path(relative):
    base = getattr(sys, "_MEIPASS", None)
    root = Path(base) if base else Path(__file__).resolve().parent
    return root / relative


async def main():
    pygame.init()
    screen = pygame.display.set_mode((480, 270))
    pygame.display.set_caption("Packaging demo")
    clock = pygame.time.Clock()
    font = pygame.font.Font(None, 32)
    icon_path = resource_path("assets/icon.png")
    icon = pygame.image.load(icon_path).convert_alpha() if icon_path.exists() else None
    frozen = getattr(sys, "frozen", False)

    x = 0.0
    running = True
    while running:
        dt = clock.tick(60) / 1000
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        x = (x + 100 * dt) % 480

        screen.fill((20, 24, 32))
        text = "frozen build" if frozen else "running from source"
        screen.blit(font.render(text, True, (240, 240, 240)), (20, 20))
        if icon:
            screen.blit(icon, (20, 60))
        pygame.draw.circle(screen, (90, 200, 120), (int(x), 200), 14)
        pygame.display.flip()
        await asyncio.sleep(0)

    pygame.quit()


asyncio.run(main())`,
          annotations: [
            { lines: '8-11', text: 'The path helper. `sys._MEIPASS` exists **only** in a PyInstaller build, so `getattr(sys, "_MEIPASS", None)` is `None` when running from source; then the folder of the script is used. Every asset path in the game goes through this function.' },
            { lines: '14', text: 'The whole game is one `async` function. Everything inside works exactly as before.' },
            { lines: '20-22', text: 'An asset is found with `resource_path` and loaded only if it exists, so the demo still runs without the file. `sys.frozen` is `True` in a built program, `False` otherwise.' },
            { lines: '40', text: '`await asyncio.sleep(0)` once per frame gives control back to the browser (or, on a desktop, to the event loop). Without it a web build would freeze, because the page never gets a turn.' },
            { lines: '45', text: '`asyncio.run(main())` starts the game. This is the shape pygbag expects.' },
          ],
        },
        {
          type: 'p',
          text: 'Building the desktop version is one command, run from the project folder in a terminal where Python and the project’s packages are installed:',
        },
        {
          type: 'code',
          lang: 'shell',
          code: `pip install pyinstaller
pyinstaller --onefile --windowed --name StarDefender --icon assets/icon.ico --add-data "assets;assets" main.py`,
          annotations: [
            { lines: '2', text: '`--onefile` makes one executable (it unpacks to a temporary folder on start-up; `--onedir` makes a folder instead, which starts faster). `--windowed` hides the console. `--name` names the program. `--icon` sets the file icon. `--add-data "assets;assets"` copies the `assets` folder into the bundle under the same name: the separator is `;` on Windows and `:` on macOS and Linux. The result appears in `dist/`.' },
          ],
        },
        {
          type: 'p',
          text: 'And the web version with pygbag, which packages the folder that contains `main.py` (assets inside it):',
        },
        {
          type: 'code',
          lang: 'shell',
          code: `pip install pygbag
pygbag mygame
pygbag --build mygame`,
          annotations: [
            { lines: '2', text: 'Builds the game and serves it on your own computer (usually at `http://localhost:8000`) so you can test it in a browser.' },
            { lines: '3', text: 'Builds the files to upload, in `mygame/build/web`; a zip of that folder can be uploaded to itch.io as an HTML5 game. Browsers like `.ogg` sound files and `.png` images; check the pygbag documentation for the current list of limits.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Test the built game on another computer',
          text: 'The most common packaging bug is "it works on my machine": a missing data file, a path that only exists on your disk, or a library that happens to be installed on your computer. Before you share a build, run it on a different computer (or a friend’s) that has no Python, and play for a minute.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the three packaging idioms: a one-file build, the frozen-folder attribute, and the frozen flag.',
      template: `pyinstaller --___ --windowed main.py
base = getattr(sys, "___", None)
frozen = getattr(sys, "___", False)`,
      templateIsCode: true,
      blanks: [{ answers: ['onefile'] }, { answers: ['_MEIPASS'] }, { answers: ['frozen'] }],
      wordBank: ['onefile', '_MEIPASS', 'frozen', 'onedir', 'path', 'exe'],
      explanation: '`--onefile` makes a single executable. In a frozen program `sys._MEIPASS` is the folder with the unpacked bundle and `sys.frozen` is `True`; `getattr` with a default makes the same code work when running from source, where neither exists.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. A version string is split, turned into numbers, and its **minor** part is increased.',
      code: `parts = "1.4.9".split(".")
major, minor, patch = (int(p) for p in parts)
print(f"{major}.{minor + 1}.0")`,
      answer: '1.5.0',
      hint: 'The minor number is the middle one, and a minor bump resets the patch to 0.',
      explanation: 'Semantic versioning writes `MAJOR.MINOR.PATCH`. Raising the minor number (new features) from 4 to 5 resets the patch number to 0, giving `1.5.0`. Note that these are three separate whole numbers, not a decimal: 1.10.0 comes after 1.9.0.',
    },
    {
      kind: 'concept',
      title: 'Versions, names and checklists',
      blocks: [
        {
          type: 'p',
          text: 'Shipping is also about **order**. A few habits make releases painless:',
        },
        {
          type: 'table',
          headers: ['Habit', 'What it looks like', 'Why'],
          rows: [
            ['**Semantic version numbers**', '`MAJOR.MINOR.PATCH`: `2.1.4`', 'Patch for bug fixes, minor for new features that keep saves working, major for big or breaking changes'],
            ['Version in one place', 'A `VERSION = "1.2.0"` constant, shown on the title screen and in the save file', 'Bug reports can say which build they came from'],
            ['Consistent file names', '`star-defender-1.2.0-windows.zip`', 'Players and scripts can tell builds apart'],
            ['A release checklist', 'All assets present, no source art or temporary files, README, licence', 'Catches the embarrassing mistakes'],
            ['A requirements file', '`requirements.txt` with `pygame==2.6.1`', 'Anyone can rebuild the same game later'],
            ['Credits and licences', 'Name the authors of art, sound and fonts you did not make', 'Most free assets require it'],
          ],
          caption: 'None of this is hard; all of it is easy to forget on the day you finally want to share the game.',
        },
        {
          type: 'p',
          text: '**Where do the files go?** A frozen Windows game is a folder or one `.exe`; zip it and upload it (itch.io, a GitHub release, a shared drive). On macOS, PyInstaller can make an `.app` bundle; Linux builds are plain executables. Unsigned programs trigger warnings on Windows (SmartScreen) and macOS (Gatekeeper). That is normal for a hobby game: tell players what to expect, and look at code signing if you ever sell it.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why a checklist, and why in code?',
          text: 'People are bad at remembering fifteen small steps, and very good at skipping one when excited. A tiny script that lists the files in your build folder and reports what is **missing** (a required sound) and what is **unwanted** (a 200 MB `.psd` source image) turns the checklist into a command you run before every release. The last exercise builds it.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'The built game works, but running `python main.py` from source crashes with `AttributeError: module \'sys\' has no attribute \'_MEIPASS\'`. Tap the line that causes it.',
      lines: [
        'import sys',
        'from pathlib import Path',
        'def resource_path(relative):',
        '    return Path(sys._MEIPASS) / relative',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: '`sys._MEIPASS` is created by PyInstaller, so it only exists in a frozen program. Use `getattr(sys, "_MEIPASS", None)` and fall back to the script’s folder: `root = Path(base) if base else Path(__file__).resolve().parent`.',
    },
    {
      kind: 'numeric',
      prompt: 'The game is at version 2.9.9 and you release a bug-fix, bumping the **patch** number by one. What is the new patch number? (Version parts are separate whole numbers, not decimals.)',
      answer: '10',
      hint: 'The parts are 2, 9 and 9. Increase the last by one.',
      explanation: 'The new version is `2.9.10`: patch 10. It is **not** `3.0.0`, because a patch bump never changes the other parts. Comparing versions as text (`"2.9.10" < "2.9.9"`) gets this wrong, so always compare the numbers.',
      label: 'Patch:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the release toolkit',
      blocks: [
        {
          type: 'p',
          text: 'You will write the path helper and the build-command builder (the `platform` is a parameter so that tests can check every system), the version and file-name functions, and the build audit. All three are plain Python.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `resource_path(relative, meipass, base_dir)`: the root is `meipass` if it is truthy (not `None` or empty), otherwise `base_dir`; return `Path(root, relative).as_posix()`. Write `add_data_arg(src, dest, platform)`: join `src` and `dest` with `";"` when `platform == "win32"` and `":"` otherwise. Write `pyinstaller_command(script, name, onefile=True, windowed=True, icon=None, data=(), platform="linux")` returning a **list** of arguments in this order: `"pyinstaller"`, `"--name"`, `name`; then `"--onefile"` if `onefile`; then `"--windowed"` if `windowed`; then `"--icon"`, `icon` if an icon is given; then for each `(src, dest)` pair in `data`: `"--add-data"` and `add_data_arg(src, dest, platform)`; and finally `script`.',
      starter: `from pathlib import Path


def resource_path(relative, meipass, base_dir):
    ...


def add_data_arg(src, dest, platform):
    ...


def pyinstaller_command(script, name, onefile=True, windowed=True, icon=None, data=(), platform="linux"):
    ...
`,
      solution: `from pathlib import Path


def resource_path(relative, meipass, base_dir):
    root = meipass if meipass else base_dir
    return Path(root, relative).as_posix()


def add_data_arg(src, dest, platform):
    sep = ";" if platform == "win32" else ":"
    return src + sep + dest


def pyinstaller_command(script, name, onefile=True, windowed=True, icon=None, data=(), platform="linux"):
    command = ["pyinstaller", "--name", name]
    if onefile:
        command.append("--onefile")
    if windowed:
        command.append("--windowed")
    if icon:
        command += ["--icon", icon]
    for src, dest in data:
        command += ["--add-data", add_data_arg(src, dest, platform)]
    command.append(script)
    return command
`,
      tests: `assert resource_path("assets/icon.png", None, "/game") == "/game/assets/icon.png"
assert resource_path("assets/icon.png", "/tmp/_MEI4242", "/game") == "/tmp/_MEI4242/assets/icon.png"
assert resource_path("a.png", "", "/game") == "/game/a.png", "an empty value counts as not frozen"
assert resource_path("sounds/hit.wav", None, "/home/ada/star") == "/home/ada/star/sounds/hit.wav"
assert add_data_arg("assets", "assets", "win32") == "assets;assets"
assert add_data_arg("assets", "assets", "linux") == "assets:assets"
assert add_data_arg("data/levels", "levels", "darwin") == "data/levels:levels"
assert pyinstaller_command("main.py", "StarDefender") == ["pyinstaller", "--name", "StarDefender", "--onefile", "--windowed", "main.py"]
full = pyinstaller_command("main.py", "Star", icon="assets/icon.ico", data=[("assets", "assets"), ("levels", "levels")], platform="win32")
assert full == ["pyinstaller", "--name", "Star", "--onefile", "--windowed", "--icon", "assets/icon.ico",
                "--add-data", "assets;assets", "--add-data", "levels;levels", "main.py"]
dev = pyinstaller_command("game.py", "Dev", onefile=False, windowed=False, data=[("assets", "assets")])
assert dev == ["pyinstaller", "--name", "Dev", "--add-data", "assets:assets", "game.py"]
mac = pyinstaller_command("m.py", "M", platform="darwin", data=(("a", "a"),))
assert mac[-3:] == ["--add-data", "a:a", "m.py"]
assert pyinstaller_command("m.py", "M", icon="")[-1] == "m.py" and "--icon" not in pyinstaller_command("m.py", "M", icon="")`,
      checks: ['`resource_path` uses `meipass` when it is truthy, otherwise `base_dir`, and returns a forward-slash string', '`add_data_arg` uses `;` on `win32` and `:` elsewhere', '`pyinstaller_command` builds the argument list in the stated order, including only the options that are on'],
      hint: 'For the command, start with `["pyinstaller", "--name", name]` and add pieces with `append` and `+=`. Loop over `data` as `for src, dest in data:`.',
      explanation: 'Building the command as a **list** (never a string you splice together) is also how you would hand it to `subprocess.run`, with no quoting problems. The `platform` parameter is the same trick as before: pass in `sys.platform` in real use, and test every system from one computer.',
    },
    {
      kind: 'code',
      prompt: 'Write `bump_version(version, part)` for a version string `"MAJOR.MINOR.PATCH"` (three non-negative whole numbers separated by dots). `part` is `"major"` (increase major, reset minor and patch to 0), `"minor"` (increase minor, reset patch) or `"patch"` (increase patch). Return the new version string. Raise `ValueError` if the version is not three non-negative whole numbers (for example `"1.2"`, `"1.2.x"`, `"1.2.3.4"`, `"-1.2.3"`) or `part` is unknown. Then write `release_name(app, version, platform)` returning `"<app>-<version>-<os>.zip"`, where `app` is lower-cased with spaces replaced by hyphens, and `os` is `"windows"` for `"win32"`, `"macos"` for `"darwin"` and `"linux"` for `"linux"`; any other platform raises `ValueError`.',
      starter: `def bump_version(version, part):
    ...


def release_name(app, version, platform):
    ...
`,
      solution: `def bump_version(version, part):
    pieces = version.split(".")
    if len(pieces) != 3 or not all(p.isdigit() for p in pieces):
        raise ValueError("bad version: " + version)
    major, minor, patch = (int(p) for p in pieces)
    if part == "major":
        major, minor, patch = major + 1, 0, 0
    elif part == "minor":
        minor, patch = minor + 1, 0
    elif part == "patch":
        patch += 1
    else:
        raise ValueError("unknown part: " + part)
    return f"{major}.{minor}.{patch}"


def release_name(app, version, platform):
    systems = {"win32": "windows", "darwin": "macos", "linux": "linux"}
    if platform not in systems:
        raise ValueError("unknown platform: " + platform)
    slug = app.lower().replace(" ", "-")
    return f"{slug}-{version}-{systems[platform]}.zip"
`,
      tests: `assert bump_version("1.2.3", "patch") == "1.2.4"
assert bump_version("1.2.3", "minor") == "1.3.0"
assert bump_version("1.2.3", "major") == "2.0.0"
assert bump_version("2.9.9", "patch") == "2.9.10", "parts are numbers, not decimals"
assert bump_version("0.0.0", "minor") == "0.1.0"
assert bump_version("1.9.9", "minor") == "1.10.0"
assert bump_version("10.20.30", "major") == "11.0.0"
for bad in ["1.2", "1.2.x", "1.2.3.4", "-1.2.3", "", "1..3", "a.b.c", "1.2.3 "]:
    try:
        bump_version(bad, "patch")
        assert False, "should reject " + repr(bad)
    except ValueError:
        pass
try:
    bump_version("1.2.3", "huge")
    assert False, "unknown part"
except ValueError:
    pass
assert release_name("Star Defender", "1.2.0", "win32") == "star-defender-1.2.0-windows.zip"
assert release_name("Star Defender", "1.2.0", "darwin") == "star-defender-1.2.0-macos.zip"
assert release_name("Pong", "0.1.0", "linux") == "pong-0.1.0-linux.zip"
assert release_name("My Big Game", "2.0.0", "linux") == "my-big-game-2.0.0-linux.zip"
try:
    release_name("Pong", "1.0.0", "freebsd")
    assert False, "unknown platform"
except ValueError:
    pass`,
      checks: ['`bump_version` increases the chosen part, resets the lower parts, and treats parts as whole numbers (`2.9.9` becomes `2.9.10`)', 'Malformed versions and unknown parts raise `ValueError`', '`release_name` lower-cases the app name, hyphenates spaces, and maps the platform to windows, macos or linux'],
      hint: 'Split on `"."`, check `len(pieces) == 3` and `all(p.isdigit() for p in pieces)`, convert with `int`, then one `if/elif` per part. `release_name` can use a dictionary from platform to OS name.',
      explanation: 'Validating before converting matters: `int("x")` would raise a `ValueError` with a confusing message, and `"-1".isdigit()` is `False`, which cleanly rejects negative parts. Since these are plain functions, a release script can call them to name and number every build the same way.',
    },
    {
      kind: 'code',
      prompt: 'Write `audit_build(files, required, unwanted_suffixes=(".psd", ".xcf", ".blend", ".bak", ".tmp"))`. `files` is a list of file paths (strings with forward slashes) found in the build, and `required` is a list of paths that must be present. Return a dictionary with three keys: `"missing"` (the required paths that are not in `files`, sorted), `"unwanted"` (the paths in `files` that end with one of the unwanted suffixes, **ignoring upper or lower case**, sorted) and `"ok"` (`True` only if both lists are empty).',
      starter: `def audit_build(files, required, unwanted_suffixes=(".psd", ".xcf", ".blend", ".bak", ".tmp")):
    ...
`,
      solution: `def audit_build(files, required, unwanted_suffixes=(".psd", ".xcf", ".blend", ".bak", ".tmp")):
    present = set(files)
    missing = sorted(path for path in required if path not in present)
    suffixes = tuple(s.lower() for s in unwanted_suffixes)
    unwanted = sorted(path for path in files if path.lower().endswith(suffixes))
    return {"missing": missing, "unwanted": unwanted, "ok": not missing and not unwanted}
`,
      tests: `files = ["StarDefender.exe", "assets/icon.png", "assets/sounds/shoot.wav", "README.txt"]
required = ["StarDefender.exe", "assets/icon.png", "README.txt"]
r = audit_build(files, required)
assert r == {"missing": [], "unwanted": [], "ok": True}
r = audit_build(files, required + ["LICENSE.txt", "assets/music/theme.ogg"])
assert r["missing"] == ["LICENSE.txt", "assets/music/theme.ogg"] and r["ok"] is False
assert r["unwanted"] == []
dirty = files + ["art/ship.PSD", "assets/notes.bak", "tmp/cache.tmp", "assets/model.blend", "art/ship.xcf"]
r = audit_build(dirty, required)
assert r["unwanted"] == ["art/ship.PSD", "art/ship.xcf", "assets/model.blend", "assets/notes.bak", "tmp/cache.tmp"], r["unwanted"]
assert r["missing"] == [] and r["ok"] is False
both = audit_build(["a.tmp"], ["b.png"])
assert both == {"missing": ["b.png"], "unwanted": ["a.tmp"], "ok": False}
assert audit_build([], []) == {"missing": [], "unwanted": [], "ok": True}
custom = audit_build(["notes.txt", "a.png"], [], unwanted_suffixes=(".txt",))
assert custom["unwanted"] == ["notes.txt"] and custom["ok"] is False
assert audit_build(["assets/psd_guide.png", "backup.png"], []) == {"missing": [], "unwanted": [], "ok": True}, "only the end of the name counts"
assert files == ["StarDefender.exe", "assets/icon.png", "assets/sounds/shoot.wav", "README.txt"], "the input is not changed"`,
      checks: ['`missing` lists required paths that are absent, sorted', '`unwanted` lists files whose name ends with an unwanted suffix, ignoring case, sorted', '`ok` is true only when both lists are empty'],
      hint: 'Make a `set` of the files for fast lookups. For the suffix test, `str.endswith` accepts a **tuple** of suffixes: `path.lower().endswith(tuple_of_lowercase_suffixes)`.',
      explanation: 'Run a function like this on the real list of files in `dist/` (from `os.walk`) before every release. It catches the missing sound and the stray 200 MB source image that would otherwise be found by your players. Note `str.endswith` with a tuple: one call tests many suffixes.',
    },
  ],
  takeaways: [
    '**Freezing** bundles Python, pygame, your code and your assets so that a player needs nothing installed. **PyInstaller** does this for Windows, macOS and Linux, but only for the system you build on: it does not cross-compile.',
    'A typical command: `pyinstaller --onefile --windowed --name Game --icon icon.ico --add-data "assets;assets" main.py` (`;` on Windows, `:` elsewhere). Leave the console on while testing; add `--windowed` for the release.',
    'Imports are found automatically, **data files are not**: add them with `--add-data`, and find them at run time with a `resource_path` helper that uses `sys._MEIPASS` when frozen and the script’s folder otherwise (`getattr(sys, "_MEIPASS", None)`).',
    'For the web, **pygbag** needs an `async` main loop that ends each frame with `await asyncio.sleep(0)` and starts with `asyncio.run(main())`. Test locally in a browser, then upload the build to a site such as itch.io.',
    'Use **semantic versions** (`MAJOR.MINOR.PATCH`, compared as numbers), keep the version in one constant, and name release files consistently, such as `star-defender-1.2.0-windows.zip`.',
    'Turn the release checklist into code: list what is **missing** and what is **unwanted** in the build folder, and test the result on a computer that does not have Python.',
  ],
  reading: [
    { title: 'PyInstaller manual: usage and `--add-data`', url: 'https://pyinstaller.org/en/stable/usage.html', source: 'docs', note: 'All the command-line options, including `--onefile`, `--windowed` and `--add-data`.' },
    { title: 'PyInstaller manual: run-time information (`sys._MEIPASS`)', url: 'https://pyinstaller.org/en/stable/runtime-information.html', source: 'docs', note: 'How a frozen program finds its own files, and how `sys.frozen` is used.' },
    { title: 'pygbag: running pygame in the browser', url: 'https://pygame-web.github.io/', source: 'docs', note: 'The pygbag project: how to build and publish a pygame game for the web.' },
    { title: 'Semantic Versioning 2.0.0', url: 'https://semver.org/', source: 'article', note: 'The rules behind MAJOR.MINOR.PATCH.' },
  ],
};
