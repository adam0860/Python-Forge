import type { CheatSheet } from '../types';
import { pythonCheatSheets } from './python';
import { pymlCheatSheets } from './pyml';

export const cheatSheets: CheatSheet[] = [...pythonCheatSheets, ...pymlCheatSheets];
