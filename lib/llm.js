/**
 * lib/llm.js
 *
 * Multi-provider LLM failover chain for Gemma Challenge:
 *   1. Gemini API (Primary)
 *   2. OpenRouter (Fallback)
 *   3. Nebius (Fallback 2 — paid, last resort)
 *
 * Key design decisions:
 *   - Each provider gets its OWN AbortController + 20s timeout.
 *   - 429s trigger a per-provider cooldown so rate-limited providers are skipped.
 *   - The outer signal from analyze.js is only checked for explicit client cancels.
 */

const PROVIDER_TIMEOUT_MS = 8_000;  // 8s per provider — stays inside Vercel Hobby 10s hard limit
const COOLDOWN_MS = 60_000; // 1 min cooldown after 429
const MAX_TOKENS = 1500;    // Reduced from 3000 — faster response, still enough for full schema
const TEMPERATURE = 0.1;

// Persist stats in global to survive Next.js hot reloads within the same process
if (!global.llmStats) {
    global.llmStats = {};
}
const stats = global.llmStats;

function getStats(id) {
    if (!stats[id]) stats[id] = { requests: 0, failures: 0, cooldownUntil: 0 };
    return stats[id];
}

// Failover chain: Gemini 31B → Gemini 26B → OpenRouter 31B → OpenRouter 26B
// Each provider has its own independent 15s timeout (see PROVIDER_TIMEOUT_MS).
// Add NEBIUS_API_KEY to env to re-enable Nebius as a final fallback.
const PROVIDERS = [
    {
        id: "Gemini:Gemma-4-31B",
        name: "Gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemma-4-31b-it",
        getKey: () => process.env.GEMINI_API_KEY,
    },
    {
        id: "Gemini:Gemma-4-26B",
        name: "Gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemma-4-26b-a4b-it",
        getKey: () => process.env.GEMINI_API_KEY,
    },
    {
        id: "OpenRouter:Gemma-4-31B",
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemma-4-31b-it",
        getKey: () => process.env.OPENROUTER_API_KEY,
    },
    {
        id: "OpenRouter:Gemma-4-26B",
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        model: "google/gemma-4-26b-a4b-it",
        getKey: () => process.env.OPENROUTER_API_KEY,
    },
];

/**
 * Attempts the LLM request through each provider in order.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @param {AbortSignal} clientSignal - from analyze.js overall request timeout
 * @returns {{ data: object|null, provider: string|null, error: string|null }}
 */
export async function fetchWithFallback(systemPrompt, userMessage, clientSignal) {
    let lastError;
    const now = Date.now();
    let attempted = 0;
    const missingKeys = new Set();

    for (const provider of PROVIDERS) {
        // Skip if client explicitly cancelled (page close, browser cancel, etc.)
        if (clientSignal?.aborted) {
            throw Object.assign(new Error("Request cancelled by client"), { name: "AbortError" });
        }

        const apiKey = provider.getKey();
        if (!apiKey) {
            console.warn(`[LLM] Skipping ${provider.name} — no API key configured`);
            missingKeys.add(provider.name);
            continue;
        }
        
        attempted++;

        // Skip if this provider is in a rate-limit cooldown
        const modelStats = getStats(provider.id);
        if (modelStats.cooldownUntil > Date.now()) {
            const waitSecs = Math.ceil((modelStats.cooldownUntil - Date.now()) / 1000);
            console.log(`[LLM] Skipping ${provider.id} — cooldown for ${waitSecs}s`);
            continue;
        }

        if (provider.name === "Nebius") {
            console.warn(`[LLM] ⚠️  Using paid Nebius fallback (capped at $15). Last resort.`);
        }
        // ── Each provider gets its OWN independent timeout controller ──────────
        // This is the critical fix: a shared signal caused one timeout to abort
        // all subsequent providers in the chain.
        const providerController = new AbortController();
        const timeoutId = setTimeout(() => providerController.abort(), PROVIDER_TIMEOUT_MS);

        // Also abort if client cancels
        const onClientAbort = () => providerController.abort();
        clientSignal?.addEventListener("abort", onClientAbort, { once: true });

        try {
            console.log(`[LLM] Attempting ${provider.id}...`);

            const res = await fetch(provider.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
                    "X-Title": "AI Future",
                },
                body: JSON.stringify({
                    model: provider.model,
                    max_tokens: MAX_TOKENS,
                    temperature: TEMPERATURE,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage },
                    ],
                    response_format: { type: "json_object" },
                }),
                signal: providerController.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errText = await res.text().catch(() => "");
                if (res.status === 429) {
                    const cooldown = provider.name === "Nebius" ? COOLDOWN_MS * 5 : COOLDOWN_MS;
                    console.warn(`[LLM] ❗ ${provider.id} rate limited (429). Cooldown: ${cooldown / 1000}s`);
                    modelStats.cooldownUntil = Date.now() + cooldown;
                }
                throw new Error(`${provider.id} HTTP ${res.status}: ${errText.slice(0, 200)}`);
            }

            const data = await res.json();
            const rawText = data?.choices?.[0]?.message?.content || "";

            let parsed;
            try {
                parsed = JSON.parse(rawText.replace(/```json\n?/g, "").replace(/```/g, "").trim());
            } catch {
                throw new Error(`${provider.id} returned invalid JSON: ${rawText.slice(0, 100)}`);
            }

            modelStats.requests++;
            console.log(`[LLM] ✅ ${provider.id} success. Lifetime requests: ${modelStats.requests}`);
            return { data: parsed, provider: provider.name, error: null };

        } catch (err) {
            clearTimeout(timeoutId);

            // If the CLIENT explicitly cancelled (not a provider timeout) → stop the whole chain
            if (clientSignal?.aborted) {
                throw Object.assign(new Error("Request cancelled by client"), { name: "AbortError" });
            }

            // Provider timeout (AbortError from providerController) → try next provider
            const isProviderTimeout = err.name === "AbortError" || err.name === "TimeoutError";
            if (isProviderTimeout) {
                console.warn(`[LLM] ⏱  ${provider.id} timed out after ${PROVIDER_TIMEOUT_MS / 1000}s — trying next provider`);
                modelStats.failures++;
                lastError = err;
                // Don't rethrow — fall through to next provider
            } else {
                console.error(`[LLM] ❌ ${provider.id} failed: ${err.message}`);
                modelStats.failures++;
                lastError = err;
                console.log(`[LLM] 🔄 Trying next fallback provider...`);
            }
        } finally {
            clientSignal?.removeEventListener("abort", onClientAbort);
        }
    }

    // All providers exhausted
    console.error("[LLM] All providers failed. Last error:", lastError?.message);
    
    if (attempted === 0) {
        const keys = Array.from(missingKeys).join(", ");
        return {
            data: null,
            provider: null,
            error: `Configuration Error: Missing API keys. Please configure at least one of the following providers in your environment variables: ${keys}.`,
        };
    }
    
    let errStr = `All analysis providers failed or timed out. Last error: ${lastError?.message || "Unknown"}`;
    if (missingKeys.has("Nebius")) {
        errStr += " (Note: Nebius fallback was skipped because NEBIUS_API_KEY is missing).";
    }
    
    return {
        data: null,
        provider: null,
        error: errStr,
    };
}
