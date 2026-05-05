/**
 * Multi-window IP-based rate limiter.
 *
 * Today: in-memory Map keyed by IP. Survives within a single server process,
 * resets on restart. Fine for the current single-process Node dev/preview server.
 *
 * TODO(production): swap the in-memory store for Redis (Upstash REST works on
 * Vercel) when scaling beyond one process. The check/increment API below stays
 * the same — only the storage backend changes.
 *
 * TODO(auth): when Firebase auth lands, swap the IP key for `${userId}` and
 * load per-tier limits from `users/${uid}.stats.tier`. The window tracking
 * logic doesn't change.
 */

// ─── Limits per action ────────────────────────────────────────────────
// Conservative defaults that protect against bursts but allow normal usage.
// Env vars override at startup so production can tighten without a deploy.
export const RATE_LIMITS = {
  chat: {
    minute: parseInt(process.env.RL_CHAT_PER_MIN  || '20', 10),
    hour:   parseInt(process.env.RL_CHAT_PER_HOUR || '100', 10),
    day:    parseInt(process.env.RL_CHAT_PER_DAY  || '500', 10),
  },
  generate: {
    minute: parseInt(process.env.RL_GENERATE_PER_MIN  || '1',  10),
    hour:   parseInt(process.env.RL_GENERATE_PER_HOUR || '3',  10),
    day:    parseInt(process.env.RATE_LIMIT_GENERATIONS_PER_IP || '3', 10),
  },
  analyze: {
    minute: parseInt(process.env.RL_ANALYZE_PER_MIN  || '1',  10),
    hour:   parseInt(process.env.RL_ANALYZE_PER_HOUR || '5',  10),
    day:    parseInt(process.env.RL_ANALYZE_PER_DAY  || '10', 10),
  },
};

// Monthly caps — applied separately from rolling-window rate limits.
// Used by /api/generate to enforce the free-tier "3 chapters per month" promise.
// When auth lands, swap to per-tier values from the user document.
export const MONTHLY_CAPS = {
  chapters:        parseInt(process.env.RL_GENERATE_PER_MONTH || '3', 10),
  wordsPerChapter: parseInt(process.env.RL_WORDS_PER_CHAPTER  || '2500', 10),
  wordsPerMonth:   parseInt(process.env.RL_WORDS_PER_MONTH    || '7500', 10),
};

// Demo / unlimited mode — set VITE_KITABI_UNLIMITED=true in .env.local to
// bypass every gate (rate limits, monthly cap, abuse detection). Use ONLY for
// internal demos and testing — never in production.
export const UNLIMITED =
  process.env.VITE_KITABI_UNLIMITED === 'true' ||
  process.env.KITABI_UNLIMITED      === 'true';

if (UNLIMITED) console.warn('[rateLimiter] ⚠ UNLIMITED mode — all rate limits bypassed.');

// ─── Storage ──────────────────────────────────────────────────────────
// buckets: Map<ip, { byAction: Map<action, { minute: {count, windowStart}, hour: {...}, day: {...} }>, lastSeen: number, recentBodies: string[] }>
const buckets = new Map();

// monthlyCounters: Map<ip, { monthKey: 'YYYY-MM', chapters: number, words: number }>
// Resets on calendar-month change. Used for the "3 chapters / 4,500 words per month" cap.
const monthlyCounters = new Map();

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function getMonthlyCounter(ip) {
  const k = monthKey();
  let c = monthlyCounters.get(ip);
  if (!c || c.monthKey !== k) {
    c = { monthKey: k, chapters: 0, words: 0 };
    monthlyCounters.set(ip, c);
  }
  return c;
}

const WINDOW_MS = { minute: 60_000, hour: 3_600_000, day: 86_400_000 };

function getBucket(ip) {
  let b = buckets.get(ip);
  if (!b) {
    b = { byAction: new Map(), lastSeen: Date.now(), recentBodies: [] };
    buckets.set(ip, b);
  }
  b.lastSeen = Date.now();
  return b;
}

function getActionState(bucket, action) {
  let s = bucket.byAction.get(action);
  if (!s) {
    const now = Date.now();
    s = {
      minute: { count: 0, windowStart: now },
      hour:   { count: 0, windowStart: now },
      day:    { count: 0, windowStart: now },
    };
    bucket.byAction.set(action, s);
  }
  return s;
}

