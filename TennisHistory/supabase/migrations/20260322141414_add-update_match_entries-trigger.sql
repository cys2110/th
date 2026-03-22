CREATE OR REPLACE FUNCTION update_match_entries()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Skip if there is nothing to update
    IF NEW.team_1_id IS NULL OR NEW.team_2_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Skip if winner_id and loser_id are already set
    IF NEW.winner_id IS NOT NULL AND NEW.loser_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    -- If winner is known but loser is missing, derive loser
    IF NEW.winner_id IS NOT NULL AND NEW.loser_id IS NULL THEN
        NEW.loser_id := CASE
            WHEN NEW.winner_id = NEW.team_1_id THEN NEW.team_2_id
            WHEN NEW.winner_id = NEW.team_2_id THEN NEW.team_1_id
            ELSE NEW.loser_id
        END;
    END IF;

    -- If loser is known but winner is missing, derive winner
    IF NEW.loser_id IS NOT NULL AND NEW.winner_id IS NULL THEN
        NEW.winner_id := CASE
            WHEN NEW.loser_id = NEW.team_1_id THEN NEW.team_2_id
            WHEN NEW.loser_id = NEW.team_2_id THEN NEW.team_1_id
            ELSE NEW.winner_id
        END;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_match_entry_ids_trigger ON matches;

CREATE TRIGGER update_match_entry_ids_trigger
BEFORE INSERT OR UPDATE OF team_1_id, team_2_id, winner_id, loser_id
ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_entries();