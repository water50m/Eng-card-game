// english-card-game/src/app/leaderboard/page.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"

const MOCK_LEADERBOARD = [
  { rank: 1,  name: "มานี",   emoji: "👧", xp: 2840, mastered: 48, streak: 12, badge: "🥇" },
  { rank: 2,  name: "สมชาย",  emoji: "👨", xp: 2310, mastered: 39, streak: 7,  badge: "🥈" },
  { rank: 3,  name: "วิไล",   emoji: "👩", xp: 1980, mastered: 34, streak: 5,  badge: "🥉" },
  { rank: 4,  name: "ปิติ",   emoji: "👦", xp: 1650, mastered: 28, streak: 3,  badge: "" },
  { rank: 5,  name: "นภา",    emoji: "🧑", xp: 1420, mastered: 24, streak: 8,  badge: "" },
  { rank: 6,  name: "กิตติ",  emoji: "👦", xp: 1200, mastered: 20, streak: 2,  badge: "" },
  { rank: 7,  name: "ดาว",    emoji: "👧", xp: 980,  mastered: 17, streak: 4,  badge: "" },
  { rank: 8,  name: "You",    emoji: "⭐", xp: 420,  mastered: 14, streak: 3,  badge: "", isYou: true },
  { rank: 9,  name: "สุรีย์", emoji: "👩", xp: 350,  mastered: 12, streak: 1,  badge: "" },
  { rank: 10, name: "โอภาส",  emoji: "👨", xp: 210,  mastered: 8,  streak: 0,  badge: "" },
]

type Tab = "global" | "weekly" | "friends"

export default function LeaderboardPage() {
  const { ready } = useAuth()
  const [tab, setTab] = useState<Tab>("global")

  if (!ready) return null

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: "global",  label: "Global",  icon: "🌍" },
    { id: "weekly",  label: "Weekly",  icon: "📅" },
    { id: "friends", label: "Friends", icon: "👥" },
  ]

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />
      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            🏆 Leaderboard
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            อัพเดตล่าสุด: เมื่อกี้
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "10px", borderRadius: "12px",
                border: "1px solid",
                borderColor: tab === t.id ? "var(--accent-primary)" : "var(--border-default)",
                background:  tab === t.id ? "var(--accent-primary)" : "var(--bg-surface)",
                color:       tab === t.id ? "var(--text-on-accent)" : "var(--text-secondary)",
                fontFamily:  "var(--font-body)", fontSize: "13px", fontWeight: tab === t.id ? 600 : 400,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Top 3 podium */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "12px", marginBottom: "28px", padding: "0 8px" }}
        >
          {[MOCK_LEADERBOARD[1], MOCK_LEADERBOARD[0], MOCK_LEADERBOARD[2]].map((p, i) => {
            const heights = [110, 140, 90]
            const podiumColors = ["var(--text-muted)", "var(--streak-color)", "var(--accent-secondary)"]
            return (
              <motion.div
                key={p.rank}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.15 }}
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}
              >
                <div style={{ fontSize: "28px" }}>{p.emoji}</div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 2px" }}>{p.name}</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: podiumColors[i], margin: 0 }}>{p.xp} XP</p>
                </div>
                <div style={{
                  width: "100%", height: `${heights[i]}px`, borderRadius: "12px 12px 0 0",
                  background: "var(--bg-surface)", border: "1px solid var(--border-default)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "24px",
                }}>
                  {p.badge}
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Full list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {MOCK_LEADERBOARD.map((p, i) => (
            <motion.div
              key={p.rank}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 + 0.2 }}
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:          "14px",
                padding:      "14px 16px",
                borderRadius: "14px",
                border:       (p as any).isYou ? "1px solid var(--accent-primary)" : "1px solid var(--border-default)",
                background:   (p as any).isYou ? "var(--bg-subtle)" : "var(--bg-surface)",
              }}
            >
              {/* Rank */}
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0,
                background: p.rank <= 3 ? "var(--bg-subtle)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontSize: p.badge ? "16px" : "14px", fontWeight: 700,
                color: p.rank <= 3 ? "var(--streak-color)" : "var(--text-muted)",
              }}>
                {p.badge || `#${p.rank}`}
              </div>

              {/* Avatar */}
              <div style={{ fontSize: "22px", flexShrink: 0 }}>{p.emoji}</div>

              {/* Name */}
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600,
                  color: (p as any).isYou ? "var(--accent-primary)" : "var(--text-primary)",
                  margin: "0 0 2px",
                }}>
                  {p.name} {(p as any).isYou && <span style={{ fontSize: "11px", fontWeight: 400, opacity: 0.8 }}>(คุณ)</span>}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  {p.mastered} mastered · 🔥 {p.streak} streak
                </p>
              </div>

              {/* XP */}
              <div style={{ textAlign: "right" }}>
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--xp-color)", margin: 0 }}>
                  {p.xp.toLocaleString()}
                </p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>XP</p>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
