import type { Unit } from '../../types';
import { lesson as pgProjectPlan } from './pg-project-plan';
import { lesson as pgProjectBuild } from './pg-project-build';
import { lesson as pgProjectFinish } from './pg-project-finish';

export const unit: Unit = {
  id: "pg-u07-capstone",
  title: "Capstone: Build a Complete Game",
  description: "Plan, build and finish a complete arcade shooter, Star Defender, with states, scoring, sound hooks, a high-score file and tested game logic.",
  icon: "🚀",
  level: "Expert",
  lessons: [pgProjectPlan, pgProjectBuild, pgProjectFinish],
};
