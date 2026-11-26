DELETE FROM sources
 WHERE key IN ('reddit', 'x_twitter')
   AND NOT EXISTS (
     SELECT 1 FROM items WHERE items.source_id = sources.id
   );
