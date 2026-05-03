/**
 * GET /api/usage — returns current rate-limit usage for the requesting IP.
 * Used by the client to display "X of Y chapters used today" without auth.
 *
 * When Firebase auth lands, swap the IP key in the limiter for `${userId}`
 * and this endpoint becomes per-user automatically.
 */
import { getUsage, getMonthlyUsage, getClientIp } from './lib/rateLimiter.js';
import { getSpend } from './lib/spendCap.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const ip = getClientIp(req);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    ip:       ip,
    chat:     getUsage(ip, 'chat'),
    generate: getUsage(ip, 'generate'),
    analyze:  getUsage(ip, 'analyze'),
    monthly:  getMonthlyUsage(ip),     // chapters & words this calendar month
    // Spend info is global (not per-IP) but useful for showing "service degraded" state.
    spend: getSpend(),
  });
}
