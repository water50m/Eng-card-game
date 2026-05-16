import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'
import { ensureVocabularySchema, upsertVocabularyWord } from '@/lib/vocabularySchema'

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    await ensureVocabularySchema()
    const result = await pool.query(
      'SELECT *, created_by IS NOT NULL AS "isUserWord" FROM vocabulary WHERE created_by IS NOT NULL ORDER BY created_at DESC'
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
    await ensureVocabularySchema()

    if (!english || !thai) {
      return NextResponse.json({ error: "english and thai are required" }, { status: 400 })
    }
    
    if (!createdBy) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }
    
    const row = await upsertVocabularyWord({
      english,
      thai,
      phonetic,
      example,
      category,
      difficulty,
      createdBy,
    })
    
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('POST admin vocab - Error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
