import { motion } from 'framer-motion';
import type { MoodValue } from '../../types';
import { useTheme } from '../../ThemeContext';

const MOODS: { value: MoodValue; emoji: string; label: string }[] = [
  { value: 5, emoji: '😄', label: 'super' },
  { value: 4, emoji: '🙂', label: 'ok' },
  { value: 3, emoji: '😐', label: 'normal' },
  { value: 2, emoji: '😕', label: 'bof' },
  { value: 1, emoji: '😞', label: 'pas ouf' },
];

interface MoodPickerProps {
  todayKey: string;
  currentMood: MoodValue | undefined;
  onSetMood: (dayKey: string, mood: MoodValue) => void;
}

export function MoodPicker({ todayKey, currentMood, onSetMood }: Readonly<MoodPickerProps>) {
  const { T } = useTheme();

  return (
    <div
      className="glass"
      style={{ padding: '16px 20px', borderRadius: 2, marginBottom: 12 }}
    >
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 700,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: T.emerald,
        marginBottom: 12,
      }}>
        Mood du jour
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {MOODS.map(({ value, emoji, label }) => {
          const isSelected = currentMood === value;
          return (
            <motion.button
              key={value}
              onClick={() => onSetMood(todayKey, value)}
              whileTap={{ scale: 0.92 }}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '10px 6px',
                borderRadius: 4,
                border: `1.5px solid ${isSelected ? T.glassBorderEm : T.glassBorder}`,
                background: isSelected ? `${T.checkedCellBg}` : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
              <span style={{
                fontSize: 10,
                fontFamily: 'DM Sans, sans-serif',
                fontWeight: isSelected ? 700 : 400,
                color: isSelected ? T.emerald : T.textMuted,
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
