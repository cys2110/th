CREATE TABLE football.penalty_shootout_attempts (
    ID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id uuid NOT NULL REFERENCES football.match(id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id uuid NOT NULL REFERENCES football.team(id) ON UPDATE CASCADE ON DELETE CASCADE,
    player_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE SET NULL,
    goalkeeper_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE SET NULL,
    attempt_number integer NOT NULL,
    team_attempt_number integer NOT NULL,
    outcome text NOT NULL CHECK (outcome in ('scored', 'saved', 'missed', 'post', 'crossbar')),
    is_sudden_death boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE football.season_awards (
    ID uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    season_id uuid NOT NULL REFERENCES football.season(id) ON UPDATE CASCADE ON DELETE CASCADE,
    award_type text NOT NULL,
    player_id uuid REFERENCES football.player(id) ON UPDATE CASCADE ON DELETE CASCADE,
    team_id uuid REFERENCES football.team(id) ON UPDATE CASCADE ON DELETE CASCADE,
    is_shared boolean NOT NULL DEFAULT FALSE,

    constraint tournament_award_has_recipient check (
        num_nonnulls(player_id, team_id) = 1
    )
);

DO $$
DECLARE
    table_name TEXT;
    football_tables TEXT[] := ARRAY[
        'penalty_shootout_attempts',
        'season_awards'
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