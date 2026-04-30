import { useEffect, useRef, useState } from "react";

function AnimatedCount({ value, color }) {
  const [displayed, setDisplayed] = useState(0);
  const raf = useRef(null);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    prev.current = value;
    const t0 = performance.now();
    const dur = 800;
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 2);
      setDisplayed(Math.round(start + (end - start) * ease));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return (
    <span className="font-mono text-[22px] font-medium" style={{ color }}>
      {displayed}
    </span>
  );
}

export default function StatGrid({ high, medium, low }) {
  const stats = [
    { label: "High",   value: high,   color: "#ef4444" },
    { label: "Medium", value: medium, color: "#f59e0b" },
    { label: "Low",    value: low,    color: "#3b82f6"  },
  ];

  return (
    <div className="grid grid-cols-3 border-t border-surface-border">
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`bg-surface-card py-4 text-center ${i < 2 ? "border-r border-surface-border" : ""}`}
        >
          <AnimatedCount value={s.value} color={s.color} />
          <div className="text-[11px] text-ink-muted tracking-widest uppercase mt-0.5">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
