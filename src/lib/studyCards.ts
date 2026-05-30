import { QuizConfig } from "@/types/game"
import { QuizTemplate, loadUserTemplates } from "@/types/template"

export type LearningStyle = "fast" | "wide" | "classic"
export type CardSource = "system" | "user" | "template"
export type StyleDifficulty = 1 | 2 | 3 | 4

export const DEFAULT_STYLE_DIFFICULTY: Record<string, StyleDifficulty> = {
  "style-fast": 1,
  "style-wide": 1,
}

export function normalizeStyleDifficulty(value: unknown): Record<string, StyleDifficulty> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return DEFAULT_STYLE_DIFFICULTY

  return Object.entries(value).reduce<Record<string, StyleDifficulty>>((acc, [cardId, rawLevel]) => {
    const level = Number(rawLevel)
    if (Number.isInteger(level) && level >= 1 && level <= 4) {
      acc[cardId] = level as StyleDifficulty
    }
    return acc
  }, { ...DEFAULT_STYLE_DIFFICULTY })
}

export type PlayableCard = QuizTemplate & {
  learningStyle: LearningStyle
  source: CardSource
  templateId?: string
}

export type MasteryPrompt = {
  wordId: string
  english: string
  thai: string
  resolve: (confirmed: boolean) => void
}

export const EXAM_UNLOCK_COUNT = 20

export const BASE_STYLE_CARDS: PlayableCard[] = [
  {
    id: "style-fast",
    name: "เรียนรู้ฉับไว",
    emoji: "⚡",
    desc: "ล็อกคำชุดเล็ก 10 คำ ถ้าจำได้แล้วจะดึงคำใหม่มาแทนทันที",
    config: { category: "all", size: 10, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "fast",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-13",
    playCount: 0,
    tags: ["learning-style", "fast"],
  },
  {
    id: "style-wide",
    name: "เรียนรู้กว้างขวาง",
    emoji: "🌐",
    desc: "ล็อกคลังคำ 100 คำ แล้วสุ่มข้อสอบจากคลังนั้นตามจำนวนที่เลือก",
    config: { category: "all", size: 10, mode: "multiple-choice", hintsEnabled: true },
    learningStyle: "wide",
    source: "system",
    isGlobal: true,
    createdAt: "2026-05-13",
    playCount: 0,
    tags: ["learning-style", "wide"],
  },
]

export function normalizeCard(template: QuizTemplate, style: LearningStyle = "fast", source: CardSource = "user"): PlayableCard {
  return {
    ...template,
    learningStyle: style,
    source,
    config: {
      ...template.config,
      size: template.config.size || 10,
    } as QuizConfig,
  }
}

export function loadPlayableCards(): PlayableCard[] {
  return loadUserTemplates().map(t => normalizeCard(t, (t as QuizTemplate & { learningStyle?: LearningStyle }).learningStyle ?? "fast", "user"))
}
