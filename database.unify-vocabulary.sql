BEGIN;

ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS synonyms TEXT[] NULL;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS created_by UUID NULL;
ALTER TABLE vocabulary ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NULL DEFAULT NOW();

UPDATE vocabulary
SET updated_at = COALESCE(updated_at, created_at, NOW())
WHERE updated_at IS NULL;

CREATE TEMP TABLE vocabulary_custom_merge_map (
  old_word_id TEXT PRIMARY KEY,
  new_word_id TEXT NOT NULL
) ON COMMIT DROP;

INSERT INTO vocabulary
  (id, english, thai, phonetic, example, category, difficulty, synonyms, created_by, created_at, updated_at)
SELECT
  acv.id,
  acv.english,
  acv.thai,
  acv.phonetic,
  acv.example,
  COALESCE(acv.category, 'general'),
  COALESCE(acv.difficulty, 2),
  NULL::TEXT[],
  acv.created_by,
  COALESCE(acv.created_at, NOW()),
  COALESCE(acv.updated_at, acv.created_at, NOW())
FROM admin_custom_vocabulary acv
WHERE NOT EXISTS (
  SELECT 1
  FROM vocabulary v
  WHERE LOWER(v.english) = LOWER(acv.english)
);

UPDATE vocabulary v
SET
  created_by = COALESCE(v.created_by, acv.created_by),
  updated_at = GREATEST(
    COALESCE(v.updated_at, '-infinity'::TIMESTAMPTZ),
    COALESCE(acv.updated_at, acv.created_at, NOW())
  )
FROM admin_custom_vocabulary acv
WHERE LOWER(v.english) = LOWER(acv.english);

INSERT INTO vocabulary_custom_merge_map (old_word_id, new_word_id)
SELECT DISTINCT ON (acv.id) 'custom-' || acv.id::TEXT, v.id::TEXT
FROM admin_custom_vocabulary acv
JOIN vocabulary v ON LOWER(v.english) = LOWER(acv.english)
ORDER BY acv.id, (v.id = acv.id) DESC, v.created_at ASC
ON CONFLICT (old_word_id) DO UPDATE SET new_word_id = EXCLUDED.new_word_id;

INSERT INTO study_card_words (user_id, card_id, word_id, position, created_at)
SELECT scw.user_id, scw.card_id, m.new_word_id, scw.position, scw.created_at
FROM study_card_words scw
JOIN vocabulary_custom_merge_map m ON m.old_word_id = scw.word_id
ON CONFLICT (user_id, card_id, word_id) DO NOTHING;

DELETE FROM study_card_words scw
USING vocabulary_custom_merge_map m
WHERE scw.word_id = m.old_word_id;

INSERT INTO exam_ready_words (user_id, word_id, status, marked_at, passed_at)
SELECT erw.user_id, m.new_word_id, erw.status, erw.marked_at, erw.passed_at
FROM exam_ready_words erw
JOIN vocabulary_custom_merge_map m ON m.old_word_id = erw.word_id
ON CONFLICT (user_id, word_id) DO NOTHING;

DELETE FROM exam_ready_words erw
USING vocabulary_custom_merge_map m
WHERE erw.word_id = m.old_word_id;

CREATE INDEX IF NOT EXISTS idx_vocabulary_category_id ON vocabulary(category, id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_created_by ON vocabulary(created_by);

DROP TABLE admin_custom_vocabulary;

COMMIT;
