import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAdminAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }

  try {
    const result = await pool.query("SELECT key, value FROM system_settings")
    const settings: Record<string, string> = {}
    result.rows.forEach(row => {
      settings[row.key] = row.value
    })
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get admin settings error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await withAdminAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const { key, value } = await request.json()
  
  try {
    await pool.query(`
      INSERT INTO system_settings (key, value) VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = $2
    `, [key, value])
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update admin settings error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
