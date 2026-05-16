/**
 * pages/api/analyze.js
 *
 * Secure server-side LLM proxy with result caching.
 *
 * Flow:
 *   1. CORS + method guard
 *   2. Rate limit per IP
 *   3. Validate + sanitize inputs (injection detection)
 *   4. Normalize job title → cache key
 *   5. Cache lookup (only for non-personalized requests)
 *      └── HIT  → return cached result immediately (saves Groq quota)
 *      └── MISS → call Groq, validate, cache, return fresh result
 *
 * LLM: Gemma 4 31B / 26B via Gemini API, OpenRouter, Nebius
 * Cache: In-memory LRU, 600 entries, 7-day TTL (lib/cache.js)
 */

export const maxDuration = 60; // Allow up to 60s execution on Vercel Hobby tier

import { checkRateLimit } from "@/lib/rateLimit";
import { validateJobTitle, validateWorkDesc } from "@/lib/sanitize";
import { get as cacheGet, set as cacheSet } from "@/lib/cache";
import { getCacheKey, getDisplayTitle, getCanonicalDisplayName, isMapped } from "@/lib/normalizeJob";
import { fetchWithFallback } from "@/lib/llm";
import { getAnthropicScore, getExposureLevel } from "@/lib/anthropicScores";

// ─── Config ───────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",").map(o => o.trim()).filter(Boolean);

const MAX_TOKENS = 3000;
const TEMPERATURE = 0.1;

// ─── System prompt ────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a senior labor economist and career strategist specializing in AI's impact on the workforce, powered by Gemma 4. You combine Anthropic's March 2026 research "Labor market impacts of AI" by Massenkoff & McCrory with actionable career guidance.

KNOWLEDGE BASE:
OBSERVED EXPOSURE: O*NET (~800 US occupations), Anthropic Economic Index (Claude usage Aug+Nov 2025), Eloundou et al. beta scores. beta=1.0: LLM alone 2x faster; beta=0.5: needs tools; beta=0.0: not feasible.
TOP EXPOSED (75-95%): Computer Programmers 92%, Customer Service Reps 88%, Data Entry 87%, Telemarketers 85%, Proofreaders 84%, Tax Preparers 82%, Financial Analysts 80%, Paralegals 78%, Medical Transcriptionists 77%, Bookkeeping Clerks 75%.
HIGH (50-74%): Software Engineers 65%, Technical Writers 64%, Editors 62%, Translators 60%, Insurance Underwriters 58%, Market Research 56%, Accountants 55%.
MODERATE (20-49%): Lawyers 45%, Marketing Managers 40%, HR Specialists 38%, Graphic Designers 35%, Journalists 30%, Nurses 28%, Physicians 25%, Architects 25%, Teachers 22%.
LOW (5-19%): Social Workers 18%, Real Estate 18%, Vets 12%, Police 12%, Psychologists 15%, Physical Therapists 10%, Electricians 6%, Plumbers 5%.
MINIMAL (0-4%): Cooks, Bartenders, Lifeguards, Mechanics, Agricultural Workers — near 0%.
DEMOGRAPHICS: Top-exposed workers earn 47% MORE; grad degrees 3.9x more common. AI hits high-educated white-collar first.
BLS 2024-2034: Every 10pp exposure → 0.6pp lower growth. Declining: Telemarketers -14%, Programmers -10%. Growing: Nurse Practitioners +45%, Data Scientists +35%, Cybersecurity +33%, Electricians +11%.
EVIDENCE: NO unemployment increase post-ChatGPT. 14% DROP in hiring for ages 22-25 in exposed roles.

OUTPUT RULES:
- ONLY valid JSON. No markdown, no backticks, no extra text.
- Non-job input → set error:"off_topic", zero everything else.
- Score bounds: 75-100=Very High, 50-74=High, 20-49=Moderate, 5-19=Low, 0-4=Minimal.
- Be SPECIFIC. Name exact tools, certifications, platforms. Generic advice is rejected.
- Keep ALL string values concise (under 200 chars each) to stay within token limits.
- Arrays: max 4 items each. Timeline: exactly 3 phases.

