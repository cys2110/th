CREATE OR REPLACE FUNCTION football.search_people(search_term TEXT) RETURNS TABLE(
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
    c.icon
FROM football.people p
JOIN football.country c ON c.id = p.nationality_country_id
WHERE
    search_term IS NULL
    OR unaccent(p.full_name) ILIKE '%' || search_term || '%'
    OR unaccent(p.full_name) ILIKE search_term || '%'
ORDER BY p.last_name, p.first_name, p.id
LIMIT 40;
END;
$$