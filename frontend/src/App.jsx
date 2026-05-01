import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Bell, User, LayoutGrid, Globe, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAnalysis } from "./hooks/useAnalysis.js";
import { DEMOS } from "./engine/analyzer.js";

// Assets
import logo from "./assets/logo.svg";

// Components
import InputPanel from "./components/InputPanel.jsx";
import ScorePanel from "./components/ScorePanel.jsx";
import ForensicHeatmap from "./components/ForensicHeatmap.jsx";
import BreakdownPanel from "./components/BreakdownPanel.jsx";
import DisputePanel from "./components/DisputePanel.jsx";
import ForensicsPanel from "./components/ForensicsPanel.jsx";
import VerdictHeader from "./components/VerdictHeader.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import NegotiationPanel from "./components/NegotiationPanel.jsx";
import VaultView from "./components/VaultView.jsx";
import ProfileView from "./components/ProfileView.jsx";
import WelcomeView from "./components/WelcomeView.jsx";
import KeySettingsModal from "./components/KeySettingsModal.jsx";
import { Key as KeyIcon } from "lucide-react";

const springTransition = {
  type: "spring",
  stiffness: 260,
  damping: 20
};

const fadeVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
import { supabase } from "./lib/supabase.js";

export default function App() {
  const { result, isRunning, apiResult, apiLoading, runKey, analyze, analyzeFile } = useAnalysis();
  const heatmap = result?.matches || [];
  const [currentText, setCurrentText] = useState("");
  const [currentTab, setCurrentTab] = useState("audit");
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    try {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) setUser(data.user);
      });
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });
      return () => subscription?.unsubscribe();
    } catch (e) {
      console.error("Auth init error:", e);
    }
  }, []);

  const isAnalyzing = isRunning || apiLoading;

  useEffect(() => {
    if (result && user && !isAnalyzing) {
      saveToHistory(result);
    }
  }, [result, user, isAnalyzing]);

  async function saveToHistory(res) {
    try {
      await supabase.from('user_audits').insert({
        user_id: user.id,
        score: res.score,
        verdict_label: res.verdict.label,
        audit_text: currentText.slice(0, 500),
        file_name: apiResult?.file_name || "Text Scan"
      });
    } catch (e) { console.error(e); }
  }

  async function reportScam() {
    if (!result) return;
    try {
      const { error } = await supabase.from('scam_reports').insert({
        text: currentText || apiResult?.text || "Unknown text",
        verdict: result.verdict.label,
        confidence: result.score,
        location: "Community Report"
      });
      if (!error) alert("Scam reported to the Global Vault!");
    } catch (e) { alert("Error reporting scam"); }
  }

  const handleAnalyze = (text) => {
    setCurrentText(text);
    analyze(text);
  };

  const handleAnalyzeFile = (file) => {
    analyzeFile(file);
  };

  if (showWelcome) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="welcome"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          <WelcomeView onEnter={() => setShowWelcome(false)} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] selection:bg-emerald-500/10 font-['Manrope'] overflow-x-hidden">
      {/* Cinematic Sticky Header */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-2xl border-b border-slate-100 px-8 py-5 transition-all duration-500">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => setShowWelcome(true)}
              className="text-[11px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em]"
            >
              Protocol
            </button>
            <div className="h-4 w-px bg-slate-100" />
            <button 
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-2 text-[11px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em]"
            >
              <KeyIcon size={14} /> BYOK Configuration
            </button>
            <div className="h-4 w-px bg-slate-100" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Link Live</span>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-5 cursor-pointer group"
            onClick={() => setShowWelcome(true)}
          >
            <div className="text-right">
              <h1 className="text-[28px] font-[900] tracking-[-0.04em] leading-none text-[#0F172A]">FinGuard</h1>
              <div className="text-[10px] font-[900] bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600 uppercase tracking-[0.25em] mt-1">Audit AI</div>
            </div>
            <div className="w-14 h-14 rounded-[18px] bg-[#0F172A] flex items-center justify-center shadow-2xl shadow-slate-200 transition-all group-hover:rotate-6 border border-slate-800">
              <img src={logo} alt="FinGuard" className="w-9 h-9 brightness-0 invert" />
            </div>
          </motion.div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-24 relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === "audit" && (
            <motion.div 
              key="audit-tab"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-24"
            >
              {/* Refined Hero */}
              <div className="max-w-[1000px] space-y-10">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-50 text-[#0F172A] border border-slate-100 text-[11px] font-black uppercase tracking-[0.3em] shadow-sm"
                 >
                   <Zap size={14} className="text-emerald-500" fill="currentColor" /> Advanced Forensic Engine v3.0
                 </motion.div>
                 <h2 className="text-[72px] lg:text-[110px] font-[900] tracking-[-0.05em] leading-[0.85] text-[#0F172A]">
                   Secure your <br/>
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-500">Capital Intelligence.</span>
                 </h2>
                 <p className="text-[22px] text-slate-400 max-w-[650px] leading-relaxed font-medium tracking-tight">
                   Enterprise-grade neural auditing. Transparent, private, and powered by your own AI keys.
                 </p>
                 
                 <div className="pt-6">
                   <InputPanel 
                     onAnalyze={handleAnalyze} 
                     onAnalyzeFile={user ? handleAnalyzeFile : () => setCurrentTab("profile")}
                     isAnalyzing={isAnalyzing}
                     isLoggedIn={!!user}
                   />
                 </div>
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-16"
                >
                  {/* Result Summary Bar */}
                  <div className="finvera-card !py-14 !px-14 flex flex-col md:flex-row items-center gap-12 shadow-2xl shadow-slate-100 bg-white border-slate-100">
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       transition={{ type: "spring", damping: 12 }}
                       className="w-28 h-28 rounded-[36px] flex items-center justify-center shrink-0 shadow-2xl"
                       style={{ background: `linear-gradient(135deg, ${result.verdict.color}, ${result.verdict.color}dd)` }}
                     >
                       <ShieldCheck size={56} className="text-white" />
                     </motion.div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 block">Audit Protocol Verdict</span>
                        <h3 className="text-[52px] font-[900] tracking-tighter leading-none" style={{ color: result.verdict.color }}>
                          {result.verdict.label.toUpperCase()}
                        </h3>
                     </div>
                     <div className="h-20 w-px bg-slate-100 hidden md:block" />
                     <div className="text-center md:text-right">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-3 block">Neural Confidence</span>
                        <div className="text-[64px] font-[900] tracking-tighter leading-none text-[#0F172A]">
                          {result.score}<span className="text-[24px] opacity-20 ml-1.5">%</span>
                        </div>
                     </div>
                  </div>

                  {/* Bento Grid Results */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                     <div className="lg:col-span-2 space-y-10">
                        <div className="finvera-card relative overflow-hidden bg-white border-slate-100">
                           <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-[#0F172A] pointer-events-none">
                              <ShieldCheck size={280} />
                           </div>
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 block">Forensic Insights</span>
                           <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                        </div>
                        
                        <div className="finvera-card bg-white border-slate-100">
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 block">Deep Analysis Breakdown</span>
                           <BreakdownPanel result={result} />
                        </div>
                     </div>

                     <div className="space-y-10">
                        <div className="finvera-card !p-0 overflow-hidden bg-white border-slate-100">
                           <div className="p-12 border-b border-slate-50 bg-slate-50/30">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] block">Risk Scorecard</span>
                           </div>
                           <div className="p-12 bg-white">
                              <ScorePanel result={result} />
                           </div>
                        </div>

                        <div className="finvera-card bg-white border-slate-100">
                           <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 block">Negotiation Protocol</span>
                           <NegotiationPanel negotiation={result.negotiation} />
                        </div>
                     </div>
                  </div>

                  {heatmap.length > 0 && (
                    <div className="finvera-card bg-white border-slate-100">
                      <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-10 block">Neural Signal Mapping</span>
                      <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {currentTab === "vault" && (
            <motion.div 
              key="vault-tab"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              {user ? <VaultView /> : <ProfileView message="Access the Secure Vault." />}
            </motion.div>
          )}
          
          {currentTab === "profile" && (
            <motion.div 
              key="profile-tab"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="w-full"
            >
              <ProfileView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Futuristic Floating Bottom Nav */}
      <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-[#0F172A]/90 backdrop-blur-3xl px-12 py-6 rounded-[36px] border border-slate-800 flex items-center gap-20 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => setShowWelcome(true)} 
          className="flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-all group"
        >
          <Globe size={22} className="group-hover:rotate-12 transition-transform" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Home</span>
        </button>
        <button 
          onClick={() => setCurrentTab("audit")} 
          className={`flex flex-col items-center gap-2 transition-all ${currentTab === "audit" ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-white'}`}
        >
          <LayoutGrid size={22} strokeWidth={currentTab === "audit" ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Audit</span>
        </button>
        <button 
          onClick={() => setCurrentTab("vault")}
          className={`flex flex-col items-center gap-2 transition-all ${currentTab === "vault" ? 'text-emerald-400 scale-110' : 'text-slate-500 hover:text-white'}`}
        >
          <ShieldCheck size={22} strokeWidth={currentTab === "vault" ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Vault</span>
        </button>
      </div>

      <KeySettingsModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
      />
    </div>
  );
}
