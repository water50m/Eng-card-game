"use client"

import { motion } from "framer-motion"

export function StopWarnModal({ answered, total, onConfirm, onCancel }: {
  answered: number
  total: number
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <motion.div initial={{ scale: 0.9, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "380px", textAlign: "center" }}>
        <div style={{ fontSize: "44px", marginBottom: "12px" }}>⚠️</div>
        <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>หยุด Quiz?</h3>
        <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 18px", lineHeight: 1.6 }}>
          คุณตอบไปแล้ว <strong style={{ color: "var(--accent-primary)" }}>{answered}/{total}</strong> คำ
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "14px", cursor: "pointer", fontWeight: 500 }}>เล่นต่อ</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "none", background: "var(--color-danger)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>ออกเลย</button>
        </div>
      </motion.div>
    </motion.div>
  )
}
