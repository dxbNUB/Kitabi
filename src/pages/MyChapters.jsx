import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSession } from '../store/session';
import { listChapters, loadChapter } from '../lib/storage';
import { useSEO } from '../lib/seo';

/**
 * My Chapters — every chapter the user has ever generated, including
 * every version of every rewrite. Loaded from Supabase, so closing
 * the tab no longer loses anything.
 *
 * The current in-session chapter (if any) is shown at the top with an
 * "In progress" badge so the user can jump straight back to the
 * editor without re-loading from the network.
 */
export default function MyChapters() {
  const navigate = useNavigate();
  const session  = useSession();
  const { chapterGenerated, project, genre } = session;

  const [chapters, setChapters] = useState(null);   // null = loading, [] = empty
  const [error,    setError]    = useState(null);
  const [openingId, setOpeningId] = useState(null);

  useSEO({
    title: 'My Chapters — Your Saved Chapters | Kitabi',
    description: 'Every chapter you have written with Kitabi, including every version of every rewrite. All saved automatically to your account.',
    canonical: 'https://kitabi.ink/my-chapters',
    noindex: true,
  });

  useEffect(() => {
    listChapters()
      .then(setChapters)
      .catch((e) => {
        setError(e.message || 'Could not load chapters.');
        setChapters([]);
      });
  }, []);

  const handleOpen = async (id) => {
    setOpeningId(id);
    const ch = await loadChapter(id);
    if (!ch) {
      setError('Could not open that chapter.');
      setOpeningId(null);
      return;
    }
    // Drop the chapter into the session's working slot so /chapter and
    // /editor render it. Keep messageHistory etc. as-is — the user is
    // opening a chapter, not resuming a chat.
    if (ch.genre)  session.setGenre(ch.genre);
    if (ch.title)  session.updateProject({ title: ch.title });
    session.setChapterGenerated(ch.content);
    if (ch.edited_html) session.setChapterEditedHtml(ch.edited_html);
    session.setCurrentChapterId(ch.id);
    setOpeningId(null);
    navigate('/chapter');
  };

  // Group chapters by parent_chapter_id so versions of the same chapter
  // sit together. Each group is sorted by version_number ascending so
  // v1, v2, v3… read in order.
  const groups = (chapters || []).reduce((acc, c) => {
    const root = c.parent_chapter_id || c.id;
    if (!acc[root]) acc[root] = [];
    acc[root].push(c);
    return acc;
  }, {});
  Object.values(groups).forEach((g) =>
    g.sort((a, b) => (a.version_number || 1) - (b.version_number || 1))
  );

  const currentSessionWordCount = chapterGenerated
    ? chapterGenerated.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <PageLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-gray-200">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3">My library</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1A1A1A] leading-[1.05] mb-4">
            Your chapters.
          </h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Every chapter — and every version of every rewrite — auto-saves to your account.
            Nothing is lost when you close the tab.
          </p>
        </section>

        {/* Body */}
        <section className="px-6 sm:px-12 lg:px-24 py-12">
          {chapterGenerated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-3xl mb-10"
            >
              <div className="border-2 border-[#C8964D]/40 bg-[#FFF7EB] rounded-2xl p-6 sm:p-8">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8964D] font-semibold">In progress</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">{genre || 'Fiction'} · Chapter One</span>
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
                  {currentSessionWordCount.toLocaleString()} words ·{' '}
                  ~{Math.max(1, Math.ceil(currentSessionWordCount / 250))} min read
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
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {chapters === null ? (
            <div className="text-sm text-gray-500">Loading your chapters…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : chapters.length === 0 && !chapterGenerated ? (
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
          ) : (
            <div className="space-y-6 max-w-4xl">
              {Object.entries(groups).map(([rootId, versions]) => {
                const latest = versions[versions.length - 1];
                const hasMultiple = versions.length > 1;
                return (
                  <motion.div
                    key={rootId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="border border-gray-200 rounded-2xl bg-white hover:border-[#C8964D]/40 hover:shadow-md transition-all p-6 sm:p-8"
                  >
                    <div className="flex items-baseline gap-3 mb-3 flex-wrap">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#C8964D] font-semibold">
                        {latest.genre || 'Fiction'}
                      </span>
                      {hasMultiple && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
                          {versions.length} versions
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 ml-auto">
                        {new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#1A1A1A] mb-2">
                      {latest.title || 'Untitled chapter'}
                    </h2>
                    <p className="text-xs text-gray-500 mb-5">
                      {(latest.word_count || 0).toLocaleString()} words ·{' '}
                      ~{Math.max(1, Math.ceil((latest.word_count || 0) / 250))} min read
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {versions.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => handleOpen(v.id)}
                          disabled={openingId === v.id}
                          className={`px-4 py-2 rounded-lg text-xs font-medium transition disabled:opacity-60 ${
                            idx === versions.length - 1
                              ? 'bg-[#C8964D] hover:bg-[#b88340] text-white'
                              : 'border border-gray-300 hover:border-[#C8964D] text-[#1A1A1A]'
                          }`}
                        >
                          {idx === versions.length - 1 ? 'Latest' : `v${v.version_number || idx + 1}`}
                          {openingId === v.id && ' · Loading…'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
