import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { generateToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()
    
    if (!pin || pin.length !== 5) {
      return NextResponse.json({ error: "PIN must be 5 digits" }, { status: 400 })
    }

    // Check if PIN auth is enabled
    const settingRow = await pool.query("SELECT value FROM system_settings WHERE key = $1", ["pin_enabled"])
    const pinEnabled = settingRow.rows[0]?.value !== "false"

    let user
    if (pinEnabled) {
      const result = await pool.query("SELECT * FROM users WHERE pin = $1 AND is_active = true", [pin])
      if (!result.rows[0]) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
      }
      user = result.rows[0]
    } else {
      const defRow = await pool.query("SELECT value FROM system_settings WHERE key = $1", ["default_user_id"])
      const defId = defRow.rows[0]?.value
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [defId])
      user = result.rows[0]
    }

    const token = generateToken({ 
      userId: user.id, 
      isAdmin: user.is_admin 
    })

    return NextResponse.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.display_name, 
        emoji: user.emoji, 
        isAdmin: user.is_admin 
      } 
    })
  } catch (error) {
    console.error('PIN login error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
