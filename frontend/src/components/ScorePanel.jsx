import React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

/**
 * ScorePanel — Bento Glass Style
 * iPhone-inspired circular risk meter.
 */
export default function ScorePanel({ result }) {
  if (!result) return null;

  const score = result.score || 0;
  const color = result.verdict?.color || "#007aff";
  
  // Calculate SVG dash
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="glass-card animate-bento">
      <div className="bento-inner items-center justify-center py-10">
        <span className="ios-label mb-8">Security Index</span>
        
        <div className="relative flex items-center justify-center">
          {/* Background Ring */}
          <svg className="w-48 h-48 transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-white/[0.05]"
            />
            {/* Progress Ring */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              stroke={color}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${color}66)` }}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute flex flex-col items-center">
            <span className="text-[48px] font-black tracking-tighter leading-none mb-1">
              {score}
            </span>
            <span className="text-[12px] font-bold text-ink-muted uppercase tracking-widest">
              Percent
            </span>
          </div>
        </div>

        <div className="mt-10 flex items-center gap-3 bg-white/[0.04] px-4 py-2 rounded-full border border-white/[0.05]">
          {score < 30 ? (
            <ShieldCheck size={16} className="text-risk-green" />
          ) : score < 70 ? (
            <Shield size={16} className="text-risk-amber" />
          ) : (
            <ShieldAlert size={16} className="text-risk-red" />
          )}
          <span className="text-[13px] font-bold uppercase tracking-tight">
            {result.verdict?.label || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}
