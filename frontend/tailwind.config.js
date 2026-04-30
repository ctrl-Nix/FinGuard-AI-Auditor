/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans:  ["'Inter'", "system-ui", "sans-serif"],
        mono:  ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        surface: {
          DEFAULT: "#0a0b0e",
          card:    "#111318",
          deep:    "#0d0f13",
          border:  "#1e2128",
          hover:   "#1a1d24",
        },
        ink: {
          primary:   "#e8eaf0",
          secondary: "#9ba3b5",
          muted:     "#4a5060",
          faint:     "#2e3240",
        },
        risk: {
          red:    "#ef4444",
          orange: "#f97316",
          amber:  "#f59e0b",
          green:  "#22c55e",
          blue:   "#3b82f6",
        },
      },
      borderRadius: {
        "xl2": "1.25rem",
      },
      animation: {
        "slide-up":    "slideUp 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in":     "fadeIn 0.3s ease forwards",
        "pulse-slow":  "pulse 2.5s ease-in-out infinite",
        "bar-fill":    "barFill 1.2s cubic-bezier(0.34,1.1,0.64,1) forwards",
      },
      keyframes: {
        slideUp:  { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        fadeIn:   { from: { opacity: 0 }, to: { opacity: 1 } },
        barFill:  { from: { width: "0%" }, to: { width: "var(--target-w)" } },
      },
    },
  },
  plugins: [],
};
