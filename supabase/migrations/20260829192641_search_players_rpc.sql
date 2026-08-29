CREATE OR REPLACE FUNCTION tennis.search_players(search_term TEXT) RETURNS TABLE(
    id TEXT,
    full_name TEXT,
    icon TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
    p.id,
    pe.full_name,
    CASE WHEN c IS NULL THEN 'flag:xx-4x3' ELSE c.icon END AS icon
FROM tennis.player p
JOIN tennis.people pe ON pe.id = p.person_id
LEFT JOIN tennis.country c ON c.id = pe.nationality_id
WHERE
    search_term IS NULL
    OR unaccent(pe.full_name) ILIKE '%' || search_term || '%'
    OR unaccent(pe.full_name) ILIKE search_term || '%'
ORDER BY pe.last_name, pe.first_name, p.id
LIMIT 40;
END;
$$