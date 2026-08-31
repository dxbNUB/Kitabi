import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../store/session';
import {
  saveOnboardingAnswers,
  getPersonalizedExperience,
} from '../lib/personalization';

// BUG-L3: in-progress onboarding state survives navigation away (e.g. user
// clicks the kitabi logo, comes back) so they don't have to restart from Q1.
// Cleared on completion (finish) or after explicit skip.
const STORAGE_KEY = 'kitabi-onboarding-state';
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return (parsed && typeof parsed === 'object') ? parsed : null;
  } catch { return null; }
}

const QUESTIONS = [
  {
    id: 1,
    question: "What's your writing experience?",
    subtitle: 'This helps us calibrate how we talk to you.',
    options: [
      { value: 'never',     label: "I've never written a book" },
      { value: 'started',   label: "I've started but never finished" },
      { value: 'some',      label: "I've written stories or articles" },
      { value: 'published', label: "I'm a published author" },
    ],
  },
  {
    id: 2,
    question: 'What kind of book do you want to write?',
    subtitle: "We'll tailor suggestions to your genre.",
    options: [
      { value: 'fiction',  label: 'Fiction (novel, story)' },
      { value: 'memoir',   label: 'Memoir or personal story' },
      { value: 'business', label: 'Business or self-help' },
      { value: 'academic', label: 'Academic or educational' },
      { value: 'unsure',   label: "I'm not sure yet" },
    ],
  },
  {
    id: 3,
    question: 'How much time can you write each week?',
    subtitle: "We'll set realistic chapter goals.",
    options: [
      { value: 'casual',  label: '1–2 hours · casual' },
      { value: 'regular', label: '3–5 hours · regular' },
      { value: 'serious', label: '6–10 hours · serious' },
      { value: 'intense', label: '10+ hours · full focus' },
    ],
  },
  {
    id: 4,
    question: "What's your biggest writing challenge?",
    subtitle: "We'll prioritise tools that solve your problem.",
    options: [
      { value: 'ideas',       label: "I have ideas but can't start" },
      { value: 'writing',     label: 'I freeze when writing prose' },
      { value: 'structure',   label: "I can't structure a story" },
      { value: 'consistency', label: 'I start but never finish' },
      { value: 'quality',     label: 'My writing feels amateur' },
    ],
  },
  {
    id: 5,
    question: "What's your goal?",
    subtitle: "We'll recommend the right path for you.",
    options: [
      { value: 'personal',  label: 'Write for myself or family' },
      { value: 'share',     label: 'Share with friends' },
      { value: 'finish',    label: 'Finish a complete book' },
      { value: 'career',    label: 'Build a writing practice' },
    ],
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { setMode } = useSession();

  // BUG-L3: hydrate from localStorage so a navigation interruption doesn't
  // wipe progress. Lazy initializers run once on mount, no flicker.
  const [step,      setStep]    = useState(() => loadState()?.step    ?? 0);
  const [answers,   setAnswers] = useState(() => loadState()?.answers ?? {});
  const [direction, setDir]     = useState(1);

  // Persist on every change. Clear in finish() so a returning user past
  // completion doesn't get re-routed to old answers.
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, answers })); }
    catch { /* quota / private mode — best-effort */ }
  }, [step, answers]);

  const current = QUESTIONS[step];
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const isLast   = step === QUESTIONS.length - 1;

  const finish = (finalAnswers) => {
    saveOnboardingAnswers(finalAnswers);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    if (Object.keys(finalAnswers).length > 0) {
      const exp = getPersonalizedExperience(finalAnswers);
      setMode(exp.sessionMode); // applies "writer" / "nonwriter" to existing session
    }
    navigate('/welcome');
  };

  const handleAnswer = (value) => {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (isLast) {
      finish(next);
    } else {
      setDir(1);
      setTimeout(() => setStep(step + 1), 250);
    }
  };

  // BUG-L2: on Q1 the back button used to dead-end (disabled). Sending the
  // user home matches the visual cue (← Back) and lets them escape the flow.
  const handleBack = () => {
    if (step === 0) {
      navigate('/');
      return;
    }
    setDir(-1);
    setStep(step - 1);
  };

  const handleSkip = () => finish({});

  return (
    <div className="min-h-screen bg-kitabi-night flex flex-col">
      {/* Top bar with brand + skip */}
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between border-b border-seam bg-kitabi-night-soft/70 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="font-display text-2xl tracking-[0.06em] font-medium text-kitabi-gold"
          aria-label="Kitabi — home"
        >
          kitabi
        </button>
        <button
          onClick={handleSkip}
          className="text-sm text-kitabi-stone hover:text-kitabi-ivory transition whitespace-nowrap flex-shrink-0"
        >
          Skip personalisation
        </button>
      </header>

      {/* Quiz area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-2xl w-full">
          {/* Progress */}
          <div className="mb-10">
            <div className="flex justify-between text-xs text-kitabi-faded mb-2.5">
              <span className="font-medium tracking-wide">Question {step + 1} of {QUESTIONS.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <div
              className="w-full bg-[rgba(237,228,211,0.1)] rounded-full h-1.5 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Onboarding progress: question ${step + 1} of ${QUESTIONS.length}`}
            >
              <motion.div
                className="bg-kitabi-gold h-1.5 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 30 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl sm:text-4xl text-kitabi-ivory leading-tight mb-3 text-balance">
                  {current.question}
                </h1>
                <p className="text-sm sm:text-base text-kitabi-stone max-w-md mx-auto">
                  {current.subtitle}
                </p>
              </div>

              <div className="space-y-2.5">
                {current.options.map((option, idx) => {
                  const selected = answers[current.id] === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.25 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      aria-pressed={selected}
                      aria-label={option.label}
                      className={`group w-full text-left px-5 py-4 bg-kitabi-night-soft rounded-lg border
                        flex items-center gap-4 transition-colors
                        ${selected
                          ? 'border-gilt bg-[rgba(201,162,92,0.07)]'
                          : 'border-seam hover:border-gilt'}
                      `}
                    >
                      <span className={`font-display text-base font-medium tracking-wider w-7
                        ${selected ? 'text-kitabi-gold' : 'text-kitabi-faded group-hover:text-kitabi-gold'}
                        transition-colors`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className={`flex-1 text-base leading-snug
                        ${selected ? 'text-kitabi-ivory font-medium' : 'text-kitabi-stone'}`}>
                        {option.label}
                      </span>
                      <span className={`text-kitabi-gold transition-opacity
                        ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        aria-hidden="true">
                        →
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Footer nav */}
          <div className="flex justify-between items-center mt-10">
            <button
              onClick={handleBack}
              aria-label={step === 0 ? 'Back to homepage' : `Back to question ${step}`}
              className="text-sm text-kitabi-stone hover:text-kitabi-ivory transition flex items-center gap-1.5"
            >
              <span aria-hidden="true">←</span> Back
            </button>
            <p className="text-xs text-kitabi-faded">
              Your answers stay private until you create an account.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
