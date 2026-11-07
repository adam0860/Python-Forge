import type { Unit } from '../../types';
import { lesson as pyIterators } from './py-iterators';
import { lesson as pyGenerators } from './py-generators';
import { lesson as pyItertools } from './py-itertools';
import { lesson as pyFunctools } from './py-functools';

export const unit: Unit = {
  id: "py-u11-iteration",
  title: "Iterators and Generators",
  description: "The iterator protocol, generators and yield, lazy pipelines with itertools, and functools.",
  icon: "⚙️",
  level: "Advanced",
  lessons: [pyIterators, pyGenerators, pyItertools, pyFunctools],
};
