/*
 * Executes the Python in every lesson with CPython and checks it:
 *   • runnable code blocks run and print exactly their `output`
 *   • predict-the-output answers equal the code's real output
 *   • write-the-code solutions pass their tests (and match expectOutput),
 *     while the starter code does NOT pass (so the question isn't free)
 *   • every other Python snippet at least parses
 *
 *   npm run run-examples
 *   npm run run-examples -- --unit py-u02-first-steps [--unit ...]
 *
 * By default the code runs on the app's own Python (Pyodide, Python 3.14) so
 * outputs match exactly what learners see. Set PYTHON=python3 to use a CPython
 * interpreter instead (each job then runs in its own subprocess).
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContent, outline } from './load-content';
import type { Block, QuestionStep } from '../src/content/types';

const PY = process.env.PYTHON || '';
const HARNESS = path.join(import.meta.dirname, 'pyharness.py');
const args = process.argv.slice(2);
const units = new Set<string>();
for (let i = 0; i < args.length; i++) if (args[i] === '--unit') units.add(args[++i]);
if (units.size === 0) for (const list of Object.values(outline)) for (const u of list) units.add(u.id);
const { courses } = await loadContent(units, { glossary: false });

interface PyResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  tests: boolean | null;
  message: string | null;
}

// --------------------------------------------------------------- runtimes
type Pyodide = {
  runPython(code: string): unknown;
  globals: { get(name: string): (...a: unknown[]) => { toJs(o: object): unknown; destroy(): void } };
  toPy(v: unknown): unknown;
};
let pyodide: Pyodide | null = null;
async function getPyodide(): Promise<Pyodide> {
  if (!pyodide) {
    const { loadPyodide } = await import('pyodide');
    pyodide = (await loadPyodide()) as unknown as Pyodide;
    pyodide.runPython(fs.readFileSync(HARNESS, 'utf8').replace(/if __name__ == "__main__":[\s\S]*$/, ''));
  }
  return pyodide;
}

function runSubprocess<T>(payload: object, bin: string = PY): Promise<T> {
  return new Promise((resolve) => {
    const child = spawn(bin, ['-I', HARNESS], { timeout: 120_000 });
    let out = '';
    let errText = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (errText += d));
    child.on('close', () => {
      try {
        resolve(JSON.parse(out));
      } catch {
        resolve({ ok: false, stdout: '', stderr: `harness failed: ${errText || out}`, tests: null, message: null } as T);
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

async function runJob(job: { code: string; stdin?: string; tests?: string; packages?: string[] }): Promise<PyResult> {
  // Blocks that need extra packages (NumPy...) can't load them in this offline checker's Pyodide,
  // so they run on the system CPython instead (the packages must be pip-installed there).
  const needsPkgs = Boolean(job.packages?.length) || /^\s*(?:import|from)\s+(?:numpy|pandas|matplotlib|sklearn|scipy|torch|gymnasium|onnx|onnxruntime|stable_baselines3|rlgym\w*)\b/m.test(`${job.code}\n${job.tests ?? ''}`);
  if (!PY && needsPkgs) {
    return runSubprocess<PyResult>({ code: job.code, stdin: job.stdin ?? null, tests: job.tests ?? null }, 'python3');
  }
  if (PY) return runSubprocess<PyResult>({ code: job.code, stdin: job.stdin ?? null, tests: job.tests ?? null });
  const py = await getPyodide();
  const fn = py.globals.get('run_job');
  const res = fn(job.code, job.stdin ?? undefined, job.tests ?? undefined);
  const obj = res.toJs({ dict_converter: Object.fromEntries }) as PyResult;
  res.destroy();
  return obj;
}

async function parseCheck(sources: { where: string; code: string; strict: boolean }[]): Promise<{ where: string; error: string; strict: boolean }[]> {
  if (PY) return runSubprocess({ parse: sources });
  const py = await getPyodide();
  const res = py.globals.get('parse_errors')(py.toPy(sources));
  const list = res.toJs({ dict_converter: Object.fromEntries }) as { where: string; error: string; strict: boolean }[];
  res.destroy();
  return list;
}

const normalize = (s: string) =>
  s
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');

type Job = () => Promise<string | null>; // returns an error message or null
const jobs: { where: string; run: Job }[] = [];
const parseSources: { where: string; code: string; strict: boolean }[] = [];
let runnableCount = 0;
let predictCount = 0;
let codeCount = 0;

function collectBlocks(where: string, blocks: Block[]) {
  blocks.forEach((b, i) => {
    const w = `${where} block[${i}]`;
    if (b.type === 'deepdive') collectBlocks(w, b.blocks);
    if (b.type !== 'code') return;
    const lang = b.lang ?? 'python';
    if (lang === 'python' && !b.runnable) parseSources.push({ where: w, code: b.code, strict: Boolean(b.desktopOnly) });
    // Display-only blocks that need a library this sandbox has (PyTorch, Gymnasium...) are still executed
    // here with system python, so their sample output is verified too.
    const sandboxed =
      Boolean(b.desktopOnly) &&
      lang === 'python' &&
      /^\s*(?:import|from)\s+(?:torch|gymnasium|onnx|onnxruntime|rlgym\w*)\b/m.test(b.code) &&
      !/^\s*(?:import|from)\s+(?:torchvision|torchaudio|transformers|timm|peft|datasets|stable_baselines3|sb3_contrib|rlgym_ppo|rlgym_tools|rlgym_learn|catch_env)\b/m.test(b.code);
    if (!b.runnable && !sandboxed) return;
    runnableCount++;
    jobs.push({
      where: w,
      run: async () => {
        const r = await runJob({ code: b.code, stdin: b.stdin, packages: b.packages });
        if (b.outputVaries) return r.ok ? null : `raised an error:\n${indent(r.stderr)}`;
        const expectsError = b.output !== undefined && /Traceback \(most recent call last\)|^\w+Error: /m.test(b.output);
        if (!r.ok && !expectsError) return `raised an error:\n${indent(r.stderr)}`;
        if (b.output === undefined) return null;
        const actual = expectsError ? r.stdout + r.stderr : r.stdout;
        if (normalize(actual) !== normalize(b.output))
          return `output mismatch\n  expected:\n${indent(b.output, '    > ')}\n  actual:\n${indent(actual, '    > ')}`;
        return null;
      },
    });
  });
}

function collectQuestion(w: string, q: QuestionStep) {
  if (q.code && (q.lang ?? 'python') === 'python' && q.kind !== 'predict') parseSources.push({ where: w + ' code', code: q.code, strict: false });
  if (q.kind === 'predict') {
    predictCount++;
    jobs.push({
      where: w,
      run: async () => {
        const r = await runJob({ code: q.code, stdin: q.stdin });
        const actual = r.ok ? r.stdout : r.stdout + r.stderr;
        if (normalize(actual) !== normalize(q.answer))
          return `predict answer is wrong\n  answer:\n${indent(q.answer, '    > ')}\n  real output:\n${indent(actual, '    > ')}`;
        return null;
      },
    });
  }
  if (q.kind === 'code') {
    codeCount++;
    jobs.push({
      where: w,
      run: async () => {
        const tests = q.tests?.trim() ? q.tests : 'pass';
        const sol = await runJob({ code: q.solution, stdin: q.stdin, tests });
        if (!sol.ok) return `solution raises:\n${indent(sol.stderr)}`;
        if (q.expectOutput !== undefined && normalize(sol.stdout) !== normalize(q.expectOutput))
          return `solution output differs from expectOutput\n  expected:\n${indent(q.expectOutput, '    > ')}\n  actual:\n${indent(sol.stdout, '    > ')}`;
        if (sol.tests !== true) return `solution fails the tests: ${sol.message}`;
        const st = await runJob({ code: q.starter, stdin: q.stdin, tests });
        const starterPasses =
          st.ok && st.tests === true && (q.expectOutput === undefined || normalize(st.stdout) === normalize(q.expectOutput));
        if (starterPasses) return 'the starter code already passes the tests — the question is free';
        return null;
      },
    });
  }
}

for (const course of courses)
  for (const unit of course.units)
    for (const lesson of unit.lessons)
      lesson.steps.forEach((s, si) => {
        const w = `${lesson.id} step[${si}]`;
        if (s.kind === 'concept') collectBlocks(w, s.blocks);
        else collectQuestion(w, s);
      });

function indent(s: string, prefix = '    ') {
  return s
    .trimEnd()
    .split('\n')
    .map((l) => prefix + l)
    .join('\n');
}

let failures = 0;
let warnings = 0;
// Pyodide is single-threaded; subprocesses can run in parallel.
const concurrency = PY ? Number(process.env.CONCURRENCY) || Math.max(1, os.cpus().length) : 1;
setTimeout(() => {
  console.log('✗ Timed out after 10 minutes — does an example loop forever?');
  process.exit(1);
}, 600_000).unref();
let next = 0;
const messages: string[] = [];
await Promise.all(
  Array.from({ length: concurrency }, async () => {
    while (next < jobs.length) {
      const j = jobs[next++];
      const e = await j.run();
      if (e) {
        failures++;
        messages.push(`✗ ${j.where}: ${e}`);
      }
    }
  }),
);
for (const p of await parseCheck(parseSources)) {
  if (p.strict) failures++;
  else warnings++;
  messages.push(`${p.strict ? '✗' : '!'} ${p.where}: Python snippet doesn't parse (${p.error})`);
}
messages.sort();
if (messages.length) console.log(messages.join('\n') + '\n');
console.log(
  `Ran ${runnableCount} runnable example(s), ${predictCount} predict-the-output and ${codeCount} write-the-code question(s); ` +
    `parsed ${parseSources.length} other snippet(s) on ${PY ? PY : 'the app’s Python (Pyodide)'}. ${failures} failure(s), ${warnings} warning(s).`,
);
process.exit(failures ? 1 : 0);
