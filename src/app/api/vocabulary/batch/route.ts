import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth } from '../../../../lib/middleware'
import pool from '../../../../lib/database'
import { bulkUpsertVocabularyWords, ensureVocabularySchema } from '../../../../lib/vocabularySchema'

type BatchWord = {
  english?: string
  thai?: string
  phonetic?: string
  example?: string
  category?: string
  difficulty?: number
}

type ValidWord = Required<Pick<BatchWord, 'english' | 'thai' | 'category' | 'difficulty'>> & {
  phonetic: string | null
  example: string | null
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await withAdminAuth(request)
    if (authResult instanceof NextResponse) return authResult

    const userId = authResult.user.userId

    console.log('📥 API: /api/vocabulary/batch - Received batch import request')

    const body = await request.json() as { words?: BatchWord[]; skipDuplicates?: boolean }
    const { words, skipDuplicates = true } = body

    console.log(`📊 API: Processing ${words?.length ?? 0} words (skip duplicates: ${skipDuplicates})`)

    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json(
        { error: 'Invalid words array' },
        { status: 400 }
      )
    }

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    await ensureVocabularySchema()

    const existingQuery = await pool.query('SELECT english FROM vocabulary')
    const existingWords = new Set(
      existingQuery.rows.map((row: { english: string }) => row.english.toLowerCase())
    )

    console.log(`🔍 API: Found ${existingWords.size} existing words in database`)

    // Filter and validate words
    const validWords: ValidWord[] = []
    for (let i = 0; i < words.length; i++) {
      const word = words[i]
      
      // Validate required fields
      if (!word.english || !word.thai) {
        errors.push(`Word ${i + 1}: Missing english or thai`)
        errorCount++
        continue
      }

      // Check for duplicates if skipDuplicates is true
      if (skipDuplicates && existingWords.has(word.english.toLowerCase())) {
        console.log(`⏭️ API: Skipping duplicate word: ${word.english}`)
        continue
      }

      validWords.push({
        english: word.english,
        thai: word.thai,
        phonetic: word.phonetic || null,
        example: word.example || null,
        category: word.category || 'general',
        difficulty: word.difficulty || 2
      })
    }

    console.log(`📊 API: ${validWords.length} valid words to import`)

    // Process in batches of 500 words
    const BATCH_SIZE = 500
    for (let batchStart = 0; batchStart < validWords.length; batchStart += BATCH_SIZE) {
      const batch = validWords.slice(batchStart, batchStart + BATCH_SIZE)
      
      // Remove duplicates within this batch
      const batchMap = new Map<string, ValidWord>()
      for (const word of batch) {
        const key = word.english.toLowerCase()
        if (!batchMap.has(key)) {
          batchMap.set(key, word)
        }
      }
      const deduplicatedBatch = Array.from(batchMap.values())
      
      if (deduplicatedBatch.length === 0) {
        continue
      }
      
      try {
        await bulkUpsertVocabularyWords(deduplicatedBatch.map(word => ({
          ...word,
          createdBy: userId,
        })))

        successCount += deduplicatedBatch.length
        console.log(`📊 API: Batch ${Math.floor(batchStart / BATCH_SIZE) + 1} completed (${deduplicatedBatch.length} words) - Total: ${successCount}/${validWords.length}`)

      } catch (error) {
        const errorMsg = `Batch ${Math.floor(batchStart / BATCH_SIZE) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        errorCount += deduplicatedBatch.length
        console.error(`❌ API: ${errorMsg}`)
      }
    }

    console.log(`✅ API: Batch import completed - Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      total: words.length,
      errorDetails: errors.slice(0, 10) // Return first 10 errors
    })

  } catch (error) {
    console.error('❌ API: Batch import error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    )
  }
}
