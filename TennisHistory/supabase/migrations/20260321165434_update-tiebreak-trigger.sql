CREATE OR REPLACE FUNCTION update_tiebreaks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    other_row record;
    derived_other_tb integer;
BEGIN
    SELECT ms."set", ms.tb, ms.id
    INTO other_row
    FROM match_scores ms
    WHERE ms.match_id = NEW.match_id
      AND ms.set_no   = NEW.set_no
      AND ms.entry_id <> NEW.entry_id
    LIMIT 1;

    IF NEW."set" = 7 AND NEW.tb IS NULL THEN
        IF other_tb IS NOT NULL THEN
            IF other_tb <= 5 THEN
                NEW.tb := 7;
            ELSE
                NEW.tb := other_tb + 2;
            END IF;
        END IF;
    END IF;

    IF NEW.tb IS NOT NULL AND other_row.tb IS NULL THEN
        derived_other_tb := CASE WHEN NEW.tb <= 5 THEN 7 ELSE NEW.tb + 2 END;

        UPDATE match_scores ms
        SET tb = derived_other_tb
        WHERE ms.id = other_row.id;
    END IF;

    RETURN NEW;
END;
$$;