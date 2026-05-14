import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

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
    let query = `
      SELECT *
      FROM (
        SELECT
          id::text,
          english,
          thai,
          phonetic,
          example,
          category,
          difficulty,
          false AS "isUserWord"
        FROM vocabulary
        UNION ALL
        SELECT
          'custom-' || id::text AS id,
          english,
          thai,
          phonetic,
          example,
          category,
          difficulty,
          true AS "isUserWord"
        FROM admin_custom_vocabulary
      ) words`
    const params: (string | number)[] = []
    const conditions: string[] = []

    if (category) {
      if (category === "custom") {
        conditions.push(`"isUserWord" = true`)
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
    const result = await pool.query(
      "INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [english, thai, phonetic, example, category || 'general', difficulty || 2]
    )
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error('Add vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
