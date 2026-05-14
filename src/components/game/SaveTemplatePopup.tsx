"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import type React from "react"
import type { QuizConfig } from "@/types/game"

export function SaveTemplatePopup({ onSave, onCancel }: {
  config: QuizConfig
  onSave: (name: string, emoji: string, restartNow: boolean) => void
  onCancel: () => void
}) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("⭐")
  const input: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
    color: "var(--text-primary)", fontFamily: "var(--font-body)",
    fontSize: "14px", outline: "none", boxSizing: "border-box",
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "18px", padding: "24px", width: "100%", maxWidth: "360px" }}>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 18px" }}>
          💾 บันทึก Card ใหม่
        </h3>
        <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
          <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} style={{ ...input, width: "60px", textAlign: "center", fontSize: "20px" }} />
          <input value={name} onChange={e => setName(e.target.value)} placeholder="ชื่อ card..." style={input} autoFocus />
        </div>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: "0 0 18px" }}>
          เริ่มรอบด้วย card ใหม่นี้เลยไหม?
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>ยกเลิก</button>
          <button onClick={() => onSave(name || "My Card", emoji, false)} style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>บันทึก</button>
          <button onClick={() => onSave(name || "My Card", emoji, true)} style={{ flex: 1.3, padding: "11px", borderRadius: "10px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>บันทึก + เล่น</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
