import type { Unit } from '../../types';
import { lesson as mlNeurons } from './ml-neurons';
import { lesson as mlGradientDescent } from './ml-gradient-descent';
import { lesson as mlBackprop } from './ml-backprop';
import { lesson as mlNnFromScratch } from './ml-nn-from-scratch';

export const unit: Unit = {
  id: "ml-u06-neural-nets",
  title: "Neural Networks from Scratch",
  description: "Neurons and activations, loss and gradient descent, backpropagation, and a complete neural network written in NumPy.",
  icon: "🧠",
  level: "Intermediate",
  lessons: [mlNeurons, mlGradientDescent, mlBackprop, mlNnFromScratch],
};
