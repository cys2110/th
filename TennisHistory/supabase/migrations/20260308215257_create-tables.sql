-- Countries table
CREATE TABLE countries (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    continent continent_enum NOT NULL,
    alpha_2 TEXT
);

-- Venues table
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    city TEXT NOT NULL,
    country_id TEXT REFERENCES countries (id) ON DELETE CASCADE
);

-- Add unique constraint
ALTER TABLE venues ADD CONSTRAINT venues_unique UNIQUE (name, city);

-- Surfaces table
CREATE TABLE surfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment environment_enum NOT NULL,
    surface surface_enum NOT NULL
);

-- Add unique constraint
ALTER TABLE surfaces ADD CONSTRAINT surfaces_slug_unique UNIQUE (environment, surface);

-- Tournaments table
CREATE TABLE tournaments (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    website TEXT,
    tours tour_enum[],
    established INTEGER,
    abolished INTEGER,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
    id TEXT PRIMARY KEY NOT NULL,
    bh TEXT CHECK (bh IN ('One', 'Two')),
    ch_doubles INTEGER,
    ch_doubles_date DATE,
    ch_singles INTEGER,
    ch_singles_date DATE,
    current_doubles INTEGER,
    current_singles INTEGER,
    dob DATE,
    dod DATE,
    first_name TEXT,
    height INTEGER,
    hof INTEGER,
    last_name TEXT,
    official_link TEXT,
    pm BIGINT,
    retired INTEGER,
    rh TEXT CHECK (rh IN ('Right', 'Left')),
    site_link TEXT,
    tour tour_enum,
    turned_pro INTEGER,
    wiki_link TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- People table
CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT,
    last_name TEXT,
    player_id TEXT REFERENCES players (id) ON DELETE SET NULL
);

-- Add unique constraint
ALTER TABLE people ADD CONSTRAINT people_slug_unique UNIQUE (first_name, last_name);

-- Player country mapping
CREATE TABLE player_country_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    country_id TEXT REFERENCES countries (id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE
);

-- Player coach mapping
CREATE TABLE player_coach_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    coach_id UUID REFERENCES people (id) ON DELETE CASCADE,
    years TEXT,
    status TEXT CHECK (status IN ('Current', 'Former'))
);

-- Editions table
CREATE TABLE editions (
    id INTEGER PRIMARY KEY NOT NULL,
    category TEXT,
    currency currency_enum,
    draw_link TEXT,
    draw_type draws_enum,
    end_date DATE,
    sponsor_name TEXT,
    start_date DATE,
    tfc BIGINT,
    tournament_id INTEGER REFERENCES tournaments (id) ON DELETE CASCADE,
    tours tour_enum[],
    wiki_link TEXT,
    year INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE events (
    id TEXT PRIMARY KEY NOT NULL,
    category TEXT,
    currency currency_enum,
    d_draw draws_enum,
    d_link TEXT,
    end_date DATE,
    level level_enum,
    pm BIGINT,
    qd_draw draws_enum,
    qd_link TEXT,
    qs_draw draws_enum,
    qs_link TEXT,
    s_draw draws_enum,
    s_link TEXT,
    site_link TEXT,
    sponsor_name TEXT,
    start_date DATE,
    tfc BIGINT,
    tour tour_enum,
    wiki_link TEXT,
    edition_id INTEGER REFERENCES editions (id) ON DELETE CASCADE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event surface mapping
CREATE TABLE event_surface_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES events (id) ON DELETE CASCADE,
    surface_id UUID REFERENCES surfaces (id) ON DELETE CASCADE
);

-- Event venue mapping
CREATE TABLE event_venue_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES events (id) ON DELETE CASCADE,
    venue_id UUID REFERENCES venues (id) ON DELETE CASCADE
);

-- Event supervisor mapping
CREATE TABLE event_supervisor_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT REFERENCES events (id) ON DELETE CASCADE,
    supervisor_id UUID REFERENCES people (id) ON DELETE CASCADE
);

-- Entry table
CREATE TABLE entries (
    id TEXT PRIMARY KEY NOT NULL,
    points INTEGER,
    pm NUMERIC,
    match_type match_type_enum,
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    country_id TEXT REFERENCES countries (id) ON DELETE CASCADE,
    team_name TEXT CHECK (team_name IN ('Europe', 'World')),
    seed INTEGER
);

-- Entry player mapping
CREATE TABLE player_entry_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES players (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    country_id TEXT REFERENCES countries (id) ON DELETE CASCADE,
    rank INTEGER
);

