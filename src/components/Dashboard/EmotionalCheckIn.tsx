import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EmotionId, EmotionSlot } from '../../types';
import { formatDayKey, addDays } from '../../utils/dateUtils';
import { useTheme } from '../../ThemeContext';

// ─── Emotions ordered for a smooth progressive colour wheel ───────────────────

interface Emotion { id: EmotionId; label: string; color: string }

const EMOTIONS: Emotion[] = [
  { id: 'heureux',    label: 'Heureux',      color: 'hsl(112, 42%, 73%)' },
  { id: 'energise',   label: 'Énergisé',     color: 'hsl(90,  44%, 73%)' },
  { id: 'blase',      label: 'Blasé',        color: 'hsl(70,  36%, 74%)' },
  { id: 'bien',       label: 'Bien',         color: 'hsl(50,  36%, 76%)' },
  { id: 'embarrasse', label: 'Embarrassé',   color: 'hsl(34,  48%, 74%)' },
  { id: 'malaaise',   label: "Mal à l'aise", color: 'hsl(18,  48%, 73%)' },
  { id: 'tendu',      label: 'Tendu',        color: 'hsl(5,   48%, 72%)' },
  { id: 'en-colere',  label: 'En colère',    color: 'hsl(350, 48%, 71%)' },
  { id: 'apeure',     label: 'Apeuré',       color: 'hsl(335, 42%, 73%)' },
  { id: 'enjoleur',   label: 'Enjôleur',     color: 'hsl(315, 44%, 76%)' },
  { id: 'joueur',     label: 'Joueur',       color: 'hsl(292, 40%, 76%)' },
  { id: 'hebete',     label: 'Hébété',       color: 'hsl(272, 38%, 76%)' },
  { id: 'concentre',  label: 'Concentré',    color: 'hsl(252, 42%, 75%)' },
  { id: 'triste',     label: 'Triste',       color: 'hsl(228, 44%, 73%)' },
  { id: 'confiant',   label: 'Confiant',     color: 'hsl(208, 48%, 73%)' },
  { id: 'inspire',    label: 'Inspiré',      color: 'hsl(183, 44%, 73%)' },
];

const SLOTS: { id: EmotionSlot; label: string }[] = [
  { id: 'matin',     label: 'Matin'   },
  { id: 'apresmidi', label: 'Après-midi' },
  { id: 'soir',      label: 'Soir'     },
];

// ─── Pill-segment SVG helpers ─────────────────────────────────────────────────

const SIZE     = 184;
const CX       = SIZE / 2;        // 92
const CY       = SIZE / 2;        // 92
const INNER_R  = 55;
const OUTER_R  = 78;
const CAP_R    = (OUTER_R - INNER_R) / 2;                           // 11.5
const MID_R    = (OUTER_R + INNER_R) / 2;                           // 66.5
const INSET    = Math.atan(CAP_R / MID_R) * (180 / Math.PI);        // ≈ 9.8°
const HALF_GAP = 1;                                                  // degrees gap
const SEG_DEG  = 360 / EMOTIONS.length;                             // 22.5°

