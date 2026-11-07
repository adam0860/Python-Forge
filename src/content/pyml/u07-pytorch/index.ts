import type { Unit } from '../../types';
import { lesson as mlTensors } from './ml-tensors';
import { lesson as mlAutograd } from './ml-autograd';
import { lesson as mlNnModule } from './ml-nn-module';
import { lesson as mlTrainingLoop } from './ml-training-loop';
import { lesson as mlDatasets } from './ml-datasets';
import { lesson as mlSavingExporting } from './ml-saving-exporting';

export const unit: Unit = {
  id: "ml-u07-pytorch",
  title: "PyTorch",
  description: "Tensors and GPUs, autograd, nn.Module, the training loop, datasets and data loaders, and saving and exporting models.",
  icon: "🔥",
  level: "Advanced",
  lessons: [mlTensors, mlAutograd, mlNnModule, mlTrainingLoop, mlDatasets, mlSavingExporting],
};
