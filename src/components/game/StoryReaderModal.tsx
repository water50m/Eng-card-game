"use client"

import { motion } from "framer-motion"
import type { PlayableCard } from "@/lib/studyCards"
import { Ico } from "./GameIcons"
import { Chip } from "./GameUi"

export function StoryReaderModal({ card, onClose, onStart, onConfigure }: {
  card: PlayableCard
  onClose: () => void
  onStart: () => void
  onConfigure: () => void
}) {
  const story = card.story
  if (!story) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "780px", maxHeight: "92vh", overflowY: "auto", borderRadius: "18px", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", padding: "18px 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-default)" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <Chip>{story.length === "long" ? "เรื่องยาว" : "เรื่องสั้น"}</Chip>
              <Chip>{story.genre === "puzzle" ? "ปริศนา" : story.genre === "horror" ? "สยองขวัญ" : "ลึกลับ"}</Chip>
              <Chip>{story.vocabulary.length} คำศัพท์</Chip>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.25 }}>
              <span style={{ marginRight: "8px" }}>{card.emoji}</span>{card.name}
            </h2>
          </div>
          <button onClick={onClose} title="ปิด" style={{ width: "34px", height: "34px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px", marginBottom: "18px" }}>
            <section style={{ border: "1px solid var(--border-default)", borderRadius: "12px", padding: "14px", background: "var(--bg-surface)" }}>
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", margin: "0 0 10px" }}>English</h3>
              {story.english.map((paragraph, index) => (
                <p key={index} style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.65, color: "var(--text-primary)", margin: index === 0 ? "0 0 12px" : "12px 0" }}>
                  {paragraph}
                </p>
              ))}
            </section>
            <section style={{ border: "1px solid var(--border-default)", borderRadius: "12px", padding: "14px", background: "var(--bg-subtle)" }}>
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", margin: "0 0 10px" }}>คำแปลไทย</h3>
              {story.thai.map((paragraph, index) => (
                <p key={index} style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.65, color: "var(--text-primary)", margin: index === 0 ? "0 0 12px" : "12px 0" }}>
                  {paragraph}
                </p>
              ))}
            </section>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <h3 style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 10px" }}>คำศัพท์ในเรื่อง</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: "8px" }}>
              {story.vocabulary.map(word => (
                <div key={word.id} style={{ border: "1px solid var(--border-default)", borderRadius: "10px", padding: "9px 10px", background: "var(--bg-surface)" }}>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "2px" }}>{word.english}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.35 }}>{word.thai}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
            <button onClick={onConfigure} style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              ⚙️ ตั้งค่าเกม
            </button>
            <button onClick={onStart} style={{ padding: "11px 18px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {Ico.play} เริ่มแบบฝึกหัด
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
