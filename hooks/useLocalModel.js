/**
 * hooks/useLocalModel.js
 * Manages the WebGPU worker lifecycle for local Gemma 4 inference.
 * Extracted from AnalyzePage for clean separation of concerns.
 */
import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalModel() {
  const worker = useRef(null);

  const [localProgress, setLocalProgress]       = useState(null);
  const [isLocalReady, setIsLocalReady]         = useState(false);
  const [localModeLoading, setLocalModeLoading] = useState(false);
  const [localModelVersion, setLocalModelVersion] = useState("cloud");

  // Device capability detection
  const [webGPUSupported, setWebGPUSupported]   = useState(null); // null=checking
  const [cachedModels, setCachedModels]         = useState({ e2b: false, e4b: false });
  const [recommendedMode, setRecommendedMode]   = useState("cloud");

  // ── Capability detection on mount ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      // 1. WebGPU
      const hasWebGPU = !!(navigator.gpu);
      let gpuAdapterOk = false;
      if (hasWebGPU) {
        try {
          const adapter = await navigator.gpu.requestAdapter();
          gpuAdapterOk = !!adapter;
        } catch { gpuAdapterOk = false; }
      }
      setWebGPUSupported(gpuAdapterOk);

      // 2. Cache detection
      const cacheStatus = { e2b: false, e4b: false };
      try {
        if ("caches" in window) {
          const cacheKeys = await caches.keys();
          const hfCache = cacheKeys.find(k => k.includes("transformers") || k.includes("huggingface"));
          if (hfCache) {
            const cache    = await caches.open(hfCache);
            const requests = await cache.keys();
            const urls     = requests.map(r => r.url);
            cacheStatus.e2b = urls.some(u => u.includes("gemma-4-E2B-it-ONNX"));
            cacheStatus.e4b = urls.some(u => u.includes("gemma-4-E4B-it-ONNX"));
          }
        }
      } catch { /* cache API unavailable */ }
      setCachedModels(cacheStatus);

      // 3. Recommended mode
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      let recommended = "cloud";
      if (gpuAdapterOk) {
        recommended = isMobile ? "e2b" : "e4b";
        if (cacheStatus.e4b) recommended = "e4b";
        if (cacheStatus.e2b && !cacheStatus.e4b) recommended = "e2b";
      }
      setRecommendedMode(recommended);
      setLocalModelVersion("cloud"); // always default to cloud
    })();
  }, []);

  // ── Worker lifecycle ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!worker.current && typeof window !== "undefined") {
      worker.current = new Worker(
        new URL("../lib/ai-worker.js?v=3", import.meta.url),
        { type: "module" }
      );

      // Keepalive — prevent Chrome throttling WebGPU in background tabs
      const keepaliveInterval = setInterval(() => {
        if (worker.current) worker.current.postMessage({ type: "keepalive" });
      }, 10_000);

      const onVisChange = () => {
        if (document.visibilityState === "hidden") {
          console.warn("[Worker] Tab hidden — WebGPU may be throttled.");
        }
      };
      document.addEventListener("visibilitychange", onVisChange);

      worker.current.addEventListener("message", (e) => {
        const { type, data, result: res, error: err } = e.data;
        if (type === "keepalive") return;

        if (type === "progress") {
          setLocalProgress(prev => {
            const progressVal = data.total > 0
              ? Math.round((data.loaded / data.total) * 100)
              : (data.progress ?? prev?.progress ?? 0);
            return { status: data.status, file: data.file || prev?.file || "", progress: progressVal, loaded: data.loaded, total: data.total };
          });
        } else if (type === "init_ready") {
          setIsLocalReady(true);
          setLocalProgress({ status: "ready", progress: 100 });
          if (worker.current?.pendingJobTitle) {
            const t = worker.current.pendingJobTitle;
            worker.current.pendingJobTitle = null;
            
            // 90s hard timeout starts NOW since download is done
            worker.current._genTimeout = setTimeout(() => {
              worker.current._onTimeout?.();
              setLocalModeLoading(false);
              worker.current._isGenerating = false;
            }, 90_000);

            worker.current.postMessage({ type: "generate", text: `Analyze job: ${t}`, modelId: worker.current._modelId });
          } else {
            setLocalModeLoading(false);
          }
        } else if (type === "complete") {
          if (worker.current?._genTimeout) { clearTimeout(worker.current._genTimeout); worker.current._genTimeout = null; }
          worker.current._isGenerating = false;
          // Result processing delegated to caller via onComplete callback
          worker.current._onComplete?.(res);
          setLocalModeLoading(false);
        } else if (type === "error") {
          if (worker.current?._genTimeout) { clearTimeout(worker.current._genTimeout); worker.current._genTimeout = null; }
          worker.current._isGenerating = false;
          worker.current._onError?.(err);
          setLocalModeLoading(false);
          setLocalProgress(prev => prev?.status !== "ready" ? null : prev);
        }
      });

      worker.current._keepalive   = keepaliveInterval;
      worker.current._onVisChange = onVisChange;
    }

    return () => {
      if (worker.current) {
        clearInterval(worker.current._keepalive);
        document.removeEventListener("visibilitychange", worker.current._onVisChange);
        if (!worker.current._isGenerating) {
          worker.current.terminate();
          worker.current = null;
        }
      }
    };
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────────

  const startDownload = useCallback((modelId) => {
    if (!worker.current) return;
    setLocalProgress({ status: "initiating", progress: 0 });
    worker.current.postMessage({ type: "init", modelId });
  }, []);

  const stopDownload = useCallback(() => {
    if (worker.current) { worker.current.terminate(); worker.current = null; }
    setLocalProgress(null);
    setLocalModeLoading(false);
    setIsLocalReady(false);
  }, []);

  const deleteModel = useCallback(async () => {
    if (worker.current) { worker.current.terminate(); worker.current = null; }
    try {
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const k of keys) {
          if (k.includes("transformers") || k.includes("huggingface") || k.includes("onnx")) {
            await caches.delete(k);
          }
        }
      }
      if ("indexedDB" in window) indexedDB.deleteDatabase("transformers-cache");
    } catch (e) { console.error("Cache clear failed", e); }
    setCachedModels({ e2b: false, e4b: false });
    setIsLocalReady(false);
    setLocalProgress(null);
    setLocalModeLoading(false);
  }, []);

  const runInference = useCallback((title, modelId, { onComplete, onError, onTimeout }) => {
    if (!worker.current) return;

    setLocalModeLoading(true);
    worker.current._isGenerating = true;
    worker.current._modelId      = modelId;
    worker.current._onComplete   = onComplete;
    worker.current._onError      = onError;
    worker.current._onTimeout    = onTimeout; // Save so we can trigger it after init

    if (!isLocalReady) {
      setLocalProgress({ status: "initiating", progress: 0 });
      worker.current.postMessage({ type: "init", modelId });
      worker.current.pendingJobTitle = title;
    } else {
      // 90s hard timeout — Chrome throttles WebGPU in background tabs
      worker.current._genTimeout = setTimeout(() => {
        onTimeout?.();
        setLocalModeLoading(false);
        if (worker.current) worker.current._isGenerating = false;
      }, 90_000);
      worker.current.postMessage({ type: "generate", text: `Analyze job: ${title}`, modelId });
    }
  }, [isLocalReady]);

  return {
    // State
    localProgress, isLocalReady, localModeLoading,
    localModelVersion, setLocalModelVersion,
    webGPUSupported, cachedModels, recommendedMode,
    // Actions
    startDownload, stopDownload, deleteModel, runInference,
  };
}
