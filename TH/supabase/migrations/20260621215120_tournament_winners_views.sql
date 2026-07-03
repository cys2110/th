DROP VIEW IF EXISTS country_winners;
DROP VIEW IF EXISTS elimination_winners;

CREATE OR REPLACE VIEW country_winners
WITH (security_invoker = true)
AS
SELECT
    ed.tournament_id,
    ed.year,
    ed.id AS edition_id,
    te.country_id,
    COALESCE(ed.end_date, e.end_date) AS end_date
FROM editions ed
LEFT JOIN events e ON ed.id = e.edition_id
LEFT JOIN rounds r ON e.id = r.event_id AND r.round = 'Final'
LEFT JOIN ties t ON r.id = t.round_id
LEFT JOIN entries te ON te.id = t.winner_id
WHERE ed.tournament_id IN (8888, 615, 9900);

CREATE OR REPLACE VIEW elimination_winners
WITH (security_invoker = true)
AS
SELECT
    ed.tournament_id,
    ed.year,
    ed.id AS edition_id,
    e.tour,
    r.match_type,
    CASE
        WHEN m.winner_id IS NULL THEN '[]'::jsonb
        ELSE jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'first_name', p.first_name,
                'last_name', p.last_name,
                'full_name', p.full_name,
                'country', to_jsonb(c)
            )
            ORDER BY
                CASE
                    WHEN p.id::text = (string_to_array(m.winner_id, ' '))[2]
                    THEN 1
                    ELSE 2
                END
        )
    END AS team,
    COALESCE(ed.end_date, e.end_date) AS end_date

FROM editions ed
LEFT JOIN events e ON ed.id = e.edition_id
LEFT JOIN rounds r ON e.id = r.event_id AND r.round = 'Final'
LEFT JOIN matches m ON r.id = m.round_id
LEFT JOIN player_entry_mapping pem ON pem.entry_id = m.winner_id
LEFT JOIN countries c ON c.id = pem.country_id
LEFT JOIN players p ON p.id = pem.player_id
GROUP BY ed.id, e.id, r.match_type, m.winner_id;