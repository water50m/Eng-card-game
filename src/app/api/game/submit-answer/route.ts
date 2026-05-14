import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId
  const { wordId, correct, timeMs, sessionId } = await request.json()

  try {
    // Get current progress
    const currentProgress = await pool.query(
      "SELECT * FROM user_progress WHERE user_id = $1 AND word_id = $2",
      [userId, wordId]
    )

    const isMastered = correct && currentProgress.rows[0]?.streak_count >= 2
    const newStreak = correct ? (currentProgress.rows[0]?.streak_count || 0) + 1 : 0
    const attemptCount = (currentProgress.rows[0]?.attempt_count || 0) + 1
    const correctCount = (currentProgress.rows[0]?.correct_count || 0) + (correct ? 1 : 0)
    const avgTime = currentProgress.rows[0] 
      ? ((currentProgress.rows[0].avg_time_ms * (attemptCount - 1)) + timeMs) / attemptCount
      : timeMs

    // Update or insert progress
    if (currentProgress.rows[0]) {
      await pool.query(`
        UPDATE user_progress 
        SET streak_count = $1, attempt_count = $2, correct_count = $3, avg_time_ms = $4, 
            is_mastered = $5, last_seen_at = NOW()
        WHERE user_id = $6 AND word_id = $7
      `, [newStreak, attemptCount, correctCount, avgTime, isMastered, userId, wordId])
    } else {
      await pool.query(`
        INSERT INTO user_progress (user_id, word_id, streak_count, attempt_count, correct_count, avg_time_ms, is_mastered, last_seen_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [userId, wordId, newStreak, attemptCount, correctCount, avgTime, isMastered])
    }

    // Update user stats
    const xpEarned = correct ? 10 : 2
    await pool.query(`
      UPDATE users 
      SET total_xp = total_xp + $1, current_streak = $2
      WHERE id = $3
    `, [xpEarned, newStreak, userId])

    const accuracy = Math.round((correctCount / attemptCount) * 100)

    return NextResponse.json({
      correct,
      isMastered,
      newStreak,
      xpEarned,
      accuracy
    })
  } catch (error) {
    console.error('Submit answer error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
