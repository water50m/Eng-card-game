import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '../../../../lib/middleware'
import pool from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await withAdminAuth(request)
    if (authResult instanceof NextResponse) return authResult

    console.log('📥 API: /api/vocabulary/existing - Fetching existing words')

    // Fetch all existing words from both the core vocabulary and admin imports.
    const result = await pool.query(
      `SELECT english FROM vocabulary
       UNION
       SELECT english FROM admin_custom_vocabulary`
    )

    const existingWords = result.rows.map((row: { english: string }) => row.english.toLowerCase())

    console.log(`✅ API: Found ${existingWords.length} existing words`)

    return NextResponse.json({
      words: existingWords,
      count: existingWords.length
    })

  } catch (error) {
    console.error('❌ API: Error fetching existing words:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    )
  }
}
