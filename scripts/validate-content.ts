/*
 * Validator for all course content.
 *
 *   npm run validate                         # everything (final check)
 *   npm run validate -- --unit calc1-u04-rules [--unit ...]
 *                                            # only those units; glossary links may
 *                                            # point at ids from scripts/glossary-master.ts
 *   npm run validate -- --glossary           # only glossary + formula sheets
 *   npm run validate -- --allow-stubs        # don't fail on unwritten lessons
 *
 * Beyond structure it proves the math renders and the answers are computable:
 *   • every $…$ span, math block, derivation line and tex field compiles with KaTeX
 *   • every graph expression parses, uses only known variables, and is finite somewhere
 *   • every numeric answer evaluates to a finite number
 * Python code itself (runnable examples, predict-the-output answers, write-the-code
 * solutions and tests) is executed with CPython by `npm run run-examples`.
 *
 * Exit code is non-zero when any ERROR is found. WARNINGS are advisory.
 */
import katex from 'katex';
import type { Block, GraphBlock, Lesson, Step, QuestionStep, GlossaryEntry, ReadingRef, NumOrExpr } from '../src/content/types';
import { compile, equivalent, evalConst, parse, variablesOf, type Env } from '../src/lib/mathexpr';
import { MASTER_GLOSSARY_IDS } from './glossary-master';
import { loadContent } from './load-content';

const args = process.argv.slice(2);
const units = new Set<string>();
let glossaryOnly = false;
let allowStubs = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--unit') units.add(args[++i]);
  else if (args[i] === '--glossary') glossaryOnly = true;
  else if (args[i] === '--allow-stubs') allowStubs = true;
}
const partial = units.size > 0 || glossaryOnly;
const { courses, glossary, cheatSheets, loadProblems } = await loadContent(units, { glossary: !partial || glossaryOnly });

