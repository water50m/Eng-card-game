import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId

  try {
    const [userRow, masteredCount, attemptCount, sessions, dailyProgress] = await Promise.all([
      pool.query("SELECT * FROM users WHERE id = $1", [userId]),
      pool.query("SELECT COUNT(*) as count FROM user_progress WHERE user_id = $1 AND is_mastered = true", [userId]),
      pool.query("SELECT COUNT(*) as total, SUM(CASE WHEN correct_count > 0 THEN 1 ELSE 0 END) as correct FROM user_progress WHERE user_id = $1", [userId]),
      pool.query("SELECT COUNT(*) as count FROM game_sessions WHERE user_id = $1", [userId]),
      pool.query(`
        SELECT DATE(started_at) as day,
               SUM(words_completed) as completed,
               SUM(words_mastered) as mastered
        FROM game_sessions
        WHERE user_id = $1 AND started_at > NOW() - INTERVAL '7 days'
        GROUP BY DATE(started_at)
        ORDER BY day
      `, [userId]),
    ])

    const u = userRow.rows[0]
    const total = parseInt(attemptCount.rows[0]?.total || "0")
    const correct = parseInt(attemptCount.rows[0]?.correct || "0")

    return NextResponse.json({
      wordsMastered: parseInt(masteredCount.rows[0]?.count || "0"),
      wordsAttempted: total,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      totalXP: u.total_xp || 0,
      currentStreak: u.current_streak || 0,
      longestStreak: u.longest_streak || 0,
      totalSessions: parseInt(sessions.rows[0]?.count || "0"),
      dailyProgress: dailyProgress.rows,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
