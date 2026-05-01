/**
 * useAnalysis — orchestrates client-side + optional server-side analysis.
 *
 * Strategy:
 *   1. Always run the local JS engine instantly (< 5ms, no network)
 *   2. If `useBackend` is true and API_URL is set, also call the FastAPI
 *      backend and merge the result (server result wins on score/verdict).
 *
 * This gives instant feedback with an optional richer server confirmation.
 */
import { useState, useCallback, useRef } from "react";
import { analyzeText, verdictFromScore, generateNegotiation } from "../engine/analyzer.js";

const API_URL = import.meta.env.VITE_API_URL || "";

async function fetchFromAPI(text, apiKey = null) {
  const res = await fetch(`${API_URL}/api/v1/panic/check-full`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ 
      text, 
      use_llm: !!apiKey, 
      api_key: apiKey 
    }),
    signal:  AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

async function uploadFileToAPI(file, apiKey = null) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("use_llm", "true");
  if (apiKey) formData.append("api_key", apiKey);

  const res = await fetch(`${API_URL}/api/v1/panic/upload`, {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(15000), // longer timeout for OCR/Gemini
  });
  if (!res.ok) throw new Error(`Upload Failed: ${res.status}`);
  return res.json();
}

export function useAnalysis() {
  const [result,      setResult]      = useState(null);
  const [isRunning,   setIsRunning]   = useState(false);
  const [apiResult,   setApiResult]   = useState(null);
  const [apiError,    setApiError]    = useState(null);
  const [apiLoading,  setApiLoading]  = useState(false);
  const [runKey,      setRunKey]      = useState(0);
  const abortRef = useRef(null);

  const getActiveConfig = () => {
    const activeProvider = localStorage.getItem("FINGUARD_ACTIVE_PROVIDER") || "gemini";
    const keys = JSON.parse(localStorage.getItem("FINGUARD_KEYS") || "{}");
    const models = JSON.parse(localStorage.getItem("FINGUARD_MODELS") || "{}");
    
    return {
      provider: activeProvider,
      apiKey: keys[activeProvider] || localStorage.getItem("FINGUARD_API_KEY") || null,
      model: models[activeProvider] || null
    };
  };

  const analyze = useCallback(async (text, { useBackend = false } = {}) => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(true);
    setApiResult(null);
    setApiError(null);

    await new Promise(r => setTimeout(r, 80));
    const local = analyzeText(text);
    setResult(local);
    setRunKey(k => k + 1);
    setIsRunning(false);

    const { provider, apiKey, model } = getActiveConfig();
    
    if ((useBackend || apiKey) && API_URL) {
      setApiLoading(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const serverData = await fetch(`${API_URL}/api/v1/panic/check-full`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            text, 
            use_llm: !!apiKey, 
            api_key: apiKey,
            provider,
            model
          }),
          signal: ctrl.signal,
        }).then(r => r.ok ? r.json() : Promise.reject(`API ${r.status}`));
        
        if (!ctrl.signal.aborted) setApiResult(serverData);
      } catch (e) {
        if (!ctrl.signal.aborted) setApiError(e.message || "API unreachable");
      } finally {
        if (!ctrl.signal.aborted) setApiLoading(false);
      }
    }
  }, []);

  const analyzeFile = useCallback(async (file) => {
    if (abortRef.current) abortRef.current.abort();
    setIsRunning(true);
    setApiResult(null);
    setApiError(null);
    setApiLoading(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const { provider, apiKey, model } = getActiveConfig();
      
      const formData = new FormData();
      formData.append("file", file);
      formData.append("use_llm", "true");
      if (apiKey) {
        formData.append("api_key", apiKey);
        formData.append("provider", provider);
        if (model) formData.append("model", model);
      }

      const serverData = await fetch(`${API_URL}/api/v1/panic/upload`, {
        method: "POST",
        body: formData,
        signal: ctrl.signal,
      }).then(r => r.ok ? r.json() : Promise.reject(`Upload Failed: ${r.status}`));

      if (!ctrl.signal.aborted) {
        // Map server result back to client format
        const serverMatches = (serverData.heatmap || []).map((h, i) => ({
          ...h,
          id: `svr-${i}`,
          index: h.start,
          text: h.text,
          type: h.type || "suspicious_pattern",
          severity: h.severity || "medium"
        }));

        setApiResult(serverData);
        setResult({
          score: serverData.confidence,
          verdict: verdictFromScore(serverData.confidence),
          matches: serverMatches,
          byType: {},
          severityCounts: { 
            high: serverMatches.filter(m => m.severity === "high").length, 
            medium: serverMatches.filter(m => m.severity === "medium").length, 
            low: serverMatches.filter(m => m.severity === "low").length 
          },
          highlights: {
            topRisk: serverData.reasons?.[0] || "Critical signal detected in file.",
            hiddenCost: serverMatches.find(m => m.type === "hidden_fee")?.reason || "Check for buried charges.",
            exitPlan: serverMatches.find(m => m.type === "auto_renewal_trap")?.reason || "Check cancellation clauses."
          },
          negotiation: generateNegotiation(serverMatches)
        });
        setRunKey(k => k + 1);
      }
    } catch (e) {
      if (!ctrl.signal.aborted) setApiError(e.message || "File analysis failed");
    } finally {
      if (!ctrl.signal.aborted) {
        setApiLoading(false);
        setIsRunning(false);
      }
    }
  }, []);

  const exportAudit = useCallback(async (text) => {
    try {
      const res = await fetch(`${API_URL}/api/v1/panic/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, use_llm: true }),
      });
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FinGuard_Audit_${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  }, []);

  return { result, isRunning, apiResult, apiError, apiLoading, runKey, analyze, analyzeFile, exportAudit };
}
