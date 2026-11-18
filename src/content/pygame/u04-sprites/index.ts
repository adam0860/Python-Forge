import type { Unit } from '../../types';
import { lesson as pgSprites } from './pg-sprites';
import { lesson as pgCollisions } from './pg-collisions';
import { lesson as pgSpawning } from './pg-spawning';
import { lesson as pgBreakout } from './pg-breakout';

export const unit: Unit = {
  id: "pg-u04-sprites",
  title: "Sprites, Collisions and a First Game",
  description: "Sprite classes and groups, collision detection, timers and spawning, and your first complete game: Breakout.",
  icon: "👾",
  level: "Intermediate",
  lessons: [pgSprites, pgCollisions, pgSpawning, pgBreakout],
};
