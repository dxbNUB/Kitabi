import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Parsing ────────────────────────────────────────────────────────────────

function parseAnalysis(text) {
  // Extract scores line
  const scoresMatch = text.match(/SCORES_LINE:\s*(\{[^}]+\})/);
  let scores = null;
  let body = text;
  if (scoresMatch) {
    try { scores = JSON.parse(scoresMatch[1]); } catch {}
    body = text.replace(scoresMatch[0], '').trim();
  }

  // Split into sections by ═══ dividers
  const chunks = body.split(/\n?═{5,}[^\n]*\n?/).map(s => s.trim()).filter(Boolean);

  const sections = chunks.map(chunk => {
    const lines = chunk.split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    return { title, content };
  }).filter(s => s.title);

  // Parse PRIORITY ACTIONS checkboxes
  const actionsSection = sections.find(s => s.title.toUpperCase().includes('PRIORITY'));
  const actions = [];
  if (actionsSection) {
    const lines = actionsSection.content.split('\n');
    for (const line of lines) {
      const m = line.match(/\[([✓ ]?)\s*([^\]]+)\]\s*\[Effort:\s*([^\]]+)\]\s*\[Impact:\s*([^\]]+)\]/);
      if (m) {
        actions.push({ done: m[1].includes('✓'), text: m[2].trim(), effort: m[3].trim(), impact: m[4].trim() });
      }
    }
  }

  return { scores, sections, actions };
}

// ─── Score Ring ─────────────────────────────────────────────────────────────

