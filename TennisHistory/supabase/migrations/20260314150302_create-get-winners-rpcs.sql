CREATE OR REPLACE FUNCTION get_elimination_winners(tournament_id INTEGER)
RETURNS TABLE (
    year INTEGER,
    id INTEGER,
    tour tour_enum,
    match_type match_type_enum,
    team jsonb
)
LANGUAGE sql
AS $$
    SELECT
    -- edition data
    ed.year,
    ed.id,

    -- event data
    e.tour,

    -- round data
    r.match_type,

    -- player data
    json_arrayagg(json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'country', json_build_object('id', c.id, 'name', c.name, 'continent', c.continent, 'alpha_2', c.alpha_2))) AS team

    FROM editions ed
    JOIN events e ON ed.id = e.edition_id
    JOIN rounds r ON e.id = r.event_id
    JOIN matches m ON r.id = m.round_id
    JOIN player_entry_mapping pem ON pem.entry_id = m.winner_id
    JOIN countries c ON c.id = pem.country_id
    JOIN players p ON p.id = pem.player_id
    WHERE ed.tournament_id = get_elimination_winners.tournament_id
    AND r.round = 'Final'
    GROUP BY ed.year, ed.id, e.tour, r.match_type;
$$;

CREATE OR REPLACE FUNCTION get_country_winners(tournament_id INTEGER)
RETURNS TABLE (
    year INTEGER,
    id INTEGER,
    country jsonb
)
LANGUAGE sql
AS $$
    SELECT
    -- edition data
    ed.year,
    ed.id,

    json_build_object('id', c.id, 'name', c.name, 'alpha_2', c.alpha_2, 'continent', c.continent) AS country

    FROM editions ed
    JOIN events e ON ed.id = e.edition_id
    JOIN rounds r ON e.id = r.event_id
    JOIN ties t on r.id = t.round_id
    JOIN entries te ON te.id = t.winner_id
    JOIN countries c ON c.id = te.country_id
    WHERE ed.tournament_id = get_country_winners.tournament_id
    AND r.round = 'Final';
$$;