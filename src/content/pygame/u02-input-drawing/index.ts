import type { Unit } from '../../types';
import { lesson as pgEvents } from './pg-events';
import { lesson as pgDrawing } from './pg-drawing';
import { lesson as pgRects } from './pg-rects';
import { lesson as pgMovement } from './pg-movement';
import { lesson as pgDeltaTime } from './pg-delta-time';
import { lesson as pgVectors } from './pg-vectors';

export const unit: Unit = {
  id: "pg-u02-input-drawing",
  title: "Input, Drawing and Movement",
  description: "Handling the keyboard and mouse, drawing shapes, Rect objects, moving things smoothly, frame-rate independence and vectors.",
  icon: "🎯",
  level: "Beginner",
  lessons: [pgEvents, pgDrawing, pgRects, pgMovement, pgDeltaTime, pgVectors],
};
