import Anthropic from '@anthropic-ai/sdk';
import { assembleSystemPrompt, buildContextSummary } from '../src/prompts/index.js';
import { check, increment, detectAbuse, getClientIp, hashBody } from './lib/rateLimiter.js';
import { checkCap, recordSpend } from './lib/spendCap.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 1024;

// Hard input limits — anything past these is rejected before we hit Anthropic.
const MAX_MESSAGE_CHARS  = 8000;
const MAX_HISTORY_LENGTH = 50;

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
    case 'minute_limit_exceeded':    return 'Slow down. Wait a minute before sending again.';
    case 'hour_limit_exceeded':      return `Hourly limit reached (${info.max}). Try again in ${Math.ceil((info.retryAfter || 60) / 60)} minute(s).`;
    case 'day_limit_exceeded':       return `Daily limit reached (${info.max}). Resets in ${Math.ceil((info.retryAfter || 86400) / 3600)} hour(s).`;
    case 'rapid_fire':               return 'Too many requests, too fast. Cooling down for 5 minutes.';
    case 'duplicate_inputs':         return 'Detected repeated identical requests. Cooling down for 5 minutes.';
    case 'spend_cap_reached':        return 'Service is temporarily unavailable due to budget controls. Please try again later.';
    default:                         return 'Rate limit exceeded. Please slow down.';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);

  // ─── Layer: Abuse detection (before counting) ───────────────────────
  const bodyHash = hashBody(req.body);
  const abuse = detectAbuse(ip, bodyHash);
  if (abuse.suspicious) return send429(res, abuse);

  // ─── Layer: Rate limit ──────────────────────────────────────────────
  const rl = check(ip, 'chat');
  if (!rl.allowed) return send429(res, rl);

  // ─── Layer: Input validation ────────────────────────────────────────
  const { messages, genre, mode, sessionContext } = req.body || {};

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages must be an array' });
  }
  if (messages.length === 0) {
    return res.status(400).json({ error: 'messages cannot be empty' });
  }
  if (messages.length > MAX_HISTORY_LENGTH) {
    return res.status(400).json({ error: `Conversation too long (max ${MAX_HISTORY_LENGTH} messages)` });
  }

  const sanitized = messages
    .filter(m => m.role && m.content && typeof m.content === 'string')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }));

  if (sanitized.length === 0) {
    return res.status(400).json({ error: 'No valid messages in payload' });
  }

  const systemPrompt = assembleSystemPrompt(
    genre || null,
    mode || 'nonwriter',
    buildContextSummary(sessionContext || {})
  );

  // ─── Layer: Spend cap pre-flight ────────────────────────────────────
  // Rough token estimate: 4 chars ≈ 1 token. Underestimating input is fine
  // because we'll record actual usage after the response.
  const estInputTokens  = Math.ceil((systemPrompt.length + sanitized.reduce((n, m) => n + m.content.length, 0)) / 4);
  const cap = checkCap(MODEL, estInputTokens, MAX_TOKENS);
  if (!cap.allowed) {
    return send429(res, { reason: 'spend_cap_reached', period: 'month', retryAfter: 3600 });
  }

  // ─── Stream ─────────────────────────────────────────────────────────
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: sanitized,
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

    increment(ip, 'chat');
    recordSpend(MODEL, inTokens, outTokens);

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat API error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Generation failed. Try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
}
