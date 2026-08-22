CREATE OR REPLACE FUNCTION tennis.search_people(search_term TEXT) RETURNS TABLE(
    id UUID,
    full_name TEXT,
    icon TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
    p.id,
    p.full_name,
    CASE WHEN c IS NULL THEN 'flag:xx-4x3' ELSE c.icon END AS icon
FROM tennis.people p
LEFT JOIN tennis.country c ON c.id = p.nationality_id
WHERE
    search_term IS NULL
    OR unaccent(p.full_name) ILIKE '%' || search_term || '%'
    OR unaccent(p.full_name) ILIKE search_term || '%'
ORDER BY p.last_name, p.first_name, p.id
LIMIT 40;
END;
$$