ALTER TABLE player_coach_mapping
ADD CONSTRAINT unique_player_coach_mapping UNIQUE (player_id, coach_id);
