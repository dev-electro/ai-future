/**
 * lib/normalizeJob.js
 *
 * Normalizes a raw job title string into a canonical cache key.
 *
 * Two-step process:
 *   1. Normalize the raw string (lowercase, collapse spaces, strip punctuation)
 *   2. Resolve known aliases to a canonical form so "SWE", "software dev",
 *      "software engineer", and "sw engineer" all hit the same cache entry.
 *
 * The alias table is intentionally conservative — only add entries you're
 * confident are truly the same occupation. Uncertain cases fall through to
 * the normalized raw string (still useful for exact-match caching).
 */

// ─── Aliases → canonical key ─────────────────────────────────────────────
// Key: normalized alias (after step 1 processing)
// Value: canonical cache key
const ALIASES = {
  // Software / Engineering
  "swe":                               "software engineer",
  "software dev":                      "software engineer",
  "software developer":                "software engineer",
  "software engineering":              "software engineer",
  "software eng":                      "software engineer",
  "dev":                               "software engineer",
  "full stack developer":              "software engineer",
  "full stack engineer":               "software engineer",
  "fullstack developer":               "software engineer",
  "fullstack engineer":                "software engineer",
  "backend developer":                 "software engineer",
  "backend engineer":                  "software engineer",
  "frontend developer":                "software engineer",
  "frontend engineer":                 "software engineer",
  "web developer":                     "software engineer",
  "web engineer":                      "software engineer",
  "application developer":             "software engineer",
  "application engineer":              "software engineer",
  "programmer":                        "computer programmer",
  "coder":                             "computer programmer",
  "computer programmer":               "computer programmer",

  // Data
  "data scientist":                    "data scientist",
  "ml engineer":                       "machine learning engineer",
  "machine learning engineer":         "machine learning engineer",
  "ai engineer":                       "machine learning engineer",
  "data analyst":                      "data analyst",
  "business analyst":                  "business analyst",
  "ba":                                "business analyst",
  "data entry":                        "data entry keyer",
  "data entry clerk":                  "data entry keyer",
  "data entry operator":               "data entry keyer",

  // Finance
  "cpa":                               "accountant",
  "certified public accountant":       "accountant",
  "bookkeeper":                        "bookkeeping clerk",
  "accounting clerk":                  "bookkeeping clerk",
  "financial advisor":                 "financial analyst",
  "investment analyst":                "financial analyst",
  "equity analyst":                    "financial analyst",
  "credit analyst":                    "financial analyst",
  "cfo":                               "financial manager",
  "chief financial officer":           "financial manager",

  // Healthcare
  "rn":                                "registered nurse",
  "registered nurse":                  "registered nurse",
  "nurse":                             "registered nurse",
  "lpn":                               "registered nurse",
  "doctor":                            "physician",
  "md":                                "physician",
  "medical doctor":                    "physician",
  "gp":                                "physician",
  "general practitioner":              "physician",
  "pt":                                "physical therapist",
  "physio":                            "physical therapist",
  "physiotherapist":                   "physical therapist",
  "pharmacist":                        "pharmacist",
  "pharmacy technician":               "pharmacist",
  "np":                                "nurse practitioner",
  "nurse practitioner":                "nurse practitioner",
  "vet":                               "veterinarian",
  "veterinary doctor":                 "veterinarian",

  // Legal
  "attorney":                          "lawyer",
  "solicitor":                         "lawyer",
  "barrister":                         "lawyer",
  "counsel":                           "lawyer",
  "associate attorney":                "lawyer",
  "legal assistant":                   "paralegal",
  "law clerk":                         "paralegal",

  // Education
  "teacher":                           "high school teacher",
  "high school teacher":               "high school teacher",
  "professor":                         "university professor",
  "lecturer":                          "university professor",
  "instructor":                        "high school teacher",

  // Design / Media
  "ux designer":                       "graphic designer",
  "ui designer":                       "graphic designer",
  "ux ui designer":                    "graphic designer",
  "product designer":                  "graphic designer",
  "visual designer":                   "graphic designer",
  "copywriter":                        "writer",
  "content writer":                    "writer",
  "technical writer":                  "technical writer",
  "journalist":                        "journalist",
  "reporter":                          "journalist",
  "news reporter":                     "journalist",

  // Management
  "hr":                                "hr specialist",
  "human resources":                   "hr specialist",
  "recruiter":                         "hr specialist",
  "talent acquisition":                "hr specialist",
  "pm":                                "project manager",
  "project manager":                   "project manager",
  "product manager":                   "product manager",
  "product owner":                     "product manager",
  "ceo":                               "chief executive",
  "coo":                               "operations manager",
  "cto":                               "chief technology officer",

  // Trades
  "electrician":                       "electrician",
  "plumber":                           "plumber",
  "mechanic":                          "automotive mechanic",
  "auto mechanic":                     "automotive mechanic",
  "car mechanic":                      "automotive mechanic",
  "hvac":                              "hvac technician",
  "hvac technician":                   "hvac technician",

  // Hospitality / Service
  "waiter":                            "waiter / waitress",
  "waitress":                          "waiter / waitress",
  "server":                            "waiter / waitress",
  "bartender":                         "bartender",
  "barista":                           "barista",
  "chef":                              "chef / head cook",
  "head chef":                         "chef / head cook",
  "cook":                              "chef / head cook",
  "customer service":                  "customer service representative",
  "customer support":                  "customer service representative",
  "support agent":                     "customer service representative",
  "call center agent":                 "customer service representative",

  // Sales / Marketing
  "sales rep":                         "sales representative",
  "sales representative":              "sales representative",
  "account executive":                 "sales representative",
  "ae":                                "sales representative",
  "sdr":                               "sales representative",
  "bdr":                               "sales representative",
  "marketing manager":                 "marketing manager",
  "digital marketer":                  "marketing manager",
  "seo specialist":                    "marketing manager",

  // Other
  "social worker":                     "social worker",
  "therapist":                         "psychologist",
  "counselor":                         "psychologist",
  "psychologist":                      "psychologist",
  "real estate agent":                 "real estate agent",
  "realtor":                           "real estate agent",
  "property agent":                    "real estate agent",
  "architect":                         "architect",
  "civil engineer":                    "civil engineer",
  "mechanical engineer":               "mechanical engineer",
  "electrical engineer":               "electrical engineer",
  "massage therapist":                 "massage therapist",
  "lifeguard":                         "lifeguard",
  "firefighter":                       "firefighter",
  "police officer":                    "police officer",
  "cop":                               "police officer",
  "officer":                           "police officer",
  "farmer":                            "agricultural worker",
  "farm worker":                       "agricultural worker",
};

