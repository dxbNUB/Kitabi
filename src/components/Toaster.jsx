import { motion, AnimatePresence } from 'framer-motion';
import { useToasts, useDismissToast } from '../lib/toast';

const STYLES = {
  info:    { bar: 'bg-blue-400',    icon: 'ⓘ', label: 'Information' },
  success: { bar: 'bg-emerald-400', icon: '✓', label: 'Success'     },
  error:   { bar: 'bg-red-400',     icon: '!', label: 'Error'       },
  warn:    { bar: 'bg-amber-400',   icon: '!', label: 'Warning'     },
};

export default function Toaster() {
  const toasts = useToasts();
  const dismiss = useDismissToast();

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2
                 w-[min(calc(100vw-2rem),28rem)] pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const style = STYLES[t.kind] || STYLES.info;
          return (
            <motion.div
              key={t.id}
              role={t.kind === 'error' ? 'alert' : 'status'}
              aria-live={t.kind === 'error' ? 'assertive' : 'polite'}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              className="pointer-events-auto bg-white border border-gray-200 rounded-lg shadow-xl
                         flex items-stretch overflow-hidden w-full"
            >
              <div className={`w-1 ${style.bar} flex-shrink-0`} aria-hidden="true" />
              <div className="flex items-start gap-3 px-4 py-3 flex-1 min-w-0">
                <span className={`text-sm font-bold ${style.bar.replace('bg-', 'text-')} mt-0.5 flex-shrink-0`} aria-hidden="true">
                  {style.icon}
                </span>
                <span className="sr-only">{style.label}: </span>
                <span className="text-sm text-[#1A1A1A] flex-1 leading-snug break-words min-w-0">
                  {t.msg}
                </span>
                <button
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="text-gray-400 hover:text-[#1A1A1A] text-xs ml-2 flex-shrink-0"
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
