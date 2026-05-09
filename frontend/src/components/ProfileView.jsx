import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Clock, LogOut, Key, Mail, ChevronRight } from "lucide-react";
import { supabase } from "../lib/supabase";

/**
 * ProfileView — Bento Glass Style
 * User's Audit History and Security Profile.
 */
export default function ProfileView({ message }) {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) fetchHistory(user.id);
  }

  async function fetchHistory(userId) {
    const { data, error } = await supabase
      .from('user_audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error) setHistory(data || []);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setAuthMessage("");
    
    // Magic Link Login — Easiest for beginners!
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthMessage("Error: " + error.message);
    } else {
      setAuthMessage("Check your email for the login link!");
    }
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    setHistory([]);
  }

  if (!user) {
    return (
      <div className="max-w-[450px] mx-auto animate-bento">
        <div className="text-center mb-8 md:mb-10 px-2">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-risk-blue rounded-[20px] md:rounded-[24px] flex items-center justify-center mx-auto mb-5 md:mb-6 shadow-2xl">
            <User size={34} className="text-white" />
          </div>
          <h2 className="text-[28px] md:text-[32px] font-black tracking-tight md:tracking-tighter mb-2">Secure Login</h2>
          <p className="text-[15px] text-ink-secondary font-medium">
            {message || "Log in to save your audit history and sync across devices."}
          </p>
        </div>

        <div className="glass-card">
          <form onSubmit={handleLogin} className="bento-inner">
            <span className="ios-label">Magic Link Login</span>
            <div className="relative mb-4">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" size={18} />
              <input 
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/[0.05] border border-white/[0.1] rounded-[18px] py-4 pl-12 pr-4 outline-none focus:border-risk-blue transition-all text-[16px]"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="iphone-btn bg-risk-blue text-white w-full py-4 shadow-[0_8px_20px_rgba(0,122,255,0.3)]"
            >
              {loading ? "Sending..." : "Send Login Link"}
            </button>
            {authMessage && (
              <p className="mt-4 text-center text-[13px] text-ink-secondary font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                {authMessage}
              </p>
            )}
          </form>
        </div>

        <div className="mt-6 md:mt-8 flex items-start gap-3 p-4 bg-white/[0.02] border border-slate-100 rounded-[20px] md:rounded-[22px]">
          <Key size={18} className="text-risk-blue mt-0.5 shrink-0" />
          <p className="text-[12px] text-ink-muted leading-relaxed">
            We use <strong>Passwordless Auth</strong>. No need to remember a password—just click the link we send to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-bento">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 md:gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-4 md:gap-5 min-w-0">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/[0.05] rounded-[20px] md:rounded-[24px] border border-slate-100 flex items-center justify-center shadow-2xl shrink-0">
            <img 
              src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.email}`} 
              alt="Avatar" 
              className="w-11 h-11 md:w-14 md:h-14"
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-[22px] md:text-[28px] font-black tracking-tight leading-none mb-1 truncate">{user.email.split('@')[0]}</h2>
            <span className="text-[13px] md:text-[14px] font-bold text-ink-muted break-all">{user.email}</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="iphone-btn bg-white/5 text-ink-secondary hover:bg-risk-red/10 hover:text-risk-red border border-slate-100 w-full md:w-auto"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6">
        {/* Profile Stats */}
        <div className="glass-card">
          <div className="bento-inner">
            <span className="ios-label">Security Profile</span>
            <div className="space-y-6 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-ink-secondary">Trust Level</span>
                <span className="text-[14px] font-bold text-risk-green">Gold Citizen</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-ink-secondary">Audits Performed</span>
                <span className="text-[14px] font-bold text-ink-primary">{history.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-medium text-ink-secondary">Account Status</span>
                <span className="text-[14px] font-bold text-risk-blue">Active</span>
              </div>
            </div>
            
            <div className="mt-10 p-4 bg-risk-blue/5 rounded-[20px] border border-risk-blue/10">
              <ShieldCheck size={24} className="text-risk-blue mb-2" />
              <p className="text-[12px] text-ink-secondary font-medium leading-relaxed">
                Your profile is protected by <strong>256-bit Cloud Encryption</strong>. Only you can access your audit history.
              </p>
            </div>
          </div>
        </div>

        {/* Audit History */}
        <div className="glass-card">
          <div className="bento-inner">
            <div className="flex items-center justify-between mb-6">
              <span className="ios-label !mb-0">Audit History</span>
              <button className="text-[12px] font-bold text-risk-blue flex items-center gap-1">
                View All <ChevronRight size={14} />
              </button>
            </div>

            {history.length === 0 ? (
              <div className="py-20 text-center bg-white/[0.02] rounded-[24px] border border-dashed border-white/10">
                <Clock size={40} className="text-ink-faint mx-auto mb-4" />
                <p className="text-ink-secondary font-medium">No history found.</p>
                <p className="text-ink-muted text-[13px]">Your future audits will be saved here automatically.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((audit) => (
                  <div key={audit.id} className="group bg-white/[0.03] border border-slate-100 rounded-[20px] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.06] transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center ${audit.score > 70 ? 'bg-risk-red/20 text-risk-red' : 'bg-risk-green/20 text-risk-green'}`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[15px] font-bold text-ink-primary truncate">{audit.file_name || "Text Audit"}</div>
                        <div className="text-[11px] text-ink-muted font-medium">{new Date(audit.created_at).toLocaleDateString()} at {new Date(audit.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[18px] font-black tracking-tighter" style={{ color: audit.score > 70 ? '#ff3b30' : '#34c759' }}>
                        {audit.score}%
                      </div>
                      <div className="text-[10px] font-bold uppercase text-ink-muted">{audit.verdict_label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
