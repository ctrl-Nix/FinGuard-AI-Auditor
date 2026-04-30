import React from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

/**
 * VerdictHeader — "Bento Glass" iPhone Style
 * Highly visible, unmissable risk indicator for the general public.
 */
export default function VerdictHeader({ verdict, score }) {
  if (!verdict || verdict.label === "Awaiting input") return null;

  const isScam = verdict.label.toUpperCase() === "CRITICAL" || verdict.label.toUpperCase() === "SCAM";
  const isHigh = verdict.label.toUpperCase() === "HIGH RISK";
  const isMed  = verdict.label.toUpperCase() === "MEDIUM RISK";
  
  let Icon = CheckCircle;
  let message = "Safe to Proceed";
  let subMessage = "No major threats detected.";

  if (isScam || isHigh) {
    Icon = ShieldAlert;
    message = "High Danger";
    subMessage = "Serious financial traps found.";
  } else if (isMed) {
    Icon = AlertTriangle;
    message = "Caution Required";
    subMessage = "Suspicious clauses detected.";
  }

  return (
    <div className="glass-card animate-bento overflow-hidden mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6 p-6">
        <div 
          className="w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-2xl rotate-[-5deg]"
          style={{ background: `linear-gradient(135deg, ${verdict.color}, ${verdict.color}dd)` }}
        >
          <Icon size={34} className="text-white" />
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <span className="ios-label mb-1">Audit Verdict</span>
          <h2 className="text-[28px] font-extrabold tracking-tight leading-tight mb-1">
            {message}
          </h2>
          <p className="text-[15px] text-ink-secondary font-medium">
            {subMessage}
          </p>
        </div>

        <div className="h-12 w-[1px] bg-white/10 hidden md:block" />

        <div className="text-center md:text-right">
          <span className="ios-label mb-1">Safety Score</span>
          <div className="flex items-center gap-3">
            <span className="text-[42px] font-black tracking-tighter leading-none" style={{ color: verdict.color }}>
              {score}%
            </span>
            <span 
              className="text-[12px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest border"
              style={{ borderColor: `${verdict.color}44`, color: verdict.color, backgroundColor: `${verdict.color}11` }}
            >
              {verdict.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
