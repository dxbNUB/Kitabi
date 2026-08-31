import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { hasCompletedOnboarding } from '../lib/personalization';
import { useSession } from '../store/session';
import { useAuth } from '../lib/auth';
import KitabiLogo from './KitabiLogo';

// Real auth backed by Supabase Auth (Google OAuth). Anonymous users see only
// public nav items; signed-in users get the gated routes (Dashboard, Write,
// My Library, Settings). Loading state is treated as anonymous to avoid
// flashing protected items before the session is hydrated.
function useIsLoggedIn() {
  const { user } = useAuth();
  return !!user;
}

const NAV = [
  { id: 'home',      label: 'Home',      href: '/' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { id: 'write',     label: 'Write',     href: '/chat',      requiresAuth: true },
  {
    id: 'library', label: 'My Library', requiresAuth: true,
    children: [
      { id: 'chats',    label: 'My Chats',          href: '/my-chats'         },
      { id: 'chapters', label: 'My Chapters',       href: '/my-chapters'      },
      { id: 'books',    label: 'My Books',          href: '/my-books'         },
      { id: 'trash',    label: 'Recently Deleted',  href: '/recently-deleted' },
    ],
  },
  {
    id: 'learn', label: 'Learn',
    children: [
      { id: 'how-it-works', label: 'How It Works', href: '/how-it-works' },
      { id: 'compare',      label: 'Compare',      href: '/compare'      },
      { id: 'faq',          label: 'FAQ',          href: '/faq'          },
    ],
  },
  {
    id: 'plans', label: 'Plans',
    children: [
      { id: 'pricing', label: 'Pricing', href: '/pricing' },
      { id: 'about',   label: 'About',   href: '/about'   },
    ],
  },
  { id: 'settings',  label: 'Settings',  href: '/settings',  requiresAuth: true },
];

function NavItem({ item, active, onClick }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200
        ${active ? 'bg-[rgba(201,162,92,0.08)]' : 'hover:bg-[rgba(237,228,211,0.04)]'}`}
    >
      <span
        className={`w-[2px] h-8 rounded-sm flex-shrink-0 transition-colors duration-200
          ${active ? 'bg-kitabi-gold' : 'bg-[rgba(237,228,211,0.12)] group-hover:bg-[rgba(201,162,92,0.45)]'}`}
        aria-hidden="true"
      />
      <span
        className={`flex-1 text-sm tracking-[0.01em] transition-colors duration-200
          ${active ? 'text-kitabi-gold font-medium' : 'text-kitabi-stone group-hover:text-kitabi-ivory font-normal'}`}
      >
        {item.label}
      </span>
    </Link>
  );
}

function ParentItem({ item, expanded, hasActiveChild, onToggle }) {
  const active = hasActiveChild;
  return (
    <button
      onClick={onToggle}
      aria-expanded={expanded}
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors duration-200
        ${active ? 'bg-[rgba(201,162,92,0.08)]' : 'hover:bg-[rgba(237,228,211,0.04)]'}`}
    >
      <span
        className={`w-[2px] h-8 rounded-sm flex-shrink-0 transition-colors duration-200
          ${active ? 'bg-kitabi-gold' : 'bg-[rgba(237,228,211,0.12)] group-hover:bg-[rgba(201,162,92,0.45)]'}`}
        aria-hidden="true"
      />
      <span
        className={`flex-1 text-left text-sm tracking-[0.01em] transition-colors duration-200
          ${active ? 'text-kitabi-gold font-medium' : 'text-kitabi-stone group-hover:text-kitabi-ivory font-normal'}`}
      >
        {item.label}
      </span>
      <motion.span
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-kitabi-faded text-xs"
        aria-hidden="true"
      >
        ▾
      </motion.span>
    </button>
  );
}

function ChildItem({ child, active, onClick }) {
  return (
    <Link
      to={child.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`block px-3 py-1.5 rounded text-sm transition-colors duration-150
        ${active
          ? 'text-kitabi-gold font-medium bg-[rgba(201,162,92,0.08)]'
          : 'text-kitabi-stone hover:text-kitabi-ivory hover:bg-[rgba(237,228,211,0.04)]'}`}
    >
      {child.label}
    </Link>
  );
}

