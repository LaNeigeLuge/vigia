import { describe, it, expect } from 'vitest';
import type { LifePeriod, MoodValue } from '../../types';
import { packLanes, averageMood } from './periodHelpers';

function period(id: string, startDay: string, endDay: string): LifePeriod {
  return { id, name: id, startDay, endDay, category: 'other' };
}

describe('packLanes', () => {
  it('keeps non-overlapping periods on the same lane', () => {
    const result = packLanes([
      period('a', '2026-01-01', '2026-01-05'),
      period('b', '2026-01-10', '2026-01-15'),
    ]);
    expect(result.map((r) => r.lane)).toEqual([0, 0]);
  });

  it('gives overlapping periods their own lane', () => {
    const result = packLanes([
      period('a', '2026-01-01', '2026-01-10'),
      period('b', '2026-01-05', '2026-01-15'),
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.period.id, r.lane]));
    expect(byId.a).not.toBe(byId.b);
  });

  it('reuses a freed lane once its period has ended', () => {
    // a and b overlap (share lane 0/1); c starts after both end, so it should
    // land back on lane 0 rather than opening a third lane.
    const result = packLanes([
      period('a', '2026-01-01', '2026-01-10'),
      period('b', '2026-01-05', '2026-01-15'),
      period('c', '2026-01-20', '2026-01-25'),
    ]);
    const byId = Object.fromEntries(result.map((r) => [r.period.id, r.lane]));
    expect(byId.c).toBe(0);
  });

  it('sorts by start day regardless of input order', () => {
    const result = packLanes([
      period('later', '2026-02-01', '2026-02-05'),
      period('earlier', '2026-01-01', '2026-01-05'),
    ]);
    expect(result.map((r) => r.period.id)).toEqual(['earlier', 'later']);
  });
});

describe('averageMood', () => {
  const moods: Record<string, MoodValue> = {
    '2026-01-01': 2,
    '2026-01-02': 4,
    '2026-01-03': 5,
    '2026-02-01': 1, // outside the period below
  };

  it('averages only the mood entries inside the period range, inclusive', () => {
    expect(averageMood(period('a', '2026-01-01', '2026-01-03'), moods)).toBe(3.7);
  });

  it('returns null when no mood is logged in range', () => {
    expect(averageMood(period('a', '2026-03-01', '2026-03-05'), moods)).toBeNull();
  });
});
