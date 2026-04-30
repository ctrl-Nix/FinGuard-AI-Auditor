"""
Panic Mode API  v1
==================
FastAPI backend for ultra-fast scam detection.

Endpoints:
  GET  /api/v1/health          health check
  POST /api/v1/panic/check     instant rules-only (<10ms)
  POST /api/v1/panic/check-full  optional LLM enrichment (<2s)
  POST /api/v1/panic/batch     batch check up to 50 messages (5/min)

Run:
  uvicorn finguard.api.panic_api:app --host 0.0.0.0 --port 8000 --reload
"""

from __future__ import annotations
import time, os
from typing import List, Optional

from fastapi import FastAPI, Request, HTTPException, Security, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security.api_key import APIKeyHeader
from pydantic import BaseModel, Field, field_validator

try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _RL = True
except ImportError:
    _RL = False

from panic_engine import run_panic_check, enrich_with_llm, analyze_image
from file_utils import extract_text_from_pdf, extract_text_from_docx, is_image, is_pdf, is_docx
from pdf_export import generate_legal_bundle

_VERSION = "1.0.0"

# ── API Key Auth ──────────────────────────────────────────────────────────────
# Set FINGUARD_API_KEY in your .env to enable protection.
# If left empty, the API runs open (fine for local dev).

API_KEY_NAME = "X-API-Key"
_api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def verify_api_key(key: str = Security(_api_key_header)):
    required = os.getenv("FINGUARD_API_KEY", "")
    if required and key != required:
        raise HTTPException(status_code=403, detail="Invalid or missing API key")
    return key


# ── Schemas ───────────────────────────────────────────────────────────────────

class PanicRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    api_key: Optional[str] = Field(None)
    use_llm: bool = Field(False)

    @field_validator("text")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be blank")
        return v


class BatchRequest(BaseModel):
    messages: List[str] = Field(..., min_length=1, max_length=50)

    @field_validator("messages")
    @classmethod
    def cap_messages(cls, v: List[str]) -> List[str]:
        if len(v) > 50:
            raise ValueError("Maximum 50 messages per batch")
        return [m[:4800] for m in v]  # bumped from 2000 to match extension chunking


class URLInfo(BaseModel):
    url: str
    risk: str
    domain: str


class PanicResponse(BaseModel):
    verdict: str
    confidence: int
    reasons: List[str]
    what_to_do: List[str]
    extracted_urls: List[URLInfo]
    extracted_phones: List[str]
    sender_flags: List[str]
    latency_ms: int
    llm_enriched: bool
    timestamp: float
    heatmap: List[dict] = []


class BatchItem(BaseModel):
    message: str
    verdict: str
    confidence: int
    reasons: List[str]
    extracted_urls: List[URLInfo]
    extracted_phones: List[str]
    latency_ms: int


class BatchResponse(BaseModel):
    results: List[BatchItem]
    summary: dict
    total_latency_ms: int


class HealthResponse(BaseModel):
    status: str
    version: str
    engine: str
    timestamp: float


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_response(result) -> PanicResponse:
    return PanicResponse(
        verdict=result.verdict,
        confidence=result.confidence,
        reasons=result.reasons,
        what_to_do=result.what_to_do,
        extracted_urls=[URLInfo(**u) for u in result.extracted_urls],
        extracted_phones=result.extracted_phones,
        sender_flags=result.sender_flags,
        latency_ms=result.latency_ms,
        llm_enriched=result.llm_enriched,
        timestamp=time.time(),
        heatmap=result.heatmap,
    )


# ── App ───────────────────────────────────────────────────────────────────────

if _RL:
    limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])

app = FastAPI(
    title="FinGuard Panic Mode API",
    description="Ultra-fast scam detection. Rules-only <10ms, with LLM <2s.",
    version=_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS — lock this down once you have a real domain ─────────────────────────
# For local dev: leave CORS_ORIGINS unset (defaults to localhost only).
# For production: set CORS_ORIGINS=https://yourapp.com in your .env
_default_origins = "http://localhost:5173,http://localhost:8501,http://localhost:3000"
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", _default_origins).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
if _RL:
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse, tags=["Meta"])
def health():
    """Liveness check — no auth required."""
    return HealthResponse(status="ok", version=_VERSION,
                          engine="FinGuard Panic Mode v1", timestamp=time.time())


@app.post("/api/v1/panic/check", response_model=PanicResponse, tags=["Panic"])
def check_instant(req: PanicRequest, request: Request, _=Security(verify_api_key)):
    """Stage 1+2 rules only. <10ms."""
    return _to_response(run_panic_check(req.text))


