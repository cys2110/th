DROP VIEW IF EXISTS tournament_finalists;
DROP VIEW IF EXISTS tournament_seed_stats;

CREATE OR REPLACE VIEW tournament_finalists
WITH (security_invoker = true)
AS
SELECT
    pem.player_id,
    pem.country_id,
    ed.tournament_id,
    ev.edition_id,
    ed.year,
    CASE WHEN m.winner_id = e.id THEN true ELSE false END AS winner,
    r.match_type,
    r.tour,
    pem.rank,
    es.status AS entry_info,
    SUM(ws.set) AS games_won,
    SUM(ls.set) AS games_lost,
    SUM(CASE WHEN ws.set_no = ls.set_no AND ws.set > ls.set THEN 1 ELSE 0 END) AS sets_won,
    SUM(CASE WHEN ws.set_no = ls.set_no AND ws.set < ls.set THEN 1 ELSE 0 END) AS sets_lost
FROM editions ed
JOIN events ev ON ev.edition_id = ed.id
JOIN rounds r ON r.event_id = ev.id
JOIN matches m ON m.round_id = r.id
JOIN entries e ON e.id = m.winner_id OR e.id = m.loser_id
JOIN player_entry_mapping pem ON pem.entry_id = e.id
JOIN players p ON p.id = pem.player_id
LEFT JOIN entry_status es ON es.entry_id = e.id AND es.draw = 'Main'
JOIN match_scores ws ON ws.match_id = m.id AND ws.entry_id = e.id
JOIN match_scores ls ON ls.match_id = m.id AND ls.entry_id <> e.id
WHERE r.round = 'Final'
GROUP BY ed.id, ev.id, r.id, m.id, e.id, pem.id, p.id, es.id;

CREATE OR REPLACE VIEW tournament_seed_stats
WITH (security_invoker = true)
AS
WITH all_events AS (
  SELECT
    ed.id,
    ed.year,
    ed.tournament_id,
    ev.tour,
    ev.id AS event_id
  FROM events ev
  JOIN editions ed ON ed.id = ev.edition_id
),

seeded_rounds AS (
  SELECT DISTINCT
    ae.id,
    ae.year,
    ae.tournament_id,
    ae.tour,
    ae.event_id,
    r.round::text AS round,
    m.match_type,
    s.seed,
    s.entry_id
  FROM all_events ae
  JOIN rounds r ON r.event_id = ae.event_id
  JOIN matches m ON m.round_id = r.id
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
    ae.tournament_id,
    ae.tour,
    ae.event_id,
    'Win'::text AS round,
    m.match_type,
    s.seed,
    s.entry_id
  FROM all_events ae
  JOIN rounds r ON r.event_id = ae.event_id
  JOIN matches m ON m.round_id = r.id
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
        'full_name', p.full_name,
        'country', row_to_json(c)::jsonb
      )
      ORDER BY array_position(
        (string_to_array(e.id::text, ' '))[2:],
        p.id::text
      )
    ) AS players
  FROM entries e
  JOIN player_entry_mapping pem ON pem.entry_id = e.id
  JOIN players p ON p.id = pem.player_id
  JOIN countries c ON c.id = pem.country_id
  GROUP BY e.id
)

SELECT
  sr.id,
  sr.year,
  sr.tournament_id,
  sr.tour,
  sr.match_type,
  sr.round,
  jsonb_agg(
    jsonb_build_object(
      'seed', sr.seed,
      'players', ep.players
    )
    ORDER BY sr.seed
  ) AS team
FROM all_seeded_rounds sr
JOIN entry_players ep ON ep.entry_id = sr.entry_id

GROUP BY
  sr.id,
  sr.year,
  sr.tournament_id,
  sr.tour,
  sr.match_type,
  sr.round

HAVING
  COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Quarterfinals') = 8
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Semifinals') = 4
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Final') = 2
  OR COUNT(DISTINCT sr.seed) FILTER (WHERE sr.round = 'Win') = 1;