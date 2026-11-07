import type { Unit } from '../../types';
import { lesson as pyStringMethods } from './py-string-methods';
import { lesson as pyFormatting } from './py-formatting';
import { lesson as pyUnicodeBytes } from './py-unicode-bytes';
import { lesson as pyRegex } from './py-regex';

export const unit: Unit = {
  id: "py-u07-text",
  title: "Working with Text",
  description: "String methods in depth, f-string formatting, Unicode and bytes, and regular expressions.",
  icon: "🔤",
  level: "Intermediate",
  lessons: [pyStringMethods, pyFormatting, pyUnicodeBytes, pyRegex],
};
