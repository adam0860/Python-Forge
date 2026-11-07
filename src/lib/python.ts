/*
 * Main-thread API for the built-in Python runtime (see pyworker.ts).
 *
 *   const run = runPython(code, { stdin, onOutput });
 *   const result = await run.done;      // or run.cancel()
 *
 * Python starts lazily the first time it is needed (warmUpPython() starts it
 * early, e.g. when a lesson with runnable code opens). Programs that run longer
 * than the time limit are stopped by terminating the worker; a fresh one is
 * started for the next run.
 */
import { useSyncExternalStore } from 'react';
import { progressStore } from './store';

export type PyStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface RunOptions {
  stdin?: string;
  /** Python checks (asserts) run in the same namespace after the code. */
  tests?: string;
  /** Exact stdout the program must print (trailing whitespace ignored). */
  expectOutput?: string;
  packages?: string[];
  timeoutMs?: number;
  onOutput?: (stream: 'stdout' | 'stderr', text: string) => void;
  onStatus?: (text: string) => void;
}

export interface RunResult {
  /** The program finished without an uncaught exception. */
  ok: boolean;
  stdout: string;
  stderr: string;
  timedOut?: boolean;
  cancelled?: boolean;
  /** Code questions: true when every check passed. */
  testsPassed?: boolean | null;
  /** Code questions: why a check failed. */
  message?: string | null;
  /** expectOutput given and stdout differed. */
  mismatch?: boolean;
  /** The runtime itself failed (couldn't start, etc.). */
  internal?: string;
}

// The runtime files are copied into public/pyodide/ (scripts/copy-pyodide.mjs)
// and third-party packages such as numpy are fetched from the CDN on demand.
const PYODIDE_VERSION = '314.0.7';
const PACKAGE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let worker: Worker | null = null;
let status: PyStatus = 'idle';
let version = '';
let initError = '';
let readyPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();
let nextId = 1;
const pending = new Map<
  number,
  { opts: RunOptions; stdout: string; stderr: string; resolve: (r: RunResult) => void; timer?: ReturnType<typeof setTimeout> }
>();
// Runs are serialized: Python is single-threaded inside the worker.
let queue: Promise<unknown> = Promise.resolve();

function setStatus(s: PyStatus) {
  status = s;
  listeners.forEach((l) => l());
}

function startWorker(): Promise<void> {
  if (readyPromise) return readyPromise;
  setStatus('loading');
  readyPromise = new Promise<void>((resolve, reject) => {
    const w = new Worker(new URL('./pyworker.ts', import.meta.url), { type: 'module', name: 'python' });
    worker = w;
    w.onmessage = (e: MessageEvent) => {
      const m = e.data;
      if (m.type === 'ready') {
        version = m.version;
        setStatus('ready');
        resolve();
      } else if (m.type === 'init-error') {
        initError = m.message;
        setStatus('error');
        readyPromise = null;
        worker = null;
        w.terminate();
        reject(new Error(m.message));
      } else if (m.type === 'out') {
        const p = pending.get(m.id);
        if (!p) return;
        if (m.stream === 'stdout') p.stdout += m.text;
        else p.stderr += m.text;
        p.opts.onOutput?.(m.stream, m.text);
      } else if (m.type === 'status') {
        pending.get(m.id)?.opts.onStatus?.(m.text);
      } else if (m.type === 'done') {
        const p = pending.get(m.id);
        if (!p) return;
        pending.delete(m.id);
        clearTimeout(p.timer);
        const r = m.result as Record<string, unknown>;
        p.resolve({
          ok: Boolean(r.ok),
          stdout: p.stdout,
          stderr: p.stderr,
          testsPassed: (r.tests as boolean | null) ?? null,
          message: (r.message as string | null) ?? null,
          mismatch: Boolean(r.mismatch),
          internal: r.internal as string | undefined,
        });
      }
    };
    w.onerror = (e) => {
      initError = e.message || 'The Python worker failed to start.';
      setStatus('error');
      readyPromise = null;
      worker = null;
      reject(new Error(initError));
    };
    const indexURL = new URL('pyodide/', document.baseURI).href;
    w.postMessage({ type: 'init', indexURL, packageBaseUrl: PACKAGE_CDN });
  });
  readyPromise.catch(() => {});
  return readyPromise;
}

/** Kill the worker (runaway program / user pressed Stop). The next run starts a new one. */
function killWorker() {
  worker?.terminate();
  worker = null;
  readyPromise = null;
  setStatus('idle');
}

export function warmUpPython() {
  if (status === 'idle') void startWorker().catch(() => {});
}

export function runPython(code: string, opts: RunOptions = {}): { done: Promise<RunResult>; cancel: () => void } {
  let cancel = () => {};
  const done = new Promise<RunResult>((resolve) => {
    let cancelled = false;
    let activeId = 0;
    cancel = () => {
      if (cancelled) return;
      cancelled = true;
      const p = pending.get(activeId);
      if (p) {
        pending.delete(activeId);
        clearTimeout(p.timer);
        killWorker();
        resolve({ ok: false, stdout: p.stdout, stderr: p.stderr, cancelled: true });
      } else resolve({ ok: false, stdout: '', stderr: '', cancelled: true });
    };
    queue = queue.then(async () => {
      if (cancelled) return;
      try {
        await startWorker();
      } catch (err) {
        resolve({ ok: false, stdout: '', stderr: '', internal: String(err) });
        return;
      }
      if (cancelled) return;
      const id = nextId++;
      activeId = id;
      await new Promise<void>((finish) => {
        const entry = {
          opts,
          stdout: '',
          stderr: '',
          resolve: (r: RunResult) => {
            finish();
            resolve(r);
          },
          timer: undefined as ReturnType<typeof setTimeout> | undefined,
        };
        pending.set(id, entry);
        const limit = opts.timeoutMs ?? 10_000;
        const arm = () =>
          setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            killWorker();
            finish();
            resolve({ ok: false, stdout: entry.stdout, stderr: entry.stderr, timedOut: true });
          }, limit);
        // Package downloads don't count against the time limit.
        const origStatus = opts.onStatus;
        entry.opts = {
          ...opts,
          onStatus: (t) => {
            clearTimeout(entry.timer);
            if (!t) entry.timer = arm();
            origStatus?.(t);
          },
        };
        entry.timer = arm();
        worker!.postMessage({
          type: 'run',
          id,
          code,
          stdin: opts.stdin,
          tests: opts.tests,
          expectOutput: opts.expectOutput,
          packages: opts.packages,
        });
      });
    });
  });
  done.then((r) => {
    if (!r.internal && !r.cancelled) {
      const p = progressStore.get();
      progressStore.set({ stats: { ...p.stats, codeRuns: (p.stats.codeRuns ?? 0) + 1 } });
    }
  });
  return { done, cancel };
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function usePythonStatus(): { status: PyStatus; version: string; error: string } {
  const s = useSyncExternalStore(subscribe, () => status);
  return { status: s, version, error: initError };
}
