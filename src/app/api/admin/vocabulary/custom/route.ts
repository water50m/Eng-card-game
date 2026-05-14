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
      'SELECT * FROM admin_custom_vocabulary ORDER BY created_at DESC'
    )
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Get admin custom vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const createdBy = authResult.user.userId
  const { english, thai, phonetic, example, category, difficulty } = await request.json()
  
  try {
    if (!english || !thai) {
      return NextResponse.json({ error: "english and thai are required" }, { status: 400 })
    }
    
    if (!createdBy) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const result = await pool.query(
      'INSERT INTO admin_custom_vocabulary (english, thai, phonetic, example, category, difficulty, created_by) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7) ' +
      'ON CONFLICT (english) DO UPDATE SET ' +
      'thai = $2, phonetic = $3, example = $4, category = $5, difficulty = $6, updated_at = NOW() ' +
      'RETURNING *',
      [english, thai, phonetic, example, category || 'general', difficulty || 2, createdBy]
    )
    
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('POST admin vocab - Error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
