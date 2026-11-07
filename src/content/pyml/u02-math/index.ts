import type { Unit } from '../../types';
import { lesson as mlVectorsMatrices } from './ml-vectors-matrices';
import { lesson as mlDerivativesGradients } from './ml-derivatives-gradients';
import { lesson as mlProbability } from './ml-probability';

export const unit: Unit = {
  id: "ml-u02-math",
  title: "The Math You Need",
  description: "Vectors, matrices and tensors; derivatives, gradients and the chain rule; and the probability behind every model.",
  icon: "📐",
  level: "Beginner",
  lessons: [mlVectorsMatrices, mlDerivativesGradients, mlProbability],
};
