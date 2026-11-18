import type { Unit } from '../../types';
import { lesson as pgWhatIs } from './pg-what-is';
import { lesson as pgFirstWindow } from './pg-first-window';
import { lesson as pgGameLoop } from './pg-game-loop';

export const unit: Unit = {
  id: "pg-u01-meet-pygame",
  title: "Meet pygame",
  description: "What pygame is and what it is for, setting it up, opening a window, and the game loop that drives every game.",
  icon: "🕹️",
  level: "Beginner",
  lessons: [pgWhatIs, pgFirstWindow, pgGameLoop],
};
