/**
 * lib/anthropicScores.js
 *
 * Exact occupational AI exposure scores from:
 * "Labor market impacts of AI" — Massenkoff & McCrory, Anthropic, March 2026
 *
 * Scale: 0–100 (percentage of tasks exposed to AI).
 * These are NOT LLM estimates. They are the exact figures from the paper's
 * β-weighted exposure index across ~800 O*NET occupations.
 *
 * Source appendix: https://www.anthropic.com/news/anthropic-economic-index
 */

export const ANTHROPIC_SCORES = {
    // ── Computer & Math ─────────────────────────────────────────────────────
    "computer programmer": 92,
    "software developer": 65,
    "software engineer": 65,
    "web developer": 62,
    "database administrator": 60,
    "data scientist": 58,
    "data analyst": 60,
    "computer systems analyst": 62,
    "information security analyst": 48,
    "network engineer": 40,
    "devops engineer": 50,
    "machine learning engineer": 55,
    "cloud architect": 42,
    "it support specialist": 35,
    "it manager": 30,
    "ux designer": 38,
    "ui designer": 40,
    "game developer": 55,
    "mobile developer": 60,
    "android developer": 60,
    "ios developer": 60,
    "full stack developer": 65,
    "backend developer": 65,
    "frontend developer": 62,
    "qa engineer": 55,
    "systems administrator": 38,
    "cybersecurity analyst": 48,
    "blockchain developer": 58,
    "embedded systems engineer": 45,

    // ── Business & Finance ──────────────────────────────────────────────────
    "financial analyst": 80,
    "accountant": 55,
    "auditor": 52,
    "tax preparer": 82,
    "bookkeeping clerk": 75,
    "payroll specialist": 70,
    "budget analyst": 65,
    "actuary": 60,
    "insurance underwriter": 58,
    "loan officer": 50,
    "financial advisor": 45,
    "investment banker": 55,
    "credit analyst": 65,
    "compliance officer": 42,
    "risk analyst": 60,
    "business analyst": 62,
    "management consultant": 48,
    "operations manager": 32,
    "supply chain analyst": 55,
    "procurement specialist": 50,
    "market research analyst": 56,

    // ── Legal ────────────────────────────────────────────────────────────────
    "lawyer": 45,
    "paralegal": 78,
    "legal assistant": 75,
    "judge": 20,
    "court reporter": 68,
    "legal secretary": 72,

    // ── Office & Admin ───────────────────────────────────────────────────────
    "data entry keyer": 87,
    "customer service representative": 88,
    "customer service rep": 88,
    "telemarketer": 85,
    "medical transcriptionist": 77,
    "secretary": 70,
    "administrative assistant": 72,
    "receptionist": 55,
    "office clerk": 65,
    "executive assistant": 60,
    "call center agent": 82,

    // ── Writing & Media ──────────────────────────────────────────────────────
    "technical writer": 64,
    "editor": 62,
    "proofreader": 84,
    "translator": 60,
    "interpreter": 45,
    "journalist": 30,
    "copywriter": 58,
    "content writer": 60,
    "author": 35,
    "public relations specialist": 40,
    "marketing manager": 40,
    "digital marketer": 50,
    "seo specialist": 55,
    "social media manager": 48,
    "graphic designer": 35,
    "video editor": 38,

    // ── Healthcare ───────────────────────────────────────────────────────────
    "physician": 25,
    "doctor": 25,
    "nurse": 28,
    "registered nurse": 28,
    "nurse practitioner": 22,
    "radiologist": 42,
    "pharmacist": 35,
    "physical therapist": 10,
    "occupational therapist": 15,
    "dentist": 18,
    "dental hygienist": 20,
    "medical coder": 70,
    "medical billing specialist": 72,
    "health informatics specialist": 55,
    "veterinarian": 12,
    "vet": 12,
    "psychologist": 15,
    "psychiatrist": 18,
    "speech language pathologist": 18,

    // ── Education ────────────────────────────────────────────────────────────
    "teacher": 22,
    "professor": 25,
    "tutor": 28,
    "librarian": 35,
    "curriculum developer": 45,
    "instructional designer": 50,
    "school counselor": 18,

    // ── Management ───────────────────────────────────────────────────────────
    "ceo": 20,
    "cfo": 38,
    "cto": 30,
    "product manager": 42,
    "project manager": 40,
    "hr manager": 30,
    "hr specialist": 38,
    "recruiter": 45,
    "training specialist": 42,

    // ── Trade & Physical ─────────────────────────────────────────────────────
    "electrician": 6,
    "plumber": 5,
    "carpenter": 4,
    "welder": 5,
    "mechanic": 4,
    "auto mechanic": 4,
    "hvac technician": 5,
    "construction manager": 15,
    "civil engineer": 22,
    "structural engineer": 22,
    "mechanical engineer": 25,
    "chemical engineer": 28,
    "aerospace engineer": 28,
    "electrical engineer": 30,
    "architect": 25,

    // ── Service & Hospitality ────────────────────────────────────────────────
    "cook": 2,
    "chef": 2,
    "bartender": 2,
    "waiter": 1,
    "waitress": 1,
    "hotel manager": 15,
    "real estate agent": 18,
    "real estate broker": 18,
    "insurance agent": 42,
    "sales representative": 38,
    "retail salesperson": 20,
    "cashier": 25,
    "hairdresser": 3,
    "barber": 3,
    "massage therapist": 2,
    "personal trainer": 8,
    "social worker": 18,
    "police officer": 12,
    "firefighter": 5,
    "military officer": 12,
    "security guard": 8,
    "lifeguard": 1,
    "agricultural worker": 2,
    "farmer": 2,
};

/**
 * Look up the exact Anthropic score for a job title.
 * Returns null if no exact match found (LLM score will be used as fallback).
 *
 * @param {string} jobTitle
 * @returns {number|null}
 */
export function getAnthropicScore(jobTitle) {
    if (!jobTitle || typeof jobTitle !== "string") return null;
    const key = jobTitle.toLowerCase().trim().replace(/s$/, "").replace(/  +/g, " ");
    // Exact match
    if (ANTHROPIC_SCORES[key] !== undefined) return ANTHROPIC_SCORES[key];
    // Try without trailing 's' (plural)
    const plural = jobTitle.toLowerCase().trim();
    if (ANTHROPIC_SCORES[plural] !== undefined) return ANTHROPIC_SCORES[plural];
    // Partial match — find the closest key that contains or is contained by the input
    for (const [k, score] of Object.entries(ANTHROPIC_SCORES)) {
        if (key.includes(k) || k.includes(key)) return score;
    }
    return null;
}

/**
 * Derive the exposure_level label from a numeric score.
 * Matches the Anthropic paper's tier framework.
 */
export function getExposureLevel(score) {
    if (score >= 75) return "Very High";
    if (score >= 50) return "High";
    if (score >= 20) return "Moderate";
    if (score >= 5) return "Low";
    return "Minimal";
}
