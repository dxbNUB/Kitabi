/**
 * Monthly spend-cap enforcement.
 * Refuses generations when cumulative estimated cost exceeds MONTHLY_SPEND_CAP_USD.
 *
 * Cost estimation is rough. Actual billing comes from Anthropic's invoice;
 * this exists only as a safety net to stop a runaway loop from draining the
 * card before a human notices.
 *
 * TODO(production): persist to Redis or a small KV so the counter survives
 * server restarts. In-memory counter resets at every deploy, which could let
 * a bad actor skirt the cap by waiting for redeploys.
 */

// Pricing (USD per million tokens) for the models we use.
// Source: anthropic.com/pricing — keep in sync.
const PRICING = {
  'claude-opus-4-7':       { input: 15.00, output: 75.00 },
  'claude-sonnet-4-6':     { input:  3.00, output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 1.00, output:  5.00 },
};

const CAP_USD = parseFloat(process.env.MONTHLY_SPEND_CAP_USD || '200');

const UNLIMITED =
  process.env.VITE_KITABI_UNLIMITED === 'true' ||
  process.env.KITABI_UNLIMITED      === 'true';

// counter: { monthKey: 'YYYY-MM', spent: number }
let counter = { monthKey: monthKey(), spent: 0 };

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function rollIfNewMonth() {
  const k = monthKey();
  if (counter.monthKey !== k) {
    counter = { monthKey: k, spent: 0 };
  }
}

/**
 * Estimate the cost of a single API call given model + token counts.
 * Used as a pre-flight check (with conservative output estimate) and again
 * after the response with the actual usage.
 */
export function estimateCost(model, inputTokens, outputTokens) {
  const p = PRICING[model];
  if (!p) return 0;
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

/**
 * Pre-flight check: would processing this request push us past the cap?
 * @param {string} model
 * @param {number} estInputTokens — best estimate from system prompt + messages
 * @param {number} estOutputTokens — max_tokens worst case
 * @returns { allowed, spent, cap, projected, percent }
 */
export function checkCap(model, estInputTokens, estOutputTokens) {
  if (UNLIMITED) {
    return { allowed: true, spent: 0, cap: Infinity, projected: 0, percent: 0 };
  }
  rollIfNewMonth();
  const projected = counter.spent + estimateCost(model, estInputTokens, estOutputTokens);
  return {
    allowed: projected <= CAP_USD,
    spent: counter.spent,
    cap: CAP_USD,
    projected,
    percent: Math.round((projected / CAP_USD) * 100),
  };
}

/**
 * Record actual spend after a completed generation.
 */
export function recordSpend(model, inputTokens, outputTokens) {
  rollIfNewMonth();
  const cost = estimateCost(model, inputTokens, outputTokens);
  counter.spent += cost;

  // Warn at 80/90/95% so ops sees it in logs before the wall.
  const pct = (counter.spent / CAP_USD) * 100;
  if (pct >= 95) console.warn(`[spendCap] ⚠ 95%+ of monthly cap used: $${counter.spent.toFixed(2)}/$${CAP_USD}`);
  else if (pct >= 90) console.warn(`[spendCap] 90%+ of monthly cap used: $${counter.spent.toFixed(2)}/$${CAP_USD}`);
  else if (pct >= 80) console.warn(`[spendCap] 80%+ of monthly cap used: $${counter.spent.toFixed(2)}/$${CAP_USD}`);

  return cost;
}

/**
 * Read current spend (for /api/usage).
 */
export function getSpend() {
  rollIfNewMonth();
  return {
    spent: Number(counter.spent.toFixed(4)),
    cap: CAP_USD,
    percent: Math.round((counter.spent / CAP_USD) * 100),
    monthKey: counter.monthKey,
  };
}
