DROP VIEW IF EXISTS public.country_winners;

CREATE OR REPLACE VIEW tennis.country_winners
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