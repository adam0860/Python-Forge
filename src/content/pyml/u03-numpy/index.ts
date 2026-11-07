import type { Unit } from '../../types';
import { lesson as mlNumpyArrays } from './ml-numpy-arrays';
import { lesson as mlNumpyBroadcasting } from './ml-numpy-broadcasting';
import { lesson as mlNumpyLinalg } from './ml-numpy-linalg';

export const unit: Unit = {
  id: "ml-u03-numpy",
  title: "NumPy",
  description: "Fast numerical arrays: creation, indexing, vectorization, broadcasting, linear algebra and random numbers.",
  icon: "🔢",
  level: "Beginner",
  lessons: [mlNumpyArrays, mlNumpyBroadcasting, mlNumpyLinalg],
};