function ScoreRing({ label, score }) {
  const clipped = Math.min(10, Math.max(0, score || 0));
  const pct     = (clipped / 10) * 100;
  const color   = clipped >= 8 ? '#7FB88A' : clipped >= 6.5 ? '#C9A25C' : '#D08A73';
  const r = 15.9;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(237,228,211,0.12)" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r={r} fill="none"
            stroke={color} strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${circ}`}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: circ - dash }}
            transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold"
          style={{ color }}>
          {clipped % 1 === 0 ? clipped : clipped.toFixed(1)}
        </span>
      </div>
      <span className="text-[11px] text-kitabi-faded text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Loading Book Animation ──────────────────────────────────────────────────

const STAGES = [
  'Reading your opening hook…',
  'Studying character voice…',
  'Checking pacing and rhythm…',
  'Comparing to genre patterns…',
  "Identifying what's working…",
  'Finding growth opportunities…',
  'Writing your report…',
];

function LoadingBook({ stage }) {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <div className="relative w-24 h-20">
        {/* Book spine */}
        <motion.div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-3 h-full rounded-sm"
          style={{ background: 'linear-gradient(180deg, #C9A25C, #A67C3B)' }}
        />
        {/* Left page */}
        <motion.div
          className="absolute right-1/2 top-1 origin-right h-[calc(100%-8px)] w-10 rounded-l-sm bg-[#FDFAF5]"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: [0, -25, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="p-1.5 space-y-1">
            {[0.6, 1, 0.8, 1, 0.5, 0.9].map((w, i) => (
              <div key={i} className="h-px bg-gray-300 rounded" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </motion.div>
        {/* Right page */}
        <motion.div
          className="absolute left-1/2 top-1 origin-left h-[calc(100%-8px)] w-10 rounded-r-sm bg-[#FDFAF5]"
          animate={{ rotateY: [0, 25, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
        >
          <div className="p-1.5 space-y-1">
            {[1, 0.7, 0.9, 0.6, 1, 0.8].map((w, i) => (
              <div key={i} className="h-px bg-gray-300 rounded" style={{ width: `${w * 100}%` }} />
            ))}
          </div>
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={stage}
          className="text-kitabi-stone text-sm text-center"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          {stage}
        </motion.p>
      </AnimatePresence>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-kitabi-gold"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Section Card ────────────────────────────────────────────────────────────

const SECTION_META = {
  'IMMEDIATE REACTION':           { icon: '💡', color: 'blue' },
  "WHAT'S WORKING EXCEPTIONALLY": { icon: '✓',  color: 'green' },
  'WHERE TO PUSH':                { icon: '⟶', color: 'amber' },
  'SPECIFIC REWRITES':            { icon: '✎',  color: 'purple' },
  'WHAT THIS CHAPTER IS REALLY ABOUT': { icon: '◈', color: 'blue' },
  'HOW THIS COMPARES TO GENRE STANDARDS': { icon: '⚖', color: 'gray' },
  'PRIORITY ACTIONS':             { icon: null,  color: 'amber' },
  'FINAL ASSESSMENT':             { icon: '★',  color: 'green' },
};

// One material, one accent — section identity comes from the label, not a
// rainbow of card colors. Working/priority sections get the gilt border.
const COLOR_CLASSES = {
  blue:   'border-seam bg-kitabi-night-soft',
  green:  'border-gilt bg-[rgba(201,162,92,0.05)]',
  amber:  'border-gilt bg-[rgba(201,162,92,0.05)]',
  purple: 'border-seam bg-kitabi-night-soft',
  gray:   'border-seam bg-kitabi-night-soft',
};

const LABEL_CLASSES = {
  blue:   'text-kitabi-stone',
  green:  'text-kitabi-gold',
  amber:  'text-kitabi-gold',
  purple: 'text-kitabi-stone',
  gray:   'text-kitabi-stone',
};

function findMeta(title) {
  const up = title.toUpperCase();
  for (const [key, val] of Object.entries(SECTION_META)) {
    if (up.includes(key)) return val;
  }
  return { icon: '·', color: 'gray' };
}

function SectionCard({ section, index, actions, completedActions, toggleAction }) {
  const meta = findMeta(section.title);
  const colorClass = COLOR_CLASSES[meta.color] || COLOR_CLASSES.gray;
  const labelClass = LABEL_CLASSES[meta.color] || LABEL_CLASSES.gray;
  const isPriority = section.title.toUpperCase().includes('PRIORITY');

  return (
    <motion.div
      className={`border rounded-lg p-5 sm:p-6 ${colorClass}`}
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
    >
      <div className="flex items-center gap-2 mb-4">
        {meta.icon && (
          <span className={`text-base ${labelClass}`}>{meta.icon}</span>
        )}
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${labelClass}`}>
          {section.title}
        </h3>
      </div>

      {isPriority && actions.length > 0 ? (
        <div className="space-y-2">
          {actions.map((action, i) => (
            <ActionItem
              key={i}
              action={action}
              checked={completedActions.has(i)}
              onToggle={() => toggleAction(i)}
            />
          ))}
          {!actions.length && (
            <p className="text-kitabi-ivory text-sm leading-relaxed whitespace-pre-wrap">{section.content}</p>
          )}
        </div>
      ) : (
        <div className="text-kitabi-ivory text-sm leading-relaxed whitespace-pre-wrap">{section.content}</div>
      )}
    </motion.div>
  );
}

// ─── Action Item ─────────────────────────────────────────────────────────────

