import { useMemo, useState } from 'react';
import { addDays, formatDayKey, parseDayKey } from '../../utils/dateUtils';
import type { Habit, MoodValue } from '../../types';
import { useTheme } from '../../ThemeContext';

interface HabitHeatmapProps {
  habits: Habit[];
  currentWeekKey: string;
  moods: Record<string, MoodValue>;
}

const CELL  = 14;
const GAP   = 2;
const WGAP  = 6;
const LABEL_W = 148;

const MOOD_COLORS: Record<MoodValue, string> = {
  5: '#4a7c59', // emerald — super
  4: '#6a9e98', // aqua    — bien
  3: '#8fa882', // sage    — normal
  2: '#b07d52', // amber   — bof
  1: '#b36b6b', // red     — pas ouf
};

export function HabitHeatmap({ habits, currentWeekKey, moods }: Readonly<HabitHeatmapProps>) {
  const { T } = useTheme();
  const [tooltip, setTooltip] = useState<{ habitName: string; dayKey: string; done: boolean } | null>(null);

  const weeks = useMemo(() => {
    if (habits.length === 0) return [];

    // Find earliest completion
    let earliest = currentWeekKey;
    for (const habit of habits) {
      for (const dayKey of Object.keys(habit.completions)) {
        if (dayKey < earliest) earliest = dayKey;
      }
    }

    // Roll back to Monday of that week
    const startDate  = parseDayKey(earliest);
    const dow        = startDate.getDay(); // 0=Sun … 6=Sat
    const toMonday   = dow === 0 ? 6 : dow - 1;
    const weekOrigin = addDays(startDate, -toMonday);

    // Roll forward to Monday of current week
    const todayKey       = formatDayKey(new Date());
    const result: string[][] = [];
    let cursor = weekOrigin;

    while (formatDayKey(cursor) <= todayKey) {
      const week = Array.from({ length: 7 }, (_, i) => formatDayKey(addDays(cursor, i)));
      result.push(week);
      cursor = addDays(cursor, 7);
    }

    return result;
  }, [habits, currentWeekKey]);

  if (habits.length === 0) {
    return (
      <div style={{ color: T.textMuted, textAlign: 'center', padding: 24, fontSize: 13 }}>
        No habits tracked yet.
      </div>
    );
  }

  const todayKey = formatDayKey(new Date());
  const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div style={{ overflowX: 'auto', padding: '14px 16px 10px' }}>
      <div style={{ display: 'inline-block', minWidth: 'max-content' }}>

        {/* Day-of-week labels (one column above the first week) */}
        <div style={{ display: 'flex', paddingLeft: LABEL_W, marginBottom: 3 }}>
          {weeks.slice(0, 1).map((week) =>
            week.map((_, di) => (
              <div
                key={di}
                style={{
                  width: CELL, textAlign: 'center',
                  fontSize: 8, color: T.textMuted,
                  fontFamily: 'DM Sans, sans-serif',
                  marginRight: di < 6 ? GAP : WGAP,
                }}
              >
                {DAY_LABELS[di]}
              </div>
            ))
          )}
        </div>

        {/* Week date labels */}
        <div style={{ display: 'flex', paddingLeft: LABEL_W, marginBottom: 6 }}>
          {weeks.map((week, wi) => (
            <div
              key={wi}
              style={{
                width: 7 * (CELL + GAP) - GAP,
                fontSize: 9, color: T.textMuted,
                fontFamily: 'DM Sans, sans-serif',
                marginRight: WGAP,
                whiteSpace: 'nowrap',
              }}
            >
              {week[0].slice(5).replace('-', '/')}
            </div>
          ))}
        </div>

        {/* Mood row */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
          <div style={{
            width: LABEL_W, minWidth: LABEL_W,
            paddingRight: 10, textAlign: 'right',
            fontSize: 9, color: T.textMuted,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            mood
          </div>
          <div style={{ display: 'flex', gap: WGAP }}>
            {weeks.map((week) => (
              <div key={week[0]} style={{ display: 'flex', gap: GAP }}>
                {week.map((dayKey) => {
                  const mood   = moods[dayKey];
                  const future = dayKey > todayKey;
                  return (
                    <div
                      key={dayKey}
                      title={mood ? `Mood ${mood}/5` : undefined}
                      style={{
                        width: CELL, height: 5,
                        borderRadius: 4,
                        background: future || !mood ? T.trackBg : MOOD_COLORS[mood],
                        opacity: future ? 0 : 1,
                        transition: 'background 0.1s',
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Habit rows */}
        {habits.map((habit) => {
          const totalDone  = Object.values(habit.completions).filter(Boolean).length;
          const totalCells = weeks.flat().filter((d) => d <= todayKey).length;
          const pct        = totalCells === 0 ? 0 : Math.round((totalDone / totalCells) * 100);

          return (
            <div key={habit.id} style={{ display: 'flex', alignItems: 'center', marginBottom: GAP + 1 }}>
              {/* Habit name */}
              <div style={{
                width: LABEL_W, minWidth: LABEL_W,
                paddingRight: 10, textAlign: 'right',
                fontSize: 11, color: T.textSecondary,
                fontFamily: 'DM Sans, sans-serif',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                <span style={{ color: T.textMuted, fontSize: 9, marginRight: 5 }}>{pct}%</span>
                {habit.name}
              </div>

              {/* Week groups */}
              <div style={{ display: 'flex', gap: WGAP }}>
                {weeks.map((week, wi) => (
                  <div key={wi} style={{ display: 'flex', gap: GAP }}>
                    {week.map((dayKey) => {
                      const done    = !!habit.completions[dayKey];
                      const future  = dayKey > todayKey;
                      const isHover = tooltip?.habitName === habit.name && tooltip.dayKey === dayKey;

                      return (
                        <div
                          key={dayKey}
                          onMouseEnter={() => !future && setTooltip({ habitName: habit.name, dayKey, done })}
                          onMouseLeave={() => setTooltip(null)}
                          style={{
                            width: CELL, height: CELL,
                            borderRadius: 3,
                            background: future
                              ? 'transparent'
                              : done
                                ? isHover ? T.sage : T.emerald
                                : isHover ? T.glassBorderEm : T.trackBg,
                            border: future ? 'none' : `1px solid ${done ? 'transparent' : T.glassBorder}`,
                            transition: 'background 0.1s',
                            cursor: future ? 'default' : 'pointer',
                            position: 'relative',
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            marginTop: 10, paddingLeft: LABEL_W,
            fontSize: 11, color: T.textSecondary,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            <span style={{ color: T.textMuted }}>{tooltip.dayKey}</span>
            {' — '}
            <span style={{ fontWeight: 600 }}>{tooltip.habitName}</span>
            {' '}
            <span style={{ color: tooltip.done ? T.emerald : T.textMuted }}>
              {tooltip.done ? '✓ done' : '✗ not done'}
            </span>
          </div>
        )}

        {/* Legend */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          paddingLeft: LABEL_W, marginTop: 10,
          fontSize: 9, color: T.textMuted,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          <div style={{ width: CELL, height: CELL, borderRadius: 3, background: T.trackBg, border: `1px solid ${T.glassBorder}` }} />
          <span>not done</span>
          <div style={{ width: CELL, height: CELL, borderRadius: 4, background: T.emerald, marginLeft: 6 }} />
          <span>done</span>
        </div>
      </div>
    </div>
  );
}
