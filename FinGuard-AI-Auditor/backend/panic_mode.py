"""
Panic Mode Streamlit Page
==========================
Imported by app.py when the user switches to Panic Mode tab.
Designed for maximum speed and minimal cognitive load under stress.
"""
from __future__ import annotations
import time
import streamlit as st
from finguard.engine.panic_engine import run_panic_check, enrich_with_llm


# ── Colour palette ────────────────────────────────────────────────────────────
_PALETTE = {
    "SCAM":       {"bg": "#1a0000", "border": "#ff2222", "glow": "#ff0000", "label": "#ff4444", "emoji": "🚨"},
    "SUSPICIOUS": {"bg": "#1a1000", "border": "#ff9900", "glow": "#ff8800", "label": "#ffaa00", "emoji": "⚠️"},
    "SAFE":       {"bg": "#001a08", "border": "#00cc55", "glow": "#00ff66", "label": "#00dd55", "emoji": "✅"},
}

_CONFIDENCE_BAR_COLOR = {
    "SCAM":       "#ff3333",
    "SUSPICIOUS": "#ff9900",
    "SAFE":       "#00cc55",
}


def _confidence_bar(confidence: int, verdict: str) -> str:
    color = _CONFIDENCE_BAR_COLOR.get(verdict, "#888")
    return f"""
<div style="background:#1e1e1e;border-radius:99px;height:10px;width:100%;margin:8px 0 16px">
  <div style="width:{confidence}%;background:{color};height:10px;border-radius:99px;
              transition:width 0.6s cubic-bezier(.4,0,.2,1);
              box-shadow:0 0 8px {color}88"></div>
</div>"""