function rollWindow(window, ms) {
  const now = Date.now();
  if (now - window.windowStart >= ms) {
    window.count = 0;
    window.windowStart = now;
  }
}

// ─── Public API ───────────────────────────────────────────────────────

/**
 * Check whether `ip` is allowed to perform `action` right now.
 * Does NOT increment — call `increment(ip, action)` only after a successful response.
 *
 * @returns { allowed: true } | { allowed: false, reason, period, used, max, retryAfter }
 */
export function check(ip, action) {
  if (UNLIMITED) return { allowed: true };

  const limits = RATE_LIMITS[action];
  if (!limits) return { allowed: true };  // Unknown action = no limit

  const bucket = getBucket(ip);
  const state  = getActionState(bucket, action);

  for (const period of ['minute', 'hour', 'day']) {
    rollWindow(state[period], WINDOW_MS[period]);
    if (state[period].count >= limits[period]) {
      const retryAfter = Math.ceil(
        (state[period].windowStart + WINDOW_MS[period] - Date.now()) / 1000
      );
      return {
        allowed: false,
        reason: `${period}_limit_exceeded`,
        period,
        used: state[period].count,
        max: limits[period],
        retryAfter,
      };
    }
  }

  return { allowed: true };
}

/**
 * Increment usage for `ip` + `action` across all three windows.
 * Idempotent on the second call within the same millisecond, but typically
 * you call it exactly once per allowed request.
 */
export function increment(ip, action) {
  const limits = RATE_LIMITS[action];
  if (!limits) return;
  const state = getActionState(getBucket(ip), action);
  for (const period of ['minute', 'hour', 'day']) {
    rollWindow(state[period], WINDOW_MS[period]);
    state[period].count++;
  }
}

/**
 * Decrement (refund) one unit — called when a generation fails so the user
 * isn't penalized for a server error. Only refunds the day window since the
 * minute/hour windows are cheap enough that a small over-count is fine.
 */
export function refund(ip, action) {
  const state = getActionState(getBucket(ip), action);
  state.day.count = Math.max(0, state.day.count - 1);
}

/**
 * Check whether `ip` has remaining monthly capacity for chapter generation.
 * Returns the same shape as `check()` for consistency.
 */
export function checkMonthlyChapterCap(ip) {
  if (UNLIMITED) return { allowed: true };

  const c = getMonthlyCounter(ip);
  if (c.chapters >= MONTHLY_CAPS.chapters) {
    // Compute retry-after as seconds until the 1st of next month
    const now  = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0));
    return {
      allowed: false,
      reason: 'month_limit_exceeded',
      period: 'month',
      used: c.chapters,
      max: MONTHLY_CAPS.chapters,
      retryAfter: Math.ceil((next.getTime() - now.getTime()) / 1000),
    };
  }
  return { allowed: true };
}

/**
 * Record a successful chapter generation: increments monthly chapter count
 * and adds the chapter's word count to the monthly word total.
 */
export function recordChapter(ip, wordCount = 0) {
  const c = getMonthlyCounter(ip);
  c.chapters += 1;
  c.words    += wordCount;
}

/**
 * Read monthly usage for `ip` (chapters used / words written this calendar month).
 */
export function getMonthlyUsage(ip) {
  const c = getMonthlyCounter(ip);
  return {
    monthKey: c.monthKey,
    chapters: { used: c.chapters, max: MONTHLY_CAPS.chapters },
    words:    { used: c.words,    max: MONTHLY_CAPS.wordsPerMonth },
    wordsPerChapter: MONTHLY_CAPS.wordsPerChapter,
  };
}

/**
 * Read current usage for `ip` (used by GET /api/usage).
 */
export function getUsage(ip, action) {
  const limits = RATE_LIMITS[action];
  if (!limits) return null;
  const state = getActionState(getBucket(ip), action);
  for (const period of ['minute', 'hour', 'day']) {
    rollWindow(state[period], WINDOW_MS[period]);
  }
  return {
    minute: { used: state.minute.count, max: limits.minute },
    hour:   { used: state.hour.count,   max: limits.hour   },
    day:    { used: state.day.count,    max: limits.day    },
  };
}

