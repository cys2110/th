ALTER TABLE match_scores
ADD CONSTRAINT unique_match_player_set_no UNIQUE (entry_id, set_no, match_id);