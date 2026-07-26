DROP VIEW IF EXISTS football.player_career_stats;
DROP VIEW IF EXISTS football.player_season_stats;
DROP VIEW IF EXISTS football.player_match_stats;

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
  CASE WHEN ml.position_id IS NULL THEN false ELSE true END AS appearance,
  ml.position_id,

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
    WHEN ml.position_id IS NULL OR ml.position_id <> 'GK' THEN NULL
    ELSE NOT EXISTS (
      SELECT 1
      FROM football.match_event goal_event
      JOIN football.match_event_player keeper_event
        ON keeper_event.match_event_id = goal_event.id
      WHERE goal_event.match_id = m.id
        AND goal_event.type IN ('goal', 'own_goal')
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