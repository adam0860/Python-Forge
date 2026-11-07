import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-project-structure',
  title: 'Structuring a Real Project',
  summary: 'How a Python project is laid out (the `src` layout, tests, `pyproject.toml`), how to run package code correctly with `python -m` and entry points, why scripts with relative imports fail, how to package data files, and the tools that keep a codebase healthy.',
  minutes: 18,
  objectives: [
    'Lay out a project with `src/`, a package, `tests/`, `pyproject.toml`, `README` and `.gitignore`, and explain what each part is for',
    'Run package code with `python -m package` and entry points, and explain why running a package file as a script breaks relative imports',
    'Use `pip install -e .` so the project is importable everywhere during development',
    'Read bundled data files with `importlib.resources` instead of hard-coded paths',
    'Separate game logic from input/output, avoid circular imports, and name the standard quality tools (pytest, ruff, mypy, pre-commit)',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The anatomy of a project',
      blocks: [
        {
          type: 'p',
          text: 'A one-file script is fine for an afternoon. Once a program has several files, tests and dependencies, a predictable layout saves enormous time: everyone (and every tool) knows where things go. The most widely recommended layout is the **`src` layout**: your importable code lives in a package inside a `src/` folder, next to `tests/` and the project’s metadata.',
        },
        {
          type: 'code',
          title: 'project_layout.py',
          runnable: true,
          code: `from pathlib import Path
import shutil
root = Path("forge_arena_project")
files = {
    "pyproject.toml": '[project]\\nname = "forge-arena"\\nversion = "0.1.0"\\n',
    "README.md": "# Forge Arena\\n",
    ".gitignore": ".venv/\\n__pycache__/\\n",
    "src/forge_arena/__init__.py": '__version__ = "0.1.0"\\n',
    "src/forge_arena/__main__.py": "from .cli import main\\nmain()\\n",
    "src/forge_arena/cli.py": "def main():\\n    print('arena starting')\\n",
    "src/forge_arena/game.py": "def score(kills, deaths):\\n    return kills - deaths\\n",
    "src/forge_arena/data/levels.json": '{"levels": ["dunes", "forge"]}\\n',
    "tests/test_game.py": "from forge_arena.game import score\\n\\ndef test_score():\\n    assert score(5, 2) == 3\\n",
}
for name, text in files.items():
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
def tree(path, prefix=""):
    entries = sorted(path.iterdir(), key=lambda p: (p.is_file(), p.name))
    for i, entry in enumerate(entries):
        last = i == len(entries) - 1
        print(prefix + ("└── " if last else "├── ") + entry.name)
        if entry.is_dir():
            tree(entry, prefix + ("    " if last else "│   "))
print(root.name)
tree(root)
shutil.rmtree(root)`,
          output: `forge_arena_project
├── src
│   └── forge_arena
│       ├── data
│       │   └── levels.json
│       ├── __init__.py
│       ├── __main__.py
│       ├── cli.py
│       └── game.py
├── tests
│   └── test_game.py
├── .gitignore
├── README.md
└── pyproject.toml`,
          annotations: [
            { lines: '4-14', text: 'The project, described as a dictionary from path to file contents. In real life you create these files in your editor; the demo builds them so the tree below is real.' },
            { lines: '15-18', text: 'Write every file, creating its parent folders first (`mkdir(parents=True, exist_ok=True)`, from the pathlib lesson).' },
            { lines: '19-25', text: 'A small recursive function that prints a folder as a tree: folders first, then files, with box-drawing connectors. Recursion (Unit 6) fits trees naturally.' },
            { lines: 28, text: 'Clean up the demo files.' },
          ],
        },
        {
          type: 'table',
          headers: ['Item', 'Purpose'],
          rows: [
            ['`pyproject.toml`', 'project name, version, Python requirement, dependencies, entry points, tool settings'],
            ['`src/forge_arena/`', 'the **package**: everything users import (`import forge_arena`)'],
            ['`__init__.py`', 'marks the folder as a package; may define `__version__` and re-export the public API'],
            ['`__main__.py`', 'what runs for `python -m forge_arena`'],
            ['`data/`', 'files that ship *inside* the package (levels, default config, shaders)'],
            ['`tests/`', 'automated tests, kept outside the package so they are not installed with it'],
            ['`README.md`', 'what it is, how to install and run it, a short example'],
            ['`.gitignore`', 'files git must not track: `.venv/`, `__pycache__/`, build output, secrets'],
          ],
          caption: 'The conventional parts of a project. Add `LICENSE`, `CHANGELOG.md` and `docs/` as it grows.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why the extra src/ folder?',
          text: 'With a "flat" layout (the package next to `tests/` at the top level), running tests from the project folder can import your **working copy** by accident, even if the package is installed wrongly or incompletely — and tests pass while the installed version is broken. With `src/`, the package is importable *only* after it is installed (even in editable mode), so tests exercise what users will actually get. Small scripts and quick experiments are fine as a flat layout.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Naming',
          text: 'The distribution name (on PyPI) may contain hyphens (`forge-arena`), but the import name is a valid identifier, lowercase with underscores (`forge_arena`). Keep package and module names short, lowercase and distinct from standard-library modules (remember the shadowing warning from the Modules lesson).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why do many projects keep their package inside a `src/` folder instead of at the top level?',
      options: [
        { text: 'Python requires it', why: 'Python imposes no layout. It is a convention.' },
        { text: 'So tests can only import the package after it is properly installed, catching packaging mistakes', correct: true, why: 'Right: without `src/`, the working directory is on the import path, so an incomplete install can go unnoticed.' },
        { text: 'It makes the code run faster', why: 'The layout has no effect on speed.' },
        { text: 'It hides the source code from users', why: 'Users receive the source either way; this is only about import behavior during development.' },
      ],
      explanation: 'The `src` layout prevents accidental imports of the working copy. Tests then run against the same installed package your users will have, which exposes missing files or wrong metadata early.',
    },
    {
      kind: 'concept',
      title: 'Running the code: python -m, entry points and relative imports',
      blocks: [
        {
          type: 'p',
          text: 'Inside a package, modules refer to each other with relative imports (`from .cli import main`), which only work when Python knows the module belongs to a package. That is exactly what **`python -m package`** does: it imports the package properly and then runs its `__main__.py`. Running a package file directly as a script (`python src/forge_arena/__main__.py`) makes Python treat it as a stand-alone file with *no package*, and the relative import fails.',
        },
        {
          type: 'code',
          title: 'running_a_package.py',
          runnable: true,
          code: `import sys, runpy, importlib, json, shutil
from pathlib import Path
from importlib import resources
sys.dont_write_bytecode = True
src = Path("demo_src")
pkg = src / "forge_arena"
(pkg / "data").mkdir(parents=True, exist_ok=True)
(pkg / "__init__.py").write_text('__version__ = "0.1.0"\\n', encoding="utf-8")
(pkg / "__main__.py").write_text("from .cli import main\\nmain()\\n", encoding="utf-8")
(pkg / "cli.py").write_text("def main():\\n    print('arena starting')\\n", encoding="utf-8")
(pkg / "game.py").write_text("def score(kills, deaths):\\n    return kills - deaths\\n", encoding="utf-8")
(pkg / "data" / "levels.json").write_text('{"levels": ["dunes", "forge"]}\\n', encoding="utf-8")
sys.path.insert(0, str(src))
importlib.invalidate_caches()
runpy.run_module("forge_arena", run_name="__main__")
from forge_arena.game import score
print(score(5, 2))
text = (resources.files("forge_arena") / "data" / "levels.json").read_text(encoding="utf-8")
print(json.loads(text)["levels"])
try:
    runpy.run_path(str(pkg / "__main__.py"), run_name="__main__")
except ImportError as e:
    print(type(e).__name__, "|", e)
sys.path.remove(str(src))
for name in [k for k in sys.modules if k.startswith("forge_arena")]:
    del sys.modules[name]
shutil.rmtree(src)`,
          output: `arena starting
3
['dunes', 'forge']
ImportError | attempted relative import with no known parent package`,
          annotations: [
            { lines: '5-12', text: 'Build a tiny package on disk: an `__init__.py`, an entry module, a logic module and a data file inside the package.' },
            { lines: '13-14', text: 'Make the package importable by putting its parent folder on `sys.path`. (For a real project, `pip install -e .` does this properly — see below. Editing `sys.path` by hand is a demo trick, not a practice.)' },
            { lines: 15, text: '`runpy.run_module` does what the terminal command `python -m forge_arena` does: import the package, then run `__main__.py` as the main program. The relative import `from .cli import main` works, and `arena starting` is printed.' },
            { lines: '16-17', text: 'Other code simply imports the logic: `from forge_arena.game import score`.' },
            { lines: '18-19', text: '`importlib.resources.files("forge_arena")` locates the package’s own folder wherever it is installed — even inside a zip file — so data shipped with the package is found without any hard-coded path.' },
            { lines: '20-23', text: 'Running the same file as a **script** (like `python path/to/__main__.py`) breaks: with no parent package, `from .cli import main` raises `ImportError: attempted relative import with no known parent package`.' },
          ],
        },
        {
          type: 'code',
          title: 'run_commands.sh',
          lang: 'shell',
          code: `python -m forge_arena
python -m pip install -e .
python -m pip install -e ".[dev]"
python -m pytest
forge-arena`,
          annotations: [
            { lines: 1, text: 'Run the package from the project’s root: Python imports it as a package and executes `__main__.py`.' },
            { lines: 2, text: '**Editable install**: pip links your `src/` folder into the active environment. `import forge_arena` now works from anywhere, and your edits take effect immediately without reinstalling.' },
            { lines: 3, text: 'The same, plus the optional `dev` tools (pytest, ruff…) declared in `pyproject.toml`.' },
            { lines: 4, text: '`python -m pytest` runs the tests with exactly this environment’s Python — the `-m` form avoids the "wrong interpreter" trap from the last lesson.' },
            { lines: 5, text: 'If `pyproject.toml` declares `[project.scripts] forge-arena = "forge_arena.cli:main"`, installing creates this command, which calls `main()` directly. This is the user-facing entry point.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not fix imports by editing sys.path',
          text: 'Beginners often add `sys.path.append("..")` at the top of files until imports "work". It hides the real problem, breaks on other machines, and makes the code depend on where you launched it. The reliable fixes are: install the project (`pip install -e .`), run it with `python -m`, and use absolute imports (`from forge_arena.game import score`).',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Absolute or relative imports?',
          text: 'PEP 8 prefers **absolute** imports (`from forge_arena.game import score`) because they are clear and keep working if a file moves. Relative imports (`from .game import score`) are acceptable inside a package, especially deep ones, and are what `__init__.py` files often use to re-export names.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `from pathlib import PurePosixPath
p = PurePosixPath("src/forge_arena/data/levels.json")
print(p.parent.name, p.suffix, len(p.parts))`,
      answer: 'data .json 4',
      hint: '`parent` drops the last piece; `parts` counts every component of the path.',
      explanation: '`p.parent` is `src/forge_arena/data`, whose `name` is `data`. The suffix of `levels.json` is `.json`, and the four parts are `src`, `forge_arena`, `data` and `levels.json`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the two commands.',
      template: `# run the package's __main__.py from the project root
python ___ forge_arena
# install the project in editable mode
python -m pip install ___ .`,
      templateIsCode: true,
      blanks: [{ answers: ['-m'] }, { answers: ['-e'] }],
      wordBank: ['-m', '-e', '-r', '-U'],
      explanation: '`python -m forge_arena` runs a module or package as the main program (with correct package context). `pip install -e .` installs the current folder in **e**ditable mode. (`-r` reads a requirements file and `-U` upgrades.)',
    },
    {
      kind: 'concept',
      title: 'Structuring the code: logic, I/O and dependencies',
      blocks: [
        {
          type: 'p',
          text: 'A layout is only half of structure; the other half is **what goes where**. A durable rule: keep *rules and logic* (pure functions on plain data) separate from *input/output* (reading files, drawing on screen, networking). Logic that never touches the screen or disk is easy to test, easy to reuse (a headless server, an AI training run, a replay tool) and easy to reason about.',
        },
        {
          type: 'table',
          headers: ['Layer', 'Contains', 'May depend on'],
          rows: [
            ['`game` / `core`', 'rules, scoring, state transitions — pure functions and plain data', 'nothing but the standard library'],
            ['`ai`', 'agents, policies, search', '`core`'],
            ['`assets` / `storage`', 'loading levels, saves, config files', '`core`'],
            ['`ui` / `render`', 'drawing, windowing, input', '`core`, `assets`'],
            ['`cli` / `main`', 'wires everything together, parses arguments', 'all of the above'],
          ],
          caption: 'Dependencies point one way. The core knows nothing about the screen; the screen knows about the core.',
        },
        {
          type: 'p',
          text: 'One-way dependencies also prevent the most common structural bug: the [[circular-import]]. If `ui` imports `core` and `core` imports `ui`, Python hits a half-loaded module. Draw the arrows; if you ever need an arrow in the opposite direction, pass a function or an object *in* as an argument instead of importing it.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why this matters for game AI',
          text: 'In the AI course you will train agents by running a game *millions* of times with no window at all. That only works if the game rules live in a core module that does not import the renderer. Projects that mix drawing into the rules have to be rewritten before an AI can use them; projects with a clean core simply wrap it in an environment class.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Configuration and resources',
          text: 'Keep tunable values (speeds, damage, file names) in one place — a `config.py`, a dataclass, or a `settings.toml` — not scattered as magic numbers. Locate data files relative to the package with `importlib.resources`, user files (saves, settings) in a per-user folder, and never hard-code an absolute path such as `C:/Users/you/Desktop/...`: it works on exactly one machine.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What __init__.py is for',
          text: 'The file runs when the package is imported. Keep it **light**: define `__version__`, re-export the main public names (`from .game import score`) so users can write `forge_arena.score`, and list them in `__all__`. Heavy work in `__init__.py` (loading assets, starting threads) slows every import and tends to create import cycles.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'The recommended way to run code that uses relative imports is `python src/forge_arena/cli.py`.',
      answer: false,
      explanation: 'False. Run as a script, the file has no parent package, so `from .game import score` fails with "attempted relative import with no known parent package". Use `python -m forge_arena` (or a console-script entry point) from the project root.',
    },
    {
      kind: 'error',
      prompt: 'This code works on the author’s computer but fails for every teammate. Tap the line that causes the problem.',
      lines: [
        'from pathlib import Path',
        'DATA = "C:/Users/adam/Desktop/forge_arena/data/levels.json"',
        'levels = Path(DATA).read_text(encoding="utf-8")',
      ],
      linesAreCode: true,
      errorLines: [2],
      explanation: 'A hard-coded absolute path exists on exactly one machine. Locate packaged data relative to the package instead: `importlib.resources.files("forge_arena") / "data" / "levels.json"` (or `Path(__file__).parent / "data" / "levels.json"` for a plain module).',
    },
    {
      kind: 'concept',
      title: 'Keeping a codebase healthy',
      blocks: [
        {
          type: 'p',
          text: 'Professional projects automate the boring parts of quality, so reviews can focus on design. A typical toolkit is small and mostly configured in `pyproject.toml`: a **test runner**, a **formatter and linter**, a **type checker**, and a hook that runs them before each commit. Unit 15 covers testing and packaging in depth; here is the map.',
        },
        {
          type: 'table',
          headers: ['Job', 'Common tool', 'Command'],
          rows: [
            ['run tests', '`pytest`', '`python -m pytest`'],
            ['format code consistently', '`ruff format` (or `black`)', '`ruff format .`'],
            ['find bugs and style problems', '`ruff check` (or `flake8`, `pylint`)', '`ruff check .`'],
            ['check type hints', '`mypy` or `pyright`', '`mypy src`'],
            ['run checks before each commit', '`pre-commit`', '`pre-commit install`'],
            ['run everything on every push', 'GitHub Actions (CI)', 'a workflow file in `.github/workflows/`'],
          ],
          caption: 'You do not need all of them on day one. Start with pytest and a formatter.',
        },
        {
          type: 'code',
          title: 'quality.sh',
          lang: 'shell',
          code: `python -m pip install -e ".[dev]"
ruff format .
ruff check .
mypy src
python -m pytest -q`,
          annotations: [
            { lines: 1, text: 'Install the project and its development tools into the active environment.' },
            { lines: 2, text: 'Rewrites files into one consistent style, ending all style arguments.' },
            { lines: 3, text: 'Flags unused imports and variables, likely bugs and risky patterns.' },
            { lines: 4, text: 'Checks that your type hints (Unit 6) are consistent across modules.' },
            { lines: 5, text: 'Runs the test suite; `-q` keeps the output short.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Version control from day one',
          text: 'Put the project under `git` immediately, commit small and often, and tag releases (`git tag v0.1.0`). Follow semantic versioning in `pyproject.toml`: bump the MAJOR number for breaking changes, MINOR for new features, PATCH for fixes — it is the convention behind the version specifiers you met in the last lesson.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'What reviewers look for',
          text: 'In interviews and code reviews, a project with a clear README, a tests folder, pinned dependencies, no hard-coded paths and no stray `sys.path` hacks signals a developer who has shipped real software. A short "how to run" section at the top of the README is worth more than a long design essay.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'For the project in the first example, how many `.py` files would `Path("forge_arena_project").rglob("*.py")` find? (The files are `__init__.py`, `__main__.py`, `cli.py`, `game.py` and `test_game.py`.)',
      answer: '5',
      hint: '`rglob` searches every subfolder; count the Python files listed in the tree.',
      explanation: '`rglob("*.py")` is recursive, so it finds all five Python files: four inside the package (`__init__.py`, `__main__.py`, `cli.py`, `game.py`) and one in `tests/`. It ignores `levels.json`, `README.md` and the other non-Python files.',
      label: 'Files:',
    },
    {
      kind: 'code',
      prompt: 'Write `tree_lines(root)` that returns the same tree as in the lesson, but as a **list of strings** (one per line) *without* the root line. `root` is a `Path`. Directories come before files, each group sorted by name. Use `"├── "` and `"└── "` for entries and `"│   "` / `"    "` to continue the indentation.',
      starter: `from pathlib import Path

# define tree_lines here
`,
      solution: `from pathlib import Path

def tree_lines(root, prefix=""):
    lines = []
    entries = sorted(Path(root).iterdir(), key=lambda p: (p.is_file(), p.name))
    for i, entry in enumerate(entries):
        last = i == len(entries) - 1
        lines.append(prefix + ("└── " if last else "├── ") + entry.name)
        if entry.is_dir():
            lines.extend(tree_lines(entry, prefix + ("    " if last else "│   ")))
    return lines
`,
      tests: `import shutil
from pathlib import Path
base = Path("tree_test")
(base / "pkg" / "sub").mkdir(parents=True, exist_ok=True)
(base / "pkg" / "a.py").write_text("", encoding="utf-8")
(base / "pkg" / "sub" / "b.py").write_text("", encoding="utf-8")
(base / "README.md").write_text("", encoding="utf-8")
(base / "docs").mkdir(exist_ok=True)
expected = [
    "├── docs",
    "├── pkg",
    "│   ├── sub",
    "│   │   └── b.py",
    "│   └── a.py",
    "└── README.md",
]
assert tree_lines(base) == expected, tree_lines(base)
assert tree_lines(str(base / "docs")) == []
shutil.rmtree(base)`,
      checks: ['Folders first, then files, each sorted by name', 'Uses `├── ` / `└── ` and `│   ` / `    ` indentation correctly', 'Recurses into subfolders and returns a list (empty for an empty folder)'],
      hint: 'Make it recursive: for each entry append its line, and if it is a directory `extend` the list with `tree_lines(entry, new_prefix)`. The new prefix is `prefix + "    "` after a last entry and `prefix + "│   "` otherwise.',
      explanation: 'Sorting with the key `(p.is_file(), p.name)` puts directories (`False`) before files (`True`) and orders each group by name. The `last` flag chooses both the connector and the continuation prefix; recursion handles any depth. Returning a list instead of printing makes the function testable.',
    },
    {
      kind: 'code',
      prompt: 'Write `find_project_root(start, marker="pyproject.toml")` that starts at the folder `start` (a `Path` or string) and walks **up** through its parents until it finds a folder containing a file named `marker`. Return that folder as a `Path`, or `None` if none of the folders up to the top of the file system contains it. Resolve `start` first so relative paths work.',
      starter: `from pathlib import Path

# define find_project_root here
`,
      solution: `from pathlib import Path

def find_project_root(start, marker="pyproject.toml"):
    current = Path(start).resolve()
    for folder in [current, *current.parents]:
        if (folder / marker).is_file():
            return folder
    return None
`,
      tests: `import shutil
from pathlib import Path
base = Path("root_test").resolve()
deep = base / "src" / "pkg" / "inner"
deep.mkdir(parents=True, exist_ok=True)
(base / "pyproject.toml").write_text("[project]\\n", encoding="utf-8")
assert find_project_root(deep) == base
assert find_project_root(str(deep)) == base
assert find_project_root(base) == base
assert find_project_root(Path("root_test") / "src") == base
(base / "src" / "setup.cfg").write_text("", encoding="utf-8")
assert find_project_root(deep, "setup.cfg") == base / "src"
assert find_project_root(deep, "definitely_missing_marker.xyz") is None
shutil.rmtree(base)`,
      checks: ['Searches the start folder first, then each parent in turn', 'Returns the folder as a `Path`, or `None` when the marker is not found', 'Works with relative paths and a custom marker name'],
      hint: '`Path(start).resolve()` gives an absolute path; `[current, *current.parents]` is the folder followed by all its ancestors. Test each with `(folder / marker).is_file()`.',
      explanation: 'Developer tools (pytest, git, ruff) all do this "walk up until you find the marker" search to discover the project root from wherever you launched them. `resolve()` makes relative input absolute so `parents` reaches the real top of the tree.',
    },
    {
      kind: 'code',
      prompt: 'Write `scaffold(root, package)` that creates a minimal `src`-layout project under the folder `root` for the package name `package` (for example `"forge_arena"`) and returns the **sorted list of created file paths relative to `root`**, written with forward slashes. Create: `pyproject.toml` containing the line `name = "<package with underscores replaced by hyphens>"`, `README.md` (`# <package>`), `src/<package>/__init__.py` (empty), `src/<package>/__main__.py` (empty) and `tests/test_smoke.py` (empty).',
      starter: `from pathlib import Path

# define scaffold here
`,
      solution: `from pathlib import Path

def scaffold(root, package):
    root = Path(root)
    dist_name = package.replace("_", "-")
    files = {
        "pyproject.toml": f'[project]\\nname = "{dist_name}"\\nversion = "0.1.0"\\n',
        "README.md": f"# {package}\\n",
        f"src/{package}/__init__.py": "",
        f"src/{package}/__main__.py": "",
        "tests/test_smoke.py": "",
    }
    created = []
    for relative, text in files.items():
        path = root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")
        created.append(relative)
    return sorted(created)
`,
      tests: `import shutil
from pathlib import Path
result = scaffold("scaffold_test", "forge_arena")
assert result == [
    "README.md",
    "pyproject.toml",
    "src/forge_arena/__init__.py",
    "src/forge_arena/__main__.py",
    "tests/test_smoke.py",
], result
base = Path("scaffold_test")
assert 'name = "forge-arena"' in (base / "pyproject.toml").read_text(encoding="utf-8")
assert (base / "README.md").read_text(encoding="utf-8").startswith("# forge_arena")
assert (base / "src" / "forge_arena" / "__main__.py").is_file()
assert (base / "tests").is_dir()
assert scaffold(base / "second", "tiny")[0] == "README.md"
assert 'name = "tiny"' in (base / "second" / "pyproject.toml").read_text(encoding="utf-8")
shutil.rmtree(base)`,
      checks: ['Creates all five files with their parent folders', 'The distribution name uses hyphens (`forge-arena`)', 'Returns the sorted relative paths with forward slashes'],
      hint: 'Describe the files as a dict from relative path to text (as the lesson did), loop over it creating parent folders and writing each file, and return `sorted(created)`.',
      explanation: 'Describing the layout as *data* (a dictionary) and writing it with one loop keeps the function short and easy to extend — tools like `cookiecutter` and `uv init` do the same at larger scale. Relative paths in the dictionary are already forward-slashed strings, which is what the function reports back.',
    },
  ],
  takeaways: [
    'A conventional project has `pyproject.toml`, a package under `src/`, a `tests/` folder, a `README` and a `.gitignore`. The `src` layout makes tests run against the installed package, not your working copy.',
    'Run packages with `python -m package` (or a `[project.scripts]` command), install with `pip install -e .`, and use absolute imports. Running a package file directly as a script breaks relative imports; editing `sys.path` just hides the problem.',
    'Read files shipped with a package through `importlib.resources`; never hard-code absolute paths. User data belongs in a per-user folder.',
    'Keep rules and logic (a pure core) separate from I/O and drawing, and let dependencies point one way — this prevents circular imports and lets AI code run the game headless.',
    'Automate quality: pytest for tests, ruff for format and lint, mypy/pyright for types, pre-commit and CI to run them. Use git and semantic versioning from the start.',
  ],
  reading: [
    { title: 'Python Packaging User Guide — Packaging Python Projects', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/', source: 'docs', note: 'The official step-by-step tutorial: layout, `pyproject.toml`, building and publishing.' },
    { title: 'src layout vs flat layout', url: 'https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/', source: 'docs', note: 'The trade-offs behind the two common project layouts.' },
    { title: 'importlib.resources — Resources', url: 'https://docs.python.org/3/library/importlib.resources.html', source: 'docs', note: 'Reading files that ship inside a package.' },
    { title: 'Ruff documentation', url: 'https://docs.astral.sh/ruff/', source: 'docs', note: 'The fast linter and formatter used in many modern projects.' },
  ],
};
