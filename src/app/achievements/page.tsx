// english-card-game/src/app/achievements/page.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"

interface Achievement {
  key: string; name: string; description: string
  icon: string; xpReward: number; unlocked: boolean; unlockedAt?: string
  condition: string; progress?: number; total?: number
}

const ACHIEVEMENTS: Achievement[] = [
  { key:"first_word",   name:"First Steps",     description:"Master your first word",       icon:"🌱", xpReward:20,  unlocked:true,  unlockedAt:"2025-01-10", condition:"1 word mastered",  progress:1,  total:1   },
  { key:"ten_words",    name:"Getting Fluent",   description:"Master 10 words",              icon:"📚", xpReward:50,  unlocked:true,  unlockedAt:"2025-01-12", condition:"10 words mastered",progress:10, total:10  },
  { key:"streak_5",     name:"On Fire",          description:"Reach a 5-word streak",        icon:"🔥", xpReward:30,  unlocked:true,  unlockedAt:"2025-01-14", condition:"Streak ≥ 5",       progress:5,  total:5   },
  { key:"speed_demon",  name:"Speed Demon",      description:"Answer under 3 seconds",       icon:"⚡", xpReward:15,  unlocked:false, condition:"Answer < 3s",      progress:0,  total:1   },
  { key:"perfect_week", name:"Perfect Week",     description:"Play every day for 7 days",    icon:"🏅", xpReward:100, unlocked:false, condition:"7-day streak",     progress:3,  total:7   },
  { key:"fifty_words",  name:"Word Master",      description:"Master 50 words",              icon:"🎓", xpReward:200, unlocked:false, condition:"50 words mastered",progress:14, total:50  },
  { key:"century",      name:"Century Club",     description:"Master 100 words",             icon:"💯", xpReward:500, unlocked:false, condition:"100 words mastered",progress:14,total:100 },
  { key:"accuracy_90",  name:"Sharp Shooter",    description:"Reach 90% overall accuracy",   icon:"🎯", xpReward:75,  unlocked:false, condition:"Accuracy ≥ 90%",   progress:78, total:90  },
  { key:"night_owl",    name:"Night Owl",         description:"Practice after midnight",      icon:"🦉", xpReward:25,  unlocked:false, condition:"Practice after 00:00",progress:0,total:1  },
  { key:"polyglot",     name:"Polyglot",          description:"Learn all categories",         icon:"🌍", xpReward:150, unlocked:false, condition:"All categories",   progress:4,  total:6   },
]

function AchievementCard({ a, i }: { a: Achievement; i: number }) {
  const [expanded, setExpanded] = useState(false)
  const pct = a.total ? Math.min(100, Math.round(((a.progress ?? 0) / a.total) * 100)) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.04 }}
      onClick={() => setExpanded(e => !e)}
      style={{
        background:   a.unlocked ? "var(--bg-surface)" : "var(--bg-surface)",
        border:       `1px solid ${a.unlocked ? "var(--accent-primary)" : "var(--border-default)"}`,
        borderRadius: "16px",
        padding:      "16px",
        cursor:       "pointer",
        opacity:      a.unlocked ? 1 : 0.7,
        transition:   "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Icon */}
        <div style={{
          width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
          background: a.unlocked ? "var(--bg-subtle)" : "var(--bg-subtle)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "26px",
          filter: a.unlocked ? "none" : "grayscale(80%)",
        }}>
          {a.icon}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>
              {a.name}
            </span>
            {a.unlocked && (
              <span style={{ fontSize: "11px", padding: "1px 8px", borderRadius: "9999px", background: "var(--color-success-bg)", color: "var(--color-success)", fontFamily: "var(--font-body)" }}>
                ✓ Unlocked
              </span>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 8px" }}>
            {a.description}
          </p>
          {/* Progress bar */}
          {!a.unlocked && a.total && (
            <div>
              <div style={{ height: "5px", borderRadius: "9999px", background: "var(--border-default)", overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.04 + 0.2, type: "spring", stiffness: 200 }}
                  style={{ height: "100%", borderRadius: "9999px", background: pct >= 80 ? "var(--color-warning)" : "var(--accent-primary)" }}
                />
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "3px", display: "block" }}>
                {a.progress}/{a.total} ({pct}%)
              </span>
            </div>
          )}
        </div>

        {/* XP badge */}
        <div style={{
          textAlign: "right", flexShrink: 0,
          fontFamily: "var(--font-mono)", fontSize: "14px",
          fontWeight: 700, color: "var(--xp-color)",
        }}>
          +{a.xpReward}<br/>
          <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)" }}>XP</span>
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ borderTop: "1px solid var(--border-default)", marginTop: "12px", paddingTop: "12px" }}>
              <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)" }}>
                Condition: {a.condition}
                {a.unlockedAt && ` · Unlocked ${a.unlockedAt}`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AchievementsPage() {
  const { ready } = useAuth()
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all")

  if (!ready) return null

  const unlocked = ACHIEVEMENTS.filter(a => a.unlocked).length
  const filtered = ACHIEVEMENTS.filter(a =>
    filter === "all" ? true : filter === "unlocked" ? a.unlocked : !a.unlocked
  )

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            🏆 Achievements
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            {unlocked} / {ACHIEVEMENTS.length} unlocked
          </p>
        </motion.div>

        {/* Overall progress ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          style={{ textAlign: "center", marginBottom: "28px" }}
        >
          <svg width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="46" fill="none" stroke="var(--border-default)" strokeWidth="10"/>
            <motion.circle
              cx="55" cy="55" r="46" fill="none"
              stroke="var(--accent-primary)" strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 46}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 46 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 46 * (1 - unlocked / ACHIEVEMENTS.length) }}
              transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
              transform="rotate(-90 55 55)"
            />
            <text x="55" y="50" textAnchor="middle" style={{ fontFamily: "var(--font-mono)" }} fill="var(--text-primary)" fontSize="22" fontWeight="700">{unlocked}</text>
            <text x="55" y="68" textAnchor="middle" fill="var(--text-muted)" fontSize="11">of {ACHIEVEMENTS.length}</text>
          </svg>
        </motion.div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {(["all","unlocked","locked"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 1, padding: "8px", borderRadius: "10px",
              border: `1px solid ${filter === f ? "var(--accent-primary)" : "var(--border-default)"}`,
              background: filter === f ? "var(--accent-primary)" : "transparent",
              color: filter === f ? "var(--text-on-accent)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: filter === f ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
            }}>{f}</button>
          ))}
        </div>

        {/* Achievement list */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((a, i) => <AchievementCard key={a.key} a={a} i={i} />)}
        </div>
      </main>
    </div>
  )
}
