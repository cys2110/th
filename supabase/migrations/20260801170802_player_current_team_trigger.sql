CREATE OR REPLACE FUNCTION football.update_player_current_team()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date IS NULL THEN
        UPDATE football.player p
        SET current_team_id = t.id
        FROM football.team t
        WHERE t.id = NEW.team_id
            AND p.id = NEW.player_id
            AND t.type = 'club';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_player_current_team_trigger
AFTER INSERT OR UPDATE ON football.player_team_tenure
FOR EACH ROW
EXECUTE FUNCTION football.update_player_current_team();
