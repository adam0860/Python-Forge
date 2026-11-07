import type { Unit } from '../../types';
import { lesson as pyHistory } from './py-history';
import { lesson as pyHowItWorks } from './py-how-it-works';
import { lesson as pyUses } from './py-uses';
import { lesson as pySetup } from './py-setup';
import { lesson as pyDocs } from './py-docs';

export const unit: Unit = {
  id: "py-u01-meet-python",
  title: "Meet Python",
  description: "Where Python came from, how it actually runs your code, what it is used for, how to set it up, and where to find answers.",
  icon: "🐍",
  level: "Beginner",
  lessons: [pyHistory, pyHowItWorks, pyUses, pySetup, pyDocs],
};
