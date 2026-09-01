import { useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { AppData, Task } from '../../types';
import { useLang } from '../../i18n';
import { useTheme } from '../../ThemeContext';
import {
  addDays, formatDayKey, getDayNumber, getISOWeekNumber,
  getWeekStartKey,
} from '../../utils/dateUtils';
import { getDayEntries, getHabitStreak } from '../../utils/dataUtils';
import { shade } from '../../utils/color';

const ease = [0.4, 0, 0.2, 1] as const;

/** Bullet-journal notation, kept as the non-colour channel. */
const GLYPH = { task: '•', done: '✗', moved: '>', habit: '○' } as const;

/**
 * Rolled clay: a light→dark ramp lit from the top left, a lift shadow, and a
 * highlight on the upper edge. Done presses the strip *into* the ground rather
 * than greying it out — the shape carries the state, so the label never has to
 * fade below its contrast floor.
 */
function claySurface(colour: string, ground: string, done: boolean, dark: boolean) {
  if (done) {
    return {
      background: `color-mix(in oklab, ${colour} 40%, ${ground})`,
      boxShadow: dark
        ? 'inset 0 3px 8px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.12)'
        : 'inset 0 3px 7px rgba(80,64,48,0.26), inset 0 -1px 0 rgba(255,255,255,0.40)',
    };
  }
  return {
    backgroundImage: `linear-gradient(158deg, ${shade(colour, 0.24)}, ${colour} 52%, ${shade(colour, -0.16)})`,
    boxShadow: dark
      ? '0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.40) inset, 0 6px 16px rgba(0,0,0,0.45)'
      : '0 1px 0 rgba(255,255,255,0.55) inset, 0 -1px 0 rgba(60,45,30,0.14) inset, 0 5px 12px rgba(80,64,48,0.18)',
  };
}

interface TodayProps {
  data: AppData;
  onAddTask: (weekKey: string, dayKey: string, text: string) => void;
  onToggleTask: (weekKey: string, taskId: string) => void;
  onUpdateTask: (weekKey: string, taskId: string, text: string) => void;
  onDeleteTask: (weekKey: string, taskId: string) => void;
  onMigrateTask: (weekKey: string, taskId: string, toDayKey: string | null) => void;
  onToggleHabit: (habitId: string, dayKey: string) => void;
}

// ─── One clay strip ───────────────────────────────────────────────────────────

function Strip({
  colour, glyph, label, done, dim, onToggle, children,
}: Readonly<{
  colour: string;
  glyph: string;
  label: string;
  done: boolean;
  /** The `>` trace of an entry that left: readable, not operable. */
  dim?: boolean;
  onToggle?: () => void;
  /** Slot for the ⋯ button, so the strip stays one tap = one toggle. */
  children?: React.ReactNode;
}>) {
  const { T, dark } = useTheme();
  const { t } = useLang();

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <button
        onClick={onToggle}
        disabled={!onToggle}
        aria-pressed={onToggle ? done : undefined}
        aria-label={t(onToggle ? 'today.markDone' : 'today.moved', { name: label })}
        style={{
          flex: 1, minWidth: 0, minHeight: 48,
          display: 'flex', alignItems: 'center', gap: 11,
          padding: '12px 52px 12px 17px',
          textAlign: 'left', border: 'none', borderRadius: 9999,
          color: T.clayInk,
          cursor: onToggle ? 'pointer' : 'default',
          opacity: dim ? 0.72 : 1,
          transition: 'background 0.18s, box-shadow 0.18s, transform 0.12s',
          ...claySurface(colour, T.bg, done, dark),
        }}
      >
        <span aria-hidden style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
          width: 13, flexShrink: 0, textAlign: 'center', opacity: 0.85,
        }}>
          {glyph}
        </span>
        <span style={{
          fontFamily: 'DM Sans, sans-serif', fontSize: 15, lineHeight: 1.4,
          textDecoration: done || dim ? 'line-through' : 'none',
          wordBreak: 'break-word',
        }}>
          {label}
        </span>
      </button>
      {children}
    </div>
  );
}

