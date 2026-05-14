import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || "ecg-dev-secret-change-in-production"

export interface JWTPayload {
  userId: string
  isAdmin: boolean
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }
  if (!authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7)
  return token || null // Handle empty token after "Bearer "
}
