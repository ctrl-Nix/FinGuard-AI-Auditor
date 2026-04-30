# 🛡️ FinGuard 3.0 — AI Financial Audit Engine

Production-grade financial safety system with two modes:

| Mode | Speed | Use case |
|---|---|---|
| 🚨 **Panic Mode** | < 10ms (rules) / < 2s (+ AI) | Instant scam check on any message |
| 🛡️ **Audit Mode** | 1–5s | Deep 3-layer forensic document analysis |

---

## 📐 Architecture

```
finguard/
├── engine/
│   ├── panic_engine.py     ← Panic Mode: fast scam detector (45+ signals)
│   ├── layer1_rules.py     ← Audit: regex/heuristic rule engine
│   ├── layer2_scoring.py   ← Audit: risk scoring (sigmoid normalisation)
│   ├── layer3_llm.py       ← Audit: LLM synthesis layer
│   ├── pipeline.py         ← Audit orchestrator
│   └── __init__.py
├── api/
│   ├── panic_api.py        ← FastAPI REST server (rate-limited)
│   └── __init__.py
└── utils/
    └── pdf_export.py       ← Real PDF report generator

app.py                      ← Streamlit UI (both modes)
panic_mode.py               ← Panic Mode UI component
cli.py                      ← Terminal interface
tests/
└── test_finguard.py        ← 119 pytest tests
```

---

## 🚀 Quick Start

```bash
git clone https://github.com/ctrl-Nix/FinGuard-AI-Auditor.git
cd FinGuard-AI-Auditor
pip install -r requirements.txt

# Copy and fill in your API key
cp .env.example .env

# Run the Streamlit app
streamlit run app.py
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).

---

## 🚨 Panic Mode

Paste any suspicious SMS, WhatsApp message, or email. Get an instant verdict.

### How it works

**Stage 1+2 (always, < 10ms):** 45+ weighted regex signals across 8 categories:

| Category | Examples |
|---|---|
| OTP harvesting | "share your OTP", "enter PIN" |
| Financial bait | "guaranteed returns", "you won", "unclaimed funds" |
| Urgency pressure | "act now", "expires in 2 hours", "last chance" |
| Impersonation | "SBI alert", "RBI notice", "Amazon team" |
| Suspicious URLs | `bit.ly/...`, unrecognised domains |
| Sensitive data | "CVV", "card number", "Aadhaar" |
| Payment tricks | "send ₹", "pay advance", "USDT wallet" |
| Social engineering | "keep confidential", "do not tell anyone" |

Trust signal dampeners cancel false positives: `"do not share OTP"` = −35pts, `"bank never asks"` = −25pts.

**Stage 3 (optional, + ~1s):** LLM fires only in the ambiguous 15–79% band. Skipped for clear SCAMs and clean messages.

### Output

```json
{
  "verdict": "SCAM",
  "confidence": 89,
  "reasons": ["Asks you to share your OTP", "Uses URL shortener"],
  "what_to_do": ["🚫 Do NOT click any links", "🔒 Never share OTP"],
  "extracted_urls": [{"url": "bit.ly/abc", "risk": "shortened", "domain": "bit.ly"}],
  "extracted_phones": ["9876543210"],
  "sender_flags": ["Impersonates a trusted bank while requesting sensitive action"],
  "latency_ms": 4,
  "llm_enriched": false
}
```

### Verdict thresholds

| Score | Label |
|---|---|
| 0–29 | ✅ SAFE |
| 30–64 | ⚠️ SUSPICIOUS |
| 65–100 | 🚨 SCAM |

---

## 🛡️ Audit Mode — 3-Layer Pipeline

Deep forensic analysis for contracts, invoices, and financial documents.

### Layer 1 — Rule Engine (`layer1_rules.py`)

Pure regex, zero API calls, instant. Add new rules in one place:

```python
# In layer1_rules.py:
def detect_my_rule(text: str) -> List[RuleMatch]:
    matches = []
    for hit in _find_all(r"\bmy_pattern\b", text):
        matches.append(_build_match(
            rule_type="my_risk_type",
            severity="high",          # "low" | "medium" | "high"
            matched_text=hit,
            explanation="Why this is risky."
        ))
    return matches

