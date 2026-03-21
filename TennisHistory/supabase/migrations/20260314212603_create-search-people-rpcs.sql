create or replace function search_people(search_term text)
returns setof people
language sql
stable
as $$
  select *
  from people
  where first_name ilike '%' || trim(search_term) || '%'
     or last_name ilike '%' || trim(search_term) || '%'
     or trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
        ilike '%' || trim(search_term) || '%';
$$;

create or replace function search_players(search_term text)
returns setof players
language sql
stable
as $$
  select *
  from players
  where first_name ilike '%' || trim(search_term) || '%'
     or last_name ilike '%' || trim(search_term) || '%'
     or trim(coalesce(first_name, '') || ' ' || coalesce(last_name, ''))
        ilike '%' || trim(search_term) || '%';
$$;