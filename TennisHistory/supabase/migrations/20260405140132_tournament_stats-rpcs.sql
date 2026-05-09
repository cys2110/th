DROP FUNCTION IF EXISTS get_tournament_finalists(tournament_id INTEGER);
DROP FUNCTION IF EXISTS get_tournament_winners(tournament_id INTEGER);
DROP FUNCTION IF EXISTS get_tournament_seed_stats(tournament_id INTEGER);
DROP FUNCTION IF EXISTS get_tournament_lowest_ranked(tournament_id INTEGER);
DROP FUNCTION IF EXISTS get_tournament_status_stats(tournament_id INTEGER);
CREATE OR REPLACE FUNCTION get_tournament_finalists(tournament_id INTEGER)
RETURNS TABLE (
    id TEXT,
    first_name TEXT,
    last_name TEXT,
    tour tour_enum,
    country JSONB,
    singles_finals INTEGER,
    singles_titles INTEGER,
    doubles_finals INTEGER,
    doubles_titles INTEGER
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
        COUNT(DISTINCT CASE WHEN m.match_type = 'Singles' THEN m.id END)::integer AS singles_finals,
        COUNT(DISTINCT CASE WHEN m.winner_id = e.id AND m.match_type = 'Singles' THEN m.id END)::integer AS singles_titles,
        COUNT(DISTINCT CASE WHEN m.match_type = 'Doubles' THEN m.id END)::integer AS doubles_finals,
        COUNT(DISTINCT CASE WHEN m.winner_id = e.id AND m.match_type = 'Doubles' THEN m.id END)::integer AS doubles_titles
    FROM players p
        JOIN player_entry_mapping pem ON pem.player_id = p.id
        JOIN countries c ON c.id = pem.country_id
        JOIN entries e ON e.id = pem.entry_id
        JOIN matches m
        ON m.team_1_id = e.id OR m.team_2_id = e.id
        JOIN rounds r ON r.id = m.round_id
        JOIN events ev ON ev.id = r.event_id
        JOIN editions ed ON ed.id = ev.edition_id
    WHERE
        ed.tournament_id = get_tournament_finalists.tournament_id
        AND r.round = 'Final'
        GROUP BY
        p.id, p.first_name, p.last_name, c.*
        ORDER BY
        singles_titles DESC,
        singles_finals DESC,
        doubles_titles DESC,
        doubles_finals DESC,
        p.last_name,
        p.first_name;
END;
$$;
CREATE OR REPLACE FUNCTION get_tournament_winners(tournament_id INTEGER)
RETURNS TABLE (
    edition_id INTEGER,
    year INTEGER,
    start_date DATE,
    end_date DATE,
    event_id TEXT,
    tour tour_enum,
    match_type match_type_enum,
    entry_id TEXT,
    team JSONB,
    scores JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
WITH edition AS (
    SELECT
        ed.id AS edition_id,
        ed.year,
        COALESCE(ed.start_date, ev.start_date) AS start_date,
        COALESCE(ed.end_date, ev.end_date) AS end_date,
        ev.id AS event_id,
        ev.tour
    FROM editions ed
    JOIN events ev ON ev.edition_id = ed.id
    WHERE ed.tournament_id = get_tournament_winners.tournament_id
),
winner_matches AS (
    SELECT
        ed.edition_id,
        ed.year,
        ed.start_date,
        ed.end_date,
        ed.event_id,
        ed.tour,
        m.id AS match_id,
        m.match_type,
        m.winner_id AS entry_id
    FROM edition ed
    JOIN rounds r ON r.event_id = ed.event_id
    JOIN matches m ON m.round_id = r.id
    WHERE r.round = 'Final'
),
entry_teams AS (
    SELECT
        e.id AS entry_id,
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'dob', p.dob,
                'country', row_to_json(c)::jsonb
            )
            ORDER BY p.last_name, p.first_name
        ) AS team
    FROM entries e
    JOIN player_entry_mapping pem ON pem.entry_id = e.id
    JOIN players p ON p.id = pem.player_id
    JOIN countries c ON c.id = pem.country_id
    GROUP BY e.id
),
match_score_agg AS (
    SELECT
        ms.match_id,
        jsonb_agg(to_jsonb(ms) ORDER BY ms.id) AS scores
    FROM match_scores ms
    GROUP BY ms.match_id
)
SELECT
    wm.edition_id,
    wm.year,
    wm.start_date,
    wm.end_date,
    wm.event_id,
    wm.tour,
    wm.match_type,
    wm.entry_id,
    et.team,
    msa.scores
