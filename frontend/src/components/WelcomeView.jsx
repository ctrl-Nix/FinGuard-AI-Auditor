import React from "react";
import { ShieldCheck, Zap, Globe, ArrowRight, MousePointer2, Smartphone, BarChart3, Lock, Cpu, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

/**
 * WelcomeView — Realistic Professional Landing Page
 * Features scroll-reveal animations and a horizontal ticker.
 * No fake data.
 */
export default function WelcomeView({ onEnter }) {
  const tickerWords = [
    "NEURAL ENGINE", "ZERO DATA EXPOSURE", "FORENSIC ANALYTICS", 
    "PRIVATE AUDIT", "COMPLIANCE SECURE", "REAL-TIME SCAN",
    "SOVEREIGN SECURITY", "INSTANT VERIFICATION"
  ];

  const sectionVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Manrope'] selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-10 text-center">
        {/* Atmospheric Glows */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-blue-600/10 rounded-full blur-[180px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/5 rounded-full blur-[160px]" />
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="max-w-[1200px] relative z-10"
        >
          <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-blue-600/10 border border-blue-600/20 mb-12">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[12px] font-extrabold uppercase tracking-[0.4em] text-blue-400">Advanced Audit Protocol Live</span>
          </div>
          
          <h1 className="text-[72px] md:text-[120px] font-[800] tracking-[-0.05em] leading-[0.82] mb-12">
            Audit Everything. <br />
            <span className="text-blue-600 italic">Trust Nothing.</span>
          </h1>
          
          <p className="text-[20px] md:text-[26px] text-slate-400 font-medium max-w-[800px] mx-auto leading-relaxed mb-16 tracking-tight">
            Stop scams and legal traps before they manifest. <br className="hidden md:block" />
            Institutional-grade forensics, decentralized and private.
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
              Protocol Specs
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. HORIZONTAL TICKER LOOP */}
      <div className="py-10 border-y border-white/5 bg-slate-950/40 relative z-10 overflow-hidden whitespace-nowrap">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          {[...tickerWords, ...tickerWords].map((word, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-12">
              <span className="text-[14px] font-black tracking-[0.4em] text-white/40 uppercase">{word}</span>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
            </span>
          ))}
        </motion.div>
      </div>

      {/* 3. CORE VALUE PROPOSITION */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={sectionVariants}
        className="py-40 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="flex-1 space-y-10">
              <span className="text-[12px] font-black text-blue-500 uppercase tracking-[0.5em]">The Objective</span>
              <h2 className="text-[54px] md:text-[72px] font-black tracking-tighter leading-[0.9]">
                Zero-Trust <br/>
                Digital Forensics.
              </h2>
              <p className="text-[20px] text-slate-400 leading-relaxed font-medium">
                In a digital economy, human auditing is a bottleneck. FinGuard provides an instantaneous forensic barrier that operates entirely on your device—ensuring your data never reaches our servers.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                 {[
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Data Sovereignty", text: "100% on-device analysis." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Heuristic Defense", text: "Multi-layered risk scoring." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Pattern Engine", text: "Real-time scam detection." },
                   { icon: <CheckCircle2 className="text-blue-500" />, title: "Optical Processing", text: "OCR-driven contract audit." }
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
                <div className="bg-[#020617] rounded-[36px] p-10 space-y-8">
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></div>
                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/40"></div>
                     </div>
                     <span className="text-[10px] mono-data text-slate-600 uppercase tracking-widest">Protocol_Live</span>
                  </div>
                  <div className="space-y-4 font-mono text-[13px] text-blue-400/60 leading-relaxed">
                    <p>&gt; Booting heuristic models...</p>
                    <p>&gt; Scanning for structural anomalies...</p>
                    <p className="text-amber-400">&gt; ALERT: Potential manipulation detected</p>
                    <p>&gt; Running scoring sequence...</p>
                    <p className="text-emerald-400">&gt; STATUS: Analysis Complete</p>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-full bg-blue-600"
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. TECHNICAL FEATURES / BENTO GRID */}
      <section className="py-40 bg-slate-950/20 border-y border-white/5 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="max-w-[1400px] mx-auto px-10 text-center mb-24"
        >
          <h2 className="text-[54px] md:text-[84px] font-black tracking-tighter leading-none mb-8 uppercase">
            Technical <br/> 
            Superiority.
          </h2>
          <p className="text-[20px] text-slate-400 max-w-[700px] mx-auto leading-relaxed font-medium">
            We've built the most resilient forensic engine. Designed for high-frequency auditing without compromising privacy.
          </p>
        </motion.div>

        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { icon: <Cpu />, title: "Neural Logic", desc: "Advanced heuristic models optimized for sub-millisecond execution on edge devices." },
            { icon: <Lock />, title: "Data Isolation", desc: "Your sensitive financial documents are never uploaded. Privacy is built into the core logic." },
            { icon: <BarChart3 />, title: "Risk Quantization", desc: "Vague legal jargon is converted into actionable data via our proprietary weighting system." },
            { icon: <Smartphone />, title: "Optical OCR", desc: "Digitize and audit physical paper documents with industry-leading precision and noise filtering." },
            { icon: <Globe />, title: "Intel Network", desc: "Synchronize with a global decentralized database of scam signatures and fraud patterns." },
            { icon: <Zap />, title: "Instant Audit", desc: "Immediate verification of any text or document, allowing for safer, faster decision-making." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="finvera-card group"
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center mb-10 border border-blue-600/20 text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-[26px] font-[800] mb-4 tracking-tighter uppercase">{feature.title}</h3>
              <p className="text-[16px] text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section className="py-60 relative z-10 text-center">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="max-w-[1000px] mx-auto px-10 space-y-16"
        >
          <h2 className="text-[64px] md:text-[110px] font-black tracking-tighter leading-[0.85] uppercase">
            Start Your <br/>
            Secure Audit.
          </h2>
          <button 
            onClick={onEnter}
            className="finvera-btn-primary !px-20 !py-8 !text-[24px] shadow-[0_30px_80px_rgba(37,99,235,0.4)]"
          >
            Enter Studio Protocol
          </button>
          
          <div className="pt-24 flex items-center justify-center gap-16 text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">
            <span>Privacy First</span>
            <span>Local Processing</span>
            <span>Zero Data Mining</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
