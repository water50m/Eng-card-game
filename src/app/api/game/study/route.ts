import { NextRequest, NextResponse } from "next/server"
import pool from "@/lib/database"
import { withAuth } from "@/lib/middleware"
import { ensureStudySchema } from "@/lib/studySchema"

type StudyConfig = {
  category: string
  size: number
  mode: string
  hintsEnabled: boolean
}

type StudyCardBody = {
  id?: string
  name: string
  emoji: string
  desc?: string
  description?: string
  learningStyle: "fast" | "wide" | "classic"
  config: StudyConfig
  source?: string
  templateId?: string
  tags?: string[]
}

function normalizeCategory(category?: string) {
  return category && category !== "all" ? category : null
}

function categoryCondition(category: string | null, params: unknown[], alias = "words") {
  if (!category) return ""
  if (category === "custom") return `${alias}.is_user_word = true`
  params.push(category)
  return `${alias}.category = $${params.length}`
}

async function getRandomWordIds(category: string | undefined, limit: number, excludedIds: string[], userId: string) {
  const params: unknown[] = [userId]
  const conditions: string[] = []
  const normalizedCategory = normalizeCategory(category)
  const categorySql = categoryCondition(normalizedCategory, params)
  if (categorySql) conditions.push(categorySql)

  conditions.push(`NOT EXISTS (
    SELECT 1 FROM exam_ready_words erw
    WHERE erw.user_id = $1 AND erw.word_id = words.id AND erw.status = 'ready'
  )`)

  if (excludedIds.length > 0) {
    params.push(excludedIds)
    conditions.push(`NOT (words.id = ANY($${params.length}::text[]))`)
  }

  params.push(limit)
  let query = `
    SELECT id
    FROM (
      SELECT id::text, category, false AS is_user_word FROM vocabulary
      UNION ALL
      SELECT 'custom-' || id::text, category, true AS is_user_word FROM admin_custom_vocabulary
    ) words`

  if (conditions.length) query += ` WHERE ${conditions.join(" AND ")}`
  query += ` ORDER BY RANDOM() LIMIT $${params.length}`

  const result = await pool.query<{ id: string }>(query, params)
  return result.rows.map(row => row.id)
}

async function getDeckTarget(userId: string, cardId: string) {
  const result = await pool.query<{ value: number }>(
    "SELECT value FROM user_game_settings WHERE user_id = $1 AND key = $2",
    [userId, `deckTarget:${cardId}`],
  )
  const value = Number(result.rows[0]?.value)
  return Number.isFinite(value) && value >= 0 ? value : null
}

