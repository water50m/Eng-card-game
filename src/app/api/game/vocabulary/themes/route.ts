import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    const result = await pool.query(
      "SELECT category, COUNT(*) as count FROM vocabulary GROUP BY category ORDER BY count DESC"
    )
    
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Themes error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
