import type { Unit } from '../../types';
import { lesson as tkPack } from './tk-pack';
import { lesson as tkGrid } from './tk-grid';
import { lesson as tkPlaceFrames } from './tk-place-frames';

export const unit: Unit = {
  id: "tk-u03-layout",
  title: "Layout",
  description: "Placing widgets in a window: pack, grid and place, frames to group things, and layouts that resize gracefully.",
  icon: "📐",
  level: "Beginner",
  lessons: [tkPack, tkGrid, tkPlaceFrames],
};
