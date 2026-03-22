DROP FUNCTION IF EXISTS search_players(search_term text);

create or replace function search_players(search_term text)
returns table (
    id text,
    first_name text,
    last_name text,
    country jsonb
)
language sql
stable
as $$
  select
    p.id,
    p.first_name,
    p.last_name,
    to_jsonb(c) AS country
  from players p
  JOIN player_country_mapping pcm ON pcm.player_id = p.id
  JOIN countries c ON c.id = pcm.country_id
  where (first_name ilike '%' || trim(search_term) || '%'
     or last_name ilike '%' || trim(search_term) || '%'
     or trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
        ilike '%' || trim(search_term) || '%')
    AND pcm.end_date IS NULL;
$$;