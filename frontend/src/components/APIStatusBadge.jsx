import { useState, useEffect } from "react";
import { Server, WifiOff, Wifi } from "lucide-react";
import { healthCheck } from "../lib/api.js";

/**
 * Small badge showing whether the FastAPI backend is reachable.
 * Auto-pings every 30s. Purely informational — the app works
 * fully offline using the client-side engine.
 */
export default function APIStatusBadge() {
  const [status, setStatus] = useState("checking"); // "online"|"offline"|"checking"

  const ping = async () => {
    setStatus("checking");
    try {
      await healthCheck();
      setStatus("online");
    } catch {
      setStatus("offline");
    }
  };

  useEffect(() => {
    ping();
    const id = setInterval(ping, 30_000);
    return () => clearInterval(id);
  }, []);

  const configs = {
    checking: { color: "#4a5060", bg: "rgba(74,80,96,0.12)",  border: "rgba(74,80,96,0.25)",  Icon: Server,  label: "Connecting…"  },
    online:   { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)", Icon: Wifi,    label: "API Online"   },
    offline:  { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)",Icon: WifiOff, label: "Local Mode"   },
  };

  const cfg = configs[status];

  return (
    <button
      onClick={ping}
      title={status === "offline" ? "Backend not running — using local engine" : "Click to refresh API status"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border font-mono tracking-wide cursor-pointer transition-all duration-200 hover:opacity-80"
      style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
    >
      <cfg.Icon size={10} />
      {cfg.label}
    </button>
  );
}
