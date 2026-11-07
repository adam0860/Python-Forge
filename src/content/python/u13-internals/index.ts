import type { Unit } from '../../types';
import { lesson as pyObjectModel } from './py-object-model';
import { lesson as pyMemory } from './py-memory';
import { lesson as pyTypingAdvanced } from './py-typing-advanced';
import { lesson as pyDescriptorsMetaclasses } from './py-descriptors-metaclasses';
import { lesson as pyBytecode } from './py-bytecode';

export const unit: Unit = {
  id: "py-u13-internals",
  title: "Python Under the Hood",
  description: "The object model, memory management, advanced typing, descriptors and metaclasses, bytecode and performance.",
  icon: "🔬",
  level: "Advanced",
  lessons: [pyObjectModel, pyMemory, pyTypingAdvanced, pyDescriptorsMetaclasses, pyBytecode],
};
