drop view if exists tennis.entries_by_team;

create or replace view tennis.entries_by_team
with (security_invoker = true)
as
with teams as (
  select
    pem.entry_id,
    p.id,
    pe.full_name,
    p.image_url,
    to_json(c.*) as country,
    pem.player_order
  from tennis.player_entry_mapping pem
  join tennis.player p on p.id = pem.player_id
  join tennis.people pe on pe.id = p.person_id
  join tennis.country c on pem.country_id = c.id
)

select
ed.tournament_id,
ed.year,
ed.edition_no,
ev.id as event_id,
e.id as entry_id,
e.match_type,
string_agg(t.full_name, ' / ' order by t.player_order) as players,
jsonb_agg(
  jsonb_build_object(
    'id', t.id,
    'full_name', t.full_name,
    'image_url', t.image_url,
    'country', t.country
  )
  order by t.player_order
) as team,
exists (
  select 1
  from tennis.matches m
  where e.id in (m.team_1_id, m.team_2_id)
    and m.draw = 'Main'
) as main,
exists (
  select 1
  from tennis.matches m
  where e.id in (m.team_1_id, m.team_2_id)
    and m.draw = 'Qualifying'
) as qualifying,
case
  when exists (
    select 1
    from tennis.matches m
    join tennis.rounds r on r.id = m.round_id
    where m.winner_id = e.id
    and r.round = 'Final'
  ) then 'Winner'
  when exists (
    select 1
    from tennis.withdrawals w
    where w.entry_id = e.id
  ) then 'Withdrawn'
  else (
    select
      r.round
    from tennis.rounds r
    join tennis.matches m on m.round_id = r.id
    where m.loser_id = e.id
    order by r.number
    limit 1
  )
end as round,
(
  select
    s.seed
  from tennis.seeds s
  where s.entry_id = e.id
  and s.event_id = ev.id
  and s.draw = 'Main'
) as seed,
(
  select
    s.seed
  from tennis.seeds s
  where s.entry_id = e.id
  and s.event_id = ev.id
  and s.draw = 'Qualifying'
) as qualifying_seed,
(
  select
    jsonb_agg(es.status)
  from tennis.entry_status es
  where es.entry_id = e.id
  and es.event_id = ev.id
  and es.draw = 'Main'
) as status,
(
  select
    jsonb_agg(es.status)
  from tennis.entry_status es
  where es.entry_id = e.id
  and es.event_id = ev.id
  and es.draw = 'Qualifying'
) as qualifying_status
from tennis.entries e
join tennis.events ev on ev.id = e.event_id
join tennis.editions ed on ed.id = ev.edition_id
join teams t on t.entry_id = e.id
group by e.id, ev.id, ed.id;

grant select on table tennis.entries_by_team to anon, authenticated;