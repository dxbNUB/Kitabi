import Anthropic from '@anthropic-ai/sdk';
import {
  assembleSystemPrompt,
  buildContextSummary,
  CHAPTER_GENERATION_INSTRUCTIONS,
} from '../src/prompts/index.js';
import {
  check, increment, refund, detectAbuse, getClientIp, hashBody,
  checkMonthlyChapterCap, recordChapter,
} from './lib/rateLimiter.js';
import { checkCap, recordSpend } from './lib/spendCap.js';
import { languageInstructions, bookTypeInstructions, getBookTypeWordTarget } from './lib/preferences.js';

const MODEL = 'claude-opus-4-7';
const MAX_TOKENS = 4096;

const MAX_PREMISE_CHARS    = 5000;
const MIN_PREMISE_CHARS    = 10;
const MAX_SUMMARY_CHARS    = 8000;
const MAX_CHARACTERS_LIST  = 30;
const MAX_PLOT_POINTS      = 50;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function send429(res, info) {
  res.setHeader('Retry-After', String(info.retryAfter || 60));
  return res.status(429).json({
    error: info.reason === 'day_limit_exceeded' ? 'limit_reached' : 'rate_limit_exceeded',
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
    case 'minute_limit_exceeded':    return 'One chapter at a time. Wait a moment before generating again.';
    case 'hour_limit_exceeded':      return `Hourly limit reached (${info.max}). Try again in ${Math.ceil((info.retryAfter || 60) / 60)} minute(s).`;
    case 'day_limit_exceeded':       return "You've used today's chapters. Resets at midnight UTC.";
    case 'month_limit_exceeded':     return `You've used your ${info.max} free chapters this month. Upgrade to Author for 25 chapters/month.`;
    case 'rapid_fire':               return 'Too many requests, too fast. Cooling down for 5 minutes.';
    case 'duplicate_inputs':         return 'Detected repeated identical requests. Cooling down for 5 minutes.';
    case 'spend_cap_reached':        return 'Generation is temporarily unavailable. Please try again later.';
    default:                         return 'Rate limit exceeded.';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = getClientIp(req);

  // ─── Abuse detection ────────────────────────────────────────────────
  const bodyHash = hashBody(req.body);
  const abuse = detectAbuse(ip, bodyHash);
  if (abuse.suspicious) return send429(res, abuse);

  // ─── Rate limit (rolling minute/hour/day windows) ─────────────────────
  const rl = check(ip, 'generate');
  if (!rl.allowed) return send429(res, rl);

  // ─── Monthly cap (calendar month, the actual free-tier promise) ──────
  const monthly = checkMonthlyChapterCap(ip);
  if (!monthly.allowed) {
    // Surface as 'limit_reached' to keep the existing client waitlist trigger
    return send429(res, { ...monthly, reason: 'month_limit_exceeded' });
  }

  // ─── Input validation ───────────────────────────────────────────────
  const {
    genre, mode, sessionContext, conversationSummary,
    language = 'american',
    bookType = 'novel',
    chapterNumber = 1,
  } = req.body || {};
  const { project = {}, characters = [], plotPoints = [] } = sessionContext || {};

  if (project.premise && typeof project.premise === 'string') {
    if (project.premise.length < MIN_PREMISE_CHARS) {
      return res.status(400).json({ error: 'Premise too short' });
    }
    if (project.premise.length > MAX_PREMISE_CHARS) {
      return res.status(400).json({ error: 'Premise too long' });
    }
  }
  if (typeof conversationSummary === 'string' && conversationSummary.length > MAX_SUMMARY_CHARS) {
    return res.status(400).json({ error: 'Conversation summary too long' });
  }
  if (Array.isArray(characters) && characters.length > MAX_CHARACTERS_LIST) {
    return res.status(400).json({ error: 'Too many characters in session' });
  }
  if (Array.isArray(plotPoints) && plotPoints.length > MAX_PLOT_POINTS) {
    return res.status(400).json({ error: 'Too many plot points in session' });
  }

  const systemPrompt = [
    assembleSystemPrompt(genre, mode || 'nonwriter', buildContextSummary(sessionContext || {})),
    CHAPTER_GENERATION_INSTRUCTIONS,
    languageInstructions(language),
    bookTypeInstructions(bookType, chapterNumber),
  ].join('\n\n');

  const wordTarget = getBookTypeWordTarget(bookType);

  const generationMessage = `Write Chapter 1 based on everything we've discussed.

PROJECT:
Title (working): ${project.title || 'Untitled'}
Premise: ${project.premise || 'As discussed in conversation'}
Genre: ${genre}

CHARACTERS:
${characters.length
  ? characters.map(c => `- ${c.name}: ${c.role}. ${c.trait}. Arc: ${c.arc}`).join('\n')
  : 'As discussed in conversation.'}

KEY PLOT POINTS:
${plotPoints.length ? plotPoints.map(p => `- ${p}`).join('\n') : 'As discussed.'}

CONVERSATION SUMMARY:
${conversationSummary || 'Generate based on session context above.'}

Write Chapter 1 now. Target approximately ${wordTarget} words (matches the chosen book type). Make the opening hook impossible to put down.`;

  // ─── Spend cap pre-flight ───────────────────────────────────────────
  const estInputTokens  = Math.ceil((systemPrompt.length + generationMessage.length) / 4);
  const cap = checkCap(MODEL, estInputTokens, MAX_TOKENS);
  if (!cap.allowed) {
    return send429(res, { reason: 'spend_cap_reached', period: 'month', retryAfter: 3600 });
  }

  // ─── Stream + count usage ───────────────────────────────────────────
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`data: ${JSON.stringify({ type: 'start' })}\n\n`);

    // Reserve the slot up-front; refund on error.
    increment(ip, 'generate');

    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: generationMessage }],
    });

    let inTokens = 0;
    let outTokens = 0;
    let outputText = '';   // accumulated for accurate word count
    for await (const event of stream) {
      if (event.type === 'message_start' && event.message?.usage) {
        inTokens = event.message.usage.input_tokens || 0;
      }
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        outputText += event.delta.text;
        res.write(`data: ${JSON.stringify({ type: 'delta', delta: event.delta.text })}\n\n`);
      }
      if (event.type === 'message_delta' && event.usage) {
        outTokens = event.usage.output_tokens || outTokens;
      }
    }

    const wordCount = outputText.trim().split(/\s+/).filter(Boolean).length;
    recordChapter(ip, wordCount);
    recordSpend(MODEL, inTokens, outTokens);

    res.write(`data: ${JSON.stringify({ type: 'done', wordCount })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Generate error:', err.message);
    refund(ip, 'generate');  // give the slot back so user isn't penalized for our failure
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chapter generation failed. Your free attempt has been refunded.' });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }
}
