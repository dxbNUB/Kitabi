import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import KitabiLogo from './KitabiLogo';

/**
 * Kitabi Navbar — minimal version
 * Brand on the left, single CTA on the right. No nav links, no drawer.
 * Transparent at top, condenses + gains hairline + backdrop blur on scroll.
 */
export default function Navbar({ surface = 'cream', onCta }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isInk    = surface === 'ink';
  const baseText = isInk ? 'text-kitabi-cream' : 'text-kitabi-ink';
  const hairline = isInk
    ? 'border-b border-[rgba(245,239,226,0.08)]'
    : 'border-b border-[rgba(17,17,17,0.08)]';
  const scrolledBg = isInk
    ? 'bg-[rgba(17,17,17,0.92)] backdrop-blur-[8px]'
    : 'bg-[rgba(245,239,226,0.92)] backdrop-blur-[8px]';

  const handleCta = () => {
    if (onCta) return onCta();
    const target = document.getElementById('begin-a-book');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      navigate('/');
    }
  };

  return (
    <motion.nav
      aria-label="Primary"
      initial={false}
      animate={{ height: scrolled ? 64 : 88 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-40 w-full flex items-center
        px-4 sm:px-8 lg:px-14 overflow-visible
        ${baseText}
        ${scrolled ? `${scrolledBg} ${hairline}` : 'bg-transparent border-b border-transparent'}
      `}
    >
      <div className="w-full max-w-[1280px] mx-auto flex items-center justify-between gap-3 sm:gap-6">
        <KitabiLogo
          variant={scrolled ? 'mini' : 'default'}
          as="button"
          onClick={() => navigate('/')}
          aria-label="Kitabi — go to home"
          className="cursor-pointer focus:outline-none flex-shrink-0"
        />

        <button
          onClick={handleCta}
          aria-label="Begin a new book"
          className={`flex-shrink-0 whitespace-nowrap px-4 sm:px-[22px] py-2.5 sm:py-[11px]
            text-[12px] sm:text-[13px] font-medium tracking-[0.04em] sm:tracking-[0.06em]
            border border-kitabi-saffron transition-colors duration-200
            ${scrolled
              ? 'bg-kitabi-gold text-kitabi-night hover:bg-kitabi-gold-deep hover:text-kitabi-paper'
              : 'text-kitabi-saffron hover:bg-kitabi-saffron hover:text-kitabi-ink'}
          `}
          style={{ borderRadius: 0 }}
        >
          begin a book
        </button>
      </div>
    </motion.nav>
  );
}
