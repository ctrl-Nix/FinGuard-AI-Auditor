"""
Panic Mode Engine
==================
Ultra-fast (<2s) scam detection pipeline. No heavy ML, no blocking I/O.

Architecture:
  Stage 1 — Regex/keyword signal extraction      (~0ms)
  Stage 2 — Pattern scoring + verdict             (~1ms)
  Stage 3 — (Optional) Lightweight LLM enrichment (~1-1.5s, async, non-blocking)

The Stage 1+2 verdict is ALWAYS returned immediately. Stage 3 only
enriches if an API key is present and the message isn't obviously SAFE.
"""

from __future__ import annotations
import re
import time
from dataclasses import dataclass, field
from typing import List, Tuple


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL DEFINITIONS
# ══════════════════════════════════════════════════════════════════════════════

# Each signal: (regex_pattern, weight, short_reason)
# Weight: positive = scam signal, higher = worse
# Verdict thresholds: SCAM ≥ 65  |  SUSPICIOUS 30–64  |  SAFE < 30

_SIGNALS: List[Tuple[str, int, str]] = [

    # ── OTP / Credential harvesting (critical) ────────────────────────────────
    (r"\botp\b",                                        30, "Requests a one-time password (OTP)"),
    (r"\bshare\s+(?:your\s+)?otp\b",                   40, "Asks you to share your OTP"),
    (r"\bdo\s+not\s+share\s+(?:this\s+)?otp\b",        25, "OTP sharing warning (possible spoofing)"),
    (r"\benter\s+(?:your\s+)?(?:pin|otp|password)\b",  35, "Prompts you to enter PIN/OTP/password"),
    (r"\bverify\s+(?:your\s+)?(?:account|identity|number|card)\b", 28, "Asks to verify account or identity"),
    (r"\bconfirm\s+(?:your\s+)?(?:details?|bank|account|card)\b",  25, "Asks to confirm personal details"),

    # ── Financial bait ────────────────────────────────────────────────────────
    (r"\bkycupdate\b|\bkyc\s+(?:pending|update|required|verification)\b", 30, "KYC update demand (common bank scam)"),
    (r"\b(?:won|winner|congratulations|you.ve\s+won|prize|lottery|reward)\b", 28, "Lottery/prize claim"),
    (r"\bcashback\b|\bcash\s+back\b",                  15, "Cashback offer (low-confidence)"),
    (r"\bfree\s+(?:money|cash|transfer|recharge)\b",   30, "Promises free money or recharge"),
    (r"\bunclaimed\s+(?:funds?|amount|money|refund)\b", 32, "Unclaimed funds claim"),
    (r"\brefund\s+(?:of\s+)?\₹?[\d,]+",               25, "Refund of a specific amount"),
    (r"\bguaranteed\s+(?:return|profit|income)\b",     35, "Guaranteed financial return"),
    (r"\binvest\s+(?:now|today|immediately)\b",         28, "Pressured investment solicitation"),
    (r"\bdouble\s+(?:your\s+)?(?:money|investment)\b", 38, "Promises to double money"),

    # ── Urgency / Pressure ────────────────────────────────────────────────────
    (r"\bact\s+now\b|\bimmediately\b|\burgent\b",      22, "Urgency pressure language"),
    (r"\b(?:expires?|expiring)\s+(?:in\s+)?\d+\s*(?:hours?|mins?|minutes?)\b", 25, "Artificial expiry timer"),
    (r"\blast\s+chance\b|\bfinal\s+(?:notice|warning|chance)\b", 25, "Final warning pressure"),
    (r"\btoday\s+only\b|\blimited\s+time\b",           18, "Time-limited pressure"),
    (r"\byour\s+account\s+(?:will\s+be\s+)?(?:blocked|suspended|deactivated|closed)\b", 32, "Account suspension threat"),
    (r"\byour\s+(?:sim|number|service)\s+(?:will\s+be\s+)?(?:blocked|deactivated|disconnected)\b", 30, "SIM/service blocking threat"),

    # ── Impersonation ─────────────────────────────────────────────────────────
    (r"\b(?:rbi|sebi|income\s+tax|it\s+dept|irdai|trai)\b", 28, "Claims to be a government regulator (RBI/SEBI/IT Dept)"),
    (r"\b(?:sbi|hdfc|icici|axis|kotak|paytm|phonepe|gpay)\s+(?:bank\s+)?(?:alert|notice|update|team)\b", 25, "Impersonates a known bank or payment app"),
    (r"\b(?:amazon|flipkart|meesho|swiggy|zomato)\s+(?:team|support|alert|prize|reward)\b", 22, "Impersonates an e-commerce brand"),
    (r"\bcustomer\s+(?:care|support|helpline|executive)\b", 18, "Claims to be customer support (possible vishing)"),
    (r"\bpolice|cyber\s+crime|cybercrime\s+cell\b",    30, "Impersonates police / cyber crime cell"),

    # ── Suspicious URLs / Numbers ─────────────────────────────────────────────
    (r"https?://(?!(?:www\.)?(?:sbi\.co\.in|hdfcbank\.com|icicibank\.com|axisbank\.com|paytm\.com|phonepe\.com|amazon\.in|flipkart\.com))[^\s]{10,}", 30, "Contains a suspicious/unrecognised URL"),
    (r"\bbit\.ly/|tinyurl\.com/|t\.co/|rb\.gy/|cutt\.ly/|short\.gy/", 28, "Uses a URL shortener (hides destination)"),
    (r"\b(?:click|tap|open|visit)\s+(?:this\s+)?(?:link|url|below)\b", 20, "Directs you to click a link"),
    (r"\+?\d[\d\s\-]{9,}\d",                           8,  "Contains a phone number"),
    (r"(?:wa\.me|whatsapp\.com/send)\?phone=\d+",      25, "WhatsApp link to unknown number"),

    # ── Sensitive data requests ───────────────────────────────────────────────
    (r"\bcard\s+(?:number|details?|no\.?)\b",          35, "Requests card number"),
    (r"\bcvv\b",                                        40, "Requests CVV"),
    (r"\bexpiry\s+date\b|\bexpiration\s+date\b",       30, "Requests card expiry date"),
    (r"\baadhaar\b|\bpan\s+(?:card|number|no\.?)\b",   32, "Requests Aadhaar or PAN details"),
    (r"\bnetbanking\s+(?:id|password|credentials?)\b", 38, "Requests net banking credentials"),
    (r"\bpassword\b|\bpin\b|\bcredentials?\b",          20, "Mentions password or PIN"),
    (r"\baccount\s+(?:number|no\.?)\b",                22, "Requests account number"),

    # ── Payment tricks ────────────────────────────────────────────────────────
    (r"\bsend\s+(?:\₹|rs\.?|inr)?\s*[\d,]+",          28, "Asks you to send money"),
    (r"\bpay\s+(?:now|immediately|first|advance)\b",   28, "Demands advance payment"),
    (r"\bregistration\s+fee\b|\bprocessing\s+fee\b",   22, "Requests registration or processing fee"),
    (r"\bupi\s*(?:id|pin|link|payment)\b",             22, "Involves a UPI ID or link"),
    (r"\bqr\s*(?:code|scan)\b",                        18, "Asks to scan a QR code"),
    (r"\bcrypto|bitcoin|usdt|binance\b",               30, "Involves cryptocurrency (high-risk payment rail)"),
    (r"\b(?:guaranteed|assured)\s+(?:\d+\s*%|returns?|profit)\s+(?:in\s+\d+\s+days?)?\b", 40, "Guaranteed returns within a timeframe — classic investment scam"),
    (r"\b\d{2,4}\s*%\s+returns?\b",                   28, "Specific high-return percentage claim"),

    # ── Social engineering phrases ────────────────────────────────────────────
    (r"\bdo\s+not\s+(?:tell|share|inform)\s+anyone\b", 35, "Asks you to keep it secret"),
    (r"\bkeep\s+(?:this\s+)?(?:confidential|secret|private)\b", 30, "Instructs secrecy"),
    (r"\byou.ve\s+been\s+selected\b|\byou\s+are\s+(?:chosen|selected|eligible)\b", 22, "False 'selected' personalisation"),
    (r"\bjob\s+offer\b|\bwork\s+from\s+home\b|\bpart[\s\-]?time\s+(?:job|income|earning)\b", 20, "Work-from-home/job offer scam signal"),
]

