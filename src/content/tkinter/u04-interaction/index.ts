import type { Unit } from '../../types';
import { lesson as tkEvents } from './tk-events';
import { lesson as tkCallbacks } from './tk-callbacks';
import { lesson as tkDialogs } from './tk-dialogs';
import { lesson as tkMenusWindows } from './tk-menus-windows';
import { lesson as tkTimersThreads } from './tk-timers-threads';

export const unit: Unit = {
  id: "tk-u04-interaction",
  title: "Events and Interaction",
  description: "Reacting to the keyboard and mouse, passing arguments to callbacks, standard dialogs, menus, extra windows, timers and keeping the interface responsive.",
  icon: "🖱️",
  level: "Intermediate",
  lessons: [tkEvents, tkCallbacks, tkDialogs, tkMenusWindows, tkTimersThreads],
};
