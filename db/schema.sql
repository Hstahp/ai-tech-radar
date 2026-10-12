-- =============================================================================
-- AI TECH RADAR — SQLite schema (version 1)
-- -----------------------------------------------------------------------------
-- Quy ước:
--   * Thời gian lưu dạng TEXT ISO-8601 UTC: 'YYYY-MM-DDTHH:MM:SSZ'
--   * Ngày bản tin (digest_date, metrics.date) là 'YYYY-MM-DD' theo giờ Asia/Ho_Chi_Minh
--   * Boolean lưu INTEGER 0/1
--   * Mọi khóa ngoại bật bằng PRAGMA foreign_keys = ON (phải bật ở MỖI kết nối)
-- =============================================================================

PRAGMA journal_mode = WAL;      -- được lưu trong file DB
PRAGMA synchronous  = NORMAL;   -- đủ an toàn với WAL, nhanh hơn FULL
PRAGMA foreign_keys = ON;       -- áp dụng cho kết nối hiện tại

-- -----------------------------------------------------------------------------
-- 0. MIGRATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
  version     INTEGER PRIMARY KEY,
  name        TEXT    NOT NULL,
  applied_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- -----------------------------------------------------------------------------
-- 1. NGUỒN DỮ LIỆU
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sources (
  id        INTEGER PRIMARY KEY,
  key       TEXT    NOT NULL UNIQUE,                       -- vd: 'github_search'
  name      TEXT    NOT NULL,
  kind      TEXT    NOT NULL CHECK (kind IN ('api','rss','scrape')),
  base_url  TEXT,
  weight    REAL    NOT NULL DEFAULT 1.0 CHECK (weight >= 0), -- trọng số khi chấm điểm
  enabled   INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1))
);