# Negative signals — these REDUCE score (trust markers)
_TRUST_SIGNALS: List[Tuple[str, int]] = [
    # Strong trust: Legit OTP messages always say "do not share"
    (r"\bdo\s+not\s+share\s+(?:this\s+)?otp\b",                    -35),  # legitimate OTP SMS
    (r"\bnever\s+share\s+(?:your\s+)?otp\b",                        -35),
    (r"\b(?:bank|hdfc|sbi|icici|axis|kotak)\s+never\s+asks?\b",    -25),
    (r"\bvalid\s+for\s+\d+\s+(?:minutes?|mins?|hours?)\b",         -15),  # OTP validity window
    # General trust signals
    (r"\bthis\s+is\s+an?\s+automated\s+message\b",                  -10),
    (r"\bfor\s+(?:any\s+)?(?:queries?|help)\s+(?:call|contact|visit)\b", -8),
    (r"\bthank\s+you\s+for\s+(?:using|shopping|banking|your\s+purchase)\b", -12),
    (r"\btransaction\s+(?:of|for|ref(?:erence)?|id)\b",            -10),  # legitimate txn alerts
    (r"\bif\s+(?:not\s+done|this\s+wasn.t)\s+by\s+you\b",          -15),  # fraud alert pattern from real banks
    (r"\bcall\s+(?:our\s+)?(?:toll[\s-]free|helpline|1800)\b",     -8),
]


