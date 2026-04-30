import React, { useState } from "react";
import { MessageSquare, Copy, Check, ShieldAlert, Send } from "lucide-react";

/**
 * NegotiationPanel — "Negotiate for Me"
 * Provides ready-to-use responses for the user to handle scammers/shady sales.
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
      title: "The Polite Reject", 
      desc: "Best for WhatsApp or friendly sales agents.", 
      text: negotiation.soft,
      color: "text-blue-400"
    },
    { 
      id: "firm", 
      title: "The Firm Legal", 
      desc: "Use this if they keep pushing or ignore you.", 
      text: negotiation.firm,
      color: "text-amber-400"
    },
    { 
      id: "exit", 
      title: "The Exit Option", 
      desc: "The 'Nuclear' message to end the conversation.", 
      text: negotiation.exit,
      color: "text-risk-red"
    }
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-[16px] p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare size={14} className="text-risk-blue" />
        <div className="text-[11px] font-bold tracking-[1.2px] uppercase text-ink-muted">
          Negotiate for Me: Ready Responses
        </div>
      </div>

      <div className="space-y-3">
        {options.map((opt) => (
          <div 
            key={opt.id} 
            className="group bg-surface border border-surface-border rounded-[12px] p-4 hover:border-risk-blue/40 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className={`text-[12px] font-bold uppercase tracking-tight ${opt.color}`}>
                  {opt.title}
                </span>
                <p className="text-[10px] text-ink-faint italic">{opt.desc}</p>
              </div>
              <button 
                onClick={() => handleCopy(opt.text, opt.id)}
                className="p-2 hover:bg-surface-deep rounded-lg text-ink-muted transition-colors flex items-center gap-1.5"
              >
                {copiedType === opt.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                <span className="text-[11px] font-medium">{copiedType === opt.id ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <div className="text-[13px] text-ink-secondary leading-relaxed bg-surface-deep/50 p-3 rounded-lg font-medium italic border border-white/5">
              "{opt.text}"
            </div>
            <div className="mt-3 flex items-center gap-2 text-[10px] text-ink-faint">
              <Send size={10} />
              <span>Perfect for WhatsApp, Email, or SMS</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-risk-blue/5 border border-risk-blue/10 rounded-lg flex items-start gap-2">
        <ShieldAlert size={12} className="text-risk-blue mt-0.5 shrink-0" />
        <p className="text-[11px] text-ink-muted italic leading-snug">
          <strong>Tip:</strong> Don't be afraid to walk away. These messages are designed to put the pressure back on the sender.
        </p>
      </div>
    </div>
  );
}
