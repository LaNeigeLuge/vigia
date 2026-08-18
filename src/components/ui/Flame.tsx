import plainUrl from '../../assets/flame2.svg';
import hotUrl from '../../assets/flame.svg';

/**
 * Which artwork stands for which intensity. flame.svg has a blue core and five
 * layers, so it reads as the hotter of the two — swap these two lines to invert.
 */
const ART = { plain: plainUrl, hot: hotUrl } as const;

/**
 * Streak / intensity marker, replacing the 🔥 and 💪 emoji (font-dependent,
 * unstyleable, inconsistent across platforms).
 *
 * Decorative: the number or label beside it carries the meaning, so it stays
 * out of the accessibility tree.
 *
 * Imported rather than referenced by path — Vite doesn't bundle string paths
 * out of src/assets.
 */
export function Flame({ size = 13, hot = false }: Readonly<{ size?: number; hot?: boolean }>) {
  return (
    <img
      src={hot ? ART.hot : ART.plain}
      alt=""
      aria-hidden
      style={{
        height: size,
        width: 'auto',
        // Sits on the text baseline like the emoji it replaces.
        verticalAlign: '-0.15em',
        flexShrink: 0,
      }}
    />
  );
}
