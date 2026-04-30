import React from "react";
import { AlertCircle, DollarSign, DoorOpen, ChevronRight } from "lucide-react";

/**
 * SummaryCard — "Bento Glass" iPhone Style
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
      color: "#ff9500" // iOS Orange
    },
    { 
      label: "The Exit Plan", 
      value: highlights.exitPlan, 
      icon: DoorOpen, 
      color: "#007aff" // iOS Blue
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {items.map((item, idx) => (
        <div key={idx} className="glass-card animate-bento" style={{ animationDelay: `${idx * 0.1}s` }}>
          <div className="bento-inner">
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-[14px] flex items-center justify-center"
                style={{ backgroundColor: `${item.color}22` }}
              >
                <item.icon size={20} style={{ color: item.color }} />
              </div>
              <ChevronRight size={16} className="text-ink-muted" />
            </div>
            
            <span className="ios-label mb-2">{item.label}</span>
            <p className="text-[17px] font-semibold text-ink-primary leading-tight">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
