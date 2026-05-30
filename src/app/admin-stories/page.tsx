"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { NavBar } from "../../components/NavBar"
import { useAuth } from "../../hooks/useAuth"
import type { GameMode } from "../../types/game"
import type { PlayableCard } from "../../lib/studyCards"

type StoryForm = {
  name: string
  emoji: string
  desc: string
  genre: "mystery" | "horror" | "puzzle"
  length: "short" | "long"
  englishText: string
  thaiText: string
  vocabularyJson: string
  size: "10" | "20" | "30" | "50" | "70" | "100"
  mode: GameMode
  hintsEnabled: boolean
  tagsText: string
}

const TEMPLATE_VOCABULARY = [
  { english: "threshold", thai: "ธรณีประตู / จุดเริ่มต้น", phonetic: "THRESH-hohld", example: "She stopped at the threshold.", difficulty: 3 },
  { english: "corridor", thai: "ทางเดินยาว", phonetic: "KOR-ih-dor", example: "The corridor was silent.", difficulty: 2 },
  { english: "whisper", thai: "เสียงกระซิบ", phonetic: "WIS-per", example: "A whisper came from the wall.", difficulty: 2 },
  { english: "vanished", thai: "หายตัวไป", phonetic: "VAN-isht", example: "The key vanished from her hand.", difficulty: 2 },
  { english: "evidence", thai: "หลักฐาน", phonetic: "EV-ih-dens", example: "The evidence was hidden.", difficulty: 2 },
  { english: "shadow", thai: "เงา", phonetic: "SHAD-oh", example: "A shadow crossed the window.", difficulty: 1 },
  { english: "locked", thai: "ถูกล็อก", phonetic: "lokt", example: "The door was locked.", difficulty: 1 },
  { english: "silence", thai: "ความเงียบ", phonetic: "SY-lens", example: "Silence filled the room.", difficulty: 1 },
  { english: "trembled", thai: "สั่น", phonetic: "TREM-buld", example: "The candle trembled.", difficulty: 2 },
  { english: "confession", thai: "คำสารภาพ", phonetic: "kun-FESH-un", example: "The confession was written in red ink.", difficulty: 3 },
  { english: "answered back", thai: "ตอบกลับ", phonetic: "AN-serd bak", example: "The room answered back with her own voice.", difficulty: 2, kind: "idiom", patterns: ["answered with her own voice", "answered back"], note: "ใช้เมื่อบางอย่างตอบสนองกลับมา" },
  { english: "at the end of", thai: "ที่ปลาย / ท้ายของ", phonetic: "at thee end uv", example: "The room was at the end of the corridor.", difficulty: 2, kind: "idiom", patterns: ["at the end of"], note: "สำนวนบอกตำแหน่งปลายทางของสถานที่หรือช่วงเวลา" },
  { english: "waited under", thai: "วางรออยู่ใต้", phonetic: "WAY-ted UN-der", example: "A confession waited under a candle.", difficulty: 2, kind: "idiom", patterns: ["waited under"], note: "ใช้ waited เพื่อทำให้สิ่งของดูเหมือนตั้งใจรอคนพบ" },
]

const STORY_TEMPLATE: StoryForm = {
  name: "The Room That Answered Back",
  emoji: "🕯️",
  desc: "เรื่องสั้นลึกลับเกี่ยวกับห้องปิดตายที่ตอบคำถามได้เอง",
  genre: "mystery",
  length: "short",
  englishText: [
    "Lena found the locked room at the end of the corridor, where the dust stopped at the threshold.",
    "When she asked who was inside, a whisper answered with her own voice.",
    "On the desk, a confession waited under a trembling candle.",
    "The final line said, 'I vanished because you opened the door tomorrow.'",
  ].join("\n\n"),
  thaiText: [
    "ลีนาพบห้องที่ถูกล็อกอยู่ปลายทางเดิน ตรงที่ฝุ่นหยุดอยู่แค่ธรณีประตู",
    "เมื่อเธอถามว่าใครอยู่ข้างใน เสียงกระซิบก็ตอบกลับด้วยเสียงของเธอเอง",
    "บนโต๊ะมีคำสารภาพวางรออยู่ใต้เทียนที่สั่นไหว",
    "บรรทัดสุดท้ายเขียนว่า 'ฉันหายตัวไปเพราะเธอเปิดประตูในวันพรุ่งนี้'",
  ].join("\n\n"),
  vocabularyJson: JSON.stringify(TEMPLATE_VOCABULARY, null, 2),
  size: "10",
  mode: "multiple-choice",
  hintsEnabled: true,
  tagsText: "mystery, locked-room, beginner",
}

const EMPTY_FORM: StoryForm = {
  name: "",
  emoji: "📖",
  desc: "",
  genre: "mystery",
  length: "short",
  englishText: "",
  thaiText: "",
  vocabularyJson: "[]",
  size: "10",
  mode: "multiple-choice",
  hintsEnabled: true,
  tagsText: "",
}

