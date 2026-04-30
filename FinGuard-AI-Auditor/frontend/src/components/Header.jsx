import { Shield } from "lucide-react";
import APIStatusBadge from "./APIStatusBadge.jsx";

export default function Header() {
  return (
    <header className="flex items-center justify-between mb-8 max-w-[1100px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <span className="text-[16px] font-semibold text-ink-primary tracking-tight">FinGuard</span>
          <span className="text-[13px] text-ink-muted ml-1.5 font-mono">3.0</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <APIStatusBadge />
        <div className="flex items-center gap-1.5 bg-[rgba(34,197,94,0.1)] border border-[rgba(34,197,94,0.2)] text-[11px] font-medium text-[#22c55e] px-3 py-1.5 rounded-full font-mono tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse-slow" />
          Live
        </div>
      </div>
    </header>
  );
}
