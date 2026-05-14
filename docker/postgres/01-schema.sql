CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  display_name TEXT NOT NULL,
  pin TEXT UNIQUE NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🙂',
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vocabulary (
  id SERIAL PRIMARY KEY,
  english TEXT NOT NULL UNIQUE,
  thai TEXT NOT NULL,
  phonetic TEXT,
  example TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_custom_vocabulary (
  id SERIAL PRIMARY KEY,
  english TEXT NOT NULL UNIQUE,
  thai TEXT NOT NULL,
  phonetic TEXT,
  example TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  difficulty INTEGER NOT NULL DEFAULT 2,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  streak_count INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  avg_time_ms NUMERIC NOT NULL DEFAULT 0,
  is_mastered BOOLEAN NOT NULL DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'multiple-choice',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  words_completed INTEGER NOT NULL DEFAULT 0,
  words_mastered INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'default',
  font_size TEXT NOT NULL DEFAULT 'medium',
  preferred_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS study_cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, card_id, word_id)
);

CREATE TABLE IF NOT EXISTS exam_ready_words (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready',
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  passed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, word_id)
);

CREATE TABLE IF NOT EXISTS user_game_settings (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT 'null'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_category_id ON vocabulary(category, id);
CREATE INDEX IF NOT EXISTS idx_admin_custom_vocabulary_category_id ON admin_custom_vocabulary(category, id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_study_card_words_card ON study_card_words(user_id, card_id, position);
CREATE INDEX IF NOT EXISTS idx_exam_ready_words_status ON exam_ready_words(user_id, status);

INSERT INTO users (id, display_name, pin, emoji, is_admin, is_active)
VALUES
  ('admin', 'Admin', '11111', '🛡️', TRUE, TRUE),
  ('player', 'Player', '12345', '🙂', FALSE, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_settings (key, value)
VALUES
  ('pin_enabled', 'true'),
  ('default_user_id', 'player')
ON CONFLICT (key) DO NOTHING;

INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty)
VALUES
  ('apple', 'แอปเปิล', 'AP-uhl', 'I eat an apple every day.', 'fruits', 1),
  ('book', 'หนังสือ', 'buuk', 'This book is useful.', 'daily-life', 1),
  ('water', 'น้ำ', 'WAW-ter', 'Please drink more water.', 'daily-life', 1),
  ('house', 'บ้าน', 'hows', 'My house is near the station.', 'daily-life', 1),
  ('learn', 'เรียนรู้', 'lern', 'We learn something new today.', 'top-3000', 2),
  ('quick', 'รวดเร็ว', 'kwik', 'She made a quick decision.', 'top-3000', 2),
  ('design', 'ออกแบบ', 'di-ZYN', 'They design a new system.', 'engineering', 2),
  ('engine', 'เครื่องยนต์', 'EN-jin', 'The engine needs maintenance.', 'engineering', 3),
  ('chapter', 'บท', 'CHAP-ter', 'This chapter is exciting.', 'reading-novel', 2),
  ('headline', 'พาดหัวข่าว', 'HED-lyn', 'The headline was surprising.', 'reading-news', 3)
ON CONFLICT (english) DO NOTHING;
