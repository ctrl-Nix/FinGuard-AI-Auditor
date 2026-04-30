import React from "react";
import { ShieldCheck, Zap, Globe, ArrowRight, MousePointer2, Smartphone, ShieldAlert, BarChart3, Lock, Cpu, CheckCircle2 } from "lucide-react";

/**
 * WelcomeView — Enterprise-Grade Landing Page
 * Designed with a high-stakes, corporate businessman's perspective.
 * Focuses on Risk Mitigation, Compliance, and Technical Authority.
 */
export default function WelcomeView({ onEnter }) {
  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Manrope'] selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-10 text-center border-b border-white/5">
        {/* Atmospheric Glows */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px]" />
        </div>

        <div className="max-w-[1200px] relative z-10 animate-finvera">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-600/10 border border-blue-600/20 mb-12">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.4em] text-blue-400">Institutional Risk Management Protocol</span>
          </div>
          
          <h1 className="text-[72px] md:text-[120px] font-[800] tracking-[-0.05em] leading-[0.82] mb-12">
            Asset Protection. <br />
            <span className="text-blue-600">Redefined.</span>
          </h1>
          
          <p className="text-[20px] md:text-[26px] text-slate-400 font-medium max-w-[800px] mx-auto leading-relaxed mb-16 tracking-tight">
            Traditional auditing is slow. Human error is inevitable. <br className="hidden md:block" />
            FinGuard AI eliminates the margin of error, delivering professional-grade forensics at scale.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={onEnter}
              className="finvera-btn-primary !px-14 !py-7 !text-[20px] flex items-center gap-4 shadow-[0_20px_50px_rgba(37,99,235,0.3)]"
            >
              Initialize Audit Engine
              <ArrowRight size={26} />
            </button>
            <button className="finvera-btn-secondary !px-14 !py-7 !text-[20px] hover:bg-white/10">
              View Network Status
            </button>
          </div>
        </div>
      </section>

      {/* 2. STATS / TRUST BAR */}
      <section className="py-24 border-b border-white/5 bg-slate-950/20 relative z-10">
        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div>
            <div className="text-[42px] font-black tracking-tighter mb-1">$4.2B+</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Protected Assets</div>
          </div>
          <div>
            <div className="text-[42px] font-black tracking-tighter mb-1">0.005s</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Avg. Analysis Speed</div>
          </div>
          <div>
            <div className="text-[42px] font-black tracking-tighter mb-1">100%</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Local Privacy</div>
          </div>
          <div>
            <div className="text-[42px] font-black tracking-tighter mb-1">50K+</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em]">Daily Fraud Signals</div>
          </div>
        </div>
      </section>

      {/* 3. CORE VALUE PROPOSITION */}
      <section className="py-40 relative z-10">
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="flex-1 space-y-10">
              <span className="text-[12px] font-black text-blue-500 uppercase tracking-[0.5em]">The Objective</span>
              <h2 className="text-[54px] md:text-[72px] font-black tracking-tighter leading-[0.9]">
                Mitigate Risk. <br/>
                Maximize Compliance.
              </h2>
              <p className="text-[20px] text-slate-400 leading-relaxed font-medium">
                In a digital-first economy, the speed of fraud outpaces traditional security. FinGuard provides an instantaneous forensic barrier that operates within your local environment—ensuring data sovereignty while delivering deep-layered analysis.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                 {[
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Zero-Data Exposure", text: "Analyses remain on-device." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Regulatory Alignment", text: "Compliant with global standards." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Pattern Recognition", text: "Detects evolving scam signals." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Optical Forensics", text: "Physical document scanning." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4">
                     <div className="shrink-0 mt-1">{item.icon}</div>
                     <div>
                       <div className="font-bold text-[17px]">{item.title}</div>
                       <div className="text-[14px] text-slate-500">{item.text}</div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-[600px]">
              <div className="finvera-card !p-1 relative group overflow-hidden">
                <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="bg-[#020617] rounded-[36px] p-10 space-y-8">
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
                     </div>
                     <span className="text-[10px] mono-data text-slate-600">AUDIT_LOG_v3.0.42</span>
                  </div>
                  <div className="space-y-4 font-mono text-[13px] text-blue-400/60 leading-relaxed">
                    <p>&gt; Initializing neural scan sequence...</p>
                    <p>&gt; Analyzing metadata headers [HASH: 4x9f2...]</p>
                    <p className="text-red-400">&gt; WARNING: High-risk clause detected in Para 14.2</p>
                    <p>&gt; Scoring heuristic weights: 0.942 risk factor</p>
                    <p className="text-emerald-400">&gt; Security Barrier Status: ENGAGED</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-600 w-[85%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TECHNICAL AUTHORITY / BENTO GRID */}
      <section className="py-40 bg-slate-950/20 border-y border-white/5 relative z-10">
        <div className="max-w-[1400px] mx-auto px-10 text-center mb-24">
          <h2 className="text-[54px] md:text-[84px] font-black tracking-tighter leading-none mb-8">
            Advanced Intelligence. <br/> 
            No Complexity.
          </h2>
          <p className="text-[20px] text-slate-400 max-w-[700px] mx-auto leading-relaxed">
            We've abstracted the world's most complex forensic models into a seamless, high-velocity interface designed for decision makers.
          </p>
        </div>

        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { icon: <Cpu />, title: "Neural Engine", desc: "Proprietary models trained on millions of fraudulent financial documents and scam reports." },
            { icon: <Lock />, title: "Sovereign Privacy", desc: "Zero-knowledge processing. Your proprietary documents never leave your secure perimeter." },
            { icon: <BarChart3 />, title: "Risk Quantization", desc: "Complex legal risks converted into actionable, weighted scores for rapid decision making." },
            { icon: <Smartphone />, title: "Optical Capture", desc: "Scan physical contracts with precision-grade OCR that ignores background noise." },
            { icon: <Globe />, title: "Signal Network", desc: "Live-synced intelligence from a global community of forensic auditors and fraud hunters." },
            { icon: <Zap />, title: "Instant Verification", desc: "Sub-millisecond verification times, allowing for real-time audit during active negotiations." }
          ].map((feature, i) => (
            <div key={i} className="finvera-card group">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-10 border border-blue-600/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-[26px] font-[800] mb-4 tracking-tighter uppercase">{feature.title}</h3>
              <p className="text-[16px] text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-60 relative z-10 text-center">
        <div className="max-w-[1000px] mx-auto px-10 space-y-16">
          <h2 className="text-[64px] md:text-[110px] font-black tracking-tighter leading-[0.85]">
            Secure your <br/>
            business today.
          </h2>
          <button 
            onClick={onEnter}
            className="finvera-btn-primary !px-20 !py-8 !text-[24px] shadow-[0_30px_80px_rgba(37,99,235,0.4)]"
          >
            Launch Auditor Protocol
          </button>
          
          <div className="pt-24 flex items-center justify-center gap-16 text-[11px] font-bold text-slate-600 uppercase tracking-[0.4em]">
            <span>Enterprise Grade</span>
            <span>GDPR Compliant</span>
            <span>End-to-End Security</span>
          </div>
        </div>
      </section>

    </div>
  );
}
