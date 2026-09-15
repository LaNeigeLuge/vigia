/**
 * Non-component pieces shared by the mood chart, its expanded modal view, and
 * the period timeline below it — kept out of HabitCharts.tsx so exporting them
 * doesn't break that file's Fast Refresh (see heatColor.ts/smooth.ts for the
 * same reasoning).
 */
import { useMemo } from 'react';
import { XAxis } from 'recharts';
import { centeredAvg } from './smooth';
import type { AppData, MoodValue } from '../../types';
import { addDays, formatDayKey, parseDayKey } from '../../utils/dateUtils';
import type { ThemeTokens } from '../../theme';

export interface ChartPoint {
  label: string;
  dayKey: string;
  pct: number;
  rolling: number;
  mood: MoodValue | null;
}

export function useChartData(data: AppData): ChartPoint[] {
  return useMemo(() => {
    if (data.habits.length === 0) return [];

    // Find earliest date across habits and moods
    let earliest = formatDayKey(new Date());
    for (const habit of data.habits) {
      for (const d of Object.keys(habit.completions)) {
        if (d < earliest) earliest = d;
      }
    }
    for (const d of Object.keys(data.moods)) {
      if (d < earliest) earliest = d;
    }

    // Build daily array from earliest to today
    const days: string[] = [];
    let cursor = parseDayKey(earliest);
    const todayKey = formatDayKey(new Date());
    while (formatDayKey(cursor) <= todayKey) {
      days.push(formatDayKey(cursor));
      cursor = addDays(cursor, 1);
    }

    const total = data.habits.length;

    return days.map((dayKey, i) => {
      const done = data.habits.filter((h) => !!h.completions[dayKey]).length;
      const pct  = Math.round((done / total) * 100);

      // 7-day rolling average (inclusive)
      const winStart = Math.max(0, i - 6);
      let sum = 0;
      for (let j = winStart; j <= i; j++) {
        const wd = data.habits.filter((h) => !!h.completions[days[j]]).length;
        sum += (wd / total) * 100;
      }
      const rolling = Math.round(sum / (i - winStart + 1));

      return {
        label:  dayKey.slice(5).replace('-', '/'),
        dayKey,
        pct,
        rolling,
        mood: (data.moods[dayKey] ?? null) as MoodValue | null,
      };
    });
  }, [data.habits, data.moods]);
}

const CMP_WINDOW = 7;

export interface CmpPoint extends ChartPoint { rawPct: number; rawMood: number | null }

/** Identical margins and y-axis width on every pane — that, and nothing else, is
 *  what keeps the stacked panes and the ribbon aligned on the same day. */
export const PANE_MARGIN = { top: 6, right: 12, bottom: 0, left: 0 };
export const AXIS_W = 40;

/** The neutral middle of the 1–5 mood scale — used when nothing's been
 *  logged yet, so the deviation pane has a baseline to draw before there's
 *  any real average to compute one from. */
const NEUTRAL_BASELINE = 3;

/** Exported on its own so the no-mood-logged fallback is a unit-testable
 *  branch, not just a line inside a memoized hook. */
export function computeBaseline(points: ChartPoint[]): number {
  const logged = points.map((p) => p.mood).filter((m): m is MoodValue => m != null);
  if (logged.length === 0) return NEUTRAL_BASELINE;
  return Math.round((logged.reduce((s, m) => s + m, 0) / logged.length) * 10) / 10;
}

export function useCmpData(data: AppData) {
  const points = useChartData(data);
  return useMemo(() => {
    const pcts  = centeredAvg(points.map((p) => p.pct),  CMP_WINDOW);
    const moods = centeredAvg(points.map((p) => p.mood), CMP_WINDOW);
    const baseline = computeBaseline(points);
    const rows: CmpPoint[] = points.map((p, i) => ({
      ...p,
      rawPct: p.pct,
      rawMood: p.mood,
      pct: pcts[i] ?? 0,
      mood: moods[i] as MoodValue | null,
    }));
    return { rows, baseline };
  }, [points]);
}

export function sharedXAxis(rows: CmpPoint[], T: ThemeTokens, visible: boolean) {
  return (
    <XAxis
      dataKey="label"
      height={visible ? 18 : 0}
      tick={visible ? { fontSize: 9, fill: T.textMuted, fontFamily: 'DM Sans' } : false}
      axisLine={false} tickLine={false}
      interval={Math.max(1, Math.floor(rows.length / 6))}
    />
  );
}
