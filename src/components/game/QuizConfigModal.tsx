"use client"

import { useState } from "react"
import type React from "react"
import { motion } from "framer-motion"
import type { GameMode, QuizCategoryOption, QuizConfig, VocabWord } from "@/types/game"
import { QUIZ_CATEGORIES, QUIZ_SIZES } from "@/types/game"
import { Ico } from "./GameIcons"
import { Label, Toggle } from "./GameUi"

const MODES: { id: GameMode; label: string; emoji: string }[] = [
  { id: "multiple-choice", label: "Multiple Choice", emoji: "🔤" },
  { id: "think-reveal", label: "Think & Reveal", emoji: "🧠" },
  { id: "timed-reveal", label: "Reveal Timed", emoji: "⏳" },
  { id: "timed", label: "Timed", emoji: "⏱️" },
  { id: "typing", label: "Typing", emoji: "⌨️" },
  { id: "invert", label: "TH→EN Invert", emoji: "🔄" },
]

export function ConfigModal({ config, onChange, onUseNow, onSaveNew, onClose, isFirstWord, allWords, categoryOptions = QUIZ_CATEGORIES }: {
  config: QuizConfig
  onChange: (c: QuizConfig) => void
  onUseNow: () => void
  onSaveNew: () => void
  onClose: () => void
  isFirstWord: boolean
  allWords: VocabWord[]
  categoryOptions?: QuizCategoryOption[]
}) {
  const [wordSearch, setWordSearch] = useState("")
  const [pickedWords, setPickedWords] = useState<VocabWord[]>([])
  const wordSearchResults = wordSearch.length >= 2
    ? allWords.filter(w => w.english.toLowerCase().includes(wordSearch.toLowerCase()) || w.thai.includes(wordSearch)).slice(0, 8)
    : []
  const pill = (active: boolean): React.CSSProperties => ({
    padding: "9px 5px", borderRadius: "11px", border: "1px solid",
    borderColor: active ? "var(--accent-primary)" : "var(--border-default)",
    background: active ? "var(--accent-primary)" : "var(--bg-subtle)",
    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
    fontFamily: "var(--font-body)", fontSize: "12px", cursor: "pointer",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
  })
  const sizeBtn = (active: boolean): React.CSSProperties => ({
    padding: "7px 14px", borderRadius: "9999px", border: "1px solid",
    borderColor: active ? "var(--accent-primary)" : "var(--border-default)",
    background: active ? "var(--accent-primary)" : "transparent",
    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
    fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 600, cursor: "pointer",
  })
  const modeBtn = (active: boolean): React.CSSProperties => ({
    padding: "9px", borderRadius: "11px", border: "1px solid",
    borderColor: active ? "var(--accent-primary)" : "var(--border-default)",
    background: active ? "var(--accent-primary)" : "var(--bg-subtle)",
    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
    fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: active ? 600 : 400,
    cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", justifyContent: "center",
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "480px", maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>⚙️ ตั้งค่า Quiz</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "18px" }}>✕</button>
        </div>

        <Label>หมวดคำศัพท์</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "7px", marginBottom: "18px" }}>
          {categoryOptions.map(c => (
            <button key={c.id} onClick={() => onChange({ ...config, category: c.id })} style={pill(config.category === c.id)} title={c.desc}>
              <span style={{ fontSize: "17px" }}>{c.emoji}</span>
              <span style={{ textAlign: "center", lineHeight: 1.3 }}>{c.label}</span>
              {typeof c.count === "number" && <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", opacity: 0.7 }}>{c.count}</span>}
            </button>
          ))}
        </div>

        <Label>จำนวนคำ</Label>
        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "18px" }}>
          {QUIZ_SIZES.map(n => <button key={n} onClick={() => onChange({ ...config, size: n })} style={sizeBtn(config.size === n)}>{n}</button>)}
        </div>

        <Label>โหมดเกม</Label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "18px" }}>
          {MODES.map(m => <button key={m.id} onClick={() => onChange({ ...config, mode: m.id })} style={modeBtn(config.mode === m.id)}><span>{m.emoji}</span>{m.label}</button>)}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", padding: "11px 14px", borderRadius: "11px", border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
          <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>💡 เปิดคำใบ้</span>
          <Toggle on={config.hintsEnabled} onToggle={() => onChange({ ...config, hintsEnabled: !config.hintsEnabled })} />
        </div>

        <Label>เพิ่มคำเฉพาะเจาะจง <span style={{ fontWeight: 400, opacity: 0.6, fontSize: "10px" }}>(optional)</span></Label>
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <input value={wordSearch} onChange={e => setWordSearch(e.target.value)} placeholder="ค้นหาคำที่ต้องการเพิ่มเข้า quiz..."
            style={{ width: "100%", padding: "9px 12px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
          {wordSearchResults.length > 0 && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 60, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              {wordSearchResults.map(w => (
                <button key={w.id} type="button" onClick={() => { if (!pickedWords.some(p => p.id === w.id)) setPickedWords(p => [...p, w]); setWordSearch("") }}
                  style={{ display: "flex", width: "100%", padding: "8px 12px", border: "none", background: "transparent", cursor: "pointer", gap: "8px", color: "var(--text-primary)", fontFamily: "var(--font-body)", textAlign: "left" }}>
                  <strong>{w.english}</strong><span style={{ color: "var(--text-muted)" }}>{w.thai}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {pickedWords.length > 0 && (
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "14px" }}>
            {pickedWords.map(w => <span key={w.id} style={{ padding: "3px 8px", borderRadius: "9999px", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "12px" }}>{w.english}</span>)}
          </div>
        )}

        <div style={{ display: "flex", gap: "9px", flexDirection: "column" }}>
          <button onClick={onUseNow} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{Ico.play} ใช้การตั้งค่านี้</button>
          {isFirstWord && <button onClick={onSaveNew} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "1px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>{Ico.save} บันทึกเป็น Card ใหม่</button>}
        </div>
      </motion.div>
    </motion.div>
  )
}
