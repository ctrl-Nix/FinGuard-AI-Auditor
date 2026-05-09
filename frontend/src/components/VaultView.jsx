import React, { useState, useEffect } from "react";
import { ShieldCheck, Globe, Zap, AlertTriangle } from "lucide-react";
import { supabase } from "../lib/supabase";

/**
 * VaultView — Bento Glass Style
 * Real-time Global Scam Reports from the community.
 */
export default function VaultView() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
    
    // Subscribe to new reports in real-time!
    const channel = supabase
      .channel('scam_reports_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scam_reports' }, payload => {
        setReports(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchReports() {
    try {
      const { data, error } = await supabase
        .from('scam_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setReports(data || []);
    } catch (e) {
      console.error("Vault Error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-bento">
      <div className="text-center mb-8 md:mb-10 px-2">
        <h2 className="text-[30px] md:text-[36px] font-black tracking-tight md:tracking-tighter mb-2">Global Scam Vault</h2>
        <p className="text-[15px] md:text-[17px] text-ink-secondary font-medium">Real-time intelligence from the FinGuard community.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Statistics Tile */}
        <div className="glass-card md:col-span-2">
          <div className="bento-inner">
            <span className="ios-label">Network Intelligence</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3 mt-4">
              <div className="text-center">
                <div className="text-[32px] font-black text-risk-red">{reports.length}+</div>
                <div className="text-[11px] font-bold text-ink-muted uppercase">Scams Blocked Today</div>
              </div>
              <div className="hidden sm:block h-10 w-[1px] bg-slate-200 justify-self-center" />
              <div className="text-center">
                <div className="text-[32px] font-black text-risk-blue">99.8%</div>
                <div className="text-[11px] font-bold text-ink-muted uppercase">Detection Accuracy</div>
              </div>
              <div className="hidden sm:block h-10 w-[1px] bg-slate-200 justify-self-center" />
              <div className="text-center">
                <div className="text-[28px] md:text-[32px] font-black text-risk-green">Global</div>
                <div className="text-[11px] font-bold text-ink-muted uppercase">Coverage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Map Placeholder Tile */}
        <div className="glass-card">
          <div className="bento-inner items-center justify-center text-center">
            <Globe size={48} className="text-risk-blue mb-4 opacity-50" />
            <span className="ios-label">Live Threat Map</span>
            <p className="text-[13px] text-ink-muted">Coming soon: See scams as they happen in your city.</p>
          </div>
        </div>

        {/* Recent Reports List */}
        <div className="glass-card md:col-span-3">
          <div className="bento-inner">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <span className="ios-label !mb-0">Recent Community Reports</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-risk-red animate-pulse" />
                <span className="text-[11px] font-bold text-ink-muted uppercase">Live Updates Enabled</span>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-4 border-risk-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-ink-muted">Syncing with Cloud Brain...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="py-20 text-center bg-white/[0.02] rounded-[20px] border border-dashed border-white/10">
                <ShieldCheck size={48} className="text-ink-faint mx-auto mb-4" />
                <p className="text-ink-secondary font-medium">The vault is currently clear.</p>
                <p className="text-ink-muted text-[13px]">Scams reported by the public will appear here in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map((report) => (
                  <div key={report.id} className="bg-white/[0.03] border border-slate-100 rounded-[20px] md:rounded-[22px] p-4 flex items-start gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-[12px] bg-risk-red/20 flex items-center justify-center shrink-0">
                      <AlertTriangle size={20} className="text-risk-red" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <span className="text-[12px] font-bold text-risk-red uppercase tracking-tight">{report.verdict}</span>
                        <span className="text-[10px] text-ink-muted font-mono">{new Date(report.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[14px] text-ink-secondary leading-snug line-clamp-2 italic">
                        "{report.text}"
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Zap size={10} className="text-ink-muted" />
                        <span className="text-[10px] text-ink-muted uppercase font-bold">{report.location || "Unknown Origin"}</span>
                      </div>
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
