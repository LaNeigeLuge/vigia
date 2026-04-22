import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppData } from '../../types';
import { DonutChart } from '../ui/DonutChart';
import { ProgressBar } from '../ui/ProgressBar';
import { formatDayKey, formatWeekLabel, getDayLabel, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getDailyQuote, getDayCompletionRate, getHabitStreak, getWeekCompletionRate } from '../../utils/dataUtils';
import { T } from '../../theme';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: T.ease } },
});

interface DashboardProps {
  data: AppData;
  currentWeekKey: string;
}

function GlassPanel({ children, style = {}, className = '' }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={`glass ${className}`}
      style={{ borderRadius: 2, boxShadow: T.shadowSm, ...style }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'Syne, sans-serif',
      fontWeight: 700,
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: T.emerald,
      marginBottom: 12,
      textShadow: T.glowEm,
    }}>
      {children}
    </div>
  );
}

export function Dashboard({ data, currentWeekKey }: DashboardProps) {
  const weekStart = parseDayKey(currentWeekKey);
  const weekDays = getWeekDays(weekStart);
  const { done, total } = getWeekCompletionRate(data, currentWeekKey);
  const quote = getDailyQuote();

  const barData = weekDays.map((day) => {
    const dayKey = formatDayKey(day);
    const { done } = getDayCompletionRate(data, currentWeekKey, dayKey);
    return { day: getDayLabel(day), tasks: done };
  });

  return (
    <div style={{ padding: '20px 20px', maxWidth: 920, margin: '0 auto' }}>

      {/* Week label */}
      <motion.div {...fadeUp(0)} style={{ marginBottom: 16 }}>
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
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(245,241,232,0.06)" />
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
                  background: 'rgba(10,15,10,0.92)',
                  border: `1px solid ${T.glassBorder}`,
                  borderRadius: 4,
                  fontSize: 12,
                  color: T.textPrimary,
                  backdropFilter: 'blur(12px)',
                }}
                formatter={(v) => [v ?? 0, 'Tasks done']}
                cursor={{ fill: 'rgba(107,155,127,0.06)' }}
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
              const barColor = streak >= 5 ? T.emerald : streak >= 3 ? T.sage : T.aqua;
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
