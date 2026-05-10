// english-card-game/backend/server.ts
// backend/server.ts — Express.js API Server
// Run: npx ts-node server.ts  OR  npm run dev (with ts-node-dev)

import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import { Pool } from "pg"

const app  = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || "ecg-dev-secret-change-in-production"

// ── Database ───────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/english_card_game",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000", credentials: true }))
app.use(express.json())

// Auth middleware
function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" })
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { userId: string; isAdmin: boolean }
    (req as any).user = payload
    next()
  } catch {
    res.status(401).json({ error: "Invalid token" })
  }
}

function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).user?.isAdmin) return res.status(403).json({ error: "Admin only" })
  next()
}

// ── Health check ───────────────────────────────────────────────
app.get("/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }))

// ═════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════

// POST /api/auth/pin — Login with PIN
app.post("/api/auth/pin", async (req, res) => {
  const { pin } = req.body
  if (!pin || pin.length !== 5) return res.status(400).json({ error: "PIN must be 5 digits" })

  // Check if PIN auth is enabled
  const settingRow = await pool.query("SELECT value FROM system_settings WHERE key = $1", ["pin_enabled"])
  const pinEnabled = settingRow.rows[0]?.value !== "false"

  let user
  if (pinEnabled) {
    const result = await pool.query("SELECT * FROM users WHERE pin = $1 AND is_active = true", [pin])
    if (!result.rows[0]) return res.status(401).json({ error: "Invalid PIN" })
    user = result.rows[0]
  } else {
    const defRow = await pool.query("SELECT value FROM system_settings WHERE key = $1", ["default_user_id"])
    const defId  = defRow.rows[0]?.value
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [defId])
    user = result.rows[0]
  }

  const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, JWT_SECRET, { expiresIn: "24h" })
  res.json({ token, user: { id: user.id, name: user.display_name, emoji: user.emoji, isAdmin: user.is_admin } })
})

// POST /api/auth/verify
app.post("/api/auth/verify", auth, (req, res) => {
  res.json({ valid: true, user: (req as any).user })
})

// ═════════════════════════════════════════════════════════════
// GAME
// ═════════════════════════════════════════════════════════════

// GET /api/game/vocabulary/random?category=animals&difficulty=1&excludeIds=id1,id2
app.get("/api/game/vocabulary/random", auth, async (req, res) => {
  const userId    = (req as any).user.userId
  const category  = req.query.category as string
  const difficulty = req.query.difficulty as string
  const excludeIds = req.query.excludeIds ? (req.query.excludeIds as string).split(",") : []

  let query = "SELECT v.* FROM vocabulary v"
  const params: any[] = []
  const conditions: string[] = []

  // Prefer unmastered words
  query += ` LEFT JOIN user_progress up ON up.word_id = v.id AND up.user_id = $${params.length + 1}`
  params.push(userId)
  conditions.push("(up.is_mastered IS NULL OR up.is_mastered = false)")

  if (category) { params.push(category); conditions.push(`v.category = $${params.length}`) }
  if (difficulty) { params.push(parseInt(difficulty)); conditions.push(`v.difficulty = $${params.length}`) }
  if (excludeIds.length) { params.push(excludeIds); conditions.push(`v.id != ALL($${params.length})`) }

  if (conditions.length) query += " WHERE " + conditions.join(" AND ")
  query += " ORDER BY RANDOM() LIMIT 1"

  const result = await pool.query(query, params)
  let word = result.rows[0]

  // Fallback: any word if no unmastered found
  if (!word) {
    const fallback = await pool.query("SELECT * FROM vocabulary ORDER BY RANDOM() LIMIT 1")
    word = fallback.rows[0]
  }
  if (!word) return res.status(404).json({ error: "No vocabulary found" })

  // Build 4 options
  const distractors = await pool.query(
    "SELECT thai FROM vocabulary WHERE id != $1 ORDER BY RANDOM() LIMIT 3",
    [word.id]
  )
  const options = [...distractors.rows.map((r: any) => r.thai), word.thai]
    .sort(() => Math.random() - 0.5)

  res.json({ word, options })
})

// GET /api/game/vocabulary/themes
app.get("/api/game/vocabulary/themes", auth, async (_req, res) => {
  const result = await pool.query(
    "SELECT category, COUNT(*) as count FROM vocabulary GROUP BY category ORDER BY count DESC"
  )
  res.json(result.rows)
})

