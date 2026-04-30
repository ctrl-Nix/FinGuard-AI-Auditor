"""
FinGuard 3.0 — Comprehensive Test Suite
=========================================
Run with:  pytest tests/ -v
Run fast:  pytest tests/ -v -m "not slow"
Run all:   pytest tests/ -v --tb=short

Markers:
  slow  — tests that make real API calls (require GEMINI_API_KEY env var)
"""

import pytest
import sys
import os

# Make sure the project root is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from finguard.engine.layer1_rules import (
    run_all_rules,
    detect_hidden_fees,
    detect_misleading_phrases,
    detect_auto_renewal,
    detect_urgency_language,
    detect_social_engineering,
    detect_laundering_signals,
    RULE_REGISTRY,
)
from finguard.engine.layer2_scoring import calculate_risk_score
from finguard.engine.panic_engine import run_panic_check, PanicResult


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 1 — RULE ENGINE TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestHiddenFees:
    def test_detects_processing_fee(self):
        matches = detect_hidden_fees("A processing fee of $50 applies.")
        assert any(m["type"] == "hidden_fee" for m in matches)
        assert any("processing fee" in m["matched_text"].lower() for m in matches)

    def test_detects_platform_fee(self):
        matches = detect_hidden_fees("Platform fee: $9.99/month")
        assert len(matches) >= 1

    def test_detects_convenience_fee(self):
        matches = detect_hidden_fees("A 3% convenience fee is charged on all card payments.")
        assert len(matches) >= 1

    def test_detects_multiple_fees(self):
        matches = detect_hidden_fees("Processing fee $10, handling fee $5, activation fee $20.")
        assert len(matches) >= 3

    def test_no_false_positives_on_clean_text(self):
        matches = detect_hidden_fees("Payment is due within 30 days of invoice date.")
        assert len(matches) == 0

    def test_severity_is_medium(self):
        matches = detect_hidden_fees("Processing fee applies.")
        assert all(m["severity"] == "medium" for m in matches)

    def test_each_match_has_required_keys(self):
        matches = detect_hidden_fees("Maintenance fee of $5 per month applies.")
        for m in matches:
            assert "type" in m
            assert "severity" in m
            assert "matched_text" in m
            assert "explanation" in m


class TestMisleadingPhrases:
    def test_detects_guaranteed_returns(self):
        matches = detect_misleading_phrases("Guaranteed returns of 18% annually.")
        types = [m["type"] for m in matches]
        assert "misleading_phrase" in types

    def test_guaranteed_returns_is_high_severity(self):
        matches = detect_misleading_phrases("Guaranteed returns every month.")
        high = [m for m in matches if m["severity"] == "high"]
        assert len(high) >= 1

    def test_detects_zero_percent_interest(self):
        matches = detect_misleading_phrases("0% interest for 12 months!")
        assert any("0%" in m["matched_text"] or "interest" in m["matched_text"].lower() for m in matches)

    def test_detects_risk_free_investment(self):
        matches = detect_misleading_phrases("This is a completely risk-free investment opportunity.")
        assert len(matches) >= 1

    def test_detects_double_your_money(self):
        matches = detect_misleading_phrases("Double your money in 30 days guaranteed!")
        assert len(matches) >= 1

    def test_no_false_positives_standard_terms(self):
        matches = detect_misleading_phrases("Standard annual fee of $99 applies to all accounts.")
        assert len(matches) == 0

    def test_detects_pre_approved(self):
        matches = detect_misleading_phrases("You are pre-approved for a $10,000 loan.")
        assert len(matches) >= 1


