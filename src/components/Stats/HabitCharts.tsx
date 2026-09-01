import { useMemo, useState } from 'react';
import {
  ComposedChart, Area, Line, Bar, BarChart, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, LabelList,
} from 'recharts';
import { heatColor } from './heatColor';
import { shade, defId } from '../../utils/color';
import { centeredAvg } from './smooth';
import { useLang } from '../../i18n';
import type { AppData, Habit, MoodValue } from '../../types';
import { addDays, formatDayKey, parseDayKey, getWeekStart } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';
import type { ThemeTokens } from '../../theme';

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
  const { t } = useLang();
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
                  <div>{t('chart.day')} <b>{pct}%</b></div>
                  <div>{t('chart.avg7d')} <b>{rolling}%</b></div>
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
        { color: T.emerald, opacity: 0.5, label: t('chart.pctOfDay') },
        { color: T.emerald, opacity: 1,   label: t('chart.avg7dLegend') },
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
  const { t } = useLang();
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
          title={t(inverted ? 'chart.showingNotDone' : 'chart.showingDone')}
        >
          {t(inverted ? 'chart.inverted' : 'chart.invert')}
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
          {t('chart.noDataHabit')}
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
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('chart.week', { n: point.label })}</div>
                      <div><b>{point.display}</b>/{point.activeDays} {t('chart.activeDays')} {inverted ? t('chart.invertedSuffix') : ''}</div>
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
  const { t } = useLang();
  return (
    <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
      {t('chart.noHabitData')}
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

function Legend({ items, block = false }: Readonly<{
  items: { color: string; opacity: number; label: string }[];
  /** Filled swatch instead of a rule — for areas, where a hairline misreads. */
  block?: boolean;
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
          <div style={{ width: block ? 11 : 20, height: block ? 11 : 2.5,
            background: item.color, opacity: item.opacity,
            borderRadius: block ? 3 : 2 }} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Chart 2: habits vs how far mood sits from your own average ─────────────
//
// This replaced a chart that plotted habits 0–100 and mood 1–5 on two y-axes in
// one frame. Two scales in one frame have an arbitrary alignment, so the chart
// invented a correlation the data never claimed — and it was the direct cause of
// "the high mood stretch doesn't read": the mood line's height meant nothing
// beside the habits area, and a single bad day drew a full-height stroke louder
// than the fortnight it interrupted.
//
// So: two panes, one measure each, on a shared and aligned x-axis. Habits keeps a
// percentage. Mood becomes its distance from your own average, filled — which
// turns "a period above normal" from a shape you have to trace into a mass you
// just see.
//
// The `cmp` prefix on the helpers below is a leftover from the three candidates
// this was chosen among; it means nothing now beyond "belongs to this chart".

const CMP_WINDOW = 7;

interface MoodChartProps { data: AppData }

/** Identical margins and y-axis width on every pane — that, and nothing else, is
 *  what keeps the stacked panes and the ribbon aligned on the same day. */
const PANE_MARGIN = { top: 6, right: 12, bottom: 0, left: 0 };
const AXIS_W = 40;

interface CmpPoint extends ChartPoint { rawPct: number; rawMood: number | null }

function useCmpData(data: AppData) {
  const points = useChartData(data);
  return useMemo(() => {
    const pcts  = centeredAvg(points.map((p) => p.pct),  CMP_WINDOW);
    const moods = centeredAvg(points.map((p) => p.mood), CMP_WINDOW);
    const logged = points.map((p) => p.mood).filter((m): m is MoodValue => m != null);
    const baseline = logged.length
      ? Math.round((logged.reduce((s, m) => s + m, 0) / logged.length) * 10) / 10
      : 3;
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

function sharedXAxis(rows: CmpPoint[], T: ThemeTokens, visible: boolean) {
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

/** The habits pane, identical in all three variants: smoothed area, raw as a ghost. */
function HabitsPane({ rows, showX, gid }: Readonly<{
  rows: CmpPoint[]; showX: boolean;
  /* Unique per variant: three panes render at once, and url(#id) resolves on the
     first match in the document, not the enclosing <svg>. */
  gid: string;
}>) {
  const { T } = useTheme();
  return (
    <ResponsiveContainer width="100%" height={showX ? 118 : 100}>
      <ComposedChart data={rows} margin={PANE_MARGIN}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={T.emerald} stopOpacity={0.22} />
            <stop offset="95%" stopColor={T.emerald} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={T.glassBorder} vertical={false} />
        {sharedXAxis(rows, T, showX)}
        <YAxis
          width={AXIS_W} domain={[0, 100]} ticks={[0, 50, 100]}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 9, fill: T.textMuted }}
          axisLine={false} tickLine={false}
        />
        {/* The raw daily series stays visible, just recessive — the smoothing is
            a reading aid, not a claim that the spikes weren't real. */}
        <Line dataKey="rawPct" stroke={T.emerald} strokeWidth={1} strokeOpacity={0.22}
              dot={false} activeDot={false} />
        <Area dataKey="pct" stroke={T.emerald} strokeWidth={2}
              fill={`url(#${gid})`} dot={false} activeDot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HabitMoodChart({ data }: Readonly<MoodChartProps>) {
  const { T } = useTheme();
  const { t } = useLang();
  const { rows, baseline } = useCmpData(data);
  if (rows.length === 0) return <Empty />;

  // A symmetric domain puts zero at exactly half height, which is why the
  // gradient can split at a fixed 50% instead of a computed offset.
  const devs = rows.map((r) => (r.mood == null ? null : Math.round((r.mood - baseline) * 10) / 10));
  const span = Math.max(0.5, ...devs.map((d) => Math.abs(d ?? 0)));
  const shown = rows.map((r, i) => ({ ...r, dev: devs[i] }));

  return (
    <div style={{ paddingBottom: 8 }}>
      <PaneLabel>{t('cmp.habitsPane')}</PaneLabel>
      <HabitsPane rows={rows} showX={false} gid="habitPaneGrad" />
      <PaneLabel>{t('cmp.moodPane')}</PaneLabel>
      {/* The sentence, not the legend, is what makes this pane readable cold: a
          deviation chart is meaningless until you know what it deviates from. */}
      <Caption>{t('cmp.howToRead', { v: baseline })}</Caption>
      <ResponsiveContainer width="100%" height={124}>
        <ComposedChart data={shown} margin={PANE_MARGIN}>
          <defs>
            <linearGradient id="cmpDev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={T.moodHigh} stopOpacity={0.38} />
              <stop offset="50%"  stopColor={T.moodHigh} stopOpacity={0.04} />
              <stop offset="50%"  stopColor={T.moodLow}  stopOpacity={0.04} />
              <stop offset="100%" stopColor={T.moodLow}  stopOpacity={0.38} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={T.glassBorder} vertical={false} />
          {sharedXAxis(rows, T, true)}
          <YAxis
            width={AXIS_W} domain={[-span, span]}
            tickFormatter={(v: number) => (v > 0 ? `+${v}` : `${v}`)}
            tick={{ fontSize: 9, fill: T.textMuted }}
            axisLine={false} tickLine={false}
          />
          {/* Labelled in place. The baseline is the one value the reader must
              know, and a legend across the chart is the wrong place for it. */}
          <ReferenceLine
            y={0} stroke={T.textSecondary} strokeOpacity={0.55}
            label={{
              value: t('cmp.baseline', { v: baseline }),
              position: 'insideTopLeft',
              fill: T.textMuted, fontSize: 9, fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const p = payload[0].payload as CmpPoint & { dev: number | null };
            if (p.dev == null) return null;
            return (
              <TooltipBox>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
                <div><b>{p.dev > 0 ? `+${p.dev}` : p.dev}</b> {t(p.dev >= 0 ? 'cmp.above' : 'cmp.below')}</div>
              </TooltipBox>
            );
          }} />
          <Area dataKey="dev" stroke={T.textMuted} strokeWidth={1.5} strokeOpacity={0.55}
                fill="url(#cmpDev)" dot={false} activeDot={false} />
        </ComposedChart>
      </ResponsiveContainer>
      <Legend block items={[
        { color: T.moodHigh, opacity: 1, label: t('cmp.above') },
        { color: T.moodLow,  opacity: 1, label: t('cmp.below') },
      ]} />
    </div>
  );
}

function PaneLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  const { T } = useTheme();
  return (
    <div style={{
      fontSize: 9, color: T.textMuted, fontFamily: 'DM Sans, sans-serif',
      padding: '6px 0 0 14px', letterSpacing: '0.04em',
    }}>
      {children}
    </div>
  );
}

function Caption({ children }: Readonly<{ children: React.ReactNode }>) {
  const { T } = useTheme();
  return (
    <div style={{
      fontSize: 10, lineHeight: 1.45, color: T.textMuted,
      fontFamily: 'DM Sans, sans-serif',
      padding: '2px 14px 4px', maxWidth: 620,
    }}>
      {children}
    </div>
  );
}
