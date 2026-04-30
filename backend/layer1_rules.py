"""
LAYER 1 — Rule-Based Detection Engine
======================================
Each rule is a function that takes a text string and returns a list of
RuleMatch dicts. Every match is self-describing: type, severity, matched_text,
explanation.

To add a new rule:
  1. Write a function that returns List[RuleMatch]
  2. Register it in RULE_REGISTRY at the bottom of this file
  3. Done — it automatically flows through Layer 2 and 3.
"""

from __future__ import annotations
import re
from typing import TypedDict, List


# ── Type contract ──────────────────────────────────────────────────────────────

class RuleMatch(TypedDict):
    type: str          # machine-readable category
    severity: str      # "low" | "medium" | "high"
    matched_text: str  # exact substring(s) that triggered the rule
    explanation: str   # human-readable reason


# ── Internal helpers ──────────────────────────────────────────────────────────

def _find_all(pattern: str, text: str, flags: int = re.IGNORECASE) -> List[str]:
    """Return all unique non-overlapping matches for a pattern."""
    return list(dict.fromkeys(re.findall(pattern, text, flags)))


def _build_match(
    rule_type: str,
    severity: str,
    matched_text: str,
    explanation: str,
) -> RuleMatch:
    return {
        "type": rule_type,
        "severity": severity,
        "matched_text": matched_text,
        "explanation": explanation,
    }


# ══════════════════════════════════════════════════════════════════════════════
# RULE FUNCTIONS
# ══════════════════════════════════════════════════════════════════════════════

# ── 1. Hidden Fees ─────────────────────────────────────────────────────────────

_HIDDEN_FEE_PATTERNS = [
    r"\bprocessing\s+fee\b",
    r"\bplatform\s+fee\b",
    r"\bconvenience\s+fee\b",
    r"\bservice\s+charge\b",
    r"\badministration\s+fee\b",
    r"\bhandling\s+fee\b",
    r"\bactivation\s+fee\b",
    r"\bmaintenance\s+fee\b",
    r"\btransaction\s+fee\b",
    r"\bdocumentation\s+fee\b",
    r"\borigination\s+fee\b",
    r"\bearly\s+termination\s+fee\b",
]

_HIDDEN_FEE_EXPLANATIONS = {
    "processing fee":       "Processing fees are commonly buried in fine print and inflate the true cost.",
    "platform fee":         "Platform fees can be added silently without clear disclosure.",
    "convenience fee":      "Convenience fees penalise standard payment methods — often unnecessary.",
    "service charge":       "Service charges may duplicate costs already included in the headline price.",
    "administration fee":   "Administration fees are often vague and may be negotiable or avoidable.",
    "handling fee":         "Handling fees can be inflated beyond actual handling costs.",
    "activation fee":       "Activation fees are frequently waived upon request but rarely disclosed.",
    "maintenance fee":      "Maintenance fees recur indefinitely — check if they auto-escalate.",
    "transaction fee":      "Per-transaction fees compound quickly with frequent usage.",
    "documentation fee":    "Documentation fees are rarely justified — standard docs should be free.",
    "origination fee":      "Origination fees on loans can materially increase the effective APR.",
    "early termination fee":"Early termination fees create lock-in and limit consumer optionality.",
}