FROM winner_matches wm
JOIN entry_teams et
    ON et.entry_id = wm.entry_id
LEFT JOIN match_score_agg msa
    ON msa.match_id = wm.match_id
ORDER BY wm.year ASC;
END;
$$;
CREATE OR REPLACE FUNCTION get_tournament_seed_stats(tournament_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    year INTEGER,
    tour tour_enum,
    match_type match_type_enum,
    round TEXT,
    seeded_entries JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    WITH all_events AS (
  SELECT
    ed.id,
    ed.year,
    ev.tour,
    ev.id AS event_id
  FROM events ev
  JOIN editions ed ON ed.id = ev.edition_id
  WHERE ed.tournament_id = get_tournament_seed_stats.tournament_id
),
seeded_rounds AS (
  SELECT DISTINCT
    ae.id,
    ae.year,
    ae.tour,
    ae.event_id,
    r.round::text AS round,
    m.match_type,
    s.seed,
    s.entry_id
  FROM all_events ae
  JOIN rounds r
    ON r.event_id = ae.event_id
  JOIN matches m
    ON m.round_id = r.id
  JOIN seeds s
    ON s.event_id = ae.event_id
   AND s.entry_id IN (m.team_1_id, m.team_2_id)
  WHERE
    (r.round = 'Quarterfinals' AND s.seed <= 8)
    OR (r.round = 'Semifinals' AND s.seed <= 4)
    OR (r.round = 'Final' AND s.seed <= 2)
),
win_rounds AS (
  SELECT DISTINCT
    ae.id,
    ae.year,
    ae.tour,
    ae.event_id,
    'Win'::text AS round,
    m.match_type,
    s.seed,
    s.entry_id
  FROM all_events ae
  JOIN rounds r
    ON r.event_id = ae.event_id
  JOIN matches m
    ON m.round_id = r.id
  JOIN seeds s
    ON s.event_id = ae.event_id
   AND s.entry_id = m.winner_id
  WHERE
    r.round = 'Final'
    AND s.seed = 1
),
all_seeded_rounds AS (
  SELECT * FROM seeded_rounds
  UNION ALL
  SELECT * FROM win_rounds
),
entry_players AS (
  SELECT
    e.id AS entry_id,
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'country', row_to_json(c)::jsonb
      )
      ORDER BY p.last_name, p.first_name
    ) AS players
  FROM entries e
  JOIN player_entry_mapping pem
    ON pem.entry_id = e.id
  JOIN players p
    ON p.id = pem.player_id
  JOIN countries c
    ON c.id = pem.country_id
  GROUP BY e.id
)
SELECT
  sr.id,
  sr.year,
  sr.tour,
  sr.match_type,
  sr.round,
  jsonb_agg(
    jsonb_build_object(
      'seed', sr.seed,
      'entry_id', sr.entry_id,
      'team', ep.players
    )
    ORDER BY sr.seed
  ) AS seeded_entries
FROM all_seeded_rounds sr
JOIN entry_players ep
  ON ep.entry_id = sr.entry_id
