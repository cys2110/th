-- Trigger function to set country_id for player_entry_mapping

CREATE OR REPLACE FUNCTION set_entry_country_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    event_country text;
BEGIN
    -- Get country player represented at time of event
    SELECT pcm.country_id
    INTO event_country
    FROM player_country_mapping pcm
    JOIN entries e ON e.id = NEW.entry_id
    JOIN events ev ON ev.id = e.event_id
    JOIN editions ed ON ed.id = ev.edition_id
    WHERE pcm.player_id = NEW.player_id
    AND (
        (
            pcm.start_date <= COALESCE(ev.start_date, ed.start_date)
            AND pcm.end_date > COALESCE(ev.start_date, ed.start_date)
        )
        OR pcm.end_date IS NULL
    );

    SET NEW.country_id = event_country;

    RETURN NEW;
END;
$$;