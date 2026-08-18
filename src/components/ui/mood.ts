import type { MoodValue } from '../../types';

/**
 * One SVG strip holds all five faces. They have uneven widths (188–245) and sit
 * at uneven heights (the two happy ones ride ~18px higher), so each is windowed
 * with an explicit box rather than a fixed 20% sprite step.
 *
 * Boxes were measured off the rendered strip, not read from the source, because
 * the file's nested transforms don't map to on-screen positions. Re-measure with
 * `magick faces.svg -crop … -trim` if the artwork is replaced.
 *
 * Order runs saddest (left) → happiest (right), matching MoodValue 1 → 5.
 */
export const FACE_STRIP = { w: 1338, h: 242 } as const;

export const FACE_BOX: Record<MoodValue, { x: number; y: number; w: number; h: number }> = {
  1: { x:   18, y: 56, w: 188, h: 151 },
  2: { x:  267, y: 53, w: 244, h: 157 },
  3: { x:  571, y: 55, w: 218, h: 154 },
  4: { x:  824, y: 36, w: 245, h: 157 },
  5: { x: 1103, y: 38, w: 219, h: 153 },
};

/** Single source of truth — MoodPicker and the Stats tooltip had drifted apart. */
export const MOOD_LABEL: Record<MoodValue, string> = {
  1: 'pas ouf',
  2: 'bof',
  3: 'normal',
  4: 'ok',
  5: 'super',
};
