import facesUrl from '../../assets/faces.svg';
import type { MoodValue } from '../../types';
import { FACE_BOX, FACE_STRIP, MOOD_LABEL } from './mood';

/**
 * One of the five mood faces, windowed out of the shared strip.
 *
 * Imported rather than referenced by path — Vite doesn't bundle string paths out
 * of src/assets. A background sprite rather than five files: the strip is one
 * 40 kB request and the faces can't be split without duplicating its <defs>.
 *
 * Decorative by default: every call site shows the mood's name in text beside
 * it. Pass `labelled` where it stands alone.
 */
export function MoodFace({ mood, size = 24, labelled = false }: Readonly<{
  mood: MoodValue;
  size?: number;
  labelled?: boolean;
}>) {
  const box = FACE_BOX[mood];
  // Fit the longest side, then centre the shorter one in the square box.
  const k = size / Math.max(box.w, box.h);

  return (
    <span
      role={labelled ? 'img' : undefined}
      aria-label={labelled ? MOOD_LABEL[mood] : undefined}
      aria-hidden={labelled ? undefined : true}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        flexShrink: 0,
        backgroundImage: `url(${facesUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: `${FACE_STRIP.w * k}px ${FACE_STRIP.h * k}px`,
        backgroundPosition:
          `${-box.x * k + (size - box.w * k) / 2}px ` +
          `${-box.y * k + (size - box.h * k) / 2}px`,
      }}
    />
  );
}
