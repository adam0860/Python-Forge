import type { Unit } from '../../types';
import { lesson as pgStructure } from './pg-structure';
import { lesson as pgJuice } from './pg-juice';
import { lesson as pgSaveData } from './pg-save-data';
import { lesson as pgPerformance } from './pg-performance';
import { lesson as pgPackaging } from './pg-packaging';

export const unit: Unit = {
  id: "pg-u06-craft",
  title: "Craft and Polish",
  description: "Organising a game project, game feel (particles, shake, easing), saving scores and settings, performance and debugging, and packaging for Windows and the web.",
  icon: "✨",
  level: "Advanced",
  lessons: [pgStructure, pgJuice, pgSaveData, pgPerformance, pgPackaging],
};
