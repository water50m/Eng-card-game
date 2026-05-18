import pool from "@/lib/database"
import { QUIZ_CATEGORIES } from "@/types/game"

type VocabularyInput = {
  english: string
  thai: string
  phonetic?: string | null
  example?: string | null
  category?: string | null
  difficulty?: number | null
  synonyms?: string[] | null
  createdBy?: string | null
}

let initialized = false
let initializing: Promise<void> | null = null

export async function ensureVocabularySchema() {
  if (initialized) return
  if (initializing) return initializing

  initializing = initializeVocabularySchema()
  try {
    await initializing
    initialized = true
  } finally {
    initializing = null
  }
}

async function initializeVocabularySchema() {
  await pool.query(`ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS synonyms TEXT[] NULL`)
  await pool.query(`ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS created_by UUID NULL`)
  await pool.query(`ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL DEFAULT NOW()`)
  await pool.query(`UPDATE vocabulary SET updated_at = COALESCE(updated_at, created_at, NOW()) WHERE updated_at IS NULL`)

  await pool.query(`
    DO $$
    BEGIN
      IF to_regclass('public.admin_custom_vocabulary') IS NOT NULL THEN
        CREATE TEMP TABLE IF NOT EXISTS vocabulary_custom_merge_map (
          old_word_id TEXT PRIMARY KEY,
          new_word_id TEXT NOT NULL
        ) ON COMMIT DROP;

        TRUNCATE vocabulary_custom_merge_map;

        INSERT INTO vocabulary
          (english, thai, phonetic, example, category, difficulty, synonyms, created_by, created_at, updated_at)
        SELECT
          src.english,
          src.thai,
          src.phonetic,
          src.example,
          src.category,
          src.difficulty,
          NULL::TEXT[],
          src.created_by,
          src.created_at,
          src.updated_at
        FROM (
          SELECT DISTINCT ON (LOWER(acv.english))
            acv.english,
            acv.thai,
            acv.phonetic,
            acv.example,
            COALESCE(acv.category, 'general') AS category,
            COALESCE(acv.difficulty, 2) AS difficulty,
            acv.created_by,
            COALESCE(acv.created_at, NOW()) AS created_at,
            COALESCE(acv.updated_at, acv.created_at, NOW()) AS updated_at
          FROM admin_custom_vocabulary acv
          ORDER BY LOWER(acv.english), COALESCE(acv.updated_at, acv.created_at, NOW()) DESC
        ) src
        WHERE NOT EXISTS (
          SELECT 1
          FROM vocabulary v
          WHERE LOWER(v.english) = LOWER(src.english)
        );

        UPDATE vocabulary v
        SET
          created_by = COALESCE(v.created_by, acv.created_by),
          updated_at = GREATEST(COALESCE(v.updated_at, '-infinity'::TIMESTAMPTZ), COALESCE(acv.updated_at, acv.created_at, NOW()))
        FROM admin_custom_vocabulary acv
        WHERE LOWER(v.english) = LOWER(acv.english);

        INSERT INTO vocabulary_custom_merge_map (old_word_id, new_word_id)
        SELECT DISTINCT ON (acv.id) 'custom-' || acv.id::TEXT, v.id::TEXT
        FROM admin_custom_vocabulary acv
        JOIN vocabulary v ON LOWER(v.english) = LOWER(acv.english)
        ORDER BY acv.id, (v.id = acv.id) DESC, v.created_at ASC
        ON CONFLICT (old_word_id) DO UPDATE SET new_word_id = EXCLUDED.new_word_id;

        IF to_regclass('public.study_card_words') IS NOT NULL THEN
          INSERT INTO study_card_words (user_id, card_id, word_id, position, created_at)
          SELECT scw.user_id, scw.card_id, m.new_word_id, scw.position, scw.created_at
          FROM study_card_words scw
          JOIN vocabulary_custom_merge_map m ON m.old_word_id = scw.word_id
          ON CONFLICT (user_id, card_id, word_id) DO NOTHING;

          DELETE FROM study_card_words scw
          USING vocabulary_custom_merge_map m
          WHERE scw.word_id = m.old_word_id;
        END IF;

        IF to_regclass('public.exam_ready_words') IS NOT NULL THEN
          INSERT INTO exam_ready_words (user_id, word_id, status, marked_at, passed_at)
          SELECT erw.user_id, m.new_word_id, erw.status, erw.marked_at, erw.passed_at
          FROM exam_ready_words erw
          JOIN vocabulary_custom_merge_map m ON m.old_word_id = erw.word_id
          ON CONFLICT (user_id, word_id) DO NOTHING;

          DELETE FROM exam_ready_words erw
          USING vocabulary_custom_merge_map m
          WHERE erw.word_id = m.old_word_id;
        END IF;

        DROP TABLE admin_custom_vocabulary;
      END IF;
    END $$;
  `)

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_vocabulary_category_id ON vocabulary(category, id)`)
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_vocabulary_created_by ON vocabulary(created_by)`)
  await ensureVocabularyCategoryTable()
}

async function ensureVocabularyCategoryTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vocabulary_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL DEFAULT '📚',
      description TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  const baseCategories = [
    ...QUIZ_CATEGORIES.filter(category => category.id !== "all"),
    { id: "animals", label: "สัตว์", emoji: "🦁", desc: "สัตว์และสิ่งมีชีวิต" },
    { id: "food", label: "อาหาร", emoji: "🍜", desc: "อาหาร เครื่องดื่ม และวัตถุดิบ" },
    { id: "colors", label: "สี", emoji: "🎨", desc: "สีและลักษณะสี" },
    { id: "numbers", label: "จำนวน", emoji: "🔢", desc: "ตัวเลข ปริมาณ และเศษส่วน" },
    { id: "verbs", label: "กริยา", emoji: "⚡", desc: "คำกริยาและการกระทำ" },
    { id: "adjectives", label: "คุณศัพท์", emoji: "✨", desc: "คำบอกลักษณะ" },
    { id: "places", label: "สถานที่", emoji: "🗺️", desc: "สถานที่และพื้นที่" },
    { id: "general", label: "ทั่วไป", emoji: "📌", desc: "คำศัพท์ทั่วไป" },
  ]

  await pool.query(
    `
      INSERT INTO vocabulary_categories (id, name, emoji, description, sort_order, updated_at)
      SELECT c.id, c.name, c.emoji, c.description, c.sort_order, NOW()
      FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[])
        AS c(id, name, emoji, description, sort_order)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        emoji = EXCLUDED.emoji,
        description = EXCLUDED.description,
        sort_order = LEAST(vocabulary_categories.sort_order, EXCLUDED.sort_order),
        updated_at = NOW()
    `,
    [
      baseCategories.map(category => category.id),
      baseCategories.map(category => category.label),
      baseCategories.map(category => category.emoji),
      baseCategories.map(category => category.desc),
      baseCategories.map((_, index) => (index + 1) * 10),
    ],
  )

  await pool.query(`
    INSERT INTO vocabulary_categories (id, name, emoji, description, sort_order)
    SELECT
      category_id,
      INITCAP(REPLACE(category_id, '-', ' ')),
      '📚',
      'คำในหมวด ' || category_id,
      500
    FROM (
      SELECT DISTINCT COALESCE(NULLIF(category, ''), 'general') AS category_id
      FROM vocabulary
    ) categories
    WHERE category_id <> 'custom'
    ON CONFLICT (id) DO NOTHING
  `)
}

