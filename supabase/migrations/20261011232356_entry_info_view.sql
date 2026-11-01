drop view if exists tennis.entry_info;

create or replace view tennis.entry_info
with (security_invoker = true)
as
select
  'defaults' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  d.id,
  d.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = d.entry_id
  ) as team,
  d.draw,
  d.reason,
  d.player_id,
  (
    select
      pe.full_name
    from tennis.player p
    join tennis.people pe on pe.id = p.person_id
    where p.id = d.player_id
  ) as teammate,
  null::int as rank,
  null::tennis.status_enum as status
from
  tennis.defaults d
  join tennis.events ev on ev.id = d.event_id
  join tennis.editions ed on ed.id = ev.edition_id
union all
select
  'retirements' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  r.id,
  r.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = r.entry_id
  ) as team,
  r.draw,
  r.reason,
  r.player_id,
  (
    select
      pe.full_name
    from tennis.player p
    join tennis.people pe on pe.id = p.person_id
    where p.id = r.player_id
  ) as teammate,
  null::int as rank,
  null::tennis.status_enum as status
from
  tennis.retirements r
  join tennis.events ev on ev.id = r.event_id
  join tennis.editions ed on ed.id = ev.edition_id
union all
select
  'walkovers' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  wo.id,
  wo.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = wo.entry_id
  ) as team,
  wo.draw,
  wo.reason,
  wo.player_id,
  (
    select
      pe.full_name
    from tennis.player p
    join tennis.people pe on pe.id = p.person_id
    where p.id = wo.player_id
  ) as teammate,
  null::int as rank,
  null::tennis.status_enum as status
from
  tennis.walkovers wo
  join tennis.events ev on ev.id = wo.event_id
  join tennis.editions ed on ed.id = ev.edition_id
union all
select
  'withdrawals' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  wd.id,
  wd.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = wd.entry_id
  ) as team,
  wd.draw,
  wd.reason,
  wd.player_id,
  (
    select
      pe.full_name
    from tennis.player p
    join tennis.people pe on pe.id = p.person_id
    where p.id = wd.player_id
  ) as teammate,
  null::int as rank,
  null::tennis.status_enum as status
from
  tennis.withdrawals wd
  join tennis.events ev on ev.id = wd.event_id
  join tennis.editions ed on ed.id = ev.edition_id
union all
select
  'ldas' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  lda.id,
  lda.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = lda.entry_id
  ) as team,
  lda.draw,
  null::text as reason,
  null::text as player_id,
  null::text as teammate,
  lda.rank,
  null::tennis.status_enum as status
from
  tennis.ldas lda
  join tennis.events ev on ev.id = lda.event_id
  join tennis.editions ed on ed.id = ev.edition_id
union all
select
  'entry_status' as info_type,
  ed.tournament_id,
  ed.year,
  ed.edition_no,
  ev.tour,
  es.id,
  es.entry_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          p.id,
          'full_name',
          pe.full_name,
          'country',
          to_jsonb(c.*)
        )
        order by
          pem.player_order
      )
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.country c on c.id = pem.country_id
    where
      pem.entry_id = es.entry_id
  ) as team,
  es.draw,
  null::text as reason,
  null::text as player_id,
  null::text as teammate,
  null::int as rank,
  es.status
from
  tennis.entry_status es
  join tennis.events ev on ev.id = es.event_id
  join tennis.editions ed on ed.id = ev.edition_id;

grant select on table tennis.entry_info to anon, authenticated;