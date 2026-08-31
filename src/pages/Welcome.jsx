import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSession } from '../store/session';
import {
  loadOnboardingAnswers,
  getPersonalizedExperience,
} from '../lib/personalization';

const TIER_COPY = {
  starter: { name: 'Starter', note: 'Free forever — perfect for trying out' },
  author:  { name: 'Author',  note: '$25/mo — for writers shipping work' },
};

// BUG-L6: lowercase genre ids come back from personalization, but the homepage
// chips use proper casing ("Sci-Fi" not "Scifi"). CSS capitalize only touches
// the first letter, so map ids to canonical labels here. Keep in sync with
// GenreSelector.jsx.
const GENRE_LABELS = {
  thriller:   'Thriller',
  fantasy:    'Fantasy',
  scifi:      'Sci-Fi',
  historical: 'Historical',
  business:   'Business',
};

export default function Welcome() {
  const navigate = useNavigate();
  const { setMode, setGenre } = useSession();

  // Read once on mount; fall back to defaults if user skipped onboarding
  const answers = useMemo(() => loadOnboardingAnswers(), []);
  const exp     = useMemo(() => getPersonalizedExperience(answers), [answers]);

  // Apply session-level personalization on mount
  useEffect(() => {
    if (exp.sessionMode) setMode(exp.sessionMode);
    // Pre-select the first suggested genre as a starting point (user can change later)
    if (exp.suggestedGenres?.[0]) setGenre(exp.suggestedGenres[0]);
  }, [exp, setMode, setGenre]);

  return (
    <div className="min-h-screen bg-kitabi-night py-16 px-6 sm:px-10 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Eyebrow + welcome line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12 sm:mb-16"
        >
          <p className="eyebrow mb-3">
            {answers ? 'Personalised for you' : 'Ready to start'}
          </p>
          {/* BUG-M1: text-balance + serif glyphs with terminal punctuation can clip
              the trailing period at the right edge on some viewports. pr-2 keeps
              descender/punctuation glyphs inside the rendered box. */}
          <h1 className="font-display text-3xl sm:text-5xl font-medium leading-tight text-kitabi-ivory mb-4 text-balance px-2">
            {exp.welcomeMessage}
          </h1>
          {answers && (
            <p className="text-base sm:text-lg text-kitabi-stone max-w-xl mx-auto">
              We've tuned Kitabi to match your goals. You can change any of this later in settings.
            </p>
          )}
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12 sm:mb-16">
          <StatCard
            delay={0.1}
            label="Your goal"
            value={exp.chapterTarget}
            unit={`chapter${exp.chapterTarget === 1 ? '' : 's'} / month`}
          />
          <StatCard
            delay={0.2}
            label="Estimated timeline"
            value={`${exp.estimatedTimeline.weeks}`}
            unit="weeks to a finished book"
          />
          <StatCard
            delay={0.3}
            label="Recommended plan"
            value={TIER_COPY[exp.recommendedTier]?.name || 'Author'}
            unit={TIER_COPY[exp.recommendedTier]?.note || ''}
            small
          />
        </div>

        {/* Priority features (only when we have personalization) */}
        {exp.priorityFeatures.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-12 sm:mb-16"
          >
            <h2 className="font-display text-2xl sm:text-3xl font-medium text-kitabi-ivory mb-6">
              Tools we'll prioritise for you
            </h2>
            <div className="space-y-3">
              {exp.priorityFeatures.map((feature, idx) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + idx * 0.08 }}
                  className="p-5 bg-kitabi-night-soft rounded-lg border border-seam hover:border-gilt
                             transition-colors flex items-center gap-4"
                >
                  <span className="font-display text-2xl font-medium text-kitabi-gold" aria-hidden="true">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-kitabi-ivory">{feature.name}</p>
                    <p className="text-sm text-kitabi-stone">{feature.description}</p>
                  </div>
                  <span className="text-kitabi-gold flex-shrink-0" aria-hidden="true">→</span>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Suggested genres (when we have them) */}
        {exp.suggestedGenres.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mb-12 sm:mb-16"
          >
            <h2 className="font-display text-xl sm:text-2xl font-medium text-kitabi-ivory mb-4">
              Suggested genres for your book
            </h2>
            <div className="flex flex-wrap gap-2">
              {exp.suggestedGenres.map((g) => (
                <span
                  key={g}
                  className="px-4 py-1.5 rounded-full text-sm border border-gilt
                             bg-[rgba(201,162,92,0.08)] text-kitabi-gold"
                >
                  {GENRE_LABELS[g] || g}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* Primary CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/chat')}
            className="px-10 py-3.5 btn-gold font-semibold
                       text-base sm:text-lg rounded-md transition-colors"
          >
            Start writing Chapter 1 →
          </button>
          <p className="mt-3 text-sm text-kitabi-faded">
            We'll guide you through the first chapter, step by step.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, delay = 0, small = false }) {
  return (
    // BUG-M2: min-w-0 lets the grid item shrink below its content's intrinsic
    // min-width, preventing the third card (Recommended Plan, with the longest
    // unit string) from pushing the grid past the viewport. break-words is a
    // safety net for unexpectedly long values/units.
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className="min-w-0 p-7 bg-kitabi-night-soft rounded-lg border border-seam hover:border-gilt
                 transition-colors"
    >
      <p className="text-[11px] uppercase tracking-[0.18em] text-kitabi-faded mb-3">{label}</p>
      <p className={`font-display font-medium text-kitabi-gold mb-1.5 leading-none capitalize break-words
        ${small ? 'text-2xl sm:text-3xl' : 'text-4xl sm:text-5xl'}`}>
        {value}
      </p>
      <p className="text-sm text-kitabi-stone break-words">{unit}</p>
    </motion.div>
  );
}
