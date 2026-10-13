-- app/migrations/003_admin.sql
-- Thẻ quản lý bởi admin, yêu cầu thẻ từ người dùng, view thẻ hoạt động và nhật ký kiểm toán

CREATE TABLE IF NOT EXISTS tag_settings (
  slug       TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  enabled    INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  is_system  INTEGER NOT NULL DEFAULT 0 CHECK (is_system IN (0,1)),  -- 1 = luôn thu thập
  max_items  INTEGER CHECK (max_items IS NULL OR max_items > 0)      -- NULL = dùng tags.max_items_per_tag
);

CREATE TABLE IF NOT EXISTS tag_requests (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug_proposed TEXT NOT NULL,
  label         TEXT NOT NULL,
  reason        TEXT,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by   TEXT REFERENCES users(id),
  reviewed_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_tag_requests_status ON tag_requests (status, created_at);

-- Tag đang hoạt động = bật + (là tag hệ thống hoặc có người theo dõi).
CREATE VIEW IF NOT EXISTS v_active_tags AS
SELECT ts.slug, ts.label, ts.max_items, ts.is_system, COALESCE(f.followers, 0) AS followers
  FROM tag_settings ts
  LEFT JOIN (
        SELECT ut.tag_slug, COUNT(*) AS followers
          FROM user_tags ut
          JOIN users u ON u.id = ut.user_id AND u.status = 'active'
         GROUP BY ut.tag_slug
       ) f ON f.tag_slug = ts.slug
 WHERE ts.enabled = 1
   AND (ts.is_system = 1 OR COALESCE(f.followers, 0) > 0);

-- Nhật ký thao tác nhạy cảm. KHÔNG ghi key hoặc nội dung bí mật vào metadata_json.
CREATE TABLE IF NOT EXISTS audit_log (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id  TEXT,
  action         TEXT NOT NULL,              -- vd 'settings.update', 'tag.toggle', 'user.update_role'
  target_type    TEXT,
  target_id      TEXT,
  metadata_json  TEXT,
  created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log (created_at);

-- Khởi tạo danh sách thẻ mặc định của hệ thống
INSERT OR IGNORE INTO tag_settings (slug, label, enabled, is_system, max_items) VALUES
  ('github', 'GitHub Trending', 1, 1, 10),
  ('extension', 'VS Code Extensions', 1, 1, 10),
  ('model', 'AI Models', 1, 1, 10),
  ('paper', 'AI Research Papers', 1, 1, 10),
  ('mcp', 'Model Context Protocol', 1, 1, 10),
  ('agent', 'AI Agents', 1, 1, 10),
  ('coding-assistant', 'Coding Assistants', 1, 1, 10),
  ('rag', 'RAG & Retrieval', 1, 1, 10),
  ('local-llm', 'Local LLMs', 1, 1, 10),
  ('testing', 'AI Testing', 1, 1, 10),
  ('devtools', 'Developer Tools', 1, 1, 10),
  ('security', 'AI Security', 1, 1, 10),
  ('data', 'Data & Vector DBs', 1, 1, 10),
  ('infra', 'AI Infrastructure', 1, 1, 10),
  ('open-source', 'Open Source AI', 1, 1, 10);
