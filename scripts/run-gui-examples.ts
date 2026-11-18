/*
 * Smoke-tests the tkinter and pygame example programs in the lessons.
 *
 * These programs open a window, so they cannot run inside the app (they are
 * "Run on your PC" blocks) and the normal checker only parses them. This script
 * actually runs every *complete* program (one that calls mainloop() or
 * pygame.display.set_mode) for a moment, headlessly:
 *   - tkinter on a virtual display (xvfb-run) with a Python that has tkinter
 *   - pygame with SDL's dummy video and audio drivers
 * and fails if the program raises. If a block has `output` (and is not
 * `outputVaries`) its printed text must match too.
 *
 *   npm run run-gui-examples
 *   npm run run-gui-examples -- --unit tk-u02-widgets [--unit ...]
 *
 * Environment: TK_PYTHON (default /usr/bin/python3.12 or /usr/bin/python3, must have tkinter),
 * PG_PYTHON (default python3, must have pygame). A missing tool skips that part.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadContent, outline } from './load-content';
import type { Block, QuestionStep } from '../src/content/types';

const args = process.argv.slice(2);
const units = new Set<string>();
for (let i = 0; i < args.length; i++) if (args[i] === '--unit') units.add(args[++i]);
if (units.size === 0) for (const course of ['tkinter', 'pygame'] as const) for (const u of outline[course] ?? []) units.add(u.id);
const { courses } = await loadContent(units, { glossary: false });

const HARNESS = path.join(import.meta.dirname, 'gui-harness.py');
const TK_PY = process.env.TK_PYTHON || (spawnSync('/usr/bin/python3.12', ['-c', 'import tkinter']).status === 0 ? '/usr/bin/python3.12' : '/usr/bin/python3');
const PG_PY = process.env.PG_PYTHON || 'python3';
const has = (cmd: string, probe: string[]) => spawnSync(cmd, probe, { encoding: 'utf8' }).status === 0;
const tkOk = has('xvfb-run', ['--help']) && has(TK_PY, ['-c', 'import tkinter']);
const pgOk = has(PG_PY, ['-c', 'import pygame']);

const normalize = (s: string) => s.replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, '');

interface Item { where: string; kind: 'tk' | 'pg'; code: string; tests?: string; block?: Block & { type: 'code' } }
const items: Item[] = [];
function collect(where: string, blocks: Block[]) {
  blocks.forEach((b, i) => {
    const w = `${where} block[${i}]`;
    if (b.type === 'deepdive') collect(w, b.blocks);
    if (b.type !== 'code' || (b.lang ?? 'python') !== 'python' || b.runnable) return;
    if (/^\s*(?:import|from)\s+tkinter\b/m.test(b.code) && /\.mainloop\(/.test(b.code)) items.push({ where: w, kind: 'tk', code: b.code, block: b });
    else if (/^\s*(?:import|from)\s+pygame\b/m.test(b.code) && /display\.set_mode\(/.test(b.code) && /^\s*(?:import pygame|from pygame)/m.test(b.code))
      items.push({ where: w, kind: 'pg', code: b.code, block: b });
  });
}
function collectQuestion(where: string, q: QuestionStep) {
  // Code questions that rely on a stand-in library (setup): the model solution must also pass its tests on the REAL library.
  if (q.kind !== 'code' || !q.setup) return;
  const kind = /^\s*(?:import|from)\s+tkinter\b/m.test(q.solution) ? 'tk' : /^\s*(?:import|from)\s+pygame\b/m.test(q.solution) ? 'pg' : null;
  if (kind) items.push({ where: where + ' (code question, real library)', kind, code: q.solution, tests: q.tests });
}
for (const c of courses) for (const u of c.units) for (const l of u.lessons) l.steps.forEach((s, si) => (s.kind === 'concept' ? collect(`${l.id} step[${si}]`, s.blocks) : collectQuestion(`${l.id} step[${si}]`, s)));

let fail = 0, ran = 0, skipped = 0;
for (const it of items) {
  if ((it.kind === 'tk' && !tkOk) || (it.kind === 'pg' && !pgOk)) { skipped++; continue; }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'guiex-'));
  const file = path.join(dir, 'example.py');
  fs.writeFileSync(file, it.code);
  const testsFile = path.join(dir, 'tests.py');
  if (it.tests) fs.writeFileSync(testsFile, it.tests);
  const cmd = it.kind === 'tk' ? 'xvfb-run' : PG_PY;
  const extra = it.tests ? ['0.3', testsFile] : [];
  const argv = it.kind === 'tk' ? ['-a', TK_PY, HARNESS, 'tk', file, ...extra] : [HARNESS, 'pg', file, ...extra];
  const r = spawnSync(cmd, argv, { cwd: dir, encoding: 'utf8', timeout: 60_000, env: { ...process.env, SDL_VIDEODRIVER: 'dummy', SDL_AUDIODRIVER: 'dummy', PYGAME_HIDE_SUPPORT_PROMPT: '1' } });
  ran++;
  let msg: string | null = null;
  if (r.status !== 0) msg = `failed (exit ${r.status}):\n${(r.stderr || r.stdout).trim().split('\n').slice(-12).map((l) => '    ' + l).join('\n')}`;
  else if (it.block && it.block.output !== undefined && !it.block.outputVaries && normalize(r.stdout) !== normalize(it.block.output))
    msg = `output mismatch\n  expected:\n${(it.block?.output ?? '').split('\n').map((l) => '    > ' + l).join('\n')}\n  actual:\n${r.stdout.split('\n').map((l) => '    > ' + l).join('\n')}`;
  if (msg) { fail++; console.log(`✗ ${it.where} (${it.kind}): ${msg}`); }
  fs.rmSync(dir, { recursive: true, force: true });
}
console.log(`GUI examples: ${ran} run, ${skipped} skipped (tool missing), ${fail} failed.${tkOk ? '' : ' [tkinter unavailable]'}${pgOk ? '' : ' [pygame unavailable]'}`);
process.exit(fail ? 1 : 0);
