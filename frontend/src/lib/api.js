/**
 * api.js — typed wrappers around the FastAPI backend.
 *
 * All functions return the raw JSON on success, or throw with
 * a human-readable message on failure.
 */

const BASE = import.meta.env.VITE_API_URL || "https://finguard-api-9l4o.onrender.com";
const TIMEOUT_MS = 8000;

function buildHeaders() {
  const headers = { "Content-Type": "application/json" };
  const key = import.meta.env.VITE_FINGUARD_API_KEY || "";
  if (key) headers["X-API-Key"] = key;
  return headers;
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  "POST",
    headers: buildHeaders(),
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function checkInstant(text) {
  return post("/api/v1/panic/check", { text });
}

export async function checkFull(text, apiKey = "") {
  return post("/api/v1/panic/check-full", {
    text,
    use_llm:  !!apiKey,
    api_key:  apiKey || undefined,
  });
}

export async function checkBatch(messages) {
  return post("/api/v1/panic/batch", { messages });
}

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