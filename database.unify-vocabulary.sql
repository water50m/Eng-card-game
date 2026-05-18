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

CREATE TABLE IF NOT EXISTS vocabulary_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📚',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO vocabulary_categories (id, name, emoji, description, sort_order, updated_at)
VALUES
  ('daily-life', 'ชีวิตประจำวัน', '🏠', 'คำที่ใช้ทุกวัน', 10, NOW()),
  ('fruits', 'ผลไม้', '🍎', 'ผลไม้และพืชผล', 20, NOW()),
  ('top-3000', '3000 คำที่ใช้บ่อยสุด', '📚', 'คำที่เจอบ่อยและควรรู้เป็นฐานหลัก', 30, NOW()),
  ('engineering', 'วิศวกรรม', '⚙️', 'คำเฉพาะทาง', 40, NOW()),
  ('reading-manga', 'อ่านการ์ตูน', '📕', 'มังงะ/อนิเมะ', 50, NOW()),
  ('reading-novel', 'อ่านนิยาย', '📖', 'นิยายภาษาอังกฤษ', 60, NOW()),
  ('reading-news', 'อ่านข่าว', '📰', 'สื่อและข่าว', 70, NOW()),
  ('custom', 'คำส่วนตัว', '👤', 'คำที่เพิ่มเอง', 80, NOW()),
  ('animals', 'สัตว์', '🦁', 'สัตว์และสิ่งมีชีวิต', 90, NOW()),
  ('food', 'อาหาร', '🍜', 'อาหาร เครื่องดื่ม และวัตถุดิบ', 100, NOW()),
  ('colors', 'สี', '🎨', 'สีและลักษณะสี', 110, NOW()),
  ('numbers', 'จำนวน', '🔢', 'ตัวเลข ปริมาณ และเศษส่วน', 120, NOW()),
  ('verbs', 'กริยา', '⚡', 'คำกริยาและการกระทำ', 130, NOW()),
  ('adjectives', 'คุณศัพท์', '✨', 'คำบอกลักษณะ', 140, NOW()),
  ('places', 'สถานที่', '🗺️', 'สถานที่และพื้นที่', 150, NOW()),
  ('general', 'ทั่วไป', '📌', 'คำศัพท์ทั่วไป', 160, NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  description = EXCLUDED.description,
  sort_order = LEAST(vocabulary_categories.sort_order, EXCLUDED.sort_order),
  updated_at = NOW();

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
ON CONFLICT (id) DO NOTHING;

DROP TABLE admin_custom_vocabulary;

COMMIT;
