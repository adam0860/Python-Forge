/// <reference lib="webworker" />
/*
 * Web Worker that hosts the in-app Python runtime (Pyodide: CPython compiled to
 * WebAssembly). Running Python off the main thread keeps the UI responsive, and
 * lets the app stop a runaway program (an infinite loop) by terminating the
 * worker and starting a fresh one.
 *
 * Protocol (main → worker):
 *   { type: 'init', indexURL, packageBaseUrl }
 *   { type: 'run', id, code, stdin?, tests?, expectOutput?, packages? }
 * Protocol (worker → main):
 *   { type: 'ready', version } | { type: 'init-error', message }
 *   { type: 'out', id, stream: 'stdout' | 'stderr', text }
 *   { type: 'status', id, text }               (e.g. "Loading numpy…")
 *   { type: 'done', id, result }
 */

interface PyodideLike {
  runPython(code: string, opts?: { globals?: unknown }): unknown;
  loadPackage(names: string[], opts?: { messageCallback?: (m: string) => void; errorCallback?: (m: string) => void }): Promise<unknown>;
  loadPackagesFromImports(code: string, opts?: { messageCallback?: (m: string) => void; errorCallback?: (m: string) => void }): Promise<unknown>;
  setStdout(opts: { write: (buf: Uint8Array) => number }): void;
  setStderr(opts: { write: (buf: Uint8Array) => number }): void;
  setStdin(opts: { stdin: () => string | null | undefined }): void;
  globals: { get(name: string): (...args: unknown[]) => unknown };
  version: string;
}


let py: PyodideLike | null = null;
let runner: ((...args: unknown[]) => unknown) | null = null;
const loaded = new Set<string>();
let currentId = 0;

// Batch output so a print() loop doesn't flood the main thread with messages.
const MAX_OUTPUT = 200_000;
let outBuf: { stream: 'stdout' | 'stderr'; text: string }[] = [];
let outTotal = 0;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const decoder = new TextDecoder();

function flush() {
  flushTimer = null;
  if (!outBuf.length) return;
  for (const chunk of outBuf) self.postMessage({ type: 'out', id: currentId, stream: chunk.stream, text: chunk.text });
  outBuf = [];
}
function emit(stream: 'stdout' | 'stderr', text: string) {
  if (outTotal > MAX_OUTPUT) return;
  outTotal += text.length;
  if (outTotal > MAX_OUTPUT) text += '\n… output truncated (more than 200,000 characters).\n';
  const last = outBuf[outBuf.length - 1];
  if (last && last.stream === stream) last.text += text;
  else outBuf.push({ stream, text });
  if (!flushTimer) flushTimer = setTimeout(flush, 40);
}

// Python-side helper. Runs learner code as "main.py", hides the runtime's own
// stack frames from tracebacks, then (optionally) runs the tests as "tests.py".
const PRELUDE = String.raw`
import sys, traceback, builtins, io, linecache

_pf_real_input = builtins.input

def _pf_input(prompt=""):
    # Behave like a terminal: echo what was "typed" after the prompt.
    line = _pf_real_input(prompt)
    print(line)
    return line

def _pf_trim_tb(tb, names):
    while tb is not None and tb.tb_frame.f_code.co_filename not in names:
        tb = tb.tb_next
    return tb

def _pf_run(src, tests, expect, stdin_lines):
    ns = {"__name__": "__main__", "__builtins__": builtins}
    builtins.input = _pf_input
    result = {"ok": True, "tests": None, "message": None, "mismatch": False, "stdout": None}
    captured = None
    if expect is not None:
        captured = io.StringIO()
        real_stdout = sys.stdout
        class _Tee(io.TextIOBase):
            def write(self, s):
                captured.write(s)
                return real_stdout.write(s)
            def flush(self):
                real_stdout.flush()
        sys.stdout = _Tee()
    # Register the source so tracebacks can show the offending line.
    linecache.cache["main.py"] = (len(src), None, src.splitlines(True), "main.py")
    if tests is not None:
        linecache.cache["tests.py"] = (len(tests), None, tests.splitlines(True), "tests.py")
    try:
        exec(compile(src, "main.py", "exec"), ns)
    except SystemExit as e:
        if e.code not in (None, 0):
            print(f"SystemExit: {e.code}", file=sys.stderr)
            result["ok"] = False
    except BaseException as e:
        result["ok"] = False
        tb = _pf_trim_tb(e.__traceback__, ("main.py",))
        traceback.print_exception(type(e), e, tb, file=sys.stderr)
    finally:
        if captured is not None:
            sys.stdout = real_stdout
        sys.stdout.flush()
        builtins.input = _pf_real_input
    if captured is not None:
        out = "\n".join(l.rstrip() for l in captured.getvalue().replace("\r\n", "\n").split("\n")).rstrip("\n")
        want = "\n".join(l.rstrip() for l in expect.replace("\r\n", "\n").split("\n")).rstrip("\n")
        if out != want:
            result["mismatch"] = True
            result["stdout"] = out
    if tests is not None:
        if not result["ok"]:
            result["tests"] = False
            result["message"] = "Your code raised an error before the checks could run."
        elif result["mismatch"]:
            result["tests"] = False
            result["message"] = "The output doesn't match what was asked for."
        else:
            # Tests run with output hidden so they don't clutter the console.
            hidden = io.StringIO()
            real_stdout = sys.stdout
            sys.stdout = hidden
            try:
                exec(compile(tests, "tests.py", "exec"), ns)
                result["tests"] = True
            except AssertionError as e:
                result["tests"] = False
                result["message"] = str(e) or "A check failed."
            except BaseException as e:
                result["tests"] = False
                result["message"] = f"{type(e).__name__}: {e}"
            finally:
                sys.stdout = real_stdout
    return result
`;

