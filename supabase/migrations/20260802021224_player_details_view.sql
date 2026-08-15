CREATE OR REPLACE VIEW football.player_details
WITH (security_invoker = true)
AS
SELECT
    p.id,
    pe.first_name,
    pe.last_name,
    pe.full_name,
    p.aka,
    CASE WHEN p.aka IS NULL THEN pe.full_name ELSE p.aka END AS label,
    lower(extensions.unaccent(concat_ws(' ', p.aka, pe.full_name))) AS search_text,
    pe.nationality_country_id,
    c.icon,
    pe.dob,
    pe.dod,
    p.height_cm,
    p.preferred_foot,
    pe.birth_place,
    pe.birth_country_id,
    c2.icon AS birth_country_icon,
    c2.name AS birth_country,
    p.current_team_id AS team_id,
    CASE WHEN t.short_name IS NULL THEN t.name ELSE t.short_name END AS team_name,
    t.logo_url AS team_logo,
    p.position,
    pe.id AS person_id
FROM football.player p
JOIN football.people pe ON pe.id = p.person_id
JOIN football.country c ON c.id = pe.nationality_country_id
JOIN football.country c2 ON c2.id = pe.birth_country_id
LEFT JOIN football.team t ON t.id = p.current_team_id;

GRANT SELECT ON TABLE football.player_details TO anon, authenticated;