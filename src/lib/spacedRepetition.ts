// english-card-game/src/lib/spacedRepetition.ts
// SM-2 Spaced Repetition Algorithm
// Schedules review intervals based on answer quality (0-5 scale)

export interface SRCard {
  wordId:        string
  easeFactor:    number   // starts at 2.5, min 1.3
  interval:      number   // days until next review
  repetitions:   number   // consecutive successful reviews
  nextReviewAt:  Date
  lastReviewAt?: Date
}

// Quality score: 0-5 (we map correct/wrong + speed to this)
// 5 = perfect, 4 = correct with hesitation, 3 = correct barely
// 2 = wrong but remembered, 1 = wrong, 0 = total blackout
export function answerQuality(correct: boolean, timeMs: number, streakBefore: number): number {
  if (!correct) return streakBefore > 2 ? 2 : 1
  if (timeMs < 3000) return 5
  if (timeMs < 6000) return 4
  return 3
}

export function sm2Update(card: SRCard, quality: number): SRCard {
  const q = Math.max(0, Math.min(5, quality))

  // New ease factor
  const newEF = Math.max(
    1.3,
    card.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  )

  let newInterval: number
  let newReps: number

  if (q < 3) {
    // Failed — restart
    newInterval = 1
    newReps     = 0
  } else {
    newReps = card.repetitions + 1
    if (card.repetitions === 0)      newInterval = 1
    else if (card.repetitions === 1) newInterval = 6
    else newInterval = Math.round(card.interval * newEF)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return {
    ...card,
    easeFactor:   newEF,
    interval:     newInterval,
    repetitions:  newReps,
    lastReviewAt: new Date(),
    nextReviewAt,
  }
}

export function createCard(wordId: string): SRCard {
  return {
    wordId,
    easeFactor:   2.5,
    interval:     1,
    repetitions:  0,
    nextReviewAt: new Date(),
  }
}

export function isDue(card: SRCard): boolean {
  return new Date() >= card.nextReviewAt
}

/** Return cards due for review today, sorted by urgency */
export function getDueCards(cards: SRCard[]): SRCard[] {
  const now = new Date()
  return cards
    .filter(c => c.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt.getTime() - b.nextReviewAt.getTime())
}

/** Encode/decode SRCard map to localStorage */
export function saveSRCards(cards: Map<string, SRCard>): void {
  const obj: Record<string, any> = {}
  cards.forEach((v, k) => {
    obj[k] = { ...v, nextReviewAt: v.nextReviewAt.toISOString(), lastReviewAt: v.lastReviewAt?.toISOString() }
  })
  localStorage.setItem("ecg-sr-cards", JSON.stringify(obj))
}

export function loadSRCards(): Map<string, SRCard> {
  const map = new Map<string, SRCard>()
  try {
    const raw = localStorage.getItem("ecg-sr-cards")
    if (!raw) return map
    const obj = JSON.parse(raw)
    Object.entries(obj).forEach(([k, v]: [string, any]) => {
      map.set(k, {
        ...v,
        nextReviewAt: new Date(v.nextReviewAt),
        lastReviewAt: v.lastReviewAt ? new Date(v.lastReviewAt) : undefined,
      })
    })
  } catch { /* ignore */ }
  return map
}