async function init(indexURL: string, packageBaseUrl: string) {
  const mod = (await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)) as {
    loadPyodide: (opts: Record<string, unknown>) => Promise<PyodideLike>;
  };
  py = await mod.loadPyodide({ indexURL, packageBaseUrl, fullStdLib: false });
  py.setStdout({
    write: (buf) => {
      emit('stdout', decoder.decode(buf));
      return buf.length;
    },
  });
  py.setStderr({
    write: (buf) => {
      emit('stderr', decoder.decode(buf));
      return buf.length;
    },
  });
  py.runPython(PRELUDE);
  runner = py.globals.get('_pf_run');
  self.postMessage({ type: 'ready', version: py.runPython('import sys; sys.version.split()[0]') });
}

// Packages Pyodide can download (import name → package name).
const KNOWN_PACKAGES: Record<string, string> = {
  numpy: 'numpy',
  pandas: 'pandas',
  matplotlib: 'matplotlib',
  scipy: 'scipy',
  sklearn: 'scikit-learn',
  sympy: 'sympy',
  networkx: 'networkx',
  PIL: 'pillow',
  regex: 'regex',
  yaml: 'pyyaml',
  bs4: 'beautifulsoup4',
};

function findThirdPartyImports(code: string): string[] {
  const found = new Set<string>();
  for (const m of code.matchAll(/^\s*(?:from\s+([A-Za-z_]\w*)[\w.]*\s+import|import\s+([A-Za-z_][\w., ]*))/gm)) {
    const names = m[1] ? [m[1]] : m[2].split(',').map((n) => n.trim().split(/[\s.]/)[0]);
    for (const n of names) if (KNOWN_PACKAGES[n]) found.add(KNOWN_PACKAGES[n]);
  }
  return [...found];
}

interface RunMsg {
  type: 'run';
  id: number;
  code: string;
  stdin?: string;
  tests?: string;
  expectOutput?: string;
  packages?: string[];
}

async function run(msg: RunMsg) {
  if (!py || !runner) throw new Error('Python is not ready');
  currentId = msg.id;
  outTotal = 0;
  // Third-party packages: the ones the lesson declares, plus anything the code
  // imports that the runtime knows how to fetch (numpy, pandas, …).
  const wanted = (msg.packages ?? []).filter((p) => !loaded.has(p));
  const imported = findThirdPartyImports(msg.code).filter((p) => !loaded.has(p));
  const toLoad = [...new Set([...wanted, ...imported])];
  if (toLoad.length) {
    self.postMessage({ type: 'status', id: msg.id, text: `Downloading ${toLoad.join(', ')} (first time only, needs internet)…` });
    let failed = '';
    try {
      await py.loadPackage(toLoad, { messageCallback: () => {}, errorCallback: (m) => (failed += m + '\n') });
    } catch (e) {
      failed += String(e);
    }
    if (failed) emit('stderr', `Couldn't load ${toLoad.join(', ')} — this needs an internet connection the first time.\n`);
    else toLoad.forEach((p) => loaded.add(p));
    self.postMessage({ type: 'status', id: msg.id, text: '' });
  }
  const lines = (msg.stdin ?? '').split('\n');
  if (msg.stdin !== undefined && lines[lines.length - 1] === '') lines.pop();
  py.setStdin({ stdin: () => (lines.length ? lines.shift()! : null) });
  const res = runner(msg.code, msg.tests ?? undefined, msg.expectOutput ?? undefined, undefined) as { toJs: (o: object) => Map<string, unknown>; destroy: () => void };
  const map = res.toJs({ dict_converter: Object.fromEntries }) as unknown as Record<string, unknown>;
  res.destroy();
  flush();
  self.postMessage({ type: 'done', id: msg.id, result: map });
}

self.onmessage = async (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === 'init') {
    try {
      await init(msg.indexURL, msg.packageBaseUrl);
    } catch (err) {
      self.postMessage({ type: 'init-error', message: String(err) });
    }
  } else if (msg.type === 'run') {
    try {
      await run(msg as RunMsg);
    } catch (err) {
      flush();
      self.postMessage({ type: 'done', id: msg.id, result: { ok: false, internal: String(err) } });
    }
  }
};