GROUP BY sr.id, sr.year, sr.tour, sr.match_type, sr.round
HAVING
  COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Quarterfinals') = 8
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Semifinals') = 4
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Final') = 2
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Win') = 1
ORDER BY sr.year, sr.tour;
END;
$$;
CREATE OR REPLACE FUNCTION get_tournament_status_stats(tournament_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    year INTEGER,
    match_type match_type_enum,
    team JSONB,
    tour tour_enum,
    status status_enum
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
    SELECT
    ed.id,
    ed.year,
    m.match_type,
    jsonb_agg(
        jsonb_build_object(
        'id', p.id,
        'first_name', p.first_name,
        'last_name', p.last_name,
        'country', row_to_json(c)::jsonb
        )
    ) AS team,
    ev.tour,
    es.status
    FROM players p
    JOIN player_entry_mapping pem ON p.id = pem.player_id
    JOIN countries c ON c.id = pem.country_id
    JOIN entries e ON e.id = pem.entry_id
    JOIN entry_status es ON es.entry_id = e.id
    JOIN matches m ON m.winner_id = e.id
    JOIN rounds r ON r.id = m.round_id
    JOIN events ev ON ev.id = r.event_id
    JOIN editions ed ON ed.id = ev.edition_id
    WHERE
    ed.tournament_id = get_tournament_status_stats.tournament_id
    AND es.status IN ('Q', 'WC', 'AL', 'LL')
    AND r.round = 'Final'
    GROUP BY
        ed.id,
        ed.year,
        ev.tour,
        m.match_type,
        es.status
    ORDER BY ed.year;
END;
$$;
CREATE OR REPLACE FUNCTION get_tournament_lowest_ranked(tournament_id INTEGER)
RETURNS TABLE (
    tour tour_enum,
    match_type match_type_enum,
    round TEXT,
    rank INTEGER,
    id TEXT,
    first_name TEXT,
    last_name TEXT,
    country JSONB,
    edition_id INTEGER,
    year INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
WITH played AS (
  SELECT DISTINCT ON (ev.tour, m.match_type, r.round)
    ev.tour,
    m.match_type,
    r.round::text AS round,
    pem.rank,
    p.id,
    p.first_name,
    p.last_name,
    row_to_json(c)::jsonb AS country,
    ed.year,
    ed.id AS edition_id
  FROM matches m
  JOIN rounds r ON r.id = m.round_id
  JOIN events ev ON ev.id = r.event_id
  JOIN editions ed ON ed.id = ev.edition_id
  JOIN entries e ON e.id IN (m.winner_id, m.loser_id)
  JOIN player_entry_mapping pem ON pem.entry_id = e.id
  JOIN players p ON p.id = pem.player_id
  JOIN countries c ON c.id = pem.country_id
  WHERE ed.tournament_id = get_tournament_lowest_ranked.tournament_id
    AND r.round IN ('Quarterfinals', 'Semifinals', 'Final')
    AND pem.rank IS NOT NULL
  ORDER BY ev.tour, m.match_type, r.round, pem.rank DESC
),
champions AS (
  SELECT DISTINCT ON (ev.tour, m.match_type)
    ev.tour,
    m.match_type,
    'Win'::text AS round,
    pem.rank,
    p.id,
    p.first_name,
    p.last_name,
    row_to_json(c)::jsonb AS country,
    ed.id AS edition_id,
    ed.year
  FROM matches m
  JOIN rounds r ON r.id = m.round_id
  JOIN events ev ON ev.id = r.event_id
  JOIN editions ed ON ed.id = ev.edition_id
  JOIN entries e ON e.id = m.winner_id
  JOIN player_entry_mapping pem ON pem.entry_id = e.id
  JOIN players p ON p.id = pem.player_id
  JOIN countries c ON c.id = pem.country_id
  WHERE ed.tournament_id = get_tournament_lowest_ranked.tournament_id
    AND r.round = 'Final'
    AND pem.rank IS NOT NULL
  ORDER BY ev.tour, m.match_type, pem.rank DESC
)
SELECT
  u.tour,
  u.match_type,
  u.round,
  u.rank,
  u.id,
  u.first_name,
  u.last_name,
  u.country,
  u.edition_id,
  u.year
FROM (
  SELECT
    p.tour,
    p.match_type,
    p.round,
    p.rank,
    p.id,
    p.first_name,
    p.last_name,
    p.country,
    p.edition_id,
    p.year
  FROM played p

  UNION ALL

  SELECT
    c.tour,
    c.match_type,
    c.round,
    c.rank,
    c.id,
    c.first_name,
    c.last_name,
    c.country,
    c.edition_id,
    c.year
  FROM champions c
) u
ORDER BY
  u.tour,
  u.match_type,
  CASE u.round
    WHEN 'Quarterfinals' THEN 1
    WHEN 'Semifinals' THEN 2
    WHEN 'Final' THEN 3
    WHEN 'Win' THEN 4
  END;
END;
$$;
