import { useEffect } from "react";
import Header         from "./components/Header.jsx";
import InputPanel     from "./components/InputPanel.jsx";
import ScorePanel     from "./components/ScorePanel.jsx";
import BreakdownPanel from "./components/BreakdownPanel.jsx";
import ForensicsPanel from "./components/ForensicsPanel.jsx";
import { useAnalysis }  from "./hooks/useAnalysis.js";
import { DEMOS }        from "./engine/analyzer.js";

export default function App() {
  const { result, isRunning, apiResult, apiLoading, runKey, analyze } = useAnalysis();

  // Auto-run on mount with demo text
  useEffect(() => {
    const timer = setTimeout(() => analyze(DEMOS.bad_contract.text), 400);
    return () => clearTimeout(timer);
  }, [analyze]);

  // Merge client result with server result for forensics data
  // Server result has richer extraction; fall back to empty arrays
  const urls        = apiResult?.extracted_urls   ?? [];
  const phones      = apiResult?.extracted_phones ?? [];
  const senderFlags = apiResult?.sender_flags     ?? [];

  return (
    <div className="min-h-screen bg-surface text-ink-primary font-sans p-6 sm:p-8">
      <Header />

      <div className="max-w-[1100px] mx-auto space-y-4">
        {/* Input */}
        <InputPanel onAnalyze={(text) => analyze(text)} isAnalyzing={isRunning} />

        {/* Main dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 items-start">
          <ScorePanel key={`score-${runKey}`} result={result} />
          <BreakdownPanel key={`breakdown-${runKey}`} result={result} />
        </div>

        {/* Forensics — only shown when we have server data or URLs from the engine */}
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
            Fetching enriched analysis from backend…
          </div>
        )}
      </div>
    </div>
  );
}