const errors: string[] = [];
const warnings: string[] = [];
const err = (where: string, msg: string) => errors.push(`✗ ${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`! ${where}: ${msg}`);

const masterIds = new Set(Object.keys(MASTER_GLOSSARY_IDS));
const definedIds = new Set(glossary.map((g) => g.id));
const resolvable = (id: string) => definedIds.has(id) || (partial && masterIds.has(id));

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PREFIX: Record<string, string> = { python: 'py-', pyml: 'ml-' };

// ----------------------------------------------------------------------- TeX
function checkTex(where: string, tex: string, display = false) {
  if (typeof tex !== 'string' || !tex.trim()) {
    err(where, 'empty TeX');
    return;
  }
  try {
    katex.renderToString(tex, { displayMode: display, throwOnError: true, strict: 'ignore' });
  } catch (e) {
    err(where, `TeX does not compile: ${(e as Error).message.replace(/^KaTeX parse error: /, '')} in "${tex.slice(0, 80)}"`);
  }
}

// ---------------------------------------------------------------- inline text
function checkInline(where: string, text: string) {
  if (typeof text !== 'string') {
    err(where, `expected a string, got ${typeof text}`);
    return;
  }
  if (!text.trim()) err(where, 'empty text');
  const unescaped = text.replace(/\\\$/g, '');
  const dollars = (unescaped.match(/\$/g) ?? []).length;
  if (dollars % 2 === 1) err(where, 'odd number of $ — unbalanced math span? (write a literal dollar as \\$)');
  for (const m of unescaped.matchAll(/\$\$([^$]+)\$\$|\$([^$]+)\$/g)) checkTex(where, m[1] ?? m[2], m[1] !== undefined);
  // Code and math spans are literal: `[[x]]` inside them is not markup.
  const prose = unescaped.replace(/`[^`]+`/g, '``').replace(/\$\$[^$]+\$\$|\$[^$]+\$/g, '$$');
  for (const m of prose.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g)) {
    const id = m[1].trim();
    if (!resolvable(id)) err(where, `unknown glossary id [[${id}]]`);
  }
  for (const m of prose.matchAll(/\]\(([^)]+)\)/g)) {
    if (!/^https:\/\//.test(m[1])) err(where, `link must be https: ${m[1]}`);
  }
  const ticks = (prose.match(/`/g) ?? []).length;
  if (ticks % 2 === 1) warn(where, 'odd number of backticks — unbalanced `code` span?');
  const stars = (prose.match(/\*\*/g) ?? []).length;
  if (stars % 2 === 1) warn(where, 'odd number of ** — unbalanced bold?');
  if (/\\\(|\\\[/.test(prose)) warn(where, 'found \\( or \\[ — use $…$ for inline math');
}

function lineCount(code: string) {
  return code.split('\n').length;
}

function parseLines(spec: number | string | number[]): number[] {
  if (typeof spec === 'number') return [spec];
  if (Array.isArray(spec)) return spec;
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(spec.trim());
  if (m) {
    const out: number[] = [];
    for (let i = +m[1]; i <= +m[2]; i++) out.push(i);
    return out;
  }
  const n = Number(spec);
  return Number.isInteger(n) ? [n] : [];
}

function checkReading(where: string, refs: ReadingRef[]) {
  refs.forEach((r, i) => {
    const w = `${where} reading[${i}]`;
    if (!r.title?.trim()) err(w, 'missing title');
    if (!/^https:\/\//.test(r.url ?? '')) err(w, `url must be https: ${r.url}`);
    if (r.note) checkInline(w + ' note', r.note);
  });
}

// --------------------------------------------------------------------- graphs
function checkExpr(where: string, src: string, allowed: string[]): ((env: Env) => number) | null {
  try {
    const node = parse(src);
    const bad = [...variablesOf(node)].filter((v) => !allowed.includes(v));
    if (bad.length) {
      err(where, `expression "${src}" uses unknown variable(s) ${bad.join(', ')} (allowed: ${allowed.join(', ') || 'none'})`);
      return null;
    }
    const f = compile(node);
    return (env) => {
      try {
        return f(env);
      } catch {
        return NaN;
      }
    };
  } catch (e) {
    err(where, `expression "${src}" does not parse: ${(e as Error).message}`);
    return null;
  }
}

function checkGraph(where: string, g: GraphBlock) {
  const [x0, x1] = g.x ?? [];
  const [y0, y1] = g.y ?? [];
  if (!(x1 > x0) || !(y1 > y0)) {
    err(where, 'graph needs x: [min, max] and y: [min, max] with min < max');
    return;
  }
  if (g.caption) checkInline(where + ' caption', g.caption);
  const sliders = g.sliders ?? [];
  const params: Env = {};
  for (const s of sliders) {
    if (!/^[a-zA-Z]$/.test(s.name) || ['x', 'y', 't', 'e'].includes(s.name)) err(where, `slider name "${s.name}" must be a single letter other than x, y, t, e`);
    if (!(s.max > s.min) || s.value < s.min || s.value > s.max) err(where, `slider ${s.name} needs min < value < max`);
    if (s.label) checkInline(where + ' slider label', s.label);
    params[s.name] = s.value;
  }
  const names = Object.keys(params);
  // `mayHide`: points whose coordinates are undefined for some slider values are simply hidden.
  const num = (w: string, v: NumOrExpr | undefined, mayHide = false) => {
    if (v === undefined || typeof v === 'number') return;
    const f = checkExpr(w, v, names);
    if (f && !mayHide && !Number.isFinite(f(params))) err(w, `"${v}" is not a finite number`);
  };
  const curveFinite = (w: string, f: (env: Env) => number, v: string, a: number, b: number) => {
    let ok = 0;
    for (let k = 0; k <= 200; k++) if (Number.isFinite(f({ ...params, [v]: a + ((b - a) * k) / 200 }))) ok++;
    if (ok === 0) err(w, 'curve is undefined everywhere in the window');
  };
  let drawables = 0;
  g.functions?.forEach((f, i) => {
    drawables++;
    const w = `${where} functions[${i}]`;
    if (f.label) checkInline(w + ' label', f.label);
    f.domain?.forEach((d) => num(w + ' domain', d));
    const ev = checkExpr(w, f.expr, ['x', ...names]);
    if (ev) curveFinite(w, ev, 'x', x0, x1);
  });
  g.parametric?.forEach((c, i) => {
    drawables++;
    const w = `${where} parametric[${i}]`;
    if (c.label) checkInline(w + ' label', c.label);
    c.t.forEach((d) => num(w + ' t', d));
    checkExpr(w, c.x, ['t', ...names]);
    checkExpr(w, c.y, ['t', ...names]);
  });
  g.polar?.forEach((c, i) => {
    drawables++;
    const w = `${where} polar[${i}]`;
    if (c.label) checkInline(w + ' label', c.label);
    c.theta?.forEach((d) => num(w + ' theta', d));
    checkExpr(w, c.expr, ['theta', 't', ...names]);
  });
  g.points?.forEach((p, i) => {
    drawables++;
    num(`${where} points[${i}].x`, p.x, true);
    num(`${where} points[${i}].y`, p.y, true);
  });
  g.segments?.forEach((s, i) => {
    drawables++;
    [...s.from, ...s.to].forEach((v) => num(`${where} segments[${i}]`, v));
  });
  g.vlines?.forEach((v, i) => num(`${where} vlines[${i}]`, v.x));
  g.hlines?.forEach((h, i) => num(`${where} hlines[${i}]`, h.y));
  g.areas?.forEach((a, i) => {
    drawables++;
    const w = `${where} areas[${i}]`;
    checkExpr(w, a.expr, ['x', ...names]);
    if (a.expr2) checkExpr(w, a.expr2, ['x', ...names]);
    num(w, a.from);
    num(w, a.to);
  });
  if (g.riemann) {
    drawables++;
    const w = `${where} riemann`;
    checkExpr(w, g.riemann.expr, ['x', ...names]);
    num(w, g.riemann.from);
    num(w, g.riemann.to);
    num(w, g.riemann.n);
  }
  g.tangents?.forEach((t, i) => {
    const w = `${where} tangents[${i}]`;
    checkExpr(w, t.expr, ['x', ...names]);
    num(w, t.at);
    num(w, t.secantTo);
  });
  g.readouts?.forEach((r, i) => {
    const w = `${where} readouts[${i}]`;
    checkInline(w + ' label', r.label);
    num(w, r.expr);
  });
  if (drawables === 0) err(where, 'graph draws nothing (add functions, parametric, polar, points or segments)');
}

// --------------------------------------------------------------------- blocks
interface LessonStats {
  why: number;
  worked: number;
  graphs: number;
}

function checkBlocks(where: string, blocks: Block[], stats: LessonStats) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    err(where, 'no blocks');
    return;
  }
  blocks.forEach((b, i) => {
    const w = `${where} block[${i}](${b.type})`;
    switch (b.type) {
      case 'p':
      case 'heading':
        checkInline(w, b.text);
        break;
      case 'math':
        checkTex(w, b.tex, true);
        if (b.caption) checkInline(w + ' caption', b.caption);
        break;
      case 'derivation':
        stats.worked++;
        if (b.title) checkInline(w + ' title', b.title);
        if (!b.steps?.length || b.steps.length < 2) err(w, 'derivation needs at least 2 steps');
        b.steps?.forEach((s, si) => {
          checkTex(`${w} step[${si}]`, s.tex, true);
          if (s.why) checkInline(`${w} step[${si}] why`, s.why);
        });
        if (b.steps && b.steps.filter((s) => s.why).length < Math.ceil(b.steps.length / 2))
          warn(w, 'most derivation steps should explain *why* (add `why` to more steps)');
        if (b.result) checkInline(w + ' result', b.result);
        break;
      case 'graph':
        stats.graphs++;
        checkGraph(w, b);
        break;
      case 'theorem':
        checkInline(w + ' name', b.name);
        if (b.tex) checkTex(w, b.tex, true);
        if (b.text) checkInline(w, b.text);
        if (!b.tex && !b.text) err(w, 'theorem needs tex or text');
        break;
      case 'code': {
        if (!b.code?.trim()) err(w, 'empty code');
        const n = lineCount(b.code);
        if (b.annotations?.length) stats.worked++;
        b.annotations?.forEach((a, ai) => {
          const ls = parseLines(a.lines);
          if (ls.length === 0) err(`${w} annotation[${ai}]`, `bad lines spec ${JSON.stringify(a.lines)}`);
          for (const l of ls) if (l < 1 || l > n) err(`${w} annotation[${ai}]`, `line ${l} out of range 1..${n}`);
          checkInline(`${w} annotation[${ai}]`, a.text);
        });
        b.highlight?.forEach((l) => {
          if (l < 1 || l > n) err(w, `highlight line ${l} out of range`);
        });
        if (b.runnable && (b.lang ?? 'python') !== 'python') err(w, 'runnable code must be Python');
        if (b.runnable && b.desktopOnly) err(w, 'a block cannot be both runnable and desktopOnly');
        if (b.runnable && b.output === undefined) warn(w, 'runnable code has no expected output');
        if (/\t/.test(b.code)) err(w, 'code contains a tab character — indent with 4 spaces');
        break;
      }
      case 'callout':
        if (b.variant === 'why') stats.why++;
        if (b.title) checkInline(w + ' title', b.title);
        checkInline(w, b.text);
        break;
      case 'list':
        if (!b.items?.length) err(w, 'empty list');
        b.items?.forEach((it, ii) => checkInline(`${w} item[${ii}]`, it));
        break;
      case 'table':
        if (!b.headers?.length) err(w, 'table without headers');
        b.headers.forEach((h, hi) => checkInline(`${w} header[${hi}]`, h));
        b.rows.forEach((r, ri) => {
          if (r.length !== b.headers.length) err(w, `row ${ri} has ${r.length} cells, expected ${b.headers.length}`);
          r.forEach((c, ci) => checkInline(`${w} row[${ri}][${ci}]`, c));
        });
        if (b.caption) checkInline(w + ' caption', b.caption);
        break;
      case 'deepdive':
        checkInline(w + ' title', b.title);
        checkBlocks(w, b.blocks, stats);
        break;
      case 'compare':
        for (const side of [b.left, b.right]) {
          if (!side?.title) err(w, 'compare side missing title');
          else checkInline(w + ' title', side.title);
          if (!side.code && !side.text && !side.tex?.length) err(w, 'compare side needs tex, code or text');
          if (side.text) checkInline(w, side.text);
          side.tex?.forEach((t) => checkTex(w, t, true));
        }
        break;
      case 'steps':
        if (!b.items?.length) err(w, 'empty steps');
        b.items.forEach((s, si) => {
          checkInline(`${w} step[${si}] title`, s.title);
          checkInline(`${w} step[${si}]`, s.text);
        });
        break;
      case 'definition':
        checkInline(w + ' term', b.term);
        checkInline(w, b.text);
        break;
      default:
        err(w, `unknown block type ${(b as { type: string }).type}`);
    }
  });
}

// ------------------------------------------------------------------ questions
function checkQuestion(where: string, q: QuestionStep, stats: LessonStats) {
  checkInline(where + ' prompt', q.prompt);
  checkInline(where + ' explanation', q.explanation);
  if ((q.explanation ?? '').length < 60) warn(where, 'explanation is very short — teach the "why"');
  if (q.hint) checkInline(where + ' hint', q.hint);
  if (q.tex) checkTex(where + ' tex', q.tex, true);
  if (q.graph) {
    stats.graphs++;
    checkGraph(where + ' graph', q.graph);
  }
  switch (q.kind) {
    case 'mcq': {
      if (q.options.length < 3) err(where, 'mcq needs at least 3 options');
      const correct = q.options.filter((o) => o.correct).length;
      if (q.multi ? correct < 1 : correct !== 1) err(where, `mcq has ${correct} correct options`);
      const seen = new Set<string>();
      q.options.forEach((o, i) => {
        if (seen.has(o.text)) err(where, `duplicate option "${o.text}"`);
        seen.add(o.text);
        if (!q.codeOptions) checkInline(`${where} option[${i}]`, o.text);
        if (!o.why) warn(`${where} option[${i}]`, 'option has no "why" explanation');
        else checkInline(`${where} option[${i}] why`, o.why);
      });
      break;
    }
    case 'truefalse':
      if (typeof q.answer !== 'boolean') err(where, 'truefalse answer must be boolean');
      break;
    case 'fill': {
      const count = (q.template.match(/___/g) ?? []).length;
      if (count === 0) err(where, 'fill template has no ___ blanks');
      if (count !== q.blanks.length) err(where, `template has ${count} blanks but ${q.blanks.length} answers`);
      if (!q.templateIsCode) {
        const segs = q.template.split('___');
        if (segs.some((seg) => (seg.replace(/\\\$/g, '').match(/\$/g) ?? []).length % 2 === 1))
          err(where, 'a ___ blank is inside a $…$ math span; close the math before the blank and reopen after it');
        else segs.forEach((seg, si) => seg.trim() && checkInline(`${where} template segment[${si}]`, seg));
      }
      q.blanks.forEach((b, i) => {
        if (!b.answers?.length || b.answers.some((a) => !a.trim())) err(where, `blank ${i} has an empty answer`);
        if (q.wordBank && !q.templateIsCode) b.answers.forEach((a) => checkInline(`${where} blank[${i}]`, a));
      });
      if (q.wordBank) {
        const bank = q.wordBank;
        if (!q.templateIsCode) bank.forEach((w, wi) => checkInline(`${where} wordBank[${wi}]`, w));
        // Repeated chips are allowed (one per blank that shares the answer); each chip is placed once.
        q.blanks.forEach((b, i) => {
          if (!b.answers.some((a) => bank.includes(a))) err(where, `no accepted answer for blank ${i} is in the word bank`);
        });
        if (bank.length <= q.blanks.length) warn(where, 'word bank has no distractors');
      }
      break;
    }
    case 'order':
      if (q.lines.length < 3) err(where, 'order question needs at least 3 lines');
      if (new Set(q.lines).size !== q.lines.length) err(where, 'order lines must be distinct');
      if (!q.linesAreCode) [...q.lines, ...(q.distractors ?? [])].forEach((l, i) => checkInline(`${where} line[${i}]`, l));
      q.distractors?.forEach((d) => {
        if (q.lines.includes(d)) err(where, `distractor "${d}" is also a correct line`);
      });
      break;
    case 'error': {
      if (q.lines.length < 3) err(where, 'error question needs at least 3 lines');
      if (!q.linesAreCode) q.lines.forEach((l, i) => checkInline(`${where} line[${i}]`, l));
      if (!q.errorLines?.length) err(where, 'error question has no errorLines');
      q.errorLines?.forEach((l) => {
        if (l < 1 || l > q.lines.length) err(where, `error line ${l} out of range 1..${q.lines.length}`);
      });
      break;
    }
    case 'numeric': {
      const answers = Array.isArray(q.answer) ? q.answer : [q.answer];
      if (!answers.length) err(where, 'numeric question has no answer');
      for (const a of answers) {
        try {
          const node = parse(a);
          if (variablesOf(node).size) err(where, `numeric answer "${a}" must not contain variables`);
          else if (!Number.isFinite(evalConst(a))) err(where, `numeric answer "${a}" does not evaluate to a finite number`);
        } catch (e) {
          err(where, `numeric answer "${a}" does not parse: ${(e as Error).message}`);
        }
      }
      if (q.answerTex) checkTex(where + ' answerTex', q.answerTex);
      if (q.label) checkInline(where + ' label', q.label);
      if (q.unit) checkInline(where + ' unit', q.unit);
      break;
    }
    case 'expr': {
      const vars = q.variables ?? ['x'];
      try {
        const node = parse(q.answer);
        const bad = [...variablesOf(node)].filter((v) => !vars.includes(v));
        if (bad.length) err(where, `expr answer "${q.answer}" uses undeclared variable(s) ${bad.join(', ')} — set variables`);
        else {
          const self = equivalent(q.answer, q.answer, { variables: vars, domain: q.domain, upToConstant: q.upToConstant });
          if (!self.ok) err(where, `expr answer "${q.answer}" is undefined at most sample points of domain ${JSON.stringify(q.domain ?? [-3, 3])} — set a domain inside where it is defined`);
        }
      } catch (e) {
        err(where, `expr answer "${q.answer}" does not parse: ${(e as Error).message}`);
      }
      if (q.answerTex) checkTex(where + ' answerTex', q.answerTex);
      if (q.label) checkInline(where + ' label', q.label);
      break;
    }
    case 'predict':
      if (!q.code?.trim()) err(where, 'predict question needs code');
      if (typeof q.answer !== 'string' || !q.answer.trim()) err(where, 'predict question needs the exact output as answer');
      break;
    case 'code':
      if (!q.starter?.trim()) warn(where, 'code question has an empty starter');
      if (!q.solution?.trim()) err(where, 'code question needs a solution');
      if (!q.tests?.trim() && q.expectOutput === undefined) err(where, 'code question needs tests or expectOutput');
      q.checks?.forEach((c, i) => checkInline(`${where} check[${i}]`, c));
      break;
    default:
      err(where, `unknown step kind ${(q as { kind: string }).kind}`);
  }
}

// -------------------------------------------------------------------- lessons
const lessonIds = new Set<string>();
const questionIds = new Set<string>();
let checkedLessons = 0;
let stubCount = 0;
let questionCount = 0;
let conceptCount = 0;

function checkLesson(where: string, lesson: Lesson, courseId: string) {
  const w = `${where} › ${lesson.id}`;
  const prefix = PREFIX[courseId];
  if (!KEBAB.test(lesson.id)) err(w, 'lesson id must be kebab-case');
  if (!lesson.id.startsWith(prefix)) err(w, `lesson id must start with "${prefix}"`);
  if (lessonIds.has(lesson.id)) err(w, 'duplicate lesson id');
  lessonIds.add(lesson.id);
  if (lesson.summary === 'This lesson is being written.') {
    stubCount++;
    if (!allowStubs) err(w, 'lesson is still a stub');
    return;
  }
  checkedLessons++;
  checkInline(w + ' title', lesson.title);
  checkInline(w + ' summary', lesson.summary);
  if (!(lesson.minutes > 0)) err(w, 'minutes must be > 0');
  if (lesson.objectives.length < 3) err(w, 'needs at least 3 objectives');
  lesson.objectives.forEach((o, i) => checkInline(`${w} objective[${i}]`, o));
  if (lesson.takeaways.length < 4) err(w, 'needs at least 4 takeaways');
  lesson.takeaways.forEach((t, i) => checkInline(`${w} takeaway[${i}]`, t));
  if (lesson.reading.length < 2) err(w, 'needs at least 2 reading references');
  checkReading(w, lesson.reading);

  const stats: LessonStats = { why: 0, worked: 0, graphs: 0 };
  let concepts = 0;
  let questions = 0;
  let computed = 0;
  const kinds = new Set<string>();
  lesson.steps.forEach((s: Step, i) => {
    const sw = `${w} step[${i}](${s.kind})`;
    if (s.kind === 'concept') {
      concepts++;
      checkInline(sw + ' title', s.title);
      checkBlocks(sw, s.blocks, stats);
    } else {
      questions++;
      kinds.add(s.kind);
      if (s.kind === 'numeric' || s.kind === 'expr' || s.kind === 'predict' || s.kind === 'code') computed++;
      const qid = s.id ?? `${lesson.id}#${i}`;
      if (questionIds.has(qid)) err(sw, `duplicate question id ${qid}`);
      questionIds.add(qid);
      checkQuestion(sw, s, stats);
    }
  });
  conceptCount += concepts;
  questionCount += questions;
  if (lesson.steps[0]?.kind !== 'concept') err(w, 'first step must be a concept');
  if (concepts < 4) err(w, `needs at least 4 concept steps (has ${concepts})`);
  if (questions < 6) err(w, `needs at least 6 questions (has ${questions})`);
  if (kinds.size < 4) err(w, `needs at least 4 question kinds (has ${[...kinds].join(', ')})`);
  if (computed < 2) err(w, `needs at least 2 hands-on questions (predict, code, numeric) (has ${computed})`);
  if (stats.why < 1) err(w, 'needs at least one callout with variant "why"');
  if (stats.worked < 1) err(w, 'needs at least one worked example (an annotated code block or a `derivation` block)');
  let run = 0;
  lesson.steps.forEach((s, i) => {
    run = s.kind === 'concept' ? 0 : run + 1;
    const next = lesson.steps[i + 1];
    if (run >= 4 && next?.kind === 'concept') warn(w, `${run} questions in a row before step ${i + 1}`);
  });
}

