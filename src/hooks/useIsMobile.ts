import { useSyncExternalStore } from 'react';

/** Phone portrait. Matches the 768px tablet breakpoint the rest of the app uses. */
const QUERY = '(max-width: 767px)';

const mql = typeof window === 'undefined' ? null : window.matchMedia(QUERY);

function subscribe(onChange: () => void): () => void {
  mql?.addEventListener('change', onChange);
  return () => mql?.removeEventListener('change', onChange);
}

/**
 * Direction B: phone screens get their own layout, not a squeezed desktop one.
 * useSyncExternalStore keeps the value correct across concurrent renders without
 * a hand-rolled resize listener.
 */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => mql?.matches ?? false, () => false);
}
