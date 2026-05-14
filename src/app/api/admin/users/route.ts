import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    const result = await pool.query(
      "SELECT id, display_name, emoji, pin, is_admin, is_active, total_xp, current_streak, created_at FROM users ORDER BY created_at DESC"
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Get admin users error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { displayName, pin, emoji, isAdmin } = await request.json()
  
  try {
    const result = await pool.query(
      "INSERT INTO users (display_name, pin, emoji, is_admin, is_active) VALUES ($1, $2, $3, $4, true) RETURNING *",
      [displayName, pin, emoji || '👤', isAdmin || false]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Create admin user error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
