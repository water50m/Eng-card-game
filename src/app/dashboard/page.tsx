// english-card-game/src/app/dashboard/page.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { SEED_VOCABULARY } from "../../data/vocabulary"

// Mock progress data for dashboard demo
function getMockProgress() {
  return {
    wordsMastered:  14,
    wordsAttempted: 31,
    totalXP:        420,
    accuracy:       78,
    currentStreak:  3,
    longestStreak:  7,
    avgTimeMs:      4200,
    totalSessions:  12,
    dailyProgress:  [
      { day: "Mon", correct: 8,  wrong: 3 },
      { day: "Tue", correct: 12, wrong: 2 },
      { day: "Wed", correct: 6,  wrong: 5 },
      { day: "Thu", correct: 15, wrong: 1 },
      { day: "Fri", correct: 10, wrong: 4 },
      { day: "Sat", correct: 18, wrong: 2 },
      { day: "Sun", correct: 7,  wrong: 3 },
    ],
    masteredWords: SEED_VOCABULARY.slice(0, 14),
    recentActivity: [
      { word: "elephant",  correct: true,  time: "2m ago" },
      { word: "harvest",   correct: false, time: "3m ago" },
      { word: "turquoise", correct: true,  time: "5m ago" },
      { word: "dolphin",   correct: true,  time: "8m ago" },
      { word: "peculiar",  correct: true,  time: "12m ago" },
    ],
    categoryBreakdown: [
      { cat: "animals",    mastered: 5, total: 8 },
      { cat: "food",       mastered: 3, total: 8 },
      { cat: "verbs",      mastered: 2, total: 8 },
      { cat: "adjectives", mastered: 2, total: 8 },
      { cat: "colors",     mastered: 1, total: 6 },
      { cat: "places",     mastered: 1, total: 4 },
    ],
  }
}

// ── Simple bar chart component (no external lib needed for this) ──
function BarChart({ data }: { data: { day: string; correct: number; wrong: number }[] }) {
  const max = Math.max(...data.map(d => d.correct + d.wrong))
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
      {data.map((d, i) => {
        const total = d.correct + d.wrong
        const pctCorrect = total > 0 ? (d.correct / max) * 100 : 0
        const pctWrong   = total > 0 ? (d.wrong / max) * 100 : 0
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", width: "100%" }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pctWrong}%` }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 300, damping: 30 }}
                style={{ background: "var(--color-danger)", borderRadius: "4px 4px 0 0", opacity: 0.6, marginBottom: "2px" }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${pctCorrect}%` }}
                transition={{ delay: i * 0.05 + 0.05, type: "spring", stiffness: 300, damping: 30 }}
                style={{ background: "var(--accent-primary)", borderRadius: "4px 4px 0 0" }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const { user, ready } = useAuth()
  const data = getMockProgress()

  const statCards = [
    { label: "Words Mastered",  value: data.wordsMastered,  color: "var(--mastered-color)", icon: "⭐" },
    { label: "Accuracy",        value: `${data.accuracy}%`, color: "var(--accent-primary)", icon: "🎯" },
    { label: "Total XP",        value: data.totalXP,         color: "var(--xp-color)",      icon: "💎" },
    { label: "Current Streak",  value: `${data.currentStreak}🔥`, color: "var(--streak-color)", icon: "🔥" },
    { label: "Sessions",        value: data.totalSessions,   color: "var(--text-secondary)", icon: "📅" },
    { label: "Avg. Time",       value: `${(data.avgTimeMs/1000).toFixed(1)}s`, color: "var(--text-secondary)", icon: "⏱️" },
    { label: "Longest Streak",  value: data.longestStreak,  color: "var(--streak-color)",   icon: "🏅" },
    { label: "Attempted",       value: data.wordsAttempted, color: "var(--text-secondary)", icon: "📝" },
  ]

  if (!ready) return null

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            {user?.emoji} สวัสดี, {user?.name}!
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            นี่คือความคืบหน้าของคุณ
          </p>
        </motion.div>

        {/* Stat cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          {statCards.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                background:   "var(--bg-surface)",
                border:       "1px solid var(--border-default)",
                borderRadius: "16px",
                padding:      "16px",
              }}
            >
              <div style={{ fontSize: "20px", marginBottom: "8px" }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "24px", fontWeight: 700, color: s.color, lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {s.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Two column section */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "24px" }}>

          {/* Weekly progress chart */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                Weekly Progress
              </h2>
              <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "var(--font-body)" }}>
                <span style={{ color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent-primary)", display: "inline-block" }}/>
                  Correct
                </span>
                <span style={{ color: "var(--color-danger)", display: "flex", alignItems: "center", gap: "4px", opacity: 0.6 }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--color-danger)", display: "inline-block" }}/>
                  Wrong
                </span>
              </div>
            </div>
            <BarChart data={data.dailyProgress} />
          </motion.div>

          {/* Category breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}
          >
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px" }}>
              By Category
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.categoryBreakdown.map((c, i) => {
                const pct = Math.round((c.mastered / c.total) * 100)
                return (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-secondary)", textTransform: "capitalize" }}>{c.cat}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)" }}>{c.mastered}/{c.total}</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "9999px", background: "var(--border-default)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: i * 0.06 + 0.4, type: "spring", stiffness: 300, damping: 30 }}
                        style={{ height: "100%", borderRadius: "9999px", background: pct === 100 ? "var(--mastered-color)" : "var(--accent-primary)" }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>

        {/* Mastered words */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            ⭐ Mastered Words <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", color: "var(--mastered-color)" }}>({data.masteredWords.length})</span>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {data.masteredWords.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 + 0.4 }}
                style={{
                  padding:      "6px 14px",
                  borderRadius: "9999px",
                  background:   "var(--bg-subtle)",
                  border:       "1px solid var(--border-default)",
                  fontFamily:   "var(--font-body)",
                  fontSize:     "13px",
                  color:        "var(--text-primary)",
                }}
              >
                <span style={{ color: "var(--mastered-color)", marginRight: "4px" }}>✓</span>
                {w.english}
                <span style={{ color: "var(--text-muted)", marginLeft: "6px", fontSize: "11px" }}>{w.thai}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}
        >
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 14px" }}>
            Recent Activity
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: i < data.recentActivity.length - 1 ? "1px solid var(--border-default)" : "none" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
                  background: a.correct ? "var(--color-success-bg)" : "var(--color-danger-bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px",
                }}>
                  {a.correct ? "✓" : "✗"}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{a.word}</span>
                </div>
                <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
