import type { GlossaryEntry } from '../../types';

// Glossary terms introduced by this unit that are NOT in scripts/glossary-master.ts.
export const glossary: GlossaryEntry[] = [
  {
    id: 'sys-path',
    term: 'sys.path',
    course: 'python',
    category: 'Modules and Tools',
    short: 'The list of folders (and zip files) Python searches, in order, when you write `import name`. It starts with the script’s folder, then the standard library, then installed packages (site-packages).',
    see: ['module', 'package'],
  },
  {
    id: 'circular-import',
    term: 'Circular import',
    course: 'python',
    category: 'Modules and Tools',
    short: 'Two modules that import each other, so one runs while the other is only half-loaded. It usually shows up as an `ImportError` or missing attribute; the fix is to restructure or import inside a function.',
    see: ['module'],
  },
  {
    id: 'dependency',
    term: 'Dependency',
    course: 'python',
    category: 'Modules and Tools',
    short: 'A third-party package your project needs in order to run. Dependencies are declared (for example in `pyproject.toml` or `requirements.txt`) and installed with `pip` or another package manager.',
    see: ['pip', 'pypi'],
  },
  {
    id: 'entry-point',
    term: 'Entry point',
    course: 'python',
    category: 'Modules and Tools',
    short: 'The place where a program starts running: a script launched with `python main.py`, a package run with `python -m package`, or a command defined in `pyproject.toml` that calls a function.',
    see: ['script', 'package'],
  },
];
