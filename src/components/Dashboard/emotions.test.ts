import { describe, it, expect } from 'vitest';
import { EMOTIONS, EMOTION_FACE } from './emotions';

describe('emotion faces', () => {
  // The glob keys off filenames, so a renamed or missing asset would only show
  // up as a broken image in the wheel. This is the compile-time check the glob
  // gives up.
  it('has a face for every emotion on the wheel', () => {
    const missing = EMOTIONS.filter((e) => !EMOTION_FACE[e.id]).map((e) => e.id);
    expect(missing).toEqual([]);
  });

  it('has no face without a matching emotion', () => {
    const ids = new Set(EMOTIONS.map((e) => e.id));
    const orphans = Object.keys(EMOTION_FACE).filter((id) => !ids.has(id as never));
    expect(orphans).toEqual([]);
  });

  it('keeps the wheel at 16 evenly spaced segments', () => {
    expect(EMOTIONS).toHaveLength(16);
    expect(new Set(EMOTIONS.map((e) => e.id)).size).toBe(16);
  });
});
