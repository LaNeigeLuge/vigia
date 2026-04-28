import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppData, MoodValue } from '../../types';
import { DonutChart } from '../ui/DonutChart';
import { ProgressBar } from '../ui/ProgressBar';
import { MoodPicker } from './MoodPicker';
import { formatDayKey, formatWeekLabel, getDayLabel, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getDailyQuote, getDayCompletionRate, getHabitStreak, getWeekCompletionRate } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';

const ease = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease } },
});

interface DashboardProps {
  data: AppData;
  currentWeekKey: string;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
}

function GlassPanel({ children, style = {}, className = '' }: Readonly<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}>) {
  const { T } = useTheme();
  return (
    <div
      className={`glass ${className}`}
      style={{ borderRadius: 2, boxShadow: T.shadowSm, ...style }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  const { T } = useTheme();
  return (
    <div style={{
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: T.emerald,
      marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

export function Dashboard({ data, currentWeekKey, onSetMood }: Readonly<DashboardProps>) {
  const { T } = useTheme();
  const weekStart = parseDayKey(currentWeekKey);
  const weekDays = getWeekDays(weekStart);
  const { done, total } = getWeekCompletionRate(data, currentWeekKey);
  const quote = getDailyQuote();

  const barData = useMemo(() => weekDays.map((day) => {
    const dayKey = formatDayKey(day);
    const { done: d } = getDayCompletionRate(data, currentWeekKey, dayKey);
    return { day: getDayLabel(day), tasks: d };
  }), [data, currentWeekKey, weekDays]);

  return (
    <div style={{ padding: '20px', maxWidth: 920, margin: '0 auto' }}>

      {/* Mood picker */}
      <motion.div {...fadeUp(0)}>
        <MoodPicker
          moods={data.moods}
          onSetMood={onSetMood}
        />
      </motion.div>

      {/* Week label */}
      <motion.div {...fadeUp(0.05)} style={{ marginBottom: 16 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700,
          fontSize: 22,
          color: T.textPrimary,
          letterSpacing: '-0.3px',
        }}>
          {formatWeekLabel(weekStart)}
        </div>
      </motion.div>

      {/* Top row: donut + bar chart */}
      <motion.div {...fadeUp(0.1)} style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 12 }}>

        {/* Weekly donut */}
        <GlassPanel style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <SectionLabel>Weekly Progress</SectionLabel>
          <DonutChart done={done} total={total} size={155} strokeWidth={18} />
          <div style={{ fontSize: 12, color: T.textSecondary, textAlign: 'center' }}>
            <span style={{ color: T.emerald, fontWeight: 700, fontSize: 16 }}>{done}</span>
            <span style={{ color: T.textMuted }}> / {total} tasks</span>
          </div>
        </GlassPanel>

        {/* Daily bar chart */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Tasks Completed per Day</SectionLabel>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: T.textMuted, fontFamily: 'DM Sans, sans-serif' }}
                axisLine={{ stroke: T.glassBorder }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 10, fill: T.textMuted }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: T.tooltipBg,
                  border: `1px solid ${T.tooltipBorder}`,
                  borderRadius: 4,
                  fontSize: 12,
                  color: T.textPrimary,
                }}
                formatter={(v) => [v ?? 0, 'Tasks done']}
                cursor={{ fill: T.rowHoverBg }}
              />
              <Bar dataKey="tasks" fill={T.emerald} radius={[3, 3, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </motion.div>

      {/* Bottom row: quote + habit streaks */}
      <motion.div {...fadeUp(0.2)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Quote */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Quote of the Day</SectionLabel>
          <div style={{
            borderLeft: `2px solid ${T.emerald}`,
            paddingLeft: 12,
            fontStyle: 'italic',
            color: T.textSecondary,
            fontSize: 13,
            lineHeight: 1.65,
          }}>
            "{quote}"
          </div>
        </GlassPanel>

        {/* Habit streaks */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Habit Streaks</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {data.habits.slice(0, 5).map((habit) => {
              const streak = getHabitStreak(habit);
              let barColor = T.aqua;
              if (streak >= 5) barColor = T.emerald;
              else if (streak >= 3) barColor = T.sage;
              return (
                <div key={habit.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    flex: 1, fontSize: 12, color: T.textSecondary,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {habit.name}
                  </div>
                  <div style={{ width: 80 }}>
                    <ProgressBar done={streak} total={7} height={4} color={barColor} />
                  </div>
                  <div style={{
                    minWidth: 38, textAlign: 'right', fontSize: 12,
                    color: streak > 0 ? T.emerald : T.textMuted,
                    fontWeight: 700, fontFamily: 'Syne, sans-serif',
                  }}>
                    {streak > 0 ? `🔥 ${streak}` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </motion.div>
    </div>
  );
}
