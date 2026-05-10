-- english-card-game/backend/database.sql
-- ═══════════════════════════════════════════════════════════════
-- English Card Game — PostgreSQL Schema
-- Run: psql -d english_card_game -f database.sql
-- ═══════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Users ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name   VARCHAR(100)  NOT NULL,
  emoji          VARCHAR(10)   DEFAULT '🙂',
  pin            CHAR(5)       UNIQUE,
  is_admin       BOOLEAN       DEFAULT false,
  is_active      BOOLEAN       DEFAULT true,
  total_xp       INTEGER       DEFAULT 0,
  current_streak INTEGER       DEFAULT 0,
  longest_streak INTEGER       DEFAULT 0,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ── System Settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_settings (
  key        VARCHAR(100) PRIMARY KEY,
  value      TEXT         NOT NULL,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Vocabulary ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vocabulary (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  english     VARCHAR(200) NOT NULL UNIQUE,
  thai        VARCHAR(400) NOT NULL,
  phonetic    VARCHAR(200),
  example     TEXT,
  category    VARCHAR(100) NOT NULL DEFAULT 'general',
  difficulty  SMALLINT     NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  synonyms    TEXT[],
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ── User Progress ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_progress (
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id       UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  streak_count  INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  is_mastered   BOOLEAN DEFAULT false,
  last_seen_at  TIMESTAMPTZ DEFAULT NOW(),
  avg_time_ms   INTEGER,
  PRIMARY KEY (user_id, word_id)
);

-- ── Game Sessions ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode             VARCHAR(50)  NOT NULL,  -- 'multiple-choice' | 'think-reveal' | 'timed'
  started_at       TIMESTAMPTZ  DEFAULT NOW(),
  ended_at         TIMESTAMPTZ,
  words_completed  INTEGER      DEFAULT 0,
  words_mastered   INTEGER      DEFAULT 0,
  xp_earned        INTEGER      DEFAULT 0
);

-- ── Game Answers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  word_id     UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  correct     BOOLEAN     NOT NULL,
  time_ms     INTEGER,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Leaderboard Cache ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaderboard (
  user_id       UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  xp            INTEGER DEFAULT 0,
  words_mastered INTEGER DEFAULT 0,
  rank          INTEGER,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Achievements ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  icon        VARCHAR(10)  DEFAULT '🏅',
  condition   JSONB,           -- { type: 'mastered_count', value: 10 }
  xp_reward   INTEGER      DEFAULT 0,
  sort_order  INTEGER      DEFAULT 0
);

-- ── User Achievements ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- ── Daily Challenges ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date         DATE         NOT NULL,
  word_ids     UUID[]       NOT NULL,
  xp_reward    INTEGER      DEFAULT 50,
  UNIQUE(date)
);

-- ── User Collections ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Collection Words ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collection_words (
  collection_id UUID NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  word_id       UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, word_id)
);

