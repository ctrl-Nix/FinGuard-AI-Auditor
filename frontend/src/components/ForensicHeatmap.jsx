import React from "react";

/**
 * ForensicHeatmap — Bento Glass Style
 * iPhone-inspired text highlighting with glowing markers.
 */
export default function ForensicHeatmap({ text, matches = [] }) {
  if (!text) return null;

  // Sort matches by start index to avoid overlapping issues
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  const elements = [];
  let lastIndex = 0;

  sortedMatches.forEach((match, i) => {
    // Add plain text before match
    if (match.start > lastIndex) {
      elements.push(text.slice(lastIndex, match.start));
    }

    const color = 
      match.severity === "high"   ? "#ff3b30" : 
      match.severity === "medium" ? "#ff9500" : "#007aff";

    // Add highlighted text
    elements.push(
      <span
        key={i}
        className="relative group cursor-help inline-block px-0.5 rounded-[4px] transition-all"
        style={{ 
          backgroundColor: `${color}22`, 
          borderBottom: `2px solid ${color}`,
          color: "#fff"
        }}
      >
        {text.slice(match.start, match.end)}
        
        {/* iOS Style Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[200px] p-3 glass-card bg-[#1c1c1e] text-[12px] font-medium leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[60] shadow-2xl">
          <div className="ios-label !mb-1 !text-white/40">Risk Signal</div>
          {match.reason}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#1c1c1e]" />
        </div>
      </span>
    );

    lastIndex = match.end;
  });

  // Add remaining plain text
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[22px] p-6 font-serif text-[18px] leading-[1.8] text-ink-secondary/90 whitespace-pre-wrap select-text max-h-[500px] overflow-auto custom-scrollbar">
      {elements}
    </div>
  );
}
