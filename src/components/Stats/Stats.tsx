import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppData } from '../../types';
import {
  formatDayKey, getDayLabel, getWeekDays, parseDayKey,
} from '../../utils/dateUtils';
import {
  getDayCompletionRate, getDayLevel, getHabitStreak,
  getHabitWeekCompletion, getLastFourWeekStarts, getWeekCompletionRate,
} from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';

const ease = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.55, delay, ease } },
});

interface StatsProps {
  data: AppData;
  currentWeekKey: string;
}

function BigStat({ label, value, sub, accent }: Readonly<{
  label: string; value: string | number; sub?: string; accent?: string;
}>) {
  const { T } = useTheme();
  const color = accent ?? T.emerald;
  return (
    <div
      className="glass glass-hover"
      style={{ flex: 1, minWidth: 130, padding: '16px 18px', borderRadius: 2 }}
    >
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.1em',
        color, marginBottom: 8,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 30, fontWeight: 800, fontFamily: 'Syne, sans-serif',
        color: T.textPrimary, lineHeight: 1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 5 }}>{sub}</div>
      )}
    </div>
  );
}

function BlockHeader({ children }: Readonly<{ children: React.ReactNode }>) {
  const { T } = useTheme();
  return (
    <div style={{
      background: T.rowHoverBg,
      borderBottom: `1px solid ${T.glassBorderEm}`,
      padding: '6px 14px',
      fontFamily: 'Syne, sans-serif', fontWeight: 700,
      fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
      color: T.emerald,
    }}>
      {children}
    </div>
  );
}

