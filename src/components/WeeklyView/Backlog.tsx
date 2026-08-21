import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Todo } from '../../types';
import { useTheme } from '../../ThemeContext';
import { ClayCheck } from '../ui/ClayCheck';

interface BacklogProps {
  todos: Todo[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Backlog({ todos, onAdd, onToggle, onDelete }: Readonly<BacklogProps>) {
  const { T } = useTheme();
  const still = useReducedMotion() ?? false;
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pending   = todos.filter((t) => !t.completed);
  const completed = todos.filter((t) => t.completed);

  const commit = () => {
    const trimmed = text.trim();
    if (trimmed) onAdd(trimmed);
    setText('');
    setAdding(false);
  };

  const border = `1px solid ${T.glassBorder}`;

  return (
    <div style={{ marginTop: 12 }}>
      <div className="glass">

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: T.rowHoverBg,
          borderBottom: `1px solid ${T.glassBorderEm}`,
          padding: '8px 14px',
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700,
            fontSize: 10, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: T.emerald,
          }}>
            Backlog
            {pending.length > 0 && (
              <span style={{
                marginLeft: 8, background: T.emerald, color: '#fff',
                borderRadius: 9999, padding: '2px 8px', fontSize: 10, fontWeight: 700,
              }}>
                {pending.length}
              </span>
            )}
          </div>
          {!adding && (
            <button
              onClick={() => { setAdding(true); setTimeout(() => inputRef.current?.focus(), 0); }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: T.emerald, fontWeight: 700, fontSize: 12,
                fontFamily: 'DM Sans, sans-serif', padding: '2px 6px',
              }}
            >
              + Ajouter
            </button>
          )}
        </div>

        {/* Add input */}
        <AnimatePresence>
          {adding && (
            <motion.div
              initial={still ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '8px 14px', borderBottom: border }}>
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onBlur={commit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commit();
                    if (e.key === 'Escape') { setAdding(false); setText(''); }
                  }}
                  placeholder="Nouvelle tâche…"
                  className="inline-edit"
                  style={{ fontSize: 13, color: T.textPrimary, width: '100%' }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pending todos */}
        {pending.map((todo) => (
          <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
        ))}

        {/* Completed todos (collapsed visually) */}
        {completed.length > 0 && (
          <>
            <div style={{
              padding: '5px 14px',
              borderTop: border,
              fontSize: 10, fontWeight: 600,
              color: T.textMuted,
              fontFamily: 'DM Sans, sans-serif',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Terminé ({completed.length})
            </div>
            {completed.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={onToggle} onDelete={onDelete} />
            ))}
          </>
        )}

        {todos.length === 0 && !adding && (
          <div style={{
            padding: '20px 14px', textAlign: 'center',
            color: T.textMuted, fontSize: 12,
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Aucune tâche — clique sur "+ Ajouter"
          </div>
        )}
      </div>
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: Readonly<{
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}>) {
  const { T } = useTheme();

  return (
    <div
      className="row"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '8px 14px',
        borderBottom: `1px solid ${T.rowBorder}`,
        transition: 'background 0.15s',
        '--row-hover': T.rowHoverBg,
      } as React.CSSProperties}
    >
      <ClayCheck
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        label={todo.text}
      />
      <span style={{
        flex: 1, fontSize: 13,
        fontFamily: 'DM Sans, sans-serif',
        color: todo.completed ? T.textMuted : T.textSecondary,
        textDecoration: todo.completed ? 'line-through' : 'none',
        opacity: todo.completed ? 0.55 : 1,
        wordBreak: 'break-word',
      }}>
        {todo.text}
      </span>
      <button
        className="row-action"
        onClick={() => onDelete(todo.id)}
        style={{
          background: 'none', border: 'none', color: T.textMuted,
          cursor: 'pointer', fontSize: 16, lineHeight: 1,
          padding: '0 2px',
        }}
        aria-label={`Supprimer ${todo.text}`}
        title="Supprimer"
      >
        ×
      </button>
    </div>
  );
}