OUTPUT SCHEMA (return exactly this structure, filled with real data):
{
  "job_title": "",
  "personalized": false,
  "exposure_score": 0,
  "exposure_level": "Minimal",
  "coverage_estimate": "",
  "score_adjustment_note": "",
  "key_tasks_at_risk": ["task1","task2","task3","task4"],
  "protected_tasks": ["task1","task2","task3","task4"],
  "automation_vs_augmentation": "",
  "bls_growth_outlook": "",
  "bls_growth_direction": "Flat",
  "displacement_evidence": "",
  "young_worker_note": "",
  "category": "",
  "insight": "",
  "key_protection_factor": "",
  "comparison_jobs": ["job1","job2","job3"],
  "augmentation_potential": "Medium",
  "timeline_risk": "Unlikely",
  "wage_percentile_context": "",
  "o_ring_vulnerability": "Low",
  "career_action_plan": {
    "urgency_level": "Stay Sharp",
    "urgency_reason": "",
    "progressive_timeline": [
      {"timeframe":"0-6 Months","focus":"","milestones":["m1","m2","m3"],"tools_to_learn":["t1","t2","t3"],"projects":["p1","p2"]},
      {"timeframe":"6-18 Months","focus":"","milestones":["m1","m2","m3"],"tools_to_learn":["t1","t2","t3"],"projects":["p1","p2"]},
      {"timeframe":"1-3 Years","focus":"","milestones":["m1","m2","m3"],"tools_to_learn":["t1","t2","t3"],"projects":["p1","p2"]}
    ],
    "stay_and_adapt": {
      "headline": "",
      "specializations": [
        {"name":"","why_safe":"","example":""},
        {"name":"","why_safe":"","example":""}
      ],
      "skills_to_build": [
        {"skill":"","urgency":"Immediate","why":""},
        {"skill":"","urgency":"Next 12 Months","why":""},
        {"skill":"","urgency":"Next 2 Years","why":""}
      ],
      "positioning_move": ""
    },
    "lateral_moves": [
      {"title":"","exposure_score":0,"bls_growth":"","skill_overlap":"High","transition_time":"","why_sustainable":"","bridge_skill":""},
      {"title":"","exposure_score":0,"bls_growth":"","skill_overlap":"Medium","transition_time":"","why_sustainable":"","bridge_skill":""}
    ],
    "bold_pivot": [
      {"title":"","domain":"","exposure_score":0,"bls_growth":"","why_transferable":"","first_step":""}
    ],
    "avoid_these_moves": ["move1","move2"]
  },
  "error": null
}`;

// ─── Schema validator ─────────────────────────────────────────────────────
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
  if (typeof obj.exposure_level !== "string") return false;
  if (!Array.isArray(obj.key_tasks_at_risk)) return false;
  if (!Array.isArray(obj.protected_tasks)) return false;
  if (typeof obj.career_action_plan !== "object") return false;
  return true;
}

// ─── Sanitize result for safe output ─────────────────────────────────────
function sanitizeCareerPlan(plan) {
  if (!plan || typeof plan !== "object") return null;
  const sa = plan.stay_and_adapt || {};
  return {
    urgency_level: plan.urgency_level || "Monitor & Prepare",
    urgency_reason: plan.urgency_reason || "",
    progressive_timeline: (plan.progressive_timeline || []).slice(0, 3).map(t => ({
      timeframe: String(t.timeframe || t.phase || ""),
      focus: String(t.focus || ""),
      milestones: (t.milestones || t.action_items || []).slice(0, 5).map(String),
      tools_to_learn: (t.tools_to_learn || []).slice(0, 6).map(String),
      projects: (t.projects || []).slice(0, 4).map(String),
    })),
    stay_and_adapt: {
      headline: sa.headline || "",
      specializations: (sa.specializations || []).slice(0, 3).map(s => ({
        name: String(s.name || ""),
        why_safe: String(s.why_safe || ""),
        example: String(s.example || ""),
      })),
      skills_to_build: (sa.skills_to_build || []).slice(0, 4).map(s => ({
        skill: String(s.skill || ""),
        urgency: String(s.urgency || "Next 2 Years"),
        why: String(s.why || ""),
      })),
      positioning_move: sa.positioning_move || "",
    },
    lateral_moves: (plan.lateral_moves || []).slice(0, 3).map(m => ({
      title: String(m.title || ""),
      exposure_score: Math.min(100, Math.max(0, Number(m.exposure_score) || 0)),
      bls_growth: String(m.bls_growth || ""),
      skill_overlap: String(m.skill_overlap || "Medium"),
      transition_time: String(m.transition_time || ""),
      why_sustainable: String(m.why_sustainable || ""),
      bridge_skill: String(m.bridge_skill || ""),
    })),
    bold_pivot: (plan.bold_pivot || []).slice(0, 2).map(p => ({
      title: String(p.title || ""),
      domain: String(p.domain || ""),
      exposure_score: Math.min(100, Math.max(0, Number(p.exposure_score) || 0)),
      bls_growth: String(p.bls_growth || ""),
      why_transferable: String(p.why_transferable || ""),
      first_step: String(p.first_step || ""),
    })),
    avoid_these_moves: (plan.avoid_these_moves || []).slice(0, 3).map(String),
  };
}

function sanitizeResult(parsed, fromCache = false, cacheHits = 0) {
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
    // Cache + mapping metadata
    _cached: fromCache,
    _cacheHits: cacheHits,
    _canonical: null,
    _wasMapped: false,
  };
}
// ─── CORS ─────────────────────────────────────────────────────────────────
function setCors(req, res) {
  const origin = req.headers.origin || "";
  const allowed =
    process.env.NODE_ENV === "development" ||
    ALLOWED_ORIGINS.length === 0 ||
    ALLOWED_ORIGINS.includes(origin);

  if (allowed && origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// ─── Get real IP ──────────────────────────────────────────────────────────
function getIP(req) {
  return (
    req.headers["x-real-ip"] ||
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown"
  );
}

// ─── Main handler ─────────────────────────────────────────────────────────
export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit
  const ip = getIP(req);
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    res.setHeader("Retry-After", String(rl.retryAfterSeconds));
    return res.status(429).json({ error: rl.message });
  }
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining ?? 0));

  // Validate inputs
  const { jobTitle, workDesc, lang } = req.body || {};
  const titleResult = validateJobTitle(jobTitle);
  if (!titleResult.ok) return res.status(400).json({ error: titleResult.error });

  const descResult = validateWorkDesc(workDesc);
  if (!descResult.ok) return res.status(400).json({ error: descResult.error });

  const isPersonalized = Boolean(descResult.value);

  // Language — only allow safe known locale codes
  const VALID_LANGS = ["en", "hi", "es", "fr", "de", "ar", "zh", "pt"];
  const LANG_NAMES = { en: "English", hi: "Hindi", es: "Spanish", fr: "French", de: "German", ar: "Arabic", zh: "Chinese (Simplified)", pt: "Portuguese" };
  const targetLang = VALID_LANGS.includes(lang) ? lang : "en";

  // ── Cache lookup (skip for personalized requests) ──────────────────────
  const cacheKey = getCacheKey(titleResult.value) + (targetLang !== "en" ? `-${targetLang}` : "");
  const displayTitle = getDisplayTitle(titleResult.value);
  const mapped = isMapped(titleResult.value);
  const canonName = mapped ? getCanonicalDisplayName(titleResult.value) : null;

  if (!isPersonalized) {
    const cached = cacheGet(cacheKey);
    if (cached) {
      // Cache hit — inject the user's actual display title before returning
      const result = {
        ...cached.result,
        job_title: displayTitle,
        _cached: true,
        _cacheHits: cached.hits,
        _canonical: canonName,
        _wasMapped: mapped,
      };
      res.setHeader("X-Cache", "HIT");
      return res.status(200).json(result);
    }
    res.setHeader("X-Cache", "MISS");
  } else {
    res.setHeader("X-Cache", "BYPASS");
  }

  // ── Build message ─────────────────────────────────────────────────────
  const userMessage = isPersonalized
    ? `Task: Evaluate the AI exposure of the following job.\nUser's stated Job Title: "${titleResult.value}"\nContext: "${descResult.value}"\n\nRemember: If "${titleResult.value}" is not a real job title, return error: "off_topic".`
    : `Task: Evaluate the AI exposure of the following job.\nUser's stated Job Title: "${titleResult.value}"\n\nRemember: If this is a question, a conversational statement, or any non-job text, return error: "off_topic".`;

  // ── Call Groq ─────────────────────────────────────────────────────────
  // ── Call LLM Chain ────────────────────────────────────────────────────────
  let parsed;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 60_000);

    let finalSystemPrompt = SYSTEM_PROMPT;
    const country = (req.headers["x-vercel-ip-country"] || req.headers["cf-ipcountry"] || req.headers["x-client-geo-location"] || "US").toUpperCase();
    const isIndian = country === "IN" || country === "IND";

    if (isIndian) {
      finalSystemPrompt += `\n\nIMPORTANT GEO-TARGETING (INDIA):\nFor the 'lateral_moves' or 'bold_pivot' sections, strongly emphasize Indian Government Jobs (e.g., UPSC, SSC, State PSC, PSU, Railway, Public Sector Banking) as exceptionally AI-safe options. Highlight that these roles possess extreme job security, strict regulatory moats, and bureaucratic protections that make them highly resistant to AI displacement. Recommend that the user start preparing for these government exams immediately, as they offer the ultimate career protection against AI.`;
    }

    // Language translation instruction
    if (targetLang !== "en") {
      const langName = LANG_NAMES[targetLang];
      finalSystemPrompt += `\n\nCRITICAL LANGUAGE REQUIREMENT: You MUST write ALL text values in the JSON response in ${langName}. This includes: job_title, coverage_estimate, score_adjustment_note, key_tasks_at_risk array items, protected_tasks array items, automation_vs_augmentation, bls_growth_outlook, displacement_evidence, young_worker_note, insight, key_protection_factor, comparison_jobs, wage_percentile_context, and ALL fields inside career_action_plan (urgency_reason, all phase focus/milestones/tools, specialization names/why_safe/examples, skill names/why, positioning_move, lateral move titles/bls_growth/why_sustainable/bridge_skill, bold pivot titles/domain/why_transferable/first_step, avoid_these_moves). DO NOT write anything in English if the language is ${langName}. The entire output must be fully in ${langName}.`;
    }

    const result = await fetchWithFallback(finalSystemPrompt, userMessage, controller.signal);
    clearTimeout(id);

    if (result.error) {
      console.error("[analyze.js] All LLMs failed:", result.error);
      return res.status(502).json({ error: "Analysis service error. Please try again." });
    }

    parsed = result.data;
    // Do NOT expose provider name or API infrastructure via headers

  } catch (err) {
    if (err.name === "TimeoutError" || err.name === "AbortError")
      return res.status(504).json({ error: "Analysis timed out. Please try again." });
    console.error("LLM chain failed:", err.message);
    return res.status(502).json({ error: "Could not reach analysis service." });
  }

  // ── Validate schema ───────────────────────────────────────────────────
  if (!validateResponse(parsed)) {
    console.error("Schema validation failed:", JSON.stringify(parsed).slice(0, 300));
    return res.status(500).json({ error: "Analysis returned incomplete data. Please try again." });
  }

  if (parsed.error === "off_topic") {
    return res.status(400).json({ error: "Please enter a valid job title for analysis." });
  }

  // ── Override score with exact Anthropic research data ─────────────────
  // The LLM's job is to write career advice, NOT calculate the score.
  // We always inject the exact figure from the Anthropic paper lookup table.
  if (!isPersonalized) {
    const exactScore = getAnthropicScore(titleResult.value);
    if (exactScore !== null) {
      parsed.exposure_score = exactScore;
      parsed.exposure_level = getExposureLevel(exactScore);
      parsed.score_adjustment_note = "Score sourced directly from Anthropic\u2019s March 2026 research data (Massenkoff & McCrory).";
    }
  }

  // ── Store in cache (only non-personalized) ───────────────────────────
  if (!isPersonalized) {
    cacheSet(cacheKey, parsed);   // store under canonical key
  }

  // Inject display title + cache metadata into the safe response
  const response = sanitizeResult(parsed, false, 0);
  response.job_title = displayTitle;  // always show user's own title
  response._canonical = canonName;     // null if not mapped
  response._wasMapped = mapped;

  return res.status(200).json(response);
}
