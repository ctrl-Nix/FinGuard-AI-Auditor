import React from "react";
import { Link, Phone, AlertOctagon, CheckCircle, ShieldAlert, ShieldOff, Globe } from "lucide-react";

const URL_RISK_CONFIG = {
  safe:       { color: "#34c759", label: "Safe",       Icon: CheckCircle  },
  shortened:  { color: "#ff9500", label: "Shortened",  Icon: ShieldAlert  },
  suspicious: { color: "#ff3b30", label: "Suspicious", Icon: ShieldOff    },
};

function UrlCard({ url, risk, domain, reputation }) {
  const cfg = URL_RISK_CONFIG[risk] || URL_RISK_CONFIG.suspicious;
  return (
    <div className="bg-white/[0.03] border border-white/[0.05] rounded-[20px] p-4 hover:border-white/[0.1] transition-all">
      <div className="flex items-start gap-3">
        <div 
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${cfg.color}15` }}
        >
          <cfg.Icon size={18} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="ios-label !mb-0">{domain}</div>
          <div className="font-mono text-[12px] truncate text-ink-primary mt-1">{url}</div>
        </div>
        <span
          className="shrink-0 text-[10px] font-black uppercase px-3 py-1 rounded-full border"
          style={{ borderColor: `${cfg.color}33`, color: cfg.color, backgroundColor: `${cfg.color}11` }}
        >
          {cfg.label}
        </span>
      </div>
      
      {reputation && (
        <div className="mt-4 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-tight">Trust Score</span>
            <span className="text-[15px] font-black" style={{ color: reputation.score < 50 ? "#ff3b30" : "#34c759" }}>
              {reputation.score}/100
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-ink-muted uppercase tracking-tight">Origin</span>
            <span className="text-[15px] font-bold text-ink-primary flex items-center gap-1">
              <Globe size={12} /> {reputation.origin || "Global"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ForensicsPanel({ urls = [], phones = [], senderFlags = [] }) {
  const hasUrls   = urls && urls.length > 0;
  const hasPhones = phones && phones.length > 0;
  const hasSpoof  = senderFlags && senderFlags.length > 0;

  if (!hasUrls && !hasPhones && !hasSpoof) return null;

  return (
    <div className="glass-card animate-bento">
      <div className="bento-inner">
        <span className="ios-label">Deep Forensics</span>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hasUrls && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-ink-muted">
                <Link size={14} />
                <span className="text-[11px] font-extrabold uppercase tracking-widest">URLs ({urls.length})</span>
              </div>
              <div className="space-y-3">
                {urls.map((u, i) => <UrlCard key={i} {...(typeof u === "string" ? { url: u, risk: "suspicious", domain: u } : u)} />)}
              </div>
            </div>
          )}

          <div className="space-y-6">
            {hasPhones && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <Phone size={14} />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest">Phone Numbers ({phones.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phones.map((p, i) => (
                    <div key={i} className="bg-white/[0.04] border border-white/[0.05] rounded-[14px] px-4 py-2 flex items-center gap-2">
                      <Phone size={12} className="text-risk-red" />
                      <span className="font-mono text-[14px] font-bold text-ink-primary">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasSpoof && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-ink-muted">
                  <AlertOctagon size={14} />
                  <span className="text-[11px] font-extrabold uppercase tracking-widest">Spoofing Detection</span>
                </div>
                <div className="space-y-3">
                  {senderFlags.map((f, i) => (
                    <div key={i} className="bg-risk-red/5 border border-risk-red/10 rounded-[18px] p-4 flex items-start gap-3">
                      <AlertOctagon size={18} className="text-risk-red shrink-0" />
                      <span className="text-[14px] font-medium text-ink-primary leading-snug">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
