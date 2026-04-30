import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Bell, User, LayoutGrid, Globe, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
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
import { supabase } from "./lib/supabase.js";

export default function App() {
  const { result, isRunning, apiResult, apiLoading, runKey, analyze, analyzeFile } = useAnalysis();
  const heatmap = result?.matches || [];
  const [currentText, setCurrentText] = useState("");
  const [currentTab, setCurrentTab] = useState("audit");
  const [user, setUser] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);

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
    return <WelcomeView onEnter={() => setShowWelcome(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] selection:bg-emerald-500/10 font-['Manrope']">
      {/* Finvera Light Header */}
      <nav className="sticky top-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => setShowWelcome(true)}
              className="text-[12px] font-bold text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors"
            >
              Home
            </button>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          <div 
            className="flex items-center gap-4 cursor-pointer group"
            onClick={() => setShowWelcome(true)}
          >
            <div>
              <h1 className="text-[26px] font-[800] tracking-tight leading-none text-[#0F172A] text-right">FinGuard</h1>
              <div className="text-[10px] font-[800] text-emerald-600 uppercase tracking-[0.2em] mt-1 text-right">Audit Protocol</div>
            </div>
            <div className="w-12 h-12 rounded-[14px] bg-white flex items-center justify-center shadow-lg shadow-slate-200 transition-transform group-hover:scale-105 border border-slate-100">
              <img src={logo} alt="FinGuard" className="w-8 h-8" />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-20 relative z-10">
        {currentTab === "audit" && (
          <div className="space-y-20">
            {/* Finvera Hero */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[900px] space-y-8"
            >
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[11px] font-black uppercase tracking-widest">
                 <Zap size={14} fill="currentColor" /> Neural Forensic Engine
               </div>
               <h2 className="text-[64px] lg:text-[84px] font-[800] tracking-[-0.04em] leading-[0.9] text-[#0F172A]">
                 Protecting your <br/>
                 <span className="text-emerald-600">Financial Future.</span>
               </h2>
               <p className="text-[20px] text-slate-500 max-w-[600px] leading-relaxed font-medium">
                 Professional-grade AI auditing for contracts and financial documents. Clean, precise, and entirely private.
               </p>
               
               <div className="pt-8">
                 <InputPanel 
                   onAnalyze={handleAnalyze} 
                   onAnalyzeFile={user ? handleAnalyzeFile : () => setCurrentTab("profile")}
                   isAnalyzing={isAnalyzing}
                   isLoggedIn={!!user}
                 />
               </div>
            </motion.div>

            {result && (
              <div className="space-y-12">
                {/* Result Summary Bar */}
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="finvera-card !py-12 !px-12 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-slate-200/50"
                >
                   <div 
                     className="w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl"
                     style={{ background: `linear-gradient(135deg, ${result.verdict.color}, ${result.verdict.color}cc)` }}
                   >
                     <ShieldCheck size={48} className="text-white" />
                   </div>
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
                </motion.div>

                {/* Bento Grid Results */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-8">
                      <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.1 }}
                         className="finvera-card relative overflow-hidden"
                      >
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03] text-slate-900">
                            <ShieldCheck size={200} />
                         </div>
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Forensic Insights</span>
                         <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                      </motion.div>
                      
                      <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         transition={{ delay: 0.2 }}
                         className="finvera-card"
                      >
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Analysis Breakdown</span>
                         <BreakdownPanel result={result} />
                      </motion.div>
                   </div>

                   <div className="space-y-8">
                      <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.3 }}
                         className="finvera-card !p-0 overflow-hidden"
                      >
                         <div className="p-10 border-b border-slate-100">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] block">Risk Scorecard</span>
                         </div>
                         <div className="p-10 bg-slate-50/50">
                            <ScorePanel result={result} />
                         </div>
                      </motion.div>

                      <motion.div 
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         transition={{ delay: 0.4 }}
                         className="finvera-card"
                      >
                         <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Negotiation Strategy</span>
                         <NegotiationPanel negotiation={result.negotiation} />
                      </motion.div>
                   </div>
                </div>

                {heatmap.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="finvera-card"
                  >
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] mb-8 block">Signal Mapping</span>
                    <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
                  </motion.div>
                )}
              </div>
            )}
          </div>
        )}

        {currentTab === "vault" && (user ? <VaultView /> : <ProfileView message="Access the Security Vault." />)}
        {currentTab === "profile" && <ProfileView />}
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
    </div>
  );
}
