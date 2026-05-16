import pool from "@/lib/database"

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
