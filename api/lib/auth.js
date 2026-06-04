import { createClient } from '@supabase/supabase-js';

/**
 * Identify the user behind an API request via Authorization: Bearer header.
 *
 * Returns { userId, email, tier, role, isAdmin } or anonymous defaults if
 * the header is missing/invalid. Admin role bypasses all rate limits,
 * monthly caps, abuse detection, and the spend cap server-side.
 *
 * Anonymous (no token) callers fall through to IP-based rate limiting,
 * which is the legacy behaviour every endpoint already implements.
 */

const SUPABASE_URL      = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Service-level client used only to verify JWTs.
const tokenVerifier = (SUPABASE_URL && SUPABASE_ANON_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const ANONYMOUS = Object.freeze({
  userId: null,
  email:  null,
  tier:   'starter',
  role:   'anonymous',
  isAdmin: false,
});

export async function getRequestUser(req) {
  if (!tokenVerifier) return ANONYMOUS;

  const auth = (req.headers?.authorization || '').toString();
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return ANONYMOUS;

  const { data: { user }, error } = await tokenVerifier.auth.getUser(token);
  if (error || !user) return ANONYMOUS;

  // JWT-scoped client so the SELECT runs as the user (RLS-friendly).
  const userScoped = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: row, error: rowError } = await userScoped
    .from('users')
    .select('tier, role')
    .eq('id', user.id)
    .single();

  if (rowError) {
    // Row not found (e.g., trigger hasn't fired) — treat as authenticated
    // user with default tier/role rather than rejecting.
    return { userId: user.id, email: user.email, tier: 'starter', role: 'user', isAdmin: false };
  }

  const role = row.role || 'user';
  return {
    userId:  user.id,
    email:   user.email,
    tier:    row.tier || 'starter',
    role,
    isAdmin: role === 'admin',
  };
}
