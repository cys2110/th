DROP VIEW IF EXISTS public.laver_cup_winners;

CREATE OR REPLACE VIEW tennis.laver_cup_winners
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