// ─── Lightweight abuse detection ──────────────────────────────────────
// Without user accounts, IP is the only signal. Be conservative — only flag
// obvious bot signatures, never auto-suspend (one mobile-carrier NAT can hide
// thousands of legitimate users behind one IP).

const RECENT_BODIES_MAX  = 10;     // remember last N request bodies per IP
const DUPLICATE_THRESHOLD = 4;     // 4 identical bodies in the window = bot
const RAPID_FIRE_MS      = 5_000;  // 3+ requests within 5s = bot
const RAPID_FIRE_THRESH  = 3;
const ABUSE_COOLDOWN_MS  = 5 * 60_000; // 5-minute soft cooldown after flag

const flagged = new Map(); // Map<ip, { until: timestamp, reason: string }>

/**
 * Detect suspicious patterns. Call BEFORE check().
 * @returns { suspicious: false } | { suspicious: true, reason, retryAfter }
 */
export function detectAbuse(ip, bodyHash) {
  if (UNLIMITED) return { suspicious: false };

  // Active cooldown?
  const cd = flagged.get(ip);
  if (cd && cd.until > Date.now()) {
    return {
      suspicious: true,
      reason: cd.reason,
      retryAfter: Math.ceil((cd.until - Date.now()) / 1000),
    };
  }
  if (cd) flagged.delete(ip);

  const bucket = getBucket(ip);
  const now = Date.now();

  // 1. Rapid-fire detection across ALL actions: count requests in last 5s
  const allActions = [...bucket.byAction.values()];
  let recentRequestCount = 0;
  for (const state of allActions) {
    if (now - state.minute.windowStart < RAPID_FIRE_MS) {
      recentRequestCount += state.minute.count;
    }
  }
  if (recentRequestCount >= RAPID_FIRE_THRESH) {
    flagged.set(ip, { until: now + ABUSE_COOLDOWN_MS, reason: 'rapid_fire' });
    return { suspicious: true, reason: 'rapid_fire', retryAfter: ABUSE_COOLDOWN_MS / 1000 };
  }

  // 2. Duplicate-body detection
  if (bodyHash) {
    bucket.recentBodies.push(bodyHash);
    if (bucket.recentBodies.length > RECENT_BODIES_MAX) bucket.recentBodies.shift();
    const dupCount = bucket.recentBodies.filter((h) => h === bodyHash).length;
    if (dupCount >= DUPLICATE_THRESHOLD) {
      flagged.set(ip, { until: now + ABUSE_COOLDOWN_MS, reason: 'duplicate_inputs' });
      return { suspicious: true, reason: 'duplicate_inputs', retryAfter: ABUSE_COOLDOWN_MS / 1000 };
    }
  }

  return { suspicious: false };
}

// ─── Helpers ──────────────────────────────────────────────────────────

/**
 * Hash an arbitrary JSON-stringifiable body to a short string for duplicate detection.
 * Not cryptographic — just a content fingerprint.
 */
export function hashBody(body) {
  try {
    const s = typeof body === 'string' ? body : JSON.stringify(body);
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h) + s.charCodeAt(i);
      h |= 0;
    }
    return String(h);
  } catch {
    return '0';
  }
}

/**
 * Extract the client IP from a node `req`. Honors X-Forwarded-For for proxied
 * environments (Vercel, Cloudflare). Trims to first hop, caps length.
 */
export function getClientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  const ip  = (fwd || req.socket?.remoteAddress || 'unknown').toString();
  return ip.split(',')[0].trim().slice(0, 45);
}

// ─── Periodic cleanup ─────────────────────────────────────────────────
// Drop buckets we haven't seen in 24h to keep memory bounded.
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;  // hourly
const STALE_AGE_MS        = 24 * 60 * 60 * 1000;
setInterval(() => {
  const cutoff = Date.now() - STALE_AGE_MS;
  for (const [ip, bucket] of buckets) {
    if (bucket.lastSeen < cutoff) buckets.delete(ip);
  }
  for (const [ip, cd] of flagged) {
    if (cd.until < Date.now()) flagged.delete(ip);
  }
}, CLEANUP_INTERVAL_MS).unref?.();
