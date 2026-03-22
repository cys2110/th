ALTER TABLE rounds
ADD CONSTRAINT unique_rounds UNIQUE (event_id, round, match_type);