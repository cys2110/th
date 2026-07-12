DROP TABLE IF EXISTS football.confederation;

CREATE TYPE football.competition_type AS ENUM ('league', 'cup', 'playoff', 'super_cup', 'friendly', 'tournament');
CREATE TYPE football.competition_category AS ENUM ('domestic', 'continental', 'international');
CREATE TYPE football.team_type AS ENUM ('club', 'national_team', 'representative_team');
CREATE TYPE football.na_affiliation_type AS ENUM ('birth', 'nationality', 'player_allegiance', 'coach_appointment');
CREATE TYPE football.position_group AS ENUM ('goalkeeper', 'defender', 'midfielder', 'forward');
CREATE TYPE football.coach_role AS ENUM ('manager', 'head_coach', 'caretaker', 'assistant_coach', 'goalkeeping_coach');
CREATE TYPE football.player_team_relationship_type AS ENUM('permanent', 'loan', 'reserve');
CREATE TYPE football.stage_type AS ENUM ('group', 'knockout', 'league');
CREATE TYPE football.match_status AS ENUM ('scheduled', 'full_time', 'cancelled', 'postponed', 'abandoned');
CREATE TYPE football.match_decision AS ENUM ('normal', 'extra_time', 'penalties', 'walkover', 'awarded');
CREATE TYPE football.match_event_type AS ENUM ('goal', 'red_card', 'yellow_card', 'penalty_missed', 'penalty_saved', 'own_goal', 'substitution', 'injury');
CREATE TYPE football.match_event_role AS ENUM ('scorer', 'assist', 'sub_on', 'sub_off', 'carded_player', 'fouled_player', 'committed_by', 'own_goal_scorer', 'penalty_taker', 'penalty_won_by', 'penalty_conceded_by', 'keeper', 'injured_player');
CREATE TYPE football.goal_type AS ENUM ('open_play', 'corner', 'direct_free_kick', 'indirect_free_kick', 'penalty', 'own_goal', 'counter_attack', 'set_piece', 'unknown');
CREATE TYPE football.preferred_foot AS ENUM('left', 'right');

CREATE TABLE football.country (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    continent public.continent_enum NOT NULL,
    alpha_2 TEXT,
    icon TEXT NOT NULL
);

CREATE TABLE football.venue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    city TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    slug TEXT GENERATED ALWAYS AS (lower(name) || ' ' || lower(city)) STORED,

    CONSTRAINT venue_unique UNIQUE (name, city)
);

CREATE INDEX venues_slug_trgm_idx
ON football.venue
USING GIN (slug extensions.gin_trgm_ops);

CREATE TABLE football.position (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    number INTEGER NOT NULL,
    group_name football.position_group NOT NULL
);

CREATE TABLE football.confederation (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    founded INTEGER NOT NULL,
    continent TEXT NOT NULL,
    website TEXT
);

CREATE TABLE football.national_association (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    headquarters TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    confederation_id TEXT NOT NULL REFERENCES football.confederation (id) ON UPDATE CASCADE ON DELETE CASCADE,
    fifa_member BOOLEAN NOT NULL DEFAULT FALSE,
    website TEXT
);

CREATE TABLE football.competition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT,
    type football.competition_type NOT NULL,
    category football.competition_category NOT NULL,
    division_level INTEGER,
    national_association_id UUID REFERENCES football.national_association (id) ON UPDATE CASCADE ON DELETE SET NULL,
    confederation_id TEXT REFERENCES football.confederation (id) ON UPDATE CASCADE ON DELETE SET NULL,
    fifa_governed BOOLEAN NOT NULL DEFAULT FALSE,
    emblem_url TEXT,

    CHECK (
        national_association_id IS NOT NULL
        OR confederation_id IS NOT NULL
        OR fifa_governed = TRUE
    )
);

CREATE TABLE football.season (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES football.competition (id) ON UPDATE CASCADE ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    CHECK (start_date < end_date),

    UNIQUE (competition_id, name)
);

