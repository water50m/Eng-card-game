"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { VocabWord } from "@/types/game"

export function ExamRoom({ words, allWords, onClose, onPassed }: {
  words: VocabWord[]
  allWords: VocabWord[]
  onClose: () => void
  onPassed: (ids: string[]) => void
}) {
  const [index, setIndex] = useState(0)
  const [typed, setTyped] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [correctIds, setCorrectIds] = useState<string[]>([])
  const current = words[index]
  const pool = useMemo(() => allWords.map(w => w.english), [allWords])
  const done = index >= words.length
  const passed = words.length > 0 && correctIds.length >= Math.ceil(words.length * 0.8)

  useEffect(() => {
    setTyped("")
    setSubmitted(false)
    setSuggestions([])
  }, [index])

  function submit(value = typed) {
    if (!current || submitted) return
    const ok = value.trim().toLowerCase() === current.english.toLowerCase()
    setSubmitted(true)
    setSuggestions([])
    if (ok) setCorrectIds(ids => ids.includes(current.id) ? ids : [...ids, current.id])
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 340, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "20px", padding: "24px", width: "100%", maxWidth: "470px", textAlign: done ? "center" : "left" }}>
        {done ? (
          <>
            <div style={{ fontSize: "44px", marginBottom: "10px" }}>{passed ? "🎓" : "📝"}</div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>{passed ? "สอบผ่านแล้ว!" : "ยังไม่ผ่านรอบนี้"}</h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-secondary)", margin: "0 0 20px" }}>ตอบถูก {correctIds.length}/{words.length} คำ</p>
            <button onClick={() => { if (passed) onPassed(correctIds); onClose() }} style={{ width: "100%", padding: "13px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>กลับไปเรียนต่อ</button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "19px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>ห้องสอบ</h3>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>{index + 1}/{words.length}</span>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <div style={{ padding: "18px", borderRadius: "14px", background: "var(--bg-subtle)", border: "1px solid var(--border-default)", textAlign: "center", marginBottom: "14px" }}>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 6px" }}>พิมพ์คำภาษาอังกฤษของ</p>
              <strong style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-primary)" }}>{current.thai}</strong>
            </div>
            <div style={{ position: "relative" }}>
              <input value={typed} disabled={submitted}
                onChange={e => {
                  const value = e.target.value
                  setTyped(value)
                  setSuggestions(value ? pool.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 7) : [])
                }}
                onKeyDown={e => { if (e.key === "Enter") submitted ? setIndex(i => i + 1) : submit() }}
                placeholder="Type English..."
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "12px",
                  border: `2px solid ${submitted ? (typed.trim().toLowerCase() === current.english.toLowerCase() ? "var(--color-success)" : "var(--color-danger)") : "var(--border-default)"}`,
                  background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "18px", boxSizing: "border-box", outline: "none",
                }}
              />
              {suggestions.length > 0 && !submitted && (
                <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 20, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "11px", overflow: "hidden", boxShadow: "0 10px 26px rgba(0,0,0,0.25)" }}>
                  {suggestions.map(s => <button key={s} onClick={() => { setTyped(s); setSuggestions([]); submit(s) }} style={{ display: "block", width: "100%", padding: "9px 13px", border: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", textAlign: "left", cursor: "pointer" }}>{s}</button>)}
                </div>
              )}
            </div>
            {submitted && <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, color: typed.trim().toLowerCase() === current.english.toLowerCase() ? "var(--color-success)" : "var(--color-danger)", textAlign: "center", margin: "10px 0 0" }}>{typed.trim().toLowerCase() === current.english.toLowerCase() ? "ถูกต้อง!" : `คำตอบคือ ${current.english}`}</p>}
            <button onClick={() => submitted ? setIndex(i => i + 1) : submit()} style={{ width: "100%", marginTop: "14px", padding: "13px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>{submitted ? "ข้อต่อไป" : "ยืนยัน"}</button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
