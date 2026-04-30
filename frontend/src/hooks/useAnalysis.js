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
import { analyzeText } from "../engine/analyzer.js";

const API_URL = import.meta.env.VITE_API_URL || "";

async function fetchFromAPI(text) {
  const res = await fetch(`${API_URL}/api/v1/panic/check-full`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ text, use_llm: false }),
    signal:  AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
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

  const analyze = useCallback(async (text, { useBackend = false } = {}) => {
    // Cancel any pending API call
    if (abortRef.current) abortRef.current.abort();

    setIsRunning(true);
    setApiResult(null);
    setApiError(null);

    // 1. Instant local result
    await new Promise(r => setTimeout(r, 80)); // brief tick for loading UX
    const local = analyzeText(text);
    setResult(local);
    setRunKey(k => k + 1);
    setIsRunning(false);

    // 2. Optional server enrichment
    if (useBackend && API_URL) {
      setApiLoading(true);
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const serverData = await fetchFromAPI(text);
        if (!ctrl.signal.aborted) {
          setApiResult(serverData);
        }
      } catch (e) {
        if (!ctrl.signal.aborted) {
          setApiError(e.message || "API unreachable");
        }
      } finally {
        if (!ctrl.signal.aborted) setApiLoading(false);
      }
    }
  }, []);

  return { result, isRunning, apiResult, apiError, apiLoading, runKey, analyze };
}