CREATE TABLE football.team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    tla TEXT,
    nicknames TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    colours TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    country_id TEXT REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE SET NULL,
    national_association_id UUID REFERENCES football.national_association (id) ON UPDATE CASCADE ON DELETE SET NULL,
    type football.team_type NOT NULL,
    founded INTEGER,
    home_venue_id UUID REFERENCES football.venue (id) ON UPDATE CASCADE ON DELETE SET NULL,
    logo_url TEXT,
    website TEXT,

    UNIQUE(national_association_id, name)
);

CREATE TABLE football.people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    dob DATE,
    dod DATE,
    nationality_country_id TEXT REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE SET NULL,
    birth_place TEXT,
    birth_country_id TEXT REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE SET NULL,

    CHECK (dod IS NULL OR dob IS NULL OR dob <= dod)
);

CREATE INDEX people_full_name_trgm_idx
ON football.people
USING GIN (full_name extensions.gin_trgm_ops);

CREATE TABLE football.person_na_affiliation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    national_association_id UUID NOT NULL REFERENCES football.national_association (id) ON UPDATE CASCADE ON DELETE CASCADE,
    affiliation_type football.na_affiliation_type NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    notes TEXT,

    CHECK (end_year IS NULL OR start_year IS NULL OR start_year <= end_year)
);

CREATE TABLE football.player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    aka TEXT,
    height_cm INTEGER,
    preferred_foot football.preferred_foot,
    current_position_id TEXT REFERENCES football.position (id) ON UPDATE CASCADE ON DELETE SET NULL,
    current_team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE football.player_team_tenure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    relationship_type football.player_team_relationship_type NOT NULL,
    start_year INTEGER,
    end_year INTEGER,
    start_date DATE,
    end_date DATE,
    parent_team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE SET NULL,

    CHECK (end_year IS NULL OR start_year IS NULL OR start_year <= end_year),
    CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date)
);

CREATE TABLE football.team_season(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE (team_id, season_id)
);

CREATE TABLE football.team_coach_tenure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    title football.coach_role NOT NULL,
    start_date DATE,
    end_date DATE,

    CHECK (end_date IS NULL OR start_date IS NULL OR start_date <= end_date)
);

CREATE TABLE football.squad_player(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    position_id TEXT REFERENCES football.position (id) ON UPDATE CASCADE ON DELETE SET NULL,
    shirt_number INTEGER,
    tenure_id UUID REFERENCES football.player_team_tenure (id) ON UPDATE CASCADE ON DELETE SET NULL,

    CHECK (shirt_number IS NULL OR shirt_number > 0),
    UNIQUE (season_id, team_id, player_id)
);

CREATE TABLE football.round(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    name TEXT NOT NULL,
    round_order INTEGER NOT NULL,
    stage_type football.stage_type NOT NULL,

    UNIQUE (season_id, name),
    UNIQUE (season_id, round_order)
);

CREATE TABLE football.group(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    name TEXT NOT NULL,
    round_id UUID NOT NULL REFERENCES football.round (id) ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE (round_id, name)
);