-- -----------------------------------------------------------------------------
-- 2. ITEMS — mỗi repo / extension / tin / paper / model là một dòng
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS items (
  id                    INTEGER PRIMARY KEY,
  source_id             INTEGER NOT NULL REFERENCES sources(id),
  external_id           TEXT    NOT NULL,                  -- id gốc ở nguồn (repo full_name, HN id, ...)
  category              TEXT    NOT NULL
                          CHECK (category IN ('repo','extension','news','paper','model')),
  url                   TEXT    NOT NULL,
  url_hash              TEXT    NOT NULL UNIQUE,           -- sha256 của URL đã chuẩn hóa → chống trùng
  title                 TEXT    NOT NULL,
  description           TEXT,                              -- đã cắt ngắn (~30–50 từ) trước khi lưu
  author                TEXT,
  programming_language  TEXT,
  license               TEXT,
  published_at          TEXT,                              -- thời điểm nguồn đăng
  first_seen_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  last_seen_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  content_hash          TEXT    NOT NULL,                  -- sha256(title + '\n' + description) → cache LLM
  status                TEXT    NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','spam','hidden')),
  raw_json              TEXT,                              -- dữ liệu thô; dọn sau ~60 ngày
  UNIQUE (source_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_items_category_first_seen ON items (category, first_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_items_last_seen           ON items (last_seen_at);
CREATE INDEX IF NOT EXISTS idx_items_status              ON items (status) WHERE status <> 'active';

-- -----------------------------------------------------------------------------
-- 3. METRICS — snapshot theo ngày để tính tốc độ tăng (velocity)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS metrics (
  item_id       INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  date          TEXT    NOT NULL,                          -- 'YYYY-MM-DD'
  stars         INTEGER,
  forks         INTEGER,
  open_issues   INTEGER,
  points        INTEGER,                                   -- Hacker News points
  comments      INTEGER,
  installs      INTEGER,                                   -- extension
  rating        REAL,
  rating_count  INTEGER,
  PRIMARY KEY (item_id, date)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_metrics_date ON metrics (date);

-- -----------------------------------------------------------------------------
-- 4. SUMMARIES — kết quả LLM, cache theo (item, lang, prompt_version, content_hash)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS summaries (
  id              INTEGER PRIMARY KEY,
  item_id         INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  lang            TEXT    NOT NULL DEFAULT 'vi',
  provider        TEXT,                                    -- 'gemini' | 'groq' | 'ollama'
  model           TEXT,
  prompt_version  TEXT    NOT NULL,
  content_hash    TEXT    NOT NULL,                        -- trùng items.content_hash lúc tóm tắt
  purpose         TEXT    NOT NULL,                        -- 🎯 Mục đích
  highlight       TEXT    NOT NULL,                        -- ⭐ Điểm nổi bật
  action          TEXT    NOT NULL,                        -- 🔗 Hành động
  verdict         TEXT    NOT NULL CHECK (verdict IN ('try_now','watch','skip')),
  confidence      TEXT    NOT NULL CHECK (confidence IN ('low','medium','high')),
  raw_json        TEXT,
  tokens_in       INTEGER,
  tokens_out      INTEGER,
  created_at      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  UNIQUE (item_id, lang, prompt_version, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_summaries_item_lang ON summaries (item_id, lang, created_at DESC);

-- -----------------------------------------------------------------------------
-- 5. TAGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id     INTEGER PRIMARY KEY,
  slug   TEXT NOT NULL UNIQUE,                             -- 'mcp', 'agent', 'local-llm', ...
  label  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id  INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_item_tags_tag ON item_tags (tag_id, item_id);

-- -----------------------------------------------------------------------------
-- 6. DIGESTS — bản tin theo ngày
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS digests (
  id              INTEGER PRIMARY KEY,
  digest_date     TEXT    NOT NULL UNIQUE,                 -- 'YYYY-MM-DD' (giờ VN)
  status          TEXT    NOT NULL DEFAULT 'building'
                    CHECK (status IN ('building','published','failed')),
  provider        TEXT,
  model           TEXT,
  prompt_version  TEXT,
  notes           TEXT,
  generated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE TABLE IF NOT EXISTS digest_items (
  digest_id  INTEGER NOT NULL REFERENCES digests(id) ON DELETE CASCADE,
  item_id    INTEGER NOT NULL REFERENCES items(id)   ON DELETE CASCADE,
  section    TEXT    NOT NULL CHECK (section IN ('repo','extension','news','paper','model')),
  rank       INTEGER NOT NULL CHECK (rank >= 1),
  score      REAL,
  PRIMARY KEY (digest_id, item_id),
  UNIQUE (digest_id, section, rank)
) WITHOUT ROWID;

CREATE INDEX IF NOT EXISTS idx_digest_items_item ON digest_items (item_id);

-- -----------------------------------------------------------------------------
-- 7. VẬN HÀNH: lịch sử chạy pipeline, theo dõi quota LLM
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id             INTEGER PRIMARY KEY,
  trigger        TEXT NOT NULL DEFAULT 'schedule'
                   CHECK (trigger IN ('schedule','manual','local')),
  started_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  finished_at    TEXT,
  status         TEXT NOT NULL DEFAULT 'running'
                   CHECK (status IN ('running','success','partial','failed')),
  items_fetched  INTEGER NOT NULL DEFAULT 0,
  items_new      INTEGER NOT NULL DEFAULT 0,
  llm_requests   INTEGER NOT NULL DEFAULT 0,
  stats_json     TEXT,
  error          TEXT
);

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_started ON pipeline_runs (started_at DESC);

CREATE TABLE IF NOT EXISTS llm_usage (
  usage_date  TEXT    NOT NULL,                            -- 'YYYY-MM-DD' (UTC hoặc giờ VN, chọn một và giữ nhất quán)
  provider    TEXT    NOT NULL,
  model       TEXT    NOT NULL,
  requests    INTEGER NOT NULL DEFAULT 0,
  tokens_in   INTEGER NOT NULL DEFAULT 0,
  tokens_out  INTEGER NOT NULL DEFAULT 0,
  errors      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (usage_date, provider, model)
) WITHOUT ROWID;

-- -----------------------------------------------------------------------------
-- 8. CACHE CHAT — giảm token cho câu hỏi lặp lại
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_cache (
  question_hash  TEXT    NOT NULL,                         -- sha256(câu hỏi chuẩn hóa)
  digest_date    TEXT    NOT NULL,                         -- cache gắn với bản tin của ngày
  question       TEXT    NOT NULL,
  answer         TEXT    NOT NULL,
  model          TEXT,
  hits           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  PRIMARY KEY (question_hash, digest_date)
) WITHOUT ROWID;

-- -----------------------------------------------------------------------------
-- 9. TÌM KIẾM FULL-TEXT (FTS5)
--    rowid của items_fts = items.id
--    remove_diacritics 2 → gõ "tom tat" vẫn tìm được "tóm tắt"
-- -----------------------------------------------------------------------------
CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5 (
  title,
  description,
  summary,
  tags,
  tokenize = 'unicode61 remove_diacritics 2'
);

CREATE TRIGGER IF NOT EXISTS trg_items_ai AFTER INSERT ON items BEGIN
  INSERT INTO items_fts (rowid, title, description, summary, tags)
  VALUES (new.id, new.title, COALESCE(new.description, ''), '', '');
END;

CREATE TRIGGER IF NOT EXISTS trg_items_au AFTER UPDATE OF title, description ON items BEGIN
  UPDATE items_fts
     SET title = new.title,
         description = COALESCE(new.description, '')
   WHERE rowid = new.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_items_ad AFTER DELETE ON items BEGIN
  DELETE FROM items_fts WHERE rowid = old.id;
END;

-- Cập nhật cột summary khi có bản tóm tắt tiếng Việt mới
CREATE TRIGGER IF NOT EXISTS trg_summaries_ai AFTER INSERT ON summaries
WHEN new.lang = 'vi' BEGIN
  UPDATE items_fts
     SET summary = new.purpose || ' ' || new.highlight
   WHERE rowid = new.item_id;
END;

-- Cập nhật cột tags khi gắn / gỡ tag
CREATE TRIGGER IF NOT EXISTS trg_item_tags_ai AFTER INSERT ON item_tags BEGIN
  UPDATE items_fts
     SET tags = COALESCE((SELECT group_concat(t.slug, ' ')
                            FROM item_tags it JOIN tags t ON t.id = it.tag_id
                           WHERE it.item_id = new.item_id), '')
   WHERE rowid = new.item_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_item_tags_ad AFTER DELETE ON item_tags BEGIN
  UPDATE items_fts
     SET tags = COALESCE((SELECT group_concat(t.slug, ' ')
                            FROM item_tags it JOIN tags t ON t.id = it.tag_id
                           WHERE it.item_id = old.item_id), '')
   WHERE rowid = old.item_id;
END;

-- -----------------------------------------------------------------------------
-- 10. VIEWS
-- -----------------------------------------------------------------------------

-- Bản tóm tắt mới nhất cho mỗi (item, lang)
CREATE VIEW IF NOT EXISTS v_latest_summary AS
SELECT s.*
  FROM summaries s
 WHERE s.id = (SELECT s2.id
                 FROM summaries s2
                WHERE s2.item_id = s.item_id
                  AND s2.lang    = s.lang
                ORDER BY s2.created_at DESC, s2.id DESC
                LIMIT 1);

-- Tốc độ tăng sao so với snapshot trước và so với ~7 ngày trước
CREATE VIEW IF NOT EXISTS v_star_velocity AS
SELECT m.item_id,
       m.date,
       m.stars,
       m.stars - (SELECT m1.stars FROM metrics m1
                   WHERE m1.item_id = m.item_id AND m1.date < m.date
                   ORDER BY m1.date DESC LIMIT 1)                      AS delta_prev,
       m.stars - (SELECT m7.stars FROM metrics m7
                   WHERE m7.item_id = m.item_id AND m7.date <= date(m.date, '-7 day')
                   ORDER BY m7.date DESC LIMIT 1)                      AS delta_7d
  FROM metrics m
 WHERE m.stars IS NOT NULL;

-- Dữ liệu để export ra JSON cho web (chỉ bản tin đã publish)
CREATE VIEW IF NOT EXISTS v_digest_feed AS
SELECT d.digest_date,
       di.section,
       di.rank,
       di.score,
       i.id                   AS item_id,
       i.category,
       i.title,
       i.url,
       i.programming_language AS language,
       s.purpose,
       s.highlight,
       s.action,
       s.verdict,
       s.confidence,
       (SELECT group_concat(t.slug, ',')
          FROM item_tags it JOIN tags t ON t.id = it.tag_id
         WHERE it.item_id = i.id)                                      AS tags,
       (SELECT m.stars FROM metrics m
         WHERE m.item_id = i.id AND m.date <= d.digest_date
         ORDER BY m.date DESC LIMIT 1)                                 AS stars
  FROM digests d
  JOIN digest_items di ON di.digest_id = d.id
  JOIN items i         ON i.id = di.item_id
  LEFT JOIN v_latest_summary s ON s.item_id = i.id AND s.lang = 'vi'
 WHERE d.status = 'published';

-- -----------------------------------------------------------------------------
-- 11. DỮ LIỆU MỒI
-- -----------------------------------------------------------------------------
INSERT OR IGNORE INTO sources (key, name, kind, base_url, weight) VALUES
  ('github_search',       'GitHub Search API',       'api',    'https://api.github.com',                 1.0),
  ('github_trending',     'GitHub Trending',         'scrape', 'https://github.com/trending',            0.6),
  ('hackernews',          'Hacker News',             'api',    'https://hacker-news.firebaseio.com',     0.9),
  ('openvsx',             'Open VSX Registry',       'api',    'https://open-vsx.org',                   0.8),
  ('vscode_marketplace',  'VS Code Marketplace',     'scrape', 'https://marketplace.visualstudio.com',   0.6),
  ('hf_papers',           'Hugging Face Papers',     'api',    'https://huggingface.co',                 0.8),
  ('arxiv',               'arXiv',                   'api',    'https://export.arxiv.org',               0.7);

INSERT OR IGNORE INTO tags (slug, label) VALUES
  ('github',           'GitHub'),
  ('extension',        'Extension'),
  ('model',            'Model'),
  ('paper',            'Paper'),
  ('mcp',              'MCP'),
  ('agent',            'Agent'),
  ('coding-assistant', 'Coding Assistant'),
  ('rag',              'RAG'),
  ('local-llm',        'Local LLM'),
  ('testing',          'Testing'),
  ('devtools',         'DevTools'),
  ('security',         'Security'),
  ('data',             'Data'),
  ('infra',            'Infra'),
  ('open-source',      'Open Source');

INSERT OR IGNORE INTO schema_migrations (version, name) VALUES (1, 'initial_schema');

-- =============================================================================
-- GHI CHÚ BẢO TRÌ (chạy bằng pipeline, KHÔNG nằm trong file khởi tạo)
-- =============================================================================
-- 1) Dọn raw_json cũ (60 ngày):
--      UPDATE items SET raw_json = NULL
--       WHERE raw_json IS NOT NULL AND last_seen_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-60 day');
--
-- 2) Dọn metrics của mục chưa từng lên bản tin (30 ngày):
--      DELETE FROM metrics
--       WHERE date < date('now','-30 day')
--         AND item_id NOT IN (SELECT item_id FROM digest_items);
--
-- 3) Dọn cache chat (7 ngày):
--      DELETE FROM chat_cache WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-7 day');
--
-- 4) Dọn log vận hành (180 ngày):
--      DELETE FROM pipeline_runs WHERE started_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-180 day');
--      DELETE FROM llm_usage     WHERE usage_date < date('now','-180 day');
--
-- 5) Mỗi tuần một lần:
--      PRAGMA optimize;
--      PRAGMA wal_checkpoint(TRUNCATE);
--      VACUUM;                          -- chạy xong rồi mới upload DB
--
-- 6) Kiểm tra toàn vẹn trước khi upload:
--      PRAGMA integrity_check;          -- phải trả về 'ok'
--      PRAGMA foreign_key_check;        -- phải rỗng
--
-- 7) Xây lại FTS nếu nghi ngờ lệch dữ liệu:
--      DELETE FROM items_fts;
--      INSERT INTO items_fts (rowid, title, description, summary, tags)
--      SELECT i.id, i.title, COALESCE(i.description,''),
--             COALESCE((SELECT s.purpose || ' ' || s.highlight FROM v_latest_summary s
--                        WHERE s.item_id = i.id AND s.lang = 'vi'), ''),
--             COALESCE((SELECT group_concat(t.slug, ' ') FROM item_tags it
--                        JOIN tags t ON t.id = it.tag_id WHERE it.item_id = i.id), '')
--        FROM items i;
--
-- 8) Ví dụ truy vấn tìm kiếm:
--      SELECT i.id, i.title, bm25(items_fts) AS rank
--        FROM items_fts JOIN items i ON i.id = items_fts.rowid
--       WHERE items_fts MATCH 'mcp OR agent'
--       ORDER BY rank LIMIT 10;
-- =============================================================================
