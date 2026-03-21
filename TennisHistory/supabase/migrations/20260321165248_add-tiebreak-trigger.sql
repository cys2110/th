CREATE OR REPLACE FUNCTION update_tiebreaks()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    other_tb integer;
BEGIN
    -- Only run for rows where set = 7 and tb is null
    IF NEW."set" = 7 AND NEW.tb IS NULL THEN
        SELECT ms.tb
        INTO other_tb
        FROM match_scores ms
        WHERE ms.match_id = NEW.match_id
          AND ms.set_no   = NEW.set_no
          AND ms.entry_id <> NEW.entry_id
        LIMIT 1;

        -- If the matching opponent row exists and has a tb value
        IF other_tb IS NOT NULL THEN
            IF other_tb <= 5 THEN
                NEW.tb := 7;
            ELSE
                NEW.tb := other_tb + 2;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tiebreak_trigger ON match_scores;

CREATE TRIGGER tiebreak_trigger
BEFORE INSERT ON match_scores
FOR EACH ROW
EXECUTE FUNCTION update_tiebreaks();