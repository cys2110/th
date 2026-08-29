DROP VIEW IF EXISTS tennis.match_details;

CREATE OR REPLACE VIEW tennis.match_details
WITH (security_invoker = true)
AS
  select
  t.id as tournament_id,
  t.name as tournament_name,
  ed.year,
  ed.edition_no,
  coalesce(ed.category, e.category) as category,
  e.level,
  coalesce(ed.sponsor_name, e.sponsor_name) as sponsor_name,
  coalesce(eds.name, es.name) as surface,
  r.round,
  m.*,
  t1s.seed as team_1_seed,
  t2s.seed as team_2_seed,
  t1i.status as team_1_status,
  t2i.status as team_2_status,
  (
    select
      jsonb_agg(
        jsonb_build_object('set_no', ms.set_no, 'set', ms.set, 'tb', ms.tb)
        order by
          ms.set_no
      )
    from
      tennis.match_scores ms
    where
      ms.match_id = m.id
      and ms.entry_id = t1.id
  ) as team_1_scores,
  (
    select
      jsonb_agg(
        jsonb_build_object('set_no', ms.set_no, 'set', ms.set, 'tb', ms.tb)
        order by
          ms.set_no
      )
    from
      tennis.match_scores ms
    where
      ms.match_id = m.id
      and ms.entry_id = t2.id
  ) as team_2_scores,
  (
    select
      to_jsonb(ms.*)
    from
      tennis.match_stats ms
    where
      ms.match_id = m.id
      and ms.entry_id = t1.id
  ) as team_1_stats,
  (
    select
      to_jsonb(ms.*)
    from
      tennis.match_stats ms
    where
      ms.match_id = m.id
      and ms.entry_id = t2.id
  ) as team_2_stats
from
  tennis.matches m
  join tennis.rounds r on r.id = m.round_id
  join tennis.events e on e.id = r.event_id
  join tennis.editions ed on ed.id = e.edition_id
  join tennis.tournament t on t.id = ed.tournament_id
  left join tennis.surface es on es.id = e.surface_id
  left join tennis.surface eds on eds.id = ed.surface_id
  left join tennis.entries t1 on t1.id = m.team_1_id
  left join tennis.seeds t1s on t1s.entry_id = t1.id
  and t1s.draw = m.draw
  and t1s.match_type = m.match_type
  left join tennis.entry_status t1i on t1i.entry_id = t1.id
  and t1i.draw = m.draw
  left join tennis.entries t2 on t2.id = m.team_2_id
  left join tennis.seeds t2s on t2s.entry_id = t2.id
  and t2s.draw = m.draw
  and t2s.match_type = m.match_type
  left join tennis.entry_status t2i on t2i.entry_id = t2.id
  and t2i.draw = m.draw;

GRANT SELECT ON TABLE tennis.match_details TO anon, authenticated;
