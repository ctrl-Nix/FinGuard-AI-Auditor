import { useEffect, useState } from "react";
import Header           from "./components/Header.jsx";
import InputPanel       from "./components/InputPanel.jsx";
import ScorePanel       from "./components/ScorePanel.jsx";
import BreakdownPanel   from "./components/BreakdownPanel.jsx";
import ForensicsPanel   from "./components/ForensicsPanel.jsx";
import ForensicHeatmap  from "./components/ForensicHeatmap.jsx";
import DisputePanel     from "./components/DisputePanel.jsx";
import { FileDown, ShieldCheck } from "lucide-react";
import { useAnalysis }    from "./hooks/useAnalysis.js";
import { DEMOS }          from "./engine/analyzer.js";

export default function App() {
  const { result, isRunning, apiResult, apiLoading, runKey, analyze, analyzeFile, exportAudit } = useAnalysis();
  const [currentText, setCurrentText] = useState(DEMOS.bad_contract.text);

  // Auto-run on mount with demo text
  useEffect(() => {
    const timer = setTimeout(() => analyze(DEMOS.bad_contract.text), 400);
    return () => clearTimeout(timer);
  }, [analyze]);

  const handleAnalyze = (text) => {
    setCurrentText(text);
    analyze(text, { useBackend: true });
  };

  // Merge client result with server result for forensics data
  const urls        = apiResult?.extracted_urls   ?? [];
  const phones      = apiResult?.extracted_phones ?? [];
  const senderFlags = apiResult?.sender_flags     ?? [];
  const heatmap     = apiResult?.heatmap          ?? result?.matches?.map(m => ({
    start: m.index,
    end: m.index + m.text.length,
    text: m.text,
    severity: m.severity,
    reason: m.reason
  })) ?? [];

  return (
    <div className="min-h-screen bg-surface text-ink-primary font-sans p-6 sm:p-8">
      <Header />

      <div className="max-w-[1100px] mx-auto space-y-4">
        {/* Input */}
        <InputPanel 
          onAnalyze={handleAnalyze} 
          onAnalyzeFile={(file) => analyzeFile(file)}
          isAnalyzing={isRunning} 
        />

        {/* Action Bar */}
        {result && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-[12px] text-ink-muted">
              <ShieldCheck size={14} className="text-risk-blue" />
              <span>Live Forensic Shield Active</span>
            </div>
            <button
              onClick={() => exportAudit(currentText)}
              className="flex items-center gap-2 bg-surface-hover hover:bg-[#20242e] text-ink-secondary border border-surface-border text-[12px] font-medium px-4 py-2 rounded-[9px] transition-all"
            >
              <FileDown size={14} />
              Download Legal Bundle (PDF)
            </button>
          </div>
        )}

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
          <ScorePanel key={`score-${runKey}`} result={result} />
          
          <div className="space-y-4">
            {/* Heatmap Section */}
            {heatmap.length > 0 && (
              <div className="bg-surface-card border border-surface-border rounded-[16px] p-5">
                <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted mb-3">
                  Evidentiary Heatmap
                </div>
                <ForensicHeatmap text={apiResult?.text || currentText} matches={heatmap} />
              </div>
            )}
            
            <BreakdownPanel key={`breakdown-${runKey}`} result={result} />
            
            {/* Dispute Letter (Offensive Shield) */}
            {apiResult?.dispute_letter && (
              <DisputePanel letter={apiResult.dispute_letter} />
            )}
          </div>
        </div>

        {/* Forensics */}
        {(urls.length > 0 || phones.length > 0 || senderFlags.length > 0) && (
          <ForensicsPanel
            key={`forensics-${runKey}`}
            urls={urls}
            phones={phones}
            senderFlags={senderFlags}
          />
        )}

        {/* API loading indicator */}
        {apiLoading && (
          <div className="flex items-center gap-2 text-[12px] text-ink-muted animate-fade-in">
            <div className="w-3 h-3 border border-ink-muted border-t-transparent rounded-full animate-spin" />
            Generating Deep Forensics Report…
          </div>
        )}
      </div>
    </div>
  );
}
