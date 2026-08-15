CREATE OR REPLACE VIEW football.player_match_stats
WITH (security_invoker = true)
AS
SELECT
  p.id,
  pe.full_name,
  p.aka,
  m.id AS match_id,
  m.kickoff_time,
  m.season_id,
  ml.team_id,
  m.home_team_id,
  m.away_team_id,
  m.home_score,
  m.away_score,

  CASE
    WHEN m.home_score = m.away_score THEN 'Draw'
    WHEN (m.home_team_id = ml.team_id AND m.home_score > m.away_score) OR (m.away_team_id = ml.team_id AND m.away_score > m.home_score) THEN 'Win'
    ELSE 'Loss'
  END AS result,

  ml.starter,
  CASE WHEN ml.position IS NULL THEN false ELSE true END AS appearance,
  ml.position,

  CASE
    WHEN ml.starter = true THEN
      GREATEST(0, COALESCE(substitutions.sub_off_minute, match_duration.total_minutes))
    WHEN substitutions.sub_on_minute IS NOT NULL THEN
      GREATEST(0, COALESCE(substitutions.sub_off_minute, match_duration.total_minutes) - substitutions.sub_on_minute)
    ELSE 0
  END AS minutes_played,

  COUNT(*) FILTER (WHERE me.type = 'yellow_card' AND mep.role = 'carded_player') AS yellow_cards,
  COUNT(*) FILTER (WHERE me.type = 'second_yellow_card' AND mep.role = 'carded_player') AS second_yellows,
  COUNT(*) FILTER (WHERE me.type = 'red_card' AND mep.role = 'carded_player') AS red_cards,
  COUNT(*) FILTER (WHERE mep.role = 'assist') AS assists,
  COUNT(*) FILTER (WHERE me.type = 'goal' AND (mep.role = 'scorer' OR mep.role = 'penalty_taker')) AS goals,
  COUNT(*) FILTER (WHERE me.type = 'goal' AND mep.role = 'penalty_taker') AS penalties,
  COUNT(*) FILTER (WHERE mep.role = 'penalty_taker') AS penalties_taken,
  COUNT(*) FILTER (WHERE me.type = 'penalty_missed' AND mep.role = 'penalty_taker') AS penalties_missed,
  COUNT(*) FILTER (WHERE mep.role = 'own_goal_scorer') AS own_goals,
  COUNT(*) FILTER (WHERE me.type IN ('save', 'penalty_saved') AND mep.role = 'keeper') AS saves,
  COUNT(*) FILTER (WHERE me.type = 'penalty_saved' AND mep.role = 'keeper') AS penalty_saves,

  CASE
    WHEN ml.position IS NULL OR ml.position <> 'goalkeeper' THEN NULL
    ELSE NOT EXISTS (
      SELECT 1
      FROM football.match_event goal_event
      JOIN football.match_event_player keeper_event
        ON keeper_event.match_event_id = goal_event.id
      WHERE goal_event.match_id = m.id
        AND goal_event.type = 'goal'
        AND keeper_event.player_id = p.id
        AND keeper_event.role = 'keeper'
    )
  END AS clean_sheet

FROM football.player p
JOIN football.people pe ON pe.id = p.person_id
JOIN football.match_lineup ml ON ml.player_id = p.id
JOIN football.match m ON m.id = ml.match_id
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN m.decision IN ('extra_time', 'penalties') THEN 120
      ELSE 90
    END AS total_minutes
) match_duration
LEFT JOIN LATERAL (
  SELECT
    MIN(substitution_event.minute + COALESCE(substitution_event.stoppage_minute, 0)) FILTER (WHERE substitution_player.role = 'sub_on') AS sub_on_minute,
    MAX(substitution_event.minute + COALESCE(substitution_event.stoppage_minute, 0)) FILTER (WHERE substitution_player.role = 'sub_off') AS sub_off_minute
  FROM football.match_event substitution_event
  JOIN football.match_event_player substitution_player ON substitution_player.match_event_id = substitution_event.id AND substitution_player.player_id = p.id
  WHERE substitution_event.match_id = m.id AND substitution_event.type = 'substitution'
) substitutions
  ON true
LEFT JOIN football.match_event me ON me.match_id = m.id
LEFT JOIN football.match_event_player mep ON mep.match_event_id = me.id AND mep.player_id = p.id

GROUP BY
  p.id,
  pe.id,
  m.id,
  ml.id,
  substitutions.sub_off_minute,
  substitutions.sub_on_minute,
  match_duration.total_minutes

ORDER BY m.kickoff_time DESC;

GRANT SELECT ON football.player_match_stats TO authenticated;

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
  BOOL_OR(pms.position = 'goalkeeper') AS goalkeeper
FROM football.player_match_stats pms
JOIN football.season s ON s.id = pms.season_id
JOIN football.team t ON t.id = pms.team_id
GROUP BY pms.id, pms.full_name, pms.aka, pms.season_id, pms.team_id, s.name, s.start_date, s.end_date, t.type
ORDER BY s.start_date;

GRANT SELECT ON football.player_season_stats TO authenticated;

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
