import React from "react";

/**
 * SectionBar — Bento Glass Style
 * A single risk line item.
 */
export default function SectionBar({ item }) {
  const sevColor = 
    item.severity === "high"   ? "#ff3b30" : 
    item.severity === "medium" ? "#ff9500" : "#007aff";

  return (
    <div className="group relative pl-4 border-l-2 transition-all hover:border-white/40" style={{ borderLeftColor: sevColor }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[13px] font-bold mb-1" style={{ color: sevColor }}>
            "{item.text}"
          </div>
          <div className="text-[14px] text-ink-secondary leading-relaxed font-medium">
            {item.reason}
          </div>
        </div>
        
        <div className="shrink-0">
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.05] text-ink-muted">
            {item.type.replace("_", " ")}
          </span>
        </div>
      </div>
    </div>
  );
}
