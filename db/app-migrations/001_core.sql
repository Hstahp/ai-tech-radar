-- app/migrations/001_core.sql
-- Nền tảng chat, hạn mức, giải thích sâu (D1 / SQLite tương thích)

CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,                 -- JSON dạng chuỗi
  updated_by  TEXT,
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('chat.user_daily_limit',      '10'),
  ('chat.global_daily_limit',    '300'),
  ('chat.max_question_chars',    '500'),
  ('chat.history_turns',         '2'),
  ('chat.max_context_items',     '8'),
  ('chat.min_retrieval_score',   '0.1'),
  ('explain.user_daily_limit',   '5'),
  ('explain.global_daily_limit', '30'),
  ('tags.max_per_user',          '10'),
  ('tags.max_active',            '30'),
  ('tags.max_items_per_tag',     '10'),
  ('keys.soft_limit_ratio',      '0.6'),
  ('keys.max_attempts',          '2'),
  ('keys.pool_enabled',          'false');

-- Tổng hợp mức dùng theo ngày (cho admin xem và cho kiểm soát ngân sách)
CREATE TABLE IF NOT EXISTS usage_daily (
  usage_date  TEXT    NOT NULL,
  scope       TEXT    NOT NULL CHECK (scope IN ('system','byok')),
  provider    TEXT    NOT NULL,
  key_id      INTEGER NOT NULL DEFAULT 0,    -- 0 = không gắn key cụ thể
  feature     TEXT    NOT NULL CHECK (feature IN ('chat','explain','pipeline')),
  requests    INTEGER NOT NULL DEFAULT 0,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_date, scope, provider, key_id, feature)
) WITHOUT ROWID;

-- Nhật ký từng lượt chat (để chỉnh ngưỡng, phát hiện từ chối nhầm)
CREATE TABLE IF NOT EXISTS chat_events (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT,                     -- NULL nếu chưa có auth
  anon_hash        TEXT,                     -- băm IP+salt khi chưa đăng nhập; KHÔNG lưu IP thô
  digest_date      TEXT,
  status           TEXT NOT NULL CHECK (status IN
                     ('answered','refused_retrieval','refused_model','refused_validation',
                      'cached','rate_limited','quota_exceeded','error')),
  key_source       TEXT NOT NULL DEFAULT 'none'
                     CHECK (key_source IN ('none','system','byok_browser','byok_server')),
  question_hash    TEXT NOT NULL,
  question         TEXT,                     -- chỉ lưu khi bị từ chối, để tinh chỉnh; xóa sau 30 ngày
  retrieved_count  INTEGER,
  top_score        REAL,
  tokens_in        INTEGER,
  tokens_out       INTEGER,
  latency_ms       INTEGER,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_chat_events_created ON chat_events (created_at);
CREATE INDEX IF NOT EXISTS idx_chat_events_status  ON chat_events (status, created_at);

-- Cache câu trả lời đã được validate
CREATE TABLE IF NOT EXISTS chat_cache (
  question_hash  TEXT NOT NULL,              -- sha256(câu hỏi chuẩn hóa)
  digest_date    TEXT NOT NULL,
  response_json  TEXT NOT NULL,
  hits           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (question_hash, digest_date)
) WITHOUT ROWID;

-- Giải thích sâu: tạo khi có người yêu cầu, lưu để người sau dùng chung
CREATE TABLE IF NOT EXISTS explanations (
  item_key        TEXT    NOT NULL,          -- = items.url_hash
  content_hash    TEXT    NOT NULL,
  prompt_version  INTEGER NOT NULL,
  lang            TEXT    NOT NULL DEFAULT 'vi',
  status          TEXT    NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','ready','failed')),
  body_json       TEXT,
  provider        TEXT,
  model           TEXT,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  locked_until    TEXT,                      -- khóa mềm chống hai người cùng tạo một mục
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (item_key, content_hash, prompt_version, lang)
) WITHOUT ROWID;
