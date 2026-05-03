import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSession } from '../store/session';
import { useProgress } from '../store/progress';
import { cleanMarkdownToPlainText } from '../lib/markdown';

/**
 * My Chapters — list of chapters the user has written.
 *
 * Today: shows the current in-session chapter (if any) plus running stats.
 * When auth lands, replace with a Firestore query of users/{uid}/chapters.
 */
export default function MyChapters() {
  const navigate = useNavigate();
  const { chapterGenerated, project, genre } = useSession();
  const { chaptersWritten, totalWords } = useProgress();

  const hasChapter = !!chapterGenerated;
  const cleanText  = hasChapter ? cleanMarkdownToPlainText(chapterGenerated) : '';
  const wordCount  = cleanText ? cleanText.trim().split(/\s+/).filter(Boolean).length : 0;

  // Header stats reflect WHAT'S DISPLAYED IN THE LIST below — not all-time totals.
  // All-time totals live on the Dashboard (different scope).
  const displayedCount = hasChapter ? 1 : 0;
  const displayedWords = hasChapter ? wordCount : 0;

  return (
    <PageLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-gray-200">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3">My library</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1A1A1A] leading-[1.05] mb-4">
            Your chapters.
          </h1>
          {displayedCount > 0 ? (
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
              <span><span className="font-semibold text-[#1A1A1A]">{displayedCount}</span> {displayedCount === 1 ? 'chapter' : 'chapters'} in this session</span>
              <span><span className="font-semibold text-[#1A1A1A]">{displayedWords.toLocaleString()}</span> words</span>
              {chaptersWritten > displayedCount && (
                <span className="text-gray-500">
                  ({chaptersWritten} written all-time — see <a href="/dashboard" className="text-[#C8964D] underline">Dashboard</a>)
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              No chapters in this session yet.
              {chaptersWritten > 0 && (
                <> All-time: <span className="font-semibold text-[#1A1A1A]">{chaptersWritten}</span> chapters · <span className="font-semibold text-[#1A1A1A]">{totalWords.toLocaleString()}</span> words. <a href="/dashboard" className="text-[#C8964D] underline">See Dashboard</a></>
              )}
            </p>
          )}
        </section>

        {/* Body */}
        <section className="px-6 sm:px-12 lg:px-24 py-12">
          {hasChapter ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl"
            >
              <div className="border border-gray-200 rounded-2xl bg-white hover:border-[#C8964D]/40 hover:shadow-md transition-all p-6 sm:p-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8964D] font-semibold">In progress</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{genre || 'Fiction'} · Chapter One</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-3">
                  {project?.title || 'Your Book — Chapter 1'}
                </h2>
                {project?.premise && (
                  <p className="text-sm text-gray-600 italic mb-5 line-clamp-2 max-w-2xl">
                    "{project.premise}"
                  </p>
                )}
                <p className="text-xs text-gray-500 mb-5">
                  {wordCount.toLocaleString()} words · ~{Math.max(1, Math.ceil(wordCount / 250))} min read
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/chapter')}
                    className="px-5 py-2.5 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg text-sm transition shadow-sm"
                  >
                    Open chapter →
                  </button>
                  <button
                    onClick={() => navigate('/editor')}
                    className="px-5 py-2.5 border border-gray-300 hover:border-[#C8964D] text-[#1A1A1A] font-medium rounded-lg text-sm transition"
                  >
                    Edit chapter
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-md py-10">
              <p className="font-serif text-xl text-[#1A1A1A] mb-3">No chapters yet.</p>
              <p className="text-gray-600 mb-7 leading-relaxed">
                Your written chapters will appear here. Most people quit before Chapter 1 —
                don't be most people.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg transition shadow-sm"
              >
                Write Chapter 1 →
              </button>
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
