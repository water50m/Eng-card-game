"use client"

import { motion } from "framer-motion"
import type { MarkLevel } from "@/types/game"

export function MarkBar({ current, onChange }: {
  current: MarkLevel
  onChange: (l: MarkLevel) => void
}) {
  const known = current >= 1
  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onChange(known ? 0 : 2)}
        style={{
          padding: "10px 24px", borderRadius: "9999px", border: "1.5px solid",
          borderColor: known ? "var(--color-success)" : "var(--border-default)",
          background: known ? "var(--color-success-bg)" : "var(--bg-subtle)",
          color: known ? "var(--color-success)" : "var(--text-secondary)",
          fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600,
          cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
        }}>
        {known
          ? <><span>✅</span> จำได้แล้ว · รอสอบ</>
          : <><span>🔄</span> ฉันจำได้แล้ว ส่งเข้าห้องสอบ</>
        }
      </motion.button>
    </div>
  )
}
