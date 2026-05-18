import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { listVocabularyCategories } from '@/lib/vocabularySchema'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    return NextResponse.json(await listVocabularyCategories())
  } catch (error) {
    console.error('Themes error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
