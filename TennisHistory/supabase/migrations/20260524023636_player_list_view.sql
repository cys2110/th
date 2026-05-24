CREATE OR REPLACE view player_list_view AS
SELECT
    p.id,
    p.first_name,
    p.last_name,
    p.full_name,
    p.tour,
    p.turned_pro,
    p.retired,
    min(ed.year) AS first_tournament,
    max(ed.year) AS last_tournament,
    json_build_object('id', c.id, 'name', c.name, 'alpha_2', c.alpha_2, 'continent', c.continent) AS country
FROM players p
LEFT JOIN player_entry_mapping pem ON pem.player_id = p.id
LEFT JOIN entries e ON e.id = pem.entry_id
LEFT JOIN events ev ON ev.id = e.event_id
LEFT JOIN editions ed ON ed.id = ev.edition_id
LEFT JOIN player_country_mapping pcm ON pcm.player_id = p.id AND pcm.end_date IS NULL
LEFT JOIN countries c ON c.id = pcm.country_id
GROUP BY p.id, c.id;