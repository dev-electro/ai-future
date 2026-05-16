/**
 * lib/worker.js
 *
 * Runs Gemma 4 E2B / E4B in-browser via:
 *   - @huggingface/transformers v4 (Gemma4ForCausalLM — text-only path)
 *   - WebGPU for hardware-accelerated inference
 *   - dtype: q4f16 (required for WebGPU with Gemma 4 ONNX)
 *
 * Model repos (public, no HF token needed):
 *   onnx-community/gemma-4-E2B-it-ONNX  (~1.5 GB)
 *   onnx-community/gemma-4-E4B-it-ONNX  (~3 GB)
 *
 * Progress events fired to main thread:
 *   { type: 'progress', data: { status, file, progress, loaded, total } }
 *   { type: 'init_ready' }
 *   { type: 'complete', result: string }
 *   { type: 'error', error: string }
 */

import { AutoTokenizer, Gemma4ForCausalLM, env } from '@huggingface/transformers';

// Fetch from HuggingFace Hub only — never from local disk
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

const MODEL_IDS = {
  e2b: 'onnx-community/gemma-4-E2B-it-ONNX',
  e4b: 'onnx-community/gemma-4-E4B-it-ONNX',
};

// Singleton cache: once loaded, reuse across generate calls
const loaded = {};

async function getModel(modelId, onProgress) {
  if (loaded[modelId]) return loaded[modelId];

  const model_id = MODEL_IDS[modelId] || MODEL_IDS.e2b;

  // Signal download start immediately so UI shows the panel
  onProgress({ status: 'initiate', file: 'model', progress: 0, loaded: 0, total: 0 });

  const [tokenizer, model] = await Promise.all([
    AutoTokenizer.from_pretrained(model_id, {
      progress_callback: onProgress,
    }),
    Gemma4ForCausalLM.from_pretrained(model_id, {
      dtype: 'q4f16',    // WebGPU-optimised 4-bit with fp16 — required for Gemma 4 ONNX
      device: 'webgpu',
      progress_callback: onProgress,
    }),
  ]);

  loaded[modelId] = { tokenizer, model };
  return loaded[modelId];
}

// ─── Message handler ─────────────────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, text, modelId = 'e2b' } = event.data;

  const emit = (type, extra = {}) => self.postMessage({ type, ...extra });

  const onProgress = (info) => {
    emit('progress', {
      data: {
        status:   info.status   ?? 'downloading',
        file:     info.file     ?? '',
        progress: info.total > 0
          ? Math.round((info.loaded / info.total) * 100)
          : (info.progress ?? 0),
        loaded: info.loaded ?? 0,
        total:  info.total  ?? 0,
      },
    });
  };

  // ── init: load + warm up model ──────────────────────────────────────────
  if (type === 'init') {
    try {
      await getModel(modelId, onProgress);
      emit('init_ready', { modelId });
    } catch (e) {
      emit('error', { error: e.message });
    }

  // ── generate: run inference ─────────────────────────────────────────────
  } else if (type === 'generate') {
    try {
      const { tokenizer, model } = await getModel(modelId, onProgress);

      const jobTitle = (text || '').replace(/^Analyze job:\s*/i, '').trim();

      // Gemma instruct format — apply_chat_template handles <start_of_turn> tokens
      const messages = [{
        role: 'user',
        content: `You are a career risk analyst. Output ONLY valid JSON — no markdown fences, no explanation.

Job Title: "${jobTitle}"

Return exactly this JSON (fill all fields with real data):
{
  "job_title": "${jobTitle}",
  "exposure_score": 0,
  "exposure_level": "Moderate",
  "coverage_estimate": "~X% of tasks",
  "key_tasks_at_risk": ["task1","task2","task3"],
  "protected_tasks": ["task1","task2","task3"],
  "insight": "one concise sentence",
  "key_protection_factor": "main protection factor",
  "bls_growth_direction": "Growing",
  "bls_growth_outlook": "short outlook",
  "augmentation_potential": "Medium",
  "timeline_risk": "Unlikely",
  "category": "job category",
  "career_action_plan": {
    "urgency_level": "Monitor & Prepare",
    "urgency_reason": "reason",
    "stay_and_adapt": {
      "headline": "strategy headline",
      "skills_to_build": [{"skill":"name","urgency":"Next 12 Months","why":"reason"}],
      "positioning_move": "positioning advice"
    },
    "lateral_moves": [{"title":"Role","exposure_score":20,"bls_growth":"+10%","skill_overlap":"High","bridge_skill":"key skill"}],
    "bold_pivot": [{"title":"Role","domain":"industry","exposure_score":15,"bls_growth":"+15%","why_transferable":"reason","first_step":"action"}],
    "avoid_these_moves": ["move to avoid"]
  },
  "error": null
}`,
      }];

      // Tokenize using Gemma chat template
      const inputs = tokenizer.apply_chat_template(messages, {
        add_generation_prompt: true,
        return_dict: true,
      });

      const promptLen = inputs.input_ids.dims[1];

      // Run generation
      const outputIds = await model.generate({
        ...inputs,
        max_new_tokens: 700,
        temperature: 0.05,
        do_sample: false,
      });

      // Decode only newly generated tokens (strip the prompt)
      const newTokens = outputIds.slice(null, [promptLen, null]);
      const generated = tokenizer.batch_decode(newTokens, {
        skip_special_tokens: true,
      });

      const raw = (generated[0] || '').trim();
      emit('complete', { result: raw });

    } catch (e) {
      emit('error', { error: e.message });
    }
  }
});
