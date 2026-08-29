DROP VIEW IF EXISTS tennis.seed_details;

CREATE OR REPLACE VIEW tennis.seed_details
WITH (security_invoker = true)
AS
  select
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  s.id,
  s.seed,
  s.entry_id,
  s.draw,
  s.match_type,
  s.rank,
  case
    when w is null then false
    else true
  end as withdrawn
from
  tennis.seeds s
  join tennis.events ev on ev.id = s.event_id
  join tennis.editions ed on ed.id = ev.edition_id
  left join tennis.withdrawals w on w.entry_id = s.entry_id and w.draw = s.draw
order by
  ev.tour,
  s.draw,
  s.match_type,
  s.seed;

GRANT SELECT ON TABLE tennis.seed_details TO anon, authenticated;
