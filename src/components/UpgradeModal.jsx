import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Reusable upgrade-prompt modal for paywalled features.
 * Render <UpgradeModal /> once with `open` controlled from parent state.
 */
export default function UpgradeModal({
  open,
  onClose,
  feature        = 'Premium feature',
  description    = '',
  benefits       = [],
  cta            = 'Upgrade to Author — $25/mo',
}) {
  const navigate = useNavigate();

  // ESC closes
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-7 sm:p-8 max-w-md w-full shadow-2xl"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[#FFF7EB] border border-[#C8964D]/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-[#C8964D]" aria-hidden="true">✦</span>
              </div>
              <h2 id="upgrade-modal-title" className="font-serif text-2xl font-medium text-[#1A1A1A] mb-2">
                {feature}
              </h2>
              {description && (
                <p className="text-gray-600 text-sm sm:text-base">{description}</p>
              )}
            </div>

            {benefits.length > 0 && (
              <ul className="space-y-2 mb-6 bg-gray-50 rounded-lg p-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-[#1A1A1A]">
                    <span className="text-[#C8964D] font-bold mt-0.5" aria-hidden="true">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <button
                onClick={() => { onClose?.(); navigate('/pricing'); }}
                className="w-full px-6 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white rounded-lg
                           font-semibold transition shadow-sm"
              >
                {cta}
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-2.5 text-gray-600 hover:text-[#1A1A1A] rounded-lg font-medium transition text-sm"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
