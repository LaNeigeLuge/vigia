import { useTheme } from '../../ThemeContext';

interface DonutChartProps {
  done: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  small?: boolean;
}

export function DonutChart({ done, total, size = 120, strokeWidth = 14, label, sublabel, small }: Readonly<DonutChartProps>) {
  const { T } = useTheme();
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const center = size / 2;
  let fontSize = 30;
  if (small) fontSize = 17;
  else if (size < 90) fontSize = 20;

  let ringColor = T.amber;
  if (pct >= 76) ringColor = T.emerald;
  else if (pct >= 51) ringColor = T.sage;
  else if (pct >= 26) ringColor = T.aqua;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={T.trackBg}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
        />
        {/* Center % text */}
        <g style={{ transform: `rotate(90deg)`, transformOrigin: `${center}px ${center}px` }}>
          <text
            x={center} y={center + fontSize * 0.36}
            textAnchor="middle"
            fontSize={fontSize}
            fontWeight="700"
            fontFamily="Syne, sans-serif"
            fill={ringColor}
          >
            {pct}%
          </text>
        </g>
      </svg>
      {label && (
        <div style={{ textAlign: 'center', marginTop: 4, fontSize: 10, color: T.textMuted, lineHeight: 1.4 }}>
          {label}
          {sublabel && <div style={{ color: T.textSecondary }}>{sublabel}</div>}
        </div>
      )}
    </div>
  );
}
