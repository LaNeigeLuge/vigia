import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, EmotionId, EmotionSlot, MoodValue } from '../types';
import {
  loadAllData,
  dbAddTask, dbUpdateTask, dbDeleteTask,
  dbAddHabit, dbUpdateHabitName, dbDeleteHabit,
  dbCheckHabitLog, dbUncheckHabitLog,
  dbSetMood, dbSetCheckin,
  dbAddTodo, dbToggleTodo, dbDeleteTodo,
} from '../lib/db';
import { updateTask, deleteTask, addHabit, updateHabit, deleteHabit, toggleHabit, createDefaultAppData } from '../utils/dataUtils';
import { getWeekStartKey } from '../utils/dateUtils';

const EMPTY: AppData = createDefaultAppData();

export function useAppData(userId: string) {
  const [data, setData]       = useState<AppData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const currentWeekKey        = getWeekStartKey();
  const dataRef               = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    loadAllData(userId)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); setError(null); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.error('[useAppData] load failed', e);
          setError('Failed to load data. Check your Supabase configuration.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [userId]);

  // A write failed after an optimistic update: tell the user and resync local
  // state from the server so the UI never shows a change that wasn't persisted.
  const handleWriteError = useCallback((e: unknown) => {
    console.error('[useAppData] write failed, resyncing', e);
    setError('Could not save your last change — refreshing from the server.');
    if (!userId) return;
    loadAllData(userId)
      .then((d) => { setData(d); setError(null); })
      .catch((err: unknown) => console.error('[useAppData] resync failed', err));
  }, [userId]);

  // ─── Tasks ────────────────────────────────────────────────────────────────

  const handleAddTask = useCallback((weekKey: string, dayKey: string, text: string) => {
    dbAddTask(userId, weekKey, dayKey, text)
      .then((task) =>
        setData((d) => {
          const week = d.weeks[weekKey] ?? { weekStart: weekKey, tasks: [] };
          return { ...d, weeks: { ...d.weeks, [weekKey]: { ...week, tasks: [...week.tasks, task] } } };
        }),
      )
      .catch(handleWriteError);
  }, [userId, handleWriteError]);

  const handleUpdateTask = useCallback(
    (weekKey: string, taskId: string, changes: { text?: string; completed?: boolean }) => {
      setData((d) => updateTask(d, weekKey, taskId, changes));
      dbUpdateTask(taskId, changes).catch(handleWriteError);
    },
    [handleWriteError],
  );

  /**
   * Bullet-journal migration. The row stays on its origin day so the `>` trace
   * survives there; `migratedTo` is where it lands. Pass null to cancel — that
   * is the undo path for a mis-tap.
   */
  const handleMigrateTask = useCallback((weekKey: string, taskId: string, toDayKey: string | null) => {
    setData((d) => updateTask(d, weekKey, taskId, { migratedTo: toDayKey }));
    dbUpdateTask(taskId, { migratedTo: toDayKey }).catch(handleWriteError);
  }, [handleWriteError]);

  const handleDeleteTask = useCallback((weekKey: string, taskId: string) => {
    setData((d) => deleteTask(d, weekKey, taskId));
    dbDeleteTask(taskId).catch(handleWriteError);
  }, [handleWriteError]);

  // ─── Habits ───────────────────────────────────────────────────────────────

  const handleAddHabit = useCallback((name: string) => {
    const sortOrder = dataRef.current.habits.length;
    dbAddHabit(userId, name, sortOrder)
      .then((habit) => setData((d) => addHabit(d, habit)))
      .catch(handleWriteError);
  }, [userId, handleWriteError]);

  const handleUpdateHabitName = useCallback((habitId: string, name: string) => {
    setData((d) => updateHabit(d, habitId, { name }));
    dbUpdateHabitName(habitId, name).catch(handleWriteError);
  }, [handleWriteError]);

  const handleDeleteHabit = useCallback((habitId: string) => {
    setData((d) => deleteHabit(d, habitId));
    dbDeleteHabit(habitId).catch(handleWriteError);
  }, [handleWriteError]);

  const handleToggleHabit = useCallback((habitId: string, dayKey: string) => {
    const wasChecked = !!dataRef.current.habits.find((h) => h.id === habitId)?.completions[dayKey];
    setData((d) => toggleHabit(d, habitId, dayKey));
    if (wasChecked) {
      dbUncheckHabitLog(habitId, dayKey).catch(handleWriteError);
    } else {
      dbCheckHabitLog(userId, habitId, dayKey).catch(handleWriteError);
    }
  }, [userId, handleWriteError]);

  const handleSetMood = useCallback((dayKey: string, mood: MoodValue) => {
    setData((d) => ({ ...d, moods: { ...d.moods, [dayKey]: mood } }));
    dbSetMood(userId, dayKey, mood).catch(handleWriteError);
  }, [userId, handleWriteError]);

  const handleSetCheckin = useCallback((dayKey: string, slot: EmotionSlot, emotion: EmotionId) => {
    setData((d) => ({
      ...d,
      emotionalCheckins: {
        ...d.emotionalCheckins,
        [dayKey]: { ...d.emotionalCheckins[dayKey], [slot]: emotion },
      },
    }));
    dbSetCheckin(userId, dayKey, slot, emotion).catch(handleWriteError);
  }, [userId, handleWriteError]);

  // ─── Todos ─────────────────────────────────────────────────────────────────

  const handleAddTodo = useCallback((text: string) => {
    dbAddTodo(userId, text)
      .then((todo) => setData((d) => ({ ...d, todos: [...d.todos, todo] })))
      .catch(handleWriteError);
  }, [userId, handleWriteError]);

  const handleToggleTodo = useCallback((todoId: string) => {
    setData((d) => {
      const todo = d.todos.find((t) => t.id === todoId);
      if (!todo) return d;
      dbToggleTodo(todoId, !todo.completed).catch(handleWriteError);
      return { ...d, todos: d.todos.map((t) => t.id === todoId ? { ...t, completed: !t.completed } : t) };
    });
  }, [handleWriteError]);

  const handleDeleteTodo = useCallback((todoId: string) => {
    setData((d) => ({ ...d, todos: d.todos.filter((t) => t.id !== todoId) }));
    dbDeleteTodo(todoId).catch(handleWriteError);
  }, [handleWriteError]);

  return {
    data, loading, error, currentWeekKey,
    handleAddTask, handleUpdateTask, handleDeleteTask, handleMigrateTask,
    handleAddHabit, handleUpdateHabitName, handleDeleteHabit, handleToggleHabit,
    handleSetMood, handleSetCheckin,
    handleAddTodo, handleToggleTodo, handleDeleteTodo,
  };
}
