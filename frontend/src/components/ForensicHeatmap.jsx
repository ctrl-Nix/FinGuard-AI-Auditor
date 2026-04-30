import React from "react";

/**
 * ForensicHeatmap — High-performance text highlighting component.
 * Renders the original text with overlaps from the engine's match data.
 */
export default function ForensicHeatmap({ text, matches = [] }) {
  if (!text) return null;

  // Sort matches by start position
  const sortedMatches = [...matches].sort((a, b) => a.start - b.start);

  // Filter out overlapping matches (keep the longest or first)
  const nonOverlapping = [];
  let lastEnd = -1;
  for (const m of sortedMatches) {
    if (m.start >= lastEnd) {
      nonOverlapping.push(m);
      lastEnd = m.end;
    }
  }

  // Segment the text into plain and highlighted chunks
  const segments = [];
  let currentPos = 0;

  nonOverlapping.forEach((match, idx) => {
    // Add plain text before match
    if (match.start > currentPos) {
      segments.push({ 
        type: "plain", 
        content: text.slice(currentPos, match.start) 
      });
    }

    // Add highlighted match
    segments.push({
      type: "highlight",
      content: text.slice(match.start, match.end),
      severity: match.severity,
      reason: match.reason
    });

    currentPos = match.end;
  });

  // Add remaining plain text
  if (currentPos < text.length) {
    segments.push({ 
      type: "plain", 
      content: text.slice(currentPos) 
    });
  }

  return (
    <div className="bg-surface-deep border border-surface-border rounded-[12px] p-4 font-mono text-[13px] leading-[1.8] text-ink-secondary whitespace-pre-wrap break-words overflow-auto max-h-[400px]">
      {segments.map((seg, idx) => {
        if (seg.type === "plain") {
          return <span key={idx}>{seg.content}</span>;
        }

        const colorClass = 
          seg.severity === "high"   ? "bg-risk-red/20 text-risk-red border-b-2 border-risk-red" :
          seg.severity === "medium" ? "bg-risk-orange/20 text-risk-orange border-b-2 border-risk-orange" :
                                      "bg-risk-blue/20 text-risk-blue border-b-2 border-risk-blue";

        return (
          <span 
            key={idx} 
            className={`${colorClass} px-0.5 rounded-sm cursor-help transition-all hover:brightness-110 group relative`}
            title={seg.reason}
          >
            {seg.content}
            {/* Tooltip */}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-ink-primary text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
              {seg.reason}
            </span>
          </span>
        );
      })}
    </div>
  );
}
