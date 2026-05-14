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
    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    )
    
    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = await pool.query(`
        INSERT INTO user_settings (user_id, theme, font_size, preferred_categories)
        VALUES ($1, 'default', 'medium', '{}')
        RETURNING *
      `, [userId])
      return NextResponse.json(defaultSettings.rows[0])
    } else {
      return NextResponse.json(result.rows[0])
    }
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId
  const { theme, fontSize, preferredCategories } = await request.json()
  
  try {
    const result = await pool.query(`
      INSERT INTO user_settings (user_id, theme, font_size, preferred_categories, updated_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        theme = $2, font_size = $3, preferred_categories = $4, updated_at = NOW()
      RETURNING *
    `, [userId, theme || 'default', fontSize || 'medium', JSON.stringify(preferredCategories || [])])
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
