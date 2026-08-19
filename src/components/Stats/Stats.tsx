import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AppData } from '../../types';
import {
  formatDayKey, getDayLabel, getWeekDays, parseDayKey,
} from '../../utils/dateUtils';
import {
  getDayCompletionRate, getDayLevel, getHabitStreak, getWeekCompletionRate,
} from '../../utils/dataUtils';
import type { DayLevelTier } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';
import { Flame } from '../ui/Flame';
import { HabitHeatmap } from './HabitHeatmap';
import { HabitMoodChart, HabitWeeklyBarChart } from './HabitCharts';

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
  label: string; value: React.ReactNode; sub?: string; accent?: string;
}>) {
  const { T } = useTheme();
  const color = accent ?? T.emerald;
  return (
    <div
      className="glass glass-hover"
      style={{ flex: 1, minWidth: 130, padding: '16px 18px' }}
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

  const dayRows = useMemo(() => weekDays.map((day) => {
    const dayKey = formatDayKey(day);
    const { done, total } = getDayCompletionRate(data, currentWeekKey, dayKey);
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { dayKey, label: getDayLabel(day), pct, done, total, level: getDayLevel(pct) };
  }), [data, currentWeekKey, weekDays]);

  const levelColors: Record<DayLevelTier, string> = {
    beast: T.emerald,
    fire:  T.sage,
    mid:   T.aqua,
    slow:  T.amber,
    none:  T.textMuted,
  };

  const border = `1px solid ${T.glassBorder}`;

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
          value={data.allTimeStats.longestHabitStreak > 0
            ? <><Flame size={24} /> {data.allTimeStats.longestHabitStreak}</>
            : '—'}
          sub={data.allTimeStats.longestHabitName || 'days'}
          accent={T.aqua}
        />
      </motion.div>

      {/* Day performance */}
      <motion.div {...fadeUp(0.1)} className="glass" style={{ marginBottom: 12 }}>
        <BlockHeader>Daily Performance — Current Week</BlockHeader>
        <div style={{ display: 'flex' }}>
          {dayRows.map(({ dayKey, label, pct, done, total, level }) => {
            const col = levelColors[level.tier];
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
                  {level.tier === 'fire'  && <Flame size={11} />}
                  {level.tier === 'beast' && <Flame size={11} hot />}
                  {(level.tier === 'fire' || level.tier === 'beast') && ' '}
                  {level.label}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Habit consistency heatmap */}
      <motion.div {...fadeUp(0.2)} className="glass" style={{ marginBottom: 12 }}>
        <BlockHeader>Habit Consistency — All Time</BlockHeader>
        <HabitHeatmap habits={data.habits} currentWeekKey={currentWeekKey} moods={data.moods} />
      </motion.div>

      {/* Habit weekly bar chart */}
      <motion.div {...fadeUp(0.3)} className="glass" style={{ marginBottom: 12 }}>
        <BlockHeader>Habit History — Weekly</BlockHeader>
        <HabitWeeklyBarChart habits={data.habits} />
      </motion.div>

      {/* Habits vs Mood */}
      <motion.div {...fadeUp(0.4)} className="glass" style={{ marginBottom: 12 }}>
        <BlockHeader>Habits vs Mood</BlockHeader>
        <HabitMoodChart data={data} />
      </motion.div>

      {/* Habit streaks grid */}
      <motion.div {...fadeUp(0.5)} className="glass" style={{ }}>
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
                  {streak > 0 ? <><Flame /> {streak}</> : '—'}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
