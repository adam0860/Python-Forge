import type { Unit } from '../../types';
import { lesson as mlLinearRegression } from './ml-linear-regression';
import { lesson as mlClassification } from './ml-classification';
import { lesson as mlEvaluation } from './ml-evaluation';
import { lesson as mlOverfitting } from './ml-overfitting';
import { lesson as mlTreesEnsembles } from './ml-trees-ensembles';
import { lesson as mlUnsupervised } from './ml-unsupervised';

export const unit: Unit = {
  id: "ml-u05-classic-ml",
  title: "Classic Machine Learning",
  description: "Regression, classification, evaluation, regularization, tree ensembles and unsupervised learning with scikit-learn.",
  icon: "🌳",
  level: "Intermediate",
  lessons: [mlLinearRegression, mlClassification, mlEvaluation, mlOverfitting, mlTreesEnsembles, mlUnsupervised],
};
