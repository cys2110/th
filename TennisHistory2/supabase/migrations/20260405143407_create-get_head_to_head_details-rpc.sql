DROP FUNCTION IF EXISTS get_head_to_head_details(TEXT[], TEXT[]);
CREATE OR REPLACE FUNCTION get_head_to_head_details(
    team1_ids TEXT[],
    team2_ids TEXT[]
)
RETURNS TABLE (
    team1 JSONB,
    team2 JSONB,
    matches JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    WITH normalised_params AS (
        SELECT
            ARRAY(SELECT unnest(get_head_to_head_details.team1_ids) ORDER BY 1) AS team1,
            ARRAY(SELECT unnest(get_head_to_head_details.team2_ids) ORDER BY 1) AS team2
    ),

    entry_player_sets AS (
        SELECT
            pem.entry_id,
            ARRAY_AGG(DISTINCT pem.player_id ORDER BY pem.player_id) AS player_ids
        FROM player_entry_mapping pem
        GROUP BY pem.entry_id
    ),

    team1_record AS (
        SELECT
            COUNT(*) FILTER (WHERE winner_eps.player_ids = par.team1) AS wins,
            COUNT(*) FILTER (WHERE loser_eps.player_ids = par.team1) AS losses,
            COUNT(*) FILTER (WHERE winner_eps.player_ids = par.team1 AND r.round = 'Final') AS titles
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        JOIN entry_player_sets winner_eps ON winner_eps.entry_id = m.winner_id
        JOIN entry_player_sets loser_eps ON loser_eps.entry_id = m.loser_id
        CROSS JOIN normalised_params par
    ),

    team2_record AS (
        SELECT
            COUNT(*) FILTER (WHERE winner_eps.player_ids = par.team2) AS wins,
            COUNT(*) FILTER (WHERE loser_eps.player_ids = par.team2) AS losses,
            COUNT(*) FILTER (WHERE winner_eps.player_ids = par.team2 AND r.round = 'Final') AS titles
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        JOIN entry_player_sets winner_eps ON winner_eps.entry_id = m.winner_id
        JOIN entry_player_sets loser_eps ON loser_eps.entry_id = m.loser_id
        CROSS JOIN normalised_params par
    ),

    head_to_head AS (
        SELECT
            m.id AS match_id,
            ed.year,
            ed.id AS edition_id,
            t.id AS tournament_id,
            t.name AS tournament_name,
            r.round,
            score_data.scores,
            surface_data.surfaces,
            ev.level,
            m.winner_id,
            (stats_data.stats IS NOT NULL) AS has_stats
        FROM matches m
        JOIN rounds r ON r.id = m.round_id
        JOIN events ev ON ev.id = r.event_id
        JOIN editions ed ON ed.id = ev.edition_id
        JOIN tournaments t ON t.id = ed.tournament_id
        JOIN entry_player_sets winner_eps ON winner_eps.entry_id = m.winner_id
        JOIN entry_player_sets loser_eps ON loser_eps.entry_id = m.loser_id
        CROSS JOIN normalised_params par
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(ms) ORDER BY ms.id) AS scores
            FROM match_scores ms
            WHERE ms.match_id = m.id
        ) score_data ON TRUE
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(to_jsonb(mt)) AS stats
            FROM match_stats mt
            WHERE mt.match_id = m.id
        ) stats_data ON TRUE
        LEFT JOIN LATERAL (
            SELECT jsonb_agg(DISTINCT (s.environment || ' ' || s.surface)) AS surfaces
            FROM event_surface_mapping esm
            JOIN surfaces s ON s.id = esm.surface_id
            WHERE esm.event_id = ev.id
        ) surface_data ON TRUE
        WHERE
            (winner_eps.player_ids = par.team1 AND loser_eps.player_ids = par.team2)
            OR
            (winner_eps.player_ids = par.team2 AND loser_eps.player_ids = par.team1)
        GROUP BY m.id, ed.year, t.id, r.round, score_data.scores, surface_data.surfaces, ev.level, stats_data.stats, ed.id
    )

    SELECT
        json_build_object(
            'wins', t1r.wins,
            'losses', t1r.losses,
            'titles', t1r.titles
        )::jsonb AS team1,
        json_build_object(
            'wins', t2r.wins,
            'losses', t2r.losses,
            'titles', t2r.titles
        )::jsonb AS team2,
        COALESCE(
        (
            SELECT jsonb_agg(h ORDER BY h.year DESC, h.tournament_name, h.round)
            FROM head_to_head h
        ),
        '[]'::jsonb
        ) AS matches
    FROM team1_record t1r
    CROSS JOIN team2_record t2r;
END;
$$;
