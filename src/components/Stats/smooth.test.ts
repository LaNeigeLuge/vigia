import { describe, it, expect } from 'vitest';
import { centeredAvg } from './smooth';

describe('centeredAvg', () => {
  it('averages a centered window, shrinking it at the edges', () => {
    // i=0 sees [1,2] → 1.5; i=1 sees [1,2,3] → 2; i=3 sees [3,4] → 3.5
    expect(centeredAvg([1, 2, 3, 4], 3)).toEqual([1.5, 2, 3, 3.5]);
  });

  // The property that separates a centered window from a trailing one: a
  // symmetric input stays symmetric. A trailing average would return
  // [0,0,0,3.3,3.3,3.3,0] — the spike smeared to the right.
  it('does not shift a peak in time', () => {
    const out = centeredAvg([0, 0, 0, 10, 0, 0, 0], 3);
    expect(out).toEqual([...out].reverse());
    expect(out[3]).toBeGreaterThan(0);
  });

  it('skips holes instead of treating them as zero', () => {
    // i=1 sees [4, null, 6] → mean of 4 and 6, not 10/3. At the edges the
    // window is clipped, so i=0 only ever sees 4 and i=2 only sees 6.
    expect(centeredAvg([4, null, 6], 3)).toEqual([4, 5, 6]);
  });

  it('keeps a gap as a gap when no value is in range', () => {
    expect(centeredAvg([null, null, null], 3)).toEqual([null, null, null]);
    expect(centeredAvg([5, null, null, null, 5], 3)).toEqual([5, 5, null, 5, 5]);
  });

  it('is a no-op for a window of 1', () => {
    expect(centeredAvg([3, null, 7], 1)).toEqual([3, null, 7]);
  });
});
