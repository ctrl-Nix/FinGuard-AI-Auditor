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
  
  // Persistent State
  const [currentTab, setCurrentTab] = useState(() => localStorage.getItem("FINGUARD_TAB") || "audit");
  const [showWelcome, setShowWelcome] = useState(() => {
    const saved = localStorage.getItem("FINGUARD_WELCOME");
    return saved === null ? true : saved === "true";
  });
  
  const [user, setUser] = useState(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("FINGUARD_TAB", currentTab);
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem("FINGUARD_WELCOME", showWelcome);
  }, [showWelcome]);

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
      {/* Finvera Light Header */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-5 transition-all duration-500">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => setShowWelcome(true)}
              className="text-[12px] font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors"
            >
              Home
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <button 
              onClick={() => setIsKeyModalOpen(true)}
              className="flex items-center gap-2 text-[12px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors"
            >
              <KeyIcon size={14} /> BYOK Configuration
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">Live Protocol</span>
            </div>
          </div>

          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="cursor-pointer group flex items-center justify-center"
            onClick={() => setShowWelcome(true)}
          >
            <div className="w-14 h-14 rounded-[18px] bg-sky-400/20 backdrop-blur-xl flex items-center justify-center shadow-2xl shadow-sky-200/30 transition-all group-hover:rotate-3 border border-white/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-300/20 to-transparent" />
              <img src={logo} alt="FinGuard" className="w-9 h-9 relative z-10" />
            </div>
          </motion.div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-20 relative z-10">
        <AnimatePresence mode="wait">
          {currentTab === "audit" && (
            <motion.div 
              key="audit-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-20"
            >
              {/* Finvera Hero */}
              <div className="max-w-[900px] space-y-8">
                 <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-black uppercase tracking-widest">
                   <Zap size={14} fill="currentColor" /> Neural Forensic Engine
                 </div>
                 <h2 className="text-[64px] lg:text-[84px] font-[800] tracking-[-0.04em] leading-[0.9] text-[#0F172A]">
                   Protecting your <br/>
                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-600">Financial Future.</span>
                 </h2>
                 <p className="text-[20px] text-slate-500 max-w-[600px] leading-relaxed font-medium">
                   Professional-grade AI auditing for everyone. Clean, precise, and entirely private.
                 </p>
                 
                 <div className="pt-8">
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
                  className="space-y-12"
                >
                  {/* Result Summary Bar */}
                  <div className="finvera-card !py-12 !px-12 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-slate-200/50">
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       transition={{ type: "spring", damping: 12 }}
                       className="w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl"
                       style={{ background: `linear-gradient(135deg, ${result.verdict.color}, ${result.verdict.color}cc)` }}
                     >
                       <ShieldCheck size={48} className="text-white" />
                     </motion.div>
                     <div className="flex-1 text-center md:text-left">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 block">Audit Result</span>
                        <h3 className="text-[42px] font-black tracking-tighter leading-none" style={{ color: result.verdict.color }}>
                          {result.verdict.label.toUpperCase()}
                        </h3>
                     </div>
                     <div className="h-16 w-px bg-slate-100 hidden md:block" />
                     <div className="text-center md:text-right">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-2 block">Safety Confidence</span>
                        <div className="text-[56px] font-black tracking-tighter leading-none text-[#0F172A]">
                          {result.score}<span className="text-[24px] opacity-20 ml-1">%</span>
                        </div>
                     </div>
                  </div>

                  {/* Bento Grid Results */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-8">
                        <div className="finvera-card relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-slate-900 pointer-events-none">
                              <ShieldCheck size={200} />
                           </div>
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Forensic Insights</span>
                           <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                        </div>
                        
                        <div className="finvera-card">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Analysis Breakdown</span>
                           <BreakdownPanel result={result} />
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="finvera-card !p-0 overflow-hidden">
                           <div className="p-10 border-b border-slate-100">
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] block">Risk Scorecard</span>
                           </div>
                           <div className="p-10 bg-slate-50/50">
                              <ScorePanel result={result} />
                           </div>
                        </div>

                        <div className="finvera-card">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Negotiation Strategy</span>
                           <NegotiationPanel negotiation={result.negotiation} />
                        </div>
                     </div>
                  </div>

                  {heatmap.length > 0 && (
                    <div className="finvera-card">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Signal Mapping</span>
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
              {user ? <VaultView /> : <ProfileView message="Access the Security Vault." />}
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

      {/* Finvera Light Bottom Nav */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-white/80 backdrop-blur-3xl px-10 py-5 rounded-[32px] border border-slate-200 flex items-center gap-16 shadow-2xl shadow-slate-200/50">
        <button onClick={() => setShowWelcome(true)} className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-emerald-600 transition-all">
          <Globe size={24} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setCurrentTab("audit")} className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "audit" ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
          <LayoutGrid size={24} strokeWidth={currentTab === "audit" ? 3 : 2} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Audit</span>
        </button>
        <button 
          onClick={() => setCurrentTab("vault")}
          className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "vault" ? 'text-emerald-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <ShieldCheck size={24} strokeWidth={currentTab === "vault" ? 3 : 2} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Vault</span>
        </button>
      </div>

      <KeySettingsModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
      />
    </div>
  );
}
