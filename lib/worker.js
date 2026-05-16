/**
 * lib/worker.js
 *
 * Runs Gemma 4 E2B / E4B entirely in the browser via:
 *   - @huggingface/transformers (v3+)
 *   - WebGPU for hardware-accelerated inference
 *   - Cache Storage API (via Transformers.js) for offline reuse
 *
 * Key facts about onnx-community/gemma-4-E2B-it-ONNX:
 *   - Task: "any-to-any" (multimodal, not "text-generation")
 *   - dtype: "q4f16" (WebGPU-optimized quantization)
 *   - Progress callback fires: { status, file, progress, loaded, total }
 */

import { AutoTokenizer, Gemma4ForConditionalGeneration, env } from '@huggingface/transformers';

// Only fetch from HuggingFace Hub, never from local disk
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

const MODELS = {
  e2b: 'onnx-community/gemma-4-E2B-it-ONNX',
  e4b: 'onnx-community/gemma-4-E4B-it-ONNX',
};

// Singleton instances keyed by modelId
const instances = {};

async function loadModel(modelId, progress_callback) {
  if (instances[modelId]) return instances[modelId];

  const model_id = MODELS[modelId] || MODELS.e2b;

  // Emit an "initiate" event so the UI shows the download panel immediately
  progress_callback({ status: 'initiate', file: 'tokenizer', progress: 0 });

  const [tokenizer, model] = await Promise.all([
    AutoTokenizer.from_pretrained(model_id, { progress_callback }),
    Gemma4ForConditionalGeneration.from_pretrained(model_id, {
      dtype: 'q4f16',   // Required for WebGPU; q4 alone fails for Gemma 4
      device: 'webgpu',
      progress_callback,
    }),
  ]);

  instances[modelId] = { tokenizer, model };
  return instances[modelId];
}

self.addEventListener('message', async (event) => {
  const { type, text, modelId = 'e2b' } = event.data;

  const onProgress = (info) => {
    // Normalize the progress event and forward to the main thread
    self.postMessage({
      type: 'progress',
      data: {
        status: info.status,           // 'initiate' | 'downloading' | 'progress' | 'done'
        file: info.file || '',
        progress: info.progress ?? 0,  // 0-100
        loaded: info.loaded ?? 0,
        total: info.total ?? 0,
      },
    });
  };

  if (type === 'init') {
    try {
      await loadModel(modelId, onProgress);
      self.postMessage({ type: 'init_ready', modelId });
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message });
    }

  } else if (type === 'generate') {
    try {
      const { tokenizer, model } = await loadModel(modelId, onProgress);

      const jobTitle = (text || '').replace(/^Analyze job:\s*/i, '').trim();

      // Gemma 4 chat template via apply_chat_template
      const messages = [
        {
          role: 'user',
          content: `You are a career risk analyst. Output ONLY valid JSON — no markdown, no extra text.

Job Title: "${jobTitle}"

Return this exact JSON schema:
{
  "job_title": "${jobTitle}",
  "exposure_score": 0,
  "exposure_level": "Moderate",
  "coverage_estimate": "~X% of tasks",
  "key_tasks_at_risk": ["task1","task2","task3"],
  "protected_tasks": ["task1","task2","task3"],
  "insight": "one sentence insight",
  "key_protection_factor": "main protection",
  "bls_growth_direction": "Growing",
  "bls_growth_outlook": "short outlook",
  "augmentation_potential": "Medium",
  "timeline_risk": "Unlikely",
  "career_action_plan": {
    "urgency_level": "Monitor & Prepare",
    "urgency_reason": "reason",
    "stay_and_adapt": {
      "headline": "strategy",
      "skills_to_build": [{"skill":"name","urgency":"Next 12 Months","why":"reason"}],
      "positioning_move": "how to position yourself"
    },
    "lateral_moves": [{"title":"Role","exposure_score":20,"bls_growth":"+10%","skill_overlap":"High","bridge_skill":"key skill"}],
    "bold_pivot": [{"title":"Role","domain":"industry","exposure_score":15,"bls_growth":"+15%","why_transferable":"reason","first_step":"action"}],
    "avoid_these_moves": ["move to avoid"]
  },
  "error": null
}`,
        },
      ];

      const inputs = tokenizer.apply_chat_template(messages, {
        add_generation_prompt: true,
        return_dict: true,
      });

      const output = await model.generate({
        ...inputs,
        max_new_tokens: 900,
        temperature: 0.05,
        do_sample: false,
      });

      // Decode only the newly generated tokens (strip prompt)
      const generated = tokenizer.batch_decode(
        output.slice(null, [inputs.input_ids.dims[1], null]),
        { skip_special_tokens: true }
      );

      self.postMessage({ type: 'complete', result: generated[0] || '' });
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message });
    }
  }
});
