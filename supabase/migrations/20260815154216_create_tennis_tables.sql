DROP TABLE IF EXISTS public.users;

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    profile_img TEXT
);

CREATE TABLE tennis.country (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    continent public.continent_enum NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE tennis.venue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    city TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    slug TEXT GENERATED ALWAYS AS (lower(name || ' ' || city)) STORED,

    CONSTRAINT venue_unique UNIQUE (name, city)
);

CREATE INDEX venue_slug_trgm_idx
ON tennis.venue
USING GIN (slug extensions.gin_trgm_ops);

CREATE TABLE tennis.surface (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    environment tennis.environment_enum NOT NULL,
    surface tennis.surface_enum NOT NULL,
    name TEXT GENERATED ALWAYS AS (
        CASE environment
            WHEN 'Indoor' THEN 'Indoor'
            WHEN 'Outdoor' THEN 'Outdoor'
        END
        || ' ' ||
        CASE surface
            WHEN 'Clay' THEN 'Clay'
            WHEN 'Grass' THEN 'Grass'
            WHEN 'Hard' THEN 'Hard'
            WHEN 'Carpet' THEN 'Carpet'
        END
    ) STORED,

    CONSTRAINT surfaces_slug_unique UNIQUE (environment, surface)
);

CREATE INDEX surface_name_idx ON tennis.surface (name);

CREATE TABLE tennis.tournament (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mens_id INTEGER,
    womens_id INTEGER,
    tours tennis.tour_enum[] NOT NULL DEFAULT ARRAY[]::tennis.tour_enum[],
    established INTEGER,
    abolished INTEGER,
    website TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Add constraint. If ATP or ITF-M in tours, then mens_id cannot be null. If WTA or ITF-W in tours, then womens_id cannot be null.
    CHECK (
        NOT ('ATP' = ANY(tours) OR 'ITF-M' = ANY(tours))
        OR mens_id IS NOT NULL
    ),
    CHECK (
        NOT ('WTA' = ANY(tours) OR 'ITF-W' = ANY(tours))
        OR womens_id IS NOT NULL
    ),
    CHECK (abolished IS NULL OR abolished > established)
);

CREATE TABLE tennis.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    dob DATE,
    dod DATE,
    nationality_id TEXT REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE SET NULL,
    birth_place TEXT,
    birth_country_id TEXT REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (dod IS NULL OR dob IS NULL OR dob <= dod)
);

CREATE INDEX people_full_name_trgm_idx
ON tennis.people
USING GIN (full_name extensions.gin_trgm_ops);

CREATE TABLE tennis.player (
    id TEXT PRIMARY KEY NOT NULL,
    person_id UUID NOT NULL REFERENCES tennis.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    bh TEXT CHECK (bh IN ('One', 'Two')),
    height INTEGER,
    hof INTEGER,
    official_link TEXT,
    pm BIGINT,
    retired INTEGER,
    rh TEXT CHECK (rh IN ('Right', 'Left')),
    site_link TEXT,
    tour tennis.tour_enum NOT NULL,
    turned_pro INTEGER,
    image_url TEXT
);

CREATE TABLE tennis.prev_nationality_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    country_id TEXT NOT NULL REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    CONSTRAINT prev_nationality_unique UNIQUE (player_id, country_id, start_date)
);

CREATE TABLE tennis.player_coach_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES tennis.player(id) ON UPDATE CASCADE ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES tennis.people(id) ON UPDATE CASCADE ON DELETE CASCADE,
    years TEXT,
    status TEXT NOT NULL CHECK (status IN ('Current', 'Former')) DEFAULT 'Former',

    CONSTRAINT player_coach_unique UNIQUE (player_id, coach_id)
);

