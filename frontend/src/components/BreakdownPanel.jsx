import { CheckCircle, Search } from "lucide-react";
import SectionBar from "./SectionBar.jsx";
import { SECTION_ORDER } from "../engine/analyzer.js";

export default function BreakdownPanel({ result }) {
  if (!result) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-[16px] p-6 h-full flex items-center justify-center">
        <div className="text-center text-ink-faint">
          <Search size={32} className="mx-auto mb-3 opacity-30" />
          <div className="text-[14px]">Run analysis to see risk breakdown</div>
        </div>
      </div>
    );
  }

  if (result.isEmpty || result.matches.length === 0) {
    return (
      <div className="bg-surface-card border border-surface-border rounded-[16px] p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={36} className="mx-auto mb-3" style={{ color: "#22c55e" }} />
          <div className="text-[15px] font-medium text-ink-primary mb-1">No risks detected</div>
          <div className="text-[13px] text-ink-muted">This document appears clean</div>
        </div>
      </div>
    );
  }

  const sections = SECTION_ORDER.filter(k => result.byType[k]?.length > 0);

  return (
    <div className="bg-surface-card border border-surface-border rounded-[16px] p-6">
      <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted mb-5">
        Risk Breakdown
      </div>

      <div className="flex flex-col gap-5 stagger-children">
        {sections.map((typeKey, i) => (
          <div key={typeKey}>
            <SectionBar
              typeKey={typeKey}
              items={result.byType[typeKey]}
              animDelay={i * 70}
            />
            {i < sections.length - 1 && (
              <div className="border-t border-surface-border mt-5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
