import type { ThemeTokens } from '../../theme';
import { useTheme } from '../../ThemeContext';
import { useIsMobile } from '../../hooks/useMediaQuery';

/**
 * The one toggle. It replaces three native checkboxes (13–14px, untextureable —
 * `accentColor` is all a native control exposes) and one glyph pair, so the same
 * action stopped having two different idioms.
 *
 * Today keeps its `•` `✗` `>` `○` notation on purpose: that sheet is flat ink on
 * paper, and a modelled pellet would fight it.
 *
 * 24px on a pointer / 28px on touch — the old 13px was under WCAG's 24px floor
 * for a web pointer target, never mind the 44px touch guideline the row itself
 * now provides.
 */
const SIZE = { pointer: 24, touch: 28 };

/**
 * A vertical light→dark gradient plus a drop shadow
 * is what reads as a raised object. A grain texture was tried and dropped — it
 * added nothing at a size anyone actually sees.
 */
function clayStyle(checked: boolean, size: number, T: ThemeTokens, dark: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  if (!checked) {
    // A pressed-in well, so the raised state reads as its opposite.
    return {
      ...base,
      background: T.trackBg,
      border: `1px solid ${T.glassBorder}`,
      boxShadow: `inset 0 2px 3px rgba(0,0,0,0.14), inset 0 -1px 0 rgba(255,255,255,0.35)`,
    };
  }

  return {
    ...base,
    border: 'none',
    backgroundImage: `linear-gradient(180deg, ${T.sage} 0%, ${T.emeraldDark} 100%)`,
    boxShadow: dark
      ? `0 2px 5px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.28)`
      : `0 2px 4px rgba(45,90,61,0.30), inset 0 1px 0 rgba(255,255,255,0.40)`,
  };
}

/** Cream ink fails on the lighter dark-mode pellet (2.66:1); dark ink gives 4.50:1. */
function inkFor(dark: boolean, T: ThemeTokens): string {
  return dark ? '#1a2e23' : T.cream;
}

function Mark({ size, dark, T }: Readonly<{ size: number; dark: boolean; T: ThemeTokens }>) {
  return (
    <span
      aria-hidden
      style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: size * 0.55,
        color: inkFor(dark, T),
        transform: 'translateY(-0.5px)',
      }}
    >
      ✓
    </span>
  );
}

interface ClayCheckProps {
  checked: boolean;
  onChange: () => void;
  /** Accessible name — the row's text alone isn't attached to the control. */
  label: string;
  disabled?: boolean;
}

export function ClayCheck({ checked, onChange, label, disabled = false }: Readonly<ClayCheckProps>) {
  const { T, dark } = useTheme();
  const isMobile = useIsMobile();
  const size = isMobile ? SIZE.touch : SIZE.pointer;

  return (
    <button
      type="button"
      className="clay-check"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      style={{
        ...clayStyle(checked, size, T, dark),
        padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
      }}
    >
      {checked && <Mark size={size} dark={dark} T={T} />}
    </button>
  );
}

/**
 * The same visual with no semantics, for cells where the parent is already the
 * button — a button inside a button is invalid HTML.
 */
export function ClayDot({ checked, size }: Readonly<{ checked: boolean; size?: number }>) {
  const { T, dark } = useTheme();
  const isMobile = useIsMobile();
  const s = size ?? (isMobile ? SIZE.touch : SIZE.pointer);

  return (
    <span style={clayStyle(checked, s, T, dark)}>
      {checked && <Mark size={s} dark={dark} T={T} />}
    </span>
  );
}
