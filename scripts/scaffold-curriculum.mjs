// Generates the folder/file skeleton for every unit and lesson listed in
// scripts/curriculum.json. Existing lesson and glossary files are never
// overwritten, so it is safe to re-run after adding new lessons to the outline.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'scripts/curriculum.json'), 'utf8'));

const courseMeta = {
  python: {
    exportName: 'pythonCourse',
    title: 'Python: Beginner to Advanced',
    short: 'Python',
    subtitle: 'From your first print() to decorators, asyncio and professional tooling',
    description:
      'A complete path through Python: its history and how it really works, the core language, collections and functions, text, files and errors, object-oriented design, iterators and generators, decorators and context managers, internals, concurrency, testing and packaging — always explaining why.',
  },
  pyml: {
    exportName: 'pymlCourse',
    title: 'Python for AI & Machine Learning',
    short: 'AI & ML',
    subtitle: 'NumPy, scikit-learn, PyTorch, reinforcement learning and game AI',
    description:
      'From the math and data tools to classic machine learning, neural networks from scratch, PyTorch, deep learning and reinforcement learning — then putting it to work: training game-playing agents with Gymnasium, Stable-Baselines3 and RLGym, running models inside game engines, and building practical AI applications.',
  },
};

const q = (s) => JSON.stringify(s);
const camel = (id) => id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const glossaryImports = [];

for (const [courseId, units] of Object.entries(curriculum)) {
  const courseDir = path.join(root, 'src/content', courseId);
  fs.mkdirSync(courseDir, { recursive: true });
  const unitImports = [];
  units.forEach((u, ui) => {
    const unitDir = path.join(courseDir, u.dir);
    fs.mkdirSync(unitDir, { recursive: true });
    for (const [lessonId, title] of u.lessons) {
      const file = path.join(unitDir, `${lessonId}.ts`);
      if (!fs.existsSync(file)) {
        fs.writeFileSync(
          file,
          `import type { Lesson } from '../../types';

// STUB — replace this whole file with the finished lesson.
export const lesson: Lesson = {
  id: ${q(lessonId)},
  title: ${q(title)},
  summary: 'This lesson is being written.',
  minutes: 10,
  objectives: [],
  steps: [{ kind: 'concept', title: ${q(title)}, blocks: [{ type: 'p', text: 'Coming soon.' }] }],
  takeaways: [],
  reading: [],
};
`,
        );
      }
    }
    const imports = u.lessons
      .map(([lessonId]) => `import { lesson as ${camel(lessonId)} } from './${lessonId}';`)
      .join('\n');
    fs.writeFileSync(
      path.join(unitDir, 'index.ts'),
      `import type { Unit } from '../../types';
${imports}

export const unit: Unit = {
  id: ${q(u.id)},
  title: ${q(u.title)},
  description: ${q(u.description)},
  icon: ${q(u.icon)},
  level: ${q(u.level)},
  lessons: [${u.lessons.map(([l]) => camel(l)).join(', ')}],
};
`,
    );
    const gfile = path.join(unitDir, 'glossary.ts');
    if (!fs.existsSync(gfile)) {
      fs.writeFileSync(
        gfile,
        `import type { GlossaryEntry } from '../../types';

// Glossary terms introduced by this unit that are NOT in scripts/glossary-master.ts.
export const glossary: GlossaryEntry[] = [];
`,
      );
    }
    const alias = `u${String(ui + 1).padStart(2, '0')}`;
    unitImports.push([alias, u.dir]);
    glossaryImports.push([`${courseId}_${alias}`, `../${courseId}/${u.dir}/glossary`]);
  });
  const meta = courseMeta[courseId];
  fs.writeFileSync(
    path.join(courseDir, 'index.ts'),
    `import type { Course } from '../types';
${unitImports.map(([a, d]) => `import { unit as ${a} } from './${d}';`).join('\n')}

export const ${meta.exportName}: Course = {
  id: ${q(courseId)},
  title: ${q(meta.title)},
  short: ${q(meta.short)},
  subtitle: ${q(meta.subtitle)},
  description: ${q(meta.description)},
  units: [${unitImports.map(([a]) => a).join(', ')}],
};
`,
  );
}

const coreFiles = Object.keys(courseMeta).map((c) => [c, `${c}Glossary`, `${c}CheatSheets`]);
fs.mkdirSync(path.join(root, 'src/content/glossary'), { recursive: true });
fs.mkdirSync(path.join(root, 'src/content/cheatsheets'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'src/content/glossary/index.ts'),
  `import type { GlossaryEntry } from '../types';
${coreFiles.map(([c, g]) => `import { ${g} } from './${c}';`).join('\n')}
${glossaryImports.map(([a, p]) => `import { glossary as ${a} } from '${p}';`).join('\n')}

export const glossary: GlossaryEntry[] = [
${coreFiles.map(([, g]) => `  ...${g},`).join('\n')}
${glossaryImports.map(([a]) => `  ...${a},`).join('\n')}
];
`,
);
fs.writeFileSync(
  path.join(root, 'src/content/cheatsheets/index.ts'),
  `import type { CheatSheet } from '../types';
${coreFiles.map(([c, , s]) => `import { ${s} } from './${c}';`).join('\n')}

export const cheatSheets: CheatSheet[] = [${coreFiles.map(([, , s]) => `...${s}`).join(', ')}];
`,
);
for (const [c, g, sh] of coreFiles) {
  const gp = path.join(root, 'src/content/glossary', `${c}.ts`);
  if (!fs.existsSync(gp)) fs.writeFileSync(gp, `import type { GlossaryEntry } from '../types';\n\nexport const ${g}: GlossaryEntry[] = [];\n`);
  const sp = path.join(root, 'src/content/cheatsheets', `${c}.ts`);
  if (!fs.existsSync(sp)) fs.writeFileSync(sp, `import type { CheatSheet } from '../types';\n\nexport const ${sh}: CheatSheet[] = [];\n`);
}
console.log('Scaffold complete.');
