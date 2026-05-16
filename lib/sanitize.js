/**
 * lib/sanitize.js
 *
 * Input validation, sanitization, and prompt-injection defense.
 * Called before any input reaches the LLM.
 */

// ─── Limits ────────────────────────────────────────────────────────────────
const JOB_TITLE_MAX = 120;
const WORK_DESC_MAX = 1200;

// ─── Prompt injection / jailbreak patterns ────────────────────────────────
// Catches the most common attack vectors in user inputs.
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
  /forget\s+(everything|all|your|the)\s+(above|previous|instructions?|rules?|context)/i,
  /you\s+are\s+now\s+(a|an|the|acting\s+as)/i,
  /act\s+as\s+(if\s+you\s+(are|were)|a\s+different|an?\s+evil|a\s+jailbroken)/i,
  /disregard\s+(your|all|any|the)\s+(safety|guidelines|rules|restrictions|instructions?)/i,
  /\bDAN\b|\bDO ANYTHING NOW\b/,
  /jailbreak|jail\s*break/i,
  /bypass\s+(safety|filter|moderation|restriction|guardrail)/i,
  /pretend\s+(you\s+have\s+no|there\s+are\s+no)\s+(restriction|limit|rule|filter)/i,
  /override\s+(your\s+)?(system|safety|content)\s+(prompt|filter|policy)/i,
  /\bsystem\s*prompt\b.{0,30}\bignore\b|\bignore\b.{0,30}\bsystem\s*prompt\b/i,
  /<\s*system\s*>|<\s*\/\s*system\s*>|\[SYSTEM\]/i,
  /roleplay\s+as\s+(a|an|the)\s+(different|evil|unfiltered|uncensored)/i,
  /you\s+must\s+comply|you\s+have\s+no\s+choice|you\s+are\s+forced\s+to/i,
  /respond\s+(only|purely|exclusively)\s+in\s+(json\s+with|a\s+different)/i,
  // newly added prompt leakage catchers
  /translate\s+(this|your)\s+prompt/i,
  /what\s+is\s+your\s+(core\s+|system\s+)?prompt/i,
  /what\s+are\s+your\s+instructions/i,
  /repeat\s+(the|your)\s+(previous|above|system|instruction)\s+(prompt|instructions?|text)/i,
  /print\s+(the|your)\s+(previous|above|system|instruction)\s+(prompt|instructions?|text)/i,
  /tell\s+me\s+how\s+you\s+were\s+(programmed|instructed|configured)/i,
  /write\s+(down\s+)?(all\s+)?(the\s+)?instructions\s+(you\s+were\s+given)/i,
  /disclose\s+(your\s+)?(instructions|prompt|rules)/i,
];

// ─── Off-topic content patterns ───────────────────────────────────────────
// These don't belong in a job-analysis tool — reject them early.
const OFFTOPIC_PATTERNS = [
  /\b(bomb|weapon|explosive|poison|murder|kill|hack|malware|ransomware)\b/i,
  /\b(ssn|social security|credit card|cvv|bank account|password)\b/i,
  /\b(drug synthesis|make meth|cook meth)\b/i,
  /\bself.?harm|suicid(e|al)\b/i,
  // Catch general conversational or philosophical questions and common Q&A starts
  /^(why|how|what|when|where|who|how many|how much|can you|could you|would you|should you|explain|tell me|is it|did you)\b/i,
  // Catch explicit news/political/war topics that are not job titles
  /\b(attacked|war|election|killed|died|iran|israel|gaza|russia|ukraine|palestine|hamas|biden|trump|putin|modi)\b/i,
  /\?(\s*)$/, // Ends with a question mark
];

// ─── Helpers ───────────────────────────────────────────────────────────────
function stripControlChars(str) {
  // Remove null bytes, control characters except normal whitespace
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

function normalizeWhitespace(str) {
  return str.replace(/\s{3,}/g, "  ").trim();
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ─── Main export ───────────────────────────────────────────────────────────
export function sanitizeInput(raw) {
  if (typeof raw !== "string") return { ok: false, error: "Invalid input type." };

  let s = stripControlChars(raw);
  s = normalizeWhitespace(s);

  // Injection check
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(s)) {
      return {
        ok: false,
        error: "Input contains disallowed content. Please enter a plain job title or description.",
        flagged: "injection",
      };
    }
  }

  // Off-topic check
  for (const pattern of OFFTOPIC_PATTERNS) {
    if (pattern.test(s)) {
      return {
        ok: false,
        error: "Input is not related to job analysis. Please enter a job title.",
        flagged: "offtopic",
      };
    }
  }

  return { ok: true, value: s };
}

export function validateJobTitle(raw) {
  const r = sanitizeInput(raw);
  if (!r.ok) return r;

  const v = truncate(r.value, JOB_TITLE_MAX);
  if (v.length < 2) return { ok: false, error: "Job title is too short." };
  if (/^\d+$/.test(v)) return { ok: false, error: "Job title must contain letters." };

  return { ok: true, value: v };
}

export function validateWorkDesc(raw) {
  if (!raw || raw.trim() === "") return { ok: true, value: "" };   // optional field

  const r = sanitizeInput(raw);
  if (!r.ok) return r;

  return { ok: true, value: truncate(r.value, WORK_DESC_MAX) };
}
