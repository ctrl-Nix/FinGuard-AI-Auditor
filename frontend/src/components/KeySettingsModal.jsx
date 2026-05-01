import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Key, Save, X, AlertCircle, Shield, Cpu, Zap, Box } from "lucide-react";

const PROVIDERS = [
  { 
    id: "gemini", 
    name: "Google Gemini", 
    icon: Zap, 
    color: "blue",
    models: ["gemini-2.0-flash", "gemini-2.0-pro-exp-02-05", "gemini-1.5-flash", "gemini-1.5-pro"]
  },
  { 
    id: "openai", 
    name: "OpenAI", 
    icon: Box, 
    color: "emerald",
    models: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"]
  },
  { 
    id: "anthropic", 
    name: "Anthropic", 
    icon: Cpu, 
    color: "orange",
    models: ["claude-3-5-sonnet-latest", "claude-3-5-haiku-latest", "claude-3-opus-latest"]
  }
];

export default function KeySettingsModal({ isOpen, onClose }) {
  const [activeProvider, setActiveProvider] = useState("gemini");
  const [keys, setKeys] = useState({
    gemini: "",
    openai: "",
    anthropic: ""
  });
  const [models, setModels] = useState({
    gemini: "gemini-2.0-flash",
    openai: "gpt-4o",
    anthropic: "claude-3-5-sonnet-latest"
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKeys = localStorage.getItem("FINGUARD_KEYS");
    const storedModels = localStorage.getItem("FINGUARD_MODELS");
    const storedProvider = localStorage.getItem("FINGUARD_ACTIVE_PROVIDER");
    
    if (storedKeys) setKeys(JSON.parse(storedKeys));
    if (storedModels) setModels(JSON.parse(storedModels));
    if (storedProvider) setActiveProvider(storedProvider);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem("FINGUARD_KEYS", JSON.stringify(keys));
    localStorage.setItem("FINGUARD_MODELS", JSON.stringify(models));
    localStorage.setItem("FINGUARD_ACTIVE_PROVIDER", activeProvider);
    
    // For backward compatibility or if backend only expects one key for now
    localStorage.setItem("FINGUARD_API_KEY", keys[activeProvider]);
    
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
          className="relative w-full max-w-[600px] bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-slate-50 px-10 py-8 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center text-white shadow-lg shadow-slate-200">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-[20px] font-black text-[#0F172A] tracking-tight leading-none">Universal BYOK</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Multi-Provider Protocol</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* Provider Selector */}
            <div className="grid grid-cols-3 gap-4">
              {PROVIDERS.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => setActiveProvider(provider.id)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all ${
                    activeProvider === provider.id 
                      ? `border-${provider.color}-500 bg-${provider.color}-50 text-${provider.color}-700 shadow-md` 
                      : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <provider.icon size={24} />
                  <span className="text-[11px] font-black uppercase tracking-wider">{provider.name.split(' ')[1] || provider.name}</span>
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-4">
              <Shield className="text-slate-400 shrink-0" size={20} />
              <p className="text-[12px] text-slate-500 font-medium">
                Keys are stored locally in your browser. Select your preferred provider and model for high-fidelity forensics.
              </p>
            </div>

            <div className="space-y-6">
              {/* Key Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">
                  {PROVIDERS.find(p => p.id === activeProvider).name} API Key
                </label>
                <div className="relative">
                  <input 
                    type="password"
                    value={keys[activeProvider]}
                    onChange={(e) => setKeys({...keys, [activeProvider]: e.target.value})}
                    placeholder={`${activeProvider.toUpperCase()}_SECRET_KEY...`}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-6 py-5 text-[15px] focus:ring-4 focus:ring-[#0F172A]/5 focus:border-[#0F172A] outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* Model Selector */}
              <div className="space-y-3">
                <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Active Model</label>
                <select
                  value={models[activeProvider]}
                  onChange={(e) => setModels({...models, [activeProvider]: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-6 py-5 text-[15px] focus:ring-4 focus:ring-[#0F172A]/5 focus:border-[#0F172A] outline-none appearance-none cursor-pointer"
                >
                  {PROVIDERS.find(p => p.id === activeProvider).models.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
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
