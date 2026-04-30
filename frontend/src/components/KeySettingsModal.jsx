import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Save, X, AlertCircle, Shield } from "lucide-react";

export default function KeySettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("FINGUARD_API_KEY");
    if (stored) setApiKey(stored);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("FINGUARD_API_KEY", apiKey);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-[500px] bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                <Key size={20} />
              </div>
              <h3 className="text-[20px] font-black text-[#0F172A] tracking-tight">BYOK Protocol</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <p className="text-[15px] text-slate-500 leading-relaxed font-medium">
                Enter your <span className="text-blue-600 font-bold">Google Gemini API Key</span> to bypass system rate limits and use your own infrastructure.
              </p>
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl flex gap-4">
                <Shield className="text-blue-600 shrink-0" size={20} />
                <p className="text-[12px] text-blue-700 font-medium">
                  Your key is stored locally in your browser and never sent to our servers directly, only to the AI engine for your audit.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Configuration Key</label>
              <div className="relative">
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="AI_CORE_PROT_..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-6 py-5 text-[15px] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            <button 
              onClick={handleSave}
              className={`w-full py-5 rounded-[20px] font-bold text-[17px] flex items-center justify-center gap-3 transition-all ${
                saved ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-[#0F172A] text-white shadow-slate-200'
              } shadow-xl active:scale-95`}
            >
              {saved ? (
                <><AlertCircle size={20} /> Protocol Updated</>
              ) : (
                <><Save size={20} /> Deploy Configuration</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