/** Opens the action row. Separate from the strip so one tap stays one toggle. */
function MoreBtn({ open, onClick, label }: Readonly<{
  open: boolean; onClick: () => void; label: string;
}>) {
  const { T } = useTheme();
  const { t } = useLang();
  return (
    <button
      onClick={onClick}
      aria-expanded={open}
      aria-label={t('today.actions', { name: label })}
      style={{
        position: 'absolute', right: 4, top: 0, bottom: 0,
        width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', borderRadius: 9999,
        color: T.clayInk, opacity: 0.55, cursor: 'pointer',
        fontSize: 17, letterSpacing: '0.08em',
      }}
    >
      ⋯
    </button>
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
        flex: 1, minHeight: 46,
        background: 'none', border: 'none',
        color: danger ? '#b3402f' : T.textSecondary,
        fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function LogStrip({
  task, migratedAway, isNext, onToggle, onUpdateText, onDelete, onMigrate,
}: Readonly<{
  task: Task;
  migratedAway: boolean;
  isNext: boolean;
  onToggle: () => void;
  onUpdateText: (text: string) => void;
  onDelete: () => void;
  onMigrate: (toDayKey: string | null) => void;
}>) {
  const { T } = useTheme();
  const { t } = useLang();
  const still = useReducedMotion() ?? false;
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

  let colour = T.clayTask;
  if (migratedAway) colour = T.clayMoved;
  else if (isNext) colour = T.clayNext;

  let glyph: string = GLYPH.task;
  if (migratedAway) glyph = GLYPH.moved;
  else if (task.completed) glyph = GLYPH.done;

  if (editing) {
    return (
      <div style={{
        minHeight: 48, display: 'flex', alignItems: 'center',
        padding: '0 17px', borderRadius: 9999,
        boxShadow: `0 0 0 2px ${T.glassBorderEm} inset`,
      }}>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') { setEditing(false); setDraft(task.text); }
          }}
          autoFocus
          className="inline-edit"
          style={{ fontSize: 15, color: T.textPrimary }}
        />
      </div>
    );
  }

  return (
    <div>
      <Strip
        colour={colour}
        glyph={glyph}
        label={task.text}
        done={task.completed}
        dim={migratedAway}
        onToggle={migratedAway ? undefined : onToggle}
      >
        <MoreBtn open={open} onClick={() => setOpen((v) => !v)} label={task.text} />
      </Strip>

      {/* Buttons, never a swipe: WCAG 2.2 AA wants a single-pointer path that
          isn't a gesture. */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={still ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={still ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: still ? 0 : 0.18, ease }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', padding: '0 12px' }}>
              {migratedAway ? (
                <ActionBtn onClick={() => { onMigrate(null); setOpen(false); }}>
                  ↩ Annuler la migration
                </ActionBtn>
              ) : (
                <>
                  <ActionBtn onClick={() => { onMigrate(formatDayKey(addDays(new Date(), 1))); setOpen(false); }}>
                    {GLYPH.moved} Demain
                  </ActionBtn>
                  <ActionBtn onClick={() => {
                    setOpen(false); setEditing(true); setDraft(task.text);
                    setTimeout(() => inputRef.current?.focus(), 0);
                  }}>
                    ✎ Modifier
                  </ActionBtn>
                  <ActionBtn onClick={onDelete} danger>{t('today.delete')}</ActionBtn>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function Today({
  data, onAddTask, onToggleTask, onUpdateTask, onDeleteTask, onMigrateTask, onToggleHabit,
}: Readonly<TodayProps>) {
  const { T } = useTheme();
  const { t, d: dates } = useLang();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const addRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const dayKey = formatDayKey(today);
  const weekKey = getWeekStartKey(today);

  const entries = getDayEntries(data, dayKey);
  const streak = data.habits.reduce((best, h) => Math.max(best, getHabitStreak(h)), 0);

  /**
   * One sun per day, like the logo. The first open task, or the first open habit
   * if every task is done — never two.
   */
  const nextTaskId = entries.find((e) => !e.migratedAway && !e.task.completed)?.task.id;
  const nextHabitId = nextTaskId
    ? undefined
    : data.habits.find((h) => !h.completions[dayKey])?.id;

  const commitAdd = () => {
    const trimmed = newText.trim();
    if (trimmed) onAddTask(weekKey, dayKey, trimmed);
    setNewText('');
    setAdding(false);
  };

  return (
    <div style={{ padding: '20px 14px', maxWidth: 640, margin: '0 auto' }}>

      {/* The date, big. No stat tiles: aggregates belong to the summary, and
          duplicating them here was the one thing making the two columns
          compete. */}
      <header style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.18em', color: T.textMuted,
        }}>
          {dates.weekdayLabel(today)}
        </div>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 76,
          lineHeight: 0.86, letterSpacing: '-0.05em', margin: '4px 0 2px',
          color: T.clayTask, fontVariantNumeric: 'tabular-nums',
          backgroundImage: `linear-gradient(158deg, ${shade(T.clayTask, 0.28)}, ${T.clayTask} 46%, ${shade(T.clayTask, -0.18)})`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {getDayNumber(today)}
        </div>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 11,
          textTransform: 'uppercase', letterSpacing: '0.14em', color: T.textMuted,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {dates.monthYearLabel(today)} · s{getISOWeekNumber(today)}
          {streak > 0 && ` ${t('today.streak', { n: streak })}`}
        </div>
      </header>

      {/* Tasks then habits, one list. Colour separates them, so no section
          heading is needed. */}
      <div style={{ display: 'grid', gap: 8 }}>
        {entries.map(({ task, migratedAway }) => (
          <LogStrip
            key={`${task.id}-${migratedAway ? 'from' : 'on'}`}
            task={task}
            migratedAway={migratedAway}
            isNext={task.id === nextTaskId}
            onToggle={() => onToggleTask(task.weekStart, task.id)}
            onUpdateText={(text) => onUpdateTask(task.weekStart, task.id, text)}
            onDelete={() => onDeleteTask(task.weekStart, task.id)}
            onMigrate={(to) => onMigrateTask(task.weekStart, task.id, to)}
          />
        ))}

        {data.habits.map((habit) => {
          const done = !!habit.completions[dayKey];
          return (
            <Strip
              key={habit.id}
              colour={habit.id === nextHabitId ? T.clayNext : T.clayHabit}
              glyph={done ? GLYPH.done : GLYPH.habit}
              label={habit.name}
              done={done}
              onToggle={() => onToggleHabit(habit.id, dayKey)}
            />
          );
        })}

        {adding ? (
          <div style={{
            minHeight: 48, display: 'flex', alignItems: 'center',
            padding: '0 17px', borderRadius: 9999,
            boxShadow: `0 0 0 2px ${T.glassBorderEm} inset`,
          }}>
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
              placeholder={t('today.placeholder')}
              className="inline-edit"
              style={{ fontSize: 15, color: T.textPrimary }}
            />
          </div>
        ) : (
          <button
            onClick={() => { setAdding(true); setTimeout(() => addRef.current?.focus(), 0); }}
            style={{
              minHeight: 48, display: 'flex', alignItems: 'center',
              padding: '0 17px', borderRadius: 9999,
              background: 'none', border: 'none', textAlign: 'left',
              boxShadow: `0 0 0 1.5px ${T.glassBorder} inset`,
              color: T.textSecondary, cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600,
            }}
          >
            {t('today.add')}
          </button>
        )}

        {entries.length === 0 && data.habits.length === 0 && !adding && (
          <div style={{
            padding: '18px 4px', fontFamily: 'DM Sans, sans-serif',
            fontSize: 14, color: T.textMuted,
          }}>
            {t('today.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
