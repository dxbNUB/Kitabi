/**
 * POST /api/rewrite
 *  body: { text: string, mode: 'rewrite'|'expand'|'condense'|'improve', genre?: string }
 *  returns: { text: string }
 *
 * Used by the editor's AI tools. Rate-limited under the same 'analyze' bucket
 * (similar cost profile, light text-in / text-out).
 */
import Anthropic from '@anthropic-ai/sdk';
import { check, increment, detectAbuse, getClientIp, hashBody } from './lib/rateLimiter.js';
import { checkCap, recordSpend } from './lib/spendCap.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1500;

const MIN_TEXT = 4;
const MAX_TEXT = 4000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODE_PROMPTS = {
  rewrite:
    'Rewrite the following passage. Keep the meaning and viewpoint the same, but ' +
    'sharpen the prose: stronger verbs, more specific nouns, tighter rhythm. ' +
    'Show more, tell less. Preserve the original length within 10%. ' +
    'Output ONLY the rewritten passage — no preamble, no explanation, no quote marks.',
  expand:
    'Expand the following passage. Add sensory specificity, internal beats, and ' +
    'one fresh detail that earns its place. Preserve voice and tense. Roughly 60-100% longer. ' +
    'Output ONLY the expanded passage.',
  condense:
    'Condense the following passage. Cut filler, hedges, and redundancy. ' +
    'Keep every concrete detail and the emotional beat. Roughly 30-50% shorter. ' +
    'Output ONLY the condensed passage.',
  improve:
    'Improve the following passage on craft fundamentals: replace told emotion with ' +
    'shown action, replace generic sensory details with specific ones, vary sentence length, ' +
    'cut adverbs. Preserve length within 15% and voice exactly. ' +
    'Output ONLY the improved passage.',
};

function send429(res, info) {
  res.setHeader('Retry-After', String(info.retryAfter || 60));
  return res.status(429).json({
    error: 'rate_limit_exceeded',
    reason: info.reason,
    retryAfter: info.retryAfter,
    message: 'Wait a moment and try again.',
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);

  const abuse = detectAbuse(ip, hashBody(req.body));
  if (abuse.suspicious) return send429(res, abuse);

  const rl = check(ip, 'analyze');
  if (!rl.allowed) return send429(res, rl);

  const { text, mode = 'rewrite', genre } = req.body || {};
  if (!text || typeof text !== 'string' || text.trim().length < MIN_TEXT) {
    return res.status(400).json({ error: 'Selection too short.' });
  }
  if (text.length > MAX_TEXT) {
    return res.status(400).json({ error: 'Selection too long. Pick a shorter passage.' });
  }
  if (!MODE_PROMPTS[mode]) {
    return res.status(400).json({ error: 'Unknown mode.' });
  }

  const systemPrompt = `You are a master writing craftsman. ${MODE_PROMPTS[mode]}
${genre ? `\nGenre context: ${genre}.` : ''}
Never use literary jargon. Never explain your edits. Output is the prose only.`;

  const cap = checkCap(MODEL, Math.ceil((systemPrompt.length + text.length) / 4), MAX_TOKENS);
  if (!cap.allowed) {
    return send429(res, { reason: 'spend_cap_reached', retryAfter: 3600 });
  }

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    });

    const out = response.content?.[0]?.text?.trim() || '';
    increment(ip, 'analyze');
    recordSpend(MODEL, response.usage?.input_tokens || 0, response.usage?.output_tokens || 0);

    return res.status(200).json({ text: out });
  } catch (err) {
    console.error('Rewrite API error:', err.message);
    return res.status(500).json({ error: 'AI request failed. Try again.' });
  }
}