-- Editions table
CREATE TABLE tennis.editions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT,
    currency TEXT,
    draw_link TEXT,
    draw_type tennis.draw_type_enum,
    draw_size INTEGER,
    end_date DATE,
    sponsor_name TEXT,
    start_date DATE,
    tfc BIGINT,
    tournament_id UUID NOT NULL REFERENCES tennis.tournament (id) ON UPDATE CASCADE ON DELETE CASCADE,
    tours tennis.tour_enum[] NOT NULL DEFAULT ARRAY[]::tennis.tour_enum[],
    year INTEGER NOT NULL,
    edition_no INTEGER NOT NULL DEFAULT 0,
    surface_id UUID REFERENCES tennis.surface (id) ON UPDATE CASCADE ON DELETE SET NULL,
    venue_id UUID REFERENCES tennis.venue (id) ON UPDATE CASCADE ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tennis.events (
    id TEXT PRIMARY KEY NOT NULL,
    edition_id UUID REFERENCES tennis.editions(id) ON UPDATE CASCADE ON DELETE CASCADE,
    tour tennis.tour_enum,
    category TEXT,
    currency TEXT,
    d_draw tennis.draw_type_enum,
    d_link TEXT,
    d_draw_size INTEGER,
    end_date DATE,
    level tennis.level_enum,
    pm BIGINT,
    qd_draw tennis.draw_type_enum,
    qd_link TEXT,
    qd_draw_size INTEGER,
    qs_draw tennis.draw_type_enum,
    qs_link TEXT,
    qs_draw_size INTEGER,
    s_draw tennis.draw_type_enum,
    s_link TEXT,
    s_draw_size INTEGER,
    site_link TEXT,
    sponsor_name TEXT,
    start_date DATE,
    tfc BIGINT,
    undefeated_bonus DECIMAL(10, 2),
    surface_id UUID REFERENCES tennis.surface (id) ON UPDATE CASCADE ON DELETE SET NULL,
    venue_id UUID REFERENCES tennis.venue (id) ON UPDATE CASCADE ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Event supervisor mapping
CREATE TABLE tennis.event_supervisor_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES tennis.people (id) ON UPDATE CASCADE ON DELETE CASCADE,

    CONSTRAINT event_supervisor_unique UNIQUE (event_id, supervisor_id)
);

-- Entry table
CREATE TABLE tennis.entries (
    id TEXT PRIMARY KEY NOT NULL,
    points INTEGER,
    pm NUMERIC,
    match_type tennis.match_type_enum,
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    country_id TEXT REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_name TEXT CHECK (team_name IN ('Europe', 'World')),
    captain TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    vc TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Player entry mapping
CREATE TABLE tennis.player_entry_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    country_id TEXT REFERENCES tennis.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    rank INTEGER,
    doubles_rank INTEGER,

    CONSTRAINT player_entry_unique UNIQUE (player_id, entry_id)
);

-- Seed mapping
CREATE TABLE tennis.seeds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    seed INTEGER NOT NULL,
    draw tennis.draw_enum NOT NULL,
    match_type tennis.match_type_enum,
    rank INTEGER,

    CONSTRAINT seeds_unique UNIQUE (event_id, entry_id)
);

-- Lda mapping
CREATE TABLE tennis.ldas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    rank INTEGER,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT ldas_unique UNIQUE (event_id, entry_id)
);

-- Withdrawals mapping
CREATE TABLE tennis.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT withdrawals_unique UNIQUE (event_id, entry_id, draw)
);

-- Retirement mapping
CREATE TABLE tennis.retirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT retirements_unique UNIQUE (event_id, entry_id, draw)
);

-- Walkover mapping
CREATE TABLE tennis.walkovers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT walkovers_unique UNIQUE (event_id, entry_id, draw)
);

-- Defaults mapping
CREATE TABLE tennis.defaults (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    reason TEXT,
    player_id TEXT REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT defaults_unique UNIQUE (event_id, entry_id, draw)
);

-- Statuses mapping
CREATE TABLE tennis.entry_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    status tennis.status_enum NOT NULL,
    draw tennis.draw_enum NOT NULL,

    CONSTRAINT entry_status_unique UNIQUE (event_id, entry_id, status)
);

-- tennis.rounds table
CREATE TABLE tennis.rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    number INTEGER NOT NULL,
    round TEXT NOT NULL,
    points INTEGER,
    pm DECIMAL(10, 2),
    tour tennis.tour_enum,
    match_type tennis.match_type_enum,
    draw tennis.draw_enum NOT NULL,
    event_id TEXT NOT NULL REFERENCES tennis.events (id) ON UPDATE CASCADE ON DELETE CASCADE,
    pm_tiered DECIMAL(10, 2)[],

    CONSTRAINT rounds_unique UNIQUE (event_id, match_type, round)
);

