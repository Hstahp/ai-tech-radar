-- app/migrations/002_auth.sql
-- Nguoi dung, tai khoan OAuth, phien dang nhap, tag ca nhan va han muc user

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,            -- UUID hoac chuoi dinh danh duy nhat
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  display_name  TEXT,
  avatar_url    TEXT,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  status        TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider          TEXT NOT NULL CHECK (provider IN ('github','google')),
  provider_user_id  TEXT NOT NULL,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (provider, provider_user_id)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts (user_id);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash  TEXT PRIMARY KEY,              -- sha256 cua session token; KHONG luu token tho
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  user_agent  TEXT
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS user_tags (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tag_slug   TEXT NOT NULL,                  -- dinh danh tag theo constants TAGS
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (user_id, tag_slug)
) WITHOUT ROWID;
CREATE INDEX IF NOT EXISTS idx_user_tags_slug ON user_tags (tag_slug);

CREATE TABLE IF NOT EXISTS user_quota_daily (
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date        TEXT NOT NULL,
  chat_requests     INTEGER NOT NULL DEFAULT 0,
  explain_requests  INTEGER NOT NULL DEFAULT 0,
  tokens_in         INTEGER NOT NULL DEFAULT 0,
  tokens_out        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, usage_date)
) WITHOUT ROWID;
