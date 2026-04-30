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
    <div className="finvera-card !p-0 overflow-hidden group shadow-xl shadow-slate-200/40">
      <div className="relative">
        {/* Finvera Light Toolbar */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 relative z-10 bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 flex items-center justify-center border border-emerald-600/20">
              <Zap size={18} className="text-emerald-600" fill="currentColor" />
            </div>
            <div>
              <span className="text-[14px] font-bold tracking-tight text-[#0F172A]">Forensic Protocol</span>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Secure Instance</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {Object.keys(DEMOS).map((key) => (
              <button 
                key={key}
                onClick={() => handleDemo(key)}
                className="text-[10px] font-bold px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all uppercase tracking-widest text-slate-600 shadow-sm"
              >
                {key.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Editor Area */}
        <div className="relative p-10 bg-white">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Input documentation for forensic analysis..."
            className="w-full h-[240px] bg-transparent border-none outline-none resize-none text-[18px] font-medium leading-relaxed text-[#0F172A] placeholder:text-slate-300 custom-scrollbar"
          />
        </div>

        {/* Controls */}
        <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setIsCameraOpen(true)}
              className="flex items-center gap-3 text-emerald-600 hover:text-emerald-700 transition-colors group/btn"
            >
              <Camera size={22} />
              <span className="text-[13px] font-bold uppercase tracking-widest">Optical Scan</span>
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 text-slate-400 hover:text-slate-600 transition-colors group/btn"
            >
              <Paperclip size={20} />
              <span className="text-[13px] font-bold uppercase tracking-widest">Evidence</span>
            </button>
          </div>

          <button 
            disabled={isAnalyzing || !text.trim()}
            onClick={() => onAnalyze(text)}
            className={`finvera-btn-primary ${isAnalyzing || !text.trim() ? 'opacity-30' : ''}`}
          >
            {isAnalyzing ? "Analyzing Signal..." : "Verify Forensic Pattern"}
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
