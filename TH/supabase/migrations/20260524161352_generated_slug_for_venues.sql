ALTER TABLE venues
ADD COLUMN slug TEXT GENERATED ALWAYS AS (lower(name) || ' ' || lower(city)) STORED;

CREATE INDEX venues_slug_trgm_idx
ON venues
USING GIN (slug extensions.gin_trgm_ops);