import Anthropic from '@anthropic-ai/sdk';
import { ANALYZE_SYSTEM_PROMPT } from '../src/prompts/index.js';
import { check, increment, detectAbuse, getClientIp, hashBody } from './lib/rateLimiter.js';
import { checkCap, recordSpend } from './lib/spendCap.js';
import { getRequestUser } from './lib/auth.js';

const MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 3000;

const MIN_CHAPTER_CHARS = 100;
const MAX_CHAPTER_CHARS = 12000;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function send429(res, info) {
  res.setHeader('Retry-After', String(info.retryAfter || 60));
  return res.status(429).json({
    error: 'rate_limit_exceeded',
    reason: info.reason,
    period: info.period,
    used:   info.used,
    max:    info.max,
    retryAfter: info.retryAfter,
    message: friendlyMessage(info),
  });
}

function friendlyMessage(info) {
  switch (info.reason) {
    case 'minute_limit_exceeded':    return 'Wait a minute before running another analysis.';
    case 'hour_limit_exceeded':      return `Hourly analysis limit reached (${info.max}). Try again in ${Math.ceil((info.retryAfter || 60) / 60)} minute(s).`;
    case 'day_limit_exceeded':       return `Daily analysis limit reached (${info.max}).`;
    case 'rapid_fire':               return 'Too many requests, too fast. Cooling down for 5 minutes.';
    case 'duplicate_inputs':         return 'Detected repeated identical requests. Cooling down for 5 minutes.';
    case 'spend_cap_reached':        return 'Analysis is temporarily unavailable. Please try again later.';
    default:                         return 'Rate limit exceeded.';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);
  const requester = await getRequestUser(req);

  if (!requester.isAdmin) {
    const bodyHash = hashBody(req.body);
    const abuse = detectAbuse(ip, bodyHash);
    if (abuse.suspicious) return send429(res, abuse);

    const rl = check(ip, 'analyze');
    if (!rl.allowed) return send429(res, rl);
  }

  // ─── Input validation ───────────────────────────────────────────────
  const { chapterText, genre } = req.body || {};

  if (!chapterText || typeof chapterText !== 'string' || chapterText.trim().length < MIN_CHAPTER_CHARS) {
    return res.status(400).json({ error: `Chapter text is required (minimum ${MIN_CHAPTER_CHARS} characters).` });
  }
  if (chapterText.length > MAX_CHAPTER_CHARS * 2) {
    return res.status(400).json({ error: `Chapter text too long (max ${MAX_CHAPTER_CHARS * 2} characters).` });
  }

  const trimmed = chapterText.slice(0, MAX_CHAPTER_CHARS);
  const genreNote = genre ? `\nGenre: ${genre}\n` : '';
  const userMessage = `${genreNote}\nPlease analyze this chapter:\n\n---\n${trimmed}\n---`;

  // ─── Spend cap (admin bypass) ───────────────────────────────────────
  if (!requester.isAdmin) {
    const estInputTokens  = Math.ceil((ANALYZE_SYSTEM_PROMPT.length + userMessage.length) / 4);
    const cap = checkCap(MODEL, estInputTokens, MAX_TOKENS);
    if (!cap.allowed) {
      return send429(res, { reason: 'spend_cap_reached', period: 'month', retryAfter: 3600 });
    }
  }

  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: ANALYZE_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    let inTokens = 0;
    let outTokens = 0;
    for await (const event of stream) {
      if (event.type === 'message_start' && event.message?.usage) {
        inTokens = event.message.usage.input_tokens || 0;
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
      if (event.type === 'message_delta' && event.usage) {
        outTokens = event.usage.output_tokens || outTokens;
      }
    }

    if (!requester.isAdmin) {
      increment(ip, 'analyze');
      recordSpend(MODEL, inTokens, outTokens);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Analyze API error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
