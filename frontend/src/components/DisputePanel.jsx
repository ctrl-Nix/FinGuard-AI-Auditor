import React, { useState } from "react";
import { ShieldAlert, Copy, Check, FileText } from "lucide-react";

/**
 * DisputePanel — Offensive Protection (The "Shield").
 * Shows the AI-generated dispute letter for bank/police use.
 */
export default function DisputePanel({ letter }) {
  const [copied, setCopied] = useState(false);

  if (!letter) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#1a1c24] border border-risk-red/30 rounded-[16px] p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} className="text-risk-red" />
          <div className="text-[12px] font-bold tracking-[1px] uppercase text-risk-red">
            Offensive Protection: Automated Dispute
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-ink-muted hover:text-ink-secondary text-[11px] font-medium transition-colors"
        >
          {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy Letter"}
        </button>
      </div>

      <div className="bg-surface-deep border border-surface-border rounded-[10px] p-4 font-serif text-[14px] leading-relaxed text-ink-secondary max-h-[300px] overflow-auto whitespace-pre-wrap select-text">
        {letter}
      </div>

      <div className="mt-4 flex items-start gap-2.5 text-[11px] text-ink-faint italic leading-snug">
        <FileText size={14} className="mt-0.5 shrink-0" />
        <div>
          This letter is pre-filled with evidence from this audit. 
          Fill in your details ([USER_NAME], etc.) and send it to your bank's fraud department immediately.
        </div>
      </div>
    </div>
  );
}
