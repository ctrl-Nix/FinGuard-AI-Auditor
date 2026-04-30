"""
LAYER 3 — LLM Explanation Layer
=================================
The LLM is called ONLY after Layers 1 and 2 have completed.
It receives a structured summary of findings (NOT raw text) and is asked
to do only what rule-based systems cannot: synthesise, explain in plain
language, and suggest concrete remediation steps.

This keeps LLM usage cheap, fast, and deterministic in structure.
"""

from __future__ import annotations
import time
import json
from typing import TypedDict

try:
    # Prefer new SDK (google-genai >= 0.5)
    from google import genai as genai_new
    from google.genai import types as genai_types
    _USE_NEW_SDK = True
except ImportError:
    import google.generativeai as genai  # type: ignore
    _USE_NEW_SDK = False

from .layer2_scoring import RiskReport


# ── Output type ───────────────────────────────────────────────────────────────

class LLMExplanation(TypedDict):
    executive_summary: str       # 2-sentence plain-English overview
    plain_language_risks: str    # each risk explained for a non-expert
    recommended_actions: str     # numbered, concrete steps
    model_used: str
    latency_seconds: float


# ── Prompt builder ────────────────────────────────────────────────────────────

def _build_prompt(original_text: str, risk_report: RiskReport) -> str:
    """
    Construct a tight, structured prompt from Layer 1+2 outputs.
    The LLM receives pre-analysed findings, NOT the raw document —
    so it spends tokens on synthesis, not re-detection.
    """
    breakdown_summary = "\n".join(
        f"  - [{item['severity'].upper()}] {item['rule_type']}: "
        f"matched '{item['matched_text']}' — {item['explanation']}"
        for item in risk_report["breakdown"]
    )

    return f"""You are FinGuard 3.0, a forensic financial risk analyst.

A rule-based detection engine has already analysed a financial document and produced the following structured findings. Your job is to synthesise these findings for a non-expert reader. Do NOT re-analyse the original text. Work only from the structured findings below.

──────────────────────────────────────
RISK SCORE: {risk_report['score']}/100 ({risk_report['label']})
TOTAL FLAGS: {risk_report['total_matches']}
SEVERITY BREAKDOWN: Low={risk_report['severity_counts']['low']}, Medium={risk_report['severity_counts']['medium']}, High={risk_report['severity_counts']['high']}

DETAILED FINDINGS:
{breakdown_summary if breakdown_summary else "  No rule violations detected."}
──────────────────────────────────────

ORIGINAL DOCUMENT EXCERPT (for context only — do not re-scan for new risks):
\"\"\"{original_text[:2000]}\"\"\"

──────────────────────────────────────
Respond in EXACTLY this JSON format. No markdown fences, no extra keys:
{{
  "executive_summary": "<2 crisp sentences summarising the overall risk>",
  "plain_language_risks": "<explain each finding in plain English, one paragraph per finding, suitable for someone with no legal/financial background>",
  "recommended_actions": "<numbered list of concrete, actionable steps the reader should take>"
}}
"""


# ── API call with fallback ────────────────────────────────────────────────────

def _attempt_new_sdk(prompt: str, model_name: str, api_key: str) -> str:
    """Call using the new google-genai SDK (google-genai package)."""
    client = genai_new.Client(api_key=api_key)
    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.2,
            max_output_tokens=1024,
        ),
    )
    return response.text


def _attempt_old_sdk(prompt: str, model_name: str, api_key: str) -> str:
    """Call using the legacy google-generativeai SDK."""
    import google.generativeai as _old_genai  # type: ignore
    _old_genai.configure(api_key=api_key)
    model = _old_genai.GenerativeModel(
        model_name,
        generation_config=_old_genai.GenerationConfig(
            temperature=0.2,
            max_output_tokens=1024,
        ),
    )
    return model.generate_content(prompt).text


def _call_gemini(
    prompt: str,
    primary_model: str,
    fallback_model: str,
    api_key: str,
) -> tuple[str, str]:
    """
    Call Gemini with automatic fallback on quota exhaustion.
    Prefers the new google-genai SDK; falls back to legacy SDK if unavailable.
    Returns (response_text, model_name_used).
    """
    _attempt = _attempt_new_sdk if _USE_NEW_SDK else _attempt_old_sdk

    # Quota errors differ slightly between SDKs — catch both
    _quota_errors = (Exception,)
    try:
        from google.api_core import exceptions as _gax
        _quota_errors = (_gax.ResourceExhausted,)
    except ImportError:
        pass

    try:
        return _attempt(prompt, primary_model, api_key), primary_model
    except _quota_errors:
        time.sleep(1)
        try:
            return _attempt(prompt, fallback_model, api_key), f"{fallback_model} (fallback)"
        except Exception as exc:
            raise RuntimeError(f"Both models exhausted quota: {exc}") from exc
    except Exception as exc:
        # If primary fails for any other reason, try fallback once
        try:
            return _attempt(prompt, fallback_model, api_key), f"{fallback_model} (fallback)"
        except Exception as exc2:
            raise RuntimeError(f"Gemini call failed on both models: primary={exc} fallback={exc2}") from exc2


# ── JSON parser with graceful degradation ─────────────────────────────────────

def _parse_llm_json(raw: str) -> dict:
    """
    Parse LLM JSON output robustly. If JSON fails, extract sections manually.
    """
    # Strip markdown code fences if the LLM ignored instructions
    clean = raw.strip()
    if clean.startswith("```"):
        clean = "\n".join(clean.split("\n")[1:])
    if clean.endswith("```"):
        clean = "\n".join(clean.split("\n")[:-1])
    clean = clean.strip()

    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        # Graceful degradation: return the raw text in a structured wrapper
        return {
            "executive_summary": "LLM response could not be parsed as JSON.",
            "plain_language_risks": clean,
            "recommended_actions": "Please review the findings above manually.",
        }


# ── Public interface ──────────────────────────────────────────────────────────

def generate_llm_explanation(
    original_text: str,
    risk_report: RiskReport,
    api_key: str,
    primary_model: str = "gemini-2.5-flash-preview-04-17",
    fallback_model: str = "gemini-2.0-flash",
) -> LLMExplanation:
    """
    Layer 3 entry point.

    Args:
        original_text:  The raw input document (text only).
        risk_report:    Fully populated RiskReport from Layer 2.
        api_key:        Google Gemini API key.
        primary_model:  Model to try first.
        fallback_model: Model to use if primary hits quota limits.

    Returns:
        LLMExplanation dict with plain-English summary and actions.
    """
    # Short-circuit: if score is 0, skip the API call entirely
    if risk_report["score"] == 0 and risk_report["total_matches"] == 0:
        return LLMExplanation(
            executive_summary="No risk indicators were detected in this document.",
            plain_language_risks="The rule-based engine found no suspicious patterns.",
            recommended_actions="No immediate action required. Continue standard document review practices.",
            model_used="none (skipped — clean document)",
            latency_seconds=0.0,
        )

    prompt = _build_prompt(original_text, risk_report)
    start = time.time()
    raw_response, model_used = _call_gemini(prompt, primary_model, fallback_model, api_key)
    elapsed = round(time.time() - start, 2)

    parsed = _parse_llm_json(raw_response)

    return LLMExplanation(
        executive_summary=parsed.get("executive_summary", ""),
        plain_language_risks=parsed.get("plain_language_risks", ""),
        recommended_actions=parsed.get("recommended_actions", ""),
        model_used=model_used,
        latency_seconds=elapsed,
    )
