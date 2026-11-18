import type { Unit } from '../../types';
import { lesson as tkLabelsButtons } from './tk-labels-buttons';
import { lesson as tkEntryText } from './tk-entry-text';
import { lesson as tkChoices } from './tk-choices';
import { lesson as tkVariables } from './tk-variables';
import { lesson as tkLists } from './tk-lists';

export const unit: Unit = {
  id: "tk-u02-widgets",
  title: "Widgets",
  description: "The building blocks of an interface: labels and buttons, text entry, checkboxes, radio buttons, sliders, tk variables, lists and scrollbars.",
  icon: "🎛️",
  level: "Beginner",
  lessons: [tkLabelsButtons, tkEntryText, tkChoices, tkVariables, tkLists],
};
