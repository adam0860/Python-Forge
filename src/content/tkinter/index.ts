import type { Course } from '../types';
import { unit as u01 } from './u01-meet-tkinter';
import { unit as u02 } from './u02-widgets';
import { unit as u03 } from './u03-layout';
import { unit as u04 } from './u04-interaction';
import { unit as u05 } from './u05-graphics';
import { unit as u06 } from './u06-real-apps';

export const tkinterCourse: Course = {
  id: "tkinter",
  title: "Desktop Apps with tkinter",
  short: "tkinter",
  subtitle: "Windows, widgets, layout, events, the canvas and real applications",
  description: "What tkinter is and what it is for, then everything needed to build real desktop programs: the event loop, widgets and tk variables, the pack, grid and place layout managers, events and callbacks, dialogs and menus, timers and threads, the canvas, themed ttk widgets, structuring and testing a GUI, packaging an .exe, and two complete projects.",
  units: [u01, u02, u03, u04, u05, u06],
};
