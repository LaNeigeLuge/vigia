import { motion } from 'framer-motion';
import type { MoodValue } from '../../types';
import { formatDayKey, addDays } from '../../utils/dateUtils';
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
  const todayKey = formatDayKey(new Date());
  const yesterdayKey = formatDayKey(addDays(new Date(), -1));

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
        Mood
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <MoodRow
          label="Hier"
          dayKey={yesterdayKey}
          currentMood={moods[yesterdayKey]}
          onSetMood={onSetMood}
        />
        <div style={{ height: 1, background: T.glassBorder }} />
        <MoodRow
          label="Aujourd'hui"
          dayKey={todayKey}
          currentMood={moods[todayKey]}
          onSetMood={onSetMood}
        />
      </div>
    </div>
  );
}
