/**
 * Supabase DB layer.
 * All write functions require userId (auth.uid()) to satisfy RLS policies.
 *
 * Tables: tasks, habits, habit_logs  (see supabase/schema.sql)
 */
import { supabase } from './supabase';
import type { AppData, Habit, MoodValue, Task } from '../types';
import { formatDayKey, getWeekStartKey } from '../utils/dateUtils';
import { addDays } from 'date-fns';

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAllData(userId: string): Promise<AppData> {
  const [tasksRes, habitsRes, logsRes, moodsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('habits').select('*').eq('user_id', userId).order('sort_order, created_at'),
    supabase.from('habit_logs').select('*').eq('user_id', userId),
    supabase.from('mood_logs').select('day_key, mood').eq('user_id', userId),
  ]);

  if (tasksRes.error)  console.error('[db] tasks load error',  tasksRes.error);
  if (habitsRes.error) console.error('[db] habits load error', habitsRes.error);
  if (logsRes.error)   console.error('[db] logs load error',   logsRes.error);
  if (moodsRes.error)  console.error('[db] moods load error',  moodsRes.error);

  const moods: AppData['moods'] = {};
  for (const row of moodsRes.data ?? []) {
    moods[row.day_key as string] = row.mood as MoodValue;
  }

  // Build weeks map from tasks
  const weeks: AppData['weeks'] = {};
  const currentWeekKey = getWeekStartKey();
  weeks[currentWeekKey] = { weekStart: currentWeekKey, tasks: [] };

  for (const row of tasksRes.data ?? []) {
    const weekKey = row.week_start as string;
    if (!weeks[weekKey]) weeks[weekKey] = { weekStart: weekKey, tasks: [] };
    weeks[weekKey].tasks.push({
      id:        row.id        as string,
      text:      row.text      as string,
      completed: row.completed as boolean,
      dayKey:    row.day_key   as string,
      weekStart: row.week_start as string,
    });
  }

  // Build completions map per habit
  const logsByHabit: Record<string, Record<string, boolean>> = {};
  for (const row of logsRes.data ?? []) {
    const habitId = row.habit_id as string;
    const dayKey  = row.day_key  as string;
    if (!logsByHabit[habitId]) logsByHabit[habitId] = {};
    logsByHabit[habitId][dayKey] = true;
  }

  const habits: Habit[] = (habitsRes.data ?? []).map((row) => ({
    id:          row.id        as string,
    name:        row.name      as string,
    completions: logsByHabit[row.id as string] ?? {},
    createdAt:   row.created_at as string,
  }));

  // Compute allTimeStats
  const allTasks = Object.values(weeks).flatMap((w) => w.tasks);
  const totalTasksCompleted = allTasks.filter((t) => t.completed).length;

  let bestWeekCount = 0;
  let bestWeekStart = currentWeekKey;
  for (const [key, week] of Object.entries(weeks)) {
    const count = week.tasks.filter((t) => t.completed).length;
    if (count > bestWeekCount) { bestWeekCount = count; bestWeekStart = key; }
  }

  let longestHabitStreak = 0;
  let longestHabitName   = '';
  for (const habit of habits) {
    const streak = computeStreak(habit, new Date());
    if (streak > longestHabitStreak) { longestHabitStreak = streak; longestHabitName = habit.name; }
  }

  return { weeks, habits, moods, allTimeStats: { totalTasksCompleted, bestWeekCount, bestWeekStart, longestHabitStreak, longestHabitName } };
}

function computeStreak(habit: Habit, asOf: Date): number {
  let streak = 0;
  let day = asOf;
  while (habit.completions[formatDayKey(day)]) { streak++; day = addDays(day, -1); }
  return streak;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function dbAddTask(
  userId: string, weekKey: string, dayKey: string, text: string,
): Promise<Task> {
  const task: Task = { id: generateId(), text, completed: false, dayKey, weekStart: weekKey };
  const { error } = await supabase.from('tasks').insert({
    id: task.id, user_id: userId, text, completed: false,
    day_key: dayKey, week_start: weekKey,
  });
  if (error) console.error('[db] addTask error', error);
  return task;
}

export async function dbUpdateTask(
  taskId: string, changes: { text?: string; completed?: boolean },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (changes.text      !== undefined) row.text      = changes.text;
  if (changes.completed !== undefined) row.completed = changes.completed;
  const { error } = await supabase.from('tasks').update(row).eq('id', taskId);
  if (error) console.error('[db] updateTask error', error);
}

export async function dbDeleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  if (error) console.error('[db] deleteTask error', error);
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export async function dbAddHabit(userId: string, name: string, sortOrder: number): Promise<Habit> {
  const habit: Habit = { id: generateId(), name, completions: {}, createdAt: new Date().toISOString() };
  const { error } = await supabase.from('habits').insert({
    id: habit.id, user_id: userId, name, sort_order: sortOrder, created_at: habit.createdAt,
  });
  if (error) console.error('[db] addHabit error', error);
  return habit;
}

export async function dbUpdateHabitName(habitId: string, name: string): Promise<void> {
  const { error } = await supabase.from('habits').update({ name }).eq('id', habitId);
  if (error) console.error('[db] updateHabit error', error);
}

export async function dbDeleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  if (error) console.error('[db] deleteHabit error', error);
}

// ─── Mood logs ───────────────────────────────────────────────────────────────

export async function dbSetMood(userId: string, dayKey: string, mood: MoodValue): Promise<void> {
  const { error } = await supabase
    .from('mood_logs')
    .upsert({ user_id: userId, day_key: dayKey, mood }, { onConflict: 'user_id,day_key' });
  if (error) console.error('[db] setMood error', error);
}

// ─── Habit logs ──────────────────────────────────────────────────────────────

export async function dbCheckHabitLog(userId: string, habitId: string, dayKey: string): Promise<void> {
  const { error } = await supabase.from('habit_logs').upsert({ habit_id: habitId, day_key: dayKey, user_id: userId });
  if (error) console.error('[db] upsertLog error', error);
}

export async function dbUncheckHabitLog(habitId: string, dayKey: string): Promise<void> {
  const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('day_key', dayKey);
  if (error) console.error('[db] deleteLog error', error);
}
