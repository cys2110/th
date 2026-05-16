CREATE OR REPLACE FUNCTION create_laver_cup_rounds()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    edition_draw_type draws_enum;
BEGIN
    -- Get draw type of event's edition
    SELECT ed.draw_type
    INTO edition_draw_type
    FROM editions ed
    WHERE ed.id = NEW.edition_id;

    -- Create rounds for Laver Cup events
    IF edition_draw_type = 'Laver Cup' THEN
        INSERT INTO rounds (number, round, points, tour, draw, event_id)
        VALUES
        (3, 'Day 3', 3, 'ATP', 'Main', NEW.id),
        (2, 'Day 2', 2, 'ATP', 'Main', NEW.id),
        (1, 'Day 1', 1, 'ATP', 'Main', NEW.id);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_laver_cup_rounds_trigger ON events;
CREATE TRIGGER create_laver_cup_rounds_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_laver_cup_rounds();