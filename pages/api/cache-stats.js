/**
 * pages/api/cache-stats.js
 *
 * Returns live cache statistics. Useful for monitoring how well
 * the cache is performing and which jobs are being looked up most.
 *
 * Protected by a simple STATS_SECRET env var — set it in Vercel,
 * then hit: GET /api/cache-stats?key=your_secret
 *
 * If STATS_SECRET is not set, the endpoint is open (fine for dev).
 */

import { getStats } from "@/lib/cache";

export default function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "GET only" });

  const secret = process.env.STATS_SECRET;
  if (secret && req.query.key !== secret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json(getStats());
}
