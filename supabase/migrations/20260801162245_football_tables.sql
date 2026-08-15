CREATE TABLE football.country (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    continent public.continent_enum NOT NULL,
    icon TEXT NOT NULL
);

CREATE TABLE football.venue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    city TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    slug TEXT GENERATED ALWAYS AS (lower(name || ' ' || city)) STORED,

    CONSTRAINT venue_unique UNIQUE (name, city)
);

CREATE INDEX venues_slug_trgm_idx
ON football.venue
USING GIN (slug extensions.gin_trgm_ops);

CREATE TABLE football.confederation (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    founded INTEGER NOT NULL,
    continent TEXT NOT NULL,
    logo_url TEXT,
    website TEXT
);

CREATE TABLE football.federation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    founded INTEGER,
    headquarters TEXT NOT NULL,
    country_id TEXT NOT NULL REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE CASCADE,
    confederation_id TEXT NOT NULL REFERENCES football.confederation (id) ON UPDATE CASCADE ON DELETE CASCADE,
    fifa_member BOOLEAN NOT NULL DEFAULT FALSE,
    logo_url TEXT,
    website TEXT
);

CREATE TABLE football.competition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    type football.competition_type NOT NULL,
    category football.competition_category NOT NULL,
    division_level INTEGER,
    federation_id UUID REFERENCES football.federation (id) ON UPDATE CASCADE ON DELETE SET NULL,
    confederation_id TEXT REFERENCES football.confederation (id) ON UPDATE CASCADE ON DELETE SET NULL,
    fifa_governed BOOLEAN NOT NULL DEFAULT FALSE,
    emblem_url TEXT,
    promotion_id UUID REFERENCES football.competition(id) ON UPDATE CASCADE ON DELETE SET NULL,
    relegation_id UUID REFERENCES football.competition(id) ON UPDATE CASCADE ON DELETE SET NULL,

    CHECK (
        federation_id IS NOT NULL
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
    win_points INTEGER NOT NULL DEFAULT 3,
    draw_points INTEGER NOT NULL DEFAULT 1,
    loss_points INTEGER NOT NULL DEFAULT 0,

    CHECK (start_date < end_date),

    UNIQUE (competition_id, name)
);

CREATE TABLE football.team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_name TEXT,
    code TEXT UNIQUE NOT NULL,
    nicknames TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    colours TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    country_id TEXT REFERENCES football.country (id) ON UPDATE CASCADE ON DELETE SET NULL,
    type football.team_type NOT NULL,
    founded INTEGER,
    home_venue_id UUID REFERENCES football.venue (id) ON UPDATE CASCADE ON DELETE SET NULL,
    logo_url TEXT,
    website TEXT
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

CREATE TABLE football.player (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL UNIQUE REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    aka TEXT,
    height_cm INTEGER,
    preferred_foot football.preferred_foot,
    position football.position_group,
    current_team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE football.player_team_tenure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    relationship_type football.player_team_relationship_type NOT NULL,
    start_date DATE,
    end_date DATE,
    parent_team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE SET NULL,

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

CREATE TABLE football.team_captain (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    captain_type TEXT
);

CREATE TABLE football.squad_player(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    position football.position_group,
    shirt_number INTEGER,

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
    match_no INTEGER NOT NULL,
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
    position TEXT,
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
    goal_execution football.goal_execution,
    goal_situation football.goal_situation,

    CHECK (minute >= 0),
    CHECK (stoppage_minute IS NULL OR stoppage_minute >= 0),
    CONSTRAINT match_event_goal_details_check
    CHECK (
    (
        type = 'goal'
        AND goal_execution IS NOT NULL
        AND goal_situation IS NOT NULL
    )
    OR
    (
        type <> 'goal'
        AND goal_execution IS NULL
        AND goal_situation IS NULL
    )
    )
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
    possession NUMERIC(5, 2),
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

CREATE TABLE football.match_referee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    person_id UUID NOT NULL REFERENCES football.people (id) ON UPDATE CASCADE ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    type football.referee_type NOT NULL,

    UNIQUE (person_id, match_id)
);

CREATE TABLE football.standing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    group_id UUID REFERENCES football.group (id) ON UPDATE CASCADE ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    goals_for INTEGER NOT NULL DEFAULT 0,
    goals_against INTEGER NOT NULL DEFAULT 0,
    goal_difference INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,

    UNIQUE NULLS NOT DISTINCT (season_id, team_id, group_id)
);

CREATE TABLE football.team_standing_adjustment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES football.season (id) ON UPDATE CASCADE ON DELETE CASCADE,
    standing_id UUID REFERENCES football.standing (id) ON UPDATE CASCADE ON DELETE CASCADE,
    points_adjustment INTEGER NOT NULL,
    effective_date DATE,
    reason TEXT,
    source TEXT
);

CREATE TABLE football.penalty_shootout_attempt (
    ID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL REFERENCES football.match(id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES football.team(id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE SET NULL,
    goalkeeper_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE SET NULL,
    attempt_number integer NOT NULL,
    team_attempt_number integer
    GENERATED ALWAYS AS ((attempt_number + 1) / 2) STORED,
    outcome text NOT NULL CHECK (outcome in ('scored', 'saved', 'missed', 'post', 'crossbar')),
    is_sudden_death boolean NOT NULL DEFAULT FALSE,

    CHECK (attempt_number > 0)
);

CREATE TABLE football.season_award (
    ID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id uuid NOT NULL REFERENCES football.season(id) ON UPDATE CASCADE ON DELETE CASCADE,
    award_type text NOT NULL,
    player_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id uuid REFERENCES football.team(id) ON UPDATE CASCADE ON DELETE CASCADE,
    is_shared boolean NOT NULL DEFAULT FALSE,
    award_level INTEGER,

    constraint season_award_has_recipient check (
        num_nonnulls(player_id, team_id) = 1
    )
);

CREATE TABLE football.team_award (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    award_level INTEGER,

    UNIQUE (team_id, player_id, award_type)
);

CREATE TABLE football.match_award (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES football.match (id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id UUID REFERENCES football.team (id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id UUID REFERENCES football.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    award_type TEXT NOT NULL,
    is_shared BOOLEAN NOT NULL DEFAULT FALSE,
    award_level INTEGER,

    constraint match_award_has_recipient check (
        num_nonnulls(player_id, team_id) = 1
    )
);

GRANT USAGE ON SCHEMA football TO anon, authenticated;

DO $$
DECLARE
    table_name TEXT;
    football_tables TEXT[] := ARRAY[
        'country',
        'venue',
        'confederation',
        'federation',
        'competition',
        'season',
        'team',
        'people',
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
        'team_standing_adjustment',
        'match_referee',
        'match_award',
        'standing',
        'penalty_shootout_attempt',
        'season_award',
        'team_award',
        'team_captain'
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
