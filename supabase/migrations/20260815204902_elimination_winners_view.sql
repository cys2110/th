DROP VIEW IF EXISTS tennis.elimination_winners;

CREATE OR REPLACE VIEW tennis.elimination_winners
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