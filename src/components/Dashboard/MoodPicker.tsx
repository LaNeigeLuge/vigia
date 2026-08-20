import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { MoodValue } from '../../types';
import { formatDayKey, addDays, getDayLabel, getDayNumber } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';
import { pressedStyle } from '../../utils/color';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { MoodFace } from '../ui/MoodFace';
import { MOOD_LABEL } from '../ui/mood';

// Happiest first, so the row reads left-to-right like the rest of the UI.
const MOODS: MoodValue[] = [5, 4, 3, 2, 1];

interface MoodRowProps {
  label: string;
  dayKey: string;
  currentMood: MoodValue | undefined;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
}

function MoodRow({ label, dayKey, currentMood, onSetMood }: Readonly<MoodRowProps>) {
  const { T, dark } = useTheme();
  const still = useReducedMotion() ?? false;
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
        {MOODS.map((value) => {
          const moodLabel = MOOD_LABEL[value];
          const isSelected = currentMood === value;
          return (
            <motion.button
              key={value}
              onClick={() => onSetMood(dayKey, value)}
              whileTap={still ? undefined : { scale: 0.9 }}
              title={moodLabel}
              aria-pressed={isSelected}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '8px 4px',
                minHeight: 44,
                borderRadius: 4,
                border: `1.5px solid ${isSelected ? T.glassBorderEm : T.glassBorder}`,
                ...pressedStyle(isSelected, T.checkedCellBg, dark),
                cursor: 'pointer',
                transition: 'all 0.18s',
                // Unselected faces recede so the chosen one reads at a glance.
                opacity: isSelected || currentMood === undefined ? 1 : 0.45,
              }}
            >
              <MoodFace mood={value} size={24} />
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
  const isMobile = useIsMobile();
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
    <div className="glass" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontWeight: 700,
        fontSize: 10, textTransform: 'uppercase',
        letterSpacing: '0.12em', color: T.emerald,
        padding: '10px 20px',
        borderBottom: `1px solid ${T.glassBorderEm}`,
      }}>
        Mood
      </div>

      {/* 210px showed 2½ rows behind an inner scrollbar, which reads as broken.
          A pointer screen has the room for a full week. */}
      <div style={{
        maxHeight: isMobile ? 210 : 470,
        overflowY: 'auto', padding: '10px 20px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
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
