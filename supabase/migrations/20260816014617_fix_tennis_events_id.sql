BEGIN;

-- These views depend on columns whose types are changed below. PostgreSQL does
-- not allow a referenced column's type to change while dependent views exist.
DROP VIEW IF EXISTS tennis.elimination_winners;
DROP VIEW IF EXISTS tennis.country_winners;
DROP VIEW IF EXISTS tennis.laver_cup_winners;

-- Foreign keys must be removed while the parent and child columns are changed
-- from text to uuid. No rows or tables are removed.
ALTER TABLE tennis.event_supervisor_mapping
    DROP CONSTRAINT event_supervisor_mapping_event_id_fkey;
ALTER TABLE tennis.entries
    DROP CONSTRAINT entries_event_id_fkey;
ALTER TABLE tennis.seeds
    DROP CONSTRAINT seeds_event_id_fkey;
ALTER TABLE tennis.ldas
    DROP CONSTRAINT ldas_event_id_fkey;
ALTER TABLE tennis.withdrawals
    DROP CONSTRAINT withdrawals_event_id_fkey;
ALTER TABLE tennis.retirements
    DROP CONSTRAINT retirements_event_id_fkey;
ALTER TABLE tennis.walkovers
    DROP CONSTRAINT walkovers_event_id_fkey;
ALTER TABLE tennis.defaults
    DROP CONSTRAINT defaults_event_id_fkey;
ALTER TABLE tennis.entry_status
    DROP CONSTRAINT entry_status_event_id_fkey;
ALTER TABLE tennis.rounds
    DROP CONSTRAINT rounds_event_id_fkey;

ALTER TABLE tennis.events
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE tennis.event_supervisor_mapping
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.entries
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.seeds
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.ldas
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.withdrawals
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.retirements
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.walkovers
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.defaults
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.entry_status
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;
ALTER TABLE tennis.rounds
    ALTER COLUMN event_id TYPE uuid USING event_id::uuid;

ALTER TABLE tennis.event_supervisor_mapping
    ADD CONSTRAINT event_supervisor_mapping_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.entries
    ADD CONSTRAINT entries_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.seeds
    ADD CONSTRAINT seeds_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.ldas
    ADD CONSTRAINT ldas_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.withdrawals
    ADD CONSTRAINT withdrawals_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.retirements
    ADD CONSTRAINT retirements_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.walkovers
    ADD CONSTRAINT walkovers_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.defaults
    ADD CONSTRAINT defaults_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.entry_status
    ADD CONSTRAINT entry_status_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.rounds
    ADD CONSTRAINT rounds_event_id_fkey
    FOREIGN KEY (event_id) REFERENCES tennis.events(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- This trigger function stores an event id in a local variable, so its type
-- must change along with tennis.events.id and tennis.rounds.event_id.
CREATE OR REPLACE FUNCTION tennis.update_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    match_points numeric;
    match_pm numeric;
    match_event_id uuid;

    win_round_id uuid;
    win_points numeric;
    win_pm numeric;
BEGIN
    IF TG_OP = 'UPDATE' THEN
        IF OLD.loser_id IS NOT NULL AND OLD.winner_id IS NOT NULL THEN
            RETURN NEW;
        END IF;
    END IF;

    IF NEW.loser_id IS NULL AND NEW.winner_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT r.points, r.pm, r.event_id
    INTO match_points, match_pm, match_event_id
    FROM tennis.rounds r
    WHERE r.id = NEW.round_id;

    SELECT r.points, r.pm, r.id
    INTO win_points, win_pm, win_round_id
    FROM tennis.rounds r
    WHERE r.round = 'Win'
      AND r.event_id = match_event_id
      AND r.tour = NEW.tour
      AND r.match_type = NEW.match_type;

    IF NEW.loser_id IS NOT NULL THEN
        UPDATE tennis.entries e
        SET
            points = match_points,
            pm = CASE
                WHEN e.match_type = 'Singles' THEN ROUND(match_pm::numeric, 2)
                ELSE ROUND(match_pm::numeric / 2, 2)
            END
        WHERE e.id = NEW.loser_id;
    END IF;

    IF NEW.winner_id IS NOT NULL AND NEW.round_id = win_round_id THEN
        UPDATE tennis.entries e
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

CREATE VIEW tennis.country_winners
WITH (security_invoker = true)
AS
SELECT
    ed.tournament_id,
    ed.year,
    ed.id AS edition_id,
    te.country_id,
    COALESCE(ed.end_date, e.end_date) AS end_date
FROM tennis.editions ed
LEFT JOIN tennis.events e ON ed.id = e.edition_id
LEFT JOIN tennis.rounds r ON e.id = r.event_id AND r.round = 'Final'
LEFT JOIN tennis.ties t ON r.id = t.round_id
LEFT JOIN tennis.entries te ON te.id = t.winner_id
WHERE ed.draw_type = 'Country draw'::tennis.draw_type_enum;

CREATE VIEW tennis.laver_cup_winners
WITH (security_invoker = true)
AS
SELECT
    ed.id,
    ed.year,
    COALESCE(ed.end_date, e.end_date) AS end_date,
    en.team_name
FROM tennis.editions ed
JOIN tennis.events e ON ed.id = e.edition_id
LEFT JOIN tennis.entries en ON e.id = en.event_id
WHERE ed.draw_type = 'Laver Cup'::tennis.draw_type_enum
  AND en.points > 12;

CREATE VIEW tennis.elimination_winners
WITH (security_invoker = true)
AS
SELECT
    ed.tournament_id,
    ed.year,
    ed.edition_no,
    e.tour,
    r.match_type,
    m.winner_id,
    COALESCE(ed.end_date, e.end_date) AS end_date
FROM tennis.editions ed
LEFT JOIN tennis.events e ON ed.id = e.edition_id
LEFT JOIN tennis.rounds r ON e.id = r.event_id AND r.round = 'Final'
LEFT JOIN tennis.matches m ON r.id = m.round_id;

COMMIT;
