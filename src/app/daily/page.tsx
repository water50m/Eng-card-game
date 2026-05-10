// english-card-game/src/app/daily/page.tsx
"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import { buildOptions } from "../../lib/gameLogic"
import { VocabWord } from "../../types/game"

// Generate deterministic daily words from today's date
function getDailyWords(): VocabWord[] {
  const today = new Date().toISOString().split("T")[0]
  let seed = today.split("-").reduce((a, b) => a + parseInt(b), 0)
  const shuffled = [...SEED_VOCABULARY].sort((a, b) => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return (seed % 3) - 1
  })
  return shuffled.slice(0, 10)
}

const XP_REWARD = 50

export default function DailyChallengePage() {
  const { ready } = useAuth()
  const dailyWords = useMemo(() => getDailyWords(), [])
  const [step, setStep]         = useState<"intro" | "game" | "done">("intro")
  const [idx, setIdx]           = useState(0)
  const [options, setOptions]   = useState<string[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null)
  const [score, setScore]       = useState(0)
  const [startTime, setStartTime] = useState(0)

  const current = dailyWords[idx]
  const total   = dailyWords.length

  function startGame() {
    setOptions(buildOptions(dailyWords[0], SEED_VOCABULARY))
    setStartTime(Date.now())
    setStep("game")
  }

  function handleAnswer(opt: string) {
    if (selected !== null) return
    const correct = opt === current.thai
    setSelected(opt)
    setFeedback(correct ? "correct" : "wrong")
    if (correct) setScore(s => s + 1)

    setTimeout(() => {
      if (idx + 1 >= total) {
        setStep("done")
      } else {
        const next = idx + 1
        setIdx(next)
        setOptions(buildOptions(dailyWords[next], SEED_VOCABULARY))
        setSelected(null)
        setFeedback(null)
        setStartTime(Date.now())
      }
    }, 1200)
  }

  const pct = Math.round((score / total) * 100)
  const xpEarned = Math.round(XP_REWARD * (score / total))

  if (!ready) return null

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Intro */}
        {step === "intro" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", paddingTop: "40px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>📅</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
              Daily Challenge
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "15px", color: "var(--text-muted)", margin: "0 0 32px" }}>
              {total} คำประจำวันนี้ · รางวัล {XP_REWARD} XP
            </p>

            {/* Daily words preview */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginBottom: "32px" }}>
              {dailyWords.map(w => (
                <span key={w.id} style={{
                  padding: "4px 12px", borderRadius: "9999px",
                  background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                  fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)",
                }}>
                  {w.english}
                </span>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={startGame}
              style={{
                padding: "14px 36px", borderRadius: "14px", border: "none",
                background: "var(--accent-primary)", color: "var(--text-on-accent)",
                fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, cursor: "pointer",
                boxShadow: "0 0 24px var(--accent-glow)",
              }}
            >
              เริ่มเลย →
            </motion.button>
          </motion.div>
        )}

        {/* Game */}
        {step === "game" && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)" }}>
                  📅 Daily Challenge
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>
                  {idx + 1}/{total}
                </span>
              </div>
              <div style={{ height: "6px", borderRadius: "9999px", background: "var(--border-default)", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${(idx / total) * 100}%` }}
                  style={{ height: "100%", borderRadius: "9999px", background: "var(--accent-primary)" }}
                />
              </div>
              {/* Dots */}
              <div style={{ display: "flex", gap: "6px", marginTop: "8px", justifyContent: "center" }}>
                {dailyWords.map((_, i) => (
                  <div key={i} style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: i < idx ? "var(--mastered-color)" : i === idx ? "var(--accent-primary)" : "var(--border-default)",
                    transition: "background 0.2s",
                  }}/>
                ))}
              </div>
            </div>

            {/* Word card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{
                  background: "var(--card-bg)", border: "1px solid var(--card-border)",
                  borderRadius: "20px", padding: "36px 28px", textAlign: "center", marginBottom: "20px",
                  boxShadow: feedback === "correct" ? "0 0 28px var(--color-success)33"
                           : feedback === "wrong"   ? "0 0 28px var(--color-danger)33"
                           : "0 0 40px var(--accent-glow)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "capitalize" }}>
                  {current.category}
                </span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,8vw,3rem)", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 4px", letterSpacing: "-0.02em" }}>
                  {current.english}
                </h2>
                {current.phonetic && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>/{current.phonetic}/</p>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: "10px" }}>
              {options.map((opt, i) => {
                const isSelected = selected === opt
                const isCorrect  = opt === current.thai
                let bg = "var(--option-bg)", border = "var(--border-default)", color = "var(--text-primary)"
                if (selected) {
                  if (isCorrect)       { bg = "var(--option-correct)"; border = "var(--color-success)"; color = "var(--color-success)" }
                  else if (isSelected) { bg = "var(--option-wrong)";   border = "var(--color-danger)";  color = "var(--color-danger)"  }
                }
                return (
                  <motion.button key={i}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    whileHover={!selected ? { scale: 1.02 } : {}} whileTap={!selected ? { scale: 0.97 } : {}}
                    onClick={() => handleAnswer(opt)}
                    style={{ padding: "16px 20px", borderRadius: "12px", border: `1px solid ${border}`, background: bg, color, fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 600, cursor: !selected ? "pointer" : "default", textAlign: "left", transition: "all 0.2s" }}
                  >{opt}</motion.button>
                )
              })}
            </div>

            <AnimatePresence>
              {feedback && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginTop: "16px", textAlign: "center", padding: "10px 24px", borderRadius: "9999px", display: "inline-block", background: feedback === "correct" ? "var(--color-success)" : "var(--color-danger)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600 }}
                >
                  {feedback === "correct" ? "✓ ถูกต้อง!" : `✗ คำตอบที่ถูก: ${current.thai}`}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* Done */}
        {step === "done" && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", paddingTop: "40px" }}>
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>{pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              {pct >= 80 ? "ยอดเยี่ยม!" : pct >= 50 ? "ดีมาก!" : "พยายามต่อไป!"}
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-secondary)", margin: "0 0 28px" }}>
              ตอบถูก {score}/{total} คำ ({pct}%)
            </p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", borderRadius: "14px", background: "var(--bg-surface)", border: "1px solid var(--border-default)", marginBottom: "28px" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 700, color: "var(--xp-color)" }}>+{xpEarned}</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)" }}>XP earned</span>
            </div>
            <br/>
            <a href="/game" style={{ display: "inline-block", padding: "12px 28px", borderRadius: "12px", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
              เล่นต่อ →
            </a>
          </motion.div>
        )}
      </main>
    </div>
  )
}
