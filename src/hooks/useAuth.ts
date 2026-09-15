import { useEffect, useState } from 'react';
import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  loading: boolean;
}

interface AuthActions {
  signIn:  (email: string, password: string) => Promise<AuthError | null>;
  signUp:  (email: string, password: string) => Promise<AuthError | null>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState & AuthActions {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session from storage
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error;
  };

  const signUp = async (email: string, password: string): Promise<AuthError | null> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    // The PWA's runtime cache (vite.config.ts: 'supabase-api-cache') keeps
    // GET responses — tasks, habits, moods, journal text — around for its TTL
    // regardless of auth state. On a shared device the next person to sign in
    // would otherwise still be able to read the previous user's data straight
    // out of Cache Storage until it expires.
    try { await caches.delete('supabase-api-cache'); } catch { /* Cache Storage unavailable */ }
  };

  return { session, loading, signIn, signUp, signOut };
}