function ActionItem({ action, checked, onToggle }) {
  const impactColor = action.impact?.toLowerCase().includes('high') ? 'text-[#7FB88A]' : 'text-kitabi-gold';

  return (
    <motion.button
      onClick={onToggle}
      className="w-full flex items-start gap-3 p-3 rounded-md hover:bg-[rgba(237,228,211,0.04)] transition text-left group"
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition
          ${checked ? 'bg-kitabi-gold border-kitabi-gold' : 'border-[rgba(237,228,211,0.25)] group-hover:border-gilt'}`}
        animate={checked ? { scale: [1, 1.2, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        {checked && (
          <motion.svg
            className="w-3 h-3 text-kitabi-night"
            viewBox="0 0 12 12" fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 0.25 }} />
          </motion.svg>
        )}
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${checked ? 'line-through text-kitabi-faded' : 'text-kitabi-ivory'} transition`}>
          {action.text}
        </p>
        <div className="flex gap-3 mt-1">
          <span className="text-xs text-kitabi-faded">⏱ {action.effort}</span>
          <span className={`text-xs font-medium ${impactColor}`}>{action.impact} impact</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AnalysisReport({ analysisText, analyzing, onClose }) {
  const [completedActions, setCompletedActions] = useState(new Set());
  const [stageIndex]        = useState(() => 0);
  const [currentStage, setCurrentStage] = useState(0);

  // Cycle through loading stages while analyzing
  useState(() => {
    if (!analyzing) return;
    const id = setInterval(() => setCurrentStage(s => Math.min(s + 1, STAGES.length - 1)), 4000);
    return () => clearInterval(id);
  });

  const parsed = useMemo(() => {
    if (!analysisText || analyzing) return null;
    return parseAnalysis(analysisText);
  }, [analysisText, analyzing]);

  const toggleAction = (i) => {
    setCompletedActions(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const scoreLabels = [
    ['prose', 'Prose'],
    ['genre', 'Genre Fit'],
    ['character', 'Character'],
    ['theme', 'Theme'],
    ['technical', 'Technical'],
    ['overall', 'Overall'],
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.4 }}
      className="mt-10 w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-kitabi-ivory tracking-wide">Literary Analysis</h2>
          {!analyzing && parsed?.scores && (
            <p className="text-xs text-kitabi-faded mt-0.5">Expert-level craft feedback</p>
          )}
        </div>
        <button onClick={onClose}
          aria-label="Close analysis report"
          className="text-kitabi-stone hover:text-kitabi-ivory text-sm transition px-2 py-1 rounded hover:bg-[rgba(237,228,211,0.05)]">
          Close <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Loading state */}
      {(analyzing || (!parsed && !analysisText)) && (
        <div className="bg-kitabi-night-soft border border-seam rounded-lg">
          {analysisText ? (
            <div className="p-6 sm:p-8">
              <p className="text-kitabi-faded text-xs uppercase tracking-wider mb-3">Generating analysis…</p>
              <div className="text-kitabi-stone text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-hidden opacity-70">
                {analysisText.slice(-400)}
              </div>
              <span className="inline-block w-2 h-3 bg-kitabi-gold animate-pulse ml-1 mt-2 align-middle" />
            </div>
          ) : (
            <LoadingBook stage={STAGES[currentStage]} />
          )}
        </div>
      )}

      {/* Parsed report */}
      {!analyzing && parsed && (
        <div className="space-y-4">
          {/* Score grid */}
          {parsed.scores && (
            <motion.div
              className="bg-kitabi-night-soft border border-seam rounded-lg p-5 sm:p-6"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="eyebrow mb-4">Quality Scores</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {scoreLabels.map(([key, label]) => (
                  <ScoreRing key={key} label={label} score={parsed.scores[key]} />
                ))}
              </div>
              <p className="text-[11px] text-kitabi-faded mt-4 text-center">
                8-10 = stronger than most published books · 6-7.5 = solid with specific gaps · &lt;6 = needs significant work
              </p>
            </motion.div>
          )}

          {/* Section cards */}
          <div className="space-y-4">
            {parsed.sections.map((section, i) => (
              <SectionCard
                key={i}
                section={section}
                index={i}
                actions={parsed.actions}
                completedActions={completedActions}
                toggleAction={toggleAction}
              />
            ))}
          </div>

          {/* Progress footer */}
          {parsed.actions.length > 0 && (
            <motion.div
              className="bg-kitabi-night-soft border border-seam rounded-lg px-5 py-4 flex items-center justify-between"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-xs text-kitabi-faded">
                {completedActions.size} of {parsed.actions.length} actions completed
              </span>
              <div className="flex gap-1">
                {parsed.actions.map((_, i) => (
                  <div key={i}
                    className={`w-6 h-1.5 rounded-full transition-colors duration-300
                      ${completedActions.has(i) ? 'bg-kitabi-gold' : 'bg-[rgba(237,228,211,0.12)]'}`}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
