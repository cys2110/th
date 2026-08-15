-- Update standing stats when match is added
CREATE OR REPLACE FUNCTION football.update_standing_stats()
RETURNS TRIGGER AS $$
DECLARE
    home_points integer;
    away_points integer;
    v_win_points integer;
    v_draw_points integer;
    v_loss_points integer;
BEGIN
-- Only count completed/played matches
    IF TG_OP = 'UPDATE' THEN
        -- Already processed
        IF OLD.status = 'full_time' AND NEW.status = 'full_time' THEN
            RETURN NEW;
        END IF;
    END IF;

    IF NEW.status <> 'full_time' THEN
        RETURN NEW;
    END IF;

    IF NEW.home_score IS NULL OR NEW.away_score IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT
        s.win_points,
        s.draw_points,
        s.loss_points

    INTO
        v_win_points,
        v_draw_points,
        v_loss_points
    FROM football.season s
    WHERE s.id = NEW.season_id;

    IF NEW.home_score > NEW.away_score THEN
        home_points := v_win_points;
        away_points := v_loss_points;

    ELSIF NEW.home_score < NEW.away_score THEN
        home_points := v_loss_points;
        away_points := v_win_points;

    ELSE
        home_points := v_draw_points;
        away_points := v_draw_points;
    END IF;

    -- Home team standing

    UPDATE football.standing
    SET
        played = played + 1,
        won = won + CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END,
        drawn = drawn + CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END,
        lost = lost + CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END,
        goals_for = goals_for + NEW.home_score,
        goals_against = goals_against + NEW.away_score,
        goal_difference = goal_difference + (NEW.home_score - NEW.away_score),
        points = points + home_points
    WHERE season_id = NEW.season_id
      AND team_id = NEW.home_team_id
      AND group_id IS NOT DISTINCT FROM NEW.group_id;

    -- Away team standing

    UPDATE football.standing
    SET
        played = played + 1,
        won = won + CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END,
        drawn = drawn + CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END,
        lost = lost + CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END,
        goals_for = goals_for + NEW.away_score,
        goals_against = goals_against + NEW.home_score,
        goal_difference = goal_difference + (NEW.away_score - NEW.home_score),
        points = points + away_points
    WHERE season_id = NEW.season_id
      AND team_id = NEW.away_team_id
      AND group_id IS NOT DISTINCT FROM NEW.group_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_standing_stats_after_match
AFTER INSERT OR UPDATE OF status, home_score, away_score ON football.match
FOR EACH ROW
EXECUTE FUNCTION football.update_standing_stats();