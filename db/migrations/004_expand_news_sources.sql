INSERT OR IGNORE INTO sources (key, name, kind, base_url, weight) VALUES
  ('reddit',           'Reddit AI Communities', 'api', 'https://www.reddit.com',             0.7),
  ('x_twitter',        'X (Twitter)',           'api', 'https://api.twitter.com',            0.7),
  ('semantic_scholar', 'Semantic Scholar',      'api', 'https://api.semanticscholar.org',    0.85),
  ('openalex',         'OpenAlex',              'api', 'https://api.openalex.org',           0.8);
