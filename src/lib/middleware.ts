import { NextRequest, NextResponse } from 'next/server'
import { extractTokenFromRequest, verifyToken, JWTPayload } from './jwt'

export async function withAuth(request: NextRequest): Promise<{ user: JWTPayload } | NextResponse> {
  const token = extractTokenFromRequest(request)
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = verifyToken(token)
    return { user }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('expired')) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    } else if (errorMessage.includes('invalid') || errorMessage.includes('signature') || errorMessage.includes('malformed')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    } else {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 })
    }
  }
}

export async function withAdminAuth(request: NextRequest): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  if (!authResult.user.isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }
  
  return authResult
}
