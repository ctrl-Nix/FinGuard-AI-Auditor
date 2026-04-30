/**
 * analyzer.js
 * -----------
 * Client-side analysis engine. Mirrors the Python backend exactly.
 * Runs in <5ms on any modern device — no API call needed.
 *
 * Exports:
 *   analyzeText(text) → AnalysisResult
 */

import { SIGNALS, TRUST_SIGNALS } from "./signals.js";

// ── Section metadata ──────────────────────────────────────────────────────────
export const SECTION_META = {
  hidden_fee:          { label: "Hidden Fees",          icon: "DollarSign",   color: "#f59e0b", colorDim: "rgba(245,158,11,0.12)"  },
  misleading_phrase:   { label: "Misleading Claims",    icon: "AlertTriangle",color: "#ef4444", colorDim: "rgba(239,68,68,0.12)"   },
  auto_renewal_trap:   { label: "Auto-Renewal Traps",   icon: "RefreshCcw",   color: "#f59e0b", colorDim: "rgba(245,158,11,0.12)"  },
  urgency_language:    { label: "Manipulation Tactics", icon: "Zap",          color: "#f97316", colorDim: "rgba(249,115,22,0.12)"  },
  social_engineering:  { label: "Legal Risks",          icon: "Shield",       color: "#ef4444", colorDim: "rgba(239,68,68,0.12)"   },
  laundering_signal:   { label: "Fraud Signals",        icon: "AlertOctagon", color: "#ef4444", colorDim: "rgba(239,68,68,0.12)"   },
};

export const SEV_COLOR = {
  high:   "#ef4444",
  medium: "#f59e0b",
  low:    "#3b82f6",
};

export const SECTION_ORDER = [
  "social_engineering",
  "laundering_signal",
  "misleading_phrase",
  "hidden_fee",
  "urgency_language",
  "auto_renewal_trap",
];

// ── Scoring ───────────────────────────────────────────────────────────────────
function sigmoid(raw) {
  return Math.min(100, Math.round(100 * (1 - Math.exp(-raw / 60))));
}

export function verdictFromScore(score) {
  if (score >= 85) return { label: "Critical",    color: "#ef4444", bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.30)"  };
  if (score >= 60) return { label: "High Risk",   color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.30)" };
  if (score >= 30) return { label: "Medium Risk", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.30)" };
  if (score >= 10) return { label: "Low Risk",    color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.30)"  };
  return               { label: "Safe",         color: "#22c55e", bg: "rgba(34,197,94,0.12)",  border: "rgba(34,197,94,0.30)"  };
}

export function generateNegotiation(matches) {
  const hasHiddenFees = matches.some(m => m.type === "hidden_fee");
  const hasRenewals   = matches.some(m => m.type === "auto_renewal_trap");
  
  return {
    soft: `Hi, I've reviewed the terms. I noticed some extra ${hasHiddenFees ? 'fees' : 'clauses'} that I'm not comfortable with. Can we remove the ${hasHiddenFees ? 'processing/handling charges' : 'automatic renewal'} before I sign?`,
    firm: `I cannot agree to these terms as currently drafted. The ${hasHiddenFees ? 'hidden fees' : 'auto-renewal clauses'} appear to violate standard consumer fairness guidelines. Please provide a version with these removed.`,
    exit: `Due to the ${hasHiddenFees ? 'undisclosed fees' : 'restrictive renewal terms'} found in this document, I will not be proceeding with this agreement. Please consider this my formal rejection.`
  };
}

function meterColor(score) {
  if (score >= 60) return "#ef4444";
  if (score >= 30) return "#f59e0b";
  return "#22c55e";
}

// ── Main analysis function ────────────────────────────────────────────────────
export function analyzeText(text) {
  if (!text || !text.trim()) {
    return { score: 0, verdict: verdictFromScore(0), meterColor: "#22c55e", matches: [], byType: {}, severityCounts: { high: 0, medium: 0, low: 0 }, isEmpty: true };
  }

  let raw = 0;
  const matches = [];
  const seenReasons = new Set();

  // Stage 1: positive signals
  for (const sig of SIGNALS) {
    const m = text.match(sig.pattern);
    if (m && !seenReasons.has(sig.reason)) {
      seenReasons.add(sig.reason);
      raw += sig.weight;
      matches.push({
        type:        sig.type,
        severity:    sig.severity,
        text:        m[0],
        index:       m.index,
        reason:      sig.reason,
        pts:         sig.weight,
      });
    }
  }

  // Stage 2: trust signal dampeners
  for (const trust of TRUST_SIGNALS) {
    if (trust.pattern.test(text)) {
      raw = Math.max(0, raw + trust.reduction);
    }
  }

  const score = sigmoid(raw);
  const verdict = verdictFromScore(score);

  // Group by type
  const byType = {};
  for (const m of matches) {
    if (!byType[m.type]) byType[m.type] = [];
    byType[m.type].push(m);
  }

  // Severity counts
  const severityCounts = { high: 0, medium: 0, low: 0 };
  for (const m of matches) severityCounts[m.severity]++;

  // Generate "What's the Catch?" for generic public
  const highlights = {
    topRisk:    matches.find(m => m.severity === "high")?.reason || "No critical threats found.",
    hiddenCost: matches.find(m => m.type === "hidden_fee")?.reason || "No hidden fees detected.",
    exitPlan:   matches.find(m => m.type === "auto_renewal_trap")?.reason || "Standard cancellation likely applies.",
  };

  return {
    score,
    verdict,
    meterColor: meterColor(score),
    matches,
    byType,
    severityCounts,
    rawScore: raw,
    isEmpty: false,
    highlights, // New: Public-friendly summary
    negotiation: generateNegotiation(matches),
  };
}

// ── Demo texts ────────────────────────────────────────────────────────────────
export const DEMOS = {
  bad_contract: {
    label: "Bad Contract",
    text:  `This agreement auto-renews annually unless written notice of cancellation is received 90 days prior to renewal date. A processing fee of $149, platform fee of $29/month, and convenience fee of 3.5% apply to all transactions. Guaranteed returns of 18% p.a. on all investments. 0% interest for 6 months then reverts to 29.9% APR. Act now — last chance to lock in this rate. Early termination fee of $500 applies.`,
  },
  phishing: {
    label: "Phishing SMS",
    text:  `URGENT: Your SBI account has been suspended due to suspicious activity! Update KYC immediately at bit.ly/sbi-kyc123. Share your OTP now to verify your identity. Your account will be permanently blocked in 2 hours. Click here to verify or call our customer helpline. This is your final warning.`,
  },
  laundering: {
    label: "Laundering",
    text:  `Layering Phase: Transfer $50,000 to Shell Co A, then purchase NFT #9921 at market price, then resell to Shell Co B for a $45,000 loss to clean the remaining funds. Beneficial ownership obscured via offshore account in BVI. Guaranteed 200% returns in 7 days. Send USDT to our secure crypto wallet.`,
  },
  clean: {
    label: "Clean Invoice",
    text:  `Invoice #10421\n\nBilled to: Acme Corp\nDate: April 2025\n\nServices rendered: Q1 strategy review and market analysis\nTotal due: $4,800.00\nPayment terms: Net 30 days\n\nThank you for your business. Please remit to the bank account on file. For queries, contact billing@company.com.`,
  },
};