# ══════════════════════════════════════════════════════════════════════════════
# STATIC ACTION TABLES (no LLM needed)
# ══════════════════════════════════════════════════════════════════════════════

_ACTIONS_SCAM = [
    "🚫 Do NOT click any links in this message",
    "🔕 Do NOT call back any number provided",
    "🔒 Never share OTP, PIN, CVV, or passwords — banks never ask",
    "📵 Block and report the sender immediately",
    "📞 If worried, call your bank's official number from their website",
    "🗑️ Delete this message",
]

_ACTIONS_SUSPICIOUS = [
    "⚠️ Do NOT act on this message without verification",
    "🔍 Call the organisation directly using their official number",
    "🔒 Do not share any personal or financial details yet",
    "🔗 Verify any URL by typing it manually into your browser",
    "🧐 Ask a trusted person to review before responding",
]

_ACTIONS_SAFE = [
    "✅ This message appears legitimate",
    "🔍 Still verify unexpected requests through official channels",
    "💡 Stay alert — scammers can imitate real messages closely",
]


# ══════════════════════════════════════════════════════════════════════════════
# CORE ENGINE
# ══════════════════════════════════════════════════════════════════════════════

# ── Extraction helpers ────────────────────────────────────────────────────────

# Known-safe domains — URLs from these are NOT flagged
_TRUSTED_DOMAINS = {
    "sbi.co.in", "hdfcbank.com", "icicibank.com", "axisbank.com",
    "kotakbank.com", "paytm.com", "phonepe.com", "amazon.in",
    "flipkart.com", "gov.in", "uidai.gov.in", "incometax.gov.in",
}

# URL shortener hostnames
_SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "rb.gy", "cutt.ly",
    "short.gy", "ow.ly", "is.gd", "buff.ly", "shorte.st",
}



