import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * Lands here after Supabase finishes the OAuth round-trip.
 * Supabase JS automatically parses the URL hash (`#access_token=...`) and
 * stores the session — we just wait for `loading` to flip false, then route.
 *
 * Signed in → /dashboard
 * Not signed in (auth failed somehow) → / with a query string the Landing
 * page can surface as a toast on a future iteration.
 */
export default function AuthCallback() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/?auth=failed', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-kitabi-night text-sm text-kitabi-stone"
      role="status"
      aria-live="polite"
    >
      Signing you in…
    </div>
  );
}
