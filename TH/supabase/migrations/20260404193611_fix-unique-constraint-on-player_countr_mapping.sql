ALTER TABLE player_country_mapping
DROP CONSTRAINT IF EXISTS unique_player_country_mapping;
CREATE UNIQUE INDEX unique_player_country_null_start
ON player_country_mapping (player_id, country_id)
WHERE start_date IS NULL;