// POST /api/game/submit-answer
app.post("/api/game/submit-answer", auth, async (req, res) => {
  const userId = (req as any).user.userId
  const { wordId, correct, timeMs, sessionId } = req.body

  // Upsert user_progress
  const prev = await pool.query(
    "SELECT * FROM user_progress WHERE user_id = $1 AND word_id = $2",
    [userId, wordId]
  )

  const p = prev.rows[0] ?? { streak_count: 0, attempt_count: 0, correct_count: 0, is_mastered: false }
  const newStreak  = correct ? p.streak_count + 1 : 0
  const newAttempt = p.attempt_count + 1
  const newCorrect = p.correct_count + (correct ? 1 : 0)
  const accuracy   = (newCorrect / newAttempt) * 100
  const isMastered = (newStreak >= 4 && newAttempt <= 10) || (accuracy >= 90 && newAttempt >= 5)

  // XP
  const xp = correct ? 10 + Math.min(newStreak, 5) * 2 + (timeMs < 3000 ? 5 : timeMs < 6000 ? 2 : 0) : 0

  await pool.query(`
    INSERT INTO user_progress (user_id, word_id, streak_count, attempt_count, correct_count, is_mastered, last_seen_at, avg_time_ms)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
    ON CONFLICT (user_id, word_id) DO UPDATE SET
      streak_count = $3, attempt_count = $4, correct_count = $5,
      is_mastered = $6, last_seen_at = NOW(), avg_time_ms = $7
  `, [userId, wordId, newStreak, newAttempt, newCorrect, isMastered, timeMs])

  // Award XP to user
  if (xp > 0) {
    await pool.query("UPDATE users SET total_xp = total_xp + $1 WHERE id = $2", [xp, userId])
  }

  // Log game answer
  if (sessionId) {
    await pool.query(
      "INSERT INTO game_answers (session_id, word_id, correct, time_ms) VALUES ($1, $2, $3, $4)",
      [sessionId, wordId, correct, timeMs]
    )
  }

  res.json({ correct, isMastered, newStreak, xpEarned: xp, accuracy: Math.round(accuracy) })
})

// POST /api/game/session/start
app.post("/api/game/session/start", auth, async (req, res) => {
  const userId = (req as any).user.userId
  const { mode } = req.body
  const result = await pool.query(
    "INSERT INTO game_sessions (user_id, mode, started_at) VALUES ($1, $2, NOW()) RETURNING id",
    [userId, mode]
  )
  res.json({ sessionId: result.rows[0].id })
})

// POST /api/game/session/:id/end
app.post("/api/game/session/:id/end", auth, async (req, res) => {
  const { wordsCompleted, wordsMastered, xpEarned } = req.body
  await pool.query(
    "UPDATE game_sessions SET ended_at = NOW(), words_completed = $1, words_mastered = $2, xp_earned = $3 WHERE id = $4",
    [wordsCompleted, wordsMastered, xpEarned, req.params.id]
  )
  res.json({ ok: true })
})

// ═════════════════════════════════════════════════════════════
// USER / DASHBOARD
// ═════════════════════════════════════════════════════════════

// GET /api/user/dashboard
app.get("/api/user/dashboard", auth, async (req, res) => {
  const userId = (req as any).user.userId

  const [userRow, masteredCount, attemptCount, sessions, dailyProgress] = await Promise.all([
    pool.query("SELECT * FROM users WHERE id = $1", [userId]),
    pool.query("SELECT COUNT(*) FROM user_progress WHERE user_id = $1 AND is_mastered = true", [userId]),
    pool.query("SELECT SUM(attempt_count) as total, SUM(correct_count) as correct FROM user_progress WHERE user_id = $1", [userId]),
    pool.query("SELECT COUNT(*) FROM game_sessions WHERE user_id = $1", [userId]),
    pool.query(`
      SELECT DATE(started_at) as day,
             SUM(words_completed) as completed,
             SUM(words_mastered) as mastered
      FROM game_sessions
      WHERE user_id = $1 AND started_at > NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY day
    `, [userId]),
  ])

  const u = userRow.rows[0]
  const total   = parseInt(attemptCount.rows[0]?.total || "0")
  const correct = parseInt(attemptCount.rows[0]?.correct || "0")

  res.json({
    wordsMastered:  parseInt(masteredCount.rows[0].count),
    wordsAttempted: total,
    accuracy:       total > 0 ? Math.round((correct / total) * 100) : 0,
    totalXP:        u.total_xp,
    currentStreak:  u.current_streak,
    longestStreak:  u.longest_streak,
    totalSessions:  parseInt(sessions.rows[0].count),
    dailyProgress:  dailyProgress.rows,
  })
})

