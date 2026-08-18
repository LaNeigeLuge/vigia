import type { AppData, Habit, Task } from '../types';
import { formatDayKey, getWeekDays, getWeekStart, parseDayKey } from './dateUtils';
import { addDays } from 'date-fns';

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done.",
  "Don't watch the clock; do what it does. Keep going.",
  "The way to get started is to quit talking and begin doing.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Believe you can and you're halfway there.",
  "You miss 100% of the shots you don't take.",
  "Whether you think you can or you think you can't, you're right.",
  "Opportunities don't happen. You create them.",
  "It's not whether you get knocked down, it's whether you get up.",
  "Hard work beats talent when talent doesn't work hard.",
  "The only way to do great work is to love what you do.",
  "In the middle of every difficulty lies opportunity.",
  "Dream big, work hard, stay focused.",
  "Push yourself, because no one else is going to do it for you.",
];

export function getDailyQuote(): string {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
}

export function createDefaultAppData(): AppData {
  const weekStart = getWeekStart();
  const weekKey = formatDayKey(weekStart);

  return {
    weeks: { [weekKey]: { weekStart: weekKey, tasks: [] } },
    habits: [],
    todos: [],
    moods: {},
    emotionalCheckins: {},
    allTimeStats: {
      totalTasksCompleted: 0,
      bestWeekCount: 0,
      bestWeekStart: weekKey,
      longestHabitStreak: 0,
      longestHabitName: '',
    },
  };
}

export function getWeekTasks(data: AppData, weekKey: string): Task[] {
  return data.weeks[weekKey]?.tasks ?? [];
}

export function getDayTasks(data: AppData, weekKey: string, dayKey: string): Task[] {
  return getWeekTasks(data, weekKey).filter((t) => t.dayKey === dayKey);
}

export interface DayEntry {
  task: Task;
  /** True on the day the task left — render it as a struck-through `>`. */
  migratedAway: boolean;
}

/**
 * Every row that belongs on `dayKey`: the tasks written there, plus the ones
 * migrated in from another day. A migrated task shows twice — as `>` on the day
 * it left, and as a live entry on the day it landed.
 *
 * Scans across weeks because a migration can cross a Sunday→Monday boundary,
 * which the per-week index can't express.
 */
// ponytail: full scan of every task — a personal log is a few thousand rows.
// Build a dayKey index if that ever shows up in a profile.
export function getDayEntries(data: AppData, dayKey: string): DayEntry[] {
  const entries: DayEntry[] = [];
  for (const week of Object.values(data.weeks)) {
    for (const task of week.tasks) {
      if (task.migratedTo === dayKey && task.dayKey !== dayKey) {
        entries.push({ task, migratedAway: false });
      } else if (task.dayKey === dayKey) {
        entries.push({ task, migratedAway: !!task.migratedTo });
      }
    }
  }
  return entries;
}

export function getWeekCompletionRate(data: AppData, weekKey: string): { done: number; total: number } {
  const tasks = getWeekTasks(data, weekKey);
  return {
    done: tasks.filter((t) => t.completed).length,
    total: tasks.length,
  };
}

export function getDayCompletionRate(data: AppData, weekKey: string, dayKey: string): { done: number; total: number } {
  const tasks = getDayTasks(data, weekKey, dayKey);
  return {
    done: tasks.filter((t) => t.completed).length,
    total: tasks.length,
  };
}

export function getDayLevel(pct: number): { label: string; emoji: string } {
  if (pct <= 0) return { label: 'No tasks', emoji: '' };
  if (pct <= 25) return { label: 'Slow Start', emoji: '' };
  if (pct <= 50) return { label: 'Getting There', emoji: '' };
  if (pct <= 75) return { label: 'On Fire', emoji: '🔥' };
  return { label: 'Beast Mode', emoji: '💪' };
}

export function getHabitStreak(habit: Habit, asOf: Date = new Date()): number {
  let streak = 0;
  let day = asOf;
  while (true) {
    const key = formatDayKey(day);
    if (habit.completions[key]) {
      streak++;
      day = addDays(day, -1);
    } else {
      break;
    }
  }
  return streak;
}

export function getHabitWeekCompletion(habit: Habit, weekKey: string): { done: number; total: number } {
  const weekStart = parseDayKey(weekKey);
  const days = getWeekDays(weekStart);
  const done = days.filter((d) => habit.completions[formatDayKey(d)]).length;
  return { done, total: 7 };
}

export function updateTask(data: AppData, weekKey: string, taskId: string, changes: Partial<Task>): AppData {
  const weekData = data.weeks[weekKey];
  if (!weekData) return data;
  const updatedTasks = weekData.tasks.map((t) => (t.id === taskId ? { ...t, ...changes } : t));
  const justCompleted = changes.completed === true;
  const newStats = justCompleted
    ? {
      ...data.allTimeStats,
      totalTasksCompleted: data.allTimeStats.totalTasksCompleted + 1,
    }
    : data.allTimeStats;
  return {
    ...data,
    weeks: { ...data.weeks, [weekKey]: { ...weekData, tasks: updatedTasks } },
    allTimeStats: newStats,
  };
}

export function deleteTask(data: AppData, weekKey: string, taskId: string): AppData {
  const weekData = data.weeks[weekKey];
  if (!weekData) return data;
  return {
    ...data,
    weeks: {
      ...data.weeks,
      [weekKey]: { ...weekData, tasks: weekData.tasks.filter((t) => t.id !== taskId) },
    },
  };
}

export function addHabit(data: AppData, habit: Habit): AppData {
  return { ...data, habits: [...data.habits, habit] };
}

export function updateHabit(data: AppData, habitId: string, changes: Partial<Habit>): AppData {
  return {
    ...data,
    habits: data.habits.map((h) => (h.id === habitId ? { ...h, ...changes } : h)),
  };
}

export function deleteHabit(data: AppData, habitId: string): AppData {
  return { ...data, habits: data.habits.filter((h) => h.id !== habitId) };
}

export function toggleHabit(data: AppData, habitId: string, dayKey: string): AppData {
  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) return data;
  const newCompletions = { ...habit.completions, [dayKey]: !habit.completions[dayKey] };
  if (!newCompletions[dayKey]) delete newCompletions[dayKey];
  return updateHabit(data, habitId, { completions: newCompletions });
}

export function getLastFourWeekStarts(currentWeekKey: string): string[] {
  const weekStart = parseDayKey(currentWeekKey);
  return Array.from({ length: 4 }, (_, i) => formatDayKey(addDays(weekStart, -i * 7))).reverse();
}
