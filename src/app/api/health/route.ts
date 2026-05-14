import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const started = Date.now()

  try {
    const result = await pool.query<{ database: string; user_name: string }>(
      "SELECT current_database() AS database, current_user AS user_name",
    )
    return NextResponse.json({
      ok: true,
      service: 'english-card-game',
      database: {
        ok: true,
        name: result.rows[0]?.database ?? null,
        user: result.rows[0]?.user_name ?? null,
        latencyMs: Date.now() - started,
      },
    })
  } catch (error) {
    return NextResponse.json({
      ok: false,
      service: 'english-card-game',
      database: {
        ok: false,
        name: null,
        latencyMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'Unknown database error',
      },
    }, { status: 503 })
  }
}
