import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Auth context — wraps Supabase Auth so the rest of the app can call
 * `useAuth()` to read the current user, sign in with Google, or sign out.
 *
 * Source of truth is `supabase.auth.getSession()` + the `onAuthStateChange`
 * subscription. We hydrate once on mount (handles page refresh + the OAuth
 * redirect return) and then react to events.
 */

const AuthContext = createContext({
  user:    null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut:          async () => {},
});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY at build time —
      // app keeps working in anonymous mode, sign-in is a no-op.
      setLoading(false);
      return;
    }

    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('[auth] supabase client missing — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Return the user to the page they signed in from.
        redirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) console.error('[auth] google sign-in failed:', error.message);
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) console.error('[auth] sign-out failed:', error.message);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