def render_panic_mode(api_key: str = "", use_llm: bool = False) -> None:
    """Main render function. Call from app.py."""

    st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Space+Grotesk:wght@300;400;700&display=swap');

    .panic-shell {
        font-family: 'Space Grotesk', sans-serif;
        background: #0a0a0a;
        border-radius: 16px;
        padding: 0;
        margin: 0 auto;
    }

    .panic-header {
        text-align: center;
        padding: 32px 24px 20px;
        border-bottom: 1px solid #1f1f1f;
    }

    .panic-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -1px;
        color: #fff;
        margin: 0;
    }

    .panic-sub {
        color: #555;
        font-size: 0.85rem;
        margin-top: 6px;
        letter-spacing: 1px;
        text-transform: uppercase;
    }

    .verdict-card {
        border-radius: 14px;
        padding: 28px 32px;
        margin: 20px 0;
        transition: all 0.3s ease;
    }

    .verdict-label {
        font-family: 'JetBrains Mono', monospace;
        font-size: 3rem;
        font-weight: 800;
        letter-spacing: -2px;
        line-height: 1;
        margin: 0;
    }

    .verdict-confidence {
        font-size: 0.85rem;
        letter-spacing: 2px;
        text-transform: uppercase;
        opacity: 0.7;
        margin-top: 4px;
    }

    .reason-chip {
        display: inline-block;
        background: #1a1a1a;
        border: 1px solid #2a2a2a;
        border-radius: 6px;
        padding: 5px 12px;
        margin: 4px 4px 4px 0;
        font-size: 0.82rem;
        color: #ccc;
        font-family: 'Space Grotesk', sans-serif;
    }

    .action-item {
        background: #111;
        border-left: 3px solid #333;
        border-radius: 0 8px 8px 0;
        padding: 10px 16px;
        margin: 6px 0;
        font-size: 0.9rem;
        color: #e0e0e0;
        font-family: 'Space Grotesk', sans-serif;
    }

    .meta-row {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.72rem;
        color: #444;
        text-align: right;
        margin-top: 8px;
        padding: 0 4px;
    }

    .pulse-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 6px;
        animation: pulse 1.4s ease-in-out infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.8); }
    }

    .stTextArea textarea {
        background: #111 !important;
        color: #e8e8e8 !important;
        border: 1px solid #2a2a2a !important;
        border-radius: 10px !important;
        font-family: 'Space Grotesk', sans-serif !important;
        font-size: 0.95rem !important;
        caret-color: #ff4444;
    }
    .stTextArea textarea:focus {
        border-color: #444 !important;
        box-shadow: 0 0 0 2px #ff333322 !important;
    }
    </style>
    """, unsafe_allow_html=True)

    # ── Header ─────────────────────────────────────────────────────────────────
    st.markdown("""
    <div class="panic-header">
      <p class="panic-title">🚨 PANIC MODE</p>
      <p class="panic-sub">Paste any suspicious message — get an instant verdict</p>
    </div>
    """, unsafe_allow_html=True)

    st.markdown("<div style='height:12px'></div>", unsafe_allow_html=True)

    # ── Presets ────────────────────────────────────────────────────────────────
    col_a, col_b, col_c = st.columns(3)
    preset_text = ""
    with col_a:
        if st.button("🎣 Phishing SMS", use_container_width=True):
            preset_text = "Your SBI account will be blocked. Update KYC immediately: bit.ly/sbi-kyc123. Call 9876543210 now."
    with col_b:
        if st.button("🏆 Lottery Scam", use_container_width=True):
            preset_text = "Congratulations! You've won ₹2,00,000 in the Amazon Diwali Lucky Draw. Share your OTP to claim your prize now. Act fast — offer expires in 2 hours!"
    with col_c:
        if st.button("✅ Legit OTP SMS", use_container_width=True):
            preset_text = "Your OTP for login to HDFC Bank NetBanking is 847291. Valid for 10 minutes. Do NOT share this OTP with anyone. HDFC Bank never asks for OTP."

    # ── Text Input ─────────────────────────────────────────────────────────────
    if "panic_text" not in st.session_state:
        st.session_state["panic_text"] = ""
    if preset_text:
        st.session_state["panic_text"] = preset_text
        st.rerun()

    msg = st.text_area(
        "Paste message here",
        value=st.session_state["panic_text"],
        height=130,
        placeholder="Paste a WhatsApp message, SMS, email, or any suspicious text...",
        label_visibility="collapsed",
    )
    if msg != st.session_state["panic_text"]:
        st.session_state["panic_text"] = msg

    # ── Run Button ─────────────────────────────────────────────────────────────
    col_btn, col_opt = st.columns([3, 1])
    with col_btn:
        run = st.button("⚡ CHECK NOW", type="primary", use_container_width=True)
    with col_opt:
        llm_toggle = st.toggle("+ AI", value=use_llm, help="Adds LLM enrichment for ambiguous cases (~1s extra)")

    # ── Analysis ───────────────────────────────────────────────────────────────
    if run:
        if not msg.strip():
            st.warning("Paste a message first.")
            return

        with st.spinner("Scanning..."):
            t_start = time.perf_counter()
            result = run_panic_check(msg)
            if llm_toggle and api_key:
                result = enrich_with_llm(result, msg, api_key)
            total_ms = round((time.perf_counter() - t_start) * 1000)

        st.session_state["panic_result"] = result
        st.session_state["panic_total_ms"] = total_ms

    # ── Result Display ─────────────────────────────────────────────────────────
    result = st.session_state.get("panic_result")
    if not result:
        return

    p = _PALETTE[result.verdict]
    total_ms = st.session_state.get("panic_total_ms", result.latency_ms)

    # Big verdict card
    st.markdown(f"""
<div class="verdict-card" style="
    background:{p['bg']};
    border:2px solid {p['border']};
    box-shadow:0 0 40px {p['glow']}22, inset 0 0 60px {p['glow']}08;
">
  <p class="verdict-label" style="color:{p['label']}">
    <span class="pulse-dot" style="background:{p['label']}"></span>
    {p['emoji']} {result.verdict}
  </p>
  <p class="verdict-confidence" style="color:{p['label']}">
    Confidence: {result.confidence}%
    {'&nbsp;&nbsp;·&nbsp;&nbsp;<span style="color:#555">AI-enhanced</span>' if result.llm_enriched else ''}
  </p>
  {_confidence_bar(result.confidence, result.verdict)}