@app.post("/api/v1/panic/check-full", response_model=PanicResponse, tags=["Panic"])
def check_full(req: PanicRequest, request: Request, _=Security(verify_api_key)):
    """Stage 1+2+3. LLM fires only in ambiguous 15-79% band. <2s."""
    result = run_panic_check(req.text)
    if req.use_llm:
        key = req.api_key or os.getenv("GEMINI_API_KEY", "")
        if key:
            result = enrich_with_llm(result, req.text, key)
    return _to_response(result)


@app.post("/api/v1/panic/batch", response_model=BatchResponse, tags=["Panic"])
def check_batch(req: BatchRequest, request: Request, _=Security(verify_api_key)):
    """Batch check up to 50 messages (rules-only). Rate: 5/min."""
    t0 = time.perf_counter()
    items, counts = [], {"scam": 0, "suspicious": 0, "safe": 0}
    for msg in req.messages:
        if not msg.strip():
            continue
        r = run_panic_check(msg)
        counts[r.verdict.lower()] = counts.get(r.verdict.lower(), 0) + 1
        items.append(BatchItem(
            message=msg[:100] + ("..." if len(msg) > 100 else ""),
            verdict=r.verdict, confidence=r.confidence, reasons=r.reasons,
            extracted_urls=[URLInfo(**u) for u in r.extracted_urls],
            extracted_phones=r.extracted_phones, latency_ms=r.latency_ms,
        ))
    return BatchResponse(
        results=items,
        summary={"total": len(items), **counts},
        total_latency_ms=round((time.perf_counter() - t0) * 1000),
    )


@app.post("/api/v1/panic/upload", response_model=PanicResponse, tags=["Panic"])
async def upload_file(
    request: Request,
    file: UploadFile = File(...),
    api_key: Optional[str] = None,
    use_llm: bool = True,
    _=Security(verify_api_key)
):
    """
    Upload a file (PDF, DOCX, or Image) for analysis.
    - Images are analyzed via Multimodal Gemini.
    - PDF/DOCX are parsed and analyzed via text engine.
    """
    content = await file.read()
    filename = file.filename or "unknown"

    if is_image(filename):
        key = api_key or os.getenv("GEMINI_API_KEY", "")
        return _to_response(analyze_image(content, key))
    
    # Text extraction for docs
    text = ""
    if is_pdf(filename):
        text = extract_text_from_pdf(content)
    elif is_docx(filename):
        text = extract_text_from_docx(content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use PDF, DOCX, or Image.")

    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from the document.")

    # Run normal analysis
    result = run_panic_check(text)
    if use_llm:
        key = api_key or os.getenv("GEMINI_API_KEY", "")
        if key:
            result = enrich_with_llm(result, text, key)
    
    return _to_response(result)


class ReportRequest(BaseModel):
    pattern: str = Field(..., min_length=3, max_length=100)
    reason: str = Field(..., min_length=3, max_length=100)

@app.post("/api/v1/panic/report", tags=["Meta"])
async def report_scam(req: ReportRequest, _=Security(verify_api_key)):
    """
    Crowdsource a new scam signal. 
    Updates the Layer 1 rules for everyone in real-time.
    """
    from scam_vault import VAULT
    VAULT.add_rule(req.pattern, req.reason)
    return {"status": "success", "message": "Scam signal added to Global Intelligence."}


@app.post("/api/v1/panic/export", tags=["Panic"])
async def export_audit(req: PanicRequest, _=Security(verify_api_key)):
    """
    Generate and download a Forensic PDF Legal Bundle.
    """
    result = run_panic_check(req.text)
    key = req.api_key or os.getenv("GEMINI_API_KEY", "")
    
    if key:
        result = enrich_with_llm(result, req.text, key)
        # Also enrich URLs for the report
        if result.extracted_urls:
            from panic_engine import enrich_urls_with_reputation
            result.extracted_urls = enrich_urls_with_reputation(result.extracted_urls, key)

    # Convert to dict for the PDF generator
    import dataclasses
    result_dict = dataclasses.asdict(result)
    
    pdf_bytes = generate_legal_bundle(result_dict, req.text)
    
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=FinGuard_Audit_{int(time.time())}.pdf"
        }
    )


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500,
                        content={"error": "Internal server error", "detail": str(exc)})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("finguard.api.panic_api:app", host="0.0.0.0",
                port=int(os.getenv("PORT", "8000")), reload=True)