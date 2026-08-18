/**
 * Centered moving average over a series that may have holes.
 *
 * Centered, not trailing: a trailing window shifts every peak later by half the
 * window. This chart is read to locate events in time and to judge whether mood
 * lags habits, so a trailing average would fabricate exactly the delay the
 * reader is looking for.
 *
 * Nulls are skipped rather than counted as zero — an unlogged day must not drag
 * the average down — and a window containing no data at all stays null, so gaps
 * survive smoothing instead of being filled in.
 */
export function centeredAvg(values: (number | null)[], window: number): (number | null)[] {
  const half = Math.floor(window / 2);
  const last = values.length - 1;

  return values.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(0, i - half); j <= Math.min(last, i + half); j++) {
      const v = values[j];
      if (v != null) { sum += v; n++; }
    }
    return n === 0 ? null : Math.round((sum / n) * 10) / 10;
  });
}
