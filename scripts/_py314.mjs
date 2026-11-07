// Dev helper: run a snippet on the app's Python (Pyodide 3.14) under Node.
import { loadPyodide } from 'pyodide';
import fs from 'node:fs';
const code = fs.readFileSync(process.argv[2], 'utf8');
const py = await loadPyodide();
py.setStdout({ batched: (s) => console.log(s) });
py.setStderr({ batched: (s) => console.log(s) });
try { py.runPython(code); } catch (e) { console.log(String(e)); }