def detect_hidden_fees(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    for pattern in _HIDDEN_FEE_PATTERNS:
        found = _find_all(pattern, text)
        for match in found:
            key = re.sub(r"\s+", " ", match.lower().strip())
            explanation = _HIDDEN_FEE_EXPLANATIONS.get(
                key,
                f"'{match}' is a potentially undisclosed fee that increases total cost."
            )
            matches.append(_build_match(
                rule_type="hidden_fee",
                severity="medium",
                matched_text=match,
                explanation=explanation,
            ))
    return matches


# ── 2. Misleading Phrases ──────────────────────────────────────────────────────

_MISLEADING_PATTERNS: List[tuple[str, str, str, str]] = [
    # (pattern, severity, matched_label, explanation)
    (
        r"\b0\s*%\s*interest\b",
        "high",
        "0% interest",
        "0% interest offers typically revert to high APR after a promotional period — often not disclosed prominently.",
    ),
    (
        r"\bno\s+interest\b",
        "medium",
        "no interest",
        "'No interest' claims often apply only under specific conditions that are easy to violate.",
    ),
    (
        r"\blimited[\s\-]time\s+offer\b",
        "medium",
        "limited time offer",
        "Artificial scarcity pressure tactic — the offer is rarely as time-limited as stated.",
    ),
    (
        r"\bguaranteed\s+returns?\b",
        "high",
        "guaranteed returns",
        "No legitimate investment guarantees returns. This is a hallmark of Ponzi schemes.",
    ),
    (
        r"\brisk[\s\-]free\s+investment\b",
        "high",
        "risk-free investment",
        "All investments carry risk. 'Risk-free' is misleading and often illegal to claim.",
    ),
    (
        r"\b100\s*%\s*(?:profit|returns?|gains?)\b",
        "high",
        "100% profit/returns",
        "Claims of 100% profit are unrealistic and indicate likely fraud or misrepresentation.",
    ),
    (
        r"\bno\s+hidden\s+(?:fees?|charges?|costs?)\b",
        "medium",
        "no hidden fees",
        "This claim is frequently made by contracts that actually contain hidden fees elsewhere.",
    ),
    (
        r"\bfree\s+trial\b",
        "low",
        "free trial",
        "Free trials commonly convert to paid subscriptions without clear notice.",
    ),
    (
        r"\bno\s+credit\s+check\b",
        "medium",
        "no credit check",
        "'No credit check' offers usually compensate with significantly higher interest rates.",
    ),
    (
        r"\bexclusive\s+(?:offer|deal|opportunity)\b",
        "low",
        "exclusive offer",
        "Exclusivity claims create false urgency and are rarely genuine.",
    ),
    (
        r"\b(?:double|triple)\s+your\s+(?:money|investment|savings)\b",
        "high",
        "double/triple your money",
        "Promises to multiply money are a classic fraud signal and should be treated with extreme suspicion.",
    ),
    (
        r"\bpre[\s\-]?approved\b",
        "medium",
        "pre-approved",
        "'Pre-approved' claims are often marketing language — actual approval requires a full review.",
    ),
]

def detect_misleading_phrases(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    for pattern, severity, label, explanation in _MISLEADING_PATTERNS:
        found = _find_all(pattern, text)
        if found:
            matches.append(_build_match(
                rule_type="misleading_phrase",
                severity=severity,
                matched_text=", ".join(found),
                explanation=explanation,
            ))
    return matches


# ── 3. Auto-Renewal Traps ─────────────────────────────────────────────────────

_AUTO_RENEWAL_PATTERNS = [
    r"\bauto[\s\-]?renew(?:al|s|ed|ing)?\b",
    r"\bautomatically\s+renew(?:s|ed|ing)?\b",
    r"\brecurring\s+(?:charge|billing|payment|subscription)\b",
    r"\bcontinuous\s+(?:service|subscription|billing)\b",
    r"\bunless\s+(?:you\s+cancel|cancelled|terminated)\b",
    r"\buntil\s+cancelled\b",
    r"\brolling\s+(?:contract|subscription|plan)\b",
    r"\bevergreen\s+(?:contract|clause|agreement)\b",
    r"\bcancell?ation\s+(?:must\s+be\s+received|required|notice)\b",
    r"\b(?:30|60|90)[\s\-]day\s+(?:written\s+)?notice\s+(?:required|to\s+cancel)\b",
]

def detect_auto_renewal(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    seen: set[str] = set()

    for pattern in _AUTO_RENEWAL_PATTERNS:
        found = _find_all(pattern, text)
        for hit in found:
            hit_lower = hit.lower().strip()
            if hit_lower in seen:
                continue
            seen.add(hit_lower)

            if re.search(r"(unless|until|cancel|notice|written)", hit, re.IGNORECASE):
                severity = "high"
                explanation = (
                    f"'{hit}' imposes cancellation obligations that are easy to miss, "
                    "creating accidental renewals and charges."
                )
            else:
                severity = "medium"
                explanation = (
                    f"'{hit}' indicates automatic renewal. Ensure the renewal terms, "
                    "pricing, and cancellation window are clearly disclosed."
                )

            matches.append(_build_match(
                rule_type="auto_renewal_trap",
                severity=severity,
                matched_text=hit,
                explanation=explanation,
            ))
    return matches


# ── 4. Urgency Language ───────────────────────────────────────────────────────

_URGENCY_PATTERNS: List[tuple[str, str, str]] = [
    # (pattern, label, explanation)
    (r"\bact\s+now\b",              "act now",              "Classic pressure tactic to prevent rational decision-making."),
    (r"\blast\s+chance\b",          "last chance",          "False scarcity to create panic-buying behaviour."),
    (r"\blimited\s+(?:spots?|seats?|slots?|availability)\b",
                                    "limited spots",        "Artificial scarcity — rarely verified or enforceable."),
    (r"\bexpires?\s+(?:soon|today|tonight|in\s+\d+\s+(?:hours?|minutes?))\b",
                                    "expiring soon",        "Time-boxing decisions to prevent due diligence."),
    (r"\bdon['\u2019]?t\s+(?:miss\s+out|delay|wait)\b",
                                    "don't miss out",       "FOMO-driven pressure language."),
    (r"\bimmediate(?:ly)?\s+(?:action|response|payment|decision)\b",
                                    "immediate action",     "Urgency framing to suppress careful review."),
    (r"\btoday\s+only\b",           "today only",           "Artificial deadline with no genuine expiry basis."),
    (r"\brespond\s+(?:immediately|within\s+\d+\s+(?:hours?|days?))\b",
                                    "respond immediately",  "Forced response windows limit ability to seek advice."),
    (r"\bonce[\s\-]in[\s\-]a[\s\-]lifetime\b",
                                    "once-in-a-lifetime",   "Hyperbolic scarcity — manipulative sales language."),
    (r"\bhurry\b",                  "hurry",                "Generic urgency word used to rush decision-making."),
    (r"\bfinal\s+(?:notice|warning|offer|chance)\b",
                                    "final notice/offer",   "Creates alarm; often used in scam communications."),
    (r"\byou['\u2019]?ve\s+been\s+selected\b",
                                    "you've been selected", "False personalisation to increase perceived legitimacy."),
]

def detect_urgency_language(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    for pattern, label, explanation in _URGENCY_PATTERNS:
        found = _find_all(pattern, text)
        if found:
            matches.append(_build_match(
                rule_type="urgency_language",
                severity="medium",
                matched_text=", ".join(found),
                explanation=explanation,
            ))
    return matches


# ── 5. Social Engineering / Identity Fraud ────────────────────────────────────

_SOCIAL_ENG_PATTERNS: List[tuple[str, str, str, str]] = [
    (
        r"\bverify\s+your\s+(?:account|identity|ssn|social\s+security|bank\s+details?)\b",
        "high",
        "verify account/identity",
        "Legitimate institutions never request sensitive verification via unsolicited messages.",
    ),
    (
        r"\bconfirm\s+your\s+(?:password|pin|cvv|card\s+number)\b",
        "high",
        "confirm password/PIN",
        "No legitimate service asks for passwords or PINs — this is a credential-harvesting attempt.",
    ),
    (
        r"\b(?:click|tap)\s+(?:here|this\s+link|below)\s+to\s+(?:verify|confirm|update|secure)\b",
        "high",
        "click here to verify",
        "Phishing CTA pattern — drives victims to fraudulent pages to harvest credentials.",
    ),
    (
        r"\byour\s+account\s+(?:has\s+been\s+)?(?:suspended|compromised|locked|flagged)\b",
        "high",
        "account suspended/compromised",
        "Fear-based trigger used in phishing to force immediate, unthinking action.",
    ),
    (
        r"\bwe\s+(?:detected|noticed)\s+(?:unusual|suspicious|unauthorised)\s+activity\b",
        "medium",
        "suspicious activity detected",
        "Common phishing opener — creates alarm to override rational scepticism.",
    ),
    (
        r"\bsend\s+\$?\d[\d,]*\s*(?:to|via|through)\s+(?:western\s+union|moneygram|wire\s+transfer|crypto|bitcoin|zelle|venmo)\b",
        "high",
        "send money via wire/crypto",
        "Unrecoverable payment methods are exclusively requested by scammers.",
    ),
    (
        r"\b(?:irs|fbi|sec|interpol|police)\s+(?:notice|warrant|case|investigation)\b",
        "high",
        "government authority impersonation",
        "Impersonating law enforcement or regulators is a known advance-fee / extortion tactic.",
    ),
]

def detect_social_engineering(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    for pattern, severity, label, explanation in _SOCIAL_ENG_PATTERNS:
        found = _find_all(pattern, text)
        if found:
            matches.append(_build_match(
                rule_type="social_engineering",
                severity=severity,
                matched_text=", ".join(found),
                explanation=explanation,
            ))
    return matches


# ── 6. Money Laundering Indicators ───────────────────────────────────────────

_LAUNDERING_PATTERNS: List[tuple[str, str, str, str]] = [
    (
        r"\bshell\s+(?:company|corp(?:oration)?|co\b|ltd|entity|vehicle|firm)\b",
        "high",
        "shell company",
        "Shell entities are the primary vehicle for layering illicit funds.",
    ),
    (
        r"\blayering\s+phase\b",
        "high",
        "layering phase",
        "Explicit reference to a laundering stage — treat as a direct red flag.",
    ),
    (
        r"\bsmurfing\b",
        "high",
        "smurfing",
        "Structuring deposits below reporting thresholds (smurfing) is a federal crime.",
    ),
    (
        r"\bstructur(?:ing|ed)\s+(?:deposits?|transactions?|payments?)\b",
        "high",
        "structuring deposits",
        "Deliberately splitting transactions to avoid reporting thresholds is illegal.",
    ),
    (
        r"\bclean(?:ing|ed)?\s+(?:the\s+)?(?:funds?|money|cash|proceeds?)\b",
        "high",
        "clean the funds",
        "Explicit laundering language detected.",
    ),
    (
        r"\boff[\s\-]?shore\s+(?:account|transfer|entity|jurisdiction|bank)\b",
        "medium",
        "offshore account/transfer",
        "Offshore transactions require heightened scrutiny for tax evasion and laundering.",
    ),
    (
        r"\bbeneficial\s+owner(?:ship)?\b",
        "low",
        "beneficial ownership",
        "Obscuring beneficial ownership is a common technique in financial crime.",
    ),
]

def detect_laundering_signals(text: str) -> List[RuleMatch]:
    matches: List[RuleMatch] = []
    for pattern, severity, label, explanation in _LAUNDERING_PATTERNS:
        found = _find_all(pattern, text)
        if found:
            matches.append(_build_match(
                rule_type="laundering_signal",
                severity=severity,
                matched_text=", ".join(found),
                explanation=explanation,
            ))
    return matches


# ══════════════════════════════════════════════════════════════════════════════
# RULE REGISTRY — Add new rule functions here
# ══════════════════════════════════════════════════════════════════════════════

RULE_REGISTRY = [
    detect_hidden_fees,
    detect_misleading_phrases,
    detect_auto_renewal,
    detect_urgency_language,
    detect_social_engineering,
    detect_laundering_signals,
]


def run_all_rules(text: str) -> List[RuleMatch]:
    """
    Execute every registered rule against `text`.
    Returns a flat list of all RuleMatch dicts found.
    """
    all_matches: List[RuleMatch] = []
    for rule_fn in RULE_REGISTRY:
        try:
            results = rule_fn(text)
            all_matches.extend(results)
        except Exception as exc:
            # Individual rule failure must never crash the pipeline
            all_matches.append(_build_match(
                rule_type="rule_error",
                severity="low",
                matched_text="",
                explanation=f"Rule '{rule_fn.__name__}' failed: {exc}",
            ))
    return all_matches
