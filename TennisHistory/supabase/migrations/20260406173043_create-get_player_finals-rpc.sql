CREATE OR REPLACE FUNCTION get_player_finals(player_id TEXT)
RETURNS TABLE (
    tournament JSONB,
    id INTEGER,
    year INTEGER,
    level level_enum,
    end_date DATE,
    category TEXT,
    surfaces TEXT[],
    title BOOLEAN,
    match_type match_type_enum,
    partner JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    SELECT
        json_build_object('id', t.id, 'name', t.name)::JSONB AS tournament,
        ed.id::INTEGER,
        ed.year::INTEGER,
        ev.level,
        COALESCE(ed.end_date, ev.end_date) AS end_date,
        COALESCE(ed.category, ev.category) As category,
        surface_data.surfaces,
        CASE WHEN m.winner_id = e.id THEN TRUE ELSE FALSE END AS title,
        m.match_type,
        CASE WHEN m.match_type = 'Doubles' THEN json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'country', row_to_json(c))::JSONB ELSE NULL END AS partner

        FROM tournaments t
        JOIN editions ed ON ed.tournament_id = t.id
        JOIN events ev ON ev.edition_id = ed.id
        JOIN rounds r ON r.event_id = ev.id
        JOIN matches m ON m.round_id = r.id
        JOIN entries e ON e.id = m.winner_id OR e.id = m.loser_id

        JOIN player_entry_mapping pem
        ON pem.entry_id = e.id

        LEFT JOIN player_entry_mapping partner_pem
            ON partner_pem.entry_id = e.id
            AND partner_pem.player_id <> pem.player_id

        LEFT JOIN players p ON p.id = partner_pem.player_id
        LEFT JOIN player_country_mapping pcm ON pcm.player_id = p.id
        LEFT JOIN countries c ON c.id = partner_pem.country_id

        LEFT JOIN LATERAL (
            SELECT array_agg(DISTINCT (s.environment || ' ' || s.surface)) AS surfaces
            FROM event_surface_mapping esm
            JOIN surfaces s ON s.id = esm.surface_id
            WHERE esm.event_id = ev.id
        ) surface_data ON TRUE

        WHERE pem.player_id = get_player_finals.player_id
        AND r.round = 'Final'
        ORDER BY end_date DESC;
END;
$$;
