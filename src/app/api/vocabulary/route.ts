import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'
import { ensureVocabularySchema, upsertVocabularyWord } from '@/lib/vocabularySchema'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')
  const search = searchParams.get('search')
  
  try {
    await ensureVocabularySchema()

    let query = `
      SELECT
        id::text,
        english,
        thai,
        phonetic,
        example,
        category,
        difficulty,
        synonyms,
        created_by,
        created_at,
        updated_at,
        created_by IS NOT NULL AS "isUserWord"
      FROM vocabulary`
    const params: (string | number)[] = []
    const conditions: string[] = []

    if (category) {
      if (category === "custom") {
        conditions.push(`created_by IS NOT NULL`)
      } else {
        params.push(category)
        conditions.push(`category = $${params.length}`)
      }
    }
    if (difficulty) {
      params.push(parseInt(difficulty))
      conditions.push(`difficulty = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      conditions.push(`(english ILIKE $${params.length} OR thai ILIKE $${params.length})`)
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ")
    }

    query += " ORDER BY english"

    const result = await pool.query(query, params)
    return NextResponse.json(result.rows)
  } catch (error) {
    console.error('Get vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { english, thai, phonetic, example, category, difficulty } = await request.json()
  
  if (!english || !thai) {
    return NextResponse.json({ error: "english and thai are required" }, { status: 400 })
  }

  try {
    const row = await upsertVocabularyWord({
      english,
      thai,
      phonetic,
      example,
      category,
      difficulty,
      createdBy: authResult.user.userId,
    })
    return NextResponse.json(row, { status: 201 })
  } catch (error) {
    console.error('Add vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
