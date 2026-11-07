import type { Unit } from '../../types';
import { lesson as mlCnns } from './ml-cnns';
import { lesson as mlTrainingTricks } from './ml-training-tricks';
import { lesson as mlSequences } from './ml-sequences';
import { lesson as mlTransformers } from './ml-transformers';
import { lesson as mlTransferLearning } from './ml-transfer-learning';

export const unit: Unit = {
  id: "ml-u08-deep-learning",
  title: "Deep Learning",
  description: "Convolutional networks, the tricks that make deep networks train, sequence models, attention and transformers, and transfer learning.",
  icon: "🏛️",
  level: "Advanced",
  lessons: [mlCnns, mlTrainingTricks, mlSequences, mlTransformers, mlTransferLearning],
};
