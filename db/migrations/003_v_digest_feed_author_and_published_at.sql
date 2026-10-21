-- Migration 003: Add author, published_at, and description to v_digest_feed view

DROP VIEW IF EXISTS v_digest_feed;

CREATE VIEW v_digest_feed AS
SELECT d.digest_date,
       di.section,
       di.rank,
       di.score,
       i.id                   AS item_id,
       i.url_hash             AS key,
       i.category,
       i.title,
       i.url,
       i.programming_language AS language,
       COALESCE(s.purpose, i.description) AS purpose,
       s.highlight,
       s.action,
       s.verdict,
       s.confidence,
       (SELECT group_concat(t.slug, ',')
          FROM item_tags it JOIN tags t ON t.id = it.tag_id
         WHERE it.item_id = i.id)                                      AS tags,
       (SELECT m.stars FROM metrics m
         WHERE m.item_id = i.id AND m.date <= d.digest_date
         ORDER BY m.date DESC LIMIT 1)                                 AS stars,
       i.author,
       COALESCE(i.published_at, i.first_seen_at)                      AS published_at,
       i.description
  FROM digests d
  JOIN digest_items di ON di.digest_id = d.id
  JOIN items i         ON i.id = di.item_id
  LEFT JOIN v_latest_summary s ON s.item_id = i.id AND s.lang = 'vi'
 WHERE d.status = 'published';