function toXY(r: number, deg: number) {
  const rad = (deg - 90) * (Math.PI / 180);
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function fmt(n: number) { return n.toFixed(3); }

function pillPath(i: number): string {
  const segStart = i * SEG_DEG + HALF_GAP;
  const segEnd   = (i + 1) * SEG_DEG - HALF_GAP;
  const s = segStart + INSET;
  const e = segEnd   - INSET;
  const large = (e - s) > 180 ? 1 : 0;

  const oS = toXY(OUTER_R, s);
  const oE = toXY(OUTER_R, e);
  const iE = toXY(INNER_R, e);
  const iS = toXY(INNER_R, s);

  return [
    `M ${fmt(oS.x)} ${fmt(oS.y)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${fmt(oE.x)} ${fmt(oE.y)}`,
    `A ${CAP_R} ${CAP_R} 0 0 1 ${fmt(iE.x)} ${fmt(iE.y)}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${fmt(iS.x)} ${fmt(iS.y)}`,
    `A ${CAP_R} ${CAP_R} 0 0 1 ${fmt(oS.x)} ${fmt(oS.y)}`,
    'Z',
  ].join(' ');
}

// ─── Single wheel ─────────────────────────────────────────────────────────────

interface WheelProps {
  slotLabel: string;
  selected:  EmotionId | null;
  onSelect:  (id: EmotionId) => void;
}

function EmotionWheel({ slotLabel, selected, onSelect }: Readonly<WheelProps>) {
  const { T } = useTheme();
  const [hovered,  setHovered]  = useState<EmotionId | null>(null);
  const [editing,  setEditing]  = useState(false);
  const [ringHover, setRingHover] = useState(false);
  const armedRef = useRef<EmotionId | null>(null);

  const showWheel = !selected || editing;
  const selEmo    = selected ? EMOTIONS.find((e) => e.id === selected) : null;
  const hovEmo    = hovered  ? EMOTIONS.find((e) => e.id === hovered)  : null;
  const badge     = hovEmo ?? selEmo;

  const handleSelect = (id: EmotionId) => {
    armedRef.current = null;
    onSelect(id);
    setEditing(false);
  };

  // A mouse reveals the label on hover before the click, so one click commits.
  // A finger has no hover: the first tap reveals the label, a second tap on the
  // same segment commits. Any other segment just moves the preview.
  const handlePointerUp = (e: React.PointerEvent, id: EmotionId) => {
    if (e.pointerType === 'mouse' || armedRef.current === id) {
      handleSelect(id);
      return;
    }
    armedRef.current = id;
    setHovered(id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>

      <AnimatePresence mode="wait">

        {/* ── Wheel (selecting) ── */}
        {showWheel && (
          <motion.div
            key="wheel"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <svg width={SIZE} height={SIZE} style={{ overflow: 'visible' }}>

              {/* Pill segments */}
              {EMOTIONS.map((emotion, i) => {
                const isSelected = emotion.id === selected;
                const isHovered  = emotion.id === hovered;
                const dimmed     = !!selected && !isSelected && !isHovered;

                return (
                  <path
                    key={emotion.id}
                    d={pillPath(i)}
                    fill={emotion.color}
                    opacity={dimmed ? 0.18 : 1}
                    style={{
                      transformOrigin: `${CX}px ${CY}px`,
                      transform: (isSelected || isHovered) ? 'scale(1.12)' : 'scale(1)',
                      transition: 'transform 0.18s ease, opacity 0.18s ease',
                      cursor: 'pointer',
                      filter: isSelected ? 'brightness(1.08)' : 'none',
                    }}
                    onMouseEnter={() => setHovered(emotion.id)}
                    onMouseLeave={() => setHovered(null)}
                    onPointerUp={(e) => handlePointerUp(e, emotion.id)}
                  />
                );
              })}

              {/* Centre hole */}
              <circle
                cx={CX} cy={CY} r={INNER_R - 3}
                fill={selEmo ? selEmo.color : T.bg}
                opacity={selEmo ? 0.15 : 1}
                style={{ transition: 'fill 0.25s, opacity 0.25s', pointerEvents: 'none' }}
              />

              {/* Slot label */}
              <text
                x={CX} y={CY + 5}
                textAnchor="middle"
                fill={selEmo ? selEmo.color : T.textMuted}
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: 'fill 0.2s',
                }}
              >
                {slotLabel}
              </text>

              {/* Floating name labels on hover */}
              {EMOTIONS.map((emotion, i) => {
                const isHov  = emotion.id === hovered;
                const midDeg = i * SEG_DEG + SEG_DEG / 2;
                const tipPos = toXY(OUTER_R + 24, midDeg);
                const boxW   = Math.max(emotion.label.length * 6.2 + 14, 36);
                const boxH   = 18;

                return (
                  <g
                    key={`label-${emotion.id}`}
                    style={{
                      pointerEvents: 'none',
                      opacity: isHov ? 1 : 0,
                      transform: isHov ? 'scale(1)' : 'scale(0.7)',
                      transformOrigin: `${fmt(tipPos.x)}px ${fmt(tipPos.y)}px`,
                      transition: 'opacity 0.18s ease, transform 0.18s ease',
                    }}
                  >
                    <rect
                      x={tipPos.x - boxW / 2}
                      y={tipPos.y - boxH / 2}
                      width={boxW} height={boxH}
                      rx={boxH / 2} ry={boxH / 2}
                      fill={emotion.color}
                      stroke="rgba(255,255,255,0.45)"
                      strokeWidth={1}
                    />
                    <text
                      x={tipPos.x}
                      y={tipPos.y + 3.5}
                      textAnchor="middle"
                      fill="rgba(30,30,30,0.85)"
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 9.5,
                        fontWeight: 700,
                        userSelect: 'none',
                      }}
                    >
                      {emotion.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </motion.div>
        )}

        {/* ── Confirmed circle ── */}
        {!showWheel && selEmo && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onClick={() => setEditing(true)}
            onMouseEnter={() => setRingHover(true)}
            onMouseLeave={() => setRingHover(false)}
            style={{ cursor: 'pointer' }}
          >
            <svg width={SIZE} height={SIZE}>
              {/* Filled background */}
              <circle
                cx={CX} cy={CY} r={OUTER_R}
                fill={selEmo.color}
                opacity={ringHover ? 0.22 : 0.14}
                style={{ transition: 'opacity 0.2s' }}
              />
              {/* Ring */}
              <circle
                cx={CX} cy={CY} r={OUTER_R - 1}
                fill="none"
                stroke={selEmo.color}
                strokeWidth={ringHover ? 2.5 : 2}
                opacity={ringHover ? 0.85 : 0.55}
                style={{ transition: 'stroke-width 0.2s, opacity 0.2s' }}
              />
              {/* Emotion name */}
              <text
                x={CX} y={CY - 7}
                textAnchor="middle"
                dominantBaseline="central"
                fill={selEmo.color}
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '-0.2px',
                  userSelect: 'none',
                }}
              >
                {selEmo.label}
              </text>
              {/* Slot label */}
              <text
                x={CX} y={CY + 13}
                textAnchor="middle"
                dominantBaseline="central"
                fill={T.textMuted}
                style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  userSelect: 'none',
                }}
              >
                {slotLabel.toUpperCase()}
              </text>
            </svg>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Emotion name below (wheel mode only) */}
      <div style={{
        height: 20,
        fontSize: 12, fontFamily: 'DM Sans, sans-serif',
        color: showWheel ? (badge?.color ?? T.textMuted) : 'transparent',
        fontWeight: badge ? 600 : 400,
        textAlign: 'center',
        transition: 'color 0.15s',
      }}>
        {showWheel ? (badge?.label ?? '—') : ''}
      </div>

    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface EmotionalCheckInProps {
  checkins:     Record<string, Partial<Record<EmotionSlot, EmotionId>>>;
  onSetCheckin: (dayKey: string, slot: EmotionSlot, emotion: EmotionId) => void;
}

export function EmotionalCheckIn({ checkins, onSetCheckin }: Readonly<EmotionalCheckInProps>) {
  const { T } = useTheme();
  const [dayOffset, setDayOffset] = useState<0 | 1>(0);

  const date    = addDays(new Date(), -dayOffset);
  const dayKey  = formatDayKey(date);
  const dayData = checkins[dayKey] ?? {};

  return (
    <div className="glass" style={{ borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
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
                style={{
                  fontFamily: 'Syne, sans-serif', fontWeight: 700,
                  fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em',
                  background: active ? T.emerald : 'transparent',
                  color: active ? '#fff' : T.textMuted,
                  border: `1px solid ${active ? T.emerald : T.glassBorder}`,
                  borderRadius: 20, padding: '8px 14px', minHeight: 36,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {offset === 0 ? "Aujourd'hui" : 'Hier'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Wheels */}
      <div style={{
        display: 'flex', justifyContent: 'space-around',
        padding: '20px 16px 16px',
        gap: 12, flexWrap: 'wrap',
      }}>
        {SLOTS.map((slot) => (
          <EmotionWheel
            key={`${slot.id}-${dayKey}`}
            slotLabel={slot.label}
            selected={dayData[slot.id] ?? null}
            onSelect={(emotion) => onSetCheckin(dayKey, slot.id, emotion)}
          />
        ))}
      </div>

    </div>
  );
}