_URL_PATTERN = re.compile(
    r"https?://\S+|(?:bit\.ly|tinyurl\.com|t\.co|rb\.gy|cutt\.ly|short\.gy)/\S+",
    re.IGNORECASE,
)

def _extract_urls(text: str) -> List[dict]:
    """
    Extract all URLs from text and classify each as safe/shortened/suspicious.
    Returns list of {"url": str, "risk": "safe"|"shortened"|"suspicious"}.
    """
    found = _URL_PATTERN.findall(text)
    results = []
    seen = set()
    for url in found:
        url = url.rstrip(".,;)")
        if url in seen:
            continue
        seen.add(url)
        # Determine domain
        domain_match = re.search(r"(?:https?://)?(?:www\.)?([^/\s?#]+)", url, re.IGNORECASE)
        domain = domain_match.group(1).lower() if domain_match else url.lower()
        root = ".".join(domain.split(".")[-2:])  # e.g. "bit.ly", "hdfcbank.com"
        if root in _TRUSTED_DOMAINS or domain in _TRUSTED_DOMAINS:
            risk = "safe"
        elif root in _SHORTENERS or domain in _SHORTENERS:
            risk = "shortened"
        else:
            risk = "suspicious"
        results.append({"url": url, "risk": risk, "domain": domain})
    return results


def _extract_phones(text: str) -> List[str]:
    """
    Extract phone numbers from text.
    Handles Indian mobile (10-digit, with/without +91) and international (+CC...).
    Ignores OTPs (4-8 standalone digits) and short codes.
    """
    _PHONE_PATTERNS = [
        r"\+91[\s\-]?[6-9]\d{9}\b",               # +91 9XXXXXXXXX
        r"\b0[6-9]\d{9}\b",                          # 09XXXXXXXXX
        r"\b[6-9]\d{9}\b",                           # bare 10-digit Indian
        r"\+(?!91)\d{1,3}[\s\-]?\d[\d\s]{5,13}\d\b",  # international e.g. +44 7911 123456
    ]
    seen_digits: set = set()
    results: List[str] = []
    for pattern in _PHONE_PATTERNS:
        for match in re.finditer(pattern, text):
            raw = match.group(0).strip()
            # Normalise to pure digits for deduplication
            digits = re.sub(r"[\s\-\+]", "", raw)
            if digits.startswith("91") and len(digits) == 12:
                digits = digits[2:]   # strip country code for dedup key
            if len(digits) >= 10 and digits not in seen_digits:
                seen_digits.add(digits)
                results.append(raw)
    return results

def _detect_sender_spoofing(text: str) -> List[str]:
    """
    Detect impersonation: a trusted brand + a risk signal, but NO safe-context markers.
    Safe-context phrases (e.g. "bank never asks") cancel out the risk signal.
    """
    flags: List[str] = []
    text_lower = text.lower()

    # Phrases that indicate a legitimate warning — they neutralise risk signals
    SAFE_CONTEXTS = [
        'do not share', 'never ask', 'never share', 'do not disclose',
        'never request', 'we will never', 'bank will never', 'not authorised',
        'do not click', 'if not done by you', 'report immediately',
    ]
    has_safe_context = any(s in text_lower for s in SAFE_CONTEXTS)
    if has_safe_context:
        return []  # Legitimate warning message — not spoofing

    # High-risk signals that should never appear alongside a trusted brand name
    RISK_PATS = [
        'bit.ly', 'tinyurl', 'rb.gy', 'cutt.ly',   # URL shorteners
        'share your otp', 'enter otp', 'share otp',  # OTP harvesting
        'cvv', 'card number', 'card details',         # card harvesting
        'account will be blocked', 'account suspended', 'account will be deactivated',
        'click here to verify', 'click to verify', 'click to claim',
        'claim your prize', 'claim now', 'claim your reward',
    ]
    has_risk = any(pat in text_lower for pat in RISK_PATS)

    if has_risk:
        BRANDS = [
            (['sbi', 'hdfc', 'icici', 'axis', 'kotak', 'rbl', 'yes bank'], 'bank'),
            (['rbi', 'sebi', 'income tax', 'trai', 'irdai', 'epfo'], 'regulator'),
            (['amazon', 'flipkart', 'google', 'apple', 'microsoft', 'paytm', 'phonepe'], 'brand'),
            (['police', 'cbi', 'fbi', 'interpol', 'cyber cell', 'cybercrime'], 'authority'),
        ]
        for keywords, label in BRANDS:
            if any(kw in text_lower for kw in keywords):
                flags.append(f'Impersonates a trusted {label} while requesting sensitive action')
                break

    return flags


