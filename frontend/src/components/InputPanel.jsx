import React, { useState, useRef } from "react";
import { Play, FileText, MessageSquare, AlertTriangle, CheckCircle, Upload, Paperclip, Camera, X, Zap } from "lucide-react";
import { DEMOS } from "../engine/analyzer.js";
import CameraModal from "./CameraModal.jsx";

/**
 * InputPanel — Bento Glass Style
 * iPhone-inspired editor view.
 */
export default function InputPanel({ onAnalyze, onAnalyzeFile, isAnalyzing }) {
  const [text, setText] = useState(DEMOS.bad_contract.text);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleDemo = (key) => {
    setText(DEMOS[key].text);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) onAnalyzeFile(file);
  };

  return (
    <div className="glass-card animate-bento overflow-hidden">
      <div className="bento-inner !p-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[10px] bg-risk-blue flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="text-[14px] font-bold tracking-tight">AI Auditor</span>
          </div>
          
          <div className="flex items-center gap-2">
            {Object.keys(DEMOS).map((key) => (
              <button 
                key={key}
                onClick={() => handleDemo(key)}
                className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.05] transition-all"
              >
                {key.replace("_", " ").toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative p-6">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text here or use the camera..."
            className="w-full h-[180px] bg-transparent border-none outline-none resize-none text-[17px] leading-relaxed text-ink-primary placeholder:text-ink-muted custom-scrollbar"
          />
        </div>

        {/* Bottom Bar */}
        <div className="p-4 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-2 text-risk-blue hover:opacity-80 transition-opacity"
            >
              <Camera size={20} />
              <span className="text-[13px] font-bold">Camera</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 text-ink-secondary hover:text-ink-primary transition-colors"
            >
              <Paperclip size={18} />
              <span className="text-[13px] font-bold">Attach</span>
            </button>
          </div>

          <button 
            disabled={isAnalyzing || !text.trim()}
            onClick={() => onAnalyze(text)}
            className={`iphone-btn ${isAnalyzing || !text.trim() ? 'bg-white/10 text-ink-muted' : 'bg-risk-blue text-white shadow-[0_4px_15px_rgba(0,122,255,0.4)]'}`}
          >
            {isAnalyzing ? "Scanning..." : "Audit Now"}
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.docx,.png,.jpg,.jpeg,.webp"
      />

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={(blob) => {
          const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });
          onAnalyzeFile(file);
        }}
      />
    </div>
  );
}
