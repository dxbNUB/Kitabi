import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSession } from '../store/session';
import { useProgress, MILESTONES } from '../store/progress';
import { useSettings, BOOK_TYPES } from '../store/settings';

/**
 * My Books — book-level view (a "book" = a project with one or more chapters).
 *
 * Today: shows the current in-session book if there is one, plus
 * estimated-completion math from the user's settings.
 * When auth lands, this becomes a real list of users/{uid}/books with
 * each book's chapter count, last-edited date, etc.
 */
export default function MyBooks() {
  const navigate = useNavigate();
  const { project, genre, chapterGenerated } = useSession();
  const { chaptersWritten, booksStarted } = useProgress();
  const bookType = useSettings((s) => s.bookType);

  const targetChapters = BOOK_TYPES[bookType]?.chapterTarget || 30;
  const targetLabel    = BOOK_TYPES[bookType]?.label || 'Novel';
  const percent        = Math.min(100, Math.round((chaptersWritten / targetChapters) * 100));

  const hasBook = !!project?.premise;
  const reachedFirst = chaptersWritten >= 1;

  return (
    <PageLayout>
      <div className="bg-kitabi-night">
        {/* Hero — header stats match the list below */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-seam">
          <p className="eyebrow mb-3">My library</p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-kitabi-ivory leading-[1.05] mb-4">
            Your books.
          </h1>
          {hasBook ? (
            <p className="text-sm text-kitabi-stone">
              <span className="font-semibold text-kitabi-ivory">1</span> book in this session ·{' '}
              <span className="font-semibold text-kitabi-ivory">{chaptersWritten}</span> {chaptersWritten === 1 ? 'chapter' : 'chapters'} written so far
            </p>
          ) : (
            <p className="text-sm text-kitabi-stone">
              No book in this session yet.
              {booksStarted > 0 && (
                <> All-time: <span className="font-semibold text-kitabi-ivory">{booksStarted}</span> {booksStarted === 1 ? 'book' : 'books'} started · <a href="/dashboard" className="text-kitabi-gold underline">See Dashboard</a></>
              )}
            </p>
          )}
        </section>

        {/* Body */}
        <section className="px-6 sm:px-12 lg:px-24 py-12">
          {hasBook ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl"
            >
              <div className="border border-seam rounded-lg bg-kitabi-night-soft p-6 sm:p-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-gold font-semibold">In progress</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded">{genre || 'Fiction'} · {targetLabel}</span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-3">
                  {project?.title || 'Untitled book'}
                </h2>
                <p className="text-sm text-kitabi-stone italic mb-6 line-clamp-3 max-w-2xl">
                  "{project.premise}"
                </p>

                {/* Progress to finished book */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-kitabi-stone">Progress to finished {targetLabel.toLowerCase()}</span>
                    <span className="font-semibold text-kitabi-ivory">{chaptersWritten} / {targetChapters} chapters</span>
                  </div>
                  <div className="w-full bg-[rgba(237,228,211,0.1)] rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-kitabi-gold rounded-full"
                    />
                  </div>
                  <p className="text-[11px] text-kitabi-faded mt-2">
                    {chaptersWritten === 0
                      ? "Write Chapter 1 to start tracking progress."
                      : chaptersWritten >= targetChapters
                        ? "You've written more chapters than this book type expects. Time to finish."
                        : `${targetChapters - chaptersWritten} more chapters to a finished ${targetLabel.toLowerCase()}.`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(chapterGenerated ? '/chapter' : '/chat')}
                    className="px-5 py-2.5 bg-kitabi-gold hover:bg-kitabi-gold-deep text-kitabi-night hover:text-kitabi-paper font-semibold rounded-md text-sm transition-colors"
                  >
                    {chapterGenerated ? 'Open Chapter 1 →' : 'Continue writing →'}
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="px-5 py-2.5 border border-seam hover:border-gilt text-kitabi-ivory font-medium rounded-md text-sm transition-colors"
                  >
                    See dashboard
                  </button>
                </div>
              </div>

              {/* Earned milestones for this book */}
              {reachedFirst && (
                <div className="mt-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded mb-3">Milestones earned</p>
                  <div className="flex flex-wrap gap-2">
                    {MILESTONES.filter((m) => chaptersWritten >= m.chapters).map((m) => (
                      <span
                        key={m.id}
                        className="px-3 py-1.5 rounded-full text-xs border border-gilt bg-[rgba(201,162,92,0.08)] text-kitabi-gold"
                      >
                        {m.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="max-w-md py-10">
              <p className="font-display text-2xl text-kitabi-ivory mb-3">No books yet.</p>
              <p className="text-kitabi-stone mb-7 leading-relaxed">
                A book starts with one chapter. Tell us your idea and we'll write the first one with you —
                then keep going until it's done.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-kitabi-gold hover:bg-kitabi-gold-deep text-kitabi-night hover:text-kitabi-paper font-semibold rounded-md transition-colors"
              >
                Start your book →
              </button>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
