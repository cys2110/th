BEGIN;

-- These views depend on columns whose types are changed below. PostgreSQL does
-- not allow a referenced column's type to change while dependent views exist.
DROP VIEW IF EXISTS tennis.elimination_winners;
DROP VIEW IF EXISTS tennis.country_winners;
DROP VIEW IF EXISTS tennis.laver_cup_winners;

-- These triggers explicitly name columns changed below in UPDATE OF clauses.
-- PostgreSQL records those columns as trigger dependencies, so the triggers
-- must be recreated around the type change. Their functions use NEW/OLD row
-- fields and remain valid for uuid columns.
DROP TRIGGER update_match_entry_ids_trigger ON tennis.matches;
DROP TRIGGER update_activity_trigger ON tennis.matches;

-- Foreign keys must be removed while the parent and child columns are changed
-- from text to uuid. No rows or tables are removed.
ALTER TABLE tennis.player_entry_mapping
    DROP CONSTRAINT player_entry_mapping_entry_id_fkey;
ALTER TABLE tennis.seeds
    DROP CONSTRAINT seeds_entry_id_fkey;
ALTER TABLE tennis.ldas
    DROP CONSTRAINT ldas_entry_id_fkey;
ALTER TABLE tennis.withdrawals
    DROP CONSTRAINT withdrawals_entry_id_fkey;
ALTER TABLE tennis.retirements
    DROP CONSTRAINT retirements_entry_id_fkey;
ALTER TABLE tennis.walkovers
    DROP CONSTRAINT walkovers_entry_id_fkey;
ALTER TABLE tennis.defaults
    DROP CONSTRAINT defaults_entry_id_fkey;
ALTER TABLE tennis.entry_status
    DROP CONSTRAINT entry_status_entry_id_fkey;
ALTER TABLE tennis.ties
    DROP CONSTRAINT ties_country_1_id_fkey,
    DROP CONSTRAINT ties_country_2_id_fkey,
    DROP CONSTRAINT ties_winner_id_fkey,
    DROP CONSTRAINT ties_loser_id_fkey;
ALTER TABLE tennis.matches
    DROP CONSTRAINT matches_team_1_id_fkey,
    DROP CONSTRAINT matches_team_2_id_fkey,
    DROP CONSTRAINT matches_winner_id_fkey,
    DROP CONSTRAINT matches_loser_id_fkey;
ALTER TABLE tennis.match_stats
    DROP CONSTRAINT match_stats_entry_id_fkey;
ALTER TABLE tennis.match_scores
    DROP CONSTRAINT match_scores_entry_id_fkey;

ALTER TABLE tennis.entries
    ALTER COLUMN id TYPE uuid USING id::uuid,
    ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE tennis.player_entry_mapping
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.seeds
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.ldas
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.withdrawals
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.retirements
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.walkovers
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.defaults
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.entry_status
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.ties
    ALTER COLUMN country_1_id TYPE uuid USING country_1_id::uuid,
    ALTER COLUMN country_2_id TYPE uuid USING country_2_id::uuid,
    ALTER COLUMN winner_id TYPE uuid USING winner_id::uuid,
    ALTER COLUMN loser_id TYPE uuid USING loser_id::uuid;
ALTER TABLE tennis.matches
    ALTER COLUMN team_1_id TYPE uuid USING team_1_id::uuid,
    ALTER COLUMN team_2_id TYPE uuid USING team_2_id::uuid,
    ALTER COLUMN winner_id TYPE uuid USING winner_id::uuid,
    ALTER COLUMN loser_id TYPE uuid USING loser_id::uuid;
ALTER TABLE tennis.match_stats
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;
ALTER TABLE tennis.match_scores
    ALTER COLUMN entry_id TYPE uuid USING entry_id::uuid;

ALTER TABLE tennis.player_entry_mapping
    ADD CONSTRAINT player_entry_mapping_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.seeds
    ADD CONSTRAINT seeds_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.ldas
    ADD CONSTRAINT ldas_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.withdrawals
    ADD CONSTRAINT withdrawals_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.retirements
    ADD CONSTRAINT retirements_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.walkovers
    ADD CONSTRAINT walkovers_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.defaults
    ADD CONSTRAINT defaults_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.entry_status
    ADD CONSTRAINT entry_status_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.ties
    ADD CONSTRAINT ties_country_1_id_fkey
        FOREIGN KEY (country_1_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT ties_country_2_id_fkey
        FOREIGN KEY (country_2_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT ties_winner_id_fkey
        FOREIGN KEY (winner_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT ties_loser_id_fkey
        FOREIGN KEY (loser_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.matches
    ADD CONSTRAINT matches_team_1_id_fkey
        FOREIGN KEY (team_1_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT matches_team_2_id_fkey
        FOREIGN KEY (team_2_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT matches_winner_id_fkey
        FOREIGN KEY (winner_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    ADD CONSTRAINT matches_loser_id_fkey
        FOREIGN KEY (loser_id) REFERENCES tennis.entries(id)
        ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.match_stats
    ADD CONSTRAINT match_stats_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE tennis.match_scores
    ADD CONSTRAINT match_scores_entry_id_fkey
    FOREIGN KEY (entry_id) REFERENCES tennis.entries(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

CREATE TRIGGER update_match_entry_ids_trigger
BEFORE INSERT OR UPDATE OF team_1_id, team_2_id, winner_id, loser_id
ON tennis.matches
FOR EACH ROW
EXECUTE FUNCTION tennis.update_match_entries();

CREATE TRIGGER update_activity_trigger
AFTER INSERT OR UPDATE OF winner_id, loser_id, round_id
ON tennis.matches
FOR EACH ROW
EXECUTE FUNCTION tennis.update_activity();

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

ALTER TABLE tennis.player_entry_mapping
ADD COLUMN player_order INT NOT NULL DEFAULT 1;
