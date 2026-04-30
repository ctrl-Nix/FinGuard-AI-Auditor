import React from "react";
import SectionBar from "./SectionBar.jsx";

/**
 * BreakdownPanel — Bento Glass Style
 * Modular risk breakdown.
 */
export default function BreakdownPanel({ result }) {
  if (!result) return null;

  const matches = result.matches || [];
  const high   = matches.filter(m => m.severity === "high");
  const medium = matches.filter(m => m.severity === "medium");
  const low    = matches.filter(m => m.severity === "low");

  return (
    <div className="glass-card animate-bento">
      <div className="bento-inner">
        <span className="ios-label">Evidence Breakdown</span>
        
        <div className="space-y-8">
          {high.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-risk-red shadow-[0_0_8px_rgba(255,59,48,0.6)]" />
                <span className="text-[13px] font-bold uppercase tracking-widest text-risk-red">High Severity</span>
              </div>
              <div className="space-y-4">
                {high.map((item, i) => <SectionBar key={i} item={item} />)}
              </div>
            </div>
          )}

          {medium.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-risk-amber shadow-[0_0_8px_rgba(255,149,0,0.6)]" />
                <span className="text-[13px] font-bold uppercase tracking-widest text-risk-amber">Warning Signs</span>
              </div>
              <div className="space-y-4">
                {medium.map((item, i) => <SectionBar key={i} item={item} />)}
              </div>
            </div>
          )}

          {low.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-risk-blue shadow-[0_0_8px_rgba(0,122,255,0.6)]" />
                <span className="text-[13px] font-bold uppercase tracking-widest text-risk-blue">Minor Notes</span>
              </div>
              <div className="space-y-4">
                {low.map((item, i) => <SectionBar key={i} item={item} />)}
              </div>
            </div>
          )}

          {matches.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-ink-muted text-[14px]">No specific patterns detected in this scan.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