</div>
""", unsafe_allow_html=True)

    # Reasons + Actions in two columns
    c1, c2 = st.columns([1, 1])

    with c1:
        st.markdown(f"<p style='color:#555;font-size:.75rem;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;font-family:JetBrains Mono,monospace'>WHY</p>", unsafe_allow_html=True)
        if result.reasons:
            chips = "".join(f'<span class="reason-chip">⚡ {r}</span>' for r in result.reasons)
            st.markdown(f"<div>{chips}</div>", unsafe_allow_html=True)
        else:
            st.markdown("<p style='color:#444;font-size:.9rem'>No specific risk patterns detected.</p>", unsafe_allow_html=True)

    with c2:
        st.markdown(f"<p style='color:#555;font-size:.75rem;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;font-family:JetBrains Mono,monospace'>WHAT TO DO</p>", unsafe_allow_html=True)
        for action in result.what_to_do:
            color = p["border"]
            st.markdown(f'<div class="action-item" style="border-left-color:{color}">{action}</div>', unsafe_allow_html=True)

    # ── Extracted Forensics ────────────────────────────────────────────────────
    has_urls   = hasattr(result, "extracted_urls")   and result.extracted_urls
    has_phones = hasattr(result, "extracted_phones") and result.extracted_phones
    has_spoof  = hasattr(result, "sender_flags")     and result.sender_flags

    if has_urls or has_phones or has_spoof:
        st.markdown("<div style='height:8px'></div>", unsafe_allow_html=True)
        st.markdown(
            "<p style='color:#444;font-size:.75rem;letter-spacing:1px;"
            "text-transform:uppercase;margin-bottom:8px;"
            "font-family:JetBrains Mono,monospace'>FORENSICS</p>",
            unsafe_allow_html=True
        )
        fcols = [c for c in [has_urls, has_phones, has_spoof] if c]
        fc = st.columns(len(fcols))
        col_idx = 0

        if has_urls:
            with fc[col_idx]:
                col_idx += 1
                url_html = ""
                for u in result.extracted_urls:
                    risk_color = {"safe": "#22c55e", "shortened": "#f59e0b", "suspicious": "#ef4444"}.get(u["risk"], "#888")
                    risk_icon  = {"safe": "✅", "shortened": "⚠️", "suspicious": "🚨"}.get(u["risk"], "❔")
                    url_short  = u["url"][:35] + ("…" if len(u["url"]) > 35 else "")
                    url_html += (
                        f'<div style="margin-bottom:6px">'
                        f'<span style="color:{risk_color};font-size:.75rem;font-weight:700">{risk_icon} {u["risk"].upper()}</span><br>'
                        f'<span style="font-family:JetBrains Mono,monospace;font-size:.78rem;color:#888">{url_short}</span>'
                        f'</div>'
                    )
                st.markdown(
                    f"<p style='color:#555;font-size:.7rem;text-transform:uppercase;letter-spacing:1px;"
                    f"font-family:JetBrains Mono,monospace;margin-bottom:6px'>URLs ({len(result.extracted_urls)})</p>"
                    f"{url_html}",
                    unsafe_allow_html=True
                )

        if has_phones:
            with fc[col_idx]:
                col_idx += 1
                phone_html = "".join(
                    f'<div style="font-family:JetBrains Mono,monospace;font-size:.82rem;'
                    f'color:#f87171;margin-bottom:4px">📵 {ph}</div>'
                    for ph in result.extracted_phones
                )
                st.markdown(
                    f"<p style='color:#555;font-size:.7rem;text-transform:uppercase;letter-spacing:1px;"
                    f"font-family:JetBrains Mono,monospace;margin-bottom:6px'>NUMBERS ({len(result.extracted_phones)})</p>"
                    f"{phone_html}",
                    unsafe_allow_html=True
                )

        if has_spoof:
            with fc[col_idx]:
                spoof_html = "".join(
                    f'<div style="font-size:.82rem;color:#fb923c;margin-bottom:4px">🎭 {s}</div>'
                    for s in result.sender_flags
                )
                st.markdown(
                    f"<p style='color:#555;font-size:.7rem;text-transform:uppercase;letter-spacing:1px;"
                    f"font-family:JetBrains Mono,monospace;margin-bottom:6px'>SPOOFING</p>"
                    f"{spoof_html}",
                    unsafe_allow_html=True
                )

    # Meta row
    st.markdown(f"""
<div class="meta-row">
  ⚡ {total_ms}ms &nbsp;·&nbsp; raw score: {result.raw_score} &nbsp;·&nbsp;
  {'🤖 llm' if result.llm_enriched else '🔵 rules only'}
</div>
""", unsafe_allow_html=True)
