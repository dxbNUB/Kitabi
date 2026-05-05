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
    <div className="min-h-screen bg-white text-[#1A1A1A] flex">
      <Sidebar />

      <div className="flex-1 lg:ml-80 mt-14 lg:mt-0 flex flex-col min-w-0">
      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <main
        id="begin-a-book"
        className="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-16"
      >
        <motion.h1
          className="font-serif text-4xl sm:text-5xl md:text-6xl text-[#1A1A1A] text-center leading-[1.1] mb-5 text-balance"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Turn your idea
          <br />
          into a <span className="text-[#C8964D] italic">book</span>.
        </motion.h1>

        <motion.p
          className="text-gray-600 text-center text-base sm:text-lg mb-8 max-w-md mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          No writing experience needed. Just answer a few questions and
          we'll start building your book — one chapter at a time.
        </motion.p>

        {/* Primary CTA — Google sign-in. Hidden once the user is signed in,
            because clicking it would either no-op or bounce them through
            Google again. Signed-in users go straight to the idea form below. */}
        {!user && (
          <>
            <motion.div
              className="flex flex-col items-center mb-8"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <button
                onClick={signInWithGoogle}
                aria-label="Continue with Google"
                className="flex items-center gap-3 px-7 py-3.5 bg-[#C8964D] hover:bg-[#b88340]
                           text-white font-semibold text-base rounded-lg shadow-md hover:shadow-lg
                           transition-all hover:-translate-y-0.5"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#fff" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.62z"/>
                  <path fill="#fff" opacity="0.9" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A9 9 0 009 18z"/>
                  <path fill="#fff" opacity="0.75" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.16.29-1.7V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l2.99-2.34z"/>
                  <path fill="#fff" opacity="0.6" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z"/>
                </svg>
                Continue with Google
              </button>
              <p className="text-[11px] text-gray-500 mt-2">
                Free to start · Saves your progress across devices
              </p>
            </motion.div>

            <div className="flex items-center gap-3 max-w-md mx-auto mb-6">
              <span className="flex-1 h-px bg-gray-200" aria-hidden="true" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">or start with an idea</span>
              <span className="flex-1 h-px bg-gray-200" aria-hidden="true" />
            </div>
          </>
        )}

        <motion.div
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <GenreSelector variant="pills" />
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          aria-label="Submit your story idea"
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4"
        >
          <label htmlFor="idea-input" className="sr-only">Your story idea</label>
          <div className="relative">
            <textarea
              id="idea-input"
              value={idea}
              onChange={e => {
                if (e.target.value.length <= 2000) setIdea(e.target.value);
              }}
              maxLength={2000}
              rows={3}
              placeholder="What's your idea? The messy version. The one that came to you at 2am."
              aria-label="Describe your story idea (10-2000 characters)"
              className="w-full bg-transparent border-0 px-3 py-2 pr-20 text-[#1A1A1A]
                         placeholder:text-gray-400 focus:outline-none transition
                         text-base resize-none"
            />
            <span
              className={`absolute bottom-2 right-3 text-[11px] font-medium pointer-events-none
                ${idea.length > 1800 ? 'text-red-600' :
                  idea.length > 1400 ? 'text-amber-600' :
                  'text-gray-400'}`}
              aria-live="polite"
            >
              {idea.length} / 2000
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 px-3 pt-2 pb-1 border-t border-gray-100 flex-wrap">
            <ModeToggle />
            <button
              type="submit"
              aria-label={user ? 'Start writing Chapter 1' : 'Save idea and continue with Google'}
              className="px-6 py-2.5 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold
                         text-sm sm:text-base rounded-lg transition shadow-sm
                         flex items-center gap-2"
            >
              {user ? 'Write Chapter 1' : 'Sign in to keep writing'} <span aria-hidden="true">→</span>
            </button>
          </div>
        </motion.form>

        <p className="text-center text-xs text-gray-500 mt-4">
          {user
            ? 'Your work auto-saves to your account.'
            : "We'll save your idea — Google sign-in keeps it across devices."}
        </p>
      </main>

      {/* Email capture — only relevant for anonymous visitors. Once signed in,
          the user has already opted in; showing a "join the waitlist" CTA
          becomes contradictory. */}
      {!user && (
        <section
          className="border-t border-gray-200 bg-[#FBF7EE] px-4 py-16"
          aria-labelledby="early-access-title"
        >
          <div className="max-w-md mx-auto text-center">
            <h2
              id="early-access-title"
              className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2"
            >
              Get early access.
            </h2>
            <p className="text-gray-600 text-sm mb-6">
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
