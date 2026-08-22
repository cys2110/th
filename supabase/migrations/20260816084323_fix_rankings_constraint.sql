ALTER TABLE tennis.rankings
DROP CONSTRAINT rankings_player_id_start_date_key,
ADD CONSTRAINT unique_player_match_type_start_date
UNIQUE (player_id, match_type, start_date);
