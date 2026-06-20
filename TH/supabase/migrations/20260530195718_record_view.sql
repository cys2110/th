DROP VIEW IF EXISTS record;

CREATE OR REPLACE VIEW record
WITH (security_invoker = true)
AS
SELECT DISTINCT ON (t.id, ev.id, ed.year, r.match_type)
  pem.player_id,
  t.id AS tournament_id,
  t.name AS tournament_name,
  ed.id AS edition_id,
  ed.year,
  r.match_type,
  r.round AS furthest_round,
  CASE
    WHEN r.number = 1 AND m.winner_id = e.id THEN true
    ELSE false
  END AS win
FROM player_entry_mapping pem
JOIN entries e ON e.id = pem.entry_id
JOIN matches m ON m.team_1_id = e.id OR m.team_2_id = e.id
JOIN rounds r ON r.id = m.round_id
JOIN events ev ON ev.id = e.event_id
JOIN editions ed ON ed.id = ev.edition_id
JOIN tournaments t ON t.id = ed.tournament_id
WHERE (
  ed.category = 'Grand Slam'
  OR ev.category = 'Finals'
  OR ed.category = 'Olympics'
)
ORDER BY
  t.id,
  ev.id,
  ed.year,
  r.match_type,
  r.number ASC;
