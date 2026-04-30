import { Link, Phone, AlertOctagon, CheckCircle, ShieldAlert, ShieldOff } from "lucide-react";

const URL_RISK_CONFIG = {
  safe:       { color: "#22c55e", label: "Safe",       Icon: CheckCircle  },
  shortened:  { color: "#f59e0b", label: "Shortened",  Icon: ShieldAlert  },
  suspicious: { color: "#ef4444", label: "Suspicious", Icon: ShieldOff    },
};

function UrlCard({ url, risk, domain }) {
  const cfg = URL_RISK_CONFIG[risk] || URL_RISK_CONFIG.suspicious;
  return (
    <div className="flex items-start gap-2.5 bg-surface-deep border border-surface-border rounded-[9px] p-2.5 hover:border-surface-hover transition-colors">
      <cfg.Icon size={13} className="mt-0.5 shrink-0" style={{ color: cfg.color }} />
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[11px] truncate text-ink-secondary">{url}</div>
        <div className="text-[11px] text-ink-muted mt-0.5">{domain}</div>
      </div>
      <span
        className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{ background: `${cfg.color}18`, color: cfg.color }}
      >
        {cfg.label}
      </span>
    </div>
  );
}

function PhoneChip({ phone }) {
  return (
    <div className="flex items-center gap-2 bg-surface-deep border border-surface-border rounded-[9px] px-3 py-2">
      <Phone size={11} style={{ color: "#ef4444" }} />
      <span className="font-mono text-[12px] text-risk-red">{phone}</span>
    </div>
  );
}

function SpoofChip({ flag }) {
  return (
    <div className="flex items-start gap-2 bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-[9px] p-2.5">
      <AlertOctagon size={12} className="mt-0.5 shrink-0 text-risk-red" />
      <span className="text-[12px] text-ink-secondary leading-relaxed">{flag}</span>
    </div>
  );
}

/**
 * Shows extracted URLs, phone numbers, and sender-spoofing flags.
 * Receives data either from the client-side analyzer or the API response.
 */
export default function ForensicsPanel({ urls = [], phones = [], senderFlags = [] }) {
  const hasUrls   = urls.length > 0;
  const hasPhones = phones.length > 0;
  const hasSpoof  = senderFlags.length > 0;

  if (!hasUrls && !hasPhones && !hasSpoof) return null;

  return (
    <div className="bg-surface-card border border-surface-border rounded-[16px] p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Link size={13} className="text-ink-muted" />
        <div className="text-[11px] font-medium tracking-[1.2px] uppercase text-ink-muted">
          Forensics
        </div>
      </div>

      <div className={`grid gap-4 ${[hasUrls, hasPhones, hasSpoof].filter(Boolean).length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {hasUrls && (
          <div>
            <div className="text-[11px] text-ink-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Link size={10} />
              URLs ({urls.length})
            </div>
            <div className="flex flex-col gap-1.5">
              {urls.map((u, i) => <UrlCard key={i} {...(typeof u === "string" ? { url: u, risk: "suspicious", domain: u } : u)} />)}
            </div>
          </div>
        )}

        {hasPhones && (
          <div>
            <div className="text-[11px] text-ink-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Phone size={10} />
              Numbers ({phones.length})
            </div>
            <div className="flex flex-col gap-1.5">
              {phones.map((p, i) => <PhoneChip key={i} phone={p} />)}
            </div>
          </div>
        )}

        {hasSpoof && (
          <div className={hasUrls || hasPhones ? "md:col-span-2" : ""}>
            <div className="text-[11px] text-ink-muted uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <AlertOctagon size={10} />
              Spoofing Detected
            </div>
            <div className="flex flex-col gap-1.5">
              {senderFlags.map((f, i) => <SpoofChip key={i} flag={f} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
