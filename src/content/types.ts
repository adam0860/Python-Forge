/*
 * Content model for Python Forge.
 *
 * Every lesson in the app is plain data that conforms to these types. The UI
 * renders it and the validator (scripts/validate-content.ts) checks it: every
 * piece of TeX must compile with KaTeX, every graph expression must parse and
 * every numeric / expression answer must evaluate.
 *
 * INLINE TEXT FORMAT (used by every `text`, `prompt`, `explanation`, list item,
 * table cell, takeaway, glossary definition, option, chip, etc.):
 *   $x^2 + 1$           inline math (KaTeX). Write a literal dollar sign as \$.
 *   `code`              inline code
 *   **bold**            strong emphasis
 *   *italic*            emphasis
 *   [label](https://…)  external link (opens in the system browser)
 *   [[glossary-id]]     glossary term; shows the term name and a tap-to-define popover
 *   [[glossary-id|text]] glossary term with custom display text
 * Paragraph breaks inside a single string: use "\n\n".
 */

export type CourseId = 'python' | 'pyml';

/**
 * `python` — a Python source file. `pycon` — an interactive REPL session (lines
 * starting with `>>> ` / `... ` are input, the rest is output). `shell` — a
 * terminal session (Windows PowerShell or bash). `cpp` / `csharp` for the
 * occasional comparison with C++ or a game engine's language.
 */
export type CodeLang = 'python' | 'pycon' | 'text' | 'shell' | 'cpp' | 'csharp' | 'ini' | 'toml' | 'json' | 'yaml';

export interface ReadingRef {
  title: string;
  url: string;
  /** Where the link points, shown as a small badge. */
  source: 'docs' | 'pep' | 'tutorial' | 'book' | 'video' | 'article' | 'wikipedia' | 'course' | 'repo' | 'paper' | 'other';
  /** One sentence on why it's worth reading / what to look for. */
  note?: string;
}

/** Explains specific lines of a code block. Line numbers are 1-based. */
export interface Annotation {
  /** A single line (3), an inclusive range ("3-5") or a list ([2, 6]). */
  lines: number | string | number[];
  text: string;
}

export interface CodeBlock {
  type: 'code';
  code: string;
  lang?: CodeLang; // default 'python'
  /** File name or caption shown in the code header, e.g. "main.py". */
  title?: string;
  /** Expected program output, shown in a console panel under the code. */
  output?: string;
  annotations?: Annotation[];
  highlight?: number[];
  /**
   * true => a complete Python program. The app shows **Run** and **Edit**
   * buttons (it runs in the built-in Python runtime), and the checker
   * (`npm run run-examples`) runs it with CPython and compares stdout with
   * `output` exactly.
   */
  runnable?: boolean;
  /** Text fed to input() — one line per input() call. */
  stdin?: string;
  /**
   * The output differs between runs or Python versions (random numbers, memory
   * addresses, bytecode listings). `output` is shown as a sample; the checker
   * only verifies the code runs without errors.
   */
  outputVaries?: boolean;
  /** Third-party packages the example needs in the app runtime (e.g. ['numpy']). */
  packages?: string[];
  /**
   * Display-only example that needs software the in-app runtime can't provide
   * (PyTorch, a GPU, a game). The header shows "Run on your PC". `output`, if
   * given, is a representative sample output.
   */
  desktopOnly?: boolean;
}

/** One line of a worked solution: the math, plus the reason for the step. */
export interface DerivationStep {
  /** TeX for this line (display style, no surrounding $). */
  tex: string;
  /** Why this step is allowed / what was done (inline format). Tap to reveal. */
  why?: string;
}

// ---------------------------------------------------------------------------
// Graphs
// ---------------------------------------------------------------------------

/**
 * Expressions (`expr`, coordinates…) use the calculator syntax from
 * src/lib/mathexpr.ts: `x^2 - 3x + 2`, `2sin(x - pi/4)`, `sqrt(x)`, `e^(-x)`,
 * `ln(x)`, `abs(x)`, `log_2(x)`. They may use the graph's slider names as
 * parameters. Numbers anywhere a coordinate is expected may also be expressions
 * given as strings ("pi/2", "a").
 */
export type GraphColor = 'blue' | 'red' | 'green' | 'purple' | 'orange' | 'teal' | 'gray';
export type NumOrExpr = number | string;

