/**
 * lib/cache.js
 *
 * In-memory LRU cache with TTL for job analysis results.
 *
 * Strategy:
 *   - Generic (no work description) → cache for 7 days, shared across all users
 *   - Personalized (work description given) → never cached (unique to user)
 *   - Max 600 entries — covers virtually every common job title
 *   - LRU eviction: oldest-accessed entry dropped when cap is reached
 *   - Survives across requests on same serverless instance
 *
 * Upgrade path → Upstash Redis (see README):
 *   Replace this module with the Upstash adapter for cross-instance persistence.
 */

const MAX_ENTRIES  = 600;
const TTL_MS       = 7 * 24 * 60 * 60 * 1000;   // 7 days

/**
 * LRU node structure stored in the Map.
 * @typedef {{ result: object, storedAt: number, hits: number }} CacheEntry
 */

/** @type {Map<string, CacheEntry>} */
const store = new Map();

// ─── Stats (exposed via /api/cache-stats) ─────────────────────────────────
let totalHits   = 0;
let totalMisses = 0;

// ─── LRU eviction helper ──────────────────────────────────────────────────
function evictOldest() {
  // Map preserves insertion order; first key = oldest
  const firstKey = store.keys().next().value;
  if (firstKey !== undefined) store.delete(firstKey);
}

// ─── Prune expired entries (called occasionally) ───────────────────────────
function pruneExpired() {
  const cutoff = Date.now() - TTL_MS;
  for (const [key, entry] of store.entries()) {
    if (entry.storedAt < cutoff) store.delete(key);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Retrieve a cached result.
 * @param {string} cacheKey - Normalized job title key
 * @returns {{ result: object, hits: number } | null}
 */
export function get(cacheKey) {
  const entry = store.get(cacheKey);
  if (!entry) { totalMisses++; return null; }

  // Expired?
  if (Date.now() - entry.storedAt > TTL_MS) {
    store.delete(cacheKey);
    totalMisses++;
    return null;
  }

  // LRU refresh: re-insert at end so it's not evicted as "oldest"
  store.delete(cacheKey);
  entry.hits++;
  store.set(cacheKey, entry);

  totalHits++;
  return { result: entry.result, hits: entry.hits };
}

/**
 * Store a result in the cache.
 * @param {string} cacheKey
 * @param {object} result - The validated analysis object
 */
export function set(cacheKey, result) {
  // Occasionally prune expired entries
  if (Math.random() < 0.02) pruneExpired();

  // Evict if at capacity
  if (store.size >= MAX_ENTRIES) evictOldest();

  store.set(cacheKey, {
    result,
    storedAt: Date.now(),
    hits: 0,
  });
}

/**
 * Get cache statistics (for the /api/cache-stats endpoint).
 */
export function getStats() {
  const now   = Date.now();
  const valid = [...store.values()].filter(e => now - e.storedAt <= TTL_MS);
  const top   = [...store.entries()]
    .filter(([, e]) => now - e.storedAt <= TTL_MS)
    .sort(([, a], [, b]) => b.hits - a.hits)
    .slice(0, 10)
    .map(([key, e]) => ({
      job: key,
      hits: e.hits,
      cachedAgo: Math.round((now - e.storedAt) / 60000) + " min ago",
    }));

  return {
    totalEntries:     valid.length,
    maxEntries:       MAX_ENTRIES,
    fillPercent:      Math.round((valid.length / MAX_ENTRIES) * 100),
    ttlDays:          TTL_MS / 86400000,
    totalHits,
    totalMisses,
    hitRate:          totalHits + totalMisses > 0
      ? Math.round((totalHits / (totalHits + totalMisses)) * 100) + "%"
      : "0%",
    topJobs:          top,
  };
}
