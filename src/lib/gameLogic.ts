// english-card-game/src/lib/gameLogic.ts
import { WordProgress, VocabWord, GameAnswer, MarkLevel } from "../types/game"

// ── Mastery Rules ─────────────────────────────────────────────
// 4 consecutive correct AND attempts <= 10 → MASTERED
// OR accuracy >= 90% AND attempts >= 5    → MASTERED
// Wrong answer → streak reset to 0

export function updateProgress(
  prev: WordProgress,
  answer: GameAnswer,
): WordProgress {
  const correct    = answer.correct
  const newStreak  = correct ? prev.streakCount + 1 : 0
  const newAttempt = prev.attemptCount + 1
  const newCorrect = prev.correctCount + (correct ? 1 : 0)
  const accuracy   = newAttempt > 0 ? (newCorrect / newAttempt) * 100 : 0

  const isMastered =
    prev.isMastered ||                           // keep if already mastered
    (newStreak >= 4 && newAttempt <= 10) ||
    (accuracy >= 90 && newAttempt >= 5)

  const prevAvg = prev.avgTimeMs ?? answer.timeMs
  const newAvg  = Math.round((prevAvg * (newAttempt - 1) + answer.timeMs) / newAttempt)

  // auto-promote mark level when mastered
  const markLevel: MarkLevel = isMastered && prev.markLevel === 0 ? 2 : prev.markLevel

  return {
    ...prev,
    streakCount:  newStreak,
    attemptCount: newAttempt,
    correctCount: newCorrect,
    isMastered,
    markLevel,
    lastSeenAt: new Date(),
    avgTimeMs:  newAvg,
  }
}

export function calcXP(answer: GameAnswer, streak: number): number {
  if (!answer.correct) return 0
  const base        = 10
  const streakBonus = Math.min(streak, 5) * 2
  const speedBonus  = answer.timeMs < 3000 ? 5 : answer.timeMs < 6000 ? 2 : 0
  return base + streakBonus + speedBonus
}

// ── Word selection (respects mark level) ─────────────────────
export function pickRandomWord(
  words: VocabWord[],
  progress: Map<string, WordProgress>,
): VocabWord {
  const eligible = words.filter(w => {
    const p    = progress.get(w.id)
    const mark = (p?.markLevel ?? 0) as MarkLevel
    if (mark === 3) return false                      // hidden — never show
    if (mark === 2) return Math.random() < 0.05       // mastered — 5%
    if (mark === 1) return Math.random() < 0.20       // known — 20%
    return true
  })

  // prefer unseen
  const unseen = eligible.filter(w => !progress.has(w.id))
  const pool   = unseen.length > 0 ? unseen : eligible.length > 0 ? eligible : words
  return pool[Math.floor(Math.random() * pool.length)]
}

export function buildOptions(correct: VocabWord, allWords: VocabWord[]): string[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.thai)
  return [...distractors, correct.thai].sort(() => Math.random() - 0.5)
}

export function computeAccuracy(progress: Map<string, WordProgress>): number {
  let total = 0, correct = 0
  progress.forEach(p => { total += p.attemptCount; correct += p.correctCount })
  return total === 0 ? 0 : Math.round((correct / total) * 100)
}
