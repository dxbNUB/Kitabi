import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { useSEO } from '../lib/seo';
import {
  listDeletedItems,
  restoreChat,
  restoreChapter,
  permanentDeleteChat,
  permanentDeleteChapter,
  daysUntilPurge,
} from '../lib/storage';
import { toast } from '../lib/toast';

/**
 * Recently Deleted — soft-deleted chats and chapters within the 90-day
 * retention window. Users can restore (move back to active) or permanently
 * delete (bypass the trash, gone immediately). After 90 days, items
 * disappear from this view automatically.
 */
export default function RecentlyDeleted() {
  const navigate = useNavigate();
  const [data, setData]   = useState(null);   // null = loading
  const [busyId, setBusyId] = useState(null);

  useSEO({
    title: 'Recently Deleted — Restore Chats & Chapters | Kitabi',
    description: 'Chats and chapters you deleted in the last 90 days. Restore anything you removed by mistake, or delete it permanently.',
    canonical: 'https://kitabi.ink/recently-deleted',
    noindex: true,
  });

  const refresh = () => {
    setData(null);
    listDeletedItems().then(setData);
  };

  useEffect(() => { refresh(); }, []);

  const handleRestoreChat = async (id) => {
    setBusyId(id);
    const ok = await restoreChat(id);
    setBusyId(null);
    if (ok) {
      toast.success('Chat restored');
      refresh();
    } else {
      toast.error('Could not restore. Try again.');
    }
  };

  const handleRestoreChapter = async (id) => {
    setBusyId(id);
    const ok = await restoreChapter(id);
    setBusyId(null);
    if (ok) {
      toast.success('Chapter restored');
      refresh();
    } else {
      toast.error('Could not restore. Try again.');
    }
  };

  const handlePermanentChat = async (id) => {
    if (!window.confirm('Delete this chat permanently? This cannot be undone.')) return;
    setBusyId(id);
    const ok = await permanentDeleteChat(id);
    setBusyId(null);
    if (ok) {
      toast.success('Chat deleted permanently');
      refresh();
    } else {
      toast.error('Could not delete. Try again.');
    }
  };

  const handlePermanentChapter = async (id) => {
    if (!window.confirm('Delete this chapter permanently? This cannot be undone.')) return;
    setBusyId(id);
    const ok = await permanentDeleteChapter(id);
    setBusyId(null);
    if (ok) {
      toast.success('Chapter deleted permanently');
      refresh();
    } else {
      toast.error('Could not delete. Try again.');
    }
  };

  const isEmpty = data && data.chats.length === 0 && data.chapters.length === 0;

  return (
    <PageLayout>
      <div className="bg-kitabi-night">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-seam">
          <p className="eyebrow mb-3">My library</p>
          <h1 className="font-display text-4xl sm:text-5xl font-medium text-kitabi-ivory leading-[1.05] mb-4">
            Recently deleted.
          </h1>
          <p className="text-sm text-kitabi-stone max-w-2xl leading-relaxed">
            Items you delete are kept here for <strong className="text-kitabi-ivory">90 days</strong> in case you change your mind.
            After that, they're permanently removed. Restore anything you didn't mean to delete,
            or remove it permanently right now.
          </p>
        </section>

        {/* Body */}
        <section className="px-6 sm:px-12 lg:px-24 py-12 space-y-12">
          {data === null ? (
            <div className="text-sm text-kitabi-faded">Loading…</div>
          ) : isEmpty ? (
            <div className="max-w-md py-10">
              <p className="font-display text-2xl text-kitabi-ivory mb-3">Nothing in the trash.</p>
              <p className="text-kitabi-stone mb-7 leading-relaxed">
                When you delete a chat or chapter, it'll show up here for 90 days
                before being permanently removed.
              </p>
              <button
                onClick={() => navigate('/my-chapters')}
                className="px-6 py-3 btn-gold font-semibold rounded-md transition-colors"
              >
                Back to My Chapters →
              </button>
            </div>
          ) : (
            <>
              {/* CHATS */}
              {data.chats.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-kitabi-ivory mb-5">Deleted chats ({data.chats.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.chats.map((c) => {
                      const days = daysUntilPurge(c.deleted_at);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 bg-kitabi-night-soft border border-seam rounded-lg"
                        >
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-kitabi-gold font-semibold">
                              {c.genre || 'Conversation'}
                            </span>
                            <span className="text-[10px] text-kitabi-faded">
                              {days} {days === 1 ? 'day' : 'days'} left
                            </span>
                          </div>
                          <h3 className="font-serif text-base text-kitabi-ivory mb-3 line-clamp-2">
                            {c.title || 'Untitled chat'}
                          </h3>
                          <p className="text-[11px] text-kitabi-faded mb-4">
                            {(c.messages || []).length} messages · deleted{' '}
                            {new Date(c.deleted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRestoreChat(c.id)}
                              disabled={busyId === c.id}
                              className="flex-1 px-3 py-2 text-xs font-medium btn-gold rounded-md transition-colors disabled:opacity-60"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentChat(c.id)}
                              disabled={busyId === c.id}
                              className="flex-1 px-3 py-2 text-xs font-medium border border-[rgba(176,92,66,0.4)] hover:border-[#B05C42] hover:bg-[rgba(176,92,66,0.1)] text-[#D08A73] rounded-md transition-colors disabled:opacity-60"
                            >
                              Delete forever
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CHAPTERS */}
              {data.chapters.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl text-kitabi-ivory mb-5">Deleted chapters ({data.chapters.length})</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.chapters.map((c) => {
                      const days = daysUntilPurge(c.deleted_at);
                      return (
                        <motion.div
                          key={c.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-5 bg-kitabi-night-soft border border-seam rounded-lg"
                        >
                          <div className="flex items-baseline justify-between mb-2">
                            <span className="text-[10px] uppercase tracking-[0.18em] text-kitabi-gold font-semibold">
                              {c.genre || 'Chapter'}
                            </span>
                            <span className="text-[10px] text-kitabi-faded">
                              {days} {days === 1 ? 'day' : 'days'} left
                            </span>
                          </div>
                          <h3 className="font-serif text-base text-kitabi-ivory mb-3 line-clamp-2">
                            {c.title || 'Untitled chapter'}
                            {c.version_number > 1 && (
                              <span className="text-xs text-kitabi-faded ml-2">v{c.version_number}</span>
                            )}
                          </h3>
                          <p className="text-[11px] text-kitabi-faded mb-4">
                            {(c.word_count || 0).toLocaleString()} words · deleted{' '}
                            {new Date(c.deleted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRestoreChapter(c.id)}
                              disabled={busyId === c.id}
                              className="flex-1 px-3 py-2 text-xs font-medium btn-gold rounded-md transition-colors disabled:opacity-60"
                            >
                              Restore
                            </button>
                            <button
                              onClick={() => handlePermanentChapter(c.id)}
                              disabled={busyId === c.id}
                              className="flex-1 px-3 py-2 text-xs font-medium border border-[rgba(176,92,66,0.4)] hover:border-[#B05C42] hover:bg-[rgba(176,92,66,0.1)] text-[#D08A73] rounded-md transition-colors disabled:opacity-60"
                            >
                              Delete forever
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
