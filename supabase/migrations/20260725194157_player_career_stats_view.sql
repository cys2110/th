CREATE OR REPLACE VIEW football.player_career_stats
WITH (security_invoker = true)
AS
SELECT
  pss.id,
  pss.full_name,
  pss.aka,
  pss.team_id,
  t.type AS team_type,
  s.competition_id,
  c.name AS competition,
  c.type AS competition_type,
  c.category AS competition_category,
  SUM(pss.appearances) AS appearances,
  SUM(pss.starter) AS starter,
  SUM(pss.minutes_played) AS minutes_played,
  SUM(pss.yellow_cards) AS yellow_cards,
  SUM(pss.second_yellows) AS second_yellows,
  SUM(pss.red_cards) AS red_cards,
  SUM(pss.assists) AS assists,
  SUM(pss.goals) AS goals,
  SUM(pss.penalties) AS penalties,
  SUM(pss.penalties_taken) AS penalties_taken,
  SUM(pss.penalties_missed) AS penalties_missed,
  SUM(pss.own_goals) AS own_goals,
  SUM(pss.saves) AS saves,
  SUM(pss.penalty_saves) AS penalty_saves,
  SUM(pss.clean_sheets) AS clean_sheets,
  BOOL_OR(pss.goalkeeper) AS goalkeeper
FROM football.player_season_stats pss
JOIN football.season s ON s.id = pss.season_id
JOIN football.competition c on c.id = s.competition_id
JOIN football.team t ON t.id = pss.team_id
GROUP BY pss.id, pss.full_name, pss.aka, pss.season_id, pss.team_id, s.id, c.id, t.id;

GRANT SELECT ON TABLE football.player_career_stats TO authenticated;