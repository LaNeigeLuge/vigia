import { describe, it, expect } from 'vitest';
import type { AppData, Habit } from '../types';
import {
  createDefaultAppData,
  getWeekCompletionRate,
  getDayLevel,
  getHabitStreak,
  getHabitWeekCompletion,
  updateTask,
  deleteTask,
  toggleHabit,
  addHabit,
  deleteHabit,
  getLastFourWeekStarts,
  getDayEntries,
} from './dataUtils';

const WEEK = '2026-06-29';

function makeData(): AppData {
  const data = createDefaultAppData();
  return {
    ...data,
    weeks: {
      [WEEK]: {
        weekStart: WEEK,
        tasks: [
          { id: 't1', text: 'a', completed: true,  dayKey: '2026-06-29', weekStart: WEEK, migratedTo: null },
          { id: 't2', text: 'b', completed: false, dayKey: '2026-06-29', weekStart: WEEK, migratedTo: null },
          { id: 't3', text: 'c', completed: true,  dayKey: '2026-06-30', weekStart: WEEK, migratedTo: null },
        ],
      },
    },
  };
}

describe('getDayEntries', () => {
  // A migrated task has to show on both days, and the origin day must survive
  // the migration crossing a week boundary.
  const NEXT_WEEK = '2026-07-06';
  function migrated(): AppData {
    const data = makeData();
    return {
      ...data,
      weeks: {
        ...data.weeks,
        [WEEK]: {
          weekStart: WEEK,
          tasks: [
            { id: 'm1', text: 'facture', completed: false, dayKey: '2026-07-05', weekStart: WEEK, migratedTo: NEXT_WEEK },
          ],
        },
      },
    };
  }

  it('leaves a struck `>` trace on the day the task left', () => {
    expect(getDayEntries(migrated(), '2026-07-05')).toEqual([
      { task: expect.objectContaining({ id: 'm1' }), migratedAway: true },
    ]);
  });

  it('shows the task live on the day it landed, across a week boundary', () => {
    expect(getDayEntries(migrated(), NEXT_WEEK)).toEqual([
      { task: expect.objectContaining({ id: 'm1' }), migratedAway: false },
    ]);
  });

  it('never lists the same task twice for one day', () => {
    const data = migrated();
    data.weeks[WEEK].tasks[0].migratedTo = '2026-07-05'; // migrated onto itself
    expect(getDayEntries(data, '2026-07-05')).toHaveLength(1);
  });

  it('returns plain entries for a task that was never migrated', () => {
    expect(getDayEntries(makeData(), '2026-06-29')).toEqual([
      { task: expect.objectContaining({ id: 't1' }), migratedAway: false },
      { task: expect.objectContaining({ id: 't2' }), migratedAway: false },
    ]);
  });
});

describe('getWeekCompletionRate', () => {
  it('counts done vs total tasks for the week', () => {
    expect(getWeekCompletionRate(makeData(), WEEK)).toEqual({ done: 2, total: 3 });
  });

  it('returns zeroes for an unknown week', () => {
    expect(getWeekCompletionRate(makeData(), '1999-01-04')).toEqual({ done: 0, total: 0 });
  });
});

describe('getDayLevel', () => {
  // Assert the tier, not the label: the tier keys the colour and icon lookups,
  // the label is display text that moves with the UI language.
  it('maps percentages to tiers, boundaries inclusive', () => {
    expect(getDayLevel(0).tier).toBe('none');
    expect(getDayLevel(25).tier).toBe('slow');
    expect(getDayLevel(50).tier).toBe('mid');
    expect(getDayLevel(75).tier).toBe('fire');
    expect(getDayLevel(100).tier).toBe('beast');
  });

  it('puts values just over a boundary in the next tier', () => {
    expect(getDayLevel(26).tier).toBe('mid');
    expect(getDayLevel(76).tier).toBe('beast');
  });
});

describe('getHabitStreak', () => {
  const habit: Habit = {
    id: 'h1',
    name: 'Run',
    createdAt: '2026-06-01T00:00:00.000Z',
    completions: { '2026-06-28': true, '2026-06-29': true, '2026-06-30': true },
  };

  it('counts consecutive completed days ending at asOf', () => {
    expect(getHabitStreak(habit, new Date('2026-06-30T12:00:00'))).toBe(3);
  });

  it('is zero when the asOf day is not completed', () => {
    expect(getHabitStreak(habit, new Date('2026-07-01T12:00:00'))).toBe(0);
  });

  it('stops at the first gap', () => {
    const gapped: Habit = { ...habit, completions: { '2026-06-30': true, '2026-06-28': true } };
    expect(getHabitStreak(gapped, new Date('2026-06-30T12:00:00'))).toBe(1);
  });
});

describe('getHabitWeekCompletion', () => {
  it('counts completed days within the 7-day week', () => {
    const habit: Habit = {
      id: 'h1', name: 'Run', createdAt: '2026-06-01T00:00:00.000Z',
      completions: { '2026-06-29': true, '2026-06-30': true, '2026-08-01': true },
    };
    expect(getHabitWeekCompletion(habit, WEEK)).toEqual({ done: 2, total: 7 });
  });
});

describe('updateTask', () => {
  it('updates a task and bumps allTimeStats when completing one', () => {
    const before = makeData();
    const after = updateTask(before, WEEK, 't2', { completed: true });
    const task = after.weeks[WEEK].tasks.find((t) => t.id === 't2');
    expect(task?.completed).toBe(true);
    expect(after.allTimeStats.totalTasksCompleted).toBe(before.allTimeStats.totalTasksCompleted + 1);
  });

  it('does not mutate the original data (immutability)', () => {
    const before = makeData();
    updateTask(before, WEEK, 't2', { completed: true });
    expect(before.weeks[WEEK].tasks.find((t) => t.id === 't2')?.completed).toBe(false);
  });

  it('returns data unchanged for an unknown week', () => {
    const before = makeData();
    expect(updateTask(before, 'nope', 't2', { completed: true })).toBe(before);
  });
});

describe('deleteTask', () => {
  it('removes the task from its week', () => {
    const after = deleteTask(makeData(), WEEK, 't1');
    expect(after.weeks[WEEK].tasks.map((t) => t.id)).toEqual(['t2', 't3']);
  });
});

describe('toggleHabit', () => {
  it('adds a completion when previously unchecked', () => {
    const habit: Habit = { id: 'h1', name: 'Run', createdAt: '', completions: {} };
    const data = addHabit(createDefaultAppData(), habit);
    const after = toggleHabit(data, 'h1', '2026-06-30');
    expect(after.habits[0].completions['2026-06-30']).toBe(true);
  });

  it('removes the key when toggled off (no falsey leftovers)', () => {
    const habit: Habit = { id: 'h1', name: 'Run', createdAt: '', completions: { '2026-06-30': true } };
    const data = addHabit(createDefaultAppData(), habit);
    const after = toggleHabit(data, 'h1', '2026-06-30');
    expect('2026-06-30' in after.habits[0].completions).toBe(false);
  });
});

describe('deleteHabit', () => {
  it('removes the habit by id', () => {
    const data = addHabit(createDefaultAppData(), { id: 'h1', name: 'Run', createdAt: '', completions: {} });
    expect(deleteHabit(data, 'h1').habits).toHaveLength(0);
  });
});

describe('getLastFourWeekStarts', () => {
  it('returns 4 Mondays, oldest first, ending at the current week', () => {
    expect(getLastFourWeekStarts(WEEK)).toEqual([
      '2026-06-08', '2026-06-15', '2026-06-22', '2026-06-29',
    ]);
  });
});