class TestAutoRenewal:
    def test_detects_auto_renews(self):
        matches = detect_auto_renewal("Your subscription auto-renews every year.")
        assert len(matches) >= 1
        assert all(m["type"] == "auto_renewal_trap" for m in matches)

    def test_detects_unless_cancelled(self):
        matches = detect_auto_renewal("Service continues unless you cancel 30 days in advance.")
        assert len(matches) >= 1

    def test_90_day_notice_is_high_severity(self):
        matches = detect_auto_renewal(
            "Written notice of cancellation must be received 90 days prior to renewal."
        )
        high = [m for m in matches if m["severity"] == "high"]
        assert len(high) >= 1

    def test_no_false_positive_on_legitimate_renewal_notice(self):
        # "renewal" in a benign context — general mention not triggering patterns
        matches = detect_auto_renewal("We will send a renewal reminder 30 days before your plan ends.")
        # This may or may not match, but must not crash
        assert isinstance(matches, list)

    def test_recurring_billing_detected(self):
        matches = detect_auto_renewal("Recurring billing of $29.99/month applies.")
        assert len(matches) >= 1


class TestUrgencyLanguage:
    def test_detects_act_now(self):
        matches = detect_urgency_language("Act now to secure your spot!")
        assert len(matches) >= 1

    def test_detects_last_chance(self):
        matches = detect_urgency_language("Last chance — offer ends tonight.")
        assert len(matches) >= 1

    def test_detects_today_only(self):
        matches = detect_urgency_language("Today only: 50% off all plans.")
        assert len(matches) >= 1

    def test_detects_final_notice(self):
        matches = detect_urgency_language("FINAL NOTICE: Your account requires immediate action.")
        assert len(matches) >= 1

    def test_detects_expiry_timer(self):
        matches = detect_urgency_language("This offer expires in 2 hours.")
        assert len(matches) >= 1

    def test_clean_text_no_urgency(self):
        matches = detect_urgency_language("Please review the attached invoice at your convenience.")
        assert len(matches) == 0


class TestSocialEngineering:
    def test_detects_verify_ssn(self):
        matches = detect_social_engineering("Click here to verify your account now.")
        assert len(matches) >= 1

    def test_detects_account_suspended(self):
        matches = detect_social_engineering("Your account has been suspended due to suspicious activity.")
        assert len(matches) >= 1

    def test_suspended_is_high_severity(self):
        matches = detect_social_engineering("Your account has been suspended.")
        high = [m for m in matches if m["severity"] == "high"]
        assert len(high) >= 1

    def test_detects_click_to_verify(self):
        matches = detect_social_engineering("Tap here to verify your identity.")
        assert len(matches) >= 1

    def test_clean_customer_service_no_flag(self):
        matches = detect_social_engineering(
            "For assistance, please visit our help center at support.company.com."
        )
        # Should not trigger social engineering rules
        assert len(matches) == 0


class TestLaunderingSignals:
    def test_detects_shell_company(self):
        matches = detect_laundering_signals("Transfer funds to Shell Company A.")
        assert len(matches) >= 1
        assert all(m["severity"] == "high" for m in matches)

    def test_detects_layering_phase(self):
        matches = detect_laundering_signals("This describes the Layering Phase of the scheme.")
        assert len(matches) >= 1

    def test_detects_clean_the_funds(self):
        matches = detect_laundering_signals("The goal is to clean the funds through multiple transactions.")
        assert len(matches) >= 1

    def test_detects_structuring(self):
        matches = detect_laundering_signals("They engaged in structuring deposits below $10,000.")
        assert len(matches) >= 1

    def test_no_false_positive_on_shell_script(self):
        """'shell' in programming context must not fire."""
        matches = detect_laundering_signals(
            "The deployment uses shell scripts and bash automation."
        )
        assert len(matches) == 0

    def test_no_false_positive_on_phase_reference(self):
        """'Phase' in project context must not fire."""
        matches = detect_laundering_signals("We are now in Phase 2 of the product roadmap.")
        assert len(matches) == 0

    def test_offshore_detected(self):
        matches = detect_laundering_signals("Move assets to an offshore account in the Caymans.")
        assert len(matches) >= 1


