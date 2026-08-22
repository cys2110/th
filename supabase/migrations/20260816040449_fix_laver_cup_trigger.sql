CREATE OR REPLACE FUNCTION tennis.create_laver_cup_rounds()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  edition_draw_type tennis.draw_type_enum;
BEGIN
  SELECT ed.draw_type
  INTO edition_draw_type
  FROM tennis.editions AS ed
  WHERE ed.id = NEW.edition_id;

  -- Create rounds for Laver Cup events
    IF edition_draw_type = 'Laver Cup' THEN
        INSERT INTO rounds (number, round, points, tour, draw, event_id)
        VALUES
        (1, 'Day 3', 3, 'ATP', 'Main', NEW.id),
        (2, 'Day 2', 2, 'ATP', 'Main', NEW.id),
        (3, 'Day 1', 1, 'ATP', 'Main', NEW.id);
    END IF;

  RETURN NEW;
END;
$$;