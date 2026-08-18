import { describe, it, expect } from 'vitest';
import {
  getWeekStart,
  getWeekStartKey,
  getWeekDays,
  formatDayKey,
  parseDayKey,
  isDatePast,
  formatWeekLabel,
} from './dateUtils';

describe('getWeekStart', () => {
  it('returns the Monday of the week (week starts on Monday)', () => {
    // 2026-06-30 is a Tuesday → Monday is 2026-06-29
    const monday = getWeekStart(new Date('2026-06-30T12:00:00'));
    expect(formatDayKey(monday)).toBe('2026-06-29');
  });

  it('returns the same day when given a Monday', () => {
    const monday = getWeekStart(new Date('2026-06-29T08:00:00'));
    expect(formatDayKey(monday)).toBe('2026-06-29');
  });

  it('treats Sunday as the last day of the current week', () => {
    // 2026-07-05 is a Sunday → its Monday is 2026-06-29
    const monday = getWeekStart(new Date('2026-07-05T23:00:00'));
    expect(formatDayKey(monday)).toBe('2026-06-29');
  });
});

describe('getWeekStartKey', () => {
  it('formats the week start as YYYY-MM-DD', () => {
    expect(getWeekStartKey(new Date('2026-06-30T12:00:00'))).toBe('2026-06-29');
  });
});

describe('getWeekDays', () => {
  it('returns 7 consecutive days starting from the given Monday', () => {
    const days = getWeekDays(parseDayKey('2026-06-29'));
    expect(days).toHaveLength(7);
    expect(formatDayKey(days[0])).toBe('2026-06-29');
    expect(formatDayKey(days[6])).toBe('2026-07-05');
  });
});

describe('formatDayKey / parseDayKey', () => {
  it('round-trips a date key', () => {
    expect(formatDayKey(parseDayKey('2026-01-15'))).toBe('2026-01-15');
  });
});

describe('isDatePast', () => {
  it('is true for a clearly past date', () => {
    expect(isDatePast(new Date('2020-01-01T00:00:00'))).toBe(true);
  });

  it('is false for a far-future date', () => {
    expect(isDatePast(new Date('2999-01-01T00:00:00'))).toBe(false);
  });
});

describe('formatWeekLabel', () => {
  it('spans Monday to the following Sunday', () => {
    expect(formatWeekLabel(parseDayKey('2026-06-29'))).toBe('Semaine du 29 juin au 5 juillet 2026');
  });
});
