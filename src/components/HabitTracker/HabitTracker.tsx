import { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { AppData, Habit } from '../../types';
import { ProgressBar } from '../ui/ProgressBar';
import { Flame } from '../ui/Flame';
import { ClayCheck, ClayDot } from '../ui/ClayCheck';
import { addDays, formatDayKey, getWeekDays, parseDayKey } from '../../utils/dateUtils';
import { getHabitStreak, getHabitWeekCompletion } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';
import { pressedStyle } from '../../utils/color';
import { useLang } from '../../i18n';
import { useIsMobile } from '../../hooks/useMediaQuery';

const ease = [0.4, 0, 0.2, 1] as const;

/**
 * A day cell is a near-square hole in the sheet: 46 wide for a 24px pellet is
 * the density that reads at a glance. Anything wider turns the row into a set of
 * bars, which is why the grid lives in a rail rather than across a full screen.
 */
const CELL_W = 46;
const CELL_H = 38;

/**
 * The three fixed columns. In the rail they are tighter, because 46×7 for the
 * days is not negotiable — the days are the grid, the rest is annotation.
 */
const COLS = {
  page: { name: 172, week: 92, streak: 58 },
  rail: { name: 126, week: 80, streak: 40 },
};

interface HabitTrackerProps {
  data: AppData;
  currentWeekKey: string;
  onAddHabit: (name: string) => void;
  onUpdateHabitName: (habitId: string, name: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
  /**
   * Set when the grid is rendered inside the week panel: it drops its own
   * chrome, nav and week state, and follows the week the panel is showing —
   * which is the point: composing the two at App level would leave the grid on
   * its own week, silently disagreeing with the days beside it.
   */
  embeddedWeekKey?: string;
}

// No disabled state left: with both directions open, an arrow is never a
// dead end.
function NavBtn({ onClick, children }: Readonly<{
  onClick: () => void; children: React.ReactNode;
}>) {
  const { T } = useTheme();
  return (
    <button
      className="tap-target"
      onClick={onClick}
      style={{
        background: T.rowHoverBg,
        border: `1px solid ${T.glassBorderEm}`,
        color: T.emerald,
        width: 30, height: 30, cursor: 'pointer',
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
  const { t } = useLang();
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
          title={t('common.rename')}
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
          aria-label={t('habits.deleteHabit', { name: habit.name })}
          title={t('common.delete')}
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
  const { d: dates } = useLang();
  const { done, total } = getHabitWeekCompletion(habit, viewWeekKey);
  const streak = getHabitStreak(habit);
  const streakColor = streak > 0 ? T.emerald : T.textMuted;

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
              aria-label={`${habit.name} — ${dates.dayLabel(day)} ${formatDayKey(day).slice(8)}`}
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
                {dates.dayLabel(day)}
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
  onAddHabit, onUpdateHabitName, onDeleteHabit, onToggleHabit, embeddedWeekKey,
}: Readonly<HabitTrackerProps>) {
  const { T, dark } = useTheme();
  const { t, d: dates } = useLang();
  const isMobile = useIsMobile();
  const still = useReducedMotion() ?? false;
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [viewWeekKey, setViewWeekKey] = useState(currentWeekKey);
  const addInputRef = useRef<HTMLInputElement>(null);

  const embedded = embeddedWeekKey !== undefined;
  const viewKey = embeddedWeekKey ?? viewWeekKey;

  const isCurrentWeek = viewKey === currentWeekKey;
  const weekStart = parseDayKey(viewKey);
  const weekDays = getWeekDays(weekStart);

  // Unclamped, like the week panel it sits beside: blocking the grid from
  // following the week shown above it would be the odd behaviour, not the safe
  // one. Streaks walk backwards from today, so a future tick cannot inflate one.
  const navigateWeek = (dir: -1 | 1) => {
    setViewWeekKey(formatDayKey(addDays(parseDayKey(viewWeekKey), dir * 7)));
  };

  const commitAdd = () => {
    const trimmed = newHabitName.trim();
    if (trimmed) onAddHabit(trimmed);
    setNewHabitName('');
    setAddingHabit(false);
  };

  const border = `1px solid ${T.glassBorder}`;
  const col = embedded ? COLS.rail : COLS.page;

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
    minWidth: CELL_W,
    flex: 1,
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
          {dates.weekLabel(weekStart)}
        </span>
      </div>
      <NavBtn onClick={() => navigateWeek(1)}>›</NavBtn>
      {!isCurrentWeek && (
        <button
          onClick={() => setViewWeekKey(currentWeekKey)}
          style={{
            background: T.rowHoverBg, border: `1px solid ${T.glassBorderEm}`,
            color: T.emerald, padding: '4px 12px', cursor: 'pointer',
            fontSize: 11, fontWeight: 600, borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {t('common.today')}
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
          {t('habits.add')}
        </button>
      )}
    </>
  );

  return (
    <div style={embedded ? undefined : { padding: isMobile ? '12px' : '20px', overflowX: isMobile ? 'visible' : 'auto' }}>
      {/* 620 was a floor that also acted as a ceiling: the fixed cells added up
          to 644px and never grew. The day cells flex now. */}
      <div style={{ minWidth: embedded || isMobile ? 0 : 620 }}>

        {isMobile && !embedded ? (
          <>
            <div className="glass">{weekNav(false)}</div>
            <div style={{ marginTop: 10 }}>
            {data.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                weekDays={weekDays}
                viewWeekKey={viewKey}
                onUpdateName={(name) => onUpdateHabitName(habit.id, name)}
                onDelete={() => onDeleteHabit(habit.id)}
                onToggle={(dayKey) => onToggleHabit(habit.id, dayKey)}
              />
              ))}
            </div>
            <div className="glass" style={{ marginTop: 10 }}>{addRow}</div>
          </>
        ) : (
        <div className={embedded ? undefined : 'glass'}>
        {!embedded && weekNav(true)}
        {/* Header row */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${T.glassBorderEm}` }}>
          <div style={{ ...thStyle, minWidth: col.name, maxWidth: col.name, textAlign: 'left', paddingLeft: 10 }}>
            {t('habits.habit')}
          </div>
          {weekDays.map((day) => (
            <div key={formatDayKey(day)} style={thStyle}>
              <div>{dates.dayLabel(day)}</div>
              <div style={{ fontSize: 9, fontWeight: 400, color: T.textMuted }}>
                {formatDayKey(day).slice(8)}
              </div>
            </div>
          ))}
          <div style={{ ...thStyle, minWidth: col.week, maxWidth: col.week }}>{t('habits.week')}</div>
          <div style={{ ...thStyle, minWidth: col.streak, maxWidth: col.streak }}>{t('habits.streak')}</div>
        </div>

        {/* Habit rows */}
        {data.habits.map((habit, idx) => {
          const { done, total } = getHabitWeekCompletion(habit, viewKey);
          const streak = getHabitStreak(habit);
          const rowBg = idx % 2 === 0 ? T.glassBg : T.oddRowBg;
          const streakColor = streak > 0 ? T.emerald : T.textMuted;

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
                minWidth: col.name, maxWidth: col.name,
                borderRight: border, height: CELL_H,
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
                      flex: 1, minWidth: CELL_W, height: CELL_H,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRight: border,
                      ...pressedStyle(checked, T.checkedCellBg, dark),
                      transition: 'background 0.2s, box-shadow 0.2s',
                    }}
                  >
                    <ClayCheck
                      checked={checked}
                      onChange={() => onToggleHabit(habit.id, dayKey)}
                      label={`${habit.name} — ${dates.dayLabel(day)} ${dayKey.slice(8)}`}
                    />
                  </div>
                );
              })}

              {/* Progress bar */}
              <div style={{
                minWidth: col.week, maxWidth: col.week,
                padding: '0 10px', borderRight: border,
                display: 'flex', alignItems: 'center',
              }}>
                <ProgressBar done={done} total={total} height={5} showLabel />
              </div>

              {/* Streak */}
              <div style={{
                minWidth: col.streak, maxWidth: col.streak,
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
