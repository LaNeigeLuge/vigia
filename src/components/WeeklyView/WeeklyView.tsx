import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import type { AppData, Todo } from '../../types';
import { DayColumn } from './DayColumn';
import { Backlog } from './Backlog';
import {
  addDays, formatWeekLabel, formatDayKey,
  getDayLabel, getDayNumber, getMonthLabel,
  getWeekDays, isDatePast, isDateToday, parseDayKey,
} from '../../utils/dateUtils';
import { getDayTasks } from '../../utils/dataUtils';
import { useTheme } from '../../ThemeContext';

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
}

export function WeeklyView({
  data, currentWeekKey,
  onAddTask, onToggleTask, onUpdateTask, onDeleteTask,
  onAddTodo, onToggleTodo, onDeleteTodo,
}: Readonly<WeeklyViewProps>) {
  const { T } = useTheme();
  const [viewWeekKey, setViewWeekKey] = useState(currentWeekKey);
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayColRef = useRef<HTMLDivElement>(null);

  const isCurrentWeek = viewWeekKey === currentWeekKey;
  const weekStart = parseDayKey(viewWeekKey);
  const weekDays = getWeekDays(weekStart);

  useEffect(() => {
    if (isCurrentWeek && scrollRef.current && todayColRef.current) {
      const container = scrollRef.current;
      const col = todayColRef.current;
      const offset = col.offsetLeft - container.offsetWidth / 2 + col.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [isCurrentWeek, viewWeekKey]);

  const handleConfetti = useCallback(() => {
    confetti({
      particleCount: 90,
      spread: 65,
      origin: { y: 0.5 },
      colors: [T.emerald, '#a8d5b0', T.amber, T.aqua, T.sage],
    });
  }, [T]);

  const navigateWeek = (dir: -1 | 1) => {
    const next = formatDayKey(addDays(parseDayKey(viewWeekKey), dir * 7));
    if (dir === 1 && next > currentWeekKey) return;
    setViewWeekKey(next);
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Week nav header */}
      <div
        className="glass"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          gap: 12,
          marginBottom: 0,
          borderRadius: '2px 2px 0 0',
        }}
      >
        <NavBtn onClick={() => navigateWeek(-1)}>‹</NavBtn>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 14, color: T.textPrimary,
          }}>
            {formatWeekLabel(weekStart)}
          </span>
          {!isCurrentWeek && (
            <span style={{
              marginLeft: 10, fontSize: 10, color: T.textMuted,
              background: T.trackBg,
              padding: '2px 7px', borderRadius: 2,
            }}>
              Read-only
            </span>
          )}
        </div>

        <NavBtn onClick={() => navigateWeek(1)} disabled={isCurrentWeek}>›</NavBtn>

        {!isCurrentWeek && (
          <button
            onClick={() => setViewWeekKey(currentWeekKey)}
            style={{
              background: T.rowHoverBg,
              border: `1px solid ${T.glassBorderEm}`,
              color: T.emerald, padding: '4px 12px',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              borderRadius: 2, fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Today
          </button>
        )}
      </div>

      {/* Scrollable day columns */}
      <div
        ref={scrollRef}
        className="weekly-scroll"
        style={{
          display: 'flex',
          border: `1px solid ${T.glassBorder}`,
          borderTop: 'none',
          borderRadius: '0 0 2px 2px',
          overflow: 'hidden',
        }}
      >
        {weekDays.map((day, i) => {
          const dayKey = formatDayKey(day);
          const isToday = isDateToday(day);
          const isPast = isDatePast(day);
          const tasks = getDayTasks(data, viewWeekKey, dayKey);

          return (
            <div
              key={dayKey}
              ref={isToday ? todayColRef : undefined}
              style={{ borderLeft: i > 0 ? `1px solid ${T.glassBorder}` : 'none' }}
            >
              <DayColumn
                dayLabel={getDayLabel(day)}
                dayNumber={getDayNumber(day)}
                monthLabel={getMonthLabel(day)}
                dayKey={dayKey}
                isToday={isToday}
                isPast={isPast}
                isReadOnly={!isCurrentWeek}
                tasks={tasks}
                weekKey={viewWeekKey}
                onAddTask={onAddTask}
                onToggleTask={(taskId) => onToggleTask(viewWeekKey, taskId)}
                onUpdateTask={(taskId, text) => onUpdateTask(viewWeekKey, taskId, text)}
                onDeleteTask={(taskId) => onDeleteTask(viewWeekKey, taskId)}
                onConfetti={isCurrentWeek ? handleConfetti : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Backlog intemporel */}
      <Backlog
        todos={data.todos}
        onAdd={onAddTodo}
        onToggle={onToggleTodo}
        onDelete={onDeleteTodo}
      />
    </div>
  );
}

function NavBtn({ onClick, disabled = false, children }: Readonly<{
  onClick: () => void; disabled?: boolean; children: React.ReactNode;
}>) {
  const { T } = useTheme();
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? 'transparent' : T.rowHoverBg,
        border: `1px solid ${disabled ? T.glassBorder : T.glassBorderEm}`,
        color: disabled ? T.textMuted : T.emerald,
        width: 30, height: 30, cursor: disabled ? 'default' : 'pointer',
        fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 2, transition: 'all 0.18s',
      }}
    >
      {children}
    </button>
  );
}