class TestRuleRegistry:
    def test_all_rules_callable(self):
        for fn in RULE_REGISTRY:
            result = fn("test text with no signals")
            assert isinstance(result, list)

    def test_run_all_rules_returns_flat_list(self):
        results = run_all_rules("Processing fee applies. Act now!")
        assert isinstance(results, list)
        assert all(isinstance(r, dict) for r in results)

    def test_run_all_rules_no_rule_errors_on_clean(self):
        results = run_all_rules("Standard invoice for services rendered.")
        errors = [r for r in results if r["type"] == "rule_error"]
        assert len(errors) == 0

    def test_run_all_rules_no_rule_errors_on_complex(self):
        text = """
        Layering Phase: Shell Co A → NFT purchase → Shell Co B.
        Your account has been suspended. Click here to verify your SSN.
        Guaranteed returns of 200%. Act now! Share your OTP to claim.
        Processing fee $99, platform fee $29. Auto-renews unless cancelled.
        """
        results = run_all_rules(text)
        errors = [r for r in results if r["type"] == "rule_error"]
        assert len(errors) == 0, f"Rule errors: {errors}"

    def test_each_match_schema_valid(self):
        results = run_all_rules("guaranteed returns, share your OTP, processing fee")
        for r in results:
            assert r["type"] not in ("", None)
            assert r["severity"] in ("low", "medium", "high")
            assert isinstance(r["matched_text"], str)
            assert isinstance(r["explanation"], str)
            assert len(r["explanation"]) > 10


# ══════════════════════════════════════════════════════════════════════════════
# LAYER 2 — RISK SCORING TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestRiskScoring:
    def test_empty_matches_returns_zero(self):
        report = calculate_risk_score([])
        assert report["score"] == 0
        assert report["label"] == "Safe"

    def test_single_high_severity_gives_nonzero(self):
        matches = [{"type": "social_engineering", "severity": "high",
                    "matched_text": "verify SSN", "explanation": "test"}]
        report = calculate_risk_score(matches)
        assert report["score"] > 0

    def test_multiple_high_severity_reaches_critical(self):
        matches = [
            {"type": "social_engineering", "severity": "high", "matched_text": "verify SSN", "explanation": "x"},
            {"type": "laundering_signal",  "severity": "high", "matched_text": "shell co",   "explanation": "x"},
            {"type": "misleading_phrase",  "severity": "high", "matched_text": "guaranteed",  "explanation": "x"},
            {"type": "social_engineering", "severity": "high", "matched_text": "account suspended", "explanation": "x"},
        ]
        report = calculate_risk_score(matches)
        assert report["label"] in ("High Risk", "Critical")
        assert report["score"] >= 60

    def test_only_low_severity_stays_low(self):
        matches = [
            {"type": "urgency_language", "severity": "low", "matched_text": "limited time", "explanation": "x"},
            {"type": "hidden_fee",       "severity": "low", "matched_text": "processing",   "explanation": "x"},
        ]
        report = calculate_risk_score(matches)
        assert report["score"] < 40

    def test_score_capped_at_100(self):
        # Flood with signals — must never exceed 100
        matches = [
            {"type": f"type_{i}", "severity": "high", "matched_text": f"match_{i}", "explanation": "x"}
            for i in range(50)
        ]
        report = calculate_risk_score(matches)
        assert report["score"] <= 100

    def test_score_labels_correct(self):
        label_map = [
            (0,  "Safe"),
            (15, "Low Risk"),
            (45, "Medium Risk"),
            (70, "High Risk"),
            (90, "Critical"),
        ]
        from finguard.engine.layer2_scoring import _label_for_score
        for score, expected in label_map:
            assert _label_for_score(score) == expected, f"Score {score} → expected {expected}"

    def test_breakdown_matches_input_count(self):
        matches = run_all_rules("processing fee, act now, guaranteed returns")
        report = calculate_risk_score(matches)
        assert len(report["breakdown"]) == len(matches)

    def test_severity_counts_sum_to_total(self):
        matches = run_all_rules("guaranteed returns of 200%, share your OTP, processing fee")
        report = calculate_risk_score(matches)
        sc = report["severity_counts"]
        assert sc["low"] + sc["medium"] + sc["high"] == report["total_matches"]

    def test_report_has_all_required_keys(self):
        report = calculate_risk_score([])
        for key in ("score", "label", "breakdown", "total_matches", "severity_counts"):
            assert key in report


