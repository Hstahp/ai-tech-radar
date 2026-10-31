-- db/app-migrations/004_bookmarks.sql
-- Quản lý bài viết & bài báo nghiên cứu đã lưu (Bookmarks) của người dùng

CREATE TABLE IF NOT EXISTS user_bookmarks (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key    TEXT NOT NULL,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  category    TEXT NOT NULL,
  author      TEXT,
  tags        TEXT,
  summary     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (user_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_user_bookmarks_created ON user_bookmarks (user_id, created_at DESC);
