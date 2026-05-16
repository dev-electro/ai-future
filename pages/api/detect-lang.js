/**
 * pages/api/detect-lang.js
 * Returns the best language code for the requesting IP.
 * Uses ipapi.co (free, no key needed, 1000 req/day).
 */
import { COUNTRY_LANG, SUPPORTED_LANGS } from "@/lib/i18n";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "public, max-age=86400"); // cache 1 day per IP

  // Get client IP
  const ip =
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "";

  // Localhost / private IP → default to English
  const isLocal = !ip || ip === "127.0.0.1" || ip.startsWith("192.168") || ip.startsWith("10.");
  if (isLocal) return res.status(200).json({ lang: "en", country: "US", source: "local" });

  try {
    const geo = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { "User-Agent": "ai-exposure-index/1.0" },
      signal: AbortSignal.timeout(3000),
    });
    if (!geo.ok) throw new Error(`ipapi ${geo.status}`);
    const data = await geo.json();
    const country = data.country_code || "";
    const lang = COUNTRY_LANG[country] || "en";
    return res.status(200).json({ lang, country, source: "ip" });
  } catch {
    // On failure, silently fall back to English
    return res.status(200).json({ lang: "en", country: null, source: "fallback" });
  }
}
