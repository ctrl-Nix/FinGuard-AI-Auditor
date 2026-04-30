import { useEffect, useRef, useState } from "react";
import {
  DollarSign, AlertTriangle, RefreshCcw, Zap,
  Shield, AlertOctagon
} from "lucide-react";
import { SECTION_META, SEV_COLOR } from "../engine/analyzer.js";

const ICONS = { DollarSign, AlertTriangle, RefreshCcw, Zap, Shield, AlertOctagon };

function AnimatedBar({ target, color }) {
  const [width, setWidth] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    const t0 = performance.now();
    const dur = 1200;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      // spring ease
      const ease = 1 - Math.pow(1 - p, 3) * (p < 0.7 ? 1.1 : 1);
      setWidth(Math.min(target, target * Math.max(0, ease)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    // small delay per section for stagger
    setTimeout(() => { raf.current = requestAnimationFrame(tick); }, 80);
    return () => cancelAnimationFrame(raf.current);
  }, [target, color]);

  return (
    <div className="h-[5px] bg-surface-hover rounded-full overflow-hidden mb-3">
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: color, transition: "background 0.4s ease" }}
      />
    </div>
  );
}

function FindingCard({ item }) {
  const sevColor = SEV_COLOR[item.severity] || "#3b82f6";
  return (
    <div className="flex items-start gap-3 bg-surface-deep border border-surface-border rounded-[10px] p-3 hover:border-surface-hover transition-colors duration-150 group">
      {/* severity dot */}
      <div
        className="w-1.5 h-1.5 rounded-full mt-[6px] shrink-0"
        style={{ background: sevColor }}
      />
      {/* body */}
      <div className="flex-1 min-w-0">
        <div
          className="font-mono text-[12px] font-medium mb-0.5 truncate"
          style={{ color: sevColor }}
        >
          "{item.text}"
        </div>
        <div className="text-[12px] text-ink-muted leading-relaxed">
          {item.reason}
        </div>
      </div>
      {/* severity badge */}
      <div
        className="shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-[6px] capitalize"
        style={{
          background: `${sevColor}20`,
          color: sevColor,
        }}
      >
        {item.severity}
      </div>
    </div>
  );
}

export default function SectionBar({ typeKey, items, animDelay = 0 }) {
  const meta = SECTION_META[typeKey] || { label: typeKey, icon: "Shield", color: "#3b82f6", colorDim: "rgba(59,130,246,0.12)" };
  const Icon = ICONS[meta.icon] || Shield;

  const hasHigh = items.some(i => i.severity === "high");
  const barTarget = Math.min(94, items.length * 20 + (hasHigh ? 22 : 0));
  const totalPts  = items.reduce((s, i) => s + i.pts, 0);

  return (
    <div
      className="animate-slide-up"
      style={{ animationDelay: `${animDelay}ms`, animationFillMode: "both", opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: meta.colorDim }}
          >
            <Icon size={14} style={{ color: meta.color }} />
          </div>
          <span className="text-[13px] font-medium text-ink-secondary">{meta.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: meta.colorDim, color: meta.color }}
          >
            {items.length} flag{items.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono text-[11px] text-ink-muted">+{totalPts}pts</span>
        </div>
      </div>

      {/* Progress bar */}
      <AnimatedBar target={barTarget} color={meta.color} />

      {/* Finding cards */}
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <FindingCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
}