-- ═══════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_user_progress_user   ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_word   ON user_progress(word_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_mastered ON user_progress(user_id, is_mastered);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user   ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_answers_session ON game_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_category  ON vocabulary(category);
CREATE INDEX IF NOT EXISTS idx_vocabulary_difficulty ON vocabulary(difficulty);
CREATE INDEX IF NOT EXISTS idx_vocabulary_english   ON vocabulary USING gin(english gin_trgm_ops);

-- Enable trigram extension for full-text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Auto-update longest_streak when current_streak changes
CREATE OR REPLACE FUNCTION update_longest_streak()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_streak > NEW.longest_streak THEN
    NEW.longest_streak = NEW.current_streak;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_longest_streak ON users;
CREATE TRIGGER trg_longest_streak
  BEFORE UPDATE OF current_streak ON users
  FOR EACH ROW EXECUTE FUNCTION update_longest_streak();

-- Auto-update leaderboard cache when user XP changes
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO leaderboard (user_id, xp, words_mastered, updated_at)
  SELECT u.id, u.total_xp,
         COUNT(up.word_id) FILTER (WHERE up.is_mastered = true),
         NOW()
  FROM users u
  LEFT JOIN user_progress up ON up.user_id = u.id
  WHERE u.id = NEW.id
  GROUP BY u.id
  ON CONFLICT (user_id) DO UPDATE
    SET xp = EXCLUDED.xp, words_mastered = EXCLUDED.words_mastered, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_leaderboard ON users;
CREATE TRIGGER trg_leaderboard
  AFTER UPDATE OF total_xp ON users
  FOR EACH ROW EXECUTE FUNCTION refresh_leaderboard();

-- ═══════════════════════════════════════════════════════════════
-- USER STATS VIEW
-- ═══════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id,
  u.display_name,
  u.emoji,
  u.total_xp,
  u.current_streak,
  u.longest_streak,
  COUNT(up.word_id)                                     AS words_attempted,
  COUNT(up.word_id) FILTER (WHERE up.is_mastered)       AS words_mastered,
  ROUND(
    100.0 * SUM(up.correct_count) / NULLIF(SUM(up.attempt_count), 0), 1
  )                                                     AS accuracy_pct,
  COUNT(DISTINCT gs.id)                                 AS total_sessions
FROM users u
LEFT JOIN user_progress up ON up.user_id = u.id
LEFT JOIN game_sessions gs ON gs.user_id = u.id
GROUP BY u.id;

-- ═══════════════════════════════════════════════════════════════
-- DEFAULT DATA
-- ═══════════════════════════════════════════════════════════════

-- System settings
INSERT INTO system_settings (key, value) VALUES
  ('pin_enabled',    'true'),
  ('default_user_id', ''),
  ('app_name',       'English Card Game'),
  ('max_users',      '100')
ON CONFLICT (key) DO NOTHING;

-- Default users
INSERT INTO users (display_name, emoji, pin, is_admin) VALUES
  ('มานี',  '👧', '12345', false),
  ('ปิติ',  '👦', '11111', false),
  ('Admin', '🛡️', '00000', true)
ON CONFLICT (pin) DO NOTHING;

-- Achievements
INSERT INTO achievements (key, name, description, icon, xp_reward, sort_order, condition) VALUES
  ('first_word',     'First Steps',      'Master your first word',         '🌱', 20,  1, '{"type":"mastered_count","value":1}'),
  ('ten_words',      'Getting Fluent',   'Master 10 words',                '📚', 50,  2, '{"type":"mastered_count","value":10}'),
  ('streak_5',       'On Fire',          'Reach a 5-word streak',          '🔥', 30,  3, '{"type":"streak","value":5}'),
  ('speed_demon',    'Speed Demon',      'Answer under 3 seconds',         '⚡', 15,  4, '{"type":"speed_ms","value":3000}'),
  ('perfect_week',   'Perfect Week',     'Play every day for 7 days',      '🏅', 100, 5, '{"type":"daily_streak","value":7}'),
  ('fifty_words',    'Word Master',      'Master 50 words',                '🎓', 200, 6, '{"type":"mastered_count","value":50}'),
  ('century',        'Century Club',     'Master 100 words',               '💯', 500, 7, '{"type":"mastered_count","value":100}'),
  ('accuracy_90',    'Sharp Shooter',    'Reach 90% accuracy',             '🎯', 75,  8, '{"type":"accuracy","value":90}')
ON CONFLICT (key) DO NOTHING;

-- Seed vocabulary (50+ words)
INSERT INTO vocabulary (english, thai, phonetic, example, category, difficulty) VALUES
  -- Animals
  ('elephant',  'ช้าง',        'EL-uh-funt',   'The elephant drinks water.',           'animals',    1),
  ('tiger',     'เสือ',        'TY-ger',        'A tiger runs fast.',                   'animals',    1),
  ('monkey',    'ลิง',         'MUNG-kee',      'The monkey eats a banana.',            'animals',    1),
  ('crocodile', 'จระเข้',      'KROK-uh-dyl',   'A crocodile lives near the river.',   'animals',    2),
  ('butterfly', 'ผีเสื้อ',    'BUT-er-fly',    'The butterfly lands on a flower.',     'animals',    2),
  ('dolphin',   'โลมา',        'DOL-fin',       'Dolphins are very smart.',             'animals',    2),
  ('giraffe',   'ยีราฟ',       'jih-RAF',       'A giraffe has a long neck.',           'animals',    2),
  ('penguin',   'เพนกวิน',     'PENG-gwin',     'The penguin waddles on the ice.',      'animals',    2),
  -- Food
  ('mango',     'มะม่วง',      'MANG-go',       'I love eating mango.',                 'food',       1),
  ('noodles',   'เส้นก๋วยเตี๋ยว', 'NOO-dulz', 'She cooked noodles for dinner.',       'food',       1),
  ('rice',      'ข้าว',        'ryss',          'We eat rice every day.',               'food',       1),
  ('durian',    'ทุเรียน',     'DUH-ree-un',    'Durian is a strong-smelling fruit.',   'food',       2),
  ('cucumber',  'แตงกวา',      'KYOO-kum-ber',  'A cucumber is cool and fresh.',        'food',       2),
  ('pineapple', 'สับปะรด',     'PY-nap-ul',     'Pineapple is sweet and sour.',         'food',       2),
  ('eggplant',  'มะเขือ',      'EG-plant',      'She fried the eggplant with garlic.',  'food',       2),
  ('coconut',   'มะพร้าว',     'KOH-kuh-nut',   'Coconut milk is used in Thai curry.',  'food',       1),
  -- Colors
  ('scarlet',   'สีแดงเข้ม',  'SKAR-lit',      'She wore a scarlet dress.',            'colors',     3),
  ('turquoise', 'สีฟ้าเขียว', 'TUR-kwoyz',     'The ocean was turquoise.',             'colors',     3),
  ('crimson',   'สีแดงเลือดหมู', 'KRIM-zun',   'The sunset turned crimson.',           'colors',     3),
  ('lavender',  'สีม่วงอ่อน', 'LAV-un-der',    'She painted the room lavender.',       'colors',     2),
  ('emerald',   'สีเขียวมรกต', 'EM-ur-uld',    'The emerald ring was beautiful.',      'colors',     3),
  ('ivory',     'สีงาช้าง',   'EYE-vuh-ree',   'The piano keys were ivory.',           'colors',     3),
  -- Numbers/Quantities
  ('dozen',     'โหล',         'DUZ-un',        'She bought a dozen eggs.',             'numbers',    2),
  ('quarter',   'หนึ่งในสี่',  'KWOR-ter',      'A quarter of the pie is left.',        'numbers',    2),
  ('billion',   'พันล้าน',     'BIL-yun',       'There are eight billion people.',      'numbers',    2),
  ('fraction',  'เศษส่วน',    'FRAK-shun',     'One half is a fraction.',              'numbers',    3),
  -- Verbs
  ('whisper',   'กระซิบ',      'WIS-per',       'She whispered a secret to him.',       'verbs',      2),
  ('stumble',   'สะดุด',       'STUM-bul',      'He stumbled on the stairs.',           'verbs',      3),
  ('glance',    'มองชั่วครู่', 'GLANS',         'She glanced at the clock.',            'verbs',      2),
  ('shiver',    'สั่น',        'SHIV-er',       'He shivered in the cold.',             'verbs',      2),
  ('wander',    'เดินเตร็ดเตร่', 'WON-der',    'They wandered through the market.',    'verbs',      2),
  ('harvest',   'เก็บเกี่ยว', 'HAR-vust',      'Farmers harvest rice in autumn.',      'verbs',      3),
  ('borrow',    'ยืม',         'BOR-oh',        'Can I borrow your pen?',               'verbs',      1),
  ('celebrate', 'เฉลิมฉลอง',  'SEL-uh-brayt',  'We celebrate New Year together.',      'verbs',      2),
  -- Adjectives
  ('enormous',  'ใหญ่โต',      'ih-NOR-mus',    'The whale is enormous.',               'adjectives', 2),
  ('fragile',   'เปราะบาง',    'FRAJ-ul',       'Handle the fragile glass carefully.',  'adjectives', 3),
  ('ancient',   'โบราณ',       'AYN-shunt',     'We visited an ancient temple.',        'adjectives', 2),
  ('graceful',  'สง่างาม',     'GRAYZ-ful',     'The dancer was graceful.',             'adjectives', 2),
  ('peculiar',  'แปลกประหลาด', 'pih-KYOO-lee-er', 'That is a peculiar noise.',          'adjectives', 3),
  ('humble',    'ถ่อมตัว',     'HUM-bul',       'She is humble despite her success.',   'adjectives', 2),
  ('stubborn',  'ดื้อรั้น',    'STUB-urn',      'The stubborn child refused to eat.',   'adjectives', 2),
  ('vivid',     'สีสันสดใส',  'VIV-id',        'She has a vivid imagination.',         'adjectives', 2),
  -- Places
  ('temple',    'วัด',         'TEM-pul',       'We visited the temple at sunrise.',    'places',     1),
  ('market',    'ตลาด',        'MAR-kit',       'She buys vegetables at the market.',   'places',     1),
  ('hospital',  'โรงพยาบาล',  'HOS-pit-ul',    'The hospital is nearby.',              'places',     2),
  ('waterfall', 'น้ำตก',       'WAW-ter-fawl',  'The waterfall was breathtaking.',      'places',     2)
ON CONFLICT (english) DO NOTHING;
