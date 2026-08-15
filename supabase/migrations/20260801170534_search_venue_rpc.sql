CREATE OR REPLACE FUNCTION football.search_venues(search_term TEXT) RETURNS TABLE(
    id UUID,
    name TEXT,
    city TEXT,
    icon TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
    v.id,
    v.name,
    v.city,
    c.icon
FROM football.venue v
LEFT JOIN football.country c ON c.id = v.country_id
WHERE
    search_term IS NULL
    OR unaccent(v.slug) ILIKE '%' || search_term || '%'
    OR unaccent(v.slug) ILIKE search_term || '%'
ORDER BY v.city, v.name, v.id
LIMIT 40;
END;
$$