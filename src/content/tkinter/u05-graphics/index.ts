import type { Unit } from '../../types';
import { lesson as tkCanvas } from './tk-canvas';
import { lesson as tkCanvasAnimation } from './tk-canvas-animation';
import { lesson as tkTtk } from './tk-ttk';
import { lesson as tkStyling } from './tk-styling';

export const unit: Unit = {
  id: "tk-u05-graphics",
  title: "Drawing and Themed Widgets",
  description: "The Canvas for drawing and animation, the modern ttk widgets (Treeview, Notebook, Progressbar), fonts, colors, images and styling.",
  icon: "🎨",
  level: "Intermediate",
  lessons: [tkCanvas, tkCanvasAnimation, tkTtk, tkStyling],
};
