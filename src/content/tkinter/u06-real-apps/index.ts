import type { Unit } from '../../types';
import { lesson as tkOop } from './tk-oop';
import { lesson as tkSeparation } from './tk-separation';
import { lesson as tkProjectEditor } from './tk-project-editor';
import { lesson as tkPackaging } from './tk-packaging';
import { lesson as tkCapstone } from './tk-capstone';

export const unit: Unit = {
  id: "tk-u06-real-apps",
  title: "Building Real Apps",
  description: "Structuring a GUI with classes, separating logic from the interface so it can be tested, a text editor project, packaging an .exe, and a database-backed capstone.",
  icon: "🏗️",
  level: "Advanced",
  lessons: [tkOop, tkSeparation, tkProjectEditor, tkPackaging, tkCapstone],
};
