import React, { useState } from "react";
import { ShieldAlert, Copy, Check, FileText } from "lucide-react";

/**
 * DisputePanel — Bento Glass Style
 * iPhone-inspired legal document widget.
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
    <div className="glass-card animate-bento">
      <div className="bento-inner">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-risk-red/20 flex items-center justify-center">
              <ShieldAlert size={16} className="text-risk-red" />
            </div>
            <span className="ios-label !mb-0">Automated Dispute</span>
          </div>
          
          <button
            onClick={handleCopy}
            className={`iphone-btn !px-4 !py-2 !rounded-full text-[12px] ${copied ? 'bg-risk-green text-white' : 'bg-white/10 text-ink-primary hover:bg-white/20'}`}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Letter"}
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.05] rounded-[22px] p-6 font-serif text-[15px] leading-relaxed text-ink-secondary/90 max-h-[300px] overflow-auto custom-scrollbar whitespace-pre-wrap select-text italic">
          {letter}
        </div>

        <div className="mt-6 flex items-start gap-3 p-4 bg-white/[0.03] rounded-[18px] border border-white/[0.05]">
          <FileText size={18} className="text-ink-muted mt-0.5 shrink-0" />
          <p className="text-[12px] text-ink-muted leading-snug">
            This letter is pre-filled with evidence from this audit. 
            Fill in your details ([USER_NAME], etc.) and send it to your bank's fraud department immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
