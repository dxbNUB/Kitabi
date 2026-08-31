import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useProgress, MILESTONES, todaysMotivation } from '../store/progress';
import { useSession } from '../store/session';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    chaptersWritten, totalWords, booksStarted,
    currentStreak, longestStreak, daysWritten,
    milestonesEarned, lastWriteDate,
  } = useProgress();

  const { project, chapterGenerated } = useSession();

  const motivation       = todaysMotivation();
  const wroteToday       = lastWriteDate === todayKey();
  const nextMilestone    = MILESTONES.find((m) => chaptersWritten < m.chapters);
  const progressToNext   = nextMilestone
    ? Math.min(100, Math.round((chaptersWritten / nextMilestone.chapters) * 100))
    : 100;

  // BUG-M5: previously this only looked at the live session (chapterGenerated /
  // premise), so a returning user with chapters in history but no live session
  // saw "Start your book today" — wrong message + wrong CTA. Treat any
  // recorded progress as "active book" too.
  const hasLiveSession   = !!chapterGenerated || !!project?.premise;
  const hasAnyHistory    = chaptersWritten > 0;
  const hasActiveBook    = hasLiveSession || hasAnyHistory;

  return (
    <PageLayout>
      <div className="bg-kitabi-night">
        {/* HERO — streak + greeting */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-seam">
          <p className="eyebrow mb-3">
            {wroteToday ? "Today's progress" : 'Welcome back'}
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-medium text-kitabi-ivory leading-[1.05] mb-5 text-balance">
            {chaptersWritten === 0
              ? <>Your book is <em className="foil italic">waiting</em>.</>
              : currentStreak >= 2
                ? <><em className="foil italic">{currentStreak}</em> days in a row.</>
                : <>Pick up where you <em className="foil italic">left off</em>.</>}
          </h1>
          <p className="text-base sm:text-lg text-kitabi-stone max-w-xl">
            {motivation}
          </p>
        </section>

        {/* STATS GRID */}
        <section className="px-6 sm:px-12 lg:px-24 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl">
            <Stat label="Chapters written" value={chaptersWritten} accent />
            <Stat label="Words written"    value={totalWords.toLocaleString()} />
            <Stat
              label="Current streak"
              value={currentStreak}
              suffix={currentStreak === 1 ? 'day' : 'days'}
              accent={currentStreak >= 3}
            />
            <Stat
              label="Longest streak"
              value={longestStreak}
              suffix={longestStreak === 1 ? 'day' : 'days'}
            />
          </div>
        </section>

        {/* NEXT ACTION — biggest CTA on the page */}
        <section className="px-6 sm:px-12 lg:px-24 pb-10">
          <div className="max-w-4xl bg-kitabi-night-soft border border-gilt rounded-lg p-8 sm:p-10 shadow-raise">
            <p className="eyebrow mb-2">Next action</p>

            {hasActiveBook ? (
              <>
                <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-2 leading-tight">
                  {chapterGenerated
                    ? 'Continue where you left off.'
                    : project?.premise
                      ? 'You started a book. Finish Chapter 1.'
                      : 'Welcome back. Start your next chapter.'}
                </h2>
                {project?.premise && (
                  <p className="text-sm text-kitabi-stone italic mb-6 line-clamp-2 max-w-2xl">
                    "{project.premise}"
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(chapterGenerated ? '/chapter' : '/chat')}
                    className="px-7 py-3 btn-gold font-semibold rounded-md transition-colors"
                  >
                    {chapterGenerated ? 'Open chapter →' : 'Continue writing →'}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-7 py-3 border border-seam hover:border-gilt text-kitabi-ivory font-semibold rounded-md transition-colors"
                  >
                    Start a new book
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-2 leading-tight">
                  Start your book today.
                </h2>
                <p className="text-sm text-kitabi-stone mb-6 max-w-xl">
                  One chapter is all you need to begin. Most people never write theirs. Don't be most people.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-7 py-3 btn-gold font-semibold rounded-md transition-colors"
                >
                  Begin writing →
                </button>
              </>
            )}
          </div>
        </section>

        {/* MILESTONE PROGRESS */}
        <section className="px-6 sm:px-12 lg:px-24 pb-10">
          <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-2">Milestones</h2>
          <p className="text-kitabi-stone mb-7 max-w-xl">
            Most people quit before Chapter 5. The further you get, the rarer it becomes.
          </p>

          {nextMilestone && (
            <div className="mb-6 max-w-2xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-kitabi-stone">Next: {nextMilestone.title}</span>
                <span className="text-kitabi-ivory font-semibold">
                  {chaptersWritten} / {nextMilestone.chapters}
                </span>
              </div>
              <div className="w-full bg-[rgba(237,228,211,0.1)] rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-kitabi-gold rounded-full"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
            {MILESTONES.map((m) => {
              const earned = milestonesEarned.find((e) => e.id === m.id);
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-lg border transition
                    ${earned
                      ? 'bg-[rgba(201,162,92,0.07)] border-gilt'
                      : 'bg-kitabi-night-soft border-seam opacity-70'}`}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`font-serif text-base ${earned ? 'text-kitabi-ivory' : 'text-kitabi-stone'}`}>
                      {m.title}
                    </span>
                    {earned && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-kitabi-gold font-semibold">Earned</span>
                    )}
                  </div>
                  <p className={`text-xs leading-snug ${earned ? 'text-kitabi-stone' : 'text-kitabi-faded'}`}>
                    {earned ? m.message : `Reach ${m.chapters} chapter${m.chapters === 1 ? '' : 's'}.`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* QUIET FOOTER STATS */}
        <section className="px-6 sm:px-12 lg:px-24 pb-16">
          <div className="text-xs text-kitabi-faded max-w-3xl">
            {daysWritten.length > 0 && (
              <p>
                You've written on <span className="text-kitabi-ivory font-semibold">{daysWritten.length}</span>{' '}
                {daysWritten.length === 1 ? 'day' : 'days'}.
                {booksStarted > 0 && <> You've started <span className="text-kitabi-ivory font-semibold">{booksStarted}</span> {booksStarted === 1 ? 'book' : 'books'}.</>}
              </p>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

function Stat({ label, value, suffix, accent = false }) {
  return (
    <div className={`p-5 rounded-lg border ${accent ? 'border-gilt bg-[rgba(201,162,92,0.07)]' : 'border-seam bg-kitabi-night-soft'}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded mb-2">{label}</p>
      <p className={`font-display text-3xl sm:text-4xl font-medium leading-none ${accent ? 'text-kitabi-gold' : 'text-kitabi-ivory'}`}>
        {value}
      </p>
      {suffix && <p className="text-xs text-kitabi-faded mt-1.5">{suffix}</p>}
    </div>
  );
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
