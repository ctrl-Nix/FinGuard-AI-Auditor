/**
 * api.js — typed wrappers around the FastAPI backend.
 *
 * All functions return the raw JSON on success, or throw with
 * a human-readable message on failure.
 *
 * Usage:
 *   import { checkInstant, checkFull, checkBatch, healthCheck } from "../lib/api.js";
 *
 *   const result = await checkInstant("Share your OTP now!");
 *   // result.verdict === "SCAM"
 *   // result.extracted_urls === [{url, risk, domain}]
 */

const BASE = import.meta.env.VITE_API_URL || "";
const TIMEOUT_MS = 8000;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

/**
 * Instant rules-only check. < 10ms on the server.
 * @param {string} text
 * @returns {Promise<PanicResponse>}
 */
export async function checkInstant(text) {
  return post("/api/v1/panic/check", { text });
}

/**
 * Full check with optional LLM enrichment.
 * @param {string} text
 * @param {string} [apiKey]  Gemini API key — omit to skip LLM
 * @returns {Promise<PanicResponse>}
 */
export async function checkFull(text, apiKey = "") {
  return post("/api/v1/panic/check-full", {
    text,
    use_llm:  !!apiKey,
    api_key:  apiKey || undefined,
  });
}

/**
 * Batch check up to 50 messages.
 * @param {string[]} messages
 * @returns {Promise<BatchResponse>}
 */
export async function checkBatch(messages) {
  return post("/api/v1/panic/batch", { messages });
}

/**
 * Server health check.
 * @returns {Promise<HealthResponse>}
 */
export async function healthCheck() {
  const res = await fetch(`${BASE}/api/v1/health`, {
    signal: AbortSignal.timeout(3000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/**
 * @typedef {{
 *   verdict:          "SCAM"|"SUSPICIOUS"|"SAFE",
 *   confidence:       number,
 *   reasons:          string[],
 *   what_to_do:       string[],
 *   extracted_urls:   Array<{url:string, risk:string, domain:string}>,
 *   extracted_phones: string[],
 *   sender_flags:     string[],
 *   latency_ms:       number,
 *   llm_enriched:     boolean,
 *   timestamp:        number,
 * }} PanicResponse
 *
 * @typedef {{
 *   results:         Array<{message:string, verdict:string, confidence:number, reasons:string[], latency_ms:number}>,
 *   summary:         {total:number, scam:number, suspicious:number, safe:number},
 *   total_latency_ms: number,
 * }} BatchResponse
 *
 * @typedef {{ status:string, version:string, engine:string, timestamp:number }} HealthResponse
 */
