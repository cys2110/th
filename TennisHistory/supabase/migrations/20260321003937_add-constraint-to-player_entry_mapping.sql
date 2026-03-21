ALTER TABLE player_entry_mapping
ADD CONSTRAINT unique_player_entry_mapping UNIQUE (player_id, entry_id);