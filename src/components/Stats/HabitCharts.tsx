import { useMemo } from 'react';
import {
  ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AppData, MoodValue } from '../../types';
import { addDays, formatDayKey, parseDayKey } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';

interface ChartPoint {
  label: string;
  dayKey: string;
  pct: number;
  rolling: number;
  mood: MoodValue | null;
}

function useChartData(data: AppData): ChartPoint[] {
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

// ─── Chart 1: daily score + 7-day rolling average ────────────────────────────

interface ScoreChartProps { data: AppData }

export function HabitScoreChart({ data }: Readonly<ScoreChartProps>) {
  const { T } = useTheme();
  const points = useChartData(data);

  if (points.length === 0) {
    return <Empty />;
  }

  const tickInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <div style={{ padding: '16px 8px 8px' }}>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={points} margin={{ top: 4, right: 16, bottom: 4, left: -20 }}>
          <defs>
            <linearGradient id="habitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.25} />
              <stop offset="95%" stopColor={T.emerald} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.glassBorder} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: T.textMuted, fontFamily: 'DM Sans' }}
            axisLine={false} tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 9, fill: T.textMuted }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const pct     = payload.find((p) => p.dataKey === 'pct')?.value as number;
              const rolling = payload.find((p) => p.dataKey === 'rolling')?.value as number;
              return (
                <TooltipBox>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div>Daily: <b>{pct}%</b></div>
                  <div>7-day avg: <b>{rolling}%</b></div>
                </TooltipBox>
              );
            }}
          />
          <Area
            dataKey="pct"
            stroke={T.emerald} strokeWidth={1.5} strokeOpacity={0.6}
            fill="url(#habitGrad)" dot={false} activeDot={false}
          />
          <Line
            dataKey="rolling"
            stroke={T.emerald} strokeWidth={2.5}
            dot={false} activeDot={{ r: 4, fill: T.emerald }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend items={[
        { color: T.emerald, opacity: 0.5, label: 'daily %' },
        { color: T.emerald, opacity: 1,   label: '7-day avg' },
      ]} />
    </div>
  );
}

// ─── Chart 2: habit % vs mood ─────────────────────────────────────────────────

interface MoodChartProps { data: AppData }

export function HabitMoodChart({ data }: Readonly<MoodChartProps>) {
  const { T } = useTheme();
  const points = useChartData(data);

  const hasMoods = points.some((p) => p.mood !== null);

  if (points.length === 0) return <Empty />;

  const tickInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <div style={{ padding: '16px 8px 8px' }}>
      {!hasMoods && (
        <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginBottom: 8 }}>
          No mood data yet — log your daily mood in the dashboard.
        </div>
      )}
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={points} margin={{ top: 4, right: 32, bottom: 4, left: -20 }}>
          <defs>
            <linearGradient id="habitGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.2} />
              <stop offset="95%" stopColor={T.emerald} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={T.glassBorder} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 9, fill: T.textMuted, fontFamily: 'DM Sans' }}
            axisLine={false} tickLine={false}
            interval={tickInterval}
          />
          <YAxis
            yAxisId="left"
            domain={[0, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 9, fill: T.emerald }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tick={{ fontSize: 9, fill: T.amber }}
            axisLine={false} tickLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const pct  = payload.find((p) => p.dataKey === 'pct')?.value as number;
              const mood = payload.find((p) => p.dataKey === 'mood')?.value as number | null;
              const MOOD_LABELS: Record<number, string> = { 1: '😞 terrible', 2: '😕 bof', 3: '😐 normal', 4: '🙂 bien', 5: '😄 super' };
              return (
                <TooltipBox>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                  <div>Habits: <b>{pct}%</b></div>
                  {mood != null && <div>Mood: <b>{MOOD_LABELS[mood] ?? mood}</b></div>}
                </TooltipBox>
              );
            }}
          />
          <Area
            yAxisId="left"
            dataKey="pct"
            stroke={T.emerald} strokeWidth={1.5} strokeOpacity={0.7}
            fill="url(#habitGrad2)" dot={false} activeDot={false}
          />
          <Line
            yAxisId="right"
            dataKey="mood"
            stroke={T.amber} strokeWidth={2.5}
            dot={false} connectNulls
            activeDot={{ r: 4, fill: T.amber }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend items={[
        { color: T.emerald, opacity: 0.7, label: 'habits %' },
        { color: T.amber,   opacity: 1,   label: 'mood (1–5)' },
      ]} />
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Empty() {
  const { T } = useTheme();
  return (
    <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
      No habit data yet.
    </div>
  );
}

function TooltipBox({ children }: Readonly<{ children: React.ReactNode }>) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.tooltipBg, border: `1px solid ${T.tooltipBorder}`,
      borderRadius: 4, padding: '7px 10px',
      fontSize: 11, color: T.textPrimary, fontFamily: 'DM Sans, sans-serif',
    }}>
      {children}
    </div>
  );
}

function Legend({ items }: Readonly<{
  items: { color: string; opacity: number; label: string }[];
}>) {
  const { T } = useTheme();
  return (
    <div style={{
      display: 'flex', gap: 16, justifyContent: 'center',
      marginTop: 6, fontSize: 10, color: T.textMuted,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      {items.map((item) => (
        <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 20, height: 2.5, background: item.color, opacity: item.opacity, borderRadius: 2 }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
