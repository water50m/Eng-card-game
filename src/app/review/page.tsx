// english-card-game/src/app/review/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import { buildOptions } from "../../lib/gameLogic"
import {
  SRCard, createCard, sm2Update, getDueCards, saveSRCards, loadSRCards, answerQuality,
} from "../../lib/spacedRepetition"
import { VocabWord } from "../../types/game"

export default function ReviewPage() {
  const { ready } = useAuth()
  const [srCards, setSrCards]         = useState<Map<string, SRCard>>(new Map())
  const [queue, setQueue]             = useState<VocabWord[]>([])
  const [current, setCurrent]         = useState<VocabWord | null>(null)
  const [options, setOptions]         = useState<string[]>([])
  const [selected, setSelected]       = useState<string | null>(null)
  const [feedback, setFeedback]       = useState<"correct" | "wrong" | null>(null)
  const [done, setDone]               = useState(false)
  const [reviewed, setReviewed]       = useState(0)
  const [startTime, setStartTime]     = useState(Date.now())

  // Load SR cards and build due queue
  useEffect(() => {
    const cards = loadSRCards()
    // Ensure every vocab word has a card
    SEED_VOCABULARY.forEach(w => { if (!cards.has(w.id)) cards.set(w.id, createCard(w.id)) })
    setSrCards(cards)

    const due = getDueCards([...cards.values()])
    // Map back to VocabWord
    const dueWords = due
      .map(c => SEED_VOCABULARY.find(w => w.id === c.wordId))
      .filter(Boolean) as VocabWord[]

    if (dueWords.length === 0) {
      setDone(true)
      return
    }
    setQueue(dueWords.slice(1))
    setCurrent(dueWords[0])
    setOptions(buildOptions(dueWords[0], SEED_VOCABULARY))
    setStartTime(Date.now())
  }, [])

  function handleAnswer(opt: string) {
    if (!current || selected !== null) return
    const correct = opt === current.thai
    const timeMs  = Date.now() - startTime
    setSelected(opt)
    setFeedback(correct ? "correct" : "wrong")

    // Update SR card
    const prevCard = srCards.get(current.id) ?? createCard(current.id)
    const quality  = answerQuality(correct, timeMs, prevCard.repetitions)
    const newCard  = sm2Update(prevCard, quality)
    const updated  = new Map(srCards).set(current.id, newCard)
    setSrCards(updated)
    saveSRCards(updated)
    setReviewed(r => r + 1)

    setTimeout(() => {
      if (queue.length === 0) {
        setDone(true)
      } else {
        const next = queue[0]
        setCurrent(next)
        setOptions(buildOptions(next, SEED_VOCABULARY))
        setQueue(q => q.slice(1))
        setSelected(null)
        setFeedback(null)
        setStartTime(Date.now())
      }
    }, 1300)
  }

  if (!ready) return null

  const total = reviewed + queue.length + (current ? 1 : 0)

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />
      <main style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px" }}>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            🔁 Review Mode
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            คำที่ถึงเวลาทบทวนวันนี้
          </p>
        </motion.div>

        {/* Done screen */}
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: "center", padding: "60px 20px" }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 8px" }}>
              Review complete!
            </h2>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "16px", color: "var(--text-secondary)", margin: "0 0 24px" }}>
              ทบทวนแล้ว {reviewed} คำ · ดีมาก!
            </p>
            <a href="/game" style={{ display: "inline-block", padding: "12px 28px", borderRadius: "12px", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, textDecoration: "none" }}>
              เล่นต่อ →
            </a>
          </motion.div>
        )}

        {!done && current && (
          <>
            {/* Progress bar */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)" }}>Progress</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-secondary)" }}>{reviewed}/{total}</span>
              </div>
              <div style={{ height: "6px", borderRadius: "9999px", background: "var(--border-default)", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${total > 0 ? (reviewed / total) * 100 : 0}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  style={{ height: "100%", borderRadius: "9999px", background: "var(--accent-primary)" }}
                />
              </div>
            </div>

            {/* Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                style={{
                  background: "var(--card-bg)", border: "1px solid var(--card-border)",
                  borderRadius: "20px", padding: "36px 28px", textAlign: "center",
                  marginBottom: "20px",
                  boxShadow: feedback === "correct" ? "0 0 28px var(--color-success)33"
                           : feedback === "wrong"   ? "0 0 28px var(--color-danger)33"
                           : "0 0 40px var(--accent-glow)",
                }}
              >
                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-body)", textTransform: "capitalize" }}>{current.category}</span>
                <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem,8vw,3rem)", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0", letterSpacing: "-0.02em" }}>
                  {current.english}
                </h2>
                {current.phonetic && (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>/{current.phonetic}/</p>
                )}
                {/* Next review info */}
                {(() => {
                  const c = srCards.get(current.id)
                  return c ? (
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                      ทบทวนครั้งที่ {c.repetitions + 1} · ช่วง {c.interval} วัน
                    </p>
                  ) : null
                })()}
              </motion.div>
            </AnimatePresence>

            {/* Options */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: "10px" }}>
              {options.map((opt, i) => {
                const isSelected = selected === opt
                const isCorrect  = opt === current.thai
                let bg = "var(--option-bg)", border = "var(--border-default)", color = "var(--text-primary)"
                if (selected !== null
