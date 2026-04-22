import { useRef, useState } from 'react';
import type { Task } from '../../types';
import { DonutChart } from '../ui/DonutChart';
import { TaskRow } from './TaskRow';
import { T } from '../../theme';

interface DayColumnProps {
  dayLabel: string;
  dayNumber: string;
  monthLabel: string;
  dayKey: string;
  isToday: boolean;
  isPast: boolean;
  isReadOnly: boolean;
  tasks: Task[];
  weekKey: string;
  onAddTask: (weekKey: string, dayKey: string, text: string) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateTask: (taskId: string, text: string) => void;
  onDeleteTask: (taskId: string) => void;
  onConfetti?: () => void;
}

export function DayColumn({
  dayLabel, dayNumber, monthLabel, dayKey,
  isToday, isPast, isReadOnly, tasks, weekKey,
  onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onConfetti,
}: DayColumnProps) {
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const addInputRef = useRef<HTMLInputElement>(null);

  const done = tasks.filter((t) => t.completed).length;
  const total = tasks.length;

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

  // Header accent: today = emerald glow, past = muted, future = sage
  const headerBg = isToday
    ? 'rgba(107,155,127,0.25)'
    : isPast
      ? 'rgba(245,241,232,0.05)'
      : 'rgba(245,241,232,0.08)';

  const headerBorder = isToday
    ? `1px solid rgba(107,155,127,0.5)`
    : `1px solid ${T.glassBorder}`;

  const colOpacity = isPast && !isToday ? 0.65 : 1;

  return (
    <div
      style={{
        minWidth: 145,
        width: 145,
        display: 'flex',
        flexDirection: 'column',
        opacity: colOpacity,
        borderRight: `1px solid ${T.glassBorder}`,
      }}
    >
      {/* Day header */}
      <div
        style={{
          background: headerBg,
          border: headerBorder,
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          padding: '7px 8px',
          textAlign: 'center',
          boxShadow: isToday ? `0 2px 16px rgba(107,155,127,0.2)` : 'none',
        }}
      >
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 700, fontSize: 13,
          color: isToday ? T.emerald : T.textPrimary,
          textShadow: isToday ? T.glowEm : 'none',
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
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            isReadOnly={isReadOnly}
            onToggle={() => onToggleTask(task.id)}
            onUpdateText={(text) => onUpdateTask(task.id, text)}
            onDelete={() => onDeleteTask(task.id)}
          />
        ))}

        {/* Add task */}
        {!isReadOnly && (
          <div style={{ borderBottom: `1px solid rgba(245,241,232,0.05)` }}>
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
                  placeholder="Task name…"
                  className="inline-edit"
                  style={{ fontSize: 12, color: T.textPrimary }}
                />
              </div>
            ) : (
              <button
                onClick={() => setAddingTask(true)}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '5px 8px', background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 11,
                  color: T.emerald, fontWeight: 600,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'opacity 0.15s',
                }}
              >
                + Add task
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
