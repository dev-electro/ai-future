/**
 * lib/llm.js — Multi-provider LLM failover for Gemma 4 analysis
 *
 * Edge Runtime-compatible (no Node-only APIs, no persistent global state).
 *
 * Provider chain (sequential):
 *   1. Gemini 31B   — 22s timeout (primary, almost always works within 5-10s)
 *   2. Gemini 26B   — 5s timeout  (fast fallback if 31B is slow or rate-limited)
 *   3. OpenRouter 31B — 5s timeout (cloud fallback, different infrastructure)
 *   4. OpenRouter 26B — 5s timeout (last resort)
 *
 * Total worst-case: 22 + 5 + 5 + 5 = 37s — exceeds Edge 30s if ALL providers fail.
 * In practice: Gemini 31B succeeds in 5-12s on >95% of requests.
 *
 * NOTE: Cooldown state (in-memory) is intentionally removed — Edge Runtime isolates
 * are stateless between requests so per-request cooldowns were never actually working.
 */

const TIMEOUT_PRIMARY_MS = 15_000;
const TIMEOUT_FALLBACK_MS = 8_000;
const MAX_TOKENS = 2000;             // Need more tokens to avoid truncated JSON
const TEMPERATURE = 0.1;

// The Vercel Edge runtime has a hard 30-second limit.
// We prioritize the 26B MoE model because it is significantly faster than the 31B dense model.
const PROVIDERS = [
    {
        id:         "Gemini:gemma-4-26b-a4b-it",
        url:        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model:      "gemma-4-26b-a4b-it",   // Fast MoE, primary
        getKey:     () => process.env.GEMINI_API_KEY,
        timeoutMs:  TIMEOUT_PRIMARY_MS,
        // Limit thinking budget — structured JSON needs minimal reasoning
        extra:      { thinking: { budget_tokens: 512 } },
    },
    {
        id:         "Gemini:gemma-4-31b-it",
        url:        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model:      "gemma-4-31b-it",       // Dense, fallback
        getKey:     () => process.env.GEMINI_API_KEY,
        timeoutMs:  TIMEOUT_FALLBACK_MS,
        extra:      { thinking: { budget_tokens: 256 } },
    },
    {
        id:         "OpenRouter:gemma-4-26b-a4b-it:free",
        url:        "https://openrouter.ai/api/v1/chat/completions",
        model:      "google/gemma-4-26b-a4b-it:free",
        getKey:     () => process.env.OPENROUTER_API_KEY,
        timeoutMs:  TIMEOUT_FALLBACK_MS,
        extra:      {},
    },
];

/**
 * Try each provider in order. Returns the first valid parsed JSON result.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {AbortSignal|null} clientSignal
 * @returns {{ data: object|null, provider: string|null, error: string|null }}
 */
export async function fetchWithFallback(systemPrompt, userMessage, clientSignal) {
    let lastError;
    let attempted = 0;
    const missingKeys = [];

    for (const provider of PROVIDERS) {
        // Stop if client explicitly cancelled
        if (clientSignal?.aborted) {
            throw Object.assign(new Error("Request cancelled by client"), { name: "AbortError" });
        }

        const apiKey = provider.getKey();
        if (!apiKey) {
            console.warn(`[LLM] Skipping ${provider.id} — API key not set`);
            if (!missingKeys.includes(provider.id.split(":")[0])) {
                missingKeys.push(provider.id.split(":")[0]);
            }
            continue;
        }

        attempted++;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), provider.timeoutMs);
        const onCancel = () => controller.abort();
        clientSignal?.addEventListener("abort", onCancel, { once: true });

        try {
            console.log(`[LLM] → ${provider.id} (${provider.timeoutMs / 1000}s timeout)`);

            const res = await fetch(provider.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://ai-future-eta.vercel.app",
                    "X-Title": "AI Future — Job Risk Analyzer",
                },
                body: JSON.stringify({
                    model: provider.model,
                    max_tokens: MAX_TOKENS,
                    temperature: TEMPERATURE,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user",   content: userMessage },
                    ],
                    response_format: { type: "json_object" },
                    // Provider-specific extras (e.g. thinking budget for Gemini)
                    ...provider.extra,
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errBody = await res.text().catch(() => "");
                console.error(`[LLM] ✗ ${provider.id} HTTP ${res.status}: ${errBody.slice(0, 300)}`);
                throw new Error(`${provider.id} HTTP ${res.status}`);
            }

            const data = await res.json();
            const rawText = (data?.choices?.[0]?.message?.content || "").trim();

            if (!rawText) {
                throw new Error(`${provider.id} returned empty response`);
            }

            let parsed;
            try {
                // 1. Strip Gemma 4 thinking tokens (<thought>...</thought>) — appear before JSON
                // 2. Strip accidental markdown fences
                const clean = rawText
                    .replace(/<thought>[\s\S]*?<\/thought>/gi, "")
                    .replace(/^```json\s*/i, "")
                    .replace(/```\s*$/i, "")
                    .trim();
                if (!clean) throw new Error("Empty after stripping thought tokens");
                parsed = JSON.parse(clean);
            } catch (parseErr) {
                console.error(`[LLM] ✗ ${provider.id} invalid JSON: ${rawText.slice(0, 200)}`);
                throw new Error(`${provider.id} returned non-JSON`);
            }

            console.log(`[LLM] ✓ ${provider.id} success`);
            return { data: parsed, provider: provider.id, error: null };

        } catch (err) {
            clearTimeout(timeoutId);

            if (clientSignal?.aborted) {
                throw Object.assign(new Error("Request cancelled by client"), { name: "AbortError" });
            }

            const isTimeout = err.name === "AbortError" || err.name === "TimeoutError";
            if (isTimeout) {
                console.warn(`[LLM] ⏱ ${provider.id} timed out after ${provider.timeoutMs / 1000}s`);
            } else {
                console.warn(`[LLM] ✗ ${provider.id}: ${err.message}`);
            }
            lastError = err;
        } finally {
            clientSignal?.removeEventListener("abort", onCancel);
        }
    }

    // All providers exhausted
    if (attempted === 0) {
        const names = missingKeys.join(", ");
        return {
            data: null,
            provider: null,
            error: `No API keys configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in your environment. (Missing: ${names})`,
        };
    }

    return {
        data: null,
        provider: null,
        error: `Analysis service temporarily unavailable. All providers failed. Please try again. (Last: ${lastError?.message || "unknown"})`,
    };
}
