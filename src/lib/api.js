import { ApiError, fromResponse, fromThrown, combineSignal } from './errors.js';

const TIMEOUTS = {
  chat:     30_000,
  generate: 120_000,
  analyze:  60_000,
  rewrite:  60_000,
};

export async function sendChatMessage({ messages, genre, mode, sessionContext, signal: externalSignal, onDelta, onDone, onError }) {
  const { signal, cleanup } = combineSignal(externalSignal, TIMEOUTS.chat);
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, genre, mode, sessionContext }),
      signal,
    });
    if (!res.ok) {
      onError?.(await fromResponse(res));
      return;
    }
    await consumeSSE(res, onDelta, onDone, onError);
  } catch (err) {
    if (err?.name === 'AbortError' && err?.message !== 'TimeoutError') return;  // user cancel — silent
    onError?.(fromThrown(err));
  } finally {
    cleanup();
  }
}

export async function generateChapter({ genre, mode, sessionContext, conversationSummary, language, bookType, signal: externalSignal, onDelta, onDone, onError }) {
  const { signal, cleanup } = combineSignal(externalSignal, TIMEOUTS.generate);
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ genre, mode, sessionContext, conversationSummary, language, bookType }),
      signal,
    });
    if (!res.ok) {
      onError?.(await fromResponse(res));
      return;
    }
    await consumeSSE(res, onDelta, onDone, onError);
  } catch (err) {
    if (err?.name === 'AbortError' && err?.message !== 'TimeoutError') return;
    onError?.(fromThrown(err));
  } finally {
    cleanup();
  }
}

export async function analyzeChapter({ chapterText, genre, signal: externalSignal, onDelta, onDone, onError }) {
  const { signal, cleanup } = combineSignal(externalSignal, TIMEOUTS.analyze);
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterText, genre }),
      signal,
    });
    if (!res.ok) {
      onError?.(await fromResponse(res));
      return;
    }
    await consumeSSE(res, onDelta, onDone, onError);
  } catch (err) {
    if (err?.name === 'AbortError' && err?.message !== 'TimeoutError') return;
    onError?.(fromThrown(err));
  } finally {
    cleanup();
  }
}

async function consumeSSE(res, onDelta, onDone, onError) {
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') { onDone?.(); continue; }
      try {
        const parsed = JSON.parse(data);
        if (parsed.delta)            onDelta?.(parsed.delta);
        if (parsed.type === 'done')  onDone?.();
        if (parsed.type === 'error') onError?.({ type: 'stream_error', title: 'Stream interrupted', message: parsed.message || 'The chapter was being written but the stream stopped. Try again.', retryable: true });
        if (parsed.error)            onError?.({ type: 'stream_error', title: 'Generation failed', message: parsed.error, retryable: true });
      } catch { /* skip malformed line */ }
    }
  }
}

/**
 * POST /api/rewrite — non-streaming JSON in/out. Used by the editor's AI tools
 * (rewrite, expand, condense, improve). Throws an ApiError on failure so the
 * caller can show a single status-aware toast or modal.
 */
export async function aiRewrite({ text, mode, genre, signal: externalSignal }) {
  const { signal, cleanup } = combineSignal(externalSignal, TIMEOUTS.rewrite);
  try {
    const res = await fetch('/api/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode, genre }),
      signal,
    });
    if (!res.ok) throw await fromResponse(res);
    const data = await res.json();
    return data.text || '';
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw fromThrown(err);
  } finally {
    cleanup();
  }
}

export async function analyzeChapter_legacy(...args) { return analyzeChapter(...args); } // kept for any stale imports

export function detectGenre(text) {
  const t = text.toLowerCase();
  const scores = {
    thriller:   ['murder','killer','detective','suspect','crime','police','mystery',
                 'thriller','stalker','missing','investigate'].filter(w => t.includes(w)).length,
    fantasy:    ['magic','wizard','dragon','kingdom','quest','spell','elf','dwarf',
                 'sword','prophecy','enchant','realm'].filter(w => t.includes(w)).length,
    scifi:      ['space','alien','future','robot','ai','planet','science','tech',
                 'cyber','ship','clone','time travel'].filter(w => t.includes(w)).length,
    historical: ['century','historical','war','ancient','medieval','empire','dynasty',
                 'king','queen','era','period','1800','1900'].filter(w => t.includes(w)).length,
    business:   ['habit','productivity','success','leadership','startup','money',
                 'invest','mindset','entrepreneur','business'].filter(w => t.includes(w)).length,
  };
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : null;
}