-- Ties table
CREATE TABLE tennis.ties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tie_number INTEGER NOT NULL,
    round_id UUID NOT NULL REFERENCES tennis.rounds (id) ON UPDATE CASCADE ON DELETE CASCADE,
    country_1_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    country_2_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    winner_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    loser_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    date DATE,
    surface_id UUID REFERENCES tennis.surface (id) ON UPDATE CASCADE ON DELETE CASCADE,
    venue_id UUID REFERENCES tennis.venue (id) ON UPDATE CASCADE ON DELETE CASCADE,
    group_name TEXT,

    CONSTRAINT ties_unique UNIQUE (round_id, country_1_id, country_2_id)
);

-- tennis.matches table
CREATE TABLE tennis.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_no INTEGER NOT NULL,
    court TEXT,
    date DATE,
    tour tennis.tour_enum,
    match_type tennis.match_type_enum NOT NULL,
    draw tennis.draw_enum NOT NULL,
    format INTEGER NOT NULL DEFAULT 3 CHECK (format IN (3, 5)),
    incomplete tennis.incomplete_enum,
    duration INTERVAL,
    round_id UUID NOT NULL REFERENCES tennis.rounds (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_1_id TEXT REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_2_id TEXT REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    winner_id TEXT REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    loser_id TEXT REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    umpire_id UUID REFERENCES tennis.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    tie_id UUID REFERENCES tennis.ties (id) ON UPDATE CASCADE ON DELETE CASCADE,
    group_name TEXT DEFAULT NULL,

    CONSTRAINT matches_unique UNIQUE (round_id, match_no)
);

-- Match stats table
CREATE TABLE tennis.match_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES tennis.matches (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
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
    max_speed INTEGER,

    CONSTRAINT match_stats_unique UNIQUE (match_id, entry_id)
);

CREATE TABLE tennis.match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES tennis.matches (id) ON UPDATE CASCADE ON DELETE CASCADE,
    entry_id TEXT NOT NULL REFERENCES tennis.entries (id) ON UPDATE CASCADE ON DELETE CASCADE,
    set_no INTEGER CHECK (set_no IN (1, 2, 3, 4, 5)),
    set INTEGER,
    tb INTEGER,

    CONSTRAINT match_scores_unique UNIQUE (match_id, entry_id, set_no)
);

GRANT USAGE ON SCHEMA tennis TO anon, authenticated;

DO $$
DECLARE
    table_name TEXT;
    tennis_tables TEXT[] := ARRAY[
        'country',
        'venue',
        'surface',
        'tournament',
        'player',
        'people',
        'prev_nationality_mapping',
        'player_coach_mapping',
        'editions',
        'events',
        'event_supervisor_mapping',
        'entries',
        'player_entry_mapping',
        'seeds',
        'ldas',
        'withdrawals',
        'retirements',
        'walkovers',
        'defaults',
        'entry_status',
        'rounds',
        'ties',
        'matches',
        'match_stats',
        'match_scores'
    ];
BEGIN
    FOREACH table_name IN ARRAY tennis_tables LOOP
        EXECUTE FORMAT('GRANT SELECT ON TABLE tennis.%I TO anon', table_name);
        EXECUTE FORMAT('GRANT ALL PRIVILEGES ON TABLE tennis.%I TO authenticated', table_name);

        EXECUTE FORMAT('ALTER TABLE tennis.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE FORMAT('CREATE POLICY "Anyone can select" ON tennis.%I FOR SELECT TO anon, authenticated USING (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can insert" ON tennis.%I FOR INSERT TO authenticated WITH CHECK (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can update" ON tennis.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can delete" ON tennis.%I FOR DELETE TO authenticated USING (true)', table_name);
    END LOOP;
END $$;

GRANT SELECT ON TABLE public.users TO anon, authenticated;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);
