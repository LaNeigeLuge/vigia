import { describe, it, expect } from 'vitest';
import { computeBaseline } from './moodChartShared';
import type { ChartPoint } from './moodChartShared';

function point(mood: ChartPoint['mood']): ChartPoint {
  return { label: '', dayKey: '', pct: 0, rolling: 0, mood };
}

describe('computeBaseline', () => {
  it('averages the logged mood values', () => {
    expect(computeBaseline([point(2), point(4), point(5)])).toBe(3.7);
  });

  it('ignores days with no mood logged', () => {
    expect(computeBaseline([point(4), point(null), point(2)])).toBe(3);
  });

  it('falls back to the neutral midpoint when nothing has been logged', () => {
    expect(computeBaseline([point(null), point(null)])).toBe(3);
    expect(computeBaseline([])).toBe(3);
  });
});
