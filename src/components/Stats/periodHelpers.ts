import type { LifePeriod, MoodValue, PeriodCategory } from '../../types';
import type { ThemeTokens } from '../../theme';

export interface LanePeriod { period: LifePeriod; lane: number }

/**
 * Calendar-style interval packing: each period claims the first lane whose
 * last-placed period ends before this one starts, else opens a new lane.
 * Overlap is the whole point of this feature, so it has to render, not collide.
 */
export function packLanes(periods: LifePeriod[]): LanePeriod[] {
  const sorted = [...periods].sort((a, b) => a.startDay.localeCompare(b.startDay));
  const laneEnds: string[] = [];
  return sorted.map((period) => {
    let lane = laneEnds.findIndex((end) => end < period.startDay);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(period.endDay); }
    else laneEnds[lane] = period.endDay;
    return { period, lane };
  });
}

/** Fixed legend, not derived or user-picked — the whole point is that
 *  "difficult" always reads amber, everywhere, forever. */
export function categoryColor(category: PeriodCategory, T: ThemeTokens): string {
  switch (category) {
    case 'travel':    return T.emerald;
    case 'difficult': return T.amber;
    case 'arc':       return T.periodArc;
    default:          return T.aqua;
  }
}

export function periodColor(period: LifePeriod, T: ThemeTokens): string {
  return categoryColor(period.category, T);
}

/** Fixed order for the legend and the category picker — never derived, so
 *  it can't reshuffle between renders. */
export const ALL_CATEGORIES: PeriodCategory[] = ['travel', 'difficult', 'arc', 'other'];

export function averageMood(period: LifePeriod, moods: Record<string, MoodValue>): number | null {
  const values = Object.entries(moods)
    .filter(([dayKey]) => dayKey >= period.startDay && dayKey <= period.endDay)
    .map(([, m]) => m);
  if (values.length === 0) return null;
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10;
}
