import pool from "@/lib/database"
import { ensureStudySchema } from "@/lib/studySchema"
import type { GameMode, QuizConfig, VocabWord } from "@/types/game"
import type { PlayableCard, StoryContent, StoryGlossaryItem } from "@/lib/studyCards"

type StoryGenre = StoryContent["genre"]
type StoryLength = StoryContent["length"]

export type StoryCardInput = {
  name?: string
  emoji?: string
  desc?: string
  genre?: string
  length?: string
  english?: string[]
  thai?: string[]
  vocabulary?: Partial<StoryGlossaryItem>[]
  config?: Partial<QuizConfig>
  tags?: string[]
}

type StoryCardRow = {
  id: string
  name: string
  emoji: string
  description: string
  story_length: StoryLength
  genre: StoryGenre
  english: string[]
  thai: string[]
  vocabulary: StoryGlossaryItem[]
  config: QuizConfig
  tags: string[] | null
  play_count: number
  created_at: string
}

const GAME_MODES: GameMode[] = ["multiple-choice", "think-reveal", "timed-reveal", "timed", "typing", "invert"]

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)
}

function normalizeLength(value: unknown): StoryLength {
  return value === "long" ? "long" : "short"
}

function normalizeGenre(value: unknown): StoryGenre {
  return value === "horror" || value === "puzzle" ? value : "mystery"
}

function normalizeConfig(input: Partial<QuizConfig> | undefined, vocabCount: number): QuizConfig {
  const mode = GAME_MODES.includes(input?.mode as GameMode) ? input?.mode as GameMode : "multiple-choice"
  const rawSize = Number(input?.size)
  const size = ([10, 20, 30, 50, 70, 100].includes(rawSize) ? rawSize : Math.min(20, Math.max(10, vocabCount))) as QuizConfig["size"]
  return {
    category: "story",
    size,
    mode,
    hintsEnabled: input?.hintsEnabled !== false,
  }
}

function normalizeParagraphs(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(item => String(item).trim()).filter(Boolean)
}

function normalizeTags(value: unknown, length: StoryLength, genre: StoryGenre) {
  const tags = Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : []
  return Array.from(new Set(["story", length, genre, ...tags]))
}

function normalizeVocabulary(value: unknown, cardId: string): StoryGlossaryItem[] {
  if (!Array.isArray(value)) return []
  const words: StoryGlossaryItem[] = []
  value.forEach((item, index) => {
    if (!item || typeof item !== "object") return
    const word = item as Partial<StoryGlossaryItem>
    const english = String(word.english ?? "").trim()
    const thai = String(word.thai ?? "").trim()
    if (!english || !thai) return
    const rawDifficulty = Number(word.difficulty)
    const difficulty = Math.min(5, Math.max(1, Number.isFinite(rawDifficulty) ? rawDifficulty : 2)) as VocabWord["difficulty"]
    const patterns = Array.isArray(word.patterns)
      ? word.patterns.map(pattern => String(pattern).trim()).filter(Boolean)
      : undefined
    words.push({
      id: String(word.id || `${cardId}-${slugify(english) || `word-${index + 1}`}`),
      english,
      thai,
      phonetic: word.phonetic ? String(word.phonetic) : undefined,
      example: word.example ? String(word.example) : undefined,
      category: "story",
      difficulty,
      kind: word.kind === "idiom" ? "idiom" : "word",
      patterns,
      note: word.note ? String(word.note) : undefined,
    })
  })
  return words
}

export function storyCardRowToPlayable(row: StoryCardRow): PlayableCard {
  return {
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    desc: row.description,
    config: row.config,
    isGlobal: true,
    createdAt: row.created_at,
    playCount: row.play_count,
    tags: row.tags ?? ["story"],
    learningStyle: "classic",
    source: "system",
    story: {
      length: row.story_length,
      genre: row.genre,
      english: row.english,
      thai: row.thai,
      vocabulary: row.vocabulary,
    },
  }
}

export async function listStoryCards(includeInactive = false) {
  await ensureStudySchema()
  const result = await pool.query<StoryCardRow>(
    `SELECT id, name, emoji, description, story_length, genre, english, thai, vocabulary, config, tags, play_count, created_at
     FROM story_cards
     WHERE ($1::boolean = true OR is_active = true)
     ORDER BY created_at DESC`,
    [includeInactive],
  )
  return result.rows.map(storyCardRowToPlayable)
}

export async function createStoryCard(input: StoryCardInput, createdBy: string) {
  await ensureStudySchema()
  const name = String(input.name ?? "").trim()
  if (!name) throw new Error("name is required")

  const length = normalizeLength(input.length)
  const genre = normalizeGenre(input.genre)
  const english = normalizeParagraphs(input.english)
  const thai = normalizeParagraphs(input.thai)
  if (english.length === 0 || thai.length === 0) throw new Error("english and thai story paragraphs are required")

  const id = `story-admin-${Date.now()}-${slugify(name) || "card"}`
  const vocabulary = normalizeVocabulary(input.vocabulary, id)
  if (vocabulary.length < 2) throw new Error("at least 2 vocabulary items are required")

  const config = normalizeConfig(input.config, vocabulary.length)
  const tags = normalizeTags(input.tags, length, genre)
  const result = await pool.query<StoryCardRow>(
    `INSERT INTO story_cards
       (id, name, emoji, description, story_length, genre, english, thai, vocabulary, config, tags, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8::text[], $9::jsonb, $10::jsonb, $11::text[], $12, NOW())
     RETURNING id, name, emoji, description, story_length, genre, english, thai, vocabulary, config, tags, play_count, created_at`,
    [
      id,
      name,
      String(input.emoji || "📖").trim() || "📖",
      String(input.desc ?? "").trim(),
      length,
      genre,
      english,
      thai,
      JSON.stringify(vocabulary),
      JSON.stringify(config),
      tags,
      createdBy,
    ],
  )
  return storyCardRowToPlayable(result.rows[0])
}

export async function deleteStoryCard(id: string) {
  await ensureStudySchema()
  await pool.query("UPDATE story_cards SET is_active = false, updated_at = NOW() WHERE id = $1", [id])
}