async function setDeckTarget(userId: string, cardId: string, target: number) {
  await pool.query(
    `INSERT INTO user_game_settings (user_id, key, value, updated_at)
     VALUES ($1, $2, $3::jsonb, NOW())
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [userId, `deckTarget:${cardId}`, JSON.stringify(Math.max(0, target))],
  )
}

async function listCardWordIds(userId: string, cardId: string) {
  const result = await pool.query<{ word_id: string }>(
    `SELECT word_id
     FROM study_card_words
     WHERE user_id = $1 AND card_id = $2
     ORDER BY position ASC, created_at ASC`,
    [userId, cardId],
  )
  return result.rows.map(row => row.word_id)
}

async function listExistingDecks(userId: string, cardIds: string[]) {
  if (cardIds.length === 0) return {}
  const result = await pool.query<{ card_id: string; word_ids: string[] }>(
    `SELECT card_id, ARRAY_AGG(word_id ORDER BY position ASC, created_at ASC) AS word_ids
     FROM study_card_words
     WHERE user_id = $1 AND card_id = ANY($2::text[])
     GROUP BY card_id`,
    [userId, cardIds],
  )
  return Object.fromEntries(result.rows.map(row => [row.card_id, row.word_ids]))
}

async function listExamReadyIds(userId: string) {
  const result = await pool.query<{ word_id: string }>(
    "SELECT word_id FROM exam_ready_words WHERE user_id = $1 AND status = 'ready' ORDER BY marked_at ASC",
    [userId],
  )
  return result.rows.map(row => row.word_id)
}

async function getCardWords(userId: string, cardId: string) {
  const result = await pool.query(
    `SELECT words.*
     FROM study_card_words scw
     JOIN (
       SELECT
         id::text,
         english,
         thai,
         phonetic,
         example,
         category,
         difficulty,
         false AS "isUserWord"
       FROM vocabulary
       UNION ALL
       SELECT
         'custom-' || id::text,
         english,
         thai,
         phonetic,
         example,
         category,
         difficulty,
         true AS "isUserWord"
       FROM admin_custom_vocabulary
     ) words ON words.id = scw.word_id
     WHERE scw.user_id = $1 AND scw.card_id = $2
     ORDER BY scw.position ASC, scw.created_at ASC`,
    [userId, cardId],
  )
  return result.rows
}

async function fillDeck(userId: string, cardId: string, config: StudyConfig, learningStyle: string) {
  const baseTargetSize = learningStyle === "wide" ? 100 : Math.max(1, Number(config.size) || 10)
  const manualTargetSize = await getDeckTarget(userId, cardId)
  const targetSize = manualTargetSize ?? baseTargetSize
  const normalizedCategory = normalizeCategory(config.category)
  const params: unknown[] = [userId, cardId]
  const conditions = [
    `scw.user_id = $1`,
    `scw.card_id = $2`,
    `(erw.word_id IS NULL OR erw.status <> 'ready')`,
  ]
  const categorySql = categoryCondition(normalizedCategory, params, "words")
  if (categorySql) conditions.push(categorySql)

  const existing = normalizedCategory
    ? await pool.query<{ word_id: string; position: number }>(
      `SELECT scw.word_id, scw.position
       FROM study_card_words scw
       JOIN (
         SELECT id::text, category, false AS is_user_word FROM vocabulary
         UNION ALL
         SELECT 'custom-' || id::text, category, true AS is_user_word FROM admin_custom_vocabulary
       ) words ON words.id = scw.word_id
       LEFT JOIN exam_ready_words erw
         ON erw.user_id = scw.user_id AND erw.word_id = scw.word_id
       WHERE ${conditions.join(" AND ")}
       ORDER BY scw.position ASC, scw.created_at ASC`,
      params,
    )
    : await pool.query<{ word_id: string; position: number }>(
      `SELECT scw.word_id, scw.position
       FROM study_card_words scw
       LEFT JOIN exam_ready_words erw
         ON erw.user_id = scw.user_id AND erw.word_id = scw.word_id
       WHERE scw.user_id = $1
         AND scw.card_id = $2
         AND (erw.word_id IS NULL OR erw.status <> 'ready')
       ORDER BY scw.position ASC, scw.created_at ASC`,
      [userId, cardId],
    )

  const kept = existing.rows.map(row => row.word_id).slice(0, targetSize)
  if (kept.length >= targetSize) {
    return kept
  }

  const refill = await getRandomWordIds(config.category, targetSize - kept.length, kept, userId)
  const nextIds = [...kept, ...refill].slice(0, targetSize)

  await pool.query(
    `DELETE FROM study_card_words
     WHERE user_id = $1 AND card_id = $2 AND NOT (word_id = ANY($3::text[]))`,
    [userId, cardId, nextIds],
  )

  if (nextIds.length > 0) {
    await pool.query(
      `INSERT INTO study_card_words (user_id, card_id, word_id, position)
       SELECT $1, $2, item.word_id, item.position - 1
       FROM unnest($3::text[]) WITH ORDINALITY AS item(word_id, position)
       ON CONFLICT (user_id, card_id, word_id)
       DO UPDATE SET position = EXCLUDED.position`,
      [userId, cardId, nextIds],
    )
  }

  return nextIds
}

async function getStudyState(userId: string) {
  await ensureStudySchema()

  const cards = await pool.query(
    `SELECT id, name, emoji, description, learning_style, config, source, template_id, play_count, tags, created_at
     FROM study_cards
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId],
  )
  const readyIds = await listExamReadyIds(userId)
  const promptSetting = await pool.query<{ value: boolean }>(
    "SELECT value FROM user_game_settings WHERE user_id = $1 AND key = 'hideMasteryPrompt'",
    [userId],
  )
  const decks = await listExistingDecks(userId, ["style-fast", "style-wide"])

  return {
    cards: cards.rows.map(row => ({
      id: row.id,
      name: row.name,
      emoji: row.emoji,
      desc: row.description,
      learningStyle: row.learning_style,
      source: row.source,
      templateId: row.template_id,
      config: row.config,
      isGlobal: false,
      createdAt: row.created_at,
      playCount: row.play_count,
      tags: row.tags ?? [],
    })),
    examReadyIds: readyIds,
    hideMasteryPrompt: promptSetting.rows[0]?.value === true,
    decks,
  }
}

