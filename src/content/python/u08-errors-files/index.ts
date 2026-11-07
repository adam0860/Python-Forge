import type { Unit } from '../../types';
import { lesson as pyExceptions } from './py-exceptions';
import { lesson as pyRaising } from './py-raising';
import { lesson as pyFiles } from './py-files';
import { lesson as pyPathlib } from './py-pathlib';
import { lesson as pyJsonCsv } from './py-json-csv';

export const unit: Unit = {
  id: "py-u08-errors-files",
  title: "Errors and Files",
  description: "Exceptions, raising and defining your own, reading and writing files, pathlib, and JSON/CSV data.",
  icon: "🛡️",
  level: "Intermediate",
  lessons: [pyExceptions, pyRaising, pyFiles, pyPathlib, pyJsonCsv],
};
