"use client"

import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import type { VocabWord } from "@/types/game"
import type { PlayableCard } from "@/lib/studyCards"

export function CardWordsManager({ card, words, allWords, loading, onClose, onAddWord, onRemoveWord }: {
  card: PlayableCard
  words: VocabWord[]
  allWords: VocabWord[]
  loading: boolean
  onClose: () => void
  onAddWord: (wordId: string) => void | Promise<void>
  onRemoveWord: (wordId: string) => void
}) {
  const [search, setSearch] = useState("")
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(null)
  const [adding, setAdding] = useState(false)
  const currentIds = useMemo(() => new Set(words.map(w => w.id)), [words])
  const randomCandidates = useMemo(() => allWords.filter(w => !currentIds.has(w.id)), [allWords, currentIds])
  const activeLimit = Math.max(1, Number(card.config?.size) || 10)
  const results = search.trim().length >= 2
    ? allWords
      .filter(w => !currentIds.has(w.id))
      .filter(w => w.english.toLowerCase().includes(search.toLowerCase()) || w.thai.includes(search))
      .slice(0, 10)
    : []

  function selectWord(word: VocabWord) {
    setSelectedWord(word)
    setSearch(`${word.english} - ${word.thai}`)
  }

  function addRandomWord() {
    if (randomCandidates.length === 0) return
    const word = randomCandidates[Math.floor(Math.random() * randomCandidates.length)]
    selectWord(word)
  }

  async function addSelectedWord() {
    if (!selectedWord || currentIds.has(selectedWord.id)) return
    setAdding(true)
    try {
      await onAddWord(selectedWord.id)
      setSelectedWord(null)
    } finally {
      setAdding(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 360, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "20px", padding: "22px", width: "100%", maxWidth: "620px", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
              {card.emoji} คำใน {card.name}
            </h3>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              {words.length} คำ · เพิ่ม/ลบแล้วเก็บถาวรสำหรับผู้เล่นคนนี้
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "stretch", marginBottom: "16px" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setSelectedWord(null) }}
              placeholder="ค้นหาคำเพื่อเพิ่มเข้า card..."
              style={{ width: "100%", padding: "11px 14px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
            />
            {results.length > 0 && (
              <div style={{ position: "absolute", top: "calc(100% + 5px)", left: 0, right: 0, zIndex: 20, background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.25)" }}>
                {results.map(w => (
                  <button key={w.id} onClick={() => selectWord(w)}
                    style={{ width: "100%", border: "none", background: "transparent", padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", textAlign: "left" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", minWidth: "120px" }}>{w.english}</span>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>{w.thai}</span>
                    <span style={{ color: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700 }}>เลือก</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={addSelectedWord} disabled={loading || adding || !selectedWord || currentIds.has(selectedWord.id)} title="เพิ่มคำที่เลือกเข้า card"
            style={{ padding: "0 15px", borderRadius: "12px", border: "1px solid var(--border-default)", background: loading || adding || !selectedWord || currentIds.has(selectedWord.id) ? "var(--bg-subtle)" : "var(--accent-primary)", color: loading || adding || !selectedWord || currentIds.has(selectedWord.id) ? "var(--text-muted)" : "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: loading || adding || !selectedWord || currentIds.has(selectedWord.id) ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            {adding ? "เพิ่ม..." : "เพิ่ม"}
          </button>
          <button onClick={addRandomWord} disabled={loading || randomCandidates.length === 0} title="สุ่มคำใหม่เข้า card"
            style={{ padding: "0 15px", borderRadius: "12px", border: "1px solid var(--border-default)", background: loading || randomCandidates.length === 0 ? "var(--bg-subtle)" : "var(--accent-primary)", color: loading || randomCandidates.length === 0 ? "var(--text-muted)" : "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: loading || randomCandidates.length === 0 ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            🎲 สุ่ม
          </button>
        </div>

        {loading ? (
          <div style={{ padding: "38px", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>กำลังโหลดคำใน card...</div>
        ) : words.length === 0 ? (
          <div style={{ padding: "38px", textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
            ยังไม่มีคำใน card นี้<br />
            <span style={{ fontSize: "12px" }}>กดเล่นครั้งแรกเพื่อสุ่มชุดคำถาวร หรือค้นหาคำด้านบนเพื่อเพิ่มเอง</span>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "9px" }}>
            {words.map((w, index) => {
              const active = index < activeLimit
              return (
              <div key={w.id} style={{ border: active ? "1.5px solid var(--accent-primary)" : "1px dashed var(--border-default)", background: active ? "var(--bg-surface)" : "var(--bg-subtle)", borderRadius: "12px", padding: "10px 11px", display: "flex", alignItems: "flex-start", gap: "9px", boxShadow: active ? "0 0 0 2px var(--accent-glow)" : "none", opacity: active ? 1 : 0.82 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", paddingTop: "2px", width: "24px" }}>{index + 1}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.english}</div>
                    <span style={{ flexShrink: 0, borderRadius: "999px", padding: "1px 6px", background: active ? "var(--accent-primary)" : "transparent", border: active ? "none" : "1px solid var(--border-default)", color: active ? "var(--text-on-accent)" : "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "10px", fontWeight: 700 }}>
                      {active ? "เล่น" : "รอคิว"}
                    </span>
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.thai}</div>
                </div>
                <button onClick={() => onRemoveWord(w.id)} title="ลบคำออกจาก card"
                  style={{ border: "1px solid var(--color-danger)", background: "transparent", color: "var(--color-danger)", borderRadius: "8px", padding: "3px 7px", cursor: "pointer", fontSize: "12px", flexShrink: 0 }}>
                  ลบ
                </button>
              </div>
            )})}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
