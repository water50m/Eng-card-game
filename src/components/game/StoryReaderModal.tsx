"use client"

import { useEffect, useMemo, useState } from "react"
import type React from "react"
import { createPortal } from "react-dom"
import { motion } from "framer-motion"
import type { PlayableCard, StoryGlossaryItem } from "@/lib/studyCards"
import { Ico } from "./GameIcons"
import { Chip } from "./GameUi"

export function StoryReaderModal({ card, onClose, onStart, onConfigure }: {
  card: PlayableCard
  onClose: () => void
  onStart: () => void
  onConfigure: () => void
}) {
  const story = card.story
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [pinnedId, setPinnedId] = useState<string | null>(null)
  const [popupAnchor, setPopupAnchor] = useState<GlossaryPopupAnchor | null>(null)
  const matchers = useMemo(() => story ? buildGlossaryMatchers(story.vocabulary) : [], [story])
  if (!story) return null
  const idiomCount = story.vocabulary.filter(item => item.kind === "idiom").length
  const wordCount = story.vocabulary.length - idiomCount
  const activePopupItem = popupAnchor && (hoveredId === popupAnchor.id || pinnedId === popupAnchor.id)
    ? story.vocabulary.find(item => item.id === popupAnchor.id)
    : undefined

  useEffect(() => {
    if (!pinnedId) return
    const closePinnedPopup = (event: PointerEvent) => {
      const target = event.target as Element | null
      if (target?.closest("[data-story-glossary-popup], [data-story-glossary-trigger]")) return
      setPinnedId(null)
      setPopupAnchor(null)
    }
    document.addEventListener("pointerdown", closePinnedPopup)
    return () => document.removeEventListener("pointerdown", closePinnedPopup)
  }, [pinnedId])

  const showGlossaryPopup = (event: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>, id: string) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const popupWidth = 260
    const margin = 12
    const rawLeft = rect.left + rect.width / 2
    const left = Math.min(Math.max(rawLeft, popupWidth / 2 + margin), window.innerWidth - popupWidth / 2 - margin)
    const placement = rect.top > 132 ? "above" : "below"
    setPopupAnchor({
      id,
      left,
      top: placement === "above" ? rect.top - 8 : rect.bottom + 8,
      placement,
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.68)", zIndex: 210, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <motion.div initial={{ scale: 0.94, y: 18 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: "780px", maxHeight: "92vh", overflowY: "auto", borderRadius: "18px", border: "1px solid var(--border-default)", background: "var(--bg-elevated)", boxShadow: "0 18px 60px rgba(0,0,0,0.35)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", padding: "18px 20px", background: "var(--bg-elevated)", borderBottom: "1px solid var(--border-default)" }}>
          <div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
              <Chip>{story.length === "long" ? "เรื่องยาว" : "เรื่องสั้น"}</Chip>
              <Chip>{story.genre === "puzzle" ? "ปริศนา" : story.genre === "horror" ? "สยองขวัญ" : "ลึกลับ"}</Chip>
              <Chip>{wordCount} คำศัพท์</Chip>
              <Chip>{idiomCount} สำนวน</Chip>
            </div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0, lineHeight: 1.25 }}>
              <span style={{ marginRight: "8px" }}>{card.emoji}</span>{card.name}
            </h2>
          </div>
          <button onClick={onClose} title="ปิด" style={{ width: "34px", height: "34px", borderRadius: "10px", border: "1px solid var(--border-default)", background: "var(--bg-subtle)", color: "var(--text-muted)", cursor: "pointer", fontSize: "18px", flexShrink: 0 }}>✕</button>
        </div>

        <div style={{ padding: "18px 20px 20px" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px", padding: "10px 12px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "var(--bg-subtle)" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "9999px", background: "#f59e0b", boxShadow: "0 0 0 3px rgba(245,158,11,0.18)" }} />
            <span style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              คำหรือสำนวนที่มีเส้นใต้สีทองสามารถเอาเมาส์ชี้หรือคลิก 1 ครั้งเพื่อดูความหมายได้
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "14px", marginBottom: "18px" }}>
            <section style={{ border: "1px solid var(--border-default)", borderRadius: "12px", padding: "14px", background: "var(--bg-surface)" }}>
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", margin: "0 0 10px" }}>English</h3>
              {story.english.map((paragraph, index) => (
                <p key={index} style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.65, color: "var(--text-primary)", margin: index === 0 ? "0 0 12px" : "12px 0" }}>
                  {renderInteractiveText(paragraph, matchers, hoveredId, pinnedId, setHoveredId, setPinnedId, setPopupAnchor, showGlossaryPopup)}
                </p>
              ))}
            </section>
            <section style={{ border: "1px solid var(--border-default)", borderRadius: "12px", padding: "14px", background: "var(--bg-subtle)" }}>
              <h3 style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, color: "var(--accent-primary)", margin: "0 0 10px" }}>คำแปลไทย</h3>
              {story.thai.map((paragraph, index) => (
                <p key={index} style={{ fontFamily: "var(--font-body)", fontSize: "14px", lineHeight: 1.65, color: "var(--text-primary)", margin: index === 0 ? "0 0 12px" : "12px 0" }}>
                  {paragraph}
                </p>
              ))}
            </section>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end", borderTop: "1px solid var(--border-default)", paddingTop: "16px" }}>
            <button onClick={onConfigure} style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              ⚙️ ตั้งค่าเกม
            </button>
            <button onClick={onStart} style={{ padding: "11px 18px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {Ico.play} เริ่มแบบฝึกหัด
            </button>
          </div>
        </div>
        {activePopupItem && popupAnchor && typeof document !== "undefined" && createPortal(
          <GlossaryPopup item={activePopupItem} anchor={popupAnchor} />,
          document.body,
        )}
      </motion.div>
    </motion.div>
  )
}

