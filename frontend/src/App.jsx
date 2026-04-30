import React, { useState, useEffect, useMemo } from "react";
import { ShieldCheck, Zap, Bell, User, LayoutGrid } from "lucide-react";
import { useAnalysis }    from "./hooks/useAnalysis.js";
import { DEMOS }          from "./engine/analyzer.js";

// Components
import InputPanel         from "./components/InputPanel.jsx";
import ScorePanel         from "./components/ScorePanel.jsx";
import ForensicHeatmap    from "./components/ForensicHeatmap.jsx";
import BreakdownPanel     from "./components/BreakdownPanel.jsx";
import DisputePanel       from "./components/DisputePanel.jsx";
import ForensicsPanel     from "./components/ForensicsPanel.jsx";
import VerdictHeader      from "./components/VerdictHeader.jsx";
import SummaryCard        from "./components/SummaryCard.jsx";
import NegotiationPanel   from "./components/NegotiationPanel.jsx";
import VaultView          from "./components/VaultView.jsx";
import ProfileView        from "./components/ProfileView.jsx";
import WelcomeView        from "./components/WelcomeView.jsx";
import { supabase }       from "./lib/supabase.js";

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
    <div className="min-h-screen bg-[#020305] text-white selection:bg-blue-500/30">
      {/* Safety Header - Advanced Intel Look */}
      <nav className="sticky top-0 z-[100] bg-[#020305]/80 backdrop-blur-2xl border-b border-white/5 px-8 py-5">
        <div className="max-w-[1300px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-black tracking-tighter leading-none glow-text">FINGUARD <span className="text-blue-500 font-light">3.0</span></h1>
              <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1">Advanced Forensic Auditor</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[11px] font-black text-white/30 uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div> Node: SG-01</span>
            <span className="text-blue-500/60">Mode: {currentTab} Analysis</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1300px] mx-auto px-8 py-16">
        {currentTab === "audit" && (
          <div className="space-y-16 animate-bento">
            <div className="max-w-[900px] mx-auto text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4">
                <Zap size={12} fill="currentColor" /> AI-Powered Forensic Scan
              </div>
              <h2 className="text-[56px] lg:text-[72px] font-black tracking-tighter mb-4 leading-[0.9] glow-text">
                Audit Everything. <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">Trust Nothing.</span>
              </h2>
              <p className="text-[17px] text-white/40 max-w-[600px] mx-auto leading-relaxed">
                Run professional-grade forensic audits on contracts, messages, and files in under 5ms. 100% private, 100% local.
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
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="relative">
                   <div className="absolute inset-0 bg-blue-500/5 blur-[120px] rounded-full"></div>
                   <VerdictHeader verdict={result.verdict} score={result.score} />
                </div>
                
                <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                
                {result.score > 60 && (
                  <button onClick={reportScam} className="mx-auto block px-10 py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full font-black text-[12px] uppercase tracking-widest hover:bg-red-500/20 transition-all">
                    Flag as Malicious Signal
                  </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-12">
                  <div className="space-y-10">
                    <ScorePanel result={result} />
                    <NegotiationPanel negotiation={result.negotiation} />
                  </div>
                  <div className="space-y-10">
                    {heatmap.length > 0 && (
                      <div className="cyber-card p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 text-[40px] font-black text-white/[0.02] select-none pointer-events-none uppercase">Heatmap</div>
                        <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 block">Forensic Signal Mapping</span>
                        <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
                      </div>
                    )}
                    <BreakdownPanel result={result} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentTab === "vault" && (user ? <VaultView /> : <ProfileView message="Access the Global Intel Vault to track live scam patterns." />)}
        {currentTab === "profile" && <ProfileView />}
      </main>

      {/* Nav Bar - Cyber Floating Style */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black/40 backdrop-blur-3xl px-10 py-5 rounded-[32px] border border-white/10 flex items-center gap-16 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <button onClick={() => setCurrentTab("audit")} className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "audit" ? 'text-blue-400 scale-110' : 'text-white/30 hover:text-white/60'}`}>
          <LayoutGrid size={22} strokeWidth={currentTab === "audit" ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Audit</span>
        </button>
        <button 
          onClick={() => setCurrentTab("vault")}
          className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "vault" ? 'text-blue-400 scale-110' : 'text-white/30 hover:text-white/60'}`}
        >
          <ShieldCheck size={22} strokeWidth={currentTab === "vault" ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Vault</span>
        </button>
        <button onClick={() => setCurrentTab("profile")} className={`flex flex-col items-center gap-1.5 transition-all ${currentTab === "profile" ? 'text-blue-400 scale-110' : 'text-white/30 hover:text-white/60'}`}>
          <User size={22} strokeWidth={currentTab === "profile" ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Identity</span>
        </button>
      </div>
    </div>
  );
}
