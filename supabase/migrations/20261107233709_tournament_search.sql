DROP FUNCTION IF EXISTS tennis.search_tournament(TEXT);

CREATE OR REPLACE FUNCTION tennis.search_tournament(search_term TEXT) RETURNS TABLE(
    id UUID,
    name TEXT,
    mens_id INT,
    womens_id INT,
    tours tennis.tour_enum[],
    established INT,
    abolished INT,
    website TEXT,
    logo_url TEXT,
    updated_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT
    t.id,
    t.name,
    t.mens_id,
    t.womens_id,
    t.tours,
    t.established,
    t.abolished,
    t.website,
    t.logo_url,
    t.updated_at
FROM tennis.tournament t
WHERE
    search_term IS NULL
    OR unaccent(t.name) ILIKE '%' || search_term || '%'
    OR unaccent(t.name) ILIKE search_term || '%'
ORDER BY t.name, t.id
LIMIT 40;
END;
$$