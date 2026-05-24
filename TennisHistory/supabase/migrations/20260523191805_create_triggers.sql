-- Trigger to create record in users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        username,
        first_name,
        last_name
    )
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );

    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tournaments updated_at
CREATE TRIGGER trigger_tournament_updated_at
BEFORE INSERT OR UPDATE ON tournaments
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Trigger for players updated_at
CREATE TRIGGER trigger_player_updated_at
BEFORE INSERT OR UPDATE ON players
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Trigger for editions updated_at
CREATE TRIGGER trigger_edition_updated_at
BEFORE INSERT OR UPDATE ON editions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Trigger for events updated_at
CREATE TRIGGER trigger_event_updated_at
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- Trigger function to create rounds for Laver Cup events (can automatically create rounds since they will be the same for each event)
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

-- Trigger to create rounds for Laver Cup events
CREATE TRIGGER create_laver_cup_rounds_trigger
AFTER INSERT ON events
FOR EACH ROW
EXECUTE FUNCTION create_laver_cup_rounds();

-- Trigger function to set country_id for player_entry_mapping
CREATE OR REPLACE FUNCTION set_entry_country_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    event_country text;
BEGIN
    -- Get country player represented at time of event
    SELECT pcm.country_id
    INTO event_country
    FROM player_country_mapping pcm
    JOIN events ev ON ev.id = NEW.event_id
    JOIN editions ed ON ed.id = ev.edition_id
    WHERE pcm.player_id = NEW.player_id
    AND (
        (
            pcm.start_date <= COALESCE(ev.start_date, ed.start_date)
            AND pcm.end_date > COALESCE(ev.start_date, ed.start_date)
        )
        OR pcm.end_date IS NULL
    );

    SET NEW.country_id = event_country;

    RETURN NEW;
END;
$$;

-- Trigger to set country_id for player_entry_mapping
CREATE TRIGGER set_entry_country_id_trigger
BEFORE INSERT ON player_entry_mapping
FOR EACH ROW
EXECUTE FUNCTION set_entry_country_id();

-- Trigger function to update winner on bye matches
CREATE OR REPLACE FUNCTION update_bye_winners()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.incomplete = 'B' AND NEW.winner_id IS NULL AND (NEW.team_1_id IS NOT NULL OR NEW.team_2_id IS NOT NULL) THEN
        NEW.winner_id := CASE
            WHEN NEW.team_1_id IS NOT NULL THEN NEW.team_1_id
            WHEN NEW.team_2_id IS NOT NULL THEN NEW.team_2_id
            ELSE NEW.winner_id
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Trigger to update winner on bye matches
CREATE TRIGGER update_bye_winners_trigger
BEFORE INSERT OR UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_bye_winners();

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

CREATE TRIGGER update_match_entry_ids_trigger
BEFORE INSERT OR UPDATE OF team_1_id, team_2_id, winner_id, loser_id
ON matches
FOR EACH ROW
EXECUTE FUNCTION update_match_entries();

-- Trigger function to update tiebreaks
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
        IF other_row.tb IS NOT NULL THEN
            IF other_row.tb <= 5 THEN
                NEW.tb := 7;
            ELSE
                NEW.tb := other_row.tb + 2;
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

-- Trigger to update tiebreak
CREATE TRIGGER tiebreak_trigger
BEFORE INSERT ON match_scores
FOR EACH ROW
EXECUTE FUNCTION update_tiebreaks();

CREATE OR REPLACE FUNCTION update_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    match_points numeric;
    match_pm numeric;
    match_event_id text;

    win_round_id uuid;
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

    SELECT r.points, r.pm, r.id
    INTO win_points, win_pm, win_round_id
    FROM rounds r
    WHERE r.round = 'Win'
      AND r.event_id = match_event_id
      AND r.tour = NEW.tour
      AND r.match_type = NEW.match_type;

    IF NEW.loser_id IS NOT NULL THEN
        UPDATE entries e
        SET
            points = match_points,
            pm = CASE
                WHEN e.match_type = 'Singles' THEN ROUND(match_pm::numeric, 2)
                ELSE ROUND(match_pm::numeric / 2, 2)
            END
        WHERE e.id = NEW.loser_id;
    END IF;

    IF NEW.winner_id IS NOT NULL AND NEW.round_id = win_round_id THEN
        UPDATE entries e
        SET
            points = win_points,
            pm = CASE
                WHEN e.match_type = 'Singles' THEN ROUND(match_pm::numeric, 2)
                ELSE ROUND(match_pm::numeric / 2, 2)
            END
        WHERE e.id = NEW.winner_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER update_activity_trigger
AFTER INSERT OR UPDATE OF winner_id, loser_id, round_id
ON matches
FOR EACH ROW
EXECUTE FUNCTION update_activity();
