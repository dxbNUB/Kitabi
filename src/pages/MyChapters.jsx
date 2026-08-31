import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSession } from '../store/session';
import { listChapters, loadChapter, softDeleteChapter } from '../lib/storage';
import { toast } from '../lib/toast';
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

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Move this chapter to Recently Deleted? You can restore it within 90 days.')) return;
    const ok = await softDeleteChapter(id);
    if (ok) {
      setChapters((prev) => (prev || []).filter((c) => c.id !== id));
      toast.success('Moved to Recently Deleted');
    } else {
      toast.error('Could not delete. Try again.');
    }
  };

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
      <div className="bg-kitabi-night">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-seam">
          <p className="eyebrow mb-3">My library</p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-kitabi-ivory leading-[1.05] mb-4">
            Your chapters.
          </h1>
          <p className="text-sm text-kitabi-stone max-w-xl">
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
              <div className="border border-gilt bg-kitabi-night-soft rounded-lg p-6 sm:p-8 shadow-raise">
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-gold font-semibold">In progress</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded">{genre || 'Fiction'} · Chapter One</span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-3">
                  {project?.title || 'Your Book — Chapter 1'}
                </h2>
                {project?.premise && (
                  <p className="text-sm text-kitabi-stone italic mb-5 line-clamp-2 max-w-2xl">
                    "{project.premise}"
                  </p>
                )}
                <p className="text-xs text-kitabi-faded mb-5">
                  {currentSessionWordCount.toLocaleString()} words ·{' '}
                  ~{Math.max(1, Math.ceil(currentSessionWordCount / 250))} min read
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/chapter')}
                    className="px-5 py-2.5 btn-gold font-semibold rounded-md text-sm transition-colors"
                  >
                    Open chapter →
                  </button>
                  <button
                    onClick={() => navigate('/editor')}
                    className="px-5 py-2.5 border border-seam hover:border-gilt text-kitabi-ivory font-medium rounded-md text-sm transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {chapters === null ? (
            <div className="text-sm text-kitabi-faded">Loading your chapters…</div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : chapters.length === 0 && !chapterGenerated ? (
            <div className="max-w-md py-10">
              <p className="font-display text-2xl text-kitabi-ivory mb-3">No chapters yet.</p>
              <p className="text-kitabi-stone mb-7 leading-relaxed">
                Your written chapters will appear here. Most people quit before Chapter 1 —
                don't be most people.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 btn-gold font-semibold rounded-md transition-colors"
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
                    className="relative group border border-seam rounded-lg bg-kitabi-night-soft hover:border-gilt transition-colors p-6 sm:p-8"
                  >
                    {/* Delete (trash) — fades in on hover. Acts on the LATEST version
                        (the visually-prominent one). Older versions remain in trash separately. */}
                    <button
                      onClick={(e) => handleDelete(latest.id, e)}
                      title="Move to Recently Deleted"
                      aria-label="Delete chapter"
                      className="absolute top-3 right-3 w-8 h-8 rounded-md flex items-center justify-center text-kitabi-faded hover:text-red-400 hover:bg-[rgba(176,92,66,0.1)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                    >
                      <span aria-hidden="true">🗑</span>
                    </button>

                    <div className="flex items-baseline gap-3 mb-3 flex-wrap pr-10">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-gold font-semibold">
                        {latest.genre || 'Fiction'}
                      </span>
                      {hasMultiple && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-kitabi-faded">
                          {versions.length} versions
                        </span>
                      )}
                      <span className="text-[10px] text-kitabi-faded ml-auto">
                        {new Date(latest.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl text-kitabi-ivory mb-2">
                      {latest.title || 'Untitled chapter'}
                    </h2>
                    <p className="text-xs text-kitabi-faded mb-5">
                      {(latest.word_count || 0).toLocaleString()} words ·{' '}
                      ~{Math.max(1, Math.ceil((latest.word_count || 0) / 250))} min read
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {versions.map((v, idx) => (
                        <button
                          key={v.id}
                          onClick={() => handleOpen(v.id)}
                          disabled={openingId === v.id}
                          className={`px-4 py-2 rounded-md text-xs font-medium transition-colors disabled:opacity-60 ${
                            idx === versions.length - 1
                              ? 'btn-gold'
                              : 'border border-seam hover:border-gilt text-kitabi-ivory'
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
