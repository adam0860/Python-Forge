import type { Unit } from '../../types';
import { lesson as tkWhatIs } from './tk-what-is';
import { lesson as tkFirstWindow } from './tk-first-window';
import { lesson as tkEventLoop } from './tk-event-loop';

export const unit: Unit = {
  id: "tk-u01-meet-tkinter",
  title: "Meet tkinter",
  description: "What tkinter is and what it is for, how a window comes to life, and the event loop that every GUI program is built around.",
  icon: "🪟",
  level: "Beginner",
  lessons: [tkWhatIs, tkFirstWindow, tkEventLoop],
};
