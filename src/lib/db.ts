/**
 * Supabase DB layer.
 * All write functions require userId (auth.uid()) to satisfy RLS policies.
 *
 * Tables: tasks, habits, habit_logs  (see supabase/schema.sql)
 */
import { supabase } from './supabase';
import type { AppData, EmotionId, EmotionSlot, Habit, MoodValue, Task, Todo } from '../types';
import { getWeekStartKey } from '../utils/dateUtils';
import { getHabitStreak } from '../utils/dataUtils';

function generateId(): string {
  // Prefer a collision-resistant UUID; fall back for older runtimes.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Log + rethrow on a failed write so callers (useAppData) can resync state
 * with the DB and tell the user, instead of silently losing the change.
 */
function throwOnError(error: { message: string } | null, label: string): void {
  if (error) {
    console.error(`[db] ${label} error`, error);
    throw error;
  }
}

// ─── Load ─────────────────────────────────────────────────────────────────────

export async function loadAllData(userId: string): Promise<AppData> {
  const [tasksRes, habitsRes, logsRes, moodsRes, todosRes, checkinsRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('habits').select('*').eq('user_id', userId).order('sort_order, created_at'),
    supabase.from('habit_logs').select('*').eq('user_id', userId),
    supabase.from('mood_logs').select('day_key, mood').eq('user_id', userId),
    supabase.from('todos').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('emotional_checkins').select('day_key, slot, emotion').eq('user_id', userId),
  ]);

  if (tasksRes.error)    console.error('[db] tasks load error',    tasksRes.error);
  if (habitsRes.error)   console.error('[db] habits load error',   habitsRes.error);
  if (logsRes.error)     console.error('[db] logs load error',     logsRes.error);
  if (moodsRes.error)    console.error('[db] moods load error',    moodsRes.error);
  if (todosRes.error)    console.error('[db] todos load error',    todosRes.error);
  if (checkinsRes.error) console.error('[db] checkins load error', checkinsRes.error);

  const todos: Todo[] = (todosRes.data ?? []).map((row) => ({
    id:        row.id         as string,
    text:      row.text       as string,
    completed: row.completed  as boolean,
    createdAt: row.created_at as string,
  }));

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
    const streak = getHabitStreak(habit);
    if (streak > longestHabitStreak) { longestHabitStreak = streak; longestHabitName = habit.name; }
  }

  const emotionalCheckins: AppData['emotionalCheckins'] = {};
  for (const row of checkinsRes.data ?? []) {
    const dk   = row.day_key as string;
    const slot = row.slot    as EmotionSlot;
    const emo  = row.emotion as EmotionId;
    if (!emotionalCheckins[dk]) emotionalCheckins[dk] = {};
    emotionalCheckins[dk][slot] = emo;
  }

  return { weeks, habits, todos, moods, emotionalCheckins, allTimeStats: { totalTasksCompleted, bestWeekCount, bestWeekStart, longestHabitStreak, longestHabitName } };
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
  throwOnError(error, 'addTask');
  return task;
}

export async function dbUpdateTask(
  taskId: string, changes: { text?: string; completed?: boolean },
): Promise<void> {
  const row: Record<string, unknown> = {};
  if (changes.text      !== undefined) row.text      = changes.text;
  if (changes.completed !== undefined) row.completed = changes.completed;
  const { error } = await supabase.from('tasks').update(row).eq('id', taskId);
  throwOnError(error, 'updateTask');
}

export async function dbDeleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', taskId);
  throwOnError(error, 'deleteTask');
}

// ─── Habits ──────────────────────────────────────────────────────────────────

export async function dbAddHabit(userId: string, name: string, sortOrder: number): Promise<Habit> {
  const habit: Habit = { id: generateId(), name, completions: {}, createdAt: new Date().toISOString() };
  const { error } = await supabase.from('habits').insert({
    id: habit.id, user_id: userId, name, sort_order: sortOrder, created_at: habit.createdAt,
  });
  throwOnError(error, 'addHabit');
  return habit;
}

export async function dbUpdateHabitName(habitId: string, name: string): Promise<void> {
  const { error } = await supabase.from('habits').update({ name }).eq('id', habitId);
  throwOnError(error, 'updateHabit');
}

export async function dbDeleteHabit(habitId: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', habitId);
  throwOnError(error, 'deleteHabit');
}

// ─── Todos ───────────────────────────────────────────────────────────────────

export async function dbAddTodo(userId: string, text: string): Promise<Todo> {
  const todo: Todo = { id: generateId(), text, completed: false, createdAt: new Date().toISOString() };
  const { error } = await supabase.from('todos').insert({
    id: todo.id, user_id: userId, text, completed: false, created_at: todo.createdAt,
  });
  throwOnError(error, 'addTodo');
  return todo;
}

export async function dbToggleTodo(todoId: string, completed: boolean): Promise<void> {
  const { error } = await supabase.from('todos').update({ completed }).eq('id', todoId);
  throwOnError(error, 'toggleTodo');
}

export async function dbDeleteTodo(todoId: string): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', todoId);
  throwOnError(error, 'deleteTodo');
}

// ─── Emotional check-ins ─────────────────────────────────────────────────────

export async function dbSetCheckin(userId: string, dayKey: string, slot: EmotionSlot, emotion: EmotionId): Promise<void> {
  const { error } = await supabase
    .from('emotional_checkins')
    .upsert({ user_id: userId, day_key: dayKey, slot, emotion }, { onConflict: 'user_id,day_key,slot' });
  throwOnError(error, 'setCheckin');
}

// ─── Mood logs ───────────────────────────────────────────────────────────────

export async function dbSetMood(userId: string, dayKey: string, mood: MoodValue): Promise<void> {
  const { error } = await supabase
    .from('mood_logs')
    .upsert({ user_id: userId, day_key: dayKey, mood }, { onConflict: 'user_id,day_key' });
  throwOnError(error, 'setMood');
}

// ─── Habit logs ──────────────────────────────────────────────────────────────

export async function dbCheckHabitLog(userId: string, habitId: string, dayKey: string): Promise<void> {
  const { error } = await supabase.from('habit_logs').upsert({ habit_id: habitId, day_key: dayKey, user_id: userId });
  throwOnError(error, 'upsertLog');
}

export async function dbUncheckHabitLog(habitId: string, dayKey: string): Promise<void> {
  const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('day_key', dayKey);
  throwOnError(error, 'deleteLog');
}
