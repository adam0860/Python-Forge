import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-pathlib',
  title: 'Paths with pathlib',
  summary: 'Treat file paths as objects: build them with `/`, take them apart with `name`, `stem`, `suffix` and `parent`, create, list, search, copy and delete files and folders with `pathlib.Path`, and keep user-supplied paths from escaping a folder.',
  minutes: 17,
  objectives: [
    'Build and take apart paths with `Path`, the `/` operator and properties such as `name`, `stem`, `suffix`, `parent` and `parts`',
    'Explain the difference between pure paths (`PurePosixPath`, `PureWindowsPath`) and concrete `Path` objects that touch the disk',
    'Create folders, read and write text, list folders and search with `glob` and `rglob`',
    'Compare `pathlib` with `os.path`, and avoid backslash and separator pitfalls on Windows',
    'Write a `safe_join` that stops a user-supplied name from escaping a base folder',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Paths are objects, not strings',
      blocks: [
        {
          type: 'p',
          text: 'A path like `"assets/sprites/hero.png"` is more than text: it has a folder, a file name, an extension — and a separator that is `/` on Linux and macOS but `\\` on Windows. Joining strings by hand (`folder + "/" + name`) breaks the moment a program runs on another platform. The `pathlib` module wraps a path in an **object** that knows how to do all of this correctly.',
        },
        {
          type: 'p',
          text: 'Build paths with the `/` operator, and read their parts from properties. These operations are pure computation: they never touch the disk, so the file does not even have to exist.',
        },
        {
          type: 'code',
          title: 'path_parts.py',
          runnable: true,
          code: `from pathlib import Path, PurePosixPath, PureWindowsPath
p = Path("assets") / "sprites" / "hero.png"
print(p)
print(p.name, p.stem, p.suffix, p.parent, p.parts)
print(p.with_suffix(".webp"), p.with_name("villain.png"))
print(p.parent.parent, p.is_absolute())
w = PureWindowsPath("C:/Games/Forge/save.dat")
print(w, w.drive, w.parts, w.name)
print(PureWindowsPath("saves") / "slot1.json")
print(PurePosixPath("saves") / "slot1.json")
print(Path("data.tar.gz").suffixes, Path("data.tar.gz").suffix)
print(PurePosixPath("a/b/c.py").relative_to("a"))
print(Path("/a/b") / "/etc")`,
          output: `assets/sprites/hero.png
hero.png hero .png assets/sprites ('assets', 'sprites', 'hero.png')
assets/sprites/hero.webp assets/sprites/villain.png
assets False
C:\\Games\\Forge\\save.dat C: ('C:\\\\', 'Games', 'Forge', 'save.dat') save.dat
saves\\slot1.json
saves/slot1.json
['.tar', '.gz'] .gz
b/c.py
/etc`,
          annotations: [
            { lines: 2, text: 'The `/` operator joins path pieces. No separators to type or forget; the right one is chosen for the platform. (Run on Windows, line 3 would print backslashes.)' },
            { lines: 4, text: '`name` is the last piece, `stem` is the name without the final extension, `suffix` is the extension with its dot, `parent` is the folder and `parts` is the tuple of every component.' },
            { lines: 5, text: '`with_suffix` and `with_name` return a **new** path with that piece replaced. Paths are immutable.' },
            { lines: 6, text: '`parent` can be chained to climb up. A path that begins at `assets` is *relative*, so `is_absolute()` is `False`.' },
            { lines: '7-8', text: '**Pure paths** compute on any platform. `PureWindowsPath` understands drive letters and backslashes even when the program runs on Linux — handy for tools that must process paths from another system.' },
            { lines: '9-10', text: 'The same join, two platforms: backslash for Windows paths, slash for POSIX ones.' },
            { lines: 11, text: '`suffix` returns only the last extension; `suffixes` lists all of them. For `data.tar.gz`, `suffix` is `.gz`.' },
            { lines: 12, text: '`relative_to` removes a leading folder from a path.' },
            { lines: 13, text: 'A gotcha: joining with an **absolute** path discards everything before it, so `Path("/a/b") / "/etc"` is just `/etc`.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just use strings?',
          text: 'String paths work until they don’t: a doubled slash, a missing separator, a Windows backslash inside an ordinary string (`"C:\\new\\table"` contains a newline and a tab!), a file name that itself contains a dot. A `Path` makes the right thing the easy thing, and also lets you ask meaningful questions (`p.suffix == ".png"`) instead of slicing text.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++17’s `std::filesystem::path` is almost the same design — including the `/` operator for joining. If you have used `std::filesystem`, `pathlib` will feel instantly familiar.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What are `Path("archive.tar.gz").suffix` and `Path("archive.tar.gz").stem`?',
      options: [
        { text: '`.gz` and `archive`', why: '`suffix` is right, but `stem` removes only the *last* extension.' },
        { text: '`.tar.gz` and `archive`', why: '`suffix` is only the last extension; the full list is in `suffixes`.' },
        { text: '`.gz` and `archive.tar`', correct: true, why: 'Right: `suffix` is the final extension and `stem` is the name without that final extension.' },
        { text: '`.tar` and `gz`', why: 'Extensions are taken from the *end* of the file name.' },
      ],
      explanation: '`suffix` is the last extension (`.gz`) and `stem` is the file name with only that one removed (`archive.tar`). `suffixes` gives `[".tar", ".gz"]` when you need them all.',
    },
    {
      kind: 'concept',
      title: 'Working with real files and folders',
      blocks: [
        {
          type: 'p',
          text: 'A `Path` also has methods that act on the file system: checking existence, creating folders, reading and writing whole files in one call, listing folders and searching with patterns. `write_text` and `read_text` open, use and close the file for you, so for small files you often do not need `open` at all.',
        },
        {
          type: 'code',
          title: 'path_files.py',
          runnable: true,
          code: `import shutil
from pathlib import Path
root = Path("game_data")
saves = root / "saves"
saves.mkdir(parents=True, exist_ok=True)
(saves / "slot1.json").write_text('{"level": 3}\\n', encoding="utf-8")
(saves / "slot2.json").write_text('{"level": 7}\\n', encoding="utf-8")
(root / "notes.txt").write_text("hello\\n", encoding="utf-8")
print(saves.exists(), saves.is_dir(), (saves / "slot1.json").is_file())
print((saves / "slot1.json").read_text(encoding="utf-8"), end="")
print(sorted(p.name for p in saves.iterdir()))
print(sorted(str(p) for p in root.glob("*.txt")))
print(sorted(str(p) for p in root.rglob("*.json")))
print((saves / "slot1.json").stat().st_size)
(saves / "slot2.json").rename(saves / "slot9.json")
print(sorted(p.name for p in saves.glob("slot*.json")))
(saves / "slot9.json").unlink()
(saves / "slot1.json").copy(saves / "backup.json")
print(sorted(p.name for p in saves.iterdir()))
shutil.rmtree(root)
print(root.exists())`,
          output: `True True True
{"level": 3}
['slot1.json', 'slot2.json']
['game_data/notes.txt']
['game_data/saves/slot1.json', 'game_data/saves/slot2.json']
13
['slot1.json', 'slot9.json']
['backup.json', 'slot1.json']
False`,
          annotations: [
            { lines: 5, text: '`mkdir(parents=True, exist_ok=True)` creates the folder *and any missing parents*, and does nothing if it is already there. This one call is the safe way to "make sure the folder exists".' },
            { lines: '6-8', text: '`write_text` creates or replaces a file with the given text. (Note the `/` binds tighter than the call, so the parentheses around the path are needed.)' },
            { lines: 9, text: '`exists`, `is_dir` and `is_file` ask the operating system about the path.' },
            { lines: 10, text: '`read_text` returns the whole file as a string; `read_bytes` and `write_bytes` do the same for binary data.' },
            { lines: 11, text: '`iterdir()` yields the entries of a folder in **arbitrary order**, so wrap it in `sorted` when order matters.' },
            { lines: 12, text: '`glob("*.txt")` finds matches in this folder only.' },
            { lines: 13, text: '`rglob("*.json")` searches **recursively** through all subfolders.' },
            { lines: 14, text: '`stat()` returns file information; `st_size` is the size in bytes (13 characters here).' },
            { lines: 15, text: '`rename` moves or renames; `unlink` deletes a file.' },
            { lines: 16, text: '`glob("slot*.json")` uses wildcards: `*` matches any run of characters, `?` one character, `[abc]` a set.' },
            { lines: 18, text: '`Path.copy` is new in Python 3.14 (it joins `Path.move`). Before 3.14 you would use `shutil.copy`.' },
            { lines: 20, text: '`shutil.rmtree` deletes a folder and everything inside it — there is no undo, so double-check the path.' },
          ],
        },
        {
          type: 'table',
          headers: ['Task', 'pathlib', 'Older os / os.path'],
          rows: [
            ['join', '`Path("a") / "b"`', '`os.path.join("a", "b")`'],
            ['file name / extension', '`p.name`, `p.suffix`', '`os.path.basename(p)`, `os.path.splitext(p)`'],
            ['folder', '`p.parent`', '`os.path.dirname(p)`'],
            ['exists?', '`p.exists()`', '`os.path.exists(p)`'],
            ['make folders', '`p.mkdir(parents=True, exist_ok=True)`', '`os.makedirs(p, exist_ok=True)`'],
            ['list a folder', '`p.iterdir()`', '`os.listdir(p)`'],
            ['search', '`p.rglob("*.png")`', '`glob.glob("**/*.png", recursive=True)`'],
          ],
          caption: 'pathlib replaces most of `os.path`, with one object instead of many function calls. Both still work.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Be careful with delete and overwrite',
          text: '`unlink`, `rmtree` and `write_text` act immediately, with no recycle bin and no confirmation. Print the path (or check `is_relative_to` your game folder) before deleting something computed from user input or configuration.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Absolute versus relative paths',
          text: 'A relative path like `"saves"` is resolved against the *current working directory*, which depends on how the program was launched. `Path.cwd()` shows it, `p.resolve()` turns a path into an absolute one, and `Path.home()` is the user’s home folder. Inside a script file, `Path(__file__).parent` is the folder that contains the script — a stable anchor for bundled data files.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `from pathlib import Path
p = Path("a/b/c.txt")
print(p.with_suffix(".md").name, p.parent.name)`,
      answer: 'c.md b',
      hint: '`with_suffix` swaps the extension; `parent` is `a/b`, whose `name` is its last piece.',
      explanation: '`p.with_suffix(".md")` is `a/b/c.md`, and `.name` of that is `c.md`. `p.parent` is `a/b`, and its `name` is `b`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the code that makes sure a `saves` folder exists, then reads a file from it.',
      template: `from pathlib import Path
folder = Path("saves")
file = folder ___ "slot1.json"
folder.___(parents=True, exist_ok=True)
text = file.___(encoding="utf-8")`,
      templateIsCode: true,
      blanks: [{ answers: ['/'] }, { answers: ['mkdir'] }, { answers: ['read_text'] }],
      wordBank: ['/', '+', 'mkdir', 'makedirs', 'read_text', 'read'],
      explanation: 'The `/` operator joins path pieces. `mkdir(parents=True, exist_ok=True)` creates the folder if needed. `read_text(encoding="utf-8")` returns the file’s contents as a string. (`+` does not join paths, and `makedirs` belongs to the `os` module, not to `Path`.)',
    },
    {
      kind: 'concept',
      title: 'Patterns: searching and filtering',
      blocks: [
        {
          type: 'p',
          text: 'The real power shows up when you combine path properties with ordinary Python: filter `rglob` results by `suffix`, group files by type, turn absolute paths into relative ones for display. Remember that names are case-sensitive on Linux but not on Windows, so compare extensions after `.lower()`.',
        },
        {
          type: 'code',
          title: 'asset_scan.py',
          runnable: true,
          code: `from pathlib import Path
import shutil
root = Path("art")
for name in ["ui/button.PNG", "ui/readme.txt", "hero.jpg", "bg/sky.webp", "bg/notes.md"]:
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.touch()
exts = {".png", ".jpg", ".webp"}
found = sorted(p.relative_to(root).as_posix() for p in root.rglob("*") if p.suffix.lower() in exts)
print(found)
by_ext = {}
for p in root.rglob("*"):
    if p.is_file():
        by_ext.setdefault(p.suffix.lower(), []).append(p.name)
print({k: sorted(v) for k, v in sorted(by_ext.items())})
print(sorted(p.name for p in root.iterdir() if p.is_dir()))
shutil.rmtree(root)`,
          output: `['bg/sky.webp', 'hero.jpg', 'ui/button.PNG']
{'.jpg': ['hero.jpg'], '.md': ['notes.md'], '.png': ['button.PNG'], '.txt': ['readme.txt'], '.webp': ['sky.webp']}
['bg', 'ui']`,
          annotations: [
            { lines: '4-7', text: 'Build a small sample tree. `touch()` creates an empty file, and `path.parent.mkdir(...)` makes each file’s folder first.' },
            { lines: 8, text: 'A set of allowed extensions makes the test readable and fast.' },
            { lines: 9, text: '`suffix.lower()` makes `button.PNG` match `.png`. `relative_to(root).as_posix()` gives a tidy `/`-separated path for display, on any platform.' },
            { lines: '11-15', text: 'Group files by extension with `setdefault`, which creates the list on first use.' },
            { lines: 16, text: '`p.is_dir()` filters a folder listing down to its subfolders.' },
          ],
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: '`Path("saves") + "slot1.json"` is a valid way to join two path pieces.',
      answer: false,
      explanation: 'False. `Path` objects do not support `+`; it raises a `TypeError`. Use the `/` operator: `Path("saves") / "slot1.json"`. (Strings, however, do use `+` — a common source of the mix-up.)',
    },
    {
      kind: 'concept',
      title: 'Never trust a path from outside',
      blocks: [
        {
          type: 'p',
          text: 'One more pattern matters for security. If a name comes from a player, a mod, a network message or a downloaded archive, it may contain `..` and try to climb out of the folder you meant — a **path traversal** attack. Resolve the final path and check that it is still inside the base.',
        },
        {
          type: 'code',
          title: 'safe_join.py',
          runnable: true,
          code: `from pathlib import Path
base = Path("/game/mods").resolve()
def safe_join(base, name):
    target = (base / name).resolve()
    if not target.is_relative_to(base):
        raise ValueError(f"unsafe path: {name!r}")
    return target
print(safe_join(base, "cool/skin.png"))
try:
    safe_join(base, "../../etc/passwd")
except ValueError as e:
    print(e)`,
          output: `/game/mods/cool/skin.png
unsafe path: '../../etc/passwd'`,
          annotations: [
            { lines: 4, text: '`resolve()` makes the path absolute and collapses every `..`, so `/game/mods/../../etc/passwd` becomes `/etc/passwd`.' },
            { lines: 5, text: '`is_relative_to(base)` checks that the result is still inside the base folder.' },
            { lines: 6, text: 'Reject anything that escaped, with a clear error. Checking the *resolved* path is essential: scanning the text for `..` is easy to bypass.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'PurePath and Path',
          text: '`PurePath` classes only manipulate path text; `Path` adds the methods that use the file system. When you create a `Path`, Python picks `PosixPath` or `WindowsPath` to match the operating system, so `Path("a") / "b"` is correct everywhere. Paths are immutable and hashable, so they can be dictionary keys and set members.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Game and tool use',
          text: 'Typical jobs for `pathlib` in a game project: scanning an `assets/` folder to build a manifest, finding the newest save by `stat().st_mtime`, creating a per-user save folder (`Path.home() / ".mygame"`) on first launch, and batch-renaming exported files. For the *correct* per-user folder on each platform, the third-party `platformdirs` package is the usual choice.',
        },
      ],
    },
    {
      kind: 'error',
      prompt: 'This code should save an empty JSON object into `saves/slot1.json`, but it crashes with a `TypeError`. Tap the line with the bug.',
      lines: [
        'from pathlib import Path',
        'saves = Path("saves")',
        'slot = saves + "slot1.json"',
        'slot.write_text("{}", encoding="utf-8")',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: 'Paths are joined with `/`, not `+`: `slot = saves / "slot1.json"`. Adding a `Path` and a string raises `TypeError: unsupported operand type(s) for +`.',
    },
    {
      kind: 'numeric',
      prompt: 'How many items does `list(Path("a/b/c/d.txt").parents)` contain?',
      answer: '4',
      hint: 'The parents are `a/b/c`, `a/b`, `a`, and finally the empty relative path `.`.',
      explanation: 'For a relative path, `parents` yields every ancestor up to and including `.` (the empty path): `a/b/c`, `a/b`, `a` and `.` — four in total.',
      label: 'Items:',
    },
    {
      kind: 'code',
      prompt: 'Write `asset_summary(root)` that walks the folder `root` recursively and returns a dictionary that maps each **lower-case** file extension (including the dot; use `""` for files without one) to the number of **files** with that extension. Folders do not count, even if their name contains a dot.',
      starter: `from pathlib import Path

# define asset_summary here
`,
      solution: `from pathlib import Path

def asset_summary(root):
    counts = {}
    for p in Path(root).rglob("*"):
        if p.is_file():
            ext = p.suffix.lower()
            counts[ext] = counts.get(ext, 0) + 1
    return counts
`,
      tests: `import shutil
from pathlib import Path
base = Path("summary_test")
for name in ["a.png", "b.PNG", "sub/c.txt", "sub/deeper/d.png", "README"]:
    path = base / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.touch()
(base / "folder.png").mkdir()
assert asset_summary(base) == {".png": 3, ".txt": 1, "": 1}, asset_summary(base)
assert asset_summary(str(base)) == {".png": 3, ".txt": 1, "": 1}
shutil.rmtree(base)
empty = Path("summary_empty")
empty.mkdir(exist_ok=True)
assert asset_summary(empty) == {}
shutil.rmtree(empty)`,
      checks: ['Searches subfolders recursively', 'Extensions are lower-cased and files without one use `""`', 'Directories (even `folder.png`) are not counted'],
      hint: 'Loop over `Path(root).rglob("*")`, keep only `p.is_file()`, and count with `counts[ext] = counts.get(ext, 0) + 1` where `ext = p.suffix.lower()`.',
      explanation: '`rglob("*")` yields every file and folder below `root`; `is_file()` removes the folders (including the sneaky `folder.png`). `suffix` is already `""` for a name without an extension, so no special case is needed. Accepting `Path(root)` also makes the function work with plain strings.',
    },
    {
      kind: 'code',
      prompt: 'Write `safe_join(base, name)`. `base` is an absolute `Path`; `name` is a relative path string from an untrusted source. Return the resolved `Path` `base/name`, but raise `ValueError` if the result is **outside** `base` (for example for `"../x"`, `"a/../../x"` or an absolute path such as `"/etc/passwd"`). Names that wander but stay inside, like `"a/../b"`, are fine.',
      starter: `from pathlib import Path

# define safe_join here
`,
      solution: `from pathlib import Path

def safe_join(base, name):
    base = Path(base).resolve()
    target = (base / name).resolve()
    if not target.is_relative_to(base):
        raise ValueError(f"unsafe path: {name!r}")
    return target
`,
      tests: `from pathlib import Path
base = Path("sandbox_base").resolve()
assert safe_join(base, "a/b.txt") == base / "a" / "b.txt"
assert safe_join(base, "a/../b.txt") == base / "b.txt"
assert safe_join(base, "file.txt").parent == base
for bad in ["../x", "a/../../x", "/etc/passwd", "../sandbox_base_evil/x"]:
    try:
        safe_join(base, bad)
        assert False, "should reject " + bad
    except ValueError:
        pass`,
      checks: ['Returns the resolved path for safe names, including ones that use `..` but stay inside', 'Rejects names that escape the base, including absolute paths', 'Raises `ValueError`'],
      hint: 'Resolve `base / name` first, *then* test `target.is_relative_to(base)`. Joining with an absolute name replaces the base entirely, which the same check catches.',
      explanation: '`resolve()` removes `.` and `..` pieces, so the check sees where the path really ends up. `is_relative_to` compares whole path components, which is why `sandbox_base_evil` is correctly rejected even though its text starts with `sandbox_base` — a plain string `startswith` check would get that wrong.',
    },
    {
      kind: 'code',
      prompt: 'Write `backup_saves(src_dir, backup_dir)` that copies every `*.json` file directly inside `src_dir` into `backup_dir` (creating `backup_dir`, including parents, if needed) and returns the sorted list of the file **names** copied. Other files and subfolders are ignored. Use `read_bytes` and `write_bytes` for the copy.',
      starter: `from pathlib import Path

# define backup_saves here
`,
      solution: `from pathlib import Path

def backup_saves(src_dir, backup_dir):
    src = Path(src_dir)
    dst = Path(backup_dir)
    dst.mkdir(parents=True, exist_ok=True)
    names = []
    for p in sorted(src.glob("*.json")):
        (dst / p.name).write_bytes(p.read_bytes())
        names.append(p.name)
    return names
`,
      tests: `import shutil
from pathlib import Path
src = Path("bk_src")
src.mkdir(exist_ok=True)
(src / "slot2.json").write_text('{"b": 2}', encoding="utf-8")
(src / "slot1.json").write_text('{"a": 1}', encoding="utf-8")
(src / "notes.txt").write_text("skip me", encoding="utf-8")
(src / "nested").mkdir(exist_ok=True)
(src / "nested" / "deep.json").write_text("{}", encoding="utf-8")
result = backup_saves(src, "bk_out/2026/nov")
assert result == ["slot1.json", "slot2.json"], result
dst = Path("bk_out/2026/nov")
assert sorted(p.name for p in dst.iterdir()) == ["slot1.json", "slot2.json"]
assert (dst / "slot1.json").read_text(encoding="utf-8") == '{"a": 1}'
assert backup_saves(str(src), "bk_out/2026/nov") == ["slot1.json", "slot2.json"]
shutil.rmtree(src)
shutil.rmtree("bk_out")
Path("bk_empty").mkdir(exist_ok=True)
assert backup_saves("bk_empty", "bk_empty_out") == []
shutil.rmtree("bk_empty")
shutil.rmtree("bk_empty_out")`,
      checks: ['Only top-level `*.json` files are copied, byte for byte', 'The backup folder is created with its parents', 'Returns the sorted list of copied names (empty list if none)'],
      hint: 'Use `src.glob("*.json")` (not `rglob`) and `dst.mkdir(parents=True, exist_ok=True)`. Copy each file with `(dst / p.name).write_bytes(p.read_bytes())`.',
      explanation: '`glob("*.json")` only looks in the folder itself, so the nested file is skipped. Reading and writing **bytes** copies the file exactly, whatever its encoding. Sorting the paths first makes the returned list predictable, because `glob` returns entries in arbitrary order.',
    },
  ],
  takeaways: [
    'A `Path` is an object, not a string: join with `/`, never `+`, and use `name`, `stem`, `suffix`, `parent` and `parts` instead of slicing text. Joining with an absolute path discards what came before.',
    '`PurePosixPath` and `PureWindowsPath` compute on any platform without touching the disk; `Path` adds file-system methods and picks the right flavor for the OS.',
    '`mkdir(parents=True, exist_ok=True)`, `read_text`, `write_text`, `iterdir`, `glob`, `rglob`, `rename`, `unlink` and `stat` cover most file-system work. `iterdir` and `glob` return arbitrary order — wrap in `sorted`.',
    'Compare extensions with `.suffix.lower()`, and watch out for backslashes in ordinary strings on Windows (use `Path`, forward slashes or raw strings).',
    'Never trust a path from outside: `resolve()` it and check `is_relative_to(base)` before reading, writing or deleting.',
  ],
  reading: [
    { title: 'pathlib — Object-oriented filesystem paths', url: 'https://docs.python.org/3/library/pathlib.html', source: 'docs', note: 'The full reference, with a table comparing pathlib with os and os.path.' },
    { title: 'Python’s pathlib Module: Taming the File System', url: 'https://realpython.com/python-pathlib/', source: 'article', note: 'A practical Real Python tutorial with many everyday recipes.' },
    { title: 'shutil — High-level file operations', url: 'https://docs.python.org/3/library/shutil.html', source: 'docs', note: 'Copying, moving and deleting whole trees, and creating archives.' },
  ],
};
