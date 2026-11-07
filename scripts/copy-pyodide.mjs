// Copies the Pyodide runtime (CPython compiled to WebAssembly) into
// public/pyodide/ so it ships inside the app and works offline.
// Runs automatically after `npm install` (see "postinstall" in package.json).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const src = path.join(root, 'node_modules/pyodide');
const dest = path.join(root, 'public/pyodide');
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];
fs.mkdirSync(dest, { recursive: true });
for (const f of files) fs.copyFileSync(path.join(src, f), path.join(dest, f));
const version = JSON.parse(fs.readFileSync(path.join(src, 'package.json'), 'utf8')).version;
console.log(`Copied Pyodide ${version} into public/pyodide/`);
