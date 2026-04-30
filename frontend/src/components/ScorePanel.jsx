import ScoreMeter from "./ScoreMeter.jsx";
import StatGrid from "./StatGrid.jsx";
import { Shield } from "lucide-react";

const LEGEND = [
  { color: "#ef4444", label: "High",   desc: "Immediate action needed"    },
  { color: "#f59e0b", label: "Medium", desc: "Review carefully"           },
  { color: "#3b82f6", label: "Low",    desc: "Note for awareness"         },
];

export default function ScorePanel({ result }) {
  const score          = result?.score ?? 0;
  const color          = result?.meterColor ?? "#22c55e";
  const verdict        = result?.verdict ?? { label: "Awaiting input", color: "#4a5060", bg: "rgba(74,80,96,0.12)", border: "#2a2f3e" };
  const severityCounts = result?.severityCounts ?? { high: 0, medium: 0, low: 0 };

  return (
    <div className="flex flex-col gap-3">
      {/* Score card */}
      <div className="bg-surface-card border border-surface-border rounded-[16px] overflow-hidden">
        <div className="p-6 pb-5">
          <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted mb-5">
            Risk Score
          </div>
          <ScoreMeter score={score} color={color} verdict={verdict} />
        </div>
        <StatGrid
          high={severityCounts.high}
          medium={severityCounts.medium}
          low={severityCounts.low}
        />
      </div>

      {/* Legend card */}
      <div className="bg-surface-card border border-surface-border rounded-[16px] p-5">
        <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted mb-4">
          Severity Key
        </div>
        <div className="flex flex-col gap-3">
          {LEGEND.map(l => (
            <div key={l.label} className="flex items-center gap-3 text-[13px]">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />
              <span className="font-medium text-ink-secondary w-14">{l.label}</span>
              <span className="text-[12px] text-ink-muted">{l.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Total flags */}
      {result && !result.isEmpty && (
        <>
          <div
            className="bg-surface-card border border-surface-border rounded-[16px] p-4 animate-fade-in"
            key={result.score}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px] text-ink-muted">
                <Shield size={14} />
                Total flags
              </div>
              <span className="font-mono text-[20px] font-medium text-ink-primary">
                {result.matches.length}
              </span>
            </div>
            <div className="mt-3 h-[3px] bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width:      `${Math.min(100, result.matches.length * 8)}%`,
                  background: color,
                }}
              />
            </div>
          </div>

          <button
            onClick={() => {
              const pattern = prompt("Enter the suspicious word or domain to flag for the community:");
              const reason = prompt("Why is this suspicious?");
              if (pattern && reason) {
                fetch(`${import.meta.env.VITE_API_URL || ""}/api/v1/panic/report`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ pattern, reason }),
                }).then(() => alert("Thank you! This pattern has been added to Global Intelligence."));
              }
            }}
            className="w-full mt-2 py-3 bg-surface-hover hover:bg-[#20242e] border border-surface-border rounded-[12px] text-[11px] font-bold tracking-[1px] uppercase text-ink-muted hover:text-risk-blue transition-all"
          >
            Report as New Scam
          </button>
        </>
      )}
    </div>
  );
}
