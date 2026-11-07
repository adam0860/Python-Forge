import { courses } from '../content';
import { effectiveStreak, progressStore, type Progress } from './store';
import { sfx } from './sound';
import { toast } from './ui';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  test: (p: Progress) => boolean;
}

const completedCount = (p: Progress) => Object.keys(p.lessons).length;
const unitDone = (unitId: string) => (p: Progress) => {
  const unit = courses.flatMap((c) => c.units).find((u) => u.id === unitId);
  return !!unit && unit.lessons.every((l) => p.lessons[l.id]);
};
const courseDone = (courseId: string) => (p: Progress) => {
  const course = courses.find((c) => c.id === courseId);
  return !!course && course.units.every((u) => u.lessons.every((l) => p.lessons[l.id]));
};
const anyUnitDone = (p: Progress) => courses.some((c) => c.units.some((u) => u.lessons.every((l) => p.lessons[l.id])));

export const achievements: Achievement[] = [
  { id: 'first-lesson', icon: '🌱', title: 'First Steps', description: 'Complete your first lesson.', test: (p) => completedCount(p) >= 1 },
  { id: 'flawless', icon: '💎', title: 'Flawless', description: 'Finish a lesson with 100% accuracy.', test: (p) => p.stats.perfectLessons >= 1 },
  { id: 'five-perfect', icon: '🏹', title: 'Sharpshooter', description: 'Finish 5 lessons with 100% accuracy.', test: (p) => p.stats.perfectLessons >= 5 },
  { id: 'lessons-5', icon: '🔥', title: 'Warming Up', description: 'Complete 5 lessons.', test: (p) => completedCount(p) >= 5 },
  { id: 'lessons-25', icon: '📚', title: 'Dedicated', description: 'Complete 25 lessons.', test: (p) => completedCount(p) >= 25 },
  { id: 'lessons-60', icon: '🎓', title: 'Scholar', description: 'Complete 60 lessons.', test: (p) => completedCount(p) >= 60 },
  { id: 'lessons-100', icon: '🏛️', title: 'Centurion', description: 'Complete 100 lessons.', test: (p) => completedCount(p) >= 100 },
  { id: 'unit-cleared', icon: '🧱', title: 'Unit Cleared', description: 'Complete every lesson in a unit.', test: anyUnitDone },
  { id: 'streak-3', icon: '⚡', title: 'On a Roll', description: 'Reach a 3-day streak.', test: (p) => Math.max(p.streak.best, effectiveStreak(p)) >= 3 },
  { id: 'streak-7', icon: '📅', title: 'Week Warrior', description: 'Reach a 7-day streak.', test: (p) => p.streak.best >= 7 },
  { id: 'streak-30', icon: '🌋', title: 'Unstoppable', description: 'Reach a 30-day streak.', test: (p) => p.streak.best >= 30 },
  { id: 'xp-500', icon: '✨', title: 'XP Collector', description: 'Earn 500 XP.', test: (p) => p.xp >= 500 },
  { id: 'xp-2500', icon: '🌟', title: 'XP Hoarder', description: 'Earn 2,500 XP.', test: (p) => p.xp >= 2500 },
  { id: 'reviewer', icon: '🔁', title: 'Second Chances', description: 'Complete a practice session.', test: (p) => p.stats.practiceSessions >= 1 },
  { id: 'reviewer-10', icon: '🧠', title: 'Spaced Out', description: 'Complete 10 practice sessions.', test: (p) => p.stats.practiceSessions >= 10 },
  { id: 'hello-world', icon: '🐍', title: 'Hello, World', description: 'Finish the Meet Python unit.', test: unitDone('py-u01-meet-python') },
  { id: 'loop-de-loop', icon: '🔁', title: 'Loop-de-Loop', description: 'Finish the Loops unit.', test: unitDone('py-u04-loops') },
  { id: 'data-structurer', icon: '📦', title: 'Data Structurer', description: 'Finish the Collections unit.', test: unitDone('py-u05-collections') },
  { id: 'functional', icon: '🧩', title: 'Highly Functional', description: 'Finish the Functions unit.', test: unitDone('py-u06-functions') },
  { id: 'class-act', icon: '🏗️', title: 'Class Act', description: 'Finish the Object-Oriented Python unit.', test: unitDone('py-u10-oop') },
  { id: 'decorated', icon: '🎁', title: 'Decorated Veteran', description: 'Finish the Closures, Decorators and Context Managers unit.', test: unitDone('py-u12-advanced-functions') },
  { id: 'async-await', icon: '⚡', title: 'Awaited', description: 'Finish the Concurrency and Parallelism unit.', test: unitDone('py-u14-concurrency') },
  { id: 'pythonista', icon: '🏆', title: 'Pythonista', description: 'Complete the entire Python: Beginner to Advanced course.', test: courseDone('python') },
  { id: 'array-of-hope', icon: '🔢', title: 'Array of Hope', description: 'Finish the NumPy unit.', test: unitDone('ml-u03-numpy') },
  { id: 'backpropagated', icon: '🧠', title: 'Backpropagated', description: 'Finish Neural Networks from Scratch.', test: unitDone('ml-u06-neural-nets') },
  { id: 'torchbearer', icon: '🔥', title: 'Torchbearer', description: 'Finish the PyTorch unit.', test: unitDone('ml-u07-pytorch') },
  { id: 'reward-hacker', icon: '🎮', title: 'Reward Signal', description: 'Finish the Reinforcement Learning unit.', test: unitDone('ml-u09-rl') },
  { id: 'bot-builder', icon: '🕹️', title: 'Bot Builder', description: 'Finish the AI for Games unit.', test: unitDone('ml-u10-game-ai') },
  { id: 'ml-graduate', icon: '🎓', title: 'Machine Learner', description: 'Complete the entire Python for AI & Machine Learning course.', test: courseDone('pyml') },
  { id: 'runner', icon: '▶️', title: 'It Runs!', description: 'Run 25 pieces of code in the app.', test: (p) => (p.stats.codeRuns ?? 0) >= 25 },
  { id: 'runner-250', icon: '🚀', title: 'Code Machine', description: 'Run 250 pieces of code in the app.', test: (p) => (p.stats.codeRuns ?? 0) >= 250 },
  {
    id: 'night-owl',
    icon: '🦉',
    title: 'Night Owl',
    description: 'Complete a lesson after 10 pm.',
    test: (p) => Object.values(p.lessons).some((l) => new Date(l.completedAt).getHours() >= 22),
  },
  {
    id: 'early-bird',
    icon: '🐦',
    title: 'Early Bird',
    description: 'Complete a lesson before 7 am.',
    test: (p) => Object.values(p.lessons).some((l) => new Date(l.completedAt).getHours() < 7),
  },
];

/** Check for newly earned achievements, store them and announce them. */
export function checkAchievements(): Achievement[] {
  const p = progressStore.get();
  const fresh = achievements.filter((a) => !p.achievements[a.id] && a.test(p));
  if (fresh.length) {
    const now = Date.now();
    progressStore.set({ achievements: { ...p.achievements, ...Object.fromEntries(fresh.map((a) => [a.id, now])) } });
    fresh.forEach((a, i) =>
      setTimeout(() => {
        sfx.achievement();
        toast({ icon: a.icon, title: `Achievement unlocked: ${a.title}`, body: a.description, tone: 'achievement' }, 4200);
      }, 900 + i * 1200),
    );
  }
  return fresh;
}
