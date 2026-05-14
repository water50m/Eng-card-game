import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')
  
  try {
    const result = await pool.query(`
      SELECT u.id, u.display_name as name, u.emoji, u.total_xp as xp, u.current_streak as streak,
             u.longest_streak as longest_streak
      FROM users u
      WHERE u.is_active = true
      ORDER BY u.total_xp DESC
      LIMIT $1
    `, [limit])
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
