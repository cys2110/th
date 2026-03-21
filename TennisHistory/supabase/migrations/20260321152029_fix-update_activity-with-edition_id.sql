DROP FUNCTION IF EXISTS update_activity();

CREATE OR REPLACE FUNCTION update_activity(edition_id INTEGER)
RETURNS
void
LANGUAGE plpgsql
AS $$
BEGIN
    WITH event_entries AS (
        SELECT
            e.id,
            e.points,
            e.pm,
            e.match_type,
            e.event_id
        FROM entries e
        JOIN events ev ON ev.id = e.event_id
        WHERE ev.edition_id = update_activity.edition_id
    ),

    event_rounds AS (
        SELECT
            m.winner_id,
            m.loser_id,
            r.round,
            r.points AS round_points,
            r.pm AS round_pm,
            r.event_id,
            r.number AS round_number
        FROM rounds r
        JOIN matches m ON m.round_id = r.id
        JOIN events ev ON r.event_id = ev.id
        WHERE ev.edition_id = update_activity.edition_id
    ),
    entry_round_values AS (
        SELECT
            ee.id AS entry_id,
            er.round_points,
            er.round_pm,
            ee.match_type,
            ROW_NUMBER() OVER (PARTITION BY ee.id ORDER BY er.round_number ASC) AS rn
        FROM event_entries ee
        JOIN event_rounds er ON ee.event_id = er.event_id
        AND ((er.round = 'Final' AND ee.id = er.winner_id) OR (er.round <> 'Final' AND ee.id = er.loser_id))
    )

    UPDATE entries e
    SET
        points = erv.round_points,
        pm = CASE WHEN erv.match_type = 'Singles' THEN erv.round_pm ELSE erv.round_pm / 2 END
    FROM entry_round_values erv
    WHERE e.id = erv.entry_id
        AND erv.rn = 1;
END;
$$