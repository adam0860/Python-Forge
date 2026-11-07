import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-venv-pip',
  title: 'Virtual Environments and pip',
  summary: 'Why every project gets its own isolated environment, how to create and activate a `venv`, install packages with `pip`, read version specifiers, describe a project in `pyproject.toml`, choose between pip, uv, Poetry and conda, and fix the most common setup errors.',
  minutes: 18,
  objectives: [
    'Explain why a project needs its own virtual environment and what `venv` actually creates',
    'Create, activate and deactivate an environment on Windows, macOS and Linux, and always install with `python -m pip`',
    'Read version specifiers such as `==`, `>=`, `~=` and compare version numbers correctly (not as strings)',
    'Read a `pyproject.toml` (name, dependencies, optional dependencies, scripts) and know when to use pip, uv, Poetry or conda',
    'Diagnose "No module named …", "externally-managed-environment" and wrong-interpreter problems',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'The problem: one Python, many projects',
      blocks: [
        {
          type: 'p',
          text: 'Third-party libraries live on [[pypi]], the Python Package Index, and are installed with [[pip]]. By default pip installs into the *one* Python on your machine — which causes trouble the moment two projects disagree. Your old game needs `pygame 2.1`, your new one needs `pygame 2.6`; your ML experiments need a specific `torch` build that would break everything else. Installing everything globally is a slow-motion disaster.',
        },
        {
          type: 'p',
          text: 'The solution is a [[virtual-environment]]: a self-contained folder holding its own link to the interpreter and its own `site-packages` directory, where installed libraries go. Each project gets one. Libraries installed in an environment are visible only when that environment is *active*, so projects can never interfere with each other, and deleting the folder removes everything cleanly.',
        },
        {
          type: 'code',
          title: 'create_venv.sh',
          lang: 'shell',
          code: `# Linux / macOS
python3 -m venv .venv
source .venv/bin/activate

# Windows (PowerShell)
python -m venv .venv
.venv\\Scripts\\Activate.ps1

# any platform, once activated
python -c "import sys; print(sys.prefix)"
deactivate`,
          annotations: [
            { lines: 2, text: '`python3 -m venv .venv` runs the built-in `venv` module and creates a folder named `.venv` in your project. (The folder name is a convention; the leading dot hides it on Linux and macOS.)' },
            { lines: 3, text: '**Activating** edits your shell’s `PATH` for this terminal session so that `python` and `pip` now refer to the copies *inside* `.venv`. Your prompt usually shows `(.venv)` while it is active.' },
            { lines: '6-7', text: 'On Windows the command is `python` (or the `py` launcher, e.g. `py -3.12 -m venv .venv`) and the activation script lives in `Scripts`. In the old Command Prompt use `.venv\\Scripts\\activate.bat`. If PowerShell refuses to run the script, allow local scripts once with `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.' },
            { lines: 10, text: '`sys.prefix` is the folder of the active environment. Inside a venv it points at `.venv`; outside, at the system Python. This is the quickest check of "which Python am I really running?"' },
            { lines: 11, text: '`deactivate` restores your normal `PATH`. The environment still exists on disk and can be reactivated at any time.' },
          ],
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What a venv really is',
          text: '`.venv` contains a small `pyvenv.cfg` file (pointing at the base Python), a `bin/` or `Scripts/` folder with `python` and `pip` launchers, and an empty `lib/.../site-packages`. Python notices `pyvenv.cfg` and sets `sys.prefix` to the venv while `sys.base_prefix` remains the real installation — the difference between the two is how code detects that it runs inside a venv. Activation is only a convenience: running `.venv/bin/python script.py` directly works without activating anything.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Do not commit .venv',
          text: 'An environment contains absolute paths and thousands of files specific to your machine. Add `.venv/` to `.gitignore` and commit the *list* of dependencies instead (the next steps). Anyone can recreate the environment in a minute from that list.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'What does *activating* a virtual environment actually do?',
      options: [
        { text: 'Copies all installed libraries into your project folder', why: 'Nothing is copied. Libraries already live inside `.venv`.' },
        { text: 'Changes the shell’s `PATH` so `python` and `pip` refer to the environment’s copies', correct: true, why: 'Right: activation is just a convenience that puts `.venv/bin` (or `Scripts`) first on the `PATH` for that terminal.' },
        { text: 'Downloads a fresh copy of Python from the internet', why: '`venv` links to the Python you already have; it does not download an interpreter.' },
        { text: 'Locks the project so no other project can install packages', why: 'Environments are independent; other projects are unaffected either way.' },
      ],
      explanation: 'Activation edits `PATH` (and the prompt) for the current terminal. The environment works without it — `.venv/bin/python` is a complete interpreter — but activation saves you from typing the full path every time.',
    },
    {
      kind: 'concept',
      title: 'pip and version numbers',
      blocks: [
        {
          type: 'p',
          text: 'With an environment active, install libraries with `python -m pip install name`. Writing it as `python -m pip` (rather than plain `pip`) guarantees that the pip you run belongs to *that* Python — the most common cause of "I installed it but Python can’t find it" is a `pip` that belongs to a different interpreter.',
        },
        {
          type: 'code',
          title: 'pip_commands.sh',
          lang: 'shell',
          code: `python -m pip install numpy
python -m pip install "numpy>=1.26,<3"
python -m pip install -r requirements.txt
python -m pip list
python -m pip freeze > requirements.txt
python -m pip show numpy
python -m pip install --upgrade numpy
python -m pip uninstall numpy`,
          annotations: [
            { lines: 1, text: 'Install the newest version compatible with your Python. pip also installs the library’s own **dependencies** automatically.' },
            { lines: 2, text: 'A **version specifier**: at least 1.26 but below 3. Quote it so the shell does not treat `>` as a redirect.' },
            { lines: 3, text: 'Install everything listed in a requirements file — how a teammate (or a server) recreates your environment.' },
            { lines: '4-6', text: '`list` shows what is installed, `freeze` prints exact versions in requirements format (here saved to a file), and `show` gives details about one package, including what it depends on.' },
            { lines: '7-8', text: 'Upgrade to the newest version, or remove a package.' },
          ],
        },
        {
          type: 'table',
          headers: ['Specifier', 'Means', 'Example'],
          rows: [
            ['`==2.3.1`', 'exactly this version', 'reproducible builds'],
            ['`>=1.26`', 'this version or newer', 'minimum you tested with'],
            ['`<3`', 'older than this', 'avoid a known-breaking major release'],
            ['`!=2.0.0`', 'anything except this one', 'skip a buggy release'],
            ['`~=2.3.1`', '"compatible release": `>=2.3.1` and `<2.4`', 'accept patch fixes only'],
            ['`>=1.0,<2.0`', 'combine with commas', 'a range'],
          ],
          caption: 'Versions are usually written MAJOR.MINOR.PATCH. A new MAJOR may break your code; MINOR adds features; PATCH fixes bugs.',
        },
        {
          type: 'p',
          text: 'Comparing versions has a trap. Version numbers are **not** decimal numbers or plain strings: `1.10` is *newer* than `1.9`. Comparing them as text gets it wrong, so tools split them into integer parts first.',
        },
        {
          type: 'code',
          title: 'versions.py',
          runnable: true,
          code: `print("1.10.2" < "1.9.0")
def ver(text):
    return tuple(int(part) for part in text.split("."))
print(ver("1.10.2"), ver("1.10.2") < ver("1.9.0"))
versions = ["1.10.0", "1.2.0", "1.9.1"]
print(sorted(versions))
print(sorted(versions, key=ver))
print((1, 2) < (1, 2, 0), (1, 2) == (1, 2, 0))`,
          output: `True
(1, 10, 2) False
['1.10.0', '1.2.0', '1.9.1']
['1.2.0', '1.9.1', '1.10.0']
True False`,
          annotations: [
            { lines: 1, text: 'Compared as **strings**, `"1.10.2"` is "smaller" than `"1.9.0"` because the character `"1"` sorts before `"9"`. Wrong: 1.10.2 is the newer version.' },
            { lines: '2-3', text: 'Convert each dot-separated part to an `int` and build a tuple. Tuples compare element by element.' },
            { lines: 4, text: 'As integer tuples, `(1, 10, 2)` is **larger** than `(1, 9, 0)`, as it should be.' },
            { lines: '6-7', text: 'The same bug appears when sorting: plain `sorted` puts `1.10.0` before `1.2.0`; sorting with `key=ver` gives the true order.' },
            { lines: 8, text: 'Another subtlety: version `2.0` and `2.0.0` mean the same release, but the tuples `(1, 2)` and `(1, 2, 0)` are *not* equal. Real tools pad missing parts with zeros (or use the `packaging` library) before comparing.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Check package names',
          text: 'Anyone can upload to PyPI, and attackers publish look-alike names (`requests` vs `reqeusts`) hoping for typos. Copy install commands from a project’s official documentation, prefer well-known packages with an active history, and be especially careful with packages that run code at install time.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Installing PyTorch (used in the AI course)',
          text: 'PyTorch comes in different builds (CPU only, various CUDA versions for NVIDIA GPUs). Instead of a plain `pip install torch`, get the exact command from the selector on pytorch.org, which adds the correct package index. Keep it inside a dedicated environment — a GPU-enabled PyTorch is a multi-gigabyte download you do not want to duplicate.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `print("1.10" < "1.9", (1, 10) < (1, 9))`,
      answer: 'True False',
      hint: 'The first comparison is between text, character by character; the second between integers.',
      explanation: 'As strings, `"1.10"` vs `"1.9"` is decided at the third character: `"1"` is less than `"9"`, so the result is `True` (wrongly, for versions). As integer tuples, 10 is greater than 9, so `(1, 10) < (1, 9)` is `False`.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the commands to create an environment, activate it (Linux/macOS), and install a package into it.',
      template: `python3 -m ___ .venv
source .venv/bin/___
python -m pip ___ numpy`,
      templateIsCode: true,
      blanks: [{ answers: ['venv'] }, { answers: ['activate'] }, { answers: ['install'] }],
      wordBank: ['venv', 'activate', 'install', 'create', 'init'],
      explanation: '`python3 -m venv .venv` runs the `venv` module to create the folder; `source .venv/bin/activate` activates it; `python -m pip install numpy` installs a package into the active environment. (`create` and `init` are not part of these commands.)',
    },
    {
      kind: 'concept',
      title: 'pyproject.toml and the tool landscape',
      blocks: [
        {
          type: 'p',
          text: 'A `requirements.txt` lists packages; modern projects describe themselves in a single file, **`pyproject.toml`** (the format is TOML, which you met in the JSON lesson). It holds the project’s name and version, the Python versions it supports, its [[dependency]] list, optional extras such as development tools, and *entry points* — commands your package installs. Because TOML is machine-readable, tools (and your own scripts) can read it with `tomllib`.',
        },
        {
          type: 'code',
          title: 'read_pyproject.py',
          runnable: true,
          code: `import tomllib
doc = tomllib.loads("""
[project]
name = "forge-arena"
version = "0.3.1"
requires-python = ">=3.11"
dependencies = [
    "numpy>=1.26",
    "torch>=2.3",
]

[project.optional-dependencies]
dev = ["pytest>=8", "ruff"]

[project.scripts]
forge-arena = "forge_arena.cli:main"
""")
proj = doc["project"]
print(proj["name"], proj["version"], proj["requires-python"])
print(proj["dependencies"])
print(proj["optional-dependencies"]["dev"])
print(proj["scripts"])`,
          output: `forge-arena 0.3.1 >=3.11
['numpy>=1.26', 'torch>=2.3']
['pytest>=8', 'ruff']
{'forge-arena': 'forge_arena.cli:main'}`,
          annotations: [
            { lines: '3-6', text: 'The `[project]` table: the distribution name, its version, and the Python versions it works with (`requires-python`).' },
            { lines: '7-10', text: '`dependencies` are what a user must have to **run** the project — each is a name plus an optional version specifier.' },
            { lines: '12-13', text: '**Optional dependencies** are extras. Here `dev` holds tools used only while developing (a test runner and a linter); users install them with `pip install -e ".[dev]"`.' },
            { lines: '15-16', text: '`[project.scripts]` defines a **command**: installing the package creates a `forge-arena` program that calls `main()` in `forge_arena/cli.py`. This is the standard [[entry-point]] mechanism.' },
            { lines: '18-22', text: 'The TOML text becomes ordinary nested dictionaries and lists, so reading project metadata is plain Python.' },
          ],
        },
        {
          type: 'table',
          headers: ['Tool', 'What it is', 'Reach for it when'],
          rows: [
            ['`venv` + `pip`', 'built in, always available', 'learning, small projects, anything that must run everywhere'],
            ['`uv`', 'a very fast modern installer and project manager (from Astral); also installs Python versions', 'new projects; speed; one tool for venv, install, lock and run'],
            ['`poetry`, `pdm`, `hatch`', 'project managers with lockfiles and publishing', 'libraries and apps with strict reproducibility'],
            ['`conda` / `mamba`', 'manages Python *and* non-Python binaries (CUDA toolkits, C libraries)', 'scientific and ML stacks with awkward native dependencies'],
            ['`pipx`', 'installs command-line tools each in its own hidden environment', 'tools such as `ruff` or `black` you use everywhere'],
          ],
          caption: 'Different tools solve the same core problem: isolated environments plus a reproducible list of dependencies.',
        },
        {
          type: 'code',
          title: 'uv_commands.sh',
          lang: 'shell',
          code: `uv venv
uv pip install numpy
uv add numpy
uv run python game.py`,
          annotations: [
            { lines: '1-2', text: '`uv` offers drop-in versions of the venv and pip commands, just much faster.' },
            { lines: 3, text: 'In a `pyproject.toml` project, `uv add` installs the library *and* records it in the file and the lockfile in one step.' },
            { lines: 4, text: '`uv run` executes a command inside the project’s environment, creating or updating it first if needed — no manual activation.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Lockfiles: reproducible environments',
          text: 'A range like `torch>=2.3` is flexible, but next month it may resolve to a different version than today, and "it worked yesterday" bugs appear. A **lockfile** (`uv.lock`, `poetry.lock`, or `pip freeze` output) records the *exact* versions that worked. Applications should commit a lockfile so every machine builds the identical environment; libraries should declare wide ranges so they coexist with other packages.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Which should you use?',
          text: 'Learn `venv` + `pip` first — they exist everywhere and everything else builds on the same ideas. Then adopt `uv` (or whatever your team uses) for speed and lockfiles. For the machine-learning course, either `uv` or `conda` works; what matters is **one environment per project** and a recorded dependency list.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'It is a good habit to commit your `.venv` folder to version control so teammates get exactly the same packages.',
      answer: false,
      explanation: 'False. An environment is large, contains machine-specific absolute paths and compiled binaries for your operating system, and cannot simply be copied to another machine. Commit `pyproject.toml` (and a lockfile or `requirements.txt`) instead, and add `.venv/` to `.gitignore`.',
    },
    {
      kind: 'error',
      prompt: 'This setup sequence is meant to install NumPy for the project, but then `python game.py` fails with `ModuleNotFoundError: No module named \'numpy\'`. Tap the step that is in the wrong place.',
      lines: [
        '`python3 -m venv .venv`',
        '`python -m pip install numpy`',
        '`source .venv/bin/activate`',
        '`python game.py`',
      ],
      linesAreCode: false,
      errorLines: [2],
      explanation: 'The install on step 2 runs **before** the environment is activated, so NumPy goes into the system (or user) Python, not into `.venv`. After activation the new `python` has no NumPy. Activate first (swap steps 2 and 3), then install.',
    },
    {
      kind: 'concept',
      title: 'When things go wrong: a field guide',
      blocks: [
        {
          type: 'p',
          text: 'Nearly every environment problem comes down to one question: **which Python (and which pip) is actually running?** Always check before debugging anything else. In a terminal run `python -c "import sys; print(sys.executable)"` — the path tells you everything. The same line works inside a program, in an IDE, or in a notebook.',
        },
        {
          type: 'table',
          headers: ['Symptom', 'Usual cause', 'Fix'],
          rows: [
            ['`ModuleNotFoundError: No module named \'x\'` right after `pip install x`', 'pip and python belong to different installations', 'use `python -m pip install x` in the *active* environment; check `sys.executable`'],
            ['`error: externally-managed-environment`', 'Debian, Ubuntu, Fedora and Homebrew protect the system Python (PEP 668)', 'create a venv, or use `pipx` for command-line tools; do not use `--break-system-packages`'],
            ['`python: command not found` (Linux/macOS)', 'the command is `python3`', 'use `python3`, or activate a venv where `python` exists'],
            ['IDE shows red squiggles on installed libraries', 'the editor uses another interpreter', 'select the interpreter at `.venv` in VS Code ("Python: Select Interpreter")'],
            ['`pip` cannot find a version of a package', 'your Python is too new or too old for that package', 'create the environment with a supported Python version (`uv python install 3.12`, `py -3.12`)'],
            ['activation script blocked on Windows', 'PowerShell execution policy', 'allow local scripts (`RemoteSigned`) or use `activate.bat`'],
          ],
          caption: 'The first diagnostic is always: which `python` is this?',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Never sudo pip install',
          text: 'Installing with administrator rights into the system Python can break operating-system tools that depend on specific versions of libraries. If you feel the urge to use `sudo pip`, you want a virtual environment instead.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'A healthy project routine',
          text: 'One environment per project, kept in `.venv`. Dependencies recorded in `pyproject.toml` (plus a lockfile). `.venv/` in `.gitignore`. New teammate: clone, create the environment, install from the file, run the tests. If the environment ever feels mysterious, delete `.venv` and rebuild it — that is the whole point of having the list.',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'Detecting a venv from code',
          text: 'Inside a venv, `sys.prefix != sys.base_prefix`. Some libraries use that check to warn you when you are installing into the global Python. `sys.executable` is the interpreter running right now and `sys.path` shows where imports are searched — the same path list from the Modules lesson, now including the environment’s `site-packages`.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'How many of these versions satisfy the specifier `~=2.3.1` (the compatible-release operator)?\n\n`2.3.0`, `2.3.1`, `2.3.9`, `2.4.0`, `3.0.0`',
      answer: '2',
      hint: '`~=2.3.1` means `>=2.3.1` **and** `<2.4`.',
      explanation: 'The compatible-release operator `~=2.3.1` is shorthand for `>=2.3.1, <2.4`. That admits `2.3.1` and `2.3.9` but not `2.3.0` (too old), `2.4.0` or `3.0.0` (too new): 2 versions.',
      label: 'Versions:',
    },
    {
      kind: 'code',
      prompt: 'Write `parse_version(text)` that turns a version string into a tuple of integers: `"1.10.2"` becomes `(1, 10, 2)` and `"2.3"` becomes `(2, 3)`. Ignore any non-digit suffix on a part: `"2.3.0rc1"` becomes `(2, 3, 0)`. Then write `newest(versions)` that returns the newest version string from a non-empty list, comparing numerically.',
      starter: `# define parse_version and newest here
`,
      solution: `import re

def parse_version(text):
    parts = []
    for part in text.split("."):
        match = re.match(r"\\d+", part)
        parts.append(int(match.group()) if match else 0)
    return tuple(parts)

def newest(versions):
    return max(versions, key=parse_version)
`,
      tests: `assert parse_version("1.10.2") == (1, 10, 2)
assert parse_version("2.3") == (2, 3)
assert parse_version("2.3.0rc1") == (2, 3, 0)
assert parse_version("7") == (7,)
assert newest(["1.10.0", "1.2.0", "1.9.1"]) == "1.10.0"
assert newest(["0.9", "0.10"]) == "0.10"
assert newest(["3.0.0"]) == "3.0.0"
assert parse_version("1.10.2") > parse_version("1.9.9")`,
      checks: ['Each dot-separated part becomes an `int`', 'A non-digit suffix such as `rc1` is ignored', '`newest` compares numerically, so `1.10.0` beats `1.9.1`'],
      hint: 'Split on `"."`, then take the leading digits of each part with `re.match(r"\\d+", part)`. For `newest`, use `max(versions, key=parse_version)`.',
      explanation: 'Splitting into integers fixes the string-comparison trap: the tuple `(1, 10, 0)` is larger than `(1, 9, 1)`. `re.match` anchors at the start of each part, so `"0rc1"` yields `0`. Passing `key=parse_version` to `max` returns the original *string* whose parsed form is largest.',
    },
    {
      kind: 'code',
      prompt: 'Write `parse_requirements(text)` that reads the text of a `requirements.txt` file and returns a list of `(name, specifier)` tuples in file order. Skip blank lines and comment lines (starting with `#`), remove inline comments (everything after `#`), drop extras such as `[all]` from the name, and remove spaces from the specifier. A package without a specifier gets `""`.',
      starter: `# define parse_requirements here
`,
      solution: `import re

def parse_requirements(text):
    result = []
    for line in text.splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        match = re.match(r"([A-Za-z0-9][A-Za-z0-9._-]*)(?:\\[[^\\]]*\\])?\\s*(.*)$", line)
        name, spec = match.group(1), match.group(2).replace(" ", "")
        result.append((name, spec))
    return result
`,
      tests: `text = """
# core
numpy>=1.26
torch == 2.3.0
rlgym[all]>=2.0   # RL toolkit

tqdm
pytest>=8,<9
"""
assert parse_requirements(text) == [
    ("numpy", ">=1.26"),
    ("torch", "==2.3.0"),
    ("rlgym", ">=2.0"),
    ("tqdm", ""),
    ("pytest", ">=8,<9"),
], parse_requirements(text)
assert parse_requirements("") == []
assert parse_requirements("# nothing\\n   \\n") == []
assert parse_requirements("scikit-learn~=1.5.0") == [("scikit-learn", "~=1.5.0")]`,
      checks: ['Blank lines and comments are ignored, including inline comments', 'Extras like `[all]` are removed from the name', 'Spaces are removed from specifiers; a bare name gets `""`'],
      hint: 'For each line: `line.split("#", 1)[0].strip()` removes comments. Then a regex with three parts — the name, an optional `[extras]`, and the rest — gives the pieces.',
      explanation: 'Splitting at the first `#` handles both comment lines and trailing comments. The regular expression captures the name (letters, digits, `.`, `_`, `-`), skips an optional bracketed extras group without capturing it, and takes everything left as the specifier, from which spaces are removed. Real tools use the `packaging` library for this, but the idea is the same.',
    },
    {
      kind: 'code',
      prompt: 'Write `unsatisfied(installed, requirements)` where `installed` is a dict of `name → version string` and `requirements` is a list of `(name, specifier)` pairs. Each specifier is `""` (any version), `"==V"`, `">=V"` or `"<V"`. Return the **sorted list of names** that are missing or whose installed version violates the specifier. Compare versions numerically and treat missing trailing parts as zero (`2.0` equals `2.0.0`).',
      starter: `# define unsatisfied here
`,
      solution: `def _version(text):
    parts = [int(part) for part in text.split(".")]
    return parts

def _padded(a, b):
    size = max(len(a), len(b))
    return tuple(a + [0] * (size - len(a))), tuple(b + [0] * (size - len(b)))

def unsatisfied(installed, requirements):
    problems = []
    for name, spec in requirements:
        if name not in installed:
            problems.append(name)
            continue
        if not spec:
            continue
        if spec.startswith("=="):
            op, wanted = "==", spec[2:]
        elif spec.startswith(">="):
            op, wanted = ">=", spec[2:]
        else:
            op, wanted = "<", spec[1:]
        have, need = _padded(_version(installed[name]), _version(wanted))
        ok = have == need if op == "==" else have >= need if op == ">=" else have < need
        if not ok:
            problems.append(name)
    return sorted(problems)
`,
      tests: `installed = {"numpy": "1.26.4", "torch": "2.3.0", "tqdm": "4.66"}
assert unsatisfied(installed, [("numpy", ">=1.26"), ("torch", "==2.3.0"), ("tqdm", "")]) == []
assert unsatisfied(installed, [("numpy", ">=2.0")]) == ["numpy"]
assert unsatisfied(installed, [("pandas", ">=2")]) == ["pandas"]
assert unsatisfied(installed, [("torch", "==2.3")]) == []
assert unsatisfied(installed, [("torch", "<2.3")]) == ["torch"]
assert unsatisfied(installed, [("tqdm", ">=4.9")]) == []
assert unsatisfied(installed, [("zeta", ""), ("numpy", "<1.0"), ("alpha", "==1")]) == ["alpha", "numpy", "zeta"]
assert unsatisfied({}, []) == []`,
      checks: ['Missing packages are reported', '`==`, `>=` and `<` are compared numerically (`4.66` is newer than `4.9`)', 'Missing trailing zeros are padded, so `2.3` equals `2.3.0`', 'The result is sorted'],
      hint: 'Turn both versions into lists of ints, pad the shorter one with zeros to the same length, convert to tuples, then compare with `==`, `>=` or `<` depending on the specifier.',
      explanation: 'Three traps are handled: strings are never compared directly (so `4.66 >= 4.9` is true, correctly); the shorter version is padded with zeros so `2.3` and `2.3.0` are equal; and a missing package is a problem regardless of its specifier. Real resolvers (`pip`, `uv`) implement the same logic, with many more operators.',
    },
  ],
  takeaways: [
    'Give every project its own virtual environment: `python -m venv .venv`, activate it (`source .venv/bin/activate` or `.venv\\Scripts\\Activate.ps1`), install into it, and keep `.venv/` out of version control.',
    'Activation only changes `PATH`. Install with `python -m pip install …` so pip and python always match, and verify with `sys.executable` or `sys.prefix` when anything looks wrong.',
    'Version specifiers: `==`, `>=`, `<`, `!=`, `~=`. Versions are tuples of integers, never strings or decimals — `1.10` is newer than `1.9`.',
    '`pyproject.toml` describes a project (name, version, dependencies, optional extras, scripts); lockfiles record exact versions for reproducibility. `venv`+`pip` is the baseline; `uv`, Poetry and conda build on the same ideas.',
    'Troubleshoot by asking "which Python is running?". Never `sudo pip`, and beware look-alike package names.',
  ],
  reading: [
    { title: 'Python Packaging User Guide — Installing packages', url: 'https://packaging.python.org/en/latest/tutorials/installing-packages/', source: 'docs', note: 'The official tutorial for environments and pip.' },
    { title: 'venv — Creation of virtual environments', url: 'https://docs.python.org/3/library/venv.html', source: 'docs', note: 'How environments work, with the activation command for every shell.' },
    { title: 'Writing your pyproject.toml', url: 'https://packaging.python.org/en/latest/guides/writing-pyproject-toml/', source: 'docs', note: 'Every field of the `[project]` table explained.' },
    { title: 'uv documentation', url: 'https://docs.astral.sh/uv/', source: 'docs', note: 'The fast all-in-one project and environment manager.' },
    { title: 'PEP 668 — Marking Python base environments as externally managed', url: 'https://peps.python.org/pep-0668/', source: 'pep', note: 'The reason behind the "externally-managed-environment" error.' },
  ],
};
