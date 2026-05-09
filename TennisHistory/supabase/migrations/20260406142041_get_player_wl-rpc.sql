CREATE OR REPLACE FUNCTION get_player_wl(player_id TEXT)
RETURNS TABLE (
    level level_enum,
    match_type match_type_enum,
    draw draw_enum,
    wins INTEGER,
    losses INTEGER,
    titles INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    WITH levels AS (
        SELECT unnest(ARRAY['Tour', 'Challenger', 'ITF']::level_enum[]) AS level
    ),
    match_types AS (
        SELECT unnest(ARRAY['Singles', 'Doubles']::match_type_enum[]) AS match_type
    ),
    draws AS (
        SELECT unnest(ARRAY['Main', 'Qualifying']::draw_enum[]) AS draw
    ),

    grid AS (
        SELECT l.level, mt.match_type, d.draw
        FROM levels l
        CROSS JOIN match_types mt
        CROSS JOIN draws d
    ),

    player_matches AS (
        SELECT
            ev.level,
            m.match_type,
            m.draw,
            r.round,
            CASE
                WHEN pem.entry_id = m.winner_id THEN 'win'
                WHEN pem.entry_id = m.loser_id THEN 'loss'
            END AS result
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        JOIN events ev ON ev.id = r.event_id
        JOIN player_entry_mapping pem
            ON pem.player_id = get_player_wl.player_id
        AND pem.entry_id IN (m.winner_id, m.loser_id)
        WHERE ev.level IN ('Tour', 'Challenger', 'ITF')
            AND m.match_type IN ('Singles', 'Doubles')
            AND m.draw IN ('Main', 'Qualifying')
    )

    SELECT
    g.level,
    g.match_type,
    g.draw,

    COUNT(*) FILTER (WHERE pm.result = 'win')::INTEGER AS wins,
    COUNT(*) FILTER (WHERE pm.result = 'loss')::INTEGER AS losses,

    COUNT(*) FILTER (
        WHERE g.draw = 'Main'
        AND pm.result = 'win'
        AND pm.round = 'Final'
    )::INTEGER AS titles

    FROM grid g
    LEFT JOIN player_matches pm
    ON pm.level = g.level
        AND pm.match_type = g.match_type
        AND pm.draw = g.draw

    GROUP BY g.level, g.match_type, g.draw
    ORDER BY g.level, g.match_type, g.draw;
END;
$$;
