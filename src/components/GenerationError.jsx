import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Full-screen error state shown when chapter generation fails.
 * Replaces the GenerationLoading panel — gives the user clear recovery options
 * instead of a forever spinner.
 */
export default function GenerationError({ error, onRetry, onCancel }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full w-full flex items-center justify-center p-8 bg-kitabi-night"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-[rgba(176,92,66,0.1)] border border-[rgba(176,92,66,0.4)] rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl text-[#D08A73]" aria-hidden="true">⚠</span>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-kitabi-ivory mb-3 leading-tight">
          {error.title || 'Something went wrong.'}
        </h2>

        <p className="text-kitabi-stone mb-2 leading-relaxed">
          {error.message || 'Please try again.'}
        </p>

        {error.type === 'service_unavailable' && (
          <p className="text-xs text-kitabi-faded mt-4">
            Status:{' '}
            <a
              href="https://status.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kitabi-gold underline"
            >
              status.anthropic.com
            </a>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-7 justify-center">
          {error.retryable && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-kitabi-gold hover:bg-kitabi-gold-deep text-kitabi-night hover:text-kitabi-paper font-semibold rounded-md transition-colors"
            >
              Try again
            </button>
          )}
          {error.upgradeUrl && (
            <button
              onClick={() => navigate(error.upgradeUrl)}
              className="px-6 py-3 bg-kitabi-gold hover:bg-kitabi-gold-deep text-kitabi-night hover:text-kitabi-paper font-semibold rounded-md transition-colors"
            >
              See plans
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-seam hover:border-gilt text-kitabi-ivory font-medium rounded-md transition-colors"
          >
            Back to chat
          </button>
        </div>

        <p className="text-xs text-kitabi-faded mt-6">
          Still stuck?{' '}
          <a href="mailto:support@kitabi.ink" className="text-kitabi-gold hover:underline">
            Email support
          </a>
        </p>
      </div>
    </motion.div>
  );
}
