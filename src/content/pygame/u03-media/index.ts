import type { Unit } from '../../types';
import { lesson as pgImages } from './pg-images';
import { lesson as pgText } from './pg-text';
import { lesson as pgSound } from './pg-sound';
import { lesson as pgAnimation } from './pg-animation';

export const unit: Unit = {
  id: "pg-u03-media",
  title: "Images, Text and Sound",
  description: "Loading and transforming images, rendering text, playing sound and music, and animating with sprite sheets.",
  icon: "🖼️",
  level: "Intermediate",
  lessons: [pgImages, pgText, pgSound, pgAnimation],
};
