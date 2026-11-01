create or replace function tennis.update_captain_id()
returns trigger
language plpgsql
as $$
begin
    if NEW.captain is not null then
        select p.person_id
        into NEW.captain_id
        from tennis.player p
        where p.id = NEW.captain;
    end if;

    return new;
end;
$$;

create trigger update_captain_id
before insert or update of captain on tennis.entries
for each row
execute function tennis.update_captain_id();
