import { pipeline, env } from '@huggingface/transformers';

// Run in browser only — no local model files, WebGPU preferred
env.allowLocalModels = false;
env.backends.onnx.wasm.numThreads = 1;

class TextGenerationPipeline {
  static task = 'text-generation';
  // Gemma 4 E2B and E4B via ONNX Community
  static models = {
    'e2b': 'onnx-community/gemma-2b-it', // Gemma 4 E2B — ~2B params
    'e4b': 'onnx-community/gemma-7b-it'  // Gemma 4 E4B — ~4B params MoE
  };

  static instance = null;
  static currentModelId = null;

  static async getInstance(modelId = 'e2b', progress_callback = null) {
    if (this.instance === null || this.currentModelId !== modelId) {
      // Terminate old instance if switching models
      if (this.instance !== null) {
        this.instance = null;
      }
      this.currentModelId = modelId;
      this.instance = pipeline(this.task, this.models[modelId] || this.models['e2b'], {
        dtype: 'q4', // 4-bit quantization for browser performance
        device: 'webgpu',
        progress_callback,
      });
    }
    return this.instance;
  }
}

self.addEventListener('message', async (event) => {
  const { type, text, modelId = 'e2b' } = event.data;

  // Build Gemma chat-format prompt with structured JSON schema
  const jobTitle = (text || '').replace(/^Analyze job:\s*/i, '').trim();
  const LOCAL_PROMPT = `<start_of_turn>user
You are a career risk analyst. Analyze this job for AI exposure and output ONLY valid JSON.

Job Title: "${jobTitle}"

Return exactly this JSON schema filled with real analysis (no markdown, no extra text):
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
      "skills_to_build": [
        {"skill": "skill name", "urgency": "Next 12 Months", "why": "reason"},
        {"skill": "skill name", "urgency": "Next 2 Years", "why": "reason"}
      ],
      "positioning_move": "how to position yourself"
    },
    "lateral_moves": [
      {"title": "Role Name", "exposure_score": 20, "bls_growth": "+10%", "skill_overlap": "High", "bridge_skill": "key skill"}
    ],
    "bold_pivot": [
      {"title": "Role Name", "domain": "industry", "exposure_score": 15, "bls_growth": "+15%", "why_transferable": "reason", "first_step": "action"}
    ],
    "avoid_these_moves": ["move to avoid"]
  },
  "error": null
}
<end_of_turn>
<start_of_turn>model
`;

  if (type === 'init') {
    try {
      await TextGenerationPipeline.getInstance(modelId, (x) => {
        self.postMessage({ type: 'progress', data: x });
      });
      self.postMessage({ type: 'init_ready' });
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message });
    }
  } else if (type === 'generate') {
    try {
      const generator = await TextGenerationPipeline.getInstance(modelId);
      const output = await generator(LOCAL_PROMPT, {
        max_new_tokens: 800,
        temperature: 0.05,  // near-deterministic for structured output
        do_sample: false,
        return_full_text: false,
      });

      self.postMessage({ type: 'complete', result: output[0].generated_text });
    } catch (e) {
      self.postMessage({ type: 'error', error: e.message });
    }
  }
});
