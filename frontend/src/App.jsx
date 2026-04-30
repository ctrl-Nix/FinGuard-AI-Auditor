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

export default function App() {
  const { result, isRunning, apiResult, apiLoading, runKey, analyze, analyzeFile } = useAnalysis();
  const [currentText, setCurrentText] = useState("");

  const isAnalyzing = isRunning || apiLoading;

  const handleAnalyze = (text) => {
    setCurrentText(text);
    analyze(text);
  };

  const handleAnalyzeFile = (file) => {
    analyzeFile(file);
  };

  const heatmap = useMemo(() => {
    if (!result) return [];
    return result.matches || [];
  }, [result]);

  return (
    <div className="min-h-screen pb-20">
      {/* iOS Style Status Bar / Top Nav */}
      <nav className="sticky top-0 z-[50] bg-[#050608]/80 backdrop-blur-xl border-b border-white/[0.05] px-6 py-4">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-risk-blue flex items-center justify-center shadow-[0_0_20px_rgba(0,122,255,0.3)]">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-[18px] font-black tracking-tight leading-none">FinGuard</h1>
              <span className="text-[11px] font-bold text-risk-blue uppercase tracking-widest">Auditor OS</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="p-2.5 rounded-full bg-white/[0.05] text-ink-secondary hover:bg-white/[0.1] transition-all">
              <Bell size={20} />
            </button>
            <button className="p-2.5 rounded-full bg-white/[0.05] text-ink-secondary hover:bg-white/[0.1] transition-all">
              <User size={20} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1200px] mx-auto px-6 mt-8">
        {/* Entry Section */}
        <div className="max-w-[800px] mx-auto mb-12">
          <div className="text-center mb-8">
            <h2 className="text-[36px] md:text-[48px] font-black tracking-tighter mb-2">Scan with confidence.</h2>
            <p className="text-[17px] text-ink-secondary font-medium max-w-[500px] mx-auto">
              Our 3-layer AI engine detects hidden risks in contracts, messages, and legal documents.
            </p>
          </div>
          <InputPanel 
            onAnalyze={handleAnalyze} 
            onAnalyzeFile={handleAnalyzeFile}
            isAnalyzing={isAnalyzing}
          />
        </div>

        {/* Audit Results Bento Grid */}
        {result && (
          <div className="space-y-6">
            {/* Row 1: The Verdict */}
            <VerdictHeader verdict={result.verdict} score={result.score} />

            {/* Row 2: The Highlights (3 tiles) */}
            <SummaryCard highlights={result.highlights} verdict={result.verdict} />

            {/* Row 3: Detail Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
              {/* Left Column: Stats & Actions */}
              <div className="space-y-6">
                <ScorePanel result={result} />
                <NegotiationPanel negotiation={result.negotiation} />
              </div>

              {/* Right Column: Deep Analysis */}
              <div className="space-y-6">
                {/* Heatmap Box */}
                {heatmap.length > 0 && (
                  <div className="glass-card animate-bento">
                    <div className="bento-inner">
                      <span className="ios-label">Forensic Heatmap</span>
                      <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
                    </div>
                  </div>
                )}
                
                <BreakdownPanel result={result} />
                
                <ForensicsPanel 
                  urls={apiResult?.extracted_urls} 
                  phones={apiResult?.extracted_phones} 
                  senderFlags={apiResult?.sender_flags} 
                />

                {apiResult?.dispute_letter && (
                  <div className="animate-bento">
                    <DisputePanel letter={apiResult.dispute_letter} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* iOS Style Tab Bar (Optional Bottom Nav) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] glass-card px-6 py-3 border-white/[0.1] flex items-center gap-8 shadow-2xl">
        <button className="flex flex-col items-center gap-1 text-risk-blue">
          <LayoutGrid size={22} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Audit</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-ink-muted hover:text-ink-secondary transition-colors">
          <ShieldCheck size={22} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Vault</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-ink-muted hover:text-ink-secondary transition-colors">
          <User size={22} />
          <span className="text-[10px] font-bold uppercase tracking-tight">Profile</span>
        </button>
      </div>
    </div>
  );
}
