import type { Unit } from '../../types';
import { lesson as pgStates } from './pg-states';
import { lesson as pgUi } from './pg-ui';
import { lesson as pgTilemaps } from './pg-tilemaps';
import { lesson as pgPhysics } from './pg-physics';
import { lesson as pgEnemyAi } from './pg-enemy-ai';

export const unit: Unit = {
  id: "pg-u05-patterns",
  title: "Game Design Patterns",
  description: "Game states and scenes, menus and a HUD, tile maps and cameras, platformer physics and enemy AI with pathfinding.",
  icon: "🧱",
  level: "Intermediate",
  lessons: [pgStates, pgUi, pgTilemaps, pgPhysics, pgEnemyAi],
};