CREATE TABLE football.group_team(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES football.group (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,

    UNIQUE (group_id, team_id)
);

CREATE TABLE football.match (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    round_id UUID REFERENCES football.round (id) ON UPDATE CASCADE ON DELETE CASCADE,
    group_id UUID REFERENCES football.group (id) ON UPDATE CASCADE ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    venue_id UUID REFERENCES football.venue (id) ON UPDATE CASCADE ON DELETE SET NULL,
    kickoff_time TIMESTAMP WITH TIME ZONE,
    status football.match_status NOT NULL DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,
    home_penalties INTEGER,
    away_penalties INTEGER,
    winning_team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE SET NULL,
    decision football.match_decision NOT NULL DEFAULT 'normal',

    CHECK (home_team_id <> away_team_id),
    CHECK (home_score IS NULL OR home_score >= 0),
    CHECK (away_score IS NULL OR away_score >= 0),
    CHECK (home_penalties IS NULL OR home_penalties >= 0),
    CHECK (away_penalties IS NULL OR away_penalties >= 0),
    CHECK (
    (home_penalties IS NULL AND away_penalties IS NULL)
    OR
    (home_penalties IS NOT NULL AND away_penalties IS NOT NULL)
    )
);

CREATE TABLE football.match_lineup(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    position_id TEXT REFERENCES football.position (id) ON UPDATE CASCADE ON DELETE SET NULL,
    shirt_number INTEGER,
    starter BOOLEAN NOT NULL DEFAULT FALSE,
    captain BOOLEAN NOT NULL DEFAULT FALSE,

    CHECK (shirt_number IS NULL OR shirt_number > 0),
    UNIQUE (match_id, player_id)
);

CREATE UNIQUE INDEX match_lineup_one_captain_per_team
ON football.match_lineup(match_id, team_id)
WHERE captain = TRUE;

CREATE TABLE football.match_event(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    minute INTEGER NOT NULL,
    stoppage_minute INTEGER,
    type football.match_event_type NOT NULL,
    detail TEXT,
    goal_type football.goal_type,

    CHECK (minute >= 0),
    CHECK (stoppage_minute IS NULL OR stoppage_minute >= 0),
    CHECK ((type IN ('goal', 'own_goal') AND goal_type IS NOT NULL) OR (type NOT IN ('goal', 'own_goal') AND goal_type IS NULL))
);

CREATE TABLE football.match_event_player (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_event_id UUID NOT NULL REFERENCES football.match_event(id) ON UPDATE CASCADE ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE CASCADE,
  role football.match_event_role NOT NULL,

  UNIQUE (match_event_id, player_id, role)
);

CREATE TABLE football.match_stats(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    possession INTEGER,
    shots INTEGER,
    shots_on_target INTEGER,
    corners INTEGER,
    fouls INTEGER,
    offsides INTEGER,
    yellow_cards INTEGER,
    red_cards INTEGER,

    UNIQUE (match_id, team_id),
    CHECK (possession IS NULL OR possession BETWEEN 0 AND 100)
);

CREATE TABLE football.team_standing_adjustment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    points_adjustment INTEGER NOT NULL,
    effective_date DATE,
    reason TEXT,
    source TEXT
);

GRANT USAGE ON SCHEMA football TO anon, authenticated;

DO $$
DECLARE
    table_name TEXT;
    football_tables TEXT[] := ARRAY[
        'country',
        'venue',
        'position',
        'confederation',
        'national_association',
        'competition',
        'season',
        'team',
        'people',
        'person_na_affiliation',
        'player',
        'player_team_tenure',
        'team_season',
        'team_coach_tenure',
        'squad_player',
        'round',
        'group',
        'group_team',
        'match',
        'match_lineup',
        'match_event',
        'match_event_player',
        'match_stats',
        'team_standing_adjustment'
    ];
BEGIN
    FOREACH table_name IN ARRAY football_tables LOOP
        EXECUTE FORMAT('GRANT SELECT ON TABLE football.%I TO anon', table_name);
        EXECUTE FORMAT('GRANT ALL PRIVILEGES ON TABLE football.%I TO authenticated', table_name);

        EXECUTE FORMAT('ALTER TABLE football.%I ENABLE ROW LEVEL SECURITY', table_name);
        EXECUTE FORMAT('CREATE POLICY "Anyone can select" ON football.%I FOR SELECT TO public USING (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can insert" ON football.%I FOR INSERT TO authenticated WITH CHECK (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can update" ON football.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', table_name);
        EXECUTE FORMAT('CREATE POLICY "Authenticated can delete" ON football.%I FOR DELETE TO authenticated USING (true)', table_name);
    END LOOP;
END $$;
