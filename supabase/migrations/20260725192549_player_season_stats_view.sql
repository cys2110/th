CREATE OR REPLACE VIEW football.player_season_stats
WITH (security_invoker = true)
AS
SELECT
  pms.id,
  pms.full_name,
  pms.aka,
  pms.season_id,
  s.name AS season,
  s.start_date,
  s.end_date,
  pms.team_id,
  t.type AS team_type,
  COUNT(*) FILTER (WHERE pms.appearance) AS appearances,
  COUNT(*) FILTER (WHERE pms.starter) AS starter,
  SUM(pms.minutes_played) AS minutes_played,
  SUM(pms.yellow_cards) AS yellow_cards,
  SUM(pms.second_yellows) AS second_yellows,
  SUM(pms.red_cards) AS red_cards,
  SUM(pms.assists) AS assists,
  SUM(pms.goals) AS goals,
  SUM(pms.penalties) AS penalties,
  SUM(pms.penalties_taken) AS penalties_taken,
  SUM(pms.penalties_missed) AS penalties_missed,
  SUM(pms.own_goals) AS own_goals,
  SUM(pms.saves) AS saves,
  SUM(pms.penalty_saves) AS penalty_saves,
  COUNT(*) FILTER (WHERE pms.clean_sheet) AS clean_sheets,
  BOOL_OR(pms.position_id = 'GK') AS goalkeeper
FROM football.player_match_stats pms
JOIN football.season s ON s.id = pms.season_id
JOIN football.team t ON t.id = pms.team_id
GROUP BY pms.id, pms.full_name, pms.aka, pms.season_id, pms.team_id, s.name, s.start_date, s.end_date, t.type
ORDER BY s.start_date;

GRANT SELECT ON football.player_season_stats TO authenticated;