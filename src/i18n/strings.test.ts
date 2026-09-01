import { describe, it, expect } from 'vitest';
import { en, fr, interpolate } from './strings';

describe('dictionaries', () => {
  // TypeScript already forbids a missing French key, but not an extra one, and
  // not a key that was renamed on one side only.
  it('cover exactly the same keys', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  // The failure this catches: a key added to `en` by copying its French text,
  // which typechecks perfectly and ships French words to English users.
  // `lang.*` is exempt by design — it names the language you switch TO, so the
  // English entry is deliberately written in French.
  it('has no French-only characters left in the English dictionary', () => {
    const suspect = Object.entries(en)
      .filter(([k]) => !k.startsWith('lang.'))
      .filter(([, v]) => /[éèêëàâçùûôîïœ]/i.test(v));
    expect(suspect).toEqual([]);
  });

  // Both languages must carry the same placeholders, or a value silently
  // vanishes in one of them.
  it('uses the same placeholders in both languages', () => {
    const holders = (s: string) => (s.match(/\{[a-z]+\}/gi) ?? []).sort();
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(holders(fr[key]), key).toEqual(holders(en[key]));
    }
  });
});

describe('interpolate', () => {
  it('fills every occurrence of a placeholder', () => {
    expect(interpolate('{a} and {a} and {b}', { a: 1, b: 'x' })).toBe('1 and 1 and x');
  });

  it('leaves an unknown placeholder visible rather than blanking it', () => {
    expect(interpolate('hi {name}', { other: 1 })).toBe('hi {name}');
  });

  it('returns the string untouched when there is nothing to fill', () => {
    expect(interpolate('plain')).toBe('plain');
  });
});
