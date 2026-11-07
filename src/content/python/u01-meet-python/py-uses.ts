import type { Lesson } from '../../types';

export const lesson: Lesson = {
  id: 'py-uses',
  title: 'What Python Is Good For (and What It Isn’t)',
  summary: 'Web back-ends, data science, AI, automation, game tools and pipelines — where Python shines, where C++ or JavaScript is the better tool, and how the two-language pattern combines them.',
  minutes: 15,
  objectives: [
    'Name the major domains where Python is used and the key library in each',
    'Describe how Python is used in game development: tools, pipelines, prototyping and AI training',
    'Identify tasks where another language is a better fit, and explain why',
    'Explain the "two-language pattern": Python for control and glue, C/C++/CUDA for heavy lifting',
  ],
  steps: [
    {
      kind: 'concept',
      title: 'One language, many jobs',
      blocks: [
        {
          type: 'p',
          text: 'Most languages are famous for one thing: JavaScript for web pages, C++ for engines and systems, Swift for iPhone apps. Python is unusual — it’s a serious choice in a dozen different fields, often as the *main* language. Here is a map of where you’ll find it:',
        },
        {
          type: 'table',
          headers: ['Field', 'What Python does there', 'Key libraries and tools'],
          rows: [
            ['Web back-ends', 'Servers, REST APIs, admin sites (Instagram runs on Django)', '`Django`, `Flask`, `FastAPI`'],
            ['Data science', 'Load, clean, analyze and chart data', '`pandas`, `NumPy`, `matplotlib`, Jupyter notebooks'],
            ['AI and machine learning', 'Train and run models — nearly all AI research code is Python', '`PyTorch`, `scikit-learn`, `JAX`, Hugging Face'],
            ['Automation and scripting', 'Rename files, fill spreadsheets, scrape websites, glue tools together', '`pathlib`, `requests`, `openpyxl`, Playwright'],
            ['DevOps and cloud', 'Deploy servers, manage infrastructure', 'Ansible, the AWS SDK (`boto3`), many CLIs'],
            ['Science and engineering', 'Simulations, astronomy, biology, signal processing', '`SciPy`, `Astropy`, `Biopython`'],
            ['Games and graphics', 'Tool and pipeline scripting, prototypes, game-AI training', 'Blender, Maya, Houdini, Unreal’s editor, `pygame`'],
            ['Testing and QA', 'Automated tests — even for code written in other languages', '`pytest`, Playwright, Robot Framework'],
            ['Hardware and education', 'Microcontrollers, Raspberry Pi, first programming courses', 'MicroPython, CircuitPython'],
          ],
          caption: 'Python rarely wins on raw speed. It wins on how quickly you can build something that works and that others can read.',
        },
        {
          type: 'callout',
          variant: 'why',
          title: 'Why is one language good at so many things?',
          text: 'Python is good at the part every field shares: **expressing an idea quickly and clearly**. The field-specific muscle — numerical kernels, database engines, GPU code — usually lives in libraries written in C, C++ or CUDA. Python’s job is to make that muscle easy to use. A data scientist, a web developer and a technical artist all need a readable language that can call fast libraries; it’s the same need wearing different clothes.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'A teammate wants to build a small web API in Python that returns high scores as JSON. Which library is designed for that?',
      options: [
        { text: '`FastAPI`', correct: true, why: 'Right — FastAPI (like Flask and Django) is a web framework for building servers and APIs.' },
        { text: '`pandas`', why: 'pandas is for analyzing tables of data, not serving web requests.' },
        { text: '`PyTorch`', why: 'PyTorch is a deep-learning library for training neural networks.' },
        { text: '`pygame`', why: 'pygame is for making 2D games with windows, sprites and sound.' },
      ],
      explanation: '`FastAPI`, `Flask` and `Django` are Python’s main web frameworks. pandas analyzes data, PyTorch trains neural networks and pygame makes 2D games — knowing which tool fits which job is half of being productive in Python.',
    },
    {
      kind: 'concept',
      title: 'Python in game development',
      blocks: [
        {
          type: 'p',
          text: 'Shipping AAA games run on engines written in C++, and that won’t change soon: a renderer or physics engine must squeeze every microsecond out of the hardware. But walk around a big studio and you’ll find Python everywhere *around* the engine:',
        },
        {
          type: 'list',
          items: [
            '**Content pipelines.** Blender, Maya, Houdini and MotionBuilder are scripted in Python. Technical artists write tools that batch-export models, fix naming, generate LODs and validate assets.',
            '**Editor automation.** Unreal Engine includes a Python plugin for automating the editor — importing assets, building levels, running checks. Godot’s build system, SCons, is written in Python.',
            '**Build and deployment.** Build farms, test runners, crash-report analysis and patch tools are commonly Python scripts.',
            '**Game AI and machine learning.** Training bots — for example with Unity ML-Agents or RLGym for Rocket League — happens in Python with PyTorch, even when the game itself is C++ or C#. That’s the second course in this app.',
            '**Servers and live services.** EVE Online’s servers run on Stackless Python; many studios write matchmaking, analytics and admin tools in Python.',
            '**Prototypes and indie games.** `pygame`, `arcade`, `pyglet`, `Ursina` and `Panda3D` let you build playable 2D and 3D prototypes fast.',
          ],
        },
        {
          type: 'code',
          title: 'clean_asset_names.py',
          runnable: true,
          code: 'assets = ["Tree_01.PNG", "rock 02.png", "Hero-Idle.Png"]\n\nfor name in assets:\n    clean = name.lower().replace(" ", "_").replace("-", "_")\n    print(f"{name:15} -> {clean}")',
          output: 'Tree_01.PNG     -> tree_01.png\nrock 02.png     -> rock_02.png\nHero-Idle.Png   -> hero_idle.png',
          annotations: [
            { lines: 1, text: 'A list of messy file names, as an artist might export them.' },
            { lines: 3, text: 'A `for` loop runs the indented lines once for each name.' },
            { lines: 4, text: 'String methods chained together: lowercase, then spaces → underscores, then hyphens → underscores.' },
            { lines: 5, text: 'An f-string. `{name:15}` pads the name to 15 characters so the arrows line up.' },
          ],
        },
        {
          type: 'p',
          text: 'That five-line script is a real pipeline tool in miniature: in a studio it would loop over thousands of files on disk instead of a list. You’ll understand every piece of it by the end of the Collections unit.',
        },
        {
          type: 'callout',
          variant: 'code',
          title: 'Why studios hire Python-literate engine programmers',
          text: 'Engine and gameplay programmers at studios like DICE or IO Interactive write C++ for the runtime, but they constantly read and write Python for tools, build scripts and automated tests. Being fluent in both is a real advantage — and machine-learning roles in games are almost entirely Python.',
        },
      ],
    },
    {
      kind: 'truefalse',
      prompt: 'Even though Unreal Engine itself is written in C++, its editor can be automated with Python scripts.',
      answer: true,
      explanation: 'True. Unreal ships a Python editor-scripting plugin used for asset import, level building and validation. This is the typical split: C++ for the engine and runtime, Python for tooling around it.',
    },
    {
      kind: 'concept',
      title: 'Data science and AI: Python’s killer app',
      blocks: [
        {
          type: 'p',
          text: 'Python’s biggest growth in the last decade came from data and AI. A typical workflow happens in a **Jupyter notebook** — a document that mixes code cells, their output, charts and notes — using a stack of libraries that build on each other:',
        },
        {
          type: 'steps',
          items: [
            { title: 'NumPy', text: 'Fast multi-dimensional arrays, the foundation of everything else.' },
            { title: 'pandas', text: 'Tables of data (DataFrames) — think spreadsheets you program.' },
            { title: 'matplotlib / seaborn', text: 'Charts and plots.' },
            { title: 'scikit-learn', text: 'Classic machine learning: regression, classification, clustering.' },
            { title: 'PyTorch (and JAX, TensorFlow)', text: 'Deep learning: neural networks trained on GPUs. Most modern AI — language models, image generators, game-playing agents — is built with these.' },
          ],
        },
        {
          type: 'p',
          text: 'Even without any of those, the [[standard-library|standard library]] can crunch numbers. Here’s a quick look at some match scores:',
        },
        {
          type: 'code',
          title: 'match_stats.py',
          runnable: true,
          code: 'import statistics\n\nscores = [12, 45, 33, 51, 28, 45, 39]\nprint("matches:", len(scores))\nprint("mean:", round(statistics.mean(scores), 1))\nprint("median:", statistics.median(scores))\nprint("most common:", statistics.mode(scores))',
          output: 'matches: 7\nmean: 36.1\nmedian: 39\nmost common: 45',
          annotations: [
            { lines: 1, text: '`import` loads a [[module]]. `statistics` ships with Python — nothing to install.' },
            { lines: 5, text: 'The mean is $253 / 7 \\approx 36.142857$; `round(…, 1)` keeps one decimal place.' },
            { lines: 6, text: 'The median is the middle value once sorted: 12, 28, 33, **39**, 45, 45, 51.' },
          ],
        },
        {
          type: 'callout',
          variant: 'note',
          text: 'In 2019 the first image of a black hole, from the Event Horizon Telescope, was produced with a software stack built on Python, NumPy and matplotlib. From astronomy to esports analytics, it’s the same tools.',
        },
      ],
    },
    {
      kind: 'predict',
      prompt: 'Predict the output.',
      code: 'scores = [12, 45, 33]\nprint(max(scores) - min(scores))\nprint(len(scores))',
      answer: '33\n3',
      hint: '`max` and `min` find the largest and smallest values; `len` counts the items.',
      explanation: '`max(scores)` is `45` and `min(scores)` is `12`, so the first line prints `45 - 12 = 33`. `len(scores)` counts the items in the list: `3`. These [[built-in-function|built-in functions]] work on any list of numbers.',
    },
    {
      kind: 'concept',
      title: 'Automation: let Python do the boring stuff',
      blocks: [
        {
          type: 'p',
          text: 'Perhaps the most immediately useful thing Python does for anyone — programmer or not — is **automation**. Any repetitive task on a computer is a candidate: renaming hundreds of screenshots, merging spreadsheets, downloading reports every morning, checking a website for changes, resizing images, sending a summary email.',
        },
        {
          type: 'code',
          title: 'sort_screenshots.py',
          code: 'from pathlib import Path\n\ndownloads = Path.home() / "Downloads"\nfor file in downloads.glob("Screenshot*.png"):\n    target = downloads / "Screenshots"\n    target.mkdir(exist_ok=True)\n    file.rename(target / file.name)\n    print("moved", file.name)',
          annotations: [
            { lines: 3, text: '`pathlib` treats paths as objects; `/` joins them, and the same code works on Windows, macOS and Linux.' },
            { lines: 4, text: '`glob` finds files matching a pattern.' },
            { lines: 7, text: 'Moves each file. A task that takes ten minutes by hand takes a second — every time.' },
          ],
        },
        {
          type: 'p',
          text: 'You’ll write real scripts like this in the Errors and Files unit. The skill transfers to every job: an analyst automating reports, a soldier automating a tedious spreadsheet, a game developer automating a build.',
        },
        {
          type: 'callout',
          variant: 'tip',
          text: 'Al Sweigart’s free online book *Automate the Boring Stuff with Python* is the classic guide to this side of Python — it’s in this lesson’s reading list.',
        },
      ],
    },
    {
      kind: 'concept',
      title: 'What Python isn’t great at',
      blocks: [
        {
          type: 'p',
          text: 'Knowing a tool’s limits is part of mastering it. Python is the wrong choice — or at least not the first choice — when:',
        },
        {
          type: 'table',
          headers: ['Task', 'Why Python struggles', 'Usual choice'],
          rows: [
            ['Game engines, renderers, physics', 'Every microsecond per frame counts; Python’s per-operation overhead is too high', 'C++ (or Rust)'],
            ['Code running in the web browser', 'Browsers run JavaScript natively; Python needs a ~10 MB WebAssembly runtime', 'JavaScript / TypeScript'],
            ['Native mobile apps', 'Python frameworks exist (Kivy, BeeWare) but are niche', 'Kotlin (Android), Swift (iOS), or cross-platform tools'],
            ['Hard real-time and tiny embedded systems', 'Garbage collection pauses and memory use are unpredictable', 'C, C++, Rust'],
            ['Small, standalone executables', 'Programs need the interpreter; bundling it makes large files', 'Go, Rust, C++'],
            ['CPU-heavy loops in pure Python', '10–100× slower than compiled code', 'Move the loop into NumPy, a C extension, or another language'],
          ],
          caption: 'Notice the pattern: the weak spots are raw speed, size and platforms that don’t ship Python.',
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Big codebases need discipline',
          text: 'Dynamic typing makes small programs fast to write, but in a project with hundreds of thousands of lines a renamed function can break something far away that only fails when that line runs. Large Python teams rely on [[type-hint|type hints]] checked by tools like mypy or Pyright, plus thorough automated tests. You’ll learn both later in the course.',
        },
      ],
    },
    {
      kind: 'mcq',
      prompt: 'You’re writing the renderer for a new AAA game engine, which must draw a frame in under 8 milliseconds. Which language is the usual choice?',
      options: [
        { text: 'Python, because it’s the most popular language', why: 'Popularity doesn’t make it fast. Python’s per-operation overhead is far too high for a real-time renderer.' },
        { text: 'C++, because it compiles to native code with precise control over memory', correct: true, why: 'Right — renderers and engines are C++ (or occasionally Rust) for exactly these reasons.' },
        { text: 'JavaScript, because it runs everywhere', why: 'JavaScript is great in browsers, but AAA renderers need native performance and direct GPU API access.' },
        { text: 'It doesn’t matter; all languages are equally fast on modern hardware', why: 'Language choice can mean a 10–100× difference in tight loops — the difference between 60 FPS and a slideshow.' },
      ],
      explanation: 'Real-time renderers are written in C++ because it compiles to native code with no garbage-collection pauses and gives precise control over memory layout. Python would be the language for the *tools* around that renderer: asset processing, profiling scripts, test automation.',
    },
    {
      kind: 'concept',
      title: 'The two-language pattern',
      blocks: [
        {
          type: 'p',
          text: 'The most powerful way to use Python is together with a fast compiled language. The heavy, stable core is written in C, C++, Rust or CUDA; Python wraps it in a friendly interface for the parts that change often. You get speed where it matters and flexibility everywhere else.',
        },
        {
          type: 'list',
          items: [
            '**NumPy** is C under a Python API. `a + b` on two million-element arrays runs a C loop, not a Python one.',
            '**PyTorch** is a C++ library (LibTorch) plus CUDA kernels, with Python on top. Researchers write Python; the GPU runs compiled code.',
            '**Game engines** embed Python for tools, or call Python-trained models through runtimes like ONNX Runtime from C++.',
            '**Your own code** can do this too: libraries like `pybind11` and `nanobind` expose C++ functions and classes to Python with a few lines.',
          ],
        },
        {
          type: 'code',
          lang: 'cpp',
          title: 'fast_math.cpp (pybind11)',
          code: '#include <pybind11/pybind11.h>\n\nint dot3(int ax, int ay, int az, int bx, int by, int bz) {\n    return ax * bx + ay * by + az * bz;\n}\n\nPYBIND11_MODULE(fast_math, m) {\n    m.def("dot3", &dot3, "Dot product of two 3D integer vectors");\n}',
          annotations: [
            { lines: '3-5', text: 'An ordinary C++ function.' },
            { lines: '7-9', text: 'This block makes it importable from Python: after building, `import fast_math; fast_math.dot3(1, 2, 3, 4, 5, 6)` returns `32`.' },
          ],
        },
        {
          type: 'p',
          text: 'In the AI course you’ll see the full loop that matters for game AI: **train a model in Python** with PyTorch, **export it** to a portable format such as ONNX, and **run it inside a C++ or C# game engine** at runtime.',
        },
        {
          type: 'callout',
          variant: 'analogy',
          text: 'A film crew: the camera, lights and rendering farm (C/C++/CUDA) do the heavy physical work; the director (Python) decides what to shoot and in what order. The director doesn’t need to be strong — just clear.',
        },
      ],
    },
    {
      kind: 'fill',
      prompt: 'Match each job to the library or language you’d reach for first.',
      template: 'Analyze a spreadsheet of player stats: ___. Train a neural network on a GPU: ___. Write a game engine’s physics system: ___. Build a website’s back-end API: ___.',
      blanks: [{ answers: ['pandas'] }, { answers: ['PyTorch'] }, { answers: ['C++'] }, { answers: ['Django'] }],
      wordBank: ['pandas', 'PyTorch', 'C++', 'Django', 'MicroPython', 'JavaScript'],
      explanation: '**pandas** handles tables of data; **PyTorch** trains neural networks on GPUs; engine physics needs native speed, so **C++**; and **Django** (or Flask/FastAPI) builds web back-ends. MicroPython is for microcontrollers, and JavaScript is the language of the browser front-end.',
    },
    {
      kind: 'code',
      prompt: 'Python makes a handy calculator for game balancing. A wave has 12 goblins (30 HP each), 5 orcs (80 HP each) and 2 trolls (250 HP each). The starter code forgets the trolls. Fix it so it prints the wave’s total HP:\n\n```\nTotal HP: 1260\n```',
      starter: 'goblins = 12\norcs = 5\ntrolls = 2\n\ntotal_hp = goblins * 30 + orcs * 80\nprint("Total HP:", total_hp)\n',
      solution: 'goblins = 12\norcs = 5\ntrolls = 2\n\ntotal_hp = goblins * 30 + orcs * 80 + trolls * 250\nprint("Total HP:", total_hp)\n',
      tests: 'assert total_hp == 1260, "total_hp should be 1260 — did you add trolls * 250?"',
      expectOutput: 'Total HP: 1260',
      checks: ['Adds the trolls’ HP (`trolls * 250`)', 'Prints `Total HP: 1260`'],
      hint: 'Add `+ trolls * 250` to the end of the `total_hp` line.',
      explanation: 'Goblins give $12 \\times 30 = 360$, orcs $5 \\times 80 = 400$, trolls $2 \\times 250 = 500$; the total is $1260$. Multiplication happens before addition, exactly as in math, so `goblins * 30 + orcs * 80 + trolls * 250` needs no parentheses.',
    },
    {
      kind: 'error',
      prompt: 'One of these claims is false. Tap it.',
      lines: [
        'NumPy’s heavy computations run in compiled C code, not in the Python bytecode loop.',
        'Most AI and machine-learning research code today is written in Python.',
        'Python is the standard language for writing AAA game renderers.',
        'Blender, Maya and Houdini can all be scripted with Python.',
      ],
      errorLines: [3],
      explanation: 'Statement 3 is false: AAA renderers are written in C++ (sometimes Rust) for native speed. Python is used *around* the engine — for tools, pipelines, automation and AI training. The other three statements are true.',
    },
  ],
  takeaways: [
    'Python is a first-class choice for web back-ends (Django, Flask, FastAPI), data science (pandas, NumPy), AI (PyTorch, scikit-learn), automation, DevOps, science and education.',
    'In games, Python powers tools, content pipelines (Blender, Maya, Houdini, Unreal’s editor), build systems, servers, prototypes and AI training — while engines stay C++.',
    'Python is a poor fit for real-time engines, browser front-ends, native mobile apps, tiny embedded systems and tight CPU-bound loops in pure Python.',
    'The two-language pattern — a fast C/C++/CUDA core with a Python interface — is how NumPy and PyTorch work, and how you can speed up your own code.',
    'Large Python projects stay healthy with type hints and automated tests.',
  ],
  reading: [
    { title: 'Python Success Stories', url: 'https://www.python.org/success-stories/', source: 'article', note: 'Case studies from companies and researchers using Python in production.' },
    { title: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com/', source: 'book', note: 'A free, beginner-friendly book of practical automation projects.' },
    { title: 'Scripting the Unreal Editor Using Python', url: 'https://dev.epicgames.com/documentation/en-us/unreal-engine/scripting-the-unreal-editor-using-python', source: 'docs', note: 'Epic’s guide to Python editor automation in Unreal Engine.' },
    { title: 'Blender Python API', url: 'https://docs.blender.org/api/current/', source: 'docs', note: 'Reference for scripting Blender — a great place to practice Python on 3D content.' },
    { title: 'pybind11 documentation', url: 'https://pybind11.readthedocs.io/', source: 'docs', note: 'How to expose C++ code to Python — the bridge between your two languages.' },
  ],
};