-- Trigger to set country_id
CREATE OR REPLACE FUNCTION set_entry_country_id()
RETURNS TRIGGER AS $$
BEGIN
    SELECT pcm.country_id
    INTO NEW.country_id
    FROM player_country_mapping pcm
    CROSS JOIN LATERAL (
        SELECT COALESCE(ev.start_date, ed.start_date) AS start_date
        FROM entries en
        JOIN events ev
            ON ev.id = en.event_id
        LEFT JOIN editions ed
            ON ed.id = ev.edition_id
        WHERE en.id = NEW.entry_id
    ) d
    WHERE pcm.player_id = NEW.player_id
      AND (
            (
                pcm.start_date <= d.start_date
                AND pcm.end_date > d.start_date
            )
            OR pcm.end_date IS NULL
          )
    ORDER BY pcm.start_date DESC
    LIMIT 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_entry_country_id_trigger
BEFORE INSERT ON player_entry_mapping
FOR EACH ROW
EXECUTE FUNCTION set_entry_country_id();

-- Seed mapping
CREATE TABLE seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    seed INTEGER,
    draw draw_enum,
    match_type match_type_enum,
    rank INTEGER
);

ALTER TABLE seeds
ADD CONSTRAINT seeds_unique UNIQUE (event_id, entry_id);

-- Lda mapping
CREATE TABLE ldas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    rank INTEGER,
    draw draw_enum
);

ALTER TABLE ldas
ADD CONSTRAINT ldas_unique UNIQUE (event_id, entry_id);

-- Withdrawals mapping
CREATE TABLE withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    draw draw_enum
);

-- Retirement mapping
CREATE TABLE retirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    draw draw_enum
);

-- Walkover mapping
CREATE TABLE walkovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES players (id) ON DELETE CASCADE,
    draw draw_enum
);

-- Wild card mapping
CREATE TABLE wildcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    draw draw_enum
);

-- Qualifiers mapping
CREATE TABLE qualifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE
);

-- Alternates mapping
CREATE TABLE alternates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    draw draw_enum
);

-- Lucky losers mapping
CREATE TABLE lucky_losers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE
);

-- Rounds table
CREATE TABLE rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    round round_enum,
    points INTEGER,
    pm BIGINT,
    tour tour_enum,
    match_type match_type_enum,
    draw draw_enum,
    event_id TEXT NOT NULL REFERENCES events (id) ON DELETE CASCADE,
    group_name TEXT
);

-- Ties table
CREATE TABLE ties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rounds (id) ON DELETE CASCADE,
    winner_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    loser_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    date DATE,
    venue_id UUID REFERENCES venues (id) ON DELETE CASCADE
);

-- Matches table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_no INTEGER NOT NULL,
    court TEXT,
    date DATE,
    tour tour_enum,
    match_type match_type_enum,
    draw draw_enum,
    format INTEGER DEFAULT 3 CHECK (format IN (3, 5)),
    incomplete incomplete_enum,
    duration INTERVAL,
    round_id UUID NOT NULL REFERENCES rounds (id) ON DELETE CASCADE,
    team_1_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    team_2_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    winner_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    loser_id TEXT REFERENCES entries (id) ON DELETE CASCADE,
    umpire_id UUID REFERENCES people (id) ON DELETE CASCADE,
    tie_id UUID REFERENCES ties (id) ON DELETE CASCADE
);

-- Match stats table
CREATE TABLE match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    serve1_w INTEGER,
    serve1 INTEGER,
    serve2_w INTEGER,
    serve2 INTEGER,
    ret1_w INTEGER,
    ret1 INTEGER,
    ret2_w INTEGER,
    ret2 INTEGER,
    winners INTEGER,
    ues INTEGER,
    bps_converted INTEGER,
    bp_opps INTEGER,
    bps_saved INTEGER,
    bps_faced INTEGER,
    net_w INTEGER,
    net INTEGER,
    aces INTEGER,
    dfs INTEGER,
    serve_games INTEGER,
    return_games INTEGER,
    avg1_speed INTEGER,
    avg2_speed INTEGER,
    max_speed INTEGER
);

CREATE TABLE match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES matches (id) ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES entries (id) ON DELETE CASCADE,
    set_no INTEGER CHECK (set_no IN (1, 2, 3, 4, 5)),
    set INTEGER,
    tb INTEGER
);

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tournament_updated_at
BEFORE UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_player_updated_at
BEFORE UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_edition_updated_at
BEFORE UPDATE ON editions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trigger_event_updated_at
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();
