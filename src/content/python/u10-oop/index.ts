import type { Unit } from '../../types';
import { lesson as pyClasses } from './py-classes';
import { lesson as pyAttributesMethods } from './py-attributes-methods';
import { lesson as pyInheritance } from './py-inheritance';
import { lesson as pyDunder } from './py-dunder';
import { lesson as pyProperties } from './py-properties';
import { lesson as pyDataclasses } from './py-dataclasses';
import { lesson as pyAbcProtocols } from './py-abc-protocols';

export const unit: Unit = {
  id: "py-u10-oop",
  title: "Object-Oriented Python",
  description: "Classes and objects, methods, inheritance and composition, special methods, properties, dataclasses, enums, ABCs and protocols.",
  icon: "🏗️",
  level: "Intermediate",
  lessons: [pyClasses, pyAttributesMethods, pyInheritance, pyDunder, pyProperties, pyDataclasses, pyAbcProtocols],
};
