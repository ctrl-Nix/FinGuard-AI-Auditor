import React from "react";
import { ShieldCheck, Zap, Globe, ArrowRight, MousePointer2, Smartphone } from "lucide-react";

/**
 * WelcomeView — Cinematic Landing Page
 * High-impact introduction to FinGuard 3.0.
 */
export default function WelcomeView({ onEnter }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Background Aura */}
      <div className="absolute inset-0 z-[-1]">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-red-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Hero */}
      <div className="max-w-[900px] mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 mb-8 animate-bento">
          <Zap size={14} className="text-blue-500" />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/60">Version 3.0 Live</span>
        </div>
        
        <h1 className="text-[56px] md:text-[84px] font-black tracking-tighter leading-[0.95] mb-8">
          The Citizen’s <br />
          <span className="text-blue-500">Financial Shield.</span>
        </h1>
        
        <p className="text-[18px] md:text-[22px] text-white/60 font-medium max-w-[600px] mx-auto leading-relaxed mb-12">
          Stop scams, hidden fees, and legal traps before they hit your wallet. <br className="hidden md:block" />
          Professional-grade forensics for everyone.
        </p>

        <button 
          onClick={onEnter}
          className="group relative inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-[24px] font-black text-[18px] transition-all shadow-[0_20px_50px_rgba(0,122,255,0.3)] active:scale-95"
        >
          Initialize Auditor
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Feature Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1000px] w-full">
        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-left hover:bg-white/[0.05] transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-blue-600/20 flex items-center justify-center mb-6">
            <MousePointer2 size={24} className="text-blue-500" />
          </div>
          <h3 className="text-[20px] font-bold mb-2">Deep Forensics</h3>
          <p className="text-[14px] text-white/50 leading-relaxed font-medium">
            AI-powered pattern matching detects hidden costs buried in legal jargon.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-left hover:bg-white/[0.05] transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-red-600/20 flex items-center justify-center mb-6">
            <Smartphone size={24} className="text-red-500" />
          </div>
          <h3 className="text-[20px] font-bold mb-2">Snap-to-Audit</h3>
          <p className="text-[14px] text-white/50 leading-relaxed font-medium">
            Point your camera at any paper contract to reveal its secrets instantly.
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[32px] p-8 text-left hover:bg-white/[0.05] transition-all">
          <div className="w-12 h-12 rounded-[16px] bg-green-600/20 flex items-center justify-center mb-6">
            <Globe size={24} className="text-green-500" />
          </div>
          <h3 className="text-[20px] font-bold mb-2">Global Vault</h3>
          <p className="text-[14px] text-white/50 leading-relaxed font-medium">
            Real-time intelligence synced from a community of thousands.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-20 flex items-center gap-8 text-[11px] font-bold text-white/20 uppercase tracking-widest">
        <span>Military Grade Encryption</span>
        <div className="w-1 h-1 rounded-full bg-white/10" />
        <span>Open Source Integrity</span>
        <div className="w-1 h-1 rounded-full bg-white/10" />
        <span>Zero Data Mining</span>
      </div>
    </div>
  );
}
