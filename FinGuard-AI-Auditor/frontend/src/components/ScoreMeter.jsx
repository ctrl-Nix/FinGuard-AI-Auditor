import { useEffect, useRef, useState } from "react";

const RADIUS = 80;
const FULL_ARC = 2 * Math.PI * RADIUS;
const ARC_FRACTION = 0.75; // 3/4 circle
const ARC_LEN = FULL_ARC * ARC_FRACTION;
const ARC_GAP = FULL_ARC - ARC_LEN;

export default function ScoreMeter({ score, color, verdict }) {
  const [displayed, setDisplayed] = useState(0);
  const [dashOffset, setDashOffset] = useState(ARC_LEN);
  const rafRef = useRef(null);

  useEffect(() => {
    // Animate counter
    const start = displayed;
    const end = score;
    const duration = 1400;
    const t0 = performance.now();

    const tick = (now) => {
      const p = Math.min(1, (now - t0) / duration);
      // ease-out-back
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(start + (end - start) * ease));
      setDashOffset(ARC_LEN - ARC_LEN * (score / 100) * ease);
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [score]);

  return (
    <div className="relative flex flex-col items-center">
      {/* SVG arc */}
      <div className="relative w-[200px] h-[200px]">
        <svg
          viewBox="0 0 200 200"
          width="200"
          height="200"
          style={{ transform: "rotate(-225deg)" }}
        >
          {/* Track */}
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke="#1a1d24"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN} ${ARC_GAP}`}
          />
          {/* Fill */}
          <circle
            cx="100" cy="100" r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${ARC_LEN} ${ARC_GAP}`}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke 0.6s ease" }}
          />
        </svg>

        {/* Center number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-mono text-[48px] font-medium leading-none"
            style={{ color }}
          >
            {displayed}
          </span>
          <span className="font-mono text-[13px] text-ink-faint mt-1">/ 100</span>
        </div>
      </div>

      {/* Verdict pill */}
      <div
        className="flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold border mt-1"
        style={{
          background: verdict.bg,
          borderColor: verdict.border,
          color: verdict.color,
        }}
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse-slow"
          style={{ background: verdict.color }}
        />
        {verdict.label}
      </div>
    </div>
  );
}
