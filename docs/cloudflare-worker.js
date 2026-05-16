/**
 * docs/cloudflare-worker.js
 *
 * Drop-in Cloudflare Worker replacement for pages/api/analyze.js
 * Deploy to Cloudflare Workers (free: 100,000 req/day)
 *
 * Setup:
 *   1. wrangler secret put GROQ_API_KEY
 *   2. wrangler deploy
 *   3. Update ALLOWED_ORIGINS below to your Cloudflare Pages URL
 *
 * Uses Cloudflare KV for distributed rate limiting (optional).
 */

const ALLOWED_ORIGINS = ["https://your-app.pages.dev"];
const GROQ_URL        = "https://api.groq.com/openai/v1/chat/completions";
const MODEL           = "llama-3.1-8b-instant";

// In-KV rate limit using Cloudflare KV (bind a KV namespace called RATE_LIMIT)
async function checkLimit(ip, env) {
  const key = `rl:${ip}`;
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = 5;

  const raw = await env.RATE_LIMIT?.get(key);
  const times = raw ? JSON.parse(raw).filter(t => t > now - windowMs) : [];
  if (times.length >= limit) return false;

  times.push(now);
  await env.RATE_LIMIT?.put(key, JSON.stringify(times), { expirationTtl: 660 });
  return true;
}

// Same injection patterns as lib/sanitize.js
const INJECTION = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /you\s+are\s+now\s+(a|an)/i,
  /jailbreak|DAN\b/i,
  /bypass\s+(safety|filter)/i,
  /system\s*prompt.{0,30}ignore/i,
];

function sanitize(s) {
  if (!s || typeof s !== "string") return null;
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").trim();
  for (const p of INJECTION) if (p.test(s)) return null;
  return s.slice(0, 1200);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsOk = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.length === 0;

    const corsHeaders = {
      "Access-Control-Allow-Origin":  corsOk ? origin : "",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST")    return new Response("Method not allowed", { status: 405 });

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const allowed = await checkLimit(ip, env);
    if (!allowed) return Response.json({ error: "Too many requests. Please wait." }, { status: 429, headers: corsHeaders });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

    const jobTitle = sanitize(body.jobTitle);
    const workDesc = sanitize(body.workDesc || "") || "";
    if (!jobTitle) return Response.json({ error: "Invalid job title." }, { status: 400 });

    const userMsg = workDesc
      ? `Job: ${jobTitle}\n\nWork context: ${workDesc}`
      : `Analyze AI exposure for: ${jobTitle}`;

    const groqRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: MODEL, max_tokens: 900, temperature: 0.1,
        messages: [
          { role: "system", content: "/* same SYSTEM_PROMPT as in pages/api/analyze.js */" },
          { role: "user",   content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!groqRes.ok) return Response.json({ error: "Analysis service error." }, { status: 502, headers: corsHeaders });

    const data = await groqRes.json();
    const raw  = data?.choices?.[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(raw);
      return Response.json(parsed, { headers: corsHeaders });
    } catch {
      return Response.json({ error: "Parse error." }, { status: 500, headers: corsHeaders });
    }
  },
};
