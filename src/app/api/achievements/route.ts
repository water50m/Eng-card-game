import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/database'
import { withAuth } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult // Error response
  }
  
  const userId = authResult.user.userId

  try {
    // Get all achievements
    const achievementsResult = await pool.query(
      "SELECT * FROM achievements ORDER BY sort_order ASC"
    )
    
    // Get user's unlocked achievements
    const unlockedResult = await pool.query(
      "SELECT achievement_id FROM user_achievements WHERE user_id = $1",
      [userId]
    )
    
    const unlockedIds = new Set(unlockedResult.rows.map(row => row.achievement_id))
    
    // Mark achievements as unlocked or not
    const achievements = achievementsResult.rows.map(achievement => ({
      id: achievement.id,
      key: achievement.key,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xpReward: achievement.xp_reward,
      unlocked: unlockedIds.has(achievement.id),
      condition: achievement.condition
    }))
    
    return NextResponse.json(achievements)
  } catch (error) {
    console.error('Achievements error:', error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
