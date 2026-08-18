import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppData, Task } from '../../types';
import { useTheme } from '../../ThemeContext';
import {
  addDays, formatDayKey, getDayNumber, getISOWeekNumber,
  getMonthYearLabelFr, getWeekdayLabelFr, getWeekStartKey,
} from '../../utils/dateUtils';
import { getDayEntries, getHabitStreak } from '../../utils/dataUtils';

const ease = [0.4, 0, 0.2, 1] as const;

/** Bullet-journal notation. `>` means migrated to another day. */
const GLYPH = { open: '•', done: '✗', migrated: '>' } as const;

interface TodayProps {
  data: AppData;
  onAddTask: (weekKey: string, dayKey: string, text: string) => void;
  onToggleTask: (weekKey: string, taskId: string) => void;
  onUpdateTask: (weekKey: string, taskId: string, text: string) => void;
  onDeleteTask: (weekKey: string, taskId: string) => void;
  onMigrateTask: (weekKey: string, taskId: string, toDayKey: string | null) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
}

// ─── Dated header ─────────────────────────────────────────────────────────────

function StatCell({ value, label }: Readonly<{ value: string; label: string }>) {
  const { T } = useTheme();
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26,
        color: T.margin, lineHeight: 1,
        // Keeps the three cells from jittering as the numbers change width.
        fontVariantNumeric: 'tabular-nums',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10, marginTop: 4, color: T.marginInk,
        fontFamily: 'DM Sans, sans-serif', fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '0.1em',
      }}>
        {label}
      </div>
    </div>
  );
}

// ─── One line of the log ──────────────────────────────────────────────────────

