import React from "react";
import { Zap, Globe, ArrowRight, MousePointer2, Smartphone, BarChart3, Lock, Cpu, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import logo from "../assets/logo.svg";

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
    <div className="min-h-screen bg-white text-[#0F172A] font-['Manrope'] selection:bg-emerald-500/10 overflow-x-hidden">
      
      {/* 1. HERO SECTION */}
      <section className="relative min-h-screen flex flex-col items-center justify-center p-10 text-center">
        {/* Soft Emerald Glows */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[60%] h-[60%] bg-emerald-50 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-slate-100 rounded-full blur-[120px] opacity-60" />
        </div>

        <motion.div 
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
          className="max-w-[1200px] relative z-10"
        >
          <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 rounded-[24px] bg-white border border-slate-100 shadow-xl flex items-center justify-center mb-6">
               <img src={logo} alt="FinGuard" className="w-12 h-12" />
            </div>
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[12px] font-[800] uppercase tracking-[0.4em] text-emerald-700">Enterprise Forensic Protocol</span>
            </div>
          </div>
          
          <h1 className="text-[72px] md:text-[120px] font-[800] tracking-[-0.05em] leading-[0.82] mb-12 text-[#0F172A]">
            Audit Everything. <br />
            <span className="text-emerald-600 italic">Trust Nothing.</span>
          </h1>
          
          <p className="text-[20px] md:text-[26px] text-slate-500 font-medium max-w-[800px] mx-auto leading-relaxed mb-16 tracking-tight">
            Stop fraud and structural vulnerabilities before they impact your bottom line. <br className="hidden md:block" />
            Professional-grade forensics, built for modern business.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <button 
              onClick={onEnter}
              className="finvera-btn-primary !px-14 !py-7 !text-[20px] flex items-center gap-4 shadow-xl shadow-emerald-200"
            >
              Start Enterprise Audit
              <ArrowRight size={26} />
            </button>
            <button className="finvera-btn-secondary !px-14 !py-7 !text-[20px] border border-slate-200 shadow-sm">
              View Capabilities
            </button>
          </div>
        </motion.div>
      </section>

      {/* 2. HORIZONTAL TICKER LOOP */}
      <div className="py-12 border-y border-slate-100 bg-slate-50/50 relative z-10 overflow-hidden whitespace-nowrap">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          {[...tickerWords, ...tickerWords].map((word, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-12">
              <span className="text-[14px] font-[800] tracking-[0.4em] text-slate-400 uppercase">{word}</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </span>
          ))}
        </motion.div>
      </div>

      {/* 3. VALUE PROPOSITION */}
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
              <span className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.5em]">Risk Management</span>
              <h2 className="text-[54px] md:text-[72px] font-[800] tracking-tighter leading-[0.9] text-[#0F172A]">
                Zero-Knowledge <br/>
                Digital Auditing.
              </h2>
              <p className="text-[20px] text-slate-500 leading-relaxed font-medium">
                We've built a high-velocity forensic engine that operates entirely within your browser. No data uploads. No security gaps. Just pure, on-device intelligence.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
                 {[
                   { icon: <CheckCircle2 className="text-emerald-600" />, title: "Data Sovereignty", text: "Analyses never leave your perimeter." },
                   { icon: <CheckCircle2 className="text-emerald-600" />, title: "Pattern Shield", text: "Evolving scam signal detection." },
                   { icon: <CheckCircle2 className="text-emerald-600" />, title: "Heuristic Audit", text: "Multi-layered risk assessment." },
                   { icon: <CheckCircle2 className="text-emerald-600" />, title: "Optical Forensics", text: "Precision OCR contract scanning." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                     <div className="shrink-0 mt-1">{item.icon}</div>
                     <div>
                       <div className="font-bold text-[17px] text-[#0F172A]">{item.title}</div>
                       <div className="text-[14px] text-slate-500">{item.text}</div>
                     </div>
                   </div>
                 ))}
              </div>
            </div>
            
            <div className="flex-1 w-full max-w-[600px]">
              <div className="finvera-card !p-1 bg-slate-100 shadow-2xl shadow-slate-200">
                <div className="bg-white rounded-[32px] p-10 space-y-8">
                  <div className="flex justify-between items-center">
                     <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                     </div>
                     <span className="text-[10px] mono-data text-emerald-600 font-bold uppercase tracking-widest">Protocol_Active</span>
                  </div>
                  <div className="space-y-4 font-mono text-[13px] text-slate-400 leading-relaxed">
                    <p>&gt; Initializing audit parameters...</p>
                    <p>&gt; Mapping structural dependencies...</p>
                    <p className="text-emerald-600 font-bold">&gt; Integrity check: 100% verified</p>
                    <p>&gt; Generating forensic report...</p>
                    <p className="text-[#0F172A] font-bold">&gt; SYSTEM READY</p>
                  </div>
                  <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: "100%" }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="h-full bg-emerald-600"
                     />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. BENTO FEATURES */}
      <section className="py-40 bg-slate-50/50 border-y border-slate-100 relative z-10">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="max-w-[1400px] mx-auto px-10 text-center mb-24"
        >
          <h2 className="text-[54px] md:text-[84px] font-[800] tracking-tighter leading-none mb-8 text-[#0F172A]">
            Technical <br/> 
            Superiority.
          </h2>
          <p className="text-[20px] text-slate-500 max-w-[700px] mx-auto leading-relaxed font-medium">
            We've abstracted the world's most complex forensic models into a seamless, high-velocity interface.
          </p>
        </motion.div>

        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { icon: <Cpu />, title: "Neural Logic", desc: "Optimized heuristic models for sub-millisecond execution on standard edge devices." },
            { icon: <Lock />, title: "Data Sovereignty", desc: "Zero-knowledge processing ensures your proprietary documents never leave your browser." },
            { icon: <BarChart3 />, title: "Risk Quantization", desc: "Complex legal risks converted into actionable, weighted scores for rapid decision making." },
            { icon: <Smartphone />, title: "Optical Capture", desc: "Digitize and audit physical paper documents with precision OCR that filters background noise." },
            { icon: <Globe />, title: "Signal Intel", desc: "Real-time synchronization with a global database of known scam signatures and patterns." },
            { icon: <Zap />, title: "Instant Verification", desc: "Immediate audit capability, allowing for safer and faster financial negotiations." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="finvera-card group hover:border-emerald-200 shadow-lg shadow-slate-100"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-10 border border-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                {feature.icon}
              </div>
              <h3 className="text-[26px] font-[800] mb-4 tracking-tighter text-[#0F172A] uppercase">{feature.title}</h3>
              <p className="text-[16px] text-slate-500 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5. CTA */}
      <section className="py-60 relative z-10 text-center">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={sectionVariants}
          className="max-w-[1000px] mx-auto px-10 space-y-16"
        >
          <h2 className="text-[64px] md:text-[110px] font-[800] tracking-tighter leading-[0.85] text-[#0F172A]">
            Audit with <br/>
            Precision.
          </h2>
          <button 
            onClick={onEnter}
            className="finvera-btn-primary !px-20 !py-8 !text-[24px] shadow-2xl shadow-emerald-200"
          >
            Launch Enterprise Studio
          </button>
          
          <div className="pt-24 flex items-center justify-center gap-16 text-[11px] font-bold text-slate-400 uppercase tracking-[0.5em]">
            <span>Privacy First</span>
            <span>Local Processing</span>
            <span>Enterprise Grade</span>
          </div>
        </motion.div>
      </section>

    </div>
  );
}
