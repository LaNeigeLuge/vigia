import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AppData, Habit } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Flame } from '../ui/Flame';
import { ClayCheck, ClayDot } from '../ui/ClayCheck';
import { addDays, formatDayKey, formatWeekLabel, getDayLabel, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getHabitStreak, getHabitWeekCompletion } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';
import { pressedStyle } from '../../utils/color';
import { useIsMobile } from '../../hooks/useMediaQuery';

const ease = [0.4, 0, 0.2, 1] as const;

interface HabitTrackerProps {
  data: AppData;
  currentWeekKey: string;
  onAddHabit: (name: string) => void;
  onUpdateHabitName: (habitId: string, name: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
}

function NavBtn({ onClick, disabled = false, children }: Readonly<{
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}>) {
  const { T } = useTheme();
  return (
    <button
      className="tap-target"
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'transparent' : T.rowHoverBg,
        border: `1px solid ${disabled ? T.glassBorder : T.glassBorderEm}`,
        color: disabled ? T.textMuted : T.emerald,
        width: 30, height: 30, cursor: disabled ? 'default' : 'pointer',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, transition: 'all 0.18s',
      }}
    >
      {children}
    </button>
  );
}

function HabitNameCell({ habit, onUpdate, onDelete, fill = false }: Readonly<{
  habit: Habit;
  onUpdate: (name: string) => void;
  onDelete: () => void;
  /** Card layout: take the row's width instead of the grid's fixed column. */
  fill?: boolean;
}>) {
  const { T } = useTheme();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(habit.name);

  const commit = () => {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed && trimmed !== habit.name) onUpdate(trimmed);
    else setValue(habit.name);
  };

  return (
    <div
      className="row"
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 10px', height: '100%',
        ...(fill
          ? { flex: 1, minWidth: 0 }
          : { minWidth: 172, maxWidth: 172 }),
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
            cursor: 'text', fontSize: fill ? 15 : 12, fontWeight: fill ? 600 : 500,
            minHeight: fill ? 44 : undefined,
            color: fill ? T.textPrimary : T.textSecondary, overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            padding: 0, fontFamily: 'DM Sans, sans-serif',
          }}
          title="Renommer"
        >
          {habit.name}
        </button>
      )}
      {!editing && (
        <button
          className="row-action"
          onClick={onDelete}
          style={{
            background: 'none', border: 'none', color: T.textMuted,
            cursor: 'pointer', fontSize: 14, lineHeight: 1,
            padding: '0 2px', transition: 'color 0.15s',
          }}
          aria-label={`Supprimer l'habitude ${habit.name}`}
          title="Supprimer"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** Phone: one card per habit, with 7 tappable 44px day cells. */
function HabitCard({
  habit, weekDays, viewWeekKey, onUpdateName, onDelete, onToggle,
}: Readonly<{
  habit: Habit;
  weekDays: Date[];
  viewWeekKey: string;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
  onToggle: (dayKey: string) => void;
}>) {
  const { T, dark } = useTheme();
  const { done, total } = getHabitWeekCompletion(habit, viewWeekKey);
  const streak = getHabitStreak(habit);

  let streakColor = T.textMuted;
  if (streak >= 7) streakColor = T.emerald;
  else if (streak >= 4) streakColor = T.sage;
  else if (streak >= 1) streakColor = T.aqua;

  return (
    <div className="glass" style={{ marginBottom: 10, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 4px 4px 0', borderBottom: `1px solid ${T.glassBorderEm}`,
      }}>
        <HabitNameCell habit={habit} onUpdate={onUpdateName} onDelete={onDelete} fill />
        <span style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
          color: streakColor, paddingRight: 10, whiteSpace: 'nowrap',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {streak > 0 ? <><Flame /> {streak}</> : '—'}
        </span>
      </div>

      <div style={{ display: 'flex' }}>
        {weekDays.map((day) => {
          const dayKey = formatDayKey(day);
          const checked = !!habit.completions[dayKey];
          return (
            <button
              key={dayKey}
              onClick={() => onToggle(dayKey)}
              aria-pressed={checked}
              aria-label={`${habit.name} — ${getDayLabel(day)} ${formatDayKey(day).slice(8)}`}
              style={{
                flex: 1, minWidth: 0, minHeight: 44,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2,
                ...pressedStyle(checked, T.checkedCellBg, dark),
                border: 'none', borderRight: `1px solid ${T.glassBorder}`,
                cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <span style={{
                fontSize: 9, color: T.textMuted,
                fontFamily: 'Syne, sans-serif', fontWeight: 700,
                textTransform: 'uppercase',
              }}>
                {getDayLabel(day)}
              </span>
              {/* Shape, not colour alone — a raised pellet vs an empty well. */}
              <ClayDot checked={checked} size={22} />
            </button>
          );
        })}
      </div>

      <div style={{ padding: '8px 12px', borderTop: `1px solid ${T.glassBorder}` }}>
        <ProgressBar done={done} total={total} height={5} showLabel />
      </div>
    </div>
  );
}

export function HabitTracker({
  data, currentWeekKey,
  onAddHabit, onUpdateHabitName, onDeleteHabit, onToggleHabit,
}: Readonly<HabitTrackerProps>) {
  const { T, dark } = useTheme();
  const isMobile = useIsMobile();
  const still = useReducedMotion() ?? false;
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [viewWeekKey, setViewWeekKey] = useState(currentWeekKey);
  const addInputRef = useRef<HTMLInputElement>(null);

  const isCurrentWeek = viewWeekKey === currentWeekKey;
  const weekStart = parseDayKey(viewWeekKey);
  const weekDays = getWeekDays(weekStart);

  const navigateWeek = (dir: -1 | 1) => {
    const next = formatDayKey(addDays(parseDayKey(viewWeekKey), dir * 7));
    if (dir === 1 && next > currentWeekKey) return;
    setViewWeekKey(next);
  };

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

  /**
   * Shared by both branches: on a phone the cards float below as their own
   * panels, so the nav is a complete one; on desktop it is the top band of a
   * single panel that also holds the grid, which is why the divider is optional.
   */
  const weekNav = (withDivider: boolean) => (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '8px 16px', gap: 12,
      borderBottom: withDivider ? `1px solid ${T.glassBorderEm}` : undefined,
    }}>
      <NavBtn onClick={() => navigateWeek(-1)}>‹</NavBtn>
      <div style={{ flex: 1, textAlign: 'center' }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 14, color: T.textPrimary }}>
          {formatWeekLabel(weekStart)}
        </span>
      </div>
      <NavBtn onClick={() => navigateWeek(1)} disabled={isCurrentWeek}>›</NavBtn>
      {!isCurrentWeek && (
        <button
          onClick={() => setViewWeekKey(currentWeekKey)}
          style={{
            background: T.rowHoverBg, border: `1px solid ${T.glassBorderEm}`,
            color: T.emerald, padding: '4px 12px', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          Aujourd'hui
        </button>
      )}
    </div>
  );

  /** Same control in both branches: its own panel on a phone, the last band of
   *  the grid panel on desktop. */
  const addRow = (
    <>
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
            placeholder="Nom de l'habitude…"
            className="inline-edit"
            style={{ fontSize: 12, color: T.textPrimary, fontWeight: 500, maxWidth: 220 }}
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingHabit(true)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: isMobile ? '14px 12px' : '9px 10px',
            fontSize: isMobile ? 14 : 12,
            color: T.emerald, fontWeight: 600,
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          + Ajouter une habitude
        </button>
      )}
    </>
  );

  return (
    <div style={{ padding: isMobile ? '12px' : '20px', overflowX: isMobile ? 'visible' : 'auto' }}>
      <div style={{ minWidth: isMobile ? 0 : 620 }}>

        {isMobile ? (
          <>
            <div className="glass">{weekNav(false)}</div>
            <div style={{ marginTop: 10 }}>
            {data.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                weekDays={weekDays}
                viewWeekKey={viewWeekKey}
                onUpdateName={(name) => onUpdateHabitName(habit.id, name)}
                onDelete={() => onDeleteHabit(habit.id)}
                onToggle={(dayKey) => onToggleHabit(habit.id, dayKey)}
              />
              ))}
            </div>
            <div className="glass" style={{ marginTop: 10 }}>{addRow}</div>
          </>
        ) : (
        <div className="glass">
        {weekNav(true)}
        {/* Header row */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${T.glassBorderEm}` }}>
          <div style={{ ...thStyle, minWidth: 172, maxWidth: 172, textAlign: 'left', paddingLeft: 10 }}>
            Habitude
          </div>
          {weekDays.map((day) => (
            <div key={formatDayKey(day)} style={thStyle}>
              <div>{getDayLabel(day)}</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: T.textMuted }}>
                {formatDayKey(day).slice(8)}
              </div>
            </div>
          ))}
          <div style={{ ...thStyle, minWidth: 92, maxWidth: 92 }}>Semaine</div>
          <div style={{ ...thStyle, minWidth: 58, maxWidth: 58 }}>Série</div>
        </div>

        {/* Habit rows */}
        {data.habits.map((habit, idx) => {
          const { done, total } = getHabitWeekCompletion(habit, viewWeekKey);
          const streak = getHabitStreak(habit);
          const rowBg = idx % 2 === 0 ? T.glassBg : T.oddRowBg;

          let streakColor = T.textMuted;
          if (streak >= 7) streakColor = T.emerald;
          else if (streak >= 4) streakColor = T.sage;
          else if (streak >= 1) streakColor = T.aqua;

          return (
            <motion.div
              key={habit.id}
              initial={still ? false : { opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: still ? 0 : 0.35, ease }}
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
                      ...pressedStyle(checked, T.checkedCellBg, dark),
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <ClayCheck
                      checked={checked}
                      onChange={() => onToggleHabit(habit.id, dayKey)}
                      label={`${habit.name} — ${getDayLabel(day)} ${dayKey.slice(8)}`}
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
                {streak > 0 ? <><Flame /> {streak}</> : '—'}
              </div>
            </motion.div>
          );
        })}
        {/* Add habit row — the last band of the same panel */}
        <div style={{ borderTop: border }}>{addRow}</div>
        </div>
        )}
      </div>
    </div>
  );
}
