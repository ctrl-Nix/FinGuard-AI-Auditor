# 🛡️ FinGuard 3.0 — Multi-Layer Financial Audit Engine

Production-grade forensic financial auditor with a **3-layer modular architecture**.

---

## 🏗️ Architecture

```
finguard/
├── engine/
│   ├── layer1_rules.py     # Rule-Based Detection Engine
│   ├── layer2_scoring.py   # Risk Scoring System
│   ├── layer3_llm.py       # LLM Explanation Layer
│   ├── pipeline.py         # Orchestrator (ties all 3 layers)
│   └── __init__.py
├── utils/
│   ├── pdf_export.py       # Real PDF report generator
│   └── __init__.py
└── __init__.py

app.py                      # Streamlit UI
requirements.txt
```

---

## 🔵 Layer 1 — Rule-Based Detection Engine (`layer1_rules.py`)

Pure Python regex + heuristics. Zero API calls. Instant.

### Rule Categories

| Category | Examples Detected | Severity |
|---|---|---|
| `hidden_fee` | processing fee, platform fee, convenience fee | medium |
| `misleading_phrase` | guaranteed returns, 0% interest, risk-free investment | high/medium |
| `auto_renewal_trap` | auto-renews, unless cancelled, 90-day notice required | high/medium |
| `urgency_language` | act now, last chance, limited spots, today only | medium |
| `social_engineering` | verify your SSN, click here to confirm, account suspended | high |
| `laundering_signal` | shell company, layering phase, structuring deposits | high |

### Adding a New Rule

```python
# In layer1_rules.py:

def detect_my_new_risk(text: str) -> List[RuleMatch]:
    matches = []
    found = _find_all(r"\bmy_pattern\b", text)
    for match in found:
        matches.append(_build_match(
            rule_type="my_risk_type",
            severity="high",
            matched_text=match,
            explanation="Why this is risky."
        ))
    return matches

# Then register it:
RULE_REGISTRY = [
    detect_hidden_fees,
    detect_misleading_phrases,
    detect_auto_renewal,
    detect_urgency_language,
    detect_social_engineering,
    detect_laundering_signals,
    detect_my_new_risk,   # ← add here
]
```

---

## 🟠 Layer 2 — Risk Scoring System (`layer2_scoring.py`)

Aggregates all rule matches into a normalised score (0–100).

### Scoring Model

```
Severity weights:  Low=3pts  Medium=8pts  High=20pts
Repetition damper: each extra match of the same type → 60% of previous value
Diversity factor:  more unique rule types → up to 1.25× multiplier
Type multipliers:  social_engineering=1.35×  laundering_signal=1.40×
Normalisation:     score = 100 × (1 - e^(−raw/60))   [soft sigmoid cap]
```

### Score Labels

| Score | Label |
|---|---|
| 0–9 | Safe |
| 10–29 | Low Risk |
| 30–59 | Medium Risk |
| 60–84 | High Risk |
| 85–100 | Critical |

### Output Schema

```python
{
    "score": 78,
    "label": "High Risk",
    "total_matches": 12,
    "severity_counts": {"low": 2, "medium": 5, "high": 5},
    "breakdown": [
        {
            "rule_type": "misleading_phrase",
            "severity": "high",
            "matched_text": "guaranteed returns",
            "explanation": "...",
            "points_contributed": 20.0
        },
        ...
    ]
}
```

---

## 🟢 Layer 3 — LLM Explanation Layer (`layer3_llm.py`)

The LLM receives **structured findings from Layer 2**, not raw text.
It is responsible only for synthesis — not re-detection.

### What it does
- Writes a plain-language executive summary
- Explains each risk finding for non-experts
- Produces numbered, actionable remediation steps

### What it does NOT do
- Re-scan the document for new risks (Layer 1's job)
- Score anything (Layer 2's job)
- Get called if the document is clean (score=0 → skipped entirely)

### Output Schema

```python
{
    "executive_summary": "...",
    "plain_language_risks": "...",
    "recommended_actions": "...",
    "model_used": "gemini-2.5-flash-preview-04-17",
    "latency_seconds": 1.82
}
```

---

## 🔗 Pipeline Orchestrator (`pipeline.py`)

```python
from finguard.engine.pipeline import run_audit

result = run_audit(
    text="Your contract text here...",
    api_key="your-gemini-key",
    model="gemini-2.5-flash-preview-04-17",
    skip_llm=False,   # set True for offline/rules-only mode
)

print(result["risk_report"]["score"])     # e.g. 78
print(result["risk_report"]["label"])     # e.g. "High Risk"
print(result["llm_explanation"]["executive_summary"])
```

---

## 🚀 Setup

```bash
git clone https://github.com/ctrl-Nix/FinGuard-AI-Auditor.git
cd FinGuard-AI-Auditor
pip install -r requirements.txt
streamlit run app.py
```

Get a free Gemini API key at [aistudio.google.com](https://aistudio.google.com/app/apikey).

---

## 🔐 Secrets (Production)

```toml
# .streamlit/secrets.toml
GEMINI_API_KEY = "your-key-here"
```

```python
# In app.py:
api_key = st.secrets.get("GEMINI_API_KEY", "")
```

---

## ✨ Features

- **Offline mode** — Layers 1+2 work with zero API calls (toggle in sidebar)
- **Automatic LLM fallback** — Quota exhausted? Auto-retries on Flash model
- **Real PDF export** — Colour-coded severity report with full breakdown
- **JSON export** — Machine-readable audit result for downstream systems
- **3 simulation presets** — Phishing, money laundering, bad contract
- **Extensible rules** — Add new patterns in one file, zero other changes needed