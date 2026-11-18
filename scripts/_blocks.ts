// dev: show code blocks of a lesson with numbered lines and annotation ranges
import { pathToFileURL } from 'node:url';
const file = process.argv[2];
const mod = await import(pathToFileURL(file).href);
const lesson = mod.lesson;
for (const [si, s] of lesson.steps.entries()) {
  if (s.kind !== 'concept') continue;
  for (const [bi, b] of s.blocks.entries()) {
    if (b.type !== 'code' || !b.annotations) continue;
    console.log(`--- step ${si} block ${bi}: ${b.title ?? ''}`);
    b.code.split('\n').forEach((l: string, i: number) => console.log(String(i + 1).padStart(3) + '  ' + l));
    for (const a of b.annotations) console.log(`   [${a.lines}] ${a.text.slice(0, 70)}`);
  }
}