// Seniority/modifier prefixes to strip for cache key derivation
// (We still pass the original title to the LLM for accurate analysis)
const STRIP_PREFIXES = [
  "senior", "sr", "junior", "jr", "lead", "principal", "staff",
  "associate", "assistant", "chief", "head", "director of",
  "vp of", "vice president of", "entry level", "mid level", "mid-level",
];

// ─── Core normalizer (internal) ──────────────────────────────────────────
function _normalize(raw) {
  let s = raw
    .toLowerCase()
    .trim()
    .replace(/\s*[-–—(].*$/, "")
    .replace(/\d+/g, "")
    .replace(/[^a-z\s/]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const prefix of STRIP_PREFIXES) {
    const re = new RegExp(`^${prefix}\\s+`, "i");
    s = s.replace(re, "").trim();
  }
  return s.replace(/\s+(i{1,3}|iv|vi{0,3})$/, "").trim();
}

/**
 * Returns the canonical CACHE KEY for a raw job title.
 * "Frontend Developer", "SWE", "Full Stack Dev" → "software engineer"
 * ONLY used internally for cache lookup. Never shown to users.
 */
export function getCacheKey(raw) {
  if (!raw || typeof raw !== "string") return "";
  const normalized = _normalize(raw);
  return ALIASES[normalized] || normalized;
}

/**
 * Returns a cleaned-up DISPLAY version of the user's own title.
 * Strips junk but preserves the user's words — never maps to canonical.
 * "senior frontend developer (remote)" → "Senior Frontend Developer"
 */
export function getDisplayTitle(raw) {
  if (!raw || typeof raw !== "string") return raw;
  return raw
    .trim()
    .replace(/\s*[-–—(].*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Returns the canonical name formatted for display.
 * Used in the "Based on [X] analysis" badge.
 * "frontend developer" → "Software Engineer"
 */
export function getCanonicalDisplayName(raw) {
  const key = getCacheKey(raw);
  return key.replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * True if the user's title was mapped to a different canonical form.
 * "frontend developer" → true  (maps to "software engineer")
 * "software engineer"  → false (already canonical)
 */
export function isMapped(raw) {
  if (!raw) return false;
  return getCacheKey(raw) !== _normalize(raw);
}

// Backward-compat alias
export const normalizeJobTitle = getCacheKey;
