import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware'
import { extractTokenFromRequest } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)
    
    const authResult = await withAuth(request)
    
    if (authResult instanceof NextResponse) {
      return authResult // Error response
    }
    
    return NextResponse.json({ 
      valid: true, 
      user: authResult.user 
    })
  } catch (error) {
    console.error('Unexpected error in token verification:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
