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
      className="h-full w-full flex items-center justify-center p-8 bg-[#FAFAF7]"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl text-red-500" aria-hidden="true">⚠</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-3xl text-[#1A1A1A] mb-3 leading-tight">
          {error.title || 'Something went wrong.'}
        </h2>

        <p className="text-gray-600 mb-2 leading-relaxed">
          {error.message || 'Please try again.'}
        </p>

        {error.type === 'service_unavailable' && (
          <p className="text-xs text-gray-500 mt-4">
            Status:{' '}
            <a
              href="https://status.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#C8964D] underline"
            >
              status.anthropic.com
            </a>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-7 justify-center">
          {error.retryable && (
            <button
              onClick={onRetry}
              className="px-6 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg shadow-sm transition"
            >
              Try again
            </button>
          )}
          {error.upgradeUrl && (
            <button
              onClick={() => navigate(error.upgradeUrl)}
              className="px-6 py-3 bg-[#C8964D] hover:bg-[#b88340] text-white font-semibold rounded-lg shadow-sm transition"
            >
              See plans
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 hover:border-gray-400 text-[#1A1A1A] font-medium rounded-lg transition"
          >
            Back to chat
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Still stuck?{' '}
          <a href="mailto:support@kitabi.ink" className="text-[#C8964D] hover:underline">
            Email support
          </a>
        </p>
      </div>
    </motion.div>
  );
}
