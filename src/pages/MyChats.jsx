import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PageLayout from '../components/PageLayout';
import { listChats, loadChat, softDeleteChat } from '../lib/storage';
import { toast } from '../lib/toast';
import { useSession } from '../store/session';
import { useSEO } from '../lib/seo';

/**
 * My Chats — every chat the signed-in user has ever had with Kitabi.
 * Click one to resume: loads the messages + context back into the
 * session store and navigates to /chat where it picks up exactly
 * where you left off.
 */
export default function MyChats() {
  const navigate = useNavigate();
  const [chats, setChats]     = useState(null);   // null = loading, [] = empty
  const [error, setError]     = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const session = useSession();

  useSEO({
    title: 'My Chats — Your Saved Conversations | Kitabi',
    description: 'Every chat you have ever started in Kitabi. Pick up where you left off — your conversations and chapters are saved automatically.',
    canonical: 'https://kitabi.ink/my-chats',
    noindex: true,  // user-private content; don't index
  });

  useEffect(() => {
    listChats()
      .then(setChats)
      .catch((e) => {
        setError(e.message || 'Could not load chats.');
        setChats([]);
      });
  }, []);

  const handleDelete = async (chatId, e) => {
    e.stopPropagation();   // don't trigger handleResume on the parent button
    if (!window.confirm('Move this chat to Recently Deleted? You can restore it within 90 days.')) return;
    const ok = await softDeleteChat(chatId);
    if (ok) {
      setChats((prev) => (prev || []).filter((c) => c.id !== chatId));
      toast.success('Moved to Recently Deleted');
    } else {
      toast.error('Could not delete. Try again.');
    }
  };

  const handleResume = async (chatId) => {
    setLoadingId(chatId);
    const chat = await loadChat(chatId);
    if (!chat) {
      setError('Could not open that chat.');
      setLoadingId(null);
      return;
    }
    // Hydrate the session from the saved chat. Keep generationsUsed/etc.
    // intact — we're loading conversation, not resetting progress.
    session.reset();
    if (chat.genre) session.setGenre(chat.genre);
    if (chat.mode)  session.setMode(chat.mode);
    (chat.messages || []).forEach((m) => session.addMessage(m));
    if (chat.context?.project)    session.updateProject(chat.context.project);
    if (Array.isArray(chat.context?.characters)) {
      chat.context.characters.forEach((c) => session.addCharacter(c));
    }
    if (Array.isArray(chat.context?.plotPoints)) {
      chat.context.plotPoints.forEach((p) => session.addPlotPoint(p));
    }
    session.setCurrentChatId(chat.id);
    setLoadingId(null);
    navigate('/chat');
  };

  return (
    <PageLayout>
      <div className="bg-white">
        {/* Hero */}
        <section className="px-6 sm:px-12 lg:px-24 pt-14 lg:pt-20 pb-10 border-b border-gray-200">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500 mb-3">My library</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-medium text-[#1A1A1A] leading-[1.05] mb-4">
            Your chats.
          </h1>
          <p className="text-sm text-gray-600 max-w-xl">
            Every conversation auto-saves to your account. Pick any chat to resume — your messages,
            context, and the chapter you generated come back exactly as you left them.
          </p>
        </section>

        {/* Body */}
        <section className="px-6 sm:px-12 lg:px-24 py-12">
          {chats === null ? (
            <div className="text-sm text-gray-500">Loading your chats…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : chats.length === 0 ? (
            <div className="max-w-md py-10">
              <p className="font-serif text-xl text-[#1A1A1A] mb-3">No chats yet.</p>
              <p className="text-gray-600 mb-7 leading-relaxed">
                Once you start a conversation with Kitabi, it'll show up here automatically.
              </p>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg transition shadow-sm"
              >
                Start your first chat →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl">
              {chats.map((chat, idx) => {
                const lastUser = (chat.messages || []).filter((m) => m.role === 'user').slice(-1)[0];
                const messageCount = (chat.messages || []).length;
                return (
                  <motion.div
                    key={chat.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.04 }}
                    whileHover={{ y: -2 }}
                    className="relative group p-5 bg-white border border-gray-200 hover:border-[#C8964D] hover:shadow-md rounded-xl transition-all"
                  >
                    {/* Delete (trash) button — fades in on hover so it doesn't compete with the card click target */}
                    <button
                      onClick={(e) => handleDelete(chat.id, e)}
                      title="Move to Recently Deleted"
                      aria-label="Delete chat"
                      className="absolute top-3 right-3 w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 focus:opacity-100 transition"
                    >
                      <span aria-hidden="true">🗑</span>
                    </button>

                    <button
                      onClick={() => handleResume(chat.id)}
                      disabled={loadingId === chat.id}
                      className="text-left w-full disabled:opacity-60"
                    >
                      <div className="flex items-baseline justify-between gap-2 mb-2 pr-8">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-[#C8964D] font-semibold truncate">
                          {chat.genre || 'Conversation'}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                          {new Date(chat.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg text-[#1A1A1A] mb-2 line-clamp-2">
                        {chat.title || 'Untitled chat'}
                      </h3>
                      {lastUser?.content && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 italic">
                          "{lastUser.content.slice(0, 140)}{lastUser.content.length > 140 ? '…' : ''}"
                        </p>
                      )}
                      <p className="text-[11px] text-gray-500">
                        {messageCount} {messageCount === 1 ? 'message' : 'messages'}
                        {loadingId === chat.id && ' · Loading…'}
                      </p>
                    </button>
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