export function Stats({ data, currentWeekKey }: Readonly<StatsProps>) {
  const { T } = useTheme();

  const { done: thisDone, total: thisTotal } = getWeekCompletionRate(data, currentWeekKey);
  const thisPct = thisTotal === 0 ? 0 : Math.round((thisDone / thisTotal) * 100);

  const lastWeekKey = formatDayKey(new Date(parseDayKey(currentWeekKey).getTime() - 7 * 86400000));
  const { done: lastDone, total: lastTotal } = getWeekCompletionRate(data, lastWeekKey);
  const lastPct = lastTotal === 0 ? 0 : Math.round((lastDone / lastTotal) * 100);
  const delta = thisPct - lastPct;

  const weekStart = parseDayKey(currentWeekKey);
  const weekDays = getWeekDays(weekStart);

  const dayRows = weekDays.map((day) => {
    const dayKey = formatDayKey(day);
    const { done, total } = getDayCompletionRate(data, currentWeekKey, dayKey);
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { dayKey, label: getDayLabel(day), pct, done, total, level: getDayLevel(pct) };
  });

  const last4Weeks = getLastFourWeekStarts(currentWeekKey);
  const habitChartData = data.habits.slice(0, 6).map((habit) => {
    const entry: Record<string, string | number> = {
      name: habit.name.length > 14 ? habit.name.slice(0, 13) + '…' : habit.name,
    };
    last4Weeks.forEach((wk, i) => {
      const { done } = getHabitWeekCompletion(habit, wk);
      entry[`w${i + 1}`] = Math.round((done / 7) * 100);
    });
    return entry;
  });

  const levelColors: Record<string, string> = {
    'Beast Mode':    T.emerald,
    'On Fire':       T.sage,
    'Getting There': T.aqua,
    'Slow Start':    T.amber,
    'No tasks':      T.textMuted,
  };

  const border = `1px solid ${T.glassBorder}`;

  const barColors = [
    T.trackBg,
    T.aqua,
    T.sage,
    T.emerald,
  ];

  let deltaAccent = T.textMuted;
  if (delta > 0) deltaAccent = T.emerald;
  else if (delta < 0) deltaAccent = T.amber;

  const deltaSign = delta > 0 ? '+' : '';
  const deltaValue = delta === 0 ? '—' : `${deltaSign}${delta}%`;

  return (
    <div style={{ padding: '20px', maxWidth: 920, margin: '0 auto' }}>

      {/* Top stat row */}
      <motion.div {...fadeUp(0)} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
        <BigStat label="This Week"     value={`${thisPct}%`} sub={`${thisDone} / ${thisTotal} tasks`} />
        <BigStat
          label="vs Last Week"
          value={deltaValue}
          sub={`Last: ${lastPct}% (${lastDone}/${lastTotal})`}
          accent={deltaAccent}
        />
        <BigStat label="Best Week"     value={data.allTimeStats.bestWeekCount || '—'} sub="tasks in one week" accent={T.amber} />
        <BigStat label="All-Time"      value={data.allTimeStats.totalTasksCompleted} sub="tasks completed" accent={T.sage} />
        <BigStat
          label="Longest Streak"
          value={data.allTimeStats.longestHabitStreak > 0 ? `🔥 ${data.allTimeStats.longestHabitStreak}` : '—'}
          sub={data.allTimeStats.longestHabitName || 'days'}
          accent={T.aqua}
        />
      </motion.div>

      {/* Day performance */}
      <motion.div {...fadeUp(0.1)} className="glass" style={{ marginBottom: 12, borderRadius: 2 }}>
        <BlockHeader>Daily Performance — Current Week</BlockHeader>
        <div style={{ display: 'flex' }}>
          {dayRows.map(({ dayKey, label, pct, done, total, level }) => {
            const col = levelColors[level.label] ?? T.textMuted;
            return (
              <div key={dayKey} style={{
                flex: 1, padding: '12px 8px', textAlign: 'center',
                borderRight: border,
              }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11, color: T.emerald, marginBottom: 5 }}>
                  {label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Syne, sans-serif', color: col }}>
                  {pct}%
                </div>
                <div style={{ fontSize: 10, color: T.textMuted, margin: '3px 0' }}>{done}/{total}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: col, whiteSpace: 'nowrap' }}>
                  {level.emoji} {level.label}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Habit consistency chart */}
      <motion.div {...fadeUp(0.2)} className="glass" style={{ marginBottom: 12, borderRadius: 2 }}>
        <BlockHeader>Habit Consistency — Last 4 Weeks</BlockHeader>
        <div style={{ padding: '16px' }}>
          {habitChartData.length === 0 ? (
            <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
              No habits tracked yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={habitChartData} margin={{ top: 4, right: 8, bottom: 28, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name" tick={{ fontSize: 10, fill: T.textMuted, fontFamily: 'DM Sans' }}
                  interval={0} angle={-18} textAnchor="end" height={40}
                  axisLine={{ stroke: T.glassBorder }} tickLine={false}
                />
                <YAxis
                  domain={[0, 100]} tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 10, fill: T.textMuted }} axisLine={false} tickLine={false}
                />
                <Tooltip
                  formatter={(v, name) => [`${v ?? 0}%`, `Week ${String(name).slice(1)}`]}
                  contentStyle={{
                    background: T.tooltipBg,
                    border: `1px solid ${T.tooltipBorder}`,
                    fontSize: 11, color: T.textPrimary,
                  }}
                  cursor={{ fill: T.rowHoverBg }}
                />
                {['w1', 'w2', 'w3', 'w4'].map((wk, i) => (
                  <Bar key={wk} dataKey={wk} fill={barColors[i]} maxBarSize={18} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Habit streaks grid */}
      <motion.div {...fadeUp(0.3)} className="glass" style={{ borderRadius: 2 }}>
        <BlockHeader>Current Habit Streaks</BlockHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
          {data.habits.map((h) => {
            const streak = getHabitStreak(h);
            let col = T.textMuted;
            if (streak >= 7) col = T.emerald;
            else if (streak >= 4) col = T.sage;
            else if (streak >= 1) col = T.aqua;
            return (
              <div key={h.id} style={{
                padding: '10px 14px', borderRight: border, borderBottom: border,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: T.textSecondary }}>{h.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Syne, sans-serif', color: col, marginLeft: 8 }}>
                  {streak > 0 ? `🔥 ${streak}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
