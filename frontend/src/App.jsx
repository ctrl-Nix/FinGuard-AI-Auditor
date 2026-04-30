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
    <div className="min-h-screen bg-[#050608] text-white">
      {/* Safety Header - Always Renders */}
      <nav className="sticky top-0 z-[100] bg-[#0a0c12]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-blue-600 flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-[18px] font-black tracking-tight">FinGuard Auditor</h1>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-bold text-white/40 uppercase tracking-widest">
            {currentTab} Mode
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 py-12">
        {currentTab === "audit" && (
          <div className="space-y-12">
            <div className="max-w-[800px] mx-auto text-center">
              <h2 className="text-[42px] font-black tracking-tighter mb-4 leading-tight">Professional Contract Audit.</h2>
              <InputPanel 
                onAnalyze={handleAnalyze} 
                onAnalyzeFile={user ? handleAnalyzeFile : () => setCurrentTab("profile")}
                isAnalyzing={isAnalyzing}
                isLoggedIn={!!user}
              />
            </div>

            {result && (
              <div className="space-y-8">
                <VerdictHeader verdict={result.verdict} score={result.score} />
                <SummaryCard highlights={result.highlights} verdict={result.verdict} />
                
                {result.score > 60 && (
                  <button onClick={reportScam} className="mx-auto block px-6 py-3 bg-red-600/20 text-red-500 border border-red-500/30 rounded-full font-bold text-[13px]">
                    Report Scam to Community
                  </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
                  <div className="space-y-8">
                    <ScorePanel result={result} />
                    <NegotiationPanel negotiation={result.negotiation} />
                  </div>
                  <div className="space-y-8">
                    {heatmap.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-[28px] p-8">
                        <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 block">Heatmap</span>
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

        {currentTab === "vault" && (user ? <VaultView /> : <ProfileView message="Sign up to join the Community Defense and see live scam reports." />)}
        {currentTab === "profile" && <ProfileView />}
      </main>

      {/* Nav Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-[#1c1c1e]/80 backdrop-blur-2xl px-8 py-4 rounded-full border border-white/10 flex items-center gap-12 shadow-2xl">
        <button onClick={() => setCurrentTab("audit")} className={`flex flex-col items-center gap-1 ${currentTab === "audit" ? 'text-blue-500' : 'text-white/40'}`}>
          <LayoutGrid size={24} />
          <span className="text-[10px] font-bold uppercase">Audit</span>
        </button>
        <button 
          onClick={() => setCurrentTab("vault")}
          className={`flex flex-col items-center gap-1 transition-colors ${currentTab === "vault" ? 'text-blue-500' : 'text-white/40'}`}
        >
          <ShieldCheck size={24} />
          <span className="text-[10px] font-bold uppercase">Vault</span>
        </button>
        <button onClick={() => setCurrentTab("profile")} className={`flex flex-col items-center gap-1 ${currentTab === "profile" ? 'text-blue-500' : 'text-white/40'}`}>
          <User size={24} />
          <span className="text-[10px] font-bold uppercase">Profile</span>
        </button>
      </div>
    </div>
  );
}
