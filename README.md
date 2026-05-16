# ⚡ AI Future — Gemma 4 Job Risk Analyzer

> Research-backed AI job displacement risk analyzer  
> Powered exclusively by **Gemma 4** — local WebGPU inference + cloud API  
> Built for the [Google × Dev.to Gemma Challenge](https://dev.to/t/gemmachallenge)

[![Gemma 4](https://img.shields.io/badge/Powered%20by-Gemma%204-blue?logo=google)](https://deepmind.google/technologies/gemma/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)](https://nextjs.org)
[![WebGPU](https://img.shields.io/badge/Local%20AI-WebGPU-orange)](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API)

---

## 🧠 What It Does

**AI Future** analyzes any job title and tells you:
- **AI exposure score** (0–100) backed by Anthropic's March 2026 labor market research
- Which tasks are **at risk** vs **protected**
- A **3-phase career action plan** with specific skills, tools, and certifications
- **Lateral moves** and **bold pivot** options with real BLS growth data

The key differentiator: **it runs entirely on Gemma 4**, either privately in your browser or via the cloud.

---

## 🤖 Gemma 4 Architecture

This app uses **only Gemma 4 models** across all inference paths. Zero other models.

### Cloud Mode — Gemma 4 31B / 26B

6-provider failover chain, all Gemma 4 exclusive:

| Priority | Provider | Model |
|----------|----------|-------|
| 1 | Gemini API | `gemma-4-31b-it` |
| 2 | Gemini API | `gemma-4-26b-a4b-it` |
| 3 | OpenRouter | `google/gemma-4-31b-it` |
| 4 | OpenRouter | `google/gemma-4-26b-a4b-it` |
| 5 | Nebius AI Studio | `google/gemma-4-31b-it` |
| 6 | Nebius AI Studio | `google/gemma-4-26b-a4b-it` |

Each provider has its own independent 20s timeout + 429 cooldown. If one fails or is rate-limited, the next fires automatically.

### Local Mode — Gemma 4 E2B / E4B (WebGPU)

Runs **fully in-browser** via [Transformers.js](https://huggingface.co/docs/transformers.js) + WebGPU. No data leaves your device.

| Model | Params | Size | Use Case |
|-------|--------|------|----------|
| Gemma 4 E2B | ~2B | ~1.5 GB | Fast, mobile-friendly |
| Gemma 4 E4B | ~4B MoE | ~3 GB | Smarter reasoning, desktop |

The app auto-detects WebGPU support, checks for already-cached models, and recommends the right mode for your device.

```
lib/worker.js        ← WebWorker: Transformers.js pipeline (q4 quantization, WebGPU)
lib/llm.js           ← Cloud: 6-provider failover chain (Gemini → OpenRouter → Nebius)
pages/api/analyze.js ← Secure server-side proxy, in-memory LRU cache, rate limiting
```

---

## 🚀 Deploy to Vercel (10 minutes)

### Step 1 — Get API Keys

**Gemini API** (primary, free tier available):
1. Go to **https://aistudio.google.com**
2. Create API Key → copy it

**OpenRouter** (fallback, optional):
1. Go to **https://openrouter.ai**
2. Create API Key → add credits or use free models

**Nebius AI Studio** (last-resort fallback, optional):
1. Go to **https://studio.nebius.ai**
2. Create API Key

### Step 2 — Deploy

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Step 3 — Set Environment Variables

In **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable | Value | Required? |
|----------|-------|-----------|
| `GEMINI_API_KEY` | `AIza...` | ✅ Yes (primary) |
| `OPENROUTER_API_KEY` | `sk-or-...` | Recommended (fallback) |
| `NEBIUS_API_KEY` | `...` | Optional (last resort) |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Recommended |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Recommended |

**Redeploy after saving env vars.**

---

## 🔧 Local Development

```bash
git clone https://github.com/dev-electro/ai-future.git
cd ai-future
npm install
cp .env.example .env.local
# Fill in your GEMINI_API_KEY in .env.local
npm run dev
```

The app runs on `http://localhost:3000`.

> **Note:** Local WebGPU inference requires Chrome 113+ or Edge on a WebGPU-enabled desktop. The cloud mode works on all browsers.

---

## 📁 Project Structure

```
ai-future/
├── pages/
│   ├── index.js              ← Homepage with hero + SEO (5 JSON-LD schema types)
│   ├── sitemap.xml.js        ← Dynamic sitemap
│   ├── robots.txt.js         ← Crawl instructions
│   └── api/
│       └── analyze.js        ← Secure Gemma 4 proxy (Gemini → OpenRouter → Nebius)
├── components/
│   └── AIJobAnalyzer.jsx     ← Full 3-page frontend (Analyze, Leaderboard, Jobs)
├── lib/
│   ├── llm.js                ← 6-provider Gemma 4 failover chain
│   ├── worker.js             ← WebWorker: Gemma 4 E2B/E4B via Transformers.js + WebGPU
│   ├── anthropicScores.js    ← Exact scores from Anthropic March 2026 research
│   ├── cache.js              ← In-memory LRU cache (600 entries, 7-day TTL)
│   ├── rateLimit.js          ← 5 req/10min + 30 req/day per IP
│   ├── sanitize.js           ← Injection detection (14 patterns)
│   └── normalizeJob.js       ← Job title canonicalization
├── public/
│   └── site.webmanifest      ← PWA manifest
├── .env.example
├── next.config.js            ← Security headers + CSP (allows HuggingFace for model weights)
└── vercel.json
```

---

## 🔒 Security Layers

1. **API keys server-side only** — never exposed to browser
2. **Rate limiting** — 5 req/10min, 30 req/day per IP
3. **Input sanitization** — strips control chars, limits length
4. **Injection detection** — 14 regex patterns block jailbreaks
5. **Off-topic filtering** — rejects non-job queries before LLM call
6. **Schema validation** — validates all JSON fields before responding
7. **Security headers** — CSP, X-Frame-Options, nosniff via `next.config.js`
8. **CORS restriction** — only configured origin allowed

---

## 🌐 Privacy — Local Mode

When you select **Gemma 4 E2B** or **Gemma 4 E4B**:
- The model weights download once to your browser's Cache Storage (~1.5–3 GB)
- Inference runs entirely on your GPU via WebGPU
- **Zero data is sent to any server**
- Works fully offline after the initial download
- Subsequent sessions detect the cached model and skip the download

---

## 📊 Data Sources

- **Massenkoff & McCrory (2026)** — *Labor market impacts of AI: A new measure and early evidence* (Anthropic)
- **Anthropic Economic Index** — Real Claude professional usage data (Aug + Nov 2025)
- **Eloundou et al. (2023)** — *GPTs are GPTs: An early look at the labor market impact potential*
- **US Bureau of Labor Statistics** — Occupational Outlook Handbook 2024–2034
- **O\*NET Database** — Occupation task descriptions and time weights

---

## 🏆 Gemma Challenge

This project was built for the [Google × Dev.to Gemma Challenge](https://dev.to/t/gemmachallenge).

**Why Gemma 4?**
- Gemma 4's 256K context window handles the rich research-backed system prompt with room to spare
- Gemma 4 E2B/E4B enable true privacy-first analysis — no API keys, no data leaving the device
- The MoE architecture of Gemma 4 26B delivers GPT-4 class reasoning at a fraction of the inference cost
- Gemma 4's native JSON mode produces reliably structured output across all 6 providers in the failover chain
