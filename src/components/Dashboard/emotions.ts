import type { EmotionId } from '../../types';

export interface Emotion { id: EmotionId; label: string; color: string }

/** Ordered for a smooth progressive colour wheel — do not sort. */
export const EMOTIONS: Emotion[] = [
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

/**
 * The 16 hand-drawn faces, keyed by EmotionId.
 *
 * A glob rather than sixteen import statements: Vite resolves and hashes each
 * file at build time, and the filenames already match EmotionId exactly. The
 * cost is that a missing or misnamed file fails at runtime instead of compile
 * time — emotions.test.ts covers that by asserting every EMOTIONS entry
 * resolves to a url.
 *
 * Each face's blob colour matches its segment colour above; the artwork was
 * drawn for this wheel.
 */
const faceUrls = import.meta.glob<string>('../../assets/emotions-svg/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
});

export const EMOTION_FACE: Partial<Record<EmotionId, string>> = Object.fromEntries(
  Object.entries(faceUrls).map(([path, url]) => {
    const id = path.slice(path.lastIndexOf('/') + 1).replace(/\.svg$/, '');
    return [id, url];
  }),
);
