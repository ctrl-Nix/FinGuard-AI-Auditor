import React from "react";
import { ShieldCheck, Zap, Globe, ArrowRight, MousePointer2, Smartphone } from "lucide-react";

/**
 * WelcomeView — Cinematic Landing Page
 * High-impact introduction to FinGuard 3.0.
 */
export default function WelcomeView({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative overflow-hidden bg-[#020305]">
      {/* Background Aura */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[160px]" />
      </div>

      {/* Hero */}
      <div className="max-w-[1000px] mb-24 relative z-10 animate-in fade-in zoom-in duration-1000">
        <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-blue-500/5 border border-blue-500/10 mb-10">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-400/80">Intelligence Protocol 3.0</span>
        </div>
        
        <h1 className="text-[64px] md:text-[100px] font-black tracking-tighter leading-[0.85] mb-10 glow-text">
          Audit Everything. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 italic">Trust Nothing.</span>
        </h1>
        
        <p className="text-[19px] md:text-[23px] text-white/40 font-medium max-w-[700px] mx-auto leading-relaxed mb-14 tracking-tight">
          The ultimate forensic barrier between you and financial fraud. <br className="hidden md:block" />
          Professional-grade intelligence for the modern citizen.
        </p>

        <button 
          onClick={onEnter}
          className="btn-primary"
        >
          <span className="flex items-center gap-4 px-4">
             Initialize Audit Engine
             <ArrowRight size={20} />
          </span>
        </button>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] w-full relative z-10">
        {[
          { icon: <MousePointer2 />, title: "Deep Forensics", desc: "Identify hidden fees and legal traps buried in fine print with neural scanning.", color: "text-blue-400", bg: "bg-blue-400/5" },
          { icon: <Smartphone />, title: "Capture & Scan", desc: "Instantly digitize and audit paper contracts using advanced OCR tech.", color: "text-purple-400", bg: "bg-purple-400/5" },
          { icon: <Globe />, title: "Intel Vault", desc: "Access the global database of reported scams and fraudulent patterns.", color: "text-emerald-400", bg: "bg-emerald-400/5" }
        ].map((f, i) => (
          <div key={i} className="cyber-card p-10 text-left hover:scale-[1.02]">
            <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-8 border border-white/5`}>
              <div className={f.color}>{f.icon}</div>
            </div>
            <h3 className="text-[22px] font-black mb-3 tracking-tighter glow-text uppercase">{f.title}</h3>
            <p className="text-[15px] text-white/30 leading-relaxed font-medium">
              {f.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-24 flex items-center gap-10 text-[10px] font-black text-white/10 uppercase tracking-[0.3em] relative z-10">
        <span>Sovereign Security</span>
        <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
        <span>End-to-End Privacy</span>
        <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
        <span>Open Intelligence</span>
      </div>
    </div>
    </div>
  );
}
