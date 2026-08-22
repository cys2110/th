DROP VIEW IF EXISTS tennis.player_details;

CREATE OR REPLACE VIEW tennis.player_details
WITH (security_invoker = true)
AS
select
  p.id,
  pe.first_name,
  pe.last_name,
  pe.full_name,
  p.tour,
  pe.dob,
  pe.dod,
  case
    when c is null then null
    else to_jsonb(c)
  end as country,
  pe.birth_place,
  case
    when bc is null then null
    else to_jsonb(bc)
  end as birth_country,
  p.height,
  p.bh,
  p.rh,
  p.pm,
  p.hof,
  p.turned_pro,
  p.retired,
  (
    select
      jsonb_build_object('first', min(ed.year), 'last', max(ed.year))
    from
      tennis.player_entry_mapping pem
      join tennis.entries e on e.id = pem.entry_id
      join tennis.events ev on ev.id = e.event_id
      join tennis.editions ed on ed.id = ev.edition_id
    where
      pem.player_id = p.id
  ) as tournament_years,
  p.official_link,
  p.site_link,
  p.image_url,
  p.person_id,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          pcm.id,
          'coach_id',
          pcm.coach_id,
          'player_id',
          cp.id,
          'full_name',
          cpe.full_name,
          'icon',
          case
            when cc is null then 'flag:xx-4x3'
            else cc.icon
          end,
          'years',
          pcm.years,
          'status',
          pcm.status
        )
      )
    from
      tennis.player_coach_mapping pcm
      join tennis.people cpe on cpe.id = pcm.coach_id
      left join tennis.country cc on cc.id = cpe.nationality_id
      left join tennis.player cp on cp.person_id = cpe.id
    where
      pcm.player_id = p.id
  ) as coaches,
  (
    select
      jsonb_agg(
        jsonb_build_object(
          'id',
          pnm.id,
          'country',
          to_jsonb(pnmc),
          'start_date',
          pnm.start_date,
          'end_date',
          pnm.end_date
        )
      )
    from
      tennis.prev_nationality_mapping pnm
      join tennis.country pnmc on pnmc.id = pnm.country_id
    where
      pnm.player_id = p.id
  ) as prev_nationalities,
  (
    select
      r.rank
    from
      tennis.rankings r
    where
      r.player_id = p.id
      and r.match_type = 'Singles'
      and r.end_date >= current_date
    limit
      1
  ) as current_singles,
  (
    select
      r.rank
    from
      tennis.rankings r
    where
      r.player_id = p.id
      and r.match_type = 'Doubles'
      and r.end_date >= current_date
    limit
      1
  ) as current_doubles,
  (
    select
      jsonb_build_object('rank', r.rank, 'start_date', r.start_date, 'end_date', r.end_date)
    from
      tennis.rankings r
    where
      r.player_id = p.id
      and r.match_type = 'Singles'
    order by
      r.rank,
      r.start_date
    limit
      1
  ) as ch_singles,
  (
    select
      jsonb_build_object('rank', r.rank, 'start_date', r.start_date, 'end_date', r.end_date)
    from
      tennis.rankings r
    where
      r.player_id = p.id
      and r.match_type = 'Doubles'
    order by
      r.rank,
      r.start_date
    limit
      1
  ) as ch_doubles
from
  tennis.player p
  join tennis.people pe on pe.id = p.person_id
  left join tennis.country c on c.id = pe.nationality_id
  left join tennis.country bc on bc.id = pe.birth_country_id;

GRANT SELECT ON TABLE tennis.player_details TO anon, authenticated;
