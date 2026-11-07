import type { Unit } from '../../types';
import { lesson as pyTesting } from './py-testing';
import { lesson as pyDebuggingLogging } from './py-debugging-logging';
import { lesson as pyProfiling } from './py-profiling';
import { lesson as pyPackaging } from './py-packaging';
import { lesson as pyCapstone } from './py-capstone';

export const unit: Unit = {
  id: "py-u15-professional",
  title: "Professional Python",
  description: "Testing with pytest, debugging and logging, profiling and optimization, packaging — and a capstone project that ties it all together.",
  icon: "🧪",
  level: "Expert",
  lessons: [pyTesting, pyDebuggingLogging, pyProfiling, pyPackaging, pyCapstone],
};
