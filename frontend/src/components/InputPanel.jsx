import { useState, useRef } from "react";
import { Play, FileText, MessageSquare, AlertTriangle, CheckCircle, Upload, Paperclip } from "lucide-react";
import { DEMOS } from "../engine/analyzer.js";

export default function InputPanel({ onAnalyze, onAnalyzeFile, isAnalyzing }) {
  const [text, setText] = useState(DEMOS.bad_contract.text);
  const fileInputRef = useRef(null);

  const handleDemo = (key) => {
    setText(DEMOS[key].text);
    setTimeout(() => onAnalyze(DEMOS[key].text), 50);
  };

  const handleRun = () => {
    if (text.trim()) onAnalyze(text);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onAnalyzeFile(file);
    }
  };

  const handleKey = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleRun();
  };

  const demoButtons = [
    { key: "bad_contract", icon: FileText,      label: "Bad Contract" },
    { key: "phishing",     icon: MessageSquare, label: "Phishing SMS"  },
    { key: "laundering",   icon: AlertTriangle, label: "Laundering"    },
    { key: "clean",        icon: CheckCircle,   label: "Clean Doc"     },
  ];

  return (
    <div className="bg-surface-card border border-surface-border rounded-[16px] p-5">
      {/* Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted">
          Document or Message
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 text-risk-blue hover:text-blue-400 text-[11px] font-medium transition-colors"
        >
          <Paperclip size={12} />
          Upload PDF/Image
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
        />
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Paste text here or upload a file above..."
        rows={6}
        className="w-full bg-surface-deep border border-surface-border rounded-[10px] text-ink-secondary text-[13px] leading-relaxed p-3.5 resize-y focus:border-risk-blue transition-colors duration-200 placeholder:text-ink-faint font-sans"
      />

      {/* Button row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={isAnalyzing || !text.trim()}
          className="flex items-center gap-2 bg-risk-blue hover:bg-blue-600 disabled:opacity-40 text-white text-[13px] font-medium px-4 py-2 rounded-[9px] transition-all duration-150 active:scale-[0.98]"
        >
          <Play size={13} />
          {isAnalyzing ? "Analyzing…" : "Run Analysis"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isAnalyzing}
          className="flex items-center gap-2 bg-surface-hover hover:bg-[#20242e] text-ink-secondary border border-surface-border text-[13px] font-medium px-4 py-2 rounded-[9px] transition-all duration-150 active:scale-[0.98]"
        >
          <Upload size={13} />
          Upload File
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-surface-border mx-1" />

        {/* Demo presets */}
        {demoButtons.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => handleDemo(key)}
            className="flex items-center gap-1.5 bg-surface-hover hover:bg-[#20242e] text-ink-muted hover:text-ink-secondary border border-surface-border text-[12px] font-medium px-3 py-2 rounded-[8px] transition-all duration-150"
          >
            <Icon size={11} />
            {label}
          </button>
        ))}

        {/* Keyboard hint */}
        <span className="ml-auto text-[11px] text-ink-faint font-mono hidden sm:inline">
          ⌘↵ to run
        </span>
      </div>
    </div>
  );
}
