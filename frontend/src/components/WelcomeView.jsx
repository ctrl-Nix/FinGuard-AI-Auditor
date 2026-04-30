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
    <div className="min-h-screen bg-white text-[#0F172A] font-['Manrope'] selection:bg-blue-500/10 overflow-x-hidden">
      
      {/* 0. CINEMATIC INTRO BANNER WITH PARALLAX */}
      <motion.section 
         initial={{ height: "100vh" }}
         animate={{ height: "45vh" }}
         transition={{ duration: 1.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
         className="w-full bg-gradient-to-br from-blue-600 via-blue-700 to-emerald-500 relative flex flex-col items-center justify-center overflow-hidden z-[110]"
      >
         {/* Parallax Orbs */}
         <div className="absolute inset-0 z-0">
            <motion.div 
               animate={{ 
                 x: [0, 100, 0],
                 y: [0, -50, 0],
                 scale: [1, 1.2, 1]
               }}
               transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
               className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px]"
            />
            <motion.div 
               animate={{ 
                 x: [0, -80, 0],
                 y: [0, 60, 0],
                 scale: [1, 1.3, 1]
               }}
               transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
               className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-[120px]"
            />
         </div>

         <div className="relative z-10 text-center space-y-6 px-10">
            <motion.div 
               initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
               animate={{ scale: 1, opacity: 1, rotate: 0 }}
               transition={{ duration: 1, ease: "backOut" }}
               className="w-24 h-24 rounded-[30px] bg-white/10 backdrop-blur-2xl border border-white/30 shadow-2xl flex items-center justify-center mx-auto mb-10"
            >
               <img src={logo} alt="FinGuard" className="w-14 h-14 brightness-0 invert" />
            </motion.div>
            
            <div className="overflow-hidden">
              <motion.h1 
                 initial={{ y: 100, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                 className="text-[64px] md:text-[110px] font-[900] tracking-[-0.05em] leading-none text-white"
              >
                 FinGuard <span className="text-emerald-300">Audit.</span>
              </motion.h1>
            </div>
         </div>
         
         <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
            className="absolute top-10 right-10 flex items-center gap-4 z-[120]"
         >
            <span className="text-[18px] font-[800] tracking-tight text-white/90">FinGuard</span>
            <div className="w-10 h-10 rounded-[12px] bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
               <img src={logo} alt="FinGuard" className="w-6 h-6 brightness-0 invert" />
            </div>
         </motion.div>
      </motion.section>

      {/* 1. HERO CONTENT SECTION */}
      <section className="relative pt-24 pb-40 flex flex-col items-center justify-center p-10 text-center">
        <div className="max-w-[1200px] relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-50 border border-slate-100 shadow-sm mb-16"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[12px] font-[800] uppercase tracking-[0.4em] text-slate-500">System Ready for Public Audit</span>
          </motion.div>
          
          <div className="overflow-hidden mb-12">
            <motion.h2 
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-[64px] md:text-[100px] font-[900] tracking-[-0.05em] leading-[0.85] text-[#0F172A]"
            >
              Audit Everything. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 italic">Trust Nothing.</span>
            </motion.h2>
          </div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5, duration: 1 }}
            className="text-[20px] md:text-[26px] text-slate-400 font-medium max-w-[800px] mx-auto leading-relaxed mb-20 tracking-tight"
          >
            The world's first decentralized forensic engine designed for complete privacy and instant verification.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.8, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <motion.button 
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(15,23,42,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
              className="!bg-[#0F172A] hover:bg-black text-white px-14 py-7 rounded-[22px] font-bold text-[20px] flex items-center gap-4 transition-all"
            >
              Start Secure Audit
              <ArrowRight size={26} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, bg: "#F8FAFC" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              className="finvera-btn-secondary !px-14 !py-7 !text-[20px] border border-slate-200 shadow-sm"
            >
              View Capabilities
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 2. TICKER */}
      <div className="py-14 border-y border-slate-100 bg-slate-50/50 relative z-10 overflow-hidden whitespace-nowrap">
        <motion.div 
          initial={{ x: 0 }}
          animate={{ x: "-50%" }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="inline-block"
        >
          {[...tickerWords, ...tickerWords].map((word, i) => (
            <span key={i} className="inline-flex items-center gap-6 mx-12">
              <span className="text-[15px] font-[900] tracking-[0.4em] text-slate-300 uppercase">{word}</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
            </span>
          ))}
        </motion.div>
      </div>

      {/* 3. BENTO FEATURES WITH STAGGERED REVEAL */}
      <motion.section 
        id="features"
        className="py-48 bg-slate-50/20 relative z-10"
      >
        <div className="max-w-[1400px] mx-auto px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
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
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -15, scale: 1.02 }}
              className="finvera-card group border-slate-100 shadow-xl shadow-slate-200/40 bg-white"
            >
              <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center mb-10 text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-[28px] font-[900] mb-6 tracking-tighter text-[#0F172A] uppercase leading-tight">{feature.title}</h3>
              <p className="text-[17px] text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 4. FOOTER CTA — IMMERSIVE 3D EXPERIENCE */}
      <section className="py-60 relative z-10 text-center overflow-hidden">
        {/* Holographic Network Background */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
           <motion.div 
              animate={{ 
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-100 rounded-full blur-[2px]"
           />
           <motion.div 
              animate={{ 
                rotate: -360,
                scale: [1, 1.2, 1]
              }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-100 rounded-full opacity-50"
           />
           
           {/* Floating Particles/Signals */}
           {[...Array(12)].map((_, i) => (
             <motion.div
               key={i}
               animate={{
                 y: [0, -100, 0],
                 x: [0, Math.random() * 50 - 25, 0],
                 opacity: [0, 1, 0]
               }}
               transition={{
                 duration: 4 + Math.random() * 4,
                 repeat: Infinity,
                 delay: Math.random() * 5
               }}
               className="absolute w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px]"
               style={{
                 top: `${Math.random() * 100}%`,
                 left: `${Math.random() * 100}%`
               }}
             />
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-[1000px] mx-auto px-10 space-y-16 relative z-10"
        >
          <div className="relative inline-block">
             <h2 className="text-[64px] md:text-[120px] font-[900] tracking-[-0.06em] leading-[0.8] text-[#0F172A] relative">
               Audit with <br/>
               <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-500 animate-gradient-x">Precision.</span>
             </h2>
             {/* Micro-interaction: Pulsing Aura behind text */}
             <div className="absolute inset-0 -z-10 bg-blue-50 rounded-full blur-[100px] opacity-30"></div>
          </div>

          <div className="relative inline-block group">
            {/* 3D-like Button Interaction */}
            <motion.button 
              whileHover={{ 
                scale: 1.1, 
                rotateY: 10,
                rotateX: -10,
                boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.3)"
              }}
              whileTap={{ scale: 0.95 }}
              onClick={onEnter}
              className="!bg-[#0F172A] text-white px-24 py-10 rounded-[28px] font-bold text-[28px] shadow-2xl relative overflow-hidden transition-all duration-300"
            >
              <span className="relative z-10">Launch Studio</span>
              {/* Shimmer effect */}
              <motion.div 
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
              />
            </motion.button>
            
            {/* Orbits around button */}
            <div className="absolute inset-[-40px] border border-slate-100 rounded-full pointer-events-none group-hover:border-emerald-200 transition-colors" />
            <div className="absolute inset-[-80px] border border-dashed border-slate-100 rounded-full pointer-events-none opacity-40 animate-spin-slow" />
          </div>
          
          <div className="pt-24 flex items-center justify-center gap-12 text-[11px] font-black text-slate-400 uppercase tracking-[0.6em]">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> SOURCED PRIVACY</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div> SECURE DEPLOY</span>
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div> v3.0</span>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
