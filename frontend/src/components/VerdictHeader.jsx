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
    <div className="cyber-card animate-in zoom-in duration-500 overflow-hidden mb-8 relative">
      {/* Dynamic Background Glow based on risk */}
      <div 
        className="absolute inset-0 opacity-10 blur-[100px]"
        style={{ backgroundColor: verdict.color }}
      />
      
      <div className="flex flex-col md:flex-row items-center gap-10 p-10 relative z-10">
        <div 
          className="w-20 h-20 rounded-[28px] flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10"
          style={{ background: `linear-gradient(135deg, ${verdict.color}, ${verdict.color}aa)` }}
        >
          <Icon size={42} className="text-white" strokeWidth={2.5} />
        </div>
        
        <div className="flex-1 text-center md:text-left space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 block">Audit Status</span>
          <h2 className="text-[36px] font-black tracking-tighter leading-none glow-text uppercase">
            {message}
          </h2>
          <p className="text-[17px] text-white/50 font-medium tracking-tight">
            {subMessage}
          </p>
        </div>

        <div className="h-16 w-px bg-white/5 hidden md:block" />

        <div className="text-center md:text-right space-y-1">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 block">Risk Confidence</span>
          <div className="flex items-center gap-6 justify-center md:justify-end">
            <span className="text-[54px] font-black tracking-tighter leading-none mono-data" style={{ color: verdict.color }}>
              {score}
              <span className="text-[20px] opacity-40 ml-1">%</span>
            </span>
            <span 
              className="status-tag"
              style={{ borderColor: `${verdict.color}44`, color: verdict.color, backgroundColor: `${verdict.color}08` }}
            >
              {verdict.label}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
