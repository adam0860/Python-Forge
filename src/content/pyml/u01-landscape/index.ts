import type { Unit } from '../../types';
import { lesson as mlHistory } from './ml-history';
import { lesson as mlWhatIsMl } from './ml-what-is-ml';
import { lesson as mlEcosystem } from './ml-ecosystem';
import { lesson as mlSetup } from './ml-setup';

export const unit: Unit = {
  id: "ml-u01-landscape",
  title: "The AI and ML Landscape",
  description: "A history of AI, what machine learning really is, the Python ML ecosystem, and setting up a GPU-ready environment.",
  icon: "🗺️",
  level: "Beginner",
  lessons: [mlHistory, mlWhatIsMl, mlEcosystem, mlSetup],
};
