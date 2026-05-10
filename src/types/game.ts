// ── Shared game types ─────────────────────────────────────────

export type GameMode = "multiple-choice" | "think-reveal" | "timed"
export type Difficulty = 1 | 2 | 3 | 4 | 5

export interface VocabWord {
  id: string
  english: string
  thai: string
  phonetic?: string
  example?: string
  category: string
  difficulty: Difficulty
  synonyms?: string[]
}

export interface WordProgress {
  wordId: string
  streakCount: number     // consecutive correct answers
  attemptCount: number
  correctCount: number
  isMastered: boolean
  lastSeenAt?: Date
  avgTimeMs?: number
}

export interface GameAnswer {
  wordId: string
  selectedOption: string
  correct: boolean
  timeMs: number
}

export interface GameSession {
  id: string
  mode: GameMode
  startedAt: Date
  answers: GameAnswer[]
  wordsCompleted: number
  wordsMastered: number
  xpEarned: number
}

export interface UserStats {
  totalXP: number
  wordsMastered: number
  wordsAttempted: number
  currentStreak: number
  longestStreak: number
  accuracy: number        // 0-100
  avgTimeMs: number
  totalSessions: number
}

export interface LeaderboardEntry {
  userId: string
  displayName: string
  xp: number
  wordsMastered: number
  rank: number
}