# Register it:
RULE_REGISTRY = [..., detect_my_rule]
```

### Layer 2 — Risk Scorer (`layer2_scoring.py`)

```
Severity weights:    Low=3pts  Medium=8pts  High=20pts
Repetition damper:  each extra same-type match → 60% of previous
Diversity factor:   more unique risk types → up to 1.25× multiplier
Type multipliers:   social_engineering=1.35×  laundering_signal=1.40×
Normalisation:      score = 100 × (1 − e^(−raw/60))   ← soft sigmoid cap
```

Score labels: `Safe (0–9)` · `Low Risk (10–29)` · `Medium Risk (30–59)` · `High Risk (60–84)` · `Critical (85–100)`

### Layer 3 — LLM Layer (`layer3_llm.py`)

The LLM receives **pre-structured findings from L1+L2**, not raw text. It only synthesises — never re-scans.

Skipped entirely when score = 0 (clean document). Outputs:
- `executive_summary` — 2 plain sentences
- `plain_language_risks` — each finding explained for non-experts
- `recommended_actions` — numbered, actionable steps

---

## 🔌 REST API

```bash
# Start the API server
uvicorn finguard.api.panic_api:app --host 0.0.0.0 --port 8000 --reload
# Docs at: http://localhost:8000/docs
```

### Endpoints

| Method | Path | Description | Rate limit |
|---|---|---|---|
| `GET` | `/api/v1/health` | Liveness check | — |
| `POST` | `/api/v1/panic/check` | Instant rules-only (<10ms) | 30/min |
| `POST` | `/api/v1/panic/check-full` | With optional LLM (<2s) | 30/min |
| `POST` | `/api/v1/panic/batch` | Up to 50 messages at once | 5/min |

### Example

```bash
curl -X POST http://localhost:8000/api/v1/panic/check \
  -H "Content-Type: application/json" \
  -d '{"text": "Congratulations! You won Rs.2 lakh. Share OTP to claim."}'
```

```json
{
  "verdict": "SCAM",
  "confidence": 83,
  "reasons": ["Lottery/prize claim", "Asks you to share your OTP"],
  "what_to_do": ["🚫 Do NOT click any links", "..."],
  "extracted_urls": [],
  "extracted_phones": [],
  "sender_flags": [],
  "latency_ms": 2,
  "llm_enriched": false,
  "timestamp": 1712345678.9
}
```

### Batch check

```bash
curl -X POST http://localhost:8000/api/v1/panic/batch \
  -H "Content-Type: application/json" \
  -d '{"messages": ["Share OTP now", "Invoice attached", "You won a prize"]}'
```

---

## 💻 CLI

```bash
# Instant scam check
python cli.py panic "Your account is blocked. Share OTP now."

# From stdin
echo "Suspicious message" | python cli.py panic -

# From file
python cli.py panic --file sms.txt

# With AI enrichment
python cli.py panic --llm --api-key YOUR_KEY --file sms.txt

# Batch check (one message per line)
python cli.py batch --file messages.txt

# Full 3-layer audit
python cli.py audit --file contract.pdf --api-key YOUR_KEY

# Rules-only audit (no API key needed)
python cli.py audit --file contract.txt --no-llm

# JSON output (for piping)
python cli.py panic "message" --json | jq .verdict

# Start API server
python cli.py serve --port 8000

# Exit codes: 0=SAFE  1=SUSPICIOUS  2=SCAM (for shell scripting)
if python cli.py panic "suspicious text" --json > /dev/null; then
  echo "Safe"
fi
```

---

## 🐳 Docker

```bash
# Build
docker build -t finguard:latest .

# Run Streamlit UI
docker run -p 8501:8501 --env-file .env finguard:latest streamlit

# Run API server
docker run -p 8000:8000 --env-file .env finguard:latest api

# Run CLI
docker run --env-file .env finguard:latest cli panic "Your OTP is..."

# Docker Compose (both services)
docker compose up
```

---

## 🧪 Tests

```bash
# Run all tests (no API key needed)
pytest tests/ -m "not slow" -v

# Run with API key (includes real LLM calls)
GEMINI_API_KEY=your_key pytest tests/ -v

# Run just panic engine tests
pytest tests/ -k "Panic" -v

# Run just API tests
pytest tests/ -k "API" -v

# Coverage
pytest tests/ -m "not slow" --cov=finguard --cov-report=term-missing
```

**119 tests** across:
- Layer 1 rule detection (all 6 rule categories)
- Layer 2 risk scoring (score bounds, labels, severity counts)
- Panic engine (verdict accuracy, performance <50ms, Unicode, trust dampening)
- Extraction (URLs, phones, sender spoofing)
- REST API (all 4 endpoints, schema, rate limiting logic)
- Package public API
- Full pipeline integration
- Slow tests (real LLM) — skipped without `GEMINI_API_KEY`

---

## 🔐 Security

```toml
# .streamlit/secrets.toml — for Streamlit Cloud deployment
GEMINI_API_KEY = "your-key-here"
```

```python
# In app.py — reads from secrets automatically
api_key = st.secrets.get("GEMINI_API_KEY", "")
```

**Never commit `.env` or real API keys.** The `.gitignore` below covers the essentials:

```gitignore
.env
*.pyc
__pycache__/
.streamlit/secrets.toml
finguard_report.pdf
```

---

## 📦 Dependencies

| Package | Purpose |
|---|---|
| `streamlit` | Web UI |
| `google-genai` | Gemini API (new SDK) |
| `google-generativeai` | Gemini API (legacy fallback) |
| `pypdf` | PDF text extraction |
| `Pillow` | Image handling |
| `fpdf2` | PDF report generation |
| `fastapi` | REST API server |
| `uvicorn` | ASGI server |
| `slowapi` | Rate limiting |
| `pytest` | Test runner |
