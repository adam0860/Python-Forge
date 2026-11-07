import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-packaging',
  title: 'Packaging and Publishing',
  summary: 'Turning your code into something other people can install and run: wheels and source distributions, `pyproject.toml` metadata, version numbers and dependency specifiers, building and uploading to PyPI, and shipping apps and games to users who do not have Python.',
  minutes: 20,
  objectives: [
    'Explain what wheels and source distributions are, and read a wheel filename',
    'Describe the parts of a publishable `pyproject.toml`: build system, metadata, dependencies, extras and scripts',
    'Use semantic versioning and dependency specifiers (`>=`, `~=`, `<`) correctly',
    'Follow the build, check and upload workflow, with safe handling of credentials',
    'Choose a way to ship an application or game to people without Python: zipapp, PyInstaller, Briefcase or the web',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'What gets distributed: wheels and sdists',
      blocks: [
        {
          type: 'p',
          text: 'Earlier you organized a project and used `pip` to install other people’s code. Now the other direction: making *your* code installable by others. A package is shared as one of two file kinds. A **[[wheel]]** (`.whl`) is a built, ready-to-install archive: pip just unpacks it. A **[[sdist]]** (source distribution, `.tar.gz`) holds the source and must be built on the user’s machine first. You normally publish both, and pip prefers the wheel because it needs no build tools and installs in a moment. The surprising fact is how simple a wheel is: **it is a zip file** with your package folders plus a `*.dist-info` folder of metadata. This program builds a (simplified) one in memory and inspects it.',
        },
        {
          type: 'code',
          title: 'a_wheel_is_a_zip.py',
          runnable: true,
          code: `import io
import zipfile

buf = io.BytesIO()
with zipfile.ZipFile(buf, "w") as wheel:
    wheel.writestr("forge_arena/__init__.py", "__version__ = '1.2.0'\\n")
    wheel.writestr("forge_arena/game.py", "def score(kills):\\n    return kills * 100\\n")
    wheel.writestr("forge_arena-1.2.0.dist-info/METADATA",
                   "Metadata-Version: 2.1\\nName: forge-arena\\nVersion: 1.2.0\\n")

with zipfile.ZipFile(io.BytesIO(buf.getvalue())) as wheel:
    for name in wheel.namelist():
        print(name)
    meta = wheel.read("forge_arena-1.2.0.dist-info/METADATA").decode()
print(meta.splitlines()[1:])`,
          output: `forge_arena/__init__.py
forge_arena/game.py
forge_arena-1.2.0.dist-info/METADATA
['Name: forge-arena', 'Version: 1.2.0']`,
          annotations: [
            { lines: '4-5', text: 'An in-memory file (`BytesIO`) opened with `zipfile` in write mode: the "wheel".' },
            { lines: '6-7', text: 'The importable code sits at the top level of the archive, exactly as it will appear in `site-packages` after installation.' },
            { lines: '8-9', text: 'The **`.dist-info` folder** holds the metadata (name, version, dependencies…) that pip reads. A real wheel also has `WHEEL`, `RECORD` (a list of every file with its hash) and, for scripts, `entry_points.txt`.' },
            { lines: '11-13', text: 'Reopen the bytes as a zip and list the contents. Installing a wheel is essentially "extract these files into `site-packages`".' },
            { lines: '14-15', text: 'Read the metadata back. `pip show forge-arena` prints exactly this information.' },
          ],
        },
        {
          type: 'table',
          headers: ['Part of the filename', 'In `forge_arena-1.2.0-py3-none-any.whl`', 'In `numpy-2.1.0-cp313-cp313-win_amd64.whl`'],
          rows: [
            ['Distribution name', '`forge_arena`', '`numpy`'],
            ['Version', '`1.2.0`', '`2.1.0`'],
            ['Python tag', '`py3` (any Python 3)', '`cp313` (CPython 3.13 only)'],
            ['ABI tag', '`none` (no compiled code)', '`cp313`'],
            ['Platform tag', '`any` (all systems)', '`win_amd64` (64-bit Windows)'],
          ],
          caption: 'A wheel filename is five parts joined by hyphens. Pure-Python packages get one universal wheel; packages with compiled code need one wheel per Python version and platform.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why wheels matter',
          text: 'Libraries such as NumPy and PyTorch contain compiled C/C++/CUDA code. Their maintainers build one wheel per platform and Python version, so `pip install numpy` downloads a finished binary and never needs a compiler. If no matching wheel exists, pip falls back to the sdist and tries to compile — which is why a brand-new Python version sometimes cannot install a package yet.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'C++ has no standard package format: you vendor sources, use CMake `FetchContent`, or rely on managers such as vcpkg and Conan, and each user compiles for their toolchain. Python’s wheel standard means a pure-Python library installs everywhere with one file, and compiled libraries ship pre-built per platform.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'Why does `pip` prefer to install a wheel instead of a source distribution?',
      options: [
        { text: 'A wheel is already built, so installing it only unpacks files — no compiler or build tools needed', correct: true, why: 'That is the point of a wheel: all building happened on the maintainer’s side, so installation is fast and does not depend on the user having build tools.' },
        { text: 'A wheel is encrypted, so it cannot be tampered with', why: 'Wheels are plain zip files. Integrity comes from hashes and HTTPS, not encryption.' },
        { text: 'A wheel always contains a faster version of the code', why: 'The code is identical; only the packaging differs. (Compiled extensions are built into the wheel, but the speed comes from compilation, not the wheel format.)' },
        { text: 'A source distribution cannot contain Python code', why: 'It contains the source code — it just needs to be built before installation.' },
      ],
      explanation: 'A wheel is a pre-built archive: installing it means unpacking files into `site-packages`. A source distribution has to be built first, which needs build tools and takes longer.',
    },
    {
      kind: 'concept',
      title: 'pyproject.toml: describing the project, and versions',
      blocks: [
        {
          type: 'p',
          text: 'You met `pyproject.toml` in the project-structure lesson. For publishing, two tables matter. **`[build-system]`** tells tools how to build the package (`requires` lists build tools; `build-backend` names the backend — setuptools, hatchling, flit-core, or Poetry’s). **`[project]`** holds the metadata users see on PyPI: `name`, `version`, `description`, `readme`, `license`, `requires-python`, `dependencies`, optional-dependency groups ("extras") and `[project.scripts]`, which turns a function into a **command-line program** that pip installs on the user’s PATH. The file is TOML, which Python reads with the standard-library `tomllib` (3.11+):',
        },
        {
          type: 'code',
          title: 'read_pyproject.py',
          runnable: true,
          code: `import tomllib

text = '''
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "forge-arena"
version = "1.2.0"
requires-python = ">=3.10"
dependencies = ["numpy>=1.26", "rich~=13.0"]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[project.scripts]
forge-arena = "forge_arena.cli:main"
'''
data = tomllib.loads(text)
project = data["project"]
print(project["name"], project["version"], project["requires-python"])
print(project["dependencies"])
print(list(project["scripts"].items()))
print(data["build-system"]["build-backend"])`,
          output: `forge-arena 1.2.0 >=3.10
['numpy>=1.26', 'rich~=13.0']
[('forge-arena', 'forge_arena.cli:main')]
setuptools.build_meta`,
          annotations: [
            { lines: '4-6', text: '**How to build**: which tools are needed and which backend turns the source into a wheel. `python -m build` reads this table.' },
            { lines: '8-12', text: '**What it is**: name, version, supported Python versions, and runtime dependencies written as *specifiers* (explained below).' },
            { lines: '14-15', text: '**Extras**: optional dependency groups. `pip install "forge-arena[dev]"` also installs pytest and ruff.' },
            { lines: '17-18', text: '**Scripts**: after installation the command `forge-arena` calls `main()` in `forge_arena/cli.py`.' },
            { lines: 20, text: '`tomllib.loads` parses TOML text into ordinary dictionaries and lists (use `tomllib.load(file)` with a binary file).' },
            { lines: '22-25', text: 'Pulling out the metadata. Tools such as pip, build and your editor read the same dictionary.' },
          ],
        },
        {
          type: 'p',
          text: 'Two things need discipline: version numbers and dependency ranges. **[[semantic-versioning]]** (`MAJOR.MINOR.PATCH`) is the convention: bump **PATCH** for bug fixes (`1.2.0 → 1.2.1`), **MINOR** for new backward-compatible features (`1.2.1 → 1.3.0`, patch resets to 0) and **MAJOR** for breaking changes (`1.3.0 → 2.0.0`). Dependencies use *specifiers* so you allow the versions you tested and exclude the ones you know break:',
        },
        {
          type: 'table',
          headers: ['Specifier', 'Meaning', 'Example matches'],
          rows: [
            ['`==1.2.0`', 'exactly this version', '1.2.0'],
            ['`>=1.2`', 'this version or newer', '1.2, 1.9.4, 3.0'],
            ['`<2.0`', 'older than this version', '1.99.9 (not 2.0)'],
            ['`!=1.5.0`', 'anything except this version', '1.4.9, 1.5.1'],
            ['`~=1.4`', 'compatible release: at least 1.4 but below 2.0', '1.4, 1.9 (not 2.0)'],
            ['`~=1.4.2`', 'at least 1.4.2 but below 1.5', '1.4.2, 1.4.9 (not 1.5.0)'],
            ['`>=1.2,<2.0`', 'both rules must hold (comma = "and")', '1.2 to 1.99.9'],
          ],
          caption: 'The common dependency specifiers from PEP 440. Version numbers compare number by number: 1.10.0 is newer than 1.9.5.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Versions are not strings',
          text: 'Never compare versions as text: `"1.10.0" < "1.9.5"` is `True` because strings compare character by character (`"1"` against `"9"`). Compare them as tuples of integers, `(1, 10, 0) > (1, 9, 5)`, or use the `packaging.version.Version` class from the `packaging` library, which also understands pre-releases such as `2.0.0rc1`.',
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Libraries vs applications',
          text: 'A **library** should declare *wide* ranges (`numpy>=1.26`) so it fits into many projects; a too-narrow pin causes conflicts for its users. An **application** (a game, a training script) should *lock* exact versions of everything (`uv lock`, `pip freeze`, `poetry.lock`) so every machine runs the same tested set.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If you upload a package version to PyPI and then find a mistake, you can upload a corrected file with the same version number to replace it.',
      answer: false,
      explanation: 'False. PyPI never lets you replace a published file: anything installed or cached by anyone must stay identical. You can "yank" a bad release (so pip skips it by default) and publish a fixed one under a **new** version number, such as 1.2.1.',
    },
    {
      kind: 'concept',
      title: 'Build, check, upload',
      blocks: [
        {
          type: 'p',
          text: 'The publishing workflow has four stages. **1. Prepare**: a `README`, a `LICENSE` (without a license, others have no legal right to use your code), accurate `requires-python`, a new version number and a changelog entry; tag the commit in git (`git tag v1.2.0`). **2. Build**: `python -m build` creates the sdist and wheel in `dist/`. **3. Check**: `twine check` validates the metadata, and — most important — you install the wheel into a *fresh* virtual environment and run it, because a missing file or dependency only shows up there. **4. Upload**: first to **TestPyPI** (a practice copy of the index), then to the real PyPI.',
        },
        {
          type: 'code',
          title: 'terminal',
          lang: 'text',
          code: `$ python -m pip install build twine
$ python -m build
Successfully built forge_arena-1.2.0.tar.gz and forge_arena-1.2.0-py3-none-any.whl
$ ls dist
forge_arena-1.2.0-py3-none-any.whl  forge_arena-1.2.0.tar.gz
$ twine check dist/*
Checking dist/forge_arena-1.2.0-py3-none-any.whl: PASSED
Checking dist/forge_arena-1.2.0.tar.gz: PASSED
$ twine upload --repository testpypi dist/*
$ python -m pip install --index-url https://test.pypi.org/simple/ forge-arena`,
          annotations: [
            { lines: '2-3', text: '`build` reads `pyproject.toml`, runs the backend in an isolated environment and produces **both** archives.' },
            { lines: '4-5', text: 'The `dist/` folder contains the wheel (`py3-none-any`: pure Python, runs anywhere) and the sdist.' },
            { lines: '6-8', text: '`twine check` verifies that the metadata and README will render correctly on the PyPI project page.' },
            { lines: 9, text: 'Upload to **TestPyPI** first. You need an account and an API token — kept in an environment variable or a keyring, **never in your code or git repository**.' },
            { lines: 10, text: 'Install from TestPyPI into a *clean* virtual environment and run the program: this tests what your users will actually get.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Trusted publishing',
          text: 'Instead of storing a long-lived token, PyPI supports **trusted publishing**: you tell PyPI that a particular GitHub repository and workflow may publish the project, and a short GitHub Actions job (`pypa/gh-action-pypi-publish`) uploads releases whenever you push a version tag. No secrets to leak or rotate.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Security hygiene',
          text: 'Never commit tokens, `.env` files or model-training secrets; add them to `.gitignore`. Pin and audit your dependencies (`pip-audit`), and double-check the spelling of names you install — look-alike "typosquat" packages exist. And never load data from untrusted sources with `pickle` (or old-style `torch.load`): unpickling can run arbitrary code. Use `torch.load(path, weights_only=True)` or formats such as safetensors.',
        },
        {
          type: 'callout',
          variant: 'exam',
          title: 'Typical questions',
          text: '"What is a wheel?" (a pre-built zip archive installed by unpacking); "Which file describes a modern package?" (`pyproject.toml`); "What do you bump for a breaking change?" (the MAJOR number); "What does `~=1.4` allow?" (1.4 up to but excluding 2.0); "Why test the install in a fresh venv?" (to catch missing files and dependencies); "Can you overwrite a PyPI release?" (no).',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the sentences about packaging.',
      template: `A pre-built package archive has the extension .___ and is really just a zip file. Running pip install -e . makes an ___ install that points at your source folder.`,
      templateIsCode: false,
      blanks: [{ answers: ['whl'] }, { answers: ['editable'] }],
      wordBank: ['whl', 'editable', 'tar', 'frozen'],
      explanation: 'Wheels use the `.whl` extension. An **editable** install (`pip install -e .`) links the environment to your working folder, so code changes take effect immediately — the standard way to develop a package.',
    },
    {
      kind: 'concept',
      title: 'Shipping an app or game to people without Python',
      blocks: [
        {
          type: 'p',
          text: 'PyPI is for *developers* who already have Python. Players and ordinary users do not, so applications are distributed another way. The simplest is the standard-library **`zipapp`** module, which packs a program into a single `.pyz` file that runs with `python app.pyz` (it still needs Python, but it is one file). For a true double-click program, **PyInstaller** bundles your code, its dependencies and a Python interpreter into a folder or a single `.exe`; it must be run on each target operating system. The `zipapp` example below packs and runs a tiny program (in the app, the `.pyz` file lives in memory only).',
        },
        {
          type: 'code',
          title: 'zipapp_demo.py',
          runnable: true,
          code: `import runpy
import tempfile
import zipapp
from pathlib import Path

with tempfile.TemporaryDirectory() as tmp:
    src = Path(tmp) / "app"
    src.mkdir()
    (src / "greet.py").write_text('def main():\\n    print("hello from a zip")\\n')
    target = Path(tmp) / "greet.pyz"
    zipapp.create_archive(src, target, main="greet:main")
    runpy.run_path(str(target), run_name="__main__")
    print(target.suffix, target.stat().st_size > 0)`,
          output: `hello from a zip
.pyz True`,
          annotations: [
            { lines: '7-9', text: 'A tiny application: a folder containing `greet.py` with a `main()` function.' },
            { lines: '10-11', text: '`zipapp.create_archive` packs the folder into one `.pyz` file and sets the entry point to `greet:main` (module `greet`, function `main`).' },
            { lines: 12, text: 'Running the archive calls `main()`. On a command line you would type `python greet.pyz`. (`runpy.run_path` does the same from inside Python.)' },
            { lines: 13, text: 'The result is just one small file — like a wheel, a zip archive with a known layout.' },
          ],
        },
        {
          type: 'table',
          headers: ['Goal', 'Tool', 'What you get'],
          rows: [
            ['Share a library with developers', '`build` + `twine` (PyPI)', 'A wheel and sdist installable with `pip install`'],
            ['One file for people who have Python', '`zipapp`', 'A `.pyz` file run with `python app.pyz`'],
            ['Double-click program for Windows/macOS/Linux', '**PyInstaller**, cx_Freeze, Nuitka', 'A folder or single executable with the interpreter bundled (build on each OS)'],
            ['Polished desktop and mobile apps (including Android)', '**Briefcase** (BeeWare), Buildozer for Kivy', 'Installers and Android/iOS packages'],
            ['A game or tool that runs in the browser', '**pygbag** (pygame), Pyodide', 'Python compiled to WebAssembly — the same technology this app uses to run your code'],
            ['A service on a server', 'Docker image', 'The program with an exact, reproducible environment'],
          ],
          caption: 'Pick the distribution method from the audience, not from habit.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Shipping AI and game projects',
          text: 'A trained model is a **file** (weights in PyTorch `.pt`/safetensors format, or portable **ONNX**) and should be shipped next to the code, loaded via a path relative to the program (`importlib.resources` or the folder of `__file__`; PyInstaller exposes `sys._MEIPASS`). Large model files do not belong in the wheel: download them on first run or host them separately. To embed a trained agent in a game engine, exporting to ONNX and running it with a small runtime is often better than shipping all of PyTorch.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Expect a larger download',
          text: 'A bundled executable contains a full interpreter and all libraries, so a tiny script can become tens of megabytes, and a PyTorch program gigabytes. Antivirus programs sometimes flag unsigned single-file executables, so sign your releases if you distribute widely. Keep dependencies lean: every library you import ships to every user.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output. Compare the numeric tuples with the plain strings.',
      code: `print((1, 10, 0) > (1, 9, 5), "1.10.0" > "1.9.5")`,
      answer: 'True False',
      hint: 'Tuples compare element by element as numbers; strings compare character by character.',
      explanation: 'As tuples, version 1.10.0 is newer than 1.9.5 because `10 > 9`: `True`. As strings, the comparison stops at the first differing character after "1.": `"1"` is less than `"9"`, so `"1.10.0" > "1.9.5"` is `False`. This is why versions must be compared as numbers.',
    },
    {
      kind: 'error',
      prompt: 'This program is meant to put a METADATA file inside the wheel, but it crashes and the file is never written. Tap the faulty line.',
      lines: [
        'import zipfile',
        'with zipfile.ZipFile("pkg.whl", "w") as z:',
        '    z.writestr("pkg/__init__.py", "")',
        'z.writestr("pkg-1.0.dist-info/METADATA", "Name: pkg")',
      ],
      linesAreCode: true,
      errorLines: [4],
      explanation: 'The `with` block ends — and closes the archive — one line earlier, so line 4 writes to a closed `ZipFile` and raises `ValueError`. Indent it so that it runs inside the `with` block.',
    },
    {
      kind: 'numeric',
      prompt: 'A dependency is declared as `rich~=1.4.2` (compatible release). Versions are allowed from 1.4.2 up to, but not including, `1.X.0`. What number is `X`?',
      answer: '5',
      hint: 'The last component is dropped and the one before it is increased by one: 1.4.2 becomes below 1.5.',
      explanation: '`~=1.4.2` means `>=1.4.2` and `<1.5` — patch releases of 1.4 only. So the upper bound is 1.5.0 (excluded) and X is 5. With `~=1.4` the range would instead be `>=1.4,<2.0`.',
      label: 'X =',
    },
    {
      kind: 'code',
      prompt: 'Write `bump_version(version, part)` for semantic versions `"MAJOR.MINOR.PATCH"`. `part` is `"major"`, `"minor"` or `"patch"`. Bumping a part increases it by one and resets all lower parts to 0; return the new version string. Raise `ValueError` if `version` is not exactly three dot-separated numbers or `part` is unknown.',
      starter: `def bump_version(version, part):
    ...
`,
      solution: `def bump_version(version, part):
    pieces = version.split(".")
    if len(pieces) != 3 or not all(p.isascii() and p.isdigit() for p in pieces):
        raise ValueError(f"not a MAJOR.MINOR.PATCH version: {version!r}")
    major, minor, patch = (int(p) for p in pieces)
    if part == "major":
        major, minor, patch = major + 1, 0, 0
    elif part == "minor":
        minor, patch = minor + 1, 0
    elif part == "patch":
        patch += 1
    else:
        raise ValueError(f"unknown part: {part!r}")
    return f"{major}.{minor}.{patch}"
`,
      tests: `assert bump_version("1.2.3", "patch") == "1.2.4"
assert bump_version("1.2.3", "minor") == "1.3.0"
assert bump_version("1.2.3", "major") == "2.0.0"
assert bump_version("0.9.9", "major") == "1.0.0"
assert bump_version("1.9.9", "minor") == "1.10.0"
assert bump_version("0.0.0", "patch") == "0.0.1"
assert bump_version("10.20.30", "patch") == "10.20.31"

for bad in ("1.2", "1.2.x", "1.2.3.4", "", " 1.2.3", "1.-2.3", "a.b.c"):
    try:
        bump_version(bad, "patch")
        assert False, "must reject " + repr(bad)
    except ValueError:
        pass

for bad_part in ("build", "Major", ""):
    try:
        bump_version("1.2.3", bad_part)
        assert False, "must reject part " + repr(bad_part)
    except ValueError:
        pass`,
      checks: ['Bumping a part adds one to it and resets all lower parts to 0 (\`1.9.9\` minor gives \`1.10.0\`)', 'Returns a string; numbers are handled as integers, not text', 'Raises \`ValueError\` for malformed versions and for unknown parts'],
      hint: 'Split on `"."`, check there are exactly three pieces that are all digits, convert to `int`, then change the right numbers and format them back with an f-string.',
      explanation: 'Treating the pieces as integers makes `1.9.9 → 1.10.0` work, and resetting the lower parts follows the SemVer convention: a new minor version restarts the patch count. Release tools such as `bump-my-version` do exactly this to your `pyproject.toml`.',
    },
    {
      kind: 'code',
      prompt: 'Write `parse_wheel_filename(filename)` returning a dict with keys `distribution`, `version`, `build`, `python`, `abi`, `platform`. A wheel filename is `{distribution}-{version}-{python}-{abi}-{platform}.whl`, with an optional **build tag** between the version and the python tag (it must start with a digit; otherwise `build` is `None`). Raise `ValueError` if the name does not end with `.whl` or does not have exactly 5 or 6 hyphen-separated parts.',
      starter: `def parse_wheel_filename(filename):
    ...
`,
      solution: `def parse_wheel_filename(filename):
    if not filename.endswith(".whl"):
        raise ValueError("not a wheel file: " + filename)
    parts = filename[: -len(".whl")].split("-")
    if len(parts) == 5:
        distribution, version, python, abi, platform = parts
        build = None
    elif len(parts) == 6:
        distribution, version, build, python, abi, platform = parts
        if not build[:1].isdigit():
            raise ValueError("build tag must start with a digit: " + filename)
    else:
        raise ValueError("wrong number of parts: " + filename)
    return {
        "distribution": distribution,
        "version": version,
        "build": build,
        "python": python,
        "abi": abi,
        "platform": platform,
    }
`,
      tests: `assert parse_wheel_filename("forge_arena-1.2.0-py3-none-any.whl") == {
    "distribution": "forge_arena",
    "version": "1.2.0",
    "build": None,
    "python": "py3",
    "abi": "none",
    "platform": "any",
}
assert parse_wheel_filename("numpy-2.1.0-cp313-cp313-win_amd64.whl") == {
    "distribution": "numpy",
    "version": "2.1.0",
    "build": None,
    "python": "cp313",
    "abi": "cp313",
    "platform": "win_amd64",
}
r = parse_wheel_filename("pkg-1.0-1-py2.py3-none-any.whl")
assert r["build"] == "1" and r["python"] == "py2.py3" and r["version"] == "1.0"

for bad in ("pkg-1.0.tar.gz", "pkg-1.0-py3-none.whl", "pkg-1.0-1-2-py3-none-any.whl",
            "pkg-1.0-x-py3-none-any.whl", "", "pkg.whl"):
    try:
        parse_wheel_filename(bad)
        assert False, "must reject " + repr(bad)
    except ValueError:
        pass`,
      checks: ['Returns the six fields, with \`build\` set to \`None\` when there is no build tag', 'Accepts a 6-part name only if the build tag starts with a digit', 'Raises \`ValueError\` for other extensions and for the wrong number of parts'],
      hint: 'Strip the `.whl` suffix and `split("-")`. Five parts means no build tag; six parts means the third is the build tag. Anything else is an error.',
      explanation: 'Wheel names are designed to be machine-readable: pip reads the python, ABI and platform tags to decide whether a wheel fits your interpreter and operating system, and chooses the best match from the files on PyPI.',
    },
    {
      kind: 'code',
      prompt: 'Write `satisfies(version, spec)`: does the version (like `"1.4.2"`, one to three numeric parts) meet a dependency specifier such as `">=1.2,<2.0"`? Clauses are separated by commas (ignore spaces around them). Supported operators: `==`, `!=`, `>=`, `<=`, `>`, `<` and `~=` (compatible release: `~=1.4` means `>=1.4,<2` and `~=1.4.2` means `>=1.4.2,<1.5`). Compare numerically, padding missing parts with zeros (`1.4 == 1.4.0`). Raise `ValueError` for an unknown operator, non-numeric versions, or `~=` with a single-part version.',
      starter: `def satisfies(version, spec):
    ...
`,
      solution: `def _parse(text):
    parts = text.strip().split(".")
    if not all(p.isascii() and p.isdigit() for p in parts):
        raise ValueError("bad version: " + repr(text))
    return [int(p) for p in parts]


def _compare(a, b):
    n = max(len(a), len(b))
    a = a + [0] * (n - len(a))
    b = b + [0] * (n - len(b))
    return (a > b) - (a < b)


def satisfies(version, spec):
    current = _parse(version)
    for clause in spec.split(","):
        clause = clause.strip()
        for op in ("==", "!=", ">=", "<=", "~=", ">", "<"):
            if clause.startswith(op):
                target = _parse(clause[len(op):])
                break
        else:
            raise ValueError("unknown operator in " + repr(clause))
        c = _compare(current, target)
        if op == "==":
            ok = c == 0
        elif op == "!=":
            ok = c != 0
        elif op == ">=":
            ok = c >= 0
        elif op == "<=":
            ok = c <= 0
        elif op == ">":
            ok = c > 0
        elif op == "<":
            ok = c < 0
        else:
            if len(target) < 2:
                raise ValueError("~= needs at least two parts")
            upper = target[:-2] + [target[-2] + 1]
            ok = c >= 0 and _compare(current, upper) < 0
        if not ok:
            return False
    return True
`,
      tests: `assert satisfies("1.4.2", ">=1.4") is True
assert satisfies("1.3.9", ">=1.4") is False
assert satisfies("2.0", "<2.0") is False
assert satisfies("1.99.9", "<2.0") is True
assert satisfies("1.4", "==1.4.0") is True
assert satisfies("1.4.1", "==1.4.0") is False
assert satisfies("1.4.1", "!=1.4.0") is True
assert satisfies("1.4.0", "!=1.4") is False
assert satisfies("1.10.0", ">1.9.5") is True
assert satisfies("1.9.5", ">1.9.5") is False
assert satisfies("1.9.5", "<=1.9.5") is True

assert satisfies("1.4.9", "~=1.4.2") is True
assert satisfies("1.5.0", "~=1.4.2") is False
assert satisfies("1.4.1", "~=1.4.2") is False
assert satisfies("1.9", "~=1.4") is True
assert satisfies("2.0", "~=1.4") is False
assert satisfies("1.3", "~=1.4") is False

assert satisfies("1.5", ">=1.2,<2.0") is True
assert satisfies("2.0.1", ">=1.2, <2.0") is False
assert satisfies("1.5", ">=1.2,!=1.5,<2") is False
assert satisfies("3", ">=2") is True

for version, spec in [("1.0", "~=1"), ("1.0", "=1.0"), ("a.b", ">=1"), ("1.0", ">=x"), ("1.0", "1.0")]:
    try:
        satisfies(version, spec)
        assert False, "must reject " + repr((version, spec))
    except ValueError:
        pass`,
      checks: ['Handles all seven operators and comma-separated clauses (all must hold), ignoring spaces', 'Compares versions numerically with zero padding (\`1.10.0 > 1.9.5\`, \`1.4 == 1.4.0\`)', '\`~=\` uses the upper bound from dropping the last part; invalid input raises \`ValueError\`'],
      hint: 'Convert each version to a list of ints and compare them (padded to equal length). Find the operator with `startswith`, checking two-character operators before `>` and `<`. For `~=X.Y.Z` the upper bound is `X.(Y+1)`: `target[:-2] + [target[-2] + 1]`.',
      explanation: 'This is a small version of what pip’s resolver does with every dependency: parse the specifiers, compare versions numerically and keep only candidates that satisfy all clauses. The real `packaging.specifiers.SpecifierSet` also handles pre-releases and wildcards.',
    },
  ],
  takeaways: [
    'A **wheel** (`.whl`) is a pre-built zip that pip installs by unpacking; an **sdist** (`.tar.gz`) is source that must be built first. Publish both. The wheel filename encodes the distribution, version, Python, ABI and platform.',
    '`pyproject.toml` holds `[build-system]` (how to build) and `[project]` (name, version, `requires-python`, dependencies, extras, scripts). Python reads TOML with `tomllib`.',
    'Use **semantic versioning** (MAJOR for breaking, MINOR for features, PATCH for fixes) and dependency specifiers (`>=`, `<`, `~=`). Compare versions as numbers, never as text. Libraries use wide ranges, applications lock exact versions.',
    'The workflow: prepare (README, LICENSE, version, tag) → `python -m build` → `twine check` and a test install in a fresh venv → TestPyPI → PyPI, ideally with trusted publishing. Releases cannot be overwritten; keep tokens out of your code.',
    'To reach users without Python, bundle the program: `zipapp` for one file, **PyInstaller** or Nuitka for executables, Briefcase for desktop and mobile apps, WebAssembly for the browser. Ship trained models as separate files, and load untrusted pickles never.',
  ],
  reading: [
    { title: 'Python Packaging User Guide — Packaging Python Projects', url: 'https://packaging.python.org/en/latest/tutorials/packaging-projects/', source: 'docs', note: 'The official step-by-step tutorial from `pyproject.toml` to uploading on TestPyPI.' },
    { title: 'Writing your pyproject.toml', url: 'https://packaging.python.org/en/latest/guides/writing-pyproject-toml/', source: 'docs', note: 'Every field of the `[project]` table explained, including dependencies, extras and scripts.' },
    { title: 'Version specifiers (PEP 440 reference)', url: 'https://packaging.python.org/en/latest/specifications/version-specifiers/', source: 'docs', note: 'The exact rules for version numbers and the `==`, `>=`, `~=` specifiers.' },
    { title: 'Semantic Versioning 2.0.0', url: 'https://semver.org/', source: 'article', note: 'The short specification of MAJOR.MINOR.PATCH.' },
    { title: 'PyInstaller manual', url: 'https://pyinstaller.org/en/stable/', source: 'docs', note: 'Bundling a Python program into a standalone executable for Windows, macOS and Linux.' },
  ],
};
