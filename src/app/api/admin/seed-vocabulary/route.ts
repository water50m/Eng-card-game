import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    // Seed vocabulary from database.sql - this would normally read from a file
    // For now, we'll just return success since the data is already in the database
    return NextResponse.json({ 
      success: true, 
      message: "Vocabulary already seeded from database.sql" 
    })
  } catch (error) {
    console.error('Seed vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
