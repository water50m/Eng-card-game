// english-card-game/src/components/FontSizeWidget.tsx
"use client"
import { motion } from "framer-motion"
import { useFontSize, FONT_SIZE_MAP, FontSizeLevel } from "../hooks/useFontSize"

export function FontSizeWidget({ compact = false }: { compact?: boolean }) {
  const { level, setLevel } = useFontSize()
  const levels: FontSizeLevel[] = ["sm", "md", "lg", "xl"]
  const labels = ["S", "M", "L", "XL"]

  return (
    <div style={{ display:"flex", alignItems:"center", gap:"6px" }}>
      {!compact && (
        <span style={{ fontFamily:"var(--font-body)", fontSize:"12px", color:"var(--text-muted)", whiteSpace:"nowrap" }}>
          ขนาดตัวอักษร
        </span>
      )}
      <div style={{ display:"flex", gap:"4px", background:"var(--bg-subtle)", borderRadius:"10px", padding:"3px" }}>
        {levels.map((l, i) => (
          <motion.button key={l} whileTap={{ scale: 0.9 }} onClick={() => setLevel(l)}
            title={FONT_SIZE_MAP[l].label}
            style={{
              padding: compact ? "4px 8px" : "5px 10px",
              borderRadius: "7px", border: "none",
              background: level === l ? "var(--accent-primary)" : "transparent",
              color: level === l ? "var(--text-on-accent)" : "var(--text-muted)",
              fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: level === l ? 700 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>
            {labels[i]}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
