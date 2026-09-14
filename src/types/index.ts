export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dayKey: string; // 'YYYY-MM-DD'
  weekStart: string; // 'YYYY-MM-DD' (Monday)
  /**
   * Bullet-journal migration. The row keeps its original dayKey; this points at
   * the day it was moved to, so the `>` trace survives on the day it left.
   * null = never migrated.
   */
  migratedTo: string | null;
}

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>; // 'YYYY-MM-DD' -> boolean
  createdAt: string;
}

export interface WeekData {
  weekStart: string;
  tasks: Task[];
}

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

// 1 = pas ouf … 5 = super
export type MoodValue = 1 | 2 | 3 | 4 | 5;

export type EmotionSlot = 'matin' | 'apresmidi' | 'soir';
export type EmotionId =
  | 'heureux' | 'confiant' | 'energise' | 'concentre' | 'inspire'
  | 'joueur' | 'enjoleur' | 'bien' | 'blase' | 'hebete'
  | 'embarrasse' | 'apeure' | 'malaaise' | 'tendu' | 'en-colere' | 'triste';

/** Fixed color legend for periods — travel/difficult/arc/other, never derived
 *  or user-picked, so the same category always reads the same color. */
export type PeriodCategory = 'travel' | 'difficult' | 'arc' | 'other';

/** A named span on the mood timeline ("breakup", "new job", ...). Spans can
 *  overlap — they annotate the same history from different angles at once. */
export interface LifePeriod {
  id: string;
  name: string;
  startDay: string; // 'YYYY-MM-DD', inclusive
  endDay: string; // 'YYYY-MM-DD', inclusive
  category: PeriodCategory;
}

export interface AppData {
  weeks: Record<string, WeekData>;
  habits: Habit[];
  todos: Todo[];
  moods: Record<string, MoodValue>;
  emotionalCheckins: Record<string, Partial<Record<EmotionSlot, EmotionId>>>;
  lifePeriods: LifePeriod[];
  allTimeStats: {
    totalTasksCompleted: number;
    bestWeekCount: number;
    bestWeekStart: string;
    longestHabitStreak: number;
    longestHabitName: string;
  };
}

export type Section = 'today' | 'dashboard' | 'weekly' | 'habits' | 'stats';
