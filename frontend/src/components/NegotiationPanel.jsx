import React, { useState } from "react";
import { MessageSquare, Copy, Check, Send } from "lucide-react";

/**
 * NegotiationPanel — Bento Glass Style
 * iPhone-inspired response widget.
 */
export default function NegotiationPanel({ negotiation }) {
  const [copiedType, setCopiedType] = useState(null);

  if (!negotiation) return null;

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const options = [
    { 
      id: "soft", 
      title: "Soft Pushback", 
      text: negotiation.soft,
      color: "#007aff"
    },
    { 
      id: "firm", 
      title: "Firm Legal", 
      text: negotiation.firm,
      color: "#ff9500"
    },
    { 
      id: "exit", 
      title: "Exit Option", 
      text: negotiation.exit,
      color: "#ff3b30"
    }
  ];

  return (
    <div className="glass-card animate-bento h-full">
      <div className="bento-inner">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-[10px] bg-risk-blue/20 flex items-center justify-center">
            <MessageSquare size={16} className="text-risk-blue" />
          </div>
          <span className="ios-label !mb-0">Action Scripts</span>
        </div>

        <div className="space-y-3 flex-1 overflow-auto custom-scrollbar pr-1">
          {options.map((opt) => (
            <button 
              key={opt.id} 
              onClick={() => handleCopy(opt.text, opt.id)}
              className="w-full text-left bg-white/[0.04] border border-white/[0.05] rounded-[20px] p-4 hover:bg-white/[0.08] transition-all active:scale-[0.98] group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold uppercase tracking-widest" style={{ color: opt.color }}>
                  {opt.title}
                </span>
                {copiedType === opt.id ? (
                  <Check size={14} className="text-risk-green" />
                ) : (
                  <Copy size={14} className="text-ink-muted group-hover:text-ink-secondary" />
                )}
              </div>
              <p className="text-[14px] text-ink-secondary leading-snug line-clamp-2 italic">
                "{opt.text}"
              </p>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 px-2">
          <Send size={12} className="text-ink-muted" />
          <span className="text-[11px] text-ink-muted font-medium">Tap to copy response</span>
        </div>
      </div>
    </div>
  );
}
