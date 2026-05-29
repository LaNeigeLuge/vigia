import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MoodValue } from '../../types';
import { formatDayKey, addDays, getDayLabel, getDayNumber } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';

const MOODS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: 5, emoji: '😄', label: 'super' },
  { value: 4, emoji: '🙂', label: 'ok' },
  { value: 3, emoji: '😐', label: 'normal' },
  { value: 2, emoji: '😕', label: 'bof' },
  { value: 1, emoji: '😞', label: 'pas ouf' },
];

interface MoodRowProps {
  label: string;
  dayKey: string;
  currentMood: MoodValue | undefined;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
}

function MoodRow({ label, dayKey, currentMood, onSetMood }: Readonly<MoodRowProps>) {
  const { T } = useTheme();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        minWidth: 64,
        fontSize: 11,
        fontFamily: 'DM Sans, sans-serif',
        fontWeight: 600,
        color: T.textMuted,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 6, flex: 1 }}>
        {MOODS.map(({ value, emoji, label: moodLabel }) => {
          const isSelected = currentMood === value;
          return (
            <motion.button
              key={value}
              onClick={() => onSetMood(dayKey, value)}
              whileTap={{ scale: 0.9 }}
              title={moodLabel}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 4px',
                borderRadius: 4,
                border: `1.5px solid ${isSelected ? T.glassBorderEm : T.glassBorder}`,
                background: isSelected ? T.checkedCellBg : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: 20, lineHeight: 1 }}>{emoji}</span>
              <span style={{
                fontSize: 9,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? T.emerald : T.textMuted,
                whiteSpace: 'nowrap',
              }}>
                {moodLabel}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

interface MoodPickerProps {
  moods: Record<string, MoodValue>;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
}

export function MoodPicker({ moods, onSetMood }: Readonly<MoodPickerProps>) {
  const { T } = useTheme();
  const [daysShown, setDaysShown] = useState(7);
  const today = new Date();

  const days = Array.from({ length: daysShown }, (_, i) => {
    const date   = addDays(today, -i);
    const dayKey = formatDayKey(date);
    let label: string;
    if (i === 0)      label = "Aujourd'hui";
    else if (i === 1) label = 'Hier';
    else              label = `${getDayLabel(date)} ${getDayNumber(date)}`;
    return { dayKey, label };
  });

  return (
    <div className="glass" style={{ borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 10, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: T.emerald,
        padding: '10px 20px',
        borderBottom: `1px solid ${T.glassBorderEm}`,
      }}>
        Mood
      </div>

      <div style={{ maxHeight: 210, overflowY: 'auto', padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {days.map((day, i) => (
          <div key={day.dayKey}>
            {i > 0 && <div style={{ height: 1, background: T.glassBorder, marginBottom: 8 }} />}
            <MoodRow
              label={day.label}
              dayKey={day.dayKey}
              currentMood={moods[day.dayKey]}
              onSetMood={onSetMood}
            />
          </div>
        ))}
        <div style={{ height: 1, background: T.glassBorder, marginTop: 4 }} />
        <button
          onClick={() => setDaysShown((n) => n + 7)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: T.textMuted, fontSize: 11, fontFamily: 'DM Sans, sans-serif',
            padding: '4px 0', textAlign: 'center',
          }}
        >
          + semaine précédente
        </button>
      </div>
    </div>
  );
}
