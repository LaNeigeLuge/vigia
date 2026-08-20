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
  /* Today's clay strips. Each colour carries a state that exists in the data —
     they are not decoration, which is what made a loose colourful layout read as
     clutter. */
  clayTask: string;
  clayHabit: string;
  /** The one accent per day, like the sun in the logo. */
  clayNext: string;
  /** An entry migrated in from another day. */
  clayMoved: string;
  /**
   * Label ink for text sitting *on* a clay pill. Not textPrimary: #1a2e23 only
   * reaches 4.44:1 on the lilac, just under the 4.5 a 15px label owes.
   */
  clayInk: string;
  /* Weekly-bar heat scale. All ≥3:1 on their own theme's panel (non-text). */
  heatFloor: string;
  heatHigh: string;
  heatMid: string;
  heatLow: string;
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
  clayTask:      '#8A9579',   // ink 4.89:1
  clayHabit:     '#7A97A0',   // ink 4.96:1
  clayNext:      '#E1BE6E',   // ink 8.66:1
  clayMoved:     '#938AAC',   // ink 4.75:1
  clayInk:       '#22261C',
  // Mauve ramp from the brand sheet's lilac, kept as light as the 3:1 floor
  // allows. The previous amber ramp topped out at 10.4:1 — far darker than the
  // DA — so the whole scale was compressed toward the light end.
  // The floor is a light sage rather than the app's emerald: emerald sits at
  // 4.78:1, which would have made the *lowest* tier darker than the next two
  // and broken the ramp's monotony.
  heatFloor:     '#7F8C6B',   // 3.5:1
  heatLow:       '#9F8DA6',   // 3.0:1
  heatMid:       '#8A7194',   // 4.2:1
  heatHigh:      '#6E5578',   // 6.4:1
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
  clayTask:      '#9FAB8C',   // ink 7.48:1
  clayHabit:     '#8FA9B2',   // ink 7.31:1
  clayNext:      '#E8CA84',   // ink 11.39:1
  clayMoved:     '#ABA0C4',   // ink 7.37:1
  clayInk:       '#141711',
  // Chosen against the dark surface, not flipped from light: intensity rises by
  // deepening the lilac, since a pale tint would flatten out at the top.
  heatFloor:     '#8BAA93',   // 6.9:1
  heatLow:       '#E4DEE6',   // 13.2:1
  heatMid:       '#C9BCCE',   // 9.6:1
  heatHigh:      '#AC99B4',   // 6.6:1
  ease:          [0.4, 0, 0.2, 1],
};

export function getT(isDark: boolean): ThemeTokens {
  return isDark ? dark : light;
}

// Module-level constant (ease only — components use useTheme() for colors)
export const T = light;
