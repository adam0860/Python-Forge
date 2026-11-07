# Python Forge

**Learn Python from your first `print()` to advanced language features — then AI, machine
learning and game AI — with deep, interactive lessons and a real Python interpreter built
into the app.** Python Forge is a Windows and Android app in the spirit of Sololearn and
Duolingo, with much more depth. It is a sibling of STEM Forge and C++ Forge and shares their
engine, with a green look of its own.

## Courses

- **Python: Beginner to Advanced** — 15 units, 72 lessons
  1. Meet Python — the history of the language, how CPython really runs your code
     (tokens → AST → bytecode → virtual machine), what Python is good for (and isn't),
     setting up Python and VS Code, and the best docs and references
  2. First Steps — print, variables, numbers, strings and f-strings, input and conversion
  3. Making Decisions · 4. Loops · 5. Collections · 6. Functions · 7. Working with Text
  8. Errors and Files · 9. Modules, Packages and Tools · 10. Object-Oriented Python
  11. Iterators and Generators · 12. Closures, Decorators and Context Managers
  13. Python Under the Hood · 14. Concurrency and Parallelism · 15. Professional Python
- **Python for AI & Machine Learning** — 11 units, 54 lessons
  The AI landscape and its history · the math you need · NumPy · pandas and plotting ·
  classic ML with scikit-learn · neural networks from scratch · PyTorch · deep learning
  (CNNs, transformers, transfer learning) · reinforcement learning (Q-learning, Gymnasium,
  DQN, PPO with Stable-Baselines3) · **AI for games** (custom environments, reward design,
  RLGym for Rocket League bots, self-play, imitation learning, running models in Unity and
  Unreal via ONNX) · applied projects (LLM APIs, RAG, computer vision, serving models)

Every lesson is written: 126 lessons, 1,100+ practice questions, a 427-term glossary and 15
cheat sheets (4 Python, 11 AI/ML). The outline lives in `scripts/curriculum.json`.

### Where the code runs

- **In the app (offline):** all pure-Python lessons, and the AI lessons that need only the
  standard library. The NumPy, pandas and scikit-learn examples run in the
  built-in interpreter too; those packages are **downloaded once on first use**, so the first
  run needs an internet connection and later runs do not.
- **"Run on your PC" examples:** PyTorch, Gymnasium, Stable-Baselines3, RLGym, ONNX Runtime,
  OpenCV, FastAPI and the LLM and embedding libraries cannot run inside a phone or a sandbox.
  Those listings are displayed with their expected output and the `pip install` line to
  run them on your own computer. The LLM examples also need your own API key.

## What's inside

- **A built-in Python 3.14 interpreter** ([Pyodide](https://pyodide.org) — CPython compiled
  to WebAssembly) that runs on your device, offline, on Windows and Android. Every
  runnable example has **Run** and **Edit** buttons with a live console, programs that use
  `input()` get an input box, and runaway loops can be stopped.
- **A Code playground** tab: a Python scratchpad with examples, saved automatically.
- **Nine question types**, including two new ones: **predict the output** (type exactly
  what a program prints) and **write the code** (your code runs against hidden tests), plus
  bug hunts in real Python code, multiple choice, true/false, fill in the blanks, ordering
  and calculation questions. Missed questions come back in spaced-repetition review.
- **Rich lessons:** annotated code you can tap line by line, "Coming from C++" notes,
  "Under the hood" deep dives, "The Pythonic way" tips, worked examples, tables, and
  curated reading lists pointing to the official docs, PEPs and the best tutorials.
- **Library:** a searchable glossary (tap any underlined term), cheat sheets, bookmarks and a
  "read as notes" view of every lesson.
- **Motivation, themes, offline:** XP, levels, streaks, achievements; dark (default), light
  and OLED themes with forest-green and other accents; export/import your progress.

## Getting the apps

### Build with GitHub Actions (easiest)

Push this folder to a new GitHub repository. The workflow in `.github/workflows/build.yml`
checks every lesson and builds both apps on every push:

| Artifact | Contains | Use it for |
|---|---|---|
| `windows-installer-x64` | `PythonForge-Setup-<version>-x64.exe` | Most Windows 10/11 PCs |
| `windows-installer-arm64` | `PythonForge-Setup-<version>-arm64.exe` | Windows on ARM |
| `windows-portable-x64` | `PythonForge-Portable-<version>.exe` | Running without installing |
| `android` | `PythonForge-debug.apk` | Android 7.0+; sideload with "Install unknown apps" on |

Open the repository's **Actions** tab, pick the latest **Build apps** run and download the
artifact you need. Windows SmartScreen may warn about an unsigned app the first time:
choose **More info → Run anyway**. Pushing a tag such as `v1.0.0` also attaches every file
to a GitHub Release. (Signed Android builds: add the `ANDROID_KEYSTORE_BASE64`,
`ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` secrets.)

### Build locally

Requirements: Node.js 22+ (and, for Android, Android Studio or the Android SDK + JDK 21).

```bash
npm install              # also copies the Python runtime into public/pyodide/
npm run dev              # web version with hot reload at http://localhost:5173
npm run check            # type-check, validate all content, run every Python example
```

**Windows app** (on Windows):

```bash
npm run electron:dev     # build and launch the desktop app
npm run dist:win         # create the installer and portable .exe in release/
```

**Android app:**

```bash
npm run android:sync     # build the web app and copy it into android/
npm run android:open     # open in Android Studio, then press Run
# or: cd android && ./gradlew assembleDebug  → android/app/build/outputs/apk/debug/app-debug.apk
```

## How it's built

One React + TypeScript codebase (Vite) runs everywhere: [Electron](https://www.electronjs.org/)
on Windows (served from a sandboxed `app://` scheme) and [Capacitor](https://capacitorjs.com/)
on Android. Python runs in a Web Worker so the UI stays responsive and a stuck program can
be stopped by restarting the worker.

```
src/
  content/              all course content as typed data (see docs/CONTENT_GUIDE.md)
    types.ts            the content model
    python/ pyml/       one folder per unit: one file per lesson + a unit glossary
    glossary/ cheatsheets/
  lib/python.ts         main-thread API for the Python runtime (run, stop, status)
  lib/pyworker.ts       the Web Worker hosting Pyodide (stdout/stderr, input(), tests)
  lib/highlight.ts      syntax highlighting for Python, REPL sessions, C++, shell, TOML…
  components/           code blocks with Run/Edit, the code editor and console, rich text…
  questions/            the question types, including predict-the-output and write-the-code
  screens/              home, course map, lesson player, practice, playground, library…
scripts/
  validate-content.ts   structure and markup checks for every lesson
  run-examples.ts       runs every example, predict answer and code question on the
                        app's own Python (Pyodide) and fails on any mismatch
  curriculum.json       the course outline; `npm run scaffold` creates stubs for new lessons
electron/               Windows desktop shell
android/                Android project (Capacitor)
```

Every runnable example's printed output, every predict-the-output answer and every
write-the-code model solution is executed by `npm run run-examples` before it ships, on the
exact Python version the app uses.
