// DA design tokens as JS constants for inline styles
export const T = {
  bg:            '#0a0f0a',
  emerald:       '#6B9B7F',
  emeraldDark:   '#4a7c59',
  amber:         '#D4A574',
  sage:          '#8BAA93',
  aqua:          '#A8C5C0',
  cream:         '#F5F1E8',

  glassBg:       'rgba(245,241,232,0.08)',
  glassBgHover:  'rgba(245,241,232,0.15)',
  glassBorder:   'rgba(245,241,232,0.12)',
  glassBorderEm: 'rgba(107,155,127,0.5)',

  textPrimary:   'rgba(255,255,255,0.95)',
  textSecondary: 'rgba(255,255,255,0.70)',
  textMuted:     'rgba(255,255,255,0.45)',

  shadowSm:      '0 8px 32px rgba(107,155,127,0.15)',
  shadowLg:      '0 16px 48px rgba(107,155,127,0.25)',
  glowEm:        '0 0 20px rgba(74,222,128,0.3)',
  glowLg:        '0 0 40px rgba(74,222,128,0.2)',

  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;
