import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * Route guard. Wrap any route element that requires a signed-in user:
 *
 *   <Route path="/chat" element={<RequireAuth><Chat /></RequireAuth>} />
 *
 * While the auth session is hydrating we render a small loading shim instead
 * of redirecting — otherwise every protected page would flash a redirect on
 * refresh before Supabase has a chance to restore the session.
 */
export default function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-kitabi-night text-sm text-kitabi-stone"
        role="status"
        aria-live="polite"
      >
        Loading…
      </div>
    );
  }

  if (!user) {
    // Stash where the user was trying to go so we can route them back after
    // sign-in (Landing reads this from location.state).
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}
