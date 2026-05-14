"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import type { VocabWord } from "@/types/game"

export function TypingInput({ word, pool, inverted, onAnswer }: {
  word: VocabWord
  pool: string[]
  inverted: boolean
  onAnswer: (correct: boolean, typed: string) => void
}) {
  const [typed, setTyped] = useState("")
  const [sugs, setSugs] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const target = inverted ? word.english : word.thai

  useEffect(() => {
    setTyped("")
    setSubmitted(false)
    setSugs([])
    setTimeout(() => ref.current?.focus(), 80)
  }, [word.id])

  function submit(val = typed) {
    if (submitted) return
    setSubmitted(true)
    setSugs([])
    onAnswer(val.trim().toLowerCase() === target.toLowerCase(), val)
  }

  return (
    <div style={{ width: "100%", position: "relative" }}>
      <div style={{ padding: "9px", borderRadius: "10px", background: "var(--bg-subtle)", fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", marginBottom: "9px", textAlign: "center" }}>
        {inverted ? "พิมพ์คำภาษาอังกฤษ" : "พิมพ์คำแปลภาษาไทย"}
      </div>
      <div style={{ position: "relative" }}>
        <input
          ref={ref}
          value={typed}
          onChange={e => {
            const value = e.target.value
            setTyped(value)
            setSugs(value ? pool.filter(s => s.toLowerCase().startsWith(value.toLowerCase())).slice(0, 5) : [])
          }}
          onKeyDown={e => { if (e.key === "Enter") submit() }}
          disabled={submitted}
          placeholder={inverted ? "Type English..." : "พิมพ์คำแปล..."}
          style={{
            width: "100%", padding: "15px 18px", borderRadius: "13px", outline: "none", boxSizing: "border-box",
            border: `2px solid ${submitted ? (typed.trim().toLowerCase() === target.toLowerCase() ? "var(--color-success)" : "var(--color-danger)") : "var(--border-default)"}`,
            background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "var(--font-display)", fontSize: "19px",
          }}
        />
        <AnimatePresence>
          {sugs.length > 0 && !submitted && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "11px", overflow: "hidden", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
              {sugs.map(s => (
                <button key={s} onClick={() => { setTyped(s); setSugs([]); submit(s) }}
                  style={{ display: "block", width: "100%", padding: "9px 14px", border: "none", background: "transparent", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", textAlign: "left", cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {submitted && (
        <p style={{ marginTop: "9px", textAlign: "center", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, color: typed.trim().toLowerCase() === target.toLowerCase() ? "var(--color-success)" : "var(--color-danger)" }}>
          {typed.trim().toLowerCase() === target.toLowerCase() ? "✓ ถูกต้อง!" : `✗ คำตอบที่ถูก: ${target}`}
        </p>
      )}
      {!submitted && (
        <button onClick={() => submit()} style={{ width: "100%", marginTop: "10px", padding: "13px", borderRadius: "11px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
          ยืนยัน ↵
        </button>
      )}
    </div>
  )
}
