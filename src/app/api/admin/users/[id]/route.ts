import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { id } = params
  
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete admin user error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