@dataclass
class PanicResult:
    verdict: str                                    # "SCAM" | "SUSPICIOUS" | "SAFE"
    confidence: int                                 # 0–100
    reasons: List[str] = field(default_factory=list)
    what_to_do: List[str] = field(default_factory=list)
    raw_score: int = 0
    latency_ms: int = 0
    llm_enriched: bool = False
    extracted_urls: List[dict] = field(default_factory=list)   # {"url", "risk", "domain", "reputation"}
    extracted_phones: List[str] = field(default_factory=list)
    sender_flags: List[str] = field(default_factory=list)
    heatmap: List[dict] = field(default_factory=list)          # [{"start", "end", "text", "severity"}]
    dispute_letter: str = ""


def _normalise(raw: int) -> int:
    """Map raw signal score (0–∞) to confidence (0–100) using a soft cap."""
    import math
    return min(100, round(100 * (1 - math.exp(-raw / 55))))


def _verdict_from_score(score: int) -> str:
    if score >= 65:
        return "SCAM"
    if score >= 30:
        return "SUSPICIOUS"
    return "SAFE"


def run_panic_check(text: str) -> PanicResult:
    """
    Stage 1+2: Pure regex pipeline. Sub-5ms. Always runs.
    Returns a complete PanicResult — LLM enrichment is separate.
    """
    t0 = time.perf_counter()
    text_lower = text.lower()

    raw_score = 0
    reasons: List[str] = []
    seen_reasons: set = set()

    heatmap = []

    # 1. Static signals + Crowdsourced signals
    from scam_vault import VAULT
    all_signals = _SIGNALS + VAULT.get_signals()

    # Positive signals
    for pattern, weight, reason in all_signals:
        for match in re.finditer(pattern, text_lower, re.IGNORECASE):
            raw_score += weight
            severity = "high" if weight >= 30 else "medium" if weight >= 15 else "low"
            heatmap.append({
                "start": match.start(),
                "end": match.end(),
                "text": match.group(0),
                "severity": severity,
                "reason": reason
            })
            if reason not in seen_reasons:
                reasons.append(reason)
                seen_reasons.add(reason)

    # Trust signal dampeners
    for pattern, reduction in _TRUST_SIGNALS:
        if re.search(pattern, text_lower, re.IGNORECASE):
            raw_score = max(0, raw_score + reduction)

    confidence = _normalise(raw_score)
    verdict = _verdict_from_score(confidence)

    actions = (
        _ACTIONS_SCAM if verdict == "SCAM"
        else _ACTIONS_SUSPICIOUS if verdict == "SUSPICIOUS"
        else _ACTIONS_SAFE
    )

    latency_ms = round((time.perf_counter() - t0) * 1000)

    # ── Structured extraction (zero-cost, already scanning the text) ──────────
    urls   = _extract_urls(text)
    phones = _extract_phones(text)
    spoofs = _detect_sender_spoofing(text)

    # Add URL risk to score if we found suspicious/shortened links not already caught
    url_risk_types = {u["risk"] for u in urls}
    if "shortened" in url_risk_types and raw_score < 30:
        raw_score += 15
        reasons.append("Contains URL shortener link")
    if "suspicious" in url_risk_types and raw_score < 20:
        raw_score += 10
        reasons.append("Contains unrecognised external URL")

    # Re-normalise after URL adjustments
    confidence = _normalise(raw_score)
    verdict = _verdict_from_score(confidence)
    actions = (
        _ACTIONS_SCAM if verdict == "SCAM"
        else _ACTIONS_SUSPICIOUS if verdict == "SUSPICIOUS"
        else _ACTIONS_SAFE
    )

    latency_ms = round((time.perf_counter() - t0) * 1000)

    return PanicResult(
        verdict=verdict,
        confidence=confidence,
        reasons=reasons[:6],
        what_to_do=actions,
        raw_score=raw_score,
        latency_ms=latency_ms,
        llm_enriched=False,
        extracted_urls=urls,
        extracted_phones=phones,
        sender_flags=spoofs,
        heatmap=heatmap,
    )


