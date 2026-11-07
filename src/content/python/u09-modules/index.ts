import type { Unit } from '../../types';
import { lesson as pyModules } from './py-modules';
import { lesson as pyStdlibTour } from './py-stdlib-tour';
import { lesson as pyVenvPip } from './py-venv-pip';
import { lesson as pyProjectStructure } from './py-project-structure';

export const unit: Unit = {
  id: "py-u09-modules",
  title: "Modules, Packages and Tools",
  description: "Imports and modules, a tour of the standard library, virtual environments and package managers, and structuring a real project.",
  icon: "📚",
  level: "Intermediate",
  lessons: [pyModules, pyStdlibTour, pyVenvPip, pyProjectStructure],
};
