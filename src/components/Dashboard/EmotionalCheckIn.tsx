import { useState } from 'react';
import type { EmotionId, EmotionSlot } from '../../types';
import { addDays, formatDayKey } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';
import { useLang } from '../../i18n';
import { pressedStyle } from '../../utils/color';
import { useIsWide } from '../../hooks/useMediaQuery';
import { EMOTIONS, EMOTION_FACE } from './emotions';

/** Faces are drawn on a 300×215 canvas. */
const FACE_RATIO = 215 / 300;

/** The ids are database values; their names come from `slot.<id>`. */
const SLOTS: EmotionSlot[] = ['matin', 'apresmidi', 'soir'];

/**
 * Ring geometry, derived rather than hardcoded: 16 faces of `face` px only clear
 * each other when the radius is at least 16·face/2π, measured off the
 * circumference. Change the face size and the radius follows.
 */
function ringGeometry(face: number) {
  const r = Math.ceil((EMOTIONS.length * face) / (2 * Math.PI));
  return { face, r, size: (r + face) * 2 };
}

/** Touch: 44px, the native minimum. */
const TOUCH_RING = ringGeometry(44);

/**
 * Pointer: 38px → 270px rings, 810px for three in a row.
 *
 * Not a compromise — the 44px floor is a touch guideline, while WCAG's
 * requirement for web pointer targets is 24×24 CSS px. The exact value comes
 * from the tightest case that must still fit: a 1440px viewport *with* a
 * scrollbar leaves the summary 857px, so 40px faces (852px) cleared it by 5px
 * and wrapped 2 + 1 the moment anything else moved. 38 leaves 47px.
 */
const POINTER_RING = ringGeometry(38);

/**
 * Plain HTML rather than SVG: once the colour pills were dropped there were no
 * vector shapes left to draw, and real <button>s bring focus, keyboard and
 * pressed state for free where a clickable <g> would need them hand-rolled.
 */
function EmotionRing({ slotId, slotLabel, current, onPick, geom }: Readonly<{
  slotId: EmotionSlot;
  slotLabel: string;
  current: EmotionId | undefined;
  onPick: (slot: EmotionSlot, emotion: EmotionId) => void;
  geom: { face: number; r: number; size: number };
}>) {
  const { T, dark } = useTheme();
  const [preview, setPreview] = useState<EmotionId | null>(null);
  const { t } = useLang();

  const { face: FACE, r: R, size: SIZE } = geom;
  const shown = preview ?? current;
  const shownLabel = shown ? t(`emotion.${shown}`) : undefined;
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
              aria-label={t(`emotion.${e.id}`)}
              style={{
                position: 'absolute',
                left: c + R * Math.cos(rad) - FACE / 2,
                top:  c + R * Math.sin(rad) - FACE / 2,
                width: FACE, height: FACE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, borderRadius: 6,
                border: `1.5px solid ${selected ? T.glassBorderEm : 'transparent'}`,
                ...pressedStyle(selected, T.checkedCellBg, dark),
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
              // Scales with the ring so the centre stays clear of the faces.
              style={{ width: R * 0.68, height: R * 0.68 * FACE_RATIO, display: 'block' }}
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
  const { t } = useLang();
  const wide = useIsWide();
  const [dayOffset, setDayOffset] = useState<0 | 1>(0);

  const dayKey  = formatDayKey(addDays(new Date(), -dayOffset));
  const dayData = checkins[dayKey] ?? {};

  return (
    <div className="glass" style={{ marginBottom: 12, overflow: 'hidden' }}>

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
          {t('checkin.title')}
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
                  boxShadow: active ? '0 2px 6px rgba(45,90,61,0.30), inset 0 1px 0 rgba(255,255,255,0.25)' : 'none',
                }}
              >
                {t(offset === 0 ? 'common.today' : 'common.yesterday')}
              </button>
            );
          })}
        </div>
      </div>

      {/* A row on a pointer screen, stacked on touch — three 284px rings fit
          side by side above 1280px, three 312px ones never fit on a phone. */}
      <div style={{
        padding: '8px 0 4px',
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
      }}>
        {SLOTS.map((slot) => (
          <EmotionRing
            key={`${slot}-${dayKey}`}
            slotId={slot}
            slotLabel={t(`slot.${slot}`)}
            current={dayData[slot]}
            onPick={(s, emotion) => onSetCheckin(dayKey, s, emotion)}
            geom={wide ? POINTER_RING : TOUCH_RING}
          />
        ))}
      </div>
    </div>
  );
}
