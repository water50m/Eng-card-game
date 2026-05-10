import { WordProgress, VocabWord, GameAnswer } from "../types/game"

// ── Mastery Rules ─────────────────────────────────────────────
// 4 consecutive correct  AND  attempts ≤ 10  → MASTERED
// OR accuracy ≥ 90%  AND  attempts ≥ 5       → MASTERED
// Wrong answer → reset streak to 0

export function updateProgress(
  prev: WordProgress,
  answer: GameAnswer,
): WordProgress {
  const correct = answer.correct
  const newStreak = correct ? prev.streakCount + 1 : 0
  const newAttempts = prev.attemptCount + 1
  const newCorrect = prev.correctCount + (correct ? 1 : 0)
  const accuracy = newAttempts > 0 ? (newCorrect / newAttempts) * 100 : 0

  const isMastered =
    (newStreak >= 4 && newAttempts <= 10) ||
    (accuracy >= 90 && newAttempts >= 5)

  const prevAvg = prev.avgTimeMs ?? answer.timeMs
  const newAvg = Math.round((prevAvg * (newAttempts - 1) + answer.timeMs) / newAttempts)

  return {
    ...prev,
    streakCount:  newStreak,
    attemptCount: newAttempts,
    correctCount: newCorrect,
    isMastered,
    lastSeenAt: new Date(),
    avgTimeMs: newAvg,
  }
}

export function calcXP(answer: GameAnswer, streak: number): number {
  if (!answer.correct) return 0
  const base = 10
  const streakBonus = Math.min(streak, 5) * 2
  const speedBonus = answer.timeMs < 3000 ? 5 : answer.timeMs < 6000 ? 2 : 0
  return base + streakBonus + speedBonus
}

// ── Word Selection ────────────────────────────────────────────
export function pickRandomWord(
  words: VocabWord[],
  progress: Map<string, WordProgress>,
): VocabWord {
  // Prioritise: not mastered > not seen > random
  const unmastered = words.filter(w => !progress.get(w.id)?.isMastered)
  const unseen = unmastered.filter(w => !progress.has(w.id))
  const pool = unseen.length > 0 ? unseen : unmastered.length > 0 ? unmastered : words
  return pool[Math.floor(Math.random() * pool.length)]
}

export function buildOptions(
  correct: VocabWord,
  allWords: VocabWord[],
): string[] {
  const distractors = allWords
    .filter(w => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map(w => w.thai)
  const options = [...distractors, correct.thai].sort(() => Math.random() - 0.5)
  return options
}

// ── Stats helpers ─────────────────────────────────────────────
export function computeAccuracy(progress: Map<string, WordProgress>): number {
  let total = 0, correct = 0
  progress.forEach(p => {
    total += p.attemptCount
    correct += p.correctCount
  })
  return total === 0 ? 0 : Math.round((correct / total) * 100)
}
