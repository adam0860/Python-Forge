import type { Unit } from '../../types';
import { lesson as pyFunctions } from './py-functions';
import { lesson as pyParameters } from './py-parameters';
import { lesson as pyScope } from './py-scope';
import { lesson as pyFirstClass } from './py-first-class';
import { lesson as pyRecursion } from './py-recursion';
import { lesson as pyDocstringsHints } from './py-docstrings-hints';

export const unit: Unit = {
  id: "py-u06-functions",
  title: "Functions",
  description: "Defining functions, every kind of parameter, scope, functions as values, lambdas, recursion, docstrings and type hints.",
  icon: "🧩",
  level: "Intermediate",
  lessons: [pyFunctions, pyParameters, pyScope, pyFirstClass, pyRecursion, pyDocstringsHints],
};
