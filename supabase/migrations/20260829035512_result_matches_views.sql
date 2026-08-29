DROP VIEW IF EXISTS tennis.result_matches;

CREATE OR REPLACE VIEW tennis.result_matches
WITH (security_invoker = true)
AS
select
  *
from
  (
    select
      r.round,
      ed.tournament_id,
      ed.year,
      ed.edition_no,
      m.*,
      (
        select
          coalesce(sum(coalesce(nullif(pem.rank, 0), 9999)), 9999)
        from
          tennis.player_entry_mapping pem
        where
          pem.entry_id = w.id
      ) as winner_rank,
      (
        select
          coalesce(sum(coalesce(nullif(pem.rank, 0), 9999)), 9999)
        from
          tennis.player_entry_mapping pem
        where
          pem.entry_id = l.id
      ) as loser_rank,
      ws.seed as winner_seed,
      ls.seed as loser_seed,
      wi.status as winner_status,
      li.status as loser_status,
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
          and ms.entry_id = w.id
      ) as winner_scores,
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
          and ms.entry_id = l.id
      ) as loser_scores
    from
      tennis.matches m
      join tennis.rounds r on r.id = m.round_id
      join tennis.events e on e.id = r.event_id
      join tennis.editions ed on ed.id = e.edition_id
      left join tennis.entries w on w.id = m.winner_id
      left join tennis.seeds ws on ws.entry_id = w.id
      and ws.draw = m.draw
      and ws.match_type = m.match_type
      left join tennis.entry_status wi on wi.entry_id = w.id
      and wi.draw = m.draw
      left join tennis.entries l on l.id = m.loser_id
      left join tennis.seeds ls on ls.entry_id = l.id
      and ls.draw = m.draw
      and ls.match_type = m.match_type
      left join tennis.entry_status li on li.entry_id = l.id
      and li.draw = m.draw
  ) q
order by
  least(winner_rank, loser_rank);

GRANT SELECT ON TABLE tennis.result_matches TO anon, authenticated;
