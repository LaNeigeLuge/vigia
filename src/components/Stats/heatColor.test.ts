import { describe, it, expect } from 'vitest';
import type { ThemeTokens } from '../../theme';
import { heatColor } from './heatColor';

// Only the four colours matter here, so stub the rest of the token set.
const T = {
  heatHigh: 'HIGH',
  heatMid:  'MID',
  heatLow:  'LOW',
  emerald:  'GREEN',
} as unknown as ThemeTokens;

describe('heatColor', () => {
  // The spec ("7 red, <=5 orange, 3-4 yellow, else green") overlapped on 3-4
  // and left 6 uncovered. This pins the resolved descending cascade.
  it('maps every count in a 7-day week', () => {
    expect(heatColor(7, T)).toBe('HIGH');
    expect(heatColor(6, T)).toBe('MID');
    expect(heatColor(5, T)).toBe('MID');
    expect(heatColor(4, T)).toBe('LOW');
    expect(heatColor(3, T)).toBe('LOW');
    expect(heatColor(2, T)).toBe('GREEN');
    expect(heatColor(1, T)).toBe('GREEN');
    expect(heatColor(0, T)).toBe('GREEN');
  });

  it('is monotonic — no cooler colour above a hotter one', () => {
    const order = ['GREEN', 'LOW', 'MID', 'HIGH'];
    const ranks = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => order.indexOf(heatColor(n, T)));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });
});
