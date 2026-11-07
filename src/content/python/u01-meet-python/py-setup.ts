import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-setup',
  title: 'Setting Up: Python, the REPL and VS Code',
  summary: 'Install Python on Windows the modern way, use the interactive REPL, write and run scripts, set up VS Code, and fix the setup problems everyone hits.',
  minutes: 17,
  objectives: [
    'Install Python on Windows with the Python install manager and check which versions you have',
    'Use the interactive REPL to experiment, and explain how it differs from running a script',
    'Create a `.py` file and run it from a terminal',
    'Set up VS Code with the Python extension and choose the right interpreter',
    'Create a virtual environment, install a package with pip, and diagnose common setup errors',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'Two places to run Python',
      blocks: [
        {
          type: 'p',
          text: 'You already have one Python: the one inside this app. Every **Run** button, the **Code** tab and every write-the-code question use it — no setup required. It’s perfect for learning, but eventually you’ll want Python on your PC too: to work with real files, install packages like PyTorch, use your GPU and build your own projects.',
        },
        {
          type: 'code',
          title: 'where_am_i.py',
          runnable: true,
          outputVaries: true,
          code: 'import sys, platform\n\nprint("Python", platform.python_version())\nprint("Platform:", sys.platform)',
          output: 'Python 3.14.2\nPlatform: emscripten',
          annotations: [
            { lines: 3, text: '`platform.python_version()` returns the interpreter’s version as text.' },
            { lines: 4, text: 'In this app you’ll see `emscripten` — the WebAssembly toolchain Pyodide is built with. On your PC it says `win32` (even on 64-bit Windows), `linux` or `darwin` (macOS).' },
          ],
        },
        {
          type: 'heading',
          text: 'Installing on Windows',
        },
        {
          type: 'p',
          text: 'The modern way to install Python on Windows is the **Python install manager** (PEP 773), available from [python.org/downloads](https://www.python.org/downloads/) and the Microsoft Store. It installs and manages any number of Python versions through one command, `py`:',
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell',
          code: 'py install 3.14        # download and install Python 3.14\npy list                # show installed versions (default marked)\npython --version       # which version does "python" run?\npy -3.14 game.py       # run a script with a specific version',
          annotations: [
            { lines: 1, text: 'Pick the latest release for this course. For the AI course, check pytorch.org first — PyTorch supports new Python versions a few months after they come out.' },
            { lines: 3, text: '`python` and `python3` keep working and run the default version.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Using the classic installer?',
          text: 'The traditional `python-3.x.y-amd64.exe` installer still exists for now (it is slated for deprecation around 2027). If you use it, **tick "Add python.exe to PATH"** on the first screen — forgetting that box is the #1 cause of "`python` is not recognized" errors. On macOS, use the python.org installer or Homebrew; on Linux, your distribution’s package manager or `uv` (more on that soon).',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'After installing, how do you check which Python version the `python` command runs?',
      options: [
        { text: '`python --version`', correct: true, why: 'Right. It prints something like `Python 3.14.2`. (`py list` shows every installed version.)' },
        { text: '`pip --version python`', why: 'That’s not valid. `pip --version` shows pip’s version and which Python it belongs to, but this command mixes things up.' },
        { text: 'Open `python.exe` in Notepad', why: '`python.exe` is a compiled program; opening it in a text editor shows gibberish.' },
        { text: '`print(version)` in PowerShell', why: '`print` is Python, not PowerShell, and `version` isn’t defined anywhere.' },
      ],
      explanation: '`python --version` (or `python -V`) prints the version of the interpreter the `python` command starts. With the install manager, `py list` shows every installed version and which one is the default.',
    },
    {
      kind: 'concept',
      title: 'The REPL: Python’s interactive prompt',
      blocks: [
        {
          type: 'p',
          text: 'Type `python` (or `py`) on its own in a terminal and you get the **[[repl|REPL]]** — Read, Evaluate, Print, Loop. You type a line at the `>>>` prompt, Python runs it and shows the result immediately. It’s a calculator, a scratchpad and a documentation browser in one.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> 7 * 6\n42\n>>> _ + 8\n50\n>>> name = "Ada"\n>>> name.upper()\n\'ADA\'\n>>> for i in range(3):\n...     print(i * i)\n...\n0\n1\n4\n>>> help(len)\nHelp on built-in function len in module builtins:\n...\n>>> exit',
          annotations: [
            { lines: 1, text: 'Type an [[expression]] and the REPL prints its value — no `print` needed.' },
            { lines: 3, text: '`_` holds the last result shown. Handy when using the REPL as a calculator.' },
            { lines: 5, text: 'An assignment is a [[statement]], not an expression, so nothing is printed.' },
            { lines: 7, text: 'Strings are shown with quotes in the REPL: it displays the value’s *representation*, the way you’d type it in code.' },
            { lines: '8-10', text: 'A block: after a line ending in `:` the prompt changes to `...`. Press Enter on an empty line to finish it.' },
            { lines: 14, text: '`help(anything)` shows documentation right in the terminal. Press `q` to leave the help pager.' },
            { lines: 17, text: 'Leave the REPL with `exit` (or Ctrl+Z then Enter on Windows, Ctrl+D on macOS/Linux).' },
          ],
        },
        {
          type: 'p',
          text: 'Since Python 3.13 the REPL is much friendlier: colored prompts and tracebacks, real multi-line editing (press ↑ to bring back a whole `for` loop and fix it), **F1** for help, **F2** for history and **F3** for pasting blocks of code.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Get in the habit of keeping a REPL open while you code. Unsure what `"abc" * 3` does, or whether `round(2.5)` gives 2 or 3? Ask the REPL — it takes two seconds and you’ll never forget the answer. (In this app, the **Code** tab plays the same role.)',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'If a script file contains the line `2 + 3` on its own, running the script prints `5`, just like the REPL does.',
      answer: false,
      explanation: 'False. Only the REPL automatically shows the value of an expression. In a script, `2 + 3` is computed and then thrown away — nothing appears. To see a value from a script, `print` it: `print(2 + 3)`.',
    },
    {
      kind: 'predict',
      prompt: 'This file is run as a script with `python demo.py`. What appears in the terminal?',
      code: 'x = 2 + 3\nx * 2\nprint(x)',
      answer: '5',
      hint: 'Which lines would the REPL echo — and which ones does a *script* show?',
      explanation: 'Line 1 stores `5` in `x`. Line 2 computes `10`, but in a script a bare expression’s value is simply discarded (and `x` is not changed). Only `print(x)` produces output, so the terminal shows `5`. In the REPL, line 2 would have shown `10`.',
    },
    {
      kind: 'concept',
      title: 'Writing and running a script',
      blocks: [
        {
          type: 'p',
          text: 'The REPL forgets everything when you close it. Real programs live in **[[script|scripts]]**: plain-text files ending in `.py`. Create a folder for your projects, save a file in it, and run it from a terminal:',
        },
        {
          type: 'code',
          title: 'hello.py',
          code: '# My first script\nname = "Python Forge"\nprint("Hello from", name)\nprint("2 to the 10th is", 2 ** 10)',
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell',
          code: 'cd C:\\Users\\Adam\\code\\python-practice    # go to your project folder\nls                                       # list files (dir also works)\npython hello.py                          # run the script\nHello from Python Forge\n2 to the 10th is 1024',
          annotations: [
            { lines: 1, text: '`cd` (change directory) moves the terminal into your folder. Use your own path.' },
            { lines: 3, text: '`python file.py` compiles and runs the whole file from top to bottom, then exits.' },
            { lines: '4-5', text: 'The program’s output appears in the terminal.' },
          ],
        },
        {
          type: 'callout',
          variant: 'cpp',
          text: 'No project files, no build step, no `main()`: Python starts at the top of the file and runs each line in order. Code in a script that isn’t inside a function or class runs as soon as the file runs. (You’ll meet the `if __name__ == "__main__":` idiom when you start writing reusable modules.)',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why does a script need print but the REPL doesn’t?',
          text: 'The REPL’s whole job is to show you values while you explore, so it echoes every expression. A script is a program meant to run unattended — imagine a data-processing script that printed every intermediate calculation! So scripts stay silent unless you explicitly `print`. *Explicit is better than implicit.*',
        },
      ],
    },
    {
      kind: 'order',
      prompt: 'Put the steps for creating and running your first script in order.',
      lines: [
        'Create a folder for your project',
        'Save a file named `hello.py` containing `print("hi")`',
        'Open a terminal and `cd` into the folder',
        'Run `python hello.py`',
        'Read the output, `hi`, in the terminal',
      ],
      distractors: ['Compile `hello.py` into `hello.exe` with `python -c hello.py`'],
      explanation: 'Folder → file → `cd` into the folder → `python hello.py` → output. There is no separate compile step; the distractor describes something Python doesn’t need (and `python -c` actually runs a string of code given on the command line).',
    },
    {
      kind: 'concept',
      title: 'A real editor: VS Code',
      blocks: [
        {
          type: 'p',
          text: 'You can write Python in Notepad, but a good [[ide|editor]] catches typos as you type, runs your code with one keystroke and lets you step through it in a debugger. **Visual Studio Code** (free) is the most popular choice; **PyCharm** is an excellent alternative built only for Python.',
        },
        {
          type: 'steps',
          items: [
            { title: 'Install VS Code', text: 'From code.visualstudio.com. It’s a different program from Visual Studio, which you may use for C++.' },
            { title: 'Add the Python extension', text: 'In the Extensions panel (Ctrl+Shift+X), install **Python** by Microsoft. It brings Pylance (smart completion and type checking) and the Python debugger.' },
            { title: 'Open your project folder', text: 'File → Open Folder… VS Code works best when it knows your project’s root folder.' },
            { title: 'Choose the interpreter', text: 'Ctrl+Shift+P → **Python: Select Interpreter** → pick your Python (or your project’s `.venv`, once you make one). The choice shows in the bottom-right corner.' },
            { title: 'Run and debug', text: 'Open a `.py` file and press the ▶ button (top right) to run it in the built-in terminal. Press F5 to debug: click left of a line number to set a breakpoint and inspect variables as the program pauses.' },
            { title: 'Format automatically', text: 'Install the **Ruff** extension and enable *Format on Save*: your code will follow [[pep-8|PEP 8]] style without you thinking about it.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Learning tip: switch off AI autocomplete',
          text: 'Tools like GitHub Copilot are great once you know the language, but while learning they type the answer before you’ve had to think of it. Many learners turn AI suggestions off for their practice folder and back on for real projects.',
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'For data science and the AI course you’ll also use **Jupyter notebooks** — documents that mix runnable code cells, output, charts and notes. VS Code opens `.ipynb` notebooks directly once the Jupyter extension is installed.',
        },
      ],
    },
    {
      kind: 'code',
      prompt: 'This script computes how much XP a player needs for the next level, but when you run it as a script, nothing appears. Fix it so it prints the value:\n\n```\n4900\n```',
      starter: '# In the REPL, typing an expression shows its value.\n# In a script, nothing appears unless you print it.\nlevel = 7\nxp_needed = level ** 2 * 100\nxp_needed\n',
      solution: '# In the REPL, typing an expression shows its value.\n# In a script, nothing appears unless you print it.\nlevel = 7\nxp_needed = level ** 2 * 100\nprint(xp_needed)\n',
      tests: 'assert xp_needed == 4900, "Keep the calculation the same — xp_needed should be 4900."',
      expectOutput: '4900',
      checks: ['Prints the value of `xp_needed`', 'Output is exactly `4900`'],
      hint: 'Wrap the last line in `print(...)`.',
      explanation: '`level ** 2 * 100` is $7^2 \\times 100 = 4900$. A bare expression on the last line would be echoed in the REPL, but a script throws it away — `print(xp_needed)` makes the value appear. Press **Try it** on the starter to see that it really prints nothing.',
    },
    {
      kind: 'concept',
      title: 'Packages and virtual environments: a first look',
      blocks: [
        {
          type: 'p',
          text: 'Python’s [[standard-library|standard library]] is large, but most projects also use third-party [[package|packages]] from [[pypi|PyPI]], the Python Package Index. The standard installer is [[pip]]. To keep each project’s packages separate, you install them into a **[[virtual-environment|virtual environment]]** — a folder (usually `.venv`) with its own copy of the interpreter’s package space.',
        },
        {
          type: 'code',
          lang: 'shell',
          title: 'PowerShell — inside your project folder',
          code: 'python -m venv .venv               # create the environment (once per project)\n.venv\\Scripts\\Activate.ps1          # activate it (macOS/Linux: source .venv/bin/activate)\npython -m pip install requests      # install a package into THIS environment\npython -m pip list                  # see what is installed\ndeactivate                          # leave the environment',
          annotations: [
            { lines: 1, text: '`-m venv` runs the standard-library `venv` module, which creates the `.venv` folder.' },
            { lines: 2, text: 'Activating changes which `python` and `pip` your terminal uses. Your prompt shows `(.venv)` while it’s active.' },
            { lines: 3, text: '`python -m pip` guarantees pip installs into the same Python that `python` runs — the safest habit.' },
          ],
        },
        {
          type: 'p',
          text: 'Many developers now use **uv**, a very fast tool from Astral that does the same jobs in one command: `uv venv` creates an environment, `uv pip install requests` installs into it, and `uv run game.py` runs a script with the right environment automatically. It can even download Python itself. You’ll go deeper into both in the Modules, Packages and Tools unit.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why not just install everything globally?',
          text: 'Project A needs version 1.x of a library, project B needs 2.x — globally you can only have one. Worse, upgrading something for one project silently breaks another. A virtual environment gives each project its own isolated set of packages, and you can delete and recreate it any time. The AI course depends on this: PyTorch, Gymnasium and RLGym versions must match each other.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Complete the PowerShell commands for starting a new project with its own environment, then list the installed Python versions.',
      template: 'python -m ___ .venv\n.venv\\Scripts\\Activate.ps1\npython -m ___ install numpy\npy ___',
      templateIsCode: true,
      lang: 'shell',
      blanks: [{ answers: ['venv'] }, { answers: ['pip'] }, { answers: ['list'] }],
      wordBank: ['venv', 'pip', 'list', 'install', 'run', 'pypi'],
      explanation: '`python -m venv .venv` creates a virtual environment in `.venv`; after activating it, `python -m pip install numpy` installs NumPy into that environment; `py list` shows the versions managed by the Python install manager.',
    },
    {
      kind: 'concept',
      title: 'When setup goes wrong',
      blocks: [
        {
          type: 'p',
          text: 'Everyone hits these. Recognizing them saves hours:',
        },
        {
          type: 'table',
          headers: ['Symptom', 'Likely cause', 'Fix'],
          rows: [
            ['`python : The term \'python\' is not recognized…`', 'Python isn’t on your PATH', 'Use `py`, reinstall with the install manager, or tick "Add python.exe to PATH" in the classic installer'],
            ['Typing `python` opens the Microsoft Store', 'Windows’ placeholder "app execution alias"', 'Install Python, or turn the alias off in Settings → Apps → Advanced app settings → App execution aliases'],
            ['`ModuleNotFoundError` right after `pip install`', 'pip installed into a different Python than the one running your code', 'Always use `python -m pip …`; check the interpreter shown in VS Code’s status bar'],
            ['`Activate.ps1 cannot be loaded because running scripts is disabled`', 'PowerShell’s execution policy', 'Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once'],
            ['VS Code underlines imports that do work in the terminal', 'VS Code is using another interpreter', 'Python: Select Interpreter → choose the project’s `.venv`'],
          ],
          caption: 'Most setup problems are really "which Python is this?" problems.',
        },
        {
          type: 'code',
          lang: 'pycon',
          code: '>>> import sys\n>>> sys.executable\n\'C:\\\\Users\\\\Adam\\\\code\\\\game-tools\\\\.venv\\\\Scripts\\\\python.exe\'',
          annotations: [
            { lines: 2, text: 'The ultimate "which Python is this?" check: `sys.executable` is the full path of the interpreter running right now. If it isn’t the one you expect, that’s your bug.' },
          ],
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You run `pip install pygame` and it succeeds, but `import pygame` in your script fails with `ModuleNotFoundError`. What’s the most likely cause?',
      options: [
        { text: 'pygame is broken and must be reinstalled from source', why: 'Possible in theory, but this symptom almost always has a simpler cause.' },
        { text: 'The `pip` command belongs to a different Python installation than the one running your script', correct: true, why: 'Right. With several Pythons (or a venv that isn’t active), `pip` and `python` can point at different installations.' },
        { text: 'Packages only work in the REPL, not in scripts', why: 'Installed packages work everywhere that interpreter runs.' },
        { text: 'You need to restart your computer after every pip install', why: 'No restart is needed — the package is available as soon as pip finishes.' },
      ],
      explanation: 'This is the classic mismatch: `pip` installed into Python A, while your script runs on Python B (or outside your virtual environment). Use `python -m pip install pygame` so the installer and the interpreter are guaranteed to be the same, and check `sys.executable` if in doubt.',
    },
    {
      kind: 'error',
      prompt: 'A teammate wrote down these steps for setting up a new project in PowerShell. Which step is wrong?',
      lines: ['cd C:\\code\\level-editor', 'python -m venv .venv', '.venv\\Scripts\\Activate.ps1', 'pip install --global numpy', 'python editor.py'],
      linesAreCode: true,
      lang: 'shell',
      errorLines: [4],
      explanation: 'Line 4 is the problem: pip has no `--global` option, and the whole point of the activated `.venv` is to install packages *into the project*, not globally. It should be `python -m pip install numpy`. The other lines — `cd` into the folder, create the venv, activate it, run the script — are exactly right.',
    },
  ],
  takeaways: [
    'This app has Python built in; on your PC, install it on Windows with the Python install manager (`py install`, `py list`) from python.org or the Microsoft Store.',
    'The REPL (`python` with no file) runs one line at a time and echoes expression values; scripts run a whole `.py` file top to bottom and only show what you `print`.',
    'Run a script with `python file.py` from a terminal opened in its folder.',
    'VS Code + the Python extension (with Ruff for formatting) is a great setup; choose the interpreter with **Python: Select Interpreter**.',
    'Give each project a virtual environment (`python -m venv .venv`) and install packages with `python -m pip install …` — or use `uv`.',
    'Most setup errors are "which Python is this?" problems; `sys.executable` tells you.',
  ],
  reading: [
    { title: 'Using Python on Windows', url: 'https://docs.python.org/3/using/windows.html', source: 'docs', note: 'The official guide to the Python install manager, the `py` command and PATH.' },
    { title: 'The Python Tutorial: Using the Python Interpreter', url: 'https://docs.python.org/3/tutorial/interpreter.html', source: 'tutorial', note: 'How to start the interpreter, interactive mode and running scripts.' },
    { title: 'Python in Visual Studio Code', url: 'https://code.visualstudio.com/docs/python/python-tutorial', source: 'tutorial', note: 'Microsoft’s step-by-step VS Code setup, including interpreters and debugging.' },
    { title: 'Install packages in a virtual environment using pip and venv', url: 'https://packaging.python.org/en/latest/guides/installing-using-pip-and-virtual-environments/', source: 'docs', note: 'The Python Packaging Authority’s guide to venv and pip on every OS.' },
    { title: 'uv documentation', url: 'https://docs.astral.sh/uv/', source: 'docs', note: 'The fast all-in-one tool for Python versions, environments and packages.' },
  ],
};
