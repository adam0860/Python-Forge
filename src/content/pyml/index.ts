import type { Course } from '../types';
import { unit as u01 } from './u01-landscape';
import { unit as u02 } from './u02-math';
import { unit as u03 } from './u03-numpy';
import { unit as u04 } from './u04-data';
import { unit as u05 } from './u05-classic-ml';
import { unit as u06 } from './u06-neural-nets';
import { unit as u07 } from './u07-pytorch';
import { unit as u08 } from './u08-deep-learning';
import { unit as u09 } from './u09-rl';
import { unit as u10 } from './u10-game-ai';
import { unit as u11 } from './u11-applied';

export const pymlCourse: Course = {
  id: "pyml",
  title: "Python for AI & Machine Learning",
  short: "AI & ML",
  subtitle: "NumPy, scikit-learn, PyTorch, reinforcement learning and game AI",
  description: "From the math and data tools to classic machine learning, neural networks from scratch, PyTorch, deep learning and reinforcement learning — then putting it to work: training game-playing agents with Gymnasium, Stable-Baselines3 and RLGym, running models inside game engines, and building practical AI applications.",
  units: [u01, u02, u03, u04, u05, u06, u07, u08, u09, u10, u11],
};
