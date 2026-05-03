import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { sendChatMessage, generateChapter } from '../lib/api';
import { markdownToHtml } from '../lib/markdown';
import { toast } from '../lib/toast';
import UsageStats from './UsageStats';
import { useSettings } from '../store/settings';
import { useProgress } from '../store/progress';
import { analytics } from '../lib/analytics';
import { ChatLoading, GenerationLoading } from './LoadingState';
import GenerationError from './GenerationError';
import UpgradeModal from './UpgradeModal';
import WaitlistPrompt from './WaitlistPrompt';

export default function Chat() {
  const navigate    = useNavigate();
  const session     = useSession();
  const {
    genre, mode, messageHistory, addMessage, setPhase,
    setChapterGenerated, incrementGenerations, canGenerate, phase,
    getContextSummary, reset,
  } = session;

  const [input, setInput]         = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [genWordCount, setGenWordCount] = useState(0);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showUpgrade, setShowUpgrade]   = useState(false);   // BUG-H2: monthly cap upsell
  const [usage, setUsage]               = useState(null);    // BUG-H2: server-side monthly count
  const [streamingMsg, setStreamingMsg] = useState('');
  const [sidebarOpen, setSidebarOpen]   = useState(false);   // mobile/tablet drawer
  const [generationError, setGenerationError] = useState(null);   // ApiError | null
  const lastGenerateArgs = useRef(null);   // remember args so retry can replay them

  // BUG-H2: server-side monthly chapter cap. Source of truth for "can the user
  // still generate this month" — replaces the session-local 1-chapter gate
  // (which lets a user refresh and bypass).
  const monthlyChapters = usage?.monthly?.chapters;
  const atMonthlyLimit  = !!monthlyChapters && monthlyChapters.used >= monthlyChapters.max;

  const bottomRef    = useRef(null);
  const inputRef     = useRef(null);
  const generatedRef = useRef('');
  const sentFirstRef = useRef(false);  // guards against StrictMode double-invocation
  const isMountedRef = useRef(true);   // BUG-H1: prevent setState after unmount
  const abortRef     = useRef(null);   // BUG-H1: cancel in-flight stream on nav-away

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // BUG-H1: do NOT abort in-flight requests on unmount. React 18 StrictMode
      // simulates an unmount-remount in dev — aborting here cancels the very
      // first /api/chat request, which api.js then swallows silently (regular
      // AbortError → no onDone, no onError). aiLoading stays stuck at true,
      // handleSend bails on every subsequent Send, and chat appears frozen.
      // The isMountedRef guard inside onDelta/onDone/onError already prevents
      // setState after a real unmount, so we don't need the abort here.
      // Explicit Cancel buttons (chapter generation) still call
      // abortRef.current.abort() directly — that path is unaffected.
    };
  }, []);

  // BUG-H2: fetch monthly usage on mount + expose a refetch we call after each
  // successful generate. Server is still authoritative — this just powers UI gating.
  const refreshUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (!res.ok) return;
      const data = await res.json();
      if (isMountedRef.current) setUsage(data);
    } catch { /* offline / api down — fail silent, server still enforces */ }
  }, []);

  useEffect(() => { refreshUsage(); }, [refreshUsage]);

  // Block accidental tab close while generating (browser-native confirm)
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (generating) {
        e.preventDefault();
        e.returnValue = 'Chapter is still generating. Leave anyway?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [generating]);

  // Helper: only set state if still mounted
  const safeSet = (fn) => { if (isMountedRef.current) fn(); };

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messageHistory, streamingMsg, aiLoading]);

  // Drop-off tracking
  useEffect(() => {
    const handler = () => analytics.dropOff(phase, genre);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase, genre]);

  // Send initial message if history is empty.
  // Guarded by a ref so React 18 StrictMode's double-invocation in dev
  // doesn't fire sendFirst twice (the closure would see length === 0 both times).
  useEffect(() => {
    if (sentFirstRef.current) return;
    if (messageHistory.length === 0 && !aiLoading) {
      sentFirstRef.current = true;
      sendFirst();
    } else if (messageHistory.length > 0) {
      // History already exists (page refresh / back-nav). Don't ever send the opener again.
      sentFirstRef.current = true;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendFirst = useCallback(async () => {
    const ideaMsg = session.project?.premise
      ? `My idea: ${session.project.premise}`
      : "I have an idea I'd like to develop.";

    const userMsg = { role: 'user', content: ideaMsg };
    addMessage(userMsg);
    await fetchAI([userMsg]);
  }, [session.project?.premise]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAI = useCallback(async (messages) => {
    setAiLoading(true);
    setStreamingMsg('');
    let accumulated = '';

    abortRef.current?.abort();   // cancel any prior chat call still in flight
    abortRef.current = new AbortController();

    await sendChatMessage({
      messages,
      genre,
      mode,
      sessionContext: getContextSummary(),
      signal: abortRef.current.signal,
      onDelta: (delta) => {
        accumulated += delta;
        safeSet(() => setStreamingMsg(accumulated));
      },
      onDone: () => safeSet(() => {
        if (accumulated) {
          addMessage({ role: 'assistant', content: accumulated });
          setStreamingMsg('');
        }
        setAiLoading(false);
      }),
      onError: (err) => {
        console.error('Chat error:', err);
        if (!isMountedRef.current) return;
        // err is an ApiError object (or legacy string for back-compat)
        const title = err?.title    || 'Something went wrong.';
        const msg   = err?.message  || (typeof err === 'string' ? err : 'Try again.');
        toast.error(title === 'Something went wrong.' ? msg : `${title} ${msg}`);
        addMessage({ role: 'assistant', content: `(${title} ${msg})` });
        setStreamingMsg('');
        setAiLoading(false);
      },
    });
  }, [genre, mode, getContextSummary, addMessage]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) {
      toast.error('Please write something before sending.');
      inputRef.current?.focus();
      return;
    }
    if (aiLoading) {
      toast.info('Hold on — Kitabi is still replying.');
      return;
    }
    setInput('');

    const userMsg = { role: 'user', content: text };
    addMessage(userMsg);
    await fetchAI([...messageHistory, userMsg]);
  }, [input, aiLoading, messageHistory, addMessage, fetchAI]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewStory = useCallback(() => {
    if (messageHistory.length > 0) {
      const ok = window.confirm('Start a new book? Your current conversation will be cleared.');
      if (!ok) return;
    }
    reset();
    navigate('/');
  }, [messageHistory.length, reset, navigate]);

  const handleGenerate = useCallback(async () => {
    // BUG-H2: hard gate on server-side monthly cap (e.g. 3/3 used) — checked
    // BEFORE the soft session gate so monthly-capped users see the upgrade
    // CTA instead of the per-session waitlist nag.
    if (atMonthlyLimit) {
      setShowUpgrade(true);
      return;
    }
    if (!canGenerate()) {
      toast.warn("You've used your free chapter for this session. Refresh to start fresh.");
      setShowWaitlist(true);
      return;
    }
    if (generating || aiLoading) {
      toast.info('Already working on it. Hold tight.');
      return;
    }

    analytics.chapterRequested(genre, mode);
    setGenerating(true);
    setGenerationError(null);
    setPhase('generating');
    incrementGenerations();
    generatedRef.current = '';
    setGenWordCount(0);

    const conversationSummary = messageHistory
      .slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const startTime = Date.now();
    lastGenerateArgs.current = { conversationSummary, startTime };   // for retry

    const { language, bookType } = useSettings.getState();

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    await generateChapter({
      genre,
      mode,
      sessionContext: getContextSummary(),
      conversationSummary,
      language,
      bookType,
      signal: abortRef.current.signal,
      onDelta: (delta) => {
        generatedRef.current += delta;
        const wc = generatedRef.current.trim().split(/\s+/).filter(Boolean).length;
        safeSet(() => setGenWordCount(wc));
      },
      onDone: () => {
        const wc   = generatedRef.current.trim().split(/\s+/).filter(Boolean).length;
        const secs = Math.round((Date.now() - startTime) / 1000);
        analytics.chapterGenerated(genre, wc, secs);

        // Persist + record progress regardless of mount state
        // (these write to Zustand stores, not React state — safe after unmount)
        setChapterGenerated(generatedRef.current);
        const milestone = useProgress.getState().recordChapter(wc);

        if (!isMountedRef.current) return;   // BUG-H1: don't navigate if unmounted

        refreshUsage();   // BUG-H2: pull updated monthly count for the button gate
        setGenerating(false);
        if (milestone) toast.success(`${milestone.title} reached. ${milestone.message}`, 6000);
        navigate('/chapter');
      },
      onError: (err) => {
        if (!isMountedRef.current) return;

        // Legacy string back-compat (any code still passing 'limit_reached')
        if (err === 'limit_reached') {
          err = { type: 'monthly_limit', title: "You've reached your monthly chapter limit.", message: 'Upgrade to Author for more.', retryable: false, upgradeUrl: '/pricing' };
        }

        // Structured ApiError flow — show full-screen error overlay with retry
        setGenerationError(err);
        setGenerating(false);
        setPhase('chat');

        // BUG-H2: monthly-cap rejections come back as 429 monthly_limit. Pull
        // fresh usage (the cap may have ticked over) and surface the upgrade modal.
        if (err?.type === 'monthly_limit') {
          refreshUsage();
          setShowUpgrade(true);
        }
      },
    });
  }, [atMonthlyLimit, refreshUsage, canGenerate, generating, aiLoading, genre, mode, messageHistory, getContextSummary, incrementGenerations, setChapterGenerated, setPhase, navigate, addMessage]);

  const allMessages = streamingMsg
    ? [...messageHistory, { role: 'assistant', content: streamingMsg }]
    : messageHistory;

  return (
    <>
      <div className="flex bg-white text-[#1A1A1A] h-[100dvh]">
        {/* Chat area */}
        <div className="flex flex-col flex-1 min-w-0 h-full">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 bg-white overflow-visible">
            <button
              onClick={() => navigate('/')}
              className="font-display text-[#C8964D] text-xl tracking-[0.09em] font-medium flex-shrink-0 whitespace-nowrap"
              aria-label="Kitabi — go to home"
            >
              kitabi
            </button>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {genre && (
                <span className="hidden sm:inline-block whitespace-nowrap text-[11px] text-gray-600 uppercase tracking-wider px-2.5 py-1 border border-gray-200 rounded-full bg-gray-50">
                  {genre}
                </span>
              )}
              <button
                onClick={handleNewStory}
                className="flex-shrink-0 whitespace-nowrap text-xs text-gray-700 hover:text-[#C8964D] transition
                           flex items-center gap-1.5 px-3 py-1.5 border border-gray-300
                           hover:border-[#C8964D] rounded-full bg-white"
                title="Start a fresh book"
                aria-label="Start a new book (clears current conversation)"
              >
                <span aria-hidden="true">＋</span>
                <span className="hidden sm:inline">New Book</span>
                <span className="sm:hidden">New</span>
              </button>
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden flex-shrink-0 text-xs text-gray-700 hover:text-[#C8964D] transition
                           flex items-center px-3 py-1.5 border border-gray-300 hover:border-[#C8964D]
                           rounded-full bg-white"
                aria-label="Open progress sidebar"
              >
                <span aria-hidden="true">☰</span>
              </button>
            </div>
          </div>

          {generationError ? (
            <div className="flex-1 min-h-0">
              <GenerationError
                error={generationError}
                onRetry={() => {
                  setGenerationError(null);
                  // Replay the generation with the same args
                  handleGenerate();
                }}
                onCancel={() => setGenerationError(null)}
              />
            </div>
          ) : generating ? (
            <div className="flex-1 min-h-0">
              <GenerationLoading
                wordCount={genWordCount}
                onCancel={() => {
                  abortRef.current?.abort();
                  setGenerating(false);
                  setPhase('chat');
                }}
              />
            </div>
          ) : (
          <>
          {/* Messages — large pb keeps last msg comfortably above the Generate CTA / input */}
          <div
            className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 pt-6 pb-20 space-y-4 bg-[#FAFAF7]"
            role="log"
            aria-live="polite"
            aria-label="Conversation with Kitabi"
            aria-relevant="additions text"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <AnimatePresence initial={false}>
                {allMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    aria-label={msg.role === 'user' ? 'You said' : 'Kitabi said'}
                  >
                    {msg.role === 'assistant' ? (
                      <div
                        className="max-w-[85%] rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-gray-200
                                   text-[#1A1A1A] font-serif leading-[1.7] chat-prose shadow-sm"
                        style={{ fontSize: '1rem' }}
                        dangerouslySetInnerHTML={{ __html: markdownToHtml(msg.content) }}
                      />
                    ) : (
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-5 py-3 bg-[#C8964D] text-white
                                      whitespace-pre-wrap shadow-sm">
                        {msg.content}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {aiLoading && !streamingMsg && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-gray-200 shadow-sm">
                    <ChatLoading />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Generate CTA — gated until the conversation has enough material.
              BUG-H2: when the server-side monthly cap is exhausted the button
              becomes an upgrade CTA that opens UpgradeModal, instead of trying
              to call /api/generate and getting a 429 back. */}
          {(() => {
            const userAnswers = messageHistory.filter((m) => m.role === 'user').length;
            const REQUIRED_ANSWERS = 3;             // initial idea + 2 follow-up answers
            const ready = userAnswers >= REQUIRED_ANSWERS;
            const remaining = REQUIRED_ANSWERS - userAnswers;
            // Hide entirely until we have at least the initial idea + 1 turn back
            if (userAnswers < 1 || messageHistory.length < 2) return null;

            const sideText = monthlyChapters
              ? `${monthlyChapters.used}/${monthlyChapters.max} chapters this month`
              : (canGenerate() ? '1 free per session' : 'Free chapter used');

            return (
              <div className="flex-shrink-0 px-4 sm:px-6 pt-2 pb-1 bg-white border-t border-gray-200">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                  {atMonthlyLimit ? (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      title="Monthly chapter limit reached — upgrade to continue"
                      className="flex-1 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition
                                 flex items-center justify-center gap-2
                                 bg-[#C8964D] hover:bg-[#b88340] text-white"
                    >
                      <span aria-hidden="true">✦</span>
                      Upgrade to keep writing →
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerate}
                      disabled={!ready || generating || aiLoading}
                      aria-disabled={!ready}
                      title={ready ? 'Generate Chapter 1' : `Answer ${remaining} more question${remaining === 1 ? '' : 's'} first`}
                      className={`flex-1 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition
                                  flex items-center justify-center gap-2
                        ${ready
                          ? 'bg-[#C8964D] hover:bg-[#b88340] text-white'
                          : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                    >
                      <span aria-hidden="true">✦</span>
                      {ready
                        ? 'Write Chapter 1 →'
                        : `Answer ${remaining} more question${remaining === 1 ? '' : 's'}`}
                    </button>
                  )}
                  <p className={`hidden sm:block text-[11px] whitespace-nowrap ${atMonthlyLimit ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {sideText}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Input bar */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex-shrink-0 bg-white px-4 sm:px-6 py-3 border-t border-gray-200
                       pb-[max(env(safe-area-inset-bottom),0.75rem)]"
            aria-label="Reply to Kitabi"
          >
            <div className="max-w-2xl mx-auto flex gap-3 items-end">
              <label htmlFor="chat-input" className="sr-only">Type your reply</label>
              <div className="flex-1 relative">
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={e => {
                    if (e.target.value.length <= 1000) setInput(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  maxLength={1000}
                  placeholder="Your answer..."
                  aria-label="Type your reply (up to 1000 characters), then press Enter or click send"
                  rows={1}
                  className="w-full resize-none bg-white border border-gray-300 rounded-xl px-4 py-3 pr-14
                             text-[#1A1A1A] placeholder:text-gray-400 focus:border-[#C8964D]
                             transition scrollbar-hide shadow-sm"
                  style={{ maxHeight: '140px', overflowY: 'auto' }}
                  onInput={e => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
                  }}
                />
                {input.length > 700 && (
                  <span
                    className={`absolute bottom-2 right-3 text-[10px] font-medium pointer-events-none
                      ${input.length > 900 ? 'text-red-600' : 'text-amber-600'}`}
                    aria-live="polite"
                  >
                    {input.length} / 1000
                  </span>
                )}
              </div>
              <button
                type="submit"
                onClick={handleSend}
                disabled={aiLoading || !input.trim()}
                aria-label="Send message"
                className="px-5 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-medium rounded-xl
                           transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
          </>
          )}
        </div>

        {/* Sidebar — progress overview + expandable premise.
            Always visible on lg+, slides in from the right on smaller viewports. */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside
          className={`flex flex-col w-72 h-full border-l border-gray-200 bg-[#FBF7EE] p-6 gap-5 overflow-y-auto
            transition-transform duration-300
            lg:relative lg:translate-x-0
            fixed top-0 right-0 z-40
            ${sidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full lg:translate-x-0'}`}
          aria-label="Story progress"
        >
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden self-end text-gray-500 hover:text-[#1A1A1A] -mt-2 -mr-2 px-2 py-1 text-lg"
            aria-label="Close sidebar"
          >
            <span aria-hidden="true">✕</span>
          </button>

          {/* Progress block */}
          <div>
            <h3 className="text-[11px] text-gray-500 uppercase tracking-[0.18em] mb-4">Progress</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-[11px] text-gray-500 mb-0.5">Genre</dt>
                <dd className="text-sm text-[#1A1A1A] font-medium capitalize">
                  {genre || <span className="text-gray-400 italic font-normal">Not yet selected</span>}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-500 mb-0.5">Writer Mode</dt>
                <dd className="text-sm text-[#1A1A1A] font-medium">
                  {mode === 'writer' ? 'Experienced' : 'New Writer'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] text-gray-500 mb-0.5">Messages</dt>
                <dd className="text-sm text-[#1A1A1A] font-medium">
                  {messageHistory.length}
                </dd>
              </div>
            </dl>
          </div>

          {/* Live monthly usage from /api/usage */}
          <UsageStats refreshKey={session.generationsUsed} />

          {/* Premise — collapsed by default, click to expand */}
          {session.project?.premise && (
            <details className="group border-t border-gray-200 pt-5">
              <summary className="list-none cursor-pointer">
                <h3 className="text-[11px] text-gray-500 uppercase tracking-[0.18em] mb-2 flex items-center justify-between">
                  Your Idea
                  <span className="text-gray-400 group-open:rotate-180 transition-transform text-base" aria-hidden="true">▾</span>
                </h3>
                <p
                  className="text-sm text-[#1A1A1A] leading-relaxed font-serif group-open:hidden
                             [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden"
                  title={session.project.premise}
                >
                  {session.project.premise}
                </p>
              </summary>
              <p className="text-sm text-[#1A1A1A] leading-relaxed font-serif">
                {session.project.premise}
              </p>
            </details>
          )}

          {/* Characters (if extracted from conversation) */}
          {session.characters?.length > 0 && (
            <div className="border-t border-gray-200 pt-5">
              <h3 className="text-[11px] text-gray-500 uppercase tracking-[0.18em] mb-3">Characters</h3>
              {session.characters.map((c, i) => (
                <p key={i} className="text-sm text-[#1A1A1A] mb-1">
                  <span className="font-medium">{c.name}</span> <span className="text-gray-500">— {c.role}</span>
                </p>
              ))}
            </div>
          )}

          {showWaitlist && <div className="mt-auto"><WaitlistPrompt variant={0} /></div>}
        </aside>
      </div>

      {/* BUG-H2: upsell when the user hits the monthly chapter cap. */}
      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature={monthlyChapters
          ? `You've used ${monthlyChapters.used}/${monthlyChapters.max} free chapters this month`
          : "You've hit your monthly chapter limit"}
        description="Upgrade to Author for 25 chapters per month, AI rewrite tools, and full document export."
        benefits={[
          '25 chapters / 62,500 words per month',
          '.docx, .pdf, and .txt downloads',
          'Literary AI analysis (genre fit, pacing, prose)',
          'AI rewrite, expand, and improve tools',
        ]}
        cta="Upgrade to Author — $25/mo"
      />
    </>
  );
}
