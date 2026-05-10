"use client"

import { motion } from "framer-motion"
import { WordProgress } from "../types/game"
import { computeAccuracy } from "../lib/gameLogic"

interface Props {
  progress:       Map<string, WordProgress>
  totalXP:        number
  sessionStreak:  number
}

export function GameStats({ progress, totalXP, sessionStreak }: Props) {
  const wordsMastered  = [...progress.values()].filter(p => p.isMastered).length
  const wordsAttempted = progress.size
  const accuracy       = computeAccuracy(progress)

  const stats = [
    { label: "Mastered",  value: wordsMastered,  color: "var(--mastered-color)" },
    { label: "Accuracy",  value: `${accuracy}%`, color: "var(--accent-primary)" },
    { label: "Total XP",  value: totalXP,         color: "var(--xp-color)" },
    { label: "Attempted", value: wordsAttempted,  color: "var(--text-secondary)" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      style={{
        display:             "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap:                 "10px",
        width:               "100%",
        marginTop:           "32px",
      }}
    >
      {stats.map((s, i) => (
        <div key={i} style={{
          background:   "var(--bg-surface)",
          border:       "1px solid var(--border-default)",
          borderRadius: "12px",
          padding:      "12px 8px",
          textAlign:    "center",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize:   "22px",
            fontWeight: 700,
            color:      s.color,
            lineHeight: 1,
          }}>
            {s.value}
          </div>
          <div style={{
            fontFamily: "var(--font-body)",
            fontSize:   "11px",
            color:      "var(--text-muted)",
            marginTop:  "4px",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}>
            {s.label}
          </div>
        </div>
      ))}
    </motion.div>
  )
}
