import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-modules',
  title: 'Modules and Imports',
  summary: 'What a module and a package really are, every form of `import`, where Python looks for modules, why a module runs only once, the `__name__ == "__main__"` idiom, relative imports in packages, and the pitfalls (name shadowing, circular imports).',
  minutes: 19,
  objectives: [
    'Explain that a module is a file whose top-level code runs once, on first import, and is then cached in `sys.modules`',
    'Use `import x`, `import x as y`, `from x import y` and know why `from x import *` is discouraged',
    'Describe how Python finds modules through `sys.path`, and handle `ModuleNotFoundError` and `ImportError`',
    'Build a package with `__init__.py`, absolute and relative imports, and use the `if __name__ == "__main__":` guard',
    'Load modules dynamically with `importlib` and recognize shadowing and circular-import problems',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'A module is just a file',
      blocks: [
        {
          type: 'p',
          text: 'A [[module]] is a Python file. If you save `hero.py` containing a function, any other file in the same folder can `import hero` and use that function. Importing runs the file from top to bottom **once**, and gives you a *module object* — a namespace whose attributes are the names the file defined (its variables, functions and classes). That is how Python programs split into reusable pieces, and how the [[standard-library]] and thousands of third-party libraries are used.',
        },
        {
          type: 'p',
          text: 'For this demonstration the code creates the module file itself, so you can watch the whole process. In a real project you would simply create `heromod.py` in your editor.',
        },
        {
          type: 'code',
          title: 'module_is_a_file.py',
          runnable: true,
          code: `from pathlib import Path
import importlib, sys

Path("heromod.py").write_text('''"""Hero helpers."""
print("heromod is loading; __name__ =", __name__)
MAX_HP = 100
def heal(hp, amount):
    return min(hp + amount, MAX_HP)
if __name__ == "__main__":
    print("run directly")
''', encoding="utf-8")
importlib.invalidate_caches()
import heromod
import heromod
print(heromod.heal(90, 30), heromod.MAX_HP, heromod.__doc__)
print("heromod" in sys.modules, sys.modules["heromod"] is heromod)
from heromod import heal as h
print(h(1, 2), h is heromod.heal)
print(heromod.__name__, Path(heromod.__file__).name)
print(sorted(n for n in dir(heromod) if not n.startswith("__")))
sys.modules.pop("heromod")
Path("heromod.py").unlink()`,
          output: `heromod is loading; __name__ = heromod
100 100 Hero helpers.
True True
3 True
heromod heromod.py
['MAX_HP', 'heal']`,
          annotations: [
            { lines: '4-11', text: 'This writes a small module file: a docstring, a constant, a function, and a guarded block at the bottom. (`importlib.invalidate_caches()` on the next line just tells Python that a new file has appeared.)' },
            { lines: 13, text: 'The first `import` finds `heromod.py`, **runs it**, and binds the name `heromod`. The `print` inside the file produces the first output line, and `__name__` is `"heromod"`.' },
            { lines: 14, text: 'The second `import heromod` prints nothing: Python finds the module already in its cache and just reuses it. Top-level code runs **once per program**, no matter how many files import it.' },
            { lines: 15, text: 'Use the module’s contents with `module.name`. `__doc__` is the docstring at the top of the file.' },
            { lines: 16, text: 'The cache is the dictionary `sys.modules`, keyed by module name. Every import is a lookup there first.' },
            { lines: '17-18', text: '`from heromod import heal as h` copies a *reference* to one name into the current namespace. It is the same function object, not a copy of the code.' },
            { lines: 19, text: 'A module knows its own `__name__` and the file it came from (`__file__`).' },
            { lines: 20, text: '`dir(module)` lists its attributes: our two names plus automatic double-underscore ones. The `if __name__ == "__main__"` block did **not** run, because the file was imported, not executed directly.' },
          ],
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why modules?',
          text: 'Modules give you three things: **organization** (one file per topic instead of one 5,000-line script), **reuse** (the same file imported by many programs) and **separate namespaces** (two modules may both define a function called `update` without clashing, because they are used as `physics.update` and `ai.update`).',
        },
        {
          type: 'callout',
          variant: 'under',
          title: 'What import actually does',
          text: 'When you write `import heromod`, Python (1) looks in `sys.modules`; if absent, (2) searches the folders in `sys.path` for `heromod.py` (or a package folder), (3) creates an empty module object and registers it in `sys.modules`, (4) executes the file’s code inside that module’s namespace, and (5) binds the name `heromod` in *your* namespace. Compiled bytecode (`.pyc` files in `__pycache__`) is cached on disk so the next run skips parsing.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A module `util.py` begins with `print("loading util")`. Three different files in one program each run `import util`. How many times is `loading util` printed?',
      options: [
        { text: 'Zero — import only defines names', why: 'Importing executes the whole module body, including the `print`.' },
        { text: 'Once', correct: true, why: 'Right: the first import runs the file and caches the module in `sys.modules`; later imports reuse it.' },
        { text: 'Three times, once per importing file', why: 'Python caches modules, so the code does not re-run for each importer.' },
        { text: 'Once per function call that uses it', why: 'Function calls never trigger re-imports.' },
      ],
      explanation: 'A module body runs exactly once per program: on the first import. After that every `import util` finds the cached module object in `sys.modules`. This is why a module can safely hold shared state (configuration, a cache) that all importers see.',
    },
    {
      kind: 'concept',
      title: 'Import forms, the search path and errors',
      blocks: [
        {
          type: 'p',
          text: 'There are four ways to import. **`import x`** binds the module, and you write `x.name`. **`import x as y`** gives it a shorter name (the community convention for `numpy` is `np`). **`from x import a, b`** copies specific names into your namespace. **`from x import *`** copies *every* public name — avoid it, because the reader can no longer tell where a name came from and a new name in `x` can silently replace one of yours.',
        },
        {
          type: 'code',
          title: 'import_forms.py',
          runnable: true,
          code: `import math
import math as m
from math import sqrt, floor
print(m.sqrt(16), math.pi, sqrt(2), floor(2.7))
print(math is m, __name__)
try:
    import not_a_module
except ModuleNotFoundError as e:
    print(type(e).__name__, "|", e, "|", e.name)
try:
    from math import nothing
except ImportError as e:
    print(type(e).__name__, "|", e.name)
import sys
print(len(sys.path) > 0, "math" in sys.modules)`,
          output: `4.0 3.141592653589793 1.4142135623730951 2
True __main__
ModuleNotFoundError | No module named 'not_a_module' | not_a_module
ImportError | math
True True`,
          annotations: [
            { lines: '1-3', text: 'The three common forms. All of them load `math` once; they differ in which names appear in *your* namespace.' },
            { lines: 5, text: '`math` and `m` are two names for the **same** module object. And `__name__` of the program you run directly is `"__main__"` — the special value behind the idiom below.' },
            { lines: '6-9', text: 'A module that cannot be found raises `ModuleNotFoundError` (a subclass of `ImportError`). Its `.name` attribute says which module was missing.' },
            { lines: '10-13', text: 'A module that exists but lacks the requested name raises a plain `ImportError`. Typos, version differences and circular imports all end up here.' },
            { lines: 15, text: '`sys.path` is the list of folders Python searches, and `sys.modules` holds everything already imported.' },
          ],
        },
        {
          type: 'p',
          text: 'The [[sys-path]] list explains most "why can’t Python find my file?" problems. It begins with the folder of the script you ran, then the standard library, then the `site-packages` folder where `pip` installs libraries. If your module is in none of them, the import fails. The fix is almost always to organize your project so the files are where Python looks (the last lesson of this unit shows how), not to edit `sys.path` by hand.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Do not name your file like a library',
          text: 'If you create `random.py` or `json.py` next to your script, `import random` finds *your file first* (the script’s folder comes first in `sys.path`) and the real library becomes unreachable — you get baffling `AttributeError`s such as "module \'random\' has no attribute \'randint\'". Pick distinctive names for your own modules. The error message even mentions your file’s path; read it.',
        },
        {
          type: 'callout',
          variant: 'pythonic',
          title: 'Imports go at the top, in three groups',
          text: 'PEP 8 order: standard-library imports, then third-party libraries, then your own modules, with a blank line between groups and each group alphabetical. Tools like `ruff` and `isort` sort them for you. The one common exception is an import inside a function, used to delay a heavy or optional dependency until it is needed.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: `import math
from math import floor as f
print(f(3.9), math.floor(-3.1), math.ceil(3.1))`,
      answer: '3 -4 4',
      hint: '`floor` rounds toward negative infinity, `ceil` toward positive infinity.',
      explanation: '`f` is just another name for `math.floor`. `floor(3.9)` is 3, `floor(-3.1)` is -4 (the next integer *below*), and `ceil(3.1)` is 4.',
    },
    {
      kind: 'fill',
      prompt: 'Complete the import statements.',
      template: `___ random as rnd
___ collections ___ Counter`,
      templateIsCode: true,
      blanks: [{ answers: ['import'] }, { answers: ['from'] }, { answers: ['import'] }],
      wordBank: ['import', 'from', 'as', 'include'],
      explanation: '`import random as rnd` binds the module under a shorter name; `from collections import Counter` copies one name out of a module. Python has no `include` — that is C and C++ — and importing never pastes text; it runs the module once and binds names.',
    },
    {
      kind: 'concept',
      title: 'Packages and __name__',
      blocks: [
        {
          type: 'p',
          text: 'When a project outgrows a few files, you group modules into a **[[package]]**: a folder containing an `__init__.py` file (it may be empty). The folder name becomes the import name, and subfolders become dotted sub-packages: `forge_pkg.util.text`. Inside a package, modules can import each other with **relative imports** — `from .core import start` means "the module `core` in this same package", and `..` goes one level up.',
        },
        {
          type: 'code',
          title: 'package_demo.py',
          runnable: true,
          code: `import importlib, shutil, sys
from pathlib import Path
pkg = Path("forge_pkg")
(pkg / "util").mkdir(parents=True, exist_ok=True)
(pkg / "__init__.py").write_text('from .core import start\\n__all__ = ["start"]\\nVERSION = "1.0"\\n', encoding="utf-8")
(pkg / "core.py").write_text('from .util.text import shout\\ndef start():\\n    return shout("go")\\n', encoding="utf-8")
(pkg / "util" / "__init__.py").write_text("", encoding="utf-8")
(pkg / "util" / "text.py").write_text('def shout(s):\\n    return s.upper() + "!"\\n', encoding="utf-8")
importlib.invalidate_caches()
import forge_pkg
print(forge_pkg.start(), forge_pkg.VERSION)
from forge_pkg.util import text
print(text.shout("hi"), text.__name__, forge_pkg.__name__)
print(type(forge_pkg).__name__, forge_pkg.core.__package__)
shutil.rmtree(pkg)
for name in [k for k in sys.modules if k.startswith("forge_pkg")]:
    del sys.modules[name]`,
          output: `GO! 1.0
HI! forge_pkg.util.text forge_pkg
module forge_pkg`,
          annotations: [
            { lines: '4-8', text: 'Builds this tree: `forge_pkg/__init__.py`, `core.py`, and a sub-package `util/` with its own `__init__.py` and `text.py`. In a real project these are files you create in your editor.' },
            { lines: 5, text: '`__init__.py` runs when the package is first imported. It re-exports `start` from `core` using a **relative import** (`.core`), so users can write `forge_pkg.start()`. `__all__` lists what `from forge_pkg import *` would export.' },
            { lines: 6, text: '`core.py` imports a sibling sub-package with `from .util.text import shout` — "my own package’s `util.text`".' },
            { lines: 10, text: '`import forge_pkg` runs `__init__.py`, which imports `core`, which imports `util.text`. All three modules are loaded as a side effect.' },
            { lines: 12, text: 'Dotted names reach into sub-packages: `forge_pkg.util.text` is the module `text` inside the sub-package `util`.' },
            { lines: 13, text: 'Each module’s `__name__` is its full dotted path. A package is itself a *module object* (`type` is `module`).' },
          ],
        },
        {
          type: 'p',
          text: 'One more idiom you will see in nearly every script: `if __name__ == "__main__":`. When you **run** a file (`python game.py`), Python sets its `__name__` to `"__main__"`; when another file **imports** it, `__name__` is the module’s name. Wrapping the "start the program" code in that `if` lets the same file work both as a program and as a library whose functions can be imported (and tested) without launching the game.',
        },
        {
          type: 'code',
          title: 'main_guard.txt',
          lang: 'text',
          code: `# game.py
def run():
    print("game running")

if __name__ == "__main__":
    run()

# In a terminal:
#   python game.py        -> prints "game running"
# In another file:
#   import game           -> prints nothing; game.run() is available`,
          annotations: [
            { lines: '5-6', text: 'This block only runs when the file is the program that was started, not when it is imported.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Circular imports',
          text: 'If `a.py` imports `b` and `b.py` imports `a`, whichever loads first sees the other only *half-built* and you get an `ImportError` or a missing attribute. Fixes, in order of preference: move the shared code into a third module that both import; pass the object as an argument instead of importing it; or import inside the function that needs it. A [[circular-import]] is usually a sign that two modules are doing each other’s jobs.',
        },
        {
          type: 'callout',
          variant: 'cpp',
          title: 'Compared with C++',
          text: 'There is no preprocessor and no header/source split. `#include` pastes text and needs include guards; `import` loads a module once and binds names, with no declaration/definition duplication. (C++20 modules work much more like Python’s.) The price: names are looked up at run time, so a typo in an imported name is an error when the line *runs*, not when the program is built.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Every time a file runs `import settings`, Python re-reads `settings.py` from disk and executes it again, so the latest edits are always picked up.',
      answer: false,
      explanation: 'False. After the first import the module object is cached in `sys.modules` and reused. Edits to the file are not seen until the program restarts (or you call `importlib.reload(module)` explicitly, which is mostly for development tools).',
    },
    {
      kind: 'error',
      prompt: 'This code should print `4.0` and then pi, but the last line raises a `NameError`. Tap the line with the bug.',
      lines: [
        'from math import sqrt',
        'print(sqrt(16))',
        'print(math.pi)',
      ],
      linesAreCode: true,
      errorLines: [3],
      explanation: '`from math import sqrt` binds only the name `sqrt`; the name `math` itself was never created. Either add `import math`, or import the constant too: `from math import sqrt, pi`.',
    },
    {
      kind: 'concept',
      title: 'Loading modules dynamically',
      blocks: [
        {
          type: 'p',
          text: 'Sometimes the module to load is not known when you write the code: a mod folder full of plugins, an optional library, a level script chosen at run time. The `importlib` module imports by *name string* or by *file path*. Game engines and tools use exactly this for mod loading and plugin systems.',
        },
        {
          type: 'code',
          title: 'dynamic_import.py',
          runnable: true,
          code: `import importlib, importlib.util, sys
from pathlib import Path

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def import_or_default(name, default=None):
    try:
        return importlib.import_module(name)
    except ModuleNotFoundError:
        return default

Path("plug_a.py").write_text("VALUE = 42\\ndef hi():\\n    return 'hi'\\n", encoding="utf-8")
mod = load_module("plug_a", "plug_a.py")
print(mod.VALUE, mod.hi(), mod.__name__, "plug_a" in sys.modules)
Path("plug_a.py").unlink()
print(import_or_default("math").sqrt(9), import_or_default("no_such_mod_xyz", "n/a"), import_or_default("collections.abc").__name__)`,
          output: `42 hi plug_a False
3.0 n/a collections.abc`,
          annotations: [
            { lines: '4-8', text: 'The three-step recipe for loading a module **from a file path**: build a *spec* describing where the file is, create an empty module from it, then execute the file’s code inside that module. The file does not need to be on `sys.path`.' },
            { lines: '10-14', text: '`importlib.import_module("name")` is `import name` for a name held in a string; dotted names work too. Wrapping it in `try`/`except ModuleNotFoundError` gives the **optional dependency** pattern: use the faster or fancier library if present, fall back otherwise.' },
            { lines: 18, text: 'The module’s functions and constants work like any other. Because we used `module_from_spec` directly, it was **not** added to `sys.modules` (the cache check prints `False`), which is exactly what you want when loading throwaway or reloadable plugins.' },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Importing runs code',
          text: 'Loading a module executes everything in its file. Never import (or `exec`) a file from an untrusted source — a downloaded mod can do anything the player’s account can do. Mod systems that must be safe use a sandbox, a data-only format such as JSON, or a restricted scripting language instead.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Game and tool use',
          text: 'A common design: a `plugins/` folder where every `*.py` file defines a `register()` function. At startup, the program scans the folder with `pathlib`, loads each file with `load_module`, and calls `register()`. Adding a feature means dropping in a file; no core code changes.',
        },
      ],
    },
    {
      kind: 'numeric',
      prompt: 'A module `util.py` contains `print("loading")` at its top level. A program runs `import util`, then `import util as u`, then `from util import *`, then `import util` again. How many times is `loading` printed?',
      answer: '1',
      hint: 'Think about `sys.modules`.',
      explanation: 'The first statement runs the module and caches it; the other three find it in `sys.modules`. Four import statements, but the module body executes once: `1`.',
      label: 'Prints:',
    },
    {
      kind: 'code',
      prompt: 'Write `load_module(name, path)` that loads the Python file at `path` as a module called `name` and returns the module object — **without** adding it to `sys.modules`. Use `importlib.util`.',
      starter: `import importlib.util

# define load_module here
`,
      solution: `import importlib.util

def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
`,
      tests: `import os, sys
with open("plug_test_a.py", "w", encoding="utf-8") as f:
    f.write("VALUE = 42\\ndef double(x):\\n    return x * 2\\n")
mod = load_module("plug_test_a", "plug_test_a.py")
assert mod.VALUE == 42
assert mod.double(4) == 8
assert mod.__name__ == "plug_test_a"
assert "plug_test_a" not in sys.modules
with open("plug_test_a.py", "w", encoding="utf-8") as f:
    f.write("VALUE = 7\\n")
assert load_module("plug_test_a", "plug_test_a.py").VALUE == 7
os.remove("plug_test_a.py")`,
      checks: ['Returns a working module object with the file’s names', 'The module’s `__name__` equals `name`', 'Does not register the module in `sys.modules`, so reloading gives fresh code'],
      hint: 'Three calls: `spec_from_file_location(name, path)`, then `module_from_spec(spec)`, then `spec.loader.exec_module(module)`. Return the module.',
      explanation: 'A *spec* describes how to load a module; `module_from_spec` makes the empty module object and `exec_module` runs the file’s code inside it. Skipping `sys.modules` means calling the function again reads the file afresh — useful for hot-reloading mods while a game runs.',
    },
    {
      kind: 'code',
      prompt: 'Write `import_or_default(name, default=None)` that imports the module called `name` (a string, possibly dotted like `"os.path"`) and returns it, or returns `default` if no such module exists.',
      starter: `import importlib

# define import_or_default here
`,
      solution: `import importlib

def import_or_default(name, default=None):
    try:
        return importlib.import_module(name)
    except ModuleNotFoundError:
        return default
`,
      tests: `import math
assert import_or_default("math") is math
assert import_or_default("no_such_module_xyz") is None
assert import_or_default("no_such_module_xyz", "fallback") == "fallback"
assert import_or_default("collections.abc").__name__ == "collections.abc"
assert import_or_default("json").dumps([1]) == "[1]"
assert import_or_default("json.not_there", 0) == 0`,
      checks: ['Returns the module object when it exists', 'Returns `default` when it does not', 'Works with dotted names'],
      hint: 'Use `importlib.import_module(name)` in a `try` block, and catch `ModuleNotFoundError`.',
      explanation: '`import_module` imports by string and raises `ModuleNotFoundError` for a missing module — even a missing sub-module of a real package, as in `json.not_there`. Catching that specific exception (not all `ImportError`s) means a module that exists but is *broken* still reports its real error.',
    },
    {
      kind: 'code',
      prompt: 'Write `public_names(module)` that returns the sorted list of names a module "exports". If the module defines `__all__`, return `sorted(__all__)`. Otherwise return the sorted names that do **not** start with an underscore.',
      starter: `# define public_names here
`,
      solution: `def public_names(module):
    exported = getattr(module, "__all__", None)
    if exported is not None:
        return sorted(exported)
    return sorted(name for name in vars(module) if not name.startswith("_"))
`,
      tests: `import types
m = types.ModuleType("m")
m.run = lambda: 1
m.CONST = 5
m._hidden = 2
assert public_names(m) == ["CONST", "run"], public_names(m)
m.__all__ = ["run"]
assert public_names(m) == ["run"]
empty = types.ModuleType("empty")
assert public_names(empty) == []
import math
assert "sqrt" in public_names(math) and "_" not in "".join(n[0] for n in public_names(math))`,
      checks: ['Honors `__all__` when it exists', 'Otherwise excludes names starting with an underscore', 'Result is sorted'],
      hint: '`getattr(module, "__all__", None)` returns `None` if the module has no `__all__`. `vars(module)` is its dictionary of names.',
      explanation: '`__all__` is the module author’s official list of public names; when present it wins. Without it, the convention is that a leading underscore means "private". `getattr` with a default avoids an `AttributeError` for modules without `__all__`, and `vars(module)` exposes the namespace dictionary.',
    },
  ],
  takeaways: [
    'A module is a `.py` file. The first `import` runs it once and caches the module object in `sys.modules`; later imports reuse it. `importlib.reload` re-runs it on request.',
    'Forms: `import x`, `import x as y`, `from x import a, b`; avoid `from x import *`. Missing modules raise `ModuleNotFoundError`, missing names raise `ImportError`.',
    'Python searches `sys.path` in order — script folder, standard library, site-packages. Never name your own file after a library (`random.py`, `json.py`), because it will shadow the real one.',
    'A package is a folder with `__init__.py`; use relative imports (`from .core import x`) inside it. `if __name__ == "__main__":` runs code only when the file is started directly, not when it is imported.',
    '`importlib.import_module` and `spec_from_file_location` load modules by name or path — the basis of plugins and mods, but loading runs code, so never load untrusted files. Break circular imports by restructuring.',
  ],
  reading: [
    { title: 'Modules (The Python Tutorial)', url: 'https://docs.python.org/3/tutorial/modules.html', source: 'tutorial', note: 'The official walk-through of modules, packages, `__name__`, `sys.path` and `dir()`.' },
    { title: 'The import system (Language Reference)', url: 'https://docs.python.org/3/reference/import.html', source: 'docs', note: 'The precise algorithm: finders, loaders, `sys.modules` and namespace packages.' },
    { title: 'importlib — The implementation of import', url: 'https://docs.python.org/3/library/importlib.html', source: 'docs', note: 'Dynamic imports, reloading and loading from a file path.' },
    { title: 'Python Modules and Packages: An Introduction', url: 'https://realpython.com/python-modules-packages/', source: 'article', note: 'A clear Real Python tutorial with many examples.' },
  ],
};
