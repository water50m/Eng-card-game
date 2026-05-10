// english-card-game/src/app/login/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ThemePicker } from "../../components/ThemePicker"

const DEMO_USERS = [
  { name: "มานี",    pin: "12345", emoji: "👧" },
  { name: "ปิติ",    pin: "11111", emoji: "👦" },
  { name: "Admin",   pin: "00000", emoji: "🛡️" },
]

export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin]           = useState("")
  const [error, setError]       = useState("")
  const [shake, setShake]       = useState(false)
  const [success, setSuccess]   = useState(false)
  const [loading, setLoading]   = useState(false)

  // Check already logged in
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("ecg-token")
      if (token) router.push("/game")
    }
  }, [router])

  function pressDigit(d: string) {
    if (pin.length >= 5 || loading) return
    const next = pin + d
    setPin(next)
    setError("")
    if (next.length === 5) {
      setTimeout(() => submitPin(next), 120)
    }
  }

  function deleteLast() {
    if (loading) return
    setPin(p => p.slice(0, -1))
    setError("")
  }

  async function submitPin(p: string) {
    setLoading(true)
    // Simulate API call — in production call POST /api/auth/pin
    await new Promise(r => setTimeout(r, 600))

    const user = DEMO_USERS.find(u => u.pin === p)
    if (user) {
      // Store mock token + user
      const fakeToken = btoa(JSON.stringify({ userId: p, name: user.name, isAdmin: p === "00000" }))
      localStorage.setItem("ecg-token", fakeToken)
      localStorage.setItem("ecg-user", JSON.stringify({ name: user.name, emoji: user.emoji, isAdmin: p === "00000" }))
      setSuccess(true)
      setTimeout(() => router.push("/game"), 700)
    } else {
      setLoading(false)
      setShake(true)
      setError("PIN ไม่ถูกต้อง ลองใหม่อีกครั้ง")
      setPin("")
      setTimeout(() => setShake(false), 600)
    }
  }

  const KEYS = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    ["","0","⌫"],
  ]

  return (
    <div style={{
      minHeight:      "100vh",
      background:     "var(--bg-base)",
      display:        "flex",
      flexDirection:  "column",
      alignItems:     "center",
      justifyContent: "center",
      padding:        "24px 16px",
    }}>
      {/* Theme picker top-right */}
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 50 }}>
        <ThemePicker />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ width: "100%", maxWidth: "360px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <motion.div
            animate={success ? { scale: [1, 1.4, 1], rotate: [0, 10, -10, 0] } : {}}
            transition={{ duration: 0.5 }}
            style={{ fontSize: "52px", marginBottom: "12px" }}
          >
            🃏
          </motion.div>
          <h1 style={{
            fontFamily:    "var(--font-display)",
            fontSize:      "28px",
            fontWeight:    700,
            color:         "var(--text-primary)",
            margin:        "0 0 6px",
            letterSpacing: "-0.02em",
          }}>
            English Card Game
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize:   "14px",
            color:      "var(--text-muted)",
            margin:     0,
          }}>
            กรอก PIN 5 หลักเพื่อเข้าใช้งาน
          </p>
        </div>

        {/* PIN dots */}
        <motion.div
          animate={shake ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          style={{ display: "flex", justifyContent: "center", gap: "14px", marginBottom: "36px" }}
        >
          {[0,1,2,3,4].map(i => (
            <motion.div
              key={i}
              animate={{
                scale:      pin.length > i ? 1.15 : 1,
                background: success
                  ? "var(--color-success)"
                  : pin.length > i
                  ? "var(--accent-primary)"
                  : "var(--border-strong)",
              }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              style={{
                width:        "16px",
                height:       "16px",
                borderRadius: "50%",
              }}
            />
          ))}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                textAlign:  "center",
                fontFamily: "var(--font-body)",
                fontSize:   "13px",
                color:      "var(--color-danger)",
                margin:     "-20px 0 20px",
              }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateRows: "repeat(4,1fr)", gap: "10px" }}>
          {KEYS.map((row, ri) => (
            <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
              {row.map((key, ki) => (
                <motion.button
                  key={ki}
                  whileHover={key ? { scale: 1.05 } : {}}
                  whileTap={key ? { scale: 0.93 } : {}}
                  onClick={() => {
                    if (!key) return
                    if (key === "⌫") deleteLast()
                    else pressDigit(key)
                  }}
                  disabled={!key || loading}
                  style={{
                    height:       "64px",
                    borderRadius: "14px",
                    border:       key ? "1px solid var(--border-default)" : "none",
                    background:   key ? "var(--bg-surface)" : "transparent",
                    color:        key === "⌫" ? "var(--color-danger)" : "var(--text-primary)",
                    fontFamily:   "var(--font-mono)",
                    fontSize:     "22px",
                    fontWeight:   600,
                    cursor:       key ? "pointer" : "default",
                    transition:   "all 0.15s",
                    opacity:      loading ? 0.5 : 1,
                  }}
                >
                  {key}
                </motion.button>
              ))}
            </div>
          ))}
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop:    "32px",
          padding:      "16px",
          borderRadius: "12px",
          border:       "1px solid var(--border-default)",
          background:   "var(--bg-subtle)",
        }}>
          <p style={{
            fontFamily:    "var(--font-body)",
            fontSize:      "11px",
            color:         "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            margin:        "0 0 10px",
          }}>
            Demo accounts
          </p>
          {DEMO_USERS.map(u => (
            <button
              key={u.pin}
              onClick={() => { setPin(""); setTimeout(() => submitPin(u.pin), 50) }}
              disabled={loading}
              style={{
                display:        "flex",
                alignItems:     "center",
                justifyContent: "space-between",
                width:          "100%",
                padding:        "6px 8px",
                borderRadius:   "8px",
                border:         "none",
                background:     "transparent",
                cursor:         "pointer",
                fontFamily:     "var(--font-body)",
                marginBottom:   "2px",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-elevated)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>
                {u.emoji} {u.name}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--accent-primary)", letterSpacing: "0.2em" }}>
                {u.pin}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
