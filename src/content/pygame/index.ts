import type { Course } from '../types';
import { unit as u01 } from './u01-meet-pygame';
import { unit as u02 } from './u02-input-drawing';
import { unit as u03 } from './u03-media';
import { unit as u04 } from './u04-sprites';
import { unit as u05 } from './u05-patterns';
import { unit as u06 } from './u06-craft';
import { unit as u07 } from './u07-capstone';

export const pygameCourse: Course = {
  id: "pygame",
  title: "Game Development with pygame",
  short: "pygame",
  subtitle: "The game loop, sprites, collisions, sound, physics and a complete game",
  description: "How to make a functional game with pygame: the window and game loop, input, drawing, rects and vectors, images, text and sound, sprites and collisions, game states and menus, tile maps, platformer physics and enemy AI, polish and packaging, ending with a complete arcade shooter built step by step.",
  units: [u01, u02, u03, u04, u05, u06, u07],
};
