# Python Forge — Content Authoring Guide

Python Forge teaches Python (beginner → advanced) and Python for AI & Machine Learning
through short, deep, interactive lessons. Every lesson explains *why* things work, shows
real code the learner can run and edit, and checks understanding with questions where the
learner predicts output or writes code that is actually executed.

The learner is an adult (active-duty military, studying computer science, aiming to be a
game programmer at a major studio). He knows some C++, so "Coming from C++" notes are
welcome; connect ideas to games, tools and pipelines where it is natural — never forced.

Read this guide, then `src/content/types.ts`, then a reference lesson such as
`src/content/python/u02-first-steps/py-numbers.ts` or
`src/content/python/u01-meet-python/py-how-it-works.ts`.

## 1. Where content lives

```
src/content/
  types.ts                                data model
  <course>/<unit-dir>/<lesson-id>.ts      one file per lesson: export const lesson: Lesson = {...}
  <course>/<unit-dir>/index.ts            unit metadata + lesson imports (generated)
  <course>/<unit-dir>/glossary.ts         extra glossary terms introduced by this unit
  glossary/<course>.ts                    core glossary (every id is linkable everywhere)
  cheatsheets/<course>.ts                 cheat sheets
```

Courses: `python` (lesson ids `py-…`) and `pyml` (`ml-…`). The outline is
`scripts/curriculum.json`; `npm run scaffold` creates stub files for new lessons (it never
overwrites a finished lesson). Keep each lesson's `id`; you may refine the title.

## 2. Voice

Warm, precise, confident, never condescending. Second person. Short paragraphs. No filler.
Technical accuracy is paramount: state version requirements ("Python 3.10+"), don't
hand-wave edge cases, and say when something is CPython-specific.

## 3. Lesson recipe (enforced by `npm run validate`)

| Rule | Minimum |
|---|---|
| First step | a `concept` |
| Concept steps | ≥ 4 (typically 5–7) |
| Questions | ≥ 6 (typically 7–9) |
| Distinct question kinds | ≥ 4 |
| Hands-on questions (`predict`, `code`, `numeric`) | ≥ 2 |
| `why` callouts | ≥ 1 |
| Worked examples (an **annotated** code block, or a `derivation`) | ≥ 1 |
| Objectives / takeaways / reading refs | ≥ 3 / ≥ 4 / ≥ 2 |

Interleave concept → question; don't stack more than 3 questions in a row. Aim for 13–17
steps and 15–20 minutes. Each concept card: 150–400 words plus code.

A great concept card has: the idea in plain language; a runnable, annotated example; a
`why` callout; and, where useful, a `warning` (classic mistake), `pythonic` (the idiomatic
way), `cpp` (coming from C++), `under` (what CPython does), `code` (real projects / games),
`exam` (interview tips), `history`, `analogy`, `tip` or `note`.

## 4. Code blocks

- `lang` defaults to `python`. Use `pycon` for REPL transcripts (`>>> ` / `... ` prompts),
  `shell` for terminal sessions, `cpp` for C++ comparisons, `toml`/`yaml`/`json`/`text`.
- `runnable: true` → the app shows **Run** and **Edit**, and the checker runs the code on
  the app's own Python (Pyodide 3.14) and compares stdout with `output` **exactly**. If the
  output is intentionally an error, include the traceback in `output`; it is compared
  against stdout + stderr. Use `stdin` for programs that call `input()` (input is echoed
  after the prompt, like a terminal).
- `outputVaries: true` for random numbers, timings, memory addresses or bytecode: the
  output is shown as a sample and the checker only verifies the code runs.
- `desktopOnly: true` for code that needs PyTorch, a GPU, a game, the network or real files:
  shown with a "Run on your PC" badge; it must still parse.
- Annotate lines with `annotations` (tap-to-explain). Indent with 4 spaces, never tabs.
- Write tracebacks in `pycon` blocks by actually running the code (the caret lines `^^^`
  and `~~~` matter); `scripts/_py314.mjs` runs a snippet on Pyodide for you.

## 5. Inline text format

`` `code` ``, `**bold**`, `*italic*`, `$tex$`, `[label](https://…)`, `[[glossary-id]]`,
`[[glossary-id|text]]`, `"\n\n"` paragraph break, and ```` ``` ```` fenced blocks for exact
expected output inside prompts and explanations. A literal dollar sign is `\\$`.

## 6. Questions

- `mcq` (every option gets a `why`), `truefalse`, `fill` (use `templateIsCode` for code
  templates; blanks can't sit inside `$…$`), `order` (`linesAreCode` for code lines),
  `error` (`linesAreCode: true` = a bug hunt in Python code; `errorLines` is the 1-based
  buggy line), `numeric`, `expr`.
- `predict`: `code` + the exact `answer`. The checker runs the code and fails if the answer
  is wrong.
- `code`: `starter`, `solution`, `tests` (asserts with helpful messages) and/or
  `expectOutput`, plus optional `checks` (a visible checklist) and `stdin`. The checker
  verifies the solution passes and the starter doesn't.

Every explanation teaches the *why*, usually by walking through the answer.

## 7. Reading references

Only URLs you are sure exist: docs.python.org, peps.python.org, packaging.python.org,
library docs (numpy.org, pytorch.org, scikit-learn.org, gymnasium.farama.org…), Real
Python, Wikipedia, and well-known books. Each gets a one-sentence `note`.

## 8. Check before you finish

```
npm run validate -- --unit <unit-id> --allow-stubs
npm run run-examples -- --unit <unit-id>
npx tsc --noEmit
```

Fix all errors. Then re-read the lesson as a learner: is every new term explained, every
example runnable, every answer key correct?
