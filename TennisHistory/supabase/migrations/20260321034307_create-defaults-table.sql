CREATE TABLE defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    draw draw_enum
)