def enrich_with_llm(result: PanicResult, text: str, api_key: str, provider: str = "gemini", model: str = None) -> PanicResult:
    """
    Stage 3 (optional): Lightweight LLM call for edge cases.
    Now supports multiple providers (Gemini, OpenAI, Anthropic).
    """
    if not api_key:
        return result
    
    # Default models if none provided
    if not model:
        if provider == "gemini": model = "gemini-2.0-flash"
        elif provider == "openai": model = "gpt-4o"
        elif provider == "anthropic": model = "claude-3-5-sonnet-latest"

    # Skip LLM if already high confidence or clearly safe
    if result.confidence >= 80 or result.confidence < 15:
        return result

    t0 = time.perf_counter()

    prompt = f"""You are a global scam detection assistant. 
    Analyze this message in any language. Determine risk and provide a JSON response.
    Reply ONLY in this JSON format (no markdown):
    {{"extra_reason": "<one new insight>", "confidence_adjustment": <integer -15 to +15>}}

    Detected: {result.reasons}
    Verdict: {result.verdict} ({result.confidence}%)

    MESSAGE:
    \"\"\"{text[:800]}\"\"\"
    """

    raw = ""
    try:
        if provider == "gemini":
            try:
                from google import genai as _genai
                from google.genai import types as _types
                client = _genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=_types.GenerateContentConfig(temperature=0.1, max_output_tokens=150),
                )
                raw = response.text
            except ImportError:
                import google.generativeai as _old
                _old.configure(api_key=api_key)
                m = _old.GenerativeModel(model)
                raw = m.generate_content(prompt).text
        
        elif provider == "openai":
            import requests
            res = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.1,
                    "max_tokens": 150
                },
                timeout=5
            )
            raw = res.json()["choices"][0]["message"]["content"]

        elif provider == "anthropic":
            import requests
            res = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": model,
                    "max_tokens": 150,
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=5
            )
            raw = res.json()["content"][0]["text"]

        import json
        clean = raw.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(clean)

        adj = int(parsed.get("confidence_adjustment", 0))
        extra = str(parsed.get("extra_reason", "")).strip()

        new_confidence = max(0, min(100, result.confidence + adj))
        new_reasons = result.reasons[:]
        if extra and extra not in result.reasons:
            new_reasons.insert(0, extra)

        new_verdict = _verdict_from_score(new_confidence)
        new_actions = (
            _ACTIONS_SCAM if new_verdict == "SCAM"
            else _ACTIONS_SUSPICIOUS if new_verdict == "SUSPICIOUS"
            else _ACTIONS_SAFE
        )

        llm_ms = round((time.perf_counter() - t0) * 1000)

        return PanicResult(
            verdict=new_verdict,
            confidence=new_confidence,
            reasons=new_reasons[:6],
            what_to_do=new_actions,
            raw_score=result.raw_score,
            latency_ms=result.latency_ms + llm_ms,
            llm_enriched=True,
            extracted_urls=result.extracted_urls,
            extracted_phones=result.extracted_phones,
            sender_flags=result.sender_flags,
        )

    except Exception:
        return result

