import { useRef, useState } from 'react';
import type { Task } from '../../types';
import { useLang } from '../../i18n';
import { useTheme } from '../../ThemeContext';
import { ClayCheck } from '../ui/ClayCheck';

interface TaskRowProps {
  task: Task;
  /** Rendered as the bullet-journal `>` trace on the day the task left. */
  migratedAway?: boolean;
  onToggle: () => void;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
}

export function TaskRow({ task, migratedAway = false, onToggle, onUpdateText, onDelete }: Readonly<TaskRowProps>) {
  const { T } = useTheme();
  const { t } = useLang();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [checkAnim, setCheckAnim] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    setCheckAnim(true);
    setTimeout(() => setCheckAnim(false), 300);
    onToggle();
  };

  const handleTextClick = () => {
    if (task.completed || migratedAway) return;
    setIsEditing(true);
    setEditText(task.text);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const trimmed = editText.trim();
    if (trimmed && trimmed !== task.text) onUpdateText(trimmed);
    else if (!trimmed) onDelete();
  };

  return (
    <div
      className="row"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        padding: '5px 8px',
        borderBottom: `1px solid ${T.rowBorder}`,
        transition: 'background 0.15s',
        '--row-hover': task.completed ? 'transparent' : T.rowHoverBg,
      } as React.CSSProperties}
    >
      {migratedAway ? (
        <span
          title={t('week.movedElsewhere')}
          style={{
            width: 13, flexShrink: 0, marginTop: 1, textAlign: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 13, lineHeight: 1.2, color: T.amber,
          }}
        >
          {'>'}
        </span>
      ) : (
        <span className={checkAnim ? 'check-animate' : ''} style={{ display: 'flex', marginTop: 1 }}>
          <ClayCheck
            checked={task.completed}
            onChange={handleToggle}
            label={task.text}
          />
        </span>
      )}

      {isEditing ? (
        <input
          ref={inputRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setIsEditing(false); setEditText(task.text); }
          }}
          className="inline-edit"
          style={{ fontSize: 12, color: T.textPrimary }}
        />
      ) : (
        <button
          onClick={handleTextClick}
          style={{
            flex: 1,
            textAlign: 'left',
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 12,
            color: task.completed || migratedAway ? T.textMuted : T.textSecondary,
            textDecoration: task.completed || migratedAway ? 'line-through' : 'none',
            opacity: task.completed || migratedAway ? 0.5 : 1,
            cursor: task.completed || migratedAway ? 'default' : 'text',
            wordBreak: 'break-word',
            transition: 'all 0.25s',
            fontFamily: 'DM Sans, sans-serif',
          }}
        >
          {task.text}
        </button>
      )}

      {!isEditing && !migratedAway && (
        <button
          className="row-action"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: 'none', border: 'none',
            color: T.textMuted, cursor: 'pointer',
            fontSize: 14, padding: '0 2px', lineHeight: 1,
            transition: 'color 0.15s',
          }}
          aria-label={t('week.deleteTask', { name: task.text })}
          title={t('common.delete')}
        >
          ×
        </button>
      )}
    </div>
  );
}
