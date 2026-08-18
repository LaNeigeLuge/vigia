import type { ThemeTokens } from '../../theme';

/**
 * Heat scale for the weekly habit bars, on a count out of a 7-day week.
 * Descending cascade: 7 → dark red, 6-5 → orange, 4-3 → yellow, ≤2 → green.
 *
 * Red means HIGH, not bad. The scale reads intensity, not judgement, so it is
 * absolute on the displayed value and deliberately does NOT follow the Inverser
 * toggle — a full week is dark red whether the bars count days done or days
 * missed. Don't "fix" this by threading `inverted` through; that was considered
 * and rejected.
 *
 * Lives in its own module because exporting a non-component from a .tsx breaks
 * Fast Refresh for that file.
 */
export function heatColor(value: number, T: ThemeTokens): string {
  if (value >= 7) return T.heatHigh;
  if (value >= 5) return T.heatMid;
  if (value >= 3) return T.heatLow;
  return T.emerald;
}
