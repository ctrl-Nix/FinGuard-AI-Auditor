"""
FinGuard 3.0 — Main Streamlit Application
==========================================
Two modes:
  🚨 Panic Mode  — ultra-fast single-message scam check (<2s)
  🛡️  Audit Mode  — deep 3-layer forensic document analysis

Layer 1: Rule-Based Detection  (finguard/engine/layer1_rules.py)
Layer 2: Risk Scoring          (finguard/engine/layer2_scoring.py)
Layer 3: LLM Explanation       (finguard/engine/layer3_llm.py)
"""

import io
import streamlit as st
import pypdf
from PIL import Image

from finguard.engine.pipeline import run_audit
from finguard.utils.pdf_export import generate_audit_pdf
from panic_mode import render_panic_mode

# ── Page config ───────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="FinGuard 3.0 | Enterprise Auditor",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# ── Session state ─────────────────────────────────────────────────────────────
for key, default in {
    "input_text":    "",
    "input_image":   None,
    "input_type":    "text",
    "audit_result":  None,
}.items():
    if key not in st.session_state:
        st.session_state[key] = default

# ── CSS ───────────────────────────────────────────────────────────────────────
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] { font-family: 'Inter', sans-serif; color: #0f172a; background: #fff; }

section[data-testid="stSidebar"] { background: #f8fafc; border-right: 1px solid #e2e8f0; }
section[data-testid="stSidebar"] * { color: #0f172a !important; }

.stTextInput input, .stTextArea textarea { background: #fff; border: 1px solid #cbd5e1; border-radius: 6px; color: #0f172a; }

div.stButton > button { background: #fff; color: #0f172a; border: 1px solid #94a3b8; border-radius: 6px; transition: all .2s; }
div.stButton > button:hover { background: #f1f5f9; border-color: #0f172a; }

button[kind="primary"] { background: #0f172a !important; color: #fff !important; border: none !important; }
button[kind="primary"]:hover { background: #334155 !important; }

div[data-testid="stMetricValue"] { font-size: 1.6rem; color: #0f172a !important; }

.risk-card {
    border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px;
    margin-bottom: 12px; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.06);
}
.badge-high   { background:#fef2f2; color:#b91c1c; border:1px solid #fca5a5; border-radius:4px; padding:2px 8px; font-size:.75rem; font-weight:600; }
.badge-medium { background:#fff7ed; color:#c2410c; border:1px solid #fdba74; border-radius:4px; padding:2px 8px; font-size:.75rem; font-weight:600; }
.badge-low    { background:#eff6ff; color:#1d4ed8; border:1px solid #93c5fd; border-radius:4px; padding:2px 8px; font-size:.75rem; font-weight:600; }
.match-chip   { background:#f1f5f9; color:#475569; border-radius:4px; padding:2px 8px; font-size:.8rem; font-family:monospace; }
.score-bar-track { background:#f1f5f9; border-radius:99px; height:12px; margin:8px 0; }
.section-title { font-size:1.05rem; font-weight:600; color:#0f172a; margin:20px 0 10px; border-bottom:1px solid #f1f5f9; padding-bottom:6px; }
</style>
""", unsafe_allow_html=True)


# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🛡️ FinGuard 3.0")
    st.caption("Enterprise Forensic Audit System")
    st.divider()

    st.markdown("#### 🔑 API Access")
    api_key = st.text_input("Gemini API Key", type="password", help="Get yours at aistudio.google.com")

    st.markdown("#### 🧠 Neural Engine")
    MODEL_MAP = {
        "Gemini 2.5 Pro  (Deep Reasoner)":  "gemini-2.5-pro-preview-05-06",
        "Gemini 2.5 Flash (Balanced)":       "gemini-2.5-flash-preview-04-17",
        "Gemini 2.0 Flash (High Speed)":     "gemini-2.0-flash",
    }
    selected_label = st.selectbox("Model", list(MODEL_MAP.keys()), index=1)
    model_choice = MODEL_MAP[selected_label]
    st.caption(f"`{model_choice}`")

    st.divider()
    st.markdown("#### ⚙️ Options")
    skip_llm = st.toggle("Rules Only (skip LLM)", value=False,
                         help="Run Layers 1+2 only — no API call, instant results")

    st.divider()
    if st.button("♻️ Reset Session", use_container_width=True):
        st.session_state.clear()
        st.rerun()

    # Layer legend
    st.markdown("#### 🏗️ Architecture")
    st.markdown("""
<div style="font-size:.8rem;color:#64748b;line-height:1.8">
🔵 <b>Layer 1</b> — Rule Engine<br>
🟠 <b>Layer 2</b> — Risk Scorer<br>
🟢 <b>Layer 3</b> — LLM Synthesis
</div>
""", unsafe_allow_html=True)



# ── Mode Switcher ─────────────────────────────────────────────────────────────
st.markdown("""
<style>
div[data-testid="stHorizontalBlock"] > div:first-child button {
    font-size: 1.1rem !important; font-weight: 700 !important;
}
</style>
""", unsafe_allow_html=True)

mode_col1, mode_col2, mode_spacer = st.columns([1, 1, 3])
with mode_col1:
    panic_btn = st.button("🚨 PANIC MODE", use_container_width=True,
                          help="Instant scam check — paste any suspicious message")
with mode_col2:
    audit_btn = st.button("🛡️ AUDIT MODE", use_container_width=True,
                          help="Deep 3-layer forensic document analysis")

if "app_mode" not in st.session_state:
    st.session_state["app_mode"] = "audit"
if panic_btn:
    st.session_state["app_mode"] = "panic"
if audit_btn:
    st.session_state["app_mode"] = "audit"

# ── PANIC MODE ────────────────────────────────────────────────────────────────
if st.session_state["app_mode"] == "panic":
    render_panic_mode(api_key=api_key, use_llm=False)
    st.stop()

# ── AUDIT MODE (continues below) ──────────────────────────────────────────────


# ── Header ────────────────────────────────────────────────────────────────────
st.markdown("""
<div style="border-bottom:1px solid #e2e8f0;padding-bottom:18px;margin-bottom:28px">
  <h1 style="margin:0">Financial Integrity Dashboard</h1>
  <p style="color:#64748b;margin:4px 0 0">AI-Powered Fraud Detection & Compliance Verification — 3-Layer Engine</p>
</div>
""", unsafe_allow_html=True)


# ── Input Tabs ────────────────────────────────────────────────────────────────
tab1, tab2, tab3 = st.tabs(["📄 Upload Contract", "🖼️ Scan Receipt / Image", "⌨️ Manual Entry"])

with tab1:
    uploaded_pdf = st.file_uploader("Drop a PDF contract here", type=["pdf"])
    if uploaded_pdf:
        try:
            reader = pypdf.PdfReader(uploaded_pdf)
            text = "".join(p.extract_text() or "" for p in reader.pages)
            if not text.strip():
                st.warning("⚠️ No extractable text found — may be image-based. Use the Image tab.")
            else:
                st.session_state["input_text"] = text
                st.session_state["input_type"] = "text"
                st.success(f"✅ {len(reader.pages)} pages indexed — {len(text):,} characters extracted.")
        except pypdf.errors.PdfReadError as e:
            st.error(f"❌ Corrupt or encrypted PDF: {e}")
        except Exception as e:
            st.error(f"❌ PDF parse error: {e}")

with tab2:
    uploaded_img = st.file_uploader("Drop an image here (JPG, PNG, WEBP)", type=["jpg","jpeg","png","webp"])
    if uploaded_img:
        image = Image.open(uploaded_img)
        c1, c2 = st.columns([1, 2])
        with c1:
            st.image(image, use_container_width=True)
        with c2:
            st.info(
                "⚠️ **Image mode note:** The rule engine requires text. "
                "For full 3-layer analysis, also paste any text from this image in the Manual Entry tab. "
                "Image-only audit will run Layer 3 (LLM vision) directly."
            )
            # Extract text from image by passing path info to LLM — store image
            st.session_state["input_image"] = image
            st.session_state["input_type"] = "image"

with tab3:
    col_txt, col_presets = st.columns([3, 1])
    with col_presets:
        st.markdown("**Simulations**")
        if st.button("⚠️ Phishing", use_container_width=True):
            st.session_state["input_text"] = (
                "SECURITY ALERT: Your Wells Fargo account has been suspended. "
                "Click http://bit.ly/a3kX9 to verify your SSN immediately or lose account access. "
                "Act now — this link expires in 2 hours."
            )
            st.session_state["input_type"] = "text"
            st.rerun()
        if st.button("💸 Laundering", use_container_width=True):
            st.session_state["input_text"] = (
                "Layering Phase: Move $50,000 to Shell Co A, then purchase NFT #9921 "
                "at market price, then resell to Shell Co B for a $45,000 loss to clean "
                "the remaining funds. Beneficial ownership obscured via offshore account in BVI."
            )
            st.session_state["input_type"] = "text"
            st.rerun()
        if st.button("📄 Bad Contract", use_container_width=True):
            st.session_state["input_text"] = (
                "This agreement auto-renews annually unless written notice of cancellation "
                "is received 90 days prior to renewal. A processing fee of $149, platform fee "
                "of $29/month, and convenience fee of 3.5% apply. Offer valid for limited time "
                "only. Guaranteed returns of 18% p.a. on all investments. 0% interest for 6 "
                "months then reverts to 29.9% APR. Act now — last chance to lock in this rate."
            )
            st.session_state["input_type"] = "text"
            st.rerun()

    with col_txt:
        current = st.session_state["input_text"]
        typed = st.text_area("Raw Text / Evidence", value=current, height=160,
                             placeholder="Paste contract text, email, financial communication...")
        if typed != current:
            st.session_state["input_text"] = typed
            st.session_state["input_type"] = "text"


# ── Run Button ────────────────────────────────────────────────────────────────
st.markdown("###")
mode_label = "RULES ONLY" if skip_llm else f"FULL 3-LAYER AUDIT · {selected_label.upper()}"
run_btn = st.button(f"⚡ RUN {mode_label}", type="primary", use_container_width=True)

if run_btn:
    text_to_audit = st.session_state["input_text"]

    if not text_to_audit.strip() and st.session_state["input_type"] != "image":
        st.warning("⚠️ No evidence loaded. Use a tab above to load content.")
    elif not api_key and not skip_llm:
        st.error("⛔ Gemini API key required for Layer 3. Enable 'Rules Only' to run without it.")
    else:
        with st.status("⚡ Pipeline Running...", expanded=True) as status:
            st.write("🔵 Layer 1 — Running rule-based detection...")

            # For image-only: pass a note so LLM has context
            audit_text = text_to_audit if text_to_audit.strip() else \
                "[Image uploaded — no extractable text. LLM should analyse the provided image content.]"

            result = run_audit(
                text=audit_text,
                api_key=api_key if not skip_llm else "",
                model=model_choice,
                skip_llm=skip_llm,
            )
            st.session_state["audit_result"] = result

            st.write(f"🟠 Layer 2 — Scored: {result['risk_report']['score']}/100 ({result['risk_report']['label']})")
            if not skip_llm:
                st.write("🟢 Layer 3 — LLM synthesis complete.")

            if result.get("error"):
                status.update(label=f"⚠️ Completed with warning: {result['error']}", state="complete")
            else:
                status.update(label="✅ Audit Complete", state="complete", expanded=False)


# ── Results Dashboard ─────────────────────────────────────────────────────────
result = st.session_state.get("audit_result")
if not result:
    st.stop()

st.markdown("---")
risk = result["risk_report"]
llm  = result.get("llm_explanation")
score = risk["score"]

# Colour mapping
SCORE_COLORS = {
    "Critical":    "#7f0000",
    "High Risk":   "#dc2626",
    "Medium Risk": "#ea580c",
    "Low Risk":    "#1d4ed8",
    "Safe":        "#166534",
}
score_color = SCORE_COLORS.get(risk["label"], "#0f172a")


# ── KPI Row ───────────────────────────────────────────────────────────────────
k1, k2, k3, k4, k5 = st.columns(5)
k1.metric("Risk Score",      f"{score}/100")
k2.metric("Label",           risk["label"])
k3.metric("Total Flags",     risk["total_matches"])
k4.metric("High Severity",   risk["severity_counts"]["high"])
k5.metric("Pipeline Time",   f"{result['total_pipeline_seconds']}s")

# Score bar
bar_pct = score
bar_color = score_color
st.markdown(f"""
<div class="score-bar-track">
  <div style="width:{bar_pct}%;background:{bar_color};height:12px;border-radius:99px;transition:width .6s ease"></div>
</div>
<p style="font-size:.8rem;color:#94a3b8;margin-top:2px">Risk score: {score}/100 — {risk['label']}</p>
""", unsafe_allow_html=True)


# ── Tabs: Findings | Explanation | Raw ───────────────────────────────────────
rtab1, rtab2, rtab3 = st.tabs(["🔵 Layer 1 — Rule Flags", "🟢 Layer 3 — LLM Explanation", "🗂️ Raw JSON"])

# ── LAYER 1 Results ───────────────────────────────────────────────────────────
with rtab1:
    if not result["rule_matches"]:
        st.success("✅ No rule violations detected in this document.")
    else:
        # Group by severity
        by_sev = {"high": [], "medium": [], "low": []}
        for item in risk["breakdown"]:
            by_sev.get(item["severity"], by_sev["low"]).append(item)

        for sev_level in ["high", "medium", "low"]:
            items = by_sev[sev_level]
            if not items:
                continue
            badge_class = f"badge-{sev_level}"
            st.markdown(f'<div class="section-title"><span class="{badge_class}">{sev_level.upper()}</span> &nbsp;{len(items)} finding(s)</div>', unsafe_allow_html=True)
            for item in items:
                rule_label = item["rule_type"].replace("_", " ").title()
                st.markdown(f"""
<div class="risk-card">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
    <span class="badge-{sev_level}">{sev_level.upper()}</span>
    <strong style="color:#0f172a">{rule_label}</strong>
    <span style="margin-left:auto;color:#94a3b8;font-size:.8rem">+{item['points_contributed']} pts</span>
  </div>
  <div style="margin-bottom:6px"><span class="match-chip">"{item['matched_text']}"</span></div>
  <div style="font-size:.9rem;color:#475569">{item['explanation']}</div>
</div>
""", unsafe_allow_html=True)

    # Severity breakdown chart
    if risk["total_matches"] > 0:
        st.markdown('<div class="section-title">Severity Distribution</div>', unsafe_allow_html=True)
        sc = risk["severity_counts"]
        total = sum(sc.values()) or 1
        for sev, count in [("high", sc["high"]), ("medium", sc["medium"]), ("low", sc["low"])]:
            pct = round(count / total * 100)
            colors = {"high": "#dc2626", "medium": "#ea580c", "low": "#1d4ed8"}
            st.markdown(f"""
<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
  <span style="width:60px;font-size:.8rem;color:#64748b;text-transform:uppercase">{sev}</span>
  <div style="flex:1;background:#f1f5f9;border-radius:99px;height:8px">
    <div style="width:{pct}%;background:{colors[sev]};height:8px;border-radius:99px"></div>
  </div>
  <span style="width:30px;font-size:.85rem;color:#0f172a;font-weight:600">{count}</span>
</div>
""", unsafe_allow_html=True)


# ── LAYER 3 Results ───────────────────────────────────────────────────────────
with rtab2:
    if skip_llm:
        st.info("Layer 3 (LLM) was skipped. Disable 'Rules Only' mode in the sidebar to enable it.")
    elif not llm:
        err = result.get("error", "Unknown error")
        st.error(f"Layer 3 did not produce output. {err}")
    else:
        # Executive Summary
        st.markdown('<div class="section-title">📋 Executive Summary</div>', unsafe_allow_html=True)
        st.info(llm["executive_summary"])

        # Plain language risks
        st.markdown('<div class="section-title">🔍 Risk Explanation (Plain Language)</div>', unsafe_allow_html=True)
        st.markdown(llm["plain_language_risks"])

        # Actions
        st.markdown('<div class="section-title">✅ Recommended Actions</div>', unsafe_allow_html=True)
        st.success(llm["recommended_actions"])

        # LLM meta
        st.caption(f"Model: `{llm['model_used']}` · LLM latency: `{llm['latency_seconds']}s`")


# ── Raw JSON ──────────────────────────────────────────────────────────────────
with rtab3:
    import json
    # Sanitise result for JSON (PIL images aren't serialisable)
    safe_result = {
        "risk_report":    result["risk_report"],
        "rule_matches":   result["rule_matches"],
        "llm_explanation": result["llm_explanation"],
        "total_pipeline_seconds": result["total_pipeline_seconds"],
        "error": result.get("error"),
    }
    st.code(json.dumps(safe_result, indent=2, default=str), language="json")


# ── Export ────────────────────────────────────────────────────────────────────
st.markdown("---")
col_dl1, col_dl2, _ = st.columns([1, 1, 3])
with col_dl1:
    pdf_bytes = generate_audit_pdf(result)
    st.download_button(
        "📥 Export PDF Report",
        data=pdf_bytes,
        file_name="finguard_audit_report.pdf",
        mime="application/pdf",
        use_container_width=True,
    )
with col_dl2:
    import json
    json_str = json.dumps(safe_result, indent=2, default=str)
    st.download_button(
        "📋 Export JSON",
        data=json_str,
        file_name="finguard_audit_result.json",
        mime="application/json",
        use_container_width=True,
    )