function LogRow({
  task, migratedAway, onToggle, onUpdateText, onDelete, onMigrate,
}: Readonly<{
  task: Task;
  migratedAway: boolean;
  onToggle: () => void;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
  onMigrate: (toDayKey: string | null) => void;
}>) {
  const { T } = useTheme();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitEdit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== task.text) onUpdateText(trimmed);
    else if (!trimmed) onDelete();
  };

  const startEdit = () => {
    setEditing(true);
    setDraft(task.text);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  let glyph: string = GLYPH.open;
  if (migratedAway) glyph = GLYPH.migrated;
  else if (task.completed) glyph = GLYPH.done;

  const struck = migratedAway || task.completed;

  return (
    <div style={{ borderBottom: `1px solid ${T.sheetDot}` }}>
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 44 }}>

        {/* Margin rail + notation glyph — also the done toggle */}
        <button
          onClick={migratedAway ? undefined : onToggle}
          disabled={migratedAway}
          aria-label={migratedAway ? `${task.text} — migrée` : `Marquer ${task.text} comme faite`}
          aria-pressed={migratedAway ? undefined : task.completed}
          style={{
            width: 44, flexShrink: 0,
            background: 'none', border: 'none',
            borderRight: `1px solid ${T.margin}`,
            color: T.margin,
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18,
            cursor: migratedAway ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {glyph}
        </button>

        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') { setEditing(false); setDraft(task.text); }
            }}
            className="inline-edit"
            style={{ flex: 1, padding: '0 14px', fontSize: 15, color: T.textPrimary }}
          />
        ) : (
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            style={{
              flex: 1, textAlign: 'left', background: 'none', border: 'none',
              padding: '10px 14px', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.5,
              color: struck ? T.textMuted : T.textPrimary,
              textDecoration: struck ? 'line-through' : 'none',
              opacity: struck ? 0.55 : 1,
              wordBreak: 'break-word',
            }}
          >
            {task.text}
          </button>
        )}
      </div>

      {/* Tap-revealed actions. Deliberately buttons, not a swipe: WCAG 2.2 AA
          wants a single-pointer path that isn't a gesture. */}
      <AnimatePresence initial={false}>
        {open && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', paddingLeft: 44, background: T.sheetDot }}>
              {migratedAway ? (
                <ActionBtn onClick={() => { onMigrate(null); setOpen(false); }}>
                  ↩ Annuler la migration
                </ActionBtn>
              ) : (
                <>
                  <ActionBtn onClick={() => { onMigrate(formatDayKey(addDays(new Date(), 1))); setOpen(false); }}>
                    {GLYPH.migrated} Demain
                  </ActionBtn>
                  <ActionBtn onClick={() => { setOpen(false); startEdit(); }}>✎ Modifier</ActionBtn>
                  <ActionBtn onClick={onDelete} danger>× Supprimer</ActionBtn>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActionBtn({ onClick, children, danger = false }: Readonly<{
  onClick: () => void; children: React.ReactNode; danger?: boolean;
}>) {
  const { T } = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, minHeight: 48,
        background: 'none', border: 'none',
        borderRight: `1px solid ${T.sheetDot}`,
        color: danger ? '#b3402f' : T.marginInk,
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function Today({
  data, onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onMigrateTask, onToggleHabit,
}: Readonly<TodayProps>) {
  const { T } = useTheme();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const addRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const dayKey = formatDayKey(today);
  const weekKey = getWeekStartKey(today);

  const entries = getDayEntries(data, dayKey);
  const remaining = entries.filter((e) => !e.migratedAway && !e.task.completed).length;
  const streak = data.habits.reduce((best, h) => Math.max(best, getHabitStreak(h)), 0);

  const commitAdd = () => {
    const trimmed = newText.trim();
    if (trimmed) onAddTask(weekKey, dayKey, trimmed);
    setNewText('');
    setAdding(false);
  };

  const sheet: React.CSSProperties = {
    background: T.sheet,
    border: `1px solid ${T.sheetDot}`,
    borderRadius: 2,
    // 24px dot grid — the page under the writing.
    backgroundImage: `radial-gradient(${T.sheetDot} 1px, transparent 1px)`,
    backgroundSize: '24px 24px',
  };

  return (
    <div style={{ padding: '16px 12px', maxWidth: 640, margin: '0 auto' }}>

      {/* Dated header */}
      <div style={{ ...sheet, padding: '20px 18px 16px', marginBottom: 12 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.18em', color: T.marginInk,
        }}>
          {getWeekdayLabelFr(today)}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
          <span style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 46,
            color: T.textPrimary, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {getDayNumber(today)}
          </span>
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: T.marginInk }}>
            {getMonthYearLabelFr(today)}
          </span>
        </div>

        <div style={{
          display: 'flex', marginTop: 18, paddingTop: 14,
          borderTop: `1px solid ${T.margin}`,
        }}>
          <StatCell value={String(remaining)} label="restant" />
          <StatCell value={String(getISOWeekNumber(today))} label="semaine" />
          <StatCell value={String(streak)} label="série" />
        </div>
      </div>

      {/* The log */}
      <div style={{ ...sheet, marginBottom: 12, overflow: 'hidden' }}>
        {entries.map(({ task, migratedAway }) => (
          <LogRow
            key={`${task.id}-${migratedAway ? 'from' : 'on'}`}
            task={task}
            migratedAway={migratedAway}
            onToggle={() => onToggleTask(task.weekStart, task.id)}
            onUpdateText={(text) => onUpdateTask(task.weekStart, task.id, text)}
            onDelete={() => onDeleteTask(task.weekStart, task.id)}
            onMigrate={(to) => onMigrateTask(task.weekStart, task.id, to)}
          />
        ))}

        {entries.length === 0 && !adding && (
          <div style={{
            padding: '28px 16px', textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: T.marginInk,
          }}>
            Rien d'écrit aujourd'hui.
          </div>
        )}

        {adding ? (
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 44 }}>
            <span style={{
              width: 44, flexShrink: 0, textAlign: 'center',
              borderRight: `1px solid ${T.margin}`, alignSelf: 'stretch',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: T.margin,
            }}>
              {GLYPH.open}
            </span>
            <input
              ref={addRef}
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitAdd();
                if (e.key === 'Escape') { setAdding(false); setNewText(''); }
              }}
              autoFocus
              placeholder="Écrire une entrée…"
              className="inline-edit"
              style={{ flex: 1, padding: '0 14px', fontSize: 15, color: T.textPrimary }}
            />
          </div>
        ) : (
          <button
            onClick={() => { setAdding(true); setTimeout(() => addRef.current?.focus(), 0); }}
            style={{
              display: 'block', width: '100%', minHeight: 48, textAlign: 'left',
              padding: '0 14px 0 44px', background: 'none', border: 'none',
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
              fontSize: 14, fontWeight: 600, color: T.marginInk,
            }}
          >
            + Ajouter une entrée
          </button>
        )}
      </div>

      {/* Tracker */}
      <div style={{ ...sheet, overflow: 'hidden' }}>
        <div style={{
          padding: '10px 14px', borderBottom: `1px solid ${T.margin}`,
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 10,
          textTransform: 'uppercase', letterSpacing: '0.16em', color: T.marginInk,
        }}>
          Tracker
        </div>

        {data.habits.map((habit) => {
          const done = !!habit.completions[dayKey];
          return (
            <button
              key={habit.id}
              onClick={() => onToggleHabit(habit.id, dayKey)}
              aria-pressed={done}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                minHeight: 44, padding: 0,
                background: 'none', border: 'none',
                borderBottom: `1px solid ${T.sheetDot}`,
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{
                width: 44, flexShrink: 0, alignSelf: 'stretch',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: `1px solid ${T.margin}`,
                fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18,
                color: done ? T.emerald : T.margin,
              }}>
                {done ? '✗' : '○'}
              </span>
              <span style={{
                padding: '10px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 15,
                color: done ? T.textMuted : T.textPrimary,
                textDecoration: done ? 'line-through' : 'none',
                opacity: done ? 0.55 : 1,
              }}>
                {habit.name}
              </span>
            </button>
          );
        })}

        {data.habits.length === 0 && (
          <div style={{
            padding: '20px 16px', textAlign: 'center',
            fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: T.marginInk,
          }}>
            Aucune habitude — ajoute-les dans Habitudes.
          </div>
        )}
      </div>
    </div>
  );
}
