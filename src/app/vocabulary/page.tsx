// english-card-game/src/app/vocabulary/page.tsx
"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import { SEED_VOCABULARY, CATEGORIES } from "../../data/vocabulary"
import { VocabWord, Difficulty } from "../../types/game"

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  1: "Beginner", 2: "Easy", 3: "Medium", 4: "Hard", 5: "Expert",
}
const DIFF_COLOR: Record<Difficulty, string> = {
  1: "var(--mastered-color)",
  2: "var(--accent-secondary)",
  3: "var(--color-warning)",
  4: "var(--color-danger)",
  5: "#A855F7",
}

function WordCard({ word, onPlay }: { word: VocabWord; onPlay: () => void }) {
  const [flipped, setFlipped] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      style={{ perspective: "1000px", cursor: "pointer" }}
      onClick={() => setFlipped(f => !f)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        style={{ position: "relative", transformStyle: "preserve-3d", minHeight: "140px" }}
      >
        {/* Front */}
        <div style={{
          position:       "absolute", inset: 0, backfaceVisibility: "hidden",
          background:     "var(--bg-surface)",
          border:         "1px solid var(--border-default)",
          borderRadius:   "16px",
          padding:        "16px",
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "capitalize", fontFamily: "var(--font-body)" }}>
              {word.category}
            </span>
            <span style={{
              fontSize: "10px", padding: "2px 8px", borderRadius: "9999px", fontFamily: "var(--font-body)",
              color: DIFF_COLOR[word.difficulty as Difficulty],
              border: `1px solid ${DIFF_COLOR[word.difficulty as Difficulty]}`,
              opacity: 0.85,
            }}>
              {DIFFICULTY_LABEL[word.difficulty as Difficulty]}
            </span>
          </div>
          <div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>
              {word.english}
            </p>
            {word.phonetic && (
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>/{word.phonetic}/</p>
            )}
          </div>
          <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>แตะเพื่อดูความหมาย</p>
        </div>

        {/* Back */}
        <div style={{
          position:       "absolute", inset: 0, backfaceVisibility: "hidden",
          transform:      "rotateY(180deg)",
          background:     "var(--bg-subtle)",
          border:         "1px solid var(--accent-primary)",
          borderRadius:   "16px",
          padding:        "16px",
          display:        "flex",
          flexDirection:  "column",
          justifyContent: "space-between",
        }}>
          <p style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--accent-primary)", margin: 0 }}>
            {word.thai}
          </p>
          {word.example && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic", margin: 0 }}>
              "{word.example}"
            </p>
          )}
          <button
            onClick={e => { e.stopPropagation(); onPlay() }}
            style={{
              alignSelf:    "flex-start",
              padding:      "5px 14px",
              borderRadius: "9999px",
              border:       "1px solid var(--accent-primary)",
              background:   "transparent",
              color:        "var(--accent-primary)",
              fontFamily:   "var(--font-body)",
              fontSize:     "12px",
              cursor:       "pointer",
            }}
          >
            ▶ Practice
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Add word modal
function AddWordModal({ onClose, onAdd }: { onClose: () => void; onAdd: (w: VocabWord) => void }) {
  const [form, setForm] = useState({ english: "", thai: "", phonetic: "", example: "", category: "custom", difficulty: "1" })
  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.english || !form.thai) return
    onAdd({
      id:         `custom-${Date.now()}`,
      english:    form.english.trim(),
      thai:       form.thai.trim(),
      phonetic:   form.phonetic.trim() || undefined,
      example:    form.example.trim() || undefined,
      category:   form.category,
      difficulty: parseInt(form.difficulty) as Difficulty,
    })
    onClose()
  }
  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border-default)", background: "var(--bg-elevated)",
    color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px",
    outline: "none", boxSizing: "border-box",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontFamily: "var(--font-body)", fontSize: "12px",
    color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em",
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "420px", border: "1px solid var(--border-default)" }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 20px" }}>
          ➕ Add Custom Word
        </h2>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>English *</label>
            <input style={inputStyle} value={form.english} onChange={e => setForm(f => ({ ...f, english: e.target.value }))} placeholder="e.g. butterfly" required />
          </div>
          <div>
            <label style={labelStyle}>Thai *</label>
            <input style={inputStyle} value={form.thai} onChange={e => setForm(f => ({ ...f, thai: e.target.value }))} placeholder="e.g. ผีเสื้อ" required />
          </div>
          <div>
            <label style={labelStyle}>Phonetic</label>
            <input style={inputStyle} value={form.phonetic} onChange={e => setForm(f => ({ ...f, phonetic: e.target.value }))} placeholder="e.g. BUT-er-fly" />
          </div>
          <div>
            <label style={labelStyle}>Example sentence</label>
            <input style={inputStyle} value={form.example} onChange={e => setForm(f => ({ ...f, example: e.target.value }))} placeholder="e.g. The butterfly is beautiful." />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {[...CATEGORIES, "custom"].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Difficulty</label>
              <select style={{ ...inputStyle }} value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>
                {[1,2,3,4,5].map(d => <option key={d} value={d}>{DIFFICULTY_LABEL[d as Difficulty]}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "14px", cursor: "pointer" }}>
              Cancel
            </button>
            <button type="submit" style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
              Add Word
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default function VocabularyPage() {
  const { ready } = useAuth()
  const [search, setSearch]   = useState("")
  const [category, setCategory] = useState("all")
  const [difficulty, setDifficulty] = useState("all")
  const [showAdd, setShowAdd] = useState(false)
  const [customWords, setCustomWords] = useState<VocabWord[]>([])
  const allWords = [...SEED_VOCABULARY, ...customWords]

  const filtered = useMemo(() => {
    return allWords.filter(w => {
      const matchSearch = !search || w.english.toLowerCase().includes(search.toLowerCase()) || w.thai.includes(search)
      const matchCat    = category === "all" || w.category === category
      const matchDiff   = difficulty === "all" || String(w.difficulty) === difficulty
      return matchSearch && matchCat && matchDiff
    })
  }, [search, category, difficulty, allWords.length])

  if (!ready) return null

  const chipStyle = (active: boolean): React.CSSProperties => ({
    padding: "6px 14px", borderRadius: "9999px",
    border: active ? "1px solid var(--accent-primary)" : "1px solid var(--border-default)",
    background: active ? "var(--accent-primary)" : "transparent",
    color: active ? "var(--text-on-accent)" : "var(--text-secondary)",
    fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: active ? 600 : 400,
    cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all 0.15s",
  })

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar />
      <AnimatePresence>{showAdd && <AddWordModal onClose={() => setShowAdd(false)} onAdd={w => setCustomWords(prev => [...prev, w])} />}</AnimatePresence>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
              📖 Vocabulary
            </h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
              {filtered.length} คำ {customWords.length > 0 && `(${customWords.length} custom)`}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowAdd(true)}
            style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            ➕ Add Word
          </motion.button>
        </div>

        {/* Search */}
        <input
          type="search"
          placeholder="🔍  ค้นหาคำศัพท์..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: "100%", padding: "12px 16px", borderRadius: "12px",
            border: "1px solid var(--border-default)", background: "var(--bg-surface)",
            color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "15px",
            outline: "none", boxSizing: "border-box", marginBottom: "14px",
          }}
        />

        {/* Filters */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "20px" }}>
          <button style={chipStyle(category === "all")} onClick={() => setCategory("all")}>All</button>
          {CATEGORIES.map(c => (
            <button key={c} style={{ ...chipStyle(category === c), textTransform: "capitalize" }} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "24px" }}>
          <button style={chipStyle(difficulty === "all")} onClick={() => setDifficulty("all")}>All levels</button>
          {[1,2,3,4,5].map(d => (
            <button key={d} style={chipStyle(difficulty === String(d))} onClick={() => setDifficulty(String(d))}>
              {DIFFICULTY_LABEL[d as Difficulty]}
            </button>
          ))}
        </div>

        {/* Grid */}
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <p>ไม่พบคำศัพท์ที่ค้นหา</p>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "14px" }}
            >
              {filtered.map(w => (
                <WordCard key={w.id} word={w} onPlay={() => {
                  if (typeof window !== "undefined") window.location.href = "/game"
                }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
