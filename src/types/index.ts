export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dayKey: string; // 'YYYY-MM-DD'
  weekStart: string; // 'YYYY-MM-DD' (Monday)
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

export interface AppData {
  weeks: Record<string, WeekData>;
  habits: Habit[];
  allTimeStats: {
    totalTasksCompleted: number;
    bestWeekCount: number;
    bestWeekStart: string;
    longestHabitStreak: number;
    longestHabitName: string;
  };
}

export type Section = 'dashboard' | 'weekly' | 'habits' | 'stats';
