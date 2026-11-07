import type { Unit } from '../../types';
import { lesson as pyPrintComments } from './py-print-comments';
import { lesson as pyVariables } from './py-variables';
import { lesson as pyNumbers } from './py-numbers';
import { lesson as pyStringsIntro } from './py-strings-intro';
import { lesson as pyInputConversion } from './py-input-conversion';

export const unit: Unit = {
  id: "py-u02-first-steps",
  title: "First Steps",
  description: "Your first programs: printing, variables and names, numbers and arithmetic, strings, input and converting between types.",
  icon: "✏️",
  level: "Beginner",
  lessons: [pyPrintComments, pyVariables, pyNumbers, pyStringsIntro, pyInputConversion],
};
