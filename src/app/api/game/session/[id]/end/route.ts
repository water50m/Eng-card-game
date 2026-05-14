import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { id } = await params
  const { wordsCompleted, wordsMastered, xpEarned } = await request.json()

  try {
    await pool.query(
      "UPDATE game_sessions SET ended_at = NOW(), words_completed = $1, words_mastered = $2, xp_earned = $3 WHERE id = $4",
      [wordsCompleted, wordsMastered, xpEarned, id]
    )
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('End session error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
