import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
// TipTap v3 ships most extensions as named exports (not default).
import { StarterKit } from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Link as LinkExt } from '@tiptap/extension-link';
import { Image as ImageExt } from '@tiptap/extension-image';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CharacterCount } from '@tiptap/extension-character-count';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../store/session';
import { markdownToHtml, cleanMarkdownToPlainText } from '../lib/markdown';
import { exportTxt, exportDocx, exportPdf } from '../lib/exports';
import { aiRewrite } from '../lib/api';
import { toast } from '../lib/toast';
import { useTier } from '../store/account';
import PDFDocument from '../components/PDFDocument';
import UpgradeModal from '../components/UpgradeModal';

const AUTOSAVE_DELAY_MS = 10_000;
const LOCAL_BACKUP_KEY  = 'kitabi-editor-backup';

export default function Editor() {
  const navigate = useNavigate();
  const {
    chapterGenerated, chapterEditedHtml, setChapterEditedHtml,
    project, genre,
  } = useSession();

  // No chapter? Bounce home.
  if (!chapterGenerated) return <Navigate to="/" replace />;

  const [saveStatus, setSaveStatus]       = useState('saved'); // 'saving' | 'saved' | 'error' | 'dirty'
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText]           = useState('');
  const [replaceText, setReplaceText]     = useState('');
  const [aiBusy, setAiBusy]               = useState(false);
  const [upgradeOpen, setUpgradeOpen]     = useState(false);
  const autoSaveTimer = useRef(null);
  const { canUseAuthorFeats, isStarter } = useTier();

  const title = project?.title || 'Your Chapter';

  // Initial content: edited HTML if it exists, otherwise convert the original markdown
  const initialHtml = chapterEditedHtml || markdownToHtml(chapterGenerated);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: 'text-[#C8964D] underline' } }),
      ImageExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({ placeholder: 'Start editing your chapter…' }),
      CharacterCount.configure({ limit: 50_000 }),
    ],
    content: initialHtml,
    editorProps: {
      attributes: {
        class: 'editor-prose focus:outline-none min-h-[600px] px-12 sm:px-16 py-14',
      },
    },
    onUpdate: () => {
      setSaveStatus('dirty');
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(persist, AUTOSAVE_DELAY_MS);
    },
  });

  // Save handler — writes to Zustand session (sessionStorage-persisted) AND
  // a localStorage backup so a crash doesn't lose work.
  const persist = useCallback(() => {
    if (!editor) return;
    setSaveStatus('saving');
    try {
      const html = editor.getHTML();
      setChapterEditedHtml(html);
      try { localStorage.setItem(LOCAL_BACKUP_KEY, html); } catch {/* quota */}
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
      toast.error('Save failed — your text is still in the editor.');
    }
  }, [editor, setChapterEditedHtml]);

  const manualSave = () => { persist(); toast.success('Saved'); };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key === 's')                          { e.preventDefault(); manualSave(); }
      if (meta && (e.key === 'f' || e.key === 'F'))       { e.preventDefault(); setShowFindReplace(true); }
      if (e.key === 'Escape')                              { setShowFindReplace(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editor]);

  // Save before unload
  useEffect(() => {
    const onBeforeUnload = () => persist();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [persist]);

  if (!editor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading editor…
      </div>
    );
  }

  // ─── Helpers ─────────────────────────────────────────────────────────
  const wordCount    = editor.storage.characterCount.words();
  const charCount    = editor.storage.characterCount.characters();
  const readMinutes  = Math.max(1, Math.ceil(wordCount / 200));

  const handleFindReplace = () => {
    if (!findText) return;

    // Use TipTap's transaction API instead of replacing raw HTML — keeps
    // paragraph nodes and inline marks intact. Walks every text node, finds
    // each occurrence, then applies replacements end-to-start so positions
    // stay valid.
    const { state, view } = editor;
    const positions = [];
    state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return;
      let idx = -1;
      while ((idx = node.text.indexOf(findText, idx + 1)) !== -1) {
        positions.push({ from: pos + idx, to: pos + idx + findText.length });
      }
    });

    if (positions.length === 0) {
      toast.info(`No matches for "${findText}".`);
      return;
    }

    const tr = state.tr;
    positions.reverse().forEach(({ from, to }) => {
      // setText "" clears, otherwise replaceWith with a fresh text node
      if (replaceText.length === 0) {
        tr.delete(from, to);
      } else {
        tr.replaceWith(from, to, state.schema.text(replaceText));
      }
    });
    view.dispatch(tr);
    toast.success(`Replaced ${positions.length} occurrence${positions.length === 1 ? '' : 's'}.`);
  };

  const onExportTxt  = () => exportTxt({ plainText: editor.getText(), title, genre });
  const onExportDocx = () => {
    if (!canUseAuthorFeats) { setUpgradeOpen(true); return; }
    exportDocx({ html: editor.getHTML(), title, genre });
  };
  const onExportPdf  = async () => {
    if (!canUseAuthorFeats) { setUpgradeOpen(true); return; }
    try {
      await exportPdf({
        PDFDocument: (props) => <PDFDocument {...props} />,
        title, genre,
        chapterText: cleanMarkdownToPlainText(editor.getText()),
      });
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('PDF export failed. Try .docx instead.');
    }
  };

  const aiTransform = async (kind) => {
    if (!canUseAuthorFeats) {
      setUpgradeOpen(true);
      return;
    }
    const sel = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(sel.from, sel.to, ' ');
    if (!selectedText.trim()) {
      toast.error('Select some text first.');
      return;
    }
    setAiBusy(true);
    try {
      const text = await aiRewrite({ text: selectedText, mode: kind, genre });
      editor.chain().focus().deleteRange({ from: sel.from, to: sel.to }).insertContent(text.trim()).run();
      toast.success(`AI ${kind}: done`);
    } catch (err) {
      if (err?.type === 'aborted') return;   // user navigation — silent
      // ApiError carries a status-aware title + message; show both, give user time to read.
      const title = err?.title   || `AI ${kind} failed.`;
      const msg   = err?.message || 'Try again in a moment.';
      toast.error(`${title} ${msg}`, 6000);
    } finally {
      setAiBusy(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* TOP BAR */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <button
            onClick={() => navigate('/chapter')}
            className="text-sm text-gray-600 hover:text-[#1A1A1A] transition flex-shrink-0 whitespace-nowrap"
          >
            <span aria-hidden="true">←</span> Back
          </button>
          <div className="h-6 w-px bg-gray-300 hidden sm:block" />
          <h1 className="font-serif text-lg text-[#1A1A1A] truncate">{title}</h1>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <SaveBadge status={saveStatus} />
          <button
            onClick={manualSave}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
            title="Save (Cmd/Ctrl+S)"
          >
            Save
          </button>
          <ExportMenu onTxt={onExportTxt} onDocx={onExportDocx} onPdf={onExportPdf} />
        </div>
      </header>

      {/* TOOLBAR */}
      <Toolbar
        editor={editor}
        onFindToggle={() => setShowFindReplace((v) => !v)}
        onAi={aiTransform}
        aiBusy={aiBusy}
        isStarter={isStarter}
      />

      {/* FIND & REPLACE */}
      <AnimatePresence>
        {showFindReplace && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-[#FFF7EB] border-b border-[#C8964D]/30 overflow-hidden"
          >
            <div className="px-4 sm:px-6 py-3 flex items-center gap-2 flex-wrap">
              <input
                type="text" autoFocus value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find…"
                className="px-3 py-1.5 border border-gray-300 rounded text-sm flex-1 min-w-[120px] max-w-xs"
              />
              <input
                type="text" value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with…"
                className="px-3 py-1.5 border border-gray-300 rounded text-sm flex-1 min-w-[120px] max-w-xs"
              />
              <button
                onClick={handleFindReplace}
                className="px-4 py-1.5 bg-[#C8964D] text-white rounded text-sm font-medium hover:bg-[#b88340] transition"
              >
                Replace All
              </button>
              <button
                onClick={() => setShowFindReplace(false)}
                className="text-gray-500 hover:text-[#1A1A1A] px-2"
                aria-label="Close find and replace"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN — document + sidebar */}
      <div className="flex-1 flex">
        <main className="flex-1 flex justify-center py-6 px-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white shadow-sm rounded border border-gray-200 my-2">
            <EditorContent editor={editor} />
          </div>
        </main>

        <aside className="hidden lg:flex flex-col w-72 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4">Document info</h3>
          <dl className="space-y-3.5 mb-8">
            <Stat label="Words"        value={wordCount.toLocaleString()} />
            <Stat label="Characters"   value={charCount.toLocaleString()} />
            <Stat label="Reading time" value={`${readMinutes} min`} />
          </dl>

          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3 mt-2">Shortcuts</h3>
          <ul className="text-xs text-gray-600 space-y-1.5 mb-8">
            <li><kbd className="kbd">⌘B</kbd> Bold</li>
            <li><kbd className="kbd">⌘I</kbd> Italic</li>
            <li><kbd className="kbd">⌘U</kbd> Underline</li>
            <li><kbd className="kbd">⌘Z</kbd> Undo</li>
            <li><kbd className="kbd">⌘⇧Z</kbd> Redo</li>
            <li><kbd className="kbd">⌘F</kbd> Find &amp; replace</li>
            <li><kbd className="kbd">⌘S</kbd> Save</li>
          </ul>

          <h3 className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">Tips</h3>
          <p className="text-xs text-gray-600 leading-snug">
            Select a passage and use the AI tools above the document to rewrite, expand, or condense it.
            Your edits autosave every {Math.round(AUTOSAVE_DELAY_MS / 1000)} seconds.
          </p>
        </aside>
      </div>

      {/* STATUS BAR */}
      <footer className="bg-[#1A1A1A] text-gray-300 px-4 sm:px-6 py-1.5 flex items-center justify-between text-[11px]">
        <div className="flex gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span className="hidden sm:inline">{charCount.toLocaleString()} characters</span>
          <span className="hidden sm:inline">{readMinutes} min read</span>
        </div>
        <div className="flex gap-3 items-center">
          <span className="text-gray-500">Autosave: every {Math.round(AUTOSAVE_DELAY_MS / 1000)}s</span>
        </div>
      </footer>

      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        feature="AI rewrite tools & premium exports"
        description="Rewrite, expand, condense, or improve any selection. Plus .docx and .pdf exports."
        benefits={[
          '4 AI text-transform tools (rewrite / expand / condense / improve)',
          '.docx and .pdf chapter exports',
          'Literary AI analysis (8.7/10 quality)',
          '25 chapters / 62,500 words per month',
        ]}
      />
    </div>
  );
}

// ─── Helper components ───────────────────────────────────────────────────

function SaveBadge({ status }) {
  const cfg = {
    saved:  { text: '✓ Saved',     color: 'text-emerald-600' },
    saving: { text: '⟳ Saving…',   color: 'text-amber-600 animate-pulse' },
    dirty:  { text: '· Unsaved',   color: 'text-gray-500' },
    error:  { text: '! Error',     color: 'text-red-600' },
  }[status] || { text: '', color: '' };
  return <span className={`text-xs font-medium ${cfg.color}`}>{cfg.text}</span>;
}

function ExportMenu({ onTxt, onDocx, onPdf }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-sm bg-[#C8964D] hover:bg-[#b88340] text-white rounded-lg font-medium transition flex items-center gap-1.5"
      >
        Export <span className="text-[10px] opacity-80" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
          <MenuItem onClick={() => { setOpen(false); onTxt();  }}>.txt — Plain text</MenuItem>
          <MenuItem onClick={() => { setOpen(false); onDocx(); }}>.docx — Word doc</MenuItem>
          <MenuItem onClick={() => { setOpen(false); onPdf();  }}>.pdf — Print-ready</MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({ onClick, children }) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className="block w-full text-left px-4 py-2 text-sm text-[#1A1A1A] hover:bg-gray-50 hover:text-[#C8964D] transition"
    >
      {children}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[11px] text-gray-500 mb-0.5">{label}</dt>
      <dd className="font-display text-2xl font-medium text-[#1A1A1A]">{value}</dd>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────

function Toolbar({ editor, onFindToggle, onAi, aiBusy, isStarter }) {
  const btn = (active, extra = '') =>
    `p-2 rounded transition text-sm flex items-center justify-center min-w-[32px] ${
      active ? 'bg-gray-200 text-[#1A1A1A]' : 'text-gray-700 hover:bg-gray-100'
    } ${extra}`;

  return (
    <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2 flex items-center gap-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {/* Undo / Redo */}
      <Group>
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false, 'disabled:opacity-30 disabled:cursor-not-allowed')} title="Undo (Cmd+Z)">↶</button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false, 'disabled:opacity-30 disabled:cursor-not-allowed')} title="Redo (Cmd+Shift+Z)">↷</button>
      </Group>

      {/* Block type */}
      <select
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'p') editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(v) }).run();
        }}
        className="px-2 py-1 border border-gray-300 rounded text-sm mr-1 bg-white flex-shrink-0"
        value={
          editor.isActive('heading', { level: 1 }) ? '1' :
          editor.isActive('heading', { level: 2 }) ? '2' :
          editor.isActive('heading', { level: 3 }) ? '3' : 'p'
        }
      >
        <option value="p">Normal text</option>
        <option value="1">Heading 1</option>
        <option value="2">Heading 2</option>
        <option value="3">Heading 3</option>
      </select>

      {/* Inline */}
      <Group>
        <button onClick={() => editor.chain().focus().toggleBold().run()}      className={btn(editor.isActive('bold'),      'font-bold')}     title="Bold (⌘B)">B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()}    className={btn(editor.isActive('italic'),    'italic')}        title="Italic (⌘I)">I</button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={btn(editor.isActive('underline'), 'underline')}     title="Underline (⌘U)">U</button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()}    className={btn(editor.isActive('strike'),    'line-through')}  title="Strikethrough">S</button>
      </Group>

      {/* Color + highlight */}
      <Group>
        <input
          type="color"
          onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          className="w-8 h-7 cursor-pointer rounded border border-gray-200"
          title="Text color"
        />
        <button
          onClick={() => editor.chain().focus().toggleHighlight({ color: '#FFF7EB' }).run()}
          className={btn(editor.isActive('highlight'))}
          title="Highlight"
        >
          <span aria-hidden="true" className="bg-[#FFF7EB] px-1 border border-[#C8964D]/30 rounded">H</span>
        </button>
      </Group>

      {/* Lists & quote */}
      <Group>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()}  className={btn(editor.isActive('bulletList'))}  title="Bullet list">•</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Numbered list">1.</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()}  className={btn(editor.isActive('blockquote'))}  title="Block quote">❝</button>
      </Group>

      {/* Alignment */}
      <Group>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()}    className={btn(editor.isActive({ textAlign: 'left'    }))} title="Align left">⇤</button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()}  className={btn(editor.isActive({ textAlign: 'center'  }))} title="Align center">≡</button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()}   className={btn(editor.isActive({ textAlign: 'right'   }))} title="Align right">⇥</button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={btn(editor.isActive({ textAlign: 'justify' }))} title="Justify">☷</button>
      </Group>

      {/* Insert */}
      <Group>
        <button
          onClick={() => {
            const url = window.prompt('Link URL:');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }}
          className={btn(editor.isActive('link'))}
          title="Insert link"
        >🔗</button>
        <button
          onClick={() => {
            const url = window.prompt('Image URL:');
            if (url) editor.chain().focus().setImage({ src: url }).run();
          }}
          className={btn(false)}
          title="Insert image"
        >▢</button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Horizontal rule">—</button>
      </Group>

      {/* Find */}
      <button onClick={onFindToggle} className={btn(false, 'mr-1')} title="Find &amp; replace (⌘F)">🔍</button>

      {/* AI tools — push to right (flex-shrink-0 so they survive horizontal scroll) */}
      <div className="ml-auto flex gap-1.5 items-center flex-shrink-0">
        {aiBusy && <span className="text-xs text-[#C8964D] animate-pulse mr-1">AI working…</span>}
        {isStarter && <span className="text-[10px] text-[#C8964D] font-semibold mr-1" aria-hidden="true">🔒 Author</span>}
        <AiBtn onClick={() => onAi('rewrite')}  disabled={aiBusy}>✎ Rewrite</AiBtn>
        <AiBtn onClick={() => onAi('expand')}   disabled={aiBusy}>↗ Expand</AiBtn>
        <AiBtn onClick={() => onAi('condense')} disabled={aiBusy}>↙ Condense</AiBtn>
        <AiBtn onClick={() => onAi('improve')}  disabled={aiBusy}>✦ Improve</AiBtn>
      </div>
    </div>
  );
}

function Group({ children }) {
  return <div className="flex gap-0.5 mr-2 pr-2 border-r border-gray-200 last:border-0 last:pr-0 last:mr-0 flex-shrink-0">{children}</div>;
}

function AiBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className="px-2.5 py-1.5 bg-[#FFF7EB] text-[#8b6a2f] hover:bg-[#C8964D] hover:text-white
                 rounded text-xs font-medium transition disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
    >
      {children}
    </button>
  );
}
