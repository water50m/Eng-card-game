// english-card-game/src/app/admin/page.tsx
"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"

interface AdminUser { id: string; name: string; pin: string; emoji: string; isAdmin: boolean; createdAt: string; xp: number; mastered: number }

const INITIAL_USERS: AdminUser[] = [
  { id: "1", name: "มานี",  pin: "12345", emoji: "👧", isAdmin: false, createdAt: "2025-01-10", xp: 2840, mastered: 48 },
  { id: "2", name: "ปิติ",  pin: "11111", emoji: "👦", isAdmin: false, createdAt: "2025-01-12", xp: 1650, mastered: 28 },
  { id: "3", name: "Admin", pin: "00000", emoji: "🛡️", isAdmin: true,  createdAt: "2025-01-01", xp: 0,    mastered: 0  },
]

const SYSTEM_STATS = {
  totalUsers: 3, totalWords: 54, totalSessions: 186, totalAnswers: 2840,
  activeToday: 2, avgAccuracy: 76, wordsSeeded: 54,
}

export default function AdminPage() {
  const { user, ready } = useAuth()
  const [users, setUsers]           = useState<AdminUser[]>(INITIAL_USERS)
  const [pinEnabled, setPinEnabled] = useState(true)
  const [defaultUser, setDefaultUser] = useState("1")
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUser, setNewUser]       = useState({ name: "", pin: "", emoji: "🙂" })
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "done">("idle")
  const [tab, setTab]               = useState<"users" | "settings" | "stats">("users")
  const [toast, setToast]           = useState("")

  if (!ready) return null
  if (!user?.isAdmin) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
        <NavBar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <div style={{ fontSize: "48px" }}>🔒</div>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)", fontSize: "16px" }}>
            ต้องใช้ Admin PIN (00000) เท่านั้น
          </p>
        </div>
      </div>
    )
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(""), 2500)
  }

  function deleteUser(id: string) {
    setUsers(prev => prev.filter(u => u.id !== id))
    showToast("ลบผู้ใช้เรียบร้อย")
  }

  function addUser() {
    if (!newUser.name || !newUser.pin || newUser.pin.length !== 5) return
    setUsers(prev => [...prev, {
      id:        Date.now().toString(),
      name:      newUser.name,
      pin:       newUser.pin,
      emoji:     newUser.emoji,
      isAdmin:   false,
      createdAt: new Date().toISOString().split("T")[0],
      xp:        0,
      mastered:  0,
    }])
    setNewUser({ name: "", pin: "", emoji: "🙂" })
    setShowAddUser(false)
    showToast("เพิ่มผู้ใช้เรียบร้อย")
  }

  async function seedVocab() {
    setSeedStatus("loading")
    await new Promise(r => setTimeout(r, 1500))
    setSeedStatus("done")
    showToast("Seed vocabulary เรียบร้อย ✓")
    setTimeout(() => setSeedStatus("idle"), 3000)
  }

  const inputStyle: React.CSSProperties = {
    padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
    color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px",
    outline: "none", width: "100%", boxSizing: "border-box",
  }

  const TABS = [
    { id: "users", label: "Users", icon: "👥" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "stats", label: "Stats", icon: "📊" },
  ] as const

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: "76px", left: "50%", transform: "translateX(-50%)",
              background: "var(--color-success)", color: "#fff", padding: "10px 24px",
              borderRadius: "9999px", fontFamily: "var(--font-body)", fontSize: "14px",
              fontWeight: 600, zIndex: 200, whiteSpace: "nowrap",
            }}
          >{toast}</motion.div>
        )}
      </AnimatePresence>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
            🛡️ Admin Panel
          </h1>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
            จัดการระบบและผู้ใช้
          </p>
        </motion.div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: "10px", borderRadius: "12px",
              border: `1px solid ${tab === t.id ? "var(--accent-primary)" : "var(--border-default)"}`,
              background: tab === t.id ? "var(--accent-primary)" : "var(--bg-surface)",
              color: tab === t.id ? "var(--text-on-accent)" : "var(--text-secondary)",
              fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: tab === t.id ? 600 : 400,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── USERS TAB ── */}
          {tab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <motion.button
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowAddUser(true)}
                  style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
                >
                  ➕ Add User
                </motion.button>
              </div>

              {/* Add user form */}
              <AnimatePresence>
                {showAddUser && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginBottom: "16px" }}
                  >
                    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}>
                      <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 14px" }}>New User</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px", marginBottom: "14px" }}>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Emoji</label>
                          <input style={inputStyle} value={newUser.emoji} onChange={e => setNewUser(p => ({ ...p, emoji: e.target.value }))} maxLength={2} />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Name</label>
                          <input style={inputStyle} value={newUser.name} onChange={e => setNewUser(p => ({ ...p, name: e.target.value }))} placeholder="ชื่อผู้ใช้" />
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-body)", textTransform: "uppercase", letterSpacing: "0.06em" }}>PIN (5 digits)</label>
                          <input style={inputStyle} value={newUser.pin} onChange={e => setNewUser(p => ({ ...p, pin: e.target.value.replace(/\D/g,"").slice(0,5) }))} placeholder="12345" maxLength={5} inputMode="numeric" />
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button onClick={() => setShowAddUser(false)} style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
                        <button onClick={addUser} style={{ padding: "8px 20px", borderRadius: "10px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Create</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* User list */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {users.map((u, i) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    layout
                    style={{ display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", borderRadius: "14px", border: "1px solid var(--border-default)", background: "var(--bg-surface)" }}
                  >
                    <div style={{ fontSize: "24px" }}>{u.emoji}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                        <span style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</span>
                        {u.isAdmin && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "9999px", background: "var(--bg-subtle)", color: "var(--accent-primary)", fontFamily: "var(--font-body)", border: "1px solid var(--accent-primary)" }}>Admin</span>}
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-muted)", letterSpacing: "0.15em" }}>PIN: {u.pin}</span>
                    </div>
                    <div style={{ textAlign: "right", marginRight: "12px" }}>
                      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--xp-color)", margin: "0 0 2px" }}>{u.xp} XP</p>
                      <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{u.mastered} mastered</p>
                    </div>
                    {!u.isAdmin && (
                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--color-danger)", background: "transparent", color: "var(--color-danger)", fontFamily: "var(--font-body)", fontSize: "12px", cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── SETTINGS TAB ── */}
          {tab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              style={{ display: "flex", flexDirection: "column", gap: "14px" }}
            >
              {/* PIN toggle */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>PIN System</h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>เมื่อปิด ระบบจะใช้ผู้ใช้ default แทน</p>
                  </div>
                  <button
                    onClick={() => { setPinEnabled(p => !p); showToast(`PIN ${!pinEnabled ? "เปิด" : "ปิด"}แล้ว`) }}
                    style={{
                      width: "48px", height: "26px", borderRadius: "9999px", border: "none", cursor: "pointer",
                      background: pinEnabled ? "var(--accent-primary)" : "var(--border-strong)",
                      position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <motion.div animate={{ x: pinEnabled ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#fff", position: "absolute", top: "2px" }}
                    />
                  </button>
                </div>
              </div>

              {/* Default user */}
              {!pinEnabled && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}
                >
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 12px" }}>Default User</h3>
                  {users.filter(u => !u.isAdmin).map(u => (
                    <label key={u.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0", cursor: "pointer" }}>
                      <input type="radio" name="defaultUser" value={u.id} checked={defaultUser === u.id} onChange={() => setDefaultUser(u.id)} />
                      <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-primary)" }}>{u.emoji} {u.name}</span>
                    </label>
                  ))}
                </motion.div>
              )}

              {/* Seed vocabulary */}
              <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "20px" }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>Seed Vocabulary</h3>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", margin: "0 0 14px" }}>
                  โหลดคำศัพท์เริ่มต้น 50+ คำเข้าฐานข้อมูล
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  onClick={seedVocab}
                  disabled={seedStatus === "loading"}
                  style={{
                    padding: "10px 20px", borderRadius: "12px",
                    border: "none",
                    background: seedStatus === "done" ? "var(--color-success)" : "var(--bg-elevated)",
                    color: seedStatus === "done" ? "#fff" : "var(--text-primary)",
                    border: "1px solid var(--border-default)",
                    fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s",
                  } as React.CSSProperties}
                >
                  {seedStatus === "idle" && "🌱 Seed Vocabulary"}
                  {seedStatus === "loading" && "⏳ Seeding..."}
                  {seedStatus === "done" && "✓ Done!"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── STATS TAB ── */}
          {tab === "stats" && (
            <motion.div key="stats" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {Object.entries(SYSTEM_STATS).map(([key, val], i) => {
                  const labels: Record<string, string> = {
                    totalUsers: "Total Users", totalWords: "Total Words",
                    totalSessions: "Sessions", totalAnswers: "Answers",
                    activeToday: "Active Today", avgAccuracy: "Avg Accuracy %",
                    wordsSeeded: "Words Seeded",
                  }
                  return (
                    <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "14px", padding: "16px" }}
                    >
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "28px", fontWeight: 700, color: "var(--accent-primary)", marginBottom: "4px" }}>{val}</div>
                      <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{labels[key]}</div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  )
}
