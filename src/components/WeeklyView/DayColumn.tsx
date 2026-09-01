import { useRef, useState } from 'react';
import { DonutChart } from '../ui/DonutChart';
import { TaskRow } from './TaskRow';
import { useLang } from '../../i18n';
import { useTheme } from '../../ThemeContext';
import type { DayEntry } from '../../utils/dataUtils';

interface DayColumnProps {
  dayLabel: string;
  dayNumber: string;
  monthLabel: string;
  dayKey: string;
  isToday: boolean;
  isPast: boolean;
  entries: DayEntry[];
  weekKey: string;
  /** Phone: one day fills the screen instead of being a 130px column. */
  fullWidth?: boolean;
  onAddTask: (weekKey: string, dayKey: string, text: string) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, text: string) => void;
  onDeleteTask: (taskId: string) => void;
  onConfetti?: () => void;
}

export function DayColumn({
  dayLabel, dayNumber, monthLabel, dayKey,
  isToday, isPast, entries, weekKey, fullWidth = false,
  onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onConfetti,
}: Readonly<DayColumnProps>) {
  const { dark, T } = useTheme();
  const { t } = useLang();
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  // A task that left for another day no longer counts toward this day's total.
  const live = entries.filter((e) => !e.migratedAway);
  const done = live.filter((e) => e.task.completed).length;
  const total = live.length;

  const wasFullRef = useRef(total > 0 && done === total);
  const isFullNow = total > 0 && done === total;
  if (!wasFullRef.current && isFullNow) { wasFullRef.current = true; onConfetti?.(); }
  if (!isFullNow) wasFullRef.current = false;

  const commitAdd = () => {
    const trimmed = newTaskText.trim();
    if (trimmed) onAddTask(weekKey, dayKey, trimmed);
    setNewTaskText('');
    setAddingTask(false);
  };

  const todayHeaderBg = dark ? 'rgba(107,155,127,0.22)' : 'rgba(74,124,89,0.12)';
  const normalHeaderBg = dark ? 'rgba(245,241,232,0.05)' : 'rgba(74,124,89,0.04)';
  const headerBg = isToday ? todayHeaderBg : normalHeaderBg;
  const headerBorder = isToday ? `1px solid ${T.glassBorderEm}` : `1px solid ${T.glassBorder}`;
  const colOpacity = isPast && !isToday ? 0.65 : 1;

  return (
    <div
      style={{
        flex: 1,
        minWidth: fullWidth ? 0 : 130,
        display: 'flex',
        flexDirection: 'column',
        opacity: colOpacity,
        borderRight: fullWidth ? 'none' : `1px solid ${T.glassBorder}`,
      }}
    >
      {/* Day header */}
      <div
        style={{
          background: headerBg,
          borderBottom: headerBorder,
          padding: '7px 8px',
          textAlign: 'center',
        }}
      >
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700, fontSize: 13,
          color: isToday ? T.emerald : T.textPrimary,
        }}>
          {dayLabel}
        </div>
        <div style={{ fontSize: 10, color: T.textMuted, marginTop: 1 }}>
          {monthLabel} {dayNumber}
        </div>
      </div>

      {/* Donut */}
      <div style={{
        background: T.glassBg,
        borderBottom: `1px solid ${T.glassBorder}`,
        padding: '12px 8px 8px',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <DonutChart done={done} total={total} size={90} strokeWidth={11} small />
      </div>

      {/* Task list */}
      <div style={{ background: T.glassBg, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {entries.map(({ task, migratedAway }) => (
          <TaskRow
            key={`${task.id}-${migratedAway ? 'from' : 'on'}`}
            task={task}
            migratedAway={migratedAway}
            onToggle={() => onToggleTask(task.id)}
            onUpdateText={(text) => onUpdateTask(task.id, text)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}

        {/* Add task */}
        <div style={{ borderBottom: `1px solid ${T.rowBorder}` }}>
            {addingTask ? (
              <div style={{ padding: '4px 8px' }}>
                <input
                  ref={addInputRef}
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onBlur={commitAdd}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitAdd();
                    if (e.key === 'Escape') { setAddingTask(false); setNewTaskText(''); }
                  }}
                  autoFocus
                  placeholder={t('week.taskPlaceholder')}
                  className="inline-edit"
                  style={{ fontSize: 12, color: T.textPrimary }}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: fullWidth ? '14px 12px' : '5px 8px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: fullWidth ? 14 : 11,
                  color: T.emerald, fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'opacity 0.15s',
                }}
              >
                {t('week.addTask')}
              </button>
            )}
        </div>
      </div>
    </div>
  );
}
