ALTER TABLE people
ADD COLUMN full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

ALTER TABLE players
ADD COLUMN full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

CREATE INDEX people_full_name_trgm_idx
ON people
USING GIN (full_name extensions.gin_trgm_ops);

CREATE INDEX players_full_name_trgm_idx
ON players
USING GIN (full_name extensions.gin_trgm_ops);