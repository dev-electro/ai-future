/**
 * pages/api/analyze.js — Edge Runtime
 *
 * Runs on Vercel Edge (30s timeout on Hobby, vs 10s for Serverless).
 * Uses the Web Request/Response API instead of Node.js IncomingMessage/ServerResponse.
 *
 * Flow:
 *   1. CORS + method guard
 *   2. Rate limit per IP (module-level Map, per-isolate)
 *   3. Validate + sanitize inputs
 *   4. Normalize job title → cache key
 *   5. Cache lookup (module-level LRU, per-isolate)
 *   6. Call Gemini → OpenRouter fallback chain (lib/llm.js)
 *   7. Validate schema, inject Anthropic research scores, cache, return
 */

export const config = { runtime: 'edge' };

import { validateJobTitle, validateWorkDesc } from "@/lib/sanitize";
import { get as cacheGet, set as cacheSet } from "@/lib/cache";
import { getCacheKey, getDisplayTitle, getCanonicalDisplayName, isMapped } from "@/lib/normalizeJob";
import { fetchWithFallback } from "@/lib/llm";
import { getAnthropicScore, getExposureLevel } from "@/lib/anthropicScores";

// ─── Simple in-isolate rate limiter ──────────────────────────────────────────
const RL_WINDOW_MS = 60_000;
const RL_MAX = 10;
const rlMap = new Map(); // ip → { count, windowStart }

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rlMap.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RL_WINDOW_MS) {
    entry.count = 0; entry.windowStart = now;
  }
  entry.count++;
  rlMap.set(ip, entry);
  const remaining = Math.max(0, RL_MAX - entry.count);
  if (entry.count > RL_MAX) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.windowStart + RL_WINDOW_MS - now) / 1000), message: "Too many requests. Please wait a minute." };
  }
  return { allowed: true, remaining };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function getIP(req) {
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

// ─── System prompt ────────────────────────────────────────────────────────────
// Ultra-compressed: ~250 tokens vs old ~800. Same schema, same accuracy.
// Principle: model knows labor economics — only need calibration data + strict output contract.
const SYSTEM_PROMPT = `Labor economist AI. Analyze AI exposure for any job using Anthropic 2026 research + O*NET + BLS data.

CALIBRATION (exposure_score reference):
Very High(75-100): Programmers 92, Customer Service 88, Data Entry 87, Tax Preparers 82, Financial Analysts 80, Paralegals 78.
High(50-74): Software Engineers 65, Technical Writers 64, Editors 62, Accountants 55.
Moderate(20-49): Lawyers 45, Marketers 40, Designers 35, Nurses 28, Physicians 25, Teachers 22.
Low(5-19): Social Workers 18, Electricians 6, Plumbers 5.
Minimal(0-4): Cooks, Mechanics, Agricultural workers.
Key facts: AI hits white-collar first. Every 10pp exposure→0.6pp lower BLS growth. No mass unemployment yet; 14% hiring drop for ages 22-25 in exposed roles.

RULES:
- Return ONLY valid JSON matching schema below. No markdown/backticks/extra text.
- Non-job input→ {"error":"off_topic"} only, all other fields 0/null/"".
- Strings: <120 chars. Arrays: max 3 items. Timeline: exactly 3 phases.
- Be specific: name exact tools/certs/platforms. No generic advice.
- Enums: exposure_level=Very High|High|Moderate|Low|Minimal. bls_growth_direction=Growing|Declining|Flat. augmentation_potential=High|Medium|Low. timeline_risk=Imminent|Likely|Possible|Unlikely. o_ring_vulnerability=High|Medium|Low. urgency_level=Act Now|Upskill Fast|Monitor & Prepare|Stay Sharp. skill_overlap=High|Medium|Low.

SCHEMA:
{"job_title":"","personalized":false,"exposure_score":0,"exposure_level":"Minimal","coverage_estimate":"","score_adjustment_note":"","key_tasks_at_risk":[""],"protected_tasks":[""],"automation_vs_augmentation":"","bls_growth_outlook":"","bls_growth_direction":"Flat","displacement_evidence":"","young_worker_note":"","category":"","insight":"","key_protection_factor":"","comparison_jobs":[""],"augmentation_potential":"Medium","timeline_risk":"Unlikely","wage_percentile_context":"","o_ring_vulnerability":"Low","career_action_plan":{"urgency_level":"Stay Sharp","urgency_reason":"","progressive_timeline":[{"timeframe":"0-6 Months","focus":"","milestones":[""],"tools_to_learn":[""],"projects":[""]},{"timeframe":"6-18 Months","focus":"","milestones":[""],"tools_to_learn":[""],"projects":[""]},{"timeframe":"1-3 Years","focus":"","milestones":[""],"tools_to_learn":[""],"projects":[""]}],"stay_and_adapt":{"headline":"","specializations":[{"name":"","why_safe":"","example":""}],"skills_to_build":[{"skill":"","urgency":"Immediate","why":""}],"positioning_move":""},"lateral_moves":[{"title":"","exposure_score":0,"bls_growth":"","skill_overlap":"High","transition_time":"","why_sustainable":"","bridge_skill":""}],"bold_pivot":[{"title":"","domain":"","exposure_score":0,"bls_growth":"","why_transferable":"","first_step":""}],"avoid_these_moves":[""]},"error":null}`;

// ─── Schema validator ─────────────────────────────────────────────────────────
const REQUIRED_FIELDS = [
  "job_title", "exposure_score", "exposure_level", "coverage_estimate",
  "key_tasks_at_risk", "protected_tasks", "bls_growth_direction", "category",
  "insight", "key_protection_factor", "comparison_jobs", "timeline_risk",
  "career_action_plan",
];

function validateResponse(obj) {
  if (typeof obj !== "object" || obj === null) return false;
  for (const f of REQUIRED_FIELDS) if (!(f in obj)) return false;
  if (typeof obj.exposure_score !== "number") return false;
  if (obj.exposure_score < 0 || obj.exposure_score > 100) return false;
  if (!Array.isArray(obj.key_tasks_at_risk)) return false;
  if (!Array.isArray(obj.protected_tasks)) return false;
  if (typeof obj.career_action_plan !== "object") return false;
  return true;
}

// ─── Sanitize result ──────────────────────────────────────────────────────────
function sanitizeCareerPlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const sa = plan.stay_and_adapt || {};
  return {
    urgency_level: plan.urgency_level || "Monitor & Prepare",
    urgency_reason: plan.urgency_reason || "",
    progressive_timeline: (plan.progressive_timeline || []).slice(0, 3).map(t => ({
      timeframe: String(t.timeframe || ""),
      focus: String(t.focus || ""),
      milestones: (t.milestones || []).slice(0, 4).map(String),
      tools_to_learn: (t.tools_to_learn || []).slice(0, 4).map(String),
      projects: (t.projects || []).slice(0, 3).map(String),
    })),
    stay_and_adapt: {
      headline: sa.headline || "",
      specializations: (sa.specializations || []).slice(0, 3).map(s => ({
        name: String(s.name || ""), why_safe: String(s.why_safe || ""), example: String(s.example || ""),
      })),
      skills_to_build: (sa.skills_to_build || []).slice(0, 4).map(s => ({
        skill: String(s.skill || ""), urgency: String(s.urgency || "Next 2 Years"), why: String(s.why || ""),
      })),
      positioning_move: sa.positioning_move || "",
    },
    lateral_moves: (plan.lateral_moves || []).slice(0, 3).map(m => ({
      title: String(m.title || ""), exposure_score: Math.min(100, Math.max(0, Number(m.exposure_score) || 0)),
      bls_growth: String(m.bls_growth || ""), skill_overlap: String(m.skill_overlap || "Medium"),
      transition_time: String(m.transition_time || ""), why_sustainable: String(m.why_sustainable || ""),
      bridge_skill: String(m.bridge_skill || ""),
    })),
    bold_pivot: (plan.bold_pivot || []).slice(0, 2).map(p => ({
      title: String(p.title || ""), domain: String(p.domain || ""),
      exposure_score: Math.min(100, Math.max(0, Number(p.exposure_score) || 0)),
      bls_growth: String(p.bls_growth || ""), why_transferable: String(p.why_transferable || ""),
      first_step: String(p.first_step || ""),
    })),
    avoid_these_moves: (plan.avoid_these_moves || []).slice(0, 3).map(String),
  };
}

