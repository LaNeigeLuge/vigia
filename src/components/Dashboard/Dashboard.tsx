import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AppData, EmotionId, EmotionSlot, MoodValue } from '../../types';
import { DonutChart } from '../ui/DonutChart';
import { ProgressBar } from '../ui/ProgressBar';
import { Flame } from '../ui/Flame';
import { MoodPicker } from './MoodPicker';
import { EmotionalCheckIn } from './EmotionalCheckIn';
import { formatDayKey, formatWeekLabel, getDayLabel, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getDailyQuote, getDayCompletionRate, getHabitStreak, getWeekCompletionRate } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { shade, defId } from '../../utils/color';

const ease = [0.4, 0, 0.2, 1] as const;
const fadeUp = (delay = 0, still = false) => still ? {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
} : {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease } },
};

interface DashboardProps {
  data: AppData;
  currentWeekKey: string;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
  onSetCheckin: (dayKey: string, slot: EmotionSlot, emotion: EmotionId) => void;
}

function GlassPanel({ children, style = {}, className = '' }: Readonly<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}>) {
  // No inline radius or shadow: both were overriding .glass, which is why these
  // four panels stayed square at radius 2 with the old 8%-opacity shadow while
  // every other panel in the app had already moved to 14 and a real one.
  return (
    <div className={`glass ${className}`} style={style}>
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

export function Dashboard({ data, currentWeekKey, onSetMood, onSetCheckin }: Readonly<DashboardProps>) {
  const { T } = useTheme();
  const isMobile = useIsMobile();
  const still = useReducedMotion() ?? false;
  const barGrad   = defId('dashBar', T.emerald);
  const barShadow = defId('dashBarShadow');
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
    <div style={{ padding: isMobile ? '12px' : '20px', maxWidth: 920, margin: '0 auto' }}>

      {/* Mood picker */}
      <motion.div {...fadeUp(0, still)}>
        <MoodPicker moods={data.moods} onSetMood={onSetMood} />
      </motion.div>

      {/* Emotional check-ins */}
      <motion.div {...fadeUp(0.05, still)}>
        <EmotionalCheckIn checkins={data.emotionalCheckins} onSetCheckin={onSetCheckin} />
      </motion.div>

      {/* Week label */}
      <motion.div {...fadeUp(0.1, still)} style={{ marginBottom: 16 }}>
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
      {/* Phone: stack. 220px + a 1fr sibling leaves the chart ~100px on a 375. */}
      <motion.div {...fadeUp(0.1, still)} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: 12, marginBottom: 12 }}>

        {/* Weekly donut */}
        <GlassPanel style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <SectionLabel>Progression de la semaine</SectionLabel>
          <DonutChart done={done} total={total} size={155} strokeWidth={18} />
          <div style={{ fontSize: 12, color: T.textSecondary, textAlign: 'center' }}>
            <span style={{ color: T.emerald, fontWeight: 700, fontSize: 16 }}>{done}</span>
            <span style={{ color: T.textMuted }}> / {total} tâches</span>
          </div>
        </GlassPanel>

        {/* Daily bar chart */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Tâches faites par jour</SectionLabel>
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
                formatter={(v) => [v ?? 0, 'Tâches faites']}
                cursor={{ fill: T.rowHoverBg }}
              />
              {/* Same treatment as the weekly bars in Stats — two bar charts
                  with two different finishes was the loudest inconsistency. */}
              <defs>
                <linearGradient id={barGrad} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={shade(T.emerald, 0.20)} />
                  <stop offset="100%" stopColor={shade(T.emerald, -0.16)} />
                </linearGradient>
                <filter id={barShadow} x="-40%" y="-20%" width="180%" height="150%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.20" />
                </filter>
              </defs>
              <Bar
                dataKey="tasks"
                fill={`url(#${barGrad})`}
                radius={[8, 8, 2, 2]}
                maxBarSize={28}
                filter={`url(#${barShadow})`}
              />
            </BarChart>
          </ResponsiveContainer>
        </GlassPanel>
      </motion.div>

      {/* Bottom row: quote + habit streaks */}
      <motion.div {...fadeUp(0.2, still)} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>

        {/* Quote */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Citation du jour</SectionLabel>
          <div style={{
            // A 2px hairline is the one mark the DA never uses. A rounded
            // 5px rule reads as a rolled strip instead of a rule.
            borderLeft: `5px solid ${T.sage}`,
            borderRadius: 9999,
            paddingLeft: 14,
            fontStyle: 'italic',
            color: T.textSecondary,
            fontSize: 14,
            lineHeight: 1.7,
          }}>
            "{quote}"
          </div>
        </GlassPanel>

        {/* Habit streaks */}
        <GlassPanel style={{ padding: '20px' }}>
          <SectionLabel>Séries d'habitudes</SectionLabel>
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
                  <div style={{ width: 84 }}>
                    <ProgressBar done={streak} total={7} height={9} color={barColor} />
                  </div>
                  <div style={{
                    minWidth: 38, textAlign: 'right', fontSize: 12,
                    color: streak > 0 ? T.emerald : T.textMuted,
                    fontWeight: 700, fontFamily: 'Syne, sans-serif',
                  }}>
                    {streak > 0 ? <><Flame /> {streak}</> : '—'}
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
