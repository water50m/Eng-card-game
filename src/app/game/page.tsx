// english-card-game/src/app/game/page.tsx
"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { VocabWord, WordProgress, GameMode } from "../../types/game"
import { SEED_VOCABULARY } from "../../data/vocabulary"
import {
  updateProgress,
  calcXP,
  pickRandomWord,
  buildOptions,
} from "../../lib/gameLogic"
import { ThemePicker } from "../../components/ThemePicker"
import { useTheme } from "../../themes/ThemeProvider"
import { GameStats } from "../../components/GameStats"
import { ConfettiCanvas } from "../../components/ConfettiCanvas"

// ── Tiny icon components ──────────────────────────────────────
const IconFlame = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z"/>
  </svg>
)
const IconStar = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
  </svg>
)
const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5"/>
  </svg>
)
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
)
const IconEye = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

// ── Constants ─────────────────────────────────────────────────
const MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: "multiple-choice", label: "Multiple Choice", desc: "4 options, tap the Thai translation" },
  { id: "think-reveal",    label: "Think & Reveal",  desc: "Guess in your mind, then reveal" },
  { id: "timed",           label: "Timed Mode",      desc: "Answer within 15 seconds" },
]

const TIMED_SECONDS = 15

// ── Main Page ─────────────────────────────────────────────────
export default function GamePage() {
  const { theme } = useTheme()
  const words = SEED_VOCABULARY

  // State
  const [mode, setMode]                   = useState<GameMode>("multiple-choice")
  const [progress, setProgress]           = useState<Map<string, WordProgress>>(new Map())
  const [currentWord, setCurrentWord]     = useState<VocabWord>(() => pickRandomWord(words, new Map()))
  const [options, setOptions]             = useState<string[]>(() => buildOptions(pickRandomWord(words, new Map()), words))
  const [selected, setSelected]           = useState<string | null>(null)
  const [revealed, setRevealed]           = useState(false)
  const [feedback, setFeedback]           = useState<"correct" | "wrong" | null>(null)
  const [totalXP, setTotalXP]             = useState(0)
  const [sessionStreak, setSessionStreak] = useState(0)
  const [masteredNow, setMasteredNow]     = useState(false)
  const [showConfetti, setShowConfetti]   = useState(false)
  const [timeLeft, setTimeLeft]           = useState(TIMED_SECONDS)
  const [timerActive, setTimerActive]     = useState(false)
  const timerRef                          = useRef<ReturnType<typeof setInterval> | null>(null)
  const wordStartRef                      = useRef<number>(Date.now())

  // Load next word
  const nextWord = useCallback(() => {
    const word = pickRandomWord(words, progress)
    setCurrentWord(word)
    setOptions(buildOptions(word, words))
    setSelected(null)
    setRevealed(false)
    setFeedback(null)
    setMasteredNow(false)
    wordStartRef.current = Date.now()

    if (mode === "timed") {
      setTimeLeft(TIMED_SECONDS)
      setTimerActive(true)
    }
  }, [words, progress, mode])

  // Timer tick for timed mode
  useEffect(() => {
    if (!timerActive) return
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          setTimerActive(false)
          // Time's up — mark wrong
          handleAnswer("", false, currentWord)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current!)
  }, [timerActive]) // eslint-disable-line

  // Start timer when mode switches to timed
  useEffect(() => {
    if (mode === "timed") {
      setTimeLeft(TIMED_SECONDS)
      setTimerActive(true)
      wordStartRef.current = Date.now()
    } else {
      clearInterval(timerRef.current!)
      setTimerActive(false)
    }
  }, [mode, currentWord.id])

  function handleAnswer(chosen: string, correct: boolean, word = currentWord) {
    if (selected !== null || (mode === "think-reveal" && !revealed && chosen !== "__correct__" && chosen !== "__wrong__")) return
    if (timerRef.current) clearInterval(timerRef.current!)
    setTimerActive(false)

    const timeMs = Date.now() - wordStartRef.current
    const answer = { wordId: word.id, selectedOption: chosen, correct, timeMs }

    setSelected(chosen)
    setFeedback(correct ? "correct" : "wrong")

    const prevP = progress.get(word.id) ?? {
      wordId: word.id, streakCount: 0, attemptCount: 0,
      correctCount: 0, isMastered: false,
    }
    const newP = updateProgress(prevP, answer)
    const xp   = calcXP(answer, prevP.streakCount)

    setProgress(prev => new Map(prev).set(word.id, newP))
    setTotalXP(prev => prev + xp)
    setSessionStreak(prev => correct ? prev + 1 : 0)

    if (!prevP.isMastered && newP.isMastered) {
      setMasteredNow(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 3500)
    }

    // Auto-advance after delay
    setTimeout(nextWord, correct ? 1200 : 1800)
  }

  // Multiple choice selection
  function selectOption(opt: string) {
    if (selected !== null) return
    const correct = opt === currentWord.thai
    handleAnswer(opt, correct)
  }

  // Think & Reveal
  function revealAnswer() {
    setRevealed(true)
  }
  function selfAssess(correct: boolean) {
    handleAnswer(correct ? "__correct__" : "__wrong__", correct)
  }

  const wordProgress = progress.get(currentWord.id)
  const streak = wordProgress?.streakCount ?? 0
  const wordsMastered = [...progress.values()].filter(p => p.isMastered).length

  // Timer color
  const timerPct  = timeLeft / TIMED_SECONDS
  const timerColor = timerPct > 0.5
    ? "var(--color-success)"
    : timerPct > 0.25
    ? "var(--color-warning)"
    : "var(--color-danger)"

  return (
    <div style={{
      minHeight:    "100vh",
      background:   "var(--bg-base)",
      display:      "flex",
      flexDirection: "column",
    }}>
      <ConfettiCanvas active={showConfetti} />

      {/* ── Header ── */}
      <header style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "12px 20px",
        borderBottom:   "1px solid var(--border-default)",
        background:     "var(--bg-surface)",
        position:       "sticky",
        top:            0,
        zIndex:         30,
      }}>
        <span style={{
          fontFamily: "var(--font-display)",
          fontSize:   "18px",
          fontWeight: 700,
          color:      "var(--accent-primary)",
          letterSpacing: "-0.02em",
        }}>
          🃏 English Card
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* XP badge */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "4px",
            padding:      "4px 10px",
            borderRadius: "9999px",
            background:   "var(--bg-subtle)",
            color:        "var(--xp-color)",
            fontFamily:   "var(--font-mono)",
            fontSize:     "13px",
            fontWeight:   600,
          }}>
            <IconStar />{totalXP} XP
          </div>

          {/* Mastered badge */}
          <div style={{
            display:      "flex",
            alignItems:   "center",
            gap:          "4px",
            padding:      "4px 10px",
            borderRadius: "9999px",
            background:   "var(--bg-subtle)",
            color:        "var(--mastered-color)",
            fontFamily:   "var(--font-mono)",
            fontSize:     "13px",
            fontWeight:   600,
          }}>
            ✓ {wordsMastered}
          </div>

          <ThemePicker />
        </div>
      </header>

      {/* ── Mode Tabs ── */}
      <div style={{
        display:        "flex",
        gap:            "8px",
        padding:        "12px 20px",
        overflowX:      "auto",
        background:     "var(--bg-surface)",
        borderBottom:   "1px solid var(--border-default)",
      }}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{
              padding:      "6px 16px",
              borderRadius: "9999px",
              border:       "1px solid",
              borderColor:  mode === m.id ? "var(--accent-primary)" : "var(--border-default)",
              background:   mode === m.id ? "var(--accent-primary)" : "transparent",
              color:        mode === m.id ? "var(--text-on-accent)" : "var(--text-secondary)",
              fontFamily:   "var(--font-body)",
              fontSize:     "13px",
              fontWeight:   mode === m.id ? 600 : 400,
              cursor:       "pointer",
              whiteSpace:   "nowrap",
              transition:   "all 0.2s",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <main style={{
        flex:           1,
        display:        "flex",
        flexDirection:  "column",
        alignItems:     "center",
        padding:        "24px 16px 40px",
        maxWidth:       "680px",
        margin:         "0 auto",
        width:          "100%",
      }}>

        {/* Streak bar */}
        <div style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          width:          "100%",
          marginBottom:   "20px",
        }}>
          <div style={{
            display:    "flex",
            alignItems: "center",
            gap:        "6px",
            color:      streak > 0 ? "var(--streak-color)" : "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            fontSize:   "15px",
            fontWeight: 700,
          }}>
            <IconFlame />
            <motion.span
              key={streak}
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              {streak}
            </motion.span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 400 }}>streak</span>
          </div>

          {/* 4-dot mastery progress */}
          <div style={{ display: "flex", gap: "6px" }}>
            {[0, 1, 2, 3].map(i => (
              <motion.div
                key={i}
                animate={{ scale: streak > i ? 1.2 : 1 }}
                style={{
                  width:        "10px",
                  height:       "10px",
                  borderRadius: "50%",
                  background:   streak > i ? "var(--accent-primary)" : "var(--border-strong)",
                  transition:   "background 0.2s",
                }}
              />
            ))}
          </div>

          {/* Timer (timed mode) */}
          {mode === "timed" && (
            <div style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "20px",
              fontWeight: 700,
              color:      timerColor,
              minWidth:   "40px",
              textAlign:  "right",
              transition: "color 0.3s",
            }}>
              {timeLeft}s
            </div>
          )}
        </div>

        {/* ── Word Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWord.id}
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
              width:        "100%",
              background:   "var(--card-bg)",
              border:       "1px solid var(--card-border)",
              borderRadius: "20px",
              padding:      "40px 32px",
              textAlign:    "center",
              marginBottom: "24px",
              position:     "relative",
              boxShadow:    feedback === "correct"
                ? `0 0 32px var(--color-success)33`
                : feedback === "wrong"
                ? `0 0 32px var(--color-danger)33`
                : `0 0 48px var(--accent-glow)`,
            }}
          >
            {/* Category pill */}
            <span style={{
              position:     "absolute",
              top:          "16px",
              left:         "16px",
              fontSize:     "11px",
              color:        "var(--text-muted)",
              textTransform: "capitalize",
              fontFamily:   "var(--font-body)",
              letterSpacing: "0.04em",
            }}>
              {currentWord.category}
            </span>

            {/* Difficulty dots */}
            <div style={{
              position: "absolute",
              top:      "16px",
              right:    "16px",
              display:  "flex",
              gap:      "3px",
            }}>
              {[1,2,3,4,5].map(d => (
                <div key={d} style={{
                  width:        "5px",
                  height:       "5px",
                  borderRadius: "50%",
                  background:   d <= currentWord.difficulty ? "var(--accent-secondary)" : "var(--border-default)",
                }}/>
              ))}
            </div>

            {/* English word */}
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontSize:   "clamp(2rem, 8vw, 3.5rem)",
              fontWeight: 700,
              color:      "var(--text-primary)",
              margin:     "0 0 8px",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}>
              {currentWord.english}
            </h1>

            {/* Phonetic */}
            {currentWord.phonetic && (
              <p style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "14px",
                color:      "var(--text-muted)",
                margin:     "0 0 16px",
              }}>
                /{currentWord.phonetic}/
              </p>
            )}

            {/* Think & Reveal — show Thai when revealed */}
            <AnimatePresence>
              {(revealed || mode !== "think-reveal") && currentWord.example && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize:   "14px",
                    color:      "var(--text-secondary)",
                    fontStyle:  "italic",
                    margin:     "0",
                    overflow:   "hidden",
                  }}
                >
                  "{currentWord.example}"
                </motion.p>
              )}
            </AnimatePresence>

            {/* Mastered banner */}
            <AnimatePresence>
              {masteredNow && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position:     "absolute",
                    top:          "-14px",
                    left:         "50%",
                    transform:    "translateX(-50%)",
                    background:   "var(--mastered-color)",
                    color:        "#fff",
                    padding:      "4px 18px",
                    borderRadius: "9999px",
                    fontSize:     "12px",
                    fontWeight:   700,
                    fontFamily:   "var(--font-body)",
                    whiteSpace:   "nowrap",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  ⭐ Word Mastered!
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* ── Interaction Area ── */}

        {/* MULTIPLE CHOICE */}
        {mode === "multiple-choice" && (
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap:                 "10px",
            width:               "100%",
          }}>
            {options.map((opt, i) => {
              const isSelected = selected === opt
              const isCorrect  = opt === currentWord.thai
              let bg = "var(--option-bg)"
              let border = "var(--border-default)"
              let color = "var(--text-primary)"

              if (selected !== null) {
                if (isCorrect) {
                  bg = "var(--option-correct)"; border = "var(--color-success)"; color = "var(--color-success)"
                } else if (isSelected) {
                  bg = "var(--option-wrong)"; border = "var(--color-danger)"; color = "var(--color-danger)"
                }
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => selectOption(opt)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={selected === null ? { scale: 1.02 } : {}}
                  whileTap={selected === null ? { scale: 0.98 } : {}}
                  style={{
                    padding:      "16px 20px",
                    borderRadius: "12px",
                    border:       `1px solid ${border}`,
                    background:   bg,
                    color,
                    fontFamily:   "var(--font-display)",
                    fontSize:     "18px",
                    fontWeight:   600,
                    cursor:       selected === null ? "pointer" : "default",
                    display:      "flex",
                    alignItems:   "center",
                    justifyContent: "space-between",
                    transition:   "all 0.2s",
                    textAlign:    "left",
                  }}
                >
                  {opt}
                  {selected !== null && isCorrect && <span style={{ color: "var(--color-success)" }}><IconCheck /></span>}
                  {selected !== null && isSelected && !isCorrect && <span style={{ color: "var(--color-danger)" }}><IconX /></span>}
                </motion.button>
              )
            })}
          </div>
        )}

        {/* THINK & REVEAL */}
        {mode === "think-reveal" && (
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
            {!revealed ? (
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={revealAnswer}
                style={{
                  width:        "100%",
                  padding:      "20px",
                  borderRadius: "14px",
                  border:       "1px solid var(--accent-primary)",
                  background:   "transparent",
                  color:        "var(--accent-primary)",
                  fontFamily:   "var(--font-display)",
                  fontSize:     "18px",
                  fontWeight:   600,
                  cursor:       "pointer",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  gap:          "10px",
                }}
              >
                <IconEye /> Reveal Answer
              </motion.button>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{
                  textAlign:    "center",
                  padding:      "20px",
                  borderRadius: "14px",
                  border:       "1px solid var(--border-default)",
                  background:   "var(--bg-subtle)",
                  marginBottom: "12px",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)",
                    fontSize:   "32px",
                    fontWeight: 700,
                    color:      "var(--text-primary)",
                  }}>
                    {currentWord.thai}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => selfAssess(true)}
                    style={{
                      flex: 1, padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid var(--color-success)",
                      background: "var(--option-correct)",
                      color: "var(--color-success)",
                      fontFamily: "var(--font-body)",
                      fontSize: "15px", fontWeight: 600,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                  >
                    <IconCheck /> I got it right
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => selfAssess(false)}
                    style={{
                      flex: 1, padding: "14px",
                      borderRadius: "12px",
                      border: "1px solid var(--color-danger)",
                      background: "var(--option-wrong)",
                      color: "var(--color-danger)",
                      fontFamily: "var(--font-body)",
                      fontSize: "15px", fontWeight: 600,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                    }}
                  >
                    <IconX /> I was wrong
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TIMED — same as multiple choice but with timer */}
        {mode === "timed" && (
          <div style={{ width: "100%" }}>
            {/* Timer bar */}
            <div style={{
              width: "100%", height: "6px",
              borderRadius: "9999px",
              background: "var(--border-default)",
              marginBottom: "16px",
              overflow: "hidden",
            }}>
              <motion.div
                style={{
                  height: "100%",
                  background: timerColor,
                  borderRadius: "9999px",
                  transition: "background 0.3s",
                }}
                animate={{ width: `${(timeLeft / TIMED_SECONDS) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </div>

            <div style={{
              display:             "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap:                 "10px",
            }}>
              {options.map((opt, i) => {
                const isSelected = selected === opt
                const isCorrect  = opt === currentWord.thai
                let bg = "var(--option-bg)"
                let border = "var(--border-default)"
                let color = "var(--text-primary)"

                if (selected !== null) {
                  if (isCorrect) { bg = "var(--option-correct)"; border = "var(--color-success)"; color = "var(--color-success)" }
                  else if (isSelected) { bg = "var(--option-wrong)"; border = "var(--color-danger)"; color = "var(--color-danger)" }
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => selectOption(opt)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={selected === null ? { scale: 1.02 } : {}}
                    whileTap={selected === null ? { scale: 0.98 } : {}}
                    style={{
                      padding: "16px 20px", borderRadius: "12px",
                      border: `1px solid ${border}`,
                      background: bg, color,
                      fontFamily: "var(--font-display)",
                      fontSize: "18px", fontWeight: 600,
                      cursor: selected === null ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      transition: "all 0.2s", textAlign: "left",
                    }}
                  >
                    {opt}
                    {selected !== null && isCorrect && <span style={{ color: "var(--color-success)" }}><IconCheck /></span>}
                    {selected !== null && isSelected && !isCorrect && <span style={{ color: "var(--color-danger)" }}><IconX /></span>}
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Feedback toast ── */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                marginTop:    "20px",
                padding:      "10px 24px",
                borderRadius: "9999px",
                background:   feedback === "correct" ? "var(--color-success)" : "var(--color-danger)",
                color:        "#fff",
                fontFamily:   "var(--font-body)",
                fontSize:     "14px",
                fontWeight:   600,
              }}
            >
              {feedback === "correct" ? "✓ Correct!" : `✗ It's: ${currentWord.thai}`}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Session stats ── */}
        <GameStats
          progress={progress}
          totalXP={totalXP}
          sessionStreak={sessionStreak}
        />
      </main>
    </div>
  )
}
