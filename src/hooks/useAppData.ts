import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData } from '../types';
import {
  addHabit,
  addTask,
  deleteHabit,
  deleteTask,
  loadAppData,
  saveAppData,
  toggleHabit,
  updateHabit,
  updateTask,
} from '../utils/dataUtils';
import { getWeekStartKey } from '../utils/dateUtils';

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadAppData());
  const currentWeekKey = getWeekStartKey();

  // Persist on every change
  const prevDataRef = useRef(data);
  useEffect(() => {
    if (prevDataRef.current !== data) {
      saveAppData(data);
      prevDataRef.current = data;
    }
  }, [data]);

  // --- Tasks ---
  const handleAddTask = useCallback(
    (weekKey: string, dayKey: string, text: string) => {
      setData((d) => addTask(d, weekKey, dayKey, text));
    },
    []
  );

  const handleUpdateTask = useCallback(
    (weekKey: string, taskId: string, changes: { text?: string; completed?: boolean }) => {
      setData((d) => updateTask(d, weekKey, taskId, changes));
    },
    []
  );

  const handleDeleteTask = useCallback((weekKey: string, taskId: string) => {
    setData((d) => deleteTask(d, weekKey, taskId));
  }, []);

  // --- Habits ---
  const handleAddHabit = useCallback((name: string) => {
    setData((d) => addHabit(d, name));
  }, []);

  const handleUpdateHabitName = useCallback((habitId: string, name: string) => {
    setData((d) => updateHabit(d, habitId, { name }));
  }, []);

  const handleDeleteHabit = useCallback((habitId: string) => {
    setData((d) => deleteHabit(d, habitId));
  }, []);

  const handleToggleHabit = useCallback((habitId: string, dayKey: string) => {
    setData((d) => toggleHabit(d, habitId, dayKey));
  }, []);

  return {
    data,
    currentWeekKey,
    handleAddTask,
    handleUpdateTask,
    handleDeleteTask,
    handleAddHabit,
    handleUpdateHabitName,
    handleDeleteHabit,
    handleToggleHabit,
  };
}
