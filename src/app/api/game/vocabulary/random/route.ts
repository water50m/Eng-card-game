import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'
import { ensureVocabularySchema } from '@/lib/vocabularySchema'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const difficulty = searchParams.get('difficulty')
  const excludeIds = searchParams.get('excludeIds')?.split(',') || []

  let query = "SELECT v.* FROM vocabulary v"
  const params: any[] = []
  const conditions: string[] = []

  // Prefer unmastered words
  query += ` LEFT JOIN user_progress up ON up.word_id = v.id AND up.user_id = $${params.length + 1}`
  params.push(userId)
  conditions.push("(up.is_mastered IS NULL OR up.is_mastered = false)")

  if (category && category !== "all") {
    if (category === "custom") {
      conditions.push("v.created_by IS NOT NULL")
    } else {
      params.push(category); 
      conditions.push(`v.category = $${params.length}`)
    }
  }
  if (difficulty) { 
    params.push(parseInt(difficulty)); 
    conditions.push(`v.difficulty = $${params.length}`) 
  }
  if (excludeIds.length > 0) {
    params.push(excludeIds);
    conditions.push(`v.id NOT IN ($${params.length})`)
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ")
  }

  query += " ORDER BY RANDOM() LIMIT 1"

  try {
    await ensureVocabularySchema()
    const result = await pool.query(query, params)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "No words found" }, { status: 404 })
    }

    const word = result.rows[0]
    
    // Get options for quiz (other words with same category)
    const optionsQuery = `
      SELECT english FROM vocabulary 
      WHERE category = $1 AND id != $2 
      ORDER BY RANDOM() LIMIT 3
    `
    const optionsResult = await pool.query(optionsQuery, [word.category, word.id])
    const options = optionsResult.rows.map((r: any) => r.english)
    
    // Add correct answer and shuffle
    options.push(word.thai)
    const shuffledOptions = options.sort(() => Math.random() - 0.5)

    return NextResponse.json({
      word: {
        id: word.id,
        english: word.english,
        thai: word.thai,
        category: word.category,
        difficulty: word.difficulty
      },
      options: shuffledOptions
    })
  } catch (error) {
    console.error('Random vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
