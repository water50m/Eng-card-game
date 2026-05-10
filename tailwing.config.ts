import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // All game colors from CSS variables (set dynamically by ThemeProvider)
        "bg-base":       "var(--bg-base)",
        "bg-surface":    "var(--bg-surface)",
        "bg-elevated":   "var(--bg-elevated)",
        "bg-subtle":     "var(--bg-subtle)",
        "accent":        "var(--accent-primary)",
        "accent-2":      "var(--accent-secondary)",
        "text-primary":  "var(--text-primary)",
        "text-secondary":"var(--text-secondary)",
        "text-muted":    "var(--text-muted)",
        "border":        "var(--border-default)",
        "border-strong": "var(--border-strong)",
        "success":       "var(--color-success)",
        "danger":        "var(--color-danger)",
        "warning":       "var(--color-warning)",
        "streak":        "var(--streak-color)",
        "mastered":      "var(--mastered-color)",
        "xp":            "var(--xp-color)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body:    ["var(--font-body)"],
        mono:    ["var(--font-mono)"],
      },
      borderRadius: {
        "xl":  "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      animation: {
        "pop": "pop 0.35s cubic-bezier(0.34,1.56,0.64,1)",
      },
      keyframes: {
        pop: {
          "0%,100%": { transform: "scale(1)" },
          "50%":     { transform: "scale(1.3)" },
        },
      },
    },
  },
  plugins: [],
}

export default config
