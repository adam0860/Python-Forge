import type { Unit } from '../../types';
import { lesson as pyBooleans } from './py-booleans';
import { lesson as pyIf } from './py-if';
import { lesson as pyLogicTruthiness } from './py-logic-truthiness';
import { lesson as pyMatch } from './py-match';

export const unit: Unit = {
  id: "py-u03-decisions",
  title: "Making Decisions",
  description: "Booleans and comparisons, if/elif/else, logical operators, truthiness, and structural pattern matching with match.",
  icon: "🔀",
  level: "Beginner",
  lessons: [pyBooleans, pyIf, pyLogicTruthiness, pyMatch],
};
