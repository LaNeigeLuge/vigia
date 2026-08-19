import { useCallback, useSyncExternalStore } from 'react';

/** One MediaQueryList per query, reused across every hook call. */
const cache = new Map<string, MediaQueryList>();

function getMql(query: string): MediaQueryList | null {
  if (typeof window === 'undefined') return null;
  let m = cache.get(query);
  if (!m) {
    m = window.matchMedia(query);
    cache.set(query, m);
  }
  return m;
}

/**
 * useSyncExternalStore keeps the value correct across concurrent renders without
 * a hand-rolled resize listener. subscribe/getSnapshot are memoised per query so
 * the store isn't torn down and rebuilt on every render.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const m = getMql(query);
    m?.addEventListener('change', onChange);
    return () => m?.removeEventListener('change', onChange);
  }, [query]);

  const getSnapshot = useCallback(() => getMql(query)?.matches ?? false, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

/** Phone portrait — screens that get their own layout rather than a squeezed one. */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Wide enough to show Today and the weekly summary side by side.
 *
 * Budget, adding up rather than guessed: the log needs ≥480px, three 284px
 * emotion rings need 852px, plus Dashboard's own 40px of padding, a 16px gutter
 * and 32px of container padding — 1420 total. 1440 is the first standard
 * breakpoint above it. An earlier 1280 left the rings wrapping 2 + 1 because it
 * ignored the two paddings.
 */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 1440px)');
}
