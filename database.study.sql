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

CREATE INDEX IF NOT EXISTS idx_study_card_words_card ON study_card_words(user_id, card_id, position);
CREATE INDEX IF NOT EXISTS idx_exam_ready_words_status ON exam_ready_words(user_id, status);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category_id ON vocabulary(category, id);
CREATE INDEX IF NOT EXISTS idx_admin_custom_vocabulary_category_id ON admin_custom_vocabulary(category, id);
