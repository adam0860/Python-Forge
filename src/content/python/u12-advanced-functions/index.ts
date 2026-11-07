import type { Unit } from '../../types';
import { lesson as pyClosures } from './py-closures';
import { lesson as pyDecorators } from './py-decorators';
import { lesson as pyDecoratorsAdvanced } from './py-decorators-advanced';
import { lesson as pyContextManagers } from './py-context-managers';

export const unit: Unit = {
  id: "py-u12-advanced-functions",
  title: "Closures, Decorators and Context Managers",
  description: "Closures, decorators from simple to parameterized, and context managers — the tools behind Flask routes, pytest fixtures and PyTorch's no_grad.",
  icon: "🎁",
  level: "Advanced",
  lessons: [pyClosures, pyDecorators, pyDecoratorsAdvanced, pyContextManagers],
};