export async function GET(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof NextResponse) return authResult

  try {
    return NextResponse.json(await getStudyState(authResult.user.userId))
  } catch (error) {
    console.error("Study state error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authResult = await withAuth(request)
  if (authResult instanceof NextResponse) return authResult

  const userId = authResult.user.userId
  const body = await request.json()

  try {
    await ensureStudySchema()

    if (body.action === "save-card") {
      const card = body.card as StudyCardBody
      const id = card.id || `u-${Date.now()}`
      await pool.query(
        `INSERT INTO study_cards
          (id, user_id, name, emoji, description, learning_style, config, source, template_id, tags, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, $10, NOW())
         ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          emoji = EXCLUDED.emoji,
          description = EXCLUDED.description,
          learning_style = EXCLUDED.learning_style,
          config = EXCLUDED.config,
          source = EXCLUDED.source,
          template_id = EXCLUDED.template_id,
          tags = EXCLUDED.tags,
          updated_at = NOW()`,
        [
          id,
          userId,
          card.name,
          card.emoji || "⭐",
          card.desc ?? card.description ?? "",
          card.learningStyle || "fast",
          JSON.stringify(card.config),
          card.source || "user",
          card.templateId ?? null,
          card.tags ?? ["custom"],
        ],
      )
      return NextResponse.json(await getStudyState(userId))
    }

    if (body.action === "ensure-deck") {
      const ids = await fillDeck(userId, body.cardId, body.config, body.learningStyle)
      pool.query(
        "UPDATE study_cards SET play_count = play_count + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2",
        [body.cardId, userId],
      ).catch(error => console.error("Update play count error:", error))
      return NextResponse.json({ wordIds: ids })
    }

    if (body.action === "get-card-words") {
      const cardId = String(body.cardId)
      const ids = await listCardWordIds(userId, cardId)
      const words = await getCardWords(userId, cardId)
      return NextResponse.json({ wordIds: ids, words })
    }

    if (body.action === "add-card-word") {
      const cardId = String(body.cardId)
      const wordId = String(body.wordId)
      const currentIds = await listCardWordIds(userId, cardId)
      if (!currentIds.includes(wordId)) {
        await pool.query(
          `INSERT INTO study_card_words (user_id, card_id, word_id, position)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, card_id, word_id) DO UPDATE SET position = EXCLUDED.position`,
          [userId, cardId, wordId, currentIds.length],
        )
      }
      const nextIds = await listCardWordIds(userId, cardId)
      await setDeckTarget(userId, cardId, nextIds.length)
      return NextResponse.json({ wordIds: nextIds, words: await getCardWords(userId, cardId) })
    }

    if (body.action === "remove-card-word") {
      const cardId = String(body.cardId)
      await pool.query(
        "DELETE FROM study_card_words WHERE user_id = $1 AND card_id = $2 AND word_id = $3",
        [userId, cardId, body.wordId],
      )
      const nextIds = await listCardWordIds(userId, cardId)
      await setDeckTarget(userId, cardId, nextIds.length)
      return NextResponse.json({ wordIds: nextIds, words: await getCardWords(userId, cardId) })
    }

    if (body.action === "mark-ready") {
      await pool.query(
        `INSERT INTO exam_ready_words (user_id, word_id, status, marked_at)
         VALUES ($1, $2, 'ready', NOW())
         ON CONFLICT (user_id, word_id) DO UPDATE SET status = 'ready', marked_at = NOW(), passed_at = NULL`,
        [userId, body.wordId],
      )

      if (body.cardId) {
        await pool.query("DELETE FROM study_card_words WHERE user_id = $1 AND card_id = $2 AND word_id = $3", [userId, body.cardId, body.wordId])
        const ids = await fillDeck(userId, body.cardId, body.config, body.learningStyle)
        return NextResponse.json({ wordIds: ids, examReadyIds: await listExamReadyIds(userId) })
      }

      return NextResponse.json({ examReadyIds: await listExamReadyIds(userId) })
    }

    if (body.action === "exam-passed") {
      const wordIds: string[] = Array.isArray(body.wordIds) ? body.wordIds : []
      if (wordIds.length > 0) {
        await pool.query(
          `UPDATE exam_ready_words
           SET status = 'passed', passed_at = NOW()
           WHERE user_id = $1 AND word_id = ANY($2::text[])`,
          [userId, wordIds],
        )
      }
      return NextResponse.json({ examReadyIds: await listExamReadyIds(userId) })
    }

    if (body.action === "setting") {
      await pool.query(
        `INSERT INTO user_game_settings (user_id, key, value, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [userId, body.key, JSON.stringify(body.value)],
      )
      return NextResponse.json({ [String(body.key)]: body.value })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Study action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
