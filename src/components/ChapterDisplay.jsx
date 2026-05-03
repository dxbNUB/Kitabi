import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../store/session';
import { analytics, funnelTimer } from '../lib/analytics';
import { analyzeChapter } from '../lib/api';
import { markdownToHtml, cleanMarkdownToPlainText } from '../lib/markdown';
import { toast } from '../lib/toast';
import { useTier } from '../store/account';
import PDFDocument from './PDFDocument';
import WaitlistPrompt from './WaitlistPrompt';
import AnalysisReport from './AnalysisReport';
import UpgradeModal from './UpgradeModal';

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function ChapterDisplay({ onRegenerate, onContinue, onNewStory }) {
  const navigate = useNavigate();
  const { chapterGenerated, genre, project, updateProject } = useSession();
  const { isStarter, canUseAuthorFeats } = useTier();

  const [downloading, setDownloading]   = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [analyzing, setAnalyzing]       = useState(false);
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [upgradeModal, setUpgradeModal] = useState(null);   // null | { feature, description, benefits }
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft]     = useState('');
  const analysisRef = useRef(null);
  const downloadMenuRef = useRef(null);

  // ─── Parse the AI output into structured pieces ──────────────────────
  // The model's chapter output looks like:
  //   THE FIFTH GOSPEL                  ← optional **bold** or # heading
  //   ---                                ← optional separator
  //   <chapter prose, paragraphs>
  //   AUTHOR'S NOTE                      ← optional, may appear with/without brackets
  //   <author note prose>
  //
  // We split it into { title, body, notes } so each renders as its own block,
  // with no duplicated title and no giant whitespace gap before the notes.
  const parsed = useMemo(() => {
    if (!chapterGenerated) return { title: null, body: '', notes: '' };
    const stripped = cleanMarkdownToPlainText(chapterGenerated);

    // Extract title from first non-empty line (heuristic: short, no terminal punct)
    const lines     = stripped.split('\n').map(s => s.trim());
    const firstLine = lines.find(Boolean) || '';
    const titleOk   = firstLine && firstLine.length <= 80 && !/[.?!"]\s*$/.test(firstLine);
    const title     = titleOk ? firstLine : null;

    // Strip the title block (title + optional --- separator + blank line) from raw text
    let body = chapterGenerated;
    if (title) {
      const esc = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const titleRe = new RegExp(
        // optional markdown markers (**, #), title text, optional markers, optional separator line
        `^\\s*(?:#{1,6}\\s+|\\*{1,2})?${esc}(?:\\*{1,2})?\\s*\\n+(?:[-=_*]{3,}\\s*\\n+)?`,
        'i'
      );
      body = body.replace(titleRe, '');
    }

    // Split off the author's note section if present
    let notes = '';
    const noteRe = /\n+(?:\[?\s*)?(?:AUTHOR(?:'S)?\s+NOTE|Author(?:'s)?\s+Note|Writer(?:'s)?\s+Note)s?(?:\s*\]?)\s*[:\-]?\s*\n+/i;
    const noteMatch = body.match(noteRe);
    if (noteMatch) {
      notes = body.slice(noteMatch.index + noteMatch[0].length).trim();
      body  = body.slice(0, noteMatch.index).trim();
    }

    return { title, body: body.trim(), notes };
  }, [chapterGenerated]);

  const title       = project?.title || parsed.title || 'Your Book — Chapter 1';
  const bodyHtml    = useMemo(() => markdownToHtml(parsed.body), [parsed.body]);
  const notesHtml   = useMemo(() => parsed.notes ? markdownToHtml(parsed.notes) : '', [parsed.notes]);
  const cleanText   = useMemo(() => cleanMarkdownToPlainText(parsed.body), [parsed.body]);
  const wc          = cleanText ? wordCount(cleanText) : 0;
  const readMinutes = Math.ceil(wc / 250);

  const fileSlug = (title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase()) || 'chapter';

  // Close the download menu on outside click
  useEffect(() => {
    if (!downloadOpen) return;
    const onClick = (e) => {
      if (!downloadMenuRef.current?.contains(e.target)) setDownloadOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [downloadOpen]);

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href    = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTxt = useCallback(() => {
    if (!cleanText) return;
    const header = `${title}\n${(genre || 'Fiction').toUpperCase()} — Chapter One\n\n`;
    triggerDownload(
      new Blob([header + cleanText], { type: 'text/plain;charset=utf-8' }),
      `${fileSlug}-chapter-1.txt`
    );
    toast.success('Chapter saved as .txt');
  }, [cleanText, title, genre, fileSlug]);

  const downloadDocx = useCallback(() => {
    if (!cleanText) return;
    if (!canUseAuthorFeats) {
      setUpgradeModal({
        feature: '.docx download',
        description: 'Word documents preserve formatting for editing in Word, Google Docs, or Pages.',
        benefits: ['.docx, .pdf, and .txt downloads', 'Literary AI analysis', 'AI rewrite & expand tools', '25 chapters / month'],
      });
      return;
    }
    const paragraphs = cleanText.split(/\n\n+/).filter(Boolean);
    const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${escape(title)}</title>
  <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
  <style>
    @page { margin: 1in; }
    body { font-family: 'Georgia', serif; font-size: 12pt; line-height: 1.8; color: #2C2416; }
    h1   { font-family: 'Georgia', serif; font-size: 22pt; text-align: center; margin: 0 0 6pt 0; }
    .meta { text-align: center; font-style: italic; font-size: 10pt; color: #888; margin-bottom: 36pt; letter-spacing: 2pt; }
    p    { text-indent: 2em; margin: 0 0 8pt 0; text-align: justify; }
    p:first-of-type { text-indent: 0; }
  </style>
</head>
<body>
  <h1>${escape(title)}</h1>
  <p class="meta">${escape((genre || 'Fiction').toUpperCase())} — CHAPTER ONE</p>
  ${paragraphs.map(p => `<p>${escape(p).replace(/\n/g, '<br/>')}</p>`).join('\n')}
</body>
</html>`;
    triggerDownload(
      new Blob(['﻿', html], { type: 'application/msword' }),
      `${fileSlug}-chapter-1.doc`
    );
    toast.success('Chapter saved as .docx');
  }, [cleanText, title, genre, fileSlug]);

  const downloadPDF = useCallback(async () => {
    if (!chapterGenerated) return;
    if (!canUseAuthorFeats) {
      setUpgradeModal({
        feature: '.pdf download',
        description: 'Print-ready PDF with title page, formatted prose, and cover styling.',
        benefits: ['.docx, .pdf, and .txt downloads', 'Literary AI analysis', 'AI rewrite & expand tools', '25 chapters / month'],
      });
      return;
    }
    setDownloading(true);
    try {
      // Race against 20s so a stuck font fetch can't freeze the UI
      const pdfPromise = pdf(
        <PDFDocument title={title} genre={genre} chapterText={cleanText} />
      ).toBlob();
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 20_000)
      );
      const blob = await Promise.race([pdfPromise, timeout]);
      if (!(blob instanceof Blob) || blob.size < 100) throw new Error('empty');
      triggerDownload(blob, `${fileSlug}-chapter-1.pdf`);
      analytics.pdfDownloaded(genre);
      toast.success('Chapter saved as .pdf');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('PDF export failed. Try .docx — it works offline and opens in Word.');
    } finally {
      setDownloading(false);
    }
  }, [chapterGenerated, genre, title, cleanText, fileSlug, canUseAuthorFeats]);

  const runAnalysis = useCallback(async () => {
    if (!chapterGenerated || analyzing) return;
    if (!canUseAuthorFeats) {
      setUpgradeModal({
        feature: 'Literary AI Analysis',
        description: 'Expert-level craft feedback on pacing, dialogue, sensory specificity, theme, and prose quality.',
        benefits: [
          'Genre-fit scoring (vs. bestseller patterns)',
          'Pacing & dialogue assessment',
          'Specific rewrites with line references',
          'Comparison to comparable bestsellers',
          'Priority actions ranked by impact',
        ],
      });
      return;
    }
    setAnalysisText('');
    setAnalyzing(true);
    setAnalysisOpen(true);
    setTimeout(() => analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    await analyzeChapter({
      chapterText: cleanText,
      genre,
      onDelta: (delta) => setAnalysisText(prev => prev + delta),
      onDone:  () => setAnalyzing(false),
      onError: () => {
        toast.error('Analysis failed. Try again.');
        setAnalysisText('Analysis failed. Please try again.');
        setAnalyzing(false);
      },
    });
  }, [chapterGenerated, genre, analyzing, cleanText]);

  const handleRegenerate = () => {
    analytics.chapterRegenerated(genre);
    onRegenerate?.();
  };

  if (!chapterGenerated) return null;

  return (
    <>
      {/* Scrollable chapter content. Bottom padding leaves room for the sticky action bar (~80px). */}
      <motion.div
        className="max-w-2xl mx-auto px-4 pt-6 sm:pt-8 pb-24"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Title above the paper — click to edit */}
        <div className="text-center mb-5">
          <p className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mb-1.5">{genre || 'Fiction'} · Chapter One</p>
          {editingTitle ? (
            <input
              type="text"
              value={titleDraft}
              maxLength={120}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={() => {
                const v = titleDraft.trim();
                if (v && v !== title) updateProject({ title: v });
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') { setTitleDraft(''); setEditingTitle(false); }
              }}
              autoFocus
              aria-label="Edit chapter title"
              className="font-serif text-3xl sm:text-4xl text-[#1A1A1A] leading-tight bg-transparent
                         text-center w-full max-w-2xl mx-auto border-b-2 border-[#C8964D]
                         focus:outline-none px-2"
            />
          ) : (
            <button
              onClick={() => { setTitleDraft(title); setEditingTitle(true); }}
              title="Click to rename"
              className="group inline-flex items-baseline gap-2 font-serif text-3xl sm:text-4xl text-[#1A1A1A] leading-tight
                         hover:text-[#C8964D] transition rounded px-2 hover:bg-[#FFF7EB]/60"
            >
              <span>{title}</span>
              <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition" aria-hidden="true">
                ✎
              </span>
            </button>
          )}
        </div>

        {/* Paper-like chapter display */}
        <div className="paper rounded-xl shadow-md border border-gray-200 p-8 sm:p-12">
          <div
            className="chapter-prose font-serif text-lg leading-[1.85] text-[#2C2416] drop-cap whitespace-pre-wrap"
            style={{ textAlign: 'justify' }}
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </div>

        {/* Word count */}
        <p className="text-center text-sm text-gray-500 mt-4">
          {wc.toLocaleString()} words · ~{readMinutes} min read
        </p>

        {/* Pre-publish disclaimer */}
        <div
          role="note"
          aria-label="Pre-publish disclaimer"
          className="mt-6 px-4 py-3 rounded-lg bg-[#FFF7EB] border border-[#C8964D]/30 flex items-start gap-3 text-[13px] text-[#5C4A2A]"
        >
          <span aria-hidden="true" className="text-[#C8964D] font-semibold mt-0.5">⚠</span>
          <p className="leading-snug">
            <strong className="text-[#1A1A1A]">Before publishing:</strong>{' '}
            verify all facts, obtain permissions, and ensure legal compliance in your jurisdiction.
            Kitabi is not responsible for the accuracy or legality of your content.
          </p>
        </div>

        {/* Writer's Notes — sits directly under the chapter, no big gap */}
        {notesHtml && (
          <section
            aria-labelledby="writers-notes-title"
            className="mt-8 pt-6 border-t border-gray-200"
          >
            <h2
              id="writers-notes-title"
              className="text-[11px] text-gray-500 uppercase tracking-[0.2em] mb-3"
            >
              Writer's Notes
            </h2>
            <div
              className="chat-prose font-serif text-[15px] leading-[1.7] text-gray-700"
              dangerouslySetInnerHTML={{ __html: notesHtml }}
            />
          </section>
        )}

        {/* Analysis panel */}
        <AnimatePresence>
          {analysisOpen && (
            <div ref={analysisRef}>
              <AnalysisReport
                analysisText={analysisText}
                analyzing={analyzing}
                onClose={() => setAnalysisOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>

        <div className="mt-8">
          <WaitlistPrompt variant={1} />
        </div>
      </motion.div>

      {/* ─── STICKY ACTION BAR ────────────────────────────────────────────
          Always visible. Four primary actions: Download | Regenerate | Analyze | New Story */}
      <div
        role="toolbar"
        aria-label="Chapter actions"
        className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-[#C8964D]/20
                   px-3 sm:px-6 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]
                   pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
          {/* Edit Chapter — primary action, full saffron */}
          <button
            onClick={() => navigate('/editor')}
            aria-label="Edit chapter in the editor"
            className="col-span-2 sm:col-span-1 px-2 sm:px-4 py-3 bg-[#C8964D] hover:bg-[#b88340]
                       text-white font-semibold rounded-lg transition shadow-sm
                       text-xs sm:text-sm flex items-center justify-center gap-1.5"
          >
            <span aria-hidden="true">✎</span>
            <span>Edit Chapter</span>
          </button>

          {/* Download (with format menu) */}
          <div className="relative" ref={downloadMenuRef}>
            <button
              onClick={() => setDownloadOpen(o => !o)}
              disabled={downloading}
              aria-label="Download chapter"
              aria-haspopup="menu"
              aria-expanded={downloadOpen}
              className="w-full px-2 sm:px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]
                         font-medium rounded-lg transition disabled:opacity-60
                         text-xs sm:text-sm flex items-center justify-center gap-1.5 border border-transparent"
            >
              <span aria-hidden="true">⬇</span>
              <span>{downloading ? '...' : 'Download'}</span>
              <span aria-hidden="true" className="text-[10px] opacity-70">▾</span>
            </button>

            <AnimatePresence>
              {downloadOpen && (
                <motion.div
                  role="menu"
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 left-0 right-0 sm:right-auto sm:min-w-[200px] z-50
                             bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
                >
                  {[
                    { label: '.txt — Plain text',   onClick: downloadTxt,  locked: false       },
                    { label: '.docx — Word doc',    onClick: downloadDocx, locked: isStarter   },
                    { label: '.pdf — Print-ready',  onClick: downloadPDF,  locked: isStarter   },
                  ].map((item) => (
                    <button
                      key={item.label}
                      role="menuitem"
                      onClick={() => { setDownloadOpen(false); item.onClick(); }}
                      className="flex w-full justify-between items-center text-left px-4 py-2.5 text-sm text-[#1A1A1A]
                                 hover:bg-gray-50 hover:text-[#C8964D] transition"
                    >
                      <span>{item.label}</span>
                      {item.locked && (
                        <span className="text-[10px] text-[#C8964D] font-semibold flex items-center gap-1">
                          <span aria-hidden="true">🔒</span> Author
                        </span>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rewrite */}
          <button
            onClick={handleRegenerate}
            aria-label="Rewrite Chapter 1"
            title="Rewrite Chapter 1"
            className="px-2 sm:px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]
                       rounded-lg transition text-xs sm:text-sm font-medium
                       flex items-center justify-center gap-1.5 border border-transparent"
          >
            <span aria-hidden="true">↻</span>
            <span>Rewrite</span>
          </button>

          {/* Analyze */}
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            aria-label={analyzing ? 'Analysis in progress' : (isStarter ? 'Analyze chapter — Author plan required' : 'Analyze this chapter')}
            className="relative px-2 sm:px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]
                       rounded-lg transition disabled:opacity-60 text-xs sm:text-sm font-medium
                       flex items-center justify-center gap-1.5 border border-transparent"
          >
            <span aria-hidden="true">{analyzing ? '⟳' : '◎'}</span>
            <span>{analyzing ? 'Analyzing' : 'Analyze'}</span>
            {isStarter && (
              <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[#C8964D] text-white rounded-full px-1.5 py-px font-bold">
                <span aria-hidden="true">🔒</span>
              </span>
            )}
          </button>

          {/* New Book */}
          <button
            onClick={onNewStory}
            aria-label="Start a new book (clears chapter and conversation)"
            className="px-2 sm:px-4 py-3 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A]
                       rounded-lg transition text-xs sm:text-sm font-medium
                       flex items-center justify-center gap-1.5 border border-transparent"
          >
            <span aria-hidden="true">＋</span>
            <span>New Book</span>
          </button>
        </div>
      </div>

      <UpgradeModal
        open={!!upgradeModal}
        onClose={() => setUpgradeModal(null)}
        feature={upgradeModal?.feature}
        description={upgradeModal?.description}
        benefits={upgradeModal?.benefits || []}
      />
    </>
  );
}
