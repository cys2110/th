ALTER TABLE entries
DROP COLUMN status;

CREATE TABLE entry_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    status status_enum,
    draw draw_enum
);