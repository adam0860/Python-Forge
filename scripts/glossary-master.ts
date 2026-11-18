/*
 * Master list of core glossary ids: every term defined in
 * src/content/glossary/<course>.ts. Lesson authors may link any of these with
 * [[id]] or [[id|display text]]. A term that is missing can be added to the core
 * glossary file (shared vocabulary) or to the unit's own glossary.ts.
 */
import { pythonGlossary } from '../src/content/glossary/python';
import { pymlGlossary } from '../src/content/glossary/pyml';
import { tkinterGlossary } from '../src/content/glossary/tkinter';
import { pygameGlossary } from '../src/content/glossary/pygame';

export const MASTER_GLOSSARY_IDS: Record<string, string> = Object.fromEntries(
  [...pythonGlossary, ...pymlGlossary, ...tkinterGlossary, ...pygameGlossary].map((g) => [g.id, g.term]),
);
