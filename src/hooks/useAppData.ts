import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, MoodValue } from '../types';
import {
  loadAllData,
  dbAddTask, dbUpdateTask, dbDeleteTask,
  dbAddHabit, dbUpdateHabitName, dbDeleteHabit,
  dbCheckHabitLog, dbUncheckHabitLog,
  dbSetMood,
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
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e: unknown) => {
        if (!cancelled) {
          console.error('[useAppData] load failed', e);
          setError('Failed to load data. Check your Supabase configuration.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
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
      .catch(console.error);
  }, [userId]);

  const handleUpdateTask = useCallback(
    (weekKey: string, taskId: string, changes: { text?: string; completed?: boolean }) => {
      setData((d) => updateTask(d, weekKey, taskId, changes));
      dbUpdateTask(taskId, changes).catch(console.error);
    },
    [],
  );

  const handleDeleteTask = useCallback((weekKey: string, taskId: string) => {
    setData((d) => deleteTask(d, weekKey, taskId));
    dbDeleteTask(taskId).catch(console.error);
  }, []);

  // ─── Habits ───────────────────────────────────────────────────────────────

  const handleAddHabit = useCallback((name: string) => {
    const sortOrder = dataRef.current.habits.length;
    dbAddHabit(userId, name, sortOrder)
      .then((habit) => setData((d) => addHabit(d, habit)))
      .catch(console.error);
  }, [userId]);

  const handleUpdateHabitName = useCallback((habitId: string, name: string) => {
    setData((d) => updateHabit(d, habitId, { name }));
    dbUpdateHabitName(habitId, name).catch(console.error);
  }, []);

  const handleDeleteHabit = useCallback((habitId: string) => {
    setData((d) => deleteHabit(d, habitId));
    dbDeleteHabit(habitId).catch(console.error);
  }, []);

  const handleToggleHabit = useCallback((habitId: string, dayKey: string) => {
    const wasChecked = !!dataRef.current.habits.find((h) => h.id === habitId)?.completions[dayKey];
    setData((d) => toggleHabit(d, habitId, dayKey));
    if (wasChecked) {
      dbUncheckHabitLog(habitId, dayKey).catch(console.error);
    } else {
      dbCheckHabitLog(userId, habitId, dayKey).catch(console.error);
    }
  }, [userId]);

  const handleSetMood = useCallback((dayKey: string, mood: MoodValue) => {
    setData((d) => ({ ...d, moods: { ...d.moods, [dayKey]: mood } }));
    dbSetMood(userId, dayKey, mood).catch(console.error);
  }, [userId]);

  return {
    data, loading, error, currentWeekKey,
    handleAddTask, handleUpdateTask, handleDeleteTask,
    handleAddHabit, handleUpdateHabitName, handleDeleteHabit, handleToggleHabit,
    handleSetMood,
  };
}
