import type { CheatSheet } from '../types';
import { pythonCheatSheets } from './python';
import { pymlCheatSheets } from './pyml';
import { tkinterCheatSheets } from './tkinter';
import { pygameCheatSheets } from './pygame';

export const cheatSheets: CheatSheet[] = [...pythonCheatSheets, ...pymlCheatSheets, ...tkinterCheatSheets, ...pygameCheatSheets];