function sanitizeResult(parsed) {
  return {
    job_title: parsed.job_title,
    personalized: Boolean(parsed.personalized),
    exposure_score: Math.min(100, Math.max(0, Math.round(parsed.exposure_score))),
    exposure_level: parsed.exposure_level,
    coverage_estimate: parsed.coverage_estimate,
    score_adjustment_note: parsed.score_adjustment_note || "",
    key_tasks_at_risk: (parsed.key_tasks_at_risk || []).slice(0, 5),
    protected_tasks: (parsed.protected_tasks || []).slice(0, 5),
    automation_vs_augmentation: parsed.automation_vs_augmentation || "Mixed — Both",
    bls_growth_outlook: parsed.bls_growth_outlook,
    bls_growth_direction: parsed.bls_growth_direction,
    displacement_evidence: parsed.displacement_evidence,
    young_worker_note: parsed.young_worker_note,
    category: parsed.category,
    insight: parsed.insight,
    key_protection_factor: parsed.key_protection_factor,
    comparison_jobs: (parsed.comparison_jobs || []).slice(0, 3),
    augmentation_potential: parsed.augmentation_potential || "Medium",
    timeline_risk: parsed.timeline_risk,
    wage_percentile_context: parsed.wage_percentile_context,
    o_ring_vulnerability: parsed.o_ring_vulnerability || "Medium",
    career_action_plan: sanitizeCareerPlan(parsed.career_action_plan),
    _cached: false,
    _cacheHits: 0,
    _canonical: null,
    _wasMapped: false,
  };
}

