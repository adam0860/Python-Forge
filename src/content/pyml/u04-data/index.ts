import type { Unit } from '../../types';
import { lesson as mlPandas } from './ml-pandas';
import { lesson as mlVisualization } from './ml-visualization';
import { lesson as mlDataPrep } from './ml-data-prep';

export const unit: Unit = {
  id: "ml-u04-data",
  title: "Working with Data",
  description: "pandas DataFrames, plotting with matplotlib, and preparing data so models can learn from it.",
  icon: "📊",
  level: "Intermediate",
  lessons: [mlPandas, mlVisualization, mlDataPrep],
};
