import React from "react";
import { AlertCircle, DollarSign, DoorOpen, ChevronRight } from "lucide-react";

/**
 * SummaryCard — "What's the Catch?"
 * A high-impact, simplified summary for the general public.
 */
export default function SummaryCard({ highlights, verdict }) {
  if (!highlights) return null;

  const items = [
    { 
      label: "The Main Risk", 
      value: highlights.topRisk, 
      icon: AlertCircle, 
      color: verdict.color 
    },
    { 
      label: "The Hidden Cost", 
      value: highlights.hiddenCost, 
      icon: DollarSign, 
      color: "#f59e0b" 
    },
    { 
      label: "The Exit Plan", 
      value: highlights.exitPlan, 
      icon: DoorOpen, 
      color: "#3b82f6" 
    },
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-[16px] overflow-hidden animate-slide-up">
      <div className="bg-surface-deep px-5 py-3 border-b border-surface-border flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[1.2px] uppercase text-ink-muted">
          Quick Audit: What's the Catch?
        </span>
        <div className="flex items-center gap-1 text-[10px] text-ink-faint uppercase font-bold">
          Summary <ChevronRight size={10} />
        </div>
      </div>
      
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div 
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${item.color}15` }}
              >
                <item.icon size={14} style={{ color: item.color }} />
              </div>
              <span className="text-[12px] font-bold text-ink-secondary uppercase tracking-tight">
                {item.label}
              </span>
            </div>
            <p className="text-[14px] leading-relaxed text-ink-primary font-medium">
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
