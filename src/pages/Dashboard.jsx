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
      <div className="bg-white">
        {/* HERO — streak + greeting */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-gray-200">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3">
            {wroteToday ? "Today's progress" : 'Welcome back'}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-[#1A1A1A] leading-[1.05] mb-5 text-balance">
            {chaptersWritten === 0
              ? <>Your book is <span className="italic text-[#C8964D]">waiting</span>.</>
              : currentStreak >= 2
                ? <><span className="italic text-[#C8964D]">{currentStreak}</span> days in a row.</>
                : <>Pick up where you <span className="italic text-[#C8964D]">left off</span>.</>}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-xl">
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
          <div className="max-w-4xl bg-gradient-to-br from-[#FFF7EB] via-white to-[#FFE4B8]/40 border-2 border-[#C8964D]/30 rounded-2xl p-8 sm:p-10">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#C8964D] mb-2">Next action</p>

            {hasActiveBook ? (
              <>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2 leading-tight">
                  {chapterGenerated
                    ? 'Continue where you left off.'
                    : project?.premise
                      ? 'You started a book. Finish Chapter 1.'
                      : 'Welcome back. Start your next chapter.'}
                </h2>
                {project?.premise && (
                  <p className="text-sm text-gray-600 italic mb-6 line-clamp-2 max-w-2xl">
                    "{project.premise}"
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(chapterGenerated ? '/chapter' : '/chat')}
                    className="px-7 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg shadow-sm transition"
                  >
                    {chapterGenerated ? 'Open chapter →' : 'Continue writing →'}
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="px-7 py-3 border border-gray-300 hover:border-[#C8964D] text-[#1A1A1A] font-semibold rounded-lg transition"
                  >
                    Start a new book
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2 leading-tight">
                  Start your book today.
                </h2>
                <p className="text-sm text-gray-600 mb-6 max-w-xl">
                  One chapter is all you need to begin. Most people never write theirs. Don't be most people.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="px-7 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Begin Writing →
                </button>
              </>
            )}
          </div>
        </section>

        {/* MILESTONE PROGRESS */}
        <section className="px-6 sm:px-12 lg:px-24 pb-10">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-2">Milestones</h2>
          <p className="text-gray-600 mb-7 max-w-xl">
            Most people quit before Chapter 5. The further you get, the rarer it becomes.
          </p>

          {nextMilestone && (
            <div className="mb-6 max-w-2xl">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-600">Next: {nextMilestone.title}</span>
                <span className="text-[#1A1A1A] font-semibold">
                  {chaptersWritten} / {nextMilestone.chapters}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full bg-[#C8964D] rounded-full"
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
                  className={`p-4 rounded-xl border transition
                    ${earned
                      ? 'bg-[#FFF7EB] border-[#C8964D]/40'
                      : 'bg-white border-gray-200 opacity-70'}`}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className={`font-serif text-base ${earned ? 'text-[#1A1A1A]' : 'text-gray-500'}`}>
                      {m.title}
                    </span>
                    {earned && (
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8964D] font-semibold">Earned</span>
                    )}
                  </div>
                  <p className={`text-xs leading-snug ${earned ? 'text-gray-700' : 'text-gray-400'}`}>
                    {earned ? m.message : `Reach ${m.chapters} chapter${m.chapters === 1 ? '' : 's'}.`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* QUIET FOOTER STATS */}
        <section className="px-6 sm:px-12 lg:px-24 pb-16">
          <div className="text-xs text-gray-500 max-w-3xl">
            {daysWritten.length > 0 && (
              <p>
                You've written on <span className="text-[#1A1A1A] font-semibold">{daysWritten.length}</span>{' '}
                {daysWritten.length === 1 ? 'day' : 'days'}.
                {booksStarted > 0 && <> You've started <span className="text-[#1A1A1A] font-semibold">{booksStarted}</span> {booksStarted === 1 ? 'book' : 'books'}.</>}
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
    <div className={`p-5 rounded-xl border ${accent ? 'border-[#C8964D]/40 bg-[#FFF7EB]' : 'border-gray-200 bg-white'}`}>
      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">{label}</p>
      <p className={`font-display text-3xl sm:text-4xl font-medium leading-none ${accent ? 'text-[#C8964D]' : 'text-[#1A1A1A]'}`}>
        {value}
      </p>
      {suffix && <p className="text-xs text-gray-500 mt-1.5">{suffix}</p>}
    </div>
  );
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
