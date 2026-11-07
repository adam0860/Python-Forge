import type { Unit } from '../../types';
import { lesson as pyWhile } from './py-while';
import { lesson as pyForRange } from './py-for-range';
import { lesson as pyLoopControl } from './py-loop-control';
import { lesson as pyLoopPatterns } from './py-loop-patterns';

export const unit: Unit = {
  id: "py-u04-loops",
  title: "Loops",
  description: "Repeating work with while and for, range(), break and continue, the loop else clause, and the patterns every programmer reuses.",
  icon: "🔁",
  level: "Beginner",
  lessons: [pyWhile, pyForRange, pyLoopControl, pyLoopPatterns],
};