export interface GraphBlock {
  type: 'graph';
  caption?: string;
  /** Visible window. */
  x: [number, number];
  y: [number, number];
  /** Grid / tick spacing. 'pi' places x ticks at multiples of π/2. */
  xStep?: number | 'pi';
  yStep?: number;
  /** Keep 1 unit on x the same length as 1 unit on y (circles look round). */
  equal?: boolean;
  /** y = f(x) curves. */
  functions?: {
    expr: string;
    label?: string;
    color?: GraphColor;
    dashed?: boolean;
    /** Only draw for x in this interval (inclusive). */
    domain?: [NumOrExpr, NumOrExpr];
  }[];
  /** (x(t), y(t)) curves — circles, spirals, projectile paths. */
  parametric?: { x: string; y: string; t: [NumOrExpr, NumOrExpr]; label?: string; color?: GraphColor; dashed?: boolean }[];
  /** Polar curves r = f(theta) for theta in `theta` (default [0, 2π]). Use `theta` (or `t`) in expr. */
  polar?: { expr: string; theta?: [NumOrExpr, NumOrExpr]; label?: string; color?: GraphColor; dashed?: boolean }[];
  points?: { x: NumOrExpr; y: NumOrExpr; label?: string; color?: GraphColor; open?: boolean }[];
  segments?: { from: [NumOrExpr, NumOrExpr]; to: [NumOrExpr, NumOrExpr]; color?: GraphColor; dashed?: boolean; arrow?: boolean; label?: string }[];
  /** Vertical / horizontal reference lines (asymptotes, x = a). */
  vlines?: { x: NumOrExpr; label?: string; color?: GraphColor; dashed?: boolean }[];
  hlines?: { y: NumOrExpr; label?: string; color?: GraphColor; dashed?: boolean }[];
  /** Shade between `expr` and `expr2` (default 0) for x in [from, to]. */
  areas?: { expr: string; expr2?: string; from: NumOrExpr; to: NumOrExpr; color?: GraphColor }[];
  /** Riemann-sum rectangles (or trapezoids) under `expr`. `n` may be a slider name. */
  riemann?: { expr: string; from: NumOrExpr; to: NumOrExpr; n: NumOrExpr; method: 'left' | 'right' | 'mid' | 'trap'; color?: GraphColor };
  /** Tangent line to `expr` at x = `at` (slope found numerically). Optional secant through `at` and `to`. */
  tangents?: { expr: string; at: NumOrExpr; secantTo?: NumOrExpr; color?: GraphColor; label?: string }[];
  /** Interactive parameters shown as sliders under the graph. */
  sliders?: { name: string; min: number; max: number; step?: number; value: number; label?: string }[];
  /** Live readouts under the graph, e.g. { label: 'slope', expr: '2a' } (inline TeX allowed in label). */
  readouts?: { label: string; expr: string; digits?: number }[];
  /** Height in px at full width (default 300). */
  height?: number;
}

export type CalloutVariant =
  | 'why' // explains the reasoning behind a rule, definition or method
  | 'tip' // practical advice
  | 'warning' // common mistake or trap
  | 'note' // side information
  | 'code' // how this shows up in real projects, game development and tooling
  | 'pythonic' // the idiomatic ("Pythonic") way, and why experienced Python programmers prefer it
  | 'cpp' // coming from C++: how Python differs from what a C++ programmer expects
  | 'under' // under the hood: what CPython actually does
  | 'exam' // interview / job tip: how this is tested or what reviewers look for
  | 'history' // where the idea came from
  | 'analogy'; // real-world analogy to build intuition

export type Block =
  | { type: 'p'; text: string }
  | { type: 'heading'; text: string }
  /** Display equation. */
  | { type: 'math'; tex: string; caption?: string }
  /** Worked example: one line per step, each with a tappable reason. */
  | { type: 'derivation'; title?: string; steps: DerivationStep[]; result?: string }
  | GraphBlock
  | CodeBlock
  | { type: 'callout'; variant: CalloutVariant; title?: string; text: string }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][]; caption?: string }
  /** Collapsible "go deeper" section for the curious. */
  | { type: 'deepdive'; title: string; blocks: Block[] }
  /** Side-by-side comparison, typically "wrong" vs "right". */
  | { type: 'compare'; left: CompareSide; right: CompareSide }
  /** A numbered process, e.g. the steps of completing the square. */
  | { type: 'steps'; items: { title: string; text: string }[] }
  /** Key term / theorem box. */
  | { type: 'definition'; term: string; text: string }
  /** A theorem, rule or formula worth remembering. */
  | { type: 'theorem'; name: string; tex?: string; text?: string };

