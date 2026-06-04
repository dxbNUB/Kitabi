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
  role:    null,
  isAdmin: false,
  signInWithGoogle: async () => {},
  signOut:          async () => {},
});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [role,    setRole]    = useState(null);

  // Auth session hydration. Resolves `loading` immediately once Supabase
  // tells us whether there's a session — does NOT wait on the role fetch.
  useEffect(() => {
    if (!supabase) {
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

  // Role fetch — runs separately whenever `user` changes. A slow or stuck
  // role query CANNOT block the app from rendering anymore.
  useEffect(() => {
    if (!user || !supabase) {
      setRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (!cancelled) setRole(data?.role || 'user');
      } catch {
        if (!cancelled) setRole('user');
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const signInWithGoogle = async () => {
    if (!supabase) {
      console.error('[auth] supabase client missing — check VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY');
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // All OAuth flows land on /auth/callback. The route's component reads
        // the URL hash (Supabase JS auto-handles it), waits for the session,
        // then routes to /dashboard. This works on localhost, ideaflow-pearl.vercel.app,
        // kitabi.ink, and any future domain because window.location.origin is dynamic.
        redirectTo: window.location.origin + '/auth/callback',
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
    <AuthContext.Provider
      value={{ user, loading, role, isAdmin: role === 'admin', signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