export async function listVocabularyCategories() {
  await ensureVocabularySchema()

  const totalResult = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM vocabulary",
  )
  const categoriesResult = await pool.query<{
    id: string
    label: string
    emoji: string
    desc: string
    count: number
  }>(`
    WITH counts AS (
      SELECT COALESCE(NULLIF(category, ''), 'general') AS id, COUNT(*)::int AS count
      FROM vocabulary
      GROUP BY COALESCE(NULLIF(category, ''), 'general')
      UNION ALL
      SELECT 'custom' AS id, COUNT(*)::int AS count
      FROM vocabulary
      WHERE created_by IS NOT NULL
    )
    SELECT
      vc.id,
      vc.name AS label,
      vc.emoji,
      vc.description AS desc,
      COALESCE(counts.count, 0)::int AS count
    FROM vocabulary_categories vc
    LEFT JOIN counts ON counts.id = vc.id
    ORDER BY vc.sort_order ASC, vc.name ASC
  `)

  return [
    { id: "all", label: "คละทั้งหมด", emoji: "🎲", desc: "สุ่มจากทุกหมวด", count: totalResult.rows[0]?.count ?? 0 },
    ...categoriesResult.rows,
  ]
}

export async function upsertVocabularyWord(word: VocabularyInput) {
  await ensureVocabularySchema()

  const result = await pool.query(
    `
      WITH updated AS (
        UPDATE vocabulary
        SET
          thai = $2,
          phonetic = $3,
          example = $4,
          category = $5,
          difficulty = $6,
          synonyms = $7,
          created_by = COALESCE(created_by, $8::uuid),
          updated_at = NOW()
        WHERE LOWER(english) = LOWER($1)
        RETURNING *, created_by IS NOT NULL AS "isUserWord"
      ),
      inserted AS (
        INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty, synonyms, created_by, updated_at)
        SELECT $1, $2, $3, $4, $5, $6, $7, $8::uuid, NOW()
        WHERE NOT EXISTS (SELECT 1 FROM updated)
          AND NOT EXISTS (SELECT 1 FROM vocabulary WHERE LOWER(english) = LOWER($1))
        RETURNING *, created_by IS NOT NULL AS "isUserWord"
      )
      SELECT * FROM updated
      UNION ALL
      SELECT * FROM inserted
      LIMIT 1
    `,
    [
      word.english,
      word.thai,
      word.phonetic ?? null,
      word.example ?? null,
      word.category || "general",
      word.difficulty || 2,
      word.synonyms ?? null,
      word.createdBy ?? null,
    ],
  )

  return result.rows[0]
}

export async function bulkUpsertVocabularyWords(words: VocabularyInput[]) {
  await ensureVocabularySchema()
  if (words.length === 0) return

  const values = words.flatMap(word => [
    word.english,
    word.thai,
    word.phonetic ?? null,
    word.example ?? null,
    word.category || "general",
    word.difficulty || 2,
    word.synonyms ?? null,
    word.createdBy ?? null,
  ])

  const placeholders = words.map((_, index) => {
    const offset = index * 8
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}::text[], $${offset + 8}::uuid)`
  }).join(", ")

  await pool.query(
    `
      WITH incoming(english, thai, phonetic, example, category, difficulty, synonyms, created_by) AS (
        VALUES ${placeholders}
      ),
      updated AS (
        UPDATE vocabulary v
        SET
          thai = i.thai,
          phonetic = i.phonetic,
          example = i.example,
          category = i.category,
          difficulty = i.difficulty,
          synonyms = i.synonyms,
          created_by = COALESCE(v.created_by, i.created_by),
          updated_at = NOW()
        FROM incoming i
        WHERE LOWER(v.english) = LOWER(i.english)
        RETURNING v.id
      )
      INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty, synonyms, created_by, updated_at)
      SELECT i.english, i.thai, i.phonetic, i.example, i.category, i.difficulty, i.synonyms, i.created_by, NOW()
      FROM incoming i
      WHERE NOT EXISTS (
        SELECT 1
        FROM vocabulary v
        WHERE LOWER(v.english) = LOWER(i.english)
      )
    `,
    values,
  )
}