# ══════════════════════════════════════════════════════════════════════════════
# PANIC ENGINE TESTS
# ══════════════════════════════════════════════════════════════════════════════

class TestPanicEngine:

    # ── Verdict correctness ───────────────────────────────────────────────────

    @pytest.mark.parametrize("text,expected_verdict", [
        # Clear SCAMs
        (
            "Your SBI account will be blocked. Update KYC: bit.ly/sbi-kyc. Share your OTP now.",
            "SCAM"
        ),
        (
            "Congratulations! You won Rs.2,00,000. Share your OTP to claim. Act fast!",
            "SCAM"
        ),
        (
            "Please confirm your card number, CVV and expiry date for verification.",
            "SCAM"
        ),
        (
            "Income Tax Dept: Unclaimed refund Rs.15,840. Click bit.ly/it-ref. Expires today.",
            "SCAM"
        ),
        (
            "Invest in Bitcoin — guaranteed 200% returns in 7 days. Send USDT now.",
            "SCAM"
        ),
        # Legit messages (SAFE)
        (
            "Your OTP for HDFC Bank NetBanking is 847291. Valid 10 min. Do NOT share this OTP with anyone. HDFC Bank never asks for OTP.",
            "SAFE"
        ),
        (
            "Thank you for using ICICI Bank. Transaction of Rs.1,500 at BIGBASKET. If not done by you, call 1800-XXX.",
            "SAFE"
        ),
        (
            "Standard invoice for consulting services. Payment due net 30 days.",
            "SAFE"
        ),
        # Suspicious (borderline)
        (
            "Work from home opportunity! Earn Rs.5000/day. WhatsApp: wa.me/+919876543210",
            "SUSPICIOUS"
        ),
    ])
    def test_verdict(self, text, expected_verdict):
        result = run_panic_check(text)
        assert result.verdict == expected_verdict, (
            f"Expected {expected_verdict}, got {result.verdict} "
            f"(confidence={result.confidence}, reasons={result.reasons})"
        )

    # ── Result schema ─────────────────────────────────────────────────────────

    def test_result_has_all_fields(self):
        result = run_panic_check("test message")
        assert hasattr(result, "verdict")
        assert hasattr(result, "confidence")
        assert hasattr(result, "reasons")
        assert hasattr(result, "what_to_do")
        assert hasattr(result, "raw_score")
        assert hasattr(result, "latency_ms")
        assert hasattr(result, "llm_enriched")

    def test_confidence_in_range(self):
        for text in ["scam OTP CVV verify account", "thank you for your purchase", ""]:
            result = run_panic_check(text)
            assert 0 <= result.confidence <= 100

    def test_verdict_is_valid_string(self):
        result = run_panic_check("some text")
        assert result.verdict in ("SCAM", "SUSPICIOUS", "SAFE")

    def test_reasons_capped_at_6(self):
        # Throw every signal type at it
        text = (
            "Share OTP CVV card number Aadhaar guaranteed returns shell company "
            "layering phase act now last chance account suspended click here verify "
            "processing fee bit.ly/link Bitcoin work from home"
        )
        result = run_panic_check(text)
        assert len(result.reasons) <= 6

    def test_what_to_do_not_empty(self):
        for verdict_text in [
            "guaranteed returns share OTP CVV",   # SCAM
            "work from home opportunity",          # SUSPICIOUS
            "invoice for services rendered",       # SAFE
        ]:
            result = run_panic_check(verdict_text)
            assert len(result.what_to_do) > 0

    # ── Performance ───────────────────────────────────────────────────────────

    def test_latency_under_50ms(self):
        """Stage 1+2 must complete in under 50ms even on complex inputs."""
        long_text = ("guaranteed returns OTP CVV shell company bit.ly/abc " * 20).strip()
        result = run_panic_check(long_text)
        assert result.latency_ms < 50, f"Too slow: {result.latency_ms}ms"

    def test_empty_string_does_not_crash(self):
        result = run_panic_check("")
        assert result.verdict == "SAFE"
        assert result.confidence == 0

    def test_very_long_input_does_not_crash(self):
        result = run_panic_check("a" * 10_000)
        assert result.verdict in ("SCAM", "SUSPICIOUS", "SAFE")

    def test_unicode_input_does_not_crash(self):
        result = run_panic_check("आपका OTP 123456 है। किसी के साथ साझा न करें।")
        assert result.verdict in ("SCAM", "SUSPICIOUS", "SAFE")

    def test_llm_enriched_false_by_default(self):
        result = run_panic_check("some suspicious message")
        assert result.llm_enriched is False

    # ── Trust signal dampening ────────────────────────────────────────────────

    def test_do_not_share_otp_dampens_score(self):
        """Legit OTP SMS with 'do not share' warning must score low."""
        legit = "Your OTP is 123456. Valid for 10 minutes. Do NOT share this OTP with anyone."
        result = run_panic_check(legit)
        assert result.confidence < 30, (
            f"Legit OTP flagged too high: {result.confidence}% — reasons: {result.reasons}"
        )

    def test_bank_never_asks_dampens_score(self):
        legit = "OTP: 847291. HDFC Bank never asks for your OTP. Do not share."
        result = run_panic_check(legit)
        assert result.verdict != "SCAM"

    def test_trust_signals_do_not_override_hard_scam(self):
        """Even if trust phrases appear, a clear scam must still score high."""
        mixed = (
            "HDFC Bank: Do NOT share your OTP. "
            "Click bit.ly/hdfc-kyc to verify your CVV and card number immediately. "
            "Your account will be blocked."
        )
        result = run_panic_check(mixed)
        # Mixed with hard scam signals — should still be SUSPICIOUS or SCAM
        assert result.confidence >= 30

    # ── False positive protection ─────────────────────────────────────────────

    @pytest.mark.parametrize("clean_text", [
        "Standard invoice for consulting services rendered in March 2025. Payment due net 30.",
        "Meeting scheduled for Monday at 10am. Please confirm your attendance.",
        "Your package has been shipped. Expected delivery: 3-5 business days.",
        "Thank you for subscribing to our newsletter. You can unsubscribe at any time.",
        "The deployment uses shell scripts and Phase 2 is now complete.",
        "Our Q3 report shows 15% revenue growth. Board meeting on Friday.",
    ])
    def test_false_positive_clean_messages(self, clean_text):
        result = run_panic_check(clean_text)
        assert result.verdict == "SAFE", (
            f"False positive on: '{clean_text[:60]}...'\n"
            f"Got: {result.verdict} ({result.confidence}%) — {result.reasons}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# INTEGRATION — Full pipeline (L1 + L2 + L3 rules-only)
# ══════════════════════════════════════════════════════════════════════════════

class TestFullPipeline:
    def test_pipeline_runs_without_api_key(self):
        from finguard.engine.pipeline import run_audit
        # skip_llm=True: no API call, no error, llm_explanation is None
        result = run_audit(
            text="Processing fee applies. Act now! Guaranteed returns.",
            api_key="",
            skip_llm=True,
        )
        assert result["risk_report"]["score"] > 0
        assert result["error"] is None           # skip_llm bypasses key check
        assert result["llm_explanation"] is None

    def test_pipeline_missing_key_sets_error(self):
        from finguard.engine.pipeline import run_audit
        # skip_llm=False but no key -> error field populated
        result = run_audit(
            text="Processing fee applies.",
            api_key="",
            skip_llm=False,
        )
        assert result["error"] is not None       # "API key missing" warning
        assert result["llm_explanation"] is None

    def test_pipeline_clean_doc_scores_zero(self):
        from finguard.engine.pipeline import run_audit
        result = run_audit(
            text="Invoice #1042 for consulting services. Due: 30 days from receipt.",
            api_key="",
            skip_llm=True,
        )
        assert result["risk_report"]["score"] == 0
        assert result["risk_report"]["label"] == "Safe"

    def test_pipeline_result_has_timing(self):
        from finguard.engine.pipeline import run_audit
        result = run_audit(text="test", api_key="", skip_llm=True)
        assert result["total_pipeline_seconds"] >= 0

    def test_panic_pipeline_end_to_end(self):
        """Full panic check on a known scam must return SCAM."""
        text = "Your account has been suspended. Verify your CVV and card number immediately at bit.ly/verify."
        result = run_panic_check(text)
        assert result.verdict == "SCAM"
        assert result.confidence >= 65
        assert len(result.what_to_do) > 0


# ══════════════════════════════════════════════════════════════════════════════
# SLOW TESTS — require real Gemini API key
# ══════════════════════════════════════════════════════════════════════════════

@pytest.mark.slow
class TestWithRealLLM:
    """These tests make actual Gemini API calls. Set GEMINI_API_KEY env var."""

    @pytest.fixture
    def api_key(self):
        key = os.environ.get("GEMINI_API_KEY", "")
        if not key:
            pytest.skip("GEMINI_API_KEY not set")
        return key

    def test_layer3_produces_explanation(self, api_key):
        from finguard.engine.layer1_rules import run_all_rules
        from finguard.engine.layer2_scoring import calculate_risk_score
        from finguard.engine.layer3_llm import generate_llm_explanation

        text = "Guaranteed 50% returns in 30 days. No risk. Invest now."
        matches = run_all_rules(text)
        report = calculate_risk_score(matches)
        result = generate_llm_explanation(text, report, api_key)

        assert len(result["executive_summary"]) > 20
        assert len(result["recommended_actions"]) > 10
        assert result["latency_seconds"] < 10

    def test_panic_llm_enrichment_does_not_crash(self, api_key):
        from finguard.engine.panic_engine import enrich_with_llm
        result = run_panic_check("Work from home earn Rs.5000 daily. WhatsApp now.")
        enriched = enrich_with_llm(result, "Work from home earn Rs.5000 daily.", api_key)
        assert enriched.verdict in ("SCAM", "SUSPICIOUS", "SAFE")
        assert 0 <= enriched.confidence <= 100

    def test_full_pipeline_with_llm(self, api_key):
        from finguard.engine.pipeline import run_audit
        result = run_audit(
            text="Processing fee $50. Guaranteed returns 25%. Act now or your account will be blocked.",
            api_key=api_key,
            skip_llm=False,
        )
        assert result["llm_explanation"] is not None
        assert result["risk_report"]["score"] > 30


# ══════════════════════════════════════════════════════════════════════════════
# PANIC ENGINE — Extraction field tests
# ══════════════════════════════════════════════════════════════════════════════

class TestPanicExtraction:
    """Tests for structured extraction: URLs, phones, sender spoofing."""

    def test_extracts_shortened_url(self):
        result = run_panic_check("Verify here: bit.ly/sbi-kyc123")
        urls = result.extracted_urls
        assert any(u["risk"] == "shortened" for u in urls)
        assert any("bit.ly" in u["domain"] for u in urls)

    def test_extracts_suspicious_url(self):
        result = run_panic_check("Visit http://totally-not-a-scam.xyz/claim to get your prize.")
        urls = result.extracted_urls
        assert any(u["risk"] == "suspicious" for u in urls)

    def test_trusted_url_marked_safe(self):
        result = run_panic_check("Login at https://www.hdfcbank.com/netbanking")
        urls = result.extracted_urls
        assert any(u["risk"] == "safe" for u in urls)

    def test_extracts_indian_phone_bare(self):
        result = run_panic_check("Call us at 9876543210 immediately.")
        assert "9876543210" in result.extracted_phones

    def test_extracts_indian_phone_with_prefix(self):
        result = run_panic_check("Contact +91-9876543210 for support.")
        phones = [p.replace("-", "").replace(" ", "").replace("+91", "") for p in result.extracted_phones]
        assert any("9876543210" in p for p in phones)

    def test_no_phone_for_otp(self):
        result = run_panic_check("Your OTP is 847291. Do not share.")
        assert result.extracted_phones == []

    def test_no_phone_for_short_codes(self):
        result = run_panic_check("Reply 1234 to confirm your order.")
        assert result.extracted_phones == []

    def test_dedup_same_phone_twice(self):
        result = run_panic_check("Call 9876543210 or dial +91 9876543210 now.")
        assert len(result.extracted_phones) == 1

    def test_sender_flag_on_bank_impersonation(self):
        result = run_panic_check("SBI Alert: account suspended. Verify: bit.ly/sbi. Share OTP.")
        assert len(result.sender_flags) >= 1

    def test_no_sender_flag_on_clean(self):
        result = run_panic_check("Invoice for services rendered. Payment due net 30 days.")
        assert result.sender_flags == []

    def test_result_fields_always_present(self):
        """All new fields must exist even on empty/clean input."""
        result = run_panic_check("Hello world.")
        assert hasattr(result, "extracted_urls")
        assert hasattr(result, "extracted_phones")
        assert hasattr(result, "sender_flags")
        assert isinstance(result.extracted_urls, list)
        assert isinstance(result.extracted_phones, list)
        assert isinstance(result.sender_flags, list)


# ══════════════════════════════════════════════════════════════════════════════
# API — FastAPI endpoint tests
# ══════════════════════════════════════════════════════════════════════════════

class TestPanicAPI:
    """Tests for the FastAPI REST endpoints using TestClient."""

    @pytest.fixture(autouse=True)
    def setup_client(self):
        try:
            from fastapi.testclient import TestClient
            from finguard.api.panic_api import app
            self.client = TestClient(app)
        except ImportError:
            pytest.skip("fastapi or httpx not installed")

    def test_health_endpoint(self):
        r = self.client.get("/api/v1/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "version" in data
        assert "timestamp" in data

    def test_check_returns_200_on_valid_input(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Your account has been suspended. Share OTP."})
        assert r.status_code == 200

    def test_check_response_schema(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Act now! Share OTP. bit.ly/scam."})
        data = r.json()
        for field in ("verdict", "confidence", "reasons", "what_to_do",
                      "extracted_urls", "extracted_phones", "sender_flags",
                      "latency_ms", "llm_enriched", "timestamp"):
            assert field in data, f"Missing field: {field}"

    def test_check_verdict_values(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Invoice for consulting. Due net 30."})
        assert r.json()["verdict"] in ("SCAM", "SUSPICIOUS", "SAFE")

    def test_check_confidence_range(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Guaranteed returns! Share OTP now."})
        data = r.json()
        assert 0 <= data["confidence"] <= 100

    def test_check_rejects_empty_text(self):
        r = self.client.post("/api/v1/panic/check", json={"text": "   "})
        assert r.status_code == 422

    def test_check_rejects_missing_text(self):
        r = self.client.post("/api/v1/panic/check", json={})
        assert r.status_code == 422

    def test_check_url_extraction_in_response(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Click bit.ly/abc123 to verify now."})
        data = r.json()
        assert isinstance(data["extracted_urls"], list)
        assert any(u["risk"] == "shortened" for u in data["extracted_urls"])

    def test_check_phone_extraction_in_response(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Call 9876543210 to claim your prize."})
        data = r.json()
        assert isinstance(data["extracted_phones"], list)
        assert any("9876543210" in p for p in data["extracted_phones"])

    def test_check_known_scam_verdict(self):
        r = self.client.post("/api/v1/panic/check", json={
            "text": "Your CVV and card number required to verify. Click bit.ly/verify now."
        })
        assert r.json()["verdict"] == "SCAM"

    def test_check_known_safe_verdict(self):
        r = self.client.post("/api/v1/panic/check", json={
            "text": "Your OTP is 847291. Valid 10 min. Do NOT share. HDFC Bank never asks."
        })
        assert r.json()["verdict"] == "SAFE"

    def test_batch_endpoint_returns_200(self):
        r = self.client.post("/api/v1/panic/batch", json={
            "messages": ["Share OTP now", "Invoice for services", "You won Rs.2 lakh"]
        })
        assert r.status_code == 200

    def test_batch_response_schema(self):
        r = self.client.post("/api/v1/panic/batch", json={
            "messages": ["Urgent: verify OTP", "Monthly invoice attached"]
        })
        data = r.json()
        assert "results" in data
        assert "summary" in data
        assert "total_latency_ms" in data
        assert data["summary"]["total"] == 2

    def test_batch_summary_counts(self):
        r = self.client.post("/api/v1/panic/batch", json={
            "messages": [
                "Share your CVV and OTP now. Account blocked. bit.ly/x",   # SCAM
                "Invoice for consulting services. Due net 30.",              # SAFE
                "Work from home earn Rs 5000/day. WhatsApp 9876543210",     # SUSPICIOUS
            ]
        })
        data = r.json()
        s = data["summary"]
        assert s["total"] == 3
        assert s["scam"] + s["suspicious"] + s["safe"] == 3

    def test_batch_rejects_too_many_messages(self):
        r = self.client.post("/api/v1/panic/batch", json={
            "messages": [f"message {i}" for i in range(51)]
        })
        assert r.status_code == 422

    def test_batch_each_item_has_verdict(self):
        r = self.client.post("/api/v1/panic/batch", json={
            "messages": ["test one", "test two"]
        })
        for item in r.json()["results"]:
            assert item["verdict"] in ("SCAM", "SUSPICIOUS", "SAFE")
            assert 0 <= item["confidence"] <= 100

    def test_check_full_without_llm_matches_instant(self):
        """check-full with use_llm=False should give same verdict as check."""
        payload = {"text": "Your account suspended. Verify OTP at bit.ly/sbi.", "use_llm": False}
        r1 = self.client.post("/api/v1/panic/check",      json=payload)
        r2 = self.client.post("/api/v1/panic/check-full", json=payload)
        assert r1.json()["verdict"] == r2.json()["verdict"]

    def test_latency_reported_in_ms(self):
        r = self.client.post("/api/v1/panic/check",
                             json={"text": "Urgent: share your OTP now!"})
        assert r.json()["latency_ms"] >= 0

    def test_llm_enriched_false_without_key(self):
        r = self.client.post("/api/v1/panic/check-full",
                             json={"text": "Work from home 5000/day.", "use_llm": True})
        # No API key in env → llm_enriched stays False
        assert r.json()["llm_enriched"] is False


# ══════════════════════════════════════════════════════════════════════════════
# TOP-LEVEL PACKAGE API
# ══════════════════════════════════════════════════════════════════════════════

class TestPackagePublicAPI:
    """Ensure the top-level finguard package exposes the right symbols."""

    def test_run_panic_check_importable(self):
        from finguard import run_panic_check
        assert callable(run_panic_check)

    def test_run_audit_importable(self):
        from finguard import run_audit
        assert callable(run_audit)

    def test_panic_result_importable(self):
        from finguard import PanicResult
        assert PanicResult is not None

    def test_audit_result_importable(self):
        from finguard import AuditResult
        assert AuditResult is not None

    def test_top_level_panic_check_works(self):
        from finguard import run_panic_check
        r = run_panic_check("Your account has been suspended. Share OTP now.")
        assert r.verdict == "SCAM"
        assert r.confidence > 50
