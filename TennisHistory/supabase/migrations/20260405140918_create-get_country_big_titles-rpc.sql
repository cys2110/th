DROP FUNCTION IF EXISTS get_country_big_titles(country_id TEXT, categories TEXT[]);
CREATE OR REPLACE FUNCTION get_country_big_titles(country_id TEXT, categories TEXT[])
RETURNS TABLE (
    id TEXT,
    first_name TEXT,
    last_name TEXT,
    tour tour_enum,
    country JSONB,
    year INTEGER,
    edition_id INTEGER,
    category TEXT,
    tournament JSONB,
    match_type match_type_enum
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.tour,
        row_to_json(c)::jsonb AS country,
        ed.year,
        ed.id AS edition_id,
        COALESCE(ed.category, e.category) AS category,
        jsonb_build_object(
            'id', t.id,
            'name', t.name
        ) AS tournament,
        r.match_type
    FROM players p
    JOIN player_entry_mapping pem ON p.id = pem.player_id
    JOIN countries c ON c.id = pem.country_id
    JOIN entries en ON en.id = pem.entry_id
    JOIN matches m ON m.winner_id = en.id
    JOIN rounds r ON r.id = m.round_id
    JOIN events e ON e.id = r.event_id
    JOIN editions ed ON ed.id = e.edition_id
    JOIN tournaments t ON t.id = ed.tournament_id
    WHERE pem.country_id = get_country_big_titles.country_id
        AND r.round = 'Final'
        AND (e.category = ANY(get_country_big_titles.categories) OR ed.category = ANY(get_country_big_titles.categories));
END;
$$;