// GET /api/user/progress
app.get("/api/user/progress", auth, async (req, res) => {
  const userId = (req as any).user.userId
  const result = await pool.query(`
    SELECT up.*, v.english, v.thai, v.category, v.difficulty
    FROM user_progress up
    JOIN vocabulary v ON v.id = up.word_id
    WHERE up.user_id = $1
    ORDER BY up.last_seen_at DESC
  `, [userId])
  res.json(result.rows)
})

// GET /api/user/mastered
app.get("/api/user/mastered", auth, async (req, res) => {
  const userId = (req as any).user.userId
  const result = await pool.query(`
    SELECT v.*, up.streak_count, up.attempt_count, up.correct_count, up.avg_time_ms, up.last_seen_at
    FROM user_progress up
    JOIN vocabulary v ON v.id = up.word_id
    WHERE up.user_id = $1 AND up.is_mastered = true
    ORDER BY up.last_seen_at DESC
  `, [userId])
  res.json(result.rows)
})

// ═════════════════════════════════════════════════════════════
// VOCABULARY (custom words)
// ═════════════════════════════════════════════════════════════

// GET /api/vocabulary — get all words with optional filters
app.get("/api/vocabulary", auth, async (req, res) => {
  const { category, difficulty, search } = req.query
  const params: any[] = []
  const conditions: string[] = []

  if (category)   { params.push(category);   conditions.push(`category = $${params.length}`) }
  if (difficulty) { params.push(difficulty); conditions.push(`difficulty = $${params.length}`) }
  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(english ILIKE $${params.length} OR thai ILIKE $${params.length})`)
  }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : ""
  const result = await pool.query(`SELECT * FROM vocabulary ${where} ORDER BY category, difficulty, english`, params)
  res.json(result.rows)
})

// POST /api/vocabulary — add custom word
app.post("/api/vocabulary", auth, async (req, res) => {
  const { english, thai, phonetic, example, category, difficulty } = req.body
  if (!english || !thai) return res.status(400).json({ error: "english and thai are required" })

  const result = await pool.query(`
    INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *
  `, [english, thai, phonetic || null, example || null, category || "custom", difficulty || 1, (req as any).user.userId])
  res.status(201).json(result.rows[0])
})

// DELETE /api/vocabulary/:id
app.delete("/api/vocabulary/:id", auth, async (req, res) => {
  await pool.query("DELETE FROM vocabulary WHERE id = $1", [req.params.id])
  res.json({ ok: true })
})

// ═════════════════════════════════════════════════════════════
// LEADERBOARD
// ═════════════════════════════════════════════════════════════

// GET /api/leaderboard?type=global&limit=20
app.get("/api/leaderboard", auth, async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 20
  const result = await pool.query(`
    SELECT u.id, u.display_name as name, u.emoji, u.total_xp as xp, u.current_streak as streak,
           COUNT(up.word_id) FILTER (WHERE up.is_mastered = true) as mastered,
           RANK() OVER (ORDER BY u.total_xp DESC) as rank
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    WHERE u.is_active = true AND u.is_admin = false
    GROUP BY u.id
    ORDER BY xp DESC
    LIMIT $1
  `, [limit])
  res.json(result.rows)
})

// ═════════════════════════════════════════════════════════════
// ACHIEVEMENTS
// ═════════════════════════════════════════════════════════════

// GET /api/achievements — all achievements + user unlock status
app.get("/api/achievements", auth, async (req, res) => {
  const userId = (req as any).user.userId
  const result = await pool.query(`
    SELECT a.*, ua.unlocked_at
    FROM achievements a
    LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = $1
    ORDER BY a.sort_order
  `, [userId])
  res.json(result.rows)
})

// POST /api/achievements/:id/unlock (called internally after answer)
app.post("/api/achievements/:id/unlock", auth, async (req, res) => {
  const userId = (req as any).user.userId
  await pool.query(`
    INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT DO NOTHING
  `, [userId, req.params.id])
  res.json({ ok: true })
})

// ═════════════════════════════════════════════════════════════
// ADMIN
// ═════════════════════════════════════════════════════════════

// GET /api/admin/settings
app.get("/api/admin/settings", auth, adminOnly, async (_req, res) => {
  const result = await pool.query("SELECT key, value FROM system_settings")
  const settings: Record<string, string> = {}
  result.rows.forEach((r: any) => { settings[r.key] = r.value })
  res.json(settings)
})

// PUT /api/admin/settings
app.put("/api/admin/settings", auth, adminOnly, async (req, res) => {
  const { key, value } = req.body
  await pool.query(`
    INSERT INTO system_settings (key, value) VALUES ($1, $2)
    ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
  `, [key, value])
  res.json({ ok: true })
})

// GET /api/admin/users
app.get("/api/admin/users", auth, adminOnly, async (_req, res) => {
  const result = await pool.query(`
    SELECT u.*, COUNT(up.word_id) as words_attempted,
           COUNT(up.word_id) FILTER (WHERE up.is_mastered) as words_mastered
    FROM users u
    LEFT JOIN user_progress up ON up.user_id = u.id
    GROUP BY u.id ORDER BY u.created_at
  `)
  res.json(result.rows)
})

// POST /api/admin/users — create user
app.post("/api/admin/users", auth, adminOnly, async (req, res) => {
  const { displayName, pin, emoji, isAdmin } = req.body
  if (!displayName || !pin || pin.length !== 5)
    return res.status(400).json({ error: "displayName and 5-digit pin required" })

  // Check PIN uniqueness
  const existing = await pool.query("SELECT id FROM users WHERE pin = $1", [pin])
  if (existing.rows.length) return res.status(409).json({ error: "PIN already in use" })

  const result = await pool.query(`
    INSERT INTO users (display_name, pin, emoji, is_admin, is_active)
    VALUES ($1, $2, $3, $4, true) RETURNING *
  `, [displayName, pin, emoji || "🙂", isAdmin || false])
  res.status(201).json(result.rows[0])
})

// DELETE /api/admin/users/:userId
app.delete("/api/admin/users/:userId", auth, adminOnly, async (req, res) => {
  await pool.query("UPDATE users SET is_active = false WHERE id = $1", [req.params.userId])
  res.json({ ok: true })
})

// POST /api/admin/seed-vocabulary
app.post("/api/admin/seed-vocabulary", auth, adminOnly, async (_req, res) => {
  // Seeds default words — in production this reads from a SQL file
  const words = [
    { english: "elephant",  thai: "ช้าง",      phonetic: "EL-uh-funt",  category: "animals",    difficulty: 1 },
    { english: "tiger",     thai: "เสือ",      phonetic: "TY-ger",      category: "animals",    difficulty: 1 },
    { english: "mango",     thai: "มะม่วง",    phonetic: "MANG-go",     category: "food",       difficulty: 1 },
    { english: "whisper",   thai: "กระซิบ",    phonetic: "WIS-per",     category: "verbs",      difficulty: 2 },
    { english: "enormous",  thai: "ใหญ่โต",    phonetic: "ih-NOR-mus",  category: "adjectives", difficulty: 2 },
  ]
  for (const w of words) {
    await pool.query(`
      INSERT INTO vocabulary (english, thai, phonetic, category, difficulty)
      VALUES ($1,$2,$3,$4,$5) ON CONFLICT (english) DO NOTHING
    `, [w.english, w.thai, w.phonetic, w.category, w.difficulty])
  }
  res.json({ ok: true, seeded: words.length })
})

// GET /api/admin/stats
app.get("/api/admin/stats", auth, adminOnly, async (_req, res) => {
  const [users, words, sessions, answers] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE is_active = true"),
    pool.query("SELECT COUNT(*) FROM vocabulary"),
    pool.query("SELECT COUNT(*) FROM game_sessions"),
    pool.query("SELECT COUNT(*), AVG(correct::int) * 100 as avg_accuracy FROM game_answers"),
  ])
  res.json({
    totalUsers:    parseInt(users.rows[0].count),
    totalWords:    parseInt(words.rows[0].count),
    totalSessions: parseInt(sessions.rows[0].count),
    totalAnswers:  parseInt(answers.rows[0].count),
    avgAccuracy:   Math.round(parseFloat(answers.rows[0].avg_accuracy || "0")),
  })
})

// ── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  API running at http://localhost:${PORT}`)
  console.log(`📊  Health: http://localhost:${PORT}/health`)
})

export default app
