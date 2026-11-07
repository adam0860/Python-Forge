import type { Unit } from '../../types';
import { lesson as pyConcurrencyIntro } from './py-concurrency-intro';
import { lesson as pyThreading } from './py-threading';
import { lesson as pyMultiprocessing } from './py-multiprocessing';
import { lesson as pyAsyncio } from './py-asyncio';

export const unit: Unit = {
  id: "py-u14-concurrency",
  title: "Concurrency and Parallelism",
  description: "Concurrency vs parallelism, the GIL and free-threaded Python, threads, processes, and asyncio.",
  icon: "⚡",
  level: "Advanced",
  lessons: [pyConcurrencyIntro, pyThreading, pyMultiprocessing, pyAsyncio],
};