if (!glossaryOnly) {
  const unitIds = new Set<string>();
  for (const course of courses) {
    for (const unit of course.units) {
      if (unitIds.has(unit.id)) err(unit.id, 'duplicate unit id');
      unitIds.add(unit.id);
      const selected = units.size === 0 || units.has(unit.id);
      for (const lesson of unit.lessons) {
        if (selected) checkLesson(`${course.id} › ${unit.id}`, lesson, course.id);
        else lessonIds.add(lesson.id);
      }
    }
  }
  for (const u of units) if (!unitIds.has(u)) err(u, 'no such unit');
}

// ------------------------------------------------------------------- glossary
function checkGlossary() {
  const ids = new Set<string>();
  const terms = new Map<string, string>();
  glossary.forEach((g: GlossaryEntry) => {
    const w = `glossary › ${g.id}`;
    if (!KEBAB.test(g.id)) err(w, 'id must be kebab-case');
    if (ids.has(g.id)) err(w, 'duplicate glossary id');
    ids.add(g.id);
    const t = g.term.toLowerCase();
    if (terms.has(t)) warn(w, `same term as ${terms.get(t)}`);
    terms.set(t, g.id);
    checkInline(w + ' short', g.short);
    if (g.long) checkInline(w + ' long', g.long);
    if (g.tex) checkTex(w + ' tex', g.tex, true);
    g.see?.forEach((s) => {
      if (!definedIds.has(s) && !(partial && masterIds.has(s))) err(w, `see: unknown id ${s}`);
    });
    if (g.reading) checkReading(w, g.reading);
  });
  if (!partial || glossaryOnly) {
    for (const id of masterIds) if (!definedIds.has(id)) (partial ? warn : err)('glossary', `master id "${id}" is not defined`);
  }
  const sheetIds = new Set<string>();
  cheatSheets.forEach((s) => {
    const w = `formula sheet › ${s.id}`;
    if (sheetIds.has(s.id)) err(w, 'duplicate sheet id');
    sheetIds.add(s.id);
    if (!s.sections.length) err(w, 'no sections');
    s.sections.forEach((sec) =>
      sec.items.forEach((it, i) => {
        const iw = `${w} › ${sec.title}[${i}]`;
        if (!it.code && !it.text && !it.tex) err(iw, 'item needs tex, code or text');
        checkInline(iw + ' label', it.label);
        if (it.tex) checkTex(iw, it.tex, true);
        if (it.text) checkInline(iw, it.text);
      }),
    );
  });
}
if (!partial || glossaryOnly) checkGlossary();

// --------------------------------------------------------------------- report
if (loadProblems.length)
  console.log('Note: some shared files failed to load (probably mid-edit by another author):\n  ' + loadProblems.join('\n  ') + '\n');
if (warnings.length) console.log(warnings.join('\n') + '\n');
if (errors.length) console.log(errors.join('\n') + '\n');
console.log(
  `Checked ${checkedLessons} lessons (${conceptCount} concept steps, ${questionCount} questions), ` +
    `${glossary.length} glossary entries, ${cheatSheets.length} cheat sheets. ` +
    `${stubCount} stub lesson(s). ${errors.length} error(s), ${warnings.length} warning(s).`,
);
process.exit(errors.length ? 1 : 0);
