import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuth } from '../lib/auth';

/**
 * Account / billing tier — drives paywall gating across the app.
 * Today: defaults to 'starter' for everyone. When auth lands, hydrate from
 * users/{uid}.stats.tier on sign-in and write back on tier change.
 *
 * `VITE_KITABI_UNLIMITED=true` in .env.local treats every gate as open
 * (used for demos and internal testing).
 */
export const useAccount = create(
  persist(
    (set) => ({
      tier: 'starter',                         // 'starter' | 'author'
      setTier: (tier) => set({ tier }),
    }),
    {
      name: 'kitabi-account',
      storage: {
        getItem:    (k) => { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; },
        setItem:    (k, v) => localStorage.setItem(k, JSON.stringify(v)),
        removeItem: (k) => localStorage.removeItem(k),
      },
    }
  )
);

/**
 * Derived hook: returns tier + booleans + a `gate(feature)` helper.
 * Components import this instead of the raw store.
 */
export function useTier() {
  const tier = useAccount((s) => s.tier);
  const { isAdmin } = useAuth();
  const unlimited = import.meta.env.VITE_KITABI_UNLIMITED === 'true';

  return {
    tier,
    unlimited,
    isAdmin,
    isStarter:           !unlimited && !isAdmin && tier === 'starter',
    canUseAuthorFeats:    unlimited || isAdmin || tier !== 'starter',
  };
}
