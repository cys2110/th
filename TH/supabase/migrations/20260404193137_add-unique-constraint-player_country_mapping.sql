ALTER TABLE player_country_mapping
ADD CONSTRAINT unique_player_country_mapping UNIQUE (player_id, country_id, start_date);
