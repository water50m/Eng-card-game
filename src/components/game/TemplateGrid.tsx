"use client"

import { useEffect, useState } from "react"
import type React from "react"
import { motion } from "framer-motion"
import type { GameMode } from "@/types/game"
import { QUIZ_CATEGORIES } from "@/types/game"
import type { QuizTemplate } from "@/types/template"
import { DEFAULT_TEMPLATES, getLikedIds, getPinnedIds, toggleLike, togglePin } from "@/types/template"
import type { PlayableCard, StyleDifficulty } from "@/lib/studyCards"
import { BASE_STYLE_CARDS, DEFAULT_STYLE_DIFFICULTY, STORY_CARDS, normalizeCard } from "@/lib/studyCards"
import { Chip } from "./GameUi"

const STYLE_DIFFICULTIES: Record<StyleDifficulty, { label: string; desc: string; mode: GameMode; hintsEnabled: boolean }> = {
  1: { label: "ปกติ", desc: "เริ่มแบบเบา มีตัวเลือกและคำใบ้ เหมาะกับคำใหม่", mode: "multiple-choice", hintsEnabled: true },
  2: { label: "Choice", desc: "ตอบจากตัวเลือก ไม่มีคำใบ้ เพิ่มแรงกดดันเล็กน้อย", mode: "multiple-choice", hintsEnabled: false },
  3: { label: "Think & Reveal", desc: "คิดคำตอบเองก่อนกดเฉลย แล้วให้คะแนนว่าถูกหรือยังต้องทวน", mode: "think-reveal", hintsEnabled: true },
  4: { label: "Reveal + Timed", desc: "คิดเองก่อนเฉลยเหมือนเดิม แต่มีเวลาบีบให้ตัดสินใจเร็วขึ้น", mode: "timed-reveal", hintsEnabled: false },
}

