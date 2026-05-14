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
    const result = await pool.query(`
      SELECT up.*, v.english, v.thai, v.category, v.difficulty
      FROM user_progress up
      JOIN vocabulary v ON v.id = up.word_id
      WHERE up.user_id = $1
      ORDER BY up.last_seen_at DESC
    `, [userId])
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Progress error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
