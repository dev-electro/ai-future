/**
 * lib/worker.js — Gemma 4 E2B/E4B WebGPU Inference Worker
 *
 * Based on the official onnx-community/gemma-4-E2B-it-ONNX model card:
 *   https://huggingface.co/onnx-community/gemma-4-E2B-it-ONNX
 *
 * Correct API (per model card):
 *   - Class:     Gemma4ForConditionalGeneration  (NOT Gemma4ForCausalLM)
 *   - Processor: AutoProcessor                  (NOT AutoTokenizer)
 *   - dtype:     "q4f16"                         (WebGPU-optimised quantization)
 *   - Text-only: pass content as [{ type:"text", text:"..." }], no image/audio
 *   - enable_thinking: false                    (prevents <|think|> tokens in output)
 */

import {
  AutoProcessor,
  Gemma4ForConditionalGeneration,
  TextStreamer,
  env,
} from '@huggingface/transformers';

env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

const MODEL_IDS = {
  e2b: 'onnx-community/gemma-4-E2B-it-ONNX',
  e4b: 'onnx-community/gemma-4-E4B-it-ONNX',
};

// Singleton cache — once loaded per modelId, reuse indefinitely
const cache = {};

async function load(modelId, onProgress) {
  if (cache[modelId]) return cache[modelId];

  const model_id = MODEL_IDS[modelId] ?? MODEL_IDS.e2b;

  // Signal immediately so the UI shows the download panel
  onProgress({ status: 'initiate', file: 'processor', progress: 0, loaded: 0, total: 0 });

  const [processor, model] = await Promise.all([
    AutoProcessor.from_pretrained(model_id, {
      progress_callback: onProgress,
    }),
    Gemma4ForConditionalGeneration.from_pretrained(model_id, {
      dtype: 'q4f16',    // Required: 4-bit + fp16 for WebGPU
      device: 'webgpu',
      progress_callback: onProgress,
    }),
  ]);

  cache[modelId] = { processor, model };
  return cache[modelId];
}

// ─── Message handler ──────────────────────────────────────────────────────────
self.addEventListener('message', async (event) => {
  const { type, text, modelId = 'e2b' } = event.data;

  // Keepalive ping — respond to prevent Chrome from throttling the worker
  if (type === 'keepalive') {
    self.postMessage({ type: 'keepalive' });
    return;
  }

  const emit = (t, extra = {}) => self.postMessage({ type: t, ...extra });

  const onProgress = (info) => {
    emit('progress', {
      data: {
        status:   info.status ?? 'downloading',
        file:     info.file   ?? '',
        progress: info.total > 0
          ? Math.round((info.loaded / info.total) * 100)
          : (info.progress ?? 0),
        loaded: info.loaded ?? 0,
        total:  info.total  ?? 0,
      },
    });
  };

  // ── init: pre-load model weights ────────────────────────────────────────────
  if (type === 'init') {
    try {
      await load(modelId, onProgress);
      emit('init_ready', { modelId });
    } catch (e) {
      emit('error', { error: e.message });
    }

  // ── generate: run text-only inference ──────────────────────────────────────
  } else if (type === 'generate') {
    try {
      const { processor, model } = await load(modelId, onProgress);

      const jobTitle = (text || '').replace(/^Analyze job:\s*/i, '').trim();

      // Text-only message — use { type: "text" } content (no image/audio)
      const messages = [{
        role: 'user',
        content: [{
          type: 'text',
          text: `You are a career risk analyst. Output ONLY valid JSON — no markdown, no explanation.

Job Title: "${jobTitle}"

Return exactly this JSON (all fields required):
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
  "bls_growth_outlook": "short BLS outlook",
  "augmentation_potential": "Medium",
  "timeline_risk": "Unlikely",
  "category": "job category",
  "career_action_plan": {
    "urgency_level": "Monitor & Prepare",
    "urgency_reason": "reason string",
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
        }],
      }];

      // Apply Gemma 4 chat template via AutoProcessor
      // enable_thinking: false prevents <|think|> reasoning tokens
      const prompt = processor.apply_chat_template(messages, {
        enable_thinking: false,
        add_generation_prompt: true,
      });

      // Prepare inputs — text-only so image and audio are undefined
      const inputs = await processor(prompt, undefined, undefined, {
        add_special_tokens: false,
      });

      const promptLen = inputs.input_ids.dims.at(-1);

      // Generate — stream tokens as they arrive
      let outputText = '';
      const streamer = new TextStreamer(processor.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (token) => {
          outputText += token;
          // Optional: emit streaming update for future UX
          emit('stream', { token });
        },
      });

      const outputs = await model.generate({
        ...inputs,
        max_new_tokens: 700,
        do_sample: false,         // deterministic JSON
        temperature: 1.0,          // required with do_sample: false
        top_p: 0.95,
        top_k: 64,
        streamer,
      });

      // Decode only the newly generated tokens (strip the prompt)
      const decoded = processor.batch_decode(
        outputs.slice(null, [promptLen, null]),
        { skip_special_tokens: true }
      );

      const result = (decoded[0] || outputText || '').trim();
      emit('complete', { result });

    } catch (e) {
      emit('error', { error: e.message });
    }
  }
});
