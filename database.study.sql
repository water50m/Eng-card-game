CREATE TABLE IF NOT EXISTS study_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '⭐',
  description TEXT NOT NULL DEFAULT '',
  learning_style TEXT NOT NULL DEFAULT 'fast',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  source TEXT NOT NULL DEFAULT 'user',
  template_id TEXT,
  play_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_card_words (
  user_id TEXT NOT NULL,
  card_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id, word_id)
);

CREATE TABLE IF NOT EXISTS exam_ready_words (
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_game_settings (
  user_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

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

CREATE INDEX IF NOT EXISTS idx_study_card_words_card ON study_card_words(user_id, card_id, position);
CREATE INDEX IF NOT EXISTS idx_exam_ready_words_status ON exam_ready_words(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category_id ON vocabulary(category, id);
