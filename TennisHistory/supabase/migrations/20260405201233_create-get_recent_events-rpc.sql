CREATE OR REPLACE FUNCTION get_recent_events(player_id TEXT)
RETURNS TABLE (
    tournament_id INTEGER,
    tournament_name TEXT,
    edition_id INTEGER,
    year INTEGER,
    level level_enum,
    category TEXT,
    start_date DATE,
    surfaces TEXT[],
    round TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    WITH ranked_events AS (
        SELECT
            t.id::INTEGER AS tournament_id,
            t.name AS tournament_name,
            ed.year,
            ed.id::INTEGER AS edition_id,
            ev.level,
            COALESCE(ed.category, ev.category) AS category,
            COALESCE(ed.start_date, ev.start_date) AS start_date,
            surface_data.surfaces,
            CASE WHEN r.round = 'Final' AND m.winner_id = e.id THEN 'Win' ELSE r.round END::TEXT AS round,
            ev.id AS event_id,
            ROW_NUMBER() OVER (
                PARTITION BY ev.id
                ORDER BY r.round ASC
            ) AS rn
        FROM events ev
        JOIN editions ed ON ed.id = ev.edition_id
        JOIN tournaments t ON t.id = ed.tournament_id
        JOIN rounds r ON r.event_id = ev.id
        JOIN matches m ON m.round_id = r.id
        JOIN entries e ON e.id = m.team_1_id OR e.id = m.team_2_id
        JOIN player_entry_mapping pem ON pem.entry_id = e.id
        JOIN players p ON p.id = pem.player_id
        LEFT JOIN LATERAL (
            SELECT array_agg(DISTINCT (s.environment || ' ' || s.surface)) AS surfaces
            FROM event_surface_mapping esm
            JOIN surfaces s ON s.id = esm.surface_id
            WHERE esm.event_id = ev.id
        ) surface_data ON TRUE
        WHERE p.id = get_recent_events.player_id
    )
    SELECT DISTINCT
        re.tournament_id,
        re.tournament_name,
        re.edition_id,
        re.year,
        re.level,
        re.category,
        re.start_date,
        re.surfaces,
        re.round
    FROM ranked_events re
    WHERE re.rn = 1
    ORDER BY start_date DESC
    LIMIT 10;
END;
$$;
