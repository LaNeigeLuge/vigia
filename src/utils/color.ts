/**
 * Lighten (amount > 0) or darken (< 0) a hex colour toward white or black.
 *
 * Used for the two stops of a clay light→dark ramp — chart bars, the donut ring,
 * progress fills. Lives here rather than beside one chart because three
 * unrelated components need the same two stops.
 */
export function shade(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const to = amount > 0 ? 255 : 0;
  const k = Math.abs(amount);
  const parts = [0, 2, 4].map((i) => {
    const v = parseInt(n.slice(i, i + 2), 16);
    return Math.round(v + (to - v) * k).toString(16).padStart(2, '0');
  });
  return `#${parts.join('')}`;
}

/** A stable, collision-free id for an SVG def keyed on what the def contains. */
export function defId(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}-${parts.map((p) => String(p).replace(/[^a-zA-Z0-9]/g, '')).join('-')}`;
}

/**
 * The selected state of a cell, pill or segment — pressed into the surface
 * rather than tinted flat. Six places were doing `background: checkedCellBg`,
 * which reads as a highlight; the DA has no flat highlights, it has depth.
 *
 * Returns a style fragment so each call site keeps its own layout.
 */
export function pressedStyle(selected: boolean, tint: string, dark: boolean) {
  if (!selected) return { background: 'transparent', boxShadow: 'none' };
  return {
    background: tint,
    boxShadow: dark
      ? 'inset 0 2px 5px rgba(0,0,0,0.45), inset 0 -1px 0 rgba(255,255,255,0.10)'
      : 'inset 0 2px 4px rgba(80,64,48,0.20), inset 0 -1px 0 rgba(255,255,255,0.45)',
  };
}
