/**
 * Lightweight toast notification system.
 *
 * Usage:
 *   import { toast } from '../lib/toast';
 *   toast.error('Please enter your idea');
 *   toast.success('Chapter saved');
 *   toast.info('Generating in background');
 *
 * Mount <Toaster /> once at the app root.
 */
import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],
  push: (msg, kind = 'info', duration = 3000) => {
    // Dedupe: if a toast with the same message + kind is already showing,
    // refresh its timer instead of stacking another copy on top.
    const existing = get().toasts.find((t) => t.msg === msg && t.kind === kind);
    if (existing) {
      if (existing.timeoutId) clearTimeout(existing.timeoutId);
      const timeoutId = duration > 0
        ? setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== existing.id) }));
          }, duration)
        : null;
      set((s) => ({
        toasts: s.toasts.map((t) =>
          t.id === existing.id ? { ...t, timeoutId } : t
        ),
      }));
      return existing.id;
    }

    const id = Date.now() + Math.random();
    const timeoutId = duration > 0
      ? setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, duration)
      : null;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind, timeoutId }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => {
      const t = s.toasts.find((x) => x.id === id);
      if (t?.timeoutId) clearTimeout(t.timeoutId);
      return { toasts: s.toasts.filter((x) => x.id !== id) };
    }),
}));

export const useToasts = () => useToastStore((s) => s.toasts);
export const useDismissToast = () => useToastStore((s) => s.dismiss);

export const toast = {
  info:    (msg, duration) => useToastStore.getState().push(msg, 'info',    duration),
  success: (msg, duration) => useToastStore.getState().push(msg, 'success', duration),
  error:   (msg, duration) => useToastStore.getState().push(msg, 'error',   duration),
  warn:    (msg, duration) => useToastStore.getState().push(msg, 'warn',    duration),
};
