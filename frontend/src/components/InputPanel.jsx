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
    <div className="cyber-card overflow-hidden group">
      <div className="relative">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
           <div className="h-px w-full bg-blue-500 absolute top-12"></div>
           <div className="w-px h-full bg-blue-500 absolute left-12"></div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Zap size={16} className="text-blue-400" fill="currentColor" />
            </div>
            <div>
              <span className="text-[13px] font-black tracking-widest uppercase glow-text">Analysis Engine</span>
              <div className="text-[9px] font-bold text-white/20 uppercase tracking-[0.2em]">Ready for input</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {Object.keys(DEMOS).map((key) => (
              <button 
                key={key}
                onClick={() => handleDemo(key)}
                className="text-[10px] font-black px-4 py-2 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/20 transition-all uppercase tracking-widest"
              >
                {key.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative p-10">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste raw data or capture forensic evidence..."
            className="w-full h-[220px] bg-transparent border-none outline-none resize-none text-[19px] mono-data leading-relaxed text-white/90 placeholder:text-white/10 custom-scrollbar"
          />
          {/* Scanline overlay only inside textarea area */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
        </div>

        {/* Bottom Bar */}
        <div className="px-8 py-6 border-t border-white/5 bg-black/20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-2.5 text-blue-400 hover:text-blue-300 transition-colors group/btn"
            >
              <div className="p-2 rounded-lg bg-blue-400/5 group-hover/btn:bg-blue-400/10 transition-colors">
                <Camera size={20} />
              </div>
              <span className="text-[12px] font-black uppercase tracking-widest">Scanner</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2.5 text-white/40 hover:text-white/80 transition-colors group/btn"
            >
              <div className="p-2 rounded-lg bg-white/5 group-hover/btn:bg-white/10 transition-colors">
                <Paperclip size={20} />
              </div>
              <span className="text-[12px] font-black uppercase tracking-widest">Evidence</span>
            </button>
          </div>

          <button 
            disabled={isAnalyzing || !text.trim()}
            onClick={() => onAnalyze(text)}
            className={`px-10 py-4 rounded-full font-black text-[13px] uppercase tracking-[0.2em] transition-all relative group overflow-hidden ${isAnalyzing || !text.trim() ? 'bg-white/5 text-white/20' : 'btn-primary'}`}
          >
            {isAnalyzing ? (
              <span className="flex items-center gap-3">
                <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Analyzing...
              </span>
            ) : "Begin Audit"}
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
