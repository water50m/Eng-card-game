import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'
import { ensureVocabularySchema } from '@/lib/vocabularySchema'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { english, thai, phonetic, example, category, difficulty } = await request.json()
  const { id } = await params
  
  try {
    await ensureVocabularySchema()

    const result = await pool.query(
      'UPDATE vocabulary ' +
      'SET english = $1, thai = $2, phonetic = $3, example = $4, category = $5, difficulty = $6, updated_at = NOW() ' +
      'WHERE id = $7 ' +
      'RETURNING *, created_by IS NOT NULL AS "isUserWord"',
      [english, thai, phonetic, example, category, difficulty, id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 })
    }
    
    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error('PUT admin custom vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { id } = await params
  
  try {
    await ensureVocabularySchema()

    const result = await pool.query(
      'DELETE FROM vocabulary WHERE id = $1 RETURNING *',
      [id]
    )
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Word not found" }, { status: 404 })
    }
    
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE admin custom vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
