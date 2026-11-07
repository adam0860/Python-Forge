import type { Course } from '../types';
import { unit as u01 } from './u01-meet-python';
import { unit as u02 } from './u02-first-steps';
import { unit as u03 } from './u03-decisions';
import { unit as u04 } from './u04-loops';
import { unit as u05 } from './u05-collections';
import { unit as u06 } from './u06-functions';
import { unit as u07 } from './u07-text';
import { unit as u08 } from './u08-errors-files';
import { unit as u09 } from './u09-modules';
import { unit as u10 } from './u10-oop';
import { unit as u11 } from './u11-iteration';
import { unit as u12 } from './u12-advanced-functions';
import { unit as u13 } from './u13-internals';
import { unit as u14 } from './u14-concurrency';
import { unit as u15 } from './u15-professional';

export const pythonCourse: Course = {
  id: "python",
  title: "Python: Beginner to Advanced",
  short: "Python",
  subtitle: "From your first print() to decorators, asyncio and professional tooling",
  description: "A complete path through Python: its history and how it really works, the core language, collections and functions, text, files and errors, object-oriented design, iterators and generators, decorators and context managers, internals, concurrency, testing and packaging — always explaining why.",
  units: [u01, u02, u03, u04, u05, u06, u07, u08, u09, u10, u11, u12, u13, u14, u15],
};
