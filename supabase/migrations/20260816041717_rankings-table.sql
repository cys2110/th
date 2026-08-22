DROP TABLE IF EXISTS tennis.rankings;

CREATE TABLE tennis.rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id TEXT NOT NULL REFERENCES tennis.player (id) ON UPDATE CASCADE ON DELETE CASCADE,
    rank INTEGER NOT NULL,
    match_type tennis.match_type_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    UNIQUE (player_id, start_date),
    CHECK (rank > 0),
    CHECK (end_date > start_date)
);

CREATE INDEX rankings_player_id_idx ON tennis.rankings (player_id);
CREATE INDEX rankings_rank_idx ON tennis.rankings (rank);

DO $$
DECLARE
    table_name TEXT;
    tennis_tables TEXT[] := ARRAY[
        'rankings'
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