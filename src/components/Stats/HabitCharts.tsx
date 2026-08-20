import { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, Bar, BarChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import { heatColor } from './heatColor';
import { shade, defId } from '../../utils/color';
import { centeredAvg } from './smooth';
import { MoodFace } from '../ui/MoodFace';
import { MOOD_LABEL } from '../ui/mood';
import type { AppData, Habit, MoodValue } from '../../types';
import { addDays, formatDayKey, parseDayKey, getWeekStart } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';

/**
 * 3 days, not 7: a week-wide window flattens a two-day episode, and this chart
 * is read to spot short marking periods, not long-run trend.
 */
const SMOOTH_WINDOW = 3;

/** Gradient ids derive from the colour, so bars of one tier share a single def. */
const gradId = (c: string) => defId('clay', c);

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
                  <div>Jour : <b>{pct}%</b></div>
                  <div>Moy. 7j : <b>{rolling}%</b></div>
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
        { color: T.emerald, opacity: 0.5, label: '% du jour' },
        { color: T.emerald, opacity: 1,   label: 'moyenne 7j' },
      ]} />
    </div>
  );
}

// ─── Chart 2: habit % vs mood ─────────────────────────────────────────────────

interface MoodChartProps { data: AppData }

export function HabitMoodChart({ data }: Readonly<MoodChartProps>) {
  const { T } = useTheme();
  const points = useChartData(data);
  const [smooth, setSmooth] = useState(false);

  // Off by default: the spikes are the marking events this chart is read for,
  // so raw has to stay one tap away.
  const shown = useMemo(() => {
    if (!smooth) return points;
    const pcts  = centeredAvg(points.map((p) => p.pct),  SMOOTH_WINDOW);
    const moods = centeredAvg(points.map((p) => p.mood), SMOOTH_WINDOW);
    return points.map((p, i) => ({ ...p, pct: pcts[i] ?? 0, mood: moods[i] }));
  }, [points, smooth]);

  const hasMoods = points.some((p) => p.mood !== null);

  if (points.length === 0) return <Empty />;

  const tickInterval = Math.max(1, Math.floor(points.length / 6));

  return (
    <div style={{ padding: '16px 8px 8px' }}>
      {!hasMoods && (
        <div style={{ fontSize: 11, color: T.textMuted, textAlign: 'center', marginBottom: 8 }}>
          Aucune humeur enregistrée — logue-la depuis le résumé.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 8px 8px' }}>
        <button
          onClick={() => setSmooth((v) => !v)}
          aria-pressed={smooth}
          style={{
            background: T.rowHoverBg,
            color: smooth ? T.amber : T.textSecondary,
            border: `1px solid ${smooth ? T.amber : T.glassBorder}`,
            borderRadius: 4, padding: '4px 8px', minHeight: 30,
            fontSize: 11, fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer', outline: 'none',
          }}
          title={smooth
            ? `Moyenne centrée sur ${SMOOTH_WINDOW} jours`
            : 'Valeurs quotidiennes brutes'}
        >
          {smooth ? `∿ Lissé ${SMOOTH_WINDOW}j` : '∿ Lisser'}
        </button>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={shown} margin={{ top: 4, right: 32, bottom: 4, left: -20 }}>
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
              return (
                <TooltipBox>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {label}{smooth && <span style={{ color: T.textMuted, fontWeight: 400 }}> · lissé {SMOOTH_WINDOW}j</span>}
                  </div>
                  <div>Habitudes : <b>{pct}%</b></div>
                  {/* Smoothing makes mood fractional, so neither the face nor
                      the 1–5 label applies — fall back to the number. */}
                  {mood != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span>Humeur :</span>
                      {smooth ? (
                        <b>{mood.toFixed(1)}</b>
                      ) : (
                        <>
                          <MoodFace mood={mood as MoodValue} size={16} />
                          <b>{MOOD_LABEL[mood as MoodValue]}</b>
                        </>
                      )}
                    </div>
                  )}
                  {mood == null && <div style={{ color: T.textMuted }}>Humeur non renseignée</div>}
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
          {/* No connectNulls: bridging unlogged days drew a straight line that
              read as a calm, flat stretch when it was really missing data. The
              small dot keeps a day surrounded by holes from vanishing, since a
              dotless line can't render an isolated point. */}
          <Line
            yAxisId="right"
            dataKey="mood"
            stroke={T.amber} strokeWidth={2.5}
            dot={{ r: 1.2, fill: T.amber, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: T.amber }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend items={[
        { color: T.emerald, opacity: 0.7, label: `habitudes %${smooth ? ` (lissé ${SMOOTH_WINDOW}j)` : ''}` },
        { color: T.amber,   opacity: 1,   label: `humeur (1–5)${smooth ? ` (lissé ${SMOOTH_WINDOW}j)` : ''}` },
      ]} />
    </div>
  );
}

// ─── Chart 3: weekly bar chart per habit ─────────────────────────────────────

interface WeekBarPoint {
  label: string;
  fullDate: string;
  count: number;
  activeDays: number;
}

function buildActiveDaysSet(allHabits: Habit[]): Set<string> {
  const active = new Set<string>();
  for (const h of allHabits) {
    for (const [dayKey, checked] of Object.entries(h.completions)) {
      if (checked) active.add(dayKey);
    }
  }
  return active;
}

function useHabitWeeklyData(habit: Habit | undefined, allHabits: Habit[]): WeekBarPoint[] {
  return useMemo(() => {
    if (!habit) return [];

    const activeDaysSet = buildActiveDaysSet(allHabits);
    if (activeDaysSet.size === 0) return [];

    const allActiveSorted = [...activeDaysSet].sort();
    const earliest = parseDayKey(allActiveSorted[0]);
    const earliestWeek = getWeekStart(earliest);
    const currentWeek = getWeekStart(new Date());
    const todayKey = formatDayKey(new Date());

    const weeks: WeekBarPoint[] = [];
    let cursor = earliestWeek;

    while (cursor <= currentWeek) {
      let count = 0;
      let activeDays = 0;
      for (let d = 0; d < 7; d++) {
        const dayKey = formatDayKey(addDays(cursor, d));
        if (dayKey > todayKey) break;
        if (activeDaysSet.has(dayKey)) {
          activeDays++;
          if (habit.completions[dayKey]) count++;
        }
      }
      if (activeDays > 0) {
        const fullDate = formatDayKey(cursor);
        const label = fullDate.slice(5).replace('-', '/');
        weeks.push({ label, fullDate, count, activeDays });
      }
      cursor = addDays(cursor, 7);
    }

    return weeks;
  }, [habit, allHabits]);
}

function computeAverages(points: WeekBarPoint[], inverted: boolean) {
  if (points.length === 0) return { weeklyAvg: 0, monthlyAvg: 0 };

  const values = points.map(p => inverted ? p.activeDays - p.count : p.count);
  const weeklyAvg = values.reduce((s, v) => s + v, 0) / values.length;

  const currentMonth = points[points.length - 1].fullDate.slice(0, 7);
  const monthPoints = points.filter(p => p.fullDate.slice(0, 7) === currentMonth);
  const monthValues = monthPoints.map(p => inverted ? p.activeDays - p.count : p.count);
  const monthlyAvg = monthValues.reduce((s, v) => s + v, 0) / monthValues.length;

  return {
    weeklyAvg: Math.round(weeklyAvg * 10) / 10,
    monthlyAvg: Math.round(monthlyAvg * 10) / 10,
  };
}

interface HabitWeeklyBarProps { habits: Habit[] }

export function HabitWeeklyBarChart({ habits }: Readonly<HabitWeeklyBarProps>) {
  const { T } = useTheme();
  const [selectedId, setSelectedId] = useState<string>(habits[0]?.id ?? '');
  const [inverted, setInverted] = useState(false);

  const selected = habits.find(h => h.id === selectedId);
  const rawPoints = useHabitWeeklyData(selected, habits);

  const displayPoints = useMemo(
    () => rawPoints.map(p => ({
      ...p,
      display: inverted ? p.activeDays - p.count : p.count,
    })),
    [rawPoints, inverted],
  );

  const { weeklyAvg, monthlyAvg } = useMemo(
    () => computeAverages(rawPoints, inverted),
    [rawPoints, inverted],
  );

  // One gradient per distinct tier colour, not one per bar.
  const barColors = useMemo(
    () => [...new Set(displayPoints.map((p) => heatColor(p.display, T)))],
    [displayPoints, T],
  );

  if (habits.length === 0) return <Empty />;

  const buttonStyle = {
    background: T.rowHoverBg,
    color: inverted ? T.amber : T.textSecondary,
    border: `1px solid ${inverted ? T.amber : T.glassBorder}`,
    borderRadius: 4,
    padding: '4px 8px',
    fontSize: 11,
    fontFamily: 'DM Sans, sans-serif',
    cursor: 'pointer' as const,
    outline: 'none',
  };

  return (
    <div style={{ padding: '12px 8px 8px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '0 8px 8px' }}>
        <button
          onClick={() => setInverted(v => !v)}
          style={buttonStyle}
          title={inverted ? 'Affiché : jours NON faits' : 'Affiché : jours faits'}
        >
          {inverted ? '↕ Inversé' : '↕ Inverser'}
        </button>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{
            background: T.rowHoverBg,
            color: T.textPrimary,
            border: `1px solid ${T.glassBorder}`,
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            fontFamily: 'DM Sans, sans-serif',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {habits.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      </div>

      {displayPoints.length === 0 ? (
        <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
          Aucune donnée pour cette habitude.
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={displayPoints} margin={{ top: 18, right: 16, bottom: 4, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.glassBorder} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: T.textMuted, fontFamily: 'DM Sans' }}
                axisLine={false} tickLine={false}
                interval={Math.max(0, Math.floor(displayPoints.length / 8))}
              />
              <YAxis
                domain={[0, 7]}
                ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                tick={{ fontSize: 9, fill: T.textMuted }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const point = payload[0].payload as WeekBarPoint & { display: number };
                  return (
                    <TooltipBox>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Semaine {point.label}</div>
                      <div><b>{point.display}</b>/{point.activeDays} jours actifs {inverted ? '(inversé)' : ''}</div>
                    </TooltipBox>
                  );
                }}
              />
              <ReferenceLine
                y={weeklyAvg}
                stroke={T.aqua}
                strokeDasharray="6 3"
                strokeWidth={1.5}
              />
              <ReferenceLine
                y={monthlyAvg}
                stroke={T.amber}
                strokeDasharray="3 3"
                strokeWidth={1.5}
              />
              {/* Volume by light, not by texture: a vertical light→dark ramp on
                  each bar plus one soft drop shadow. A 32px bar carries it; the
                  lines in the other charts deliberately don't get it. */}
              <defs>
                {barColors.map((c) => (
                  <linearGradient key={c} id={gradId(c)} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={shade(c, 0.20)} />
                    <stop offset="100%" stopColor={shade(c, -0.16)} />
                  </linearGradient>
                ))}
                <filter id="clay-drop" x="-40%" y="-20%" width="180%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodOpacity="0.22" />
                </filter>
              </defs>
              <Bar
                dataKey="display"
                radius={[8, 8, 2, 2]}
                maxBarSize={32}
                filter="url(#clay-drop)"
              >
                {displayPoints.map((p) => (
                  <Cell key={p.fullDate} fill={`url(#${gradId(heatColor(p.display, T))})`} />
                ))}
                <LabelList
                  dataKey="display"
                  position="top"
                  style={{ fontSize: 9, fontWeight: 700, fill: T.textSecondary, fontFamily: 'DM Sans' }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <Legend items={[
            { color: T.aqua, opacity: 1, label: `moy. toutes semaines (${weeklyAvg})` },
            { color: T.amber, opacity: 1, label: `moy. mois en cours (${monthlyAvg})` },
          ]} />
        </>
      )}
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function Empty() {
  const { T } = useTheme();
  return (
    <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
      Aucune donnée d'habitude.
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
