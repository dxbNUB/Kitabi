import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../store/session';
import { useAuth } from '../lib/auth';
import { detectGenre } from '../lib/api';
import { analytics, funnelTimer } from '../lib/analytics';
import { toast } from '../lib/toast';
import { hasCompletedOnboarding } from '../lib/personalization';
import { useProgress } from '../store/progress';
import { useSEO } from '../lib/seo';
import GenreSelector from './GenreSelector';
import ModeToggle from './ModeToggle';
import Sidebar from './Sidebar';
import WaitlistPrompt from './WaitlistPrompt';
import Footer from './Footer';

export default function Landing() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { setPhase, setGenre, updateProject, genre } = useSession();
  const [idea, setIdea] = useState('');

  useSEO({
    title: 'Kitabi — AI Writing Assistant That Helps You Finish Your Book',
    description: 'AI writing assistant for novelists and authors. Turn your idea into a publication-quality book — chapter by chapter. Genre-aware AI book writer trained on 10,000 bestsellers. Free to start.',
    canonical: 'https://kitabi.ink/',
    image: 'https://kitabi.ink/og-image.svg',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = idea.trim();
    if (!trimmed) {
      toast.error('Please enter your idea before starting.');
      return;
    }
    if (trimmed.length < 6) {
      toast.warn('Try a few more words — even one sentence helps.');
      return;
    }

    const detected = genre || detectGenre(trimmed);
    if (detected) setGenre(detected);

    updateProject({ premise: trimmed });
    setPhase('chat');
    funnelTimer.start();
    analytics.ideaSubmitted(detected);
    useProgress.getState().bookStarted();

    if (!user) {
      // Anonymous → sign in first. The premise + genre are already in the
      // (sessionStorage-backed) store, so they survive the OAuth round-trip.
      // After Google returns we land on /, the user is now signed in, the
      // form below is hidden in favour of the regular flow paths, and the
      // Sidebar / Dashboard CTAs route them into /chat with the saved idea.
      signInWithGoogle();
      return;
    }

    // Signed in → straight into the normal start-a-new-book flow. This is
    // the path Dashboard's "Begin Writing →" sends users back through.
    navigate(hasCompletedOnboarding() ? '/chat' : '/onboarding');
  };

  return (
    <div className="min-h-screen bg-kitabi-night text-kitabi-ivory flex">
      <Sidebar />

      <div className="flex-1 lg:ml-80 mt-14 lg:mt-0 flex flex-col min-w-0 relative">
        {/* Lamplight — a pool of warmth behind the sheet, plus two slowly
            drifting ambient glows that keep the room feeling lit and alive. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-[760px]"
            style={{
              background:
                'radial-gradient(ellipse 680px 480px at 50% 340px, rgba(212,168,91,0.16) 0%, rgba(212,168,91,0.06) 42%, transparent 70%)',
            }}
          />
          <div
            className="ambient ambient-a w-[420px] h-[420px] -top-24 right-[8%]"
            style={{ background: 'rgba(212,168,91,0.10)' }}
          />
          <div
            className="ambient ambient-b w-[360px] h-[360px] top-[52%] -left-24"
            style={{ background: 'rgba(166,124,59,0.08)' }}
          />
        </div>

        {/* ─── HERO ─────────────────────────────────────────────────────── */}
        <main
          id="begin-a-book"
          className="relative flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20"
        >
          <motion.p
            className="eyebrow text-center mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <span dir="rtl" className="font-arabic tracking-normal normal-case text-[13px] align-middle">كتابي</span>
            <span className="mx-2 text-kitabi-faded" aria-hidden="true">·</span>
            my book
          </motion.p>

          <motion.h1
            className="font-display font-medium text-[2.75rem] sm:text-6xl md:text-[4.25rem] text-kitabi-ivory text-center leading-[1.05] mb-6 text-balance"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Turn your idea
            <br />
            into a <em className="foil italic">book</em>.
          </motion.h1>

          <motion.p
            className="text-kitabi-stone text-center text-base sm:text-lg leading-relaxed mb-10 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            No writing experience needed. Answer a few questions and
            we'll build your book with you — one chapter at a time.
          </motion.p>

          {/* The sheet — a piece of paper on the dark desk. Your idea starts here. */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.25 }}
            aria-label="Submit your story idea"
            className="sheet p-5 sm:p-7 mb-8"
          >
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#9C917D] mb-3 select-none">
              Chapter one begins with a sentence
            </p>
            <label htmlFor="idea-input" className="sr-only">Your story idea</label>
            <div className="relative">
              <textarea
                id="idea-input"
                value={idea}
                onChange={e => {
                  if (e.target.value.length <= 2000) setIdea(e.target.value);
                }}
                maxLength={2000}
                rows={4}
                placeholder="What's your idea? The messy version. The one that came to you at 2am."
                aria-label="Describe your story idea (10-2000 characters)"
                className="w-full bg-transparent border-0 px-0 py-1 text-[#1A1A1A]
                           focus:outline-none transition resize-none
                           font-serif text-lg leading-relaxed"
              />
              <span
                className={`absolute -bottom-1 right-0 text-[11px] font-sans font-medium pointer-events-none
                  ${idea.length > 1800 ? 'text-red-700' :
                    idea.length > 1400 ? 'text-kitabi-gold-deep' :
                    'text-[#B3A88F]'}`}
                aria-live="polite"
              >
                {idea.length} / 2000
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-4 mt-3 border-t border-[rgba(44,36,22,0.1)] flex-wrap">
              <ModeToggle />
              <button
                type="submit"
                aria-label={user ? 'Start writing Chapter 1' : 'Save idea and continue with Google'}
                className="px-6 py-2.5 btn-gold font-semibold
                           text-sm sm:text-base rounded-md transition-colors
                           flex items-center gap-2"
              >
                {user ? 'Write Chapter 1' : 'Sign in to keep writing'} <span aria-hidden="true">→</span>
              </button>
            </div>
          </motion.form>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.35 }}
          >
            <GenreSelector variant="pills" />
          </motion.div>

          {/* Secondary path — Google sign-in. Hidden once signed in, because
              clicking it would either no-op or bounce them through Google
              again. Signed-in users go straight to the idea form above. */}
          {!user && (
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <div className="flex items-center gap-3 w-full max-w-md mb-4">
                <span className="flex-1 h-px bg-[rgba(237,228,211,0.09)]" aria-hidden="true" />
                <span className="text-[10px] uppercase tracking-[0.22em] text-kitabi-faded">or</span>
                <span className="flex-1 h-px bg-[rgba(237,228,211,0.09)]" aria-hidden="true" />
              </div>
              <button
                onClick={signInWithGoogle}
                aria-label="Continue with Google"
                className="flex items-center gap-3 px-6 py-3 border border-seam hover:border-gilt
                           text-kitabi-ivory font-medium text-sm rounded-md
                           bg-[rgba(237,228,211,0.03)] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
                  <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
              <p className="text-[11px] text-kitabi-faded mt-1">
                Free to start · Saves your progress across devices
              </p>
            </motion.div>
          )}

          {user && (
            <p className="text-center text-xs text-kitabi-faded mt-2">
              Your work auto-saves to your account.
            </p>
          )}
        </main>

        {/* Email capture — only relevant for anonymous visitors. Once signed in,
            the user has already opted in; showing a "join the waitlist" CTA
            becomes contradictory. */}
        {!user && (
          <section
            className="relative border-t border-seam bg-kitabi-night-soft px-4 py-16"
            aria-labelledby="early-access-title"
          >
            <div className="max-w-md mx-auto text-center">
              <p className="eyebrow mb-3">Early access</p>
              <h2
                id="early-access-title"
                className="font-display font-medium text-3xl sm:text-4xl text-kitabi-ivory mb-2"
              >
                Be first at the desk.
              </h2>
              <p className="text-kitabi-stone text-sm mb-7">
                We'll let you know when full access opens up. No spam, ever.
              </p>
              <WaitlistPrompt variant={1} />
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
