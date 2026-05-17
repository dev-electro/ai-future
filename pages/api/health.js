/**
 * pages/api/health.js — LLM provider health check
 * GET /api/health → returns status of each provider
 * Useful to diagnose "All providers failed" without reading Vercel logs.
 */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const geminiKey   = process.env.GEMINI_API_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  const PROVIDERS = [
    { id: 'Gemini:gemma-4-31b-it', url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', model: 'gemma-4-31b-it', key: geminiKey, timeout: 20000 },
    { id: 'OpenRouter:gemma-4-31b-it:free', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemma-4-31b-it:free', key: openrouterKey, timeout: 8000 },
    { id: 'OpenRouter:gemma-4-26b-a4b-it:free', url: 'https://openrouter.ai/api/v1/chat/completions', model: 'google/gemma-4-26b-a4b-it:free', key: openrouterKey, timeout: 8000 },
  ];

  const PING_BODY = {
    max_tokens: 10,
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Return only JSON.' },
      { role: 'user',   content: 'Return {"ok":true}' },
    ],
  };

  const results = await Promise.all(PROVIDERS.map(async (p) => {
    if (!p.key) return { id: p.id, status: 'no_key', ms: 0 };
    const t0 = Date.now();
    try {
      const res = await fetch(p.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${p.key}`,
          'HTTP-Referer': 'https://ai-future-eta.vercel.app',
        },
        body: JSON.stringify({ model: p.model, ...PING_BODY }),
        signal: AbortSignal.timeout(p.timeout),
      });
      const ms = Date.now() - t0;
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        return { id: p.id, status: 'error', http: res.status, ms, detail: txt.slice(0, 200) };
      }
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return { id: p.id, status: 'ok', ms, preview: content.slice(0, 80) };
    } catch (e) {
      return { id: p.id, status: 'exception', ms: Date.now() - t0, detail: e.message };
    }
  }));

  return new Response(JSON.stringify({
    ts: new Date().toISOString(),
    gemini_key_set: Boolean(geminiKey),
    openrouter_key_set: Boolean(openrouterKey),
    providers: results,
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
