/**
 * lib/rateLimit.js
 *
 * Simple in-process sliding-window rate limiter.
 * Works for a single serverless instance; for multi-region Vercel Pro
 * swap the Map for Upstash Redis (see README for upgrade path).
 *
 * Limits:
 *   - 5 requests per IP per 10 minutes  (burst protection)
 *   - 30 requests per IP per 24 hours   (daily cap)
 */

const WINDOW_SHORT_MS  = 10 * 60 * 1000;   // 10 minutes
const LIMIT_SHORT      = 5;                 // max 5 requests per 10 min

const WINDOW_LONG_MS   = 24 * 60 * 60 * 1000; // 24 hours
const LIMIT_LONG       = 30;                // max 30 requests per day

// { ip -> [timestamp, timestamp, ...] }
const shortMap = new Map();
const longMap  = new Map();

function prune(map, windowMs) {
  const cutoff = Date.now() - windowMs;
  for (const [key, times] of map.entries()) {
    const pruned = times.filter(t => t > cutoff);
    if (pruned.length === 0) map.delete(key);
    else map.set(key, pruned);
  }
}

export function checkRateLimit(ip) {
  const now = Date.now();

  // Prune expired entries periodically
  if (Math.random() < 0.05) {
    prune(shortMap, WINDOW_SHORT_MS);
    prune(longMap,  WINDOW_LONG_MS);
  }

  // Short window check
  const shortTimes = (shortMap.get(ip) || []).filter(t => t > now - WINDOW_SHORT_MS);
  if (shortTimes.length >= LIMIT_SHORT) {
    const retryAfterMs = WINDOW_SHORT_MS - (now - shortTimes[0]);
    return {
      allowed: false,
      reason: "too_many_requests_short",
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      message: `Too many requests. Please wait ${Math.ceil(retryAfterMs / 60000)} minute(s) before trying again.`,
    };
  }

  // Long window check
  const longTimes = (longMap.get(ip) || []).filter(t => t > now - WINDOW_LONG_MS);
  if (longTimes.length >= LIMIT_LONG) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
      retryAfterSeconds: 3600,
      message: "Daily analysis limit reached. Please try again tomorrow.",
    };
  }

  // Record the request
  shortMap.set(ip, [...shortTimes, now]);
  longMap.set(ip,  [...longTimes,  now]);

  return {
    allowed: true,
    remaining: LIMIT_SHORT - shortTimes.length - 1,
  };
}
