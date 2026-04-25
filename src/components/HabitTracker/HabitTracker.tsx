import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { AppData, Habit } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { formatDayKey, getDayLabel, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getHabitStreak, getHabitWeekCompletion } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';

const ease = [0.4, 0, 0.2, 1] as const;

interface HabitTrackerProps {
  data: AppData;
  currentWeekKey: string;
  onAddHabit: (name: string) => void;
  onUpdateHabitName: (habitId: string, name: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
}

function HabitNameCell({ habit, onUpdate, onDelete }: Readonly<{
  habit: Habit;
  onUpdate: (name: string) => void;
  onDelete: () => void;
}>) {
  const { T } = useTheme();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(habit.name);
  const [hovered, setHovered] = useState(false);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== habit.name) onUpdate(trimmed);
    else setValue(habit.name);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 10px', minWidth: 172, maxWidth: 172, height: '100%',
      }}
    >
      {editing ? (
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setValue(habit.name); }
          }}
          autoFocus
          className="inline-edit"
          style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}
        />
      ) : (
        <button
          onClick={() => setEditing(true)}
          style={{
            flex: 1, textAlign: 'left', background: 'none', border: 'none',
            cursor: 'text', fontSize: 12, fontWeight: 500,
            color: T.textSecondary, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            padding: 0, fontFamily: 'DM Sans, sans-serif',
          }}
          title="Click to rename"
        >
          {habit.name}
        </button>
      )}
      {hovered && !editing && (
        <button
          onClick={onDelete}
          style={{
            background: 'none', border: 'none', color: T.textMuted,
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
            padding: '0 2px', flexShrink: 0, transition: 'color 0.15s',
          }}
          title="Delete habit"
        >
          ×
        </button>
      )}
    </div>
  );
}

export function HabitTracker({
  data, currentWeekKey,
  onAddHabit, onUpdateHabitName, onDeleteHabit, onToggleHabit,
}: Readonly<HabitTrackerProps>) {
  const { T } = useTheme();
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const weekStart = parseDayKey(currentWeekKey);
  const weekDays = getWeekDays(weekStart);

  const commitAdd = () => {
    const trimmed = newHabitName.trim();
    if (trimmed) onAddHabit(trimmed);
    setNewHabitName('');
    setAddingHabit(false);
  };

  const border = `1px solid ${T.glassBorder}`;

  const thStyle: React.CSSProperties = {
    background: T.rowHoverBg,
    borderBottom: `1px solid ${T.glassBorderEm}`,
    padding: '7px 8px',
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Syne, sans-serif',
    fontWeight: 700,
    color: T.emerald,
    letterSpacing: '0.05em',
    minWidth: 46,
  };

  return (
    <div style={{ padding: '20px', overflowX: 'auto' }}>
      <div style={{ minWidth: 620 }}>

        {/* Header row */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${T.glassBorderEm}` }}>
          <div style={{ ...thStyle, minWidth: 172, maxWidth: 172, textAlign: 'left', paddingLeft: 10 }}>
            Habit
          </div>
          {weekDays.map((day) => (
            <div key={formatDayKey(day)} style={thStyle}>
              <div>{getDayLabel(day)}</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: T.textMuted }}>
                {formatDayKey(day).slice(8)}
              </div>
            </div>
          ))}
          <div style={{ ...thStyle, minWidth: 92, maxWidth: 92 }}>Week</div>
          <div style={{ ...thStyle, minWidth: 58, maxWidth: 58 }}>Streak</div>
        </div>

        {/* Habit rows */}
        {data.habits.map((habit, idx) => {
          const { done, total } = getHabitWeekCompletion(habit, currentWeekKey);
          const streak = getHabitStreak(habit);
          const rowBg = idx % 2 === 0 ? T.glassBg : T.oddRowBg;

          let streakColor = T.textMuted;
          if (streak >= 7) streakColor = T.emerald;
          else if (streak >= 4) streakColor = T.sage;
          else if (streak >= 1) streakColor = T.aqua;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, ease }}
              style={{ display: 'flex', alignItems: 'center', borderBottom: border, background: rowBg }}
            >
              {/* Name */}
              <div style={{
                minWidth: 172, maxWidth: 172,
                borderRight: border, height: 38,
                display: 'flex', alignItems: 'center',
              }}>
                <HabitNameCell
                  habit={habit}
                  onUpdate={(name) => onUpdateHabitName(habit.id, name)}
                  onDelete={() => onDeleteHabit(habit.id)}
                />
              </div>

              {/* Day checkboxes */}
              {weekDays.map((day) => {
                const dayKey = formatDayKey(day);
                const checked = !!habit.completions[dayKey];
                return (
                  <div
                    key={dayKey}
                    style={{
                      minWidth: 46, height: 38,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: border,
                      background: checked ? T.checkedCellBg : 'transparent',
                      transition: 'background 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => onToggleHabit(habit.id, dayKey)}
                      style={{ width: 14, height: 14, accentColor: T.emerald, cursor: 'pointer' }}
                    />
                  </div>
                );
              })}

              {/* Progress bar */}
              <div style={{
                minWidth: 92, maxWidth: 92,
                padding: '0 10px', borderRight: border,
                display: 'flex', alignItems: 'center',
              }}>
                <ProgressBar done={done} total={total} height={5} showLabel />
              </div>

              {/* Streak */}
              <div style={{
                minWidth: 58, maxWidth: 58,
                textAlign: 'center', fontSize: 12,
                fontWeight: 700, color: streakColor,
                fontFamily: 'Syne, sans-serif',
              }}>
                {streak > 0 ? `🔥 ${streak}` : '—'}
              </div>
            </motion.div>
          );
        })}

        {/* Add habit row */}
        <div style={{ borderBottom: border, background: T.glassBg }}>
          {addingHabit ? (
            <div style={{ padding: '7px 10px' }}>
              <input
                ref={addInputRef}
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                onBlur={commitAdd}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitAdd();
                  if (e.key === 'Escape') { setAddingHabit(false); setNewHabitName(''); }
                }}
                autoFocus
                placeholder="Habit name…"
                className="inline-edit"
                style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500, maxWidth: 220 }}
              />
            </div>
          ) : (
            <button
              onClick={() => setAddingHabit(true)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '9px 10px', fontSize: 12,
                color: T.emerald, fontWeight: 600,
                fontFamily: 'DM Sans, sans-serif',
              }}
            >
              + Add habit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
