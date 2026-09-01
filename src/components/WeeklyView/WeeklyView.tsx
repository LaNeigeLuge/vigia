import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { AppData } from '../../types';
import { DayColumn } from './DayColumn';
import { Backlog } from './Backlog';
import {
  addDays, formatDayKey, getDayNumber,
  getWeekDays, isDatePast, isDateToday, parseDayKey,
} from '../../utils/dateUtils';
import { getDayEntries } from '../../utils/dataUtils';
import { useLang } from '../../i18n';
import { useTheme } from '../../ThemeContext';
import { useIsMobile, useIsWide } from '../../hooks/useMediaQuery';
import { HabitTracker } from '../HabitTracker/HabitTracker';
import { pressedStyle, shade } from '../../utils/color';

interface WeeklyViewProps {
  data: AppData;
  currentWeekKey: string;
  onAddTask: (weekKey: string, dayKey: string, text: string) => void;
  onToggleTask: (weekKey: string, taskId: string) => void;
  onUpdateTask: (weekKey: string, taskId: string, text: string) => void;
  onDeleteTask: (weekKey: string, taskId: string) => void;
  onAddTodo: (text: string) => void;
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  /** Habit handlers, forwarded to the embedded grid on wide screens. */
  onAddHabit: (name: string) => void;
  onUpdateHabitName: (habitId: string, name: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
}

export function WeeklyView({
  data, currentWeekKey,
  onAddTask, onToggleTask, onUpdateTask, onDeleteTask,
  onAddTodo, onToggleTodo, onDeleteTodo,
  onAddHabit, onUpdateHabitName, onDeleteHabit, onToggleHabit,
}: Readonly<WeeklyViewProps>) {
  const { T, dark } = useTheme();
  const { t, d: dates } = useLang();
  const isMobile = useIsMobile();
  const isWide = useIsWide();
  const [viewWeekKey, setViewWeekKey] = useState(currentWeekKey);
  const [selectedDayKey, setSelectedDayKey] = useState(() => formatDayKey(new Date()));
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

  const isCurrentWeek = viewWeekKey === currentWeekKey;
  const isPastWeek = viewWeekKey < currentWeekKey;
  const weekStart = parseDayKey(viewWeekKey);
  const weekDays = getWeekDays(weekStart);

  // Changing week has to move the phone's selected day into that week, or the
  // panel below the strip would render a day that isn't on screen. Derived
  // rather than synced in an effect, so there's no second render to clamp it.
  const dayKeys = weekDays.map(formatDayKey);
  const todayKey = formatDayKey(new Date());
  let activeDayKey = selectedDayKey;
  if (!dayKeys.includes(activeDayKey)) {
    activeDayKey = dayKeys.includes(todayKey) ? todayKey : dayKeys[0];
  }

  useEffect(() => {
    if (isMobile) return;
    if (isCurrentWeek && scrollRef.current && todayColRef.current) {
      const container = scrollRef.current;
      const col = todayColRef.current;
      const offset = col.offsetLeft - container.offsetWidth / 2 + col.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [isCurrentWeek, viewWeekKey, isMobile]);

  const handleConfetti = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.5 },
      colors: [T.emerald, '#a8d5b0', T.amber, T.aqua, T.sage],
    });
  }, [T]);

  // No clamp in either direction: a week ahead is where you lay out the work
  // before it happens, and a week behind is where you correct what you forgot
  // to tick. Both are the same seven editable columns.
  const navigateWeek = (dir: -1 | 1) => {
    setViewWeekKey(formatDayKey(addDays(parseDayKey(viewWeekKey), dir * 7)));
  };

  const renderDay = (dayKey: string, fullWidth: boolean) => {
    const day = parseDayKey(dayKey);
    return (
      <DayColumn
        dayLabel={dates.dayLabel(day)}
        dayNumber={getDayNumber(day)}
        monthLabel={dates.monthLabel(day)}
        dayKey={dayKey}
        isToday={isDateToday(day)}
        isPast={isDatePast(day)}
        entries={getDayEntries(data, dayKey)}
        weekKey={viewWeekKey}
        fullWidth={fullWidth}
        onAddTask={onAddTask}
        onToggleTask={(taskId) => onToggleTask(viewWeekKey, taskId)}
        onUpdateTask={(taskId, text) => onUpdateTask(viewWeekKey, taskId, text)}
        onDeleteTask={(taskId) => onDeleteTask(viewWeekKey, taskId)}
        onConfetti={isCurrentWeek ? handleConfetti : undefined}
      />
    );
  };

  return (
    <div style={{ padding: isMobile ? '12px' : '20px' }}>
      {/* One panel: header and body were two boxes glued together, the first
          borderless with a shadow and the second outlined — the app dropped
          outlines, so the seam showed. .glass already clips its children. */}
      <div className="glass">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '8px 16px',
            gap: 12,
            borderBottom: `1px solid ${T.glassBorderEm}`,
          }}
        >
        <NavBtn onClick={() => navigateWeek(-1)}>‹</NavBtn>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 14, color: T.textPrimary,
          }}>
            {dates.weekLabel(weekStart)}
          </span>
          {!isCurrentWeek && (
            <span style={{
              marginLeft: 10, fontSize: 10, color: T.textMuted,
              background: T.trackBg,
              padding: '3px 9px', borderRadius: 9999,
            }}>
              {t(isPastWeek ? 'week.past' : 'week.ahead')}
            </span>
          )}
        </div>

        <NavBtn onClick={() => navigateWeek(1)}>›</NavBtn>

        {!isCurrentWeek && (
          <button
            onClick={() => setViewWeekKey(currentWeekKey)}
            style={{
              background: T.rowHoverBg,
              border: `1px solid ${T.glassBorderEm}`,
              color: T.emerald, padding: '4px 12px',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              borderRadius: 8, fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {t('common.today')}
          </button>
        )}
      </div>

      <div style={{ display: isWide ? 'flex' : 'block', alignItems: 'stretch' }}>
      <div style={{ flex: 1, minWidth: 0 }}>

      {isMobile ? (
        /* Phone: pick a day, then that day fills the screen. No sideways scroll. */
        <>
          <div style={{
            display: 'flex', gap: 4,
            background: T.rowHoverBg, padding: '8px 6px',
            borderBottom: `1px solid ${T.glassBorder}`,
          }}>
            {weekDays.map((day) => {
              const dayKey = formatDayKey(day);
              const selected = dayKey === activeDayKey;
              const entries = getDayEntries(data, dayKey).filter((e) => !e.migratedAway);
              const allDone = entries.length > 0 && entries.every((e) => e.task.completed);

              return (
                <button
                  key={dayKey}
                  onClick={() => setSelectedDayKey(dayKey)}
                  aria-pressed={selected}
                  aria-label={`${dates.dayLabel(day)} ${getDayNumber(day)}`}
                  style={{
                    flex: 1, minWidth: 0, minHeight: 52,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                    ...pressedStyle(selected, T.checkedCellBg, dark),
                    border: `1px solid ${selected ? T.glassBorderEm : 'transparent'}`,
                    borderRadius: 10, cursor: 'pointer',
                    color: isDateToday(day) ? T.emerald : T.textSecondary,
                  }}
                >
                  <span style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>
                    {dates.dayLabel(day)}
                  </span>
                  <span style={{
                    fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15,
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {getDayNumber(day)}
                  </span>
                  {/* Shape, not colour alone — a dot only when the day is clear. */}
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: allDone ? T.emerald : 'transparent',
                  }} />
                </button>
              );
            })}
          </div>

          <div>{renderDay(activeDayKey, true)}</div>
        </>
      ) : (
        <>
        {/* The week as one rolled length of clay, blue → sage, the way the logo's
            wave becomes the mountain. Today is the sun and sits proud. It repeats
            what the day labels already say, so it carries no load of its own. */}
        <div style={{ display: 'flex', gap: 3, padding: '10px 0 2px' }} aria-hidden>
          {weekDays.map((day, i) => {
            const today = isDateToday(day);
            const c = today ? T.clayNext : T.dayBand[i];
            let radius = '3px';
            if (i === 0) radius = '9999px 3px 3px 9999px';
            else if (i === 6) radius = '3px 9999px 9999px 3px';
            return (
              <span
                key={formatDayKey(day)}
                style={{
                  flex: 1,
                  height: today ? 11 : 7,
                  marginTop: today ? -2 : 0,
                  borderRadius: today ? 9999 : radius,
                  backgroundImage: `linear-gradient(180deg, ${shade(c, 0.26)}, ${c} 62%)`,
                  boxShadow: dark
                    ? '0 1px 0 rgba(255,255,255,0.16) inset, 0 3px 8px rgba(0,0,0,0.45)'
                    : '0 1px 0 rgba(255,255,255,0.55) inset, 0 3px 7px rgba(80,64,48,0.20)',
                }}
              />
            );
          })}
        </div>

        {/* Scrollable day columns */}
        <div
          ref={scrollRef}
          className="weekly-scroll"
          style={{ display: 'flex' }}
        >
          {weekDays.map((day, i) => {
            const dayKey = formatDayKey(day);
            return (
              <div
                key={dayKey}
                ref={isDateToday(day) ? todayColRef : undefined}
                // flex:1 was missing here, so DayColumn's own flex:1 applied
                // inside a wrapper that never grew — the seven columns stopped
                // at their intrinsic 130px and left ~875px of panel empty.
                style={{
                  flex: 1, minWidth: 0,
                  borderLeft: i > 0 ? `1px solid ${T.glassBorder}` : 'none',
                }}
              >
                {renderDay(dayKey, false)}
              </div>
            );
          })}
        </div>
        </>
      )}

      </div>

      {/* The habit grid takes the rail rather than the full width under the
          days. Its cells only read at ~46px, and a full-width row stretched
          them into bars. 42% rather than 40: at the 1440 breakpoint the panel is
          ~1385 wide, and 40% leaves the seven cells 46.0px with nothing to
          spare — the first 1px of rounding overflows the rail. 42% gives ~48.
          Losing the alignment with the day columns above is the deliberate trade. */}
      {isWide && (
        <div style={{ width: '42%', flexShrink: 0, borderLeft: `1px solid ${T.glassBorder}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '12px 14px 2px',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10,
            textTransform: 'uppercase', letterSpacing: '0.14em', color: T.textMuted,
          }}>
            {t('nav.habits')}
            <span style={{ flex: 1, height: 1, background: T.glassBorder }} />
          </div>
          <HabitTracker
            data={data}
            currentWeekKey={currentWeekKey}
            embeddedWeekKey={viewWeekKey}
            onAddHabit={onAddHabit}
            onUpdateHabitName={onUpdateHabitName}
            onDeleteHabit={onDeleteHabit}
            onToggleHabit={onToggleHabit}
          />
        </div>
      )}
      </div>

      </div>

      {/* Undated, so it has no business on the day axis — its own panel below,
          full width, at every size. */}
      <Backlog
        todos={data.todos}
        onAdd={onAddTodo}
        onToggle={onToggleTodo}
        onDelete={onDeleteTodo}
      />
    </div>
  );
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
