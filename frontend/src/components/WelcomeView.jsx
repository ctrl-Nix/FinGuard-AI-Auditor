import React from "react";
import { ShieldCheck, Zap, Globe, ArrowRight, MousePointer2, Smartphone } from "lucide-react";

/**
 * WelcomeView — Cinematic Landing Page
 * High-impact introduction to FinGuard 3.0.
 */
export default function WelcomeView({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 text-center relative overflow-hidden bg-[#020617] text-white font-['Manrope']">
      {/* Finvera Background Glows */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px]" />
      </div>

      {/* Hero Section */}
      <div className="max-w-[1100px] mb-28 relative z-10 animate-finvera">
        <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-600/10 border border-blue-600/20 mb-12">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[12px] font-extrabold uppercase tracking-[0.3em] text-blue-400">Institutional Grade Auditing</span>
        </div>
        
        <h1 className="text-[72px] md:text-[110px] font-[800] tracking-[-0.05em] leading-[0.85] mb-12">
          Audit everything. <br />
          <span className="text-blue-600 italic">Trust nothing.</span>
        </h1>
        
        <p className="text-[20px] md:text-[24px] text-slate-400 font-medium max-w-[700px] mx-auto leading-relaxed mb-16 tracking-tight">
          Secure your financial future with professional-grade AI forensics. <br className="hidden md:block" />
          Detected scams, hidden fees, and legal traps in seconds.
        </p>

        <button 
          onClick={onEnter}
          className="finvera-btn-primary !px-12 !py-6 !text-[18px] flex items-center gap-4 mx-auto"
        >
          Initialize Protocol
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Finvera Bento Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[1200px] w-full relative z-10">
        {[
          { icon: <MousePointer2 size={32} />, title: "Deep Scan", desc: "Identify architectural vulnerabilities and hidden financial clauses with neural audit tech.", color: "text-blue-500", bg: "bg-blue-600/5" },
          { icon: <Smartphone size={32} />, title: "Snap Forensic", desc: "Digitize and analyze any paper contract instantly with zero-latency OCR processing.", color: "text-blue-400", bg: "bg-sky-500/5" },
          { icon: <Globe size={32} />, title: "Global Vault", desc: "Real-time sync with the collective security intelligence of the global community.", color: "text-emerald-400", bg: "bg-emerald-500/5" }
        ].map((f, i) => (
          <div key={i} className="finvera-card !p-12 text-left hover:scale-[1.02] hover:bg-slate-900/60 transition-all cursor-default">
            <div className={`w-16 h-16 rounded-[24px] ${f.bg} flex items-center justify-center mb-10 border border-white/5`}>
              <div className={f.color}>{f.icon}</div>
            </div>
            <h3 className="text-[26px] font-[800] mb-4 tracking-tighter uppercase">{f.title}</h3>
            <p className="text-[16px] text-slate-400 leading-relaxed font-medium">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-32 flex items-center gap-12 text-[11px] font-bold text-slate-600 uppercase tracking-[0.4em] relative z-10">
        <span>Sovereign Security</span>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        <span>End-to-End Privacy</span>
        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
        <span>Zero-Trust Protocol</span>
      </div>
    </div>
    </div>
    </div >
  );
}
