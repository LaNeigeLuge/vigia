export interface ThemeTokens {
  bg: string;
  navBg: string;
  emerald: string;
  emeraldDark: string;
  amber: string;
  sage: string;
  aqua: string;
  cream: string;
  glassBg: string;
  glassBgHover: string;
  glassBorder: string;
  glassBorderEm: string;
  trackBg: string;
  rowBorder: string;
  rowHoverBg: string;
  checkedCellBg: string;
  oddRowBg: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  shadowSm: string;
  shadowLg: string;
  glowEm: string;
  tooltipBg: string;
  tooltipBorder: string;
  /* Bullet-journal sheet (Today) */
  sheet: string;
  sheetDot: string;
  /** Margin rule + notation glyphs. 3.9:1 on the sheet — large text / rules only. */
  margin: string;
  /** Darker margin ink for small text. 5.6:1 on the sheet. */
  marginInk: string;
  ease: [number, number, number, number];
}

const light: ThemeTokens = {
  bg:            '#f5f7f4',
  navBg:         'rgba(255,255,255,0.94)',
  emerald:       '#4a7c59',
  emeraldDark:   '#2d5a3d',
  amber:         '#b07d52',
  sage:          '#6a9a78',
  aqua:          '#6a9e98',
  cream:         '#f0ede6',
  glassBg:       'rgba(255,255,255,0.92)',
  glassBgHover:  'rgba(255,255,255,1)',
  glassBorder:   'rgba(74,124,89,0.15)',
  glassBorderEm: 'rgba(74,124,89,0.4)',
  trackBg:       'rgba(74,124,89,0.10)',
  rowBorder:     'rgba(74,124,89,0.10)',
  rowHoverBg:    'rgba(74,124,89,0.05)',
  checkedCellBg: 'rgba(74,124,89,0.10)',
  oddRowBg:      'rgba(74,124,89,0.03)',
  textPrimary:   '#1a2e23',
  textSecondary: 'rgba(26,46,35,0.72)',
  textMuted:     'rgba(26,46,35,0.42)',
  shadowSm:      '0 1px 6px rgba(74,124,89,0.08)',
  shadowLg:      '0 4px 20px rgba(74,124,89,0.12)',
  glowEm:        'none',
  tooltipBg:     'rgba(248,249,245,0.98)',
  tooltipBorder: 'rgba(74,124,89,0.18)',
  sheet:         '#fbfaf6',
  sheetDot:      'rgba(169,113,68,0.16)',
  margin:        '#a97144',
  marginInk:     '#8a5a33',
  ease:          [0.4, 0, 0.2, 1],
};

const dark: ThemeTokens = {
  bg:            '#0f1510',
  navBg:         'rgba(10,15,10,0.90)',
  emerald:       '#6B9B7F',
  emeraldDark:   '#4a7c59',
  amber:         '#D4A574',
  sage:          '#8BAA93',
  aqua:          '#A8C5C0',
  cream:         '#F5F1E8',
  glassBg:       'rgba(245,241,232,0.06)',
  glassBgHover:  'rgba(245,241,232,0.12)',
  glassBorder:   'rgba(245,241,232,0.10)',
  glassBorderEm: 'rgba(107,155,127,0.40)',
  trackBg:       'rgba(245,241,232,0.08)',
  rowBorder:     'rgba(245,241,232,0.07)',
  rowHoverBg:    'rgba(107,155,127,0.07)',
  checkedCellBg: 'rgba(107,155,127,0.12)',
  oddRowBg:      'rgba(245,241,232,0.03)',
  textPrimary:   'rgba(255,255,255,0.92)',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted:     'rgba(255,255,255,0.40)',
  shadowSm:      '0 4px 20px rgba(0,0,0,0.25)',
  shadowLg:      '0 8px 40px rgba(0,0,0,0.35)',
  glowEm:        'none',
  tooltipBg:     'rgba(10,15,10,0.95)',
  tooltipBorder: 'rgba(107,155,127,0.25)',
  sheet:         '#161a15',
  sheetDot:      'rgba(212,165,116,0.14)',
  margin:        '#D4A574',   // 7.9:1 on the dark sheet
  marginInk:     '#E3BE94',
  ease:          [0.4, 0, 0.2, 1],
};

export function getT(isDark: boolean): ThemeTokens {
  return isDark ? dark : light;
}

// Module-level constant (ease only — components use useTheme() for colors)
export const T = light;
