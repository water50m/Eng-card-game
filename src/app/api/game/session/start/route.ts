import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId
  const { mode } = await request.json()

  try {
    const result = await pool.query(
      "INSERT INTO game_sessions (user_id, mode, started_at) VALUES ($1, $2, NOW()) RETURNING id",
      [userId, mode]
    )
    
    return NextResponse.json({ sessionId: result.rows[0].id })
  } catch (error) {
    console.error('Start session error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
