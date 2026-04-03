"""
PDF Export Utility
==================
Converts an AuditResult into a properly formatted PDF binary.
"""

from __future__ import annotations
from fpdf import FPDF
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..engine.pipeline import AuditResult


SEVERITY_COLORS = {
    "high":   (220, 38, 38),    # red
    "medium": (234, 88, 12),    # orange
    "low":    (37, 99, 235),    # blue
}

SCORE_COLORS = {
    "Critical":    (127, 0, 0),
    "High Risk":   (220, 38, 38),
    "Medium Risk": (180, 100, 0),
    "Low Risk":    (37, 99, 235),
    "Safe":        (22, 101, 52),
}


def _clean(text: str) -> str:
    """Strip markdown and ensure latin-1 safe output."""
    for tok in ["###", "##", "#", "**", "*", "`", "---"]:
        text = text.replace(tok, "")
    return text.encode("latin-1", "replace").decode("latin-1").strip()


def generate_audit_pdf(result: "AuditResult") -> bytes:
    """
    Render a full AuditResult to a PDF and return raw bytes.
    """
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    risk = result["risk_report"]
    llm = result.get("llm_explanation")
    score_label = risk["label"]
    score_color = SCORE_COLORS.get(score_label, (0, 0, 0))

    # ── Header ────────────────────────────────────────────────────────────────
    pdf.set_fill_color(15, 23, 42)
    pdf.rect(0, 0, 210, 28, "F")
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(255, 255, 255)
    pdf.set_xy(10, 8)
    pdf.cell(0, 10, "FinGuard 3.0 — Forensic Audit Report", ln=True)

    # ── Risk Score Banner ─────────────────────────────────────────────────────
    pdf.set_xy(10, 32)
    pdf.set_font("Helvetica", "B", 28)
    pdf.set_text_color(*score_color)
    pdf.cell(0, 12, f"Risk Score: {risk['score']}/100  —  {score_label}", ln=True)
    pdf.set_text_color(100, 116, 139)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(
        0, 6,
        f"Total flags: {risk['total_matches']}  |  "
        f"High: {risk['severity_counts']['high']}  "
        f"Medium: {risk['severity_counts']['medium']}  "
        f"Low: {risk['severity_counts']['low']}  |  "
        f"Pipeline: {result['total_pipeline_seconds']}s",
        ln=True,
    )
    pdf.ln(4)
    pdf.set_draw_color(226, 232, 240)
    pdf.line(10, pdf.get_y(), 200, pdf.get_y())
    pdf.ln(6)

    # ── Executive Summary ─────────────────────────────────────────────────────
    if llm and llm.get("executive_summary"):
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, "Executive Summary", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 6, _clean(llm["executive_summary"]))
        pdf.ln(4)

    # ── Risk Breakdown ────────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 12)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 8, "Detected Risk Flags", ln=True)
    pdf.ln(2)

    for item in risk["breakdown"]:
        sev = item["severity"]
        color = SEVERITY_COLORS.get(sev, (100, 116, 139))

        # Severity badge
        pdf.set_fill_color(*color)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font("Helvetica", "B", 8)
        pdf.cell(20, 6, f"  {sev.upper()}", fill=True)

        # Rule type
        pdf.set_fill_color(241, 245, 249)
        pdf.set_text_color(15, 23, 42)
        pdf.set_font("Helvetica", "B", 9)
        pdf.cell(0, 6, f"  {item['rule_type'].replace('_', ' ').title()}", fill=True, ln=True)

        # Matched text
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(100, 116, 139)
        pdf.set_x(10)
        pdf.multi_cell(0, 5, _clean(f"Matched: {item['matched_text']}"))

        # Explanation
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(51, 65, 85)
        pdf.set_x(10)
        pdf.multi_cell(0, 5, _clean(item["explanation"]))
        pdf.ln(3)

    # ── Plain Language Risks ──────────────────────────────────────────────────
    if llm and llm.get("plain_language_risks"):
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, "Plain Language Explanation", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 6, _clean(llm["plain_language_risks"]))
        pdf.ln(4)

    # ── Recommended Actions ───────────────────────────────────────────────────
    if llm and llm.get("recommended_actions"):
        pdf.line(10, pdf.get_y(), 200, pdf.get_y())
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 12)
        pdf.set_text_color(15, 23, 42)
        pdf.cell(0, 8, "Recommended Actions", ln=True)
        pdf.set_font("Helvetica", "", 10)
        pdf.set_text_color(51, 65, 85)
        pdf.multi_cell(0, 6, _clean(llm["recommended_actions"]))
        pdf.ln(4)

    # ── Error Notice ──────────────────────────────────────────────────────────
    if result.get("error"):
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(180, 60, 60)
        pdf.multi_cell(0, 5, f"Notice: {result['error']}")

    # ── Footer ────────────────────────────────────────────────────────────────
    pdf.set_y(-15)
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(148, 163, 184)
    pdf.cell(0, 5, "Generated by FinGuard 3.0 — For internal use only. Not legal advice.", align="C")

    return pdf.output(dest="S").encode("latin-1")