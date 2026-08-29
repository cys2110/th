DROP VIEW IF EXISTS tennis.entries_by_player;

CREATE OR REPLACE VIEW tennis.entries_by_player
WITH (security_invoker = true)
AS
  with
  entry_data as (
    select
      ed.tournament_id,
      ed.year,
      ed.edition_no,
      coalesce(ed.currency, ev.currency) as currency,
      pem.id,
      pem.player_id,
      p.image_url,
      pe.first_name,
      pe.last_name,
      pe.full_name,
      pem.country_id,
      e.id as entry_id,
      e.points,
      e.pm,
      e.match_type,
      pem.rank,
      case
        when w.entry_id is null then false
        else true
      end as withdrawn,
      case
        when s.seed is null then null
        when s.draw = 'Main' then s.seed::text
        else 'Q-' || s.seed::text
      end as seed,
      (
        select
          array_agg(
            case
              when es.draw = 'Main' then es.status::text
              else 'Q-' || es.status::text
            end
          )
        from
          tennis.entry_status es
        where
          es.entry_id = e.id
      ) as status,
      exists (
        select
          1
        from
          tennis.matches m
        where
          m.draw = 'Main'
          and (
            m.team_1_id = e.id
            or m.team_2_id = e.id
          )
      ) as main_draw,
      exists (
        select
          1
        from
          tennis.matches m
        where
          m.draw = 'Qualifying'
          and (
            m.team_1_id = e.id
            or m.team_2_id = e.id
          )
      ) as qual_draw,
      ev.tour
    from
      tennis.player_entry_mapping pem
      join tennis.player p on p.id = pem.player_id
      join tennis.people pe on pe.id = p.person_id
      join tennis.entries e on pem.entry_id = e.id
      join tennis.events ev on ev.id = e.event_id
      join tennis.editions ed on ed.id = ev.edition_id
      left join tennis.withdrawals w on w.entry_id = e.id
      left join tennis.seeds s on s.entry_id = e.id
  )
select
  tournament_id,
  year,
  edition_no,
  currency,
  player_id,
  full_name,
  country_id,
  tour,
  (
    jsonb_agg(
      jsonb_build_object(
        'entry_id',
        entry_id,
        'rank',
        rank,
        'points',
        points,
        'pm',
        pm,
        'withdrawn',
        withdrawn,
        'seed',
        seed,
        'status',
        status,
        'main_draw',
        main_draw,
        'qual_draw',
        qual_draw
      )
    ) filter (
      where
        match_type = 'Singles'
    )
  ) -> 0 as singles_entry,
  (
    jsonb_agg(
      jsonb_build_object(
        'entry_id',
        entry_id,
        'rank',
        rank,
        'points',
        points,
        'pm',
        pm,
        'withdrawn',
        withdrawn,
        'seed',
        seed,
        'status',
        status,
        'main_draw',
        main_draw,
        'qual_draw',
        qual_draw
      )
    ) filter (
      where
        match_type = 'Doubles'
    )
  ) -> 0 as doubles_entry
from
  entry_data
group by
  tournament_id,
  year,
  edition_no,
  currency,
  player_id,
  country_id,
  first_name,
  last_name,
  full_name,
  tour
order by
  last_name,
  first_name,
  player_id;;

GRANT SELECT ON TABLE tennis.entries_by_player TO anon, authenticated;
