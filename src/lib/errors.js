/**
 * Structured API errors with retryability + user-facing copy.
 * lib/api.js builds these and passes them to onError; UI components render them.
 */

export class ApiError extends Error {
  constructor({ type, status = null, title, message, retryable = false, upgradeUrl = null }) {
    super(message);
    this.type        = type;
    this.status      = status;
    this.title       = title;
    this.message     = message;
    this.retryable   = retryable;
    this.upgradeUrl  = upgradeUrl;
  }
}

/**
 * Build an ApiError from a non-OK Response.
 * Tries to read a JSON body for context; falls back to status-code defaults.
 */
export async function fromResponse(res) {
  let body = null;
  try { body = await res.json(); } catch { /* ignore parse errors */ }

  // Server-supplied details override defaults where present
  const serverMessage = body?.message;

  switch (res.status) {
    case 401:
      return new ApiError({
        type: 'unauthorized', status: 401,
        title: 'Please sign in again.',
        message: serverMessage || 'Your session has expired.',
        retryable: false,
      });
    case 429:
      // Rate limit OR monthly cap. Both should send users to /pricing.
      return new ApiError({
        type: body?.reason === 'month_limit_exceeded' ? 'monthly_limit' : 'rate_limited',
        status: 429,
        title: body?.reason === 'month_limit_exceeded'
          ? "You've hit your monthly limit."
          : 'Too many requests.',
        message: serverMessage || 'Please slow down or upgrade for more.',
        retryable: false,
        upgradeUrl: '/pricing',
      });
    case 503:
      return new ApiError({
        type: 'service_unavailable', status: 503,
        title: 'Our writing engine is temporarily down.',
        message: serverMessage || 'Please try again in a few minutes. Your work is safe.',
        retryable: true,
      });
    case 504:
      return new ApiError({
        type: 'gateway_timeout', status: 504,
        title: 'The request took too long.',
        message: serverMessage || 'This sometimes happens during peak hours. Please try again.',
        retryable: true,
      });
    default:
      if (res.status >= 500) {
        return new ApiError({
          type: 'server_error', status: res.status,
          title: 'Something went wrong on our end.',
          message: serverMessage || "We've been notified. Please try again in a moment.",
          retryable: true,
        });
      }
      return new ApiError({
        type: 'unknown_error', status: res.status,
        title: 'Something unexpected happened.',
        message: serverMessage || `Error ${res.status}. Please try again.`,
        retryable: true,
      });
  }
}

/**
 * Map a thrown JS error (network failure, abort, timeout) to an ApiError.
 */
export function fromThrown(err) {
  // User-initiated abort — caller usually wants to swallow this silently
  if (err?.name === 'AbortError' && err?.message !== 'TimeoutError') {
    return new ApiError({
      type: 'aborted',
      title: 'Cancelled.',
      message: 'Request cancelled.',
      retryable: true,
    });
  }
  // Timeout (we tag this with a custom DOMException name)
  if (err?.name === 'TimeoutError' || err?.message === 'TimeoutError') {
    return new ApiError({
      type: 'timeout',
      title: 'This is taking too long.',
      message: 'Our writing engine might be overwhelmed. Try again or shorten your input.',
      retryable: true,
    });
  }
  // Network / DNS / offline
  return new ApiError({
    type: 'network_error',
    title: 'Connection problem.',
    message: 'Check your internet connection and try again.',
    retryable: true,
  });
}

/**
 * Combine an external AbortSignal with a timeout. Returns a new signal that
 * aborts when EITHER fires. Caller must call cleanup() to clear the timeout.
 *
 * Browser AbortSignal.any() / AbortSignal.timeout() exist but aren't safe in
 * older Safari, so we do it manually.
 */
export function combineSignal(externalSignal, timeoutMs) {
  const ac = new AbortController();
  if (externalSignal?.aborted) ac.abort(externalSignal.reason);
  const onExt = () => ac.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', onExt, { once: true });

  const timeoutId = setTimeout(
    () => ac.abort(new DOMException('Timeout', 'TimeoutError')),
    timeoutMs
  );

  return {
    signal: ac.signal,
    cleanup: () => {
      clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onExt);
    },
  };
}
