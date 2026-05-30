DROP VIEW activity;

CREATE OR REPLACE VIEW activity
WITH (security_invoker = true)
AS
SELECT
  p.id AS player_id,

  -- Event details
  ed.tournament_id,
  ev.edition_id,
  r.event_id,
  coalesce(ed.category, ev.category) AS category,
  coalesce(ed.currency, ev.currency) AS currency,
  coalesce(ed.sponsor_name, ev.sponsor_name) AS sponsor_name,
  coalesce(ed.start_date, ev.start_date) AS start_date,
  coalesce(ed.end_date, ev.end_date) AS end_date,
  ed.year,
  ev.level,
  e.points,
  e.pm,
  pem.rank,
  CASE
    WHEN s.seed IS NOT NULL AND s.draw = 'Main' THEN s.seed
    ELSE NULL
  END AS seed,
  CASE
    WHEN s.seed IS NOT NULL AND s.draw = 'Qualifying' THEN s.seed
    ELSE NULL
  END AS q_seed,
  es.status AS status,
  qes.status AS q_status,
  pp.id AS partner_id,
  pp.first_name AS partner_first_name,
  pp.last_name AS partner_last_name,
  to_jsonb(pc) AS partner_country,
  p_pem.rank AS partner_rank,

  -- Match details
  r.round,
  r.match_type,
  r.draw,
  r.number AS round_number,
  m.id AS match_id,
  m.format,
  m.incomplete,
  m.tie_id,
  m.group_name,
  CASE
      WHEN m.winner_id = pem.entry_id THEN TRUE
      ELSE FALSE
  END AS win,
  EXISTS (
    SELECT 1
    FROM match_stats ms
    WHERE ms.match_id = m.id
  ) AS stats,
  CASE
    WHEN m.team_1_id = pem.entry_id THEN m.team_2_id
    ELSE m.team_1_id
  END AS opponent_id,
  jsonb_agg(
    DISTINCT
    jsonb_build_object(
      'id', oe_p.id,
      'first_name', oe_p.first_name,
      'last_name', oe_p.last_name,
      'full_name', oe_p.full_name,
      'country', to_jsonb(oe_c),
      'rank', oe_pem.rank
    )
  ) AS opponent,
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'match_id', player_score.match_id,
          'set_no', player_score.set_no,
          't1_set', player_score.set,
          't2_set', opponent_score.set,
          't1_tb', player_score.tb,
          't2_tb', opponent_score.tb,
          't1_id', player_score.entry_id,
          't2_id', opponent_score.entry_id
        )
        ORDER BY player_score.set_no
      ),
      '[]'::jsonb
    )
    FROM match_scores player_score
    LEFT JOIN match_scores opponent_score
      ON opponent_score.match_id = player_score.match_id
      AND opponent_score.set_no = player_score.set_no
      AND opponent_score.entry_id = CASE
        WHEN m.team_1_id = pem.entry_id THEN m.team_2_id
        ELSE m.team_1_id
      END
    WHERE player_score.match_id = m.id
      AND player_score.entry_id = pem.entry_id
  ) AS scores

FROM players p
JOIN player_entry_mapping pem ON p.id = pem.player_id
JOIN matches m ON m.team_1_id = pem.entry_id OR m.team_2_id = pem.entry_id
JOIN entries e ON e.id = pem.entry_id
LEFT JOIN player_entry_mapping p_pem ON p_pem.entry_id = e.id AND p_pem.player_id <> pem.player_id
LEFT JOIN seeds s ON s.entry_id = pem.entry_id
LEFT JOIN entry_status es ON es.entry_id = pem.entry_id AND es.draw = 'Main'
LEFT JOIN entry_status qes ON qes.entry_id = pem.entry_id AND qes.draw = 'Qualifying'
LEFT JOIN players pp ON pp.id = p_pem.player_id
LEFT JOIN countries pc ON pc.id = p_pem.country_id
LEFT JOIN entries oe ON CASE WHEN m.team_1_id = pem.entry_id THEN m.team_2_id ELSE m.team_1_id END = oe.id
LEFT JOIN player_entry_mapping oe_pem ON oe_pem.entry_id = oe.id
LEFT JOIN players oe_p ON oe_p.id = oe_pem.player_id
LEFT JOIN countries oe_c ON oe_c.id = oe_pem.country_id
JOIN rounds r ON r.id = m.round_id
JOIN events ev ON ev.id = r.event_id
JOIN editions ed ON ed.id = ev.edition_id
GROUP BY
  p.id,
  ed.id,
  ev.id,
  r.id,
  m.id,
  pem.id,
  pem.entry_id,
  oe.id,
  e.id,
  pp.id,
  pc.id,
  s.id,
  es.id,
  qes.id,
  p_pem.id;
