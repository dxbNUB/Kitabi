import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CHAT_MESSAGES = [
  'Reading between the lines...',
  'Finding the right question...',
  'Thinking like your reader...',
];

// Stages calibrated to a realistic 90-120s generation window.
const GENERATION_STAGES = [
  { max: 15,  text: 'Opening the file on your idea...' },
  { max: 35,  text: 'Choosing your opening line. The one that hooks them.' },
  { max: 60,  text: 'Building your world. One sentence at a time.' },
  { max: 90,  text: 'Putting your characters in motion...' },
  { max: 250, text: 'Finishing the chapter. Almost there.' },
];

export function ChatLoading() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % CHAT_MESSAGES.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 bg-amber-400 rounded-full block"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          className="text-sm text-gray-500 italic"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.3 }}
        >
          {CHAT_MESSAGES[idx]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function GenerationLoading({ wordCount = 0, onCancel = null }) {
  const [elapsed, setElapsed] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        const idx = GENERATION_STAGES.findIndex(s => next <= s.max);
        setStageIdx(idx === -1 ? GENERATION_STAGES.length - 1 : idx);
        return next;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const stage   = GENERATION_STAGES[stageIdx];
  // Paces toward 95% over ~105s, matching real 90-120s generation times.
  const percent = Math.min(95, (elapsed / 105) * 100);

  return (
    <motion.div
      className="h-full w-full flex flex-col items-center justify-center gap-7 p-8 bg-[#FAFAF7]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="text-5xl sm:text-6xl"
        animate={{ rotate: [-5, 5, -5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        🖋️
      </motion.div>

      <div className="text-center max-w-sm">
        <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Writing Chapter 1 of your book</p>
        <AnimatePresence mode="wait">
          <motion.p
            key={stageIdx}
            className="text-lg text-[#1A1A1A] font-serif"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
          >
            {stage.text}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="w-56 sm:w-64">
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#C8964D] rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[11px] text-gray-500">
          <span>{wordCount > 0 ? `${wordCount.toLocaleString()} words` : 'Starting…'}</span>
          <span>{elapsed}s</span>
        </div>
      </div>

      <p className="text-[11px] text-gray-500 max-w-xs text-center mt-2">
        Generating your chapter — usually 90-120 seconds. Grab a coffee.
      </p>

      {/* Slow-response warning past 60s */}
      {elapsed > 60 && (
        <p className="text-[11px] text-[#C8964D] max-w-xs text-center font-medium">
          Taking longer than usual. Hang tight or cancel below.
        </p>
      )}

      {/* Cancel button — wired by Chat.jsx via the abort controller */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-[#1A1A1A] underline underline-offset-4 mt-1"
        >
          Cancel
        </button>
      )}
    </motion.div>
  );
}
