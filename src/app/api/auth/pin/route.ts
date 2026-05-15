import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { generateToken } from '@/lib/jwt'

const OFFLINE_ADMIN_PIN = "00000"
const OFFLINE_ADMIN_USER = {
  id: "admin",
  display_name: "Admin",
  emoji: "🛡️",
  is_admin: true,
}

async function getSystemSetting(key: string) {
  try {
    const result = await pool.query<{ value: string }>(
      "SELECT value FROM system_settings WHERE key = $1",
      [key],
    )
    return result.rows[0]?.value ?? null
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === '42P01') {
      return null
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()
    
    if (!pin || pin.length !== 5) {
      return NextResponse.json({ error: "PIN must be 5 digits" }, { status: 400 })
    }

    if (pin === OFFLINE_ADMIN_PIN) {
      const token = generateToken({
        userId: OFFLINE_ADMIN_USER.id,
        isAdmin: OFFLINE_ADMIN_USER.is_admin,
      })

      return NextResponse.json({
        token,
        user: {
          id: OFFLINE_ADMIN_USER.id,
          name: OFFLINE_ADMIN_USER.display_name,
          emoji: OFFLINE_ADMIN_USER.emoji,
          isAdmin: OFFLINE_ADMIN_USER.is_admin,
        },
      })
    }

    // Check if PIN auth is enabled
    const pinEnabled = await getSystemSetting("pin_enabled") !== "false"

    let user
    if (pinEnabled) {
      const result = await pool.query("SELECT * FROM users WHERE pin = $1 AND is_active = true", [pin])
      if (!result.rows[0]) {
        return NextResponse.json({ error: "Invalid PIN" }, { status: 401 })
      }
      user = result.rows[0]
    } else {
      const defId = await getSystemSetting("default_user_id")
      if (!defId) {
        return NextResponse.json({ error: "Default user is not configured" }, { status: 503 })
      }
      const result = await pool.query("SELECT * FROM users WHERE id = $1", [defId])
      user = result.rows[0]
      if (!user) {
        return NextResponse.json({ error: "Default user not found" }, { status: 503 })
      }
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