function AuthBlock({ onItemClick }) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <div className="h-9 mb-3 rounded bg-[rgba(237,228,211,0.06)] animate-pulse" aria-hidden="true" />;
  }

  if (user) {
    const display = user.user_metadata?.name || user.email || 'Signed in';
    return (
      <div className="mb-3 px-1">
        <p className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded mb-1">Signed in</p>
        <p className="text-xs text-kitabi-ivory font-medium truncate" title={user.email}>{display}</p>
        <button
          onClick={() => { signOut(); onItemClick?.(); }}
          className="mt-1.5 text-xs text-kitabi-stone hover:text-kitabi-gold transition"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signInWithGoogle()}
      className="mb-3 w-full flex items-center justify-center gap-2 px-3 py-2.5
                 bg-[rgba(237,228,211,0.04)] border border-seam hover:border-gilt
                 rounded-md text-sm font-medium text-kitabi-ivory transition-colors"
      aria-label="Sign in with Google"
    >
      {/* Inline Google "G" mark — keeps the dependency tree clean (no svg import). */}
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
        <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>
        <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
        <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
        <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
      </svg>
      Continue with Google
    </button>
  );
}

function SidebarBody({ pathname, onItemClick }) {
  const navigate = useNavigate();
  const isLoggedIn = useIsLoggedIn();
  const { project, chapterGenerated } = useSession();

  const visible = NAV.filter((i) => !i.requiresAuth || isLoggedIn);

  // Track which expandable groups are open
  const [expanded, setExpanded] = useState({});

  // Auto-expand the parent of the currently-active sub-page
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      for (const item of NAV) {
        if (item.children?.some((c) => c.href === pathname)) {
          next[item.id] = true;
        }
      }
      return next;
    });
  }, [pathname]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  // Bottom CTA: adapts to user state
  const ctaLabel =
    chapterGenerated   ? 'Open chapter →' :
    project?.premise   ? 'Continue writing →' :
                         'Start your book →';
  const ctaHref =
    chapterGenerated   ? '/chapter' :
    project?.premise   ? '/chat' :
    hasCompletedOnboarding() ? '/chat' : '/onboarding';

  return (
    <div className="flex flex-col h-full p-6">
      {/* Wordmark + tagline */}
      <KitabiLogo
        as="button"
        onClick={() => { navigate('/'); onItemClick?.(); }}
        aria-label="Kitabi — go to home"
        className="mb-2 text-left"
      />
      <p className="text-[10px] uppercase tracking-[0.24em] text-kitabi-faded mb-9">
        Finish your book
      </p>

      {/* Navigation */}
      <nav aria-label="Main navigation" className="space-y-0.5 flex-1 overflow-y-auto -mx-1 px-1">
        {visible.map((item) => {
          if (item.children) {
            const isExpanded = !!expanded[item.id];
            const hasActiveChild = item.children.some((c) => c.href === pathname);
            const visibleChildren = item.children.filter(
              (c) => !c.requiresAuth || isLoggedIn
            );
            return (
              <div key={item.id}>
                <ParentItem
                  item={item}
                  expanded={isExpanded}
                  hasActiveChild={hasActiveChild}
                  onToggle={() => toggle(item.id)}
                />
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-1 mb-1 space-y-0.5 border-l border-seam pl-3">
                        {visibleChildren.map((child) => (
                          <ChildItem
                            key={child.id}
                            child={child}
                            active={pathname === child.href}
                            onClick={onItemClick}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }
          return (
            <NavItem
              key={item.id}
              item={item}
              active={pathname === item.href}
              onClick={onItemClick}
            />
          );
        })}
      </nav>

      {/* Auth + bottom CTA */}
      <div className="border-t border-seam pt-5 mt-4">
        <AuthBlock onItemClick={onItemClick} />
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => { navigate(ctaHref); onItemClick?.(); }}
          className="w-full bg-kitabi-gold hover:bg-kitabi-gold-deep text-kitabi-night font-semibold
                     py-3 rounded-md transition-colors text-sm tracking-[0.02em]"
        >
          {ctaLabel}
        </motion.button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { pathname } = useLocation();
  const navigate     = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [drawerOpen]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Site navigation"
        className="hidden lg:block fixed left-0 top-0 h-screen w-72 bg-kitabi-night-soft border-r border-seam z-40"
      >
        <SidebarBody pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-kitabi-night-soft/95 backdrop-blur-sm border-b border-seam px-4 py-3 flex items-center justify-between">
        <KitabiLogo
          variant="mini"
          as="button"
          onClick={() => navigate('/')}
          aria-label="Kitabi — home"
        />
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="flex flex-col gap-[5px] p-2 bg-transparent border-0 cursor-pointer text-kitabi-ivory"
        >
          <span className="block w-[22px] h-px bg-current" aria-hidden="true" />
          <span className="block w-[16px] h-px bg-current" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile drawer + scrim */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-kitabi-night-soft border-r border-seam shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 text-3xl text-kitabi-faded hover:text-kitabi-ivory transition w-10 h-10 flex items-center justify-center"
              >
                <span aria-hidden="true">×</span>
              </button>
              <SidebarBody pathname={pathname} onItemClick={() => setDrawerOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
