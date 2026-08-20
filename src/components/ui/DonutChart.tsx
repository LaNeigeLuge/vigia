import { useTheme } from '../../ThemeContext';
import { shade, defId } from '../../utils/color';

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

  // Keyed on what the def contains, so two donuts of the same colour and weight
  // share one gradient instead of colliding on a hardcoded id.
  const gradientId = defId('donut', ringColor, strokeWidth);
  const shadowId   = defId('donutShadow', strokeWidth);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        {/* The ring is the most rolled-cylinder shape in the app and was the
            flattest: a light→dark gradient plus one soft shadow is what makes it
            read as modelled rather than printed. The caps were already round. */}
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.35" y2="1">
            <stop offset="0%"   stopColor={shade(ringColor, 0.24)} />
            <stop offset="100%" stopColor={shade(ringColor, -0.18)} />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.2" floodOpacity="0.20" />
          </filter>
        </defs>
        {/* Track — a groove rather than a flat band */}
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
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          filter={pct > 0 ? `url(#${shadowId})` : undefined}
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
