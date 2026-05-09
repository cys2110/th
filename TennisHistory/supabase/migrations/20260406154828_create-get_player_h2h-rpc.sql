CREATE OR REPLACE FUNCTION get_player_h2h(player_id TEXT)
RETURNS TABLE (
    player JSONB,
    total INTEGER,
    wins INTEGER,
    losses INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    SELECT
        json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name, 'country', row_to_json(c))::JSONB AS player,
        COUNT(m)::INTEGER AS total,
        SUM(CASE WHEN winner_map.player_id = get_player_h2h.player_id THEN 1 ELSE 0 END)::INTEGER AS wins,
        SUM(CASE WHEN loser_map.player_id = get_player_h2h.player_id THEN 1 ELSE 0 END)::INTEGER AS losses
    FROM matches m
    JOIN player_entry_mapping winner_map ON winner_map.entry_id = m.winner_id
    JOIN player_entry_mapping loser_map ON loser_map.entry_id = m.loser_id
    JOIN players p ON p.id = CASE WHEN winner_map.player_id = get_player_h2h.player_id THEN loser_map.player_id ELSE winner_map.player_id END
    JOIN player_country_mapping pcm ON pcm.player_id = p.id
    JOIN countries c ON c.id = pcm.country_id
    WHERE m.match_type = 'Singles'
        AND (
            winner_map.player_id = get_player_h2h.player_id
            OR loser_map.player_id = get_player_h2h.player_id
        )
        AND pcm.end_date IS NULL
    GROUP BY p.id, c.*
    ORDER BY total DESC, wins DESC
    LIMIT 10;
END;
$$;
