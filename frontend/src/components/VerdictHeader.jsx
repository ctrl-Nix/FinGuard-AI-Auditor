import React from "react";
import { AlertOctagon, AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";

/**
 * VerdictHeader — "Traffic Light" System
 * Highly visible, unmissable risk indicator for the general public.
 */
export default function VerdictHeader({ verdict, score }) {
  if (!verdict || verdict.label === "Awaiting input") return null;

  const isScam = verdict.label.toUpperCase() === "CRITICAL" || verdict.label.toUpperCase() === "SCAM";
  const isHigh = verdict.label.toUpperCase() === "HIGH RISK";
  const isMed  = verdict.label.toUpperCase() === "MEDIUM RISK";
  
  // Icon and public-friendly message
  let Icon = CheckCircle;
  let message = "This looks safe to proceed.";
  let subMessage = "No major traps found in this scan.";

  if (isScam || isHigh) {
    Icon = ShieldAlert;
    message = "STOP — HIGH DANGER DETECTED!";
    subMessage = "This document or message contains serious financial traps.";
  } else if (isMed) {
    Icon = AlertTriangle;
    message = "PROCEED WITH CAUTION";
    subMessage = "We found some tricky clauses that could cost you money.";
  }

  return (
    <div 
      className="rounded-[16px] p-1 animate-pulse-slow mb-4"
      style={{ background: `linear-gradient(90deg, ${verdict.color}44, transparent)` }}
    >
      <div 
        className="bg-surface-card border rounded-[15px] p-5 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderColor: `${verdict.color}33` }}
      >
        <div className="flex items-center gap-4 text-center md:text-left">
          <div 
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
            style={{ background: verdict.color, boxShadow: `0 0 20px ${verdict.color}44` }}
          >
            <Icon size={32} className="text-white" />
          </div>
          <div>
            <h2 className="text-[20px] md:text-[24px] font-black tracking-tight leading-none mb-1" style={{ color: verdict.color }}>
              {message}
            </h2>
            <p className="text-[14px] text-ink-muted font-medium">
              {subMessage}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end">
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-ink-muted mb-1">
            Global Risk Level
          </span>
          <div className="flex items-center gap-2">
            <div className="text-[32px] font-black font-mono leading-none" style={{ color: verdict.color }}>
              {score}%
            </div>
            <div 
              className="text-[12px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{ background: `${verdict.color}20`, color: verdict.color }}
            >
              {verdict.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
