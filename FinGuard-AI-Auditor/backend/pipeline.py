"""
Audit Pipeline Orchestrator
============================
Single entry point that runs all three layers in sequence and
returns a unified AuditResult. This is what app.py calls.

Usage:
    from finguard.engine.pipeline import run_audit

    result = run_audit(
        text="Your contract text here...",
        api_key="your-gemini-key",
        model="gemini-2.5-flash-preview-04-17",
    )
"""

from __future__ import annotations
import time
from typing import TypedDict, Optional

from .layer1_rules import run_all_rules, RuleMatch
from .layer2_scoring import calculate_risk_score, RiskReport
from .layer3_llm import generate_llm_explanation, LLMExplanation


class AuditResult(TypedDict):
    # Layer 1
    rule_matches: list[RuleMatch]
    # Layer 2
    risk_report: RiskReport
    # Layer 3
    llm_explanation: Optional[LLMExplanation]
    # Meta
    total_pipeline_seconds: float
    error: Optional[str]


def run_audit(
    text: str,
    api_key: str,
    model: str = "gemini-2.5-flash-preview-04-17",
    fallback_model: str = "gemini-2.0-flash",
    skip_llm: bool = False,
) -> AuditResult:
    """
    Execute the full 3-layer audit pipeline.

    Args:
        text:           Plain text to audit.
        api_key:        Gemini API key (only used by Layer 3).
        model:          Primary Gemini model for Layer 3.
        fallback_model: Fallback model if primary hits quota.
        skip_llm:       If True, skip Layer 3 (useful for testing / offline mode).

    Returns:
        AuditResult with all layer outputs and pipeline metadata.
    """
    pipeline_start = time.time()
    error: Optional[str] = None
    llm_explanation: Optional[LLMExplanation] = None

    # ── LAYER 1: Rule-Based Detection ─────────────────────────────────────────
    rule_matches = run_all_rules(text)

    # ── LAYER 2: Risk Scoring ─────────────────────────────────────────────────
    risk_report = calculate_risk_score(rule_matches)

    # ── LAYER 3: LLM Explanation ──────────────────────────────────────────────
    if not skip_llm:
        if not api_key:
            error = "API key missing — Layer 3 (LLM explanation) was skipped."
        else:
            try:
                llm_explanation = generate_llm_explanation(
                    original_text=text,
                    risk_report=risk_report,
                    api_key=api_key,
                    primary_model=model,
                    fallback_model=fallback_model,
                )
            except Exception as exc:
                error = f"Layer 3 failed: {str(exc)}"

    total_elapsed = round(time.time() - pipeline_start, 2)

    return AuditResult(
        rule_matches=rule_matches,
        risk_report=risk_report,
        llm_explanation=llm_explanation,
        total_pipeline_seconds=total_elapsed,
        error=error,
    )
