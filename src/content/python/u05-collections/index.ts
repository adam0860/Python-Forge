import type { Unit } from '../../types';
import { lesson as pyLists } from './py-lists';
import { lesson as pyListOps } from './py-list-ops';
import { lesson as pyTuples } from './py-tuples';
import { lesson as pyDicts } from './py-dicts';
import { lesson as pySets } from './py-sets';
import { lesson as pyComprehensions } from './py-comprehensions';

export const unit: Unit = {
  id: "py-u05-collections",
  title: "Collections",
  description: "Lists, tuples, dictionaries and sets — Python's built-in data structures — and comprehensions to build them in one line.",
  icon: "📦",
  level: "Beginner",
  lessons: [pyLists, pyListOps, pyTuples, pyDicts, pySets, pyComprehensions],
};