type GlossaryPopupAnchor = {
  id: string
  left: number
  top: number
  placement: "above" | "below"
}

type GlossaryMatcher = {
  term: string
  item: StoryGlossaryItem
}

function buildGlossaryMatchers(items: StoryGlossaryItem[]): GlossaryMatcher[] {
  const seen = new Set<string>()
  return items
    .flatMap(item => [item.english, ...(item.patterns ?? [])].map(term => ({ term: term.trim(), item })))
    .filter(entry => {
      const key = entry.term.toLowerCase()
      if (!entry.term || seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => b.term.length - a.term.length)
}

function isWordChar(char: string | undefined) {
  return Boolean(char && /[a-zA-Z0-9'-]/.test(char))
}

function matchesAt(text: string, index: number, term: string) {
  if (text.slice(index, index + term.length).toLowerCase() !== term.toLowerCase()) return false
  const before = text[index - 1]
  const after = text[index + term.length]
  return !isWordChar(before) && !isWordChar(after)
}

function renderInteractiveText(
  text: string,
  matchers: GlossaryMatcher[],
  hoveredId: string | null,
  pinnedId: string | null,
  setHoveredId: (id: string | null) => void,
  setPinnedId: (id: string | null) => void,
  setPopupAnchor: (anchor: GlossaryPopupAnchor | null) => void,
  showGlossaryPopup: (event: React.MouseEvent<HTMLButtonElement> | React.FocusEvent<HTMLButtonElement>, id: string) => void,
) {
  const nodes: React.ReactNode[] = []
  let index = 0
  while (index < text.length) {
    const match = matchers.find(entry => matchesAt(text, index, entry.term))
    if (!match) {
      nodes.push(text[index])
      index += 1
      continue
    }

    const label = text.slice(index, index + match.term.length)
    const isActive = hoveredId === match.item.id || pinnedId === match.item.id
    nodes.push(
      <span key={`${match.item.id}-${index}`} style={{ position: "relative", display: "inline-block" }}>
        <button
          data-story-glossary-trigger="true"
          type="button"
          onMouseEnter={event => {
            setHoveredId(match.item.id)
            showGlossaryPopup(event, match.item.id)
          }}
          onMouseLeave={() => {
            setHoveredId(null)
            if (pinnedId !== match.item.id) setPopupAnchor(null)
          }}
          onFocus={event => {
            setHoveredId(match.item.id)
            showGlossaryPopup(event, match.item.id)
          }}
          onBlur={() => {
            setHoveredId(null)
            if (pinnedId !== match.item.id) setPopupAnchor(null)
          }}
          onClick={event => {
            event.stopPropagation()
            if (pinnedId === match.item.id) {
              setPinnedId(null)
              setPopupAnchor(null)
              return
            }
            showGlossaryPopup(event, match.item.id)
            setPinnedId(match.item.id)
          }}
          title={`${match.item.thai}${match.item.kind === "idiom" ? " (สำนวน)" : ""}`}
          style={{
            border: "none",
            borderBottom: `2px ${match.item.kind === "idiom" ? "solid" : "dotted"} #f59e0b`,
            background: isActive ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.08)",
            color: "var(--text-primary)",
            borderRadius: "5px",
            padding: "0 3px",
            margin: "0 1px",
            font: "inherit",
            cursor: "help",
            lineHeight: 1.45,
          }}
        >
          {label}
        </button>
      </span>,
    )
    index += match.term.length
  }
  return nodes
}

function GlossaryPopup({ item, anchor }: { item: StoryGlossaryItem, anchor: GlossaryPopupAnchor }) {
  return (
    <span data-story-glossary-popup="true" style={{
      position: "fixed",
      left: `${anchor.left}px`,
      top: `${anchor.top}px`,
      transform: anchor.placement === "above" ? "translate(-50%, -100%)" : "translate(-50%, 0)",
      zIndex: 420,
      width: "260px",
      maxWidth: "calc(100vw - 24px)",
      padding: "10px 12px",
      borderRadius: "12px",
      border: "1px solid var(--border-default)",
      background: "var(--bg-elevated)",
      boxShadow: "0 10px 28px rgba(0,0,0,0.28)",
      color: "var(--text-primary)",
      fontFamily: "var(--font-body)",
      fontSize: "12px",
      lineHeight: 1.4,
      whiteSpace: "normal",
      pointerEvents: "auto",
    }}>
      <span style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "4px" }}>
        <strong style={{ color: "var(--accent-primary)" }}>{item.english}</strong>
        <span style={{ color: item.kind === "idiom" ? "#f59e0b" : "var(--text-muted)", fontSize: "10px", fontWeight: 700 }}>{item.kind === "idiom" ? "สำนวน" : "คำศัพท์"}</span>
      </span>
      <span style={{ display: "block", marginBottom: item.note ? "4px" : 0 }}>{item.thai}</span>
      {item.note && <span style={{ display: "block", color: "var(--text-muted)" }}>{item.note}</span>}
    </span>
  )
}
