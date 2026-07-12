CREATE OR REPLACE FUNCTION football.search_players(search_term TEXT) RETURNS TABLE(
    id UUID,
    full_name TEXT,
    aka TEXT,
    icon TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
    p.id,
    pe.full_name,
    p.aka,
    c.icon
FROM football.player p
JOIN football.people pe ON pe.id = p.person_id
JOIN football.country c ON c.id = pe.nationality_country_id
WHERE
    search_term IS NULL
    OR pe.full_name ILIKE '%' || search_term || '%'
    OR pe.full_name ILIKE search_term || '%'
    OR p.aka ILIKE '%' || search_term || '%'
ORDER BY pe.last_name, pe.first_name, p.id
LIMIT 40;
END;
$$