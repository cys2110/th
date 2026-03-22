ALTER TABLE match_stats
ADD CONSTRAINT unique_match_stats UNIQUE (match_id, entry_id);