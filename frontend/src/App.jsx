import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Bell, User, LayoutGrid, ArrowRight } from "lucide-react";
import { useAnalysis } from "./hooks/useAnalysis.js";
import { DEMOS } from "./engine/analyzer.js";

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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 font-['Manrope']">
      {/* Finvera Header */}
      <nav className="sticky top-0 z-[100] bg-[#020617]/80 backdrop-blur-3xl border-b border-white/5 px-8 py-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)]">
              <ShieldCheck size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-[22px] font-extrabold tracking-tight leading-none uppercase">FinGuard</h1>
              <div className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] mt-1">AI Risk Protocol</div>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]"></div>
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-widest">Network Active</span>
            </div>
            <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold uppercase tracking-widest">
              Tier: Enterprise
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-[1400px] mx-auto px-8 py-20 relative z-10">
        {currentTab === "audit" && (
          <div className="space-y-20 animate-finvera">
            {/* Finvera Hero */}
            <div className="max-w-[900px] space-y-8">
               <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-[11px] font-black uppercase tracking-widest">
                 <Zap size={14} fill="currentColor" /> Advanced Forensic Analysis
               </div>
               <h2 className="text-[64px] lg:text-[84px] font-[800] tracking-[-0.04em] leading-[0.9] text-white">
                 Audit without <br/>
                 <span className="text-blue-500">Boundaries.</span>
               </h2>
               <p className="text-[20px] text-slate-400 max-w-[600px] leading-relaxed font-medium">
                 The most sophisticated AI-driven financial auditor. Scan contracts, identify fraud, and secure your assets with one click.
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
              <div className="space-y-12 animate-finvera">
                {/* Result Summary Bar */}
                <div className="finvera-card !py-12 !px-12 flex flex-col md:flex-row items-center gap-10">
                   <div 
                     className="w-24 h-24 rounded-[32px] flex items-center justify-center shrink-0 shadow-2xl"
                     style={{ background: `linear-gradient(135deg, ${result.verdict.color}, ${result.verdict.color}cc)` }}
                   >
                     <ShieldCheck size={48} className="text-white" />
                   </div>
                   <div className="flex-1 text-center md:text-left">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 block">System Verdict</span>
                      <h3 className="text-[42px] font-black tracking-tighter leading-none" style={{ color: result.verdict.color }}>
                        {result.verdict.label.toUpperCase()}
                      </h3>
                   </div>
                   <div className="h-16 w-px bg-white/5 hidden md:block" />
                   <div className="text-center md:text-right">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-2 block">Safety Confidence</span>
                      <div className="text-[56px] font-black tracking-tighter leading-none text-white">
                        {result.score}<span className="text-[24px] opacity-20 ml-1">%</span>
                      </div>
                   </div>
                </div>

                {/* Bento Grid Results */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                   <div className="lg:col-span-2 space-y-8">
                      <div className="finvera-card relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-10 opacity-[0.03]">
                            <ShieldCheck size={200} />
                         </div>
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8 block">Forensic Insights</span>
                         <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                      </div>
                      
                      <div className="finvera-card">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8 block">Structural Breakdown</span>
                         <BreakdownPanel result={result} />
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="finvera-card !p-0 overflow-hidden">
                         <div className="p-10 border-b border-white/5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] block">Risk Matrix</span>
                         </div>
                         <div className="p-10 bg-slate-900/40">
                            <ScorePanel result={result} />
                         </div>
                      </div>

                      <div className="finvera-card">
                         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8 block">Action Strategy</span>
                         <NegotiationPanel negotiation={result.negotiation} />
                      </div>
                   </div>
                </div>

                {heatmap.length > 0 && (
                  <div className="finvera-card">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.3em] mb-8 block">Forensic Signal Mapping</span>
                    <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {currentTab === "vault" && (user ? <VaultView /> : <ProfileView message="Sign in to access the Global Security Vault." />)}
        {currentTab === "profile" && <ProfileView />}
      </main>

      {/* Finvera Bottom Nav */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-[#020617]/60 backdrop-blur-3xl px-10 py-5 rounded-[32px] border border-white/10 flex items-center gap-16 shadow-[0_25px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => setCurrentTab("audit")} className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "audit" ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <LayoutGrid size={24} strokeWidth={currentTab === "audit" ? 3 : 2} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Audit</span>
        </button>
        <button 
          onClick={() => setCurrentTab("vault")}
          className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "vault" ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <ShieldCheck size={24} strokeWidth={currentTab === "vault" ? 3 : 2} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">Vault</span>
        </button>
        <button onClick={() => setCurrentTab("profile")} className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "profile" ? 'text-blue-500 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
          <User size={24} strokeWidth={currentTab === "profile" ? 3 : 2} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest">User</span>
        </button>
      </div>
    </div>
  );
}
