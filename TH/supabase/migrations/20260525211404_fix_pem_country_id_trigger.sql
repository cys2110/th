-- Trigger function to set country_id for player_entry_mapping
CREATE OR REPLACE FUNCTION set_entry_country_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    event_date date;
BEGIN
    SELECT COALESCE(ev.start_date, ed.start_date)
    INTO event_date
    FROM entries e
    JOIN events ev ON ev.id = e.event_id
    LEFT JOIN editions ed ON ed.id = ev.edition_id
    WHERE e.id = NEW.entry_id;

    SELECT pcm.country_id
    INTO NEW.country_id
    FROM player_country_mapping pcm
    WHERE pcm.player_id = NEW.player_id
      AND (
          event_date IS NULL
          OR (
              COALESCE(pcm.start_date, '-infinity'::date) <= event_date
              AND COALESCE(pcm.end_date, 'infinity'::date) > event_date
          )
      )
    ORDER BY pcm.start_date DESC NULLS LAST
    LIMIT 1;

    RETURN NEW;
END;
$$;