def enrich_urls_with_reputation(urls: List[dict], api_key: str) -> List[dict]:
    """
    Uses Gemini to perform reputation checks on suspicious domains.
    """
    if not api_key or not urls:
        return urls
    
    suspicious_urls = [u["url"] for u in urls if u["risk"] != "safe"]
    if not suspicious_urls:
        return urls

    prompt = f"""
    Analyze these URLs for security risk. For each, provide:
    1. Estimated domain age (new vs established).
    2. Reputation score (0-100).
    3. Country of origin.
    4. Warning (if any).

    URLs: {suspicious_urls}

    Reply ONLY in this JSON format:
    {{"reputation": [
      {{"url": "...", "score": 10, "origin": "...", "age": "...", "warning": "..."}}
    ]}}
    """

    try:
        from google import genai as _genai
        client = _genai.Client(api_key=api_key)
        response = client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        
        import json
        clean = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        data = json.loads(clean)
        rep_map = {item["url"]: item for item in data.get("reputation", [])}

        for u in urls:
            if u["url"] in rep_map:
                u["reputation"] = rep_map[u["url"]]
        return urls
    except Exception:
        return urls

def analyze_image(image_bytes: bytes, api_key: str, provider: str = "gemini", model: str = None) -> PanicResult:
    """
    Multimodal analysis for screenshots of scams.
    Currently optimized for Gemini 2.0 Flash.
    """
    if not api_key:
        return run_panic_check("Error: No API key provided for image analysis.")
    
    if provider != "gemini":
        return run_panic_check("Error: Multimodal image analysis currently requires a Google Gemini key.")

    if not model:
        model = "gemini-2.0-flash"

    t0 = time.perf_counter()
    prompt = """
    You are a scam detection assistant. Analyze this screenshot of a message, website, or document.
    1. Extract all text.
    2. Identify scam signals (urgency, spoofing, hidden fees, phishing).
    3. Provide a risk score (0-100) and a verdict (SAFE, SUSPICIOUS, SCAM).
    4. List clear reasons for your verdict.
    5. List what the user should do next.
    6. Provide a heatmap of dangerous words (offsets in the extracted text).

    Reply ONLY in this JSON format (no markdown):
    {
      "text": "Extracted text here",
      "verdict": "SCAM",
      "confidence": 85,
      "reasons": ["reason 1", "reason 2"],
      "what_to_do": ["action 1", "action 2"],
      "extracted_urls": [{"url": "...", "risk": "...", "domain": "..."}],
      "extracted_phones": ["..."],
      "sender_flags": ["..."],
      "heatmap": [{"start": 0, "end": 10, "text": "...", "severity": "high"}]
    }
    """

    try:
        from google import genai as _genai
        from google.genai import types as _types
        client = _genai.Client(api_key=api_key)
        
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                prompt,
                _types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
            ],
            config=_types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=1500,
            ),
        )
        
        import json
        clean = response.text.strip().lstrip("```json").lstrip("```").rstrip("```").strip()
        parsed = json.loads(clean)

        latency_ms = round((time.perf_counter() - t0) * 1000)

        # Enrich URLs if found
        urls = parsed.get("extracted_urls", [])
        if urls:
            urls = enrich_urls_with_reputation(urls, api_key)

        return PanicResult(
            verdict=parsed.get("verdict", "SUSPICIOUS"),
            confidence=parsed.get("confidence", 50),
            reasons=parsed.get("reasons", []),
            what_to_do=parsed.get("what_to_do", []),
            latency_ms=latency_ms,
            llm_enriched=True,
            extracted_urls=urls,
            extracted_phones=parsed.get("extracted_phones", []),
            sender_flags=parsed.get("sender_flags", []),
            heatmap=parsed.get("heatmap", []),
        )
    except Exception as e:
        return run_panic_check(f"Error during image analysis: {str(e)}")
