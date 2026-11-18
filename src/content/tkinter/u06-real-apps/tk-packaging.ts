import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'tk-packaging',
  title: 'Packaging and Shipping Your App',
  summary: 'Turn a tkinter program into something a person without Python can install: bundle it with PyInstaller, find bundled files and a settings folder correctly, wrap it in an installer, and build for each operating system in CI.',
  minutes: 34,
  objectives: [
    'Explain what a frozen application is and why people without Python can run one',
    'Build a windowed single-file or single-folder app with PyInstaller, with an icon and bundled data files',
    'Locate bundled resources with `sys.frozen` and `sys._MEIPASS`, so that the program works both from source and when frozen',
    'Store settings in the per-user folder for each operating system, and survive a missing or damaged settings file',
    'Describe installers, code signing and antivirus false positives, and build for each operating system in CI',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What packaging means',
      blocks: [
        {
          type: 'p',
          text: 'Your program works on your computer because Python and every library it imports are installed there. Most people who might use it have none of that, and should not need to. **Packaging** means building a bundle that contains your code, a Python interpreter, the libraries and the data files, so that the program runs when someone double-clicks it. A program prepared this way is called a **frozen** application.',
        },
        {
          type: 'table',
          headers: ['Tool', 'What it does', 'Good for'],
          rows: [
            ['**PyInstaller**', 'Follows your imports, collects everything and builds an executable, as one file or one folder', 'The usual first choice for tkinter apps on Windows, macOS and Linux'],
            ['**cx_Freeze**', 'A similar freezer, driven by a `setup.py` and able to produce installers', 'Projects that already use setuptools'],
            ['**Nuitka**', 'Translates the Python to C and compiles it', 'Speed and smaller, harder-to-extract programs; long builds'],
            ['**Briefcase**', 'Builds native installers and app bundles, including for mobile', 'Apps built with BeeWare, or when you want proper installers on every platform'],
            ['`pip install` / `pipx`', 'No bundle: the user installs from a package index', 'Developers and tools used from a terminal'],
          ],
          caption: 'Ways to ship Python software. This lesson uses PyInstaller.',
        },
        {
          type: 'p',
          text: 'PyInstaller works in two modes. **One-folder** (`--onedir`, the default) makes a folder with a small launcher and many files next to it. It starts quickly and is easy to inspect and to wrap with an installer. **One-file** (`--onefile`) packs everything into a single executable that **unpacks itself to a temporary folder every time it starts**. That is convenient to hand around, but starts more slowly, and is more likely to be flagged by antivirus software. A PyInstaller build is **not a cross-compiler**: a Windows program must be built on Windows, a macOS app on macOS.',
        },
        {
          type: 'code',
          title: 'Build commands',
          lang: 'shell',
          code: `pip install pyinstaller

pyinstaller --noconfirm --onefile --windowed --name Editor --icon app.ico editor.py

pyinstaller --noconfirm --windowed --name Editor --add-data "assets;assets" editor.py`,
          annotations: [
            { lines: '3', text: '`--onefile` makes a single executable. `--windowed` (also `--noconsole`) stops the black console window from opening behind a GUI program. `--name` sets the name of the result, and `--icon` its icon (an `.ico` file on Windows, `.icns` on macOS). The output goes in the `dist` folder.' },
            { lines: '5', text: '`--add-data` copies a folder of files (images, sounds, templates) into the bundle. The separator between source and destination is `;` on Windows and `:` on macOS and Linux.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Test on a clean machine',
          text: 'The most common packaging bug is a program that runs on your computer, because Python is there, and fails on everyone else’s. Before you ship, run the result on a computer, a virtual machine or a fresh user account that has never had Python or your project folder. Run it from a different folder than the one it was built in, too.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A user double-clicks your `--onefile` program, and the window appears only after several seconds. What is the most likely cause?',
      options: [
        { text: 'The executable unpacks all of its bundled files to a temporary folder every time it starts', correct: true, why: 'That extraction step is the price of the single file. A one-folder build already has its files on disk, so it starts much faster.' },
        { text: 'Python has to compile all of your `.py` files from scratch on each start', why: 'PyInstaller bundles your code already compiled to bytecode. Compilation is not what takes the time.' },
        { text: 'The `--windowed` option makes the program wait for a console that never opens', why: 'It does the opposite: it removes the console.' },
        { text: 'Tkinter downloads its widgets from the internet when it starts', why: 'Tk is bundled in the executable. No download takes place.' },
      ],
      explanation: 'If start-up time matters, ship a one-folder build wrapped in an installer. The installer then gives the user a single file to download, and the program itself starts quickly.',
    },
    {
      kind: 'truefalse',
      prompt: 'You can build a Windows `.exe` from a Linux computer with PyInstaller, as long as you add the `--windows` option.',
      answer: false,
      explanation: 'False. There is no such option: PyInstaller bundles the interpreter and the libraries of the machine that it runs on, so a Windows build must be made on Windows. The practical answer is a CI service that has a machine of each kind, and builds all of them on every release.',
    },
    {
      kind: 'concept',
      title: 'Finding your files, and where to keep settings',
      blocks: [
        {
          type: 'heading',
          text: 'Bundled files',
        },
        {
          type: 'p',
          text: 'A script that opens `"assets/icon.png"` works only when the **current directory** happens to be the project folder. Double-click the frozen program from somewhere else and the file is not found. Worse, a one-file build unpacks to a temporary folder that changes on every run. PyInstaller tells your code where the bundle is: it sets `sys.frozen` to `True`, and `sys._MEIPASS` to the folder with the bundled data. When the program runs from source, neither exists, so you use the folder that contains the script instead. Wrap this in one function and ask it for every file path.',
        },
        {
          type: 'code',
          title: 'resources.py',
          code: `import os
import sys


def resource_path(relative):
    if getattr(sys, "frozen", False):
        base = sys._MEIPASS
    else:
        base = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base, relative)


icon_file = resource_path("assets/icon.png")`,
          annotations: [
            { lines: '6-9', text: '`getattr(sys, "frozen", False)` is safe on a normal Python, where the attribute does not exist. When it is true, `sys._MEIPASS` is the bundle folder; otherwise the script’s own folder is used.' },
            { lines: '10', text: '`os.path.join` builds a path with the right separator for the operating system. All paths to bundled files should go through this function.' },
          ],
        },
        {
          type: 'heading',
          text: 'Settings and saved data',
        },
        {
          type: 'p',
          text: 'The bundle is **read-only in spirit**: a one-file build is thrown away at exit, and a program installed in `Program Files` is not allowed to write next to itself. Anything the user changes (preferences, recent files, saved games) belongs in a **per-user settings folder**, and every operating system has its own convention for it:',
        },
        {
          type: 'table',
          headers: ['System', 'Usual folder'],
          rows: [
            ['Windows', '`%APPDATA%\\AppName`, which is `C:\\Users\\Ann\\AppData\\Roaming\\AppName`'],
            ['macOS', '`~/Library/Application Support/AppName`'],
            ['Linux', '`XDG_CONFIG_HOME/AppName`, or `~/.config/AppName` when that variable is not set'],
          ],
          caption: 'Where each system expects an app to keep its settings.',
        },
        {
          type: 'p',
          text: 'The function below computes that folder from plain arguments (the platform name, the environment and the home folder), instead of asking the system. That makes it testable on any computer. In the real program you would pass `sys.platform`, `os.environ` and `os.path.expanduser("~")`, and create the folder with `os.makedirs(path, exist_ok=True)`. It uses `ntpath` and `posixpath`, the two modules that `os.path` is made from: Windows paths use backslashes, and the others use forward slashes.',
        },
        {
          type: 'code',
          title: 'settings_dir.py',
          runnable: true,
          code: `import ntpath
import posixpath


def settings_dir(app, platform, env, home):
    if platform == "win32":
        base = env.get("APPDATA") or ntpath.join(home, "AppData", "Roaming")
        return ntpath.join(base, app)
    if platform == "darwin":
        return posixpath.join(home, "Library", "Application Support", app)
    base = env.get("XDG_CONFIG_HOME") or posixpath.join(home, ".config")
    return posixpath.join(base, app)


print(settings_dir("Notes", "win32", {"APPDATA": r"C:\\Users\\Ann\\AppData\\Roaming"}, r"C:\\Users\\Ann"))
print(settings_dir("Notes", "darwin", {}, "/Users/ann"))
print(settings_dir("Notes", "linux", {}, "/home/ann"))
print(settings_dir("Notes", "linux", {"XDG_CONFIG_HOME": "/data/cfg"}, "/home/ann"))`,
          output: `C:\\Users\\Ann\\AppData\\Roaming\\Notes
/Users/ann/Library/Application Support/Notes
/home/ann/.config/Notes
/data/cfg/Notes`,
          annotations: [
            { lines: '6-8', text: 'On Windows, the `APPDATA` environment variable already names the right folder. If it is missing, the function falls back to the usual place under the home folder.' },
            { lines: '11-12', text: 'Any platform that is not Windows or macOS is treated as Linux, and follows the XDG rule: use `XDG_CONFIG_HOME` if the user set it, and `~/.config` otherwise.' },
          ],
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the check that tells a frozen PyInstaller program from a script run from source.',
      template: `if getattr(sys, "___", False):
    base = sys.___`,
      templateIsCode: true,
      blanks: [{ answers: ['frozen'] }, { answers: ['_MEIPASS'] }],
      wordBank: ['frozen', '_MEIPASS', 'executable', 'argv', 'path'],
      explanation: 'PyInstaller sets `sys.frozen` to `True` in a frozen program, and `sys._MEIPASS` to the folder that holds the bundled data files.',
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. (`ntpath` builds Windows paths, `posixpath` builds the paths used by macOS and Linux.)',
      code: `import ntpath
import posixpath

print(ntpath.join(r"C:\\Users\\Ann", "Notes"), posixpath.join("/home/ann", "Notes"))`,
      answer: 'C:\\Users\\Ann\\Notes /home/ann/Notes',
      hint: 'One path uses backslashes, the other forward slashes.',
      explanation: 'Each module joins with its own system’s separator. The `os.path` module is one of these two, chosen when Python starts, which is why `os.path.join` always gives a path that is right for the machine it is running on.',
    },
    {
      kind: 'concept',
      title: 'Installers, signing and shipping',
      blocks: [
        {
          type: 'p',
          text: 'A folder of files, or a bare `.exe`, is a build. A **release** is what a user can download and install without help. These are the parts that turn one into the other:',
        },
        {
          type: 'table',
          headers: ['Step', 'What it is', 'Tools'],
          rows: [
            ['**Installer**', 'One file that copies the program to the right place, adds a Start menu entry and an uninstaller', 'Inno Setup or NSIS (Windows), `.dmg` or `.pkg` (macOS), `.deb` or AppImage (Linux)'],
            ['**Code signing**', 'A certificate stamps your name on the program. Without it, Windows SmartScreen and macOS Gatekeeper warn the user that the program is from an “unknown publisher”', 'A paid code-signing certificate; an Apple Developer account for macOS notarization'],
            ['**Version number**', 'A visible version (`1.2.0`) in the About box and the file properties, so a bug report says which build it is from', 'A single `__version__` string that the build reads'],
            ['**Updates**', 'Some way for users to learn about a new version: a link on your website, a check at start-up, or an update library', 'Start simple: show the version and link to the download page'],
            ['**Licences**', 'Python, Tk and each library you bundle have licences that must be respected', 'Include a `LICENSES` file; check what each dependency requires'],
          ],
          caption: 'From a build to a release.',
        },
        {
          type: 'p',
          text: 'Unsigned programs, and one-file PyInstaller programs especially, are sometimes flagged as suspicious by antivirus software. This is a **false positive**: the bootloader that PyInstaller uses looks like the one that some malware uses too. You can lower the chance by building a one-folder app, by building PyInstaller’s bootloader yourself, by signing, and by submitting the file to the antivirus vendors as a false positive. You cannot remove it completely, so say so on your download page.',
        },
        {
          type: 'p',
          text: 'Because a build must be made on its own operating system, a release is best produced by **continuous integration**: a service that runs your build on a fresh machine of each kind every time. This GitHub Actions workflow builds the editor on all three systems and keeps the results:',
        },
        {
          type: 'code',
          title: '.github/workflows/build.yml',
          lang: 'yaml',
          code: `name: build
on:
  push:
    tags: ["v*"]
jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.12"
      - run: pip install pyinstaller
      - run: pyinstaller --noconfirm --onefile --windowed --name Editor editor.py
      - uses: actions/upload-artifact@v4
        with:
          name: Editor-\${{ matrix.os }}
          path: dist/*`,
          annotations: [
            { lines: '3-4', text: 'The workflow runs when a tag that starts with `v` is pushed (for instance `v1.0.0`), which is a natural way to mark a release.' },
            { lines: '7-10', text: 'A **matrix** runs the same job once for each listed system. Each job gets a clean machine, so it also tests that the build does not depend on anything you installed by hand.' },
            { lines: '17-21', text: 'Each job builds with the same command and uploads its `dist` folder under a different name, so the three downloads do not overwrite each other.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why bother with all this',
          text: 'A program that only runs on the machine that wrote it is a prototype. The difference between a prototype and a product is mostly the dull parts: a clean install, a place for settings, a version number, a way to report a problem. None of it is hard, but all of it has to be done, and doing it once in a build script means that it is done every time.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'A frozen app is started from the desktop and fails at the highlighted step with `_tkinter.TclError: couldn\'t open "assets/icon.png": no such file or directory`. Tap the line that raises it.',
      lines: [
        'import tkinter as tk',
        'root = tk.Tk()',
        'icon = tk.PhotoImage(file="assets/icon.png")',
        'root.iconphoto(True, icon)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'The relative path `assets/icon.png` is looked up from the current directory, which for a program started from the desktop is not where the files are. The fix is `tk.PhotoImage(file=resource_path("assets/icon.png"))`, with the `resource_path` function from this lesson, and `--add-data` in the build command, so that the file is in the bundle at all.',
    },
    {
      kind: 'numeric',
      prompt: 'How many items are in this list? `["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "Notes", "notes.py"]`',
      answer: '7',
      hint: 'An option and its value, like `--name` and `Notes`, are two separate items.',
      explanation: 'The list has seven items. A command line is passed to a program as a list of separate words, which is why `subprocess.run(command)` with a list is safer than building one long string: no quoting problems with spaces. The third exercise builds exactly this kind of list.',
      label: 'Items:',
    },
    {
      kind: 'concept',
      title: 'Your turn: the pieces of a build',
      blocks: [
        {
          type: 'p',
          text: 'Three exercises, all pure Python so that they can be tested anywhere: finding a resource path for a frozen or unfrozen program, reading settings that may not be there, and assembling a PyInstaller command line.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'Write `resource_path(relative, frozen=False, meipass=None, script_dir=".")`. If `frozen` is true, the base folder is `meipass`, otherwise it is `script_dir`. Return the base joined with `relative` using `os.path.join`. The relative path is written with forward slashes (like `"assets/icon.png"`), so split it on `"/"` and join the parts.',
      starter: `import os


def resource_path(relative, frozen=False, meipass=None, script_dir="."):
    ...
`,
      solution: `import os


def resource_path(relative, frozen=False, meipass=None, script_dir="."):
    base = meipass if frozen else script_dir
    return os.path.join(base, *relative.split("/"))
`,
      tests: `assert resource_path("assets/icon.png", script_dir="/home/ann/app") == "/home/ann/app/assets/icon.png"
assert resource_path("assets/icon.png", True, "/tmp/_MEI4821", "/home/ann/app") == "/tmp/_MEI4821/assets/icon.png"
assert resource_path("data.json", frozen=True, meipass="/b") == "/b/data.json"
assert resource_path("a/b/c.txt", frozen=False, meipass="/ignored", script_dir="/s") == "/s/a/b/c.txt"
assert resource_path("x.png") == os.path.join(".", "x.png")`,
      checks: ['Picks `meipass` when `frozen` is true, and `script_dir` otherwise', 'Uses `os.path.join` rather than gluing strings together', 'Splits the forward-slash path into parts so that it works on every system'],
      hint: '`os.path.join(base, *parts)` accepts any number of parts: `*relative.split("/")` unpacks the pieces of the relative path.',
      explanation: 'In the real program, you would call it as `resource_path("assets/icon.png", getattr(sys, "frozen", False), getattr(sys, "_MEIPASS", None), os.path.dirname(os.path.abspath(__file__)))`, once, in one helper. Taking the facts as parameters means the logic can be tested without freezing anything.',
    },
    {
      kind: 'code',
      prompt: 'Write `load_settings(text, defaults)`. `text` is the content of a settings file (or an empty string if there was no file). Return a **new** dictionary that starts as a copy of `defaults`. If `text` is valid JSON for a dictionary, copy over the values of the keys that also exist in `defaults`, and ignore any other keys. If `text` is empty, is not valid JSON, or is JSON that is not a dictionary, return just the copy of the defaults. Never change `defaults` itself.',
      starter: `import json


def load_settings(text, defaults):
    ...
`,
      solution: `import json


def load_settings(text, defaults):
    settings = dict(defaults)
    try:
        loaded = json.loads(text)
    except ValueError:
        return settings
    if isinstance(loaded, dict):
        for key in defaults:
            if key in loaded:
                settings[key] = loaded[key]
    return settings
`,
      tests: `defaults = {"theme": "light", "size": 12, "recent": []}
s = load_settings("", defaults)
assert s == defaults and s is not defaults
s["theme"] = "dark"
assert defaults["theme"] == "light", "defaults must not be changed"
assert load_settings('{"theme": "dark"}', defaults) == {"theme": "dark", "size": 12, "recent": []}
assert load_settings('{"theme": "dark", "size": 16, "recent": ["a.txt"]}', defaults) == {"theme": "dark", "size": 16, "recent": ["a.txt"]}
assert load_settings('{"theme": "dark", "unknown": 1}', defaults) == {"theme": "dark", "size": 12, "recent": []}
assert load_settings("{not json", defaults) == defaults
assert load_settings("[1, 2, 3]", defaults) == defaults
assert load_settings("null", defaults) == defaults
assert load_settings('"text"', defaults) == defaults
assert load_settings("   ", defaults) == defaults
assert load_settings("{}", {}) == {}`,
      checks: ['Starts from a copy of the defaults (`dict(defaults)`), so the original is never changed', 'Invalid, empty or non-dictionary JSON gives the defaults', 'Only keys that exist in `defaults` are taken from the file'],
      hint: '`json.loads("")` raises `json.JSONDecodeError`, which is a kind of `ValueError`, so one `except ValueError:` covers empty and broken text.',
      explanation: 'Settings files are written by an earlier version of your program, by the user, or by a crash half-way through a write. A reader that tolerates all of this, and always returns a complete set of values, means the rest of the program never has to check whether a setting exists.',
    },
    {
      kind: 'code',
      prompt: 'Write `build_command(name, script, platform="linux", onefile=True, windowed=True, icon=None, data=())`. Return the PyInstaller command as a list of words, in this order: `"pyinstaller"`, `"--noconfirm"`, then `"--onefile"` if `onefile` else `"--onedir"`, then `"--windowed"` only if `windowed`, then `"--name"` and the name, then `"--icon"` and the icon only if there is one, then for each `(source, destination)` pair in `data` the two words `"--add-data"` and `"source:destination"` (use `";"` instead of `":"` when `platform` is `"win32"`), and last the script.',
      starter: `def build_command(name, script, platform="linux", onefile=True, windowed=True, icon=None, data=()):
    ...
`,
      solution: `def build_command(name, script, platform="linux", onefile=True, windowed=True, icon=None, data=()):
    sep = ";" if platform == "win32" else ":"
    command = ["pyinstaller", "--noconfirm", "--onefile" if onefile else "--onedir"]
    if windowed:
        command.append("--windowed")
    command += ["--name", name]
    if icon:
        command += ["--icon", icon]
    for source, destination in data:
        command += ["--add-data", f"{source}{sep}{destination}"]
    command.append(script)
    return command
`,
      tests: `assert build_command("Notes", "notes.py") == ["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "Notes", "notes.py"]
assert build_command("Notes", "notes.py", onefile=False, windowed=False) == ["pyinstaller", "--noconfirm", "--onedir", "--name", "Notes", "notes.py"]
assert build_command("Notes", "n.py", icon="app.ico") == ["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "Notes", "--icon", "app.ico", "n.py"]
assert build_command("Notes", "n.py", data=[("assets", "assets")]) == ["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "Notes", "--add-data", "assets:assets", "n.py"]
assert build_command("Notes", "n.py", "win32", data=[("assets", "assets"), ("lang", "lang")]) == ["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "Notes", "--add-data", "assets;assets", "--add-data", "lang;lang", "n.py"]
assert build_command("A B", "x.py", "darwin", icon="a.icns", data=(("d", "e"),)) == ["pyinstaller", "--noconfirm", "--onefile", "--windowed", "--name", "A B", "--icon", "a.icns", "--add-data", "d:e", "x.py"]`,
      checks: ['The words are in the specified order, with `--onedir` or `--onefile`, and `--windowed` only when asked', '`--icon` appears only when an icon is given, and the name stays one word even with a space in it', 'Each data pair becomes `"--add-data"` plus `source` and `destination` joined by `;` on Windows and `:` elsewhere, and the script is last'],
      hint: 'Start with a list and use `+=` with a two-item list for each option and its value. Choose the separator once at the top: `sep = ";" if platform == "win32" else ":"`.',
      explanation: 'Building the command as a **list** has two benefits: a name with a space in it stays a single argument, and the list can be passed straight to `subprocess.run`, with no shell and no quoting. The same function can serve a local build script and the CI workflow, with the system name as the only difference.',
    },
  ],
  takeaways: [
    'Packaging bundles your code, an interpreter, the libraries and the data into something that runs without Python installed: a **frozen** application. PyInstaller is the usual tool for tkinter.',
    '`pyinstaller --onefile --windowed --name N --icon app.ico script.py` makes one file with no console window. One-file starts more slowly (it unpacks to a temporary folder) and is flagged by antivirus more often; one-folder plus an installer is smoother.',
    'You cannot cross-compile: build on each system you target, with a CI matrix that runs on Windows, macOS and Linux.',
    'Find bundled files with `sys.frozen` and `sys._MEIPASS` (or the script’s folder when running from source), never with a relative path, and include them with `--add-data`.',
    'Keep user data in the per-user settings folder (APPDATA, Application Support, `~/.config`), not next to the program. Read settings defensively: the file may be missing, damaged or old.',
    'A release also needs an installer, a version number, a licence file and, ideally, code signing. Test on a clean machine, from a different folder than the one you built in.',
  ],
  reading: [
    { title: 'PyInstaller manual', url: 'https://pyinstaller.org/en/stable/', source: 'docs', note: 'Usage, the spec file, hooks for libraries that need help, and “runtime information” (`sys.frozen`, `_MEIPASS`).' },
    { title: 'Python Packaging User Guide', url: 'https://packaging.python.org/', source: 'docs', note: 'The official guide to distributing Python software: packages, wheels, and applications.' },
    { title: 'Inno Setup documentation', url: 'https://jrsoftware.org/isinfo.php', source: 'docs', note: 'A free installer builder for Windows, driven by a simple script.' },
    { title: 'Briefcase (BeeWare)', url: 'https://briefcase.readthedocs.io/', source: 'docs', note: 'Builds native installers and app bundles for desktop and mobile from a Python project.' },
    { title: 'GitHub Actions: using a matrix for your jobs', url: 'https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs', source: 'docs', note: 'How to run the same build on several operating systems.' },
  ],
};
