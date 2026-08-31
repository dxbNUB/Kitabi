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
            className="bg-kitabi-night-raise border border-seam rounded-lg p-7 sm:p-8 max-w-md w-full shadow-raise"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-[rgba(201,162,92,0.08)] border border-gilt rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-kitabi-gold" aria-hidden="true">✦</span>
              </div>
              <h2 id="upgrade-modal-title" className="font-display text-2xl font-medium text-kitabi-ivory mb-2">
                {feature}
              </h2>
              {description && (
                <p className="text-kitabi-stone text-sm sm:text-base">{description}</p>
              )}
            </div>

            {benefits.length > 0 && (
              <ul className="space-y-2 mb-6 bg-[rgba(237,228,211,0.04)] border border-seam rounded-md p-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-kitabi-ivory">
                    <span className="text-kitabi-gold font-bold mt-0.5" aria-hidden="true">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-2">
              <button
                onClick={() => { onClose?.(); navigate('/pricing'); }}
                className="w-full px-6 py-3 btn-gold rounded-md
                           font-semibold transition-colors"
              >
                {cta}
              </button>
              <button
                onClick={onClose}
                className="w-full px-6 py-2.5 text-kitabi-stone hover:text-kitabi-ivory rounded-md font-medium transition text-sm"
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
