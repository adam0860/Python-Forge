import type { GlossaryEntry } from '../types';
import { pythonGlossary } from './python';
import { pymlGlossary } from './pyml';
import { glossary as python_u01 } from '../python/u01-meet-python/glossary';
import { glossary as python_u02 } from '../python/u02-first-steps/glossary';
import { glossary as python_u03 } from '../python/u03-decisions/glossary';
import { glossary as python_u04 } from '../python/u04-loops/glossary';
import { glossary as python_u05 } from '../python/u05-collections/glossary';
import { glossary as python_u06 } from '../python/u06-functions/glossary';
import { glossary as python_u07 } from '../python/u07-text/glossary';
import { glossary as python_u08 } from '../python/u08-errors-files/glossary';
import { glossary as python_u09 } from '../python/u09-modules/glossary';
import { glossary as python_u10 } from '../python/u10-oop/glossary';
import { glossary as python_u11 } from '../python/u11-iteration/glossary';
import { glossary as python_u12 } from '../python/u12-advanced-functions/glossary';
import { glossary as python_u13 } from '../python/u13-internals/glossary';
import { glossary as python_u14 } from '../python/u14-concurrency/glossary';
import { glossary as python_u15 } from '../python/u15-professional/glossary';
import { glossary as pyml_u01 } from '../pyml/u01-landscape/glossary';
import { glossary as pyml_u02 } from '../pyml/u02-math/glossary';
import { glossary as pyml_u03 } from '../pyml/u03-numpy/glossary';
import { glossary as pyml_u04 } from '../pyml/u04-data/glossary';
import { glossary as pyml_u05 } from '../pyml/u05-classic-ml/glossary';
import { glossary as pyml_u06 } from '../pyml/u06-neural-nets/glossary';
import { glossary as pyml_u07 } from '../pyml/u07-pytorch/glossary';
import { glossary as pyml_u08 } from '../pyml/u08-deep-learning/glossary';
import { glossary as pyml_u09 } from '../pyml/u09-rl/glossary';
import { glossary as pyml_u10 } from '../pyml/u10-game-ai/glossary';
import { glossary as pyml_u11 } from '../pyml/u11-applied/glossary';

export const glossary: GlossaryEntry[] = [
  ...pythonGlossary,
  ...pymlGlossary,
  ...python_u01,
  ...python_u02,
  ...python_u03,
  ...python_u04,
  ...python_u05,
  ...python_u06,
  ...python_u07,
  ...python_u08,
  ...python_u09,
  ...python_u10,
  ...python_u11,
  ...python_u12,
  ...python_u13,
  ...python_u14,
  ...python_u15,
  ...pyml_u01,
  ...pyml_u02,
  ...pyml_u03,
  ...pyml_u04,
  ...pyml_u05,
  ...pyml_u06,
  ...pyml_u07,
  ...pyml_u08,
  ...pyml_u09,
  ...pyml_u10,
  ...pyml_u11,
];
