"""
LAYER 2 — Risk Scoring System
==============================
Aggregates all RuleMatch results from Layer 1 into a single normalised
risk score (0–100) with a human-readable label and full breakdown.

Scoring model:
  - Base score is built from severity weights per match
  - High-risk rule types apply a multiplier on top of the raw score
  - Score is capped at 100 and normalised non-linearly so even a single
    high-severity hit pushes the score meaningfully above zero
  - Diversity bonus: more unique rule types = higher score ceiling

Output schema:
  {
    "score": int (0–100),
    "label": str ("Safe" | "Low Risk" | "Medium Risk" | "High Risk" | "Critical"),
    "breakdown": List[BreakdownItem],
    "total_matches": int,
    "severity_counts": {"low": int, "medium": int, "high": int},
  }
"""

from __future__ import annotations
from typing import TypedDict, List
from collections import Counter

from .layer1_rules import RuleMatch


# ── Type contracts ─────────────────────────────────────────────────────────────

class BreakdownItem(TypedDict):
    rule_type: str
    severity: str
    matched_text: str
    explanation: str
    points_contributed: float


class RiskReport(TypedDict):
    score: int
    label: str
    breakdown: List[BreakdownItem]
    total_matches: int
    severity_counts: dict


# ── Scoring constants ──────────────────────────────────────────────────────────

SEVERITY_WEIGHTS: dict[str, float] = {
    "low":    3.0,
    "medium": 8.0,
    "high":  20.0,
}

# Rule types that are especially dangerous — they multiply the total score
HIGH_RISK_TYPE_MULTIPLIERS: dict[str, float] = {
    "social_engineering":  1.35,
    "laundering_signal":   1.40,
    "misleading_phrase":   1.10,   # only when severity=high matches present
}

# Score thresholds → label
SCORE_LABELS: List[tuple[int, str]] = [
    (0,   "Safe"),
    (10,  "Low Risk"),
    (30,  "Medium Risk"),
    (60,  "High Risk"),
    (85,  "Critical"),
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _label_for_score(score: int) -> str:
    label = "Safe"
    for threshold, name in SCORE_LABELS:
        if score >= threshold:
            label = name
    return label


def _diversity_factor(matches: List[RuleMatch]) -> float:
    """
    Reward breadth: more distinct risk categories = higher confidence in score.
    Returns a multiplier between 1.0 and 1.25.
    """
    unique_types = len({m["type"] for m in matches if m["type"] != "rule_error"})
    return min(1.0 + (unique_types - 1) * 0.05, 1.25)


def _repetition_dampener(matches: List[RuleMatch]) -> float:
    """
    Prevent score explosion from many matches of the same type.
    Each extra match of the same type is worth diminishing points.
    """
    type_counts = Counter(m["type"] for m in matches)
    total_effective = 0.0
    for count in type_counts.values():
        # First match: full weight; each subsequent: 60% of previous
        effective = sum(0.6 ** i for i in range(count))
        total_effective += effective
    raw_total = sum(1 for _ in matches)
    return total_effective / raw_total if raw_total else 1.0


# ── Main scoring function ─────────────────────────────────────────────────────

def calculate_risk_score(matches: List[RuleMatch]) -> RiskReport:
    """
    Given a flat list of RuleMatch dicts (Layer 1 output),
    return a full RiskReport.
    """
    if not matches:
        return RiskReport(
            score=0,
            label="Safe",
            breakdown=[],
            total_matches=0,
            severity_counts={"low": 0, "medium": 0, "high": 0},
        )

    severity_counts: dict[str, int] = {"low": 0, "medium": 0, "high": 0}
    raw_points = 0.0
    breakdown: List[BreakdownItem] = []

    for match in matches:
        sev = match["severity"] if match["severity"] in SEVERITY_WEIGHTS else "low"
        base_points = SEVERITY_WEIGHTS[sev]
        severity_counts[sev] = severity_counts.get(sev, 0) + 1
        raw_points += base_points

        breakdown.append(BreakdownItem(
            rule_type=match["type"],
            severity=sev,
            matched_text=match["matched_text"],
            explanation=match["explanation"],
            points_contributed=round(base_points, 2),
        ))

    # Repetition dampener — prevent spamming the same rule type
    dampener = _repetition_dampener(matches)
    raw_points *= dampener

    # Diversity bonus
    raw_points *= _diversity_factor(matches)

    # Apply high-risk type multipliers
    present_types = {m["type"] for m in matches}
    for risk_type, multiplier in HIGH_RISK_TYPE_MULTIPLIERS.items():
        if risk_type in present_types:
            # Only apply if there's at least one high-severity match of that type
            has_high = any(
                m["type"] == risk_type and m["severity"] == "high"
                for m in matches
            )
            if has_high or risk_type == "social_engineering":
                raw_points *= multiplier

    # Normalise to 0–100 using a soft-cap sigmoid-like curve
    # score = 100 * (1 - e^(-raw/60))  → asymptotically approaches 100
    import math
    normalised = 100.0 * (1.0 - math.exp(-raw_points / 60.0))
    final_score = min(100, round(normalised))

    return RiskReport(
        score=final_score,
        label=_label_for_score(final_score),
        breakdown=breakdown,
        total_matches=len(matches),
        severity_counts=severity_counts,
    )