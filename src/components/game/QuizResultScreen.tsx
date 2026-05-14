"use client"

import { motion } from "framer-motion"
import type { VocabWord, WordProgress } from "@/types/game"

export function ResultScreen({ queue, progress, totalXP, onRestart, onExit }: {
  queue: VocabWord[]
  progress: Map<string, WordProgress>
  totalXP: number
  onRestart: (mode: "same" | "partial" | "random") => void
  onExit: () => void
}) {
  const correct = queue.filter(w => (progress.get(w.id)?.correctCount ?? 0) > 0).length
  const acc = queue.length ? Math.round((correct / queue.length) * 100) : 0
  const mastered = [...progress.values()].filter(p => p.isMastered).length
  const options = [
    { mode: "same" as const, label: "🔁 เริ่มด้วยคำเดิมทั้งหมด", desc: "ทุกคำใน round นี้" },
    { mode: "partial" as const, label: "🎯 สุ่มบางคำที่ยังไม่ผ่าน", desc: "เฉพาะคำที่ยังไม่ mastered" },
    { mode: "random" as const, label: "🎲 สุ่มทั้งหมดใหม่", desc: "สุ่มจาก deck/card" },
  ]

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
      style={{ textAlign: "center", padding: "40px 24px", maxWidth: "500px", margin: "0 auto" }}>
      <div style={{ fontSize: "56px", marginBottom: "16px" }}>{acc >= 90 ? "🏆" : acc >= 70 ? "🎉" : acc >= 50 ? "👍" : "💪"}</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>จบ Quiz แล้ว!</h2>
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: "0 0 28px" }}>{queue.length} คำ · ถูก {correct} · XP +{totalXP}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "32px" }}>
        {[
          { label: "Accuracy", value: `${acc}%`, color: "var(--accent-primary)" },
          { label: "Mastered", value: mastered, color: "var(--mastered-color)" },
          { label: "XP", value: `+${totalXP}`, color: "var(--xp-color)" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "14px" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "22px", fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", textTransform: "uppercase" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {options.map(opt => (
          <button key={opt.mode} onClick={() => onRestart(opt.mode)}
            style={{ width: "100%", padding: "14px 18px", borderRadius: "13px", border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>{opt.label}</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{opt.desc}</span>
          </button>
        ))}
        <button onClick={onExit}
          style={{ width: "100%", padding: "14px 18px", borderRadius: "13px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer", textAlign: "center" }}>
          ออกไปหน้าเลือก Card
        </button>
      </div>
    </motion.div>
  )
}
