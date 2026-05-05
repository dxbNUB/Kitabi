import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { hasCompletedOnboarding } from '../lib/personalization';
import { useSession } from '../store/session';
import { useAuth } from '../lib/auth';

// Real auth backed by Supabase Auth (Google OAuth). Anonymous users see only
// public nav items; signed-in users get the gated routes (Dashboard, Write,
// My Library, Settings). Loading state is treated as anonymous to avoid
// flashing protected items before the session is hydrated.
function useIsLoggedIn() {
  const { user } = useAuth();
  return !!user;
}

const NAV = [
  { id: 'home',      label: 'Home',      href: '/',          color: 'from-amber-400 to-amber-600' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', color: 'from-amber-500 to-amber-700', requiresAuth: true },
  { id: 'write',     label: 'Write',     href: '/chat',      color: 'from-amber-600 to-amber-800', requiresAuth: true },
  {
    id: 'library', label: 'My Library', color: 'from-blue-500 to-blue-700', requiresAuth: true,
    children: [
      { id: 'chats',    label: 'My Chats',    href: '/my-chats'    },
      { id: 'chapters', label: 'My Chapters', href: '/my-chapters' },
      { id: 'books',    label: 'My Books',    href: '/my-books'    },
    ],
  },
  {
    id: 'learn', label: 'Learn', color: 'from-purple-500 to-purple-700',
    children: [
      { id: 'how-it-works', label: 'How It Works', href: '/how-it-works' },
      { id: 'compare',      label: 'Compare',      href: '/compare'      },
      { id: 'faq',          label: 'FAQ',          href: '/faq'          },
    ],
  },
  {
    id: 'plans', label: 'Plans', color: 'from-gray-500 to-gray-700',
    children: [
      { id: 'pricing', label: 'Pricing', href: '/pricing' },
      { id: 'about',   label: 'About',   href: '/about'   },
    ],
  },
  { id: 'settings',  label: 'Settings',  href: '/settings',  color: 'from-slate-500 to-slate-700', requiresAuth: true },
];

function NavItem({ item, active, onClick }) {
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
        ${active ? 'bg-[#FFF7EB]' : 'hover:bg-gray-50'}`}
    >
      <span
        className={`w-[3px] h-9 rounded-sm bg-gradient-to-b ${item.color} flex-shrink-0
          ${active ? 'shadow-[0_0_0_1px_rgba(200,150,77,0.4)]' : ''}`}
        aria-hidden="true"
      />
      <span
        className={`flex-1 text-sm tracking-[0.01em] transition-colors duration-200
          ${active ? 'text-[#C8964D] font-semibold' : 'text-gray-700 group-hover:text-[#1A1A1A] font-medium'}`}
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
      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-200
        ${active ? 'bg-[#FFF7EB]' : 'hover:bg-gray-50'}`}
    >
      <span
        className={`w-[3px] h-9 rounded-sm bg-gradient-to-b ${item.color} flex-shrink-0
          ${active ? 'shadow-[0_0_0_1px_rgba(200,150,77,0.4)]' : ''}`}
        aria-hidden="true"
      />
      <span
        className={`flex-1 text-left text-sm tracking-[0.01em] transition-colors duration-200
          ${active ? 'text-[#C8964D] font-semibold' : 'text-gray-700 group-hover:text-[#1A1A1A] font-medium'}`}
      >
        {item.label}
      </span>
      <motion.span
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
        className="text-gray-400 text-xs"
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
          ? 'text-[#C8964D] font-semibold bg-[#FFF7EB]'
          : 'text-gray-600 hover:text-[#1A1A1A] hover:bg-gray-50'}`}
    >
      {child.label}
    </Link>
  );
}

function AuthBlock({ onItemClick }) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return <div className="h-9 mb-3 rounded bg-gray-100 animate-pulse" aria-hidden="true" />;
  }

  if (user) {
    const display = user.user_metadata?.name || user.email || 'Signed in';
    return (
      <div className="mb-3 px-1">
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-1">Signed in</p>
        <p className="text-xs text-[#1A1A1A] font-medium truncate" title={user.email}>{display}</p>
        <button
          onClick={() => { signOut(); onItemClick?.(); }}
          className="mt-1.5 text-xs text-gray-500 hover:text-[#C8964D] transition"
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
                 bg-white border border-gray-300 hover:border-[#C8964D] hover:bg-gray-50
                 rounded-lg text-sm font-medium text-[#1A1A1A] transition"
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
      <button
        onClick={() => { navigate('/'); onItemClick?.(); }}
        aria-label="Kitabi — go to home"
        className="font-display text-3xl tracking-[0.06em] font-medium text-[#C8964D] block mb-1 text-left"
      >
        kitabi
      </button>
      <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-9">
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
                      <div className="ml-7 mt-1 mb-1 space-y-0.5 border-l border-gray-200 pl-3">
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
      <div className="border-t border-gray-200 pt-5 mt-4">
        <AuthBlock onItemClick={onItemClick} />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { navigate(ctaHref); onItemClick?.(); }}
          className="w-full bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold
                     py-3 rounded-lg transition-shadow shadow-sm hover:shadow-md text-sm"
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
        className="hidden lg:block fixed left-0 top-0 h-screen w-72 bg-white border-r border-gray-200 z-40"
      >
        <SidebarBody pathname={pathname} />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="font-display text-2xl tracking-[0.06em] font-medium text-[#C8964D]"
          aria-label="Kitabi — home"
        >
          kitabi
        </button>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          className="flex flex-col gap-[5px] p-2 bg-transparent border-0 cursor-pointer text-[#1A1A1A]"
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
              className="lg:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation menu"
                className="absolute top-4 right-4 text-3xl text-gray-400 hover:text-[#1A1A1A] transition w-10 h-10 flex items-center justify-center"
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