export interface CompareSide {
  title: string;
  /** 'bad' renders red with ✗, 'good' renders green with ✓, 'neutral' plain. */
  tone: 'good' | 'bad' | 'neutral';
  /** Display math lines (each rendered on its own line). */
  tex?: string[];
  code?: string;
  lang?: CodeLang;
  text?: string;
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

/** A teaching card: explanation, examples, callouts. */
export interface ConceptStep {
  kind: 'concept';
  title: string;
  blocks: Block[];
}

interface QuestionBase {
  /** Optional stable id; defaults to `${lessonId}#${stepIndex}`. */
  id?: string;
  prompt: string;
  /** Optional display math shown under the prompt. */
  tex?: string;
  /** Optional graph shown with the prompt. */
  graph?: GraphBlock;
  /** Optional code shown with the prompt. */
  code?: string;
  /** Language of `code` (default 'python'). */
  lang?: CodeLang;
  /** Shown if the learner taps "Hint" before answering. */
  hint?: string;
  /**
   * The "why" behind the correct answer. Shown after every answer, right or
   * wrong. Should teach (ideally walk through the solution), not just restate.
   */
  explanation: string;
}

export interface McqOption {
  text: string;
  correct?: boolean;
  /** Why this option is right or wrong. Shown after answering. */
  why?: string;
}

/** Multiple choice. Exactly one correct option unless `multi` is true. */
export interface McqQuestion extends QuestionBase {
  kind: 'mcq';
  options: McqOption[];
  multi?: boolean;
  /** Render option text as code. */
  codeOptions?: boolean;
}

export interface TrueFalseQuestion extends QuestionBase {
  kind: 'truefalse';
  answer: boolean;
}

/**
 * Fill in the blank. Put `___` (three underscores) in `template` where each
 * blank goes. The template is inline text (so `$…$` math works around the
 * blanks) unless `templateIsCode` is true. With a `wordBank`, learners tap chips
 * (chips are inline text, so `$\pi$` renders as math); otherwise they type, and
 * typed numeric answers are compared by value (0.5 = 1/2).
 */
export interface FillQuestion extends QuestionBase {
  kind: 'fill';
  template: string;
  templateIsCode?: boolean; // default false
  blanks: { answers: string[]; caseSensitive?: boolean }[];
  wordBank?: string[];
}

/** Put the lines in the right order (e.g. the steps of a solution). `lines` is the correct order. */
export interface OrderQuestion extends QuestionBase {
  kind: 'order';
  /** Inline text (use $…$ for math), or code when `linesAreCode`. */
  lines: string[];
  distractors?: string[];
  linesAreCode?: boolean; // default false
}

/**
 * Find the mistake / bug hunt: tap the line where it first goes wrong. With
 * `linesAreCode`, `lines` are the lines of a Python program (indentation kept)
 * and are shown highlighted.
 */
export interface ErrorQuestion extends QuestionBase {
  kind: 'error';
  /** One line per step (inline text), or code lines when `linesAreCode`. */
  lines: string[];
  linesAreCode?: boolean;
  /** 1-based line numbers containing the (first) mistake. Any one counts. */
  errorLines: number[];
}

/**
 * Type a number. `answer` is an exact expression in calculator syntax ("3/4",
 * "sqrt(2)/2", "2pi/3"); give several in an array when the answer is a set of
 * values (roots) — learners type them comma-separated in any order.
 * Exact forms must match; decimals are accepted when correctly rounded to at
 * least `minDecimals` (default 2) places, or within `tolerance` if given.
 */
export interface NumericQuestion extends QuestionBase {
  kind: 'numeric';
  answer: string | string[];
  /** TeX shown as the correct answer after answering (defaults to the answer). */
  answerTex?: string;
  tolerance?: number;
  minDecimals?: number;
  /** Shown before the input, e.g. "$x =$". Inline format. */
  label?: string;
  /** Shown after the input, e.g. "cm²". */
  unit?: string;
}

/**
 * Type an expression, e.g. a derivative. Checked by evaluating both at random
 * points, so any equivalent form is accepted (2x(x+1) = 2x^2 + 2x).
 */
export interface ExprQuestion extends QuestionBase {
  kind: 'expr';
  /** Reference answer in calculator syntax: "3x^2 + 2cos(x)". */
  answer: string;
  answerTex?: string;
  /** Variables the learner may use (default ['x']). */
  variables?: string[];
  /** Sample interval used for checking (default [-3, 3]); pick one inside the domain. */
  domain?: [number, number];
  /** Antiderivatives: accept any answer that differs by a constant ("+ C" optional). */
  upToConstant?: boolean;
  /** Shown before the input, e.g. "$f'(x) =$". Inline format. */
  label?: string;
}

/**
 * Predict the output: the learner reads `code` and types exactly what it
 * prints. `answer` is the program's real stdout (the checker runs the code with
 * CPython and fails if they differ). Trailing spaces and blank lines at the end
 * are ignored; everything else must match.
 */
export interface PredictQuestion extends QuestionBase {
  kind: 'predict';
  code: string;
  answer: string;
  stdin?: string;
}

/**
 * Write code: the learner edits `starter` in a code editor and runs it. The
 * app runs their code, then `tests` (Python using `assert`) in the same
 * namespace; it passes when nothing raises. The checker verifies that
 * `solution` passes the tests and that `starter` does not.
 */
export interface CodeQuestion extends QuestionBase {
  kind: 'code';
  starter: string;
  solution: string;
  /** Python that raises (usually AssertionError) when the learner's code is wrong. */
  tests: string;
  /** Inline text describing each check, shown as a checklist under the editor. */
  checks?: string[];
  stdin?: string;
  /** If set, the program's stdout must equal this exactly (checked before `tests`). */
  expectOutput?: string;
  packages?: string[];
}

export type QuestionStep =
  | McqQuestion
  | TrueFalseQuestion
  | FillQuestion
  | OrderQuestion
  | ErrorQuestion
  | NumericQuestion
  | ExprQuestion
  | PredictQuestion
  | CodeQuestion;

export type Step = ConceptStep | QuestionStep;

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

export interface Lesson {
  /** Globally unique, kebab-case, prefixed with course: "calc1-chain-rule". */
  id: string;
  title: string;
  /** One-line description shown on the lesson card. */
  summary: string;
  /** Estimated minutes to complete. */
  minutes: number;
  /** What the learner will be able to do afterwards. */
  objectives: string[];
  steps: Step[];
  /** Bullet-point recap shown on the completion screen. */
  takeaways: string[];
  /** Further reading shown at the end of the lesson. */
  reading: ReadingRef[];
}

export interface Unit {
  /** Unique, kebab-case: "py-u01-meet-python". */
  id: string;
  /** Difficulty band shown on the unit header. */
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  title: string;
  description: string;
  /** A single emoji used as the unit badge. */
  icon: string;
  lessons: Lesson[];
}

export interface Course {
  id: CourseId;
  title: string;
  /** Short label for tabs and badges: "Algebra", "Calc I". */
  short: string;
  subtitle: string;
  description: string;
  units: Unit[];
}

// ---------------------------------------------------------------------------
// Reference material
// ---------------------------------------------------------------------------

export interface GlossaryEntry {
  /** kebab-case id used in [[id]] links, e.g. "chain-rule". */
  id: string;
  term: string;
  aliases?: string[];
  /** The course that introduces the term; 'all' for general vocabulary. */
  course: CourseId | 'all';
  /** e.g. "Basics", "Data types", "OOP", "Deep learning". */
  category: string;
  /** One or two sentence definition (inline format). */
  short: string;
  /** Longer explanation, may include "\n\n" paragraph breaks. */
  long?: string;
  /** A formula or example, as display TeX. */
  tex?: string;
  /** Optional code example. */
  example?: string;
  exampleLang?: CodeLang;
  /** Related glossary ids. */
  see?: string[];
  reading?: ReadingRef[];
}

export interface CheatSheet {
  id: string;
  title: string;
  course: CourseId;
  icon: string;
  description: string;
  sections: {
    title: string;
    items: { label: string; tex?: string; code?: string; lang?: CodeLang; text?: string }[];
  }[];
}
