"use client"

import { motion } from "framer-motion"
import type { MasteryPrompt } from "@/lib/studyCards"

export function MasteryConfirmPopup({ prompt, onConfirm, onLucky }: {
  prompt: MasteryPrompt
  onConfirm: () => void
  onLucky: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 350, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <motion.div initial={{ scale: 0.92, y: 18 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "20px", padding: "26px", width: "100%", maxWidth: "420px", textAlign: "center", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ fontSize: "42px", marginBottom: "10px" }}>🏆</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "21px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
          คุณทำได้ดีมากสำหรับคำนี้
        </h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 18px" }}>
          <strong style={{ color: "var(--accent-primary)" }}>{prompt.english}</strong> · {prompt.thai}<br />
          คุณจำมันได้ขึ้นใจแล้วใช่ไหม?
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={onConfirm} style={{ padding: "13px", borderRadius: "12px", border: "none", background: "var(--color-success)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>ใช่ ไม่ต้องแสดงอีกแล้ว</button>
          <button onClick={onLucky} style={{ padding: "13px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>ไม่ใช่ ฉันแค่โชคดี</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
