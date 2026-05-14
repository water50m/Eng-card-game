import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { id } = params
  
  try {
    await pool.query("DELETE FROM vocabulary WHERE id = $1", [id])
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete vocabulary error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
