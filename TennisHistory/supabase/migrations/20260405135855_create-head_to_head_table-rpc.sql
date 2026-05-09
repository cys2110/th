DROP FUNCTION IF EXISTS get_head_to_head_table(tour_enum);
CREATE OR REPLACE FUNCTION get_head_to_head_table(tour tour_enum)
RETURNS TABLE (
    player_id TEXT,
    player_first_name TEXT,
    player_last_name TEXT,
    player_country JSONB,
    player_rank INTEGER,

    opponent_id TEXT,
    opponent_first_name TEXT,
    opponent_last_name TEXT,
    opponent_country JSONB,
    opponent_rank INTEGER,

    wins INTEGER,
    losses INTEGER
)

LANGUAGE plpgsql
AS $$

BEGIN
RETURN QUERY
    WITH top_players AS (
        SELECT DISTINCT ON (p.id)
            p.id,
            p.first_name,
            p.last_name,
            p.current_singles,
            row_to_json(c)::jsonb AS country
        FROM players p
        LEFT JOIN player_country_mapping pcm ON pcm.player_id = p.id
        LEFT JOIN countries c ON c.id = pcm.country_id
        WHERE p.current_singles <= 10
            AND p.tour = get_head_to_head_table.tour
            AND pcm.end_date IS NULL
        ORDER BY p.id, pcm.country_id
    )
    SELECT
        p1.id AS player_id,
        p1.first_name AS player_first_name,
        p1.last_name AS player_last_name,
        p1.country AS player_country,
        p1.current_singles AS player_rank,

        p2.id AS opponent_id,
        p2.first_name AS opponent_first_name,
        p2.last_name AS opponent_last_name,
        p2.country AS opponent_country,
        p2.current_singles AS opponent_rank,

    (
        SELECT COUNT(*)
        FROM matches m
        JOIN entries we ON we.id = m.winner_id
        JOIN entries le ON le.id = m.loser_id
        JOIN player_entry_mapping wpem ON wpem.entry_id = m.winner_id
        JOIN player_entry_mapping lpem ON lpem.entry_id = m.loser_id
        WHERE wpem.player_id = p1.id
            AND lpem.player_id = p2.id
    )::INTEGER AS wins,

    (
        SELECT COUNT(*)
        FROM matches m
        JOIN entries we ON we.id = m.winner_id
        JOIN entries le ON le.id = m.loser_id
        JOIN player_entry_mapping wpem ON wpem.entry_id = m.winner_id
        JOIN player_entry_mapping lpem ON lpem.entry_id = m.loser_id
        WHERE wpem.player_id = p2.id
            AND lpem.player_id = p1.id
    )::INTEGER AS losses
    FROM top_players p1
    CROSS JOIN top_players p2
    WHERE p1.id <> p2.id
    ORDER BY
        p1.current_singles ASC,
        p2.current_singles ASC;
END;
$$;