export function TemplateGrid({ cards, storyCards = [], styleDifficulty, onSelect, onUseTemplate, onConfigure, onManageWords, onOpenStory, onStyleDifficultyChange }: {
  cards: PlayableCard[]
  storyCards?: PlayableCard[]
  styleDifficulty: Record<string, StyleDifficulty>
  onSelect: (t: PlayableCard) => void
  onUseTemplate: (t: QuizTemplate) => void
  onConfigure: (t: PlayableCard) => void
  onManageWords: (t: PlayableCard) => void
  onOpenStory: (t: PlayableCard) => void
  onStyleDifficultyChange: (cardId: string, level: StyleDifficulty) => void
}) {
  const [filter, setFilter] = useState<"all" | "global" | "mine" | "liked">("all")
  const [search, setSearch] = useState("")
  const [tag, setTag] = useState("")
  const [pinned, setPinned] = useState<string[]>([])
  const [liked, setLiked] = useState<string[]>([])

  useEffect(() => {
    setPinned(getPinnedIds())
    setLiked(getLikedIds())
  }, [])

  function handlePin(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setPinned(togglePin(id))
  }
  function handleLike(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setLiked(toggleLike(id))
  }

  const previewTpls: PlayableCard[] = DEFAULT_TEMPLATES.map(t => normalizeCard(t, "fast", "template"))
  const allTpls = [...BASE_STYLE_CARDS, ...STORY_CARDS, ...storyCards, ...cards, ...previewTpls]
  const filtered = allTpls.filter(t => {
    if (filter === "global" && t.source !== "system") return false
    if (filter === "mine" && t.source !== "user") return false
    if (filter === "liked" && !liked.includes(t.id)) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    if (tag && !t.tags.includes(tag)) return false
    return true
  })
  const sorted = [...filtered].sort((a, b) => {
    const aPreview = a.source === "template" ? 1 : 0
    const bPreview = b.source === "template" ? 1 : 0
    if (aPreview !== bPreview) return aPreview - bPreview
    return Number(pinned.includes(b.id)) - Number(pinned.includes(a.id)) || b.playCount - a.playCount
  })
  const allTags = [...new Set(allTpls.flatMap(t => t.tags))].slice(0, 12)
  const modeLabel: Record<GameMode, string> = { "multiple-choice": "MC", "think-reveal": "T&R", "timed-reveal": "T&R Timed", timed: "Timed", typing: "Type", invert: "Invert" }
  const catEmoji = Object.fromEntries(QUIZ_CATEGORIES.map(c => [c.id, c.emoji]))
  const catLabel = Object.fromEntries(QUIZ_CATEGORIES.map(c => [c.id, c.label]))
  const cardWithDifficulty = (card: PlayableCard) => {
    if (card.source !== "system") return card
    const difficulty = STYLE_DIFFICULTIES[styleDifficulty[card.id] ?? DEFAULT_STYLE_DIFFICULTY[card.id] ?? 1]
    return { ...card, config: { ...card.config, mode: difficulty.mode, hintsEnabled: difficulty.hintsEnabled } }
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center", flexWrap: "wrap" }}>
        {([
          { id: "all", label: "ทั้งหมด" },
          { id: "global", label: "ระบบ" },
          { id: "mine", label: "การ์ดของฉัน" },
          { id: "liked", label: "ถูกใจ" },
        ] as const).map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            style={{ padding: "5px 14px", borderRadius: "9999px", border: "1px solid", borderColor: filter === f.id ? "var(--accent-primary)" : "var(--border-default)", background: filter === f.id ? "var(--accent-primary)" : "transparent", color: filter === f.id ? "var(--text-on-accent)" : "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "12px", cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..."
          style={{ flex: 1, minWidth: "100px", padding: "5px 12px", borderRadius: "9999px", border: "1px solid var(--border-default)", background: "var(--bg-surface)", color: "var(--text-primary)", fontFamily: "var(--font-body)", fontSize: "12px", outline: "none" }} />
      </div>

      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
        <TagButton active={!tag} onClick={() => setTag("")}>All tags</TagButton>
        {allTags.map(t => <TagButton key={t} active={tag === t} onClick={() => setTag(t === tag ? "" : t)}>{t}</TagButton>)}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gridAutoFlow: "dense", gap: "12px" }}>
        {sorted.map((t, i) => {
          const isPinned = pinned.includes(t.id)
          const isLiked = liked.includes(t.id)
          const isPreview = t.source === "template"
          const isStory = Boolean(t.story)
          const effectiveCard = cardWithDifficulty(t)
          const selectedDifficulty = styleDifficulty[t.id] ?? DEFAULT_STYLE_DIFFICULTY[t.id] ?? 1
          const difficultyInfo = STYLE_DIFFICULTIES[selectedDifficulty]
          const storyWords = t.story?.vocabulary.length ?? 0
          return (
            <motion.div key={t.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
              whileHover={{ y: -2, boxShadow: isPinned ? "0 8px 28px var(--accent-glow)" : "0 6px 20px rgba(0,0,0,0.15)" }}
              onClick={() => isPreview ? onUseTemplate(t) : isStory ? onOpenStory(effectiveCard) : onSelect(effectiveCard)}
              style={{
                background: isLiked ? "var(--bg-subtle)" : "var(--bg-surface)",
                border: `2px solid ${isPreview ? "#cbd5e1" : isPinned ? "var(--accent-primary)" : "var(--border-default)"}`,
                borderRadius: "16px",
                padding: "14px",
                cursor: "pointer",
                transition: "all 0.2s",
                position: "relative",
                gridColumn: t.source === "system" ? "span 2" : undefined,
                minHeight: t.source === "system" ? "220px" : undefined,
              }}>
              {isPreview ? <Badge secondary>ตัวอย่าง Template</Badge> : isStory ? <Badge>เรื่องเล่า</Badge> : isPinned ? <Badge>📌 ปักหมุด</Badge> : null}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <span style={{ fontSize: "26px" }}>{t.emoji}</span>
                <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
                  {!isPreview && !isStory && <IconButton onClick={e => { e.stopPropagation(); onManageWords(t) }} title="จัดการคำใน card">📚</IconButton>}
                  {!isPreview && <IconButton onClick={e => { e.stopPropagation(); onConfigure(t) }} title="ตั้งค่าการ์ด">⚙️</IconButton>}
                  <IconButton active={isLiked} onClick={e => handleLike(e, t.id)} title="ถูกใจ">{isLiked ? "❤️" : "🤍"}</IconButton>
                  {!isPreview && <IconButton active={isPinned} onClick={e => handlePin(e, t.id)} title="ปักหมุด">{isPinned ? "📌" : "📍"}</IconButton>}
                </div>
              </div>
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 3px", lineHeight: 1.2 }}>{t.name}</h3>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", margin: "0 0 10px", lineHeight: 1.4 }}>{t.desc}</p>
              {t.source === "system" && (
                <div onClick={e => e.stopPropagation()} style={{ marginBottom: "10px" }}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center", marginBottom: "5px", flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>ระดับ</span>
                    {([1, 2, 3, 4] as const).map(level => (
                      <button key={level} onClick={() => onStyleDifficultyChange(t.id, level)}
                        title={STYLE_DIFFICULTIES[level].label}
                        style={{ width: "25px", height: "25px", borderRadius: "9999px", border: "1px solid", borderColor: level <= selectedDifficulty ? "#f59e0b" : "var(--border-default)", background: level <= selectedDifficulty ? "rgba(245,158,11,0.14)" : "var(--bg-subtle)", color: level <= selectedDifficulty ? "#f59e0b" : "var(--text-muted)", fontSize: "16px", lineHeight: 1, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                        ★
                      </button>
                    ))}
                    <span style={{ fontFamily: "var(--font-body)", fontSize: "11px", fontWeight: 700, color: "var(--accent-primary)" }}>{difficultyInfo.label}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", margin: 0, lineHeight: 1.35 }}>
                    {difficultyInfo.desc}
                  </p>
                </div>
              )}
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "10px" }}>
                <Chip>{catEmoji[effectiveCard.config.category] ?? "📚"} {catLabel[effectiveCard.config.category] ?? effectiveCard.config.category}</Chip>
                <Chip>📝 {isStory ? Math.min(effectiveCard.config.size, storyWords) : effectiveCard.config.size} {isStory ? "รายการ" : "คำ"}</Chip>
                {isStory && <Chip>{t.story?.length === "long" ? "เรื่องยาว" : "เรื่องสั้น"}</Chip>}
                <Chip>{t.learningStyle === "wide" ? "กว้างขวาง" : t.learningStyle === "fast" ? "ฉับไว" : "คลาสสิก"}</Chip>
                <Chip>{modeLabel[effectiveCard.config.mode]}</Chip>
                {effectiveCard.config.hintsEnabled && <Chip>💡</Chip>}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>▶ {t.playCount.toLocaleString()}</span>
                <span style={{ padding: "5px 14px", borderRadius: "9999px", background: isPreview ? "#f1f5f9" : "var(--accent-primary)", color: isPreview ? "#64748b" : "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 600, border: isPreview ? "1px solid #cbd5e1" : "none" }}>{isPreview ? "สร้างจากใบนี้" : isStory ? "อ่าน" : "เล่น"}</span>
              </div>
            </motion.div>
          )
        })}
      </div>
      {sorted.length === 0 && <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>ไม่พบ template ที่ตรงกัน</div>}
    </div>
  )
}

function TagButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ padding: "3px 10px", borderRadius: "9999px", border: "1px solid", borderColor: active ? "var(--accent-primary)" : "var(--border-default)", background: active ? "var(--bg-subtle)" : "transparent", color: active ? "var(--accent-primary)" : "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "11px", cursor: "pointer", flexShrink: 0 }}>{children}</button>
}

function Badge({ children, secondary }: { children: React.ReactNode; secondary?: boolean }) {
  return <div style={{ position: "absolute", top: "-8px", left: "12px", background: secondary ? "#d1d5db" : "var(--accent-primary)", color: secondary ? "#374151" : "var(--text-on-accent)", fontSize: "10px", fontWeight: 700, fontFamily: "var(--font-body)", padding: "2px 8px", borderRadius: "9999px" }}>{children}</div>
}

function IconButton({ active, onClick, title, children }: { active?: boolean; onClick: (e: React.MouseEvent) => void; title: string; children: React.ReactNode }) {
  return <button onClick={onClick} title={title} style={{ padding: "4px 8px", borderRadius: "8px", border: "1px solid", borderColor: active ? "var(--accent-primary)" : "var(--border-default)", background: active ? "var(--bg-subtle)" : "transparent", color: active ? "var(--accent-primary)" : "var(--text-muted)", fontSize: "14px", cursor: "pointer", lineHeight: 1 }}>{children}</button>
}