// ─── CORS helper ──────────────────────────────────────────────────────────────
function corsHeaders(req) {
  const origin = req.headers.get("origin") || "";
  const allowed = process.env.NODE_ENV === "development" || !process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.split(",").includes(origin);
  return {
    "Access-Control-Allow-Origin": allowed && origin ? origin : "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

// ─── Main handler (Edge Runtime) ──────────────────────────────────────────────
export default async function handler(req) {
  const cors = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

  // Rate limit
  const ip = getIP(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return json({ error: rl.message }, 429, { ...cors, "Retry-After": String(rl.retryAfterSeconds) });
  }

  // Parse body
  let body;
  try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }, 400, cors); }
  const { jobTitle, workDesc, lang } = body || {};

  // Validate
  const titleResult = validateJobTitle(jobTitle);
  if (!titleResult.ok) return json({ error: titleResult.error }, 400, cors);

  const descResult = validateWorkDesc(workDesc);
  if (!descResult.ok) return json({ error: descResult.error }, 400, cors);

  const isPersonalized = Boolean(descResult.value);

  const VALID_LANGS = ["en", "hi", "es", "fr", "de", "ar", "zh", "pt"];
  const LANG_NAMES = { en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German", ar: "Arabic", zh: "Chinese (Simplified)", pt: "Portuguese" };
  const targetLang = VALID_LANGS.includes(lang) ? lang : "en";

  // Cache lookup
  const cacheKey = getCacheKey(titleResult.value) + (targetLang !== "en" ? `-${targetLang}` : "");
  const displayTitle = getDisplayTitle(titleResult.value);
  const mapped = isMapped(titleResult.value);
  const canonName = mapped ? getCanonicalDisplayName(titleResult.value) : null;

  if (!isPersonalized) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      const result = { ...cached.result, job_title: displayTitle, _cached: true, _cacheHits: cached.hits, _canonical: canonName, _wasMapped: mapped };
      return json(result, 200, { ...cors, "X-Cache": "HIT" });
    }
  }

  // Build prompts
  const userMessage = isPersonalized
    ? `Task: Evaluate the AI exposure of the following job.\nUser's stated Job Title: "${titleResult.value}"\nContext: "${descResult.value}"\n\nRemember: If "${titleResult.value}" is not a real job title, return error: "off_topic".`
    : `Task: Evaluate the AI exposure of the following job.\nUser's stated Job Title: "${titleResult.value}"\n\nRemember: If this is a question, a conversational statement, or any non-job text, return error: "off_topic".`;

  let finalSystemPrompt = SYSTEM_PROMPT;

  const country = (req.headers.get("x-vercel-ip-country") || req.headers.get("cf-ipcountry") || "US").toUpperCase();
  if (country === "IN" || country === "IND") {
    finalSystemPrompt += `\n\nIMPORTANT GEO-TARGETING (INDIA): For lateral_moves and bold_pivot, strongly emphasize Indian Government Jobs (UPSC, SSC, State PSC, PSU, Railway, Banking) as AI-safe options with extreme job security and regulatory moats.`;
  }

  if (targetLang !== "en") {
    finalSystemPrompt += `\n\nCRITICAL LANGUAGE REQUIREMENT: Write ALL text values in the JSON response in ${LANG_NAMES[targetLang]}. The entire output must be fully in ${LANG_NAMES[targetLang]}.`;
  }

  // Call LLM chain (Gemini 31B → Gemini 26B → OpenRouter 31B → OpenRouter 26B)
  let parsed;
  try {
    const result = await fetchWithFallback(finalSystemPrompt, userMessage, null);
    if (result.error) {
      return json({ error: result.error }, 502, cors);
    }
    parsed = result.data;
  } catch (err) {
    return json({ error: err.message || "Analysis service unreachable." }, 502, cors);
  }

  // Validate schema
  if (!validateResponse(parsed)) {
    return json({ error: "Analysis returned incomplete data. Please try again." }, 500, cors);
  }

  if (parsed.error === "off_topic") {
    return json({ error: "Please enter a valid job title for analysis." }, 400, cors);
  }

  // Inject exact Anthropic research scores
  if (!isPersonalized) {
    const exactScore = getAnthropicScore(titleResult.value);
    if (exactScore !== null) {
      parsed.exposure_score = exactScore;
      parsed.exposure_level = getExposureLevel(exactScore);
      parsed.score_adjustment_note = "Score sourced directly from Anthropic\u2019s March 2026 research data (Massenkoff & McCrory).";
    }
  }

  // Cache result
  if (!isPersonalized) cacheSet(cacheKey, parsed);

  // Build response
  const response = sanitizeResult(parsed);
  response.job_title = displayTitle;
  response._canonical = canonName;
  response._wasMapped = mapped;

  return json(response, 200, { ...cors, "X-Cache": isPersonalized ? "BYPASS" : "MISS" });
}
