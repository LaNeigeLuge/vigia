import { useTheme } from '../../ThemeContext';

interface ProgressBarProps {
  done: number;
  total: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({ done, total, height = 5, showLabel = false, color }: Readonly<ProgressBarProps>) {
  const { T } = useTheme();
  const fillColor = color ?? T.emerald;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      {/* 4–5px is too thin for a clay bevel — it would just blur. A recessed
          track plus a lifted fill gives the same sense of depth at any height. */}
      <div style={{
        flex: 1, height, borderRadius: 9999, background: T.trackBg, overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.10)',
      }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: fillColor,
            borderRadius: 9999,
            boxShadow: '0 1px 2px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.30)',
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 10, color: T.textMuted, minWidth: 28, textAlign: 'right' }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
