-- Subtract standing stats when a match is deleted
CREATE OR REPLACE FUNCTION football.subtract_standing_stats()
RETURNS TRIGGER AS $$
DECLARE
    home_points integer;
    away_points integer;
    v_win_points integer;
    v_draw_points integer;
    v_loss_points integer;
BEGIN
    IF OLD.status <> 'full_time'
       OR OLD.home_score IS NULL
       OR OLD.away_score IS NULL THEN
        RETURN OLD;
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
    WHERE s.id = OLD.season_id;

    IF OLD.home_score > OLD.away_score THEN
        home_points := v_win_points;
        away_points := v_loss_points;

    ELSIF OLD.home_score < OLD.away_score THEN
        home_points := v_loss_points;
        away_points := v_win_points;

    ELSE
        home_points := v_draw_points;
        away_points := v_draw_points;
    END IF;

    -- Home team standing

    UPDATE football.standing
    SET
        played = played - 1,
        won = won - CASE WHEN OLD.home_score > OLD.away_score THEN 1 ELSE 0 END,
        drawn = drawn - CASE WHEN OLD.home_score = OLD.away_score THEN 1 ELSE 0 END,
        lost = lost - CASE WHEN OLD.home_score < OLD.away_score THEN 1 ELSE 0 END,
        goals_for = goals_for - OLD.home_score,
        goals_against = goals_against - OLD.away_score,
        goal_difference = goal_difference - (OLD.home_score - OLD.away_score),
        points = points - home_points
    WHERE season_id = OLD.season_id
      AND team_id = OLD.home_team_id
      AND group_id IS NOT DISTINCT FROM OLD.group_id;

    -- Away team standing

    UPDATE football.standing
    SET
        played = played - 1,
        won = won - CASE WHEN OLD.away_score > OLD.home_score THEN 1 ELSE 0 END,
        drawn = drawn - CASE WHEN OLD.away_score = OLD.home_score THEN 1 ELSE 0 END,
        lost = lost - CASE WHEN OLD.away_score < OLD.home_score THEN 1 ELSE 0 END,
        goals_for = goals_for - OLD.away_score,
        goals_against = goals_against - OLD.home_score,
        goal_difference = goal_difference - (OLD.away_score - OLD.home_score),
        points = points - away_points
    WHERE season_id = OLD.season_id
      AND team_id = OLD.away_team_id
      AND group_id IS NOT DISTINCT FROM OLD.group_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subtract_standing_stats_after_match
BEFORE DELETE ON football.match
FOR EACH ROW
EXECUTE FUNCTION football.subtract_standing_stats();
