CREATE OR REPLACE FUNCTION update_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    match_points numeric;
    match_pm numeric;
    match_event_id text;

    win_points numeric;
    win_pm numeric;
BEGIN
    -- For updates, only run if winner_id or loser_id were previously null
    IF TG_OP = 'UPDATE' THEN
        IF OLD.loser_id IS NOT NULL AND OLD.winner_id IS NOT NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    -- Skip if there is nothing to update
    IF NEW.loser_id IS NULL AND NEW.winner_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT r.points, r.pm, r.event_id
    INTO match_points, match_pm, match_event_id
    FROM rounds r
    WHERE r.id = NEW.round_id;

    SELECT r.points, r.pm
    INTO win_points, win_pm
    FROM rounds r
    WHERE r.round = 'Win'
      AND r.event_id = match_event_id;

    IF NEW.loser_id IS NOT NULL THEN
        UPDATE entries e
        SET
            points = match_points,
            pm = CASE
                    WHEN e.match_type = 'Singles' THEN match_pm
                    ELSE match_pm / 2
                 END
        WHERE e.id = NEW.loser_id;
    END IF;

    IF NEW.winner_id IS NOT NULL THEN
        UPDATE entries e
        SET
            points = win_points,
            pm = CASE
                    WHEN e.match_type = 'Singles' THEN win_pm
                    ELSE win_pm / 2
                 END
        WHERE e.id = NEW.winner_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_activity_trigger ON matches;

CREATE TRIGGER update_activity_trigger
AFTER INSERT OR UPDATE OF winner_id, loser_id, round_id
ON matches
FOR EACH ROW
EXECUTE FUNCTION update_activity();