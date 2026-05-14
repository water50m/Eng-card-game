import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    const [userStats, vocabStats, sessionStats] = await Promise.all([
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN is_admin THEN 1 END) as admins, COUNT(CASE WHEN is_active THEN 1 END) as active FROM users"),
      pool.query("SELECT COUNT(*) as total, COUNT(DISTINCT category) as categories FROM vocabulary"),
      pool.query("SELECT COUNT(*) as total, COUNT(CASE WHEN ended_at IS NOT NULL THEN 1 END) as completed FROM game_sessions")
    ])

    return NextResponse.json({
      users: {
        total: parseInt(userStats.rows[0].total),
        admins: parseInt(userStats.rows[0].admins),
        active: parseInt(userStats.rows[0].active)
      },
      vocabulary: {
        total: parseInt(vocabStats.rows[0].total),
        categories: parseInt(vocabStats.rows[0].categories)
      },
      sessions: {
        total: parseInt(sessionStats.rows[0].total),
        completed: parseInt(sessionStats.rows[0].completed)
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
