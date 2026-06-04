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

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    // Fetch role from public.users for the signed-in user.
    // Used to grant admin bypass on client-side paywalls.
    const fetchRole = async (u) => {
      if (!u) { setRole(null); return; }
      try {
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('id', u.id)
          .single();
        if (!cancelled) setRole(data?.role || 'user');
      } catch {
        if (!cancelled) setRole('user');
      }
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      await fetchRole(u);
      if (!cancelled) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        await fetchRole(u);
      }
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
