import { useState } from 'react';
import type { EmotionId, EmotionSlot } from '../../types';
import { addDays, formatDayKey } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';
import { EMOTIONS, EMOTION_FACE } from './emotions';

/** Faces are drawn on a 300×215 canvas. */
const FACE_RATIO = 215 / 300;

const SLOTS: { id: EmotionSlot; label: string }[] = [
  { id: 'matin',     label: 'Matin' },
  { id: 'apresmidi', label: 'Après-midi' },
  { id: 'soir',      label: 'Soir' },
];

/**
 * Ring geometry. 16 faces of FACE px only clear each other when the radius is
 * at least 16·FACE/2π, so a 44px touch target forces R ≥ 112 — this is measured
 * from the circumference, not chosen by eye.
 */
const FACE = 44;
const R = 112;
const SIZE = (R + FACE) * 2;

/**
 * Plain HTML rather than SVG: once the colour pills were dropped there were no
 * vector shapes left to draw, and real <button>s bring focus, keyboard and
 * pressed state for free where a clickable <g> would need them hand-rolled.
 */
function EmotionRing({ slotId, slotLabel, current, onPick }: Readonly<{
  slotId: EmotionSlot;
  slotLabel: string;
  current: EmotionId | undefined;
  onPick: (slot: EmotionSlot, emotion: EmotionId) => void;
}>) {
  const { T } = useTheme();
  const [preview, setPreview] = useState<EmotionId | null>(null);

  const shown = preview ?? current;
  const shownLabel = EMOTIONS.find((e) => e.id === shown)?.label;
  const c = SIZE / 2;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 14px' }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE, maxWidth: '100%' }}>

        {EMOTIONS.map((e, i) => {
          const rad = ((i * 360) / EMOTIONS.length - 90) * (Math.PI / 180);
          const selected = current === e.id;
          const url = EMOTION_FACE[e.id];
          if (!url) return null;

          return (
            <button
              key={e.id}
              onClick={() => onPick(slotId, e.id)}
              onMouseEnter={() => setPreview(e.id)}
              onMouseLeave={() => setPreview(null)}
              onFocus={() => setPreview(e.id)}
              onBlur={() => setPreview(null)}
              aria-pressed={selected}
              aria-label={e.label}
              style={{
                position: 'absolute',
                left: c + R * Math.cos(rad) - FACE / 2,
                top:  c + R * Math.sin(rad) - FACE / 2,
                width: FACE, height: FACE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, borderRadius: 6,
                border: `1.5px solid ${selected ? T.glassBorderEm : 'transparent'}`,
                background: selected ? T.checkedCellBg : 'transparent',
                cursor: 'pointer',
                // Everything else recedes once a choice is made.
                opacity: current && !selected ? 0.45 : 1,
                transition: 'opacity 0.18s, background 0.18s, border-color 0.18s',
              }}
            >
              <img
                src={url}
                alt=""
                aria-hidden
                style={{ width: FACE - 4, height: (FACE - 4) * FACE_RATIO, display: 'block' }}
              />
            </button>
          );
        })}

        {/* Centre: the hovered or chosen face, large. On touch this is what
            makes a 44px pick legible without a second confirming tap. */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 4,
          pointerEvents: 'none',
        }}>
          {shown && EMOTION_FACE[shown] && (
            <img
              src={EMOTION_FACE[shown]}
              alt=""
              aria-hidden
              style={{ width: 76, height: 76 * FACE_RATIO, display: 'block' }}
            />
          )}
          {/* The name is always present — identity never rests on the drawing alone. */}
          <div style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 13,
            color: shown ? T.emerald : T.textMuted, textAlign: 'center',
          }}>
            {shownLabel ?? slotLabel}
          </div>
          {shown && (
            <div style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 9,
              letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted,
            }}>
              {slotLabel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface EmotionalCheckInProps {
  checkins:     Record<string, Partial<Record<EmotionSlot, EmotionId>>>;
  onSetCheckin: (dayKey: string, slot: EmotionSlot, emotion: EmotionId) => void;
}

export function EmotionalCheckIn({ checkins, onSetCheckin }: Readonly<EmotionalCheckInProps>) {
  const { T } = useTheme();
  const [dayOffset, setDayOffset] = useState<0 | 1>(0);

  const dayKey  = formatDayKey(addDays(new Date(), -dayOffset));
  const dayData = checkins[dayKey] ?? {};

  return (
    <div className="glass" style={{ borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px', gap: 8,
        borderBottom: `1px solid ${T.glassBorderEm}`,
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontWeight: 700,
          fontSize: 10, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: T.emerald,
        }}>
          Check-in émotionnel
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {([0, 1] as const).map((offset) => {
            const active = dayOffset === offset;
            return (
              <button
                key={offset}
                onClick={() => setDayOffset(offset)}
                aria-pressed={active}
                style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: active ? T.emerald : 'transparent',
                  color: active ? '#fff' : T.textMuted,
                  border: `1px solid ${active ? T.emerald : T.glassBorder}`,
                  borderRadius: 20, padding: '8px 14px', minHeight: 36,
                  cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                }}
              >
                {offset === 0 ? "Aujourd'hui" : 'Hier'}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '8px 0 4px' }}>
        {SLOTS.map((slot) => (
          <EmotionRing
            key={`${slot.id}-${dayKey}`}
            slotId={slot.id}
            slotLabel={slot.label}
            current={dayData[slot.id]}
            onPick={(s, emotion) => onSetCheckin(dayKey, s, emotion)}
          />
        ))}
      </div>
    </div>
  );
}