function authHeaders() {
  const token = typeof window === "undefined" ? null : localStorage.getItem("ecg-token")
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function paragraphs(text: string) {
  return text.split(/\n{2,}/).map(item => item.trim()).filter(Boolean)
}

export default function AdminStoriesPage() {
  const { user, ready } = useAuth()
  const [cards, setCards] = useState<PlayableCard[]>([])
  const [form, setForm] = useState<StoryForm>(STORY_TEMPLATE)
  const [toast, setToast] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const vocabCount = useMemo(() => {
    try {
      const parsed = JSON.parse(form.vocabularyJson)
      return Array.isArray(parsed) ? parsed.filter(item => item?.english && item?.thai).length : 0
    } catch {
      return 0
    }
  }, [form.vocabularyJson])

  useEffect(() => {
    if (ready && user?.isAdmin) void loadCards()
  }, [ready, user?.isAdmin])

  function showToast(message: string) {
    setToast(message)
    setTimeout(() => setToast(""), 2600)
  }

  async function loadCards() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/story-cards", { headers: authHeaders() })
      if (!res.ok) throw new Error(await res.text())
      setCards(await res.json())
    } catch (error) {
      console.error(error)
      showToast("โหลด story cards ไม่สำเร็จ")
    } finally {
      setLoading(false)
    }
  }

  async function saveCard() {
    let vocabulary: unknown
    try {
      vocabulary = JSON.parse(form.vocabularyJson)
      if (!Array.isArray(vocabulary)) throw new Error("Vocabulary must be an array")
    } catch {
      showToast("Vocabulary JSON ไม่ถูกต้อง")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/story-cards", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name: form.name,
          emoji: form.emoji,
          desc: form.desc,
          genre: form.genre,
          length: form.length,
          english: paragraphs(form.englishText),
          thai: paragraphs(form.thaiText),
          vocabulary,
          config: {
            category: "story",
            size: Number(form.size),
            mode: form.mode,
            hintsEnabled: form.hintsEnabled,
          },
          tags: form.tagsText.split(",").map(tag => tag.trim()).filter(Boolean),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Save failed")
      setCards(prev => [data, ...prev])
      setForm(EMPTY_FORM)
      showToast("เพิ่ม story card แล้ว")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ")
    } finally {
      setSaving(false)
    }
  }

  async function deleteCard(id: string) {
    if (!confirm("ลบ story card นี้ออกจากหน้าเกม?")) return
    const res = await fetch(`/api/admin/story-cards/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: authHeaders(),
    })
    if (!res.ok) {
      showToast("ลบไม่สำเร็จ")
      return
    }
    setCards(prev => prev.filter(card => card.id !== id))
    showToast("ลบ story card แล้ว")
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border-default)",
    background: "var(--bg-elevated)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    outline: "none",
  }

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-body)",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
  }

  if (!ready) return null
  if (!user?.isAdmin) return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      <NavBar/>
      <main style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-secondary)" }}>ต้องใช้สิทธิ์ Admin</p>
      </main>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", paddingBottom: "80px" }}>
      <NavBar/>
      <AnimatePresence>{toast && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
          style={{ position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)", zIndex: 300, padding: "10px 18px", borderRadius: "9999px", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700 }}>
          {toast}
        </motion.div>
      )}</AnimatePresence>

      <main style={{ maxWidth: "1120px", margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "26px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>🕯️ Story Cards</h1>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>เพิ่มเรื่องเล่า พร้อมคำแปลและคำศัพท์สำหรับทำแบบฝึกหัด</p>
          </div>
          <button onClick={() => setForm(STORY_TEMPLATE)}
            style={{ padding: "10px 16px", borderRadius: "12px", border: "1px solid var(--accent-primary)", background: "transparent", color: "var(--accent-primary)", fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
            ใช้ template ตัวอย่าง
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(300px,0.8fr)", gap: "16px", alignItems: "start" }}>
          <section style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)", borderRadius: "16px", padding: "18px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "72px 1fr", gap: "12px", marginBottom: "12px" }}>
              <label>
                <span style={labelStyle}>Emoji</span>
                <input style={inputStyle} value={form.emoji} onChange={e => setForm(prev => ({ ...prev, emoji: e.target.value }))} maxLength={4}/>
              </label>
              <label>
                <span style={labelStyle}>ชื่อเรื่อง</span>
                <input style={inputStyle} value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="The ..." />
              </label>
            </div>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={labelStyle}>คำอธิบายบน card</span>
              <input style={inputStyle} value={form.desc} onChange={e => setForm(prev => ({ ...prev, desc: e.target.value }))} placeholder="เรื่องสั้นลึกลับ..." />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: "12px", marginBottom: "12px" }}>
              <label>
                <span style={labelStyle}>แนวเรื่อง</span>
                <select style={inputStyle} value={form.genre} onChange={e => setForm(prev => ({ ...prev, genre: e.target.value as StoryForm["genre"] }))}>
                  <option value="mystery">ลึกลับ</option>
                  <option value="horror">สยองขวัญ</option>
                  <option value="puzzle">ปริศนา</option>
                </select>
              </label>
              <label>
                <span style={labelStyle}>ความยาว</span>
                <select style={inputStyle} value={form.length} onChange={e => setForm(prev => ({ ...prev, length: e.target.value as StoryForm["length"] }))}>
                  <option value="short">เรื่องสั้น</option>
                  <option value="long">เรื่องยาว</option>
                </select>
              </label>
              <label>
                <span style={labelStyle}>จำนวนคำ</span>
                <select style={inputStyle} value={form.size} onChange={e => setForm(prev => ({ ...prev, size: e.target.value as StoryForm["size"] }))}>
                  {["10","20","30","50","70","100"].map(size => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <label>
                <span style={labelStyle}>โหมดเกม</span>
                <select style={inputStyle} value={form.mode} onChange={e => setForm(prev => ({ ...prev, mode: e.target.value as GameMode }))}>
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="think-reveal">Think & Reveal</option>
                  <option value="timed-reveal">Reveal Timed</option>
                  <option value="timed">Timed</option>
                  <option value="typing">Typing</option>
                  <option value="invert">TH→EN Invert</option>
                </select>
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
              <label>
                <span style={labelStyle}>English story</span>
                <textarea style={{ ...inputStyle, minHeight: "220px", resize: "vertical", lineHeight: 1.5 }} value={form.englishText} onChange={e => setForm(prev => ({ ...prev, englishText: e.target.value }))} placeholder="แยก paragraph ด้วยบรรทัดว่าง" />
              </label>
              <label>
                <span style={labelStyle}>คำแปลไทย</span>
                <textarea style={{ ...inputStyle, minHeight: "220px", resize: "vertical", lineHeight: 1.5 }} value={form.thaiText} onChange={e => setForm(prev => ({ ...prev, thaiText: e.target.value }))} placeholder="แยก paragraph ด้วยบรรทัดว่าง" />
              </label>
            </div>

            <label style={{ display: "block", marginBottom: "12px" }}>
              <span style={labelStyle}>Vocabulary / Idioms JSON ({vocabCount} รายการ)</span>
              <textarea style={{ ...inputStyle, minHeight: "220px", resize: "vertical", fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: 1.45 }} value={form.vocabularyJson} onChange={e => setForm(prev => ({ ...prev, vocabularyJson: e.target.value }))} />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "12px", alignItems: "end" }}>
              <label>
                <span style={labelStyle}>Tags</span>
                <input style={inputStyle} value={form.tagsText} onChange={e => setForm(prev => ({ ...prev, tagsText: e.target.value }))} placeholder="mystery, short, beginner" />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", height: "42px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text-primary)" }}>
                <input type="checkbox" checked={form.hintsEnabled} onChange={e => setForm(prev => ({ ...prev, hintsEnabled: e.target.checked }))} />
                เปิดคำใบ้
              </label>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => setForm(EMPTY_FORM)} style={{ padding: "11px 16px", borderRadius: "12px", border: "1px solid var(--border-default)", background: "transparent", color: "var(--text-secondary)", fontFamily: "var(--font-body)", fontSize: "14px", cursor: "pointer" }}>ล้างฟอร์ม</button>
              <button onClick={saveCard} disabled={saving} style={{ padding: "11px 20px", borderRadius: "12px", border: "none", background: "var(--accent-primary)", color: "var(--text-on-accent)", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "กำลังบันทึก..." : "เพิ่ม Story Card"}</button>
            </div>
          </section>

          <aside style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", color: "var(--text-primary)", margin: 0 }}>รายการที่เพิ่มแล้ว</h2>
            {loading && <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>กำลังโหลด...</p>}
            {!loading && cards.length === 0 && <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>ยังไม่มี story card จาก admin</p>}
            {cards.map(card => (
              <div key={card.id} style={{ border: "1px solid var(--border-default)", borderRadius: "14px", background: "var(--bg-surface)", padding: "14px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "8px" }}>
                  <span style={{ fontSize: "24px" }}>{card.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.25 }}>{card.name}</h3>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{card.desc}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "10px" }}>
                  <span style={miniChip}>{card.story?.length === "long" ? "เรื่องยาว" : "เรื่องสั้น"}</span>
                  <span style={miniChip}>{card.story?.genre}</span>
                  <span style={miniChip}>{card.story?.vocabulary.length ?? 0} คำ</span>
                </div>
                <button onClick={() => deleteCard(card.id)} style={{ width: "100%", padding: "8px 10px", borderRadius: "10px", border: "1px solid var(--color-danger)", background: "transparent", color: "var(--color-danger)", fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>ลบออกจากหน้าเกม</button>
              </div>
            ))}
          </aside>
        </div>
      </main>
    </div>
  )
}

const miniChip: React.CSSProperties = {
  padding: "3px 8px",
  borderRadius: "9999px",
  border: "1px solid var(--border-default)",
  background: "var(--bg-subtle)",
  color: "var(--text-muted)",
  fontFamily: "var(--font-body)",
  fontSize: "11px",
}
