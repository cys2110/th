DROP FUNCTION IF EXISTS public.search_venues(TEXT, TEXT);
DROP FUNCTION IF EXISTS football.search_venues(TEXT);

CREATE OR REPLACE FUNCTION public.search_venues(search_text TEXT, schema_name TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    icon TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    if schema_name not in ('tennis', 'football') then
        raise exception 'Invalid schema name';
    end if;

    return query execute format(
        $sql$
        SELECT
            v.id,
            v.name,
            v.city,
            c.icon
        FROM %I.venue v
        JOIN %I.country c ON c.id = v.country_id
        WHERE
            $1 IS NULL
            OR unaccent(v.slug) ILIKE '%%' || $1 || '%%'
            OR unaccent(v.slug) ILIKE $1 || '%%'
        ORDER BY v.city, v.name, v.id
        LIMIT 40
        $sql$,
        schema_name,
        schema_name
    )
    USING search_text;
END;
$$