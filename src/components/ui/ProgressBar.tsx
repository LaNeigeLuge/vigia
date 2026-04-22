import { T } from '../../theme';

interface ProgressBarProps {
  done: number;
  total: number;
  height?: number;
  showLabel?: boolean;
  color?: string;
}

export function ProgressBar({ done, total, height = 5, showLabel = false, color = T.emerald }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: 9999,
          background: 'rgba(245,241,232,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 9999,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: pct > 0 ? `0 0 8px ${color}66` : 'none',
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
