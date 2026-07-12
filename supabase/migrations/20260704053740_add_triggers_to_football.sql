DROP TRIGGER IF EXISTS update_player_current_team_trigger ON football.player_team_tenure;
DROP FUNCTION IF EXISTS football.update_player_current_team();

DROP TRIGGER IF EXISTS update_player_current_position_trigger ON football.squad_player;
DROP FUNCTION IF EXISTS football.update_player_current_position();

-- Update player's current team from active tenure
CREATE OR REPLACE FUNCTION football.update_player_current_team()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NULL AND NEW.end_year IS NULL THEN
        UPDATE football.player
        SET current_team_id = NEW.team_id
        WHERE id = NEW.player_id
          AND current_team_id IS DISTINCT FROM NEW.team_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_current_team_trigger
AFTER INSERT OR UPDATE ON football.player_team_tenure
FOR EACH ROW
EXECUTE FUNCTION football.update_player_current_team();


-- Update player's current position from active season squad record
CREATE OR REPLACE FUNCTION football.update_player_current_position()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.position IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM football.season s
           WHERE s.id = NEW.season_id
             AND s.end_date > CURRENT_DATE
       )
    THEN
        UPDATE football.player
        SET current_position = NEW.position
        WHERE id = NEW.player_id
          AND current_position IS DISTINCT FROM NEW.position;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_current_position_trigger
AFTER INSERT OR UPDATE ON football.squad_player
FOR EACH ROW
EXECUTE FUNCTION football.update_player_current_position();